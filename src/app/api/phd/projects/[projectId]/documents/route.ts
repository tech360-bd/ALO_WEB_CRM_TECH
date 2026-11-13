import { phdError, phdJson, enforceRateLimit } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { listDocuments, uploadDocument } from '@/lib/phd/services/documents';
import { UPLOAD_LIMITS, DOCUMENT_TYPES } from '@/lib/phd/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId]/documents — own documents only (never public).
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const documents = await listDocuments(actor, params.projectId);
  return phdJson({ success: true, documents });
});

/**
 * POST /api/phd/projects/[projectId]/documents — multipart upload.
 * The size is checked before the buffer is read, the declared MIME type must be
 * on the allow list, and the storage layer re-checks the file signature.
 */
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  enforceRateLimit(req, actor, 'phd-upload', 20, 60_000);

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return phdError('Upload the document as multipart/form-data.', 415);
  }
  const contentLength = Number.parseInt(req.headers.get('content-length') ?? '0', 10);
  if (Number.isFinite(contentLength) && contentLength > UPLOAD_LIMITS.maxBytes + 2_000_000) {
    return phdError(`The file exceeds the ${Math.round(UPLOAD_LIMITS.maxBytes / (1024 * 1024))} MB limit.`, 413);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return phdError('The upload could not be read.', 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return phdError('Attach a file in the "file" field.', 422);
  if (file.size <= 0) return phdError('The uploaded file is empty.', 422);
  if (file.size > UPLOAD_LIMITS.maxBytes) {
    return phdError(`The file exceeds the ${Math.round(UPLOAD_LIMITS.maxBytes / (1024 * 1024))} MB limit.`, 413);
  }

  const documentType = String(form.get('documentType') ?? '');
  if (!DOCUMENT_TYPES.includes(documentType as (typeof DOCUMENT_TYPES)[number])) {
    return phdError('Choose a valid document type.', 422);
  }

  const applicationId = String(form.get('applicationId') ?? '') || null;
  const requirementId = String(form.get('requirementId') ?? '') || null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const document = await uploadDocument(actor, {
    projectId: params.projectId,
    documentType,
    filename: file.name,
    mimeType: file.type,
    buffer,
    applicationId,
    requirementId,
  });
  return phdJson({ success: true, document }, 201);
});
