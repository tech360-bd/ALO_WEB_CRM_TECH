import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { isVerifiedStatus, presentControlFields, verificationAfterEdit } from '@/lib/course-finder/crm-edit-verification';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const universityId = searchParams.get('universityId') || '';
      const courseId = searchParams.get('courseId') || '';
      const page = Number(searchParams.get('page') || '1');
      const limit = Number(searchParams.get('limit') || '20');
      if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || search.length > 200) {
        return NextResponse.json({ success: false, error: 'Invalid page, limit or search length' }, { status: 400 });
      }
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
      return NextResponse.json({ success: false, error: 'Failed to load scholarships' }, { status: 500 });
    }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      // Phase 1 review (P0-A/P1-D): the currency used to default to GBP, so an
      // amount typed without a currency was stored as a GBP fact. A currency is
      // now required whenever an amount is supplied; nothing is assumed. The
      // record keeps the schema default verificationStatus (NEEDS_REVIEW), so
      // it stays out of public listings (publicScholarshipWhere requires
      // VERIFIED). Clients cannot set verification or publication here.
      const control = presentControlFields(body);
      if (control.length || Object.prototype.hasOwnProperty.call(body, 'status')) {
        return NextResponse.json({ success: false, error: `Field(s) not accepted on create: ${[...control, ...(Object.prototype.hasOwnProperty.call(body, 'status') ? ['status'] : [])].join(', ')}` }, { status: 400 });
      }
      const { universityId, courseId, scholarshipName, scholarshipAmount } = body;
      const scholarshipCurrency = typeof body.scholarshipCurrency === 'string' ? body.scholarshipCurrency.trim().toUpperCase() : '';
      const amount = scholarshipAmount === undefined || scholarshipAmount === null || scholarshipAmount === '' ? 0 : parseFloat(String(scholarshipAmount));

      if (!universityId || !scholarshipName) {
        return NextResponse.json({ success: false, error: 'University ID and scholarship name are required' }, { status: 400 });
      }
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ success: false, error: 'scholarshipAmount must be a non-negative number' }, { status: 400 });
      }
      if (amount > 0 && !/^[A-Z]{3}$/.test(scholarshipCurrency)) {
        return NextResponse.json({ success: false, error: 'scholarshipCurrency (ISO 4217, e.g. NZD) is required when an amount is given' }, { status: 400 });
      }

      const scholarship = await db.crmScholarship.create({
        data: { universityId, courseId: courseId || '', scholarshipName, scholarshipAmount: amount, scholarshipCurrency },
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

      if (!id || typeof id !== 'string') {
        return NextResponse.json({ success: false, error: 'Scholarship ID is required' }, { status: 400 });
      }
      const control = presentControlFields(body);
      if (control.length) {
        return NextResponse.json({ success: false, error: `Field(s) not accepted on edit: ${control.join(', ')}` }, { status: 400 });
      }
      const existing = await db.crmScholarship.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Scholarship not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};
      if (scholarshipName !== undefined) updateData.scholarshipName = scholarshipName;
      if (scholarshipAmount !== undefined) {
        const amount = parseFloat(String(scholarshipAmount));
        if (!Number.isFinite(amount) || amount < 0) {
          return NextResponse.json({ success: false, error: 'scholarshipAmount must be a non-negative number' }, { status: 400 });
        }
        updateData.scholarshipAmount = amount;
      }
      if (scholarshipCurrency !== undefined) updateData.scholarshipCurrency = String(scholarshipCurrency).trim().toUpperCase();
      if (status !== undefined) updateData.status = status;
      const finalAmount = (updateData.scholarshipAmount ?? existing.scholarshipAmount) as number;
      const finalCurrency = (updateData.scholarshipCurrency ?? existing.scholarshipCurrency) as string;
      if ((updateData.scholarshipAmount !== undefined || updateData.scholarshipCurrency !== undefined) && finalAmount > 0 && !/^[A-Z]{3}$/.test(finalCurrency)) {
        return NextResponse.json({ success: false, error: 'scholarshipCurrency (ISO 4217) is required when an amount is set' }, { status: 400 });
      }
      // Phase 1 review (P1-D): editing a fact of a VERIFIED scholarship sends
      // it back to review (and out of public listings) instead of keeping a
      // verification that no longer describes the stored values.
      const factsChanged = (['scholarshipName', 'scholarshipAmount', 'scholarshipCurrency'] as const)
        .some((f) => updateData[f] !== undefined && updateData[f] !== (existing as Record<string, unknown>)[f]);
      if (factsChanged && isVerifiedStatus(existing.verificationStatus)) {
        updateData.verificationStatus = verificationAfterEdit(existing.verificationStatus, true);
      }

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
