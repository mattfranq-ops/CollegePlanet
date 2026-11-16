# v0.2.0-sprint2 (draft)

> Draft release notes. Create the GitHub release with tag `v0.2.0-sprint2` after every teammate's Sprint 2 commit is on `main`.

## Highlights

- **Saved target roles** ([SumiranJ/CollegePlanet#3](https://github.com/SumiranJ/CollegePlanet/issues/3) Form Career Roadmap): on the dashboard, students pick a career role and the term they want to qualify by, add an optional note, and edit or remove it later. Saved roles are stored in Firestore and come back on every login.
- **Firestore database** with typed document models, a repository layer separated from the UI, security rules and a seed script.

## What's new

- `roles`, `users` and `users/{userId}/savedRoles` collections (`types/roadmap.ts`)
- `SavedRoleRepository` and `RoleCatalogRepository` (`lib/repositories/`)
- API: `GET/POST /api/saved-roles`, `PATCH/DELETE /api/saved-roles/:roleId`, `GET /api/roles`
- Validation on the form and again on the server, with field-level error messages (missing role or term, past or far-future term, note over 280 characters, duplicate role, unknown role)
- `firestore.rules`: students reach only their own data, the role catalog is read-only
- `npm run emulators` keeps local data between restarts; `npm run seed` loads the 10 career roles and demo profiles
- UML class and sequence diagrams in `docs/uml/`
- `docs/database-setup.md` and `docs/ai-design-review.md`

## Testing

- `npm test` starts the Firestore emulator and runs 46 Jest tests (7 suites), including repository integration tests, security rules tests and API route tests
- `npm run lint` passes with no warnings

## Setup changes

- New dependency: `firebase-admin`. New dev tools: `firebase-tools`, `@firebase/rules-unit-testing`, `tsx`
- Java 11+ is needed for the Firestore emulator
- Copy `.env.example` to `.env` (see `docs/database-setup.md`). `.env`, keys and emulator data are ignored by git.

## Contributors

<!-- One line per teammate with their commit, e.g. "@mattfranq-ops: Firestore data layer" -->
