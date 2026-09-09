import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  return NextResponse.json({ success: true, data: [] }); // Simplified
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  const body = await req.json();
  
  const updated = await db.application.update({
    where: { id: params.id },
    data: { casI20CoeStatus: body.casI20CoeStatus }
  });
  return NextResponse.json({ success: true, data: updated });
}
