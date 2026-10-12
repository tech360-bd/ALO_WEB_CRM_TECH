/**
 * SMS & WhatsApp message templates.
 *
 * Compliance notes follow coreyhaines31/marketingskills → skills/sms:
 * every marketing message carries sender identity + opt-out ("Reply STOP"),
 * sends stay inside the recipient's local 8am–8pm window, and transactional
 * messages (reminders) are kept separate from promotional sends.
 */

export type SmsTemplate = {
  id: string;
  name: string;
  channel: 'SMS' | 'WhatsApp' | 'SMS + WhatsApp';
  /** Trigger, e.g. "Form submitted" */
  trigger: string;
  /** Send timing relative to the trigger */
  timing: string;
  body: string;
  /** Compliance requirement baked into the template */
  compliance: string;
};

export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'welcome-sms',
    name: 'Welcome message',
    channel: 'SMS + WhatsApp',
    trigger: 'Website form submitted',
    timing: 'Immediate',
    body:
      'ALO Education: thanks {{first_name}}! A counselor will call you within 24 hours. Your free consultation link: {{booking_url}}. Reply STOP to opt out.',
    compliance: 'Sender name + STOP opt-out in every send; send only 8am–8pm local time.',
  },
  {
    id: 'consultation-reminder',
    name: 'Consultation reminder',
    channel: 'SMS + WhatsApp',
    trigger: 'Consultation booked',
    timing: '24 hours before, then 1 hour before',
    body:
      'ALO Education: reminder — your free consultation with {{counselor_name}} is {{when}}. Join: {{meeting_link}}. Need to reschedule? Reply here.',
    compliance: 'Transactional — may send outside promo windows, but never after 9pm local.',
  },
  {
    id: 'document-reminder',
    name: 'Document checklist nudge',
    channel: 'WhatsApp',
    trigger: 'Application file opened, no upload in 3 days',
    timing: 'Day 3 and day 7',
    body:
      'ALO Education: your {{country}} visa checklist is waiting in the portal — {{missing_count}} documents still missing. Upload here: {{portal_url}}. Reply STOP to opt out.',
    compliance: 'Promotional — STOP honored; stop after 2 sends per trigger.',
  },
  {
    id: 'deadline-alert',
    name: 'Intake deadline alert',
    channel: 'SMS',
    trigger: 'University deadline within 14 days',
    timing: 'Day 14 and day 3 before deadline',
    body:
      'ALO Education: {{university}} application for {{intake}} closes {{date}}. Submit via your counselor: {{portal_url}}. Reply STOP to opt out.',
    compliance: 'Promotional — include STOP; suppress if application already submitted.',
  },
  {
    id: 'offer-nudge',
    name: 'Offer received nudge',
    channel: 'WhatsApp',
    trigger: 'Offer letter uploaded to portal',
    timing: 'Same day',
    body:
      'ALO Education: congratulations, {{first_name}} — your offer from {{university}} is in the portal. Next step: deposit + visa file. Book a review: {{booking_url}}.',
    compliance: 'Transactional (account-specific) — still include sender name.',
  },
  {
    id: 're-engagement',
    name: 'Cold lead re-engagement',
    channel: 'SMS',
    trigger: 'No contact for 30 days',
    timing: 'Once, then wait 60 days',
    body:
      'ALO Education: still planning to study abroad, {{first_name}}? Intakes are filling — a free 15-minute call can rebuild your timeline: {{booking_url}}. Reply STOP to opt out.',
    compliance: 'Promotional — hard cap of 1 send per 60 days per lead; STOP honored immediately.',
  },
];
