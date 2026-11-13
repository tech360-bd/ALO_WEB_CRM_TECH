/**
 * COMPANY CONTACT REGISTRY — shared, database-free decision layer.
 *
 * The registry's single source of truth is the existing `WhatsAppContact`
 * table, which the webhook, consent ledger, campaigns and the CRM already use.
 * This module adds the profile/segment/duplicate/import *semantics* on top of
 * those rows without creating a parallel contact store. All database calls stay
 * in the API handlers so these functions can be unit-tested offline.
 */

import { normalizePhone } from '@/lib/phone-normalization';
import { isPlausiblePhone } from '@/lib/communications/contact-identity';

export const CONTACT_CATEGORIES = [
  'PROSPECTIVE_STUDENT',
  'STUDENT',
  'ALUMNI',
  'PARENT_GUARDIAN_SPONSOR',
  'EMPLOYEE_MANAGER',
  'BRANCH_DEPARTMENT',
  'UNIVERSITY_REPRESENTATIVE',
  'UNIVERSITY_PARTNER_AGENT',
  'B2B_PROVIDER_SUB_AGENT',
  'VENDOR_SERVICE_PROVIDER',
  'EVENT_ATTENDEE',
  'MARKETING_SUBSCRIBER',
  'GENERAL_ENQUIRY',
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CONTACT_LIFECYCLES = [
  'NEW', 'ACTIVE', 'LEAD', 'STUDENT', 'ALUMNI', 'INACTIVE', 'SUPPRESSED', 'UNCLASSIFIED',
] as const;
export type ContactLifecycle = (typeof CONTACT_LIFECYCLES)[number];

export const SUPPORTED_LANGUAGES = ['BANGLA', 'ENGLISH', 'MIXED'] as const;
export const SUPPORTED_CHANNELS = ['WHATSAPP', 'EMAIL', 'SMS', 'CALL', 'MESSENGER', 'INSTAGRAM', 'FACEBOOK', 'WEBSITE_CHAT', 'OTHER'] as const;
export const CONSENT_PURPOSES = ['TRANSACTIONAL', 'SERVICE_UPDATES', 'PROMOTIONAL_MARKETING'] as const;

export interface RegistryContact {
  id: string;
  displayName: string;
  preferredName?: string;
  phone: string;
  normalizedPhone: string;
  whatsappNumber: string;
  whatsappVerified: boolean;
  email: string;
  emailVerified: boolean;
  preferredLanguage: string;
  country: string;
  city: string;
  category: ContactCategory;
  lifecycle: ContactLifecycle;
  studentId: string;
  leadId: string;
  partnerId: string;
  employeeId: string;
  assignedCounselorId: string;
  branch: string;
  department: string;
  sourceChannel: string;
  sourceCampaign: string;
  firstContactAt: string | null;
  lastContactAt: string | null;
  tags: string[];
  isOptedOut: boolean;
  isBlocked: boolean;
  identityStatus: 'VERIFIED' | 'REVIEW_REQUIRED' | 'UNCLASSIFIED';
}

type RawContact = {
  id?: unknown;
  displayName?: unknown;
  profileName?: unknown;
  phone?: unknown;
  normalizedPhone?: unknown;
  email?: unknown;
  normalizedEmail?: unknown;
  studentId?: unknown;
  leadId?: unknown;
  partnerId?: unknown;
  assignedCounselorId?: unknown;
  branch?: unknown;
  department?: unknown;
  countryCode?: unknown;
  source?: unknown;
  tags?: unknown;
  isOptedOut?: unknown;
  isBlocked?: unknown;
  optedOutAt?: unknown;
  firstContactAt?: unknown;
  lastContactAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const text = (value: unknown, max = 256): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const iso = (value: unknown): string | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
};

/** Tags are stored as a JSON array string in the existing table. */
export function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((tag) => text(tag, 64)).filter(Boolean).slice(0, 50);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((tag) => text(tag, 64)).filter(Boolean).slice(0, 50) : [];
  } catch {
    return raw.split(',').map((tag) => tag.trim().slice(0, 64)).filter(Boolean).slice(0, 50);
  }
}

// Underscores are word characters, so \bword\b would not match canonical
// category slugs such as PARENT_GUARDIAN_SPONSOR. Order matters: the more
// specific categories are checked before the generic "student"/"provider"
// stems, and "prospect" precedes "student" so PROSPECTIVE_STUDENT stays a lead.
const CATEGORY_TAG_RULES: Array<[RegExp, ContactCategory]> = [
  [/alumni/i, 'ALUMNI'],
  [/parent|guardian|sponsor/i, 'PARENT_GUARDIAN_SPONSOR'],
  [/employee|manager|staff/i, 'EMPLOYEE_MANAGER'],
  [/branch|department/i, 'BRANCH_DEPARTMENT'],
  [/university[_-]?rep/i, 'UNIVERSITY_REPRESENTATIVE'],
  [/recruitment[_-]?agent/i, 'UNIVERSITY_PARTNER_AGENT'],
  [/partner/i, 'UNIVERSITY_PARTNER_AGENT'],
  [/vendor|service[_-]?provider/i, 'VENDOR_SERVICE_PROVIDER'],
  [/b2b|sub[_-]?agent|provider/i, 'B2B_PROVIDER_SUB_AGENT'],
  [/event|attendee/i, 'EVENT_ATTENDEE'],
  [/subscriber|marketing/i, 'MARKETING_SUBSCRIBER'],
  [/prospect/i, 'PROSPECTIVE_STUDENT'],
  [/student/i, 'STUDENT'],
  [/lead/i, 'PROSPECTIVE_STUDENT'],
];

export function categoryFor(raw: RawContact): ContactCategory {
  const tags = parseTags(raw.tags);
  const joined = [...tags, text(raw.source)].join(' ');
  for (const [pattern, category] of CATEGORY_TAG_RULES) {
    if (pattern.test(joined)) return category;
  }
  if (text(raw.studentId)) return 'STUDENT';
  if (text(raw.leadId)) return 'PROSPECTIVE_STUDENT';
  if (text(raw.partnerId)) return 'UNIVERSITY_PARTNER_AGENT';
  if (text(raw.assignedCounselorId)) return 'PROSPECTIVE_STUDENT';
  return 'GENERAL_ENQUIRY';
}

export function lifecycleFor(raw: RawContact): ContactLifecycle {
  if (raw.isOptedOut === true || raw.optedOutAt) return 'SUPPRESSED';
  if (raw.isBlocked === true) return 'INACTIVE';
  const category = categoryFor(raw);
  if (category === 'ALUMNI') return 'ALUMNI';
  if (category === 'STUDENT') return 'STUDENT';
  if (category === 'PROSPECTIVE_STUDENT') return 'LEAD';
  if (category === 'GENERAL_ENQUIRY') return 'NEW';
  return 'ACTIVE';
}

export function identityStatusFor(raw: RawContact): RegistryContact['identityStatus'] {
  // A strong identifier (student/lead/partner link) is considered established.
  // A bare phone with no linked record stays unclassified; it is NEVER merged
  // automatically with another contact merely because they share a phone.
  if (text(raw.studentId) || text(raw.leadId) || text(raw.partnerId)) return 'VERIFIED';
  if (text(raw.email) && text(raw.normalizedPhone)) return 'REVIEW_REQUIRED';
  return 'UNCLASSIFIED';
}

export function toRegistryContact(raw: RawContact): RegistryContact {
  const normalizedPhone = text(raw.normalizedPhone, 32) || normalizePhone(text(raw.phone, 64));
  const tags = parseTags(raw.tags);
  const source = text(raw.source, 64).toUpperCase();
  return {
    id: text(raw.id, 128),
    displayName: text(raw.displayName, 256) || text(raw.profileName, 256) || normalizedPhone,
    preferredName: tags.find((tag) => tag.toLowerCase().startsWith('preferred:'))?.slice(10) || '',
    phone: text(raw.phone, 64),
    normalizedPhone,
    whatsappNumber: normalizedPhone,
    // Verification is a provider fact, not a presence flag. The registry only
    // knows a normalized number; `true` requires an explicit provider check.
    whatsappVerified: false,
    email: text(raw.email, 320) || text(raw.normalizedEmail, 320),
    emailVerified: false,
    preferredLanguage: tags.find((tag) => /^(BANGLA|ENGLISH|MIXED)$/i.test(tag))?.toUpperCase() || '',
    country: text(raw.countryCode, 16),
    city: tags.find((tag) => tag.toLowerCase().startsWith('city:'))?.slice(5) || '',
    category: categoryFor(raw),
    lifecycle: lifecycleFor(raw),
    studentId: text(raw.studentId, 128),
    leadId: text(raw.leadId, 128),
    partnerId: text(raw.partnerId, 128),
    employeeId: tags.find((tag) => tag.toLowerCase().startsWith('employee:'))?.slice(9) || '',
    assignedCounselorId: text(raw.assignedCounselorId, 128),
    branch: text(raw.branch, 128),
    department: text(raw.department, 128),
    sourceChannel: source || 'UNKNOWN',
    sourceCampaign: tags.find((tag) => tag.toLowerCase().startsWith('campaign:'))?.slice(9) || '',
    firstContactAt: iso(raw.firstContactAt) || iso(raw.createdAt),
    lastContactAt: iso(raw.lastContactAt) || iso(raw.updatedAt),
    tags,
    isOptedOut: raw.isOptedOut === true,
    isBlocked: raw.isBlocked === true,
    identityStatus: identityStatusFor(raw),
  };
}

export function summarizeSegments(contacts: RegistryContact[]) {
  const byCategory: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let optedOut = 0;
  let blocked = 0;
  let reviewRequired = 0;
  for (const contact of contacts) {
    byCategory[contact.category] = (byCategory[contact.category] || 0) + 1;
    bySource[contact.sourceChannel] = (bySource[contact.sourceChannel] || 0) + 1;
    for (const tag of contact.tags) byTag[tag] = (byTag[tag] || 0) + 1;
    if (contact.isOptedOut) optedOut += 1;
    if (contact.isBlocked) blocked += 1;
    if (contact.identityStatus === 'REVIEW_REQUIRED') reviewRequired += 1;
  }
  return { total: contacts.length, byCategory, byTag, bySource, optedOut, blocked, reviewRequired };
}

export interface DuplicateGroup {
  key: string;
  matchedOn: 'phone' | 'email' | 'shared_identifier';
  contactIds: string[];
  /** Never auto-merged: the operator must review. */
  decision: 'REVIEW_REQUIRED';
  reason: string;
}

/**
 * Find candidate duplicates. Deliberately conservative:
 *  - only exact normalized phone / email matches are grouped;
 *  - a shared family phone alone is reported for review, never merged;
 *  - no record is modified here.
 */
export function buildDuplicateReviewGroups(contacts: RegistryContact[]): DuplicateGroup[] {
  const byPhone = new Map<string, RegistryContact[]>();
  const byEmail = new Map<string, RegistryContact[]>();
  for (const contact of contacts) {
    if (contact.normalizedPhone) {
      const group = byPhone.get(contact.normalizedPhone) || [];
      group.push(contact);
      byPhone.set(contact.normalizedPhone, group);
    }
    const email = contact.email.trim().toLowerCase();
    if (email) {
      const group = byEmail.get(email) || [];
      group.push(contact);
      byEmail.set(email, group);
    }
  }
  const groups: DuplicateGroup[] = [];
  for (const [key, rows] of byPhone) {
    if (rows.length < 2) continue;
    groups.push({
      key,
      matchedOn: 'phone',
      contactIds: rows.map((row) => row.id),
      decision: 'REVIEW_REQUIRED',
      reason: 'Multiple registry rows share this normalized phone. A shared family phone is not proof of identity — review before any merge.',
    });
  }
  for (const [key, rows] of byEmail) {
    if (rows.length < 2) continue;
    groups.push({
      key,
      matchedOn: 'email',
      contactIds: rows.map((row) => row.id),
      decision: 'REVIEW_REQUIRED',
      reason: 'Multiple registry rows share this email address. Review before any merge.',
    });
  }
  return groups;
}

/** Minimal RFC-4180-ish CSV parser with quoted fields and embedded delimiters. */
export function parseContactCsv(input: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let quoted = false;
  const source = String(input || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"' && field === '') { quoted = true; continue; }
    if (char === ',') { current.push(field.trim()); field = ''; continue; }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      current.push(field.trim());
      if (current.some((cell) => cell !== '')) rows.push(current);
      current = [];
      field = '';
      continue;
    }
    field += char;
  }
  current.push(field.trim());
  if (current.some((cell) => cell !== '')) rows.push(current);
  const headers = (rows.shift() || []).map((header) => header.toLowerCase());
  return { headers, rows };
}

export type ContactFieldMapping = Record<string, string>;

export const DEFAULT_CONTACT_FIELD_MAPPING: ContactFieldMapping = {
  fullName: 'name',
  phone: 'phone',
  email: 'email',
  category: 'type',
  language: 'language',
  country: 'country',
  city: 'city',
  source: 'source',
  campaign: 'campaign',
  tags: 'tags',
};

export interface ImportRowResult {
  rowNumber: number;
  errors: string[];
  normalized: {
    fullName: string;
    phone: string;
    normalizedPhone: string;
    email: string;
    normalizedEmail: string;
    category: ContactCategory | '';
    language: string;
    country: string;
    city: string;
    source: string;
    campaign: string;
    tags: string[];
  } | null;
}

function mapped(headers: string[], cells: string[], mapping: ContactFieldMapping, field: string): string {
  const header = (mapping[field] || '').toLowerCase().trim();
  if (!header) return '';
  const index = headers.indexOf(header);
  return index >= 0 ? (cells[index] || '').trim() : '';
}

/** Validate and normalize one CSV row. No database writes, no auto-merge. */
export function validateContactImportRow(
  headers: string[],
  cells: string[],
  mapping: ContactFieldMapping,
  rowNumber: number,
): ImportRowResult {
  const errors: string[] = [];
  const fullName = mapped(headers, cells, mapping, 'fullName').slice(0, 256);
  const rawPhone = mapped(headers, cells, mapping, 'phone').slice(0, 64);
  const rawEmail = mapped(headers, cells, mapping, 'email').slice(0, 320).toLowerCase();
  const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : '';
  if (!fullName) errors.push('Full name is required.');
  if (rawPhone && !isPlausiblePhone(rawPhone)) errors.push('Phone number is not plausible.');
  if (!rawPhone && !rawEmail) errors.push('At least one of phone or email is required.');
  if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) errors.push('Email address is invalid.');

  const rawCategory = mapped(headers, cells, mapping, 'category').toUpperCase().replace(/[\s-]+/g, '_');
  const category = CONTACT_CATEGORIES.includes(rawCategory as ContactCategory) ? rawCategory as ContactCategory : '';
  if (rawCategory && !category) errors.push(`Unsupported contact category "${mapped(headers, cells, mapping, 'category')}".`);

  const rawLanguage = mapped(headers, cells, mapping, 'language').toUpperCase();
  const language = SUPPORTED_LANGUAGES.includes(rawLanguage as (typeof SUPPORTED_LANGUAGES)[number]) ? rawLanguage : '';
  if (rawLanguage && !language) errors.push('Preferred language must be Bangla, English or Mixed.');

  if (errors.length) return { rowNumber, errors, normalized: null };
  return {
    rowNumber,
    errors: [],
    normalized: {
      fullName,
      phone: rawPhone,
      normalizedPhone,
      email: rawEmail,
      normalizedEmail: rawEmail,
      category,
      language,
      country: mapped(headers, cells, mapping, 'country').slice(0, 64),
      city: mapped(headers, cells, mapping, 'city').slice(0, 128),
      source: mapped(headers, cells, mapping, 'source').slice(0, 64) || 'CSV_IMPORT',
      campaign: mapped(headers, cells, mapping, 'campaign').slice(0, 128),
      tags: mapped(headers, cells, mapping, 'tags').split(/[|;]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
    },
  };
}

/**
 * Exports are minimum-necessary by default. Phone/email are only included when
 * the caller's permissions explicitly allow them; consent evidence is never
 * included in a contact export.
 */
export function projectContactForExport(
  contact: RegistryContact,
  options: { includePhone?: boolean; includeEmail?: boolean },
): Record<string, string | boolean> {
  const row: Record<string, string | boolean> = {
    contactId: contact.id,
    displayName: contact.displayName,
    category: contact.category,
    lifecycle: contact.lifecycle,
    sourceChannel: contact.sourceChannel,
    branch: contact.branch,
    optedOut: contact.isOptedOut,
    suppressed: contact.isBlocked,
  };
  if (options.includePhone) row.phone = contact.phone;
  if (options.includeEmail) row.email = contact.email;
  return row;
}
