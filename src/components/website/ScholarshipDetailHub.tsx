'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Clock, FileText, Globe, DollarSign, Calendar, CheckCircle2, AlertTriangle, ArrowRight, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';
import RelatedContentEngine from './RelatedContentEngine';
import FaqAccordion from './FaqAccordion';

interface Props {
  slug: string;
}

export default function ScholarshipDetailHub({ slug }: Props) {
  const [scholarship, setScholarship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/scholarships/${encodeURIComponent(slug)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed ${r.status}`);
        return r.json();
      })
      .then(d => setScholarship(d.scholarship || d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error || !scholarship) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">Information not currently verified. Please check with an ALO Education counselor.</p><Link href="/scholarships"><Button className="mt-4 bg-[#0B5ED7] text-white h-11">Browse Scholarships</Button></Link></Card></div>;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
        <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-[#0B5ED7]">Home</Link><span>›</span><Link href="/scholarships" className="hover:text-[#0B5ED7]">Scholarships</Link><span>›</span><span className="text-[#0B5ED7] font-bold">{scholarship.name}</span>
        </nav>

        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 text-xs">Scholarship</Badge>
            <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-xs">{scholarship.country || 'Global'}</Badge>
            <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-xs">{scholarship.university || 'Multiple Universities'}</Badge>
            {scholarship.isFeatured && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Featured</Badge>}
            {scholarship.verificationStatus && <Badge className={`${scholarship.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{scholarship.verificationStatus} {scholarship.lastVerifiedAt ? `• ${new Date(scholarship.lastVerifiedAt).toLocaleDateString()}` : ''}</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight mb-3">{scholarship.name}</h1>
          <p className="text-lg text-gray-600 mb-2 flex items-center gap-2"><Award className="w-5 h-5 text-[#F97316]" />{scholarship.fundingAmount || `${scholarship.currency || ''} ${scholarship.amount || 'Check eligibility'}`} • {scholarship.fundingType || 'Funding'}</p>
          <p className="text-sm text-gray-500 mb-6">{scholarship.overview?.substring(0, 200) || scholarship.eligibility?.substring(0, 200) || 'Scholarship overview — check eligibility, funding amount, deadline, required documents, how to apply.'}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-6 font-bold">Check Eligibility</Button></Link>
            <Link href="/book-consultation"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Book Consultation</Button></Link>
            <Link href="/scholarships"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Find All Scholarships</Button></Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 29 sections per spec */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h2 className="text-xl font-bold mb-3">Overview</h2><p className="text-sm text-gray-700 leading-relaxed">{scholarship.overview || 'Information not currently verified. Please check with an ALO Education counselor.'}</p></Card>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Who Can Apply</h4><p className="text-xs text-gray-600">{scholarship.whoCanApply || 'Check eligibility — nationality, academic, English requirements vary.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Eligibility</h4><p className="text-xs text-gray-600">{scholarship.eligibility || 'Eligibility varies — check academic, English, nationality, course, university eligibility.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Academic Requirements</h4><p className="text-xs text-gray-600">{scholarship.academicRequirements || 'Academic requirements vary — check minimum GPA, qualifications.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">English Requirements</h4><p className="text-xs text-gray-600">{scholarship.englishRequirements || 'English requirements vary — check IELTS/PTE/TOEFL minimum.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Nationality Requirements</h4><p className="text-xs text-gray-600">{scholarship.nationalityRequirements || 'Nationality requirements — check eligible countries.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Course & University Eligibility</h4><p className="text-xs text-gray-600">Course: {scholarship.courseEligibility || 'Check'} • University: {scholarship.universityEligibility || 'Check'}</p></Card>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-emerald-50 border-emerald-200 rounded-2xl"><h4 className="font-bold text-sm mb-2 text-emerald-800">Funding Amount</h4><p className="text-sm font-bold text-emerald-900">{scholarship.fundingAmount || `${scholarship.currency} ${scholarship.amount}`}</p><p className="text-xs text-emerald-700 mt-1">{scholarship.fundingType}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">What Covers / Not Covers</h4><p className="text-xs text-gray-600">Covers: {scholarship.whatCovers || 'Tuition waiver, check official source'} • Not covers: {scholarship.whatNotCovers || 'Living cost, travel — check'}</p></Card>
            </div>
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[#0F172A] mb-4">Application Timeline, Documents, How to Apply, Selection Process</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Opening Date</p><p className="font-semibold">{scholarship.openingDate ? new Date(scholarship.openingDate).toLocaleDateString() : 'Check official source'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Closing Date / Deadline</p><p className="font-semibold text-[#F97316]">{scholarship.closingDate ? new Date(scholarship.closingDate).toLocaleDateString() : scholarship.deadline || 'Check official source'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Minimum Requirements</p><p className="font-semibold">{scholarship.minimumRequirements ? (typeof scholarship.minimumRequirements === 'string' ? (()=>{try{return JSON.parse(scholarship.minimumRequirements).join(', ')}catch{return scholarship.minimumRequirements}})() : JSON.stringify(scholarship.minimumRequirements)) : 'Check eligibility'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Required Documents</p><p className="font-semibold">{scholarship.requiredDocuments ? (typeof scholarship.requiredDocuments === 'string' ? (()=>{try{return JSON.parse(scholarship.requiredDocuments).join(', ')}catch{return scholarship.requiredDocuments}})() : scholarship.requiredDocuments.join(', ')) : 'Academic transcripts, English test, SOP, LOR, CV'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 col-span-2"><p className="text-gray-500">How to Apply</p><p className="font-semibold">{scholarship.howToApply?.substring(0, 200) || 'Check official scholarship application guide — steps vary'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Selection Process</p><p className="font-semibold">{scholarship.selectionProcess || 'Selection by scholarship provider — check official source'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Result Timeline</p><p className="font-semibold">{scholarship.resultTimeline || 'Check current provider information — do NOT fabricate result time'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Renewal Conditions</p><p className="font-semibold">{scholarship.renewalConditions || 'Check official source for renewal'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Common Mistakes</p><p className="font-semibold">{scholarship.commonMistakes ? (typeof scholarship.commonMistakes === 'string' ? (()=>{try{return JSON.parse(scholarship.commonMistakes).join(', ')}catch{return scholarship.commonMistakes}})() : scholarship.commonMistakes.join(', ')) : 'Missing deadline, incomplete documents, weak essays'}</p></div>
                <div className="bg-blue-50 border-blue-100 rounded-xl p-3"><p className="text-gray-500">How ALO Can Help</p><p className="font-semibold text-[#0B5ED7]">{scholarship.howAloHelps || 'ALO provides finding scholarships, eligibility review, deadline tracking, document preparation, statement support — do NOT guarantee scholarship awards'}</p></div>
              </div>
              <p className="text-xs text-gray-500 mt-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">Official Source: {scholarship.officialSourceUrl ? <a href={scholarship.officialSourceUrl} target="_blank" className="text-[#0B5ED7] underline break-all">{scholarship.officialSourceUrl}</a> : 'Information not currently verified.'} • Last verified: {scholarship.lastVerifiedAt ? new Date(scholarship.lastVerifiedAt).toLocaleDateString() : 'Not verified'} • Status: {scholarship.verificationStatus || 'pending'}</p>
            </Card>

            <RelatedContentEngine sourceType="scholarship" sourceId={scholarship.id} sourceSlug={scholarship.slug} country={scholarship.country} universityId={scholarship.universityId} title="Related Scholarships, Universities, Courses, FAQs" />
            <FaqAccordion targetType="scholarship" targetSlug={scholarship.slug} title={`FAQs about ${scholarship.name}`} limit={10} />

            <Card className="p-8 bg-gradient-to-r from-[#0B5ED7] to-[#003d80] rounded-3xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Check Eligibility for {scholarship.name}</h3>
              <p className="text-sm text-blue-100 mb-6">Find all scholarships, check eligibility, view application guide, book consultation</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-8 font-bold">Check Eligibility</Button></Link>
                <Link href="/book-consultation"><Button variant="outline" className="bg-white text-[#0B5ED7] hover:bg-blue-50 h-12 px-8 font-bold">Book Consultation</Button></Link>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3">Quick Actions</h3><div className="space-y-2"><Link href="/eligibility-check" className="block"><Button className="w-full bg-[#F97316] text-white h-11">Check Eligibility</Button></Link><Link href="/book-consultation" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Book Consultation</Button></Link><Link href="/scholarships" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Find All Scholarships</Button></Link></div></Card>
            <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl"><h3 className="font-bold text-sm mb-3">Official Source & Verification</h3><div className="space-y-2 text-xs"><p><strong>Official URL:</strong> {scholarship.officialSourceUrl ? <a href={scholarship.officialSourceUrl} target="_blank" className="text-[#0B5ED7] underline break-all">{scholarship.officialSourceUrl}</a> : 'Information not currently verified.'}</p><p><strong>Status:</strong> <Badge className={`${scholarship.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{scholarship.verificationStatus || 'pending'}</Badge></p><p><strong>Last Verified:</strong> {scholarship.lastVerifiedAt ? new Date(scholarship.lastVerifiedAt).toLocaleDateString() : 'Not verified'}</p></div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
