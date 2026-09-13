import { NextRequest, NextResponse } from 'next/server';
import { getRelatedContent } from '@/lib/university-course/unified-service';

// GET /api/related-content — related information engine per spec section 8
// Params: sourceType, sourceId, sourceSlug, country, universityId, subjectArea, studyLevel, limit
export async function GET(req: NextRequest) {
  try {
    const sourceType = req.nextUrl.searchParams.get('sourceType') || 'university';
    const sourceId = req.nextUrl.searchParams.get('sourceId') || '';
    const sourceSlug = req.nextUrl.searchParams.get('sourceSlug') || '';
    const country = req.nextUrl.searchParams.get('country') || undefined;
    const universityId = req.nextUrl.searchParams.get('universityId') || undefined;
    const subjectArea = req.nextUrl.searchParams.get('subjectArea') || undefined;
    const studyLevel = req.nextUrl.searchParams.get('studyLevel') || undefined;
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '8', 10), 20);

    if (!sourceId && !sourceSlug) {
      return NextResponse.json({ success: false, error: 'sourceId or sourceSlug required' }, { status: 400 });
    }

    const related = await getRelatedContent(sourceType, sourceId, sourceSlug, { country, universityId, subjectArea, studyLevel, limit });

    return NextResponse.json({
      success: true,
      sourceType,
      sourceId,
      sourceSlug,
      related,
      total: related.length,
      message: related.length === 0 ? 'No related content found. Real DB will populate based on country/university/course/subject/tags priority.' : `${related.length} related items found via priority: exact > same university > same country > same subject > same destination > same tag`,
    });
  } catch (err: any) {
    console.error('[related-content] error', err);
    return NextResponse.json({ error: 'Failed to fetch related content', detail: err.message }, { status: 500 });
  }
}
