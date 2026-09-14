// ============================================================
// Lead Enrichment / CRM Pipeline — n8n GTM + Open Enrich + OpenProspector + DAVE + Bricks
//  - n8n-gtm-lead-enrichment (parthasarathy123, 3 commits): Manual → Google Sheets → Apify Google Places
//    → normalize (website/email/phone/company/location) → contactability filter → deterministic dedup (identity key)
//    → data-quality scoring + confidence bands → Clay async callback (2h timeout) → Zoho duplicate search →
//    create/update/review/CRM-failure branches → Qualified Output only after Zoho confirms
//  - brightdata/open-enrich (11★ 73 commits, pnpm): enrich-core + CLI (npx), enrich tables (CSV → LLM enrichment)
//    via Bright Data, LangChain, enrich-core bundled CLI, ProgressRenderer, enriching-tables skill
//  - clawnify/OpenProspector (6★ 18 commits, Clay alt, no per-lead markup): Signals store
//    domain|type|source_url normalized uniqueness → upsert bump seen_count → freshness windows per type (from occurred_at, not detected_at)
//    → liveness derived on read (never stored) → stale never hidden → POST /api/signals/{id}/run 409 when stale
//  - workwithlos-ui/dave (14 commits, Python): URL→clean validated structured data, search_extract over DuckDuckGo
//    (pluggable BaseSearchProvider), local business leads via Apify Google Maps (compass/crawler-google-places), LeadsReport.to_csv
//  - BraaMohammed/bricks (63★ 79 commits, fully local Clay alt): AI agents + Puppeteer + TinyFish waterfall
//    (TinyFish search api.search.tinyfish.ai + reader api.fetch.tinyfish.ai → ScraperAPI → Diffbot → Puppeteer), CSV→BI
//
// ALO integration: Apify/Clay/Zoho → ALO Lead + AgentTask + n8n workflows (existing N8nWorkflow model)
//   Signals → CrmAuditLog + TimelineEvent; lead quality → lead-scoring-engine
//   Table enrichment → MarketingReport / UniversityDigitalTwin
// ============================================================
import { db } from '@/lib/db';
import { webSearch } from './molx-firecrawl-client';

// ---------- identity + dedup (n8n GTM deterministic key) ----------
function normalizePhone(phone: string): string {
  const d = phone.replace(/\D/g,'');
  return d.startsWith('880') ? `+${d}` : d.length>=11 ? `+${d}` : d;
}
function normalizeDomain(url?: string): string {
  if (!url) return '';
  try { return new URL(url.startsWith('http')?url:`https://${url}`).hostname.replace(/^www\./,'').toLowerCase(); } catch { return (url||'').toLowerCase().replace(/^www\./,''); }
}
export function leadIdentityKey(p: { email?: string; phone?: string; website?: string; company?: string }): string {
  const email = (p.email||'').toLowerCase().trim();
  if (email && email.includes('@')) return `email:${email}`;
  const phone = p.phone ? normalizePhone(p.phone) : '';
  if (phone) return `phone:${phone}`;
  const domain = normalizeDomain(p.website);
  if (domain && p.company) return `domain:${domain}|company:${p.company.toLowerCase().replace(/\s+/g,' ')}`;
  if (domain) return `domain:${domain}`;
  return `name:${(p.company||'').toLowerCase().trim()}`;
}

// ---------- data-quality scoring (n8n GTM confidence bands) ----------
export function scoreLeadQuality(lead: { email?: string; phone?: string; website?: string; company?: string; location?: string }): { score: number; band: 'HIGH'|'MEDIUM'|'LOW'|'REJECT'; reasons: string[] } {
  let score = 0; const reasons: string[] = [];
  if (lead.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) { score+=30; reasons.push('valid email'); }
  else if (lead.email) { reasons.push('invalid email'); }
  if (lead.phone) { const p = normalizePhone(lead.phone); if (p.length>=12) { score+=30; reasons.push('usable phone'); } }
  else reasons.push('no phone');
  if (lead.website) { score+=20; reasons.push('has website'); }
  if (lead.company && lead.company.length>2) { score+=10; reasons.push('company present'); }
  if (lead.location) { score+=10; reasons.push('location'); }
  const contactable = !!(lead.email || lead.phone);
  if (!contactable) { score = Math.min(score, 15); reasons.push('not contactable → caps at 15'); }
  let band: 'HIGH'|'MEDIUM'|'LOW'|'REJECT' = 'REJECT';
  if (score>=70) band='HIGH'; else if (score>=45) band='MEDIUM'; else if (score>=25) band='LOW'; else band='REJECT';
  return { score, band, reasons };
}

// ---------- Apify Google Maps → ALO (DAVE pattern) ----------
export type ApifyLead = { company: string; website?: string; phone?: string; email?: string; location?: string; rating?: number; reviewCount?: number; mapsUrl?: string; source: 'apify' };
export async function fetchApifyLeads(opts: { city: string; keyword: string; maxLeads?: number }): Promise<{ leads: ApifyLead[]; costNote: string }> {
  const apifyToken = process.env.APIFY_TOKEN || '';
  const actor = process.env.APIFY_ACTOR || 'compass/crawler-google-places';
  if (!apifyToken) {
    // Fallback: emulate via web search (DAVE local-business search → DuckDuckGo + per-hit extract)
    const q = `${opts.keyword} in ${opts.city} site:google.com/maps OR site:facebook.com OR phone`;
    const hits = await webSearch(q, { limit: opts.maxLeads || 5 });
    const leads: ApifyLead[] = hits.hits.map(h=>({ company: h.title.slice(0,60) || 'Unknown', website: h.url, location: opts.city, source:'apify' as const }));
    return { leads, costNote: 'APIFY_TOKEN not set — used webSearch fallback (no Apify cost)' };
  }
  // Real Apify run
  const body = { searchStringsArray: [`${opts.keyword} ${opts.city}`], maxCrawledPlacesPerSearch: opts.maxLeads || 20 };
  const r = await fetch(`https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?token=${apifyToken}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const items: any[] = await r.json().catch(()=>[]) as any;
  const leads: ApifyLead[] = (Array.isArray(items)?items:[]).map((it:any)=>({
    company: it.title || it.name || '', website: it.website || it.url, phone: it.phone || it.phoneUnformatted, location: it.address || it.city || opts.city,
    rating: it.totalScore, reviewCount: it.reviewsCount, mapsUrl: it.url, source:'apify' as const,
  })).filter(l=> l.company);
  return { leads, costNote: `Apify ${actor} run-sync (billed)` };
}

// ---------- Signals store (OpenProspector: domain|type|source_url, seen_count, freshness window) ----------
// Freshness per type counted from occurred_at (not detected_at). Liveness derived on read.
const FRESHNESS_WINDOW_DAYS: Record<string, number> = {
  JOB_POSTING: 30, NEW_PROGRAM: 60, FEE_CHANGE: 14, DEADLINE_CHANGE: 14, POLICY_CHANGE: 90, SCHOLARSHIP_OPEN: 30, RANKING_UPDATE: 30,
};
function normalizeSignalKey(s: { domain: string; type: string; sourceUrl: string }): string {
  const d = s.domain.toLowerCase().replace(/^www\./,'').trim();
  const u = s.sourceUrl.replace(/[?#].*$/,'').replace(/^https?:\/\//,'').toLowerCase().trim();
  return `${d}|${s.type}|${u}`;
}
export async function upsertSignal(opts: { domain: string; type: string; sourceUrl: string; occurredAt: string; title?: string; metadata?: any; actorId?: string }): Promise<{ key: string; seenCount: number; isNew: boolean }> {
  const key = normalizeSignalKey(opts);
  const windowsDays = FRESHNESS_WINDOW_DAYS[opts.type] || 30;
  // dedupe via CrmAuditLog (signals table in OpenProspector → adapted to CrmAuditLog TimelineEvent)
  const existing: any = await db.crmAuditLog.findFirst({ where:{ entityType:'Signal', entityId: key }}).catch(()=>null);
  if (existing) {
    try {
      const prev = JSON.parse(existing.details);
      const seenCount = (prev.seenCount||1)+1;
      await db.crmAuditLog.update({ where:{ id: existing.id }, data:{ details: JSON.stringify({ ...prev, seenCount, lastSeenAt: new Date().toISOString(), title: opts.title || prev.title }) } as any }).catch(()=>{});
      return { key, seenCount, isNew: false };
    } catch {}
  }
  await db.crmAuditLog.create({ data:{ action:'SIGNAL_UPSERT', entityType:'Signal', entityId: key, actorId: opts.actorId||'openprospector', details: JSON.stringify({ domain: opts.domain, type: opts.type, sourceUrl: opts.sourceUrl, occurredAt: opts.occurredAt, detectedAt: new Date().toISOString(), title: opts.title, freshnessWindowDays: windowsDays, seenCount:1, metadata: opts.metadata }), createdAt: new Date() } as any }).catch(()=>{});
  await db.timelineEvent.create({ data:{ studentId: 'system', type:'SIGNAL_DETECTED', title: opts.title || `${opts.type} @ ${opts.domain}`, description: JSON.stringify({ key, occurredAt: opts.occurredAt, sourceUrl: opts.sourceUrl }), createdAt: new Date() } as any }).catch(()=>{});
  return { key, seenCount:1, isNew:true };
}
export async function listSignals(opts?: { liveOnly?: boolean }): Promise<{ key:string; domain:string; type:string; sourceUrl:string; seenCount:number; live: boolean; staleReason?: string }[]> {
  const logs: any[] = await db.crmAuditLog.findMany({ where:{ entityType:'Signal' }, orderBy:{ createdAt:'desc' }, take:200 }).catch(()=>[]);
  const now = Date.now();
  const rows = logs.map((l:any)=> {
    try {
      const j = JSON.parse(l.details);
      const occurredMs = new Date(j.occurredAt).getTime();
      const windowMs = (j.freshnessWindowDays||30)*86400000;
      const live = !isNaN(occurredMs) && (now - occurredMs) <= windowMs;
      return { key: l.entityId, domain:j.domain, type:j.type, sourceUrl:j.sourceUrl, seenCount:j.seenCount||1, live, staleReason: live?undefined:`outside ${j.freshnessWindowDays}d window` };
    } catch { return null }
  }).filter(Boolean) as any[];
  if (opts?.liveOnly) return rows.filter(r=>r.live);
  return rows;
}
export async function runSignal(key: string, actorId?: string): Promise<{ ok: boolean; status: number; message: string }> {
  const log: any = await db.crmAuditLog.findFirst({ where:{ entityType:'Signal', entityId:key }}).catch(()=>null);
  if (!log) return { ok:false, status:404, message:'signal not found' };
  try {
    const j = JSON.parse(log.details);
    const occurredMs = new Date(j.occurredAt).getTime();
    if (isNaN(occurredMs)) return { ok:false, status:409, message:'undateable signal — not live' };
    const live = (Date.now()-occurredMs) <= (j.freshnessWindowDays*86400000);
    if (!live) return { ok:false, status:409, message:`stale — occurred ${j.occurredAt}, window ${j.freshnessWindowDays}d` };
    await db.crmAuditLog.create({ data:{ action:'SIGNAL_SOURCED', entityType:'Signal', entityId: key, actorId: actorId||'pipeline', details: JSON.stringify({ sourcedAt: new Date().toISOString() }), createdAt: new Date() } as any }).catch(()=>{});
    return { ok:true, status:200, message:`sourced ${j.type} @ ${j.domain}` };
  } catch { return { ok:false, status:500, message:'parse error' }; }
}

// ---------- Table enrichment (Open Enrich: CSV row → LLM enrich, Bricks: CSV → BI) ----------
export async function enrichTableRow(row: Record<string,string>, instruction: string, schema?: Record<string,any>): Promise<Record<string,any>> {
  // Use Open Enrich style: row JSON + instruction → LLM
  const brightdataKey = process.env.BRIGHTDATA_API_KEY || '';
  // Primary: ALO AI (Groq/OpenRouter) — no extra deps
  try {
    const mod: any = await import('@/lib/ai');
    if (mod.generateText) {
      const sys = `You are an enrichment engine. Given a CSV row, apply the instruction and return JSON ${schema? `(matching schema ${JSON.stringify(schema)})` : ''}. No preamble.`;
      const r = await mod.generateText({ prompt: `Row: ${JSON.stringify(row)}\nInstruction: ${instruction}`, systemPrompt: sys, temperature:0.2 });
      const start = r.text.indexOf('{'); const end = r.text.lastIndexOf('}');
      if (start>=0) try { return JSON.parse(r.text.slice(start,end+1)); } catch {}
      return { _raw: r.text };
    }
  } catch {}
  // Bright Data fallback would use enrich-core HTTP when BRIGHTDATA_API_KEY set
  if (brightdataKey) {
    // placeholder for Bright Data dataset enrichment call
  }
  return { _error: 'AI not configured' };
}

// ---------- end-to-end: Sheets/CSV enqueue → normalize → dedup → enrich → Zoho-like ALO CRM branch ----------
export async function runGtmPipeline(opts: { rows: Record<string,string>[]; enrichInstruction?: string; actorId?: string }): Promise<{ qualified: any[]; review: any[]; rejected: any[]; stats: { in: number; deduped: number; high: number; medium: number; low: number } }> {
  const seen = new Set<string>();
  const qualified: any[] = [], review: any[] = [], rejected: any[] = [];
  let deduped=0;
  const stats = { in: opts.rows.length, deduped:0, high:0, medium:0, low:0 };
  for (const raw of opts.rows) {
    const norm = {
      company: (raw.company||raw.Company||raw.business||'').trim(),
      website: (raw.website||raw.Website||raw.url||'').trim(),
      email: (raw.email||raw.Email||'').trim(),
      phone: (raw.phone||raw.Phone||raw.mobile||'').trim(),
      location: (raw.location||raw.Location||raw.city||'').trim(),
    };
    const key = leadIdentityKey(norm);
    if (seen.has(key)) { deduped++; continue; }
    seen.add(key);
    const q = scoreLeadQuality(norm);
    if (q.band==='REJECT') { rejected.push({ ...norm, _reason: q.reasons.join('; ') }); continue }
    if (q.band==='HIGH') stats.high++; else if (q.band==='MEDIUM') stats.medium++; else stats.low++;
    // dedup against existing ALO Leads (Zoho duplicate search analogue)
    const dupe: any = await db.lead.findFirst({ where:{ notes:{ contains: key.slice(0,40) } } }).catch(()=>null);
    if (dupe) { review.push({ ...norm, _dupeId: dupe.id, _quality: q }); continue }
    // optional enrich (Clay / Open Enrich analogue — gated by instruction)
    let enriched: any = norm;
    if (opts.enrichInstruction) {
      enriched = { ...norm, ...(await enrichTableRow(norm as any, opts.enrichInstruction)) };
    }
    // Qualified Output only after CRM confirms — we create Lead
    const lead: any = await db.lead.create({ data:{ source:'gtm-pipeline', status:'NEW', notes: JSON.stringify({ ...enriched, _identityKey: key, _quality: q, _source:'n8n-gtm+open-enrich' }), createdAt: new Date() } as any }).catch(()=>null);
    if (lead) qualified.push({ id: lead.id, ...enriched, _quality: q });
    else review.push({ ...enriched, _quality: q, _crmFailure: true });
  }
  stats.deduped = deduped;
  await db.crmAuditLog.create({ data:{ action:'GTM_PIPELINE_RUN', entityType:'GtmRun', entityId: `gtm_${Date.now()}`, actorId: opts.actorId||'gtm', details: JSON.stringify({ stats, qualified: qualified.length, review: review.length, rejected: rejected.length }), createdAt: new Date() } as any }).catch(()=>{});
  return { qualified, review, rejected, stats };
}
