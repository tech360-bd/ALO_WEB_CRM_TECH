import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { generateText } from '@/lib/ai';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

// ─── POST: Generate content ideas or generate content ─────────────────────────

export const POST = withMarketingAccess(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const body = await request.json();

    if (action === 'ideas') {
      return handleIdeas(body, auth);
    }
    if (action === 'generate') {
      return handleGenerate(body, auth);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=ideas or ?action=generate' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Content POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'draft-post');

// ─── Generate Content Ideas ───────────────────────────────────────────────────

interface IdeasInput {
  keyword?: string;
  country?: string;
  course?: string;
  platform?: string;
  language?: string;
  audienceType?: string;
  funnelStage?: string;
}

async function handleIdeas(body: IdeasInput, auth: AuthContext) {
  const {
    keyword = '',
    country = '',
    course = '',
    platform = 'facebook',
    language = 'english',
    audienceType = '',
    funnelStage = 'awareness',
  } = body;

  if (!keyword) {
    return NextResponse.json(
      { error: 'keyword is required' },
      { status: 400 }
    );
  }

  const prompt = `You are a creative content strategist for ALO Education, a study abroad consultancy in Bangladesh.

Generate 5 creative content ideas based on:
- Keyword/Topic: ${keyword}
- Target Country: ${country || 'Any'}
- Target Course: ${course || 'Any'}
- Platform: ${platform}
- Language: ${language}
- Audience: ${audienceType || 'Bangladeshi students interested in studying abroad'}
- Funnel Stage: ${funnelStage}

For each idea, return a JSON array of objects with:
- "title": A catchy, attention-grabbing title
- "description": A brief 2-3 sentence description of the content idea
- "ideaType": One of: post, reel, story, carousel, video, blog, poll, quiz, testimonial, infographics, live_session, giveaway, challenge
- "trending": boolean - whether this leverages a current trend

Return ONLY the JSON array, no other text.`;

  const result = await generateText({ prompt, model: 'glm-4-flash' });

  let ideas: Array<{
    title: string;
    description: string;
    ideaType: string;
    trending: boolean;
  }>;

  try {
    let jsonStr = result.text || '';
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    ideas = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI-generated ideas' },
      { status: 500 }
    );
  }

  const createdById = auth.userId;
  const savedIdeas = await Promise.all(
    ideas.map((idea) =>
      db.marketingContentIdea.create({
        data: {
          keyword,
          country,
          course,
          language,
          platform,
          audienceType,
          funnelStage,
          ideaType: idea.ideaType,
          title: idea.title,
          description: idea.description,
          trending: idea.trending,
          status: 'new',
          createdById,
        },
      })
    )
  );

  return NextResponse.json({ ideas: savedIdeas }, { status: 201 });
}

// ─── Generate Full Content ────────────────────────────────────────────────────

interface GenerateContentInput {
  contentType?: string;
  topic?: string;
  keywords?: string[];
  language?: string;
  platform?: string;
  tone?: string;
  cta?: string;
  includeImage?: boolean;
  includeVideo?: boolean;
  variations?: number;
  approvalRequired?: boolean;
  targetCountry?: string;
  targetCourse?: string;
  targetStudentType?: string;
  campaignId?: string;
}

async function handleGenerate(body: GenerateContentInput, auth: AuthContext) {
  const {
    contentType = 'social_post',
    topic = '',
    keywords = [],
    language = 'english',
    platform = 'facebook',
    tone = 'professional',
    cta = '',
    includeImage = false,
    includeVideo = false,
    variations = 1,
    approvalRequired = true,
    targetCountry = '',
    targetCourse = '',
    targetStudentType = '',
    campaignId,
  } = body;

  if (!topic) {
    return NextResponse.json(
      { error: 'topic is required' },
      { status: 400 }
    );
  }

  const prompt = `You are an expert education marketing content creator for ALO Education, a study abroad consultancy in Bangladesh.

Generate a ${contentType} with the following specifications:
- Topic: ${topic}
- Keywords: ${keywords.join(', ') || 'None specified'}
- Language: ${language}
- Platform: ${platform}
- Tone: ${tone}
- Call to Action: ${cta || 'Contact ALO Education for counseling'}
- Include Image Description: ${includeImage}
- Include Video Concept: ${includeVideo}
- Target Country: ${targetCountry || 'Any'}
- Target Course: ${targetCourse || 'Any'}
- Target Student: ${targetStudentType || 'Bangladeshi students'}

Return a JSON object with:
- "title": A compelling title for the content
- "body": The full content body/markdown

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
      { error: 'Failed to parse AI-generated content' },
      { status: 500 }
    );
  }

  const contentStatus = approvalRequired ? 'pending_approval' : 'draft';
  const createdById = auth.userId;

  const content = await db.marketingGeneratedContent.create({
    data: {
      contentType,
      topic,
      keywords: JSON.stringify(keywords),
      language,
      platform,
      tone,
      cta,
      includeImage,
      includeVideo,
      variations,
      approvalRequired,
      targetCountry,
      targetCourse,
      targetStudentType,
      campaignId,
      title: generated.title || '',
      body: generated.body || '',
      status: contentStatus,
      createdById,
    },
  });

  if (approvalRequired) {
    await db.marketingApproval.create({
      data: {
        itemType: 'MarketingGeneratedContent',
        itemId: content.id,
        title: `Content: ${content.title || content.topic}`,
        description: `${contentType} for ${platform} in ${language}`,
        status: 'pending',
        requestedById: createdById,
      },
    });
  }

  await createAuditLog({
    userId: createdById,
    role: auth.roles[0] || 'marketing',
    action: 'content.generate',
    resource: 'MarketingGeneratedContent',
    resourceId: content.id,
    details: { contentType, topic, platform, language, approvalRequired },
  });

  return NextResponse.json({ content }, { status: 201 });
}
