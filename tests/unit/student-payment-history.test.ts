import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPaymentHistory, paymentAmount } from '@/lib/student/payment-history';
import { readFileSync } from 'node:fs';
afterEach(() => vi.unstubAllGlobals());
const page = { success: true, data: [], page: 1, total: 0, totalPages: 0 };
describe('student payment presentation contract (isolated HTTP responses)', () => {
  it('keeps successful empty responses empty, with cookie auth and no fabricated history', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(page)); vi.stubGlobal('fetch', fetch);
    expect(await loadPaymentHistory(null, 1)).toEqual(page);
    expect(fetch).toHaveBeenCalledWith('/api/student-portal/payments?page=1&limit=20', expect.objectContaining({ credentials: 'same-origin', headers: {} }));
  });
  it.each([401,403,500,503])('treats HTTP %s as failure, never empty success', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'private-detail' }, { status })));
    await expect(loadPaymentHistory(null, 1)).rejects.toThrow('unavailable');
  });
  it.each([{ ...page, success: false }, { ...page, data: [{ id: 'unformatted' }] }, { data: [] }])('rejects invalid response contract %o', async payload => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload)));
    await expect(loadPaymentHistory(null, 1)).rejects.toThrow('could not be read');
  });
  it('uses actual numeric amount/date/status and explicit currency, not old UI fields', async () => {
    const record = { id: 'isolated-unit-record', description: 'Request', amount: 1250.5, currency: 'GBP', status: 'pending', createdAt: '2026-10-01T00:00:00.000Z', paidAt: null };
    const fetch = vi.fn().mockResolvedValue(Response.json({ ...page, data: [record], total: 21, page: 2, totalPages: 2 })); vi.stubGlobal('fetch', fetch);
    const signal = new AbortController().signal;
    expect((await loadPaymentHistory('isolated-test-session', 2, signal)).data).toEqual([record]);
    expect(paymentAmount(record)).toBe('GBP 1,250.5');
    expect(fetch).toHaveBeenCalledWith('/api/student-portal/payments?page=2&limit=20', expect.objectContaining({ signal, headers: { Authorization: 'Bearer isolated-test-session' } }));
  });
  it('propagates network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(loadPaymentHistory(null, 1)).rejects.toThrow('offline');
  });
  it('source guard: fabricated account state is absent and disconnected uploads explicitly disabled', () => {
    // Source regression only, NOT browser execution evidence.
    const source = readFileSync('src/components/student/StudentPayments.tsx', 'utf8');
    expect(source).not.toMatch(/MOCK_PAYMENTS|University of Aberdeen|Visa fee paid/);
    expect(source).toContain('disabled aria-describedby="receipt-unavailable"');
    expect(source).toContain("setView('student-messages')");
    expect(source).toContain('history?.owner === owner');
    expect(source).toContain('controller.abort()');
  });
});
