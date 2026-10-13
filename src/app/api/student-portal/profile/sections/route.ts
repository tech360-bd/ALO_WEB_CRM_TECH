import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import {
  validateEducation,
  validateWork,
  validateEnglishTest,
  validateVisaRefusal,
  validatePersonalInfo,
  visaRefusalConsistency,
} from '@/lib/student-profile/profile-sections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// STUDENT PROFILE SECTIONS — repeatable records
// GET   /api/student-portal/profile/sections   → all sections for the caller
// POST  /api/student-portal/profile/sections   → add a record to one section
// PATCH /api/student-portal/profile/sections   → update ONE record by id
//
// Why this route exists: `StudentEducationRecord`, `StudentWorkExpRecord`,
// `StudentVisaRefusal` and (for writes) `StudentEnglishTestRecord` had no API at
// all — the tables existed but nothing could populate them, so educational
// background, work experience and visa history were unusable in the portal.
//
// Ownership comes from the authenticated session only. The student profile is
// resolved from `auth.userId` and every record is filtered by that profile id, so
// a supplied record id can never reach another student's row. PATCH updates a
// single record by id and does not touch sibling records, which is what keeps
// "add another qualification" from overwriting an earlier one.
// ============================================================

const SECTION_KEYS = ['personal', 'education', 'work', 'english', 'visa_refusal'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

async function resolveOwnProfile(userId: string) {
  const profile = await db.portalStudentProfile
    .findFirst({ where: { userId }, select: { id: true, studentId: true, hasVisaRefusal: true } })
    .catch(() => null);
  return profile;
}

function issuesResponse(issues: Array<{ field: string; message: string }>) {
  return NextResponse.json(
    { success: false, error: issues[0]?.message || 'Please correct the highlighted fields.', issues },
    { status: 400 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const profile = await resolveOwnProfile(auth.userId);
    if (!profile) return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });

    const [educations, workExperiences, englishTests, visaRefusals] = await Promise.all([
      db.studentEducationRecord.findMany({ where: { studentProfileId: profile.id }, orderBy: { endYear: 'desc' } }).catch(() => []),
      db.studentWorkExpRecord.findMany({ where: { studentProfileId: profile.id }, orderBy: { startDate: 'desc' } }).catch(() => []),
      db.studentEnglishTestRecord.findMany({ where: { studentProfileId: profile.id }, orderBy: { testDate: 'desc' } }).catch(() => []),
      db.studentVisaRefusal.findMany({ where: { studentProfileId: profile.id }, orderBy: { rejectionDate: 'desc' } }).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        education: educations,
        work: workExperiences,
        english: englishTests,
        visaRefusal: visaRefusals,
        visaRefusalCheck: visaRefusalConsistency(profile.hasVisaRefusal, visaRefusals.length),
      },
    });
  } catch (error: unknown) {
    console.error('[profile.sections] load failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Could not load your profile sections.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const profile = await resolveOwnProfile(auth.userId);
    if (!profile) return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const section = String(body?.section || '').trim() as SectionKey;
    if (!(SECTION_KEYS as readonly string[]).includes(section)) {
      return NextResponse.json({ success: false, error: `Section must be one of: ${SECTION_KEYS.join(', ')}.` }, { status: 400 });
    }
    // Personal information is a single row, not a repeatable list.
    if (section === 'personal') {
      return NextResponse.json({ success: false, error: 'Personal information is updated with PATCH, not added.' }, { status: 400 });
    }

    const payload = body?.data ?? {};

    if (section === 'education') {
      const result = validateEducation(payload);
      if (!result.valid) return issuesResponse(result.issues);
      // INSERT — never an update of a sibling record.
      const created = await db.studentEducationRecord.create({
        data: { ...(result.value as Record<string, never>), studentProfileId: profile.id } as never,
      });
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (section === 'work') {
      const result = validateWork(payload);
      if (!result.valid) return issuesResponse(result.issues);
      const created = await db.studentWorkExpRecord.create({
        data: { ...(result.value as Record<string, never>), studentProfileId: profile.id } as never,
      });
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (section === 'english') {
      const result = validateEnglishTest(payload);
      if (!result.valid) return issuesResponse(result.issues);
      const created = await db.studentEnglishTestRecord.create({
        data: { ...(result.value as Record<string, never>), studentProfileId: profile.id } as never,
      });
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    // visa_refusal
    const result = validateVisaRefusal(payload);
    if (!result.valid) return issuesResponse(result.issues);
    const created = await db.studentVisaRefusal.create({
      data: { ...(result.value as Record<string, never>), studentProfileId: profile.id } as never,
    });
    // Answering Yes by adding a refusal keeps the declaration consistent.
    await db.portalStudentProfile
      .update({ where: { id: profile.id }, data: { hasVisaRefusal: 'yes' } })
      .catch(() => null);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    console.error('[profile.sections] create failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Could not save that record.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const profile = await resolveOwnProfile(auth.userId);
    if (!profile) return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const section = String(body?.section || '').trim() as SectionKey;
    const id = String(body?.id || '').trim();
    if (!(SECTION_KEYS as readonly string[]).includes(section)) {
      return NextResponse.json({ success: false, error: `Section must be one of: ${SECTION_KEYS.join(', ')}.` }, { status: 400 });
    }
    const payload = body?.data ?? {};

    if (section === 'personal') {
      const result = validatePersonalInfo(payload);
      if (!result.valid) return issuesResponse(result.issues);
      const updated = await db.portalStudentProfile.update({
        where: { id: profile.id },
        data: result.value as never,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (!id) return NextResponse.json({ success: false, error: 'A record id is required.' }, { status: 400 });

    // Every update is scoped by BOTH the id and the caller's own profile id, so a
    // guessed id from another student matches nothing.
    if (section === 'education') {
      const result = validateEducation(payload);
      if (!result.valid) return issuesResponse(result.issues);
      const existing = await db.studentEducationRecord.findFirst({ where: { id, studentProfileId: profile.id }, select: { id: true } });
      if (!existing) return NextResponse.json({ success: false, error: 'Record not found.' }, { status: 404 });
      const updated = await db.studentEducationRecord.update({ where: { id: existing.id }, data: result.value as never });
      return NextResponse.json({ success: true, data: updated });
    }

    if (section === 'work') {
      const result = validateWork(payload);
      if (!result.valid) return issuesResponse(result.issues);
      const existing = await db.studentWorkExpRecord.findFirst({ where: { id, studentProfileId: profile.id }, select: { id: true } });
      if (!existing) return NextResponse.json({ success: false, error: 'Record not found.' }, { status: 404 });
      const updated = await db.studentWorkExpRecord.update({ where: { id: existing.id }, data: result.value as never });
      return NextResponse.json({ success: true, data: updated });
    }

    if (section === 'english') {
      const result = validateEnglishTest(payload);
      if (!result.valid) return issuesResponse(result.issues);
      const existing = await db.studentEnglishTestRecord.findFirst({ where: { id, studentProfileId: profile.id }, select: { id: true } });
      if (!existing) return NextResponse.json({ success: false, error: 'Record not found.' }, { status: 404 });
      const updated = await db.studentEnglishTestRecord.update({ where: { id: existing.id }, data: result.value as never });
      return NextResponse.json({ success: true, data: updated });
    }

    const result = validateVisaRefusal(payload);
    if (!result.valid) return issuesResponse(result.issues);
    const existing = await db.studentVisaRefusal.findFirst({ where: { id, studentProfileId: profile.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Record not found.' }, { status: 404 });
    const updated = await db.studentVisaRefusal.update({ where: { id: existing.id }, data: result.value as never });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('[profile.sections] update failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Could not update that record.' }, { status: 500 });
  }
}
