import bcrypt from "bcryptjs";
import type { LoginRequest, LoginResult, PublicStudent, Student } from "@/types/auth";
import { validateLoginInput } from "@/lib/validation";

export { validateLoginInput };

// Demo accounts for Sprint 1. Passwords are stored only as bcrypt hashes.
// Both demo passwords are "Password123!" (see README).
const DEMO_HASH = "$2a$10$KY1y0qvdCV.H2GpDtsOTI.hd2Q7c5AjaKJr63/s/5mpF1GzqXH4M6";

const students: Student[] = [
  { id: "s1", username: "jalvarez", name: "Jordan Alvarez", email: "jalvarez@charlotte.edu", major: "Information Systems", passwordHash: DEMO_HASH },
  { id: "s2", username: "athompson", name: "Aisha Thompson", email: "athompson@charlotte.edu", major: "Kinesiology", passwordHash: DEMO_HASH },
];

export function findStudent(username: string): Student | undefined {
  const key = username.trim().toLowerCase();
  return students.find((s) => s.username === key);
}

export function toPublic({ passwordHash: _hash, ...rest }: Student): PublicStudent {
  return rest;
}

/** Validates credentials. The same message is used for an unknown user and a wrong password. */
export async function authenticate(input: Partial<LoginRequest>): Promise<LoginResult> {
  const invalid = validateLoginInput(input);
  if (invalid) return { ok: false, error: invalid, status: 400 };

  const student = findStudent(input.username!);
  const matches = student ? await bcrypt.compare(input.password!, student.passwordHash) : false;
  if (!student || !matches) return { ok: false, error: "Incorrect username or password.", status: 401 };

  return { ok: true, student: toPublic(student) };
}
