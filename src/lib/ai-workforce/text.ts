/**
 * ALO AI Workforce — deterministic text analysis primitives.
 *
 * These are ordinary, auditable NLP utilities (tokenisation, stop-word removal,
 * lexical similarity, lexicon scoring). They are the measurable part of the
 * ALO reasoning engine and run with zero external dependencies, which is what
 * lets core workflows execute without any paid AI API.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'have', 'he', 'her',
  'his', 'i', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'she', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'who', 'will', 'with', 'would', 'you', 'your',
]);

export function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.+#-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value: unknown): string[] {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function termFrequency(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const token of tokenize(value)) out[token] = (out[token] || 0) + 1;
  return out;
}

/** Jaccard-style overlap in [0,1] between two token bags. */
export function overlapScore(left: string[], right: string[]): number {
  if (!left.length || !right.length) return 0;
  const a = new Set(left);
  const b = new Set(right);
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

/** Count lexicon hits, weighted. Returns the total weight and the matched terms. */
export function lexiconScore(text: string, lexicon: Record<string, number>): { score: number; matched: string[] } {
  const haystack = ` ${normalize(text)} `;
  let score = 0;
  const matched: string[] = [];
  for (const [term, weight] of Object.entries(lexicon)) {
    if (haystack.includes(` ${normalize(term)} `) || haystack.includes(` ${normalize(term)}`)) {
      score += weight;
      matched.push(term);
    }
  }
  return { score, matched };
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Parse a loosely formatted numeric string such as "6.5", "IELTS 6.5", "£18,000". */
export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/**
 * Parse a date from common ALO data formats (ISO, "15 January 2027",
 * "2027-01", "January 2027"). Returns null when no date can be established —
 * never a guess.
 */
export function parseDateLoose(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}$/.test(raw)) return new Date(`${raw}-01T00:00:00.000Z`);
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  return null;
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`;
}

/** Stable hash used for config hashes, idempotency keys and evidence ids. */
export function stableHash(value: unknown): string {
  const json = JSON.stringify(sortDeep(value));
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < json.length; i += 1) {
    const code = json.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + code, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortDeep(item)])
    );
  }
  return value;
}
