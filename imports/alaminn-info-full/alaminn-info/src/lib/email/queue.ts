/**
 * Email queue — sends emails with retry + audit logging.
 * --------------------------------------------------------------
 * - sendTransactional() is the main entry point: accepts a template key
 *   + params, renders, sends, and logs the attempt to the audit log.
 * - Retries failed sends up to 3 times with exponential backoff
 *   (1s → 4s → 16s) — but only awaits the first attempt synchronously.
 *   Failed first-attempts are queued for background retry.
 * - NEVER throws — returns a result object. Callers must not let email
 *   failures crash the API request that triggered them.
 */

import { sendEmail, type EmailMessage, type EmailResult } from "./transport";
import { EMAIL_TEMPLATES, type EmailTemplateKey, type TemplateResult } from "./templates";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { EmailAddress } from "./transport";

export type SendEmailOptions = {
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  /** IP hash for audit logging (optional) */
  ipHash?: string | null;
  /** What triggered this email (for audit log) */
  triggeredBy?: string;
  /** Skip audit log (for testing) */
  skipLog?: boolean;
};

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 4000, 16000];

/**
 * Send a transactional email using a named template.
 * Returns the result of the FIRST attempt. Retries happen in the background.
 */
export async function sendTransactional<K extends EmailTemplateKey>(
  templateKey: K,
  params: Parameters<typeof EMAIL_TEMPLATES[K]>[0],
  options: SendEmailOptions
): Promise<EmailResult> {
  // 1. Render template
  let rendered: TemplateResult;
  try {
    const fn = EMAIL_TEMPLATES[templateKey] as (
      p: typeof params
    ) => TemplateResult;
    rendered = fn(params);
  } catch (err) {
    const result: EmailResult = {
      success: false,
      provider: "none",
      error: `Template render failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: 0,
    };
    if (!options.skipLog) await logEmail(templateKey, options, result, 0);
    return result;
  }

  // 2. Build message
  const message: EmailMessage = {
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };

  // 3. First attempt (synchronous)
  const result = await sendEmail(message);

  // 4. Log attempt
  if (!options.skipLog) {
    await logEmail(templateKey, options, result, 1);
  }

  // 5. Schedule background retries if failed
  if (!result.success && env().emailConfigured) {
    void retryInBackground(templateKey, message, options, result);
  }

  return result;
}

async function retryInBackground(
  templateKey: string,
  message: EmailMessage,
  options: SendEmailOptions,
  firstResult: EmailResult
): Promise<void> {
  let lastResult = firstResult;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await sleep(BACKOFF_MS[attempt - 1] ?? 16000);
    const result = await sendEmail(message);
    if (!options.skipLog) {
      await logEmail(templateKey, options, result, attempt + 1);
    }
    lastResult = result;
    if (result.success) break;
  }
  if (!lastResult.success) {
    console.error(
      `[email] All ${MAX_RETRIES + 1} attempts failed for ${templateKey}`,
      { error: lastResult.error }
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function logEmail(
  templateKey: string,
  options: SendEmailOptions,
  result: EmailResult,
  attempt: number
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: `email.${result.success ? "sent" : "failed"}`,
        resource: "email",
        resourceId: result.messageId || templateKey,
        meta: JSON.stringify({
          template: templateKey,
          provider: result.provider,
          attempt,
          durationMs: result.durationMs,
          error: result.error || null,
          triggeredBy: options.triggeredBy || null,
        }),
        ipHash: options.ipHash || null,
      },
    });
  } catch {
    // Audit log failure must never propagate to the caller.
    // The email send itself already succeeded or failed independently.
  }
}
