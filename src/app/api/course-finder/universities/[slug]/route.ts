// @ts-nocheck
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// UNIVERSITY DETAIL API (by slug)
// Brand: ALO Education — Blue #0057B8, Orange #E8501A
// ============================================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug query parameter is required' },
        { status: 400 }
      );
    }

    // Find verified university by slug
    const university = await db.crmUniversity.findFirst({
      where: {
        slug,
        verificationStatus: 'VERIFIED',
      },
      include: {
        courses: {
          where: {
            approvalStatus: 'PUBLISHED',
            verificationStatus: 'VERIFIED',
          },
          select: {
            id: true,
            slug: true,
            title: true,
            studyLevel: true,
            qualification: true,
            duration: true,
            durationMonths: true,
            tuitionFee: true,
            tuitionCurrency: true,
            ieltsMin: true,
            pteMin: true,
            scholarshipAvailable: true,
            nextIntake: true,
            intakeMonths: true,
            officialCourseUrl: true,
            subjectArea: true,
          },
        },
      },
    });

    if (!university) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    // Course count
    const courseCount = university.courses ? university.courses.length : 0;

    // Build ranking data from the university record
    const rankings = [];
    if (university.rankingValue && university.rankingValue > 0) {
      rankings.push({
        provider: university.rankingProvider || null,
        name: university.rankingName || null,
        edition: university.rankingEdition || null,
        year: university.rankingYear || null,
        value: university.rankingValue,
        category: university.rankingCategory || null,
        sourceUrl: university.rankingSourceUrl || null,
        publishedAt: university.rankingPublishedAt
          ? university.rankingPublishedAt.toISOString()
          : null,
      });
    }
    // Also include legacy ranking fields if they have values and differ from main ranking
    if (university.timesHigherRanking && university.timesHigherRanking > 0) {
      rankings.push({
        provider: 'THE',
        name: 'Times Higher Education',
        edition: 'World University Rankings',
        year: university.rankingYear || null,
        value: university.timesHigherRanking,
        category: university.rankingCategory || null,
        sourceUrl: university.rankingSourceUrl || null,
        publishedAt: university.rankingPublishedAt
          ? university.rankingPublishedAt.toISOString()
          : null,
      });
    }
    if (university.guardianRanking && university.guardianRanking > 0) {
      rankings.push({
        provider: 'Guardian',
        name: 'Guardian University Guide',
        edition: 'University League Tables',
        year: university.rankingYear || null,
        value: university.guardianRanking,
        category: university.rankingCategory || null,
        sourceUrl: null,
        publishedAt: null,
      });
    }

    // Fetch related universities (same country, different ID, verified)
    const relatedUniversities = await db.crmUniversity.findMany({
      where: {
        country: university.country,
        verificationStatus: 'VERIFIED',
        id: { not: university.id },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        officialName: true,
        country: true,
        city: true,
        institutionType: true,
        rankingValue: true,
        rankingProvider: true,
        rankingEdition: true,
        rankingYear: true,
        featured: true,
        isPartner: true,
        scholarshipAvailable: true,
        keyIntakes: true,
        logoUrl: true,
      },
      take: 4,
      orderBy: [{ featured: 'desc' }, { rankingValue: 'asc' }],
    });

    // Get published course count per study level for the "courses" tab summary
    const levelCounts = {};
    if (university.courses && university.courses.length > 0) {
      for (const c of university.courses) {
        if (c.studyLevel) {
          levelCounts[c.studyLevel] = (levelCounts[c.studyLevel] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      university: {
        id: university.id,
        name: university.name,
        slug: university.slug,
        officialName: university.officialName,
        country: university.country,
        city: university.city,
        state: university.state,
        address: university.address,
        institutionType: university.institutionType,
        establishedYear: university.establishedYear,
        websiteUrl: university.websiteUrl,
        admissionsUrl: university.admissionsUrl,
        internationalUrl: university.internationalUrl,
        logoUrl: university.logoUrl,
        heroImageUrl: university.heroImageUrl,
        description: university.description,
        studentCount: university.studentCount,
        internationalStudentCount: university.internationalStudentCount,
        featured: university.featured,
        isPartner: university.isPartner,
        rankingProvider: university.rankingProvider,
        rankingName: university.rankingName,
        rankingEdition: university.rankingEdition,
        rankingYear: university.rankingYear,
        rankingValue: university.rankingValue,
        rankingCategory: university.rankingCategory,
        rankingSourceUrl: university.rankingSourceUrl,
        scholarshipAvailable: university.scholarshipAvailable,
        keyIntakes: university.keyIntakes,
        accommodationAvailable: university.accommodationAvailable,
        careerSupport: university.careerSupport,
        employabilityRate: university.employabilityRate,
        lastVerifiedAt: university.lastVerifiedAt ? university.lastVerifiedAt.toISOString() : null,
        verificationStatus: university.verificationStatus,
        sourceUrl: university.sourceUrl,
      },
      courses: university.courses || [],
      courseCount,
      courseLevelCounts: levelCounts,
      rankings,
      relatedUniversities,
    });
  } catch (error) {
    console.error('University detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch university details' },
      { status: 500 }
    );
  }
}
