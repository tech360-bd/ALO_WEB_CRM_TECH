import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  hoursFindMany: vi.fn(),
  holidaysFindMany: vi.fn(),
  upsert: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  transactionAudit: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...args: unknown[]) => mocks.authenticate(...args),
}));
vi.mock('@/lib/db', () => ({
  db: {
    uccOfficeHours: { findMany: (...args: unknown[]) => mocks.hoursFindMany(...args) },
    hrmAttendanceHoliday: { findMany: (...args: unknown[]) => mocks.holidaysFindMany(...args) },
    $transaction: (callback: (tx: unknown) => unknown) => mocks.transaction(callback),
  },
}));

import { GET, POST } from '@/app/api/crm/ucc/office-hours/route';

const auth = { roles: ['ADMIN'], userType: 'ADMIN', permissions: [], userId: 'admin-1', actorUserId: 'admin-1', email: 'admin@example.test' };
const schedule = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  startTime: '09:00',
  endTime: '18:00',
  isWorkDay: [0, 1, 2, 3, 4, 6].includes(dayOfWeek),
  afterHoursAiAuto: true,
}));

function request(body: unknown) {
  return new NextRequest('https://alo.test/api/crm/ucc/office-hours', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticate.mockResolvedValue(auth);
  mocks.hoursFindMany.mockResolvedValue([]);
  mocks.holidaysFindMany.mockResolvedValue([]);
  mocks.upsert.mockResolvedValue({});
  mocks.updateMany.mockResolvedValue({ count: 0 });
  mocks.transactionAudit.mockResolvedValue({});
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ uccOfficeHours: { upsert: mocks.upsert, updateMany: mocks.updateMany }, portalAuditLog: { create: mocks.transactionAudit } }));
});

describe('/api/crm/ucc/office-hours', () => {
  it('returns the Asia/Dhaka Sat–Thu 09:00–18:00 / Friday-closed default without mutating data', async () => {
    const response = await GET(new Request('https://alo.test/api/crm/ucc/office-hours'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true, isDefault: true, timezone: 'Asia/Dhaka', canManageOfficeHours: true });
    expect(body.officeHours).toHaveLength(7);
    expect(body.officeHours[5]).toMatchObject({ dayOfWeek: 5, isWorkDay: false, startTime: '09:00', endTime: '18:00' });
    expect(body.officeHours[6]).toMatchObject({ dayOfWeek: 6, isWorkDay: true, startTime: '09:00', endTime: '18:00' });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('flags conflicting duplicate weekdays and leaves the stored values untouched', async () => {
    mocks.hoursFindMany.mockResolvedValue([
      ...schedule,
      { dayOfWeek: 1, startTime: '10:00', endTime: '19:00', isWorkDay: true, afterHoursAiAuto: false },
    ]);
    const response = await GET(new Request('https://alo.test/api/crm/ucc/office-hours'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.scheduleConflict).toBe(true);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('flags the previous 10:00–19:00 schedule for administrator review without rewriting it', async () => {
    mocks.hoursFindMany.mockResolvedValue(schedule.map((day) => ({ ...day, startTime: '10:00', endTime: '19:00' })));
    const response = await GET(new Request('https://alo.test/api/crm/ucc/office-hours'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.legacyDefaultReviewRequired).toBe(true);
    expect(body.officeHours[0]).toMatchObject({ startTime: '10:00', endTime: '19:00' });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('rejects a schedule with no business day to prevent impossible SLA deadlines', async () => {
    const closed = schedule.map((day) => ({ ...day, isWorkDay: false }));
    const response = await POST(request({ schedule: closed }));
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.transactionAudit).not.toHaveBeenCalled();
  });

  it('updates existing duplicate weekday rows in place instead of leaving schedule conflicts', async () => {
    mocks.updateMany.mockResolvedValue({ count: 2 });
    const response = await POST(request({ schedule }));
    expect(response.status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledTimes(7);
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.updateMany).toHaveBeenCalledWith({ where: { dayOfWeek: 5 }, data: expect.objectContaining({ isWorkDay: false, startTime: '09:00', endTime: '18:00' }) });
  });

  it('rejects a non-boolean after-hours automation flag before persistence', async () => {
    const invalid = schedule.map((day) => ({ ...day, afterHoursAiAuto: 'yes' }));
    const response = await POST(request({ schedule: invalid }));
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('persists a complete seven-day schedule transactionally and audits the admin actor', async () => {
    const response = await POST(request({ schedule }));
    expect(response.status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.updateMany).toHaveBeenCalledTimes(7);
    expect(mocks.upsert).toHaveBeenCalledTimes(7);
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { id: 'day_5' },
      update: expect.objectContaining({ isWorkDay: false, startTime: '09:00', endTime: '18:00' }),
      create: expect.objectContaining({ id: 'day_5', dayOfWeek: 5, isWorkDay: false }),
    });
    expect(mocks.transactionAudit).toHaveBeenCalledWith({ data: expect.objectContaining({ actorUserId: auth.userId, action: 'OFFICE_HOURS_UPDATED', entityType: 'UccOfficeHours', entityId: 'system', metadata: JSON.stringify({ schedule }) }) });
  });

  it('denies schedule writes to non-managers before touching the database', async () => {
    mocks.authenticate.mockResolvedValue({ ...auth, roles: ['COUNSELOR'], userType: 'EMPLOYEE', permissions: [] });
    const response = await POST(request({ schedule }));
    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
