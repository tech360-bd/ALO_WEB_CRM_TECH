import { ImportBatchDetail } from '@/components/admin/data-import/CatalogueImportViews';

export default async function BatchDetailRoute({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  return <ImportBatchDetail batchId={batchId} />;
}
