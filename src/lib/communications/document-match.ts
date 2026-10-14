/**
 * RECEIVED-DOCUMENT PIPELINE — MATCH & CLASSIFY (spec §131-§133)
 * ============================================================
 * The brief is explicit about what must NOT happen:
 *
 *   §133 "Attach the document to the correct Application → Document Requirement
 *         (e.g. Bank Statement). If the application cannot be confidently
 *         determined, do not guess — DOCUMENT MATCH REVIEW REQUIRED."
 *   §132 received documents follow one pipeline: receive → validate → store
 *        securely → identify sender → match Student ID → match the active
 *        application → record a document upload event → classify → update the
 *        checklist → notify the counselor → preserve the WhatsApp reference.
 *   §131 every outbound file records message_id, student_id, application_id,
 *        document_id, sender, recipient, file_id, file_name, file_type,
 *        timestamp, delivery_status.
 *
 * Pure decision functions: the caller supplies the evidence it has already
 * looked up, and gets back either a confident match or an explicit refusal to
 * guess.
 */

export type RequirementKey =
  | 'PASSPORT'
  | 'ACADEMIC_TRANSCRIPT'
  | 'ACADEMIC_CERTIFICATE'
  | 'ENGLISH_TEST'
  | 'BANK_STATEMENT'
  | 'SPONSOR_AFFIDAVIT'
  | 'SOP_PERSONAL_STATEMENT'
  | 'RECOMMENDATION_LETTER'
  | 'CV_RESUME'
  | 'PHOTO'
  | 'OFFER_LETTER'
  | 'VISA_FORM'
  | 'OTHER';

/** Filename/content hints → requirement. Ordered most specific first. */
const REQUIREMENT_HINTS: Array<{ requirement: RequirementKey; patterns: RegExp[] }> = [
  { requirement: 'BANK_STATEMENT', patterns: [/bank.?statement/i, /statement.?of.?account/i, /solvency/i, /bank.?solven/i] },
  { requirement: 'SPONSOR_AFFIDAVIT', patterns: [/affidavit/i, /sponsor.?letter/i, /declaration.?of.?support/i] },
  { requirement: 'ENGLISH_TEST', patterns: [/\bielts\b/i, /\bpte\b/i, /\btoefl\b/i, /\bduolingo\b/i, /\bmoi\b/i, /english.?test/i] },
  { requirement: 'ACADEMIC_TRANSCRIPT', patterns: [/transcript/i, /marksheet/i, /mark.?sheet/i, /grade.?sheet/i] },
  { requirement: 'ACADEMIC_CERTIFICATE', patterns: [/certificate/i, /\bhsc\b/i, /\bssc\b/i, /bachelor.?degree/i, /masters?.?degree/i, /testimonial/i] },
  { requirement: 'PASSPORT', patterns: [/passport/i, /\bmrp\b/i] },
  { requirement: 'SOP_PERSONAL_STATEMENT', patterns: [/\bsop\b/i, /statement.?of.?purpose/i, /personal.?statement/i, /motivation.?letter/i] },
  { requirement: 'RECOMMENDATION_LETTER', patterns: [/recommend/i, /\blor\b/i, /reference.?letter/i] },
  { requirement: 'CV_RESUME', patterns: [/\bcv\b/i, /resume/i] },
  { requirement: 'PHOTO', patterns: [/photo/i, /passport.?size/i] },
  { requirement: 'OFFER_LETTER', patterns: [/offer.?letter/i, /\bcas\b/i, /\bi20\b/i, /\bcoe\b/i] },
  { requirement: 'VISA_FORM', patterns: [/visa.?form/i, /application.?form.?visa/i] },
];

/**
 * Classify a received document from its filename and (optionally) the message the
 * student sent with it. Never throws and never guesses "OTHER" as a match — an
 * unrecognised file stays `OTHER` with low confidence so a human classifies it.
 */
export function classifyDocument(input: { fileName?: string | null; messageText?: string | null }): {
  requirement: RequirementKey;
  confidence: 'high' | 'low';
  matchedOn: string[];
} {
  const haystack = [input.fileName || '', input.messageText || ''].join(' \n ');
  const matches: Array<{ requirement: RequirementKey; hint: string }> = [];

  for (const entry of REQUIREMENT_HINTS) {
    for (const pattern of entry.patterns) {
      const match = haystack.match(pattern);
      if (match) {
        matches.push({ requirement: entry.requirement, hint: match[0] });
        break;
      }
    }
  }

  if (matches.length === 0) return { requirement: 'OTHER', confidence: 'low', matchedOn: [] };

  // Two different hints (e.g. "bank statement" plus "affidavit") mean the sender
  // may have combined documents or mis-named the file — that is a human decision.
  const distinct = [...new Set(matches.map((entry) => entry.requirement))];
  if (distinct.length > 1) {
    return { requirement: distinct[0], confidence: 'low', matchedOn: matches.map((entry) => entry.hint) };
  }

  return { requirement: distinct[0], confidence: 'high', matchedOn: matches.map((entry) => entry.hint) };
}

export interface ApplicationCandidate {
  applicationId: string;
  /** Stage of the application, e.g. cas_i20_coe, visa_applied. */
  stage?: string | null;
  universityName?: string | null;
  courseName?: string | null;
  /** True when the application is still open (not withdrawn/refused/closed). */
  active?: boolean;
  /** Requirement keys this application is currently missing (drives §133). */
  outstandingRequirements?: string[];
}

export interface DocumentMatchInput {
  studentId?: string | null;
  /** Identity confidence from resolveContactIdentity (§125/§126). */
  identityConfidence?: 'exact' | 'possible' | 'none';
  candidates: ApplicationCandidate[];
  requirement: RequirementKey;
  /** Explicit application named by the student in the message, if any. */
  mentionedApplicationId?: string | null;
}

export interface DocumentMatchDecision {
  matched: boolean;
  applicationId: string | null;
  requirement: RequirementKey;
  /** Spec §133 wording — returned verbatim when the match is not confident. */
  notice: 'DOCUMENT MATCH REVIEW REQUIRED' | null;
  reasons: string[];
  requiresHumanReview: boolean;
}

/**
 * Decide which application a received document belongs to.
 *
 * Confidence rules:
 *   • the student must be identified (exact) — a document from an unmatched
 *     number never lands on an application by itself;
 *   • the student must have exactly ONE active application, or the message must
 *     name it, or exactly one active application must still be missing this
 *     requirement.
 *
 * Anything else returns DOCUMENT MATCH REVIEW REQUIRED and no applicationId, so
 * the caller cannot attach it by accident.
 */
export function decideDocumentMatch(input: DocumentMatchInput): DocumentMatchDecision {
  const reasons: string[] = [];

  if (!input.studentId || input.identityConfidence !== 'exact') {
    return {
      matched: false,
      applicationId: null,
      requirement: input.requirement,
      notice: 'DOCUMENT MATCH REVIEW REQUIRED',
      reasons: [
        !input.studentId
          ? 'The sender is not matched to a student record.'
          : 'The sender matched only a possible contact (weak identity signal).',
      ],
      requiresHumanReview: true,
    };
  }

  const active = input.candidates.filter((candidate) => candidate.active !== false);
  if (active.length === 0) {
    return {
      matched: false,
      applicationId: null,
      requirement: input.requirement,
      notice: 'DOCUMENT MATCH REVIEW REQUIRED',
      reasons: ['The student has no active application to attach this document to.'],
      requiresHumanReview: true,
    };
  }

  if (input.mentionedApplicationId) {
    const named = active.find((candidate) => candidate.applicationId === input.mentionedApplicationId);
    if (named) {
      return {
        matched: true,
        applicationId: named.applicationId,
        requirement: input.requirement,
        notice: null,
        reasons: ['The student named this application in the conversation.'],
        requiresHumanReview: false,
      };
    }
    reasons.push('The application named by the student is not an active application of this student.');
  }

  if (active.length === 1) {
    return {
      matched: true,
      applicationId: active[0].applicationId,
      requirement: input.requirement,
      notice: null,
      reasons: ['The student has exactly one active application.'],
      requiresHumanReview: false,
    };
  }

  const awaiting = active.filter((candidate) => (candidate.outstandingRequirements || []).includes(input.requirement));
  if (awaiting.length === 1) {
    return {
      matched: true,
      applicationId: awaiting[0].applicationId,
      requirement: input.requirement,
      notice: null,
      reasons: [`Only one active application is still missing ${input.requirement.replace(/_/g, ' ').toLowerCase()}.`],
      requiresHumanReview: false,
    };
  }

  reasons.push(
    `The student has ${active.length} active applications and ${awaiting.length === 0 ? 'none' : awaiting.length} of them are waiting for this requirement.`,
  );
  return {
    matched: false,
    applicationId: null,
    requirement: input.requirement,
    notice: 'DOCUMENT MATCH REVIEW REQUIRED',
    reasons,
    requiresHumanReview: true,
  };
}

/** Spec §131 — the metadata every outbound file transfer must record. */
export interface OutboundFileMetadata {
  messageId: string;
  studentId: string;
  applicationId: string;
  documentId: string;
  sender: string;
  recipient: string;
  fileId: string;
  fileName: string;
  fileType: string;
  timestamp: string;
  deliveryStatus: string;
}

export const OUTBOUND_FILE_METADATA_FIELDS: Array<keyof OutboundFileMetadata> = [
  'messageId',
  'studentId',
  'applicationId',
  'documentId',
  'sender',
  'recipient',
  'fileId',
  'fileName',
  'fileType',
  'timestamp',
  'deliveryStatus',
];

/**
 * Validate an outbound file record before it is stored (§131). Returns the missing
 * keys so a caller can log exactly what was not captured — a file that leaves ALO
 * without this trail cannot be reconstructed later.
 */
export function validateOutboundFileMetadata(
  metadata: Partial<OutboundFileMetadata>,
): { valid: boolean; missing: Array<keyof OutboundFileMetadata> } {
  const missing = OUTBOUND_FILE_METADATA_FIELDS.filter((field) => {
    // applicationId may legitimately be empty for a pre-application file, but the
    // key must still be present so "not applicable" is a recorded decision.
    if (field === 'applicationId') return !(field in metadata);
    const value = metadata[field];
    return value === undefined || String(value).trim() === '';
  });
  return { valid: missing.length === 0, missing };
}
