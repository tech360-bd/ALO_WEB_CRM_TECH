/**
 * ALO AI Workforce — knowledge / RAG with access control (§13).
 *
 * Documents are chunked and indexed deterministically (BM25-style lexical
 * scoring over a stored term index), so retrieval works with no embedding
 * service and no paid API. Every chunk carries a citation, a source version
 * and a freshness timestamp, and retrieval is filtered by the caller's role
 * before any content is returned.
 */
import { db } from '@/lib/db';
import { writeAudit } from './audit';
import { termFrequency, tokenize } from './text';
import type { ActorContext, Confidentiality } from './types';

const CHUNK_CHARS = 1200;
const CHUNK_OVERLAP = 150;

export function chunkDocument(content: string): string[] {
  const clean = String(content || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  if (clean.length <= CHUNK_CHARS) return [clean];
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < clean.length) {
    let end = Math.min(clean.length, cursor + CHUNK_CHARS);
    if (end < clean.length) {
      // Prefer a paragraph or sentence boundary so citations stay readable.
      const slice = clean.slice(cursor, end);
      const boundary = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('. '));
      if (boundary > CHUNK_CHARS * 0.5) end = cursor + boundary + 1;
    }
    chunks.push(clean.slice(cursor, end).trim());
    if (end >= clean.length) break;
    cursor = Math.max(cursor + 1, end - CHUNK_OVERLAP);
  }
  return chunks.filter(Boolean);
}

export interface IngestInput {
  slug: string;
  title: string;
  content: string;
  sourceType?: string;
  sourceUrl?: string;
  department?: string;
  confidentiality?: Confidentiality;
  allowedRoles?: string[];
  actor: ActorContext;
}

export async function ingestKnowledge(input: IngestInput): Promise<{ sourceId: string; chunks: number; version: number }> {
  const existing = await db.awfKnowledgeSource.findUnique({ where: { slug: input.slug }, select: { id: true, version: true } });
  const version = (existing?.version ?? 0) + 1;
  const source = await db.awfKnowledgeSource.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      title: input.title,
      sourceType: input.sourceType || 'DOCUMENT',
      sourceUrl: input.sourceUrl || '',
      department: input.department || '',
      confidentiality: input.confidentiality || 'INTERNAL',
      allowedRoles: JSON.stringify(input.allowedRoles || ['SUPER_ADMIN', 'ADMIN']),
      version,
      freshnessAt: new Date(),
      status: 'ACTIVE',
      createdById: input.actor.userId,
    },
    update: {
      title: input.title,
      sourceType: input.sourceType || 'DOCUMENT',
      sourceUrl: input.sourceUrl || '',
      department: input.department || '',
      confidentiality: input.confidentiality || 'INTERNAL',
      allowedRoles: JSON.stringify(input.allowedRoles || ['SUPER_ADMIN', 'ADMIN']),
      version,
      freshnessAt: new Date(),
      status: 'ACTIVE',
    },
  });
  // Re-indexing replaces the previous chunk set so stale text can never be cited.
  await db.awfKnowledgeChunk.deleteMany({ where: { sourceId: source.id } });
  const chunks = chunkDocument(input.content);
  for (const [index, content] of chunks.entries()) {
    await db.awfKnowledgeChunk.create({
      data: {
        sourceId: source.id,
        chunkIndex: index,
        content,
        tokens: tokenize(content).length,
        termIndex: JSON.stringify(termFrequency(content)),
        citation: `${input.title} — part ${index + 1}${input.sourceUrl ? ` (${input.sourceUrl})` : ''}`,
      },
    });
  }
  await writeAudit({
    actor: input.actor,
    action: 'KNOWLEDGE_INGESTED',
    objectType: 'AwfKnowledgeSource',
    objectId: source.id,
    after: { slug: input.slug, chunks: chunks.length, version },
  });
  return { sourceId: source.id, chunks: chunks.length, version };
}

export interface RetrievedChunk {
  content: string;
  citation: string;
  score: number;
  sourceSlug: string;
}

function roleAllowed(actor: ActorContext, allowedRolesJson: string): boolean {
  if (actor.role === 'SUPER_ADMIN') return true;
  try {
    const roles = JSON.parse(allowedRolesJson || '[]');
    return Array.isArray(roles) && roles.map(String).includes(actor.role);
  } catch {
    return false;
  }
}

/**
 * Lexical retrieval with access control. Unauthorised sources are filtered out
 * BEFORE scoring, so an unauthorised document can never influence a ranking or
 * leak through a citation.
 */
export async function retrieveKnowledge(query: string, actor: ActorContext, limit = 5): Promise<RetrievedChunk[]> {
  const queryTerms = tokenize(query);
  if (!queryTerms.length) return [];
  const sources = await db.awfKnowledgeSource.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, slug: true, allowedRoles: true, confidentiality: true, freshnessAt: true },
  });
  const permitted = sources.filter((source) => roleAllowed(actor, source.allowedRoles));
  if (!permitted.length) return [];
  const permittedIds = permitted.map((source) => source.id);
  const slugById = new Map(permitted.map((source) => [source.id, source.slug]));
  const chunks = await db.awfKnowledgeChunk.findMany({
    where: { sourceId: { in: permittedIds } },
    select: { sourceId: true, content: true, citation: true, termIndex: true, tokens: true },
    take: 2000,
  });
  if (!chunks.length) return [];

  // Document frequency for IDF.
  const documentFrequency = new Map<string, number>();
  const parsed = chunks.map((chunk) => {
    let terms: Record<string, number> = {};
    try {
      terms = JSON.parse(chunk.termIndex || '{}');
    } catch {
      terms = {};
    }
    for (const term of Object.keys(terms)) documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    return { chunk, terms };
  });
  const avgLength = parsed.reduce((sum, row) => sum + (row.chunk.tokens || 1), 0) / parsed.length;
  const k1 = 1.5;
  const b = 0.75;

  const scored = parsed.map(({ chunk, terms }) => {
    let score = 0;
    for (const term of queryTerms) {
      const frequency = terms[term] || 0;
      if (!frequency) continue;
      const df = documentFrequency.get(term) || 1;
      const idf = Math.log(1 + (parsed.length - df + 0.5) / (df + 0.5));
      const length = chunk.tokens || 1;
      score += idf * ((frequency * (k1 + 1)) / (frequency + k1 * (1 - b + b * (length / avgLength))));
    }
    return {
      content: chunk.content,
      citation: chunk.citation,
      score: Math.round(score * 1000) / 1000,
      sourceSlug: slugById.get(chunk.sourceId) || '',
    };
  });

  return scored
    .filter((row) => row.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, Math.max(1, Math.min(20, limit)));
}

/** Sources older than the freshness window are reported, never silently used as current. */
export async function staleSources(maxAgeDays = 180) {
  const cutoff = new Date(Date.now() - maxAgeDays * 86_400_000);
  return db.awfKnowledgeSource.findMany({
    where: { status: 'ACTIVE', freshnessAt: { lt: cutoff } },
    select: { slug: true, title: true, freshnessAt: true, version: true },
    orderBy: { freshnessAt: 'asc' },
    take: 100,
  });
}
