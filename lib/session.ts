import { SignJWT, jwtVerify } from "jose";
import type { PublicStudent, SessionPayload } from "@/types/auth";

export const SESSION_COOKIE = "cp_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function secretKey(): Uint8Array {
  // Set SESSION_SECRET in .env.local for anything beyond local development.
  const secret = process.env.SESSION_SECRET ?? "dev-only-secret-change-me-collegeplanet";
  return new TextEncoder().encode(secret);
}

export async function createSession(student: PublicStudent): Promise<string> {
  return new SignJWT({ username: student.username, name: student.name, major: student.major })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(student.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** Returns the session payload, or null if the token is missing, tampered with or expired. */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      sub: String(payload.sub),
      username: String(payload.username),
      name: String(payload.name),
      major: String(payload.major),
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
