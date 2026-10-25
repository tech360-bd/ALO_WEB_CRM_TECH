import { phdError, phdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { listCommissionDocuments, uploadCommissionDocument } from '@/lib/phd/services/commission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/commission/documents — the uploaded source PDFs and their status.
export const GET = phdRoute(async () => {
  const documents = await listCommissionDocuments();
  return phdJson({ success: true, documents });
});

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * POST /api/phd/commission/documents — multipart upload of the supplied commission
 * PDF. The original file is stored (private), hashed with SHA-256 (duplicate-safe)
 * and remains readable by a verifier so a rate can be checked against its page.
 */
export const POST = phdRoute(async ({ actor, req }) => {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) return phdError('Upload the PDF as multipart/form-data.', 415);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return phdError('The upload could not be read.', 400);
  }
  const file = form.get('file');
  if (!(file instanceof File)) return phdError('Attach the PDF in the "file" field.', 422);
  if (file.type !== 'application/pdf') return phdError('Only a PDF commission structure can be uploaded.', 415);
  if (file.size <= 0) return phdError('The uploaded file is empty.', 422);
  if (file.size > MAX_BYTES) return phdError('The file exceeds the 25 MB limit.', 413);

  const document = await uploadCommissionDocument(actor, {
    filename: file.name,
    mimeType: file.type,
    buffer: Buffer.from(await file.arrayBuffer()),
    title: String(form.get('title') ?? '') || undefined,
    versionLabel: String(form.get('versionLabel') ?? '') || undefined,
    effectiveFrom: String(form.get('effectiveFrom') ?? '') || null,
    effectiveTo: String(form.get('effectiveTo') ?? '') || null,
    sourceNote: String(form.get('sourceNote') ?? '') || undefined,
  });
  return phdJson({ success: true, document }, 201);
});
