import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appendTimeline } from '@/lib/visa-readiness';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }
    const checklist = await db.preDepartureChecklist.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ checklist });
  } catch (error) {
    console.error('Pre-departure GET error:', error);
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
    if (!body.studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }
    // Initialize default checklist if none exists
    const existing = await db.preDepartureChecklist.count({ where: { studentId: body.studentId } });
    if (existing === 0 || body.forceInit) {
      const defaults = [
        { category: 'travel', itemName: 'Book one-way flight ticket' },
        { category: 'travel', itemName: 'Arrange airport pickup' },
        { category: 'accommodation', itemName: 'Confirm student housing / homestay' },
        { category: 'accommodation', itemName: 'Notify university accommodation office' },
        { category: 'finance', itemName: 'Arrange forex / international debit card' },
        { category: 'finance', itemName: 'Carry emergency cash in local currency' },
        { category: 'documents', itemName: 'Original offer letter' },
        { category: 'documents', itemName: 'CAS / I-20 / COE original' },
        { category: 'documents', itemName: 'Visa decision letter' },
        { category: 'documents', itemName: 'Academic originals (sealed)' },
        { category: 'health', itemName: 'TB test certificate' },
        { category: 'health', itemName: 'Vaccination records' },
        { category: 'health', itemName: 'Travel / medical insurance' },
        { category: 'communication', itemName: 'Activate international roaming / SIM' },
        { category: 'communication', itemName: 'Join university WhatsApp / Facebook group' },
      ];
      for (const d of defaults) {
        await db.preDepartureChecklist.create({
          data: {
            studentId: body.studentId,
            applicationId: body.applicationId || null,
            itemName: d.itemName,
            category: d.category,
            isRequired: true,
            isCompleted: false,
          },
        });
      }
      const checklist = await db.preDepartureChecklist.findMany({ where: { studentId: body.studentId }, orderBy: { createdAt: 'asc' } });
      await appendTimeline({
        studentId: body.studentId,
        eventType: 'pre_departure_init',
        title: 'Pre-departure checklist initialized',
        actorType: 'system',
      });
      return NextResponse.json({ checklist }, { status: 201 });
    }
    return NextResponse.json({ checklist: [], message: 'Checklist already exists' });
  } catch (error) {
    console.error('Pre-departure POST error:', error);
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
    const { id, isCompleted, note } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const item = await db.preDepartureChecklist.update({
      where: { id },
      data: {
        isCompleted: isCompleted ?? undefined,
        completedAt: isCompleted ? new Date() : null,
        note: note ?? undefined,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Pre-departure PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
