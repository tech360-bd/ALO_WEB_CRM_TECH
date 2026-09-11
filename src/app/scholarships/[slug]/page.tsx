export const dynamic = "force-dynamic";
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScholarshipBySlug, MASTER_SCHOLARSHIPS_DATA } from '@/lib/scholarships-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Calendar, CheckCircle2, Clock, DollarSign, ExternalLink, HelpCircle, Info, Shield, Sparkles } from 'lucide-react';

export async function generateStaticParams() {
  return MASTER_SCHOLARSHIPS_DATA.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = getScholarshipBySlug(slug);

  if (!scholarship) {
    return {
      title: 'Scholarship Details | ALO Education',
      description: 'Explore global study abroad scholarships and funding opportunities.',
    };
  }

  return {
    title: `${scholarship.title} | How, When, What & Benefits | ALO Education`,
    description: scholarship.description,
    alternates: {
      canonical: `https://aloeducation.com/scholarships/${scholarship.slug}`,
    },
    openGraph: {
      title: scholarship.title,
      description: scholarship.description,
      url: `https://aloeducation.com/scholarships/${scholarship.slug}`,
      type: 'website',
    },
  };
}

export default async function ScholarshipDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getScholarshipBySlug(slug);

  if (!s) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* BREADCRUMB */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <a href="/" className="hover:text-[#0057B8]">Home</a>
            <span>›</span>
            <a href="/scholarships" className="hover:text-[#0057B8]">Scholarships</a>
            <span>›</span>
            <span className="text-[#0057B8] font-bold">{s.title}</span>
          </nav>

          {/* HERO SECTION */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-3xl p-8 md:p-10 text-white mb-10 shadow-xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-[#E8501A] text-white font-bold text-xs px-3 py-1 uppercase">
                {s.coverageType}
              </Badge>
              <span className="text-xs font-semibold bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">
                {s.flag} {s.country}
              </span>
              <span className="text-xs text-blue-200">Deadline: {s.deadline}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">{s.title}</h1>
            <p className="text-lg text-blue-100 mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#FFB347]" /> {s.provider}
            </p>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 mb-6">
              <p className="text-xs text-blue-200 uppercase font-semibold mb-1">Scholarship Award Value & Benefits</p>
              <p className="text-2xl md:text-3xl font-black text-white">{s.awardAmount}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/eligibility-check">
                <Button className="bg-[#E8501A] text-white hover:bg-[#d44315] font-bold text-sm px-6 py-3">
                  Check Admission Eligibility with ALO
                </Button>
              </a>
              <a href={s.officialUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold text-sm flex items-center gap-1.5">
                  Official Portal <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. WHAT IS COVERED */}
              <Card className="p-6 border-l-4 border-l-emerald-600">
                <h3 className="text-xl font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-emerald-600" /> WHAT IS COVERED (Itemized Benefits)
                </h3>
                <p className="text-xs text-slate-500 mb-4">Complete financial breakdown included in this scholarship award</p>
                <div className="space-y-3">
                  {s.whatIsCovered.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 2. WHEN TO APPLY */}
              <Card className="p-6 border-l-4 border-l-[#E8501A]">
                <h3 className="text-xl font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-[#E8501A]" /> WHEN TO APPLY (Timeline & Deadlines)
                </h3>
                <p className="text-xs text-slate-500 mb-4">Official application cycle and selection schedule</p>
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 mb-4 text-xs text-slate-800 leading-relaxed font-medium">
                  {s.whenToApply}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Application Deadline:</span>
                    <p className="font-bold text-[#E8501A] text-sm mt-0.5">{s.deadline}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Target Intakes:</span>
                    <p className="font-bold text-[#0057B8] text-sm mt-0.5">{s.intakes.join(', ')}</p>
                  </div>
                </div>
              </Card>

              {/* 3. HOW TO APPLY */}
              <Card className="p-6 border-l-4 border-l-[#0057B8]">
                <h3 className="text-xl font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-[#0057B8]" /> HOW TO APPLY (Step-by-Step Instructions)
                </h3>
                <p className="text-xs text-slate-500 mb-4">{s.howToApply}</p>
                <div className="space-y-3 mb-4">
                  {s.applicationSteps.map((step, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <span className="text-sm font-black text-[#0057B8]">{idx + 1}</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 4. UNIQUE BENEFITS & DIFFERENCES */}
              <Card className="p-6 border-l-4 border-l-purple-600">
                <h3 className="text-xl font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" /> UNIQUE BENEFITS & KEY DIFFERENCES
                </h3>
                <p className="text-xs text-slate-500 mb-4">Why this scholarship stands out compared to other funding schemes</p>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {s.uniqueBenefits.map((ben, idx) => (
                    <div key={idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-slate-800 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{ben}</span>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Work Experience Rule:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{s.workExperienceRequirement}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Home Return Requirement:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{s.homeCountryReturnRule}</p>
                  </div>
                </div>
              </Card>

              {/* ELIGIBILITY CRITERIA */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#0057B8]" /> Eligibility Checklist
                </h3>
                <div className="space-y-2.5 mb-4">
                  {s.eligibilityCriteria.map((crit, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="h-5 w-5 rounded-full bg-blue-50 text-[#0057B8] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="font-medium">{crit}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* SIDEBAR CTAS */}
            <div className="space-y-6">
              <Card className="p-6 border-2 border-[#0057B8]/20 bg-gradient-to-br from-blue-50/30 to-white">
                <h3 className="font-bold text-[#0F172A] mb-2 text-lg">Scholarship Application Help</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  ALO Education provides free essay review, document guidance, and university matching for this scholarship.
                </p>
                <div className="space-y-2.5">
                  <a href="/eligibility-check" className="block w-full">
                    <Button className="w-full bg-[#E8501A] text-white hover:brightness-110 text-xs py-2.5">
                      Check Admission & Scholarship Eligibility
                    </Button>
                  </a>
                  <a href="/book-consultation" className="block w-full">
                    <Button variant="outline" className="w-full text-xs py-2.5 border-[#0057B8] text-[#0057B8] hover:bg-blue-50">
                      Talk to Senior Counselor
                    </Button>
                  </a>
                </div>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
