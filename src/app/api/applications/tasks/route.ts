import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const tasks = await db.applicationTask.findMany();
  return NextResponse.json({ success: true, data: tasks });
});
export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  const task = await db.applicationTask.create({ data: body });
  return NextResponse.json({ success: true, data: task });
});
