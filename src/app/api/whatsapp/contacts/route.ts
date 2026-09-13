import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { normalizeBdPhone } from '@/lib/whatsapp-number-pool';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const studentId = searchParams.get('studentId');
    const isOptedOut = searchParams.get('isOptedOut');

    const where: any = {};
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { normalizedPhone: { contains: search } },
        { displayName: { contains: search } },
      ];
    }
    if (studentId) where.studentId = studentId;
    if (isOptedOut !== null && isOptedOut !== undefined) where.isOptedOut = isOptedOut === 'true';

    const contacts = await db.whatsAppContact.findMany({
      where,
      orderBy: { lastContactAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, contacts, count: contacts.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { phone, displayName, studentId, leadId, source } = body;

    if (!phone) return NextResponse.json({ success: false, error: 'phone required' }, { status: 400 });

    const normalized = normalizeBdPhone(phone);
    if (!normalized) return NextResponse.json({ success: false, error: 'Invalid phone' }, { status: 400 });

    // Idempotency: reuse existing by normalized phone
    const existing = await db.whatsAppContact.findUnique({
      where: { normalizedPhone: normalized },
    });

    if (existing) {
      const updated = await db.whatsAppContact.update({
        where: { id: existing.id },
        data: {
          displayName: displayName || existing.displayName,
          studentId: studentId || existing.studentId,
          leadId: leadId || existing.leadId,
          lastContactAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: updated, isNew: false });
    }

    const contact = await db.whatsAppContact.create({
      data: {
        phone,
        normalizedPhone: normalized,
        displayName: displayName || phone,
        studentId: studentId || '',
        leadId: leadId || '',
        source: source || 'WHATSAPP',
      },
    });

    return NextResponse.json({ success: true, data: contact, isNew: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
