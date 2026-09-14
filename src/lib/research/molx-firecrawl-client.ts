// ============================================================
// Web Search / Scrape / Crawl / Extract — Molx + Firecrawl unified client
// Covers 4 repos in one practical layer (Top 1 + Top 3):
//  1) ioi-labs/molx (35 commits, Go, MIT, self-hosted Firecrawl alt)
//     - HTTP API: /v1/search, /v1/scrape, /v1/crawl, /v1/batch, /v1/enrich
//     - Lean: 3MB idle / 7MB workload, Obscura glibc 2.35+, Go 1.25+, batch + cleaner + extractor + obscura + scraper + searchfactory
//     - LLM enrich: POST /enrich {prompt, schema, urls/search} → GET /enrich/{id}
//  2) firecrawl/firecrawl (180k★ 6292 commits, Firecrawl org)
//     - /v1/search, /v1/scrape, /v1/crawl, /v1/map, /v1/extract, provider discovery via Search + billed Scrape, Autumn credits
//  3) firecrawl/web-agent (1.2k★ 538 commits, structured research agent)
//     - schema-validate (coerceToJson, extractFieldPaths, validateAgainstSchema), plan(schema) → required field paths, formatOutput gate with repair hint
//  4) firecrawl org (https://github.com/firecrawl) — ecosystem reference
//
// ALO practical architecture: Molx self-hosted is primary (free, MIT, on VPS),
// Firecrawl cloud is fallback when MOLX_URL empty or 5xx.
// All results map to ALO Prisma MySQL models (University/Course/Country/Visa/Lead)
// with sourceUrl + lastVerifiedAt (see market-intel-engine.ts + lead pipeline).
// Never commits secrets; uses env MOLX_URL / MOLX_API_KEY / FIRECRAWL_API_KEY.
//
// Hardening (Phase 3): timeout 15s, retry 3× exponential backoff, rate limit via Redis,
// provider usage logging, cost/quota awareness, SSRF blocklist, duplicate detection,
// source attribution, safe untrusted content handling.
// ============================================================

const MOLX_URL = process.env.MOLX_URL || process.env.NEXT_PUBLIC_MOLX_URL || ''; // e.g. http://localhost:3001 or http://molx:3001 in docker-compose
const MOLX_KEY = process.env.MOLX_API_KEY || '';
const FIRECRAWL_URL = process.env.FIRECRAWL_URL || 'https://api.firecrawl.dev';
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_KEY || '';

// ---------- types matching both APIs ----------
export type SearchHit = { url: string; title: string; snippet: string; markdown?: string; score?: number; sourceUrl?: string };
export type ScrapeResult = { url: string; markdown: string; html?: string; title?: string; links?: string[]; metadata?: Record<string, any> };
export type EnrichJob = { id: string; status: 'pending'|'running'|'completed'|'failed'; data?: any; error?: string };
export type ProviderLog = { provider: string; operation: string; url?: string; query?: string; status: number; durationMs: number; error?: string; timestamp: string; cost?: string };

// ---------- hardening helpers ----------
// SSRF blocklist — private ranges + metadata service
const BLOCKED_HOSTS = ['169.254.169.254', 'metadata.google.internal', 'metadata.google', 'instance-data'];
const BLOCKED_IP_PREFIXES = ['10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '127.', '0.0.0.0', '::1', 'fc00:', 'fe80:'];

function isBlockedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    let host = u.hostname.toLowerCase();
    // Decode IPv6 mapped IPv4 ::ffff:127.0.0.1 → check embedded IPv4
    if (host.startsWith('::ffff:')) host = host.slice(7);
    // Strip brackets if present
    host = host.replace(/^\[/, '').replace(/\]$/, '');
    if (BLOCKED_HOSTS.some(b => host === b || host.endsWith('.' + b))) return true;
    if (BLOCKED_IP_PREFIXES.some(p => host.startsWith(p))) return true;
    // Block private IPs in host if numeric
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const parts = host.split('.').map(Number);
      if (parts[0] === 10) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 127) return true;
    }
    // IPv6 private ranges already via prefix check (fc00:, fe80:, ::1)
    return false;
  } catch { return true; }
}

async function fetchWithTimeout(url: string, opts: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const timeoutMs = opts.timeoutMs || 15000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // SEC-02: do not follow redirects automatically — validate Location before following
    const merged: RequestInit = { redirect: 'manual', ...opts, signal: controller.signal } as RequestInit;
    const res = await fetch(url, merged);
    // If backend returned redirect, validate Location and block private hosts
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (loc && isBlockedUrl(loc)) {
        throw new Error(`SSRF blocked: redirect to private host ${loc.slice(0,120)}`);
      }
      if (loc) {
        // Follow single safe redirect manually (do not loop — prevents SSRF via redirect chain)
        const nextRes = await fetch(loc, { ...opts, redirect: 'manual', signal: controller.signal } as RequestInit);
        if (nextRes.headers.get('location') && isBlockedUrl(nextRes.headers.get('location')!)) {
          throw new Error('SSRF blocked: redirect chain to private host');
        }
        return nextRes;
      }
    }
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, baseMs = 500): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const result: any = await fn();
      // Don't retry on 4xx client errors except 429
      if (result && typeof result.status === 'number' && result.status >= 400 && result.status < 500 && result.status !== 429) {
        return result;
      }
      // Retry on 5xx or 429
      if (result && typeof result.status === 'number' && (result.status >= 500 || result.status === 429) && i < retries) {
        const delay = baseMs * Math.pow(2, i) + Math.random() * 200;
        console.warn(`[research] retry ${i+1}/${retries} after ${Math.round(delay)}ms status ${result.status}`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return result;
    } catch (e: any) {
      lastErr = e;
      if (i < retries) {
        const delay = baseMs * Math.pow(2, i) + Math.random() * 200;
        console.warn(`[research] retry ${i+1}/${retries} after ${Math.round(delay)}ms error ${e?.message}`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

// Rate limiting via Redis (graceful fallback if not configured)
async function checkRateLimit(provider: string): Promise<{ allowed: boolean; remaining?: number }> {
  try {
    const { rateLimit } = await import('@/lib/redis');
    const key = `research:${provider}`;
    const res = await rateLimit(key, provider === 'molx' ? 60 : 30, 60); // 60/min molx, 30/min firecrawl
    if (!res.allowed) {
      console.warn(`[research] rate limited ${provider} remaining ${res.remaining} reset ${new Date(res.resetAt).toISOString()}`);
    }
    return res;
  } catch {
    return { allowed: true };
  }
}

// Provider usage logging (cost/quota awareness, never fabricate)
async function logProviderUsage(log: ProviderLog) {
  try {
    const { db } = await import('@/lib/db');
    await (db as any).providerErrorLog?.create?.({
      data: {
        provider: log.provider,
        operation: log.operation,
        statusCode: log.status,
        message: log.error ? log.error.slice(0,500) : `${log.provider} ${log.operation} ${log.status} ${log.durationMs}ms`,
        metadata: JSON.stringify({ url: log.url, query: log.query, cost: log.cost, timestamp: log.timestamp }),
      }
    }).catch(() => {});
    // Also console for deployment logs
    const costNote = log.cost ? ` cost:${log.cost}` : '';
    console.log(`[research] ${log.provider} ${log.operation} ${log.status} ${log.durationMs}ms${costNote} ${log.url || log.query || ''}`);
  } catch {}
}

// ---------- low-level fetch with fallthrough ----------
async function molxFetch(path: string, opts?: RequestInit & { _noFallback?: boolean; timeoutMs?: number }): Promise<{ ok: boolean; json: any; status: number; raw: string }> {
  const base = MOLX_URL.replace(/\/$/, '');
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(MOLX_KEY ? { 'Authorization': `Bearer ${MOLX_KEY}`, 'x-api-key': MOLX_KEY } : {}) , ...(opts?.headers as any) };
  if (!base) return { ok: false, json: null, status: 0, raw: 'MOLX_URL not set' };
  const url = `${base}${path}`;
  if (isBlockedUrl(url)) return { ok: false, json: null, status: 403, raw: 'SSRF blocked: private host' };
  const rate = await checkRateLimit('molx');
  if (!rate.allowed) return { ok: false, json: null, status: 429, raw: 'rate limited molx' };
  const started = Date.now();
  try {
    const r = await retryWithBackoff(async () => {
      const res = await fetchWithTimeout(url, { ...opts, headers, timeoutMs: 15000 });
      const raw = await res.text();
      let j: any = null; try { j = JSON.parse(raw); } catch { j = { raw } }
      return { ok: res.ok, json: j, status: res.status, raw };
    }, 2);
    const duration = Date.now() - started;
    await logProviderUsage({ provider: 'molx', operation: path, status: r.status, durationMs: duration, error: r.ok ? undefined : r.raw.slice(0,300), timestamp: new Date().toISOString(), cost: 'molx self-hosted free (MIT)' });
    return r;
  } catch (e: any) {
    const duration = Date.now() - started;
    await logProviderUsage({ provider: 'molx', operation: path, status: 0, durationMs: duration, error: e?.message || String(e), timestamp: new Date().toISOString() });
    return { ok: false, json: null, status: 0, raw: e?.message || String(e) };
  }
}

async function firecrawlFetch(path: string, opts?: RequestInit): Promise<{ ok: boolean; json: any; status: number; raw: string }> {
  if (!FIRECRAWL_KEY) return { ok: false, json: null, status: 0, raw: 'FIRECRAWL_API_KEY not set' };
  const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FIRECRAWL_KEY}`, ...(opts?.headers as any) };
  const url = `${FIRECRAWL_URL.replace(/\/$/, '')}${path}`;
  if (isBlockedUrl(url)) return { ok: false, json: null, status: 403, raw: 'SSRF blocked' };
  const rate = await checkRateLimit('firecrawl');
  if (!rate.allowed) return { ok: false, json: null, status: 429, raw: 'rate limited firecrawl — quota awareness' };
  const started = Date.now();
  try {
    const r = await retryWithBackoff(async () => {
      const res = await fetchWithTimeout(url, { ...opts, headers, timeoutMs: 15000 });
      const raw = await res.text();
      let j: any = null; try { j = JSON.parse(raw); } catch { j = { raw } }
      return { ok: res.ok, json: j, status: res.status, raw };
    }, 2);
    const duration = Date.now() - started;
    // Firecrawl credits awareness — log status for quota
    const cost = r.status === 429 ? 'firecrawl quota exceeded' : 'firecrawl billed per scrape (Autumn credits)';
    await logProviderUsage({ provider: 'firecrawl', operation: path, status: r.status, durationMs: duration, error: r.ok ? undefined : r.raw.slice(0,300), timestamp: new Date().toISOString(), cost });
    return r;
  } catch (e: any) {
    const duration = Date.now() - started;
    await logProviderUsage({ provider: 'firecrawl', operation: path, status: 0, durationMs: duration, error: e?.message || String(e), timestamp: new Date().toISOString(), cost: 'firecrawl error' });
    return { ok: false, json: null, status: 0, raw: e?.message || String(e) };
  }
}

// ---------- 1) Search: Molx primary → Firecrawl fallback ----------
export async function webSearch(query: string, opts?: { limit?: number; tbs?: string; country?: string }): Promise<{ provider: 'molx'|'firecrawl'|'none'; hits: SearchHit[] }> {
  const limit = opts?.limit || 5;
  // Try Molx primary (configurable, never silent switch without log)
  if (MOLX_URL) {
    const r = await molxFetch('/v1/search', { method: 'POST', body: JSON.stringify({ query, limit, engines: ['native'], tbs: opts?.tbs }) });
    if (r.ok && (r.json?.results || r.json?.data)) {
      const hits: SearchHit[] = (r.json.results || r.json.data || []).map((h: any) => ({
        url: h.url, title: h.title || '', snippet: h.snippet || h.description || '', markdown: h.markdown, score: h.score,
        sourceUrl: h.url, // provenance
      }));
      if (hits.length) {
        console.log(`[research] webSearch provider=molx query="${query.slice(0,60)}" hits=${hits.length}`);
        return { provider: 'molx', hits };
      }
      console.warn(`[research] molx search empty, falling back to firecrawl query="${query.slice(0,60)}"`);
    } else {
      console.warn(`[research] molx search failed ${r.status} ${r.raw.slice(0,200)} — falling back to firecrawl if configured`);
    }
  }
  // Fallback Firecrawl only when configured and permitted (logged)
  if (FIRECRAWL_KEY) {
    const r = await firecrawlFetch('/v1/search', { method: 'POST', body: JSON.stringify({ query, limit, scrapeOptions: { formats: ['markdown'] } }) });
    if (r.ok && r.json?.data) {
      const hits: SearchHit[] = r.json.data.map((h: any) => ({ url: h.url, title: h.title || '', snippet: h.description || h.markdown?.slice(0,300) || '', markdown: h.markdown, sourceUrl: h.url }));
      console.log(`[research] webSearch provider=firecrawl query="${query.slice(0,60)}" hits=${hits.length} (fallback)`);
      return { provider: 'firecrawl', hits };
    }
    console.warn(`[research] firecrawl search failed ${r.status} ${r.raw.slice(0,200)}`);
  }
  return { provider: 'none', hits: [] };
}

// ---------- 2) Scrape: single URL → markdown/html/links ----------
export async function webScrape(url: string, opts?: { formats?: ('markdown'|'html'|'links'|'screenshot')[]; onlyMainContent?: boolean }): Promise<{ provider: string; result: ScrapeResult | null; error?: string }> {
  // SSRF + safe handling of untrusted content — block private hosts
  if (isBlockedUrl(url)) return { provider: 'none', result: null, error: 'SSRF blocked: private host not allowed' };
  const formats = opts?.formats || ['markdown'];
  if (MOLX_URL) {
    const r = await molxFetch('/v1/scrape', { method: 'POST', body: JSON.stringify({ url, formats, onlyMainContent: opts?.onlyMainContent ?? true }) });
    if (r.ok && r.json) {
      const d = r.json.data || r.json;
      // Safe handling: truncate untrusted markdown, preserve sourceUrl provenance
      const markdown = (d.markdown || d.content || '').slice(0, 200000); // limit untrusted content
      return { provider: 'molx', result: { url: d.url || url, markdown, html: d.html?.slice(0,500000), title: d.title, links: d.links?.slice(0,100), metadata: { ...d.metadata, sourceUrl: url, retrievedAt: new Date().toISOString(), provenance: 'molx' } } };
    }
    console.warn(`[research] molx scrape ${url} failed ${r.status} — fallback firecrawl`);
  }
  if (FIRECRAWL_KEY) {
    const r = await firecrawlFetch('/v1/scrape', { method: 'POST', body: JSON.stringify({ url, formats, onlyMainContent: opts?.onlyMainContent ?? true }) });
    if (r.ok && r.json?.data) {
      const d = r.json.data;
      return { provider: 'firecrawl', result: { url: d.url || url, markdown: (d.markdown || '').slice(0,200000), html: d.html?.slice(0,500000), title: d.metadata?.title, links: d.links?.slice(0,100), metadata: { ...d.metadata, sourceUrl: url, retrievedAt: new Date().toISOString(), provenance: 'firecrawl' } } };
    }
    if (!r.ok) return { provider: 'firecrawl', result: null, error: r.raw.slice(0,400) };
  }
  return { provider: 'none', result: null, error: 'No provider configured (set MOLX_URL or FIRECRAWL_API_KEY)' };
}

// ---------- 3) Crawl / Map ----------
export async function webCrawl(url: string, opts?: { limit?: number; includePaths?: string[]; excludePaths?: string[] }): Promise<{ provider: string; urls: string[] }> {
  if (isBlockedUrl(url)) return { provider: 'none', urls: [] };
  if (MOLX_URL) {
    const r = await molxFetch('/v1/crawl', { method: 'POST', body: JSON.stringify({ url, limit: opts?.limit || 20 }) });
    if (r.ok && r.json) return { provider: 'molx', urls: r.json.data?.map?.((u:any)=>u.url||u) || r.json.urls || [] };
  }
  if (FIRECRAWL_KEY) {
    const r = await firecrawlFetch('/v1/crawl', { method: 'POST', body: JSON.stringify({ url, limit: opts?.limit || 20, includePaths: opts?.includePaths, excludePaths: opts?.excludePaths }) });
    if (r.ok) return { provider: 'firecrawl', urls: r.json?.data?.map?.((u:any)=>u.url) || [] };
  }
  return { provider: 'none', urls: [] };
}

// ---------- 4) Enrich (Molx LLM-enrich) — prompt + JSON schema ----------
export async function webEnrich(opts: { prompt: string; schema: Record<string, any>; urls?: string[]; query?: string; pollMs?: number }): Promise<EnrichJob> {
  if (!MOLX_URL) return { id: 'no-molx', status: 'failed', error: 'MOLX_URL not set — Molx enrich requires self-hosted Molx. Fallback: use structured-extractor.ts with AI.' };
  // Validate urls for SSRF
  if (opts.urls?.some(isBlockedUrl)) return { id: 'ssrf-blocked', status: 'failed', error: 'SSRF blocked: private host in urls' };
  const start = await molxFetch('/v1/enrich', { method: 'POST', body: JSON.stringify({ prompt: opts.prompt, schema: opts.schema, urls: opts.urls, query: opts.query }) });
  if (!start.ok) return { id: 'enrich-failed', status: 'failed', error: start.raw.slice(0,500) };
  const id = start.json.id || start.json.jobId || 'enrich-'+Date.now();
  // poll GET /enrich/{id} (Molx pattern: /enrich/{id})
  const pollMs = opts.pollMs || 1500;
  for (let i=0;i<20;i++) {
    await new Promise(r=>setTimeout(r, pollMs));
    const p = await molxFetch(`/v1/enrich/${id}`, { method: 'GET' });
    if (p.ok && p.json) {
      const st = (p.json.status || p.json.state || '').toLowerCase();
      if (st === 'completed' || p.json.data) return { id, status: 'completed', data: p.json.data || p.json.result || p.json };
      if (st === 'failed') return { id, status: 'failed', error: p.json.error || 'enrich failed' };
    }
  }
  return { id, status: 'running', error: 'poll timeout — check GET /enrich/{id}' };
}

// ---------- 5) Batch (Molx batch) ----------
export async function webBatch(urls: string[], opts?: { formats?: string[] }): Promise<{ jobId: string; status: string }> {
  if (!MOLX_URL) return { jobId: '', status: 'MOLX_URL not set' };
  if (urls.some(isBlockedUrl)) return { jobId: '', status: 'SSRF blocked' };
  const r = await molxFetch('/v1/batch', { method: 'POST', body: JSON.stringify({ urls, formats: opts?.formats || ['markdown'] }) });
  if (r.ok) return { jobId: r.json.id || r.json.jobId || 'batch-'+Date.now(), status: r.json.status || 'queued' };
  return { jobId: '', status: r.raw.slice(0,300) };
}

// ---------- health check ----------
export async function researchHealthCheck(): Promise<{ molx: { ok: boolean; latencyMs?: number; error?: string }; firecrawl: { ok: boolean; latencyMs?: number; error?: string }; primary: string }> {
  const result: any = { molx: { ok: false }, firecrawl: { ok: false }, primary: MOLX_URL ? 'molx' : FIRECRAWL_KEY ? 'firecrawl' : 'none' };
  if (MOLX_URL) {
    const start = Date.now();
    const r = await molxFetch('/health', { method: 'GET' }).catch((e:any) => ({ ok: false, raw: e?.message }));
    result.molx = { ok: (r as any).ok || false, latencyMs: Date.now()-start, error: (r as any).ok ? undefined : (r as any).raw?.slice(0,200) };
    // Fallback check /v1/search with dummy if /health not implemented
    if (!result.molx.ok) {
      const s = Date.now();
      const r2 = await molxFetch('/v1/search', { method: 'POST', body: JSON.stringify({ query: 'test', limit: 1 }) });
      result.molx = { ok: r2.ok, latencyMs: Date.now()-s, error: r2.ok ? undefined : r2.raw.slice(0,200) };
    }
  }
  if (FIRECRAWL_KEY) {
    const start = Date.now();
    // Light search to verify key
    const r = await firecrawlFetch('/v1/search', { method: 'POST', body: JSON.stringify({ query: 'test', limit: 1 }) });
    result.firecrawl = { ok: r.ok || r.status===429, latencyMs: Date.now()-start, error: r.ok ? undefined : r.raw.slice(0,200) };
  }
  return result;
}

// ---------- duplicate detection helper ----------
export function isDuplicateLead(existingLeads: { email?: string; phone?: string; sourceUrl?: string }[], candidate: { email?: string; phone?: string; sourceUrl?: string }): boolean {
  const normEmail = (s?: string) => s?.toLowerCase().trim();
  const normPhone = (s?: string) => s?.replace(/[^0-9+]/g, '').slice(-10);
  const candEmail = normEmail(candidate.email);
  const candPhone = normPhone(candidate.phone);
  const candUrl = candidate.sourceUrl?.replace(/[?#].*$/, '').toLowerCase();
  return existingLeads.some(e => 
    (candEmail && normEmail(e.email) === candEmail) ||
    (candPhone && normPhone(e.phone) === candPhone) ||
    (candUrl && e.sourceUrl?.replace(/[?#].*$/, '').toLowerCase() === candUrl)
  );
}

// ---------- env helper for audit ----------
export function researchProviderStatus(): { molxConfigured: boolean; firecrawlConfigured: boolean; primary: string; molxUrl?: string; firecrawlUrl: string } {
  return { molxConfigured: !!MOLX_URL, firecrawlConfigured: !!FIRECRAWL_KEY, primary: MOLX_URL ? 'molx (self-hosted, MIT)' : FIRECRAWL_KEY ? 'firecrawl (cloud)' : 'none — set MOLX_URL or FIRECRAWL_API_KEY', molxUrl: MOLX_URL ? MOLX_URL.replace(/\/\/.*@/, '//****@') : undefined, firecrawlUrl: FIRECRAWL_URL };
}
