import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Map monitoring field names to UniversityPage/CoursePage model fields
const FIELD_TO_UNIVERSITY_COLUMN: Record<string, Record<string, unknown>> = {
  tuition_international: { tuitionRange: true },
  tuition_domestic: { tuitionRange: true },
  intake_january: { importantDeadlines: true },
  intake_september: { importantDeadlines: true },
  intake_other: { importantDeadlines: true },
  deadline_application: { importantDeadlines: true },
  english_ielts: { quickFacts: true },
  english_toefl: { quickFacts: true },
  english_pte: { quickFacts: true },
  english_duolingo: { quickFacts: true },
  academic_requirement: { quickFacts: true },
  duration: { quickFacts: true },
  study_mode: { quickFacts: true },
  campus: { city: true },
  scholarship: { scholarshipAvailable: true },
  application_process: { applicationProcess: true },
  course_status: { approvalStatus: true },
  accreditation: { overview: true },
};

const FIELD_TO_COURSE_COLUMN: Record<string, Record<string, unknown>> = {
  tuition_international: { tuition: true },
  tuition_domestic: { tuition: true },
  intake_january: { intake: true },
  intake_september: { intake: true },
  intake_other: { intake: true },
  deadline_application: { deadline: true },
  english_ielts: { englishRequirement: true },
  english_toefl: { englishRequirement: true },
  english_pte: { englishRequirement: true },
  english_duolingo: { englishRequirement: true },
  academic_requirement: { academicRequirement: true },
  duration: { duration: true },
  study_mode: { deliveryMode: true },
  campus: { campus: true },
  scholarship: { scholarship: true },
  application_process: { overview: true },
  course_status: { approvalStatus: true },
  accreditation: { overview: true },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Get the DataChange with its ApprovalQueueItem
    const change = await db.dataChange.findUnique({
      where: { id },
      include: { approvalQueue: true },
    });

    if (!change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 });
    }

    if (change.status === 'APPROVED') {
      return NextResponse.json({ error: 'Change already approved' }, { status: 400 });
    }

    const reviewNote = 'Approved by admin';

    // 2. Update DataChange status to APPROVED
    await db.dataChange.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewNote,
      },
    });

    // 3. Update ApprovalQueueItem status to APPROVED
    if (change.approvalQueue) {
      await db.approvalQueueItem.update({
        where: { id: change.approvalQueue.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewNote,
        },
      });
    }

    // 4. Apply the change to UniversityPage if applicable
    if (change.universitySlug && FIELD_TO_UNIVERSITY_COLUMN[change.fieldName] && change.newValue) {
      const column = FIELD_TO_UNIVERSITY_COLUMN[change.fieldName];
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if ('tuitionRange' in column && change.newValue) {
        updateData.tuitionRange = change.newValue;
      }
      if ('importantDeadlines' in column && change.newValue) {
        updateData.importantDeadlines = change.newValue;
      }
      if ('quickFacts' in column && change.newValue) {
        updateData.quickFacts = change.newValue;
      }
      if ('city' in column && change.newValue) {
        updateData.city = change.newValue;
      }
      if ('scholarshipAvailable' in column) {
        updateData.scholarshipAvailable = true;
      }
      if ('applicationProcess' in column && change.newValue) {
        updateData.applicationProcess = change.newValue;
      }
      if ('overview' in column && change.newValue) {
        updateData.overview = change.newValue;
      }
      if ('approvalStatus' in column && change.newValue) {
        updateData.approvalStatus = change.newValue.toUpperCase();
      }

      try {
        await db.universityPage.update({
          where: { slug: change.universitySlug },
          data: updateData,
        });
      } catch {
        // UniversityPage may not exist — non-fatal
      }
    }

    // 5. Apply the change to CoursePage if applicable
    if (change.courseSlug && FIELD_TO_COURSE_COLUMN[change.fieldName] && change.newValue) {
      const column = FIELD_TO_COURSE_COLUMN[change.fieldName];
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if ('tuition' in column) {
        updateData.tuition = change.newValue;
      }
      if ('intake' in column) {
        updateData.intake = change.newValue;
      }
      if ('deadline' in column) {
        updateData.deadline = change.newValue;
      }
      if ('englishRequirement' in column) {
        updateData.englishRequirement = change.newValue;
      }
      if ('academicRequirement' in column) {
        updateData.academicRequirement = change.newValue;
      }
      if ('duration' in column) {
        updateData.duration = change.newValue;
      }
      if ('deliveryMode' in column) {
        updateData.deliveryMode = change.newValue;
      }
      if ('campus' in column) {
        updateData.campus = change.newValue;
      }
      if ('scholarship' in column) {
        updateData.scholarship = change.newValue;
        updateData.scholarshipAvailable = true;
      }
      if ('overview' in column) {
        updateData.overview = change.newValue;
      }
      if ('approvalStatus' in column) {
        updateData.approvalStatus = change.newValue.toUpperCase();
      }

      try {
        await db.coursePage.update({
          where: { slug: change.courseSlug },
          data: updateData,
        });
      } catch {
        // CoursePage may not exist — non-fatal
      }
    }

    // 6. Create AuditLog entry
    await db.auditLog.create({
      data: {
        action: 'APPROVE_CHANGE',
        resource: 'DataChange',
        resourceId: id,
        details: JSON.stringify({
          changeType: change.changeType,
          fieldName: change.fieldName,
          universitySlug: change.universitySlug,
          courseSlug: change.courseSlug,
          impactLevel: change.impactLevel,
        }),
      },
    });

    return NextResponse.json({ success: true, changeId: id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to approve change', details: message }, { status: 500 });
  }
}
