import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const offers = await db.applicationOffer.findMany({ where: { applicationId: params.id } });
  return NextResponse.json({ success: true, data: offers });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  const body = await req.json();

  if (body.id) {
    const updated = await db.applicationOffer.update({ where: { id: body.id }, data: body });
    return NextResponse.json({ success: true, data: updated });
  } else {
    const created = await db.applicationOffer.create({ data: { applicationId: params.id, ...body } });
    return NextResponse.json({ success: true, data: created });
  }
}
