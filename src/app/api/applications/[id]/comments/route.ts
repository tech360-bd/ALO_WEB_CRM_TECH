import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  
  let where: any = { applicationId: params.id };
  if (authRes.type === 'student') {
    where.visibility = { in: ['student', 'public'] };
  }
  
  const events = await db.applicationComment.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ success: true, data: events });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  const body = await req.json();

  const event = await db.applicationComment.create({
    data: {
      applicationId: params.id,
      ...body
    }
  });
  return NextResponse.json({ success: true, data: event });
}
