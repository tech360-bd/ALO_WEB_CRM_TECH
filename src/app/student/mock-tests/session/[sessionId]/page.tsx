'use client';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function StudentMockTestSessionPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
          <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 text-xs mb-3">Mock Test Session — {sessionId} — AI Analysis</Badge>
          <h1 className="text-2xl font-bold">Mock Test Session — {sessionId}</h1>
          <p className="text-sm text-gray-600 mt-2">AI calculates Listening/Reading/Writing/Speaking/Overall estimate, Writing task achievement/coherence/vocabulary/grammar, Speaking fluency/pronunciation/vocabulary/grammar/relevance/confidence, then generates YOUR NEXT PRACTICE PLAN — practice scores clearly identified as estimates not official exam results.</p>
          <Link href={`/student/mock-tests/result/${sessionId}`}><Button className="mt-6 bg-[#2563EB] text-white h-12 px-8 font-bold w-full">Submit & View Result — AI Analysis + Next Practice Plan</Button></Link>
        </Card>
      </div>
    </div>
  );
}
