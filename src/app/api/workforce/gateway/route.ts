import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { aiGateway, classify, summarize } from '@/lib/ai-gateway';

// POST /api/workforce/gateway { op: 'generate'|'classify'|'summarize'|'chat', prompt, ... }
// Centralized AI Gateway—refuses to expose secrets; all calls are server-side via GROQ_API_KEY.
export async function POST(req: Request) {
  return withAuth(async ()=>{
    const body = await req.json().catch(()=>({}));
    const op = body.op || 'generate';
    try {
      if (op==='generate') {
        if (!body.prompt) return NextResponse.json({ success:false, error:'prompt required' }, { status:400 });
        const res = await aiGateway({ prompt: String(body.prompt), systemPrompt: body.systemPrompt, taskType: body.taskType, department: body.department, maxTokens: body.maxTokens, temperature: body.temperature });
        return NextResponse.json({ success:true, data: { text: res.text, provider: res.provider, model: res.model, usage: res.usage, latencyMs: res.latencyMs, fallbackUsed: res.fallbackUsed } });
      }
      if (op==='classify') {
        const res = await classify(String(body.text||''), body.labels || ['GENERAL','SUPPORT'], { taskType: 'CLASSIFICATION' });
        return NextResponse.json({ success:true, data: res });
      }
      if (op==='summarize') {
        const res = await summarize(String(body.text||''), body.maxSentences || 3, { taskType: 'SUMMARIZE' });
        return NextResponse.json({ success:true, data: res });
      }
      if (op==='chat') {
        const { chat } = await import('@/lib/ai-gateway');
        const res = await chat(body.messages || [], { taskType: 'CHAT' });
        return NextResponse.json({ success:true, data: { text: res.text, provider: res.provider, model: res.model } });
      }
      return NextResponse.json({ success:false, error:'unknown op' }, { status:400 });
    } catch (e:any) {
      return NextResponse.json({ success:false, error: e?.message || String(e) }, { status:500 });
    }
  })(req);
}

export async function GET() {
  return NextResponse.json({ success:true, gateway:'ALO AI Gateway', ops:['generate','classify','summarize','chat'], note:'All calls protect GROQ_API_KEY server-side; frontend never sees secrets.' });
}
