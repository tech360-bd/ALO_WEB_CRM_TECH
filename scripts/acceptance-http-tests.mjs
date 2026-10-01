// ============================================================
// ACCEPTANCE HTTP TEST SUITE
// Runs against a STARTED production standalone server.
// Gates covered: no-404, no-500, no-homepage-fallback, public
// content, security headers, health API, asset loading, auth
// API sanitization, API auth gates (401/403).
//
// DB note: in an environment without a database, DB-backed APIs
// are expected to return 5xx with SANITIZED bodies (no stack
// traces) — verified explicitly. Page shells must still render.
//
// Usage: node scripts/acceptance-http-tests.mjs [baseUrl]
// ============================================================
const BASE = process.argv[2] || 'http://127.0.0.1:3044';

let pass = 0, fail = 0, blocked = 0;
const failures = [];

function record(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; failures.push(`${name} ${detail}`); console.log(`  ✗ ${name} ${detail}`); }
}

async function get(path, opts = {}) {
  try {
    const res = await fetch(BASE + path, { redirect: 'manual', ...opts });
    const text = await res.text();
    return { status: res.status, headers: res.headers, body: text };
  } catch (e) {
    return { status: 0, headers: new Map(), body: '', error: String(e) };
  }
}

// follow up to 5 redirects, return FINAL response + visited hops
async function getFinal(path, opts = {}) {
  let url = BASE + path, hops = 0, last;
  do {
    last = await fetch(url, { redirect: 'manual', ...opts });
    const loc = last.headers.get('location');
    if (loc && (last.status === 301 || last.status === 302 || last.status === 307 || last.status === 308)) {
      url = new URL(loc, url).toString(); hops++;
    } else break;
  } while (hops < 5);
  const text = await last.text();
  return { status: last.status, headers: last.headers, body: text, hops, url };
}

// ── 1. Health endpoints ──────────────────────────────────────
async function healthTests() {
  console.log('\n== HEALTH API ==');
  const live = await get('/api/health/live');
  record('GET /api/health/live returns 200', live.status === 200, `got ${live.status}`);

  const ready = await get('/api/health');
  const readyOk = ready.status === 200 || ready.status === 503; // 503 = no DB in sandbox: designed degraded state
  record('GET /api/health responds 200 (with DB) or 503 degraded (without DB)', readyOk, `got ${ready.status}`);
  let parsed = null;
  try { parsed = JSON.parse(ready.body); } catch {}
  record('health body is JSON', parsed !== null);
  record('health body has status field', parsed && 'status' in parsed);
  record('health does not leak stack traces/SQL', !/PrismaClient|stack|at Object\.|mysql:\/\//i.test(ready.body));
  record('health reports database connectedness', parsed && parsed.database && typeof parsed.database.connected === 'boolean');
}

// ── 2. Required public routes: no 404, real content ─────────
const PUBLIC_ROUTES = [
  '/', '/destinations', '/universities', '/courses', '/scholarships', '/services',
  '/resources', '/contact', '/book-consultation', '/consultation', '/eligibility-check',
  '/eligibility-checker', '/course-finder', '/compare', '/about', '/success-stories',
  '/blog', '/faqs', '/events', '/news', '/team', '/test-preparation', '/english-test-prep',
  '/english-tests', '/visa-support', '/student-journey', '/language-prep', '/login', '/register',
  '/privacy-policy', '/terms', '/accessibility', '/user-guide', '/offline',
];

async function publicRouteTests() {
  console.log('\n== PUBLIC ROUTES (no-404 / no-500 / no-homepage-fallback) ==');
  const homepage = await get('/');
  const homeSig = signature(homepage.body);

  for (const route of PUBLIC_ROUTES) {
    const res = await getFinal(route);
    const gated = res.hops > 0 && /\/login/.test(res.url);
    record(`GET ${route} → 200 (direct or after login-gate redirect)`, res.status === 200, `got ${res.status} (${res.hops} hops → ${res.url.replace(BASE, '')})`);
    if (gated) console.log(`    (auth-gated: ${route} → login redirect — verified non-404)`);
    if (res.status === 200 && !gated && route !== '/') {
      const sig = signature(res.body);
      const isHomeFallback = sig === homeSig && !['/', '/offline'].includes(route);
      record(`  ${route} renders its own page (not homepage fallback)`, !isHomeFallback);
    }
  }

  // dynamic routes (real slugs)
  const dyn = [
    '/destinations/united-kingdom', '/destinations/usa', '/destinations/canada',
    '/universities/university-of-oxford', '/universities/imperial-college-london',
    '/english-test-prep/ielts', '/language-prep/ielts', '/visa-support/united-kingdom',
  ];
  for (const route of dyn) {
    const res = await getFinal(route);
    record(`GET ${route} (dynamic) → 200`, res.status === 200, `got ${res.status} → ${res.url.replace(BASE, '')}`);
  }
}

function signature(body) {
  // crude page signature: title + h1 count + body length bucket
  const title = (body.match(/<title[^>]*>([^<]*)<\/title>/i) || [, ''])[1].trim();
  const h1s = (body.match(/<h1/g) || []).length;
  const len = Math.round(body.length / 1000);
  return `${title}|${h1s}|${len}`;
}

// ── 3. Portal roots (rewrites, no 404) ───────────────────────
async function portalRouteTests() {
  console.log('\n== PORTAL ROUTES ==');
  const portals = [
    '/admin', '/portal', '/super-admin', '/counselor', '/application-manager', '/visa',
    '/student', '/partner', '/employee',
  ];
  for (const p of portals) {
    const res = await get(p);
    record(`GET ${p} → not 404 (page or redirect)`, res.status !== 404, `got ${res.status}`);
  }
  // login pages for portals
  for (const p of ['/admin/login', '/employee/login', '/student/login', '/partner/login', '/portal/login']) {
    const res = await get(p);
    record(`GET ${p} → not 404`, res.status !== 404, `got ${res.status}`);
  }
}

// ── 4. Protected APIs reject anonymous access (server-side) ─
async function apiAuthTests() {
  console.log('\n== API AUTHORIZATION (anonymous) ==');
  const protectedApis = [
    '/api/crm/dashboard', '/api/admin/users', '/api/counselor/dashboard',
    '/api/student/documents', '/api/crm/ucc/conversations', '/api/admin/metrics',
    '/api/applications', '/api/employee/dashboard',
  ];
  for (const api of protectedApis) {
    const res = await get(api);
    record(`GET ${api} anonymous → 401/403 (not 200)`, res.status === 401 || res.status === 403, `got ${res.status}`);
  }
  // metrics governance requires auth
  const post = await get('/api/admin/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"action":"sync"}' });
  record('POST /api/admin/metrics anonymous → 401/403', post.status === 401 || post.status === 403, `got ${post.status}`);
}

// ── 5. Auth API sanitization (no leak on failure) ────────────
async function authSanitizationTests() {
  console.log('\n== AUTH API (session, validation, sanitization) ==');
  // NextAuth session endpoint: must respond JSON (JWT sessions work without DB)
  const session = await get('/api/auth/session');
  record('GET /api/auth/session → 200 JSON', session.status === 200 && /json/i.test(session.headers.get('content-type') || ''), `got ${session.status}`);

  // register validation: bad payload must be 4xx (validation), never a leak
  const badReg = await get('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  record('POST /api/auth/register invalid → 4xx or sanitized 5xx', badReg.status >= 400, `got ${badReg.status}`);
  record('register failure sanitized (no stack/DB internals)', !/PrismaClient|at Object\.|mysql:\/\//i.test(badReg.body));

  // password reset request: with DB returns non-enumeration 200; without DB must be sanitized
  const reset = await get('/api/auth/reset-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'probe@example.com' }),
  });
  record('POST /api/auth/reset-password responds (200 non-enumeration with DB / sanitized 5xx without)', reset.status === 200 || reset.status >= 500, `got ${reset.status}`);
  record('reset-password response sanitized', !/PrismaClient|at Object\.|mysql:\/\/user:pass/i.test(reset.body));
}

// ── 6. Security headers ──────────────────────────────────────
async function securityHeaderTests() {
  console.log('\n== SECURITY HEADERS ==');
  const res = await get('/');
  const checks = [
    ['X-Frame-Options', /SAMEORIGIN/i],
    ['X-Content-Type-Options', /nosniff/i],
    ['Referrer-Policy', /strict-origin-when-cross-origin/i],
    ['Strict-Transport-Security', /max-age=\d+/i],
    ['Content-Security-Policy', /default-src/i],
    ['Permissions-Policy', /camera=/i],
  ];
  for (const [header, re] of checks) {
    const v = res.headers.get(header) || '';
    record(`${header} present`, v.length > 0 && re.test(v), `"${v.slice(0, 40)}"`);
  }
}

// ── 7. Public assets load over HTTP ──────────────────────────
async function assetTests() {
  console.log('\n== PUBLIC ASSETS OVER HTTP ==');
  const assets = [
    '/manifest.json', '/robots.txt', '/images/landing/Copy of logo.webp',
    '/images/hero-banners/UK slide Banner.webp', '/images/testimonials/default.png',
    '/docs/VIDEO_ECOSYSTEM_AUDIT.md', '/icons/icon-192x192.png', '/icons/icon-512x512.png',
  ];
  for (const a of assets) {
    const res = await get(encodeURI(a));
    record(`GET ${a} → 200`, res.status === 200, `got ${res.status}`);
  }
  // CSS/JS chunks from homepage HTML
  const home = await get('/');
  const chunks = [...home.body.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]).slice(0, 6);
  for (const c of chunks) {
    const res = await get(c);
    record(`GET ${c.slice(0, 60)}… → 200`, res.status === 200, `got ${res.status}`);
  }
  // sitemap + robots
  for (const p of ['/sitemap.xml', '/robots.txt']) {
    const res = await get(p);
    record(`GET ${p} → 200`, res.status === 200, `got ${res.status}`);
  }
}

// ── 8. API sanitization on DB failure (no-500-leak) ──────────
async function apiErrorSanitizationTests() {
  console.log('\n== DB-BACKED API ERROR SANITIZATION (sandbox has no DB) ==');
  const apis = ['/api/website/homepage', '/api/universities?limit=5', '/api/metrics'];
  for (const api of apis) {
    const res = await get(api);
    const sanitized = !/PrismaClient|stack trace|at Object\.|mysql:\/\/user:pass/i.test(res.body);
    record(`${api} failure sanitized (no internals leaked)`, sanitized, `status ${res.status}`);
    record(`${api} returns JSON`, res.body.trim().startsWith('{') || res.body.trim().startsWith('['), '');
  }
}

// ── run all ──────────────────────────────────────────────────
(async () => {
  console.log(`Acceptance HTTP tests against ${BASE}`);
  await healthTests();
  await publicRouteTests();
  await portalRouteTests();
  await apiAuthTests();
  await authSanitizationTests();
  await securityHeaderTests();
  await assetTests();
  await apiErrorSanitizationTests();

  console.log('\n============================================');
  console.log(`RESULT: ${pass} passed, ${fail} failed, ${blocked} blocked`);
  if (failures.length) {
    console.log('FAILURES:');
    for (const f of failures) console.log('  - ' + f);
    process.exit(1);
  }
})();
