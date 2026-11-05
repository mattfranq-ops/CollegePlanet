# CollegePlanet

CollegePlanet helps UNC Charlotte students organize and track their academic progress in one place: pick a target career, see the courses, certifications and experience it takes, and follow a semester-by-semester roadmap.

**Sprint 1 feature:** Student login ([issue #1](https://github.com/SumiranJ/CollegePlanet/issues/1)).

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) with React 19 and TypeScript
- `bcryptjs` for password hashing, `jose` for signed session cookies (JWT, HS256)
- Jest and React Testing Library for tests

## Prerequisites

- Node.js 20 or newer (`node -v`)
- npm 10 or newer (`npm -v`)

## Run the app

```bash
git clone https://github.com/SumiranJ/CollegePlanet.git
cd CollegePlanet
npm install
npm run dev
```

Open http://localhost:3000. You will see the student login page.

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
npm test
```

Expected result: `Test Suites: 2 passed` and `Tests: 15 passed`.

| Test file | What it checks |
| --- | --- |
| `tests/login.test.tsx` | The login form renders, rejects empty fields without calling the server, shows the server's error on wrong credentials, and redirects to `/dashboard` on success |
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
types/auth.ts              Shared types
tests/                     Jest tests
```

## Development tools

- **GitHub Copilot** in VS Code was used during development.
- **Figma MCP server** is configured in `.mcp.json` and `mcp.json` (`https://mcp.figma.com/mcp`) so Copilot can read the [Figma prototype](https://www.figma.com/proto/HyoVyU61fFMM1yVerqXVEF/College-Planet-Prototype).
