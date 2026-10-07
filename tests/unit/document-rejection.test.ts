// §136/§137/§138 — document versioning + rejection rules (pure lib)
import { describe, it, expect } from "vitest";
import {
  REJECTION_REASONS,
  REJECTION_REASON_CODES,
  validateRejection,
  isRejectableStatus,
  isImmutableStatus,
  nextDocumentVersion,
  rejectionReasonLabel,
} from "@/lib/documents/document-rejection";

describe("§138 predefined rejection reasons", () => {
  it("exposes exactly 9 predefined reason options", () => {
    expect(REJECTION_REASONS).toHaveLength(9);
    expect(REJECTION_REASON_CODES).toContain("OTHER");
  });

  it("rejects an unknown reason code with INVALID_REJECTION_REASON", () => {
    const v = validateRejection("STUDENT_SUBMITTED", "NOT_A_REASON", "note");
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.httpStatus).toBe(400);
      expect(v.code).toBe("INVALID_REJECTION_REASON");
    }
  });

  it("OTHER requires a specific manual reason (audit trail)", () => {
    const v = validateRejection("STUDENT_SUBMITTED", "OTHER", "short");
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.code).toBe("MANUAL_REASON_REQUIRED");
    const v2 = validateRejection("STUDENT_SUBMITTED", "OTHER", "Embassy requires a newer bank statement date range");
    expect(v2.ok).toBe(true);
  });

  it("a predefined reason with a note is valid", () => {
    expect(validateRejection("UNDER_REVIEW", "DOCUMENT_EXPIRED", "Passport expired 2024").ok).toBe(true);
  });

  it("label lookup returns the human-readable predefined text", () => {
    expect(rejectionReasonLabel("WRONG_DOCUMENT_TYPE")).toContain("Wrong document");
  });
});

describe("§137 state machine — rejection vs. verified immutability", () => {
  it("STUDENT_SUBMITTED and UNDER_REVIEW are rejectable", () => {
    expect(isRejectableStatus("STUDENT_SUBMITTED")).toBe(true);
    expect(isRejectableStatus("UNDER_REVIEW")).toBe(true);
  });

  it("VERIFIED and LOCKED are immutable", () => {
    expect(isImmutableStatus("VERIFIED")).toBe(true);
    expect(isImmutableStatus("LOCKED")).toBe(true);
  });

  it("rejecting a VERIFIED document is blocked with 409 + supersede guidance", () => {
    const v = validateRejection("VERIFIED", "DOCUMENT_UNREADABLE", "needs replacement");
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.httpStatus).toBe(409);
      expect(v.code).toBe("VERIFIED_IMMUTABLE");
      expect(v.error).toContain("version-supersede");
    }
  });
});

describe("§136 version history — rejection never bumps, uploads do", () => {
  it("first upload is version 1", () => {
    expect(nextDocumentVersion([])).toBe(1);
  });

  it("next upload after v1/v2 rejected/superseded is v3 (one requirement, version history)", () => {
    expect(nextDocumentVersion([1, 2])).toBe(3);
  });

  it("ignores junk values when computing the next version", () => {
    expect(nextDocumentVersion([Number.NaN, 2, -5])).toBe(3);
  });
});
