# Database setup: Firebase Firestore

Sprint 2 adds a database to CollegePlanet. This page explains why we chose Firestore, how to run it on your own computer, and how each teammate verifies their setup.

User story: [SumiranJ/CollegePlanet#3 Form Career Roadmap](https://github.com/SumiranJ/CollegePlanet/issues/3). A student saves the career roles they are aiming for and the term they want to qualify by, edits or removes them, and sees them again every time they log in.

## Why Firestore

| Need | How Firestore meets it |
| --- | --- |
| Free for a class project | The Spark plan is free and needs no credit card. |
| Runs offline on each laptop | The Firebase Emulator Suite runs Firestore locally, so nobody needs cloud access to develop or test. |
| Data shaped around one student | Documents and subcollections map directly to "a student and their saved roles" (`users/{userId}/savedRoles/{roleId}`), with no joins or migrations. |
| Access control | Security rules (`firestore.rules`) limit each student to their own data, and the rules are tested in the emulator. |
| Fits our stack | The Admin SDK works in Next.js API routes in TypeScript. |

Trade-offs we accepted: no SQL joins or ad hoc reporting, and queries must be designed around the data layout. For this app the reads are "one student's saved roles", which is a single subcollection query.

## Data model

| Path | Model (`types/roadmap.ts`) | Written by |
| --- | --- | --- |
| `roles/{roleId}` | `CareerRoleDoc`: title, field, medianPay, requiredDegree | Seed script only |
| `users/{userId}` | `UserProfileDoc`: username, name, email, major, createdAt, updatedAt | Seed script, and the first time a student saves a role |
| `users/{userId}/savedRoles/{roleId}` | `SavedRoleDoc`: roleId, roleTitle, targetTerm, note, createdAt, updatedAt | The student, through `/api/saved-roles` |

`userId` is the student id from the signed session cookie (`s1`, `s2` for the demo accounts). The document id of a saved role is the role id, so a role can be saved only once per student.

Diagrams: [class diagram](uml/class-diagram.png) and [sequence diagram](uml/sequence-save-role.png) in `docs/uml/`.

## How the app talks to Firestore

```
components/savedRoles.tsx  (browser form, validates first)
  -> app/api/saved-roles/... (checks the session cookie)
    -> lib/repositories/savedRoleRepository.ts (validates again, reads and writes Firestore)
      -> lib/firebase/admin.ts (one Admin SDK client)
```

UI code never imports Firestore. All database access goes through the repository classes in `lib/repositories/`, and the API routes only translate their results and errors into HTTP responses.

## Setup on your computer

### 1. Prerequisites

- Node.js 20 or newer and npm 10 or newer
- Java 11 or newer (the Firestore emulator needs it): `java -version`
- The Firebase CLI comes with `npm install` (`npx firebase --version`). A global install (`npm i -g firebase-tools`) also works.

### 2. Install and configure

```bash
git pull
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Open `.env` and set `FIREBASE_PROJECT_ID=collegeplanet-2e87a`. Keep `FIRESTORE_EMULATOR_HOST=127.0.0.1:8085`. The `NEXT_PUBLIC_FIREBASE_*` values are in the Firebase console under Project settings > Your apps; ask Matt if you can't see the project.

Check that `.env` is ignored by git:

```bash
git check-ignore -v .env
# .gitignore:11:.env	.env
```

### 3. Start the emulators (terminal 1)

```bash
npm run emulators
```

| Emulator | Port |
| --- | --- |
| Firestore | 8085 (8080 was taken on some laptops) |
| Auth | 9099 |
| Emulator UI | http://localhost:4000 |

Data is saved to `./emulator-data/` when you stop the emulators with **Ctrl+C**, and loaded again next time. That folder is ignored by git.

### 4. Seed the database (terminal 2)

```bash
npm run seed
# Seeded 10 roles and 2 student profiles into the emulator at 127.0.0.1:8085.
```

### 5. Run the app (terminal 2)

```bash
npm run dev
```

Open http://localhost:3000, log in as `jalvarez` / `Password123!`, and save a role under **Your target roles**. Open http://localhost:4000/firestore to see the document under `users/s1/savedRoles`.

### 6. Tests and lint

```bash
npm test          # starts a temporary Firestore emulator, runs all Jest tests, stops it
npm run lint
npm run typecheck
```

If `npm run emulators` is already running, `npm test` fails because port 8085 is busy. Use `npm run test:jest` instead, which uses the running emulator.

### Using the real cloud database (optional)

Development and grading use the emulator. To point the app at the real `collegeplanet-2e87a` database:

1. Firebase console > Project settings > Service accounts > Generate new private key. Save the JSON **outside** the repository.
2. In `.env`, remove `FIRESTORE_EMULATOR_HOST` and set `GOOGLE_APPLICATION_CREDENTIALS` to the key's full path.
3. `npx firebase deploy --only firestore:rules,firestore:indexes`, then `npm run seed -- --prod`.

Never commit the key. `.gitignore` blocks `serviceAccount*.json`, `service-account*.json` and `*-firebase-adminsdk-*.json`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Dashboard says "We couldn't load your saved roles" | The emulator isn't running. Start `npm run emulators`. |
| Dashboard says "The career role list is empty" | Run `npm run seed`. |
| `Port 8085 is not open` | Another emulator is running. Close it, or use `npm run test:jest`. |
| `FIREBASE_PROJECT_ID is not set` | Copy `.env.example` to `.env` and fill it in. |
| `Could not spawn java` | Install Java 11+ and reopen the terminal. |

## Team verification

Each teammate runs the steps above on their own computer and fills in one row in their own commit.

| Teammate | GitHub username | OS | Node version | Emulators start | Seed works | Saved role survives emulator restart | `npm test` passes | `npm run lint` passes | Date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Matthew Franqui | mattfranq-ops | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |

## Team data test (A creates, B reads, C updates)

Each step is done by a different teammate on the shared cloud database or one shared emulator, with a screenshot of the Emulator UI or app.

| Step | Teammate | What they did | Document path | Result |
| --- | --- | --- | --- | --- |
| A creates | | Saved a role as `jalvarez` | `users/s1/savedRoles/...` | |
| B reads | | Logged in as `jalvarez` and saw the role A saved | | |
| C updates | | Changed the target term or note | | |
