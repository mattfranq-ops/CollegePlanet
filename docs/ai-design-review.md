# AI design review: Sprint 2 database integration

We used two AI assistants in Sprint 2: GitHub Copilot in VS Code for the first analysis (section 4, full session in [copilot-phase1-session.md](copilot-phase1-session.md)), and Claude to draft parts of the data layer. This page records design choices the AI proposed, what we found when we reviewed and tested them, and what we changed. Every change below is in the code and covered by a test.

## 1. Where Firestore is called from (corrected)

**AI proposal.** Use the Firebase web SDK in the browser: initialize the app from the `firebaseConfig` object in the Firebase console, have the dashboard component read and write `users/{uid}/savedRoles` directly, and protect the data with a security rule `request.auth.uid == userId`.

**What we found.** CollegePlanet's login (Sprint 1, issue #1) does not use Firebase Authentication. It checks a bcrypt hash on the server and sets our own signed `cp_session` cookie. A browser client would therefore reach Firestore with `request.auth == null`, so the proposed rule would deny every request. The only ways to make the proposal work were to open the rules to everyone (any visitor could read or overwrite any student's roles) or to add a second sign-in system next to the one we already have.

**Correction.** All Firestore access happens on the server, in `lib/repositories/`, using the Firebase Admin SDK. Each API route reads the student id from the verified session cookie and never from the request body, so a student cannot ask for someone else's data. `firestore.rules` still limits signed-in clients to their own documents and denies everything else, as a second line of defense if we add Firebase Auth later. `tests/firestore/firestoreRules.test.ts` proves the rules deny cross-student and signed-out access.

## 2. Configuring the Admin SDK client (corrected)

**AI proposal.** In `lib/firebase/admin.ts`, call `getFirestore()` and then `db.settings({ ignoreUndefinedProperties: true })` so optional fields could be passed as `undefined`.

**What we found.** It worked for the first request and then every `PATCH /api/saved-roles/:roleId` returned 503. The server log showed `Firestore has already been initialized. You can only call settings() once`. Next.js bundles each API route separately, so each route ran the module once, while `getFirestore()` returns the same shared client for the app. The second route's `settings()` call threw.

**Correction.** Removed the `settings()` call. The repository never writes `undefined` (validation fills in defaults such as `note: ""`), so the option was not needed. A comment in `lib/firebase/admin.ts` explains why it must not come back.

## 3. Choices we reviewed and kept

| AI suggestion | Why we kept it |
| --- | --- |
| Store `roleTitle` on each saved role (denormalized) | The dashboard lists saved roles with one query. Role titles rarely change, and the seed script owns them. |
| Use the role id as the document id and save inside a transaction with `tx.create()` | Two quick clicks can't create duplicates: the second save fails with 409 "You already saved ...", which the tests check. |
| Validate in a shared module used by both the form and the repository | The form gives instant feedback, and the server never trusts the browser. Same messages in both places. |
| Run tests against the emulator instead of mocking Firestore | The tests exercise real rules, transactions and persistence, including a "server restart" test that opens a new client and reads the data back. |

## 4. GitHub Copilot Phase 1 analysis: what inspired us and what we ignored

We gave Copilot a two-phase prompt: analyze first and stop for approval, then build. Copilot did not have our repo, Figma or issues in that chat, so it answered with the inputs it needed and an example plan. We compared that plan with our code and issue #3.

**Bridges of inspiration (used, with where they landed):**

| Copilot idea | Where it shows up |
| --- | --- |
| "Document ownership strategy" as its own design question | Each student's data lives under `users/{userId}`, and the rules key on that id (`types/roadmap.ts`, `firestore.rules`) |
| Sequence `UI -> Repository -> Firestore`, with UI never calling Firestore | `components/savedRoles.tsx` -> API route -> `SavedRoleRepository` -> Firestore, drawn in `docs/uml/sequence-save-role.puml` |
| Ask "Should users edit previously saved records?" | We answered yes: saved roles can be edited (`PATCH`) and removed (`DELETE`) |
| Ask "Is data private or shareable?" | Private. Rules deny reading another student's documents (`tests/firestore/firestoreRules.test.ts`) |
| Write down query patterns before indexes | Our only list query is one student's saved roles ordered by `createdAt`, so no composite index is needed (`firestore.indexes.json`) |
| Analyze, then stop for approval before writing code | We kept this as our team workflow for AI-generated changes (Review process below) |

**Advice we ignored, and why:**

| Copilot suggestion | Why we didn't use it |
| --- | --- |
| Firebase JS SDK v9 modular in the browser | Our login is not Firebase Auth, so browser requests would have no `request.auth`. We use the Admin SDK on the server (section 1). |
| Separate `profiles/{uid}` and `majors/{majorId}` collections, with `majorId` as a `DocumentReference` | Extra reads for no benefit right now. The profile lives on `users/{userId}` and `major` is a string, matching the login data. A majors catalog can come with issue #4. |
| `role: "student"` field on every user | There are no instructors or admins in any issue yet, so it would be unused data. |
| Composite index on `userId` + `createdAt` | Saved roles are a subcollection under the user, so the user id is in the path and a single-field `createdAt` order needs no composite index. |
| Soft delete | Nothing in issue #3 asks for history or undo, so removing a role deletes the document. |

## Review process

1. The AI drafted each file, and the teammate committing it reviews it first.
2. We ran the app against the emulator and exercised every path by hand (save, duplicate, bad term, edit, remove, logged out).
3. We ran `npm test` and `npm run lint` and fixed any failure at its cause.
4. Items 1 and 2 above came from that review, and section 4 from comparing Copilot's plan with our code.
