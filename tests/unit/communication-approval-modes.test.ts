import { describe, expect, it } from "vitest";
import {
  APPROVAL_MODES,
  isHighRiskDraft,
  validateDraftMode,
} from "@/lib/communication/approval-modes";

describe("communication approval modes (§130)", () => {
  it("documented modes set matches the schema contract", () => {
    expect(APPROVAL_MODES).toEqual([
      "AI_DRAFT_ONLY",
      "AI_DRAFT_HUMAN_SEND",
      "APPROVED_AUTOMATION",
      "RESTRICTED_AUTOMATION",
    ]);
  });

  it("instantiates unknown modes as rejection, never silent coercion", () => {
    const d = validateDraftMode({ mode: "AUTO_SEND_FREE", riskLevel: "LOW" });
    expect(d.ok).toBe(false);
    expect(d.error).toMatch(/mode must be one of/);
  });

  it("defaults to AI_DRAFT_HUMAN_SEND when no mode supplied", () => {
    const d = validateDraftMode({ mode: undefined, riskLevel: "LOW" });
    expect(d.ok).toBe(true);
    expect(d.mode).toBe("AI_DRAFT_HUMAN_SEND");
    expect(d.requiresHumanReview).toBe(true);
  });

  it("allows automation only for low-risk content", () => {
    expect(validateDraftMode({ mode: "APPROVED_AUTOMATION", riskLevel: "LOW" }).ok).toBe(true);
    expect(validateDraftMode({ mode: "RESTRICTED_AUTOMATION", riskLevel: "MEDIUM" }).ok).toBe(true);
  });
});

describe("high-risk auto-send prohibition (§175)", () => {
  it("blocks automation for HIGH/CRITICAL riskLevels", () => {
    for (const [level, mode] of [
      ["HIGH", "APPROVED_AUTOMATION"],
      ["CRITICAL", "RESTRICTED_AUTOMATION"],
    ] as const) {
      const d = validateDraftMode({ mode, riskLevel: level });
      expect(d.ok).toBe(false);
      expect(d.error).toMatch(/human review/i);
    }
  });

  it("blocks automation when riskFlags contain high-risk categories even with LOW level", () => {
    for (const flags of [
      JSON.stringify(["payment"]),
      JSON.stringify(["VISA"]),
      '["immigration","duplicate"]',
      ["FINANCIAL_EVIDENCE"],
    ]) {
      const d = validateDraftMode({ mode: "APPROVED_AUTOMATION", riskLevel: "LOW", riskFlags: flags });
      expect(d.ok).toBe(false);
    }
  });

  it("always requires human review for high-risk content", () => {
    const d = validateDraftMode({ mode: "AI_DRAFT_HUMAN_SEND", riskLevel: "CRITICAL" });
    expect(d.ok).toBe(true);
    expect(d.requiresHumanReview).toBe(true);
  });

  it("detects high risk from flags including malformed flag payloads", () => {
    expect(isHighRiskDraft("LOW", "not json")).toBe(false);
    expect(isHighRiskDraft("LOW", "[]")).toBe(false);
    expect(isHighRiskDraft("CRITICAL", "not json")).toBe(true);
  });
});
