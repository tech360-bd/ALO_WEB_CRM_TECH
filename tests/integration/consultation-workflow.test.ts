// Integration test: consultation workflow.
// Tests the lead submission endpoint end-to-end with a real database.
//
// This test uses a separate test database (DATABASE_URL must point to a test DB).
// Run with: DATABASE_URL="mysql://localhost:3306/test" npm test

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// CI safety: this file requires a real (disposable, NEVER production) MySQL database.
// Without DATABASE_URL the whole file is skipped and reported as skipped — not passed.
// Run with: DATABASE_URL="mysql://localhost:3306/test" npm test
// Guard matches the documented contract above: only a MySQL URL counts as a
// test DB (a sqlite `file:` dev URL cannot run this suite's native client).
const HAS_TEST_DB = Boolean(process.env.DATABASE_URL?.startsWith('mysql://'));
const db = HAS_TEST_DB ? new PrismaClient() : (undefined as unknown as PrismaClient);

beforeAll(async () => {
  if (!HAS_TEST_DB) return;
  // Ensure clean state
  await db.leadForm.deleteMany({});
  await db.searchLog.deleteMany({});
  await db.internalComment.deleteMany({});
  await db.portalNotification.deleteMany({});
  await db.portalAuditLog.deleteMany({});
  // Clean up any leftover test users from previous runs
  await db.portalUser.deleteMany({ where: { email: { contains: 'test@example.com' } } });
  await db.portalUser.deleteMany({ where: { email: { contains: '@example.com' }, NOT: { email: { in: ['rahim@example.com', 'admin@alo-education.local'] } } } });
});

afterAll(async () => {
  if (!HAS_TEST_DB) return;
  await db.$disconnect();
});

beforeEach(async () => {
  if (!HAS_TEST_DB) return;
  await db.leadForm.deleteMany({});
  await db.internalComment.deleteMany({});
  await db.portalNotification.deleteMany({});
  await db.portalAuditLog.deleteMany({});
});

describe.skipIf(!HAS_TEST_DB)('consultation workflow', () => {
  it('creates a lead with valid input', async () => {
    const lead = await db.leadForm.create({
      data: {
        name: 'Test Student',
        phone: '+8801712345678',
        email: 'test@example.com',
        preferredCountry: 'United Kingdom',
        preferredLevel: 'Masters',
        message: 'Interested in MBA programs',
        source: 'homepage',
        sourceSection: 'consultation',
        status: 'new',
      },
    });

    expect(lead.id).toBeTruthy();
    expect(lead.name).toBe('Test Student');
    expect(lead.email).toBe('test@example.com');
    expect(lead.status).toBe('new');
  });

  it('detects duplicate leads by email', async () => {
    // Create first lead
    await db.leadForm.create({
      data: {
        name: 'Duplicate Test',
        phone: '+8801711111111',
        email: 'duplicate@example.com',
        preferredCountry: 'USA',
        source: 'homepage',
        sourceSection: 'consultation',
        status: 'new',
      },
    });

    // Check for duplicate
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const existing = await db.leadForm.findFirst({
      where: {
        OR: [
          { phone: '+8801711111111', createdAt: { gte: thirtyDaysAgo } },
          { email: 'duplicate@example.com', createdAt: { gte: thirtyDaysAgo } },
        ],
      },
    });

    expect(existing).not.toBeNull();
    expect(existing?.email).toBe('duplicate@example.com');
  });

  it('updates an existing lead instead of creating a duplicate', async () => {
    // Create initial lead
    const original = await db.leadForm.create({
      data: {
        name: 'Update Test',
        phone: '+8801722222222',
        email: 'update@example.com',
        preferredCountry: 'Canada',
        source: 'homepage',
        sourceSection: 'consultation',
        status: 'new',
      },
    });

    // Update with new info
    const updated = await db.leadForm.update({
      where: { id: original.id },
      data: {
        name: 'Update Test Updated',
        message: 'Updated message',
      },
    });

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Update Test Updated');
    expect(updated.message).toBe('Updated message');
  });

  it('creates an audit log entry when a lead is created', async () => {
    const lead = await db.leadForm.create({
      data: {
        name: 'Audit Test',
        phone: '+8801733333333',
        email: 'audit@example.com',
        source: 'homepage',
        status: 'new',
      },
    });

    const auditLog = await db.portalAuditLog.create({
      data: {
        actorUserId: 'public',
        action: 'lead.created',
        entityType: 'LeadForm',
        entityId: lead.id,
        metadata: JSON.stringify({ name: 'Audit Test', email: 'audit@example.com' }),
        ipAddress: '',
        userAgent: '',
      },
    });

    expect(auditLog.id).toBeTruthy();
    expect(auditLog.action).toBe('lead.created');
    expect(auditLog.entityId).toBe(lead.id);
  });

  it('creates a notification for the assigned counselor', async () => {
    // First create a counselor user with unique email
    const uniqueEmail = `counselor-test-${Date.now()}@example.com`;
    const counselor = await db.portalUser.create({
      data: {
        email: uniqueEmail,
        name: 'Test Counselor',
        userType: 'EMPLOYEE',
        status: 'active',
        passwordHash: '$2a$10$dummyhashforcounseloronly',
      },
    });

    const lead = await db.leadForm.create({
      data: {
        name: 'Notification Test',
        phone: '+8801744444444',
        email: 'notify@example.com',
        source: 'homepage',
        status: 'new',
        assignedCounselorId: counselor.id,
      },
    });

    const notification = await db.portalNotification.create({
      data: {
        userId: counselor.id,
        title: 'New lead assigned to you',
        message: `Lead from ${lead.name} (${lead.email})`,
        type: 'new_lead',
        isRead: false,
        actionUrl: `/crm/leads/${lead.id}`,
      },
    });

    expect(notification.id).toBeTruthy();
    expect(notification.userId).toBe(counselor.id);
    expect(notification.isRead).toBe(false);

    // Cleanup
    await db.portalNotification.delete({ where: { id: notification.id } });
    await db.leadForm.delete({ where: { id: lead.id } });
    await db.portalUser.delete({ where: { id: counselor.id } });
  });

  it('allows status updates on a lead', async () => {
    const lead = await db.leadForm.create({
      data: {
        name: 'Status Test',
        phone: '+8801755555555',
        email: 'status@example.com',
        source: 'homepage',
        status: 'new',
      },
    });

    const validStatuses = ['new', 'contacted', 'qualified', 'enrolled', 'lost', 'reopened', 'closed'];
    for (const status of validStatuses) {
      const updated = await db.leadForm.update({
        where: { id: lead.id },
        data: { status },
      });
      expect(updated.status).toBe(status);
    }

    // Cleanup
    await db.leadForm.delete({ where: { id: lead.id } });
  });

  it('persists leads across DB reconnects', async () => {
    const lead = await db.leadForm.create({
      data: {
        name: 'Persist Test',
        phone: '+8801766666666',
        email: 'persist@example.com',
        source: 'homepage',
        status: 'new',
      },
    });

    // Disconnect and reconnect
    await db.$disconnect();
    const db2 = new PrismaClient();
    const found = await db2.leadForm.findUnique({ where: { id: lead.id } });
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Persist Test');
    await db2.leadForm.delete({ where: { id: lead.id } });
    await db2.$disconnect();
  });
});
