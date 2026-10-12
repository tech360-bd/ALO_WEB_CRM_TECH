import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { downloadFile } from '@/lib/storage-service';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(auth.userType.toUpperCase()) || auth.roles.some((role) => ['SUPER_ADMIN', 'ADMIN'].includes(role.toUpperCase()));
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const { buffer, file } = await downloadFile(id, auth.userId, 'ADMIN', undefined, undefined, ip);
    const headers = new Headers({
      'Content-Type': file.mimeType,
      'Content-Length': String(buffer.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName || 'file')}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const status = message.includes('not found') ? 404 : message.includes('Access denied') ? 403 : 503;
    return NextResponse.json({ success: false, error: status === 404 ? 'File not found.' : status === 403 ? 'Forbidden' : 'File download is temporarily unavailable.' }, { status });
  }
}
