/**
 * Email system — public API.
 * Import from here: `import { sendTransactional } from "@/lib/email"`
 */
export { sendTransactional, type SendEmailOptions } from "./queue";
export { sendEmail, isEmailConfigured, type EmailMessage, type EmailResult, type EmailAddress } from "./transport";
export { EMAIL_TEMPLATES, type EmailTemplateKey, type TemplateResult } from "./templates";
export { renderEmail } from "./layout";
