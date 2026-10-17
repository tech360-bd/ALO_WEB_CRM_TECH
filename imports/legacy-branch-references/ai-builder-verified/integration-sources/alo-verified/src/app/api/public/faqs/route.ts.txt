import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Public FAQ API — no auth required.
 *
 * Returns ONLY published/active FAQ rows ordered by orderNum.
 *
 * Supports:
 *   ?category=<category>         (filter by category — e.g. "visa", "admission")
 *   ?search=<text>               (question / answer contains)
 *   ?limit=50                    (pagination size, max 100)
 *   ?page=1                      (pagination page)
 *
 * Response shape:
 *   {
 *     faqs: [...],
 *     categories: [{ name, count }],
 *     pagination: { page, limit, total, totalPages }
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10) || 50;
    const limit = Math.min(100, Math.max(1, limitParam));
    const category = searchParams.get('category')?.trim() || '';
    const search = searchParams.get('search')?.trim() || '';

    const where: Record<string, unknown> = {
      OR: [{ status: 'active' }, { status: 'published' }],
    };
    if (category) where.category = category;
    if (search) {
      const searchVariants = Array.from(
        new Set([search, search.toLowerCase(), search.toUpperCase()])
      );
      where.AND = [
        {
          OR: searchVariants.flatMap((s) => [
            { question: { contains: s } },
            { answer: { contains: s } },
          ]),
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [faqs, total, categoriesRaw] = await Promise.all([
      db.faq.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderNum: 'asc' },
        select: {
          id: true,
          question: true,
          answer: true,
          category: true,
          orderNum: true,
        },
      }),
      db.faq.count({ where }),
      db.faq.groupBy({
        by: ['category'],
        where: {
          OR: [{ status: 'active' }, { status: 'published' }],
          category: { not: null },
        },
        _count: { category: true },
      }),
    ]);

    return NextResponse.json({
      faqs,
      categories: categoriesRaw.map((c) => ({
        name: c.category,
        count: c._count.category,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('public/faqs GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
