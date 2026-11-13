import { phdFileResponse, phdRoute } from '@/lib/phd/routes';
import { readCommissionDocumentFile } from '@/lib/phd/services/commission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/commission/documents/[documentId] — verifier-only read of the
// original PDF so a recorded term can be checked against its cited page.
export const GET = phdRoute<{ documentId: string }>(async ({ actor, params }) => {
  const file = await readCommissionDocumentFile(actor, params.documentId);
  return phdFileResponse(file.buffer, file.filename, 'application/pdf');
});
