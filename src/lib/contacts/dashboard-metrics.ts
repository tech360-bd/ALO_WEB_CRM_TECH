/**
 * CONTACT DASHBOARD — the sixteen metrics, defined once (brief Phase 2 §6)
 * ========================================================================
 * Each metric has exactly one definition here, and the route can only publish a
 * value that this layer accepts. That matters because a dashboard is the easiest
 * place in a CRM to publish a number nobody can reproduce.
 *
 * Rules this module enforces:
 *
 *  - **No invented numbers.** A metric whose query failed is returned with
 *    `status: 'UNAVAILABLE'` and `value: null`. It is never displayed as 0, because
 *    "no data" and "zero" mean opposite things to whoever reads the dashboard.
 *  - **Every metric states its own definition and source** in the payload, so the
 *    number can be checked against the database without reading this file.
 *  - **Range-scoped and current-value metrics are distinguished.** "Opted out" is a
 *    current state, not a period count; claiming otherwise would be a lie of the
 *    subtlest kind. `rangeScoped: false` is displayed as "current".
 *  - **Branch scope is a fact in the response, not a hidden default** — a forced
 *    filter for a branch user is reported as forced.
 *  - **A person is counted once.** Rows that are aliases of another contact
 *    (`merged_into:` tag) are excluded from contact totals and reported separately,
 *    so a merge cannot inflate the headline number.
 */

export type MetricKey =
  | 'contacts_total'
  | 'contacts_new_in_range'
  | 'contacts_linked_to_student'
  | 'contacts_lead_only'
  | 'contacts_unlinked'
  | 'contacts_opted_out'
  | 'contacts_blocked'
  | 'alias_contacts'
  | 'duplicate_groups'
  | 'match_reviews_pending'
  | 'messages_inbound'
  | 'messages_outbound'
  | 'conversations_active'
  | 'follow_ups_scheduled'
  | 'follow_ups_overdue'
  | 'student_link_coverage';

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  /** Exactly how the number is calculated. Rendered in the UI next to the value. */
  definition: string;
  /** Which tables it comes from. */
  source: string;
  unit: 'count' | 'percent';
  /** True when the value depends on the selected date range. */
  rangeScoped: boolean;
  /** True when the selected branch filter changes the value. */
  branchScoped: boolean;
  /** True when more than one reading is required to compute it. */
  derived?: boolean;
}

export const DASHBOARD_METRICS: readonly MetricDefinition[] = [
  {
    key: 'contacts_total',
    label: 'Contacts (person records)',
    definition: 'Count of contact registry rows in scope that are not aliases of another contact.',
    source: 'WhatsAppContact (tags without merged_into:)',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'contacts_new_in_range',
    label: 'New contacts in range',
    definition: 'Contact registry rows created between the range start and end (inclusive).',
    source: 'WhatsAppContact.createdAt',
    unit: 'count',
    rangeScoped: true,
    branchScoped: true,
  },
  {
    key: 'contacts_linked_to_student',
    label: 'Linked to a student',
    definition: 'Person records with a non-empty studentId — i.e. the number is proven to belong to a registered student.',
    source: 'WhatsAppContact.studentId',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'contacts_lead_only',
    label: 'Lead only (no student)',
    definition: 'Person records with a leadId and no studentId. These people exist in the pipeline but have no Student ID.',
    source: 'WhatsAppContact.leadId, studentId',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'contacts_unlinked',
    label: 'Unlinked contacts',
    definition: 'Person records with no studentId, leadId or partnerId — e.g. an unknown inbound number recorded as an unverified contact.',
    source: 'WhatsAppContact.studentId, leadId, partnerId',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'contacts_opted_out',
    label: 'Opted out',
    definition: 'Person records with isOptedOut = true. Current state, not a period count — consent is never "reset" by a date range.',
    source: 'WhatsAppContact.isOptedOut',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'contacts_blocked',
    label: 'Blocked',
    definition: 'Person records with isBlocked = true.',
    source: 'WhatsAppContact.isBlocked',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'alias_contacts',
    label: 'Merged aliases',
    definition: 'Rows that are aliases of another contact after a confirmed merge. Excluded from contact totals; their numbers stay searchable.',
    source: 'WhatsAppContact (tags containing merged_into:)',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'duplicate_groups',
    label: 'Possible duplicate groups',
    definition:
      'Groups of two or more person records sharing an exact normalised phone or email, computed over the most recent contacts in scope (sample capped at 1000 rows and stated in the response).',
    source: 'WhatsAppContact + buildDuplicateReviewGroups()',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'match_reviews_pending',
    label: 'Match reviews pending',
    definition: 'ContactMatchReview rows with status PENDING that belong to a number visible in the caller\'s scope.',
    source: 'ContactMatchReview',
    unit: 'count',
    rangeScoped: false,
    branchScoped: true,
  },
  {
    key: 'messages_inbound',
    label: 'Inbound messages in range',
    definition: 'Archived WhatsApp messages with direction = inbound whose timestamp falls in the range.',
    source: 'WhatsAppMessageArchive.direction, timestamp',
    unit: 'count',
    rangeScoped: true,
    branchScoped: false,
  },
  {
    key: 'messages_outbound',
    label: 'Outbound messages in range',
    definition: 'Archived WhatsApp messages with direction = outbound whose timestamp falls in the range.',
    source: 'WhatsAppMessageArchive.direction, timestamp',
    unit: 'count',
    rangeScoped: true,
    branchScoped: false,
  },
  {
    key: 'conversations_active',
    label: 'Conversations active in range',
    definition: 'Unified-communication conversations whose last message arrived in the range.',
    source: 'UccConversation.lastMessageAt',
    unit: 'count',
    rangeScoped: true,
    branchScoped: false,
  },
  {
    key: 'follow_ups_scheduled',
    label: 'Follow-ups scheduled',
    definition: 'WhatsApp follow-up schedules still in status scheduled and not paused — the automated day 3/7/14/21/25/30 queue.',
    source: 'WhatsAppFollowUpSchedule.status, isPaused',
    unit: 'count',
    rangeScoped: false,
    branchScoped: false,
  },
  {
    key: 'follow_ups_overdue',
    label: 'Follow-ups overdue',
    definition: 'Schedules whose scheduledAt is in the past and are still scheduled — the number an operator must act on today.',
    source: 'WhatsAppFollowUpSchedule.scheduledAt, status',
    unit: 'count',
    rangeScoped: false,
    branchScoped: false,
  },
  {
    key: 'student_link_coverage',
    label: 'Student link coverage',
    definition: 'contacts_linked_to_student ÷ contacts_total × 100, rounded to one decimal. Derived from two readings above; null when the denominator is zero.',
    source: 'Derived (WhatsAppContact)',
    unit: 'percent',
    rangeScoped: false,
    branchScoped: true,
    derived: true,
  },
] as const;

export type MetricStatus = 'OK' | 'UNAVAILABLE';

export interface MetricResult extends MetricDefinition {
  value: number | null;
  status: MetricStatus;
  /** Present when status is UNAVAILABLE. */
  reason?: string;
}

export interface MetricReading {
  value: number | null;
  /** Why it is null, when it is. */
  reason?: string;
}

export type MetricInputs = Partial<Record<MetricKey, MetricReading>>;

/**
 * Combine the readings into the published metric list.
 *
 * Every metric in `DASHBOARD_METRICS` appears in the output exactly once, in a fixed
 * order, whether or not a reading was supplied — so the UI cannot silently drop a
 * metric that a query forgot to run.
 */
export function buildDashboardMetrics(inputs: MetricInputs): MetricResult[] {
  return DASHBOARD_METRICS.map((definition) => {
    if (definition.derived) {
      const numerator = inputs.contacts_linked_to_student?.value ?? null;
      const denominator = inputs.contacts_total?.value ?? null;
      if (numerator === null || denominator === null) {
        return {
          ...definition,
          value: null,
          status: 'UNAVAILABLE',
          reason: 'Requires both the student-linked count and the total contact count.',
        };
      }
      if (denominator === 0) {
        return { ...definition, value: null, status: 'OK', reason: 'No contacts in scope yet, so there is no coverage figure to show.' };
      }
      return { ...definition, value: Math.round((numerator / denominator) * 1000) / 10, status: 'OK' };
    }

    const reading = inputs[definition.key];
    if (!reading || reading.value === null || !Number.isFinite(reading.value)) {
      return {
        ...definition,
        value: null,
        status: 'UNAVAILABLE',
        reason: reading?.reason || 'The database reading for this metric was not available.',
      };
    }
    return { ...definition, value: reading.value, status: 'OK' };
  });
}

export interface ResolvedRange {
  from: Date;
  to: Date;
  days: number;
  /** ISO dates for the response, so the caller can quote exactly what was measured. */
  fromIso: string;
  toIso: string;
  /** True when the caller supplied no range and the default was applied. */
  defaulted: boolean;
  /** Present when the input was rejected and clamped. */
  adjustment?: string;
}

const MAX_RANGE_DAYS = 366;
const DEFAULT_RANGE_DAYS = 90;

/**
 * Resolve the date range.
 *
 * Rejects rather than silently accepts: a reversed range would produce a
 * confidently empty dashboard, which is worse than an error.
 */
export function resolveDateRange(
  from: string | null | undefined,
  to: string | null | undefined,
  now: Date = new Date(),
): ResolvedRange {
  const parse = (value: string | null | undefined): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const requestedTo = parse(to);
  const requestedFrom = parse(from);
  const defaulted = !requestedFrom && !requestedTo;
  let adjustment: string | undefined;

  const end = requestedTo ?? now;
  const start = requestedFrom ?? new Date(end.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  if (start.getTime() > end.getTime()) {
    throw new Error('The range start must be before the range end.');
  }

  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  if (days > MAX_RANGE_DAYS) {
    const clamped = new Date(end.getTime() - MAX_RANGE_DAYS * 24 * 60 * 60 * 1000);
    adjustment = `The requested range was ${days} days; results are limited to the most recent ${MAX_RANGE_DAYS} days.`;
    return {
      from: clamped,
      to: end,
      days: MAX_RANGE_DAYS,
      fromIso: clamped.toISOString(),
      toIso: end.toISOString(),
      defaulted,
      adjustment,
    };
  }

  return { from: start, to: end, days, fromIso: start.toISOString(), toIso: end.toISOString(), defaulted };
}

export interface BranchDecision {
  /** The branch actually applied to branch-scoped queries, or null for all branches. */
  branch: string | null;
  /** True when a branch filter was applied. */
  applied: boolean;
  /** True when the caller's role forced their own branch regardless of the request. */
  forced: boolean;
  reason: string;
}

/**
 * Decide the branch filter.
 *
 * A caller without company-wide access is pinned to their own branch: a query
 * parameter must never widen someone's visibility (§17). A caller with company-wide
 * access may choose one branch or none (all branches).
 */
export function resolveBranchFilter(input: {
  requestedBranch: string | null;
  callerBranch: string | null;
  companyWide: boolean;
}): BranchDecision {
  const requested = (input.requestedBranch || '').trim().slice(0, 120);
  if (!input.companyWide) {
    const own = (input.callerBranch || '').trim();
    if (!own) {
      return {
        branch: null,
        applied: false,
        forced: false,
        reason: 'Your role has no branch assigned, so branch-scoped metrics cover your assignment scope only.',
      };
    }
    return {
      branch: own,
      applied: true,
      forced: true,
      reason: requested && requested !== own
        ? `Branch metrics are fixed to your own branch (${own}); the requested branch was ignored.`
        : `Branch metrics cover your own branch (${own}).`,
    };
  }
  if (requested) {
    return { branch: requested, applied: true, forced: false, reason: `Branch metrics filtered to ${requested}.` };
  }
  return { branch: null, applied: false, forced: false, reason: 'All branches included (company-wide access).' };
}

/** Payload-level caveats, kept next to the definitions so they cannot drift. */
export function dashboardCaveats(input: { sampled: boolean; sampleSize: number; unavailable: string[] }): string[] {
  const caveats = [
    'A metric reading of null means the query could not be completed; it is never displayed as zero.',
    'Opt-out, block, alias and coverage metrics are current states, not period counts.',
  ];
  if (input.sampled) {
    caveats.push(`Duplicate groups are computed over the most recent ${input.sampleSize} contacts in scope, not the entire registry.`);
  }
  if (input.unavailable.length > 0) {
    caveats.push(`Unavailable in this response: ${input.unavailable.join(', ')}.`);
  }
  return caveats;
}
