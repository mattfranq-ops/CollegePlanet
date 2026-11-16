/**
 * @jest-environment node
 */
import { uniqueUserId } from "@/tests/helpers/firestoreEmulator";
import { getDb } from "@/lib/firebase/admin";
import { seedDatabase } from "@/lib/seed/seed";
import { createSession, SESSION_COOKIE } from "@/lib/session";
import { GET, POST } from "@/app/api/saved-roles/route";
import { PATCH } from "@/app/api/saved-roles/[roleId]/route";

// The issue #3 API routes, end to end against the emulator.
const nextYear = new Date().getFullYear() + 1;
let cookie = "";

function request(method: string, body?: unknown, withCookie = true) {
  return new Request("http://localhost/api/saved-roles", {
    method,
    headers: { "Content-Type": "application/json", ...(withCookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeAll(async () => {
  await seedDatabase(getDb());
  const token = await createSession({ id: uniqueUserId("api"), username: "jalvarez", name: "Jordan Alvarez", email: "j@x.edu", major: "IS" });
  cookie = `${SESSION_COOKIE}=${token}`;
});

describe("Issue #3: /api/saved-roles", () => {
  it("POST returns 201 and the saved role, and GET lists it", async () => {
    const res = await POST(request("POST", { roleId: "financial-analyst", targetTerm: `Spring ${nextYear}` }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, savedRole: { roleId: "financial-analyst", roleTitle: "Financial Analyst" } });

    const list = await (await GET(request("GET"))).json();
    expect(list.savedRoles.map((r: { roleId: string }) => r.roleId)).toContain("financial-analyst");
  });

  it("POST returns 400 with field errors for invalid input", async () => {
    const res = await POST(request("POST", { roleId: "financial-analyst", targetTerm: "someday" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, fieldErrors: { targetTerm: 'Target term looks like "Fall 2027".' } });
  });

  it("POST returns 409 for a duplicate and PATCH returns 404 for a role that was never saved", async () => {
    await POST(request("POST", { roleId: "mechanical-engineer", targetTerm: `Fall ${nextYear}` }));
    const dup = await POST(request("POST", { roleId: "mechanical-engineer", targetTerm: `Fall ${nextYear}` }));
    expect(dup.status).toBe(409);

    const missing = await PATCH(request("PATCH", { note: "hi" }), { params: Promise.resolve({ roleId: "physical-therapist" }) });
    expect(missing.status).toBe(404);
  });

  it("returns 401 without a session cookie", async () => {
    const res = await GET(request("GET", undefined, false));
    expect(res.status).toBe(401);
  });
});
