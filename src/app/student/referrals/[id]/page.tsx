'use client';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function StudentReferralDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs mb-3">Referral Detail — {id} — Configurable Conditions</Badge>
          <h1 className="text-2xl font-bold">Referral — {id}</h1>
          <p className="text-sm text-gray-600 mt-2">Referrer student ID, referred lead ID, campaign, source, timestamp — do not award benefits merely because someone clicked — define configurable referral conditions such as qualified lead/consultation completed/application submitted/enrollment/approved internal campaign condition — student can see referrals sent/pending/qualified/successful/available reward/offers — marketing can configure attractive offers from backend — Your Referral Code: AEFR-XXXXXX — share referral link/WhatsApp/Messenger/copy referral code/send directly to friend.</p>
          <Link href="/student/referrals"><Button variant="outline" className="mt-6 border-[#E2E8F0] h-11">Back to Referrals — My Referrals</Button></Link>
        </Card>
      </div>
    </div>
  );
}
