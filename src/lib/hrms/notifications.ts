// ALO HRMS — Notification helpers (joining, confirmation, increment, promotion, expiry, birthday, anniversary, payroll, salary)
import { db } from '@/lib/db';

export type HrmNotiCategory = 'JOINING'|'CONFIRMATION'|'INCREMENT'|'PROMOTION'|'DOCUMENT_EXPIRY'|'PASSPORT_EXPIRY'|'VISA_EXPIRY'|'CONTRACT_EXPIRY'|'BIRTHDAY'|'ANNIVERSARY'|'PAYROLL_READY'|'SALARY_PAID'|'LEAVE'|'NOTICE'|'EXIT';

export async function createHrmNotification(params: {
  recipientId: string;
  recipientRole?: string;
  title: string;
  message: string;
  category: HrmNotiCategory;
  priority?: string;
  actionUrl?: string;
  metadata?: any;
}): Promise<void> {
  try {
    await db.hrmNotification.create({
      data: {
        recipientId: params.recipientId,
        recipientRole: params.recipientRole || 'EMPLOYEE',
        title: params.title,
        message: params.message,
        category: params.category,
        priority: params.priority || 'NORMAL',
        actionUrl: params.actionUrl || '',
        metadata: JSON.stringify(params.metadata||{}),
      }
    });
    // also mirror to generic NotificationEngine for inbox compatibility
    await db.notificationEngine.create({
      data: {
        recipientType: 'EMPLOYEE',
        recipientId: params.recipientId,
        channel: 'IN_APP',
        title: params.title,
        message: params.message,
        category: 'SYSTEM',
        priority: params.priority || 'NORMAL',
        actionUrl: params.actionUrl || '',
        metadata: JSON.stringify(params.metadata||{}),
      }
    }).catch(()=>{});
  } catch {}
}

export async function notifyExpiries(): Promise<number> {
  // called by cron: document/passport/visa/contract expiry within 30 days
  let count=0;
  const now = new Date();
  const in30 = new Date(now.getTime()+30*86400000);
  const threshold = in30.toISOString().slice(0,10);
  try {
    const docs = await db.employeeDocument.findMany({ where: { expiryDate: { not: "" } } }).catch(()=>[]);
    for (const d of docs as any[]) {
      if (d.expiryDate && d.expiryDate <= threshold && d.expiryDate >= now.toISOString().slice(0,10)) {
        await createHrmNotification({
          recipientId: d.employeeId,
          title: `Document expiring: ${d.documentType}`,
          message: `Your ${d.documentType} expires on ${d.expiryDate}. Please renew.`,
          category: 'DOCUMENT_EXPIRY',
          priority: 'HIGH',
          actionUrl: '/crm/hrm/documents',
        });
        count++;
      }
    }
    // HR master passportExpiry
    const employees = await db.employeeHR.findMany({ where: { status: 'ACTIVE' } }).catch(()=>[]);
    for (const e of employees as any[]) {
      if (e.passportExpiry && e.passportExpiry <= threshold) {
        await createHrmNotification({
          recipientId: e.userId,
          title: `Passport expiring`,
          message: `Passport for ${e.fullName||e.employeeId} expires ${e.passportExpiry}`,
          category: 'PASSPORT_EXPIRY',
          priority: 'HIGH',
          actionUrl: '/crm/hrm/profile',
        });
        count++;
      }
      if (e.dob) {
        const dob = new Date(e.dob);
        if (!isNaN(dob.getTime())) {
          const thisYearBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
          const diff = Math.ceil((thisYearBday.getTime()-now.getTime())/86400000);
          if (diff>=0 && diff<=7) {
            await createHrmNotification({
              recipientId: e.userId,
              title: 'Birthday upcoming',
              message: `Birthday of ${e.fullName||e.employeeId} on ${thisYearBday.toISOString().slice(0,10)}`,
              category: 'BIRTHDAY',
              actionUrl: '/crm/hrm/analytics',
            });
            count++;
          }
        }
      }
    }
  } catch {}
  return count;
}
