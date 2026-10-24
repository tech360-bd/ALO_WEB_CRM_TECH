import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { writePortalAudit } from '@/lib/transactional-audit';
import { DiagramDraftSchema } from '@/lib/diagrams/editable';
const Input = z.object({ id: z.string().min(1).max(191).optional(), expectedUpdatedAt: z.string().datetime().optional(), draft: DiagramDraftSchema }).strict().refine(input => !input.id || !!input.expectedUpdatedAt);
const category = 'alo-diagram-draft-v1';
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req); if (auth instanceof NextResponse) return auth;
    const access = await validateRequestAccess({ userId: auth.userId }, 'employee.diagrams', 'view', { ownerId: auth.userId });
    if (!access.allowed) return NextResponse.json({ success: false, error: 'Diagram view permission required.' }, { status: 403 });
    const page = Math.min(1000, Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1));
    const drafts = await db.marketingTemplate.findMany({ where: { category, createdById: auth.userId }, orderBy: { updatedAt: 'desc' }, take: 20, skip: (page - 1) * 20 });
    return NextResponse.json({ success: true, drafts, page });
  } catch { return NextResponse.json({ success: false, error: 'Saved diagrams unavailable.' }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req); if (auth instanceof NextResponse) return auth;
    const input = Input.safeParse(await req.json().catch(() => null));
    if (!input.success) return NextResponse.json({ success: false, error: 'Invalid diagram draft or missing revision timestamp.' }, { status: 400 });
    const { id, expectedUpdatedAt, draft } = input.data;
    const access = await validateRequestAccess({ userId: auth.userId }, 'employee.diagrams', id ? 'edit' : 'create', { ownerId: auth.userId });
    if (!access.allowed) return NextResponse.json({ success: false, error: 'Diagram draft permission required.' }, { status: 403 });
    const result = await db.$transaction(async tx => {
      const previous = id ? await tx.marketingTemplate.findUnique({ where: { id } }) : null;
      // Even global grants cannot overwrite another author's private draft.
      if (id && (!previous || previous.category !== category || previous.createdById !== auth.userId)) return { status: 404 };
      if (previous && previous.updatedAt.toISOString() !== expectedUpdatedAt) return { status: 409 };
      const fields = { name: draft.title, type: draft.type, platform: 'internal', content: JSON.stringify(draft), category, status: 'draft' };
      if (id) {
        const changed = await tx.marketingTemplate.updateMany({ where: { id, createdById: auth.userId, updatedAt: new Date(expectedUpdatedAt!) }, data: fields });
        if (changed.count !== 1) return { status: 409 };
      }
      const saved = id ? await tx.marketingTemplate.findUniqueOrThrow({ where: { id } }) : await tx.marketingTemplate.create({ data: { ...fields, createdById: auth.userId } });
      await writePortalAudit(tx, auth, id ? 'DIAGRAM_DRAFT_UPDATED' : 'DIAGRAM_DRAFT_CREATED', 'MarketingTemplate', saved.id, { previous, current: saved }, req);
      return { status: id ? 200 : 201, data: saved };
    });
    if (!result.data) return NextResponse.json({ success: false, error: result.status === 409 ? 'Draft changed. Reload before saving.' : 'Diagram not found.' }, { status: result.status });
    return NextResponse.json({ success: true, data: result.data }, { status: result.status });
  } catch { return NextResponse.json({ success: false, error: 'Diagram could not be saved and audited.' }, { status: 503 }); }
}
