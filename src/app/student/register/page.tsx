import StudentRegisterView from '@/components/auth/StudentRegisterView';

export const metadata = {
  title: 'Create a Student Account | ALO Education',
  description: 'Create your free ALO student account and start a university application with a real counselor.',
  robots: { index: false, follow: false },
};

export default function StudentRegisterPage() {
  return <StudentRegisterView />;
}
