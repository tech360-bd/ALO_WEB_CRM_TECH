import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/profile
// Returns the student's full profile with education, work, english tests, visa refusals
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (_req, auth) => {
    try {
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
        include: {
          educations: true,
          workExperiences: true,
          englishTests: true,
          visaRefusals: true,
        },
      });

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PUT /api/student-portal/profile
// Full update of profile fields — replaces all provided fields
// ============================================================
export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();

      // Verify profile exists
      const existing = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      // Allowed updatable fields
      const allowedFields = [
        'fullName', 'guardianName', 'guardianPhone', 'dateOfBirth', 'gender',
        'city', 'address', 'passportStatus', 'passportNumber', 'passportExpiry',
        'preferredCountry', 'preferredIntake', 'preferredSubject', 'preferredLevel',
        'budget', 'englishTestType', 'englishScore', 'studyGap', 'sponsorRelation',
        'currentEducation', 'sscResult', 'hscResult', 'bachelorResult', 'masterResult',
        'workExperience', 'journeyStage', 'givenName', 'familyName', 'nationality',
        'maritalStatus', 'presentAddress', 'permanentAddress', 'altEmail', 'altPhone',
        'emergencyName', 'emergencyEmail', 'emergencyPhone', 'emergencyRelation',
        'fundingStatus', 'sponsorType', 'fundSource', 'applicantStatus', 'noOfDependents',
        'passportIssuePlace', 'passportIssueDate', 'passportIssueCountry',
        'cityOfBirth', 'countryOfBirth', 'hasPassport', 'englishTestStatus',
        'englishTestDate', 'englishExpDate', 'englishCertId', 'englishListening',
        'englishSpeaking', 'englishWriting', 'englishReading', 'hasWorkExp',
        'hasReferral', 'hasVisa', 'hasVisaRefusal', 'hasMedical', 'hasCriminal',
        'instituteType', 'instituteName', 'programTitle', 'enrollmentChoice',
        'applicationPathway', 'pathwayProvider', 'visaType',
      ] as const;

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      for (const key of allowedFields) {
        if (body[key] !== undefined) {
          updateData[key] = body[key];
        }
      }

      // Update profile
      const updated = await db.portalStudentProfile.update({
        where: { userId: auth.userId },
        data: updateData,
      });

      // Recalculate profile completion
      const completionFields = [
        'givenName', 'familyName', 'dateOfBirth', 'gender', 'nationality',
        'city', 'presentAddress', 'passportNumber', 'preferredCountry',
        'preferredIntake', 'englishTestType', 'englishScore', 'budget',
      ];
      let filled = 0;
      const merged = { ...existing, ...updateData } as Record<string, unknown>;
      for (const f of completionFields) {
        const val = merged[f];
        if (val !== undefined && val !== '' && val !== 0 && val !== null) filled++;
      }
      const completion = Math.round((filled / completionFields.length) * 100);

      await db.portalStudentProfile.update({
        where: { userId: auth.userId },
        data: { profileCompletion: completion },
      });

      // Audit log
      await logAuditAction(auth, 'PROFILE_UPDATED', 'PortalStudentProfile', existing.id, {
        updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
      });

      return NextResponse.json({ success: true, data: { ...updated, profileCompletion: completion } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PATCH /api/student-portal/profile
// Partial update of profile fields
// ============================================================
export async function PATCH(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { section, data } = body;

      // Verify profile exists
      const existing = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      // Build update data
      const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };

      await db.portalStudentProfile.update({
        where: { userId: auth.userId },
        data: updateData,
      });

      // Recalculate profile completion
      const completionFields = [
        'givenName', 'familyName', 'dateOfBirth', 'gender', 'nationality',
        'city', 'presentAddress', 'passportNumber', 'preferredCountry',
        'preferredIntake', 'englishTestType', 'englishScore', 'budget',
      ];
      let filled = 0;
      const merged = { ...existing, ...data } as Record<string, unknown>;
      for (const f of completionFields) {
        const val = merged[f];
        if (val !== undefined && val !== '' && val !== 0 && val !== null) filled++;
      }
      const completion = Math.round((filled / completionFields.length) * 100);

      await db.portalStudentProfile.update({
        where: { userId: auth.userId },
        data: { profileCompletion: completion },
      });

      // Audit log
      await logAuditAction(auth, 'PROFILE_PATCHED', 'PortalStudentProfile', existing.id, {
        section: section || 'general',
        updatedFields: Object.keys(data),
      });

      return NextResponse.json({ success: true, data: { profileCompletion: completion } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
