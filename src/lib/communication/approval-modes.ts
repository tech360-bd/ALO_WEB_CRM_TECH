// ============================================================================
// ALO Unified Communication — AI draft approval modes (§130, §175)
//
// The CommunicationDraft.mode column documents four modes:
//   AI_DRAFT_ONLY          — AI drafts; nothing is ever auto-sent.
//   AI_DRAFT_HUMAN_SEND    — AI drafts; a human reviews/edits and sends.
//   APPROVED_AUTOMATION    — organization-approved automation may send.
//   RESTRICTED_AUTOMATION  — automation only under restricted policy.
//
// §175 high-risk communications (payment / visa / immigration / legal /
// financial evidence) must NEVER be auto-sent: AI draft → human review → send.
// This module is the single enforcement point so routes can't silently
// register an automation mode for a high-risk context.
// ============================================================================

export const APPROVAL_MODES = [
  "AI_DRAFT_ONLY",
  "AI_DRAFT_HUMAN_SEND",
  "APPROVED_AUTOMATION",
  "RESTRICTED_AUTOMATION",
] as const;

export type ApprovalMode = (typeof APPROVAL_MODES)[number];

// Risk levels at which auto-send modes are forbidden (CommunicationDraft.riskLevel).
export const HIGH_RISK_LEVELS = new Set(["HIGH", "CRITICAL"]);

// §175 intent/category flags that are always high-risk, even if the caller
// reports riskLevel LOW (defense in depth — flags come from the AI classifier).
export const HIGH_RISK_FLAGS = new Set([
  "payment",
  "visa",
  "immigration",
  "legal",
  "financial_evidence",
  "PAYMENT",
  "VISA",
  "IMMIGRATION",
  "LEGAL",
  "FINANCIAL_EVIDENCE",
]);

export interface DraftModeDecision {
  ok: boolean;
  mode: ApprovalMode;
  requiresHumanReview: boolean;
  error?: string;
}

function parseRiskFlags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function isHighRiskDraft(riskLevel: unknown, riskFlagsRaw: unknown): boolean {
  if (HIGH_RISK_LEVELS.has(String(riskLevel || "").toUpperCase())) return true;
  const flags = parseRiskFlags(riskFlagsRaw);
  return flags.some((flag) => HIGH_RISK_FLAGS.has(flag));
}

/**
 * Validate a requested draft mode. High-risk drafts are forced to the two
 * human-safe modes; anything else is rejected with a 422-grade reason so the
 * caller sees the policy instead of a silent downgrade.
 */
export function validateDraftMode(params: {
  mode: unknown;
  riskLevel?: unknown;
  riskFlags?: unknown;
}): DraftModeDecision {
  const requested = String(params.mode || "AI_DRAFT_HUMAN_SEND");
  if (!APPROVAL_MODES.includes(requested as ApprovalMode)) {
    return {
      ok: false,
      mode: "AI_DRAFT_HUMAN_SEND",
      requiresHumanReview: true,
      error: `mode must be one of ${APPROVAL_MODES.join(", ")}`,
    };
  }
  const highRisk = isHighRiskDraft(params.riskLevel, params.riskFlags);
  if (highRisk && (requested === "APPROVED_AUTOMATION" || requested === "RESTRICTED_AUTOMATION")) {
    return {
      ok: false,
      mode: "AI_DRAFT_HUMAN_SEND",
      requiresHumanReview: true,
      error:
        "High-risk communication (payment/visa/immigration/legal/financial evidence or HIGH/CRITICAL risk) " +
        "requires human review before sending — auto-send modes are not permitted (communication module §175).",
    };
  }
  return {
    ok: true,
    mode: requested as ApprovalMode,
    requiresHumanReview: highRisk || requested === "AI_DRAFT_ONLY" || requested === "AI_DRAFT_HUMAN_SEND",
  };
}
