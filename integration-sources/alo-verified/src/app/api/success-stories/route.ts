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
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { studentName: { contains: search } },
        { university: { contains: search } },
        { story: { contains: search } },
      ];
    }

    const stories = await db.successStory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Success Stories GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    if (!body.studentName) {
      return NextResponse.json({ error: 'Student name is required' }, { status: 400 });
    }

    const story = await db.successStory.create({
      data: {
        studentName: body.studentName,
        university: body.university || null,
        course: body.course || null,
        country: body.country || null,
        story: body.story || null,
        photoUrl: body.photoUrl || null,
        videoUrl: body.videoUrl || null,
        status: body.status || 'active',
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error('Success Stories POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.studentName !== undefined) data.studentName = body.studentName;
    if (body.university !== undefined) data.university = body.university;
    if (body.course !== undefined) data.course = body.course;
    if (body.country !== undefined) data.country = body.country;
    if (body.story !== undefined) data.story = body.story;
    if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl;
    if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl;
    if (body.status !== undefined) data.status = body.status;

    const story = await db.successStory.update({
      where: { id: body.id },
      data,
    });

    return NextResponse.json(story);
  } catch (error) {
    console.error('Success Stories PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.successStory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Success Stories DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
