/**
 * @jest-environment node
 */
import { authenticate, validateLoginInput } from "@/lib/auth";
import { createSession, SESSION_COOKIE, verifySession } from "@/lib/session";
import { POST } from "@/app/api/auth/login/route";

const loginRequest = (body: unknown) =>
  new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("Issue #1: credential validation", () => {
  it.each([
    [{ username: "", password: "" }, "Enter your username and password."],
    [{ username: "jalvarez", password: "" }, "Enter your password."],
    [{ username: "", password: "Password123!" }, "Enter your username."],
    [{ username: "j", password: "Password123!" }, "Usernames are 3 to 32 letters, numbers, dots, dashes or underscores."],
    [{ username: "jalvarez", password: "short" }, "Passwords are at least 8 characters."],
  ])("rejects %o", (input, message) => {
    expect(validateLoginInput(input)).toBe(message);
  });

  it("accepts a correct username and password", async () => {
    const result = await authenticate({ username: "jalvarez", password: "Password123!" });
    expect(result).toMatchObject({ ok: true, student: { username: "jalvarez", name: "Jordan Alvarez" } });
    expect(result.ok && "passwordHash" in result.student).toBe(false);
  });

  it("rejects a wrong password and an unknown user with the same message", async () => {
    const wrong = await authenticate({ username: "jalvarez", password: "WrongPassword1" });
    const unknown = await authenticate({ username: "nobody", password: "Password123!" });
    expect(wrong).toEqual({ ok: false, error: "Incorrect username or password.", status: 401 });
    expect(unknown).toEqual(wrong);
  });
});

describe("Issue #1: sessions", () => {
  it("round-trips a signed session and rejects a tampered one", async () => {
    const token = await createSession({ id: "s1", username: "jalvarez", name: "Jordan Alvarez", email: "j@x.edu", major: "Information Systems" });
    expect(await verifySession(token)).toMatchObject({ sub: "s1", username: "jalvarez" });
    expect(await verifySession(token.slice(0, -2) + "xx")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});

describe("Issue #1: POST /api/auth/login", () => {
  it("returns 200, a redirect to the dashboard and a session cookie on success", async () => {
    const res = await POST(loginRequest({ username: "jalvarez", password: "Password123!" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, redirectTo: "/dashboard" });
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);
    expect(res.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("returns 401 with an error message and no cookie on failure", async () => {
    const res = await POST(loginRequest({ username: "jalvarez", password: "WrongPassword1" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: "Incorrect username or password." });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 400 when fields are missing", async () => {
    const res = await POST(loginRequest({ username: "jalvarez" }));
    expect(res.status).toBe(400);
  });
});
