/**
 * Minimal, version-tolerant Zod introspection.
 *
 * Zod 3 exposes `_def.typeName` ("ZodObject") and `_def.shape()` as a thunk;
 * Zod 4 exposes `_def.type` ("object") and a plain `shape` object. The AI
 * Workforce needs the field names of an output contract (to tell a runtime
 * what to produce) and a coarse type name (for the Builder UI), so both
 * layouts are handled here rather than pinning a Zod version.
 */
import type { z } from 'zod';

type AnyDef = { typeName?: string; type?: string; shape?: unknown; innerType?: unknown };

function def(schema: unknown): AnyDef {
  return ((schema as { _def?: AnyDef })?._def ?? {}) as AnyDef;
}

/** Coarse type name, lower-cased and without the `Zod` prefix: `object`, `string`, … */
export function zodTypeName(schema: z.ZodTypeAny | unknown): string {
  const d = def(schema);
  if (typeof d.type === 'string') return d.type;
  if (typeof d.typeName === 'string') return d.typeName.replace(/^Zod/, '').toLowerCase();
  return 'unknown';
}

/** Object field map, or null when the schema is not an object. */
export function zodShape(schema: z.ZodTypeAny | unknown): Record<string, unknown> | null {
  const direct = (schema as { shape?: unknown })?.shape;
  if (direct && typeof direct === 'object') return direct as Record<string, unknown>;
  const d = def(schema);
  if (typeof d.shape === 'function') {
    const resolved = (d.shape as () => Record<string, unknown>)();
    return resolved && typeof resolved === 'object' ? resolved : null;
  }
  if (d.shape && typeof d.shape === 'object') return d.shape as Record<string, unknown>;
  return null;
}

/** Top-level field names of an object contract; empty when not an object. */
export function zodFieldNames(schema: z.ZodTypeAny | unknown): string[] {
  const shape = zodShape(schema);
  return shape ? Object.keys(shape) : [];
}

/** Stable, dependency-free description used by the Builder UI and tool registry. */
export function describeZod(schema: z.ZodTypeAny | unknown): Record<string, unknown> {
  const shape = zodShape(schema);
  if (!shape) return { type: zodTypeName(schema) };
  return {
    type: 'object',
    properties: Object.fromEntries(Object.entries(shape).map(([key, value]) => [key, { type: zodTypeName(value) }])),
  };
}
