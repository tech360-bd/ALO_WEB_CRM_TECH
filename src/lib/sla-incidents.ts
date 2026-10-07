// ============================================================================
// ALO SLA fair governance — counselor incident counters & warning (§152/§153)
//
// §152: counselor SLA incident counter per rolling period. Breaches are only
// counted when no valid exclusion applies (provider outage, system outage,
// incorrect assignment, holiday/non-working hours, approved leave, technical
// failure, message not requiring response, duplicate message).
//
// §153: when the configured threshold is reached (default 5, overridable via
// policy), a COUNSELOR PERFORMANCE WARNING is issued exactly once per period,
// carrying the evidence list required for the justification flow (§154).
//
// Pure computing happens here; db effects live in the route. Unit-testable.
// ============================================================================

export const SLA_INCIDENT_THRESHOLD_DEFAULT = 5;

export const VALID_EXCLUSION_REASONS = new Set([
  "provider_outage",
  "system_outage",
  "wrong_assignment",
  "holiday_or_non_working_hours",
  "approved_leave",
  "technical_failure",
  "no_response_required",
  "duplicate_message",
  "excluded_by_manager",
]);

export interface SlaEventView {
  id: string;
  threadId: string;
  counselorId: string;
  channel: string;
  eventType: string; // warning | overdue | escalation | resolved | ...
  resolvedAt?: Date | string | null;
  /** Manager-set exclusions ("excluded") or justification-accepted reviews. */
  resolution?: string | null;
  createdAt: Date | string;
}

export interface ExclusionWindow {
  /** Provider/system outage windows from ProviderErrorLog (provider+"system"). */
  outageFrom: Date;
  outageTo: Date;
}

export interface AssertedExclusions {
  /** Event id -> reason, e.g. from ACCEPTED justifications. */
  byEventId: Map<string, string>;
}

export interface IncidentEvaluation {
  counselorId: string;
  period: string;
  totalAssigned: number;
  requiredResponses: number;
  slaBreaches: number;
  validExclusionsPerEvent: Record<string, string>;
  breachEventIds: string[];
  threshold: number;
  warningRequired: boolean; // thresholds crossed
}

/** Overdue/breach events attributable to a counselor, exclusion-adjusted. */
export function evaluateIncidentPeriod(params: {
  counselorId: string;
  period: string; // "2026-01"
  events: SlaEventView[]; // all events for the period, any counselor
  outageWindows?: ExclusionWindow[];
  assertedExclusions?: AssertedExclusions;
  threshold?: number;
  /** ISO dates that are holidays for the period (from the holiday calendar). */
  holidayDates?: string[];
}): IncidentEvaluation {
  const threshold =
    typeof params.threshold === "number" && params.threshold > 0
      ? Math.floor(params.threshold)
      : SLA_INCIDENT_THRESHOLD_DEFAULT;

  const outageWindows = params.outageWindows ?? [];
  const asserted = params.assertedExclusions?.byEventId ?? new Map<string, string>();
  const holidays = new Set(params.holidayDates ?? []);

  const own = params.events.filter((e) => e.counselorId === params.counselorId);
  const validExclusionsPerEvent: Record<string, string> = {};
  const breachEventIds: string[] = [];

  for (const event of own) {
    const isBreachType = event.eventType === "overdue" || event.eventType === "escalation";
    if (!isBreachType) continue;

    const exclusion = firstValidExclusion(event, outageWindows, asserted, holidays);
    if (exclusion) {
      validExclusionsPerEvent[event.id] = exclusion;
      continue;
    }
    breachEventIds.push(event.id);
  }

  return {
    counselorId: params.counselorId,
    period: params.period,
    totalAssigned: own.length,
    requiredResponses:
      own.filter((e) => e.eventType !== "no_response_required").length,
    slaBreaches: breachEventIds.length,
    validExclusionsPerEvent,
    breachEventIds,
    threshold,
    warningRequired: breachEventIds.length >= threshold,
  };
}

function firstValidExclusion(
  event: SlaEventView,
  outageWindows: ExclusionWindow[],
  asserted: Map<string, string>,
  holidays: Set<string>,
): string | null {
  // Excluded by manager review / accepted justification.
  if (event.resolution === "excluded" || event.resolution === "excluded_by_manager") {
    return VALID_EXCLUSION_REASONS.has("excluded_by_manager") ? "excluded_by_manager" : null;
  }
  const viaJustification = asserted.get(event.id);
  if (viaJustification && VALID_EXCLUSION_REASONS.has(normalizeReason(viaJustification))) {
    return normalizeReason(viaJustification);
  }
  // Non-working-hours / holiday at creation.
  const created = new Date(event.createdAt);
  const iso = created.toISOString().slice(0, 10);
  if (holidays.has(iso) || created.getDay() === 5 /* Friday, BD weekend */) {
    return "holiday_or_non_working_hours";
  }
  // Any overlapping outage window counts as provider/system outage.
  const t = created.getTime();
  for (const w of outageWindows) {
    if (t >= w.outageFrom.getTime() && t <= w.outageTo.getTime()) {
      return "provider_outage";
    }
  }
  return null;
}

const REASON_ALIASES: Record<string, string> = {
  STUDENT_UNAVAILABLE: "no_response_required",
  UNIVERSITY_WAITING: "no_response_required",
  SYSTEM_ISSUE: "system_outage",
  WRONG_ASSIGNMENT: "wrong_assignment",
  HIGH_WORKLOAD: "no_response_required",
  EMERGENCY: "approved_leave",
  APPROVED_LEAVE: "approved_leave",
  OTHER: "no_response_required",
};

function normalizeReason(reason: string): string {
  if (VALID_EXCLUSION_REASONS.has(reason)) return reason;
  return REASON_ALIASES[String(reason).toUpperCase()] ?? "no_response_required";
}

/** §153 — the exact payload the performance warning task must carry. */
export function buildPerformanceWarning(ev: IncidentEvaluation): {
  title: string;
  description: string;
} {
  const validExclusions = Object.keys(ev.validExclusionsPerEvent).length;
  return {
    title: `COUNSELOR PERFORMANCE WARNING — ${ev.slaBreaches}/${ev.threshold} SLA breaches in ${ev.period}`,
    description: [
      `Counselor: ${ev.counselorId}`,
      `Period: ${ev.period}`,
      `Total assigned messages: ${ev.totalAssigned}`,
      `Required responses: ${ev.requiredResponses}`,
      `SLA breaches (exclusion-adjusted): ${ev.slaBreaches}`,
      `Valid exclusions applied: ${validExclusions}`,
      `Threshold: ${ev.threshold}`,
      `Related message/event IDs: ${ev.breachEventIds.join(", ") || "(none)"}`,
      "",
      "JUSTIFICATION REQUIRED — counselor must submit reason, category, explanation (§154).",
    ].join("\n"),
  };
}
