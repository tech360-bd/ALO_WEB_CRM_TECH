import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// CRM LEADS API — MarketingLead table with search/filter/pagination
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const source = searchParams.get('source') || '';
      const hotLead = searchParams.get('hotLead') || '';
      const counselorId = searchParams.get('counselorId') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
          { destination: { contains: search } },
          { studentId: { contains: search } },
        ];
      }

      if (status) {
        where.status = status;
      }
      if (source) {
        where.source = source;
      }
      if (hotLead === 'true') {
        where.hotLead = true;
      } else if (hotLead === 'false') {
        where.hotLead = false;
      }
      if (counselorId) {
        where.counselorId = counselorId;
      }

      // Build orderBy
      const validSortFields = ['createdAt', 'updatedAt', 'name', 'score', 'status', 'followUpDueAt'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const orderBy = { [orderField]: sortOrder === 'asc' ? 'asc' as const : 'desc' as const };

      const [total, leads] = await Promise.all([
        db.marketingLead.count({ where }),
        db.marketingLead.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        success: true,
        data: leads,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error('CRM Leads API error:', error);
      // If table doesn't exist, return empty
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load leads' },
        { status: 500 }
      );
    }
  })(request);
}

// ============================================================
// POST — Create new lead
// ============================================================
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();

      const {
        name = '',
        phone = '',
        email = '',
        destination = '',
        level = '',
        intake = '',
        ieltsScore = 0,
        pteScore = 0,
        budget = '',
        consent = false,
        source = 'manual',
        sourceDetail = '',
        campaignId,
        status = 'new',
        hotLead = false,
        counselorId,
      } = body;

      // Validate required fields
      if (!name && !phone && !email) {
        return NextResponse.json(
          { success: false, error: 'At least name, phone, or email is required' },
          { status: 400 }
        );
      }

      // Create the lead
      const lead = await db.marketingLead.create({
        data: {
          name,
          phone,
          email,
          destination,
          level,
          intake,
          ieltsScore: parseFloat(String(ieltsScore)) || 0,
          pteScore: parseFloat(String(pteScore)) || 0,
          budget,
          consent,
          source,
          sourceDetail,
          campaignId,
          status,
          hotLead,
          counselorId,
          counselorName: '',
          createdById: auth.userId,
        },
      });

      // Log audit action
      await logAuditAction(auth, 'create_lead', 'MarketingLead', lead.id, {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
      });

      return NextResponse.json(
        { success: true, data: lead },
        { status: 201 }
      );
    } catch (error) {
      console.error('CRM Leads POST error:', error);
      if (String(error).includes('Unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'A lead with this information already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create lead' },
        { status: 500 }
      );
    }
  })(request);
}
