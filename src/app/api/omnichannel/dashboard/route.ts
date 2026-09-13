import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — Omnichannel Communication Center dashboard
export async function GET() {
  const [connectedAccounts, phoneCalls, emails, sms, notifications, consentRecords, documents, docVersions, aiClassifications, timelineEvents, socialMessages, commMessages, pendingDrafts, pendingJustifications, openEscalations, openTasks, templatesCount, slaEvents] = await Promise.all([
    db.connectedAccount.findMany({ orderBy: { platform: "asc" } }),
    db.phoneCallLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.emailSync.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.smsLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.notificationEngine.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.consentRecord.findMany({ orderBy: { createdAt: "desc" } }),
    db.document.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
    db.documentVersion.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    db.aiDocumentClassification.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    db.timelineEvent.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    db.socialInboxMessage.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    db.communicationMessage.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    db.communicationDraft.count({ where: { status: "DRAFT" } }),
    db.slaJustification.count({ where: { status: "PENDING" } }),
    db.escalationEvent.count({ where: { status: "OPEN" } }),
    db.communicationTask.count({ where: { status: "OPEN" } }),
    db.communicationTemplate.count(),
    db.slaEvent.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  // SLA compliance = responded / total * 100
  const slaTotal = slaEvents.length;
  const slaResponded = slaEvents.filter((e) => e.eventType === "RESPONDED" || e.responseAt).length;
  const slaCompliance = slaTotal > 0 ? Math.round((slaResponded / slaTotal) * 100) : 100;

  const stats = {
    connectedAccounts: connectedAccounts.length,
    connectedActive: connectedAccounts.filter((a) => a.connectionStatus === "CONNECTED").length,
    expiredAccounts: connectedAccounts.filter((a) => a.connectionStatus === "EXPIRED" || a.connectionStatus === "PERMISSION_ERROR").length,
    totalPhoneCalls: phoneCalls.length,
    missedCalls: phoneCalls.filter((c) => c.callType === "MISSED").length,
    totalEmails: emails.length,
    unreadEmails: emails.filter((e) => !e.isRead).length,
    totalSms: sms.length,
    deliveredSms: sms.filter((s) => s.deliveryStatus === "DELIVERED").length,
    totalNotifications: notifications.length,
    unreadNotifications: notifications.filter((n) => !n.isRead).length,
    totalConsent: consentRecords.length,
    optedIn: consentRecords.filter((c) => c.consentStatus === "OPTED_IN").length,
    optedOut: consentRecords.filter((c) => c.consentStatus === "OPTED_OUT").length,
    totalDocuments: documents.length,
    documentVersions: docVersions.length,
    aiClassified: aiClassifications.length,
    pendingReview: docVersions.filter((v) => v.reviewStatus === "PENDING").length,
    timelineEvents: timelineEvents.length,
    socialMessages: socialMessages.length,
    whatsappMessages: commMessages.filter((m) => m.channel === "WHATSAPP").length,
    pendingDrafts,
    pendingJustifications,
    openEscalations,
    openTasks,
    templatesCount,
    slaCompliance,
  };

  // Unified timeline (merge all communication types)
  const unifiedTimeline: any[] = [];
  for (const c of phoneCalls) {
    unifiedTimeline.push({ type: "PHONE_CALL", title: `${c.callType} call from ${c.fromNumber}`, description: c.callNotes, timestamp: c.createdAt, channel: "PHONE" });
  }
  for (const e of emails) {
    unifiedTimeline.push({ type: "EMAIL", title: e.subject, description: e.bodyText?.slice(0, 100), timestamp: e.createdAt, channel: "EMAIL", from: e.fromEmail });
  }
  for (const s of sms) {
    unifiedTimeline.push({ type: "SMS", title: `SMS ${s.direction}`, description: s.messageText.slice(0, 100), timestamp: s.createdAt, channel: "SMS" });
  }
  for (const m of socialMessages) {
    unifiedTimeline.push({ type: "SOCIAL", title: `${m.platform} message`, description: m.messageText?.slice(0, 100), timestamp: m.receivedAt, channel: m.platform });
  }
  for (const t of timelineEvents) {
    unifiedTimeline.push({ type: t.type, title: t.title, description: t.description, timestamp: t.createdAt, channel: "CRM", user: t.actor });
  }
  unifiedTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({
    stats,
    connectedAccounts,
    phoneCalls,
    emails,
    sms,
    notifications,
    consentRecords,
    documentVersions: docVersions,
    aiClassifications,
    unifiedTimeline: unifiedTimeline.slice(0, 50),
    recentTimelineEvents: timelineEvents,
  });
}
