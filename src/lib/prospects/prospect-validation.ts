/**
 * B2B prospect validation — Google prospect sourcing / Import Center.
 *
 * Pure functions, no database access: unit-testable and reused by both the
 * dry-run preview and the apply path. Enforces the Google data-policy rules:
 *
 *   - Human-led Google Search discovery → official websites are the allowed
 *     source of published business contact details. The official URL must be
 *     recorded (sourceUrl / officialWebsite).
 *   - Google Maps / Places-origin records MUST NOT carry business phone,
 *     email or address — such rows are rejected, never stored. A Place ID or
 *     the business's own official website is the only durable reference.
 *   - No automated Maps scraping exists anywhere in this codebase, and this
 *     validator exists so an import can never quietly become one.
 *
 * A prospect never becomes an approved partner by import; relationshipStatus
 * starts at DISCOVERED and only authorized employees may advance it (see the
 * admin API route for the transition rules).
 */

export const ORGANIZATION_TYPES = [
  'UNIVERSITY',
  'COLLEGE',
  'AGENCY',
  'CONSULTANCY',
  'LANGUAGE_PROVIDER',
  'PARTNER',
  'OTHER',
] as const;

export const SOURCE_TYPES = [
  'HUMAN_GOOGLE_SEARCH',
  'OFFICIAL_WEBSITE',
  'GOOGLE_MAPS',
  'GOOGLE_FORMS',
  'B2B_APPLY',
  'OTHER',
] as const;

export const RELATIONSHIP_STATUSES = [
  'DISCOVERED',
  'VERIFIED',
  'REVIEW_PENDING',
  'CONTACTED',
  'INTERESTED',
  'NEGOTIATION',
  'APPROVED_PARTNER',
  'REJECTED',
  'DO_NOT_CONTACT',
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];
export type ProspectSourceType = (typeof SOURCE_TYPES)[number];
export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];

export interface ProspectInput {
  organizationName: string;
  contactPerson: string;
  businessEmail: string;
  businessPhone: string;
  officialWebsite: string;
  country: string;
  city: string;
  organizationType: string;
  sourceType: string;
  sourceUrl: string;
  researchDate: string;
  notes: string;
}

export interface ValidatedProspect extends Omit<ProspectInput, 'researchDate'> {
  researchDate: Date | null;
  dedupeKey: string;
  normalizedPhone: string;
  normalizedEmail: string;
}

export interface RowValidation {
  index: number;
  ok: boolean;
  reasons: string[];
  value?: ValidatedProspect;
  dedupeKey?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTPS_URL = /^https:\/\/[^\s]+$/i;

export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/** Digits-only phone sanity check: 7-15 digits per E.164. */
export function isPlausiblePhone(raw: string): boolean {
  const digits = normalizePhone(raw).replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** Extract a canonical domain for deduplication; https-only. */
export function websiteDomain(raw: string): string {
  const trimmed = raw.trim();
  if (!HTTPS_URL.test(trimmed)) return '';
  try {
    const url = new URL(trimmed);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function prospectDedupeKey(input: {
  officialWebsite?: string;
  businessEmail?: string;
  businessPhone?: string;
  organizationName?: string;
  country?: string;
}): string {
  const domain = websiteDomain(input.officialWebsite || '');
  if (domain) return `domain:${domain}`;
  const email = (input.businessEmail || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  const phone = normalizePhone(input.businessPhone || '');
  if (phone) return `phone:${phone}`;
  const org = (input.organizationName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const country = (input.country || '').trim().toLowerCase();
  return `org:${org}|${country}`;
}

export function validateProspectRow(raw: unknown, index: number): RowValidation {
  const reasons: string[] = [];
  const row = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const text = (key: string, max = 191) => {
    const value = row[key];
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
  };

  const organizationName = text('organizationName') || text('organization') || text('name');
  const contactPerson = text('contactPerson') || text('contact');
  const businessEmail = text('businessEmail') || text('email');
  const businessPhone = text('businessPhone') || text('phone');
  const officialWebsite = text('officialWebsite') || text('website');
  const country = text('country', 100);
  const city = text('city', 120);
  const organizationType = (text('organizationType') || text('type') || 'OTHER').toUpperCase();
  const sourceType = (text('sourceType') || text('source') || 'HUMAN_GOOGLE_SEARCH').toUpperCase();
  const sourceUrl = text('sourceUrl', 500);
  const researchDateRaw = text('researchDate', 32);
  const notes = text('notes', 1_000);

  if (!organizationName || organizationName.length < 2) {
    reasons.push('organizationName is required (min 2 characters)');
  }
  if (businessEmail && !EMAIL_PATTERN.test(businessEmail)) {
    reasons.push('businessEmail is not a valid email address');
  }
  const normalizedPhone = normalizePhone(businessPhone);
  if (businessPhone && !isPlausiblePhone(businessPhone)) {
    reasons.push('businessPhone is not a plausible phone number (7-15 digits)');
  }
  if (officialWebsite && !HTTPS_URL.test(officialWebsite)) {
    reasons.push('officialWebsite must be an absolute https:// URL');
  }
  if (sourceUrl && !HTTPS_URL.test(sourceUrl)) {
    reasons.push('sourceUrl must be an absolute https:// URL');
  }
  if (!ORGANIZATION_TYPES.includes(organizationType as OrganizationType)) {
    reasons.push(`organizationType must be one of ${ORGANIZATION_TYPES.join(', ')}`);
  }
  if (!SOURCE_TYPES.includes(sourceType as ProspectSourceType)) {
    reasons.push(`sourceType must be one of ${SOURCE_TYPES.join(', ')}`);
  }

  // Google Maps data-policy enforcement: Places-origin rows must not carry
  // restricted business details. Only officially published details tied to the
  // official website are importable through this channel.
  if (sourceType === 'GOOGLE_MAPS') {
    if (businessPhone) reasons.push('GOOGLE_MAPS rows must not carry businessPhone (Places content is not licensed for CRM storage)');
    if (businessEmail) reasons.push('GOOGLE_MAPS rows must not carry businessEmail (Places content is not licensed for CRM storage)');
    if (contactPerson) reasons.push('GOOGLE_MAPS rows must not carry contactPerson (personal details from Places are not licensed for CRM storage)');
    if (!officialWebsite && !sourceUrl) reasons.push('GOOGLE_MAPS rows require the business\'s own official website URL (permitted reference)');
  }
  // For every source type: the human researcher must record where the data came from.
  if (!officialWebsite && !sourceUrl) {
    reasons.push('either officialWebsite or sourceUrl is required (record the source of every fact)');
  }

  let researchDate: Date | null = null;
  if (researchDateRaw) {
    const parsed = new Date(researchDateRaw);
    if (Number.isNaN(parsed.getTime())) {
      reasons.push('researchDate is not a valid date (YYYY-MM-DD)');
    } else {
      researchDate = parsed;
    }
  }

  if (reasons.length > 0) {
    return { index, ok: false, reasons };
  }

  const normalizedEmail = businessEmail.trim().toLowerCase();
  const dedupeKey = prospectDedupeKey({ officialWebsite, businessEmail: normalizedEmail, businessPhone: normalizedPhone, organizationName, country });

  return {
    index,
    ok: true,
    reasons: [],
    dedupeKey,
    value: {
      organizationName,
      contactPerson,
      businessEmail: normalizedEmail,
      businessPhone: normalizedPhone,
      officialWebsite,
      country,
      city,
      organizationType,
      sourceType,
      sourceUrl,
      researchDate,
      notes,
      dedupeKey,
      normalizedPhone,
      normalizedEmail,
    },
  };
}

export interface ImportSummary {
  received: number;
  valid: number;
  invalid: number;
  duplicatesInFile: number;
  duplicatesInDb: number;
  rows: Array<{
    index: number;
    ok: boolean;
    reasons: string[];
    organizationName?: string;
    dedupeKey?: string;
    duplicateOf?: 'file' | 'database';
  }>;
}

/** Merge validation with file-internal + database duplicate detection. */
export function buildImportSummary(
  validated: RowValidation[],
  existingDedupeKeys: Set<string>,
): ImportSummary {
  const seen = new Map<string, number>();
  let duplicatesInFile = 0;
  let duplicatesInDb = 0;
  const rows: ImportSummary['rows'] = [];

  for (const row of validated) {
    if (!row.ok || !row.value) {
      rows.push({ index: row.index, ok: false, reasons: row.reasons });
      continue;
    }
    const key = row.dedupeKey || '';
    let duplicateOf: 'file' | 'database' | undefined;
    if (seen.has(key)) {
      duplicateOf = 'file';
      duplicatesInFile++;
    } else if (existingDedupeKeys.has(key)) {
      duplicateOf = 'database';
      duplicatesInDb++;
    } else {
      seen.set(key, row.index);
    }
    rows.push({
      index: row.index,
      ok: !duplicateOf,
      reasons: duplicateOf ? [`Duplicate of ${duplicateOf === 'file' ? `row ${seen.get(key)} in this file` : 'an existing prospect record'}`] : [],
      organizationName: row.value.organizationName,
      dedupeKey: key,
      duplicateOf,
    });
  }

  return {
    received: validated.length,
    valid: rows.filter((r) => r.ok).length,
    invalid: validated.filter((r) => !r.ok).length,
    duplicatesInFile,
    duplicatesInDb,
    rows,
  };
}
