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
    const group = searchParams.get('group') || '';

    const where: Record<string, unknown> = {};
    if (group) where.group = group;

    const settings = await db.setting.findMany({ where });

    // Convert to key-value object
    const settingsObj: Record<string, string | null> = {};
    for (const setting of settings) {
      settingsObj[setting.key] = setting.value;
    }

    return NextResponse.json({
      settings: settingsObj,
      raw: settings,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const [key, value] of Object.entries(settings)) {
      const setting = await db.setting.upsert({
        where: { key },
        update: { value: value as string | null },
        create: {
          key,
          value: value as string | null,
          group: body.group || 'general',
        }
      });
      results.push(setting);
    }

    return NextResponse.json({
      message: `${results.length} settings updated`,
      settings: results,
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
