// ============================================================================
// ALO Document Review Rules — §136 (versioning), §137 (correction workflow),
// §138 (rejection reasons & audit)
//
// Pure functions, no db access — fully unit-testable.
//
// §136: One document requirement holds a version HISTORY. Re-uploads bump the
//       version (v1 -> v2 -> v3); a rejection NEVER increments the version.
//       Older non-verified versions are marked SUPERSEDED; the newest is the
//       only ACTIVE version. Old versions stay stored and auditable.
// §137: A VERIFIED document is immutable. It can only be replaced through an
//       explicit supersede action by an authorized role giving a reason.
// §138: Rejection requires a predefined reason and is fully audit-traceable.
// ============================================================================

// §138 — rejection reason must be one of these predefined options.
export const REJECTION_REASONS = [
  {
    code: "DOCUMENT_UNREADABLE",
    label: "Document is unclear, blurry, or unreadable",
  },
  {
    code: "DOCUMENT_INCOMPLETE",
    label: "Document is incomplete — pages, signatures, or sections missing",
  },
  {
    code: "DOCUMENT_EXPIRED",
    label: "Document has expired and is no longer valid",
  },
  {
    code: "WRONG_DOCUMENT_TYPE",
    label: "Wrong document uploaded for this requirement",
  },
  {
    code: "TRANSLATION_REQUIRED",
    label: "Certified English translation required",
  },
  {
    code: "ATTESTATION_REQUIRED",
    label: "Document must be attested / notarized / certified",
  },
  {
    code: "NAME_OR_DETAILS_MISMATCH",
    label: "Name or details do not match the application",
  },
  {
    code: "FILE_CORRUPTED",
    label: "File is corrupted or cannot be opened",
  },
  {
    code: "OTHER",
    label: "Other — a specific manual reason is required",
  },
] as const;

export type RejectionReasonCode = (typeof REJECTION_REASONS)[number]["code"];

export const REJECTION_REASON_CODES: readonly string[] = REJECTION_REASONS.map((r) => r.code);

/** §138 — which statuses may enter review and therefore may be rejected. */
export const REJECTABLE_STATUSES = ["STUDENT_SUBMITTED", "UNDER_REVIEW", "UPLOADED", "REJECTED"] as const;

/** VERIFIED documents are locked — rejection on them is a state-machine bug. */
export const IMMUTABLE_STATUSES = ["VERIFIED", "LOCKED"] as const;

export function isRejectableStatus(status: string): boolean {
  return (REJECTABLE_STATUSES as readonly string[]).includes(String(status).toUpperCase());
}

export function isImmutableStatus(status: string): boolean {
  return (IMMUTABLE_STATUSES as readonly string[]).includes(String(status).toUpperCase());
}

/**
 * §138 — validate a rejection request.
 * `reasonCode` must be a predefined option; when it is OTHER, a specific
 * manual `reviewerNote` is mandatory.
 */
export function validateRejection(
  status: string,
  reasonCode: string | undefined,
  reviewerNote: string | undefined,
): { ok: true } | { ok: false; httpStatus: number; code: string; error: string } {
  if (isImmutableStatus(status)) {
    return {
      ok: false,
      httpStatus: 409,
      code: "VERIFIED_IMMUTABLE",
      error:
        `Document is ${status} and cannot be rejected. Use the version-supersede ` +
        `workflow: upload the corrected document as a new version with a recorded reason.`,
    };
  }
  if (!isRejectableStatus(status)) {
    return {
      ok: false,
      httpStatus: 409,
      code: "INVALID_STATE_TRANSITION",
      error: `Document in status ${status} cannot be rejected at this stage.`,
    };
  }
  const code = String(reasonCode || "").toUpperCase();
  if (!code || !REJECTION_REASON_CODES.includes(code)) {
    return {
      ok: false,
      httpStatus: 400,
      code: "INVALID_REJECTION_REASON",
      error: `reasonCode must be one of: ${REJECTION_REASON_CODES.join(", ")}`,
    };
  }
  const note = (reviewerNote || "").trim();
  if (code === "OTHER" && note.length < 10) {
    return {
      ok: false,
      httpStatus: 400,
      code: "MANUAL_REASON_REQUIRED",
      error: "reasonCode OTHER requires a specific reviewerNote (min 10 characters).",
    };
  }
  if (code !== "OTHER" && !note) {
    return {
      ok: false,
      httpStatus: 400,
      code: "REVIEWER_NOTE_REQUIRED",
      error: "reviewerNote is required so the rejection is audit-traceable.",
    };
  }
  return { ok: true };
}

/** §136 — next version number for a requirement given existing version numbers. */
export function nextDocumentVersion(existingVersions: number[]): number {
  const max = existingVersions.reduce((acc, v) => (Number.isFinite(v) && v > acc ? v : acc), 0);
  return max + 1;
}

/** Canonical labels looked up by code — used by audit notes and UI. */
export function rejectionReasonLabel(code: string): string {
  const found = REJECTION_REASONS.find((r) => r.code === String(code).toUpperCase());
  return found ? found.label : String(code || "");
}
