import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { generateText } from '@/lib/ai';
import { AuthContext } from '@/lib/auth-middleware';
import { isMarketingManager, withMarketingAccess } from '@/lib/marketing/access';

// ─── POST: Generate video script or generate assets ──────────────────────────

export const POST = withMarketingAccess(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const body = await request.json();

    if (action === 'script') {
      return handleScript(body, auth);
    }
    if (action === 'generate') {
      return handleGenerate(body, auth);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=script or ?action=generate' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Video POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'draft-post');

// ─── Generate Video Script ────────────────────────────────────────────────────

interface ScriptInput {
  title: string;
  topic: string;
  language?: string;
  platform?: string;
  duration?: number;
}

async function handleScript(body: ScriptInput, auth: AuthContext) {
  const {
    title = '',
    topic = '',
    language = 'english',
    platform = 'facebook',
    duration = 60,
  } = body;

  if (!title || !topic) {
    return NextResponse.json(
      { error: 'title and topic are required' },
      { status: 400 }
    );
  }

  const prompt = `You are an expert video scriptwriter for ALO Education, a study abroad consultancy in Bangladesh.

Create a ${duration}-second video script for:
Title: "${title}"
Topic: ${topic}
Language: ${language}
Platform: ${platform}

Return a JSON object with:
- "script": The complete video script with scene-by-scene breakdown. Each scene should have:
  - Scene number
  - Visual description (what's on screen)
  - Voiceover/narration text
  - On-screen text/captions
  - Duration in seconds
- "subtitle": A clean subtitle/CC text version of the full narration
- "thumbnailConcept": A detailed description for an eye-catching thumbnail that maximizes click-through rate

Return ONLY the JSON object, no other text.`;

  const result = await generateText({ prompt, model: 'glm-4-flash' });

  let generated: { script: string; subtitle: string; thumbnailConcept: string };
  try {
    let jsonStr = result.text || '';
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    generated = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI-generated video script' },
      { status: 500 }
    );
  }

  const createdById = auth.userId;
  const video = await db.marketingVideo.create({
    data: {
      title,
      script: generated.script,
      subtitle: generated.subtitle || '',
      thumbnail: generated.thumbnailConcept || '',
      platform,
      status: 'draft',
      createdById,
    },
  });

  await db.marketingApproval.create({
    data: {
      itemType: 'MarketingVideo',
      itemId: video.id,
      title: `Video: ${title}`,
      description: `${language} video script for ${platform}`,
      status: 'pending',
      requestedById: createdById,
    },
  });

  await createAuditLog({
    userId: createdById,
    role: auth.roles[0] || 'marketing',
    action: 'video.create_script',
    resource: 'MarketingVideo',
    resourceId: video.id,
    details: { title, topic, language, platform },
  });

  return NextResponse.json({ video }, { status: 201 });
}

// ─── Generate Additional Video Assets ─────────────────────────────────────────

interface GenerateAssetsInput {
  videoId: string;
}

async function handleGenerate(body: GenerateAssetsInput, auth: AuthContext) {
  const { videoId } = body;

  if (!videoId) {
    return NextResponse.json(
      { error: 'videoId is required' },
      { status: 400 }
    );
  }

  const video = await db.marketingVideo.findUnique({
    where: { id: videoId },
  });

  if (!video) {
    return NextResponse.json(
      { error: 'Video not found' },
      { status: 404 }
    );
  }
  if (!isMarketingManager(auth) && video.createdById !== auth.userId) {
    return NextResponse.json({ success: false, error: 'You may only generate assets for your own video draft.' }, { status: 403 });
  }

  const prompt = `You are a video production assistant for ALO Education.

Based on this video:
Title: "${video.title}"
Script: "${video.script}"
Platform: ${video.platform}

Generate additional production assets:

Return a JSON object with:
- "thumbnailConcept": An enhanced, detailed thumbnail concept that will maximize CTR. Describe colors, text overlay, facial expressions (if people), and composition.
- "subtitle": An optimized subtitle/CC text with proper timing markers and emoji suggestions for social media.

Return ONLY the JSON object, no other text.`;

  const result = await generateText({ prompt, model: 'glm-4-flash' });

  let generated: { thumbnailConcept: string; subtitle: string };
  try {
    let jsonStr = result.text || '';
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    generated = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI-generated video assets' },
      { status: 500 }
    );
  }

  const updatedVideo = await db.marketingVideo.update({
    where: { id: videoId },
    data: {
      thumbnail: generated.thumbnailConcept || video.thumbnail,
      subtitle: generated.subtitle || video.subtitle,
    },
  });

  await createAuditLog({
    userId: auth.userId,
    role: auth.roles[0] || 'marketing',
    action: 'video.generate_assets',
    resource: 'MarketingVideo',
    resourceId: videoId,
    details: { title: video.title },
  });

  return NextResponse.json({ video: updatedVideo });
}
