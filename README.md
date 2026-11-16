# CollegePlanet

CollegePlanet helps UNC Charlotte students organize and track their academic progress in one place: pick a target career, see the courses, certifications and experience it takes, and follow a semester-by-semester roadmap.

**Sprint 1 feature:** Student login ([issue #1](https://github.com/mattfranq-ops/CollegePlanet/issues/1)).

**Sprint 2 feature:** Save target roles to a Firestore database ([SumiranJ/CollegePlanet#3 Form Career Roadmap](https://github.com/SumiranJ/CollegePlanet/issues/3)). Setup: [docs/database-setup.md](docs/database-setup.md).

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) with React 19 and TypeScript
- `bcryptjs` for password hashing, `jose` for signed session cookies (JWT, HS256)
- Firebase Firestore (Admin SDK on the server, Emulator Suite for development and tests)
- Jest and React Testing Library for tests

## Prerequisites

- Node.js 20 or newer (`node -v`)
- npm 10 or newer (`npm -v`)
- Java 11 or newer for the Firestore emulator (`java -version`)

## Run the app

```bash
git clone https://github.com/mattfranq-ops/CollegePlanet.git
cd CollegePlanet
npm install
cp .env.example .env     # then set FIREBASE_PROJECT_ID (see docs/database-setup.md)
npm run emulators        # terminal 1: Firestore 8085, Auth 9099, UI 4000
npm run seed             # terminal 2: load the career roles
npm run dev              # terminal 2
```

Open http://localhost:3000. You will see the student login page. After logging in, save a target role on the dashboard; it is still there after you log out, restart the app, or restart the emulators (stop them with Ctrl+C so the data is saved).

### Demo accounts

| Username | Password | Name | Major |
| --- | --- | --- | --- |
| `jalvarez` | `Password123!` | Jordan Alvarez | Information Systems |
| `athompson` | `Password123!` | Aisha Thompson | Kinesiology |

These are sample accounts for Sprint 1. Passwords are stored only as bcrypt hashes in `lib/auth.ts`.

### Optional: session secret

Sessions are signed with `SESSION_SECRET`. A development default is built in, so this step is optional locally. For a shared or deployed copy, create `.env.local`:

```bash
SESSION_SECRET=replace-with-a-long-random-string
```

## Run the tests

```bash
npm test          # starts a temporary Firestore emulator and runs every suite
npm run lint
```

Expected result: `Test Suites: 7 passed` and `Tests: 46 passed`, then `No ESLint warnings or errors`. If `npm run emulators` is already running, use `npm run test:jest` instead.

| Test file | What it checks |
| --- | --- |
| `tests/login.test.tsx` | The login form renders, rejects empty fields without calling the server, shows the server's error on wrong credentials, and redirects to `/dashboard` on success |
| `tests/firestore/savedRoleRepository.test.ts` | Issue #3 against the emulator: saving writes the documents, data survives a new client, update and remove, invalid input, unknown role, duplicate, not found |
| `tests/firestore/savedRolesApi.test.ts` | The `/api/saved-roles` routes: 201, 400 with field errors, 409, 404, 401 |
| `tests/firestore/firestoreRules.test.ts` | Security rules: own data only, no signed-out access, field checks, read-only catalog |
| `tests/savedRoles.test.tsx` | The dashboard form: field errors without a request, success message, server error |
| `tests/roadmapValidation.test.ts` | Target term and note validation rules |
| `tests/auth.test.ts` | Input validation rules, correct and incorrect credentials, signed sessions (including a tampered token), and the `POST /api/auth/login` responses (200 with cookie, 401, 400) |

## Test it by hand

1. Click **Log in** with both fields empty. You see "Enter your username and password."
2. Enter `jalvarez` and `WrongPassword1`. You see "Incorrect username or password."
3. Enter `jalvarez` and `Password123!`. You land on the dashboard with "Welcome, Jordan Alvarez".
4. Click **Log out**. You return to the login page.
5. Visit http://localhost:3000/dashboard while logged out. You are sent back to the login page.

## How login works

1. `components/loginForm.tsx` checks the fields in the browser with `lib/validation.ts`, then sends `POST /api/auth/login`.
2. `app/api/auth/login/route.ts` validates again on the server and checks the password hash in `lib/auth.ts`.
3. On success it sets an HTTP-only `cp_session` cookie (8 hours) from `lib/session.ts` and returns `redirectTo: "/dashboard"`. On failure it returns 400 or 401 with an error message.
4. `app/dashboard/page.tsx` verifies the cookie on the server and sends anyone without a valid session back to `/`.
5. **Sign in with UNCC account** calls `app/api/auth/uncc/route.ts`, which replies that university SSO is not connected yet. Issue #1 lists it as optional.

## Project structure

```
app/
  page.tsx                 Login page
  dashboard/page.tsx       Protected dashboard
  api/auth/login/route.ts  POST: check credentials, set session cookie
  api/auth/logout/route.ts POST: clear session cookie
  api/auth/uncc/route.ts   GET: UNCC SSO placeholder (501)
components/
  loginForm.tsx            Client-side login form
  campusHero.tsx           Login page heading
lib/
  auth.ts                  Demo student accounts and credential check
  validation.ts            Shared form validation rules
  session.ts               Create and verify signed session cookies
  firebase/admin.ts        Firestore Admin SDK client (server only)
  repositories/            Data access: SavedRoleRepository, RoleCatalogRepository
  roadmapValidation.ts     Saved-role validation shared by form and server
  seed/                    Seed data and seeding function
app/api/saved-roles/       GET/POST and PATCH/DELETE saved roles
components/savedRoles.tsx  Dashboard "Your target roles" card
types/auth.ts              Shared types
types/roadmap.ts           Firestore document models
scripts/                   seed.ts, emulators.mjs
firestore.rules            Security rules
docs/                      Database setup, AI design review, UML, release notes
tests/                     Jest tests
```

## Development tools

- **GitHub Copilot** in VS Code was used during development.
- **Figma MCP server** is configured in `.mcp.json` and `mcp.json` (`https://mcp.figma.com/mcp`) so Copilot can read the [Figma prototype](https://www.figma.com/proto/HyoVyU61fFMM1yVerqXVEF/College-Planet-Prototype).
