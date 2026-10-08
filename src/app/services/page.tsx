'use client';

// SERVICES DIRECTORY (spec §3-§5) — premium /services page:
//   Hero:  "Complete Support for Your Study Abroad Journey"
//   CTA:   Book Free Consultation + Explore Course Finder
//   Grid:  the 14 spec services (DB rows win, catalog fills gaps)
//   Every card links to /services/{service-slug} — no dead cards.

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SPEC_SERVICES, SERVICE_SLUG_ALIASES } from '@/lib/website/spec-services';

export default function ServicesDirectoryPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services?limit=100')
      .then(r => r.json())
      .then(d => {
        const dbServices = d.services || [];
        if (dbServices.length > 0) {
          // DB + catalog union already handled server-side; drop legacy-slug
          // DB rows whose canonical spec service is already present (no
          // duplicate cards for the same service).
          const slugs = new Set(dbServices.map((s: any) => s.slug));
          const canonical = new Set([...slugs].filter((s) => !SERVICE_SLUG_ALIASES[s as string]));
          const deduped = dbServices.filter((s: any) => !SERVICE_SLUG_ALIASES[s.slug] || !canonical.has(SERVICE_SLUG_ALIASES[s.slug]));
          const keep = new Set(deduped.map((s: any) => s.slug));
          const missing = SPEC_SERVICES.filter((s) => !keep.has(s.slug)).map((s) => ({ ...s, heroImage: '' }));
          setServices([...deduped, ...missing]);
        } else {
          setServices(SPEC_SERVICES.map((s) => ({ ...s, heroImage: '' })));
        }
      })
      .catch(() => setServices(SPEC_SERVICES.map((s) => ({ ...s, heroImage: '' }))))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero — spec §3 exact copy */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm mb-12">
            <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 text-xs px-3 py-1 mb-4 uppercase">ALO End-to-End Advisory</Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Complete Support for Your Study Abroad Journey</h1>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">Provide professional guidance from course selection and university applications to visa preparation, pre-departure planning and post-arrival support.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/book-consultation"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-6 font-bold">Book Free Consultation</Button></Link>
              <Link href="/course-finder"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6 font-bold text-[#2563EB]">Explore Course Finder</Button></Link>
            </div>
            <div className="flex gap-2 mt-4">
              <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">14 Services</Badge>
              <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">Database-driven</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Verified content</Badge>
            </div>
          </div>

          {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {services.map((s: any, idx: number) => (
                <Card key={s.id || s.slug} className="bg-white hover:shadow-md transition-all border-[#E2E8F0] hover:border-[#2563EB] flex flex-col justify-between overflow-hidden rounded-2xl h-full">
                  <div>
                    {s.heroImage && <div className="h-44 w-full overflow-hidden relative"><img src={s.heroImage} alt={s.title} loading="lazy" className="w-full h-full object-cover" /><div className="absolute top-3 left-3"><Badge className="bg-white/90 text-[#0F172A] border-[#E2E8F0] text-[11px] font-bold">SERVICE {String(idx + 1).padStart(2, '0')}</Badge></div></div>}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-[#0F172A] mb-2">{s.title}</h3>
                      {s.category && <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px] mb-2">{s.category}</Badge>}
                      <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">{s.shortDescription || s.shortDesc || ''}</p>
                      <div className="space-y-1.5 mb-4">
                        {(s.benefits ? (typeof s.benefits === 'string' ? (()=>{try{return JSON.parse(s.benefits)}catch{return [s.benefits]}})() : s.benefits) : []).slice(0, 2).map((b: any, bIdx: number) => (
                          <div key={bIdx} className="flex items-start gap-2 text-[11px] text-gray-700"><CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] shrink-0 mt-0.5" /><span className="font-medium line-clamp-1">{typeof b === 'string' ? b : b.title || JSON.stringify(b)}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <Link href={`/services/${s.slug}`} className="block w-full"><Button className="w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-bold h-12 rounded-xl flex items-center justify-center gap-1.5">View Details <ArrowRight className="h-4 w-4" /></Button></Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Final CTA — every page ends with a logical next step */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 text-center shadow-sm">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Ready to Take the Next Step?</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-xl mx-auto">Talk to an ALO counselor about the services that fit your plan — or explore courses and check eligibility first.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/book-consultation"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] font-bold text-sm px-8 h-12 rounded-xl shadow-sm">Book Free Consultation</Button></Link>
              <Link href="/course-finder"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6 font-bold text-[#2563EB]">Start Course Finder</Button></Link>
              <Link href="/eligibility-check"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6 font-bold text-[#2563EB]">Check Eligibility</Button></Link>
              <a href="https://wa.me/8801805020101" target="_blank" rel="noopener noreferrer"><Button variant="outline" className="border-emerald-300 text-emerald-700 h-12 px-6 font-bold">WhatsApp: +880 180 502 0101</Button></a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
