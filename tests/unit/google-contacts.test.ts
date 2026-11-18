/**
 * Google Contacts (People API) → central registry — unit tests.
 *
 * These cover the places where being wrong is expensive and silent:
 *
 *   - a service account must never be reported as a working Contacts credential
 *     (it cannot read a Gmail address book, so it would return "0 contacts" and
 *     look like the company has none)
 *   - ALO's own values must never be overwritten by Google
 *   - ambiguity must produce a review row, never a write
 *   - a re-run must be idempotent
 *   - no secret may appear in the configuration description
 *
 * No network and no database: the HTTP client is not exercised here.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONTACTS_ACCOUNT,
  describeContactsConfig,
  mapGooglePeople,
  mapGooglePerson,
  planContactImport,
  summarizePlan,
  type ExistingRegistryRow,
  type GooglePerson,
} from '@/lib/google/contacts';

const ENV = { ...process.env };

function env(overrides: Record<string, string>): NodeJS.ProcessEnv {
  return { ...ENV, ...overrides } as NodeJS.ProcessEnv;
}

function person(overrides: Partial<GooglePerson> = {}): GooglePerson {
  return {
    resourceName: 'people/c1',
    displayName: 'Rakib Hasan',
    phones: [{ value: '01712345678', normalized: '8801712345678', type: 'mobile' }],
    emails: [],
    etag: 'etag-1',
    deleted: false,
    ...overrides,
  };
}

function row(overrides: Partial<ExistingRegistryRow> = {}): ExistingRegistryRow {
  return {
    id: 'row-1',
    normalizedPhone: '8801712345678',
    displayName: 'Rakib Hasan',
    email: '',
    source: 'WEBHOOK',
    externalContactId: '',
    studentId: '',
    leadId: '',
    isBlocked: false,
    isOptedOut: false,
    ...overrides,
  };
}

describe('describeContactsConfig — no false positives', () => {
  it('reports NOT_CONFIGURED with an actionable note when nothing is set', () => {
    const config = describeContactsConfig(env({ GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', GOOGLE_OAUTH_REFRESH_TOKEN: '', GOOGLE_CONTACTS_REFRESH_TOKEN: '', GOOGLE_SERVICE_ACCOUNT_JSON: '', GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON: '' }));
    expect(config.configured).toBe(false);
    expect(config.note).toMatch(/NOT CONFIGURED/);
    expect(config.account).toBe(DEFAULT_CONTACTS_ACCOUNT);
    expect(config.scope).toBe('https://www.googleapis.com/auth/contacts.readonly');
  });

  it('refuses to call a service account "configured" for Contacts, and says why', () => {
    const serviceAccount = JSON.stringify({
      type: 'service_account',
      project_id: 'alo',
      private_key_id: 'k',
      client_email: 'alo@alo.iam.gserviceaccount.com',
      // A syntactically valid RSA key is not needed: describe* never signs.
      private_key: '-----BEGIN PRIVATE KEY-----MIIB-----END PRIVATE KEY-----',
      token_uri: 'https://oauth2.googleapis.com/token',
    });
    const config = describeContactsConfig(env({ GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccount, GOOGLE_CLIENT_ID: '', GOOGLE_CONTACTS_REFRESH_TOKEN: '' }));
    expect(config.authMode).toBe('service_account');
    expect(config.configured).toBe(false);
    expect(config.note).toMatch(/CANNOT read a Gmail account/i);
    expect(config.note).toMatch(/GOOGLE_CONTACTS_REFRESH_TOKEN/);
  });

  it('accepts an OAuth refresh token, including the contacts-specific one', () => {
    const config = describeContactsConfig(env({
      GOOGLE_SERVICE_ACCOUNT_JSON: '',
      GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON: '',
      GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_CONTACTS_REFRESH_TOKEN: 'refresh-token',
      GOOGLE_CONTACTS_ACCOUNT: 'alo.allcontacts@gmail.com',
    }));
    expect(config.configured).toBe(true);
    expect(config.authMode).toBe('oauth_refresh_token');
    expect(config.account).toBe('alo.allcontacts@gmail.com');
    // The credential itself must never be echoed back.
    expect(JSON.stringify(config)).not.toContain('refresh-token');
    expect(JSON.stringify(config)).not.toContain('secret');
  });

  it('a contacts token wins over a service account, so the People API can act as the user', () => {
    const serviceAccount = JSON.stringify({
      project_id: 'alo',
      private_key_id: 'k',
      client_email: 'alo@alo.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----MIIB-----END PRIVATE KEY-----',
      token_uri: 'https://oauth2.googleapis.com/token',
    });
    const config = describeContactsConfig(env({
      GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccount,
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_CONTACTS_REFRESH_TOKEN: 'contacts-token',
    }));
    expect(config.authMode).toBe('oauth_refresh_token');
    expect(config.configured).toBe(true);
  });
});

describe('mapGooglePerson — never fabricate, never store junk', () => {
  it('maps names, normalises BD numbers and keeps the Google resource name', () => {
    const mapped = mapGooglePerson({
      resourceName: 'people/c42',
      etag: 'abc',
      names: [{ displayName: 'Rakib Hasan', metadata: { primary: true } }, { displayName: 'R. Hasan' }],
      phoneNumbers: [{ value: '01712-345678', type: 'mobile' }],
      emailAddresses: [{ value: 'Rakib@Example.com ' }],
    });
    expect(mapped).not.toBeNull();
    expect(mapped!.resourceName).toBe('people/c42');
    expect(mapped!.displayName).toBe('Rakib Hasan');
    expect(mapped!.phones[0].normalized).toBe('8801712345678');
    expect(mapped!.emails[0]).toBe('rakib@example.com');
  });

  it('drops numbers that cannot be normalised to a plausible subscriber', () => {
    const mapped = mapGooglePerson({
      resourceName: 'people/c43',
      names: [{ displayName: 'Bad Number' }],
      phoneNumbers: [{ value: 'N/A' }, { value: '0' }, { value: '01712345678' }],
    });
    expect(mapped!.phones).toHaveLength(1);
    expect(mapped!.phones[0].normalized).toBe('8801712345678');
  });

  it('skips people with no name and no usable number, and says so', () => {
    const { people, skipped } = mapGooglePeople([
      { resourceName: 'people/c44', phoneNumbers: [{ value: '123' }] },
      { resourceName: 'people/c45', names: [{ displayName: 'Sadia' }], phoneNumbers: [{ value: '01812345678' }] },
    ]);
    expect(people).toHaveLength(1);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].resourceName).toBe('people/c44');
  });
});

describe('planContactImport — ALO is the source of truth', () => {
  it('creates an unverified registry contact for a number ALO has never seen', () => {
    const { decisions, counters } = planContactImport({ people: [person()], existing: [] });
    expect(decisions[0].action).toBe('CREATE');
    expect(decisions[0].fill.primaryPhone).toBe('8801712345678');
    expect(counters.create).toBe(1);
  });

  it('never overwrites a populated CRM name — it queues a review instead', () => {
    const { decisions } = planContactImport({
      people: [person({ displayName: 'Rakib H.' })],
      existing: [row({ displayName: 'Rakib Hasan' })],
    });
    expect(decisions[0].action).toBe('CONFLICT_REVIEW');
    expect(decisions[0].conflicts[0]).toMatchObject({ field: 'displayName', crmValue: 'Rakib Hasan' });
    // Nothing to write: the policy result contains no fill for a conflicting field.
    expect(decisions[0].fill.displayName).toBeUndefined();
  });

  it('allows Google to fill a field ALO left empty', () => {
    const { decisions } = planContactImport({
      people: [person({ displayName: 'Rakib Hasan', emails: ['rakib@example.com'] })],
      existing: [row({ displayName: '', email: '' })],
    });
    expect(decisions[0].action).toBe('FILL_BLANK_FIELDS');
    expect(decisions[0].fill).toMatchObject({ displayName: 'Rakib Hasan', email: 'rakib@example.com' });
  });

  it('links an already-agreeing contact without touching any value', () => {
    const { decisions } = planContactImport({ people: [person()], existing: [row()] });
    expect(decisions[0].action).toBe('LINK_EXISTING');
    expect(decisions[0].fill).toEqual({});
  });

  it('treats a shared number across two registry rows as ambiguous, never a merge', () => {
    const { decisions, counters } = planContactImport({
      people: [person()],
      existing: [row({ id: 'row-1' }), row({ id: 'row-2', displayName: 'Rakib (father)' })],
    });
    expect(decisions[0].action).toBe('CONFLICT_REVIEW');
    expect(decisions[0].reason).toMatch(/not proof of identity/i);
    expect(counters.conflictReview).toBe(1);
    expect(counters.create).toBe(0);
  });

  it('is idempotent: an already-linked Google contact is skipped', () => {
    const { decisions, counters } = planContactImport({
      people: [person({ resourceName: 'people/c99' })],
      existing: [row({ externalContactId: 'people/c99' })],
    });
    expect(decisions[0].action).toBe('SKIP_ALREADY_LINKED');
    expect(counters.duplicate).toBe(1);
  });

  it('respects consent: an opted-out contact is never written', () => {
    const { decisions } = planContactImport({
      people: [person({ displayName: 'New Name From Google' })],
      existing: [row({ isOptedOut: true })],
    });
    expect(decisions[0].action).toBe('SKIP_OPTED_OUT');
  });

  it('reports a phoneless contact instead of inventing a number for it', () => {
    const { decisions, counters } = planContactImport({
      people: [person({ phones: [], displayName: 'Email Only' })],
      existing: [],
    });
    expect(decisions[0].action).toBe('SKIP_UNUSABLE');
    expect(counters.skipped).toBe(1);
  });

  it('matches on the stored variants of a number (01… vs 8801…)', () => {
    const { decisions } = planContactImport({
      people: [person({ phones: [{ value: '01712345678', normalized: '8801712345678', type: '' }] })],
      existing: [row({ normalizedPhone: '01712345678' })],
    });
    expect(decisions[0].action).toBe('LINK_EXISTING');
  });

  it('summarises counters consistently with the decisions', () => {
    const { decisions, counters } = planContactImport({
      people: [person({ resourceName: 'people/a' }), person({ resourceName: 'people/b', phones: [{ value: '01812345678', normalized: '8801812345678', type: '' }] })],
      existing: [row()],
    });
    expect(counters.found).toBe(2);
    expect(counters.linkExisting + counters.fillBlank + counters.create + counters.conflictReview + counters.duplicate + counters.skipped).toBe(2);
    expect(summarizePlan(decisions)).toEqual(counters);
  });
});
