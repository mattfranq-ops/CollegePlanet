import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Send username and password as JSON." }, { status: 400 });
  }

  const { username, password } = (body ?? {}) as { username?: unknown; password?: unknown };
  const result = await authenticate({
    username: typeof username === "string" ? username : "",
    password: typeof password === "string" ? password : "",
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({ ok: true, redirectTo: "/dashboard", student: result.student });
  response.cookies.set(SESSION_COOKIE, await createSession(result.student), sessionCookieOptions);
  return response;
}
