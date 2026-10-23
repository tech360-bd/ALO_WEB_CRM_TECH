import { formBDocumentsComplete } from '@/lib/forms/form-b-documents';
import { db } from '@/lib/db';

import { isFormSectionComplete } from '@/lib/forms/form-section-validation';

/** Server-side Form B gate. Completion flags alone are never evidence. */
export type FormBSectionKey =
  | 'documents'
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
  { key: 'documents', label: 'Documents Upload', href: '/student/profile', required: true },
];

/** Optional sections: recorded for the counselor, never block an application. */
export const FORM_B_OPTIONAL_SECTIONS: FormBSection[] = [
  { key: 'lead', label: 'Lead Information', href: '/student/profile', required: false },
  { key: 'work', label: 'Work Experience', href: '/student/profile', required: false },
  { key: 'reference', label: 'Reference / LOR', href: '/student/profile', required: false },
];

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

/** Unknown students and malformed/partial snapshots fail closed. */
export async function getFormBReadiness(studentId: string): Promise<FormBReadiness> {
  const [student, sections, documents] = await Promise.all([
    db.student.findUnique({ where: { id: studentId }, select: { id: true } }),
    db.studentProfileSection.findMany({ where: { studentId }, select: { section: true, data: true } }),
    db.studentDocument.findMany({ where: { studentId, isArchived: false }, orderBy: [{ createdAt: 'desc' }, { version: 'desc' }], select: { category: true, status: true, version: true, fileName: true, storagePath: true } }),
  ]);
  const values: Record<string, unknown> = {};
  for (const row of sections) {
    if (row.section === 'form_b_ui') continue;
    try {
      const parsed = JSON.parse(row.data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.assign(values, parsed.entries?.[0] || parsed);
        if (row.section === 'english' && Array.isArray(parsed.entries)) values.englishTests = parsed.entries;
      }
    } catch { /* malformed sections remain incomplete */ }
  }
  const isComplete = (key: FormBSectionKey) => {
    if (key === 'documents') return Boolean(student) && formBDocumentsComplete(values, documents);
    return Boolean(student) && sections.some((row) => {
    if (row.section !== key) return false;
    try { return isFormSectionComplete(key, JSON.parse(row.data)); } catch { return false; }
    });
  };
  const completed = FORM_B_REQUIRED_SECTIONS.filter((section) => isComplete(section.key)).map((section) => section.key);
  const missing = FORM_B_REQUIRED_SECTIONS.filter((section) => !isComplete(section.key));
  return { complete: missing.length === 0, percent: Math.round(completed.length / FORM_B_REQUIRED_SECTIONS.length * 100), missing, completed };
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
