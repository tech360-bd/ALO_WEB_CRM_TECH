'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Calendar,
  DollarSign,
  Globe,
  GraduationCap,
  Award,
  Flag,
  ExternalLink,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type Country = { id: number; name: string; slug: string; flag?: string };
type Scholarship = {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  amount?: string | number;
  currency?: string;
  deadline?: string;
  eligibility?: string;
  minimumRequirements?: string;
  studyLevel?: string;
  fundingType?: string;
  universityName?: string | null;
  universitySlug?: string;
  countrySlug?: string;
  applicationUrl?: string;
};

const STUDY_LEVELS = ['all', 'Undergraduate', 'Postgraduate', 'PhD', 'Diploma'];

export function ScholarshipsPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      fetch('/api/scholarships').then((r) => r.json()),
      fetch('/api/countries').then((r) => r.json()),
    ])
      .then(([schData, ctryData]) => {
        if (Array.isArray(schData?.scholarships)) setScholarships(schData.scholarships);
        else if (Array.isArray(schData)) setScholarships(schData);
        if (Array.isArray(ctryData?.countries)) setCountries(ctryData.countries);
        else if (Array.isArray(ctryData)) setCountries(ctryData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = scholarships.filter((s) => {
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.universityName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.eligibility || '').toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === 'all' || s.countrySlug === countryFilter;
    const matchesLevel = levelFilter === 'all' || s.studyLevel === levelFilter;
    return matchesSearch && matchesCountry && matchesLevel;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFB347] via-[#F37021] to-[#101828]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-32 md:py-40 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Scholarships</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Fund Your<span className="block text-white">Dream Education</span></h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">Discover scholarships that can save you up to 50% on tuition at top universities worldwide.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search scholarships, universities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 text-xs text-[#555555] mr-2"><Filter className="h-3 w-3" />Country:</div>
              <Button variant={countryFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCountryFilter('all')} className={`rounded-full whitespace-nowrap ${countryFilter === 'all' ? 'bg-[#F37021] hover:bg-[#F37021]/90 text-white' : ''}`}>
                <Globe className="h-4 w-4 mr-1" /> All
              </Button>
              {countries.map((c) => (
                <Button key={c.id} variant={countryFilter === c.slug ? 'default' : 'outline'} size="sm" onClick={() => setCountryFilter(c.slug)} className={`rounded-full whitespace-nowrap ${countryFilter === c.slug ? 'bg-[#F37021] hover:bg-[#F37021]/90 text-white' : ''}`}>
                  <Flag className="h-3 w-3 mr-1" /> {c.name}
                </Button>
              ))}
              <div className="w-px h-6 bg-gray-200 mx-2 self-center" />
              <div className="flex items-center gap-1 text-xs text-[#555555] mr-2">Level:</div>
              {STUDY_LEVELS.map((lvl) => (
                <Button key={lvl} variant={levelFilter === lvl ? 'default' : 'outline'} size="sm" onClick={() => setLevelFilter(lvl)} className={`rounded-full whitespace-nowrap ${levelFilter === lvl ? 'bg-[#0066CC] hover:bg-[#0066CC]/90 text-white' : ''}`}>
                  {lvl === 'all' ? 'All' : lvl}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scholarship Cards */}
      <section className="py-12 md:py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-64 w-full rounded-2xl" />))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-sm text-[#555555] mb-6">Showing {filtered.length} scholarship{filtered.length !== 1 ? 's' : ''}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((sch, idx) => (
                  <Card key={idx} className="rounded-2xl border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-[#F37021] to-[#FFB347]" />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-1.5">
                          {sch.studyLevel && (
                            <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC] border-0 text-xs">{sch.studyLevel}</Badge>
                          )}
                          {sch.fundingType && (
                            <Badge variant="secondary" className="bg-[#F37021]/10 text-[#F37021] border-0 text-xs">{sch.fundingType}</Badge>
                          )}
                        </div>
                        {sch.amount && (
                          <div className="flex items-center gap-1 text-sm font-semibold text-[#F37021]">
                            <DollarSign className="h-4 w-4" />{sch.currency ? `${sch.currency} ` : ''}{sch.amount}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-[#101828] mb-2 line-clamp-2">{sch.name}</h3>
                      {sch.universityName && (
                        <div className="flex items-center gap-2 text-sm text-[#555555] mb-2">
                          <GraduationCap className="h-4 w-4" />{sch.universityName}
                        </div>
                      )}
                      {sch.eligibility && (
                        <p className="text-sm text-[#555555] line-clamp-2 mb-3">{sch.eligibility}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[#555555] mb-4">
                        {sch.deadline && (
                          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(sch.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={onLeadOpen} size="sm" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full flex-1">Apply Now</Button>
                        {sch.slug && (
                          <Button variant="outline" size="sm" onClick={() => onNavigate('scholarship', sch.slug)} className="rounded-full border-[#0066CC] text-[#0066CC]">Details</Button>
                        )}
                        {sch.applicationUrl && (
                          <Button variant="outline" size="sm" asChild className="rounded-full">
                            <a href={sch.applicationUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Award className="h-12 w-12 text-[#F37021]/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#101828] mb-2">No scholarships found</h3>
              <p className="text-[#555555] mb-4">Try adjusting your search or filter criteria.</p>
              <Button onClick={() => { setSearch(''); setCountryFilter('all'); setLevelFilter('all'); }} variant="outline" className="rounded-full">Clear Filters</Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[#0066CC] to-[#101828]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Need Help Finding Scholarships?</h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Our counselors can match you with the best scholarships based on your profile and destination.</p>
          <div className="mt-8">
            <Button onClick={onLeadOpen} size="lg" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full px-8">Get Scholarship Assistance <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
