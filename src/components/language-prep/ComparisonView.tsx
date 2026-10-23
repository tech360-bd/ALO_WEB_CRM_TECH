'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, AlertCircle, Globe, Clock, FileText, Award, Layers } from 'lucide-react';

export default function ComparisonView() {
  const [tests, setTests] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>(['ielts', 'pte-academic', 'toefl-ibt', 'duolingo', 'oxford-ellt']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/language-prep/comparison')
      .then(r => r.json())
      .then(d => {
        if (d.success) setTests(d.comparison);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleTest = (slug: string) => {
    if (selected.includes(slug)) {
      if (selected.length > 1) setSelected(selected.filter(s => s !== slug));
    } else {
      if (selected.length < 6) setSelected([...selected, slug]);
    }
  };

  const filtered = tests.filter(t => selected.includes(t.slug));

  return (
    <div className="min-h-screen bg-white text-[var(--alo-text)]">
      <section className="bg-white border-b border-[var(--alo-border)] pt-10 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] mb-6">
            <a href="/" className="hover:text-[var(--alo-brand)]">Home</a><span>›</span>
            <a href="/language-prep" className="hover:text-[var(--alo-brand)]">Language Prep</a><span>›</span>
            <span className="text-[var(--alo-brand)] font-bold">Comparison</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--alo-text)]">Compare English Tests</h1>
          <p className="text-sm text-[var(--alo-body)] mt-3 max-w-3xl leading-relaxed">
            Side-by-side evaluation of test durations, result delivery speed, scoring scales, and delivery formats. Check the current provider information where it is not yet verified. Acceptance varies by university, course and visa route.
          </p>
          <p className="text-[11px] text-amber-700 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
            Prices and result times change. Check the current provider information before you decide.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector */}
        <Card className="p-5 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl mb-8">
          <h3 className="font-bold text-sm text-[var(--alo-text)] mb-3">Select tests to compare (max 6)</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { slug: 'ielts', name: 'IELTS' },
              { slug: 'ielts-ukvi', name: 'IELTS UKVI' },
              { slug: 'pte-academic', name: 'PTE Academic' },
              { slug: 'toefl-ibt', name: 'TOEFL iBT' },
              { slug: 'duolingo', name: 'Duolingo' },
              { slug: 'oietc', name: 'OIETC' },
              { slug: 'oxford-ellt', name: 'Oxford ELLT' },
              { slug: 'languagecert', name: 'LanguageCert' },
              { slug: 'oet', name: 'OET' },
              { slug: 'gre', name: 'GRE' },
              { slug: 'gmat', name: 'GMAT' },
            ].map(t => (
              <button
                key={t.slug}
                onClick={() => toggleTest(t.slug)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
                  selected.includes(t.slug) ? 'bg-[var(--alo-brand)] text-white border-[var(--alo-brand)]' : 'bg-white text-[var(--alo-text)] border-[var(--alo-border)] hover:border-[var(--alo-brand)]'
                }`}
              >
                {t.name} {selected.includes(t.slug) && '✓'}
              </button>
            ))}
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--alo-brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[var(--alo-text-muted)]">Loading comparison — database-driven...</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[var(--alo-border)] shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--alo-page)] text-[var(--alo-text)] border-b border-[var(--alo-border)]">
                    <th className="p-4 font-bold min-w-[140px]">Test</th>
                    <th className="p-4 font-bold">Duration</th>
                    <th className="p-4 font-bold">Format</th>
                    <th className="p-4 font-bold">Scoring</th>
                    <th className="p-4 font-bold">Typical Result Timeline</th>
                    <th className="p-4 font-bold">Acceptance</th>
                    <th className="p-4 font-bold">Best For</th>
                    <th className="p-4 font-bold">Preparation Style</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--alo-border)]">
                  {filtered.map((t: any) => (
                    <tr key={t.slug} className="hover:bg-[var(--alo-page)]">
                      <td className="p-4">
                        <a href={`/language-prep/${t.slug}`} className="font-bold text-[var(--alo-brand)] hover:underline">{t.name}</a>
                        <p className="text-[11px] text-[var(--alo-text-muted)] mt-1">{t.provider}</p>
                        {t.isPopular && <Badge className="bg-[var(--alo-cta)] text-black text-[11px] mt-1">Popular</Badge>}
                      </td>
                      <td className="p-4 text-[var(--alo-body)]">{t.duration}</td>
                      <td className="p-4 text-[var(--alo-body)]">{t.format}</td>
                      <td className="p-4 text-[var(--alo-body)]">{t.scoring}</td>
                      <td className="p-4 font-medium text-emerald-700">{t.resultTimeline}</td>
                      <td className="p-4 text-[var(--alo-body)] max-w-[200px]"><span className="line-clamp-3">{t.acceptance}</span><p className="text-[11px] text-amber-600 mt-1">Acceptance varies</p></td>
                      <td className="p-4 text-[var(--alo-body)] max-w-[180px] line-clamp-3">{t.bestFor}</td>
                      <td className="p-4 text-[var(--alo-body)]">Module practice + Mock + Feedback</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden grid gap-4">
              {filtered.map((t: any) => (
                <Card key={t.slug} className="p-5 bg-white border border-[var(--alo-border)] rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-sm text-[var(--alo-brand)]"><a href={`/language-prep/${t.slug}`} className="hover:underline">{t.name}</a></h4>
                    {t.isPopular && <Badge className="bg-[var(--alo-cta)] text-black text-[11px]">Popular</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div><span className="text-[var(--alo-text-muted)] block">Duration</span><span className="font-semibold">{t.duration}</span></div>
                    <div><span className="text-[var(--alo-text-muted)] block">Format</span><span className="font-semibold">{t.format}</span></div>
                    <div><span className="text-[var(--alo-text-muted)] block">Scoring</span><span className="font-semibold">{t.scoring}</span></div>
                    <div><span className="text-[var(--alo-text-muted)] block">Results</span><span className="font-semibold text-emerald-600">{t.resultTimeline}</span></div>
                    <div className="col-span-2"><span className="text-[var(--alo-text-muted)] block">Acceptance</span><span className="font-medium">{t.acceptance}</span><p className="text-[11px] text-amber-600 mt-1">Acceptance varies by university, course and visa route</p></div>
                    <div className="col-span-2"><span className="text-[var(--alo-text-muted)] block">Best For</span><span className="font-medium">{t.bestFor}</span></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild className="w-full bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-bold h-9 rounded-xl text-xs"><a href={`/language-prep/${t.slug}`} className="flex-1">Learn More</a></Button>
                    <Button asChild variant="outline" className="bg-white border-[var(--alo-border)] h-9 rounded-xl text-xs"><a href={t.officialUrl} target="_blank">Official ↗</a></Button>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
              <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Source Verification & Disclaimer</h4>
              <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                Test information is taken from official provider sources where available. Check the official provider for current duration, scoring, fees and requirements. Acceptance varies by university, course and visa route. Visa requirements vary by country and route. MOI is a guidance resource, not an English proficiency test.
              </p>
              <div className="mt-4 grid sm:grid-cols-3 gap-3 text-[11px]">
                {filtered.slice(0,3).map((t: any) => (
                  <div key={t.slug} className="p-3 rounded-xl bg-white border border-amber-100">
                    <p className="font-bold text-[var(--alo-text)]">{t.name}</p>
                    <p className="text-[var(--alo-text-muted)] mt-1">Source: {t.sourceUrl ? <a href={t.sourceUrl} target="_blank" className="text-[var(--alo-brand)] hover:underline">{t.sourceUrl}</a> : 'Check official provider'}</p>
                    <p className="text-[var(--alo-text-muted)]">Last verified: {t.lastVerifiedAt || 'Information requires verification'}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
