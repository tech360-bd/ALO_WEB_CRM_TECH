'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, FileText, Award, Shield, AlertTriangle, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import RelatedContentEngine from './RelatedContentEngine';
import FaqAccordion from './FaqAccordion';
import TestPreparationMiniCard from './TestPreparationMiniCard';

interface Props {
  slug: string;
}

export default function ResourceDetailHub({ slug }: Props) {
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/resources/${encodeURIComponent(slug)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed ${r.status}`);
        return r.json();
      })
      .then(d => setResource(d.resource || d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error || !resource) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">Information not currently verified. Please check with an ALO Education counselor.</p><Link href="/resources"><Button className="mt-4 bg-[#0B5ED7] text-white h-11">Browse Resources</Button></Link></Card></div>;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
        <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-[#0B5ED7]">Home</Link><span>›</span><Link href="/resources" className="hover:text-[#0B5ED7]">Resources</Link><span>›</span><span className="text-gray-700">{resource.category?.name || 'Resource'}</span><span>›</span><span className="text-[#0B5ED7] font-bold">{resource.title}</span>
        </nav>

        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs">{resource.category?.name || 'Resource'}</Badge>
            {resource.countrySlug && <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-xs">{resource.countrySlug}</Badge>}
            {resource.studyLevel && <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-xs">{resource.studyLevel}</Badge>}
            {resource.verificationStatus && <Badge className={`${resource.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{resource.verificationStatus} {resource.lastVerifiedAt ? `• ${new Date(resource.lastVerifiedAt).toLocaleDateString()}` : ''}</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight mb-3">{resource.title}</h1>
          <p className="text-base text-gray-600 mb-4">{resource.summary || resource.excerpt || 'Practical information for students to understand the topic.'}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{resource.readingTime || 5} min read</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{resource.publishedAt ? new Date(resource.publishedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            <span>By {resource.authorId || 'ALO Education Team'}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* 1-16 sections per spec */}
            <Card className="p-6 md:p-8 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold mb-4">Summary & Key Takeaways</h2>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{resource.summary || resource.excerpt || 'Summary — practical information for students.'}</p>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                <h4 className="font-semibold text-sm mb-2">Key Takeaways</h4>
                <ul className="space-y-1.5 text-xs text-gray-700 list-disc list-inside">
                  {(resource.keyTakeaways ? (()=>{try{return typeof resource.keyTakeaways === 'string' ? JSON.parse(resource.keyTakeaways) : resource.keyTakeaways}catch{return []}})() : ['Understand requirements', 'Prepare documents', 'Check official sources', 'Avoid common mistakes', 'Book consultation for personalized guidance']).map((k:any, i:number)=><li key={i}>{typeof k === 'string' ? k : JSON.stringify(k)}</li>)}
                </ul>
              </div>
            </Card>

            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[#0F172A] mb-3">Detailed Explanation</h3>
              <div className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{resource.detailedExplanation || resource.content || 'Detailed explanation — enough practical information for a student to understand the topic. Summarized and rewritten in original ALO Education language, not copied word-for-word from external websites.'}</div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Who This Applies To</h4><p className="text-xs text-gray-600">{resource.whoAppliesTo || 'Students applying for study abroad — check specific eligibility.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Requirements</h4><p className="text-xs text-gray-600">{resource.requirements || 'Requirements vary — check official source and course requirements.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Documents</h4><p className="text-xs text-gray-600">{resource.documents ? (typeof resource.documents === 'string' ? (()=>{try{return JSON.parse(resource.documents).join(', ')}catch{return resource.documents}})() : resource.documents.join(', ')) : 'Passport, Academic Certificates, Transcripts, English Test, SOP, LOR, CV, Financial Evidence'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl"><h4 className="font-bold text-sm mb-2">Timeline & Fees & Deadlines</h4><p className="text-xs text-gray-600">Timeline: {resource.timeline || '6-12 months before intake'} • Fees: {resource.fees || 'Check verified official source — do NOT fabricate'} • Deadlines: {resource.deadlines || 'Check official source'}</p></Card>
            </div>

            <Card className="p-6 bg-amber-50 border-amber-200 rounded-2xl"><h4 className="font-bold text-sm mb-2 text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Common Mistakes</h4><p className="text-xs text-amber-700">{resource.commonMistakes ? (typeof resource.commonMistakes === 'string' ? (()=>{try{return JSON.parse(resource.commonMistakes).join(', ')}catch{return resource.commonMistakes}})() : resource.commonMistakes.join(', ')) : 'Incomplete documents, missing deadlines, inconsistent information, not checking official sources'}</p></Card>

            <Card className="p-6 bg-blue-50 border-blue-100 rounded-2xl"><h4 className="font-bold text-sm mb-2 text-[#0B5ED7] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />ALO Guidance & Official Sources & Last Verified</h4><p className="text-xs text-gray-700 leading-relaxed">{resource.aloGuidance || 'ALO provides structured guidance, document checking, eligibility review — distinguish Official Requirement vs ALO Guidance vs General Information.'}</p><p className="text-xs text-gray-500 mt-3">Official Sources: {resource.officialSources ? (typeof resource.officialSources === 'string' ? (()=>{try{return JSON.parse(resource.officialSources).map((s:any)=> s.sourceName || s).join(', ')}catch{return resource.officialSources}})() : JSON.stringify(resource.officialSources)) : resource.sourceUrl ? <a href={resource.sourceUrl} target="_blank" className="text-[#0B5ED7] underline">{resource.sourceUrl}</a> : 'Information not currently verified.'} • Last verified: {resource.lastVerifiedAt ? new Date(resource.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'} • Status: {resource.verificationStatus || 'pending'}</p></Card>

            <FaqAccordion targetType="resource" targetSlug={resource.slug} title={`FAQs about ${resource.title}`} limit={10} />
            <RelatedContentEngine sourceType="resource" sourceId={resource.id} sourceSlug={resource.slug} country={resource.countrySlug} studyLevel={resource.studyLevel} title="Related Resources, Services, FAQs, Universities, Courses, Scholarships" />

            <Card className="p-8 bg-gradient-to-r from-[#0B5ED7] to-[#003d80] rounded-3xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Need Help with {resource.title}?</h3>
              <p className="text-sm text-blue-100 mb-6">Find courses, book consultation, related resources — every page must have at least one logical next step, no dead-end pages</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/course-finder"><Button className="bg-white text-[#0B5ED7] hover:bg-blue-50 h-12 px-8 font-bold">Find Courses</Button></Link>
                <Link href="/book-consultation"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-8 font-bold">Book Consultation</Button></Link>
                <Link href="/resources"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-8">Related Resources</Button></Link>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3">Quick Actions — No Dead-End Pages</h3><div className="space-y-2"><Link href="/course-finder" className="block"><Button className="w-full bg-[#0B5ED7] text-white h-11">Find Courses</Button></Link><Link href="/book-consultation" className="block"><Button className="w-full bg-[#F97316] text-white h-11">Book Consultation</Button></Link><Link href="/resources" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Related Resources</Button></Link></div></Card>
            <TestPreparationMiniCard contextTitle={`English for ${resource.title}`} compact />
            <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl"><h3 className="font-bold text-sm mb-3">SEO & Verification</h3><div className="space-y-2 text-xs"><p><strong>Title:</strong> {resource.seoTitle || resource.title}</p><p><strong>Description:</strong> {resource.seoDescription || resource.summary || ''}</p><p><strong>Canonical:</strong> {resource.canonicalUrl || `/resources/${resource.slug}`}</p><p><strong>Verification:</strong> <Badge className={`${resource.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{resource.verificationStatus || 'pending'}</Badge></p><p><strong>Last Verified:</strong> {resource.lastVerifiedAt ? new Date(resource.lastVerifiedAt).toLocaleDateString() : 'Not verified'}</p></div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
