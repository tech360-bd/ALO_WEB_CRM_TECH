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
    const universityId = searchParams.get('universityId') || '';
    const level = searchParams.get('level') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { field: { contains: search } },
      ];
    }
    if (universityId) where.universityId = universityId;
    if (level) where.level = level;
    if (status) where.status = status;

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          university: { select: { id: true, name: true, country: true, city: true } },
          _count: { select: { applications: true } }
        }
      }),
      db.course.count({ where })
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Courses GET error:', error);
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

    if (!body.name || !body.universityId) {
      return NextResponse.json(
        { error: 'Name and university ID are required' },
        { status: 400 }
      );
    }

    const course = await db.course.create({
      data: {
        universityId: body.universityId,
        name: body.name,
        slug: body.slug || null,
        level: body.level || null,
        field: body.field || null,
        duration: body.duration || null,
        tuitionFee: body.tuitionFee || null,
        currency: body.currency || 'GBP',
        entryRequirements: body.entryRequirements || null,
        englishRequirement: body.englishRequirement || null,
        scholarshipAvailable: body.scholarshipAvailable || false,
        description: body.description || null,
        careerPaths: body.careerPaths || null,
        status: body.status || 'active',
      },
      include: {
        university: true,
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Courses POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
