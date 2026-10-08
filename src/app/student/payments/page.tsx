import StudentPaymentsPage from '@/components/student/StudentPaymentsPage';

export const metadata = {
  title: 'Payments | ALO Education',
  description: 'Service charges and payments recorded against your file, with what is still outstanding.',
};

export default function StudentPaymentsRoute() {
  return <StudentPaymentsPage />;
}
