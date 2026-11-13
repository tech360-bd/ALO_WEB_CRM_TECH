import type { Metadata } from 'next';
import StudentInterviewPrep from '@/components/student/StudentInterviewPrep';

export const metadata: Metadata = {
  title: 'Interview Preparation | ALO Education',
  description:
    'Your interview preparation workspace: sourced, dated university questions and answer frameworks built only from facts you provide.',
};

/**
 * Student interview preparation.
 *
 * This route previously rendered the SOP/CV studio, which is served separately
 * at /student/sop. The interview surface now loads the provenance-checked
 * research pack for the student's own application.
 */
export default function StudentInterviewPage() {
  return <StudentInterviewPrep />;
}
