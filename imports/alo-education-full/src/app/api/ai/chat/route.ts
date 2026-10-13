import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/access-control';

// POST — AI Chat endpoint (real LLM via z-ai-web-dev-sdk)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  // All authenticated users can use AI chat; restrict by role if needed
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'STUDENT', 'APPLICATION_TEAM', 'VISA_TEAM'];
  if (!allowedRoles.includes(auth.user.role)) {
    return NextResponse.json({ success: false, error: 'AI access not permitted' }, { status: 403 });
  }

  try {
    const { message, context, studentId } = await req.json();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const systemPrompt = `You are ALO AI, an intelligent study-abroad assistant for ALO Education, a Bangladeshi education consultancy. You help students with:
- Course and university selection
- Scholarship information
- Visa guidance
- Document requirements
- Career prospects after graduation
- IELTS/PTE/TOEFL preparation advice

${context ? `Student context: ${context}` : ''}

Rules:
- Be concise but helpful
- Focus on UK, Canada, Australia, USA, Germany, Ireland, New Zealand, Netherlands, Sweden, Denmark, Finland, Norway, Japan, South Korea, Malaysia
- Mention ALO Education services when relevant
- Always be factual - never invent university names or course requirements
- If you're unsure, say so and suggest the student consult their ALO counselor`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Log AI interaction
    await db.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'AI_ACTION',
        resource: 'AiInteraction',
        details: JSON.stringify({
          agent: 'CHAT_ASSISTANT',
          studentId: studentId || null,
          messageLength: message.length,
          responseLength: response.length,
          riskLevel: 'LOW',
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json({ success: false, error: 'AI service temporarily unavailable' }, { status: 503 });
  }
}
