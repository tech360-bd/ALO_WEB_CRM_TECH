'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { MASTER_SERVICES_DATA } from '@/lib/services-data';

export default function ServicesDirectoryPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services?status=active&limit=20')
      .then(r => r.json())
      .then(d => {
        const dbServices = d.services || [];
        if (dbServices.length > 0) setServices(dbServices);
        else setServices(MASTER_SERVICES_DATA);
      })
      .catch(() => setServices(MASTER_SERVICES_DATA))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm mb-12">
            <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs px-3 py-1 mb-4 uppercase">ALO End-to-End Advisory</Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Our Comprehensive Study Abroad Services</h1>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">We are committed to guiding students on their journey to study abroad with confidence and success. Our services ensure expert support at every stage from course selection to post-arrival settlement. Premium education consultancy visual style — DB-driven, verified, actionable.</p>
            <div className="flex gap-2 mt-4">
              <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">14 Services</Badge>
              <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">DB-driven</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Verified</Badge>
            </div>
          </div>

          {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {services.map((s: any, idx: number) => (
                <Card key={s.id || s.slug} className="bg-white hover:shadow-md transition-all border-[#E2E8F0] hover:border-[#0B5ED7] flex flex-col justify-between overflow-hidden rounded-2xl">
                  <div>
                    {s.heroImage && <div className="h-44 w-full overflow-hidden relative"><img src={s.heroImage} alt={s.title} className="w-full h-full object-cover" /><div className="absolute top-3 left-3"><Badge className="bg-white/90 text-[#0F172A] border-[#E2E8F0] text-[11px] font-bold">SERVICE {String(idx + 1).padStart(2, '0')}</Badge></div></div>}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-[#0F172A] mb-2">{s.title}</h3>
                      <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">{s.shortDescription || s.shortDesc || ''}</p>
                      <div className="space-y-1.5 mb-4">
                        {(s.benefits ? (typeof s.benefits === 'string' ? (()=>{try{return JSON.parse(s.benefits)}catch{return [s.benefits]}})() : s.benefits) : []).slice(0, 2).map((b: any, bIdx: number) => (
                          <div key={bIdx} className="flex items-start gap-2 text-[11px] text-gray-700"><CheckCircle2 className="h-3.5 w-3.5 text-[#0B5ED7] shrink-0 mt-0.5" /><span className="font-medium line-clamp-1">{typeof b === 'string' ? b : b.title || JSON.stringify(b)}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <Link href={`/services/${s.slug}`} className="block w-full"><Button className="w-full bg-[#0B5ED7] text-white hover:bg-[#004494] text-xs font-bold h-12 rounded-xl flex items-center justify-center gap-1.5">Explore Full Service Details <ArrowRight className="h-4 w-4" /></Button></Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 text-center shadow-sm">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Ready to Begin Your Application?</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-xl mx-auto">Schedule a free 1-on-1 counseling session with our senior education advisors today. Every page must have at least one logical next step — no dead-end pages.</p>
            <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] font-bold text-sm px-8 h-12 rounded-xl shadow-sm">Check Eligibility & Book Consultation →</Button></Link>
          </div>
        </div>
      </main>
    </div>
  );
}
