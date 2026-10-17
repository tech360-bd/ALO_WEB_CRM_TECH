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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const pages = await db.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Pages GET error:', error);
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
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingSlug = await db.page.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 });
    }

    const page = await db.page.create({
      data: {
        title: body.title,
        slug,
        content: body.content || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        template: body.template || null,
        status: body.status || 'draft',
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Pages POST error:', error);
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
    if (body.title !== undefined) data.title = body.title;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.content !== undefined) data.content = body.content;
    if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription;
    if (body.template !== undefined) data.template = body.template;
    if (body.status !== undefined) data.status = body.status;

    const page = await db.page.update({
      where: { id: body.id },
      data,
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Pages PUT error:', error);
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

    await db.page.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pages DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
