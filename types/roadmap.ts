import type { Timestamp } from "firebase-admin/firestore";

/**
 * Firestore document models for CollegePlanet (Sprint 2).
 *
 * Collections:
 *   roles/{roleId}                         CareerRoleDoc     (catalog, seeded)
 *   users/{userId}                         UserProfileDoc    (one per student)
 *   users/{userId}/savedRoles/{roleId}     SavedRoleDoc      (user story #3)
 *
 * Ownership: every student's data sits under users/{userId}, so security rules and queries key on
 * the path (idea from the Copilot Phase 1 analysis; see docs/ai-design-review.md section 4).
 * Not adopted from that analysis: separate profiles/majors collections and a role field.
 *
 * "Doc" types are exactly what is stored. The plain types without "Doc" are what
 * the rest of the app uses: ids included and timestamps converted to ISO strings,
 * so they can be sent to the browser as JSON.
 */

export const COLLECTIONS = {
  roles: "roles",
  users: "users",
  savedRoles: "savedRoles",
} as const;

export interface CareerRoleDoc {
  title: string;
  field: string;
  medianPay: number;
  requiredDegree: string;
}

export interface CareerRole extends CareerRoleDoc {
  id: string;
}

export interface UserProfileDoc {
  username: string;
  name: string;
  email: string;
  major: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SavedRoleDoc {
  /** Same as the document id, so one role can be saved once per student. */
  roleId: string;
  /** Copied from the catalog when saved, so the list renders without a second read. */
  roleTitle: string;
  /** When the student aims to qualify, e.g. "Spring 2028". */
  targetTerm: string;
  /** Optional free text, at most NOTE_MAX_LENGTH characters. */
  note: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SavedRole {
  roleId: string;
  roleTitle: string;
  targetTerm: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

/** What the browser sends to save a role. */
export interface SaveRoleInput {
  roleId: string;
  targetTerm: string;
  note?: string;
}

/** What the browser sends to change a saved role. */
export interface UpdateSavedRoleInput {
  targetTerm?: string;
  note?: string;
}

export const NOTE_MAX_LENGTH = 280;
export const TERM_SEASONS = ["Spring", "Summer", "Fall"] as const;
