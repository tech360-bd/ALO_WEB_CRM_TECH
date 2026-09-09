import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || '';
      const city = searchParams.get('city') || '';
      const search = searchParams.get('search') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

      const where: Record<string, unknown> = {};
      if (status) where.approvalStatus = status;
      if (city) where.city = { contains: city };
      if (search) where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
      ];

      const [partners, partnerTotal] = await Promise.all([
        db.partnerProfile.findMany({
          where, orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit, take: limit,
        }),
        db.partnerProfile.count({ where }),
      ]);

      const [leads, leadTotal] = await Promise.all([
        db.partnerLead.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit, take: limit,
        }),
        db.partnerLead.count(),
      ]);

      return NextResponse.json({
        success: true,
        data: { partners, leads },
        total: { partners: partnerTotal, leads: leadTotal },
        page, totalPages: Math.ceil((partnerTotal + leadTotal) / limit),
      });
    } catch (error) {
      console.error('Partners GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: { partners: [], leads: [] }, total: { partners: 0, leads: 0 }, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load partners' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { companyName, contactPerson, businessType, city, address } = body;
      if (!companyName) {
        return NextResponse.json({ success: false, error: 'companyName required' }, { status: 400 });
      }
      const partner = await db.partnerProfile.create({
        data: {
          userId: auth.userId, partnerId: 'PTR-' + Date.now(),
          companyName, contactPerson: contactPerson || '',
          businessType: businessType || '', city: city || '',
          address: address || '', approvalStatus: 'pending',
        },
      });
      await logAuditAction(auth, 'create_partner', 'PartnerProfile', partner.id, { companyName });
      return NextResponse.json({ success: true, data: partner }, { status: 201 });
    } catch (error) {
      console.error('Partners POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create partner' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, approvalStatus, companyName, contactPerson, city, businessType } = body;
      if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
      const existing = await db.partnerProfile.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
      const updateData: Record<string, unknown> = {};
      if (approvalStatus) updateData.approvalStatus = approvalStatus;
      if (companyName) updateData.companyName = companyName;
      if (contactPerson) updateData.contactPerson = contactPerson;
      if (city) updateData.city = city;
      if (businessType) updateData.businessType = businessType;
      const partner = await db.partnerProfile.update({ where: { id }, data: updateData });
      await logAuditAction(auth, 'update_partner', 'PartnerProfile', id, { before: existing.approvalStatus, after: updateData });
      return NextResponse.json({ success: true, data: partner });
    } catch (error) {
      console.error('Partners PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update partner' }, { status: 500 });
    }
  })(request);
}
