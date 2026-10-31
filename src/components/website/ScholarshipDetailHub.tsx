'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Clock, FileText, Globe, DollarSign, Calendar, CheckCircle2, AlertTriangle, ArrowRight, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';
import RelatedContentEngine from './RelatedContentEngine';
import FaqAccordion from './FaqAccordion';
import RelatedQuestions from './RelatedQuestions';
import EnquiryForm from './EnquiryForm';
import { computeScholarshipStatus, SCHOLARSHIP_STATUS_BADGES } from '@/lib/scholarships/status-engine';

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

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error || !scholarship) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-crm-warning-text mx-auto mb-2" /><p className="text-sm">Information not currently verified. Please check with an ALO Education counselor.</p><Link href="/scholarships"><Button className="mt-4 bg-[var(--alo-brand)] text-white h-12">Browse Scholarships</Button></Link></Card></div>;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
        <nav className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] font-medium">
          <Link href="/" className="hover:text-[var(--alo-brand)]">Home</Link><span>›</span><Link href="/scholarships" className="hover:text-[var(--alo-brand)]">Scholarships</Link><span>›</span><span className="text-[var(--alo-brand)] font-bold">{scholarship.name}</span>
        </nav>

        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-[var(--alo-cta)]/10 text-[var(--alo-cta)] border-[var(--alo-cta)]/20 text-xs">Scholarship</Badge>
            {(() => {
              const st = computeScholarshipStatus(scholarship);
              const badge = SCHOLARSHIP_STATUS_BADGES[st];
              const chip: Record<string, string> = {
                OPEN: 'bg-crm-success-bg text-crm-success-text border border-crm-success-border',
                CLOSING_SOON: 'bg-crm-warning-bg text-crm-warning-text border border-crm-warning-border',
                UPCOMING: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
                CLOSED: 'bg-crm-danger-bg text-crm-danger-text border border-crm-danger-border',
                NEEDS_VERIFICATION: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
              };
              return <Badge className={`${chip[st]} text-[11px] border`}>{badge.label}</Badge>;
            })()}
            <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-xs">{scholarship.country || 'Global'}</Badge>
            <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-xs">{scholarship.university || 'Multiple Universities'}</Badge>
            {scholarship.isFeatured && <Badge variant="neutral" className="text-xs">Featured</Badge>}
            {scholarship.verificationStatus && <Badge variant={scholarship.verificationStatus === 'verified' ? 'success' : 'warning'} className="text-[11px]">{scholarship.verificationStatus} {scholarship.lastVerifiedAt ? `• ${new Date(scholarship.lastVerifiedAt).toLocaleDateString()}` : ''}</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--alo-text)] tracking-tight mb-3">{scholarship.name}</h1>
          <p className="text-lg text-[var(--alo-body)] mb-2 flex items-center gap-2"><Award className="w-5 h-5 text-[var(--alo-cta)]" />{scholarship.fundingAmount || `${scholarship.currency || ''} ${scholarship.amount || 'Check eligibility'}`} • {scholarship.fundingType || 'Funding'}</p>
          <p className="text-sm text-[var(--alo-text-muted)] mb-6">{scholarship.overview?.substring(0, 200) || scholarship.eligibility?.substring(0, 200) || 'Scholarship overview — check eligibility, funding amount, deadline, required documents, how to apply.'}</p>
          <div className="flex flex-wrap gap-3">
            {computeScholarshipStatus(scholarship) === 'NEEDS_VERIFICATION' && (
                <p className="w-full text-xs bg-crm-warning-bg border border-crm-warning-border text-crm-warning-text rounded-xl p-3 mb-2">
                  Needs Manual Verification — information may have changed. Please verify the latest requirements on the official source before applying; do not treat this scholarship as currently open.
                </p>
            )}
            <Link href="/eligibility-check"><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-6 font-bold">Check Eligibility</Button></Link>
            <Link href="/book-consultation"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">Book Consultation</Button></Link>
            <Link href="/scholarships"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">Find All Scholarships</Button></Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 29 sections per spec */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h2 className="text-xl font-bold mb-3">Overview</h2><p className="text-sm text-[var(--alo-body)] leading-relaxed">{scholarship.overview || 'Information not currently verified. Please check with an ALO Education counselor.'}</p></Card>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Who Can Apply</h4><p className="text-xs text-[var(--alo-body)]">{scholarship.whoCanApply || 'Check eligibility — nationality, academic, English requirements vary.'}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Eligibility</h4><p className="text-xs text-[var(--alo-body)]">{scholarship.eligibility || 'Eligibility varies — check academic, English, nationality, course, university eligibility.'}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Academic Requirements</h4><p className="text-xs text-[var(--alo-body)]">{scholarship.academicRequirements || 'Academic requirements vary — check minimum GPA, qualifications.'}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">English Requirements</h4><p className="text-xs text-[var(--alo-body)]">{scholarship.englishRequirements || 'English requirements vary — check IELTS/PTE/TOEFL minimum.'}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Nationality Requirements</h4><p className="text-xs text-[var(--alo-body)]">{scholarship.nationalityRequirements || 'Nationality requirements — check eligible countries.'}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Course & University Eligibility</h4><p className="text-xs text-[var(--alo-body)]">Course: {scholarship.courseEligibility || 'Check'} • University: {scholarship.universityEligibility || 'Check'}</p></Card>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-crm-success-bg border border-crm-success-border rounded-2xl"><h4 className="font-bold text-sm mb-2 text-crm-success-text">Funding Amount</h4><p className="text-sm font-bold text-crm-success-text">{scholarship.fundingAmount || `${scholarship.currency} ${scholarship.amount}`}</p><p className="text-xs text-crm-success-text mt-1">{scholarship.fundingType}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">What Covers / Not Covers</h4><p className="text-xs text-[var(--alo-body)]">Covers: {scholarship.whatCovers || 'Tuition waiver, check official source'} • Not covers: {scholarship.whatNotCovers || 'Living cost, travel — check'}</p></Card>
            </div>
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[var(--alo-text)] mb-4">Application Timeline, Documents, How to Apply, Selection Process</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Opening Date</p><p className="font-semibold">{scholarship.openingDate ? new Date(scholarship.openingDate).toLocaleDateString() : 'Check official source'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Closing Date / Deadline</p><p className="font-semibold text-[var(--alo-cta)]">{scholarship.closingDate ? new Date(scholarship.closingDate).toLocaleDateString() : scholarship.deadline || 'Check official source'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Minimum Requirements</p><p className="font-semibold">{scholarship.minimumRequirements ? (typeof scholarship.minimumRequirements === 'string' ? (()=>{try{return JSON.parse(scholarship.minimumRequirements).join(', ')}catch{return scholarship.minimumRequirements}})() : JSON.stringify(scholarship.minimumRequirements)) : 'Check eligibility'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Required Documents</p><p className="font-semibold">{scholarship.requiredDocuments ? (typeof scholarship.requiredDocuments === 'string' ? (()=>{try{return JSON.parse(scholarship.requiredDocuments).join(', ')}catch{return scholarship.requiredDocuments}})() : scholarship.requiredDocuments.join(', ')) : 'Academic transcripts, English test, SOP, LOR, CV'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 col-span-2"><p className="text-[var(--alo-text-muted)]">How to Apply</p><p className="font-semibold">{scholarship.howToApply?.substring(0, 200) || 'Check official scholarship application guide — steps vary'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Selection Process</p><p className="font-semibold">{scholarship.selectionProcess || 'Selection by scholarship provider — check official source'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Result Timeline</p><p className="font-semibold">{scholarship.resultTimeline || 'Check current provider information — do NOT fabricate result time'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Renewal Conditions</p><p className="font-semibold">{scholarship.renewalConditions || 'Check official source for renewal'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Common Mistakes</p><p className="font-semibold">{scholarship.commonMistakes ? (typeof scholarship.commonMistakes === 'string' ? (()=>{try{return JSON.parse(scholarship.commonMistakes).join(', ')}catch{return scholarship.commonMistakes}})() : scholarship.commonMistakes.join(', ')) : 'Missing deadline, incomplete documents, weak essays'}</p></div>
                <div className="bg-[var(--alo-brand-pale)] border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">How ALO Can Help</p><p className="font-semibold text-[var(--alo-brand)]">{scholarship.howAloHelps || 'ALO provides finding scholarships, eligibility review, deadline tracking, document preparation, statement support — do NOT guarantee scholarship awards'}</p></div>
              </div>
              <p className="text-xs text-[var(--alo-text-muted)] mt-4 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">Official Source: {scholarship.officialSourceUrl ? <a href={scholarship.officialSourceUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{scholarship.officialSourceUrl}</a> : 'Information not currently verified.'} • Last verified: {scholarship.lastVerifiedAt ? new Date(scholarship.lastVerifiedAt).toLocaleDateString() : 'Not verified'} • Status: {scholarship.verificationStatus || 'pending'}</p>
            </Card>

            {/* What Does It Cover? (spec §17) — verified coverage only */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[var(--alo-text)] mb-4">What Does It Cover?</h3>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                {(() => {
                  const covers = String(scholarship.coverage || '') + ' ' + String(scholarship.whatCovers || '');
                  const known = ['Tuition', 'Living costs', 'Accommodation', 'Travel', 'Insurance', 'Other funding'];
                  const active = known.filter((k) => covers.toLowerCase().includes(k.split(' ')[0].toLowerCase()));
                  const shown = covers.trim() ? active : [];
                  return shown.length > 0 ? shown.map((k) => (
                    <div key={k} className="bg-crm-success-bg border border-crm-success-border rounded-xl p-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-crm-success-text shrink-0" /><span className="font-semibold text-crm-success-text">{k}</span></div>
                  )) : <p className="col-span-3 text-[var(--alo-body)]">Coverage is not publicly confirmed for this scholarship. Only verified coverage is displayed — check the official scholarship terms.</p>;
                })()}
              </div>
            </Card>

            {/* Application method — separate vs automatic (spec §18) */}
            <Card className="p-5 bg-[var(--alo-brand-pale)] border-[var(--alo-border)] rounded-2xl">
              <h4 className="font-bold text-sm mb-2 text-[var(--alo-brand)]">Separate Application or Automatic Consideration?</h4>
              <p className="text-xs text-[var(--alo-body)] leading-relaxed">
                {scholarship.applicationMethod
                  ? (() => {
                      const m = String(scholarship.applicationMethod).toLowerCase();
                      if (m.includes('auto')) return 'This scholarship is automatically considered with your admission application — no separate scholarship form is required.';
                      if (m.includes('separate')) return 'This scholarship requires a SEPARATE scholarship application in addition to your admission application. Track both deadlines.';
                      return `Application method: ${scholarship.applicationMethod} — confirm details against the official scholarship terms.`;
                    })()
                  : 'Application method not publicly confirmed — check the official scholarship terms whether you must submit a separate scholarship application.'}
              </p>
            </Card>

            {/* Scholarship Application Strategy (spec §19) — honest guidance */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[var(--alo-text)] mb-4">Scholarship Application Strategy</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-[var(--alo-body)]">
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><strong>Improve eligibility:</strong> close measurable gaps (grades, English score) before deadlines where genuinely possible.</div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><strong>Prepare documents early:</strong> transcripts, CV, references and financial evidence in the required formats.</div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><strong>Statements:</strong> write from your real achievements and plans — specific, evidenced, original. Never fabricate experiences.</div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><strong>Demonstrate achievement:</strong> academics plus leadership or community experience where the scholarship values it.</div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><strong>Common mistakes:</strong> missing the deadline, reusing one generic statement everywhere, incomplete documents, ignoring eligibility wording.</div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><strong>Deadline planning:</strong> work backwards from the official deadline — documents 2–4 weeks earlier, referee requests earlier still.</div>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-3">ALO never promises scholarship success — selection rests with the scholarship provider.</p>
            </Card>

            <RelatedContentEngine sourceType="scholarship" sourceId={scholarship.id} sourceSlug={scholarship.slug} country={scholarship.country} universityId={scholarship.universityId} title="Related Scholarships, Universities, Courses, FAQs" />
            <FaqAccordion targetType="scholarship" targetSlug={scholarship.slug} title={`FAQs about ${scholarship.name}`} limit={10} />

            {/* Enquiry form (spec 3.2) — same structure as the course and
                university enquiry forms, pre-filled with this scholarship. */}
            <EnquiryForm
              context={{
                type: 'scholarship',
                subject: scholarship.name,
                institution: scholarship.universityName || scholarship.provider || undefined,
                country: scholarship.country,
                reference: scholarship.slug || scholarship.id,
              }}
            />

            {/* Related Questions (spec §51: Still Have Questions?) */}
            <RelatedQuestions type="scholarship" context={scholarship.slug} title="Still Have Questions?" count={6} />

            {/* Final CTA — spec §24 exact button set */}
            <Card className="p-8 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-3xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
              <p className="text-sm text-[var(--alo-brand-pale)] mb-6">Check eligibility, find matching courses, or talk through your scholarship strategy with a counselor.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/eligibility-check"><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-8 font-bold">Check My Scholarship Eligibility</Button></Link>
                <Link href="/course-finder"><Button className="bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)] h-12 px-6 font-bold">Find Matching Courses</Button></Link>
                <Link href="/book-consultation"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6 font-bold">Request Consultation</Button></Link>
                <Link href="/contact"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Chat with Counselor</Button></Link>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3">Quick Actions</h3><div className="space-y-2"><Link href="/eligibility-check" className="block"><Button className="w-full bg-[var(--alo-cta)] text-white h-12">Check Eligibility</Button></Link><Link href="/book-consultation" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">Book Consultation</Button></Link><Link href="/scholarships" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">Find All Scholarships</Button></Link></div></Card>
            <Card className="p-6 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl"><h3 className="font-bold text-sm mb-3">Official Source & Verification</h3><div className="space-y-2 text-xs"><p><strong>Official URL:</strong> {scholarship.officialSourceUrl ? <a href={scholarship.officialSourceUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{scholarship.officialSourceUrl}</a> : 'Information not currently verified.'}</p><p><strong>Status:</strong> <Badge variant={scholarship.verificationStatus === 'verified' ? 'success' : 'warning'} className="text-[11px]">{scholarship.verificationStatus || 'pending'}</Badge></p><p><strong>Last Verified:</strong> {scholarship.lastVerifiedAt ? new Date(scholarship.lastVerifiedAt).toLocaleDateString() : 'Not verified'}</p></div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
