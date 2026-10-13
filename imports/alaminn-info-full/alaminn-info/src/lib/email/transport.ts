/**
 * Email transport — abstraction over SMTP / Resend / dev console.
 * Picks the right transport based on env config.
 * Never throws — returns a result object so callers can log failures
 * without crashing the API request that triggered the email.
 */

import type { Transporter } from "nodemailer";
import { env } from "@/lib/env";

export type EmailAddress = string | { name: string; address: string };

export type EmailMessage = {
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  replyTo?: EmailAddress;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  messageId?: string;
};

export type EmailResult = {
  success: boolean;
  messageId?: string;
  provider: "resend" | "smtp" | "console" | "none";
  error?: string;
  durationMs: number;
};

type ResendMailOptions = {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type?: string;
  }>;
};

let _smtpTransport: Transporter | null = null;
let _resendClient: {
  emails: { send: (opts: ResendMailOptions) => Promise<{ id: string }> };
} | null = null;

function toAddressString(addr: EmailAddress): string {
  return typeof addr === "string" ? addr : `${addr.name} <${addr.address}>`;
}

function toAddressArray(
  addr: EmailAddress | EmailAddress[] | undefined
): string[] | undefined {
  if (!addr) return undefined;
  if (Array.isArray(addr)) return addr.map(toAddressString);
  return [toAddressString(addr)];
}

async function getSmtpTransport(): Promise<Transporter | null> {
  if (_smtpTransport) return _smtpTransport;
  const e = env();
  if (!e.smtpHost || !e.smtpUser || !e.smtpPass || !e.smtpPort) return null;
  const nodemailer = await import("nodemailer");
  _smtpTransport = nodemailer.createTransport({
    host: e.smtpHost,
    port: e.smtpPort,
    secure: e.smtpPort === 465,
    auth: { user: e.smtpUser, pass: e.smtpPass },
  });
  return _smtpTransport;
}

async function getResendClient() {
  if (_resendClient) return _resendClient;
  const e = env();
  if (!e.resendApiKey) return null;
  _resendClient = {
    emails: {
      async send(opts: ResendMailOptions): Promise<{ id: string }> {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${e.resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(opts),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Resend API ${res.status}: ${text.slice(0, 200)}`);
        }
        const json = (await res.json()) as { id: string };
        return { id: json.id };
      },
    },
  };
  return _resendClient;
}

/**
 * Send an email through the configured provider. Never throws.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const start = Date.now();
  const e = env();
  const from = message.from ? toAddressString(message.from) : e.emailFrom;
  const replyTo = message.replyTo
    ? toAddressString(message.replyTo)
    : e.emailReplyTo;
  const to = toAddressArray(message.to)!;

  // 1. Resend
  try {
    const resend = await getResendClient();
    if (resend) {
      const id = await resend.emails.send({
        from,
        to,
        cc: toAddressArray(message.cc),
        bcc: toAddressArray(message.bcc),
        reply_to: replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content:
            typeof a.content === "string"
              ? a.content
              : a.content.toString("base64"),
          content_type: a.contentType,
        })),
      });
      return {
        success: true,
        messageId: id.id,
        provider: "resend",
        durationMs: Date.now() - start,
      };
    }
  } catch (err) {
    return {
      success: false,
      provider: "resend",
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }

  // 2. SMTP
  try {
    const transport = await getSmtpTransport();
    if (transport) {
      const info = await transport.sendMail({
        from,
        to: to.join(", "),
        cc: toAddressArray(message.cc)?.join(", "),
        bcc: toAddressArray(message.bcc)?.join(", "),
        replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments,
        messageId: message.messageId,
      });
      return {
        success: true,
        messageId: info.messageId,
        provider: "smtp",
        durationMs: Date.now() - start,
      };
    }
  } catch (err) {
    return {
      success: false,
      provider: "smtp",
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }

  // 3. Dev console
  if (e.isDev) {
    console.log(
      "\n┌─── 📧 DEV EMAIL (no transport configured) ───────────────────\n" +
        `│ To: ${to.join(", ")}\n` +
        `│ From: ${from}\n` +
        `│ Subject: ${message.subject}\n` +
        `│ Text:\n${message.text
          .split("\n")
          .map((l) => `│   ${l}`)
          .join("\n")}\n` +
        `└──────────────────────────────────────────────────────────────\n`
    );
    return {
      success: true,
      provider: "console",
      durationMs: Date.now() - start,
    };
  }

  // 4. Production with no transport
  console.error(
    "[email] No transport configured in production. Email NOT sent:",
    { to, subject: message.subject }
  );
  return {
    success: false,
    provider: "none",
    error: "No email transport configured",
    durationMs: Date.now() - start,
  };
}

export function isEmailConfigured(): boolean {
  return env().emailConfigured;
}
