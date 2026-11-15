import { NOTE_MAX_LENGTH, TERM_SEASONS, type SaveRoleInput, type UpdateSavedRoleInput } from "@/types/roadmap";

// Shared by the dashboard form (browser) and the repository (server), so it must not import server-only code.

export const ROLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TERM_PATTERN = new RegExp(`^(${TERM_SEASONS.join("|")}) (\\d{4})$`);
/** Students can plan up to this many years ahead. */
export const MAX_YEARS_AHEAD = 8;

export type FieldErrors = Partial<Record<"roleId" | "targetTerm" | "note", string>>;

export type Validated<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export function validateTargetTerm(raw: unknown, now: Date = new Date()): string | null {
  if (typeof raw !== "string" || !raw.trim()) return "Choose the term you want to qualify by.";
  const match = TERM_PATTERN.exec(raw.trim());
  if (!match) return 'Target term looks like "Fall 2027".';
  const year = Number(match[2]);
  const thisYear = now.getFullYear();
  if (year < thisYear) return "Target term can't be in the past.";
  if (year > thisYear + MAX_YEARS_AHEAD) return `Target term must be within ${MAX_YEARS_AHEAD} years.`;
  return null;
}

export function validateNote(raw: unknown): string | null {
  if (raw === undefined) return null;
  if (typeof raw !== "string") return "Note must be text.";
  if (raw.trim().length > NOTE_MAX_LENGTH) return `Note must be ${NOTE_MAX_LENGTH} characters or fewer.`;
  return null;
}

/** Checks a "save this role" request. Returns trimmed values, or an error message per field. */
export function validateSaveRoleInput(input: unknown, now: Date = new Date()): Validated<Required<SaveRoleInput>> {
  const { roleId, targetTerm, note } = (input ?? {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  if (typeof roleId !== "string" || !roleId.trim()) errors.roleId = "Choose a career role.";
  else if (!ROLE_ID_PATTERN.test(roleId.trim())) errors.roleId = "That career role isn't valid.";

  const termError = validateTargetTerm(targetTerm, now);
  if (termError) errors.targetTerm = termError;

  const noteError = validateNote(note);
  if (noteError) errors.note = noteError;

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      roleId: (roleId as string).trim(),
      targetTerm: (targetTerm as string).trim(),
      note: typeof note === "string" ? note.trim() : "",
    },
  };
}

/** Checks a "change this saved role" request. At least one field is required. */
export function validateUpdateSavedRoleInput(input: unknown, now: Date = new Date()): Validated<UpdateSavedRoleInput> {
  const { targetTerm, note } = (input ?? {}) as Record<string, unknown>;
  const errors: FieldErrors = {};
  const value: UpdateSavedRoleInput = {};

  if (targetTerm === undefined && note === undefined) {
    return { ok: false, errors: { targetTerm: "Change the target term or the note." } };
  }
  if (targetTerm !== undefined) {
    const termError = validateTargetTerm(targetTerm, now);
    if (termError) errors.targetTerm = termError;
    else value.targetTerm = (targetTerm as string).trim();
  }
  if (note !== undefined) {
    const noteError = validateNote(note);
    if (noteError) errors.note = noteError;
    else value.note = (note as string).trim();
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value };
}

/** Terms a student can pick from: this term through MAX_YEARS_AHEAD years from now. */
export function upcomingTerms(now: Date = new Date()): string[] {
  const terms: string[] = [];
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = January
  const currentSeason = month < 5 ? 0 : month < 7 ? 1 : 2;
  for (let y = year; y <= year + MAX_YEARS_AHEAD; y++) {
    TERM_SEASONS.forEach((season, i) => {
      if (y > year || i >= currentSeason) terms.push(`${season} ${y}`);
    });
  }
  return terms;
}
