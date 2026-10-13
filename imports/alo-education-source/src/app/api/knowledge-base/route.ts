import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isErrorResponse, parsePagination, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// CONFIGURATION_REQUIRED: No KnowledgeBase Prisma model exists yet.
// This route uses an in-memory array for now. Once a KnowledgeBase model is
// added to prisma/schema.prisma, migrate this to use db.knowledgeBase.
// ============================================================================

interface KbArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store (survives until server restart)
const kbStore: KbArticle[] = [];

const createArticleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  content: z.string().min(10, 'Content must be at least 10 characters.'),
  category: z.string().optional().default('General'),
  tags: z.array(z.string()).optional().default([]),
});

// GET — List articles
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;

    const search = sp.get('search')?.trim().toLowerCase() || '';
    const category = sp.get('category')?.trim();

    let filtered = kbStore.filter((a) => a.status === 'PUBLISHED');

    if (category) {
      filtered = filtered.filter((a) => a.category === category);
    }
    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.content.toLowerCase().includes(search),
      );
    }

    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = filtered.length;
    const data = filtered.slice(skip, skip + limit);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch knowledge base articles.' },
      { status: 500 },
    );
  }
}

// POST — Create article (SUPER_ADMIN, ADMIN only)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Requires SUPER_ADMIN or ADMIN role.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const article: KbArticle = {
      id: `kb_${Date.now()}`,
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category,
      tags: parsed.data.tags,
      status: 'PUBLISHED',
      authorId: auth.user.id,
      createdAt: now,
      updatedAt: now,
    };

    kbStore.push(article);

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'KnowledgeBase',
      resourceId: article.id,
      details: { title: article.title, category: article.category },
    });

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge base article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create article.' },
      { status: 500 },
    );
  }
}
