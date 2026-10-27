import type { Metadata } from 'next';
import TestStudentView from '@/components/student/TestStudentView';

// QA entry point for the student journey.
//
// "Test student" here means: run the real checks against the signed-in student
// account and show PASS / FAIL / SKIPPED per check. It deliberately does NOT
// create a demo student with invented data — a fabricated test account would
// hide exactly the defects this page is meant to catch.
export const metadata: Metadata = {
  title: 'Student Journey Self-Check | ALO Education',
  description: 'Verify that a student account is wired end to end: profile, shortlist, documents, applications, English test.',
  robots: { index: false, follow: false },
};

export default function TestStudentPage() {
  return <TestStudentView />;
}
