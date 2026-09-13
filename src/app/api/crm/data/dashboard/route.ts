import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    try {
      const [
        universityCount,
        courseCount,
        scholarshipCount,
        intakeCount,
        pendingApprovalCount,
        importCount,
        approvalQueue,
        importHistory,
        universities,
        courses,
        scholarships,
        intakes,
      ] = await Promise.all([
        db.crmUniversity.count({ where: { status: { not: 'archived' } } }),
        db.crmCourse.count({ where: { status: { not: 'archived' } } }),
        db.crmScholarship.count({ where: { status: { not: 'archived' } } }),
        db.crmCourseIntakeFee.count({ where: { status: { not: 'archived' } } }),
        db.universityUpdateRequest.count({ where: { status: 'pending_approval' } }),
        db.crmImportBatch.count(),
        db.universityUpdateRequest.findMany({
          where: { status: { in: ['pending_approval', 'needs_review'] } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        db.crmImportBatch.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
        db.crmUniversity.findMany({ select: { universityId: true, country: true } }),
        db.crmCourse.findMany({ select: { country: true } }),
        db.crmScholarship.findMany({ select: { universityId: true } }),
        db.crmCourseIntakeFee.findMany({ select: { universityId: true } }),
      ]);

      const universityCountry = new Map(universities.map((university) => [university.universityId, university.country]));
      const countryMap = new Map<string, { universities: number; courses: number; scholarships: number; intakes: number }>();
      for (const university of universities) {
        const country = university.country || 'Unknown';
        const row = countryMap.get(country) || { universities: 0, courses: 0, scholarships: 0, intakes: 0 };
        row.universities += 1;
        countryMap.set(country, row);
      }
      for (const course of courses) {
        const country = course.country || 'Unknown';
        const row = countryMap.get(country) || { universities: 0, courses: 0, scholarships: 0, intakes: 0 };
        row.courses += 1;
        countryMap.set(country, row);
      }
      // Scholarship/intake records do not duplicate country in Main's schema;
      // keep their totals accurate in the KPI and expose country aggregates where available.
      for (const scholarship of scholarships) {
        const country = universityCountry.get(scholarship.universityId) || 'Unknown';
        const row = countryMap.get(country) || { universities: 0, courses: 0, scholarships: 0, intakes: 0 };
        row.scholarships += 1;
        countryMap.set(country, row);
      }
      for (const intake of intakes) {
        const country = universityCountry.get(intake.universityId) || 'Unknown';
        const row = countryMap.get(country) || { universities: 0, courses: 0, scholarships: 0, intakes: 0 };
        row.intakes += 1;
        countryMap.set(country, row);
      }

      const topCountries = [...countryMap.entries()]
        .filter(([country]) => country !== 'Unknown' && !/^\d{4}$/.test(country))
        .sort(([, a], [, b]) => (b.universities + b.courses) - (a.universities + a.courses))
        .slice(0, 10)
        .map(([country, values]) => ({ country, ...values }));

      return NextResponse.json({
        success: true,
        data: {
          approvalQueue: approvalQueue.map((item) => ({
            id: item.id,
            type: item.entityType,
            name: item.entityName,
            submittedBy: item.reviewedBy || 'Data team',
            date: item.createdAt.toISOString(),
            status: item.status,
          })),
          importHistory: importHistory.map((batch) => ({
            id: batch.id,
            file: batch.fileName,
            records: batch.rowsReceived,
            status: batch.status,
            date: batch.createdAt.toISOString(),
            by: batch.uploadedBy,
          })),
          topCountries,
          kpis: [
            { label: 'Universities', value: String(universityCount), change: '', up: true, icon: 'GraduationCap', sub: 'In database' },
            { label: 'Courses', value: String(courseCount), change: '', up: true, icon: 'BookOpen', sub: 'Active listings' },
            { label: 'Scholarships', value: String(scholarshipCount), change: '', up: true, icon: 'Award', sub: 'Available' },
            { label: 'Active Intakes', value: String(intakeCount), change: '', up: true, icon: 'Calendar', sub: 'Current cycle' },
            { label: 'Pending Approval', value: String(pendingApprovalCount), change: '', up: false, icon: 'Clock', sub: 'Data entries' },
            { label: 'CSV Import History', value: String(importCount), change: '', up: true, icon: 'FileSpreadsheet', sub: 'Recent imports' },
          ],
        },
      });
    } catch (error) {
      console.error('CRM Data Manager Dashboard error:', error);
      return NextResponse.json({ success: false, error: 'Failed to load data' }, { status: 500 });
    }
  })(request);
}
