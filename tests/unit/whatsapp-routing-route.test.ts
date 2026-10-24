import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), findMany: vi.fn(), create: vi.fn(), determine: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { communicationRoutingLog: { findMany: (...args: unknown[]) => mocks.findMany(...args), create: (...args: unknown[]) => mocks.create(...args) } },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));
vi.mock('@/lib/whatsapp-number-pool', () => ({
  determineSenderNumber: (...args: unknown[]) => mocks.determine(...args),
  MAIN_NUMBER: '01805020100',
  COO_NUMBER: '01805020101',
  OFFICIAL_NUMBERS: Array.from({ length: 20 }, (_, index) => `018050201${String(index).padStart(2, '0')}`),
}));

import { GET, POST } from '@/app/api/whatsapp/routing/route';

const admin = { userId: 'admin-1', userType: 'ADMIN', roles: ['ADMIN'], permissions: [], branch: 'Dhaka' };
const requestOrigin = () => new URL(process.env.NEXTAUTH_URL || 'https://alo.test').origin;
const makeRequest = (path: string, body?: unknown, origin = requestOrigin()) => new Request(`${requestOrigin()}${path}`, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { ...(body === undefined ? {} : { 'content-type': 'application/json', origin }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(admin);
  mocks.findMany.mockResolvedValue([]);
  mocks.create.mockResolvedValue({});
  mocks.determine.mockResolvedValue({ number: '01805020100', reason: 'default_fallback', fallback: true });
});

describe('WhatsApp routing API authorization and data scope', () => {
  it('denies routing history to authenticated users without routing permission', async () => {
    mocks.auth.mockReturnValue({ ...admin, userType: 'COUNSELOR', roles: ['COUNSELOR'], permissions: [] });
    const response = await GET(makeRequest('/api/whatsapp/routing'));
    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('limits assigned-view users to their assigned or branch routing records', async () => {
    mocks.auth.mockReturnValue({
      ...admin, userType: 'COUNSELOR', roles: ['COUNSELOR'], permissions: ['communication.view_assigned'],
      userId: 'employee-7', branch: 'Dhaka',
    });
    const response = await GET(makeRequest('/api/whatsapp/routing'));
    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ assignedToId: 'employee-7' }, { branch: 'Dhaka' }] },
      select: expect.not.objectContaining({ fromNumber: true, studentId: true }),
    }));
  });

  it('requires same-origin administrator access for routing previews', async () => {
    mocks.auth.mockReturnValue({ ...admin, userType: 'COUNSELOR', roles: ['COUNSELOR'] });
    const response = await POST(makeRequest('/api/whatsapp/routing', { branch: 'Dhaka' }));
    expect(response.status).toBe(403);
    expect(mocks.determine).not.toHaveBeenCalled();
  });

  it('rejects non-official explicit sender values before creating a routing log', async () => {
    const response = await POST(makeRequest('/api/whatsapp/routing', { explicitNumber: '+8801700000000' }));
    expect(response.status).toBe(400);
    expect(mocks.determine).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('labels routing previews as previews and not provider verification', async () => {
    const response = await POST(makeRequest('/api/whatsapp/routing', { branch: 'Dhaka' }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.routing).toMatchObject({ isPreview: true, providerStatus: 'not_checked' });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ routingReason: 'preview:default_fallback' }),
    }));
  });
});
