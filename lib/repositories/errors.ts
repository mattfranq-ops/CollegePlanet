import type { FieldErrors } from "@/lib/roadmapValidation";

export type RepositoryErrorCode = "invalid-input" | "not-found" | "already-exists" | "unavailable";

const STATUS: Record<RepositoryErrorCode, number> = {
  "invalid-input": 400,
  "not-found": 404,
  "already-exists": 409,
  unavailable: 503,
};

/** An expected failure from the data layer, with a message that is safe to show the student. */
export class RepositoryError extends Error {
  readonly status: number;

  constructor(
    readonly code: RepositoryErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "RepositoryError";
    this.status = STATUS[code];
  }
}
