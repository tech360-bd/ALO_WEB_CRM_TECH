/**
 * CANONICAL LEAD REFERENCE (spec §125/§126)
 * =========================================
 * The module brief states the required outcome for an unknown inbound contact
 * verbatim: "If no match → create LEAD-2026-XXXXX, never a full Student."
 *
 * The repository was generating lead references in eight different places with
 * four different formats (`ALO-L-10001`, `ALO-L-<uuid>`, `LEAD-<base36>`,
 * `ALO-AI-…`), and the count-based ones were racy: two webhooks arriving at the
 * same instant both read `count()` and both computed the same reference, so one
 * of them lost the insert. This module is the single generator — sequential
 * where possible, collision-safe always.
 */

export const LEAD_REFERENCE_PREFIX = 'LEAD';

/** Exactly the shape the spec asks for. */
export const LEAD_REFERENCE_PATTERN = /^LEAD-\d{4}-\d{5}$/;

/** `LEAD-2026-00042` */
export function formatLeadReference(year: number, sequence: number): string {
  const safeYear = Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear();
  // Wrap inside the 5-digit space rather than overflowing the format.
  const safeSequence = Math.abs(Math.trunc(sequence)) % 100000;
  return `${LEAD_REFERENCE_PREFIX}-${safeYear}-${String(safeSequence).padStart(5, '0')}`;
}

export function isLeadReference(value: unknown): boolean {
  return typeof value === 'string' && LEAD_REFERENCE_PATTERN.test(value);
}

/**
 * Candidate references to try, best first.
 *
 * The first candidate follows the existing count-based convention (so references
 * stay human-sequential in normal operation); the rest are pseudo-random so a
 * concurrent insert can always be retried instead of failing the webhook.
 *
 * Randomness is only used for *retry*, never for the first attempt, which keeps
 * the sequence readable while remaining collision-proof.
 */
export function leadReferenceCandidates(options: { year?: number; seedSequence?: number; extraAttempts?: number } = {}): string[] {
  const year = options.year ?? new Date().getFullYear();
  const seed = options.seedSequence ?? 1;
  const attempts = Math.max(0, options.extraAttempts ?? 4);
  const candidates: string[] = [formatLeadReference(year, seed)];
  let cursor = Math.abs(Math.trunc(seed)) % 100000;
  for (let index = 0; index < attempts; index += 1) {
    // Deterministic walk of the 5-digit space: no two callers share a retry
    // cursor even when they started from the same seed, and no PRNG is needed.
    cursor = (cursor + 7919 + index * 104729) % 100000;
    const candidate = formatLeadReference(year, cursor);
    if (!candidates.includes(candidate)) candidates.push(candidate);
  }
  return candidates;
}

/** Only a unique-constraint violation should trigger a retry with a new reference. */
export function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'P2002') return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /unique|duplicate/i.test(message) && /leadId|lead/i.test(message);
}

/**
 * The minimal Prisma surface this module needs (keeps it testable with a stub).
 *
 * Prisma's generated `create` is generic over its own argument type, which a
 * structural interface cannot mirror, so the boundary is typed loosely on
 * purpose and narrowed again by the caller through the generic parameter.
 */
export interface LeadWriter {
  count: () => Promise<number>;
  create: (args: { data: any }) => Promise<any>;
}

/**
 * Create a lead with a spec-shaped, collision-safe reference.
 *
 * Returns the created row. Non-unique errors are rethrown untouched — a retry
 * must never mask a real database failure.
 */
export async function createLeadWithReference<T = { id: string }>(
  client: { lead: LeadWriter },
  data: Record<string, unknown>,
  options: { year?: number; tag?: string } = {}
): Promise<T> {
  const year = options.year ?? new Date().getFullYear();
  const count = await client.lead.count().catch(() => 0);
  const candidates = leadReferenceCandidates({ year, seedSequence: count + 1 });

  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const row = await client.lead.create({
        data: {
          ...data,
          leadId: candidate,
          ...(options.tag ? { sourceDetail: [data.sourceDetail, options.tag].filter(Boolean).join(' · ') } : {}),
        },
      });
      return row as T;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      lastError = error;
    }
  }

  throw lastError ?? new Error('Could not allocate a unique lead reference.');
}
