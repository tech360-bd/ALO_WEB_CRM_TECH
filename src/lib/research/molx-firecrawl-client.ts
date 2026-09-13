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
// ============================================================

const MOLX_URL = process.env.MOLX_URL || process.env.NEXT_PUBLIC_MOLX_URL || ''; // e.g. http://localhost:3001 or http://molx:3001 in docker-compose
const MOLX_KEY = process.env.MOLX_API_KEY || '';
const FIRECRAWL_URL = process.env.FIRECRAWL_URL || 'https://api.firecrawl.dev';
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_KEY || '';

// ---------- types matching both APIs ----------
export type SearchHit = { url: string; title: string; snippet: string; markdown?: string; score?: number; sourceUrl?: string };
export type ScrapeResult = { url: string; markdown: string; html?: string; title?: string; links?: string[]; metadata?: Record<string, any> };
export type EnrichJob = { id: string; status: 'pending'|'running'|'completed'|'failed'; data?: any; error?: string };

// ---------- low-level fetch with fallthrough ----------
async function molxFetch(path: string, opts?: RequestInit & { _noFallback?: boolean }): Promise<{ ok: boolean; json: any; status: number; raw: string }> {
  const base = MOLX_URL.replace(/\/$/, '');
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(MOLX_KEY ? { 'Authorization': `Bearer ${MOLX_KEY}`, 'x-api-key': MOLX_KEY } : {}) , ...(opts?.headers as any) };
  if (!base) return { ok: false, json: null, status: 0, raw: 'MOLX_URL not set' };
  try {
    const r = await fetch(`${base}${path}`, { ...opts, headers, signal: opts?.signal });
    const raw = await r.text();
    let j: any = null; try { j = JSON.parse(raw); } catch { j = { raw } }
    return { ok: r.ok, json: j, status: r.status, raw };
  } catch (e: any) {
    return { ok: false, json: null, status: 0, raw: e?.message || String(e) };
  }
}
async function firecrawlFetch(path: string, opts?: RequestInit): Promise<{ ok: boolean; json: any; status: number; raw: string }> {
  if (!FIRECRAWL_KEY) return { ok: false, json: null, status: 0, raw: 'FIRECRAWL_API_KEY not set' };
  const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FIRECRAWL_KEY}`, ...(opts?.headers as any) };
  try {
    const r = await fetch(`${FIRECRAWL_URL.replace(/\/$/, '')}${path}`, { ...opts, headers });
    const raw = await r.text();
    let j: any = null; try { j = JSON.parse(raw); } catch { j = { raw } }
    return { ok: r.ok, json: j, status: r.status, raw };
  } catch (e: any) {
    return { ok: false, json: null, status: 0, raw: e?.message || String(e) };
  }
}

// ---------- 1) Search: Molx primary → Firecrawl fallback ----------
export async function webSearch(query: string, opts?: { limit?: number; tbs?: string; country?: string }): Promise<{ provider: 'molx'|'firecrawl'|'none'; hits: SearchHit[] }> {
  const limit = opts?.limit || 5;
  // Try Molx
  if (MOLX_URL) {
    const r = await molxFetch('/v1/search', { method: 'POST', body: JSON.stringify({ query, limit, engines: ['native'], tbs: opts?.tbs }) });
    if (r.ok && (r.json?.results || r.json?.data)) {
      const hits: SearchHit[] = (r.json.results || r.json.data || []).map((h: any) => ({
        url: h.url, title: h.title || '', snippet: h.snippet || h.description || '', markdown: h.markdown, score: h.score,
      }));
      if (hits.length) return { provider: 'molx', hits };
    }
  }
  // Fallback Firecrawl
  if (FIRECRAWL_KEY) {
    const r = await firecrawlFetch('/v1/search', { method: 'POST', body: JSON.stringify({ query, limit, scrapeOptions: { formats: ['markdown'] } }) });
    if (r.ok && r.json?.data) {
      const hits: SearchHit[] = r.json.data.map((h: any) => ({ url: h.url, title: h.title || '', snippet: h.description || h.markdown?.slice(0,300) || '', markdown: h.markdown }));
      return { provider: 'firecrawl', hits };
    }
  }
  return { provider: 'none', hits: [] };
}

// ---------- 2) Scrape: single URL → markdown/html/links ----------
export async function webScrape(url: string, opts?: { formats?: ('markdown'|'html'|'links'|'screenshot')[]; onlyMainContent?: boolean }): Promise<{ provider: string; result: ScrapeResult | null; error?: string }> {
  const formats = opts?.formats || ['markdown'];
  if (MOLX_URL) {
    const r = await molxFetch('/v1/scrape', { method: 'POST', body: JSON.stringify({ url, formats, onlyMainContent: opts?.onlyMainContent ?? true }) });
    if (r.ok && r.json) {
      const d = r.json.data || r.json;
      return { provider: 'molx', result: { url: d.url || url, markdown: d.markdown || d.content || '', html: d.html, title: d.title, links: d.links, metadata: d.metadata } };
    }
  }
  if (FIRECRAWL_KEY) {
    const r = await firecrawlFetch('/v1/scrape', { method: 'POST', body: JSON.stringify({ url, formats, onlyMainContent: opts?.onlyMainContent ?? true }) });
    if (r.ok && r.json?.data) {
      const d = r.json.data;
      return { provider: 'firecrawl', result: { url: d.url || url, markdown: d.markdown || '', html: d.html, title: d.metadata?.title, links: d.links, metadata: d.metadata } };
    }
    if (!r.ok) return { provider: 'firecrawl', result: null, error: r.raw.slice(0,400) };
  }
  return { provider: 'none', result: null, error: 'No provider configured (set MOLX_URL or FIRECRAWL_API_KEY)' };
}

// ---------- 3) Crawl / Map ----------
export async function webCrawl(url: string, opts?: { limit?: number; includePaths?: string[]; excludePaths?: string[] }): Promise<{ provider: string; urls: string[] }> {
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
  const r = await molxFetch('/v1/batch', { method: 'POST', body: JSON.stringify({ urls, formats: opts?.formats || ['markdown'] }) });
  if (r.ok) return { jobId: r.json.id || r.json.jobId || 'batch-'+Date.now(), status: r.json.status || 'queued' };
  return { jobId: '', status: r.raw.slice(0,300) };
}

// ---------- env helper for audit ----------
export function researchProviderStatus(): { molxConfigured: boolean; firecrawlConfigured: boolean; primary: string } {
  return { molxConfigured: !!MOLX_URL, firecrawlConfigured: !!FIRECRAWL_KEY, primary: MOLX_URL ? 'molx (self-hosted, MIT)' : FIRECRAWL_KEY ? 'firecrawl (cloud)' : 'none — set MOLX_URL or FIRECRAWL_API_KEY' };
}
