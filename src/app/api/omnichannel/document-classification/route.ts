import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
function isAdministrator(auth: { userType: string; roles: string[] }) {
  return [auth.userType, ...auth.roles].some((role) => ADMIN_ROLES.has(role.toUpperCase()));
}

// Fail closed until an approved private OCR/AI pipeline and its retention controls are configured.
// Document text is deliberately not forwarded to an external AI provider by this route.
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    const value: unknown = await req.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  const documentId = typeof body.documentId === 'string' ? body.documentId.trim() : '';
  if (!documentId || documentId.length > 100) return NextResponse.json({ success: false, error: 'A valid document ID is required.' }, { status: 400 });

  try {
    const document = await db.document.findUnique({ where: { id: documentId }, select: { id: true } });
    if (!document) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
  } catch {
    return NextResponse.json({ success: false, error: 'Document validation is temporarily unavailable.' }, { status: 503 });
  }

  return NextResponse.json({
    success: false,
    error: 'Document classification is not configured. No OCR text was processed or sent to an AI provider.',
    status: 'NOT_CONFIGURED',
  }, { status: 501, headers: { 'Cache-Control': 'no-store' } });
}
