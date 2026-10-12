'use client';

/**
 * Browser-only compare list (course identifiers, max 4). Holds identifiers
 * only; every value shown on the Compare page is re-fetched from the public,
 * verified-only API, so nothing stale or unverified is displayed from here.
 */
export const COMPARE_MAX = 4;
const KEY = 'alo-compare-courses';
const EVENT = 'alo-compare-changed';

export function readCompareList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 191).slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
}

export function writeCompareList(ids: string[]): string[] {
  const next = [...new Set(ids)].slice(0, COMPARE_MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable: the list simply is not persisted */
  }
  return next;
}

/** Adds or removes an identifier. Returns the new list, or null when the list is full. */
export function toggleCompare(id: string): string[] | null {
  const list = readCompareList();
  if (list.includes(id)) return writeCompareList(list.filter((x) => x !== id));
  if (list.length >= COMPARE_MAX) return null;
  return writeCompareList([...list, id]);
}

export function subscribeCompare(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}
