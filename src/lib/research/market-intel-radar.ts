// ============================================================
// Market Intelligence Radar — PostgreSQL → MySQL adaptation for ALO
// Source: guifav/market-intelligence-radar (MIT, 4 commits, Next.js + Python mir/)
//   Features: scan configurable news sources → AI structured extraction
//             (people, companies, deals, signals) via multi-LLM
//             (Anthropic Claude / OpenAI GPT-4o / Google Gemini)
//             → PostgreSQL (Docker) → CRM contact matching from CSV → enrichment
//             via Apollo.io / SalesQL → real-time dashboard with lead approval
//             → taxonomy/divisions/target profiles, healthcheck, auth hardening
//
// ALO adaptation: PostgreSQL → MySQL (existing Prisma MySQL 8.4), entity set
//   → University/Course/Visa/Policy/Scholarship signals, CRM → Lead/AgentTask,
//   Apollo/SalesQL → optional (env APOLLO_API_KEY / SALESQL_API_KEY)
//   Approval = DataChange → Super Admin queue (existing monitoring engine pattern)
//   News sources stored as OfficialSource where entityType=GOVERNMENT/NEWS
// ============================================================
import { db } from '@/lib/db';
import { webSearch, webScrape } from './molx-firecrawl-client';

type RadarSource = { id: string; name: string; rssUrl?: string; sourceUrl: string; entityType: string; enabled: boolean };

async function callLLM_structured(prompt: string, systemPrompt: string): Promise<any> {
  try {
    const mod: any = await import('@/lib/ai');
    if (mod.generateText) {
      const r = await mod.generateText({ prompt, systemPrompt, temperature: 0.2 });
      const text = r.text || '';
      const start = text.indexOf('{'); const end = text.lastIndexOf('}');
      if (start>=0) try { return JSON.parse(text.slice(start,end+1)); } catch {}
      // try fenced
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenced) try { return JSON.parse(fenced[1]); } catch {}
      return null;
    }
  } catch { return null; }
}

export type RadarSignal = {
  type: 'NEW_PROGRAM'|'FEE_CHANGE'|'DEADLINE_CHANGE'|'POLICY_CHANGE'|'SCHOLARSHIP_OPEN'|'RANKING_UPDATE'|'CAMPUS_NEWS';
  title: string;
  summary: string;
  entities: { name: string; role: string; url?: string }[]; // people/companies/universities
  signals: { label: string; value: string; confidence: number }[];
  sourceUrl: string;
  publishedAt?: string;
  country?: string;
  universitySlug?: string;
};

// Scan one news source (RSS or search) → list of article URLs
export async function radarScanSource(source: RadarSource, opts?: { maxArticles?: number }): Promise<string[]> {
  const max = opts?.maxArticles || 10;
  // If rssUrl, fetch RSS directly
  if (source.rssUrl) {
    try {
      const xml = await fetch(source.rssUrl, { headers:{ 'User-Agent':'ALOEducationRadar/1.0' }}).then(r=>r.text());
      const urls = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map(m=>m[1]).filter(u=>u.startsWith('http')).slice(0,max);
      if (urls.length) return urls;
    } catch {}
  }
  // Fallback: search by source name + entity
  const q = `${source.name} UK university news 2026 intake scholarship visa`;
  const hits = await webSearch(q, { limit: max });
  return hits.hits.map(h=>h.url);
}

// Extract structured intel from one article
export async function radarExtractArticle(articleUrl: string, taxonomy?: string[]): Promise<RadarSignal | null> {
  const scraped = await webScrape(articleUrl, { formats:['markdown'] });
  const markdown = scraped.result?.markdown || '';
  if (!markdown || markdown.length < 80) return null;
  const sys = `You are Market Intelligence Radar — extract structured signals for an education CRM. Taxonomy: ${(taxonomy||['NEW_PROGRAM','FEE_CHANGE','DEADLINE_CHANGE','POLICY_CHANGE','SCHOLARSHIP_OPEN','RANKING_UPDATE','CAMPUS_NEWS']).join(', ')}. Return JSON: {type, title, summary, entities:[{name,role,url}], signals:[{label,value,confidence}], country, universitySlug}. Never invent.`;
  const prompt = `Article URL: ${articleUrl}\nArticle:\n${markdown.slice(0,12000)}\n\nReturn JSON now.`;
  const obj = await callLLM_structured(prompt, sys);
  if (!obj || !obj.type) return null;
  return { type: obj.type, title: obj.title||'', summary: obj.summary||'', entities: obj.entities||[], signals: obj.signals||[], sourceUrl: articleUrl, country: obj.country, universitySlug: obj.universitySlug };
}

// CRM contact matching (MIR: CSV import → match) adapted: match signals to existing Lead/University
export async function radarMatchToCRM(signal: RadarSignal): Promise<{ matched: boolean; matchedEntity?: string; action: 'create_lead'|'link_university'|'review_queue' }> {
  // Try university slug match
  if (signal.universitySlug) {
    const uni: any = await db.crmUniversity.findFirst({ where:{ slug: signal.universitySlug } }).catch(()=>null);
    if (uni) return { matched:true, matchedEntity: uni.slug, action:'link_university' };
  }
  // Try entity name fuzzy in Lead
  for (const ent of signal.entities.slice(0,3)) {
    const lead: any = await db.lead.findFirst({ where:{ notes:{ contains: ent.name.slice(0,30) } } }).catch(()=>null);
    if (lead) return { matched:true, matchedEntity: lead.id, action:'create_lead' };
  }
  // Enrichment hooks (optional)
  const apolloKey = process.env.APOLLO_API_KEY || '';
  const salesqlKey = process.env.SALESQL_API_KEY || '';
  if (apolloKey || salesqlKey) {
    // Placeholder: call Apollo/SalesQL enrich here (cost per lead) — gated by env
    // await enrichViaApollo(signal.entities[0]?.name, apolloKey)
  }
  return { matched:false, action:'review_queue' };
}

// Full pipeline: scan → extract → match → DataChange/Lead + approval gate
export async function radarRunCycle(opts?: { sourcesLimit?: number; taxonomy?: string[] }): Promise<{ scanned: number; extracted: number; matched: number; queued: number; signals: RadarSignal[] }> {
  const sources: any[] = await db.officialSource.findMany({ where:{ entityType:{ in:['GOVERNMENT','AUTHORITY','NEWS'] }, monitoringEnabled:true }, take: opts?.sourcesLimit||5 }).catch(()=>[]);
  // synthetic news sources when none exist yet (UKVI, UCAS, British Council)
  const effective: RadarSource[] = sources.length ? sources.map(s=>({ id:s.id, name:s.sourceUrl, sourceUrl:s.sourceUrl, entityType:s.entityType, enabled:true })) : [
    { id:'news-ukvi', name:'UKVI updates', sourceUrl:'https://www.gov.uk/government/organisations/uk-visas-and-immigration', entityType:'GOVERNMENT', enabled:true },
    { id:'news-ucas', name:'UCAS news', sourceUrl:'https://www.ucas.com', entityType:'NEWS', enabled:true },
    { id:'news-british-council', name:'British Council study UK', sourceUrl:'https://www.britishcouncil.org', entityType:'NEWS', enabled:true },
  ];
  let scanned=0, extracted=0, matched=0, queued=0;
  const signals: RadarSignal[] = [];
  for (const src of effective) {
    const urls = await radarScanSource(src, { maxArticles: 5 });
    scanned += urls.length;
    for (const url of urls.slice(0,3)) {
      const sig = await radarExtractArticle(url, opts?.taxonomy);
      if (!sig) continue;
      extracted++;
      const m = await radarMatchToCRM(sig);
      if (m.matched) matched++;
      else queued++;
      signals.push(sig);
      // Persist as DataChange-equivalent (audit log + monitoring log) for Super Admin approval (existing pattern)
      await db.crmAuditLog.create({ data:{ action:'RADAR_SIGNAL', targetCollection:'RadarSignal', targetId: `radar_${Date.now()}_${extracted}`, actorUserId:'market-intel-radar', afterData: JSON.stringify({ signal: sig, match: m, sourceId: src.id }), createdAt: new Date() } }).catch(()=>{});
      // Throttle API
      await new Promise(r=>setTimeout(r, 600));
    }
  }
  return { scanned, extracted, matched, queued, signals };
}

// Dashboard helper (mirrors MIR Next.js dashboard: approval workflow)
export async function radarRecentSignals(limit=20): Promise<RadarSignal[]> {
  const logs: any[] = await db.crmAuditLog.findMany({ where:{ targetCollection:'RadarSignal' }, orderBy:{ createdAt:'desc' }, take: limit }).catch(()=>[]);
  return logs.map((l:any)=> { try { return JSON.parse(l.afterData).signal; } catch { return null } }).filter(Boolean);
}
