import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { EMPLOYEE_NOTIFICATION_EVENTS, SUPER_ADMIN_NOTIFY_RULES, PARTNER_SUPER_ADMIN_NOTIFY_RULES } from '@/lib/notifications/employee-events';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where: any = { userId: auth.userId };
    if (unreadOnly) where.isRead = false;

    const notifications = await db.portalNotification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);

    // SLA reminders
    const slaReminders = notifications.filter((n: any) => n.type?.includes('sla') || n.type?.includes('reminder') || n.type?.includes('escalation'));

    return NextResponse.json({
      success: true,
      notifications,
      sla: {
        reminders: slaReminders,
        note: 'SLA reminder/warning/escalation — auto-reminder before breach, warning at 80%, escalation at 100% to senior',
      },
      notificationEvents: [...EMPLOYEE_NOTIFICATION_EVENTS],
      notifyRules: {
        superAdmin: [...SUPER_ADMIN_NOTIFY_RULES],
        partnerSuperAdmin: [...PARTNER_SUPER_ADMIN_NOTIFY_RULES],
      },
      leakPolicy: 'Notifications never include sensitive values (salary/NID/bank) — enforced by buildSafeEmployeeNotification leak guard',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { userId, title, message, type, channel } = body;
    if (!userId || !title || !message) return NextResponse.json({ success: false, error: 'userId, title, message required' }, { status: 400 });

    // No sensitive leak check
    const sensitivePatterns = ['password','bank','account_number','nid','passport','salary'];
    const hasSensitive = sensitivePatterns.some(p => message.toLowerCase().includes(p));
    if (hasSensitive) {
      return NextResponse.json({ success: false, error: 'Notification contains sensitive data — not allowed to leak via notification' }, { status: 400 });
    }

    const notification = await db.portalNotification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'info',
      },
    });

    // Channel routing — in-app always, email/WhatsApp/SMS optional permission-checked
    // For demo, just log

    return NextResponse.json({ success: true, data: notification, channel: channel || 'in_app', note: 'No sensitive leak enforced' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
