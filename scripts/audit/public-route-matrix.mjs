#!/usr/bin/env node
// Public route verification matrix.
//
// Probes the routes an anonymous visitor can reach and records what the
// server actually returned: status, redirect target, SEO basics, the English
// exam CTA, and whether any page or API body leaks internal detail. Run it
// against a local build, a preview, or production:
//
//   node scripts/audit/public-route-matrix.mjs --base http://127.0.0.1:3000
//   node scripts/audit/public-route-matrix.mjs --base https://aloeducation.com --out report.md
//
// Exit code is 1 when any check FAILs, so CI or an operator can gate on it.
// The script never sends credentials and never follows redirects, so every
// redirect is recorded as observed.

import { writeFileSync } from 'node:fs';

export const ENGLISH_EXAM_URL = 'https://english.aloeducation.com';

// Routes an anonymous visitor must reach without a login redirect.
export const PUBLIC_PAGES = [
  '/',
  '/about',
  '/contact',
  '/destinations',
  '/destinations/uk',
  '/destinations/canada',
  '/universities',
  '/courses',
  '/course-finder',
  '/services',
  '/scholarships',
  '/resources',
  '/blog',
  '/success-stories',
  '/team',
  '/faqs',
  '/book-consultation',
  '/language-prep',
  '/language-prep/ielts',
  '/language-prep/pte-academic',
  '/language-prep/comparison',
  '/english-test-prep',
  '/english-test-prep/ielts',
  '/eligibility-check',
  '/visa-support',
  '/application-process',
  '/admission-requirements',
  '/events',
  '/news',
  '/privacy-policy',
  '/terms',
  '/cookies',
  '/communication-policy',
  '/lead-data-usage-policy',
  '/user-guide',
  '/accessibility',
  '/offline',
  '/student/login',
  '/student/register',
  '/partner/login',
  '/employee/login',
  '/login',
  '/register',
  '/forgot-password',
];

// Legacy or retired URLs that must redirect permanently to a canonical page.
export const EXPECTED_REDIRECTS = [
  { path: '/english-tests', status: [308, 307], locationEndsWith: '/english-test-prep' },
  { path: '/eligibility-checker', status: [308, 307], locationEndsWith: '/eligibility-check' },
];

// Portal routes must NOT render for anonymous visitors. They must redirect to login.
export const PROTECTED_PAGES = [
  '/student/dashboard',
  '/student/mock-tests',
  '/crm/dashboard',
  '/admin/dashboard',
];

export const API_GET_CHECKS = ['/api/health', '/api/health/live', '/api/countries', '/api/language-prep/tests'];

// Strings that must never appear in a public response body.
export const LEAK_PATTERNS = [
  { name: 'database URL', re: /mysql:\/\/|postgres(ql)?:\/\/|DATABASE_URL/i },
  { name: 'raw Prisma error', re: /Prisma\w*Error|prisma\.io\/docs/ },
  { name: 'stack trace', re: /\n\s+at\s+\S+\s+\(|Error: .*\n\s+at /i },
  { name: 'internal path', re: /\/home\/user\/|\/var\/www\/|C:\\\\Users\\\\/i },
  { name: 'localhost reference', re: /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i },
];

// Placeholder or developer copy that must not reach visitors on public pages.
export const DEV_COPY_PATTERNS = [
  { name: 'disabled placeholder control', re: /Not yet wired/ },
  { name: 'coming-soon placeholder', re: /Coming [Ss]oon/ },
  { name: 'spec copy', re: /DB-driven|Creates TestSession|Premium 10x|Route: \/student|Part of single connected/ },
  { name: 'unhandled error UI', re: /Application error: a (client|server)-side exception|Internal Server Error/ },
];

function attr(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

/** Pure evaluation of one HTML page response. Returns { findings, facts }. */
export function evaluatePage({ path, status, location, contentType, body }) {
  const findings = [];
  const facts = {
    title: null,
    hasDescription: false,
    canonical: null,
    englishCtaLinks: 0,
    englishCtaNewTab: false,
  };
  if (status >= 300 && status < 400) {
    if (location && /\/login(\?|$|\/)/.test(location)) {
      findings.push({ level: 'FAIL', check: 'public page redirects to login', detail: location });
    } else {
      findings.push({ level: 'WARN', check: 'public page redirects', detail: `${status} -> ${location}` });
    }
    return { findings, facts };
  }
  if (status !== 200) {
    findings.push({ level: 'FAIL', check: 'HTTP status', detail: `expected 200, got ${status}` });
    return { findings, facts };
  }
  if (!contentType || !contentType.includes('text/html')) {
    findings.push({ level: 'FAIL', check: 'content type', detail: `expected text/html, got ${contentType}` });
    return { findings, facts };
  }
  facts.title = attr(body, /<title[^>]*>([^<]*)<\/title>/i);
  if (!facts.title || facts.title.trim().length === 0) {
    findings.push({ level: 'FAIL', check: 'page title', detail: 'missing or empty <title>' });
  }
  facts.hasDescription = /<meta[^>]+name="description"[^>]+content="[^"]+"/i.test(body) || /<meta[^>]+content="[^"]+"[^>]+name="description"/i.test(body);
  if (!facts.hasDescription) {
    findings.push({ level: 'WARN', check: 'meta description', detail: 'no meta description' });
  }
  facts.canonical = attr(body, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
  const ctaAnchors = body.match(/<a [^>]*href="https:\/\/english\.aloeducation\.com[^"]*"[^>]*>/g) || [];
  facts.englishCtaLinks = ctaAnchors.length;
  facts.englishCtaNewTab = ctaAnchors.some((a) => /target="_blank"/.test(a));
  if (facts.englishCtaNewTab) {
    findings.push({ level: 'FAIL', check: 'English exam CTA opens a new tab', detail: 'CTA must be same-tab by default' });
  }
  for (const leak of LEAK_PATTERNS) {
    if (leak.re.test(body)) findings.push({ level: 'FAIL', check: `leak: ${leak.name}`, detail: 'pattern found in HTML' });
  }
  for (const dev of DEV_COPY_PATTERNS) {
    if (dev.re.test(body)) findings.push({ level: 'FAIL', check: `visible ${dev.name}`, detail: 'developer or placeholder copy in HTML' });
  }
  return { findings, facts };
}

/** Pure evaluation of one API response. */
export function evaluateApi({ path, status, body }) {
  const findings = [];
  if (status >= 500 && status !== 503) {
    findings.push({ level: 'FAIL', check: 'server error', detail: `HTTP ${status}` });
  }
  for (const leak of LEAK_PATTERNS) {
    if (leak.re.test(body)) findings.push({ level: 'FAIL', check: `leak: ${leak.name}`, detail: 'pattern found in API body' });
  }
  return { findings };
}

/** Pure check of sitemap XML. */
export function evaluateSitemap(xml, baseUrl) {
  const findings = [];
  if (!xml.trimStart().startsWith('<?xml')) findings.push({ level: 'FAIL', check: 'sitemap XML declaration', detail: 'missing <?xml' });
  if (!/<urlset[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(xml)) findings.push({ level: 'FAIL', check: 'sitemap namespace', detail: 'urlset namespace missing' });
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) findings.push({ level: 'FAIL', check: 'sitemap entries', detail: 'no <loc> entries' });
  const unique = new Set(locs);
  if (unique.size !== locs.length) findings.push({ level: 'FAIL', check: 'sitemap duplicates', detail: `${locs.length - unique.size} duplicate <loc>` });
  const offHost = locs.filter((u) => !u.startsWith(baseUrl));
  if (offHost.length) findings.push({ level: 'FAIL', check: 'sitemap host', detail: `${offHost.length} entries outside ${baseUrl}` });
  if (locs.some((u) => /\/english-tests$/.test(u))) findings.push({ level: 'FAIL', check: 'sitemap redirect target', detail: '/english-tests redirects and must not be listed' });
  return { findings, count: locs.length };
}

async function probe(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'alo-route-matrix/1.0' } });
    const body = await res.text();
    return {
      status: res.status,
      location: res.headers.get('location'),
      contentType: res.headers.get('content-type'),
      body,
    };
  } catch (error) {
    return { status: 0, location: null, contentType: null, body: '', error: String(error?.cause?.code || error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

function parseArgs(argv) {
  const out = { base: 'https://aloeducation.com', out: null, timeout: 20000, api: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--base') out.base = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--timeout') out.timeout = Number(argv[++i]);
    else if (a === '--no-api') out.api = false;
  }
  out.base = out.base.replace(/\/$/, '');
  return out;
}

function toMarkdown(report) {
  const lines = [];
  lines.push(`# Public route matrix — ${report.base}`);
  lines.push('');
  lines.push(`Run at ${report.startedAt} (UTC). Result: **${report.summary.result}** — ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail.`);
  lines.push('');
  lines.push('| Route | Status | Location | Title | Desc | English CTA links | Findings |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const r of report.pages) {
    const f = r.findings.map((x) => `${x.level}: ${x.check}`).join('; ') || 'PASS';
    lines.push(`| \`${r.path}\` | ${r.status || r.error || 0} | ${r.location ? r.location.replace(report.base, '') : ''} | ${(r.facts?.title || '').slice(0, 60).replace(/\|/g, '/')} | ${r.facts?.hasDescription ? 'yes' : 'no'} | ${r.facts?.englishCtaLinks ?? ''} | ${f} |`);
  }
  for (const r of report.redirects) lines.push(`| \`${r.path}\` (redirect) | ${r.status} | ${r.location ? r.location.replace(report.base, '') : ''} | | | | ${r.findings.map((x) => `${x.level}: ${x.check}`).join('; ') || 'PASS'} |`);
  for (const r of report.protected) lines.push(`| \`${r.path}\` (protected) | ${r.status} | ${r.location ? r.location.replace(report.base, '') : ''} | | | | ${r.findings.map((x) => `${x.level}: ${x.check}`).join('; ') || 'PASS'} |`);
  for (const r of report.apis) lines.push(`| \`${r.path}\` (API) | ${r.status} | | | | | ${r.findings.map((x) => `${x.level}: ${x.check}`).join('; ') || 'PASS'} |`);
  lines.push('');
  lines.push(`Sitemap: ${report.sitemap.status} — ${report.sitemap.findings.map((x) => `${x.level}: ${x.check}`).join('; ') || 'PASS'} (${report.sitemap.count} entries)`);
  lines.push(`Robots: ${report.robots.status} — ${report.robots.findings.map((x) => `${x.level}: ${x.check}`).join('; ') || 'PASS'}`);
  lines.push('');
  return lines.join('\n');
}

export async function runMatrix({ base, timeout = 20000, api = true }) {
  const startedAt = new Date().toISOString();
  const report = { base, startedAt, pages: [], redirects: [], protected: [], apis: [], sitemap: {}, robots: {}, summary: {} };

  for (const path of PUBLIC_PAGES) {
    const res = await probe(base + path, timeout);
    const ev = res.error ? { findings: [{ level: 'FAIL', check: 'network', detail: res.error }], facts: {} } : evaluatePage({ path, ...res });
    report.pages.push({ path, status: res.status, location: res.location, error: res.error, ...ev });
  }
  for (const exp of EXPECTED_REDIRECTS) {
    const res = await probe(base + exp.path, timeout);
    const findings = [];
    if (res.error) findings.push({ level: 'FAIL', check: 'network', detail: res.error });
    else {
      if (!exp.status.includes(res.status)) findings.push({ level: 'FAIL', check: 'redirect status', detail: `expected ${exp.status.join('/')}, got ${res.status}` });
      if (!res.location || !res.location.endsWith(exp.locationEndsWith)) findings.push({ level: 'FAIL', check: 'redirect target', detail: `expected …${exp.locationEndsWith}, got ${res.location}` });
    }
    report.redirects.push({ path: exp.path, status: res.status, location: res.location, findings });
  }
  for (const path of PROTECTED_PAGES) {
    const res = await probe(base + path, timeout);
    const findings = [];
    if (res.error) findings.push({ level: 'FAIL', check: 'network', detail: res.error });
    else if (res.status >= 300 && res.status < 400 && res.location && /\/login/.test(res.location)) {
      findings.push({ level: 'PASS', check: 'redirected to login', detail: '' });
    } else if (res.status === 200) {
      findings.push({ level: 'FAIL', check: 'protected page served to anonymous visitor', detail: path });
    } else {
      findings.push({ level: 'WARN', check: 'unexpected status', detail: String(res.status) });
    }
    report.protected.push({ path, status: res.status, location: res.location, findings });
  }
  if (api) {
    for (const path of API_GET_CHECKS) {
      const res = await probe(base + path, timeout);
      const ev = res.error ? { findings: [{ level: 'FAIL', check: 'network', detail: res.error }] } : evaluateApi({ path, status: res.status, body: res.body });
      report.apis.push({ path, status: res.status, ...ev });
    }
  }
  const sm = await probe(`${base}/sitemap.xml`, timeout);
  if (sm.error) report.sitemap = { status: 0, count: 0, findings: [{ level: 'FAIL', check: 'network', detail: sm.error }] };
  else {
    const ev = sm.status === 200 ? evaluateSitemap(sm.body, base) : { findings: [{ level: 'FAIL', check: 'sitemap status', detail: String(sm.status) }], count: 0 };
    report.sitemap = { status: sm.status, ...ev };
  }
  const rb = await probe(`${base}/robots.txt`, timeout);
  const rbFindings = [];
  if (rb.error) rbFindings.push({ level: 'FAIL', check: 'network', detail: rb.error });
  else {
    if (rb.status !== 200) rbFindings.push({ level: 'FAIL', check: 'robots status', detail: String(rb.status) });
    if (!/Sitemap:\s*\S+sitemap\.xml/i.test(rb.body)) rbFindings.push({ level: 'FAIL', check: 'robots sitemap line', detail: 'missing Sitemap: line' });
    if (/^Disallow:\s*\/?$/m.test(rb.body)) rbFindings.push({ level: 'FAIL', check: 'robots blocks site', detail: 'Disallow: /' });
  }
  report.robots = { status: rb.status, findings: rbFindings };

  const all = [
    ...report.pages.flatMap((r) => r.findings),
    ...report.redirects.flatMap((r) => r.findings),
    ...report.protected.flatMap((r) => r.findings),
    ...report.apis.flatMap((r) => r.findings),
    ...report.sitemap.findings,
    ...report.robots.findings,
  ];
  const fail = all.filter((f) => f.level === 'FAIL').length;
  const warn = all.filter((f) => f.level === 'WARN').length;
  const pass = all.filter((f) => f.level === 'PASS').length;
  report.summary = { result: fail ? 'FAIL' : 'PASS', pass, warn, fail };
  return report;
}

async function main() {
  const opts = parseArgs(process.argv);
  const report = await runMatrix(opts);
  const md = toMarkdown(report);
  if (opts.out) {
    writeFileSync(opts.out, md);
    writeFileSync(opts.out.replace(/\.md$/, '.json'), JSON.stringify(report, null, 2));
  }
  process.stdout.write(md + '\n');
  process.exit(report.summary.fail ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`public-route-matrix failed: ${error?.message || error}\n`);
    process.exit(2);
  });
}
