/**
 * Shared server-side helpers for Higher Study list pages.
 *
 * These functions are pure (no DB access) and run inside Server
 * Components to translate the URL `searchParams` prop into the typed
 * filter values consumed by `ListPageControls` and the Prisma where
 * clause.
 */
import type { FilterValues } from "@/components/higher-study/filter-panel";

/**
 * Read a single string param from a Next.js searchParams object
 * (which can be string | string[] | undefined).
 */
export function getStringParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

/**
 * Read a comma-separated param into a string[] (empty array if missing).
 */
export function getStringArrayParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string[] {
  const v = params[key];
  if (!v) return [];
  if (Array.isArray(v)) return v.flatMap((s) => s.split(",").map((x) => x.trim()).filter(Boolean));
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Read a boolean param ("true" → true, anything else → undefined).
 */
export function getBooleanParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): boolean | undefined {
  const v = getStringParam(params, key);
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}

/**
 * Read a numeric param (returns undefined if missing/invalid).
 */
export function getNumberParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): number | undefined {
  const v = getStringParam(params, key);
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Read a "min,max" range param into [min, max] (returns undefined if missing).
 */
export function getRangeParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): [number, number] | undefined {
  const v = getStringParam(params, key);
  if (!v) return undefined;
  const parts = v.split(",").map((s) => Number(s.trim()));
  if (parts.length !== 2 || !parts.every((n) => Number.isFinite(n))) return undefined;
  return parts as [number, number];
}

/**
 * Read the `page` param (defaults to 1, clamped to >=1).
 */
export function getPageParam(
  params: Record<string, string | string[] | undefined>,
): number {
  const n = getNumberParam(params, "page") ?? 1;
  return Math.max(1, Math.floor(n));
}

/**
 * Read the `limit` param (defaults to defaultValue, clamped to 1–100).
 */
export function getLimitParam(
  params: Record<string, string | string[] | undefined>,
  defaultValue = 12,
): number {
  const n = getNumberParam(params, "limit") ?? defaultValue;
  return Math.min(100, Math.max(1, Math.floor(n)));
}

/**
 * Read `sort` + `order` params. Order is constrained to asc|desc.
 */
export function getSortParam(
  params: Record<string, string | string[] | undefined>,
  defaultSort = "createdAt",
): { sort: string; order: "asc" | "desc" } {
  const sort = getStringParam(params, "sort") ?? defaultSort;
  const orderRaw = (getStringParam(params, "order") ?? "desc").toLowerCase();
  return { sort, order: orderRaw === "asc" ? "asc" : "desc" };
}

/**
 * Build a FilterValues object from searchParams for the given filter
 * definitions. Each filter's value is parsed according to its type.
 */
export function buildFilterValuesFromParams(
  params: Record<string, string | string[] | undefined>,
  filterNames: Array<{ name: string; type: "text" | "select" | "multiselect" | "range" | "boolean" }>,
): FilterValues {
  const out: FilterValues = {};
  for (const { name, type } of filterNames) {
    switch (type) {
      case "text":
      case "select": {
        const v = getStringParam(params, name);
        out[name] = v ?? null;
        break;
      }
      case "multiselect": {
        out[name] = getStringArrayParam(params, name);
        break;
      }
      case "boolean": {
        out[name] = getBooleanParam(params, name) ?? null;
        break;
      }
      case "range": {
        out[name] = getRangeParam(params, name) ?? null;
        break;
      }
    }
  }
  return out;
}

/**
 * Count how many filters are non-empty (used for the active badge).
 */
export function countActiveFilters(values: FilterValues): number {
  let n = 0;
  for (const v of Object.values(values)) {
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    n++;
  }
  return n;
}

/**
 * Build a Prisma orderBy object from a sort param + a map of allowed
 * sort keys to actual Prisma field paths. Falls back to createdAt desc.
 */
export function buildOrderBy<T extends string>(
  sort: string,
  order: "asc" | "desc",
  allowedSorts: Record<T, string>,
  fallbackField = "createdAt",
): Record<string, "asc" | "desc"> {
  const key = (Object.keys(allowedSorts) as T[]).find((k) => k === sort);
  const field = key ? allowedSorts[key] : fallbackField;
  return { [field]: order };
}
