import { createHash } from 'node:crypto';
import { normalizeOfficialSourceUrl } from '@/lib/university-monitoring-source-policy';

export type DiscoveryKind = 'CATALOGUE' | 'FACULTY' | 'DEPARTMENT' | 'PROGRAMME_CANDIDATE' | 'SCHOLARSHIP' | 'DOCUMENT' | 'POLICY';
export interface DiscoveredLink { url: string; label: string; kind: DiscoveryKind; discoveredFrom: string }
export interface TraversedPage extends DiscoveredLink { hash: string; checkedAt: string; title: string }
export interface CatalogueTraversal {
  version: 1;
  rootUrl: string;
  startedAt: string;
  updatedAt: string;
  status: 'IN_PROGRESS' | 'LINK_GRAPH_EXHAUSTED' | 'NEEDS_MANUAL_REVIEW';
  /** Link traversal is never equivalent to verifying a university catalogue. */
  catalogueVerified: false;
  frontier: DiscoveredLink[];
  discovered: DiscoveredLink[];
  visited: TraversedPage[];
  failures: Array<{ url: string; reason: string }>;
  blockers: string[];
  excludedExternalLinks: number;
  specialProgrammeCandidates: Record<string, string[]>;
}
export interface DiscoveryFetchResult { ok: boolean; text?: string; title?: string; finalUrl?: string; contentType?: string; error?: string }
export type DiscoveryFetcher = (url: string) => Promise<DiscoveryFetchResult>;

const SPECIAL_PROGRAMMES: Record<string, RegExp> = {
  TOP_UP: /top[ -]?up|final.year.entry|advanced.standing|credit.transfer/i,
  MRES: /\bmres\b|master.of.research|research.master/i,
  MPHIL: /\bmphil\b|master.of.philosophy/i,
  PHD: /\bphd\b|doctoral|doctor.of.philosophy/i,
  PRE_MASTERS: /pre.master/i,
  DIPLOMA: /graduate.diploma|postgraduate.diploma|higher.diploma/i,
  CONVERSION: /conversion/i,
};
const MAX_LINKS = 10000;

function plain(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
}

/** Preserve pagination/course-ID query strings; remove only explicit tracking. */
export function canonicalCatalogueUrl(input: string, base?: string): string {
  const url = new URL(normalizeOfficialSourceUrl(new URL(input, base).toString()));
  for (const key of [...url.searchParams.keys()]) if (/^utm_|^(gclid|fbclid)$/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  return url.toString();
}

function linkKind(url: URL, label: string): DiscoveryKind | null {
  const text = `${decodeURI(url.pathname)} ${label}`;
  if (/\.pdf$/i.test(url.pathname)) return 'DOCUMENT';
  if (/faculty|faculties|schools?\b/i.test(text)) return 'FACULTY';
  if (/departments?\b/i.test(text)) return 'DEPARTMENT';
  if (/scholarship|bursar|funding/i.test(text)) return 'SCHOLARSHIP';
  if (/admission|international.student|entry.requirement|tuition|visa|policy/i.test(text)) return 'POLICY';
  if (/\b(MRes|MPhil|PhD|MSc|MBA|BSc|LLM|BEng)\b|top.up|master.of|bachelor.of|conversion/i.test(text)) return 'PROGRAMME_CANDIDATE';
  if (/course|programme|program\b|degrees?|catalog|study|research|foundation|diploma|certificate|pre.sessional/i.test(text)) return 'CATALOGUE';
  if ([...url.searchParams.keys()].some((key) => /^(page|p|offset|start|letter|alpha)$/i.test(key))) return 'CATALOGUE';
  return null;
}

/** Links are discovery candidates, not evidence that a programme exists. */
export function discoverCatalogueLinks(html: string, pageUrl: string, rootUrl: string): { links: DiscoveredLink[]; excluded: number } {
  const rootHost = new URL(rootUrl).hostname.toLowerCase();
  const links = new Map<string, DiscoveredLink>();
  let excluded = 0;
  const content = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  for (const anchor of content.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = anchor[1].match(/(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!href) continue;
    try {
      const url = canonicalCatalogueUrl((href[1] ?? href[2] ?? href[3]).replace(/&amp;/gi, '&'), pageUrl);
      const parsed = new URL(url);
      const label = plain(anchor[2]);
      const kind = linkKind(parsed, label);
      if (!kind || /\/(login|logout|sign-in|account|cart)(\/|$)/i.test(parsed.pathname)) continue;
      // A public cross-domain URL is not necessarily an official source.
      if (parsed.hostname.toLowerCase() !== rootHost) { excluded++; continue; }
      links.set(url, { url, label, kind, discoveredFrom: pageUrl });
    } catch { /* malformed, non-HTTPS and reserved links are never queued */ }
  }
  return { links: [...links.values()], excluded };
}

export function newCatalogueTraversal(root: string): CatalogueTraversal {
  const rootUrl = canonicalCatalogueUrl(root);
  const now = new Date().toISOString();
  return {
    version: 1, rootUrl, startedAt: now, updatedAt: now, status: 'IN_PROGRESS', catalogueVerified: false,
    frontier: [{ url: rootUrl, label: 'Configured official catalogue', kind: 'CATALOGUE', discoveredFrom: rootUrl }],
    discovered: [], visited: [], failures: [], blockers: [], excludedExternalLinks: 0, specialProgrammeCandidates: {},
  };
}

/** A bounded, restartable batch. Caller persists every result before the next batch. */
export async function traverseCatalogue(
  root: string, fetchPage: DiscoveryFetcher, previous?: CatalogueTraversal | null, pageBudget = 3,
): Promise<CatalogueTraversal> {
  const rootUrl = canonicalCatalogueUrl(root);
  const state: CatalogueTraversal = previous?.version === 1 && previous.rootUrl === rootUrl && previous.status === 'IN_PROGRESS'
    ? structuredClone(previous) : newCatalogueTraversal(rootUrl);
  state.catalogueVerified = false;
  const budget = Math.min(20, Math.max(1, Number.isFinite(pageBudget) ? Math.floor(pageBudget) : 3));
  const known = new Set([rootUrl, ...state.discovered.map((item) => item.url)]);
  const visited = new Set(state.visited.map((page) => page.url));
  const blockers = new Set(state.blockers);
  let requests = 0;
  while (state.frontier.length && requests < budget) {
    const next = state.frontier.shift()!;
    if (visited.has(next.url)) continue;
    // Revalidate persisted state before any network access.
    try {
      if (new URL(canonicalCatalogueUrl(next.url)).hostname !== new URL(rootUrl).hostname) throw new Error('Off-domain persisted frontier');
    } catch { blockers.add('Unsafe persisted frontier entry rejected'); continue; }
    if (next.kind === 'DOCUMENT') { blockers.add('Official PDF documents require extraction and review'); continue; }
    requests++;
    let result: DiscoveryFetchResult;
    try { result = await fetchPage(next.url); } catch { result = { ok: false, error: 'Source fetch failed' }; }
    if (!result.ok || !result.text) {
      state.failures.push({ url: next.url, reason: (result.error || 'Empty or unsupported source').slice(0, 500) });
      continue;
    }
    const finalUrl = canonicalCatalogueUrl(result.finalUrl || next.url);
    if (new URL(finalUrl).hostname !== new URL(rootUrl).hostname) {
      state.failures.push({ url: next.url, reason: 'Redirect left the configured official host; additional source approval required' });
      continue;
    }
    if (result.contentType && !['text/html', 'application/xhtml+xml'].includes(result.contentType)) {
      blockers.add('Non-HTML catalogue requires a reviewed format-specific adapter'); continue;
    }
    visited.add(next.url);
    state.visited.push({ ...next, hash: createHash('sha256').update(result.text).digest('hex'), checkedAt: new Date().toISOString(), title: (result.title || '').slice(0, 500) });
    if (/load\s*more|infinite.scroll|__NEXT_DATA__|<form\b[^>]*(?:search|filter)/i.test(result.text)) blockers.add('Dynamic/filter-based catalogue requires adapter completeness review');
    const discovered = discoverCatalogueLinks(result.text, finalUrl, rootUrl);
    state.excludedExternalLinks += discovered.excluded;
    for (const link of discovered.links) {
      if (known.has(link.url)) continue;
      if (known.size >= MAX_LINKS) { blockers.add('Discovery safety limit reached; catalogue is not complete'); break; }
      known.add(link.url); state.discovered.push(link);
      if (link.kind === 'DOCUMENT') blockers.add('Official PDF documents require extraction and review');
      else state.frontier.push(link);
      for (const [key, pattern] of Object.entries(SPECIAL_PROGRAMMES)) {
        if (pattern.test(`${link.label} ${link.url}`)) (state.specialProgrammeCandidates[key] ||= []).push(link.url);
      }
    }
  }
  state.blockers = [...blockers];
  state.status = state.frontier.length ? 'IN_PROGRESS'
    : state.failures.length || state.blockers.length || state.excludedExternalLinks ? 'NEEDS_MANUAL_REVIEW' : 'LINK_GRAPH_EXHAUSTED';
  state.updatedAt = new Date().toISOString();
  return state;
}
