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
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (category) where.category = category;
    if (source) where.source = source;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [entries, total] = await Promise.all([
      db.knowledgeBase.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.knowledgeBase.count({ where }),
    ]);

    return NextResponse.json({ entries, total, page, limit });
  } catch (error) {
    console.error('Knowledge GET error:', error);
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
    const { title, content, category, source, tags, action } = body;

    if (action === 'bulk_import' && body.entries) {
      const results = [];
      for (const entry of body.entries) {
        const created = await db.knowledgeBase.create({
          data: {
            title: entry.title,
            content: entry.content,
            category: entry.category || 'General',
            source: entry.source || 'manual',
            status: 'pending',
            tags: entry.tags ? JSON.stringify(entry.tags) : null,
          } as any,
        });
        results.push(created);
      }
      return NextResponse.json({ success: true, count: results.length });
    }

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content, and category are required' }, { status: 400 });
    }

    const entry = await db.knowledgeBase.create({
      data: {
        title,
        content,
        category,
        source: source || 'manual',
        status: 'pending',
        tags: tags ? JSON.stringify(tags) : null,
      } as any,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Knowledge POST error:', error);
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
    const { id, title, content, category, source, status, tags, approvedBy } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (category !== undefined) data.category = category;
    if (source !== undefined) data.source = source;
    if (status !== undefined) data.status = status;
    if (tags !== undefined) data.tags = JSON.stringify(tags);
    if (approvedBy !== undefined) data.approvedBy = approvedBy;

    const entry = await db.knowledgeBase.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Knowledge PUT error:', error);
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

    await db.knowledgeBase.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Knowledge DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
