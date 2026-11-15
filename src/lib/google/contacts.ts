/**
 * GOOGLE CONTACTS (People API) → ALO Central Contact Registry.
 *
 * What this module is: the *source adapter* that reads the company's Google
 * Contacts (the designated ALO account) and the *decision layer* that says what
 * should happen to each person in the CRM registry. It is deliberately split the
 * same way as `src/lib/google/analytics-data.ts`:
 *
 *   - pure functions (mapping, planning, normalisation) — unit-testable offline
 *   - a thin HTTP client — the only part that talks to Google
 *
 * Why there is no new contact table
 * ---------------------------------
 * The repository already decided where the registry lives: `WhatsAppContact`,
 * described in `src/lib/contacts/registry.ts` as "the registry's single source of
 * truth … the webhook, consent ledger, campaigns and the CRM already use". Adding
 * a second `Contact` table for Google imports is exactly the duplicate-system
 * failure the brief forbids. Google rows therefore land in that table with
 * `source = 'GOOGLE_CONTACTS'` and the People API resource name preserved in
 * `externalContactId` (the field that already exists for an external identifier).
 * No schema change, no migration — nothing to roll back.
 *
 * Authorisation reality, stated up front
 * --------------------------------------
 * The People API reads the contacts of a *signed-in user*. A service account
 * cannot read a consumer Gmail account's contacts — it has no mailbox. It also
 * cannot read them with domain-wide delegation here because
 * `alo.allcontacts@gmail.com` is a Google consumer account, not a Workspace user.
 * ALO must therefore use an **OAuth refresh token obtained once by a human
 * consenting as that account**, with the `contacts.readonly` scope. This module
 * refuses to pretend otherwise: if the only configured credential is a service
 * account it reports `NOT_CONFIGURED` with that explanation instead of returning
 * "0 contacts", which would read as "the company has no contacts".
 *
 * Source-of-truth policy (enforced in `planContactImport`)
 * -------------------------------------------------------
 * - ALO CRM is authoritative for identity. Google may **fill empty fields** and
 *   may **add a new contact**, but it may never overwrite a field ALO already
 *   holds, and it may never touch a student's identity, Student ID, counsellor or
 *   any CRM relationship.
 * - Ambiguity is never resolved automatically: two registry rows sharing a phone,
 *   or Google disagreeing with a non-empty CRM value, produce a review row, not a
 *   write.
 * - Re-running a sync is idempotent: a person already linked by resource name is
 *   skipped.
 */

import {
  googleApiRequest,
  resolveUserScopedCredential,
  describeGoogleCredential,
  SCOPE_CONTACTS_READONLY,
} from './oauth';
import { normalizePhone } from '@/lib/phone-normalization';
import { phoneVariants, isPlausiblePhone } from '@/lib/communications/contact-identity';

/**
 * Read the user's contacts. The narrowest scope that satisfies the requirement.
 * Re-exported from the OAuth module so there is exactly one definition.
 */
export { SCOPE_CONTACTS_READONLY };

const PEOPLE_BASE = 'https://people.googleapis.com/v1';
const DEFAULT_TIMEOUT_MS = 20_000;
/** Requested fields — nothing else is read, so nothing else can leak into the CRM. */
const PERSON_FIELDS = 'names,phoneNumbers,emailAddresses,metadata';

export type ContactsApiStatus =
  | 'READY'
  | 'NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'NO_ACCESS'
  | 'API_ERROR'
  | 'TIMEOUT';

export interface ContactsApiResult<T> {
  status: ContactsApiStatus;
  data?: T;
  /** Secret-free, operator-readable explanation. */
  reason?: string;
  httpStatus?: number;
  googleErrorReason?: string;
  fetchedAt?: string;
}

/** The designated ALO Google Contacts account. Configurable, with the stated default. */
export const DEFAULT_CONTACTS_ACCOUNT = 'alo.allcontacts@gmail.com';

/**
 * Secret-free description of the Contacts configuration.
 *
 * `configured` requires an OAuth user credential — see the header. A service
 * account is reported as *present but unusable for this API*, which is a
 * different fact from "no credential".
 */
export function describeContactsConfig(env: NodeJS.ProcessEnv = process.env): {
  configured: boolean;
  account: string;
  authMode: ReturnType<typeof resolveUserScopedCredential>['mode'];
  credentialPresent: boolean;
  note: string;
  scope: string;
} {
  // A contacts-owned token wins over a service account: see `resolveUserScopedCredential`.
  const credential = resolveUserScopedCredential(env, ['GOOGLE_CONTACTS_REFRESH_TOKEN']);
  const described = describeGoogleCredential(env);
  const account = (env.GOOGLE_CONTACTS_ACCOUNT || '').trim() || DEFAULT_CONTACTS_ACCOUNT;
  const oauthReady = credential.mode === 'oauth_refresh_token';

  let note: string;
  if (credential.mode === 'none') {
    note =
      'NOT CONFIGURED — the People API needs a user OAuth credential for ' +
      `${account}: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_CONTACTS_REFRESH_TOKEN (or GOOGLE_OAUTH_REFRESH_TOKEN), consented once with the contacts.readonly scope.`;
  } else if (credential.mode === 'service_account') {
    note =
      'NOT CONFIGURED — a service account is present but CANNOT read a Gmail account\'s contacts (the People API reads the signed-in user\'s address book; a service account has no mailbox). Consent once as ' +
      `${account} and store the refresh token as GOOGLE_CONTACTS_REFRESH_TOKEN.`;
  } else {
    note = `CONFIGURED — OAuth credential present; target account ${account}. Google has not been called yet — use POST /api/google/contacts/sync with mode "dry-run" to prove access without writing.`;
  }

  return {
    configured: oauthReady,
    account,
    authMode: credential.mode,
    credentialPresent: described.configured,
    note,
    scope: SCOPE_CONTACTS_READONLY,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping (pure)
// ─────────────────────────────────────────────────────────────────────────────

export interface GooglePhone {
  /** Exactly as Google supplied it, truncated for storage. */
  value: string;
  /** Canonical digits (8801XXXXXXXXX for BD numbers). */
  normalized: string;
  type: string;
}

export interface GooglePerson {
  /** `people/c123…` — the identifier that must be preserved. */
  resourceName: string;
  displayName: string;
  phones: GooglePhone[];
  emails: string[];
  etag: string;
  /** True when Google reports the contact was deleted upstream. */
  deleted: boolean;
}

interface RawPerson {
  resourceName?: string;
  etag?: string;
  names?: { displayName?: string; givenName?: string; familyName?: string; metadata?: { primary?: boolean } }[];
  phoneNumbers?: { value?: string; canonicalForm?: string; type?: string }[];
  emailAddresses?: { value?: string; type?: string }[];
  metadata?: { deleted?: boolean; sources?: unknown[] };
}

/**
 * Map one People API person to the CRM's shape.
 *
 * Returns `null` when the person has no usable identity at all (no name AND no
 * plausible phone). A nameless, numberless Google row is noise, and importing it
 * would create an unnamed registry row — one of the dashboard's own alarm
 * conditions ("contacts with missing names").
 */
export function mapGooglePerson(raw: RawPerson): GooglePerson | null {
  const resourceName = String(raw?.resourceName || '').trim();
  if (!resourceName) return null;

  const displayName = String(
    raw.names?.find((name) => name?.metadata?.primary)?.displayName
      ?? raw.names?.[0]?.displayName
      ?? [raw.names?.[0]?.givenName, raw.names?.[0]?.familyName].filter(Boolean).join(' ')
      ?? '',
  ).trim().slice(0, 256);

  const phones: GooglePhone[] = [];
  const seenPhones = new Set<string>();
  for (const entry of raw.phoneNumbers ?? []) {
    const value = String(entry?.value || entry?.canonicalForm || '').trim().slice(0, 64);
    const normalized = normalizePhone(value);
    // A number that cannot be normalised to a plausible subscriber is dropped
    // rather than stored raw: an unusable number in the registry is worse than a
    // missing one, because it looks searchable and never matches.
    if (!normalized || !isPlausiblePhone(normalized) || seenPhones.has(normalized)) continue;
    seenPhones.add(normalized);
    phones.push({ value, normalized, type: String(entry?.type || '').trim().slice(0, 32) });
  }

  const emails: string[] = [];
  const seenEmails = new Set<string>();
  for (const entry of raw.emailAddresses ?? []) {
    const value = String(entry?.value || '').trim().toLowerCase().slice(0, 320);
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || seenEmails.has(value)) continue;
    seenEmails.add(value);
    emails.push(value);
  }

  const deleted = raw.metadata?.deleted === true;

  if (!displayName && phones.length === 0) return null;

  return {
    resourceName,
    displayName,
    phones,
    emails,
    etag: String(raw.etag || '').slice(0, 128),
    deleted,
  };
}

/** Map a page of people, reporting what was skipped and why. */
export function mapGooglePeople(rawPeople: unknown): {
  people: GooglePerson[];
  skipped: { resourceName: string; reason: string }[];
} {
  const people: GooglePerson[] = [];
  const skipped: { resourceName: string; reason: string }[] = [];
  const list = Array.isArray(rawPeople) ? rawPeople : [];
  for (const entry of list as RawPerson[]) {
    const mapped = mapGooglePerson(entry);
    if (!mapped) {
      skipped.push({
        resourceName: String(entry?.resourceName || '(no resource name)'),
        reason: 'No usable name and no plausible phone number — nothing to import.',
      });
      continue;
    }
    people.push(mapped);
  }
  return { people, skipped };
}

// ─────────────────────────────────────────────────────────────────────────────
// Import planning (pure) — the source-of-truth policy lives here
// ─────────────────────────────────────────────────────────────────────────────

/** A registry row as the planner sees it. Only the fields the policy needs. */
export interface ExistingRegistryRow {
  id: string;
  normalizedPhone: string;
  displayName: string;
  email: string;
  source: string;
  externalContactId: string;
  studentId: string;
  leadId: string;
  isBlocked: boolean;
  isOptedOut: boolean;
}

export type ImportAction =
  | 'CREATE'
  | 'LINK_EXISTING'
  | 'FILL_BLANK_FIELDS'
  | 'CONFLICT_REVIEW'
  | 'SKIP_ALREADY_LINKED'
  | 'SKIP_UNUSABLE'
  | 'SKIP_OPTED_OUT';

export interface ImportDecision {
  action: ImportAction;
  person: GooglePerson;
  /** Registry row this decision concerns, when it concerns one. */
  targetId: string | null;
  /** Fields Google may fill because ALO's copy is empty. */
  fill: Partial<{ displayName: string; email: string; primaryPhone: string }>;
  /** Fields where Google disagrees with a non-empty ALO value. Never written. */
  conflicts: { field: 'displayName' | 'email'; crmValue: string; googleValue: string }[];
  /** Machine-readable reason, shown in the import report. */
  reason: string;
}

export interface ImportCounters {
  found: number;
  create: number;
  linkExisting: number;
  fillBlank: number;
  conflictReview: number;
  duplicate: number;
  skipped: number;
  /** Rows linked to a student/lead — reported separately, never modified. */
  linkedToStudent: number;
}

/**
 * Decide what to do with each Google person.
 *
 * Order of checks, and the reason each exists:
 *
 *  1. **Already linked** (same `resourceName` in `externalContactId`) → skip.
 *     Makes a re-run idempotent.
 *  2. **Deleted upstream** → skip. Google no longer has it; deleting the CRM row
 *     is not this function's decision and is not automated.
 *  3. **Usable primary number?** No → `SKIP_UNUSABLE`. The registry's unique key
 *     is the normalised phone, so a phoneless person cannot be stored as a
 *     contact. (Reported, not silently dropped.)
 *  4. **Opted out / blocked** → `SKIP_OPTED_OUT`. Consent outranks data freshness.
 *  5. **Exactly one registry match** on phone or email →
 *     - non-empty disagreement → `CONFLICT_REVIEW` (no write)
 *     - otherwise → `FILL_BLANK_FIELDS` if Google can add anything, else
 *       `LINK_EXISTING` (attach the resource name so future syncs are cheap).
 *     If that row is linked to a student or lead, the decision is still only
 *     "fill blanks" — identity fields are never rewritten from Google.
 *  6. **More than one registry match** → `CONFLICT_REVIEW`. A shared family phone
 *     is not proof of identity.
 *  7. **No match** → `CREATE`.
 */
export function planContactImport(input: {
  people: GooglePerson[];
  existing: ExistingRegistryRow[];
}): { decisions: ImportDecision[]; counters: ImportCounters } {
  const byPhone = new Map<string, ExistingRegistryRow[]>();
  const byEmail = new Map<string, ExistingRegistryRow[]>();
  const byResource = new Map<string, ExistingRegistryRow>();

  for (const row of input.existing) {
    for (const variant of phoneVariants(row.normalizedPhone)) {
      const group = byPhone.get(variant) ?? [];
      group.push(row);
      byPhone.set(variant, group);
    }
    const email = row.email.trim().toLowerCase();
    if (email) {
      const group = byEmail.get(email) ?? [];
      group.push(row);
      byEmail.set(email, group);
    }
    if (row.externalContactId) byResource.set(row.externalContactId, row);
  }

  const decisions: ImportDecision[] = [];
  const seenResourceNames = new Set<string>();

  for (const person of input.people) {
    // A page can repeat a person only if Google paginates oddly; guard anyway.
    if (seenResourceNames.has(person.resourceName)) continue;
    seenResourceNames.add(person.resourceName);

    const base = { person, targetId: null as string | null, fill: {}, conflicts: [] as ImportDecision['conflicts'] };

    if (byResource.has(person.resourceName)) {
      decisions.push({ ...base, action: 'SKIP_ALREADY_LINKED', targetId: byResource.get(person.resourceName)!.id, reason: 'This Google contact is already linked to a registry row.' });
      continue;
    }
    if (person.deleted) {
      decisions.push({ ...base, action: 'SKIP_ALREADY_LINKED', reason: 'Google reports this contact as deleted; upstream deletions are not propagated automatically.' });
      continue;
    }

    const primary = person.phones[0];
    if (!primary) {
      decisions.push({
        ...base,
        action: 'SKIP_UNUSABLE',
        reason: 'No plausible phone number. The registry is phone-keyed, so this contact is reported instead of imported.',
      });
      continue;
    }

    // Collect every distinct registry row that matches on any phone variant or email.
    const matches = new Map<string, ExistingRegistryRow>();
    for (const phone of person.phones) {
      for (const variant of phoneVariants(phone.normalized)) {
        for (const row of byPhone.get(variant) ?? []) matches.set(row.id, row);
      }
    }
    for (const email of person.emails) {
      for (const row of byEmail.get(email) ?? []) matches.set(row.id, row);
    }

    if (matches.size > 1) {
      decisions.push({
        ...base,
        action: 'CONFLICT_REVIEW',
        reason: `${matches.size} registry rows share a phone or email with this Google contact. A shared number is not proof of identity — an operator must decide.`,
      });
      continue;
    }

    if (matches.size === 1) {
      const row = [...matches.values()][0];
      if (row.isOptedOut || row.isBlocked) {
        decisions.push({ ...base, action: 'SKIP_OPTED_OUT', targetId: row.id, reason: 'The registry row is opted out or blocked. Consent outranks data freshness; nothing is written.' });
        continue;
      }

      const conflicts: ImportDecision['conflicts'] = [];
      const fill: ImportDecision['fill'] = {};

      const googleName = person.displayName.trim();
      if (googleName) {
        if (!row.displayName.trim()) fill.displayName = googleName;
        else if (row.displayName.trim().toLowerCase() !== googleName.toLowerCase()) {
          // Only a Google-owned row may be renamed by Google. Anything ALO
          // created or verified keeps its name.
          if (row.source === 'GOOGLE_CONTACTS') fill.displayName = googleName;
          else conflicts.push({ field: 'displayName', crmValue: row.displayName, googleValue: googleName });
        }
      }

      const googleEmail = person.emails[0] ?? '';
      if (googleEmail) {
        if (!row.email.trim()) fill.email = googleEmail;
        else if (row.email.trim().toLowerCase() !== googleEmail) {
          conflicts.push({ field: 'email', crmValue: row.email, googleValue: googleEmail });
        }
      }

      if (conflicts.length > 0) {
        decisions.push({
          ...base,
          action: 'CONFLICT_REVIEW',
          targetId: row.id,
          conflicts,
          reason: 'Google disagrees with a non-empty CRM value. The CRM value is kept and the difference is queued for review.',
        });
        continue;
      }

      decisions.push({
        ...base,
        action: Object.keys(fill).length > 0 ? 'FILL_BLANK_FIELDS' : 'LINK_EXISTING',
        targetId: row.id,
        fill,
        reason: Object.keys(fill).length > 0
          ? 'Existing registry row. Only fields ALO left empty are filled from Google; every populated CRM field is preserved.'
          : 'Existing registry row already agrees with Google; the Google contact id is linked so future syncs are cheap.',
      });
      continue;
    }

    decisions.push({
      ...base,
      action: 'CREATE',
      fill: {
        displayName: person.displayName.trim() || primary.normalized,
        email: person.emails[0] ?? '',
        primaryPhone: primary.normalized,
      },
      reason: 'New number with no registry match — created as an unverified contact, not as a student.',
    });
  }

  return { decisions, counters: summarizePlan(decisions) };
}

export function summarizePlan(decisions: ImportDecision[]): ImportCounters {
  const counters: ImportCounters = {
    found: decisions.length,
    create: 0,
    linkExisting: 0,
    fillBlank: 0,
    conflictReview: 0,
    duplicate: 0,
    skipped: 0,
    linkedToStudent: 0,
  };
  for (const decision of decisions) {
    switch (decision.action) {
      case 'CREATE':
        counters.create += 1;
        break;
      case 'LINK_EXISTING':
        counters.linkExisting += 1;
        break;
      case 'FILL_BLANK_FIELDS':
        counters.fillBlank += 1;
        break;
      case 'CONFLICT_REVIEW':
        counters.conflictReview += 1;
        break;
      case 'SKIP_ALREADY_LINKED':
        counters.duplicate += 1;
        break;
      default:
        counters.skipped += 1;
        break;
    }
  }
  return counters;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP client — the only part that talks to Google
// ─────────────────────────────────────────────────────────────────────────────

interface RawConnectionsResponse {
  connections?: RawPerson[];
  nextPageToken?: string;
  nextSyncToken?: string;
  totalPeople?: number;
  totalItems?: number;
}

export interface ConnectionsPage {
  people: GooglePerson[];
  skipped: { resourceName: string; reason: string }[];
  nextPageToken: string;
  nextSyncToken: string;
  totalPeople: number | null;
}

/**
 * Fetch one page of contacts.
 *
 * `syncToken` requests an incremental page: Google then returns only what changed
 * since that token was issued. When the token has expired Google answers 410 and
 * the caller must fall back to a full sync — handled in `listAllConnections`.
 */
export async function listConnectionsPage(
  options: { pageToken?: string; syncToken?: string; pageSize?: number; personFields?: string } = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContactsApiResult<ConnectionsPage>> {
  const config = describeContactsConfig(env);
  if (!config.configured) {
    return { status: 'NOT_CONFIGURED', reason: config.note };
  }

  const pageSize = Math.min(Math.max(options.pageSize ?? 200, 1), 1000);
  const query = new URLSearchParams({
    personFields: options.personFields || PERSON_FIELDS,
    pageSize: String(pageSize),
    // Only real contacts — not the "other contacts" auto-collected from Gmail,
    // which are not company contacts and would flood the registry.
    sources: 'READ_SOURCE_TYPE_CONTACT',
  });
  if (options.pageToken) query.set('pageToken', options.pageToken);
  if (options.syncToken) {
    query.set('syncToken', options.syncToken);
    query.set('requestSyncToken', 'true');
  } else {
    query.set('requestSyncToken', 'true');
  }

  const result = await googleApiRequest<RawConnectionsResponse>(
    SCOPE_CONTACTS_READONLY,
    `${PEOPLE_BASE}/people/me/connections?${query.toString()}`,
    {},
    env,
    DEFAULT_TIMEOUT_MS,
    resolveUserScopedCredential(env, ['GOOGLE_CONTACTS_REFRESH_TOKEN']),
  );

  if (result.status !== 'READY') {
    // 403 on an OAuth credential is almost always one of two operator mistakes;
    // naming them is worth more than a generic failure.
    if (result.status === 'AUTH_FAILED') {
      return {
        status: 'NO_ACCESS',
        reason: `Google refused access to contacts for ${config.account}. Either the People API is not enabled for the Cloud project, or the OAuth grant does not include ${SCOPE_CONTACTS_READONLY}, or the consent was granted for a different account. Google said: ${result.googleErrorReason ?? 'no reason given'}.`,
        httpStatus: result.httpStatus,
        googleErrorReason: result.googleErrorReason,
      };
    }
    return {
      status: result.status,
      reason: result.reason,
      httpStatus: result.httpStatus,
      googleErrorReason: result.googleErrorReason,
    };
  }

  const raw = result.data ?? {};
  const mapped = mapGooglePeople(raw.connections);
  return {
    status: 'READY',
    data: {
      people: mapped.people,
      skipped: mapped.skipped,
      nextPageToken: String(raw.nextPageToken || ''),
      nextSyncToken: String(raw.nextSyncToken || ''),
      totalPeople: typeof raw.totalPeople === 'number' ? raw.totalPeople : null,
    },
    fetchedAt: result.fetchedAt,
  };
}

export interface FullSyncResult {
  people: GooglePerson[];
  skipped: { resourceName: string; reason: string }[];
  nextSyncToken: string;
  pages: number;
  /** True when the page budget stopped the read before Google ran out of pages. */
  truncated: boolean;
  usedIncremental: boolean;
}

/**
 * Read all connections, bounded.
 *
 * `maxPages` is a hard ceiling: an unbounded pagination loop against a third party
 * is how a sync job becomes an outage. When the ceiling is hit the result reports
 * `truncated: true` and the caller must say so rather than implying a complete
 * sync.
 *
 * Sync-token expiry (HTTP 410) is handled by falling back to a full read once —
 * never by retrying the same expired token.
 */
export async function listAllConnections(
  options: { maxPages?: number; pageSize?: number; syncToken?: string } = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContactsApiResult<FullSyncResult>> {
  const maxPages = Math.min(Math.max(options.maxPages ?? 20, 1), 50);
  const people: GooglePerson[] = [];
  const skipped: { resourceName: string; reason: string }[] = [];
  let pageToken = '';
  let syncToken = options.syncToken || '';
  let nextSyncToken = '';
  let pages = 0;
  let truncated = false;
  const usedIncremental = Boolean(syncToken);

  for (let page = 0; page < maxPages; page += 1) {
    const result = await listConnectionsPage({ pageToken, syncToken, pageSize: options.pageSize }, env);
    if (result.status !== 'READY' || !result.data) {
      // One documented recovery: an expired sync token means "start over", not
      // "fail". Only attempted once, and only for that specific case.
      if (result.httpStatus === 410 && syncToken) {
        return listAllConnections({ maxPages, pageSize: options.pageSize }, env);
      }
      return {
        status: result.status,
        reason: result.reason,
        httpStatus: result.httpStatus,
        googleErrorReason: result.googleErrorReason,
      };
    }
    pages += 1;
    people.push(...result.data.people);
    skipped.push(...result.data.skipped);
    if (result.data.nextSyncToken) nextSyncToken = result.data.nextSyncToken;
    pageToken = result.data.nextPageToken;
    // Incremental responses carry no page tokens; one page is the whole change set.
    if (syncToken || !pageToken) break;
    if (page === maxPages - 1) truncated = true;
  }

  return {
    status: 'READY',
    data: { people, skipped, nextSyncToken, pages, truncated, usedIncremental },
    fetchedAt: new Date().toISOString(),
  };
}

/** Live connection probe for `/api/google/contacts/status?live=true` and the admin UI. */
export async function verifyContactsAccess(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContactsApiResult<{ account: string; reachable: boolean; sampleCount: number }>> {
  const config = describeContactsConfig(env);
  const page = await listConnectionsPage({ pageSize: 1, personFields: 'names' }, env);
  if (page.status !== 'READY' || !page.data) {
    return { status: page.status, reason: page.reason, httpStatus: page.httpStatus, googleErrorReason: page.googleErrorReason };
  }
  return {
    status: 'READY',
    data: { account: config.account, reachable: true, sampleCount: page.data.people.length },
    fetchedAt: page.fetchedAt,
  };
}
