// ============================================================================
// ALO Interview Research Engine — honesty mandate (spec: INTERVIEW RESEARCH
// ENGINE / INTERVIEW PREPARATION). Pure constants + assembler, no db.
//
// The system MUST:
//  - target a research window of minimum 6 months where reliable data exists
//  - NOT claim access to private/confidential interview data
//  - NOT guarantee "100% visa" / "100% pass" / "exact questions"
//  - state that questions can vary
// ============================================================================

export const INTERVIEW_RESEARCH_WINDOW_MONTHS = 6;

export const INTERVIEW_DISCLAIMERS = [
  "Interview questions can vary — there is no fixed list; prepare themes, not memorized answers.",
  "No interview outcome can be guaranteed — this guidance does not and cannot promise a visa, admission, or pass result.",
  "This material is built from publicly available official guidance and recent reported patterns; ALO has no access to private or confidential interview records.",
  "AI assessment is preliminary only — a human interviewer reviews before any internal decision.",
] as const;

/** Words that must NEVER appear in generated interview guidance. */
export const INTERVIEW_FORBIDDEN_CLAIMS = [
  "100% visa", "100% pass", "guaranteed visa", "guaranteed pass",
  "exact questions", "leaked questions", "confidential interview records",
] as const;

/** Reject guidance text that fabricates certainty or confidential access. */
export function validateInterviewGuidance(text: string): { ok: boolean; violations: string[] } {
  const lower = String(text || "").toLowerCase();
  const violations = INTERVIEW_FORBIDDEN_CLAIMS.filter((c) => lower.includes(String(c).toLowerCase()));
  return { ok: violations.length === 0, violations };
}

/** Attach the mandatory honesty block to any interview guidance response. */
export function attachInterviewHonesty<T extends Record<string, any>>(payload: T): T & {
  researchWindowMonths: number;
  disclaimers: string[];
} {
  return {
    ...payload,
    researchWindowMonths: INTERVIEW_RESEARCH_WINDOW_MONTHS,
    disclaimers: [...INTERVIEW_DISCLAIMERS],
  };
}
