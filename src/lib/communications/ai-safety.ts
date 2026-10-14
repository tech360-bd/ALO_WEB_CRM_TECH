/**
 * AI COMMUNICATION SAFETY (spec §129, §130, §158, §166, §175)
 * ==========================================================
 * The brief is strict about what an AI reply may do:
 *
 *   §129 must NOT invent information. For high-risk subjects (payment, visa,
 *        immigration, legal, financial evidence) it must use a verified source OR
 *        escalate to a counselor.
 *   §130 four modes: AI Draft Only / AI Draft + Human Send / Approved Automation
 *        / Restricted Automation. High-risk always routes draft → human → send,
 *        and the UI must label "AI GENERATED DRAFT" before sending.
 *   §158 AI may prioritise and route (counselor + finance/visa officer) but must
 *        never silently resolve a critical case.
 *   §166 permission must be enforced BEFORE retrieval — the AI may only see
 *        conversations the current employee is authorized for.
 *   §175 AI must never auto-send fabricated university/payment/visa content,
 *        false deadlines, guaranteed visas or guaranteed interview success.
 *
 * Pure functions so the guardrail logic is testable without a model or a database.
 */

export type AutomationMode =
  | 'ai_draft_only'
  | 'ai_draft_human_send'
  | 'approved_automation'
  | 'restricted_automation';

export type RiskTopic =
  | 'payment'
  | 'visa'
  | 'immigration'
  | 'legal'
  | 'financial_evidence'
  | 'guarantee_request'
  | 'refusal_history';

/**
 * Topics where a wrong sentence costs a student money, a visa or a deadline.
 * Nothing in this list may ever be answered from model memory.
 */
export const HIGH_RISK_TOPICS: RiskTopic[] = [
  'payment',
  'visa',
  'immigration',
  'legal',
  'financial_evidence',
  'guarantee_request',
  'refusal_history',
];

const TOPIC_PATTERNS: Array<{ topic: RiskTopic; pattern: RegExp }> = [
  { topic: 'payment', pattern: /\b(payment|pay|paid|tuition fee|deposit|invoice|refund|receipt|bdt|bank transfer|installment)\b/i },
  { topic: 'visa', pattern: /\b(visa|cas|i20|i-20|coe|embassy|vfs|biometric|interview waiver|visa fee)\b/i },
  { topic: 'immigration', pattern: /\b(immigration|overstay|deport|entry clearance|leave to remain|home office|ircc|uscis)\b/i },
  { topic: 'legal', pattern: /\b(legal|lawsuit|lawyer|solicitor|contract|attorney|police case)\b/i },
  { topic: 'financial_evidence', pattern: /\b(bank statement|proof of funds|sponsor|affidavit|source of fund|financial document|solvency)\b/i },
  { topic: 'guarantee_request', pattern: /\b(guarantee|guaranteed|sure|100%|assure|promise).{0,40}\b(visa|admission|offer|interview|scholarship)\b/i },
  { topic: 'refusal_history', pattern: /\b(refusal|refused|rejected visa|denied)\b/i },
];

/** Words that indicate the student is asking for something the AI must not promise. */
const FABRICATION_TRAPS: Array<{ id: string; pattern: RegExp; why: string }> = [
  { id: 'guaranteed_visa', pattern: /\byou (will|are guaranteed to) (get|receive) (the )?visa\b/i, why: 'ALO never guarantees a visa outcome.' },
  { id: 'guaranteed_admission', pattern: /\bguaranteed (admission|offer|place)\b/i, why: 'Admission decisions belong to the university.' },
  { id: 'guaranteed_interview', pattern: /\bguaranteed (interview|selection)\b/i, why: 'Interview outcomes cannot be promised.' },
  { id: 'invented_deadline', pattern: /\bdeadline is \d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/i, why: 'Deadlines must come from the verified course/intake record.' },
  { id: 'invented_fee', pattern: /\b(pay|payment of) (usd|gbp|aud|cad|bdt|\$|£)\s?[\d,]{3,}/i, why: 'Payment amounts must come from the official fee record.' },
];

export interface RiskAssessment {
  topics: RiskTopic[];
  highRisk: boolean;
  /** Reasons shown to the counselor in the composer. */
  reasons: string[];
  /** Where the message should go (spec §158). */
  route: Array<'counselor' | 'finance' | 'visa_officer' | 'manager'>;
  priority: 'urgent' | 'high' | 'normal';
}

/** Classify an inbound message for risk, routing and priority. */
export function assessMessageRisk(text: string, options: { offerDeadlineSoon?: boolean } = {}): RiskAssessment {
  const body = text || '';
  const topics = new Set<RiskTopic>();
  for (const { topic, pattern } of TOPIC_PATTERNS) {
    if (pattern.test(body)) topics.add(topic);
  }

  const reasons: string[] = [];
  const route = new Set<'counselor' | 'finance' | 'visa_officer' | 'manager'>(['counselor']);
  let priority: RiskAssessment['priority'] = 'normal';

  if (topics.has('payment') || topics.has('financial_evidence')) {
    route.add('finance');
    priority = 'urgent';
    reasons.push('Payment or financial evidence — the AI reply must quote the official fee record, and finance is copied in.');
  }
  if (topics.has('visa') || topics.has('immigration') || topics.has('refusal_history')) {
    route.add('visa_officer');
    priority = 'urgent';
    reasons.push('Visa/immigration subject — only verified official guidance may be used.');
  }
  if (topics.has('legal')) {
    route.add('manager');
    priority = 'urgent';
    reasons.push('Legal subject — route to a manager; the AI must not answer.');
  }
  if (topics.has('guarantee_request')) {
    priority = 'urgent';
    reasons.push('The student is asking for a guarantee. ALO policy forbids promising visas, offers or interview outcomes — the AI draft must decline clearly and explain the real process.');
  }
  if (options.offerDeadlineSoon) {
    priority = 'urgent';
    reasons.push('An offer/CAS deadline is near — the counselor is notified immediately.');
  }

  const highRisk = [...topics].some((topic) => HIGH_RISK_TOPICS.includes(topic));
  if (!highRisk && reasons.length === 0) reasons.push('No high-risk subject detected — a draft may be prepared for counselor review.');

  return { topics: [...topics], highRisk, reasons, route: [...route], priority };
}

/** Detect content an AI draft must not contain (spec §175). */
export function findForbiddenClaims(draft: string): Array<{ id: string; why: string; match: string }> {
  const text = draft || '';
  const hits: Array<{ id: string; why: string; match: string }> = [];
  for (const trap of FABRICATION_TRAPS) {
    const match = text.match(trap.pattern);
    if (match) hits.push({ id: trap.id, why: trap.why, match: match[0] });
  }
  return hits;
}

export interface DraftDecision {
  mode: AutomationMode;
  /** What the UI shows before the human sends (spec §130). */
  label: string;
  /** True when a human MUST review before this leaves the system. */
  requiresHumanReview: boolean;
  /** True when the system must not even draft (only escalate/assign). */
  escalateOnly: boolean;
  reasons: string[];
}

/**
 * Decide how an AI reply may be produced and sent.
 *
 * Invariants (never configurable away):
 *   • high-risk topics always require human review;
 *   • a draft containing a forbidden claim is blocked;
 *   • `approved_automation` may only auto-send for LOW-risk traffic that has an
 *     approved template behind it.
 */
export function decideDraftMode(
  risk: RiskAssessment,
  options: { mode?: AutomationMode; hasApprovedTemplate?: boolean; draftText?: string } = {}
): DraftDecision {
  const mode = options.mode ?? 'ai_draft_human_send';
  const reasons = [...risk.reasons];
  const forbidden = options.draftText ? findForbiddenClaims(options.draftText) : [];
  if (forbidden.length > 0) {
    reasons.push(...forbidden.map((hit) => `Blocked claim: ${hit.match} — ${hit.why}`));
  }

  // Legal subjects are not a drafting task at all.
  if (risk.topics.includes('legal')) {
    return { mode: 'restricted_automation', label: 'ESCALATE — NO AI DRAFT', requiresHumanReview: true, escalateOnly: true, reasons };
  }

  if (mode === 'restricted_automation') {
    return { mode, label: 'ESCALATE — NO AI DRAFT', requiresHumanReview: true, escalateOnly: true, reasons };
  }

  const blocked = forbidden.length > 0;
  const highRiskOrBlocked = risk.highRisk || blocked;

  if (highRiskOrBlocked) {
    return {
      mode: mode === 'ai_draft_only' ? 'ai_draft_only' : 'ai_draft_human_send',
      label: 'AI GENERATED DRAFT — HUMAN APPROVAL REQUIRED',
      requiresHumanReview: true,
      escalateOnly: false,
      reasons,
    };
  }

  if (mode === 'approved_automation' && options.hasApprovedTemplate) {
    return { mode, label: 'APPROVED TEMPLATE — AUTOMATION ALLOWED', requiresHumanReview: false, escalateOnly: false, reasons };
  }

  if (mode === 'approved_automation' && !options.hasApprovedTemplate) {
    reasons.push('Automation was requested but no approved template matches this message, so a counselor must send it.');
    return { mode: 'ai_draft_human_send', label: 'AI GENERATED DRAFT — HUMAN APPROVAL REQUIRED', requiresHumanReview: true, escalateOnly: false, reasons };
  }

  return {
    mode,
    label: 'AI GENERATED DRAFT — REVIEW BEFORE SENDING',
    requiresHumanReview: true,
    escalateOnly: false,
    reasons,
  };
}

/**
 * §166 — permission must be enforced BEFORE retrieval.
 * Returns the student ids the caller may retrieve, or an explicit deny.
 */
export function authorizeConversationAccess(params: {
  actor: { userId: string; role: 'counselor' | 'manager' | 'admin' | 'partner' | 'student'; partnerId?: string | null };
  conversation: { studentId: string; counselorId?: string | null; partnerId?: string | null };
}): { allowed: true } | { allowed: false; code: string; message: string } {
  const { actor, conversation } = params;

  if (actor.role === 'admin' || actor.role === 'manager') return { allowed: true };

  if (actor.role === 'counselor') {
    if (conversation.counselorId && conversation.counselorId !== actor.userId) {
      return {
        allowed: false,
        code: 'NOT_YOUR_CONVERSATION',
        message: 'This conversation belongs to another counselor. Ask a manager to reassign it before replying.',
      };
    }
    return { allowed: true };
  }

  if (actor.role === 'partner') {
    // §123: a partner sees only students explicitly assigned to that partner.
    if (!actor.partnerId || conversation.partnerId !== actor.partnerId) {
      return { allowed: false, code: 'PARTNER_SCOPE', message: 'This student is not assigned to your partner account.' };
    }
    return { allowed: true };
  }

  return { allowed: false, code: 'STUDENT_SCOPE', message: 'Students may only view their own conversations.' };
}

/**
 * §158 — AI may propose a next best action, but critical cases must never be
 * closed by automation.
 */
export function proposeNextAction(risk: RiskAssessment, options: { intent?: string } = {}): { action: string; needsHuman: boolean; owner: string } {
  if (risk.topics.includes('legal')) return { action: 'Escalate to a manager before replying.', needsHuman: true, owner: 'manager' };
  if (risk.topics.includes('payment')) return { action: 'Send the verified payment instruction and confirm the amount with finance.', needsHuman: true, owner: 'finance' };
  if (risk.topics.includes('visa') || risk.topics.includes('immigration')) return { action: 'Reply with the verified visa checklist and book a visa briefing.', needsHuman: true, owner: 'visa_officer' };
  if (risk.topics.includes('financial_evidence')) return { action: 'Send the document request for the outstanding financial evidence.', needsHuman: true, owner: 'counselor' };
  if (options.intent === 'document_requirement') return { action: 'Request the outstanding document and set a follow-up reminder.', needsHuman: true, owner: 'counselor' };
  return { action: 'Draft a reply for counselor review.', needsHuman: true, owner: 'counselor' };
}
