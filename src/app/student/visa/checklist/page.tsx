import StudentVisaChecklist from '@/components/student/StudentVisaChecklist';

export const metadata = {
  title: 'Visa Document Checklist | ALO Education',
  description: 'Every document your visa file needs, grouped by category, with what is still outstanding.',
};

export default function StudentVisaChecklistPage() {
  return <StudentVisaChecklist />;
}
