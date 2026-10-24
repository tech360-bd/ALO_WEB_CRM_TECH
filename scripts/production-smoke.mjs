// Read-only anonymous checks. Authenticated role/isolation checks are separate.
//
// Design notes (2026-10-24, after three red runs of the Health & Dependency
// Monitor):
//   * Every check runs before the process decides its exit code, so one failure
//     no longer hides the state of the other routes. The old version threw on
//     the first bad path, which meant the log never showed whether ONE route or
//     the whole deployment was missing.
//   * Failures are classified. A LiteSpeed/edge 404 (the hosting server's own
//     "Not Found" page) means the request never reached the Next.js app — a
//     deployment/routing gap. A Next.js 404 means the app answered and the route
//     is genuinely absent. Those need different remediation, so they are
//     reported differently.
//   * The gate still fails closed: any deviation from the expected status is a
//     non-zero exit. Nothing was relaxed.
const origin = new URL(process.argv[2] || 'https://aloeducation.com');
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('A credential-free HTTPS origin is required');
}

const results = [];

function record(path, ok, detail) {
  results.push({ path, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${path} — ${detail}`);
}

async function request(path) {
  try {
    return await fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(25000), headers: { 'Cache-Control': 'no-cache' } });
  } catch {
    throw new Error(`HTTPS request failed: ${path} (network/TLS/timeout; response not verified)`);
  }
}

/**
 * True when the body is the hosting server's default 404 rather than a Next.js
 * response. LiteSpeed answers with "Proudly powered by LiteSpeed Web Server";
 * Next.js always ships build markers (_next/ or a __next_f payload).
 */
function isEdgeResponse(html) {
  const lower = html.toLowerCase();
  if (/proudly powered by litespeed|litespeed web server/.test(lower)) return true;
  return !/_next\/|__next|self\.__next/.test(lower);
}

// ── 1. Readiness ──────────────────────────────────────────────────────────────
try {
  const health = await request('/api/health');
  if (health.status !== 200 || !health.headers.get('content-type')?.includes('application/json')) {
    record('/api/health', false, `HTTP ${health.status} (expected 200 JSON)`);
  } else {
    const data = await health.json();
    if (data.status !== 'ok' || data.database?.connected !== true) {
      record('/api/health', false, `not ready (status=${data.status}, database.connected=${data.database?.connected})`);
    } else {
      record('/api/health', true, 'database readiness');
    }
  }
} catch (error) {
  record('/api/health', false, error instanceof Error ? error.message : 'request error');
}

// ── 2. Public pages (HTML + brand identity only; not interactive) ─────────────
const PUBLIC_PAGES = ['/', '/destinations', '/universities', '/course-finder', '/student/login', '/partner/login', '/employee/login'];
let edgeGaps = 0;
for (const path of PUBLIC_PAGES) {
  try {
    const res = await request(path);
    const type = res.headers.get('content-type') ?? '';
    if (res.status !== 200 || !type.includes('text/html')) {
      const html = await res.text().catch(() => '');
      const edge = isEdgeResponse(html);
      if (edge) edgeGaps += 1;
      record(
        path,
        false,
        res.status === 404
          ? `HTTP 404 from ${edge ? 'the hosting server (LiteSpeed), not the Next.js app — the deployed build does not route this path' : 'Next.js (application 404)'}`
          : `HTTP ${res.status} (expected 200 HTML, got "${type || 'no content-type'}")`,
      );
      continue;
    }
    const html = await res.text();
    if (!/<html[\s>]/i.test(html) || !/ALO/i.test(html)) {
      record(path, false, 'HTTP 200 but the HTML/brand identity check failed');
      continue;
    }
    record(path, true, 'HTML/brand only; not interactive verification');
  } catch (error) {
    record(path, false, error instanceof Error ? error.message : 'request error');
  }
}

// ── 3. Anonymous API access must be denied ────────────────────────────────────
let missingApis = 0;
for (const path of ['/api/workforce/metrics', '/api/workforce/approval', '/api/finance', '/api/hr']) {
  try {
    const res = await request(path);
    if ([401, 403].includes(res.status)) {
      record(path, true, 'anonymous denied');
      continue;
    }
    if (res.status === 404) missingApis += 1;
    record(path, false, `HTTP ${res.status} (expected 401/403 — anonymous access was NOT denied${res.status === 404 ? '; the route is absent from the deployed build' : ''})`);
  } catch (error) {
    record(path, false, error instanceof Error ? error.message : 'request error');
  }
}

// ── 4. Verdict ───────────────────────────────────────────────────────────────
const failures = results.filter((r) => !r.ok);
const readinessOk = results.find((r) => r.path === '/api/health')?.ok === true;

console.log('');
if (failures.length === 0) {
  console.log(`✓ ${results.length}/${results.length} anonymous checks passed against ${origin.origin}`);
  console.log('Authenticated login, logout, RBAC, object isolation and CRUD remain NOT VERIFIED by this anonymous check.');
} else {
  console.error(`✗ ${failures.length}/${results.length} anonymous checks failed against ${origin.origin}:`);
  for (const f of failures) console.error(`  - ${f.path}: ${f.detail}`);
  if (edgeGaps > 0 || missingApis > 0) {
    console.error('');
    console.error('Diagnosis: /api/health proved the app and database are up, yet the hosting server answered 404 for');
    console.error('routes that exist in this repository. That is a deployment/routing gap, not an application outage:');
    console.error('the production build predates (or is missing) these routes. Remediation, in order:');
    console.error('  1. deploy the current main build to Hostinger (standalone output) — deployment is manual by policy;');
    console.error('  2. purge the LiteSpeed page cache after the deploy;');
    console.error('  3. re-run this workflow. Do not weaken these checks — the routes exist in the repo.');
  }
  if (!readinessOk) {
    console.error('');
    console.error('Diagnosis: /api/health itself failed. Treat this as an outage/configuration incident first.');
  }
  process.exitCode = 1;
}
