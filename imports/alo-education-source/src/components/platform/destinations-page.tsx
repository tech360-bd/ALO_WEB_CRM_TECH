'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, GraduationCap, ArrowRight, RefreshCw, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Country = { slug: string; name: string; shortName?: string; flag?: string; universities: number };

const REGIONS = [
  { key: 'all', label: 'All Regions' },
  { key: 'Europe', label: 'Europe' },
  { key: 'North America', label: 'North America' },
  { key: 'Asia', label: 'Asia' },
  { key: 'Oceania', label: 'Oceania' },
];

const REGION_MAP: Record<string, string> = {
  uk: 'Europe', ireland: 'Europe', germany: 'Europe', netherlands: 'Europe', france: 'Europe', sweden: 'Europe',
  italy: 'Europe', spain: 'Europe', switzerland: 'Europe', denmark: 'Europe', finland: 'Europe', malta: 'Europe',
  cyprus: 'Europe', austria: 'Europe', belgium: 'Europe', poland: 'Europe', czech: 'Europe', hungary: 'Europe',
  usa: 'North America', canada: 'North America',
  japan: 'Asia', southkorea: 'Asia', malaysia: 'Asia', singapore: 'Asia', china: 'Asia', uae: 'Asia',
  australia: 'Oceania', newzealand: 'Oceania',
};

export function DestinationsPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [region, setRegion] = useState('all');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    fetch('/api/countries')
      .then(r => r.json())
      .then(data => { if (data?.countries) setCountries(data.countries); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [retryKey]);

  const handleRetry = useCallback(() => { setLoading(true); setError(false); setRetryKey(k => k + 1); }, []);

  const filtered = region === 'all' ? countries : countries.filter(c => REGION_MAP[c.slug] === region);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F37021] via-[#0066CC] to-[#101828]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-28 md:py-36 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Study Destinations</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Explore 18+ Countries</h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">From the UK to Japan, find your perfect study destination with detailed guides on universities, costs, visas, and scholarships.</p>
        </div>
      </section>

      {/* Region Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-2 items-center">
          <Globe className="h-5 w-5 text-[#F37021] mr-1" />
          {REGIONS.map(r => (
            <button key={r.key} onClick={() => setRegion(r.key)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${region === r.key ? 'bg-[#F37021] text-white shadow-md' : 'bg-gray-100 text-[#555555] hover:bg-gray-200'}`}>
              {r.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-[#555555]">{filtered.length} destination{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center py-20">
              <p className="text-[#555555] mb-4">Failed to load destinations.</p>
              <Button onClick={handleRetry} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3"><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map(c => (
                <Card key={c.slug} className="border-0 shadow-md rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all" onClick={() => onNavigate('country', c.slug)}>
                  <div className="h-32 md:h-40 bg-gradient-to-br from-[#0066CC]/10 to-[#F37021]/10 flex items-center justify-center relative">
                    {c.flag ? (
                      <span className="text-6xl md:text-7xl drop-shadow-sm">{c.flag}</span>
                    ) : (
                      <Globe className="h-16 w-16 text-[#0066CC]/30" />
                    )}
                    <Badge className="absolute top-3 right-3 bg-white/90 text-[#0066CC] text-xs">{REGION_MAP[c.slug] || 'Other'}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-[#101828] text-base">{c.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-[#555555]">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>{c.universities} universit{c.universities !== 1 ? 'ies' : 'y'}</span>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-[#0066CC] font-medium group">
                      Explore <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Compare CTA */}
      <section className="py-16 md:py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#F37021]/10 flex items-center justify-center"><Scale className="h-8 w-8 text-[#F37021]" /></div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">Compare Destinations</h2>
          <p className="mt-4 text-lg text-[#555555] max-w-2xl mx-auto">Not sure which country is right for you? Compare living costs, tuition fees, visa requirements, and more side by side.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => onNavigate('course-finder')} size="lg" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full px-8">Compare Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button onClick={onLeadOpen} variant="outline" size="lg" className="border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC]/5 rounded-full px-8">Talk to a Counselor</Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
