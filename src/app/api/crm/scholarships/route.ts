import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const universityId = searchParams.get('universityId') || '';
      const courseId = searchParams.get('courseId') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { scholarshipName: { contains: search } },
          { universityId: { contains: search } },
          { courseId: { contains: search } },
        ];
      }
      if (universityId) where.universityId = universityId;
      if (courseId) where.courseId = courseId;

      const [total, scholarships] = await Promise.all([
        db.crmScholarship.count({ where }),
        db.crmScholarship.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      // Enrich with university names
      type EnrichedScholarship = typeof scholarships[number] & { universityName: string };
      const enriched: EnrichedScholarship[] = [];
      for (const s of scholarships) {
        const uni = await db.crmUniversity.findUnique({ where: { universityId: s.universityId } });
        enriched.push({
          ...s,
          universityName: uni?.name || s.universityId,
        });
      }

      return NextResponse.json({
        success: true,
        data: enriched,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Scholarships API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load scholarships' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { universityId, courseId, scholarshipName, scholarshipAmount, scholarshipCurrency = 'GBP' } = body;

      if (!universityId || !scholarshipName) {
        return NextResponse.json({ success: false, error: 'University ID and scholarship name are required' }, { status: 400 });
      }

      const scholarship = await db.crmScholarship.create({
        data: { universityId, courseId: courseId || '', scholarshipName, scholarshipAmount: parseFloat(String(scholarshipAmount)) || 0, scholarshipCurrency },
      });

      await logAuditAction(auth, 'create_scholarship', 'CrmScholarship', scholarship.id, { universityId, scholarshipName });

      return NextResponse.json({ success: true, data: scholarship }, { status: 201 });
    } catch (error) {
      console.error('Scholarships POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create scholarship' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, scholarshipName, scholarshipAmount, scholarshipCurrency, status } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: 'Scholarship ID is required' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {};
      if (scholarshipName !== undefined) updateData.scholarshipName = scholarshipName;
      if (scholarshipAmount !== undefined) updateData.scholarshipAmount = parseFloat(String(scholarshipAmount));
      if (scholarshipCurrency !== undefined) updateData.scholarshipCurrency = scholarshipCurrency;
      if (status !== undefined) updateData.status = status;

      const scholarship = await db.crmScholarship.update({
        where: { id },
        data: updateData,
      });

      await logAuditAction(auth, 'update_scholarship', 'CrmScholarship', id, updateData);

      return NextResponse.json({ success: true, data: scholarship });
    } catch (error) {
      console.error('Scholarships PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update scholarship' }, { status: 500 });
    }
  })(request);
}
