'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, FileText, Globe, GraduationCap, Shield, Users, Award, BookOpen, AlertTriangle, ArrowRight, HelpCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import RelatedContentEngine from './RelatedContentEngine';
import FaqAccordion from './FaqAccordion';
import RelatedQuestions from './RelatedQuestions';
import { SPEC_SERVICES } from '@/lib/website/spec-services';

interface Props {
  slug: string;
}

export default function ServiceDetailHub({ slug }: Props) {
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/services/${encodeURIComponent(slug)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed ${r.status}`);
        return r.json();
      })
      .then(d => setService(d.service || d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error || !service) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">Information not currently verified. Please check with an ALO Education counselor.</p><Link href="/services"><Button className="mt-4 bg-[#0B5ED7] text-white h-11">Browse Services</Button></Link></Card></div>;

  const title = service.title;
  const benefits = (()=>{ try{ return typeof service.benefits === 'string' ? JSON.parse(service.benefits) : service.benefits || []; }catch{ return service.benefits ? [service.benefits] : []; } })();
  const steps = (()=>{ try{ return typeof service.processSteps === 'string' ? JSON.parse(service.processSteps) : service.processSteps || service.content ? [] : []; }catch{ return []; } })();
  const whoFor = (()=>{ try{ return typeof service.whoIsFor === 'string' ? JSON.parse(service.whoIsFor) : service.whoIsFor || []; }catch{ return []; } })();
  const docs = (()=>{ try{ return typeof service.documentsNeeded === 'string' ? JSON.parse(service.documentsNeeded) : service.documentsNeeded || service.documents ? JSON.parse(service.documents) : []; }catch{ return []; } })();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-[#0B5ED7]">Home</Link><span>›</span><Link href="/services" className="hover:text-[#0B5ED7]">Services</Link><span>›</span><span className="text-[#0B5ED7] font-bold">{title}</span>
        </nav>

        {/* 1. Hero */}
        <div className="bg-gradient-to-r from-[#0B5ED7] to-[#003d80] rounded-3xl p-8 md:p-12 text-white shadow-xl">
          <Badge className="bg-[#F97316] text-white font-bold text-xs px-3 py-1 mb-4 uppercase">ALO Comprehensive Service</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{service.heroTitle || title}</h1>
          <p className="text-base md:text-lg text-blue-100 max-w-3xl leading-relaxed">{service.heroSubtitle || service.shortDescription || service.longDescription?.substring(0, 200) || ''}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/book-consultation"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-6 font-bold">Book Free Consultation</Button></Link>
            {(service.hasStartApplication || slug.includes('application') || slug.includes('course')) && (
              <Link href="/register"><Button className="bg-white text-[#0B5ED7] hover:bg-blue-50 h-12 px-6 font-bold">Start Application</Button></Link>
            )}
            <Link href="/eligibility-check"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Check Eligibility</Button></Link>
          </div>
          <p className="text-xs text-blue-200 mt-4">Source: {service.sourceUrl ? <a href={service.sourceUrl} target="_blank" className="underline">{service.sourceUrl}</a> : 'ALO Editorial'} • Last verified: {service.lastVerifiedAt ? new Date(service.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'} • Status: {service.verificationStatus || 'pending'}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* 2. What This Service Is */}
            <Card className="p-6 md:p-8 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h2 className="text-2xl font-bold text-[#0F172A] mb-4">What This Service Is</h2><p className="text-sm text-gray-700 leading-relaxed">{service.whatIs || service.longDescription || service.description || 'Information not currently verified. Please check with an ALO Education counselor.'}</p></Card>

            {/* 3. Why Students Need It */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3">Why Students Need It</h3><p className="text-sm text-gray-700 leading-relaxed">{service.whyNeeded || service.longDescription || 'Helps students understand process, avoid mistakes, and move from information → eligibility → application.'}</p></Card>

            {/* 4. Who It Is For */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-[#0B5ED7]" />Who It Is For</h3><ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">{(whoFor.length > 0 ? whoFor : ['HSC/A-Level graduates', 'Bachelor holders for Master/MBA/PhD', 'Students seeking destination guidance']).map((w:any, i:number)=><li key={i}>{typeof w === 'string' ? w : w.title || JSON.stringify(w)}</li>)}</ul></Card>

            {/* 5. What ALO Does */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-[#0B5ED7]" />What ALO Does</h3><p className="text-sm text-gray-700 leading-relaxed">{service.whatAloDoes || service.longDescription || 'ALO provides structured guidance, document checking, eligibility review, and application support.'}</p></Card>

            {/* 6. Step-by-Step Process */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[#0B5ED7]" />Step-by-Step Process</h3><div className="grid sm:grid-cols-2 gap-4">{(steps.length > 0 ? steps : [{step:1, title:'Profile Assessment', desc:'Evaluate academic, English, budget'}, {step:2, title:'Destination Matching', desc:'Match country, university, course'}, {step:3, title:'Application', desc:'Submit via official portal'}, {step:4, title:'Follow-up', desc:'Track offer, deposit, CAS/I-20/COE'}]).map((s:any, i:number)=><div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"><span className="text-lg font-black text-[#0B5ED7]">{s.step || `0${i+1}`}</span><h4 className="font-bold text-sm mt-1">{s.title}</h4><p className="text-xs text-gray-600 mt-1">{s.desc}</p></div>)}</div></Card>

            {/* 7. Required Information + 8. Documents Needed + 9. Timeline */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2">Required Information</h4><p className="text-xs text-gray-600">{service.requiredInfo ? (typeof service.requiredInfo === 'string' ? (()=>{try{return JSON.parse(service.requiredInfo).join(', ')}catch{return service.requiredInfo}})() : service.requiredInfo.join(', ')) : 'Academic transcripts, English scores, budget, intake, destination preferences'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Documents Needed</h4><ul className="text-xs text-gray-600 list-disc list-inside space-y-1">{(docs.length > 0 ? docs : ['Passport', 'Academic Certificates', 'Transcripts', 'English Test Score', 'CV', 'SOP']).map((d:any, i:number)=><li key={i}>{typeof d === 'string' ? d : d.title || JSON.stringify(d)}</li>)}</ul></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" />Timeline</h4><p className="text-xs text-gray-600">{service.timeline || '6-12 months before intake recommended. September intake applications typically Jan-Mar.'}</p></Card>
            </div>

            {/* Eligibility / Requirements + Fees (spec §7) — fees only when publicly approved */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-[#0B5ED7]" />Eligibility / Requirements</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{service.eligibility || 'Open to students at any stage. Your counselor confirms service-specific requirements (e.g., document readiness for Document Checking, an offer letter for Interview Preparation) during the Initial Consultation.'}</p>
              </Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#0B5ED7]" />Fees</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{service.fees || 'Contact ALO for current service pricing.'} <span className="text-gray-500">Fees are confirmed in writing before any engagement — ALO never invents or hides pricing.</span></p>
              </Card>
            </div>
            {/* Processing-time disclaimer (spec §7): shown whenever a timeline is displayed */}
            <p className="text-[11px] text-gray-500 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">Processing times vary by institution, country, intake and applicant circumstances. Confirm your individual timeline with an ALO counselor.</p>

            {/* 10. What Students Receive + 11. What ALO Does Not Guarantee + 12. Common Mistakes */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2">What Students Receive</h4><p className="text-xs text-gray-600">{service.whatStudentsReceive ? (typeof service.whatStudentsReceive === 'string' ? (()=>{try{return JSON.parse(service.whatStudentsReceive).join(', ')}catch{return service.whatStudentsReceive}})() : service.whatStudentsReceive.join(', ')) : 'Personalized counseling, eligibility check, document guidance, application support'}</p></Card>
              <Card className="p-5 bg-amber-50 border-amber-200 rounded-2xl"><h4 className="font-bold text-sm mb-2 text-amber-800 flex items-center gap-2"><Shield className="w-4 h-4" />What ALO Does Not Guarantee</h4><p className="text-xs text-amber-700">{service.whatNotGuaranteed || 'ALO does NOT guarantee university admission, scholarship award, or visa approval. All decisions are made by universities and government authorities. Official requirements apply.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2">Common Mistakes</h4><p className="text-xs text-gray-600">{service.commonMistakes ? (typeof service.commonMistakes === 'string' ? (()=>{try{return JSON.parse(service.commonMistakes).join(', ')}catch{return service.commonMistakes}})() : service.commonMistakes.join(', ')) : 'Incomplete documents, missing deadlines, incorrect English scores, inconsistent financial evidence'}</p></Card>
            </div>

            {/* Visa Guidance specific */}
            {(slug.includes('visa') || service.documentPreparation) && (
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
                <h3 className="font-bold text-[#0F172A] mb-3">Visa Guidance — Document Preparation, Checklist, Financial, Credibility</h3>
                <div className="space-y-3 text-xs text-gray-700">
                  <p><strong>Document Preparation:</strong> {service.documentPreparation || 'Check official government source for document checklist'}</p>
                  <p><strong>Checklist:</strong> {service.checklist ? (typeof service.checklist === 'string' ? (()=>{try{return JSON.parse(service.checklist).join(', ')}catch{return service.checklist}})() : service.checklist.join(', ')) : 'Passport, CAS/I-20/COE, Financial Evidence, Academic Documents, English Test, TB Test where required'}</p>
                  <p><strong>Financial Documentation:</strong> {service.financialGuidance || 'Bank statement, solvency, source of funds — must be consistent'}</p>
                  <p><strong>Credibility Interview:</strong> {service.credibilityPrep || 'Prepare for credibility interview — course knowledge, university knowledge, financial explanation'}</p>
                  <p><strong>Document Consistency:</strong> {service.documentConsistency || 'Ensure all documents consistent — name, dates, financial evidence'}</p>
                  <p><strong>Refusal-Risk Preparation:</strong> {service.refusalRiskPrep || 'Check previous visa refusals, study gaps, financial gaps — human review required'}</p>
                  <p className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800"><strong>Official-Source Disclaimer:</strong> {service.officialDisclaimer || 'Visa requirements are set by government authorities. ALO provides guidance, not guarantee. Check official government website for verified requirements.'}</p>
                </div>
              </Card>
            )}

            {/* Scholarship Guidance */}
            {(slug.includes('scholarship') || service.findingScholarships) && (
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
                <h3 className="font-bold text-[#0F172A] mb-3">Scholarship Guidance — Finding, Eligibility, Deadline, Application</h3>
                <div className="space-y-2 text-xs text-gray-700">
                  <p><strong>Finding Scholarships:</strong> {service.findingScholarships || 'Database of government and university scholarships'}</p>
                  <p><strong>Eligibility Review:</strong> {service.eligibilityReview || 'Check academic, English, nationality, course eligibility'}</p>
                  <p><strong>Deadline Tracking:</strong> {service.deadlineTracking || 'Track opening/closing dates, never miss deadline'}</p>
                  <p><strong>Statement Support:</strong> {service.statementSupport || 'SOP and scholarship essay guidance'}</p>
                  <p className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><strong>Do NOT guarantee scholarship awards — selection by scholarship provider.</strong></p>
                </div>
              </Card>
            )}

            {/* Course Matching */}
            {(slug.includes('course') || slug.includes('selection') || service.profileAssessment) && (
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
                <h3 className="font-bold text-[#0F172A] mb-3">Course Matching — Profile, Academic, English, Budget, Destination, Intake, Career</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><strong>Profile Assessment:</strong> {service.profileAssessment || 'Academic, English, budget, career goals'}</div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><strong>Academic Matching:</strong> {service.academicMatching || 'GPA, qualifications, prerequisites'}</div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><strong>English Matching:</strong> {service.englishMatching || 'IELTS/PTE/TOEFL/Duolingo/MOI'}</div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><strong>Budget Matching:</strong> {service.budgetMatching || 'Tuition, living cost, scholarship'}</div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><strong>Destination Matching:</strong> {service.destinationMatching || 'UK, USA, Canada, Australia, Germany, etc'}</div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><strong>Intake Matching:</strong> {service.intakeMatching || 'September, January, May'} • <strong>Career:</strong> {service.careerGoalMatching || 'Career outcomes, placement'}</div>
                </div>
              </Card>
            )}

            {/* English Test Preparation (spec §8): direct connection to the Language Preparation system */}
            {service.slug === 'english-test-preparation' && (
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
                <h3 className="font-bold text-[#0F172A] mb-3">English Tests We Prepare You For</h3>
                <div className="grid sm:grid-cols-3 gap-3 text-xs mb-4">
                  {['IELTS', 'IELTS UKVI', 'PTE Academic', 'TOEFL iBT', 'Duolingo English Test', 'OET', 'Other supported tests'].map((t) => (
                    <div key={t} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 font-semibold text-[#0F172A]">{t}</div>
                  ))}
                </div>
                <Link href="/language-prep" className="inline-flex items-center gap-1 text-sm font-bold text-[#0B5ED7] hover:underline">Open the Language Preparation system — modules, practice and level diagnosis <ArrowRight className="w-4 h-4" /></Link>
              </Card>
            )}

            {/* Scholarship Guidance (spec §8): direct link to the Scholarships directory */}
            {service.slug === 'scholarship-guidance' && (
              <Card className="p-5 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl">
                <p className="text-xs text-gray-700">Ready to explore? Browse the verified directory: <Link href="/scholarships" className="font-bold text-[#0B5ED7] hover:underline">/scholarships — verified scholarships only</Link></p>
              </Card>
            )}

            {/* Visa Guidance (spec §8): mandatory currency disclaimer */}
            {service.slug === 'visa-guidance' && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">Visa rules can change. Current requirements must be verified against official government and visa-authority sources before submission.</p>
            )}

            {/* 13. FAQ + 14-17 Related */}
            <FaqAccordion targetType="service" targetSlug={service.slug} title={`FAQs about ${title}`} limit={12} />

            {/* Related Questions (spec §10): You May Also Want to Know — 5-8 contextual Q&A */}
            <RelatedQuestions type="service" context={service.slug} title="You May Also Want to Know" count={6} />

            <RelatedContentEngine sourceType="service" sourceId={service.id} sourceSlug={service.slug} title="Related Resources, Services, Courses, Countries, Scholarships" />

            {/* Related Services (spec §11): same advisory family, never random */}
            {(() => {
              const me = SPEC_SERVICES.find((s) => s.slug === service.slug);
              const siblings = me
                ? SPEC_SERVICES.filter((s) => s.category === me.category && s.slug !== me.slug).slice(0, 3)
                : SPEC_SERVICES.slice(0, 3);
              return (
                <section aria-label="Related Services">
                  <h2 className="text-xl font-bold text-[#0F172A] mb-4">Related Services</h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {siblings.map((s) => (
                      <Link key={s.slug} href={`/services/${s.slug}`} className="group">
                        <Card className="p-5 h-full bg-white border-[#E2E8F0] rounded-2xl hover:border-[#0B5ED7] hover:shadow-md transition-all">
                          <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px] mb-2">{s.category}</Badge>
                          <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0B5ED7]">{s.title}</h3>
                          <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{s.shortDescription}</p>
                          <span className="text-xs font-bold text-[#0B5ED7] mt-2 inline-flex items-center gap-1">View details <ArrowRight className="w-3 h-3" /></span>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Final CTA (spec §12): Ready to Take the Next Step? */}
            <Card className="p-8 bg-gradient-to-r from-[#0B5ED7] to-[#003d80] rounded-3xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to Take the Next Step?</h3>
              <p className="text-sm text-blue-100 mb-6">Consultation is free — move from information to eligibility to application with an ALO counselor.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/book-consultation"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-8 font-bold">Book Free Consultation</Button></Link>
                <Link href="/course-finder"><Button className="bg-white text-[#0B5ED7] hover:bg-blue-50 h-12 px-6 font-bold">Start Course Finder</Button></Link>
                <Link href="/eligibility-check"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Check Eligibility</Button></Link>
                <Link href="/contact"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Chat with Counselor</Button></Link>
                <a href="https://wa.me/8801805020101" target="_blank" rel="noopener noreferrer"><Button className="bg-emerald-500 text-white hover:bg-emerald-600 h-12 px-6 font-bold">WhatsApp: +880 180 502 0101</Button></a>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3">Quick Actions</h3><div className="space-y-2"><Link href="/book-consultation" className="block"><Button className="w-full bg-[#F97316] text-white h-11">Book Consultation</Button></Link><Link href="/contact" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Contact Counselor</Button></Link><Link href="/course-finder" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Find Courses</Button></Link></div></Card>
            <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl"><h3 className="font-bold text-sm mb-3">Official Sources & Verification</h3><div className="space-y-2 text-xs"><p><strong>Source:</strong> {service.sourceUrl ? <a href={service.sourceUrl} target="_blank" className="text-[#0B5ED7] underline break-all">{service.sourceUrl}</a> : 'ALO Editorial'}</p><p><strong>Status:</strong> <Badge className={`${service.verificationStatus === 'VERIFIED' || service.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{service.verificationStatus || 'pending'}</Badge></p><p><strong>Last Verified:</strong> {service.lastVerifiedAt ? new Date(service.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'}</p></div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
