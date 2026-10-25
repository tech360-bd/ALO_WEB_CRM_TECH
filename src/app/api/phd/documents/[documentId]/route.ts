import { phdJson } from '@/lib/phd/api';
import { phdFileResponse, phdRoute } from '@/lib/phd/routes';
import { deleteDocument, downloadDocument } from '@/lib/phd/services/documents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/phd/documents/[documentId] — authenticated download.
 * There is no public URL: ownership is checked and the read is audited.
 */
export const GET = phdRoute<{ documentId: string }>(async ({ actor, params }) => {
  const file = await downloadDocument(actor, params.documentId);
  return phdFileResponse(file.buffer, file.filename, file.mimeType);
});

// DELETE — soft delete with a retention window, audited, never a hard erase.
export const DELETE = phdRoute<{ documentId: string }>(async ({ actor, params }) => {
  const result = await deleteDocument(actor, params.documentId);
  return phdJson({ success: true, ...result });
});
