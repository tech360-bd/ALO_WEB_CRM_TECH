import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemType, itemSlug, action, sessionId: bodySessionId } = body;

    if (!itemType || !itemSlug || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['COURSE', 'UNIVERSITY'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid itemType' }, { status: 400 });
    }

    const sid = bodySessionId || `anon-${Date.now()}`;

    if (action === 'save') {
      await db.$executeRaw`DELETE FROM SavedItem WHERE sessionId = ${sid} AND itemType = ${itemType} AND itemSlug = ${itemSlug}`;
      await db.$executeRaw`INSERT INTO SavedItem (id, sessionId, itemType, itemSlug, createdAt) VALUES (${'save_' + Date.now()}, ${sid}, ${itemType}, ${itemSlug}, datetime('now'))`;
      return NextResponse.json({ success: true, saved: true, itemType, itemSlug });
    }

    await db.$executeRaw`DELETE FROM SavedItem WHERE sessionId = ${sid} AND itemType = ${itemType} AND itemSlug = ${itemSlug}`;
    return NextResponse.json({ success: true, saved: false, itemType, itemSlug });
  } catch (error) {
    console.error('Save API error:', error);
    return NextResponse.json({ error: 'Failed to process save' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const itemType = searchParams.get('itemType');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // Parameterized query to prevent SQL injection
    const items = itemType
      ? await db.$queryRaw<Array<{ id: string; itemType: string; itemSlug: string; createdAt: string }>>
        `SELECT id, itemType, itemSlug, createdAt FROM SavedItem WHERE sessionId = ${sessionId} AND itemType = ${itemType} ORDER BY createdAt DESC`
      : await db.$queryRaw<Array<{ id: string; itemType: string; itemSlug: string; createdAt: string }>>
        `SELECT id, itemType, itemSlug, createdAt FROM SavedItem WHERE sessionId = ${sessionId} ORDER BY createdAt DESC`;
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Save list error:', error);
    return NextResponse.json({ error: 'Failed to load saved items' }, { status: 500 });
  }
}
