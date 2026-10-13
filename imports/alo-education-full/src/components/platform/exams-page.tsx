'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, DollarSign, Globe, Award, RefreshCw, ArrowRight, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Exam = {
  slug: string; name: string; fullName?: string; shortName?: string;
  intro?: string; testFormat?: string; duration?: string; cost?: string;
  scoring?: string; scoreValidity?: string; acceptedCountries?: string;
  universityAcceptance?: string; whoShouldTake?: string;
};

const EXAM_ICONS: Record<string, string> = {
  ielts: '🎯', pte: '💻', toefl: '📝', duolingo: '🦉', sat: '📊', gre: '📈', gmat: '🧮',
};

export function ExamsPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    fetch('/api/exams')
      .then(r => r.json())
      .then(data => { if (data?.exams) setExams(data.exams); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [retryKey]);

  const handleRetry = useCallback(() => { setLoading(true); setError(false); setRetryKey(k => k + 1); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F37021] via-[#101828] to-[#0066CC]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-28 md:py-36 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Test Preparation</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Ace Your English Test</h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Prepare for IELTS, PTE, TOEFL, Duolingo, and other proficiency tests with expert guidance and free mock tests.</p>
          <Button onClick={() => onNavigate('student-dashboard')} size="lg" className="mt-8 bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full px-8">
            <PlayCircle className="mr-2 h-5 w-5" />Take Free Mock Test
          </Button>
        </div>
      </section>

      {/* Exam Cards */}
      <section className="py-12 md:py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#101828] mb-8">English Proficiency Tests</h2>
          {error ? (
            <div className="text-center py-20"><p className="text-[#555555] mb-4">Failed to load exams.</p><Button onClick={handleRetry} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button></div>
          ) : loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (<div key={i}><Skeleton className="h-52 w-full rounded-2xl" /></div>))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {exams.map(e => (
                <Card key={e.slug} className="border-0 shadow-md rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#0066CC]/10 flex items-center justify-center text-2xl">
                        {EXAM_ICONS[e.slug] || '📝'}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-[#101828]">{e.shortName || e.name}</CardTitle>
                        {e.fullName && <p className="text-xs text-[#555555]">{e.fullName}</p>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {e.intro && <p className="text-xs text-[#555555] line-clamp-2">{e.intro}</p>}
                    <div className="space-y-2 text-sm">
                      {e.testFormat && <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-[#F37021]" /><span className="text-[#555555]">{e.testFormat}</span></div>}
                      {e.duration && <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[#0066CC]" /><span className="text-[#555555]">{e.duration}</span></div>}
                      {e.cost && <div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-[#F37021]" /><span className="text-[#555555]">{e.cost}</span></div>}
                      {e.acceptedCountries && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-[#0066CC]" /><span className="text-[#555555] line-clamp-1">{e.acceptedCountries}</span></div>}
                    </div>
                    <Button onClick={() => onNavigate('student-dashboard')} className="w-full bg-[#F37021]/10 text-[#F37021] hover:bg-[#F37021]/20 rounded-full text-sm" variant="ghost">
                      <PlayCircle className="mr-1 h-4 w-4" />Start Prep
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comparison Table */}
      {exams.length > 1 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#101828] mb-8">Quick Comparison</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0066CC]/5">
                    <th className="p-3 text-left font-semibold text-[#101828]">Test</th>
                    <th className="p-3 text-left font-semibold text-[#101828]">Duration</th>
                    <th className="p-3 text-left font-semibold text-[#101828]">Cost</th>
                    <th className="p-3 text-left font-semibold text-[#101828]">Scoring</th>
                    <th className="p-3 text-left font-semibold text-[#101828]">Validity</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.slice(0, 5).map((e, i) => (
                    <tr key={e.slug} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 font-medium text-[#101828]">{EXAM_ICONS[e.slug] || '📝'} {e.shortName || e.name}</td>
                      <td className="p-3 text-[#555555]">{e.duration || '—'}</td>
                      <td className="p-3 text-[#555555]">{e.cost || '—'}</td>
                      <td className="p-3 text-[#555555]">{e.scoring || '—'}</td>
                      <td className="p-3 text-[#555555]">{e.scoreValidity || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-[#F37021] to-[#0066CC]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Practice?</h2>
          <p className="mt-4 text-white/80">Take free mock tests and get personalized study plans from our expert counselors.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => onNavigate('student-dashboard')} size="lg" className="bg-white text-[#F37021] hover:bg-white/90 rounded-full px-8">
              <PlayCircle className="mr-2 h-5 w-5" />Free Mock Test
            </Button>
            <Button onClick={onLeadOpen} variant="outline" size="lg" className="border-white text-white hover:bg-white/10 rounded-full px-8">Talk to a Counselor</Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
