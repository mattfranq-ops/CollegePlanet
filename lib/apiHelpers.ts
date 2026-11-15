import { NextResponse } from "next/server";
import { RepositoryError } from "@/lib/repositories/errors";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { StudentRef } from "@/lib/repositories/savedRoleRepository";

/** Reads the signed session cookie from a request. Returns null when there is no valid session. */
export async function studentFromRequest(request: Request): Promise<StudentRef | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const session = await verifySession(token ? decodeURIComponent(token) : undefined);
  if (!session) return null;
  return { id: session.sub, username: session.username, name: session.name, major: session.major };
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: "Your session ended. Log in again." }, { status: 401 });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new RepositoryError("invalid-input", "Send the request body as JSON.");
  }
}

/** Turns a data-layer failure into a JSON error response. Unexpected errors are logged and hidden. */
export function errorResponse(err: unknown) {
  if (err instanceof RepositoryError) {
    return NextResponse.json({ ok: false, error: err.message, fieldErrors: err.fieldErrors }, { status: err.status });
  }
  console.error("Firestore request failed:", err);
  return NextResponse.json(
    { ok: false, error: "We couldn't reach the database. Try again in a moment." },
    { status: 503 },
  );
}
