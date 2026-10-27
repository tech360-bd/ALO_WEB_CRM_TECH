import type { Metadata } from 'next';
import StudentRegisterView from '@/components/auth/StudentRegisterView';

// Spec-named student registration URL (/student-register). Shares the same
// RegisterPage component as /student/register so the two routes cannot drift.
export const metadata: Metadata = {
  title: 'Create a Student Account | ALO Education',
  description: 'Create your free ALO student account and start a university application with a real counselor.',
  alternates: { canonical: 'https://aloeducation.com/student-register' },
  robots: { index: false, follow: false },
};

export default function StudentRegisterAliasPage() {
  return <StudentRegisterView />;
}
