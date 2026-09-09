import VisaInterviewWorkspace from '@/components/visa/VisaInterviewWorkspace';

export default async function EmployeeVisaInterviewCaseRoute({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = await params;
  return <VisaInterviewWorkspace caseId={resolvedParams.caseId} />;
}
