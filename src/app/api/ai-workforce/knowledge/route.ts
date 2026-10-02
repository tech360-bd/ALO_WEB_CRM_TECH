import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { ingestKnowledge, retrieveKnowledge, staleSources } from '@/lib/ai-workforce/knowledge';
import { guard, isGuardFailure, readJson } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.agent.read');
  if (isGuardFailure(admission)) return admission;
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  try {
    if (query) {
      // Retrieval is ACL-filtered before scoring: unauthorised sources can
      // neither rank nor appear as citations.
      const chunks = await retrieveKnowledge(query, admission.actor, Math.min(Number(url.searchParams.get('limit') || 5), 20));
      return ok({ query, chunks }, 'Knowledge retrieval');
    }
    const [sources, stale] = await Promise.all([
      db.awfKnowledgeSource.findMany({
        orderBy: { slug: 'asc' },
        select: { slug: true, title: true, sourceType: true, department: true, confidentiality: true, version: true, status: true, freshnessAt: true, _count: { select: { chunks: true } } },
      }),
      staleSources(),
    ]);
    return ok({ sources, stale }, 'Knowledge sources');
  } catch (error) {
    return failFromError(error, 'Unable to read knowledge');
  }
}

export async function POST(request: Request) {
  const admission = await guard(request, 'awf.knowledge.manage');
  if (isGuardFailure(admission)) return admission;
  const body = await readJson(request);
  if (!body.slug || !body.title || !body.content) return fail('slug, title and content are required', 422);
  try {
    const result = await ingestKnowledge({
      slug: String(body.slug),
      title: String(body.title),
      content: String(body.content),
      sourceType: body.sourceType ? String(body.sourceType) : 'POLICY',
      department: body.department ? String(body.department) : 'company',
      confidentiality: (body.confidentiality as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED') ?? 'INTERNAL',
      allowedRoles: Array.isArray(body.allowedRoles) ? body.allowedRoles.map(String) : ['SUPER_ADMIN', 'ADMIN'],
      actor: admission.actor,
    });
    return ok(result, 'Knowledge ingested', 201);
  } catch (error) {
    return failFromError(error, 'Unable to ingest knowledge', 400);
  }
}
