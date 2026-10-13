/**
 * Email templates — 12 production templates.
 * Each returns { subject, html, text } via renderEmail().
 * All templates accept typed params and never throw.
 */

import { renderEmail } from "./layout";
import { env } from "@/lib/env";

export type TemplateResult = { subject: string; html: string; text: string };

function btn(url: string, label: string): string {
  return `<a href="${url}" class="btn">${label}</a>`;
}

// ─── 1. Inquiry Confirmation ──────────────────────────────────────────────
export function inquiryConfirmation(p: {
  name: string;
  reference: string;
  inquiryType: string;
  email: string;
}): TemplateResult {
  const type = p.inquiryType.replace(/-/g, " ");
  return renderEmail({
    subject: "Thank you for your inquiry — Al Aminn",
    preheader: `Your inquiry ${p.reference} has been received`,
    accent: "orange",
    bodyHtml: `
      <h1>Thank you, ${escape(p.name)}</h1>
      <p>Your inquiry has been received and logged with reference <strong>${escape(p.reference)}</strong>.</p>
      <div class="meta">
        <strong>Reference:</strong> ${escape(p.reference)}<br/>
        <strong>Type:</strong> ${escape(type)}<br/>
        <strong>Expected response:</strong> Within one business day
      </div>
      <p>Our team is reviewing the details and will connect you with the right specialist. If you need to add context, reply to this email and include your reference number.</p>
      ${btn(env().siteUrl + "/#contact", "View your inquiry options")}
      <p style="font-size:13px;color:#6B7A99;">If you did not submit this inquiry, please ignore this email — no action is needed.</p>
    `,
    bodyText: `Thank you, ${p.name}

Your inquiry has been received and logged with reference ${p.reference}.

Reference: ${p.reference}
Type: ${type}
Expected response: Within one business day

Our team is reviewing the details and will connect you with the right specialist. If you need to add context, reply to this email and include your reference number.

Visit: ${env().siteUrl}/#contact

If you did not submit this inquiry, please ignore this email.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 2. Inquiry Received (Internal — to staff) ────────────────────────────
export function inquiryReceivedInternal(p: {
  reference: string;
  name: string;
  email: string;
  inquiryType: string;
  currentChallenge?: string | null;
  organization?: string | null;
}): TemplateResult {
  return renderEmail({
    subject: `New inquiry received — ${p.reference}`,
    preheader: `New inquiry ${p.reference} — ${p.name}`,
    accent: "orange",
    bodyHtml: `
      <h1>New inquiry received</h1>
      <div class="meta">
        <strong>Reference:</strong> ${escape(p.reference)}<br/>
        <strong>Name:</strong> ${escape(p.name)}<br/>
        <strong>Email:</strong> ${escape(p.email)}<br/>
        <strong>Type:</strong> ${escape(p.inquiryType.replace(/-/g, " "))}<br/>
        ${p.organization ? `<strong>Organization:</strong> ${escape(p.organization)}<br/>` : ""}
      </div>
      ${p.currentChallenge ? `<h2>Current challenge</h2><p>${escape(p.currentChallenge)}</p>` : ""}
      <p>A follow-up task has been auto-created. Acknowledge within one business day via the Command Center.</p>
      ${btn(env().siteUrl + "/#staff", "Open Command Center")}
    `,
    bodyText: `New inquiry received

Reference: ${p.reference}
Name: ${p.name}
Email: ${p.email}
Type: ${p.inquiryType.replace(/-/g, " ")}
${p.organization ? "Organization: " + p.organization : ""}

${p.currentChallenge ? "Current challenge:\n" + p.currentChallenge + "\n\n" : ""}A follow-up task has been auto-created. Acknowledge within one business day via the Command Center.

Open: ${env().siteUrl}/#staff`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 3. Meeting Confirmation ──────────────────────────────────────────────
export function meetingConfirmation(p: {
  name: string;
  meetingType: string;
  scheduledAt: string;
  durationMin: number;
  timezone: string;
  location?: string;
  joinUrl?: string;
}): TemplateResult {
  return renderEmail({
    subject: "Your meeting is confirmed — Al Aminn",
    preheader: `Your meeting is confirmed — ${p.scheduledAt}`,
    accent: "blue",
    bodyHtml: `
      <h1>Your meeting is confirmed</h1>
      <p>Hi ${escape(p.name)}, your ${escape(p.meetingType)} meeting with Al Aminn is confirmed.</p>
      <div class="meta">
        <strong>When:</strong> ${escape(p.scheduledAt)} (${escape(p.timezone)})<br/>
        <strong>Duration:</strong> ${p.durationMin} minutes<br/>
        <strong>Type:</strong> ${escape(p.meetingType)}<br/>
        ${p.location ? `<strong>Location:</strong> ${escape(p.location)}<br/>` : ""}
      </div>
      ${p.joinUrl ? btn(p.joinUrl, "Join the meeting") : ""}
      <p>Please arrive 2 minutes early. If you need to reschedule, reply to this email at least 4 hours before the start time.</p>
    `,
    bodyText: `Your meeting is confirmed

Hi ${p.name}, your ${p.meetingType} meeting with Al Aminn is confirmed.

When: ${p.scheduledAt} (${p.timezone})
Duration: ${p.durationMin} minutes
Type: ${p.meetingType}
${p.location ? "Location: " + p.location : ""}

${p.joinUrl ? "Join: " + p.joinUrl + "\n\n" : ""}Please arrive 2 minutes early. If you need to reschedule, reply to this email at least 4 hours before the start time.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 4. Meeting Reminder ──────────────────────────────────────────────────
export function meetingReminder(p: {
  name: string;
  scheduledAt: string;
  durationMin: number;
  joinUrl?: string;
}): TemplateResult {
  return renderEmail({
    subject: "Reminder: your meeting with Al Aminn starts soon",
    preheader: `Reminder: your meeting starts soon`,
    accent: "blue",
    bodyHtml: `
      <h1>Meeting reminder</h1>
      <p>Hi ${escape(p.name)}, this is a reminder for your upcoming meeting with Al Aminn.</p>
      <div class="meta">
        <strong>Starts:</strong> ${escape(p.scheduledAt)}<br/>
        <strong>Duration:</strong> ${p.durationMin} minutes
      </div>
      ${p.joinUrl ? btn(p.joinUrl, "Join now") : ""}
      <p>Looking forward to our conversation.</p>
    `,
    bodyText: `Meeting reminder

Hi ${p.name}, this is a reminder for your upcoming meeting with Al Aminn.

Starts: ${p.scheduledAt}
Duration: ${p.durationMin} minutes

${p.joinUrl ? "Join now: " + p.joinUrl + "\n\n" : ""}Looking forward to our conversation.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 5. Newsletter Verification ───────────────────────────────────────────
export function newsletterVerification(p: {
  email: string;
  verifyUrl: string;
}): TemplateResult {
  return renderEmail({
    subject: "Please verify your email — Alaminn.info",
    preheader: `Please verify your email to start receiving insights`,
    accent: "blue",
    bodyHtml: `
      <h1>Verify your email</h1>
      <p>Welcome! Please confirm your email address to start receiving executive insights and operational strategy updates from Al Aminn.</p>
      ${btn(p.verifyUrl, "Verify email address")}
      <p style="font-size:13px;color:#6B7A99;">This link expires in 24 hours. If you did not subscribe, you can safely ignore this email — your address will not be added to any list.</p>
    `,
    bodyText: `Verify your email

Welcome! Please confirm your email address to start receiving executive insights and operational strategy updates from Al Aminn.

Verify: ${p.verifyUrl}

This link expires in 24 hours. If you did not subscribe, you can safely ignore this email — your address will not be added to any list.`,
  });
}

// ─── 6. Newsletter Welcome ────────────────────────────────────────────────
export function newsletterWelcome(p: {
  name?: string | null;
  email: string;
}): TemplateResult {
  return renderEmail({
    subject: "Welcome to the Alaminn.info brief",
    preheader: `You're in. Here's what to expect.`,
    accent: "orange",
    bodyHtml: `
      <h1>Welcome aboard${p.name ? `, ${escape(p.name)}` : ""}</h1>
      <p>Your email is verified. You'll now receive the bi-weekly brief: executive insights on operations, growth, education strategy and AI governance — no fluff, no spam.</p>
      <h2>What to expect</h2>
      <p>• Bi-weekly briefs (every other Tuesday)<br/>
      • Occasional deep-dives on AI governance and operating systems<br/>
      • Early access to resources and templates</p>
      ${btn(env().siteUrl + "/#insights", "Read recent insights")}
      <p>You can unsubscribe anytime using the link in any email.</p>
    `,
    bodyText: `Welcome aboard${p.name ? ", " + p.name : ""}

Your email is verified. You'll now receive the bi-weekly brief: executive insights on operations, growth, education strategy and AI governance — no fluff, no spam.

What to expect:
• Bi-weekly briefs (every other Tuesday)
• Occasional deep-dives on AI governance and operating systems
• Early access to resources and templates

Read recent insights: ${env().siteUrl}/#insights

You can unsubscribe anytime using the link in any email.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 7. Newsletter Unsubscribe ────────────────────────────────────────────
export function newsletterUnsubscribe(p: {
  email: string;
  reason?: string | null;
}): TemplateResult {
  return renderEmail({
    subject: "You have been unsubscribed — Alaminn.info",
    preheader: `You've been unsubscribed`,
    accent: "blue",
    bodyHtml: `
      <h1>You're unsubscribed</h1>
      <p>Your email <strong>${escape(p.email)}</strong> has been removed from the Alaminn.info newsletter. You will not receive further updates.</p>
      ${p.reason ? `<p><em>Reason noted: ${escape(p.reason)}</em></p>` : ""}
      <p>If this was a mistake, you can resubscribe anytime from the website footer.</p>
      ${btn(env().siteUrl + "/#newsletter", "Resubscribe")}
    `,
    bodyText: `You're unsubscribed

Your email ${p.email} has been removed from the Alaminn.info newsletter. You will not receive further updates.

${p.reason ? "Reason noted: " + p.reason + "\n\n" : ""}If this was a mistake, you can resubscribe anytime from the website footer.

Resubscribe: ${env().siteUrl}/#newsletter`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 8. AI Task Completed ─────────────────────────────────────────────────
export function aiTaskCompleted(p: {
  workflow: string;
  objective: string;
  reviewUrl: string;
}): TemplateResult {
  return renderEmail({
    subject: "Your AI task output is ready for review",
    preheader: `Your AI task output is ready for review`,
    accent: "orange",
    bodyHtml: `
      <h1>AI task completed</h1>
      <p>Your AI task for <strong>${escape(p.workflow)}</strong> has finished processing. The output is ready for your review.</p>
      <div class="meta">
        <strong>Workflow:</strong> ${escape(p.workflow)}<br/>
        <strong>Objective:</strong> ${escape(p.objective)}
      </div>
      <p>The output will not be published until you approve it. This is part of the governed AI workflow — all external outputs require human approval.</p>
      ${btn(p.reviewUrl, "Review output")}
    `,
    bodyText: `AI task completed

Your AI task for ${p.workflow} has finished processing. The output is ready for your review.

Workflow: ${p.workflow}
Objective: ${p.objective}

The output will not be published until you approve it. This is part of the governed AI workflow — all external outputs require human approval.

Review output: ${p.reviewUrl}`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 9. AI Task Requires Review ───────────────────────────────────────────
export function aiTaskRequiresReview(p: {
  workflow: string;
  sensitivity: string;
  submittedBy: string;
  reviewUrl: string;
}): TemplateResult {
  return renderEmail({
    subject: "AI task requires your review — Alaminn.info",
    preheader: `AI task awaiting approval — ${p.sensitivity} sensitivity`,
    accent: "orange",
    bodyHtml: `
      <h1>AI task requires your review</h1>
      <p>An AI task with <strong>${escape(p.sensitivity)}</strong> sensitivity is awaiting approval before it can be published or acted upon.</p>
      <div class="meta">
        <strong>Workflow:</strong> ${escape(p.workflow)}<br/>
        <strong>Sensitivity:</strong> ${escape(p.sensitivity)}<br/>
        <strong>Submitted by:</strong> ${escape(p.submittedBy)}
      </div>
      <p>Per governance policy, this task cannot proceed without explicit human approval. Please review at your earliest convenience.</p>
      ${btn(p.reviewUrl, "Open approval queue")}
    `,
    bodyText: `AI task requires your review

An AI task with ${p.sensitivity} sensitivity is awaiting approval before it can be published or acted upon.

Workflow: ${p.workflow}
Sensitivity: ${p.sensitivity}
Submitted by: ${p.submittedBy}

Per governance policy, this task cannot proceed without explicit human approval. Please review at your earliest convenience.

Open approval queue: ${p.reviewUrl}`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 10. Password Reset ───────────────────────────────────────────────────
export function passwordReset(p: {
  name: string;
  resetUrl: string;
  expiresIn: string;
}): TemplateResult {
  return renderEmail({
    subject: "Reset your password — Alaminn.info",
    preheader: `Password reset request for your Alaminn.info account`,
    accent: "blue",
    bodyHtml: `
      <h1>Reset your password</h1>
      <p>Hi ${escape(p.name)}, a password reset was requested for your Alaminn.info staff account.</p>
      ${btn(p.resetUrl, "Reset password")}
      <p style="font-size:13px;color:#6B7A99;">This link expires in ${escape(p.expiresIn)}. If you did not request a reset, you can safely ignore this email — your password will not be changed.</p>
      <p style="font-size:13px;color:#6B7A99;">For security, this link can only be used once.</p>
    `,
    bodyText: `Reset your password

Hi ${p.name}, a password reset was requested for your Alaminn.info staff account.

Reset password: ${p.resetUrl}

This link expires in ${p.expiresIn}. If you did not request a reset, you can safely ignore this email — your password will not be changed.

For security, this link can only be used once.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 11. Staff Invitation ─────────────────────────────────────────────────
export function staffInvitation(p: {
  name: string;
  email: string;
  role: string;
  invitedBy: string;
  acceptUrl: string;
}): TemplateResult {
  return renderEmail({
    subject: "You are invited to join Alaminn.info",
    preheader: `You're invited to join the Alaminn.info team`,
    accent: "orange",
    bodyHtml: `
      <h1>You're invited</h1>
      <p>Hi ${escape(p.name)}, you've been invited to join the Alaminn.info Command Center as a <strong>${escape(p.role)}</strong>.</p>
      <div class="meta">
        <strong>Role:</strong> ${escape(p.role)}<br/>
        <strong>Invited by:</strong> ${escape(p.invitedBy)}<br/>
        <strong>Email:</strong> ${escape(p.email)}
      </div>
      <p>Click below to set your password and activate your account. This invitation expires in 7 days.</p>
      ${btn(p.acceptUrl, "Accept invitation")}
      <p style="font-size:13px;color:#6B7A99;">If you weren't expecting this invitation, you can safely ignore this email.</p>
    `,
    bodyText: `You're invited

Hi ${p.name}, you've been invited to join the Alaminn.info Command Center as a ${p.role}.

Role: ${p.role}
Invited by: ${p.invitedBy}
Email: ${p.email}

Click below to set your password and activate your account. This invitation expires in 7 days.

Accept invitation: ${p.acceptUrl}

If you weren't expecting this invitation, you can safely ignore this email.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 12. Security Alert ───────────────────────────────────────────────────
export function securityAlert(p: {
  recipientName: string;
  alertType: string;
  description: string;
  timestamp: string;
  ipHash?: string | null;
  actionRequired?: string;
}): TemplateResult {
  return renderEmail({
    subject: "Security alert — Alaminn.info",
    preheader: `Security alert — ${p.alertType}`,
    accent: "orange",
    bodyHtml: `
      <h1>Security alert</h1>
      <p>Hi ${escape(p.recipientName)}, we detected activity on your Alaminn.info account that we want to flag.</p>
      <div class="meta">
        <strong>Alert type:</strong> ${escape(p.alertType)}<br/>
        <strong>Time:</strong> ${escape(p.timestamp)}<br/>
        ${p.ipHash ? `<strong>Source (hashed):</strong> ${escape(p.ipHash)}<br/>` : ""}
      </div>
      <h2>What happened</h2>
      <p>${escape(p.description)}</p>
      ${p.actionRequired ? `<h2>Action required</h2><p>${escape(p.actionRequired)}</p>` : ""}
      <p>If this was you, no action is needed. If you don't recognize this activity, please sign in and change your password immediately.</p>
      ${btn(env().siteUrl + "/#staff", "Sign in to Command Center")}
    `,
    bodyText: `Security alert

Hi ${p.recipientName}, we detected activity on your Alaminn.info account that we want to flag.

Alert type: ${p.alertType}
Time: ${p.timestamp}
${p.ipHash ? "Source (hashed): " + p.ipHash : ""}

What happened:
${p.description}

${p.actionRequired ? "Action required:\n" + p.actionRequired + "\n\n" : ""}If this was you, no action is needed. If you don't recognize this activity, please sign in and change your password immediately.

Sign in: ${env().siteUrl}/#staff`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 13. Student Registration Confirmation ───────────────────────────────
export function studentRegistration(p: {
  name: string;
  email: string;
  studentId: string;
  loginUrl: string;
}): TemplateResult {
  return renderEmail({
    subject: "Welcome to Alaminn.info Higher Study — your account is ready",
    preheader: `Your student account ${p.studentId} is active`,
    accent: "orange",
    bodyHtml: `
      <h1>Welcome, ${escape(p.name)}</h1>
      <p>Your Higher Study student account has been created successfully. You can now track applications, save universities and courses, and receive personalised deadline alerts.</p>
      <div class="meta">
        <strong>Student ID:</strong> ${escape(p.studentId)}<br/>
        <strong>Email:</strong> ${escape(p.email)}<br/>
        <strong>Platform:</strong> Alaminn.info Higher Study
      </div>
      ${btn(p.loginUrl, "Sign in to your account")}
      <p style="font-size:13px;color:#6B7A99;">Keep your Student ID safe — you'll need it for all future applications and correspondence.</p>
    `,
    bodyText: `Welcome, ${p.name}

Your Higher Study student account has been created successfully. You can now track applications, save universities and courses, and receive personalised deadline alerts.

Student ID: ${p.studentId}
Email: ${p.email}
Platform: Alaminn.info Higher Study

Sign in: ${p.loginUrl}

Keep your Student ID safe — you'll need it for all future applications and correspondence.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 14. OTP Verification Code ────────────────────────────────────────────
export function otpVerification(p: {
  name: string;
  code: string;
  purpose: string;
  expiresIn: string;
}): TemplateResult {
  return renderEmail({
    subject: `Your verification code: ${p.code}`,
    preheader: `OTP for ${p.purpose} — expires in ${p.expiresIn}`,
    accent: "blue",
    bodyHtml: `
      <h1>Your verification code</h1>
      <p>Hi ${escape(p.name)}, use the code below to complete your <strong>${escape(p.purpose)}</strong>. This code is single-use and expires in ${escape(p.expiresIn)}.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;font-family:'DM Serif Display',Georgia,serif;font-size:42px;letter-spacing:12px;padding:20px 32px;background:#F1F4FA;border:2px dashed #0B63CE;border-radius:12px;color:#0F1B3D;font-weight:700;">${escape(p.code)}</div>
      </div>
      <p style="font-size:13px;color:#6B7A99;">If you did not request this code, please ignore this email — no action will be taken on your account. Never share this code with anyone, including staff claiming to be from Alaminn.info.</p>
    `,
    bodyText: `Your verification code

Hi ${p.name}, use the code below to complete your ${p.purpose}. This code is single-use and expires in ${p.expiresIn}.

  ${p.code}

If you did not request this code, please ignore this email — no action will be taken on your account. Never share this code with anyone, including staff claiming to be from Alaminn.info.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 15. Account Activation ───────────────────────────────────────────────
export function accountActivation(p: {
  name: string;
  email: string;
  activateUrl: string;
  expiresIn: string;
}): TemplateResult {
  return renderEmail({
    subject: "Activate your Alaminn.info account",
    preheader: `Activate your account — link expires in ${p.expiresIn}`,
    accent: "orange",
    bodyHtml: `
      <h1>Activate your account</h1>
      <p>Hi ${escape(p.name)}, your account has been created. Click the button below to activate it and set your password.</p>
      <div class="meta">
        <strong>Email:</strong> ${escape(p.email)}<br/>
        <strong>Expires in:</strong> ${escape(p.expiresIn)}
      </div>
      ${btn(p.activateUrl, "Activate account")}
      <p style="font-size:13px;color:#6B7A99;">This activation link can only be used once. If it expires, you can request a new one from the sign-in page.</p>
    `,
    bodyText: `Activate your account

Hi ${p.name}, your account has been created. Click the link below to activate it and set your password.

Email: ${p.email}
Expires in: ${p.expiresIn}

Activate: ${p.activateUrl}

This activation link can only be used once. If it expires, you can request a new one from the sign-in page.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 16. Consultation Requested ───────────────────────────────────────────
export function consultationRequested(p: {
  name: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  topic: string;
  reference: string;
}): TemplateResult {
  return renderEmail({
    subject: `Consultation request received — ${p.reference}`,
    preheader: `We've received your consultation request for ${p.topic}`,
    accent: "orange",
    bodyHtml: `
      <h1>Consultation request received</h1>
      <p>Hi ${escape(p.name)}, we've received your request for a 1:1 consultation. Our team will confirm your slot within one business day.</p>
      <div class="meta">
        <strong>Reference:</strong> ${escape(p.reference)}<br/>
        <strong>Topic:</strong> ${escape(p.topic)}<br/>
        <strong>Preferred date:</strong> ${escape(p.preferredDate)}<br/>
        <strong>Preferred time:</strong> ${escape(p.preferredTime)} (${escape(p.timezone)})
      </div>
      <p>If you need to reschedule or cancel, reply to this email with your reference number. A calendar invitation will be sent once the slot is confirmed.</p>
      ${btn(env().siteUrl + "/higher-study/book-consultation", "View consultation options")}
    `,
    bodyText: `Consultation request received

Hi ${p.name}, we've received your request for a 1:1 consultation. Our team will confirm your slot within one business day.

Reference: ${p.reference}
Topic: ${p.topic}
Preferred date: ${p.preferredDate}
Preferred time: ${p.preferredTime} (${p.timezone})

If you need to reschedule or cancel, reply to this email with your reference number. A calendar invitation will be sent once the slot is confirmed.

View: ${env().siteUrl}/higher-study/book-consultation`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 17. Consultation Confirmed ───────────────────────────────────────────
export function consultationConfirmed(p: {
  name: string;
  scheduledAt: string;
  durationMin: number;
  timezone: string;
  counsellorName: string;
  joinUrl?: string;
  reference: string;
}): TemplateResult {
  return renderEmail({
    subject: `Consultation confirmed — ${p.scheduledAt}`,
    preheader: `Your consultation with ${p.counsellorName} is confirmed`,
    accent: "blue",
    bodyHtml: `
      <h1>Your consultation is confirmed</h1>
      <p>Hi ${escape(p.name)}, your 1:1 consultation with <strong>${escape(p.counsellorName)}</strong> has been booked.</p>
      <div class="meta">
        <strong>Reference:</strong> ${escape(p.reference)}<br/>
        <strong>When:</strong> ${escape(p.scheduledAt)} (${escape(p.timezone)})<br/>
        <strong>Duration:</strong> ${p.durationMin} minutes<br/>
        <strong>Counsellor:</strong> ${escape(p.counsellorName)}
      </div>
      ${p.joinUrl ? btn(p.joinUrl, "Join the consultation") : ""}
      <p>Please join 2 minutes early. Have your goals and any documents ready. If you need to reschedule, reply at least 4 hours before the start time.</p>
    `,
    bodyText: `Your consultation is confirmed

Hi ${p.name}, your 1:1 consultation with ${p.counsellorName} has been booked.

Reference: ${p.reference}
When: ${p.scheduledAt} (${p.timezone})
Duration: ${p.durationMin} minutes
Counsellor: ${p.counsellorName}

${p.joinUrl ? "Join: " + p.joinUrl + "\n\n" : ""}Please join 2 minutes early. Have your goals and any documents ready. If you need to reschedule, reply at least 4 hours before the start time.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 18. Consultation Scheduled Reminder ──────────────────────────────────
export function consultationScheduled(p: {
  name: string;
  scheduledAt: string;
  durationMin: number;
  counsellorName: string;
  joinUrl?: string;
  reference: string;
}): TemplateResult {
  return renderEmail({
    subject: "Reminder: your consultation starts soon",
    preheader: `Your consultation with ${p.counsellorName} starts soon`,
    accent: "blue",
    bodyHtml: `
      <h1>Consultation reminder</h1>
      <p>Hi ${escape(p.name)}, this is a reminder for your upcoming consultation.</p>
      <div class="meta">
        <strong>Reference:</strong> ${escape(p.reference)}<br/>
        <strong>Starts:</strong> ${escape(p.scheduledAt)}<br/>
        <strong>Duration:</strong> ${p.durationMin} minutes<br/>
        <strong>Counsellor:</strong> ${escape(p.counsellorName)}
      </div>
      ${p.joinUrl ? btn(p.joinUrl, "Join now") : ""}
      <p>Have your questions ready. We look forward to a productive session.</p>
    `,
    bodyText: `Consultation reminder

Hi ${p.name}, this is a reminder for your upcoming consultation.

Reference: ${p.reference}
Starts: ${p.scheduledAt}
Duration: ${p.durationMin} minutes
Counsellor: ${p.counsellorName}

${p.joinUrl ? "Join now: " + p.joinUrl + "\n\n" : ""}Have your questions ready. We look forward to a productive session.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 19. Application Status Update ────────────────────────────────────────
export function applicationStatusUpdate(p: {
  name: string;
  applicationId: string;
  programme: string;
  university: string;
  status: string;
  statusMessage: string;
  portalUrl: string;
}): TemplateResult {
  const statusAccent: "orange" | "blue" =
    p.status === "rejected" || p.status === "withdrawn" ? "orange" : "blue";
  return renderEmail({
    subject: `Application update — ${p.programme} at ${p.university}`,
    preheader: `Status: ${p.status} — ${p.applicationId}`,
    accent: statusAccent,
    bodyHtml: `
      <h1>Application status update</h1>
      <p>Hi ${escape(p.name)}, there's an update on your application.</p>
      <div class="meta">
        <strong>Application ID:</strong> ${escape(p.applicationId)}<br/>
        <strong>Programme:</strong> ${escape(p.programme)}<br/>
        <strong>University:</strong> ${escape(p.university)}<br/>
        <strong>Status:</strong> <span style="text-transform:uppercase;font-weight:700;">${escape(p.status)}</span>
      </div>
      <h2>What this means</h2>
      <p>${escape(p.statusMessage)}</p>
      ${btn(p.portalUrl, "View application details")}
      <p style="font-size:13px;color:#6B7A99;">If you have questions about this update, reply to this email with your Application ID. Our team typically responds within one business day.</p>
    `,
    bodyText: `Application status update

Hi ${p.name}, there's an update on your application.

Application ID: ${p.applicationId}
Programme: ${p.programme}
University: ${p.university}
Status: ${p.status.toUpperCase()}

What this means:
${p.statusMessage}

View application details: ${p.portalUrl}

If you have questions about this update, reply to this email with your Application ID. Our team typically responds within one business day.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 20. Scholarship Deadline Alert ───────────────────────────────────────
export function scholarshipDeadlineAlert(p: {
  name: string;
  scholarshipName: string;
  provider: string;
  deadlineDate: string;
  daysRemaining: number;
  applyUrl: string;
}): TemplateResult {
  const urgency = p.daysRemaining <= 3 ? "URGENT" : p.daysRemaining <= 7 ? "Soon" : "Reminder";
  return renderEmail({
    subject: `[${urgency}] Scholarship deadline — ${p.scholarshipName}`,
    preheader: `${p.daysRemaining} days remaining to apply for ${p.scholarshipName}`,
    accent: "orange",
    bodyHtml: `
      <h1>Scholarship deadline ${urgency.toLowerCase()}</h1>
      <p>Hi ${escape(p.name)}, this is a reminder that the deadline for the scholarship you saved is approaching.</p>
      <div class="meta">
        <strong>Scholarship:</strong> ${escape(p.scholarshipName)}<br/>
        <strong>Provider:</strong> ${escape(p.provider)}<br/>
        <strong>Deadline:</strong> ${escape(p.deadlineDate)}<br/>
        <strong>Days remaining:</strong> <span style="font-weight:700;color:#F26113;">${p.daysRemaining}</span>
      </div>
      ${btn(p.applyUrl, "Apply now")}
      <p style="font-size:13px;color:#6B7A99;">Late applications are typically not accepted. Start your application today and reach out if you need guidance on documents or eligibility.</p>
    `,
    bodyText: `Scholarship deadline ${urgency.toLowerCase()}

Hi ${p.name}, this is a reminder that the deadline for the scholarship you saved is approaching.

Scholarship: ${p.scholarshipName}
Provider: ${p.provider}
Deadline: ${p.deadlineDate}
Days remaining: ${p.daysRemaining}

Apply now: ${p.applyUrl}

Late applications are typically not accepted. Start your application today and reach out if you need guidance on documents or eligibility.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 21. PhD Deadline Alert ───────────────────────────────────────────────
export function phdDeadlineAlert(p: {
  name: string;
  projectTitle: string;
  supervisorName: string;
  university: string;
  deadlineDate: string;
  daysRemaining: number;
  applyUrl: string;
}): TemplateResult {
  const urgency = p.daysRemaining <= 3 ? "URGENT" : p.daysRemaining <= 7 ? "Soon" : "Reminder";
  return renderEmail({
    subject: `[${urgency}] PhD application deadline — ${p.university}`,
    preheader: `${p.daysRemaining} days remaining — ${p.projectTitle}`,
    accent: "orange",
    bodyHtml: `
      <h1>PhD application deadline ${urgency.toLowerCase()}</h1>
      <p>Hi ${escape(p.name)}, this is a reminder that the application deadline for a PhD project you saved is approaching.</p>
      <div class="meta">
        <strong>Project:</strong> ${escape(p.projectTitle)}<br/>
        <strong>Supervisor:</strong> ${escape(p.supervisorName)}<br/>
        <strong>University:</strong> ${escape(p.university)}<br/>
        <strong>Deadline:</strong> ${escape(p.deadlineDate)}<br/>
        <strong>Days remaining:</strong> <span style="font-weight:700;color:#F26113;">${p.daysRemaining}</span>
      </div>
      ${btn(p.applyUrl, "View project & apply")}
      <p style="font-size:13px;color:#6B7A99;">PhD applications typically require a research proposal, CV, and academic transcripts. Start early to give your referee time to write a strong letter.</p>
    `,
    bodyText: `PhD application deadline ${urgency.toLowerCase()}

Hi ${p.name}, this is a reminder that the application deadline for a PhD project you saved is approaching.

Project: ${p.projectTitle}
Supervisor: ${p.supervisorName}
University: ${p.university}
Deadline: ${p.deadlineDate}
Days remaining: ${p.daysRemaining}

View project & apply: ${p.applyUrl}

PhD applications typically require a research proposal, CV, and academic transcripts. Start early to give your referee time to write a strong letter.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── 22. Newsletter Confirmation (Double Opt-in) ──────────────────────────
export function newsletterConfirmation(p: {
  email: string;
  confirmUrl: string;
  ipAddress?: string | null;
  subscribedAt: string;
}): TemplateResult {
  return renderEmail({
    subject: "Please confirm your newsletter subscription",
    preheader: `Confirm your subscription to receive the Alaminn.info brief`,
    accent: "blue",
    bodyHtml: `
      <h1>Confirm your subscription</h1>
      <p>You're one step away from receiving the Alaminn.info brief — executive insights on operations, growth, education strategy and AI governance.</p>
      <div class="meta">
        <strong>Email:</strong> ${escape(p.email)}<br/>
        <strong>Subscribed:</strong> ${escape(p.subscribedAt)}<br/>
        ${p.ipAddress ? `<strong>From IP:</strong> ${escape(p.ipAddress)}<br/>` : ""}
        <strong>Frequency:</strong> Bi-weekly (every other Tuesday)
      </div>
      ${btn(p.confirmUrl, "Confirm subscription")}
      <p style="font-size:13px;color:#6B7A99;">We use double opt-in to protect your inbox. If you did not subscribe, you can safely ignore this email — your address will not be added to any list. This confirmation link expires in 24 hours.</p>
    `,
    bodyText: `Confirm your subscription

You're one step away from receiving the Alaminn.info brief — executive insights on operations, growth, education strategy and AI governance.

Email: ${p.email}
Subscribed: ${p.subscribedAt}
${p.ipAddress ? "From IP: " + p.ipAddress + "\n" : ""}Frequency: Bi-weekly (every other Tuesday)

Confirm subscription: ${p.confirmUrl}

We use double opt-in to protect your inbox. If you did not subscribe, you can safely ignore this email — your address will not be added to any list. This confirmation link expires in 24 hours.`,
  });
  function escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ─── Registry ─────────────────────────────────────────────────────────────
export const EMAIL_TEMPLATES = {
  // Original 12 templates
  inquiryConfirmation,
  inquiryReceivedInternal,
  meetingConfirmation,
  meetingReminder,
  newsletterVerification,
  newsletterWelcome,
  newsletterUnsubscribe,
  aiTaskCompleted,
  aiTaskRequiresReview,
  passwordReset,
  staffInvitation,
  securityAlert,
  // Higher Study & student lifecycle templates (11 added per SMTP_SETUP.md spec)
  studentRegistration,
  otpVerification,
  accountActivation,
  consultationRequested,
  consultationConfirmed,
  consultationScheduled,
  applicationStatusUpdate,
  scholarshipDeadlineAlert,
  phdDeadlineAlert,
  newsletterConfirmation,
} as const;

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES;
