import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth-middleware';
import { aiGateway, classify, summarize, chat } from '@/lib/ai-gateway';

const requestSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('generate'), prompt: z.string().min(1).max(16000), systemPrompt: z.string().max(4000).optional(), maxTokens: z.number().int().min(1).max(2000).optional() }).strict(),
  z.object({ op: z.literal('classify'), text: z.string().min(1).max(8000), labels: z.array(z.string().trim().min(1).max(100)).min(2).max(50) }).strict(),
  z.object({ op: z.literal('summarize'), text: z.string().min(1).max(16000), maxSentences: z.number().int().min(1).max(20).default(3) }).strict(),
  z.object({ op: z.literal('chat'), messages: z.array(z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string().min(1).max(4000) })).min(1).max(20) }).strict(),
]);

// Arbitrary workforce text/history may contain student or employee data. This
// browser-facing endpoint cannot downgrade privacy or inject model/endpoint/agent.
export const POST = withAuth(async req => {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid AI request' }, { status: 400 });
  const body = parsed.data;
  try {
    if (body.op === 'generate') return NextResponse.json({ success: true, data: await aiGateway({ prompt: body.prompt, systemPrompt: body.systemPrompt, maxTokens: body.maxTokens, privateData: true }) });
    if (body.op === 'classify') return NextResponse.json({ success: true, data: await classify(body.text, body.labels, { privateData: true }) });
    if (body.op === 'summarize') return NextResponse.json({ success: true, data: await summarize(body.text, body.maxSentences, { privateData: true }) });
    return NextResponse.json({ success: true, data: await chat(body.messages, { privateData: true }) });
  } catch {
    return NextResponse.json({ success: false, error: 'AI request unavailable or rejected by policy. Check server provider configuration and audit records.' }, { status: 503 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });

export async function GET() {
  return NextResponse.json({ gateway: 'ALO Education AI Gateway', ops: ['generate', 'classify', 'summarize', 'chat'], privacy: 'local-only workforce requests' });
}
