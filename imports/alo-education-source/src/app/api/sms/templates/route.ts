import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  GET — List SMS templates                                            */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const templates = await db.smsTemplate.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch SMS templates' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create an SMS template                                       */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, category, body: templateBody, variables } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Template name is required (at least 2 characters).' },
        { status: 400 },
      );
    }

    const allowedCategories = ['OTP', 'TRANSACTIONAL', 'NOTIFICATION', 'MARKETING'];
    if (!category || !allowedCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Category must be one of: ${allowedCategories.join(', ')}` },
        { status: 400 },
      );
    }

    if (!templateBody || typeof templateBody !== 'string' || templateBody.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Template body is required.' },
        { status: 400 },
      );
    }

    const userId = user?.id || null;

    // Extract {{variable}} names if not provided
    let finalVariables = variables;
    if (!finalVariables) {
      const matches = templateBody.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        finalVariables = JSON.stringify(
          [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
        );
      }
    }

    const template = await db.smsTemplate.create({
      data: {
        name: name.trim(),
        category,
        body: templateBody.trim(),
        variables: finalVariables || null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template created',
      template,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A template with this name already exists.' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create SMS template' },
      { status: 500 },
    );
  }
}
