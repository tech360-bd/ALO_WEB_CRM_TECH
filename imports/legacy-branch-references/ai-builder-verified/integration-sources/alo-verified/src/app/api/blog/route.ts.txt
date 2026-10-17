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
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const authorId = searchParams.get('authorId') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.blogPost.count({ where })
    ]);

    // Get categories
    const categories = await db.blogPost.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: { category: true }
    });

    return NextResponse.json({
      posts,
      categories: categories.map(c => ({ name: c.category, count: c._count.category })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Blog GET error:', error);
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

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const existingSlug = await db.blogPost.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A blog post with this slug already exists' },
        { status: 409 }
      );
    }

    const post = await db.blogPost.create({
      data: {
        title: body.title,
        slug,
        excerpt: body.excerpt || null,
        content: body.content || null,
        featuredImage: body.featuredImage || null,
        category: body.category || null,
        tags: body.tags || null,
        authorId: body.authorId || null,
        status: body.status || 'draft',
        publishedAt: body.status === 'published' ? new Date() : null,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Blog POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
