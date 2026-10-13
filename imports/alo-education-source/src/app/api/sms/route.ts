import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  GET — List SMS messages with filters & pagination                   */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const leadId = searchParams.get('leadId');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const direction = searchParams.get('direction');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (leadId) where.leadId = leadId;
  if (status) where.status = status;
  if (category) where.category = category;
  if (direction) where.direction = direction;

  try {
    const [messages, total] = await Promise.all([
      db.smsMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          student: { select: { id: true, fullName: true, mobile: true } },
          lead: { select: { id: true, fullName: true, phone: true } },
          sentBy: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
        },
      }),
      db.smsMessage.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch SMS messages' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Send an SMS (MOCK provider)                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { to, body: messageBody, category, templateId, studentId, leadId, applicationId } = body;

    if (!to || typeof to !== 'string' || to.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Valid recipient phone number is required.' },
        { status: 400 },
      );
    }

    if (!messageBody || typeof messageBody !== 'string' || messageBody.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message body is required.' },
        { status: 400 },
      );
    }

    const allowedCategories = ['OTP', 'TRANSACTIONAL', 'NOTIFICATION', 'MARKETING', 'ALERT'];
    const finalCategory = category && allowedCategories.includes(category) ? category : 'NOTIFICATION';

    // Resolve template variables if templateId provided
    let finalBody = messageBody.trim();
    let resolvedTemplateId = templateId || null;

    if (templateId) {
      const template = await db.smsTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        finalBody = template.body;
        resolvedTemplateId = template.id;
      }
    }

    const userId = user?.id || null;
    const mockMessageId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create message record — initially QUEUED
    const smsMessage = await db.smsMessage.create({
      data: {
        messageId: mockMessageId,
        to: to.trim(),
        from: 'ALO Education',
        body: finalBody,
        status: 'QUEUED',
        direction: 'OUTBOUND',
        channel: 'SMS',
        category: finalCategory,
        templateId: resolvedTemplateId,
        studentId: studentId || null,
        leadId: leadId || null,
        applicationId: applicationId || null,
        sentById: userId,
        provider: 'MOCK',
        providerResponse: { mock: true, simulated: true },
      },
      include: {
        student: { select: { id: true, fullName: true, mobile: true } },
        lead: { select: { id: true, fullName: true, phone: true } },
        sentBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    // Simulate async delivery — mark SENT immediately, DELIVERED after 1s
    // (fire-and-forget, don't block the response)
    setTimeout(async () => {
      try {
        await db.smsMessage.update({
          where: { id: smsMessage.id },
          data: { status: 'SENT', sentAt: new Date() },
        });

        // 95% chance of delivery, 5% failure (realistic simulation)
        const willDeliver = Math.random() > 0.05;

        setTimeout(async () => {
          try {
            if (willDeliver) {
              await db.smsMessage.update({
                where: { id: smsMessage.id },
                data: { status: 'DELIVERED', deliveredAt: new Date() },
              });
            } else {
              await db.smsMessage.update({
                where: { id: smsMessage.id },
                data: { status: 'FAILED', failedAt: new Date(), errorReason: 'Simulated delivery failure' },
              });
            }
          } catch {
            // Silent fail — background task
          }
        }, 1000);
      } catch {
        // Silent fail — background task
      }
    }, 500);

    return NextResponse.json({
      success: true,
      message: 'SMS queued for delivery',
      sms: smsMessage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send SMS' },
      { status: 500 },
    );
  }
}
