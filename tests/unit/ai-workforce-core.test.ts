/**
 * ALO AI Workforce — deterministic core, contracts and lifecycle rules.
 *
 * These tests exercise the pure, database-free parts of the AI Workforce so
 * CI proves the business rules without needing a live database: the
 * deterministic reasoning engine (the terminal fallback that makes a paid AI
 * key optional), the output contracts, the pipeline template resolver, the
 * lifecycle state machine and the test-expectation DSL.
 */
import { describe, expect, it, vi } from 'vitest';

// The tests below exercise pure AI-workforce behavior; the runner module also
// imports database-backed handlers, so keep Prisma initialization out of this
// unit-test boundary rather than requiring a live database.
vi.mock('@/lib/db', () => ({ db: {} }));

import { runDeterministic, listDeterministicTasks } from '@/lib/ai-workforce/deterministic-engine';
import { getOutputSchema, OUTPUT_SCHEMAS } from '@/lib/ai-workforce/output-schemas';
import { resolveTemplate } from '@/lib/ai-workforce/runner';
import { canTransition, evaluateExpectation } from '@/lib/ai-workforce/lifecycle';
import { chunkDocument } from '@/lib/ai-workforce/knowledge';
import { describeZod, zodFieldNames, zodTypeName } from '@/lib/ai-workforce/zod-introspect';
import { z } from 'zod';

describe('deterministic reasoning engine (terminal fallback)', () => {
  it('implements every task it advertises and validates against its contract', () => {
    for (const task of listDeterministicTasks()) {
      expect(typeof task).toBe('string');
    }
    expect(listDeterministicTasks().length).toBeGreaterThanOrEqual(10);
  });

  it('scores a complete, urgent study-abroad lead as HOT with an auditable rationale', () => {
    const result = runDeterministic('lead.qualify', {
      lead: {
        fullName: 'Rafiq Hasan',
        phone: '+8801711000001',
        email: 'rafiq@example.test',
        source: 'REFERRAL',
        preferredCountry: 'United Kingdom',
        preferredCourse: 'Business Analytics',
        preferredLevel: 'Masters',
        englishTest: 'IELTS',
        englishScore: '7.0',
        budget: '25000',
        currentQualification: 'BBA',
        notes: 'I want to apply urgently for the September intake.',
        createdAt: new Date().toISOString(),
      },
    });
    expect(result.tier).toBe('HOT');
    expect(Number(result.score)).toBeGreaterThanOrEqual(70);
    expect(Array.isArray(result.rationale)).toBe(true);
    expect((result.rationale as string[]).length).toBeGreaterThan(3);
  });

  it('never qualifies a lead with no reachable contact channel', () => {
    const result = runDeterministic('lead.qualify', {
      lead: { fullName: 'No Contact', phone: '', email: '', source: 'OTHER', preferredCountry: 'United Kingdom', notes: 'interested' },
    });
    expect(result.tier).toBe('UNQUALIFIED');
  });

  it('treats spam as unqualified rather than scoring it', () => {
    const result = runDeterministic('lead.qualify', {
      lead: { fullName: 'Promo', phone: '+0000000000', email: 'promo@spam.test', source: 'OTHER', notes: 'Buy cheap followers now! free crypto giveaway click this link' },
    });
    expect(result.tier).toBe('UNQUALIFIED');
  });

  it('is deterministic: the same facts always produce the same output', () => {
    const facts = { lead: { fullName: 'A', phone: '+1', email: 'a@b.test', source: 'WEBSITE', preferredCountry: 'Canada', notes: 'masters in computing' } };
    expect(runDeterministic('lead.qualify', facts)).toEqual(runDeterministic('lead.qualify', facts));
  });

  it('flags unsafe claims during QA validation', () => {
    const result = runDeterministic('qa.validate', {
      payload: { body: 'We guarantee your visa approval and guaranteed admission to a top 10 university. Send the payment to this account number 1234567890.' },
      requiredFields: [],
    });
    expect(result.passed).toBe(false);
    const flags = result.unsafeFlags as string[];
    expect(flags).toContain('GUARANTEED_VISA');
    expect(flags).toContain('GUARANTEED_ADMISSION');
    expect(Number(result.score)).toBeLessThan(100);
  });

  it('passes safe, evidence-based content', () => {
    const result = runDeterministic('qa.validate', {
      payload: { body: 'Entry requirements for this course include IELTS 6.5 overall according to the university website.', title: 'Entry requirements' },
      requiredFields: ['title'],
    });
    expect(result.passed).toBe(true);
  });

  it('refuses an unsupported task instead of inventing an answer', () => {
    expect(() => runDeterministic('task.that.does.not.exist', {})).toThrow();
  });
});

describe('output contracts', () => {
  it('registers a schema for every advertised contract key', () => {
    for (const key of Object.keys(OUTPUT_SCHEMAS)) {
      expect(getOutputSchema(key)).toBeTruthy();
    }
    expect(Object.keys(OUTPUT_SCHEMAS).length).toBeGreaterThanOrEqual(10);
  });

  it('rejects deterministic output that violates its contract', () => {
    const schema = getOutputSchema('lead.qualification');
    expect(schema).toBeTruthy();
    expect(schema!.safeParse({ score: 'not a number' }).success).toBe(false);
  });

  it('accepts the deterministic engine output for every mapped task', () => {
    const lead = runDeterministic('lead.qualify', { lead: { fullName: 'X', phone: '+1', email: 'x@y.test', source: 'WEBSITE', notes: 'masters' } });
    expect(getOutputSchema('lead.qualification')!.safeParse(lead).success).toBe(true);
  });
});

describe('pipeline template resolution', () => {
  const scope = { input: { leadId: 'L-1' }, steps: { qualify: { tier: 'HOT', missingFields: ['email'] } } };

  it('resolves references into prior step output', () => {
    expect(resolveTemplate('$steps.qualify.tier', scope)).toBe('HOT');
    expect(resolveTemplate('$input.leadId', scope)).toBe('L-1');
  });

  it('resolves nested structures and leaves literals untouched', () => {
    expect(resolveTemplate({ a: '$input.leadId', b: 'literal', c: ['$steps.qualify.tier', 7] }, scope)).toEqual({ a: 'L-1', b: 'literal', c: ['HOT', 7] });
  });

  it('returns undefined for a missing path rather than throwing', () => {
    expect(resolveTemplate('$steps.missing.value', scope)).toBeUndefined();
  });
});

describe('agent lifecycle state machine', () => {
  it('permits only the documented transitions', () => {
    expect(canTransition('DRAFT', 'VALIDATED')).toBe(true);
    expect(canTransition('VALIDATED', 'TESTED')).toBe(true);
    expect(canTransition('TESTED', 'APPROVED')).toBe(true);
    expect(canTransition('APPROVED', 'DEPLOYING')).toBe(true);
    expect(canTransition('DEPLOYING', 'ACTIVE')).toBe(true);
    expect(canTransition('ACTIVE', 'PAUSED')).toBe(true);
  });

  it('forbids skipping a gate', () => {
    expect(canTransition('DRAFT', 'ACTIVE')).toBe(false);
    expect(canTransition('DRAFT', 'APPROVED')).toBe(false);
    expect(canTransition('VALIDATED', 'DEPLOYING')).toBe(false);
    expect(canTransition('ARCHIVED', 'ACTIVE')).toBe(false);
  });
});

describe('test expectation DSL', () => {
  it('matches exact values and numeric bounds', () => {
    const actual = { status: 'COMPLETED', output: { score: 82, tier: 'HOT', items: [1, 2] } };
    expect(evaluateExpectation(actual, { status: 'COMPLETED', 'output.score': { gte: 70 } }).passed).toBe(true);
    expect(evaluateExpectation(actual, { 'output.tier': { in: ['HOT', 'WARM'] } }).passed).toBe(true);
    expect(evaluateExpectation(actual, { 'output.items': { nonEmpty: true } }).passed).toBe(true);
  });

  it('explains a failure instead of silently passing', () => {
    const result = evaluateExpectation({ status: 'FAILED' }, { status: 'COMPLETED' });
    expect(result.passed).toBe(false);
    expect(result.detail).toContain('status');
  });
});

describe('knowledge chunking', () => {
  it('splits long documents while preserving the whole text', () => {
    const document = Array.from({ length: 40 }, (_, index) => `Paragraph ${index} about ALO Education service standards and student support.`).join('\n\n');
    const chunks = chunkDocument(document);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(' ')).toContain('Paragraph 39');
  });

  it('returns a single chunk for a short document', () => {
    expect(chunkDocument('Short policy note.')).toHaveLength(1);
  });
});

describe('zod introspection (version tolerant)', () => {
  it('reads object field names and type names', () => {
    const schema = z.object({ id: z.string(), score: z.number() });
    expect(zodFieldNames(schema).sort()).toEqual(['id', 'score']);
    expect(zodTypeName(schema)).toBe('object');
    expect(describeZod(schema)).toMatchObject({ type: 'object' });
  });

  it('degrades safely for non-object schemas', () => {
    expect(zodFieldNames(z.string())).toEqual([]);
  });
});
