import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { loadUnoFreeModels, unoRouterConfiguration, UnoRouterError } from '@/lib/ai-providers/unorouter';
import { readOwnerChat, runOwnerChat } from '@/lib/ai-providers/owner-chat';
function json(body: unknown, init: Parameters<typeof NextResponse.json>[1] = {}) { return NextResponse.json(body, { ...init, headers: { ...init.headers, 'Cache-Control': 'private, no-store' } }); }
export const dynamic = 'force-dynamic';
const Input = z.object({ requestId: z.string().uuid(), conversationId: z.string().uuid(), provider: z.enum(['local','unorouter']), model: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(4000), externalConsent: z.boolean().default(false) }).strict();
async function owner(req: NextRequest) {
  const auth = await authenticateRequest(req); if (auth instanceof NextResponse) return auth;
  if (auth.actingAsSessionId || auth.actorUserId !== auth.userId || ['STUDENT','PARTNER'].includes(auth.userType.toUpperCase()) || ![auth.userType, ...auth.roles].some(role => role.toUpperCase() === 'SUPER_ADMIN')) return json({ success: false, error: 'A non-acting Super Admin session is required.' }, { status: 403 });
  const access = await validateRequestAccess({ userId: auth.userId }, 'ai.owner.chat', 'manage', { ownerId: auth.userId });
  if (!access.allowed) return json({ success: false, error: 'AI owner access is not available.' }, { status: 403 });
  return auth;
}
function failure(error: unknown) {
  const known = error instanceof UnoRouterError;
  return json({ success: false, code: known ? error.code : 'CHAT_UNAVAILABLE', error: known ? error.message : 'Owner AI chat is unavailable. No production action was executed.' }, { status: known ? error.status : 503, headers: known && error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {} });
}
export async function GET(req: NextRequest) {
  try {
    const auth = await owner(req); if (auth instanceof NextResponse) return auth;
    const conversation = req.nextUrl.searchParams.get('conversationId');
    if (conversation && !z.string().uuid().safeParse(conversation).success) return json({ success: false, error: 'Invalid conversation ID.' }, { status: 400 });
    const config = unoRouterConfiguration(); let models: Awaited<ReturnType<typeof loadUnoFreeModels>> = []; let catalogError: string | null = null;
    if (config.enabled) { try { models = await loadUnoFreeModels(); } catch { catalogError = 'Free model catalog is unavailable. No remote inference is enabled without pricing verification.'; } }
    const history = await readOwnerChat(auth, conversation || undefined);
    return json({ success: true, ...history, local: { configured: !!process.env.LOCAL_AI_URL && !!process.env.LOCAL_AI_MODEL, model: process.env.LOCAL_AI_MODEL || null }, unorouter: { ...config, models, catalogError }, policy: { freeOnly: true, paidFallbackAllowed: false, automaticCrmContext: false, toolsEnabled: false } });
  } catch (error) { return failure(error); }
}
export async function POST(req: NextRequest) {
  try {
    const auth = await owner(req); if (auth instanceof NextResponse) return auth;
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(process.env.NEXTAUTH_URL || req.url).origin) return json({ success: false, error: 'Cross-origin AI request denied.' }, { status: 403 });
    const parsed = Input.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ success: false, error: 'Invalid owner chat message, model or request identifiers.' }, { status: 400 });
    const result = await runOwnerChat(auth, parsed.data);
    return json({ success: result.status !== 'FAILED', ...result }, { status: result.status === 'RUNNING' ? 202 : result.status === 'FAILED' ? 503 : 200 });
  } catch (error) { return failure(error); }
}
