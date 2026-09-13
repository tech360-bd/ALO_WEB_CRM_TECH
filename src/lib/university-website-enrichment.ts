/**
 * University Website Enrichment (from fatfreecrm AccountWebsiteJob #1688)
 * Solid-Queue style, SSRF-safe, JSON-LD Organization fetch
 * Enriches University.logo / description without overwriting verified data
 */
import { db } from '@/lib/db';

const SSRF_BLOCK = [/^https?:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i, /^file:/i, /^ftp:/i];
const TIMEOUT_MS = 7000;

export async function fetchJsonLd(url: string): Promise<any|null> {
  if (SSRF_BLOCK.some(r=> r.test(url))) throw new Error('SSRF blocked');
  const controller = new AbortController();
  const t = setTimeout(()=> controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent':'ALO-Enrichment/1.0', Accept:'application/ld+json, application/json, text/html' }});
    if(!res.ok) return null;
    const text = await res.text();
    // try JSON-LD in <script type="application/ld+json">
    const m = text.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if(m){ try{ const j=JSON.parse(m[1]); return Array.isArray(j)? j.find((x:any)=> x['@type']==='CollegeOrUniversity' || x['@type']==='Organization')||j[0]:j; }catch{} }
    try{ return JSON.parse(text); }catch{ return null; }
  } finally { clearTimeout(t); }
}

export async function enrichUniversity(universityId: string){
  const uni = await (db as any).university.findUnique?.({ where:{ id: universityId }}) ?? await (db as any).universityPage?.findUnique?.({ where:{ id: universityId }});
  if(!uni || !uni.website) return { skipped:'no website' };
  const json = await fetchJsonLd(uni.website).catch(()=> null);
  if(!json) return { skipped:'no json-ld' };
  const patch: any = {};
  if(json.logo && !uni.logo) patch.logo = typeof json.logo==='string'? json.logo : json.logo.url;
  if(json.description && !uni.description) patch.description = json.description;
  if(json.address && !uni.city) patch.city = json.address.addressLocality || json.address.city;
  if(Object.keys(patch).length===0) return { skipped:'already enriched' };
  await (db as any).university.update?.({ where:{ id: universityId }, data: patch }).catch(()=>{});
  await db.agentAuditLog.create({ data:{ agentId:'website-enrichment', action:'UNIVERSITY_ENRICHED', details: JSON.stringify({ universityId, patch, source: uni.website }), createdAt: new Date()} as any}).catch(()=>{});
  return { enriched: patch };
}

// Called after university save — like fatfreecrm after_save_commit
export async function enqueueUniversityEnrichment(universityId: string){
  // In production use Solid Queue / Bull; here immediate for demo
  return enrichUniversity(universityId);
}
