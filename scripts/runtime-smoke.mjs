// ============================================================================
// ALO Education — production-runtime smoke verification
//
// Runs against a BOOTED standalone server (node .next/standalone/server.js)
// with a REAL MySQL database. Proves, end to end over HTTP:
//   1. /api/health reports status ok with database.connected=true
//   2. the public consultation workflow (POST /api/website/lead) persists a
//      lead that is verifiable with a direct SQL query
//   3. input validation rejects malformed submissions
//   4. protected CRM routes refuse unauthenticated access (no open API)
//   5. public content routes serve data
//
// Usage:
//   node scripts/runtime-smoke.mjs \
//     --base-url http://127.0.0.1:3100 \
//     --database-url mysql://user:pass@127.0.0.1:3306/alo_app_ci
//
// Exits non-zero on the FIRST failed assertion, with a clear reason.
// Cleanup: the smoke lead row (and its search log) is deleted afterwards so
// repeated runs start from the same state.
// ============================================================================
import { createConnection } from 'mysql2/promise';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const baseUrl = arg('base-url', process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000');
const databaseUrl = arg('database-url', process.env.DATABASE_URL || '');

if (!databaseUrl.startsWith('mysql://')) {
  console.error('[smoke] --database-url (mysql://…) is required for persistence verification');
  process.exit(2);
}

const u = new URL(databaseUrl);
const smokeRunId = `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const smokeEmail = `${smokeRunId}@smoke.aloeducation.invalid`;

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, reason: err?.message || String(err) });
    console.error(`  ✗ ${name}: ${err?.message || err}`);
    throw err;
  }
}

function expect(cond, message) {
  if (!cond) throw new Error(message);
}

async function json(method, path, body, expectStatus) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let parsed = null;
  const text = await res.text();
  try { parsed = JSON.parse(text); } catch { /* non-JSON */ }
  if (expectStatus !== undefined) {
    expect(res.status === expectStatus,
      `${method} ${path} → HTTP ${res.status} (expected ${expectStatus})${text ? ` body: ${text.slice(0, 300)}` : ''}`);
  }
  return { status: res.status, body: parsed, text };
}

async function main() {
  console.log(`[smoke] base-url=${baseUrl} db=${u.pathname.replace('/', '')}@${u.hostname}:${u.port || 3306}`);

  // 1. Readiness gate — server up AND database connected.
  await check('GET /api/health → 200 ok, database connected', async () => {
    const { status, body } = await json('GET', '/api/health', undefined, 200);
    expect(body?.status === 'ok', `health status "${body?.status}" !== "ok"`);
    expect(body?.database?.connected === true, 'health reports database not connected');
  });

  // 2. Public consultation workflow persists to the real database.
  let leadId = null;
  await check('POST /api/website/lead → success', async () => {
    const { status, body, text } = await json('POST', '/api/website/lead', {
      name: 'Runtime Smoke Test',
      phone: '+8801700000000',
      email: smokeEmail,
      preferredCountry: 'United Kingdom',
      preferredLevel: 'Masters',
      preferredSubject: 'Computer Science',
      message: 'Automated runtime verification lead',
      source: 'runtime-smoke',
      sourceSection: 'smoke',
    });
    // Route returns 200 (NextResponse.json default); 201 also accepted for
    // forward compatibility. On mismatch, surface the response body so CI
    // annotations reveal which layer answered (app auth, edge guard, …).
    expect(
      status === 200 || status === 201,
      `unexpected status ${status}; body(400): ${String(text).slice(0, 400).replace(/\s+/g, ' ')}`,
    );
    expect(body?.success === true || body?.leadId || body?.lead?.id,
      `lead response missing success/lead id: ${JSON.stringify(body)?.slice(0, 200)}`);
    leadId = body?.leadId || body?.lead?.id || null;
  });

  const db = await createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace('/', ''),
  });
  try {
    await check('lead row persisted (direct SQL verification)', async () => {
      const [rows] = await db.execute(
        'SELECT id, name, email, preferredCountry, source, status FROM LeadForm WHERE email = ? LIMIT 1',
        [smokeEmail],
      );
      expect(Array.isArray(rows) && rows.length === 1, 'no LeadForm row found for the smoke email');
      const row = rows[0];
      expect(row.name === 'Runtime Smoke Test', `persisted name "${row.name}" mismatch`);
      expect(row.preferredCountry === 'United Kingdom', `persisted country "${row.preferredCountry}" mismatch`);
      expect(row.source === 'runtime-smoke', `persisted source "${row.source}" mismatch`);
      leadId = leadId || row.id;
    });

    await check('search analytics logged for the lead', async () => {
      const [rows] = await db.execute(
        'SELECT id, countryId, studyLevel FROM SearchLog WHERE source = ? ORDER BY createdAt DESC LIMIT 1',
        ['runtime-smoke'],
      );
      expect(Array.isArray(rows) && rows.length === 1, 'no SearchLog row for the smoke lead');
      expect(rows[0].countryId === 'United Kingdom', `SearchLog country "${rows[0].countryId}" mismatch`);
    });
  } finally {
    // Cleanup smoke rows (best-effort; filtered to this run's unique email/source
    // so the assertions above remain the source of pass/fail).
    try {
      if (leadId || smokeEmail) {
        await db.execute('DELETE FROM PortalAuditLog WHERE actorUserId = ? AND entityId = ?', ['public', leadId || '']);
        await db.execute('DELETE FROM InternalComment WHERE studentId = ?', [leadId || '']);
        await db.execute('DELETE FROM SearchLog WHERE source = ?', ['runtime-smoke']);
        await db.execute('DELETE FROM LeadForm WHERE email = ?', [smokeEmail]);
      }
    } catch (err) {
      console.warn('[smoke] cleanup warning (non-fatal):', err?.message || err);
    }
    await db.end();
  }

  // 3. Validation rejects malformed submissions.
  await check('POST /api/website/lead with missing fields → 400', async () => {
    await json('POST', '/api/website/lead', { name: 'No Contact' }, 400);
  });

  // 4. Protected routes refuse unauthenticated access.
  await check('GET /api/crm/leads unauthenticated → 401', async () => {
    const { status } = await json('GET', '/api/crm/leads');
    expect(status === 401 || status === 403, `expected 401/403, got ${status}`);
  });
  await check('GET /api/admin/student-benefits unauthenticated → 401', async () => {
    const { status } = await json('GET', '/api/admin/student-benefits');
    expect(status === 401 || status === 403, `expected 401/403, got ${status}`);
  });

  // 5. Public content routes serve data.
  await check('GET /api/website/homepage → 200', async () => {
    await json('GET', '/api/website/homepage', undefined, 200);
  });

  const failed = results.filter((r) => !r.ok).length;
  console.log(`[smoke] ${results.length - failed}/${results.length} checks passed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`[smoke] FAILED: ${err?.message || err}`);
  process.exit(1);
});
