import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOptionalAuth } from '@/lib/auth-middleware';

// GET /api/faqs — unified FAQ system database-driven
// Filters: category (Admission, Course, University, Scholarship, Visa, English Test, Application, Finance, Accommodation, Student Life), targetType, targetSlug, search
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');
    const targetType = req.nextUrl.searchParams.get('targetType');
    const targetSlug = req.nextUrl.searchParams.get('targetSlug');
    const search = req.nextUrl.searchParams.get('search');
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 200);

    const where: any = { status: 'active' };
    if (category) where.category = category;
    if (targetType) where.targetType = targetType;
    if (targetSlug) where.targetSlug = targetSlug;
    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Try unified FAQs first
    let faqs = await db.unifiedFaq.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      take: limit,
    }).catch(() => []);

    // Fallback to homepage FAQs if no unified
    if (faqs.length === 0 && !targetType) {
      const homeFaqs = await db.homepageFaq.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
        take: limit,
      }).catch(() => []);
      faqs = homeFaqs.map((f: any) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: 'general',
        targetType: 'general',
        targetSlug: '',
        verificationStatus: 'verified',
        lastVerifiedAt: f.createdAt,
        sortOrder: f.sortOrder,
      }));
    }

    // Fallback to country FAQs
    if (faqs.length === 0 && targetSlug) {
      const country = await db.country.findFirst({ where: { slug: targetSlug } }).catch(() => null);
      if (country) {
        const countryFaqs = await db.countryFaq.findMany({
          where: { countryId: country.id, status: 'active' },
          orderBy: { sortOrder: 'asc' },
          take: limit,
        }).catch(() => []);
        faqs = countryFaqs.map((f: any) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          category: 'general',
          targetType: 'country',
          targetSlug,
          verificationStatus: 'verified',
          lastVerifiedAt: f.updatedAt,
          sortOrder: f.sortOrder,
        }));
      }
    }

    return NextResponse.json({ faqs, total: faqs.length, success: true });
  } catch (err: any) {
    console.error('[faqs.list] error', err);
    return NextResponse.json({ error: 'Failed to list FAQs', detail: err.message }, { status: 500 });
  }
}

// POST /api/faqs — create FAQ (admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, answer, category = 'general', targetType = 'general', targetId = '', targetSlug = '', tags = [], sourceUrl = '', sourceName = '', verificationStatus = 'pending', status = 'active', sortOrder = 0 } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'question and answer required' }, { status: 400 });
    }

    const faq = await db.unifiedFaq.create({
      data: {
        question,
        answer,
        category,
        targetType,
        targetId,
        targetSlug,
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags),
        sourceUrl,
        sourceName,
        verificationStatus,
        status,
        sortOrder,
      },
    });

    return NextResponse.json({ faq, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[faqs.create] error', err);
    return NextResponse.json({ error: 'Failed to create FAQ', detail: err.message }, { status: 500 });
  }
}
