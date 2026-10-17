import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
      ];
    }
    if (country) where.country = country;
    if (status) where.status = status;

    const [universities, total] = await Promise.all([
      db.university.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { courses: true, applications: true, scholarships: true } }
        }
      }),
      db.university.count({ where })
    ]);

    return NextResponse.json({
      universities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Universities GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.name || !body.country) {
      return NextResponse.json(
        { error: 'Name and country are required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const existingSlug = await db.university.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A university with this slug already exists' },
        { status: 409 }
      );
    }

    const university = await db.university.create({
      data: {
        name: body.name,
        slug,
        country: body.country,
        city: body.city || null,
        website: body.website || null,
        logoUrl: body.logoUrl || null,
        bannerUrl: body.bannerUrl || null,
        ranking: body.ranking || null,
        type: body.type || null,
        description: body.description || null,
        facilities: body.facilities || null,
        fees: body.fees || null,
        scholarshipAvailable: body.scholarshipAvailable || false,
        status: body.status || 'active',
      }
    });

    return NextResponse.json(university, { status: 201 });
  } catch (error) {
    console.error('Universities POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
