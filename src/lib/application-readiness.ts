import { db } from '@/lib/db';

/**
 * FORM B — readiness gate
 * =======================
 * "Apply Now must NEVER show success unless Form B is fully completed."
 *
 * Form B is the student-portal profile (src/components/student/StudentProfilePage.tsx),
 * split into the eleven sections below. This module is the single server-side
 * definition of what "complete" means, used by:
 *
 *   • POST /api/applications  → refuses a student self-application (Form A)
 *     while any required section is incomplete, so the rule cannot be bypassed
 *     by calling the API directly.
 *   • GET  /api/student/application-readiness → the UI shows the same list.
 *
 * A section counts as complete when EITHER
 *   (a) the portal marked it complete (StudentProfileSection.status), or
 *   (b) the structured records a counselor/student already saved satisfy it
 *       (e.g. an education row exists with level + institution + result).
 * Nothing is auto-completed on the student's behalf and no section is optional:
 * funding, work experience and references are recorded as "not applicable"
 * through the portal, which marks the section complete.
 */

export type FormBSectionKey =
  | 'lead'
  | 'personal'
  | 'contact'
  | 'education'
  | 'passport'
  | 'english'
  | 'work'
  | 'reference'
  | 'background'
  | 'funding'
  | 'admission';

export interface FormBSection {
  key: FormBSectionKey;
  label: string;
  /** Where the student completes it. */
  href: string;
  required: boolean;
}

/** Sections a student must finish before an application can be created. */
export const FORM_B_REQUIRED_SECTIONS: FormBSection[] = [
  { key: 'personal', label: 'Personal Information', href: '/student/profile', required: true },
  { key: 'contact', label: 'Contact Information', href: '/student/profile', required: true },
  { key: 'education', label: 'Education History', href: '/student/profile', required: true },
  { key: 'passport', label: 'Passport Details', href: '/student/profile', required: true },
  { key: 'english', label: 'English Test Score', href: '/student/profile', required: true },
  { key: 'background', label: 'Background & Visa', href: '/student/profile', required: true },
  { key: 'funding', label: 'Funding Information', href: '/student/profile', required: true },
  { key: 'admission', label: 'Admission Preference', href: '/student/profile', required: true },
];

/** Optional sections: recorded for the counselor, never block an application. */
export const FORM_B_OPTIONAL_SECTIONS: FormBSection[] = [
  { key: 'lead', label: 'Lead Information', href: '/student/profile', required: false },
  { key: 'work', label: 'Work Experience', href: '/student/profile', required: false },
  { key: 'reference', label: 'Reference / LOR', href: '/student/profile', required: false },
];

const COMPLETE_STATUSES = new Set(['complete', 'completed', 'verified', 'approved', 'done']);

export interface FormBReadiness {
  /** True only when every required section is complete. */
  complete: boolean;
  /** 0-100, counting required sections. */
  percent: number;
  /** Required sections still missing, in the order they should be filled. */
  missing: FormBSection[];
  /** Required sections already complete (useful for the portal checklist). */
  completed: FormBSectionKey[];
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  return true;
}

/**
 * Reads everything Form B can be derived from and returns the readiness report.
 * Never throws for a missing student — an unknown student is "not ready".
 */
export async function getFormBReadiness(studentId: string): Promise<FormBReadiness> {
  const [student, sections, education, englishTests, passport, applications] = await Promise.all([
    db.student.findUnique({
      where: { id: studentId },
      select: { name: true, email: true, phone: true, counselorId: true },
    }),
    db.studentProfileSection.findMany({ where: { studentId }, select: { section: true, status: true } }),
    db.studentEducation.findMany({
      where: { studentId },
      select: { level: true, institution: true, gpa: true, endYear: true },
    }),
    db.studentEnglishTest.findMany({
      where: { studentId },
      select: { testType: true, overallScore: true },
    }),
    db.studentPassport.findFirst({ where: { studentId }, select: { passportNumber: true, nationality: true } }),
    db.application.findMany({
      where: { studentId },
      select: { universityName: true, courseName: true, intake: true },
    }),
  ]);

  const markedComplete = new Set(
    sections
      .filter((row) => COMPLETE_STATUSES.has(String(row.status || '').toLowerCase()))
      .map((row) => row.section as FormBSectionKey)
  );

  const derived: Record<FormBSectionKey, boolean> = {
    lead: Boolean(student?.counselorId),
    // Personal: a name plus at least one contact-verified identity field.
    personal: isFilled(student?.name),
    contact: isFilled(student?.email) && isFilled(student?.phone),
    education: education.some((row) => isFilled(row.level) && isFilled(row.institution) && (isFilled(row.gpa) || isFilled(row.endYear))),
    // A passport row, or the portal section marked complete (which is how a
    // student records "no passport yet").
    passport: Boolean(passport && isFilled(passport.passportNumber)) || markedComplete.has('passport'),
    // A recorded test score, or the section marked complete ("planning" / "yet to receive").
    english: englishTests.some((row) => isFilled(row.testType) && row.overallScore > 0) || markedComplete.has('english'),
    work: markedComplete.has('work'),
    reference: markedComplete.has('reference'),
    background: markedComplete.has('background'),
    funding: markedComplete.has('funding'),
    // At least one admission preference (course + university + intake) is the
    // basis of every application, so it is derived from an existing application
    // record as well as the portal section.
    admission:
      markedComplete.has('admission') ||
      applications.some((row) => isFilled(row.universityName) && isFilled(row.courseName) && isFilled(row.intake)),
  };

  const isComplete = (key: FormBSectionKey) => markedComplete.has(key) || derived[key];

  const completed = FORM_B_REQUIRED_SECTIONS.filter((section) => isComplete(section.key)).map((section) => section.key);
  const missing = FORM_B_REQUIRED_SECTIONS.filter((section) => !isComplete(section.key));

  return {
    complete: missing.length === 0,
    percent: Math.round((completed.length / FORM_B_REQUIRED_SECTIONS.length) * 100),
    missing,
    completed,
  };
}

/** Shape returned to the browser by the readiness endpoint. */
export function serialiseReadiness(readiness: FormBReadiness) {
  return {
    complete: readiness.complete,
    percent: readiness.percent,
    missing: readiness.missing.map((section) => ({ key: section.key, label: section.label, href: section.href })),
    completed: readiness.completed,
  };
}
