export interface Student {
  id: string;
  username: string;
  name: string;
  email: string;
  major: string;
  passwordHash: string;
}

/** The parts of a student that are safe to send to the browser or keep in a session. */
export type PublicStudent = Omit<Student, "passwordHash">;

export interface LoginRequest {
  username: string;
  password: string;
}

export type LoginResult =
  | { ok: true; student: PublicStudent }
  | { ok: false; error: string; status: 400 | 401 };

export interface SessionPayload {
  sub: string;
  username: string;
  name: string;
  major: string;
}
