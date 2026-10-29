'use client';

// SERVICES DIRECTORY (spec §3-§5) — premium /services page:
//   Hero:  "Complete Support for Your Study Abroad Journey"
//   CTA:   Request Consultation + Explore Course Finder
//   Grid:  the 14 spec services (published database records)
//   Every card links to /services/{service-slug} — no dead cards.

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { ALO_CONTACT, ALO_PUBLIC_CONTACT_CTA } from '@/lib/alo-site-info';

export default function ServicesDirectoryPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/services?limit=100')
      .then(r => { if (!r.ok) throw new Error('Services are temporarily unavailable. Please try again.'); return r.json(); })
      .then(d => setServices(Array.isArray(d.services) ? d.services : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-[var(--alo-text)]">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error && <p role="alert" className="p-4 mb-6 border border-red-200 bg-red-50 rounded-xl">{error}</p>}
          {/* Hero — spec §3 exact copy */}
          <div className="mb-12 rounded-[20px] border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-6 md:p-10">
            <Badge className="bg-card text-[var(--alo-brand)] border-[var(--alo-border)] text-[11px] px-3 py-1 mb-4 uppercase tracking-[0.07em] font-semibold">ALO End-to-End Advisory</Badge>
            <h1 className="font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[36px] lg:text-[42px] mb-4">Complete Support for Your Study Abroad Journey</h1>
            <p className="max-w-[62ch] text-[15px] leading-7 text-[var(--alo-body)] md:text-base">Provide professional guidance from course selection and university applications to visa preparation, pre-departure planning and post-arrival support.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/book-consultation"><Button className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] h-12 px-6 font-bold">Request Consultation</Button></Link>
              <Link href="/course-finder"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6 font-bold text-[var(--alo-brand)]">Explore Course Finder</Button></Link>
            </div>
            <div className="flex gap-2 mt-4">
              <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">{loading ? 'Loading services' : `${services.length} Services`}</Badge>
            </div>
          </div>

          {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl animate-pulse" />)}</div> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {services.map((s: any, idx: number) => (
                <Card key={s.id || s.slug} className="bg-white hover:shadow-md transition-all border-[var(--alo-border)] hover:border-[var(--alo-brand)] flex flex-col justify-between overflow-hidden rounded-2xl h-full">
                  <div>
                    {s.heroImage && <div className="h-44 w-full overflow-hidden relative"><img src={s.heroImage} alt={s.title} loading="lazy" className="w-full h-full object-cover" /><div className="absolute top-3 left-3"><Badge className="bg-white/90 text-[var(--alo-text)] border-[var(--alo-border)] text-[11px] font-bold">SERVICE {String(idx + 1).padStart(2, '0')}</Badge></div></div>}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-[var(--alo-text)] mb-2">{s.title}</h3>
                      {s.category && <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px] mb-2">{s.category}</Badge>}
                      <p className="text-xs text-[var(--alo-body)] mb-4 line-clamp-3 leading-relaxed">{s.shortDescription || s.shortDesc || ''}</p>
                      <div className="space-y-1.5 mb-4">
                        {(s.benefits ? (typeof s.benefits === 'string' ? (()=>{try{return JSON.parse(s.benefits)}catch{return [s.benefits]}})() : s.benefits) : []).slice(0, 2).map((b: any, bIdx: number) => (
                          <div key={bIdx} className="flex items-start gap-2 text-[11px] text-[var(--alo-body)]"><CheckCircle2 className="h-3.5 w-3.5 text-[var(--alo-brand)] shrink-0 mt-0.5" /><span className="font-medium line-clamp-1">{typeof b === 'string' ? b : b.title || JSON.stringify(b)}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <Link href={`/services/${s.slug}`} className="block w-full"><Button className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] font-bold h-12 rounded-xl flex items-center justify-center gap-1.5">View Details <ArrowRight className="h-4 w-4" /></Button></Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Final CTA — every page ends with a logical next step */}
          <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 text-center shadow-sm">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Ready to Take the Next Step?</h3>
            <p className="text-sm text-[var(--alo-body)] mb-6 max-w-xl mx-auto">Talk to an ALO counselor about the services that fit your plan — or explore courses and check eligibility first.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/book-consultation"><Button className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] font-bold text-sm px-8 h-12 rounded-xl shadow-sm">Request Consultation</Button></Link>
              <Link href="/course-finder"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6 font-bold text-[var(--alo-brand)]">Start Course Finder</Button></Link>
              <Link href="/eligibility-check"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6 font-bold text-[var(--alo-brand)]">Check Eligibility</Button></Link>
              <Button asChild variant="outline" className="border-emerald-300 text-emerald-700 h-12 px-6 font-bold"><a href={ALO_PUBLIC_CONTACT_CTA.href} {...(ALO_CONTACT.hasWhatsApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{ALO_PUBLIC_CONTACT_CTA.label}</a></Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
