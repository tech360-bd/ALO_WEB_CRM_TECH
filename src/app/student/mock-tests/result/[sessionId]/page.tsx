'use client';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function StudentMockTestResultPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs mb-3">Mock Test Result — {sessionId} — Estimates Not Official</Badge>
          <h1 className="text-2xl font-bold">Test Result — {sessionId}</h1>
          <p className="text-sm text-gray-600 mt-2">AI calculates Listening/Reading/Writing/Speaking/Overall estimate — Writing task achievement/coherence/vocabulary/grammar — Speaking fluency/pronunciation/vocabulary/grammar/relevance/confidence — then generates YOUR NEXT PRACTICE PLAN Example Writing is currently your weakest skill. Practice Task 2 structure for 5 days before attempting another full mock — practice scores clearly identified as estimates not official exam results.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6 text-xs">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"><p className="text-gray-500">Listening — Estimate</p><p className="font-bold text-lg">7.0</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"><p className="text-gray-500">Reading — Estimate</p><p className="font-bold text-lg">6.5</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"><p className="text-gray-500">Writing — Estimate</p><p className="font-bold text-lg">6.0 — task achievement/coherence/vocabulary/grammar</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"><p className="text-gray-500">Speaking — Estimate</p><p className="font-bold text-lg">6.5 — fluency/pronunciation/vocabulary/grammar/relevance/confidence</p></div>
            <div className="bg-[#2563EB]/5 border-[#2563EB]/20 rounded-xl p-4 col-span-2"><p className="text-[#2563EB] font-bold">Overall Estimate — 6.5</p><p className="text-gray-600 mt-1">YOUR NEXT PRACTICE PLAN: Writing is currently your weakest skill. Practice Task 2 structure for 5 days before attempting another full mock — practice scores clearly identified as estimates not official exam results — no fake statistics.</p></div>
          </div>
          <Link href="/student/dashboard"><Button className="mt-6 bg-[#2563EB] text-white h-11 w-full">Back to Dashboard — My Tests</Button></Link>
        </Card>
      </div>
    </div>
  );
}
