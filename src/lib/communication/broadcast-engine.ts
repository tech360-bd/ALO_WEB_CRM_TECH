/**
 * Broadcast Engine — WhatsApp/SMS/Email/Portal/Partner/Student/Marketing Campaign
 * Rules: approval by Marketing Manager or Super Admin, mass > limit requires Super Admin, opt-out respected, logs saved
 */
import { db } from '@/lib/db';
import crypto from 'crypto';
import { queueEmailBroadcast } from '@/lib/email-marketing/broadcast-bridge';

const MASS_AUDIENCE_LIMIT = 100; // above this requires Super Admin

export async function createBroadcast(params: {
  title: string;
  channel: 'whatsapp'|'sms'|'email'|'portal';
  audienceType: string;
  audienceFilter?: any;
  messageBody: string;
  createdBy: string;
  scheduledAt?: Date;
}) {
  const broadcastCode = `BC-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const audienceFilterJson = JSON.stringify(params.audienceFilter || {});

  // Determine recipients count estimate (for approval logic)
  let estimatedRecipients = 0;
  try {
    if (params.audienceType === 'all_leads') estimatedRecipients = await db.marketingLead.count().catch(()=>0);
    else if (params.audienceType === 'hot_leads') estimatedRecipients = await db.marketingLead.count({ where: { hotLead: true } }).catch(()=>0);
    else if (params.audienceType === 'students') estimatedRecipients = await db.student.count().catch(()=>0);
    else if (params.audienceType === 'partner_students') estimatedRecipients = await db.portalStudentProfile.count().catch(()=>0);
    else estimatedRecipients = 10;
  } catch { estimatedRecipients = 10; }

  const requiresSuperAdmin = estimatedRecipients > MASS_AUDIENCE_LIMIT;

  const broadcast = await db.broadcast.create({
    data: {
      broadcastCode,
      title: params.title,
      channel: params.channel,
      audienceType: params.audienceType,
      audienceFilterJson,
      messageBody: params.messageBody,
      approvalStatus: 'pending',
      scheduledAt: params.scheduledAt || null,
      createdBy: params.createdBy,
    }
  });

  // Create audit
  await db.aloAuditLog.create({
    data: {
      actorName: params.createdBy || '',
      action: 'BROADCAST_CREATED',
      resource: 'Broadcast',
      resourceId: broadcast.id,
      details: JSON.stringify({ channel: params.channel, audienceType: params.audienceType, estimatedRecipients, requiresSuperAdmin }),
    }
  }).catch(()=>{});
  await db.crmAuditLog.create({
    data: {
      actorUserId: params.createdBy,
      actorRole: 'marketing',
      action: 'BROADCAST_CREATED',
      targetCollection: 'Broadcast',
      targetId: broadcast.id,
      afterData: JSON.stringify({ requiresSuperAdmin, estimatedRecipients }),
    }
  }).catch(()=>{});

  return { broadcast, requiresSuperAdmin, estimatedRecipients, needsApproval: true };
}

export async function approveBroadcast(params: { broadcastId: string; approvedBy: string; approverRole: string; approve: boolean; note?: string }) {
  const broadcast = await db.broadcast.findUnique({ where: { id: params.broadcastId } }).catch(()=>null) as any;
  if (!broadcast) throw new Error('Broadcast not found');

  const isSuperAdmin = ['super_admin'].includes((params.approverRole||'').toLowerCase());
  const isMarketingManager = ['marketing_manager','marketing manager'].includes((params.approverRole||'').toLowerCase());

  if (!isSuperAdmin && !isMarketingManager) throw new Error('Only Marketing Manager or Super Admin can approve broadcasts');

  if (broadcast.createdBy === params.approvedBy) throw new Error('A different authorized user must approve the broadcast');

  // For mass audience > limit, only Super Admin
  let estimatedRecipients = 0;
  if (broadcast.audienceType === 'all_leads') estimatedRecipients = await db.marketingLead.count();
  else if (broadcast.audienceType === 'hot_leads') estimatedRecipients = await db.marketingLead.count({ where: { hotLead: true } });
  else if (broadcast.audienceType === 'students') estimatedRecipients = await db.student.count();
  else if (broadcast.audienceType === 'partner_students') estimatedRecipients = await db.portalStudentProfile.count();
  else throw new Error('Unsupported broadcast audience');
  if (estimatedRecipients > MASS_AUDIENCE_LIMIT && !isSuperAdmin) {
    throw new Error(`Mass send audience ${estimatedRecipients} > ${MASS_AUDIENCE_LIMIT} requires Super Admin approval`);
  }

  if (!params.approve) {
    await db.broadcast.update({ where: { id: params.broadcastId }, data: { approvalStatus: 'rejected' } });
    return { approved: false };
  }

  await db.broadcast.update({
    where: { id: params.broadcastId },
    data: { approvalStatus: 'approved', approvedBy: params.approvedBy }
  });

  await db.aloAuditLog.create({
    data: {
      actorName: params.approvedBy || '',
      action: 'BROADCAST_APPROVED',
      resource: 'Broadcast',
      resourceId: params.broadcastId,
      details: JSON.stringify({ approverRole: params.approverRole }),
    }
  }).catch(()=>{});

  return { approved: true };
}

export async function sendBroadcast(broadcastId: string, actorId: string = '') {
  const broadcast = await db.broadcast.findUnique({ where: { id: broadcastId } }).catch(()=>null) as any;
  if (!broadcast) throw new Error('Broadcast not found');
  if (broadcast.approvalStatus !== 'approved') throw new Error('Broadcast must be approved before sending');

  const filter = JSON.parse(broadcast.audienceFilterJson || '{}');

  // Email has a real transport (src/lib/email-marketing). This send only QUEUES an
  // outbox. The outbox worker delivers later, under caps and test mode. Nothing is
  // marked "sent" here, so the result never claims delivery.
  if (broadcast.channel === 'email') {
    const queued = await queueEmailBroadcast({
      id: broadcast.id,
      title: broadcast.title,
      messageBody: broadcast.messageBody,
      audienceType: broadcast.audienceType,
      audienceFilter: filter,
      createdBy: actorId || broadcast.createdBy || '',
    });
    return { channel: 'email' as const, broadcastId, ...queued };
  }

  // WhatsApp and SMS have no connected transport in this codebase. Refuse instead of
  // writing "sent" rows for messages that were never delivered.
  if (broadcast.channel !== 'portal') {
    throw new Error(`CHANNEL_NOT_CONNECTED: ${broadcast.channel} sending is not connected. Nothing was sent.`);
  }

  throw new Error('CHANNEL_NOT_CONNECTED: portal broadcast delivery is not connected. Nothing was sent.');
}
