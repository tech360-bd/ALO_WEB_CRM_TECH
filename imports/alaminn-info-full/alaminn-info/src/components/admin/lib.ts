"use client";

/**
 * Admin fetcher + types
 * ----------------------
 * Tiny wrapper around fetch that:
 *  - sends credentials (signed session cookie)
 *  - parses the { success, data, meta, errors } envelope
 *  - throws on non-2xx so react-query / try-catch can handle it
 */
export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
  errors: string[];
};

export async function adminFetch<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`HTTP ${res.status}: invalid JSON response`);
  }
  if (!res.ok || !json.success) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json;
}

/** Format an ISO date string for display. */
export function fmtDate(iso?: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format an ISO date string for display (date only). */
export function fmtDay(iso?: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Convert a string to a URL slug. */
export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
