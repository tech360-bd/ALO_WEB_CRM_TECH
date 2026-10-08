import React from 'react';
import { Metadata } from 'next';
import { MASTER_TEST_PREP_DATA } from '@/lib/test-prep-data';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrepVsExamSplit } from '@/components/website/EnglishExamCta';
import { BookOpen, CheckCircle2, Clock, DollarSign, Globe, GraduationCap, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'English Language & Admission Test Prep Hub | ALO Education',
  description: 'Authoritative preparation guides, score requirements, fee comparisons, and university matching for IELTS, PTE Academic, Duolingo, TOEFL iBT, OIETC, GRE, GMAT, and SAT.',
  alternates: { canonical: 'https://aloeducation.com/english-test-prep' },
};

export default function TestPrepDirectoryPage() {
  const tests = Object.values(MASTER_TEST_PREP_DATA);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* HERO BANNER */}
          <div className="bg-gradient-to-r from-[#2563EB] to-[#003d80] rounded-3xl p-8 md:p-12 text-white mb-12 shadow-xl">
            <Badge className="bg-[#F97316] text-white font-bold text-xs px-3 py-1 mb-4 uppercase">
              ALO LANGUAGE PREPARATION CENTRE
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Master Your English & Admission Tests
            </h1>
            <p className="text-base md:text-lg text-blue-100 max-w-3xl leading-relaxed mb-6">
              Compare global recognition, exam pattern, scoring system, and test fees for IELTS, PTE Academic, Duolingo English Test, TOEFL iBT, OIETC Oxford ELLT, and more.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-blue-200">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#FFB347]" /> Certified Coaches</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-[#FFB347]" /> 48-Hour Result Guidance</span>
              <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-[#FFB347]" /> Direct CRM Score Planner</span>
            </div>
          </div>

          {/* PREPARATION vs REAL EXAM — clearly separated */}
          <div className="mb-16">
            <PrepVsExamSplit
              location="english_test_prep_hub"
              prepHref="#prep-cards"
              prepTitle="Prepare with ALO Education"
              prepCta="Browse preparation guides"
            />
          </div>

          {/* GRID OF TEST PREP CARDS */}
          <div id="prep-cards" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {tests.map((t) => (
              <Card key={t.id} className="p-6 bg-white hover:shadow-xl transition-all border-slate-200 hover:border-[#2563EB] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge className="bg-blue-50 text-[#2563EB] font-bold text-[11px]">
                      {t.logoBadge}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">{t.quickInfo.duration}</span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0F172A] mb-1">{t.name}</h3>
                  <p className="text-xs text-[#F97316] font-semibold mb-3">{t.officialOwner}</p>
                  <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">{t.overview.whatIsIt}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Exam Fee in BD:</span>
                    <span className="font-bold text-slate-900">{t.quickInfo.cost}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Target Score:</span>
                    <span className="font-bold text-[#2563EB]">{t.expectedScore}</span>
                  </div>
                  <Button asChild className="w-full bg-[#2563EB] text-white hover:bg-[#003d80] text-xs font-bold py-2.5 rounded-xl"><a href={`/english-test-prep/${t.slug}`} className="block w-full">
                      Explore Full Test Prep & Modules →
                    </a></Button>
                </div>
              </Card>
            ))}
          </div>

          {/* COMPARISON WIDGET SECTION */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#0F172A] mb-6">Interactive Test Comparison Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="p-3 font-bold">Test Name</th>
                    <th className="p-3 font-bold">Duration</th>
                    <th className="p-3 font-bold">Results Time</th>
                    <th className="p-3 font-bold">Score Range</th>
                    <th className="p-3 font-bold">Format</th>
                    <th className="p-3 font-bold">Best For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tests.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#2563EB]">{t.name}</td>
                      <td className="p-3 text-slate-700">{t.quickInfo.duration}</td>
                      <td className="p-3 font-semibold text-emerald-600">{t.quickInfo.resultTime}</td>
                      <td className="p-3 text-slate-700">{t.quickInfo.scoreScale}</td>
                      <td className="p-3 text-slate-600">{t.quickInfo.format}</td>
                      <td className="p-3 text-slate-600">{t.quickInfo.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
