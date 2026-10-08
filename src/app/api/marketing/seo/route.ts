import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { generateText } from '@/lib/ai';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// ─── GET: List SEO content (draft/approval queue) ────────────────────────────
//
// The SEO Manager screen needs a real list to render. Everything returned here
// is a persisted MarketingGeneratedContent row — nothing is synthesised, so an
// empty database yields an empty list rather than placeholder rows.

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.trim() || '';
    const contentType = searchParams.get('contentType')?.trim() || '';
    const search = searchParams.get('search')?.trim() || '';
    const limitRaw = Number(searchParams.get('limit') || '50');
    const limit = Number.isSafeInteger(limitRaw) && limitRaw >= 1 && limitRaw <= 100 ? limitRaw : 50;

    const where: Record<string, unknown> = {};
    if (status && ['draft', 'pending', 'approved', 'rejected'].includes(status)) where.status = status;
    if (contentType) where.contentType = contentType;
    if (search && search.length <= 100) {
      where.OR = [{ title: { contains: search } }, { topic: { contains: search } }];
    }

    const [items, total] = await Promise.all([
      db.marketingGeneratedContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        // body can be large markdown; the list view does not need it.
        select: {
          id: true,
          contentType: true,
          topic: true,
          title: true,
          language: true,
          targetCountry: true,
          targetCourse: true,
          status: true,
          publishedAt: true,
          approvedAt: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.marketingGeneratedContent.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: items, total });
  } catch (error) {
    console.error('SEO GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, MARKETING_AUTH);

// ─── POST: Generate SEO content or approve ───────────────────────────────────

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const body = await request.json();

    if (action === 'generate') {
      return handleGenerate(body, auth);
    }
    if (action === 'approve') {
      return handleApprove(body, auth);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=generate or ?action=approve' },
      { status: 400 }
    );
  } catch (error) {
    console.error('SEO POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

// ─── Generate SEO Content ─────────────────────────────────────────────────────

type SEOTopicType =
  | 'country_page'
  | 'course_page'
  | 'university_page'
  | 'scholarship_page'
  | 'blog_topic';

interface SEOGenerateInput {
  topicType: SEOTopicType;
  topic: string;
  country?: string;
  course?: string;
  university?: string;
  targetKeywords?: string[];
  language?: string;
}

const TOPIC_TYPE_PROMPTS: Record<SEOTopicType, string> = {
  country_page: 'a comprehensive country guide page for Bangladeshi students wanting to study in that country',
  course_page: 'a detailed course/program page that helps students understand the course, requirements, and career prospects',
  university_page: 'a university profile page highlighting programs, rankings, entry requirements, and scholarship opportunities',
  scholarship_page: 'a scholarship information page with eligibility criteria, application process, deadlines, and tips',
  blog_topic: 'an informative and SEO-optimized blog post that educates and drives organic traffic',
};

async function handleGenerate(body: SEOGenerateInput, auth: AuthContext) {
  const {
    topicType,
    topic = '',
    country = '',
    course = '',
    university = '',
    targetKeywords = [],
    language = 'english',
  } = body;

  if (!topicType || !topic) {
    return NextResponse.json(
      { error: 'topicType and topic are required' },
      { status: 400 }
    );
  }

  const pageDescription = TOPIC_TYPE_PROMPTS[topicType] || 'an SEO-optimized page';

  const prompt = `You are an expert SEO content writer for ALO Education, a study abroad consultancy in Bangladesh.

Generate ${pageDescription} about: "${topic}"
${country ? `Country: ${country}` : ''}
${course ? `Course: ${course}` : ''}
${university ? `University: ${university}` : ''}
Target Keywords: ${targetKeywords.join(', ') || 'derived from the topic'}
Language: ${language}

Return a JSON object with:
- "title": An SEO-optimized title (60-70 characters) including the primary keyword
- "body": The full page content in markdown format with proper H1, H2, H3 structure. Include:
  - Meta description (155-160 chars)
  - Introduction section
  - Main content sections with detailed information
  - Key statistics or data points where relevant
  - FAQ section with 5-7 common questions and answers
  - Internal linking suggestions
  - CTA sections for ALO Education services
  Ensure content is comprehensive (800-2000 words), engaging, and optimized for search engines.

Return ONLY the JSON object, no other text.`;

  const result = await generateText({ prompt, model: 'glm-4-flash' });

  let generated: { title: string; body: string };
  try {
    let jsonStr = result.text || '';
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    generated = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI-generated SEO content' },
      { status: 500 }
    );
  }

  const createdById = auth.userId;
  const content = await db.marketingGeneratedContent.create({
    data: {
      contentType: topicType === 'blog_topic' ? 'blog_post' : 'landing_page',
      topic,
      keywords: JSON.stringify(targetKeywords),
      language,
      platform: 'website',
      tone: 'professional',
      cta: 'Contact ALO Education for free counseling and application support',
      approvalRequired: true,
      targetCountry: country,
      targetCourse: course,
      title: generated.title || '',
      body: generated.body || '',
      status: 'draft',
      createdById,
    },
  });

  await db.marketingApproval.create({
    data: {
      itemType: 'MarketingGeneratedContent',
      itemId: content.id,
      title: `SEO Content: ${content.title || topic}`,
      description: `${topicType} - ${topic}`,
      status: 'pending',
      requestedById: createdById,
    },
  });

  await createAuditLog({
    userId: createdById,
    role: auth.roles[0] || 'marketing',
    action: 'seo.generate',
    resource: 'MarketingGeneratedContent',
    resourceId: content.id,
    details: { topicType, topic, country, course },
  });

  return NextResponse.json({ content }, { status: 201 });
}

// ─── Approve SEO Content ──────────────────────────────────────────────────────

interface SEOApproveInput {
  contentId: string;
}

async function handleApprove(body: SEOApproveInput, auth: AuthContext) {
  const { contentId } = body;

  if (!contentId) {
    return NextResponse.json(
      { error: 'contentId is required' },
      { status: 400 }
    );
  }

  const content = await db.marketingGeneratedContent.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    return NextResponse.json(
      { error: 'Content not found' },
      { status: 404 }
    );
  }

  const now = new Date();
  const approvedById = auth.userId;

  const updatedContent = await db.marketingGeneratedContent.update({
    where: { id: contentId },
    data: {
      status: 'approved',
      approvedById,
      approvedAt: now,
    },
  });

  await db.marketingApproval.updateMany({
    where: {
      itemType: 'MarketingGeneratedContent',
      itemId: contentId,
      status: 'pending',
    },
    data: {
      status: 'approved',
      reviewedById: approvedById,
      reviewedAt: now,
    },
  });

  await createAuditLog({
    userId: approvedById,
    role: auth.roles[0] || 'marketing',
    action: 'seo.approve',
    resource: 'MarketingGeneratedContent',
    resourceId: contentId,
    details: { title: content.title, topic: content.topic },
  });

  return NextResponse.json({ content: updatedContent });
}
