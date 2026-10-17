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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const partnerId = searchParams.get('partnerId') || '';
    const triggerStage = searchParams.get('triggerStage') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { commissionId: { contains: search } },
        { partner: { companyName: { contains: search } } },
      ];
    }
    if (status) where.status = status;
    if (partnerId) where.partnerId = partnerId;
    if (triggerStage) where.triggerStage = triggerStage;

    const [commissions, total] = await Promise.all([
      db.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          partner: { select: { id: true, companyName: true, partnerId: true, commissionRate: true } },
          application: {
            select: {
              id: true,
              applicationId: true,
              student: { select: { firstName: true, lastName: true, studentId: true } },
              university: { select: { name: true } },
            }
          },
          claims: { take: 3, orderBy: { createdAt: 'desc' } },
        }
      }),
      db.commission.count({ where })
    ]);

    // Summary stats
    const totalAmount = await db.commission.aggregate({
      _sum: { amount: true },
    });
    const pendingAmount = await db.commission.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['eligible', 'requested', 'under_review'] } },
    });
    const paidAmount = await db.commission.aggregate({
      _sum: { amount: true },
      where: { status: 'paid' },
    });

    return NextResponse.json({
      commissions,
      summary: {
        totalAmount: totalAmount._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        paidAmount: paidAmount._sum.amount || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Commissions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    // Generate commission ID
    const lastCommission = await db.commission.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { commissionId: true }
    });
    let nextNum = 1;
    if (lastCommission?.commissionId) {
      const parts = lastCommission.commissionId.split('-');
      if (parts.length >= 2) {
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }
    }
    const commissionId = `COM-${new Date().getFullYear()}${nextNum.toString().padStart(4, '0')}`;

    const commission = await db.commission.create({
      data: {
        commissionId,
        partnerId: body.partnerId,
        studentId: body.studentId || null,
        applicationId: body.applicationId || null,
        universityId: body.universityId || null,
        amount: body.amount || 0,
        currency: body.currency || 'GBP',
        triggerStage: body.triggerStage || 'enrollment_confirmed',
        status: body.status || 'not_requested',
        requestedAt: body.status === 'requested' ? new Date() : null,
        note: body.note || null,
      },
      include: {
        partner: true,
        application: { include: { student: true, university: true } },
      }
    });

    return NextResponse.json(commission, { status: 201 });
  } catch (error) {
    console.error('Commissions POST error:', error);
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
    const { id, status, reviewedBy, note, paymentProof } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Commission ID and status are required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };

    if (['under_review', 'approved', 'rejected'].includes(status) && reviewedBy) {
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = new Date();
    }

    if (status === 'approved') {
      updateData.approvedAt = new Date();
    }

    if (status === 'paid') {
      updateData.paidAt = new Date();
      if (paymentProof) updateData.paymentProof = paymentProof;
    }

    if (note) updateData.note = note;

    const commission = await db.commission.update({
      where: { id },
      data: updateData,
      include: {
        partner: true,
        application: { include: { student: true, university: true } },
      }
    });

    return NextResponse.json(commission);
  } catch (error) {
    console.error('Commissions PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
