import { NextResponse } from 'next/server';
import { authenticateStudentRequest } from '@/lib/student-auth';
import { db } from '@/lib/db';
import { studentFormSections, sanitiseStudentForm, studentFormFromSections } from '@/lib/forms/student-form-adapter';
import { isFormSectionComplete } from '@/lib/forms/form-section-validation';
import { REQUIRED_APPLICATION_SECTIONS, type FormSectionKey } from '@/lib/forms/application-form-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await authenticateStudentRequest(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const rows = await db.studentProfileSection.findMany({ where: { studentId: auth.studentId } });
    const saved = rows.find((row) => row.section === 'form_b_ui');
    let data: Record<string, unknown> = {};
    if (saved) {
      try { data = sanitiseStudentForm(JSON.parse(saved.data)); } catch { /* corrupted saved data is not completion */ }
    }
    const complete = REQUIRED_APPLICATION_SECTIONS.filter((key) => rows.some((row) => {
      if (row.section !== key) return false;
      try { return isFormSectionComplete(key, JSON.parse(row.data)); } catch { return false; }
    })).length;
    return NextResponse.json({ success: true, data: {
      studentId: auth.studentCode,
      givenName: auth.name.split(' ')[0] || '', familyName: auth.name.split(' ').slice(1).join(' '),
      leadEmail: auth.email, primaryEmail: auth.email, mobile: auth.phone, contactPhone: auth.phone,
      ...studentFormFromSections(rows), ...data, profileCompletion: Math.round(complete / REQUIRED_APPLICATION_SECTIONS.length * 100),
    } });
  } catch {
    return NextResponse.json({ success: false, error: 'Profile is temporarily unavailable.' }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const auth = await authenticateStudentRequest(req);
  if (auth instanceof NextResponse) return auth;
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > 1000000) return NextResponse.json({ success: false, error: 'Profile is too large.' }, { status: 413 });
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return NextResponse.json({ success: false, error: 'Invalid profile.' }, { status: 400 });
  const form = sanitiseStudentForm(raw as Record<string, unknown>);
  const sections = studentFormSections(form);
  const completed = REQUIRED_APPLICATION_SECTIONS.filter((key) => isFormSectionComplete(key, sections[key]));
  const profileCompletion = Math.round(completed.length / REQUIRED_APPLICATION_SECTIONS.length * 100);
  try {
    await db.$transaction(async (tx) => {
      const now = new Date();
      for (const [section, payload] of Object.entries({ ...sections, form_b_ui: form })) {
        const complete = section !== 'form_b_ui' && isFormSectionComplete(section as FormSectionKey, payload);
        // A section is a snapshot, not a document-review decision. Students cannot
        // write verified/rejected status or counselor comments through this route.
        await tx.studentProfileSection.deleteMany({ where: { studentId: auth.studentId, section } });
        await tx.studentProfileSection.create({ data: {
          studentId: auth.studentId, section, data: JSON.stringify(payload),
          status: complete ? 'complete' : 'incomplete', completedAt: complete ? now : null,
        } });
      }
      await tx.student.update({ where: { id: auth.studentId }, data: { profileComplete: profileCompletion } });
    });
    return NextResponse.json({ success: true, data: { profileCompletion } });
  } catch {
    return NextResponse.json({ success: false, error: 'Profile could not be saved. Please retry.' }, { status: 503 });
  }
}
