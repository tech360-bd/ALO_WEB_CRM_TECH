import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  if (!auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestedPage = Number(searchParams.get('page') || 1);
    const requestedLimit = Number(searchParams.get('limit') || 20);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;

    const where = status ? { status } : {};

    const [batches, total] = await Promise.all([
      db.importBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.importBatch.count({ where }),
    ]);

    return NextResponse.json({ success: true, batches, total });
  } catch {
    return NextResponse.json({ success: false, error: 'Import batches could not be loaded.' }, { status: 503 });
  }
});
