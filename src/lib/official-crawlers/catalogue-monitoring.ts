import { db } from '@/lib/db';
import { traverseCatalogue, type CatalogueTraversal, type DiscoveryFetcher } from './catalogue-traversal';

export const CATALOGUE_LOG_ENTITY = 'CATALOGUE_TRAVERSAL';

/** Uses the existing monitoring log as an append-only checkpoint/history store. */
export async function monitorCatalogueBatch(
  source: { id: string; sourceUrl: string; universitySlug?: string | null },
  runId: string,
  fetchPage: DiscoveryFetcher,
) {
  const previous = await db.monitoringLog.findFirst({
    where: { entityType: CATALOGUE_LOG_ENTITY, entitySlug: source.id }, orderBy: { createdAt: 'desc' },
    select: { metadata: true },
  });
  let state: CatalogueTraversal | null = null;
  try {
    const parsed = previous?.metadata ? JSON.parse(previous.metadata).state : null;
    if (parsed?.version === 1 && Array.isArray(parsed.frontier) && Array.isArray(parsed.visited) && Array.isArray(parsed.discovered)) state = parsed;
  } catch { /* corrupt checkpoints restart discovery, never imply verification */ }
  const report = await traverseCatalogue(source.sourceUrl, fetchPage, state);
  const checkpoint = await db.monitoringLog.create({ data: {
    runId, entityType: CATALOGUE_LOG_ENTITY, entitySlug: source.id, sourceUrl: source.sourceUrl,
    level: report.status === 'NEEDS_MANUAL_REVIEW' ? 'WARN' : 'INFO',
    message: `Catalogue discovery ${report.status}: ${report.visited.length} pages fetched, ${report.discovered.length} candidate links, ${report.frontier.length} queued. Catalogue verification has NOT been granted.`,
    metadata: JSON.stringify({ sourceId: source.id, universitySlug: source.universitySlug, state: report }),
  } });
  // Incomplete discovery remains due for the SAME scheduler, not a second job.
  if (report.status === 'IN_PROGRESS') await db.officialSource.update({ where: { id: source.id }, data: { lastCheckedAt: null } });
  return { report, checkpointId: checkpoint.id };
}
