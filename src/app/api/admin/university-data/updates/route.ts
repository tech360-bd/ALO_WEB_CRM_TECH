import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const confidence = searchParams.get('confidence') || '';
    const entityType = searchParams.get('entityType') || '';
    
    const where: any = {};
    if (status) where.status = status;
    if (confidence) where.aiConfidence = { gte: parseFloat(confidence) };
    if (entityType) where.entityType = entityType;

    const updates = await db.universityUpdateRequest.findMany({ where });
    return NextResponse.json({ success: true, data: updates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const body = await request.json();
    const update = await db.universityUpdateRequest.create({
      data: {
        universityId: body.universityId || '',
        courseId: body.courseId || '',
        entityType: body.entityType || 'course',
        entityName: body.entityName || '',
        fieldName: body.fieldName || '',
        oldValue: body.oldValue || '',
        newValue: body.newValue || '',
        evidenceUrl: body.evidenceUrl || '',
      }
    });
    return NextResponse.json({ success: true, data: update });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
