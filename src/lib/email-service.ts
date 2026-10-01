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

export async function sendActivationEmail(to: string, name: string, employeeCode: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aloeducation.com';
  const activationUrl = `${appUrl}/employee/activate?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to,
    subject: `Welcome to ALO Education - Activate Your Employee Account (${employeeCode})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #0B5ED7;">Welcome to ALO Education, ${name}!</h2>
        <p>Your employee account has been created with Employee Code: <strong>${employeeCode}</strong>.</p>
        <p>Please click the button below to set your password and activate your account:</p>
        <p style="margin: 24px 0;">
          <a href="${activationUrl}" style="background-color: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activate Account</a>
        </p>
        <p style="color: #64748b; font-size: 13px;">If you did not request this, please contact ALO IT Admin immediately.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aloeducation.com';
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  return sendEmail({
    to,
    subject: `ALO Education Password Reset Request`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #0B5ED7;">Password Reset Request</h2>
        <p>We received a request to reset your password for ALO Education Web_CRM.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #64748b; font-size: 13px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}
