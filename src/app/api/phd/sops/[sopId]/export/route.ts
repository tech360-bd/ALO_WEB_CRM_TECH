import { phdError } from '@/lib/phd/api';
import { phdFileResponse, phdRoute, queryParam } from '@/lib/phd/routes';
import { exportSop } from '@/lib/phd/services/sop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FORMATS = ['docx', 'pdf', 'report'] as const;
type Format = (typeof FORMATS)[number];

/**
 * GET /api/phd/sops/[sopId]/export?format=docx|pdf|report
 *
 * The file is generated from saved content. A statement that has not been
 * approved can only export its review report — never a document that looks
 * final.
 */
export const GET = phdRoute<{ sopId: string }>(async ({ actor, req, params }) => {
  const requested = queryParam(req, 'format', 10).toLowerCase();
  const format: Format = (FORMATS as readonly string[]).includes(requested) ? (requested as Format) : 'pdf';
  const file = await exportSop(actor, params.sopId, format);
  if (!file.buffer || file.buffer.byteLength === 0) {
    return phdError('The export produced an empty file and was not sent.', 502);
  }
  return phdFileResponse(file.buffer, file.filename, file.mimeType);
});
