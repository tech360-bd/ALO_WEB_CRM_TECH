import { phdError } from '@/lib/phd/api';
import { phdFileResponse, phdRoute, queryParam } from '@/lib/phd/routes';
import { exportProposal } from '@/lib/phd/services/proposals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/phd/proposals/[proposalId]/export?format=docx|pdf
 *
 * The file is generated from saved content, the DOCX package is re-verified
 * before it is returned, and the export is audited. The response is private
 * (no-store) and cannot be served from a public URL.
 */
export const GET = phdRoute<{ proposalId: string }>(async ({ actor, req, params }) => {
  const format = queryParam(req, 'format', 8).toLowerCase();
  if (format !== 'docx' && format !== 'pdf') {
    return phdError('Choose format=docx or format=pdf.', 400);
  }
  const result = await exportProposal(actor, params.proposalId, format);
  return phdFileResponse(result.buffer, result.filename, result.contentType);
});
