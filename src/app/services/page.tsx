import React from 'react';
import { Metadata } from 'next';
import { MASTER_SERVICES_DATA } from '@/lib/services-data';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, ShieldCheck, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our 10 Comprehensive Services | ALO Education Bangladesh',
  description: 'Explore ALO Education’s 10 comprehensive study abroad services: Personalized Counseling, University Selection, Scholarship Aid, SOP Editing, Visa Processing, Bank Solvency, Test Prep, and Accommodation.',
  alternates: { canonical: 'https://aloeducation.com/services' },
};

export default function ServicesDirectoryPage() {
  const services = MASTER_SERVICES_DATA;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* HERO BANNER */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-3xl p-8 md:p-12 text-white mb-12 shadow-xl">
            <Badge className="bg-[#E8501A] text-white font-bold text-xs px-3 py-1 mb-4 uppercase">
              ALO END-TO-END ADVISORY
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Our 10 Comprehensive Study Abroad Services
            </h1>
            <p className="text-base md:text-lg text-blue-100 max-w-3xl leading-relaxed">
              We are committed to guiding students on their journey to study abroad with confidence and success. Our 10 comprehensive services ensure expert support at every stage from course selection to post-arrival settlement.
            </p>
          </div>

          {/* 10 COMPREHENSIVE SERVICES GRID CARDS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {services.map((s, idx) => (
              <Card key={s.id} className="bg-white hover:shadow-xl transition-all border-slate-200 hover:border-[#0057B8] flex flex-col justify-between overflow-hidden rounded-2xl">
                <div>
                  <div className="h-44 w-full overflow-hidden relative">
                    <img src={s.heroImage} alt={s.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/60 text-white backdrop-blur-md border-0 text-[11px] font-bold">
                        SERVICE 0{idx + 1}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#0F172A] mb-2">{s.title}</h3>
                    <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">{s.shortDesc}</p>
                    
                    <div className="space-y-1.5 mb-4">
                      {s.benefits.slice(0, 2).map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-[11px] text-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#0057B8] shrink-0 mt-0.5" />
                          <span className="font-medium line-clamp-1">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <a href={`/services/${s.slug}`} className="block w-full">
                    <Button className="w-full bg-[#0057B8] text-white hover:bg-[#003d80] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      Explore Full Service Details <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA BOTTOM BANNER */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-3xl p-8 text-white text-center shadow-lg">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-2">Ready to Begin Your Application?</h3>
            <p className="text-sm text-blue-100 mb-6 max-w-xl mx-auto">
              Schedule a free 1-on-1 counseling session with our senior education advisors today.
            </p>
            <a href="/eligibility-check">
              <Button className="bg-[#E8501A] text-white hover:bg-[#d44315] font-bold text-sm px-8 py-3.5 rounded-xl shadow-md">
                Check Eligibility & Book Consultation →
              </Button>
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}
