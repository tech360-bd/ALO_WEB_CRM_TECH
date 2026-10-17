import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const triggerEvent = searchParams.get('triggerEvent');
    const channel = searchParams.get('channel');
    const roleVisibility = searchParams.get('roleVisibility');
    const status = searchParams.get('status') || 'active';

    const where: Record<string, unknown> = {};
    if (triggerEvent) where.triggerEvent = triggerEvent;
    if (channel) where.channel = channel;
    if (roleVisibility) where.roleVisibility = roleVisibility;
    if (status) where.status = status;

    const templates = await db.smsTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('SMS templates GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.templateName || !body.triggerEvent || !body.messageBody) {
      return NextResponse.json({ error: 'templateName, triggerEvent, messageBody are required' }, { status: 400 });
    }
    const count = await db.smsTemplate.count();
    const template = await db.smsTemplate.create({
      data: {
        templateId: body.templateId || `SMS-TPL-${String(count + 1).padStart(4, '0')}`,
        templateName: body.templateName,
        channel: body.channel || 'sms',
        roleVisibility: body.roleVisibility || 'all',
        triggerEvent: body.triggerEvent,
        messageBody: body.messageBody,
        variables: body.variables ? JSON.stringify(body.variables) : null,
        status: body.status || 'active',
        createdBy: body.createdBy || null,
        approvedBy: body.approvedBy || null,
      },
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('SMS templates POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    if (updateData.variables && typeof updateData.variables !== 'string') {
      updateData.variables = JSON.stringify(updateData.variables);
    }
    const template = await db.smsTemplate.update({ where: { id }, data: updateData });
    return NextResponse.json({ template });
  } catch (error) {
    console.error('SMS templates PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
