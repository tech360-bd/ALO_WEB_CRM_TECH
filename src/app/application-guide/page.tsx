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
    <div className="min-h-screen bg-[var(--alo-page)]">
      <main className="flex-1 pt-20 pb-16 max-w-4xl mx-auto px-4 w-full">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] text-xs font-semibold">
            <GraduationCap className="w-4 h-4" /> Official ALO Education Admission Roadmap
          </div>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Step-by-Step International Application Guide</h1>
          <p className="text-[var(--alo-body)] max-w-xl mx-auto text-sm">
            Follow our 8-stage step-by-step roadmap from initial course shortlisting to visa issuance and campus enrolment.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((s) => (
            <Card key={s.num} className="p-5 bg-white border border-[var(--alo-border)] rounded-2xl shadow-sm flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--alo-brand)] text-base font-bold text-white">
                {s.num}
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-[var(--alo-text)] text-sm">{s.title}</h3>
                <p className="text-[var(--alo-body)] leading-relaxed">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
