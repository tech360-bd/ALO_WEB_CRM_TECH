/**
 * After-Hours AI Auto Reply Engine
 * Bangladesh time 18:00-10:00, office Sat-Thu 09:00-18:00, Friday closed
 */
import { db } from '@/lib/db';
import { isAfterHours, AFTER_HOURS_MESSAGE } from './unified-engine';

export async function handleAfterHoursMessage(params: {
  channel: string;
  senderPhone?: string;
  senderEmail?: string;
  message: string;
  leadId?: string;
  studentId?: string;
}): Promise<{ isAfterHours: boolean; autoReply: string | null; leadCreated?: boolean; leadId?: string; taskCreated?: boolean }> {
  const after = isAfterHours(new Date());
  if (!after) return { isAfterHours: false, autoReply: null };

  let leadCreated = false;
  let leadId = params.leadId;

  // If new contact gives phone/email during after-hours, create lead
  const hasContact = params.senderPhone || params.senderEmail;
  const hasInfo = params.message.length > 10; // simple check: if user shared name/phone/country/level/intake
  if (hasContact && !params.leadId && !params.studentId && hasInfo) {
    try {
      // Detect if message contains phone/email-like patterns
      const phoneMatch = params.senderPhone || params.message.match(/\+?88?\d{10,13}/)?.[0];
      const emailMatch = params.senderEmail || params.message.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
      if (phoneMatch || emailMatch) {
        const lead = await db.marketingLead.create({
          data: {
            name: params.message.substring(0, 60) || 'After-hours lead',
            phone: phoneMatch || params.senderPhone || '',
            email: emailMatch || params.senderEmail || '',
            source: `after_hours_${params.channel}`,
            sourceDetail: params.message.substring(0, 200),
            status: 'new',
            createdById: 'after-hours-bot',
          }
        });
        leadCreated = true;
        leadId = lead.id;
        // Create follow-up task for next working hour 10:00 Dhaka
        const nextWorking = new Date();
        if (new Date().getHours() >= 18) nextWorking.setDate(nextWorking.getDate() + 1);
        // Skip Friday
        if (nextWorking.getDay() === 5) nextWorking.setDate(nextWorking.getDate() + 1);
        nextWorking.setUTCHours(4, 0, 0, 0); // 10:00 Dhaka = 04:00 UTC
        await db.counselorTask.create({
          data: {
            employeeId: '',
            leadId: lead.id,
            title: 'After-hours lead follow-up',
            description: `Lead from ${params.channel} after hours: ${params.message.substring(0,200)}`,
            priority: 'high',
            type: 'follow_up',
            status: 'pending',
            dueDate: nextWorking.toISOString(),
          }
        }).catch(()=>{});
      }
    } catch {}
  }

  return {
    isAfterHours: true,
    autoReply: AFTER_HOURS_MESSAGE,
    leadCreated,
    leadId,
    taskCreated: leadCreated,
  };
}

export async function getOfficeHoursStatus(): Promise<{ isAfterHours: boolean; message: string; nextOpen: string }> {
  const after = isAfterHours(new Date());
  if (after) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 5) tomorrow.setDate(tomorrow.getDate() + 1); // skip Friday
    tomorrow.setUTCHours(4, 0, 0, 0);
    return { isAfterHours: true, message: AFTER_HOURS_MESSAGE, nextOpen: tomorrow.toISOString() };
  }
  return { isAfterHours: false, message: 'Office is open (10:00-18:00 Asia/Dhaka)', nextOpen: new Date().toISOString() };
}
