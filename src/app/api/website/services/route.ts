import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const services = await db.homeService.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('Services fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
