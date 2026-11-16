import { upcomingTerms, validateSaveRoleInput, validateTargetTerm, validateUpdateSavedRoleInput } from "@/lib/roadmapValidation";

const now = new Date("2026-11-15T12:00:00Z");

describe("Issue #3: validation rules", () => {
  it.each([
    [undefined, "Choose the term you want to qualify by."],
    ["Winter 2027", 'Target term looks like "Fall 2027".'],
    ["Fall 2025", "Target term can't be in the past."],
    ["Fall 2040", "Target term must be within 8 years."],
    ["Spring 2027", null],
  ])("target term %p -> %p", (term, message) => {
    expect(validateTargetTerm(term, now)).toBe(message);
  });

  it("trims values and defaults the note", () => {
    expect(validateSaveRoleInput({ roleId: " data-analyst ", targetTerm: "Fall 2027 " }, now)).toEqual({
      ok: true,
      value: { roleId: "data-analyst", targetTerm: "Fall 2027", note: "" },
    });
  });

  it("rejects an update with nothing to change", () => {
    expect(validateUpdateSavedRoleInput({}, now).ok).toBe(false);
  });

  it("lists terms from the current season onward", () => {
    expect(upcomingTerms(now).slice(0, 3)).toEqual(["Fall 2026", "Spring 2027", "Summer 2027"]);
  });
});
