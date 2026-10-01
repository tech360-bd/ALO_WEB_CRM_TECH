// ============================================================
// INTERACTION INVENTORY GENERATOR
// Produces machine-readable inventories of every interactive
// control and link in the application surface:
//
//   BUTTON-INVENTORY.csv — <button>/<Button> controls + form
//     submits with handler analysis and classification
//   LINK-INVENTORY.csv   — internal/external links with
//     route-existence verification against the App Router tree
//
// Static analysis is explicit about what it can prove: handler
// presence, form/Link context, API dependency extraction, route
// existence. Runtime behaviour is verified separately by the
// HTTP acceptance suite and Playwright E2E.
// Usage: node scripts/generate-interaction-inventory.mjs
// ============================================================
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(entry)) out.push(p);
  }
  return out;
}
const files = walk(SRC);

// ── page route inventory (for link verification) ─────────────
function pageRoutes(dir, base = '') {
  const routes = new Set();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const r of pageRoutes(p, `${base}/${entry.name}`)) routes.add(r);
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      const route = base === '' ? '/' : base;
      routes.add(route);
    }
  }
  return routes;
}
const routes = pageRoutes(join(SRC, 'app'));
const dynamicSegments = [...routes].filter((r) => r.includes('['));

function routeMatches(pathname) {
  if (routes.has(pathname)) return 'exact';
  for (const dyn of dynamicSegments) {
    const pattern = dyn.replace(/\[[^\]]+\]/g, '[^/]+');
    if (new RegExp(`^${pattern}$`).test(pathname)) return 'dynamic';
  }
  return null;
}

// known rewrite/redirect aliases (next.config.ts)
const nextConfig = readFileSync(join(ROOT, 'next.config.ts'), 'utf8');
const aliases = new Set();
for (const m of nextConfig.matchAll(/source:\s*"([^"]+)"/g)) {
  const s = m[1];
  if (!s.includes(':') && s.startsWith('/')) aliases.add(s.split('?')[0]);
}

// ── button inventory ─────────────────────────────────────────
const buttonRows = [];
const BUTTON_RE = /<(button|Button)\b([^>]*)>([\s\S]*?)<\/\1>/g;
const SELF_BUTTON_RE = /<(button|Button)\b([^>]*)\/>/g;

function labelOf(inner) {
  const text = inner
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 80);
}

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  const isPage = /src[\\/]app[\\/].*page\.tsx$/.test(file);
  const routeHint = rel.match(/src[\\/]app[\\/](.*)[\\/]page\.tsx$/)?.[1]?.replace(/\\/g, '/') ?? '';

  for (const m of src.matchAll(BUTTON_RE)) {
    const attrs = m[2];
    const inner = m[3];
    const onClick = /(?:onClick|onMouseDown|onPointerDown|onPointerUp|onDoubleClick|onTouchStart)\s*=\s*\{/.test(attrs);
    const disabled = /(?:^|\s)disabled(?=[\s=}>/]|$)/.test(' ' + attrs);
    const typeSubmit = /type\s*=\s*"submit"/.test(attrs);
    // context: inside a <form> (default submit) or wrapped in a <Link>?
    const before = src.slice(0, m.index);
    const inForm = before.lastIndexOf('<form') > before.lastIndexOf('</form>');
    const seg = before.slice(-600);
    const linkWrapped = seg.includes('<Link') && !seg.split('<Link').pop().includes('</Link>');
    // nearest fetch/router target in the 500 chars after the button
    const after = src.slice(m.index + m[0].length, m.index + m[0].length + 500);
    const api = after.match(/["'`]\/api\/[a-z0-9\-_/.[\]]+/i)?.[0] ?? '';
    const router = after.match(/router\.(push|replace)\(\s*["'`]([^"'`]+)/)?.[2] ?? '';
    const href = after.match(/href\s*=\s*\{?["'`]([^"'`]+)/)?.[1] ?? '';
    const innerHref = inner.match(/href\s*=\s*\{?["'`]([^"'`]+)/)?.[1] ?? '';
    const innerDynHref = /href\s*=\s*\{\s*[A-Za-z_$][\w$.]*/.test(inner) ? '(dynamic)' : '';

    let classification;
    if (onClick || typeSubmit) classification = 'WORKING (handler/submit present)';
    else if (disabled) classification = 'INTENTIONALLY DISABLED';
    else if (inForm) classification = 'WORKING (form submit)';
    else if (linkWrapped || href || router || innerHref || innerDynHref) classification = 'WORKING (navigation)';
    else classification = 'BROKEN (no handler, no form, no navigation)';

    buttonRows.push({
      file: rel,
      route: isPage ? `/${routeHint}` : '',
      label: labelOf(inner) || '(icon-only)',
      handler: onClick ? 'onClick' : typeSubmit ? 'submit' : '',
      disabled: disabled ? 'yes' : '',
      api_dependency: api,
      navigation: router || href || innerHref || innerDynHref,
      classification,
    });
  }
  for (const m of src.matchAll(SELF_BUTTON_RE)) {
    buttonRows.push({
      file: rel, route: isPage ? `/${routeHint}` : '',
      label: '(self-closing)', handler: '', disabled: /disabled/.test(m[2]) ? 'yes' : '',
      api_dependency: '', navigation: '', classification: file.includes(join('src','components','ui')) ? 'WORKING (ui primitive — props-driven at call site)' : 'SUSPECT (props-driven — verify parent)',
    });
  }
}

// ── link inventory ───────────────────────────────────────────
const linkRows = [];
const LINK_RE = /href\s*=\s*["']([^"']+)["']/g;
const PUSH_RE = /(?:router\.(?:push|replace)|redirect)\(\s*["'`]([^"'`]+)["'`]/g;

function classifyLink(href) {
  if (/^mailto:/i.test(href)) return 'email';
  if (/^tel:/i.test(href)) return 'telephone';
  if (/^https?:\/\//i.test(href)) return 'external';
  if (/^#/.test(href)) return 'anchor';
  return 'internal';
}

function addLink(href, source, file) {
  const kind = classifyLink(href);
  let status = '';
  if (kind === 'internal') {
    const pathname = href.split('?')[0].split('#')[0] || '/';
    const match = routeMatches(pathname);
    if (match) status = `route-${match}`;
    else if (aliases.has(pathname)) status = 'rewrite-alias';
    else if (pathname.startsWith('/api/')) status = 'api-route';
    else if (/\[[^\]]+\]/.test(pathname) || href.includes('${')) status = 'dynamic-template';
    else status = 'MISSING-ROUTE';
  }
  linkRows.push({ href, kind, source, file: relative(ROOT, file), status });
}

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(LINK_RE)) addLink(m[1], 'href', file);
  for (const m of src.matchAll(PUSH_RE)) addLink(m[1], 'router', file);
}

// ── write CSVs ───────────────────────────────────────────────
function toCsv(rows, fields) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [fields.join(',')];
  for (const r of rows) lines.push(fields.map((f) => esc(r[f])).join(','));
  return lines.join('\n');
}

writeFileSync(join(ROOT, 'BUTTON-INVENTORY.csv'), toCsv(buttonRows, ['file', 'route', 'label', 'handler', 'disabled', 'api_dependency', 'navigation', 'classification']));
writeFileSync(join(ROOT, 'LINK-INVENTORY.csv'), toCsv(linkRows, ['href', 'kind', 'source', 'file', 'status']));

// ── summary ──────────────────────────────────────────────────
const broken = buttonRows.filter((r) => r.classification.startsWith('BROKEN'));
const missingRoutes = [...new Set(linkRows.filter((r) => r.status === 'MISSING-ROUTE').map((r) => r.href))];
console.log(`buttons: ${buttonRows.length} (BROKEN no-op: ${broken.length})`);
console.log(`links: ${linkRows.length} unique hrefs: ${new Set(linkRows.map((r) => r.href)).size}`);
console.log(`internal links with MISSING-ROUTE status: ${missingRoutes.length}`);
for (const p of missingRoutes.slice(0, 25)) console.log('  -', p);

// broken-by-file summary for triage
const byFile = {};
for (const b of broken) byFile[b.file] = (byFile[b.file] || 0) + 1;
const top = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log('broken by file (top):');
for (const [f, n] of top) console.log(`  ${String(n).padStart(3)}  ${f}`);
