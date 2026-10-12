import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const RECIPIENT_TYPES = new Set(['STUDENT', 'PARTNER', 'EMPLOYEE', 'SUPER_ADMIN', 'CHAIRMAN']);
const CATEGORIES = new Set(['COMMUNICATION', 'DOCUMENT', 'APPLICATION', 'VISA', 'DEADLINE', 'MARKETING', 'SYSTEM']);
const PRIORITIES = new Set(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
function isAdministrator(auth: { userType: string; roles: string[] }) {
  return [auth.userType, ...auth.roles].some((role) => ADMIN_ROLES.has(role.toUpperCase()));
}
async function parseBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await req.json();
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
function safeNotificationSelect() {
  return { id: true, recipientType: true, channel: true, title: true, message: true, category: true, priority: true, isRead: true, createdAt: true, sentAt: true } as const;
}

// Global notification operations are restricted to administrators; payload fields
// such as metadata/actionUrl are intentionally not returned to clients.
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  const recipientType = (req.nextUrl.searchParams.get('recipientType') || '').toUpperCase();
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';
  if (recipientType && !RECIPIENT_TYPES.has(recipientType)) return NextResponse.json({ success: false, error: 'Unsupported recipient type.' }, { status: 400 });
  try {
    const notifications = await db.notificationEngine.findMany({
      where: { ...(recipientType ? { recipientType } : {}), ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' }, take: 50, select: safeNotificationSelect(),
    });
    return NextResponse.json({ notifications }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Notifications are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

// Only internal in-app notifications are implemented here; external delivery is not.
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  const body = await parseBody(req);
  if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  const recipientType = typeof body.recipientType === 'string' ? body.recipientType.trim().toUpperCase() : '';
  const recipientIdInput = typeof body.recipientId === 'string' ? body.recipientId.trim() : '';
  const channel = typeof body.channel === 'string' ? body.channel.trim().toUpperCase() : 'IN_APP';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim().toUpperCase() : 'SYSTEM';
  const priority = typeof body.priority === 'string' ? body.priority.trim().toUpperCase() : 'NORMAL';

  if (channel !== 'IN_APP') return NextResponse.json({ success: false, error: 'External email, SMS, push, and WhatsApp delivery is not configured.' }, { status: 501 });
  if (!RECIPIENT_TYPES.has(recipientType) || !recipientIdInput || !CATEGORIES.has(category) || !PRIORITIES.has(priority) || title.length < 1 || title.length > 160 || message.length < 1 || message.length > 4000) {
    return NextResponse.json({ success: false, error: 'Recipient, title, message, category, priority, or notification type is invalid.' }, { status: 400 });
  }

  try {
    let recipientId = recipientIdInput;
    if (recipientType === 'STUDENT') {
      const recipient = await db.student.findFirst({ where: { OR: [{ id: recipientIdInput }, { studentId: recipientIdInput }] }, select: { id: true } });
      if (!recipient) return NextResponse.json({ success: false, error: 'Recipient not found.' }, { status: 404 });
      recipientId = recipient.id;
    } else if (recipientType === 'PARTNER') {
      const recipient = await db.partnerProfile.findFirst({ where: { OR: [{ id: recipientIdInput }, { partnerId: recipientIdInput }, { userId: recipientIdInput }] }, select: { partnerId: true } });
      if (!recipient) return NextResponse.json({ success: false, error: 'Recipient not found.' }, { status: 404 });
      recipientId = recipient.partnerId;
    } else if (recipientType === 'EMPLOYEE') {
      const employee = await db.employee.findFirst({ where: { OR: [{ id: recipientIdInput }, { employeeId: recipientIdInput }, { userId: recipientIdInput }] }, select: { employeeId: true } });
      const hrProfile = employee ? null : await db.employeeHR.findFirst({ where: { OR: [{ userId: recipientIdInput }, { employeeId: recipientIdInput }] }, select: { employeeId: true } });
      const recipient = employee || hrProfile;
      if (!recipient) return NextResponse.json({ success: false, error: 'Recipient not found.' }, { status: 404 });
      recipientId = recipient.employeeId;
    } else {
      const portalUser = await db.portalUser.findFirst({ where: { OR: [{ id: recipientIdInput }, { email: recipientIdInput }] }, select: { id: true } });
      const user = portalUser ? null : await db.user.findFirst({ where: { OR: [{ id: recipientIdInput }, { email: recipientIdInput }] }, select: { id: true } });
      const recipient = portalUser || user;
      if (!recipient) return NextResponse.json({ success: false, error: 'Recipient not found.' }, { status: 404 });
      recipientId = recipient.id;
    }

    const notification = await db.notificationEngine.create({
      data: { recipientType, recipientId, channel: 'IN_APP', title, message, category, priority, isRead: false, sentAt: new Date() },
      select: safeNotificationSelect(),
    });
    await logAuditAction(auth, 'OMNICHANNEL_IN_APP_NOTIFICATION_CREATED', 'NotificationEngine', notification.id, { recipientType, category, priority });
    return NextResponse.json({ notification, delivery: 'IN_APP_RECORD_CREATED', externalDelivery: 'NOT_CONFIGURED' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Notification could not be created.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

// Mark-read mutation restricted to an administrator and one existing notification.
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  const body = await parseBody(req);
  if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id || typeof body.isRead !== 'boolean') return NextResponse.json({ success: false, error: 'A notification ID and boolean read state are required.' }, { status: 400 });

  try {
    const existing = await db.notificationEngine.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Notification not found.' }, { status: 404 });
    const notification = await db.notificationEngine.update({
      where: { id }, data: { isRead: body.isRead, readAt: body.isRead ? new Date() : null }, select: safeNotificationSelect(),
    });
    await logAuditAction(auth, body.isRead ? 'OMNICHANNEL_NOTIFICATION_MARKED_READ' : 'OMNICHANNEL_NOTIFICATION_MARKED_UNREAD', 'NotificationEngine', id);
    return NextResponse.json({ notification }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Notification could not be updated.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
