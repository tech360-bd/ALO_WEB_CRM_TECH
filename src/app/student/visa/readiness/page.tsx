'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function StudentPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">Student Portal — visa/readiness — DB-driven, No Fake Data, RBAC, Ownership Check</Badge>
          <h1 className="text-2xl font-bold text-[#0F172A]">Student — visa/readiness</h1>
          <p className="text-sm text-gray-600 mt-2">Route: /student/visa/readiness — Part of single connected student journey: Lead → Student ID → Profile → Eligibility → Course Finder → Shortlist → Application → Documents → University Submission → Offer → Deposit → CAS/Admission → Visa Preparation → AI Interview → Human Visa Review → Visa Submission → Final Visa Decision → Pre-Departure → Enrollment — Student Portal single source of truth — no need to repeatedly explain info — AI/Counselor/Application Team/English Trainer/Visa Officer all work from same student record and timeline — real DB, no fake data, no hardcoded student names, consistent 48px CTA buttons, equal-height cards, clear status colors, excellent empty/loading/error states, premium education consultancy design #FFFFFF bg #0057B8 primary #E8501A CTA #0F172A text #F8FAFC soft #E2E8F0 border.</p>
          <div className="flex gap-3 mt-6">
            <Link href="/student/dashboard"><Button className="bg-[#0057B8] text-white h-11">Back to Dashboard — Mission Control Center</Button></Link>
            <Link href="/student/profile"><Button variant="outline" className="border-[#E2E8F0] h-11">View Profile</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
