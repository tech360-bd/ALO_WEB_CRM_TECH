import nodemailer from 'smtp-mailer';

/**
 * ALO Education Email Service
 * SMTP submission with explicit failure; no logging-only delivery fallback.
 */

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASSWORD: pass, SMTP_FROM: from } = process.env;
  if (!host || !user || !pass || !from) {
    return { success: false, error: 'SMTP_NOT_CONFIGURED' };
  }
  const port = Number(process.env.SMTP_PORT || '587');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { success: false, error: 'SMTP_INVALID_PORT' };
  }
  let transport: ReturnType<typeof nodemailer.createTransport> | undefined;
  try {
    transport = nodemailer.createTransport({
      host, port, secure: port === 465, requireTLS: port !== 465,
      auth: { user, pass },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 30000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    const result = await transport.sendMail({
      from, to: options.to, subject: options.subject, html: options.html, text: options.text,
    });
    if (!result.accepted?.length || result.rejected?.length || !result.messageId) {
      return { success: false, error: 'SMTP_NOT_ACCEPTED' };
    }
    // SMTP acceptance is not proof of inbox delivery. Never synthesize a fallback ID.
    return { success: true, messageId: result.messageId };
  } catch {
    // Do not expose provider responses containing credentials, addresses or reset links.
    return { success: false, error: 'SMTP_SEND_FAILED' };
  } finally {
    transport?.close();
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}

function appBaseUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL must be configured before sending account links');
  }
  const base = new URL(configured || 'http://localhost:3000');
  if (process.env.NODE_ENV === 'production' && base.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_APP_URL must use HTTPS in production');
  }
  if (base.username || base.password || base.search || base.hash) {
    throw new Error('NEXT_PUBLIC_APP_URL must be a clean application origin or base path');
  }
  return base;
}

export async function sendActivationEmail(
  to: string,
  name: string,
  employeeCode: string,
  token: string,
  details?: { designation?: string; companyEmail?: string; expiryHours?: number },
) {
  const activation = new URL('/employee/activate', appBaseUrl());
  activation.searchParams.set('token', token);
  const activationUrl = activation.toString();
  const safeActivationUrl = escapeHtml(activationUrl);
  const safeName = escapeHtml(name);
  const safeEmployeeCode = escapeHtml(employeeCode);
  const expiryHours = details?.expiryHours ?? 48;
  const designation = escapeHtml(details?.designation || 'Not assigned');
  const companyEmail = escapeHtml(details?.companyEmail || to);

  // Spec — ACTIVATION EMAIL must contain: Employee Name, Designation,
  // Company Email, Activation Link, Password Creation Instructions,
  // Activation Expiry, Support Contact.
  return sendEmail({
    to,
    subject: 'Activate your ALO Education employee account',
    text: `Hello ${name},

Your ALO Education employee account (${employeeCode}) is ready. Open this one-time activation link to create your password: ${activationUrl}

The link expires in ${expiryHours} hours. Contact ALO IT / HR Admin if you did not expect this message.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #2563EB;">Activate your ALO Education employee account</h2>
        <p>Hello <strong>${safeName}</strong>,</p>
        <p>Your ALO Education employee account has been created:</p>
        <table style="border-collapse: collapse; font-size: 14px; margin: 12px 0;">
          <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Employee Code</td><td><strong>${safeEmployeeCode}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Designation</td><td><strong>${designation}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Company Email</td><td><strong>${companyEmail}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Activation Expiry</td><td><strong>${expiryHours} hours</strong> from this email</td></tr>
        </table>
        <p><strong>Password creation instructions:</strong> Click the activation link below, then create a strong password (minimum 8 characters with at least one uppercase letter and one number). You cannot log in until your password has been created successfully.</p>
        <p style="margin: 24px 0;">
          <a href="${safeActivationUrl}" style="background-color: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activate Account</a>
        </p>
        <p style="color: #64748b; font-size: 13px;">This link expires in ${expiryHours} hours and can be used only once. If it expires, ask your administrator to resend the activation email.</p>
        <p style="color: #64748b; font-size: 13px;">Support contact: ALO IT / HR Admin — support@aloeducation.com. If you did not expect this email, contact ALO IT Admin immediately.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const reset = new URL('/reset-password', appBaseUrl());
  reset.searchParams.set('token', resetToken);
  const resetUrl = reset.toString();
  const safeResetUrl = escapeHtml(resetUrl);

  return sendEmail({
    text: `We received a request to reset your ALO Education password. Open this one-time link: ${resetUrl}. If you did not request a reset, ignore this message.`,
    to,
    subject: `ALO Education Password Reset Request`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #2563EB;">Password Reset Request</h2>
        <p>We received a request to reset your password for ALO Education Web_CRM.</p>
        <p style="margin: 24px 0;">
          <a href="${safeResetUrl}" style="background-color: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #64748b; font-size: 13px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}
