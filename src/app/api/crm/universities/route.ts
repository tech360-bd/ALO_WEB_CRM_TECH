import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || '';
    const city = searchParams.get('city') || '';
    const level = searchParams.get('level') || '';
    const subject = searchParams.get('subject') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { status: 'active' };
    if (country) where.country = { contains: country };
    if (city) where.city = { contains: city };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
      ];
    }

    const [universities, total] = await Promise.all([
      db.crmUniversity.findMany({
        where,
        orderBy: [{ worldRanking: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.crmUniversity.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: universities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Universities API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch universities' }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}