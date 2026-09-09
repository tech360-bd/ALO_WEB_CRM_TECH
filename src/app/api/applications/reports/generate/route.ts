import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  return NextResponse.json({ success: true, data: { pipeline: {}, conversions: {} } });
});
