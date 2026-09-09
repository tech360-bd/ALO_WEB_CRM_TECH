import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// CRM STUDENTS API — PortalStudentProfile with search/filter/pagination
// Includes application count and document count per student
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const journeyStage = searchParams.get('journeyStage') || '';
      const preferredCountry = searchParams.get('preferredCountry') || '';
      const counselorId = searchParams.get('counselorId') || '';
      const partnerId = searchParams.get('partnerId') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { fullName: { contains: search } },
          { studentId: { contains: search } },
          { city: { contains: search } },
          { preferredCountry: { contains: search } },
          { preferredSubject: { contains: search } },
        ];
      }

      if (status) {
        // Status may be on the related PortalUser
        where.user = { status };
      }
      if (journeyStage) {
        where.journeyStage = journeyStage;
      }
      if (preferredCountry) {
        where.preferredCountry = preferredCountry;
      }
      if (counselorId) {
        where.counselorId = counselorId;
      }
      if (partnerId) {
        where.partnerId = partnerId;
      }

      // Build orderBy
      const validSortFields = [
        'createdAt', 'updatedAt', 'fullName', 'studentId',
        'profileCompletion', 'journeyStage', 'englishScore',
      ];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const orderBy = { [orderField]: sortOrder === 'asc' ? 'asc' as const : 'desc' as const };

      const [total, students] = await Promise.all([
        db.portalStudentProfile.count({ where }),
        db.portalStudentProfile.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            userId: true,
            studentId: true,
            fullName: true,
            guardianName: true,
            guardianPhone: true,
            dateOfBirth: true,
            gender: true,
            city: true,
            address: true,
            passportStatus: true,
            passportNumber: true,
            preferredCountry: true,
            preferredIntake: true,
            preferredSubject: true,
            preferredLevel: true,
            budget: true,
            englishTestType: true,
            englishScore: true,
            profileCompletion: true,
            journeyStage: true,
            counselorId: true,
            counselorName: true,
            partnerId: true,
            partnerName: true,
            whatsappVerified: true,
            eligibilityScore: true,
            visaReadiness: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                email: true,
                phone: true,
                status: true,
                lastLoginAt: true,
              },
            },
            // Count relations
            _count: {
              select: {
                applications: true,
                documents: true,
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        success: true,
        data: students,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error('CRM Students API error:', error);
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
        { success: false, error: 'Failed to load students' },
        { status: 500 }
      );
    }
  })(request);
}
