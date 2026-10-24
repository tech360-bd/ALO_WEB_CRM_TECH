import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: { interviewQuestion: { findMany: m.findMany, create: m.create } },
}));

import { GET, POST } from '@/app/api/interview-questions/route';

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
const get = (query = '') => new NextRequest(`https://alo.test/api/interview-questions${query}`);
const post = (body: unknown) => new NextRequest('https://alo.test/api/interview-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'q1',
  category: 'COURSE',
  question: 'Why this course?',
  universitySlug: null,
  courseSlug: null,
  countrySlug: null,
  theme: null,
  source: 'University guidance',
  sourceType: 'OFFICIAL_UNIVERSITY',
  sourceUrl: null,
  lastVerifiedAt: daysAgo(10),
  confidence: 'HIGH',
  frequency: 3,
  suggestedAnswer: 'Talk about the modules you have read about.',
  difficulty: 'MEDIUM',
  sortOrder: 0,
  isActive: true,
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  m.findMany.mockResolvedValue([]);
  m.create.mockResolvedValue({ id: 'new-question' });
});

describe('GET /api/interview-questions', () => {
  it('publishes only sourced, fresh questions and attaches provenance metadata', async () => {
    m.findMany.mockResolvedValue([row(), row({ id: 'q2', question: 'Old?', lastVerifiedAt: daysAgo(400) })]);
    const response = await GET(get());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.questions.map((q: { id: string }) => q.id)).toEqual(['q1']);
    expect(body.questions[0]).toMatchObject({ confidence: 'HIGH', freshness: 'FRESH', sourceType: 'OFFICIAL_UNIVERSITY' });
    expect(body.meta.researchWindowMonths).toBe(6);
    expect(body.meta.counts.publishable).toBe(1);
    expect(body.meta.excluded.map((entry: { id: string }) => entry.id)).toContain('q2');
    expect(body.meta.disclaimers.length).toBeGreaterThan(0);
  });

  it('keeps stale evidence available only when explicitly requested', async () => {
    m.findMany.mockResolvedValue([row({ lastVerifiedAt: daysAgo(200) })]);
    const strict = await (await GET(get())).json();
    expect(strict.questions).toEqual([]);
    const relaxed = await (await GET(get('?includeStale=true'))).json();
    expect(relaxed.questions[0].freshness).toBe('STALE');
  });

  it('filters by university scope without leaking another university\'s questions', async () => {
    m.findMany.mockResolvedValue([
      row({ id: 'other', universitySlug: 'manchester' }),
      row({ id: 'mine', universitySlug: 'birmingham' }),
    ]);
    const body = await (await GET(get('?universitySlug=birmingham'))).json();
    expect(body.questions.map((q: { id: string }) => q.id)).toEqual(['mine']);
    expect(body.meta.excluded.some((entry: { id: string; reason: string }) => entry.id === 'other' && entry.reason === 'OUT_OF_SCOPE')).toBe(true);
  });

  it('fails closed with an empty, labelled payload when the database is unavailable', async () => {
    m.findMany.mockRejectedValue(new Error('connection refused'));
    const response = await GET(get());
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.questions).toEqual([]);
    expect(body.meta.error).toContain('temporarily unavailable');
    expect(JSON.stringify(body)).not.toContain('connection refused');
  });
});

describe('POST /api/interview-questions', () => {
  it('rejects guidance that promises guaranteed outcomes', async () => {
    const response = await POST(post({ category: 'VISA', question: 'Visa?', suggestedAnswer: 'This is a 100% visa success answer.' }));
    expect(response.status).toBe(422);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown source type instead of storing it unvalidated', async () => {
    const response = await POST(post({ category: 'COURSE', question: 'Why?', sourceType: 'SOME_BLOG' }));
    expect(response.status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('requires a category and a question', async () => {
    expect((await POST(post({ question: 'Why?' }))).status).toBe(400);
    expect((await POST(post({ category: 'COURSE' }))).status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('stores provenance fields on a valid submission', async () => {
    const verifiedAt = daysAgo(5).toISOString();
    const response = await POST(post({
      category: 'COURSE',
      question: 'Why this university?',
      source: 'Official prospectus',
      sourceType: 'OFFICIAL_UNIVERSITY',
      lastVerifiedAt: verifiedAt,
      confidence: 'high',
      frequency: '4',
      suggestedAnswer: 'Reference the modules you read on the official site.',
    }));
    expect(response.status).toBe(201);
    expect(m.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        category: 'COURSE',
        question: 'Why this university?',
        source: 'Official prospectus',
        sourceType: 'OFFICIAL_UNIVERSITY',
        confidence: 'HIGH',
        frequency: 4,
        lastVerifiedAt: new Date(verifiedAt),
      }),
    });
  });

  it('reports a sanitized failure when the write fails', async () => {
    m.create.mockRejectedValue(new Error('duplicate key mysql://dummy-user:dummy-password@db.invalid'));
    const response = await POST(post({ category: 'COURSE', question: 'Why?' }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('dummy-password');
  });
});
