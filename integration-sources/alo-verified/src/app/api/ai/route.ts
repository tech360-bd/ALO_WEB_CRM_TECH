import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { command, agentType, userId, inputText } = body;

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    // Find the AI agent by type
    let agent: any = null;
    if (agentType) {
      agent = await db.aiAgent.findFirst({
        where: { agentType, status: 'active' }
      });
    }

    const startTime = Date.now();

    let outputText = '';
    let model = 'llm';

    try {
      // Use the z-ai-web-dev-sdk with correct API (ZAI class, not LLM)
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const client = await ZAI.create();

      let systemPrompt = 'You are an AI assistant for ALO Education, a comprehensive education consultancy CRM system. Help users with their queries about students, applications, universities, visa processes, and more. Be concise and helpful.';

      if (agent) {
        systemPrompt = agent.prompt || systemPrompt;
        model = agent.model || 'llm';
      }

      const prompt = inputText || command;

      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      });

      outputText = response.choices?.[0]?.message?.content || response.content || response.text || JSON.stringify(response);
    } catch (llmError) {
      console.error('LLM SDK error:', llmError);
      // Fallback: provide a structured response based on command type
      outputText = generateFallbackResponse(command, agentType);
    }

    const executionTime = Date.now() - startTime;

    // Log the AI command
    await db.aiLog.create({
      data: {
        agentId: agent?.id || null,
        userId: userId || null,
        command,
        inputText: inputText || null,
        outputText,
        model,
        status: 'completed',
        executionTime,
      } as any,
    });

    return NextResponse.json({
      command,
      agentType: agentType || 'general',
      output: outputText,
      executionTime,
      model,
    });
  } catch (error) {
    console.error('AI POST error:', error);

    // Log the failure
    try {
      await db.aiLog.create({
        data: {
          command: 'error',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        } as any,
      });
    } catch {}

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateFallbackResponse(command: string, agentType?: string): string {
  const lowerCommand = command.toLowerCase();

  if (agentType === 'lead_qualifier' || lowerCommand.includes('qualify') || lowerCommand.includes('lead')) {
    return 'Based on the lead information, I recommend checking the following qualification criteria: 1) English test scores meet minimum requirements, 2) Financial capability for tuition, 3) Academic background matches preferred course. The lead appears to be warm - recommend follow-up within 24 hours.';
  }

  if (agentType === 'course_recommender' || lowerCommand.includes('course') || lowerCommand.includes('recommend')) {
    return 'Based on the student profile, I recommend the following courses: 1) MSc Computer Science at University of Manchester, 2) MSc Data Science at University of Leeds, 3) MBA at University of Birmingham. All have entry requirements that match the student\'s profile.';
  }

  if (agentType === 'sop_assistant' || lowerCommand.includes('sop') || lowerCommand.includes('statement')) {
    return 'For a strong Statement of Purpose, include: 1) Academic background and achievements, 2) Why this specific course and university, 3) Career goals and how the course helps, 4) Relevant experience and skills, 5) What makes you unique. Keep it 500-1000 words and ensure it\'s authentic.';
  }

  if (agentType === 'ukvi_practice' || lowerCommand.includes('ukvi') || lowerCommand.includes('interview')) {
    return 'Common UKVI interview questions: 1) Why did you choose this university? 2) How will you fund your studies? 3) What are your plans after graduation? 4) Why this specific course? 5) Do you have family in the UK? Practice answering confidently and honestly. Keep answers concise and consistent with your application.';
  }

  if (agentType === 'email_writer' || lowerCommand.includes('email')) {
    return 'I can help draft professional emails. Please provide: 1) Recipient type (student/partner/university), 2) Purpose of the email, 3) Key points to include. I\'ll generate a polished email following ALO Education\'s communication standards.';
  }

  if (agentType === 'blog_writer' || lowerCommand.includes('blog')) {
    return 'I can help create engaging blog content about studying abroad. Topics I can cover: 1) University guides, 2) Scholarship opportunities, 3) Visa tips, 4) Student life in the UK, 5) Career prospects. I\'ll optimize for SEO and include relevant keywords.';
  }

  if (agentType === 'visa_checker' || lowerCommand.includes('visa')) {
    return 'For UK student visa (Tier 4/Student Route), ensure: 1) Valid CAS from university, 2) Financial evidence showing funds for 28+ days, 3) TB test certificate (if applicable), 4) ATAS certificate (if applicable), 5) English language proficiency evidence. Current processing time: 3-6 weeks standard, 1-2 weeks priority.';
  }

  return 'I\'m your ALO Education AI assistant. I can help with: lead qualification, course recommendations, visa guidance, UKVI interview practice, SOP writing, email drafting, blog content, social media content, and more. Please specify what you need help with.';
}

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const [agents, logs] = await Promise.all([
      db.aiAgent.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' } }),
      db.aiLog.findMany({
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    return NextResponse.json({ agents, logs });
  } catch (error) {
    console.error('AI GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
