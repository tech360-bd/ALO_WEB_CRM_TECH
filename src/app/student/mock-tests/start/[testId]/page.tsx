'use client';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function StudentMockTestStartPage() {
  const params = useParams();
  const testId = params?.testId as string;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
          <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs mb-3">English Test Center — Start Mock Test — 3 Free Full Mocks for ALO Full Students</Badge>
          <h1 className="text-2xl font-bold">Start Mock Test — {testId}</h1>
          <p className="text-sm text-gray-600 mt-2">Track remaining credits, used credits, paid credits, mock history, latest result, weak areas — English Test-only students separate limited dashboard must not gain admission/visa access unless upgraded — RBAC enforced.</p>
          <Link href={`/student/mock-tests/session/${testId}`}><Button className="mt-6 bg-[#F97316] text-white h-12 px-8 font-bold w-full">Start Test — {testId} — Creates TestSession</Button></Link>
        </Card>
      </div>
    </div>
  );
}
