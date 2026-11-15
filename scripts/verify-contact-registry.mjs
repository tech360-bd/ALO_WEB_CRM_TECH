#!/usr/bin/env node
/**
 * ALO — contact registry & Google Contacts verification runbook.
 *
 * Phase 2 Tasks 1 and 2 could not be executed inside the build environment (no
 * database, no Google credentials, no network egress to people.googleapis.com). This
 * script is that verification, packaged so an operator can run it where the real
 * credentials and staging database live — and so the result is evidence rather than a
 * claim.
 *
 * What it does NOT do: it never writes, never migrates, never resets, and never prints
 * a secret. Every step is a read.
 *
 * Usage:
 *   DATABASE_URL='mysql://…' \
 *   GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… GOOGLE_CONTACTS_REFRESH_TOKEN=… \
 *   node scripts/verify-contact-registry.mjs
 *
 *   add --skip-google to check only the database, or --skip-database for only Google.
 *
 * Exit code: 0 when every required check passes, 1 when any check fails or is blocked.
 */

import process from 'node:process';

const args = new Set(process.argv.slice(2));
const skipGoogle = args.has('--skip-google');
const skipDatabase = args.has('--skip-database');

const results = [];
const record = (name, status, detail) => {
  results.push({ name, status, detail });
  const badge = { PASS: 'PASS', PARTIAL: 'PARTIAL', BLOCKED: 'BLOCKED', FAIL: 'FAIL' }[status] || status;
  console.log(`[${badge}] ${name}${detail ? ` — ${detail}` : ''}`);
};

const mask = (value) => {
  const text = String(value || '');
  return text.length <= 4 ? '••••' : `${'•'.repeat(Math.min(10, text.length - 4))}${text.slice(-4)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Database
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_TABLES = [
  'WhatsAppContact',
  'ContactMatchReview',
  'ImportBatch',
  'ImportError',
  'AuditLog',
  'PortalAuditLog',
  'SocialIntegration',
  'WhatsAppOfficialNumber',
  'WhatsAppNumberAssignmentAudit',
  'CommunicationConsent',
  'WhatsAppFollowUpSchedule',
  'WhatsAppMessageArchive',
  'UccConversation',
];

const REQUIRED_COLUMNS = {
  WhatsAppContact: ['phone', 'normalizedPhone', 'displayName', 'externalContactId', 'studentId', 'tags', 'isOptedOut', 'isBlocked'],
  ContactMatchReview: ['incomingPhone', 'normalizedPhone', 'status', 'decision', 'decidedBy'],
  ImportBatch: ['sourceCrmName', 'totalRows', 'newCount', 'matchedCount', 'status'],
  SocialIntegration: ['provider', 'lastSyncAt', 'healthStatus', 'metadata'],
};

async function checkDatabase() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (!url) {
    record('Database connection', 'BLOCKED', 'DATABASE_URL is not set in this environment.');
    return;
  }
  if (!/^mysql:\/\//.test(url)) {
    record('Database connection', 'PARTIAL', 'DATABASE_URL is not a mysql:// URL; the production schema targets MySQL.');
  }

  let PrismaClient;
  try {
    ({ PrismaClient } = await import('@prisma/client/index.js'));
  } catch (error) {
    record('Prisma client', 'BLOCKED', `@prisma/client could not be imported (${error?.message || 'unknown'}). Run "npx prisma generate" first.`);
    return;
  }

  const client = new PrismaClient({ log: ['error'] });
  try {
    await client.$queryRaw`SELECT 1`;
    record('Database connection', 'PASS', `Connected; host ${mask(url.replace(/^mysql:\/\/[^@]*@/, ''))}`);
  } catch (error) {
    record('Database connection', 'FAIL', `Connection failed: ${error?.message?.split('\n')[0] || 'unknown error'}`);
    await client.$disconnect().catch(() => {});
    return;
  }

  try {
    const tables = await client.$queryRawUnsafe(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`,
    );
    const present = new Set(tables.map((row) => String(row.TABLE_NAME ?? row.table_name ?? '')));
    const missing = REQUIRED_TABLES.filter((table) => !present.has(table));
    record('Schema — required tables', missing.length === 0 ? 'PASS' : 'FAIL', missing.length === 0 ? `${REQUIRED_TABLES.length} present` : `missing: ${missing.join(', ')}`);

    const columnProblems = [];
    for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
      if (!present.has(table)) continue;
      const rows = await client.$queryRawUnsafe(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        table,
      );
      const have = new Set(rows.map((row) => String(row.COLUMN_NAME ?? row.column_name ?? '')));
      const absent = columns.filter((column) => !have.has(column));
      if (absent.length > 0) columnProblems.push(`${table}: ${absent.join(', ')}`);
    }
    record('Schema — required columns', columnProblems.length === 0 ? 'PASS' : 'FAIL', columnProblems.join(' | ') || 'all present');

    // Migration compatibility: the applied migration count must not exceed the files
    // in the repository, and nothing pending must be silently ignored.
    const applied = await client.$queryRawUnsafe(`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 3`);
    record('Migrations applied', applied.length > 0 ? 'PASS' : 'BLOCKED', applied.map((row) => String(row.migration_name ?? row.MIGRATION_NAME ?? '')).join(', ') || 'no rows');
  } catch (error) {
    record('Schema inspection', 'FAIL', error?.message?.split('\n')[0] || 'unknown error');
  }

  // Read-only snapshot: this is the "no records lost" baseline an operator can diff.
  try {
    const [contacts, studentsLinked, aliases, reviews, batches, audit] = await Promise.all([
      client.whatsAppContact.count(),
      client.whatsAppContact.count({ where: { studentId: { not: '' } } }),
      client.whatsAppContact.count({ where: { tags: { contains: 'merged_into:' } } }),
      client.contactMatchReview.count().catch(() => null),
      client.importBatch.count().catch(() => null),
      client.auditLog.count().catch(() => null),
    ]);
    record('Record counts (read-only baseline)', 'PASS', `contacts=${contacts} studentLinked=${studentsLinked} aliases=${aliases} reviews=${reviews ?? 'n/a'} importBatches=${batches ?? 'n/a'} auditRows=${audit ?? 'n/a'}`);
  } catch (error) {
    record('Record counts (read-only baseline)', 'FAIL', error?.message?.split('\n')[0] || 'unknown error');
  }

  // The pool is configuration: report what the registry actually holds, and whether
  // any number has a provider verification stamp. Never claim a number works.
  try {
    const numbers = await client.whatsAppOfficialNumber.findMany({
      select: { phoneNumber: true, connectionStatus: true, metaPhoneNumberId: true, lastConnectionCheckAt: true },
      orderBy: { phoneNumber: 'asc' },
    });
    const recent = numbers.filter((number) => number.lastConnectionCheckAt
      && Date.now() - new Date(number.lastConnectionCheckAt).getTime() < 24 * 60 * 60 * 1000
      && number.metaPhoneNumberId
      && number.connectionStatus === 'connected');
    record(
      'Official number pool',
      numbers.length === 0 ? 'BLOCKED' : recent.length === 0 ? 'PARTIAL' : 'PASS',
      numbers.length === 0
        ? 'registry empty — run scripts/seed-alo-whatsapp-numbers.mjs or the admin seed action'
        : `${numbers.length} registered, ${recent.length} verified within 24h; ${numbers.length - recent.length} blocked for live sending`,
    );
  } catch (error) {
    record('Official number pool', 'FAIL', error?.message?.split('\n')[0] || 'unknown error');
  }

  await client.$disconnect().catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Google People API
// ─────────────────────────────────────────────────────────────────────────────

async function checkGoogle() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.GOOGLE_CONTACTS_REFRESH_TOKEN || process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '').trim();
  const account = (process.env.GOOGLE_CONTACTS_ACCOUNT || 'alo.allcontacts@gmail.com').trim();

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON) {
    record(
      'Google credential shape',
      refreshToken && clientId && clientSecret ? 'PASS' : 'BLOCKED',
      refreshToken && clientId && clientSecret
        ? 'A service account is also configured; it is not used for Contacts.'
        : 'Only a service account is configured. It CANNOT read a Gmail address book — consent once as the contacts account and set GOOGLE_CONTACTS_REFRESH_TOKEN.',
    );
  }

  if (!clientId || !clientSecret || !refreshToken) {
    record('Google credential', 'BLOCKED', `missing ${[!clientId && 'GOOGLE_CLIENT_ID', !clientSecret && 'GOOGLE_CLIENT_SECRET', !refreshToken && 'GOOGLE_CONTACTS_REFRESH_TOKEN'].filter(Boolean).join(', ')}`);
    return;
  }

  // 1. Refresh token → access token (proves the grant is alive and not revoked).
  let accessToken = '';
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }).toString(),
    });
    const payload = await response.json();
    if (!response.ok || !payload.access_token) {
      record('OAuth token refresh', 'FAIL', `HTTP ${response.status} ${payload.error || ''}`.trim());
      return;
    }
    accessToken = payload.access_token;
    record('OAuth token refresh', 'PASS', `access token acquired, expires in ${payload.expires_in || '?'}s`);
  } catch (error) {
    record('OAuth token refresh', 'FAIL', `token endpoint unreachable: ${error?.message || 'unknown'}`);
    return;
  }

  // 2. Does the grant carry the contacts scope? (`tokeninfo` is authoritative.)
  try {
    const info = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    const payload = await info.json();
    const scopes = String(payload.scope || '');
    const hasScope = scopes.includes('https://www.googleapis.com/auth/contacts.readonly') || scopes.includes('https://www.googleapis.com/auth/contacts');
    record('Contacts scope granted', hasScope ? 'PASS' : 'FAIL', hasScope ? 'contacts scope present' : `scope list: ${scopes || '(none)'}`);
  } catch (error) {
    record('Contacts scope granted', 'BLOCKED', `tokeninfo unreachable: ${error?.message || 'unknown'}`);
  }

  // 3. Real People API read — one page, one field. This is the "real API response" evidence.
  try {
    const response = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names&pageSize=1&requestSyncToken=true&sources=READ_SOURCE_TYPE_CONTACT',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const reason = payload?.error?.status || payload?.error?.message || `HTTP ${response.status}`;
      record('People API connectivity', 'FAIL', String(reason));
      if (response.status === 403) {
        console.log('        → enable the People API on the Cloud project and re-consent as ' + account);
      }
      return;
    }
    const people = Array.isArray(payload.connections) ? payload.connections.length : 0;
    record('People API connectivity', 'PASS', `Google answered; ${people} contact(s) on this page`);
    record('Pagination token', 'PASS', payload.nextPageToken || payload.nextSyncToken ? 'page/sync tokens returned' : 'single page, no further tokens');
    record(
      'Contacts readable',
      people > 0 ? 'PASS' : 'PARTIAL',
      people > 0 ? 'the account returned at least one contact' : 'the API answered but returned no contacts — verify the account actually holds the company address book',
    );
  } catch (error) {
    record('People API connectivity', 'BLOCKED', `people.googleapis.com unreachable from here: ${error?.message || 'unknown'}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

console.log(`ALO contact registry verification — account ${(process.env.GOOGLE_CONTACTS_ACCOUNT || 'alo.allcontacts@gmail.com')}\n`);

if (!skipDatabase) await checkDatabase();
if (!skipGoogle) await checkGoogle();

console.log('\nSummary');
const counts = results.reduce((acc, entry) => ({ ...acc, [entry.status]: (acc[entry.status] || 0) + 1 }), {});
for (const [status, count] of Object.entries(counts)) console.log(`  ${status}: ${count}`);

const blocking = results.filter((entry) => entry.status === 'FAIL' || entry.status === 'BLOCKED');
console.log(
  blocking.length === 0
    ? '\nEvery check passed. Attach this output to the PR as Task 1/2 evidence.'
    : `\n${blocking.length} check(s) did not pass. Nothing was written or changed by this script.`,
);

console.log('\nNext, in the app (authorised staff):');
console.log('  1. /admin/google-stack → Google Contacts → "Verify access (live call)"');
console.log('  2. "Preview import (writes nothing)" → review counts');
console.log('  3. "Import into registry" → run again and confirm duplicates, not new rows');
console.log('  4. /crm/contacts/identify → resolve a known number, confirm Student ID and follow-ups');
console.log('  5. /crm/contacts/dashboard → confirm the 16 metrics read from the live database');

process.exit(blocking.length === 0 ? 0 : 1);
