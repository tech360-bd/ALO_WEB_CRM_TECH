'use client';

import React from 'react';

import { Card } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

export default function ApplicationGuidePageRoute() {
  const steps = [
    { num: 1, title: 'Student Profile & Eligibility Evaluation', desc: 'Input your GPA, English scores, and budget to receive automated course matches.' },
    { num: 2, title: 'Course & University Shortlisting', desc: 'Select up to 4 preferred target courses across UK, USA, Canada, Australia, Europe, or Asia.' },
    { num: 3, title: 'ALO Counselor 1-on-1 Review', desc: 'Review document requirements and English waiver options with an assigned ALO counselor.' },
    { num: 4, title: 'Document Verification & Translation', desc: 'Upload transcripts, MOI, SOP, CV, and passport copies for preliminary validation.' },
    { num: 5, title: 'University Application Submission', desc: 'ALO submits your official application directly to partner university admissions.' },
    { num: 6, title: 'Offer Letter Processing', desc: 'Receive Conditional or Unconditional Offer Letter from the university.' },
    { num: 7, title: 'Deposit Payment & CAS / COE / I-20 Issuance', desc: 'Pay tuition deposit and fulfill financial checks to receive your official visa document.' },
    { num: 8, title: 'Visa Application & Pre-Departure', desc: 'Complete embassy file submission, biometric appointment, and pre-departure briefing.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="flex-1 pt-20 pb-16 max-w-4xl mx-auto px-4 w-full">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" /> Official ALO Education Admission Roadmap
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Step-by-Step International Application Guide</h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm">
            Follow our 8-stage step-by-step roadmap from initial course shortlisting to visa issuance and campus enrolment.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((s) => (
            <Card key={s.num} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0">
                {s.num}
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                <p className="text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
