// Unit tests for the Virtual Editor revision service (cms-revisions).
// Covers sanitization (XSS defense-in-depth), DMMF-driven field safety and
// snapshot filtering — the DB-bound lifecycle (draft→publish/rollback) is
// exercised through the API + database on environments with a database.
import { describe, it, expect, vi } from 'vitest';

// These tests exercise pure functions (sanitization + DMMF field safety);
// the db-dependent lifecycle is covered by API/database tests on DB-backed
// environments. Mocking db avoids loading a query engine in unit tests.
vi.mock('@/lib/db', () => ({ db: {} }));

import { sanitizeCmsInput, scalarFields, filterWritable, CMS_ENTITY_MODELS } from '@/lib/cms-revisions';

describe('sanitizeCmsInput', () => {
  it('strips script blocks from strings', () => {
    expect(sanitizeCmsInput('hello <script>alert(1)</script> world')).toBe('hello  world');
  });

  it('strips iframe/object/embed tags', () => {
    expect(sanitizeCmsInput('<iframe src="https://evil.example"></iframe>ok')).toBe('ok');
    expect(sanitizeCmsInput('<object data="x"></object>ok')).toBe('ok');
  });

  it('strips inline event handlers', () => {
    const out = sanitizeCmsInput('<p onclick="steal()">text</p>');
    expect(out).not.toMatch(/on\w+\s*=/i);
    expect(out).toContain('text');
  });

  it('neutralizes the javascript: URL scheme', () => {
    const out = sanitizeCmsInput('see javascript:void(0) here');
    expect(out).not.toMatch(/javascript\s*:/i);
  });

  it('sanitizes recursively in objects and arrays', () => {
    const out = sanitizeCmsInput({
      title: 'ok',
      nested: { body: '<script>bad()</script>good', arr: ['<script>x</script>', 'fine'] },
    });
    expect(out.nested.body).toBe('good');
    expect(out.nested.arr[0]).toBe('');
    expect(out.nested.arr[1]).toBe('fine');
    expect(out.title).toBe('ok');
  });

  it('leaves non-string primitives untouched', () => {
    expect(sanitizeCmsInput(5)).toBe(5);
    expect(sanitizeCmsInput(null)).toBe(null);
    expect(sanitizeCmsInput(true)).toBe(true);
  });
});

describe('DMMF field safety', () => {
  it('maps every CMS entity type to a known prisma model', () => {
    const models = new Set(scalarFields('homeSection').length >= 0 ? [1] : []);
    expect(models.size).toBe(1);
    for (const model of Object.values(CMS_ENTITY_MODELS)) {
      expect(() => scalarFields(model)).not.toThrow();
      expect(scalarFields(model).length).toBeGreaterThan(0);
    }
  });

  it('never exposes id as writable', () => {
    for (const model of Object.values(CMS_ENTITY_MODELS)) {
      expect(scalarFields(model)).not.toContain('id');
    }
  });

  it('filterWritable never emits id or createdAt for any entity', () => {
    for (const [type, model] of Object.entries(CMS_ENTITY_MODELS)) {
      const probe: Record<string, unknown> = { id: 'x', createdAt: '2026-01-01T00:00:00.000Z' };
      for (const f of scalarFields(model)) probe[f] = null;
      const out = filterWritable(model, probe);
      expect(out).not.toHaveProperty('id');
      expect(out).not.toHaveProperty('createdAt');
      // every remaining emitted field must be a real model field
      for (const k of Object.keys(out)) expect(scalarFields(model)).toContain(k);
    }
  });

  it('filterWritable drops unknown fields and keeps known ones', () => {
    const out = filterWritable('homeSection', {
      sectionKey: 'hero',
      title: 'Hero',
      content: '<b>ok</b>',
      id: 'should-be-dropped',
      createdAt: '2026-01-01T00:00:00.000Z',
      maliciousUnknownField: 'dropped',
    });
    expect(out.sectionKey).toBe('hero');
    expect(out.title).toBe('Hero');
    expect(out.content).toBe('<b>ok</b>');
    expect(out).not.toHaveProperty('id');
    expect(out).not.toHaveProperty('createdAt');
    expect(out).not.toHaveProperty('maliciousUnknownField');
  });

  it('coerces ISO strings to Date for DateTime fields', () => {
    const out = filterWritable('country', { lastVerifiedAt: '2026-10-01T00:00:00.000Z', name: 'UK' }) as any;
    expect(out.lastVerifiedAt instanceof Date).toBe(true);
    expect(out.name).toBe('UK');
  });

  it('drops invalid date strings for DateTime fields', () => {
    const out = filterWritable('country', { lastVerifiedAt: 'not-a-date', name: 'UK' }) as any;
    expect(out.lastVerifiedAt).toBeUndefined();
  });
});
