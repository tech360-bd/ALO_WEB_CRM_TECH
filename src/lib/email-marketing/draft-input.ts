import type { TemplateProblem } from './templating';

/**
 * Pure request validation for campaign drafts. No database or network access,
 * so it can be unit-tested directly.
 */

export const MAX_CAMPAIGN_RECIPIENTS = 10000;
export const MAX_RAW_RECIPIENTS = 20000;
export const MAX_BODY_LENGTH = 200000;

export interface ServiceFailure {
  ok: false;
  status: number;
  error: string;
  detail?: Record<string, unknown>;
}

export type ServiceResult<T> = { ok: true; value: T } | ServiceFailure;

export function serviceFailure(status: number, error: string, detail?: Record<string, unknown>): ServiceFailure {
  return detail === undefined ? { ok: false, status, error } : { ok: false, status, error, detail };
}

export function templateFailure(problem: TemplateProblem): ServiceFailure {
  switch (problem.code) {
    case 'SUBJECT_REQUIRED':
      return serviceFailure(422, 'SUBJECT_REQUIRED');
    case 'HTML_REQUIRED':
      return serviceFailure(422, 'HTML_REQUIRED');
    case 'UNKNOWN_PLACEHOLDER':
      return serviceFailure(422, 'UNKNOWN_PLACEHOLDER', { names: problem.names });
    case 'UNSUBSCRIBE_LINK_REQUIRED':
      return serviceFailure(422, 'UNSUBSCRIBE_LINK_REQUIRED', { part: problem.part });
  }
}

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

export interface DraftRecipientRow {
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
}

export interface DraftCampaignInput {
  name: string;
  subject: string;
  html: string;
  text: string | null;
  testMode: boolean;
  consentBasis: string;
  recipients: DraftRecipientRow[];
}

/**
 * Validates the raw JSON body of POST /api/email/campaigns.
 * The operator must attest consent (consentConfirmed: true) and describe the basis
 * (at least 10 characters). testMode defaults to true, so a live send must be chosen explicitly.
 */
export function parseDraftInput(body: unknown): ServiceResult<DraftCampaignInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return serviceFailure(400, 'BODY_REQUIRED');
  const record = body as Record<string, unknown>;

  const name = cleanText(record.name, 160);
  if (!name) return serviceFailure(400, 'NAME_REQUIRED');
  const subject = cleanText(record.subject, 255);
  if (!subject) return serviceFailure(400, 'SUBJECT_REQUIRED');
  if (typeof record.html !== 'string' || record.html.trim().length === 0 || record.html.length > MAX_BODY_LENGTH) {
    return serviceFailure(400, 'HTML_REQUIRED');
  }
  const text =
    typeof record.text === 'string' && record.text.trim().length > 0 ? record.text.slice(0, MAX_BODY_LENGTH) : null;

  if (record.testMode !== undefined && typeof record.testMode !== 'boolean') {
    return serviceFailure(400, 'TEST_MODE_INVALID');
  }
  const testMode = record.testMode === undefined ? true : record.testMode;

  if (record.consentConfirmed !== true) return serviceFailure(400, 'CONSENT_ATTESTATION_REQUIRED');
  const consentBasis = cleanText(record.consentBasis, 200);
  if (!consentBasis || consentBasis.length < 10) return serviceFailure(400, 'CONSENT_BASIS_REQUIRED');

  if (!Array.isArray(record.recipients) || record.recipients.length === 0) {
    return serviceFailure(400, 'RECIPIENTS_REQUIRED');
  }
  if (record.recipients.length > MAX_RAW_RECIPIENTS) {
    return serviceFailure(400, 'TOO_MANY_RECIPIENTS', { max: MAX_RAW_RECIPIENTS });
  }

  const recipients: DraftRecipientRow[] = [];
  for (const entry of record.recipients) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.email !== 'string') continue;
    recipients.push({
      email: row.email,
      first_name: typeof row.first_name === 'string' ? row.first_name : undefined,
      last_name: typeof row.last_name === 'string' ? row.last_name : undefined,
      company: typeof row.company === 'string' ? row.company : undefined,
    });
  }

  return {
    ok: true,
    value: { name, subject, html: record.html, text, testMode, consentBasis, recipients },
  };
}
