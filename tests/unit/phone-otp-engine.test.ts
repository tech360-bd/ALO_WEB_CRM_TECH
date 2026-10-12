import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, any>;
const state = vi.hoisted(() => ({
  rows: [] as Row[],
  sent: [] as Array<{ to: string; message: string; sensitive?: boolean }>,
  sendImpl: null as null | (() => Promise<unknown>),
  auditRows: [] as Row[],
  seq: 0,
}));

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key];
    if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('gt' in cond) return value > cond.gt;
      if ('gte' in cond) return value >= cond.gte;
      if ('lt' in cond) return value < cond.lt;
      if ('in' in cond) return cond.in.includes(value);
    }
    return value === cond;
  });
}

function sortedDesc(rows: Row[]) {
  return [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

vi.mock('@/lib/db', () => ({
  db: {
    otpLog: {
      count: async ({ where }: any) => state.rows.filter((r) => matches(r, where)).length,
      // Prisma returns snapshots, not live references; mirror that.
      findFirst: async ({ where }: any) => {
        const row = sortedDesc(state.rows.filter((r) => matches(r, where)))[0];
        return row ? { ...row } : null;
      },
      create: async ({ data }: any) => {
        const row = { id: `otp_${++state.seq}`, createdAt: new Date(), verifiedAt: null, attemptCount: 0, ...data };
        state.rows.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = state.rows.find((r) => r.id === where.id);
        if (!row) throw new Error('not found');
        Object.assign(row, data);
        return row;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const row of state.rows) {
          if (!matches(row, where)) continue;
          for (const [k, v] of Object.entries(data)) {
            if (v && typeof v === 'object' && 'increment' in (v as any)) row[k] = (row[k] || 0) + (v as any).increment;
            else row[k] = v;
          }
          count++;
        }
        return { count };
      },
    },
    crmAuditLog: { create: async ({ data }: any) => { state.auditRows.push(data); return data; } },
  },
}));

vi.mock('@/lib/sms-gateway', () => ({
  SmsDeliveryError: class extends Error { constructor(readonly outcome: string, message: string) { super(message); } },
  sendSms: async (opts: { to: string; message: string; sensitive?: boolean }) => {
    if (state.sendImpl) return state.sendImpl();
    state.sent.push({ ...opts });
    return { messageId: 'm1', provider: 'generic', status: 'sent' };
  },
}));

import { generateOtp, verifyOtp, normalizePhone, OtpError } from '@/lib/communication/otp-engine';
import { POST as crmOtpPOST } from '@/app/api/crm/communications/otp/route';

const PHONE = '01712345678';
const sentCode = () => {
  const match = state.sent.at(-1)?.message.match(/code is (\d{6})/);
  if (!match) throw new Error('no code sent');
  return match[1];
};

beforeEach(() => {
  process.env.OTP_PEPPER = 'x'.repeat(40);
  state.rows = [];
  state.sent = [];
  state.auditRows = [];
  state.sendImpl = null;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('phone OTP: generation and delivery', () => {
  it('delivers a 6-digit code by SMS and never prints it to the console', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const errSpy = vi.spyOn(console, 'error');
    const result = await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0].sensitive).toBe(true);
    expect(state.sent[0].to).toBe('8801712345678');
    expect(sentCode()).toMatch(/^\d{6}$/);
    expect(result).not.toHaveProperty('otp');
    expect(result).not.toHaveProperty('otpForDevOnly');
    const everything = JSON.stringify([logSpy.mock.calls, errSpy.mock.calls]);
    expect(everything).not.toContain(sentCode());
  });

  it('stores only a keyed digest, never the raw code', async () => {
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    const code = sentCode();
    const row = state.rows[0];
    expect(JSON.stringify(row)).not.toContain(code);
    expect(row.otpHash).toMatch(/^[a-f0-9]{64}$/);
    expect(row.status).toBe('pending');
  });

  it('marks the challenge undeliverable and reports failure when the provider rejects the send', async () => {
    state.sendImpl = async () => { throw new Error('provider down'); };
    await expect(generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE })).rejects.toMatchObject({ status: 503 });
    expect(state.rows[0].status).toBe('delivery_failed');
    await expect(verifyOtp({ phone: PHONE, otp: '123456' })).rejects.toBeInstanceOf(OtpError);
  });

  it('refuses to send when the HMAC pepper is missing (fail closed)', async () => {
    delete process.env.OTP_PEPPER;
    delete process.env.NEXTAUTH_SECRET;
    await expect(generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE })).rejects.toMatchObject({ status: 503 });
    expect(state.sent).toHaveLength(0);
  });

  it('enforces a resend cooldown', async () => {
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    await expect(generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE })).rejects.toMatchObject({ status: 429 });
    expect(state.sent).toHaveLength(1);
  });

  it('caps sends per phone within the window', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) {
      await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
      vi.advanceTimersByTime(61_000);
    }
    await expect(generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE })).rejects.toMatchObject({ status: 429 });
    expect(state.sent).toHaveLength(5);
  });
});

describe('phone OTP: verification', () => {
  it('accepts the correct code once and rejects reuse', async () => {
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE, purpose: 'private_data_verification' });
    const code = sentCode();
    const ok = await verifyOtp({ phone: PHONE, otp: code, purpose: 'private_data_verification' });
    expect(ok).toMatchObject({ success: true, ownerId: 's1' });
    await expect(verifyOtp({ phone: PHONE, otp: code, purpose: 'private_data_verification' })).rejects.toBeInstanceOf(OtpError);
  });

  it('rejects a code that was consumed by a concurrent request', async () => {
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    const code = sentCode();
    // Simulate a racing request that already moved the challenge out of 'pending'.
    const original = state.rows[0];
    const realUpdateMany = (await import('@/lib/db')).db.otpLog.updateMany;
    vi.spyOn((await import('@/lib/db')).db.otpLog, 'updateMany').mockImplementation(async (args: any) => {
      original.status = 'verified';
      return realUpdateMany(args);
    });
    await expect(verifyOtp({ phone: PHONE, otp: code })).rejects.toBeInstanceOf(OtpError);
    expect(state.auditRows).toHaveLength(0);
  });

  it('counts wrong attempts and blocks after the fifth failure', async () => {
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    const code = sentCode();
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) {
      await expect(verifyOtp({ phone: PHONE, otp: wrong })).rejects.toMatchObject({ status: 400 });
    }
    await expect(verifyOtp({ phone: PHONE, otp: wrong })).rejects.toMatchObject({ status: 429 });
    // Even the correct code no longer works after the block.
    await expect(verifyOtp({ phone: PHONE, otp: code })).rejects.toBeInstanceOf(OtpError);
    expect(state.rows[0].status).toBe('blocked');
  });

  it('rejects an expired code', async () => {
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    const code = sentCode();
    state.rows[0].expiresAt = new Date(Date.now() - 1000);
    await expect(verifyOtp({ phone: PHONE, otp: code })).rejects.toBeInstanceOf(OtpError);
  });

  it('rejects malformed codes without touching the database counters', async () => {
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    await expect(verifyOtp({ phone: PHONE, otp: 'abc' })).rejects.toBeInstanceOf(OtpError);
    expect(state.rows[0].attemptCount).toBe(0);
  });

  it('a new code supersedes the previous one', async () => {
    vi.useFakeTimers();
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    const first = sentCode();
    vi.advanceTimersByTime(61_000);
    await generateOtp({ ownerType: 'student', ownerId: 's1', phone: PHONE });
    const second = sentCode();
    if (first !== second) {
      await expect(verifyOtp({ phone: PHONE, otp: first })).rejects.toBeInstanceOf(OtpError);
    }
    await expect(verifyOtp({ phone: PHONE, otp: second })).resolves.toMatchObject({ success: true });
  });
});

describe('phone normalisation', () => {
  it('normalises Bangladeshi local numbers and rejects garbage', () => {
    expect(normalizePhone('01712345678')).toBe('8801712345678');
    expect(normalizePhone('+880 1712-345678')).toBe('8801712345678');
    expect(() => normalizePhone('abc')).toThrow(OtpError);
    expect(() => normalizePhone('12')).toThrow(OtpError);
  });
});

describe('CRM OTP route', () => {
  const post = (body: unknown) => crmOtpPOST(new Request('https://alo.test/api/crm/communications/otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as any);

  it('returns success only after delivery and never includes a code', async () => {
    const res = await post({ action: 'send', phone: PHONE });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(JSON.stringify(body)).not.toContain(sentCode());
    expect(body).not.toHaveProperty('devOtp');
  });

  it('reports 503 and no success when SMS delivery fails', async () => {
    state.sendImpl = async () => { throw new Error('gateway unreachable'); };
    const res = await post({ action: 'send', phone: PHONE });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(JSON.stringify(body)).not.toContain('gateway unreachable');
  });

  it('rejects a non-string phone with 400', async () => {
    const res = await post({ action: 'send', phone: { $ne: null } });
    expect(res.status).toBe(400);
  });
});
