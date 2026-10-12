import { reviewCatalogUpdate } from '@/lib/crm/catalog-update-review';
export const POST = (req: Request) => reviewCatalogUpdate(req, 'reject');
