import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/settings/test-email
 * Body: { to?: string }   (defaults to the current user's email)
 *
 * Sends a minimal test email to verify SMTP / Resend configuration.
 * If no transport is configured, returns 200 with an informational
 * message (does NOT error). Always writes an AuditLog entry.
 */
export async function POST(req: NextRequest) {
  // The existing /api/v1/admin/settings routes use `security_settings.update`
  // for write operations — we reuse the same permission here so the test-email
  // button is gated by the same role as the rest of the settings page.
  const guard = await requirePermission(req, "security_settings.update");
  if (guard.denied) return guard.response;

  const body = await readJson<Record<string, string>>(req);
  const to = (body?.to || guard.session.email || "").trim();
  if (!to) return fail("No recipient address available.");

  if (!env().emailConfigured) {
    // Not an error — surface a clear informational message so the admin
    // knows exactly which env vars to set.
    await writeAudit(guard.session, "settings.test_email_sent", "Setting", undefined, {
      to,
      configured: false,
      result: "not_configured",
    });
    return ok(
      { sent: false, configured: false },
      "Email transport not configured. Set SMTP_* env vars."
    );
  }

  const subject = "Alaminn.info — Test Email";
  const text = [
    "This is a test email from the Alaminn.info Command Center.",
    "",
    `Sent by: ${guard.session.email}`,
    `Sent at: ${new Date().toISOString()}`,
    "",
    "If you received this message, your SMTP / Resend configuration is working correctly.",
  ].join("\n");
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #F97316; margin: 0 0 16px;">Alaminn.info — Test Email</h1>
      <p style="font-size: 15px; color: #1f2937;">This is a test email from the Alaminn.info Command Center.</p>
      <table style="font-size: 14px; color: #374151; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Sent by:</td><td>${guard.session.email}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Sent at:</td><td>${new Date().toISOString()}</td></tr>
      </table>
      <p style="font-size: 14px; color: #6B7280;">If you received this message, your SMTP / Resend configuration is working correctly.</p>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject,
    text,
    html,
  });

  await writeAudit(guard.session, "settings.test_email_sent", "Setting", undefined, {
    to,
    configured: true,
    provider: result.provider,
    success: result.success,
    error: result.error || null,
  });

  if (!result.success) {
    return fail(
      `Email send failed: ${result.error || "unknown error"}`,
      ["email_send_failed"],
      500
    );
  }

  return ok(
    { sent: true, provider: result.provider, messageId: result.messageId || null },
    `Test email sent to ${to}.`
  );
}
