import { ChangeHistoryView } from '@/components/admin/catalog-review/CatalogReviewViews';

export default async function ChangeHistoryRoute({ searchParams }: { searchParams: Promise<{ requestId?: string | string[] }> }) {
  const sp = await searchParams;
  const requestId = typeof sp.requestId === 'string' && sp.requestId.length <= 191 ? sp.requestId : undefined;
  return <ChangeHistoryView requestId={requestId} />;
}
