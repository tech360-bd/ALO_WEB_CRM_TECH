import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Explicit selects with NO commission fields
const COURSE_COMPARE_SELECT = {
  slug: true,
  name: true,
  countrySlug: true,
  city: true,
  level: true,
  subject: true,
  duration: true,
  intake: true,
  tuition: true,
  tuitionCurrency: true,
  scholarshipAvailable: true,
  englishRequirement: true,
  academicRequirement: true,
  gpaRequirement: true,
  deliveryMode: true,
  degreeType: true,
  universitySlug: true,
  university: {
    select: {
      name: true,
      slug: true,
      city: true,
      logo: true,
      countrySlug: true,
    },
  },
};

const UNIVERSITY_COMPARE_SELECT = {
  slug: true,
  name: true,
  countrySlug: true,
  city: true,
  ranking: true,
  studentsCount: true,
  tuitionRange: true,
  scholarshipAvailable: true,
  logo: true,
  country: {
    select: { name: true, shortName: true, flag: true, slug: true },
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemType, items, sessionId: bodySessionId } = body;

    if (!itemType || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['COURSE', 'UNIVERSITY'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid itemType' }, { status: 400 });
    }

    if (items.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 items' }, { status: 400 });
    }

    // Compare is client-side only — just return confirmation
    return NextResponse.json({ success: true, compared: items, count: items.length });
  } catch (error) {
    console.error('Compare POST error:', error);
    return NextResponse.json({ error: 'Failed to set compare list' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('itemType');
    const itemsParam = searchParams.get('items');

    if (!itemType || !itemsParam) {
      return NextResponse.json({ error: 'itemType and items required' }, { status: 400 });
    }

    if (!['COURSE', 'UNIVERSITY'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid itemType' }, { status: 400 });
    }

    const slugs = itemsParam.split(',').filter(Boolean).slice(0, 4);
    if (slugs.length === 0) {
      return NextResponse.json({ items: [] });
    }

    if (itemType === 'COURSE') {
      const courses = await db.coursePage.findMany({
        where: { slug: { in: slugs }, approvalStatus: 'PUBLISHED' },
        select: COURSE_COMPARE_SELECT,
      });
      return NextResponse.json({ items: courses, type: 'COURSE' });
    }

    const universities = await db.universityPage.findMany({
      where: { slug: { in: slugs }, approvalStatus: 'PUBLISHED' },
      select: UNIVERSITY_COMPARE_SELECT,
    });
    return NextResponse.json({ items: universities, type: 'UNIVERSITY' });
  } catch (error) {
    console.error('Compare GET error:', error);
    return NextResponse.json({ error: 'Failed to load compare data' }, { status: 500 });
  }
}
