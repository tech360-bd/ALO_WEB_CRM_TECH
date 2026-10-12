// Real MySQL persistence contracts; these do not exercise the HTTP/AI workflow.
// TEST_DATABASE_URL must target a disposable local alo_test_* schema.
import { describe, it, expect, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { testDatabaseUrl } from '../helpers/test-database';

const databaseUrl = testDatabaseUrl();
const HAS_TEST_DB = databaseUrl !== null;
const client = databaseUrl ? new PrismaClient({ datasourceUrl: databaseUrl }) : null;
// Lazily resolve only inside non-skipped tests; no fabricated client or unsafe cast.
function requireClient(): PrismaClient {
  if (!client) throw new Error('TEST_DATABASE_URL is not configured');
  return client;
}
const runId = `consultation-${randomUUID()}`;
const ids = { lead: () => `${runId}-${randomUUID()}`, user: `${runId}-user`, audit: `${runId}-audit`, notification: `${runId}-notification` };

afterAll(async () => {
  if (!client) return;
  try {
    await client.portalNotification.deleteMany({ where: { id: ids.notification } });
    await client.portalAuditLog.deleteMany({ where: { id: ids.audit } });
    await client.leadForm.deleteMany({ where: { id: { startsWith: runId } } });
    await client.portalUser.deleteMany({ where: { id: ids.user } });
  } finally {
    await client.$disconnect();
  }
});

describe.skipIf(!HAS_TEST_DB)('consultation workflow', () => {
  it('creates a lead with valid input', async () => {
    const db = requireClient();
    const lead = await db.leadForm.create({
      data: {
        id: ids.lead(),
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
    const db = requireClient();
    // Create first lead
    await db.leadForm.create({
      data: {
        id: ids.lead(),
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
        id: { startsWith: runId },
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
    const db = requireClient();
    // Create initial lead
    const original = await db.leadForm.create({
      data: {
        id: ids.lead(),
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
    const db = requireClient();
    const lead = await db.leadForm.create({
      data: {
        id: ids.lead(),
        name: 'Audit Test',
        phone: '+8801733333333',
        email: 'audit@example.com',
        source: 'homepage',
        status: 'new',
      },
    });

    const auditLog = await db.portalAuditLog.create({
      data: {
        id: ids.audit,
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
    const db = requireClient();
    // First create a counselor user with unique email
    const uniqueEmail = `counselor-test-${Date.now()}@example.com`;
    const counselor = await db.portalUser.create({
      data: {
        id: ids.user,
        email: uniqueEmail,
        name: 'Test Counselor',
        userType: 'EMPLOYEE',
        status: 'active',
        passwordHash: '$2a$10$dummyhashforcounseloronly',
      },
    });

    const lead = await db.leadForm.create({
      data: {
        id: ids.lead(),
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
        id: ids.notification,
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
    const db = requireClient();
    const lead = await db.leadForm.create({
      data: {
        id: ids.lead(),
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
    const db = requireClient();
    const lead = await db.leadForm.create({
      data: {
        id: ids.lead(),
        name: 'Persist Test',
        phone: '+8801766666666',
        email: 'persist@example.com',
        source: 'homepage',
        status: 'new',
      },
    });

    // Disconnect and reconnect
    await db.$disconnect();
    const db2 = new PrismaClient({ datasourceUrl: databaseUrl! });
    try {
      const found = await db2.leadForm.findUnique({ where: { id: lead.id } });
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Persist Test');
      await db2.leadForm.delete({ where: { id: lead.id } });
    } finally {
      await db2.$disconnect();
    }
  });
});
