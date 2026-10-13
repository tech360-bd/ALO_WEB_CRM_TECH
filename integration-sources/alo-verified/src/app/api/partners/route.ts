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

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
        { partnerId: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [partners, total] = await Promise.all([
      db.partner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { students: true, applications: true, commissions: true, partnerStaff: true } }
        }
      }),
      db.partner.count({ where })
    ]);

    return NextResponse.json({
      partners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Partners GET error:', error);
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

    // Check if email already exists
    if (body.email) {
      const existing = await db.partner.findUnique({ where: { email: body.email } });
      if (existing) {
        return NextResponse.json(
          { error: 'A partner with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Generate partner ID
    const lastPartner = await db.partner.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { partnerId: true }
    });
    let nextNum = 1;
    if (lastPartner?.partnerId) {
      const numPart = lastPartner.partnerId.split('-');
      if (numPart.length >= 2) {
        nextNum = parseInt(numPart[numPart.length - 1]) + 1;
      }
    }
    const partnerId = `AEP-${nextNum.toString().padStart(5, '0')}`;

    const partner = await db.partner.create({
      data: {
        partnerId,
        companyName: body.companyName,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone || null,
        whatsappNumber: body.whatsappNumber || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || 'Bangladesh',
        website: body.website || null,
        businessType: body.businessType || null,
        panNumber: body.panNumber || null,
        gstNumber: body.gstNumber || null,
        bankName: body.bankName || null,
        bankAccount: body.bankAccount || null,
        bankBranch: body.bankBranch || null,
        ifscCode: body.ifscCode || null,
        swiftCode: body.swiftCode || null,
        commissionRate: body.commissionRate || 0,
        status: body.status || 'active',
      }
    });

    // Create user account if requested
    if (body.createUserAccount) {
      const user = await db.user.create({
        data: {
          email: body.email,
          password: body.password || 'ChangeMe@12345',
          name: body.contactPerson,
          phone: body.phone || null,
          whatsappNumber: body.whatsappNumber || null,
          userType: 'partner',
          referenceId: partner.id,
          forcePasswordChange: true,
        }
      });

      const partnerRole = await db.role.findFirst({ where: { name: 'partner_super_admin' } });
      if (partnerRole) {
        await db.userRole.create({
          data: { userId: user.id, roleId: partnerRole.id }
        });
      }

      await db.partner.update({
        where: { id: partner.id },
        data: { userId: user.id }
      });
    }

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('Partners POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
