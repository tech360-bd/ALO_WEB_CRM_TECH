import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
function isAdministrator(auth: { userType: string; roles: string[] }) {
  return [auth.userType, ...auth.roles].some((role) => ADMIN_ROLES.has(role.toUpperCase()));
}

export const dynamic = 'force-dynamic';

// This legacy dashboard aggregates confidential communication and documents.
// It is restricted to administrators; use the scoped UCC APIs for role inboxes.
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required for this global dashboard.' }, { status: 403 });

  try {
    const [connectedAccounts, phoneCalls, emails, sms, notifications, consentRecords, documents, docVersions, aiClassifications, timelineEvents, socialMessages, commMessages, pendingDrafts, pendingJustifications, openEscalations, openTasks, templatesCount, slaEvents] = await Promise.all([
      db.connectedAccount.findMany({
        orderBy: { platform: 'asc' },
        select: { id: true, platform: true, accountName: true, accountId: true, connectionStatus: true, tokenExpiry: true, lastSync: true, lastActivity: true, assignedTo: true },
      }),
      db.phoneCallLog.findMany({
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, callType: true, fromNumber: true, toNumber: true, duration: true, callNotes: true, disposition: true, createdAt: true },
      }),
      db.emailSync.findMany({
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, fromEmail: true, toEmail: true, subject: true, bodyText: true, folder: true, isRead: true, matchedToCRM: true, createdAt: true },
      }),
      db.smsLog.findMany({
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, direction: true, fromNumber: true, toNumber: true, messageText: true, deliveryStatus: true, readStatus: true, createdAt: true },
      }),
      db.notificationEngine.findMany({
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, recipientType: true, channel: true, title: true, message: true, category: true, priority: true, isRead: true, createdAt: true },
      }),
      db.consentRecord.findMany({
        orderBy: { createdAt: 'desc' }, take: 200,
        select: { id: true, studentId: true, channel: true, consentStatus: true, preferredLanguage: true, consentDate: true, optOutDate: true, createdAt: true },
      }),
      db.document.count(),
      db.documentVersion.findMany({
        orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, documentId: true, version: true, fileSize: true, fileType: true, reviewStatus: true, reviewerId: true, reviewerNote: true, isLatest: true, uploadedAt: true },
      }),
      db.aiDocumentClassification.findMany({
        orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, documentId: true, detectedType: true, confidence: true, humanVerified: true, createdAt: true },
      }),
      db.timelineEvent.findMany({
        orderBy: { createdAt: 'desc' }, take: 15,
        select: { id: true, type: true, title: true, description: true, actor: true, createdAt: true },
      }),
      db.socialInboxMessage.findMany({
        orderBy: { createdAt: 'desc' }, take: 15,
        select: { id: true, platform: true, messageText: true, receivedAt: true, senderName: true, direction: true },
      }),
      db.communicationMessage.findMany({
        orderBy: { createdAt: 'desc' }, take: 15,
        select: { id: true, channel: true, content: true, messageBody: true, direction: true, createdAt: true, visibility: true },
      }),
      db.communicationDraft.count({ where: { status: 'DRAFT' } }),
      db.slaJustification.count({ where: { status: 'PENDING' } }),
      db.escalationEvent.count({ where: { status: 'OPEN' } }),
      db.communicationTask.count({ where: { status: 'OPEN' } }),
      db.communicationTemplate.count(),
      db.slaEvent.findMany({ orderBy: { createdAt: 'desc' }, select: { eventType: true, responseAt: true } }),
    ]);

    const slaTotal = slaEvents.length;
    const slaResponded = slaEvents.filter((event) => event.eventType === 'RESPONDED' || event.responseAt).length;
    const slaCompliance = slaTotal > 0 ? Math.round((slaResponded / slaTotal) * 100) : null;
    const stats = {
      connectedAccounts: connectedAccounts.length,
      // Database flags alone are not proof of a provider connection.
      connectedActive: 0,
      expiredAccounts: 0,
      unverifiedAccounts: connectedAccounts.length,
      totalPhoneCalls: phoneCalls.length,
      missedCalls: phoneCalls.filter((call) => call.callType === 'MISSED').length,
      totalEmails: emails.length,
      unreadEmails: emails.filter((email) => !email.isRead).length,
      totalSms: sms.length,
      deliveredSms: sms.filter((message) => message.deliveryStatus === 'DELIVERED').length,
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter((notification) => !notification.isRead).length,
      totalConsent: consentRecords.length,
      optedIn: consentRecords.filter((record) => record.consentStatus === 'OPTED_IN').length,
      optedOut: consentRecords.filter((record) => record.consentStatus === 'OPTED_OUT').length,
      totalDocuments: documents,
      documentVersions: docVersions.length,
      aiClassified: aiClassifications.length,
      pendingReview: docVersions.filter((version) => version.reviewStatus === 'PENDING').length,
      timelineEvents: timelineEvents.length,
      socialMessages: socialMessages.length,
      whatsappMessages: commMessages.filter((message) => message.channel.toUpperCase() === 'WHATSAPP').length,
      pendingDrafts,
      pendingJustifications,
      openEscalations,
      openTasks,
      templatesCount,
      slaCompliance,
    };

    const unifiedTimeline: Array<{ type: string; title: string; description: string | null; timestamp: Date; channel: string; user?: string | null }> = [];
    for (const call of phoneCalls) unifiedTimeline.push({ type: 'PHONE_CALL', title: `${call.callType} call`, description: call.callNotes, timestamp: call.createdAt, channel: 'PHONE' });
    for (const email of emails) unifiedTimeline.push({ type: 'EMAIL', title: email.subject, description: email.bodyText?.slice(0, 100) || null, timestamp: email.createdAt, channel: 'EMAIL', user: email.fromEmail });
    for (const message of sms) unifiedTimeline.push({ type: 'SMS', title: `SMS ${message.direction}`, description: message.messageText.slice(0, 100), timestamp: message.createdAt, channel: 'SMS' });
    for (const message of socialMessages) unifiedTimeline.push({ type: 'SOCIAL', title: `${message.platform} message`, description: message.messageText?.slice(0, 100) || null, timestamp: message.receivedAt, channel: message.platform, user: message.senderName });
    for (const event of timelineEvents) unifiedTimeline.push({ type: event.type, title: event.title, description: event.description, timestamp: event.createdAt, channel: 'CRM', user: event.actor });
    for (const message of commMessages) {
      if (message.visibility?.toLowerCase() === 'private' || message.visibility?.toLowerCase() === 'internal') continue;
      unifiedTimeline.push({ type: 'COMMUNICATION', title: `${message.direction} ${message.channel}`, description: (message.content || message.messageBody).slice(0, 100), timestamp: message.createdAt, channel: message.channel });
    }
    unifiedTimeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    await logAuditAction(auth, 'OMNICHANNEL_GLOBAL_DASHBOARD_VIEWED', 'CommunicationDashboard', 'global', {
      counts: { calls: phoneCalls.length, emails: emails.length, sms: sms.length, documents: documents.length, messages: socialMessages.length + commMessages.length },
    });

    return NextResponse.json({
      stats,
      connectedAccounts: connectedAccounts.map((account) => ({
        id: account.id,
        platform: account.platform,
        accountName: account.accountName,
        accountId: account.accountId || '',
        reportedConnectionStatus: account.connectionStatus,
        connectionStatus: account.connectionStatus === 'DISCONNECTED' ? 'DISCONNECTED' : 'NOT_VERIFIED',
        lastSync: null,
        lastActivity: null,
        assignedTo: account.assignedTo,
        providerEvidence: 'NOT VERIFIED — no provider OAuth or live-test evidence is stored',
      })),
      phoneCalls,
      emails: emails.map((email) => ({ ...email, bodyText: email.bodyText || '' })),
      sms,
      notifications,
      consentRecords: consentRecords.map((record) => ({ ...record, studentId: record.studentId || '' })),
      documentVersions: docVersions.map((version) => ({ ...version, filePath: null })),
      aiClassifications: aiClassifications.map((classification) => ({ ...classification, extractedData: '{}' })),
      unifiedTimeline: unifiedTimeline.slice(0, 50),
      recentTimelineEvents: timelineEvents.map((event) => ({
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        createdAt: event.createdAt,
        user: null,
      })),
      verification: 'Privileged global data view. Provider connection states remain NOT_VERIFIED without provider evidence.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Omnichannel dashboard is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
