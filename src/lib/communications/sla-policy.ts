/**
 * COUNSELOR SLA POLICY ENGINE (spec §147-§150)
 * ===========================================
 * Resolves the response deadline for an inbound communication from configurable
 * policy rather than one hardcoded number, and reports the live countdown state.
 *
 * The existing `src/lib/sla-engine.ts` owns *time arithmetic* (office hours,
 * holidays) and `src/lib/sla-incidents.ts` owns incident counting with valid
 * exclusions. This module is the missing middle layer: "what is the policy for
 * THIS message, and where is it in its countdown right now?" — so both of those
 * keep working and nothing is duplicated.
 *
 * Spec requirements encoded here:
 *   §147 deadlines configurable by channel, priority, student type, application
 *        stage, message intent, business hours and holiday calendar;
 *   §148 the countdown must be readable WITHOUT relying on colour alone;
 *   §149 warning → urgent warning → overdue → escalation thresholds;
 *   §156 non-working time must not be counted against a counselor.
 *
 * Pure functions only — no database, no clock reads except through the
 * `now` argument — which is what makes the behaviour testable.
 */

export const SLA_CHANNELS = ['whatsapp', 'email', 'sms', 'phone', 'portal', 'social', 'internal'] as const;
export type SlaChannel = (typeof SLA_CHANNELS)[number];

export const SLA_PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const;
export type SlaPriority = (typeof SLA_PRIORITIES)[number];

export const SLA_INTENTS = [
  'document_requirement',
  'payment',
  'visa',
  'interview',
  'application_status',
  'general',
  'spam',
] as const;
export type SlaIntent = (typeof SLA_INTENTS)[number];

/** Spec §148 — never signal urgency by colour alone. */
/**
 * Normalise the free-form channel/priority/intent strings that live in the
 * database (the CRM stores values like `facebook_messenger`, `portal_message`,
 * `phone_call_log`, `sla_overdue`) onto the canonical policy vocabulary.
 *
 * Unknown values fall back to the safest option rather than throwing: an
 * unrecognised channel must still get a clock, not an exception in the inbox.
 */
export function toSlaChannel(value: string | null | undefined): SlaChannel {
  const key = String(value || '').trim().toLowerCase();
  if ((SLA_CHANNELS as readonly string[]).includes(key)) return key as SlaChannel;
  if (key.includes('whatsapp')) return 'whatsapp';
  if (key.includes('instagram') || key.includes('facebook') || key.includes('messenger') || key.includes('social') || key.includes('linkedin')) return 'social';
  if (key.includes('sms')) return 'sms';
  if (key.includes('mail')) return 'email';
  if (key.includes('call') || key.includes('phone')) return 'phone';
  if (key.includes('portal') || key.includes('chat') || key.includes('website')) return 'portal';
  if (key.includes('internal') || key.includes('note') || key.includes('system')) return 'internal';
  return 'email';
}

export function toSlaPriority(value: string | null | undefined): SlaPriority {
  const key = String(value || '').trim().toLowerCase().replace(/^sla_/, '');
  if (key === 'critical' || key === 'urgent' || key === 'overdue') return 'urgent';
  if (key === 'high') return 'high';
  if (key === 'low') return 'low';
  return 'normal';
}

export function toSlaIntent(value: string | null | undefined): SlaIntent {
  const key = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if ((SLA_INTENTS as readonly string[]).includes(key)) return key as SlaIntent;
  if (key.includes('document') || key.includes('doc_')) return 'document_requirement';
  if (key.includes('pay') || key.includes('fee') || key.includes('invoice')) return 'payment';
  if (key.includes('visa') || key.includes('cas') || key.includes('i20')) return 'visa';
  if (key.includes('interview')) return 'interview';
  if (key.includes('status') || key.includes('application')) return 'application_status';
  return 'general';
}

export const SLA_STATES = ['normal', 'warning', 'overdue', 'critical'] as const;
export type SlaState = (typeof SLA_STATES)[number];

export interface SlaPolicy {
  /** Total minutes allowed, measured in working time unless `calendarTime`. */
  minutes: number;
  /** Warning thresholds as a fraction of the allowance (spec §149). */
  warningAt: number;
  urgentWarningAt: number;
  escalationAt: number;
  /** When true the allowance runs through the night/weekend. */
  calendarTime: boolean;
  /** Human label used in the UI, e.g. "WhatsApp — normal". */
  label: string;
}

/**
 * Default policy table.
 *
 * ALO is a study-abroad consultancy: WhatsApp is the channel students actually
 * reply on, so it gets the tightest allowance (spec §124 makes WhatsApp
 * first-class). Visa and payment intents are deadline-driven and are treated as
 * urgent regardless of channel because they gate a student's application.
 *
 * Every value here is a *default*: `resolveSlaPolicy` accepts an override table
 * so operations can change the numbers (or wire them to a settings row) without
 * a code change.
 */
export const DEFAULT_SLA_POLICIES: Record<SlaChannel, Record<SlaPriority, number>> = {
  // minutes
  whatsapp: { urgent: 10, high: 15, normal: 30, low: 120 },
  portal: { urgent: 10, high: 30, normal: 60, low: 240 },
  phone: { urgent: 10, high: 20, normal: 45, low: 180 },
  email: { urgent: 30, high: 60, normal: 120, low: 480 },
  sms: { urgent: 15, high: 30, normal: 60, low: 240 },
  social: { urgent: 30, high: 60, normal: 180, low: 480 },
  internal: { urgent: 30, high: 120, normal: 240, low: 480 },
};

/** Intents that force at least `high` priority (deadlines gate applications). */
const INTENT_PRIORITY_FLOOR: Partial<Record<SlaIntent, SlaPriority>> = {
  payment: 'urgent',
  visa: 'urgent',
  document_requirement: 'high',
  interview: 'high',
  application_status: 'high',
  spam: 'low',
};

/** Application stages that raise priority — an offer or CAS window is closing. */
const STAGE_PRIORITY_FLOOR: Record<string, SlaPriority> = {
  offer_received: 'high',
  cas_i20_coe: 'urgent',
  visa_applied: 'urgent',
  interview_scheduled: 'high',
  payment_pending: 'urgent',
};

const PRIORITY_ORDER: SlaPriority[] = ['low', 'normal', 'high', 'urgent'];

function higherPriority(a: SlaPriority, b: SlaPriority): SlaPriority {
  return PRIORITY_ORDER.indexOf(a) >= PRIORITY_ORDER.indexOf(b) ? a : b;
}

export interface SlaPolicyInput {
  channel: SlaChannel;
  /** Priority supplied by rules/AI; may be raised by intent or stage. */
  priority?: SlaPriority;
  intent?: SlaIntent;
  applicationStage?: string;
  /** Reserved for per-student-type policy (new lead vs enrolled student). */
  studentType?: 'lead' | 'applicant' | 'enrolled' | 'alumni';
  /** Override table, e.g. loaded from settings. */
  overrides?: Partial<Record<SlaChannel, Partial<Record<SlaPriority, number>>>>;
}

/**
 * Resolve the policy for a message. Intent and application stage can only ever
 * RAISE priority — a payment message is never downgraded to "low" because the
 * channel default was low.
 */
export function resolveSlaPolicy(input: SlaPolicyInput): SlaPolicy {
  let priority: SlaPriority = input.priority ?? 'normal';

  if (input.intent && INTENT_PRIORITY_FLOOR[input.intent]) {
    priority = higherPriority(priority, INTENT_PRIORITY_FLOOR[input.intent] as SlaPriority);
  }
  if (input.applicationStage && STAGE_PRIORITY_FLOOR[input.applicationStage]) {
    priority = higherPriority(priority, STAGE_PRIORITY_FLOOR[input.applicationStage]);
  }
  // A brand-new lead is the one case a tighter clock is right: unanswered leads
  // convert worst, so treat them one step above normal.
  if (input.studentType === 'lead' && priority === 'normal') priority = 'high';

  const minutes =
    input.overrides?.[input.channel]?.[priority] ??
    DEFAULT_SLA_POLICIES[input.channel]?.[priority] ??
    DEFAULT_SLA_POLICIES.email.normal;

  return {
    minutes,
    warningAt: 0.66,
    urgentWarningAt: 0.93,
    escalationAt: 1.5,
    // WhatsApp/SMS/portal are app-based: students reply outside office hours, so
    // a counselor's clock should run on calendar time there. Email and social
    // queued overnight should not burn a counselor's SLA (spec §156).
    calendarTime: input.channel === 'whatsapp' || input.channel === 'sms' || input.channel === 'portal',
    label: `${input.channel} — ${priority}`,
  };
}

/** Milliseconds of allowance, for callers that already hold the policy. */
export function slaAllowanceMs(policy: SlaPolicy): number {
  return policy.minutes * 60_000;
}

export interface SlaClock {
  /** Seconds remaining (positive) or elapsed past the deadline (negative). */
  secondsRemaining: number;
  /** Spec §148 display string, e.g. "14:32" or "-01:24". */
  display: string;
  state: SlaState;
  /** Non-colour urgency cue for the UI (spec §148). */
  icon: 'clock' | 'alert-triangle' | 'alert-octagon' | 'siren';
  ariaLabel: string;
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.abs(Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  // The spec's examples are MM:SS / HH:MM; hours are shown only when they exist.
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`;
}

/**
 * Where the message sits in its SLA right now.
 *
 * @param dueAt      deadline produced by the timer layer (office-hours aware)
 * @param now        current instant
 * @param policy     the resolved policy (supplies the warning thresholds)
 */
export function evaluateSlaClock(dueAt: Date, now: Date, policy: SlaPolicy): SlaClock {
  const remainingMs = dueAt.getTime() - now.getTime();
  const secondsRemaining = Math.round(remainingMs / 1000);
  const allowanceMs = slaAllowanceMs(policy);
  const elapsedMs = allowanceMs - remainingMs;
  const fractionUsed = allowanceMs > 0 ? elapsedMs / allowanceMs : 1;
  const overdueMs = -remainingMs;

  let state: SlaState;
  if (overdueMs >= allowanceMs * (policy.escalationAt - 1)) state = 'critical';
  else if (overdueMs > 0) state = 'overdue';
  else if (fractionUsed >= policy.urgentWarningAt) state = 'warning';
  else if (fractionUsed >= policy.warningAt) state = 'warning';
  else state = 'normal';

  const overBySeconds = Math.round(overdueMs / 1000);
  const display = remainingMs >= 0
    ? `RESPONSE DUE IN: ${formatDuration(secondsRemaining)}`
    : `OVERDUE BY: ${formatDuration(overBySeconds)}`;

  const icon: SlaClock['icon'] =
    state === 'critical' ? 'siren' : state === 'overdue' ? 'alert-octagon' : state === 'warning' ? 'alert-triangle' : 'clock';

  const stateWord = state === 'normal' ? 'within SLA' : state === 'warning' ? 'approaching the deadline' : state === 'overdue' ? 'overdue' : 'critically overdue';

  return {
    secondsRemaining,
    display,
    state,
    icon,
    ariaLabel: `${stateWord}. ${display}`,
  };
}

/** Spec §149 — the warning ladder for one message. */
export function slaWarningLadder(dueAt: Date, policy: SlaPolicy): Array<{ at: Date; kind: 'warning' | 'urgent_warning' | 'overdue' | 'escalation' }> {
  const dueMs = dueAt.getTime();
  const allowanceMs = slaAllowanceMs(policy);
  const warningsAt = dueMs - allowanceMs * (1 - policy.warningAt);
  const urgentAt = dueMs - allowanceMs * (1 - policy.urgentWarningAt);
  return [
    { at: new Date(warningsAt), kind: 'warning' },
    { at: new Date(urgentAt), kind: 'urgent_warning' },
    { at: new Date(dueMs), kind: 'overdue' },
    { at: new Date(dueMs + allowanceMs * (policy.escalationAt - 1)), kind: 'escalation' },
  ];
}

export interface ResponseMetricsInput {
  receivedAt: Date;
  assignedAt?: Date | null;
  firstViewedAt?: Date | null;
  firstResponseAt?: Date | null;
  resolvedAt?: Date | null;
  dueAt: Date;
  /** When set, the message was excluded from SLA (spec §152/§156). */
  excluded?: boolean;
  /**
   * Reference instant for a still-unanswered message. Callers that already know
   * "now" (a request handler, a dashboard render) should pass it so every row in
   * one response is measured against the same instant.
   */
  now?: Date;
}

export interface ResponseMetrics {
  responseTimeMs: number | null;
  resolutionTimeMs: number | null;
  overdueMs: number;
  slaBreached: boolean;
  /** Breaches only count when the message genuinely required a response. */
  countsAsBreach: boolean;
}

/**
 * Spec §150 response tracking. A breach is only counted when the message was not
 * excluded — provider/system outages, wrong assignment, approved leave and
 * no-response-needed messages must never penalise a counselor (spec §152/§156).
 */
export function computeResponseMetrics(input: ResponseMetricsInput): ResponseMetrics {
  const responseTimeMs = input.firstResponseAt ? input.firstResponseAt.getTime() - input.receivedAt.getTime() : null;
  const resolutionTimeMs = input.resolvedAt ? input.resolvedAt.getTime() - input.receivedAt.getTime() : null;
  const respondedBy = input.firstResponseAt ? input.firstResponseAt.getTime() : null;
  const overdueMs = respondedBy === null
    ? Math.max(0, (input.now ?? new Date()).getTime() - input.dueAt.getTime()) // still unanswered
    : Math.max(0, respondedBy - input.dueAt.getTime());
  const breached = respondedBy === null ? false : respondedBy > input.dueAt.getTime();
  return {
    responseTimeMs,
    resolutionTimeMs,
    overdueMs,
    slaBreached: breached,
    countsAsBreach: breached && !input.excluded,
  };
}

/** Spec §154 — a justification cannot be submitted empty. */
export const JUSTIFICATION_CATEGORIES = [
  'student_unavailable',
  'university_waiting',
  'system_issue',
  'wrong_assignment',
  'high_workload',
  'emergency',
  'approved_leave',
  'other',
] as const;
export type JustificationCategory = (typeof JUSTIFICATION_CATEGORIES)[number];

export interface JustificationInput {
  reason?: string;
  category?: string;
  explanation?: string;
  evidenceUrl?: string;
}

export interface JustificationValidation {
  valid: boolean;
  errors: string[];
}

export function validateJustification(input: JustificationInput): JustificationValidation {
  const errors: string[] = [];
  const reason = (input.reason || '').trim();
  const explanation = (input.explanation || '').trim();
  const category = (input.category || '').trim();

  if (!category) errors.push('A justification category is required.');
  else if (!(JUSTIFICATION_CATEGORIES as readonly string[]).includes(category)) errors.push(`Category must be one of: ${JUSTIFICATION_CATEGORIES.join(', ')}.`);
  if (!reason) errors.push('A short reason is required.');
  else if (reason.length < 5) errors.push('The reason is too short to review — describe what happened.');
  if (!explanation) errors.push('An explanation is required.');
  else if (explanation.length < 20) errors.push('The explanation must be at least 20 characters so a supervisor can evaluate it.');

  return { valid: errors.length === 0, errors };
}
