// ============================================================
// /api/website/cms-content — PUBLIC read endpoint for the
// Virtual Editor's site-wide & CRM managed content.
//
// Returns ONLY published items for the requested type. Drafts are
// never exposed publicly. Data was sanitized at write time; this
// endpoint re-sanitizes defensively and strips non-public fields.
//
// GET /api/website/cms-content?type=footer            → published footer items
// GET /api/website/cms-content?type=seo-meta&key=...  → specific SEO record
// ============================================================

import { NextResponse } from 'next/server';
import { getPublishedContent, MANAGED_CONTENT_TYPES } from '@/lib/cms-managed-content';
import { sanitizeCmsInput } from '@/lib/cms-revisions';

export const revalidate = 60; // short public cache; publishes appear within a minute

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? '';
  const key = searchParams.get('key') ?? undefined;

  if (!(MANAGED_CONTENT_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json(
      { success: false, error: `type must be one of: ${MANAGED_CONTENT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const items = await getPublishedContent(type, key);
    return NextResponse.json({
      success: true,
      type,
      items: sanitizeCmsInput(items),
    });
  } catch {
    // never leak DB errors publicly
    return NextResponse.json({ success: false, error: 'Content temporarily unavailable' }, { status: 503 });
  }
}
