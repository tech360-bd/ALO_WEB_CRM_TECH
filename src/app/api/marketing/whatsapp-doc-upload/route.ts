import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { canUseUccDocuments } from '@/lib/ucc/document-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Legacy metadata-only ingestion is intentionally disabled. The old endpoint
 * trusted caller-supplied file URLs/OCR text and marked documents verified.
 * WhatsApp media is now downloaded from Meta in the signed webhook, validated,
 * and stored privately before a document or OCR job is created. */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!canUseUccDocuments(auth)) return NextResponse.json({ success: false, error: 'Document upload access is not permitted.' }, { status: 403 });
  return NextResponse.json({
    success: false,
    error: 'Metadata-only WhatsApp uploads are disabled. Files must arrive through the signed WhatsApp Cloud API webhook or be uploaded as actual bytes through the secure UCC document flow.',
    code: 'METADATA_ONLY_UPLOAD_DISABLED',
  }, { status: 410 });
}
