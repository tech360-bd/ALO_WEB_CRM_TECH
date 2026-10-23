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
import RelatedQuestions from './RelatedQuestions';

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

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error || !resource) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">Information not currently verified. Please check with an ALO Education counselor.</p><Link href="/resources"><Button className="mt-4 bg-[var(--alo-brand)] text-white h-12">Browse Resources</Button></Link></Card></div>;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
        <nav className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] font-medium">
          <Link href="/" className="hover:text-[var(--alo-brand)]">Home</Link><span>›</span><Link href="/resources" className="hover:text-[var(--alo-brand)]">Resources</Link><span>›</span><span className="text-[var(--alo-body)]">{resource.category?.name || 'Resource'}</span><span>›</span><span className="text-[var(--alo-brand)] font-bold">{resource.title}</span>
        </nav>

        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs">{resource.category?.name || 'Resource'}</Badge>
            {resource.countrySlug && <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-xs">{resource.countrySlug}</Badge>}
            {resource.studyLevel && <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-xs">{resource.studyLevel}</Badge>}
            {resource.verificationStatus && <Badge className={`${resource.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[11px]`}>{resource.verificationStatus} {resource.lastVerifiedAt ? `• ${new Date(resource.lastVerifiedAt).toLocaleDateString()}` : ''}</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--alo-text)] tracking-tight mb-3">{resource.title}</h1>
          <p className="text-base text-[var(--alo-body)] mb-4">{resource.summary || resource.excerpt || 'Practical information for students to understand the topic.'}</p>
          <div className="flex items-center gap-4 text-xs text-[var(--alo-text-muted)]">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{resource.readingTime || 5} min read</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{resource.publishedAt ? new Date(resource.publishedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            <span>By {resource.authorId || 'ALO Education Team'}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Table of Contents (spec §30) — auto-generated, click scrolls */}
            <Card className="p-5 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl sticky top-24 z-10">
              <h2 className="font-bold text-sm text-[var(--alo-text)] mb-2">Table of Contents</h2>
              <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs list-decimal list-inside">
                {[
                  ['overview', 'Overview'], ['details', 'In Depth'], ['who-requirements', 'Who & Requirements'],
                  ['documents-timeline', 'Documents, Timeline & Fees'], ['mistakes', 'Common Mistakes'],
                  ['sources', 'Official Sources & Verification'], ['checklist', 'Action Checklist'],
                  ['faqs', 'FAQs'], ['related', 'Related Questions'], ['next', 'Ready to Start'],
                ].map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} className="text-[var(--alo-brand)] hover:underline font-medium">{label}</a></li>
                ))}
              </ol>
            </Card>

            {/* 1-16 sections per spec */}
            <Card id="overview" className="p-6 md:p-8 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm scroll-mt-28">
              <h2 className="text-xl font-bold mb-4">Overview — Summary & Key Takeaways</h2>
              <p className="text-sm text-[var(--alo-body)] leading-relaxed mb-4">{resource.summary || resource.excerpt || 'Summary — practical information for students.'}</p>
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4">
                <h4 className="font-semibold text-sm mb-2">Key Takeaways</h4>
                <ul className="space-y-1.5 text-xs text-[var(--alo-body)] list-disc list-inside">
                  {(resource.keyTakeaways ? (()=>{try{return typeof resource.keyTakeaways === 'string' ? JSON.parse(resource.keyTakeaways) : resource.keyTakeaways}catch{return []}})() : ['Understand requirements', 'Prepare documents', 'Check official sources', 'Avoid common mistakes', 'Book consultation for personalized guidance']).map((k:any, i:number)=><li key={i}>{typeof k === 'string' ? k : JSON.stringify(k)}</li>)}
                </ul>
              </div>
            </Card>

            <Card id="details" className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm scroll-mt-28">
              <h3 className="font-bold text-[var(--alo-text)] mb-3">In Depth — Detailed Explanation</h3>
              <div className="prose prose-sm max-w-none text-sm text-[var(--alo-body)] leading-relaxed whitespace-pre-wrap">{resource.detailedExplanation || resource.content || 'Detailed explanation — enough practical information for a student to understand the topic. Summarized and rewritten in original ALO Education language, not copied word-for-word from external websites.'}</div>
            </Card>

            <div id="who-requirements" className="grid md:grid-cols-2 gap-4 scroll-mt-28">
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Who This Applies To</h4><p className="text-xs text-[var(--alo-body)]">{resource.whoAppliesTo || 'Students applying for study abroad — check specific eligibility.'}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Requirements</h4><p className="text-xs text-[var(--alo-body)]">{resource.requirements || 'Requirements vary — check official source and course requirements.'}</p></Card>
              <div id="documents-timeline" className="contents scroll-mt-28">
                <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Documents</h4><p className="text-xs text-[var(--alo-body)]">{resource.documents ? (typeof resource.documents === 'string' ? (()=>{try{return JSON.parse(resource.documents).join(', ')}catch{return resource.documents}})() : resource.documents.join(', ')) : 'Passport, Academic Certificates, Transcripts, English Test, SOP, LOR, CV, Financial Evidence'}</p></Card>
                <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Timeline & Fees & Deadlines</h4><p className="text-xs text-[var(--alo-body)]">Timeline: {resource.timeline || 'Processing times vary by institution, country, intake and applicant circumstances.'} • Fees: {resource.fees ? (<>{resource.fees}{resource.lastVerifiedAt ? ` (Last verified: ${new Date(resource.lastVerifiedAt).toLocaleDateString()}${resource.sourceName ? ` • Source: ${resource.sourceName}` : ''})` : ''}</>) : 'Fees are shown only when verified — check the official source.'} • Deadlines: {resource.deadlines || 'Check official source'}</p></Card>
              </div>
            </div>

            {/* Important Notes (spec §29) */}
            <Card className="p-5 bg-amber-50 border-amber-200 rounded-2xl">
              <h4 className="font-bold text-sm mb-2 text-amber-800">Important Notes</h4>
              <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                <li>Rules, fees and processing times change — time-sensitive items show their last-verified date; verify before acting.</li>
                <li>Country-specific rules are kept separate on ALO — never assume one country's rule applies to another.</li>
                <li>ALO Education guides and supports; decisions always rest with universities, test providers and government authorities.</li>
              </ul>
            </Card>

            <Card id="mistakes" className="p-6 bg-amber-50 border-amber-200 rounded-2xl scroll-mt-28"><h4 className="font-bold text-sm mb-2 text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Common Mistakes</h4><p className="text-xs text-amber-700">{resource.commonMistakes ? (typeof resource.commonMistakes === 'string' ? (()=>{try{return JSON.parse(resource.commonMistakes).join(', ')}catch{return resource.commonMistakes}})() : resource.commonMistakes.join(', ')) : 'Incomplete documents, missing deadlines, inconsistent information, not checking official sources'}</p></Card>

            {/* Action Checklist (spec §29) */}
            <Card id="checklist" className="p-6 bg-emerald-50 border-emerald-200 rounded-2xl scroll-mt-28">
              <h4 className="font-bold text-sm mb-3 text-emerald-800">Action Checklist</h4>
              <ul className="space-y-2 text-xs text-emerald-900">
                {(resource.actionChecklist ? (()=>{try{return typeof resource.actionChecklist === 'string' ? JSON.parse(resource.actionChecklist) : resource.actionChecklist}catch{return []}})() : [
                  'Confirm the exact requirement on the official source linked above',
                  'Gather the documents listed in the Documents section',
                  'Check deadlines and work backwards with a written plan',
                  'Apply / submit through the official channel',
                  'Keep copies of everything you submit',
                  'Book a free ALO consultation if anything is unclear',
                ]).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2"><input type="checkbox" aria-label={item} className="mt-0.5 w-3.5 h-3.5 accent-emerald-600" />{item}</li>
                ))}
              </ul>
            </Card>

            <Card id="sources" className="p-6 bg-blue-50 border-blue-100 rounded-2xl scroll-mt-28"><h4 className="font-bold text-sm mb-2 text-[var(--alo-brand)] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />ALO Guidance & Official Sources & Last Verified</h4><p className="text-xs text-[var(--alo-body)] leading-relaxed">{resource.aloGuidance || 'ALO provides structured guidance, document checking, eligibility review — distinguish Official Requirement vs ALO Guidance vs General Information.'}</p><p className="text-xs text-[var(--alo-text-muted)] mt-3">Official Sources: {resource.officialSources ? (typeof resource.officialSources === 'string' ? (()=>{try{return JSON.parse(resource.officialSources).map((s:any)=> s.sourceName || s).join(', ')}catch{return resource.officialSources}})() : JSON.stringify(resource.officialSources)) : resource.sourceUrl ? <a href={resource.sourceUrl} target="_blank" className="text-[var(--alo-brand)] underline">{resource.sourceUrl}</a> : 'Information not currently verified.'} • Last verified: {resource.lastVerifiedAt ? new Date(resource.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'} • Status: {resource.verificationStatus || 'pending'}{(resource.verificationStatus === 'EXPIRED' || resource.verificationStatus === 'expired') && <span className="block text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2">Information may have changed. Please verify the latest requirements before applying.</span>}</p></Card>

            <div id="faqs" className="scroll-mt-28">
              <FaqAccordion targetType="resource" targetSlug={resource.slug} title={`Still Have Questions? — FAQs about ${resource.title}`} limit={10} />
            </div>

            {/* Related Questions (spec §38) */}
            <div id="related" className="scroll-mt-28">
              <RelatedQuestions type="resource" context={resource.category?.name || resource.slug} title="Related Questions" count={6} />
            </div>

            <RelatedContentEngine sourceType="resource" sourceId={resource.id} sourceSlug={resource.slug} country={resource.countrySlug} studyLevel={resource.studyLevel} title="Explore More — Related Resources, Services, Scholarships, Courses" />

            <Card id="next" className="p-8 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-3xl text-white text-center scroll-mt-28">
              <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
              <p className="text-sm text-blue-100 mb-6">Move from information to eligibility to application — with verified knowledge and an ALO counselor beside you.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/book-consultation"><Button className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] h-12 px-8 font-bold">Book Free Consultation</Button></Link>
                <Link href="/course-finder"><Button className="bg-white text-[var(--alo-brand)] hover:bg-blue-50 h-12 px-6 font-bold">Find Courses</Button></Link>
                <Link href="/eligibility-check"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Check Eligibility</Button></Link>
                <Link href="/contact"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Chat with Counselor</Button></Link>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3">Quick Actions — No Dead-End Pages</h3><div className="space-y-2"><Link href="/course-finder" className="block"><Button className="w-full bg-[var(--alo-brand)] text-white h-12">Find Courses</Button></Link><Link href="/book-consultation" className="block"><Button className="w-full bg-[var(--alo-cta)] text-black h-12">Book Consultation</Button></Link><Link href="/resources" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">Related Resources</Button></Link></div></Card>
            <TestPreparationMiniCard contextTitle={`English for ${resource.title}`} compact />
            <Card className="p-6 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl"><h3 className="font-bold text-sm mb-3">SEO & Verification</h3><div className="space-y-2 text-xs"><p><strong>Title:</strong> {resource.seoTitle || resource.title}</p><p><strong>Description:</strong> {resource.seoDescription || resource.summary || ''}</p><p><strong>Canonical:</strong> {resource.canonicalUrl || `/resources/${resource.slug}`}</p><p><strong>Verification:</strong> <Badge className={`${resource.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[11px]`}>{resource.verificationStatus || 'pending'}</Badge></p><p><strong>Last Verified:</strong> {resource.lastVerifiedAt ? new Date(resource.lastVerifiedAt).toLocaleDateString() : 'Not verified'}</p></div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
