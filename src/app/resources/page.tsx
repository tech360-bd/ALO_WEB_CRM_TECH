'use client';

// ============================================================================
// RESOURCE HUB (spec §25-§28) — /resources
// Hero: "Your Complete Study Abroad Knowledge Hub"
// Working search + filters (§27), honest cards (§28), every card links to
// /resources/{category}/{article-slug} — no dead cards, no fake counts.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Search, Clock } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { RESOURCE_CATEGORIES } from '@/lib/website/resource-categories';

export default function ResourcesHubPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [country, setCountry] = useState('');
  const [level, setLevel] = useState('');
  const [sort, setSort] = useState<'recent' | 'updated'>('recent');

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('limit', '60');
    if (search.trim()) params.set('search', search.trim());
    if (activeCategory) params.set('category', activeCategory);
    if (country) params.set('country', country);
    if (level) params.set('level', level);
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      fetch(`/api/resources?${params.toString()}`)
        .then(r => { if (!r.ok) throw new Error("Resources could not be loaded"); return r.json(); })
        .then(d => setResources(d.resources || []))
        .catch(e => { setResources([]); setError(e.message); })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, activeCategory, country, level]);

  useEffect(() => {
    fetch('/api/resources/categories').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => setCategories([]));
  }, []);

  const sorted = useMemo(() => {
    const arr = [...resources];
    arr.sort((a, b) => new Date((sort === 'updated' ? a.updatedAt : a.publishedAt) || 0).getTime() - new Date((sort === 'updated' ? b.updatedAt : b.publishedAt) || 0).getTime());
    return arr.reverse();
  }, [resources, sort]);

  return (
    <div className="min-h-screen bg-white text-[var(--alo-text)]">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero — spec §26 exact copy */}
          <div className="mb-8 rounded-[20px] border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-6 md:p-10">
            <Badge className="bg-card text-[var(--alo-brand)] border-[var(--alo-border)] text-[11px] px-3 py-1 mb-4 uppercase tracking-[0.07em] font-semibold">ALO Knowledge & Guidance Hub</Badge>
            <h1 className="font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[36px] lg:text-[42px] mb-4">Your Complete Study Abroad Knowledge Hub</h1>
            <p className="max-w-[62ch] text-[15px] leading-7 text-[var(--alo-body)] md:text-base">Practical, updated and student-friendly guidance for researching courses, universities, applications, scholarships, visas and life abroad.</p>
            <div className="flex gap-2 mt-4">
              <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">10 Categories</Badge>
              <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">Database-driven</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">Verified where time-sensitive</Badge>
            </div>
          </div>

          {/* Search + filters — spec §27 */}
          <Card className="p-4 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm mb-8">
            <form role="search" onSubmit={(e) => e.preventDefault()} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)]" aria-hidden />
                <Input aria-label="Search articles" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[var(--alo-border)] h-12" />
              </div>
              <select aria-label="Country" value={country} onChange={e => setCountry(e.target.value)} className="bg-white border border-[var(--alo-border)] rounded-xl px-3 text-sm h-12 hidden sm:block"><option value="">All Countries</option>{['uk','usa','canada','australia','germany'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select>
              <select aria-label="Study level" value={level} onChange={e => setLevel(e.target.value)} className="bg-white border border-[var(--alo-border)] rounded-xl px-3 text-sm h-12 hidden sm:block"><option value="">All Levels</option><option value="undergraduate">Undergraduate</option><option value="postgraduate">Postgraduate</option></select>
              <select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value as any)} className="bg-white border border-[var(--alo-border)] rounded-xl px-3 text-sm h-12"><option value="recent">Popular / Newest</option><option value="updated">Recently updated</option></select>
            </form>
            <div className="flex flex-wrap gap-2 mt-3" role="tablist" aria-label="Resource categories">
              <button type="button" onClick={() => setActiveCategory(null)} className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors min-h-[32px] ${activeCategory === null ? 'bg-[var(--alo-brand)] text-white border-[var(--alo-brand)]' : 'bg-white text-[var(--alo-body)] border-[var(--alo-border)]'}`}>All</button>
              {categories.map((cat) => {
                const dbCat = categories.find((c: any) => c.slug === cat.slug);
                return (
                  <button key={cat.slug} type="button" onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)} className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors min-h-[32px] ${activeCategory === cat.slug ? 'bg-[var(--alo-brand)] text-white border-[var(--alo-brand)]' : 'bg-white text-[var(--alo-body)] border-[var(--alo-border)]'}`}>
                    {cat.name}{dbCat?.resourceCount ? ` (${dbCat.resourceCount})` : ''}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Category cards — spec §25 categories */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {categories.map((cat) => {
              const Icon = RESOURCE_CATEGORIES.find(c => c.slug === cat.slug)?.icon || BookOpen;
              const dbCat = categories.find((c: any) => c.slug === cat.slug);
              return (
                <Link key={cat.slug} href={`/resources/${cat.slug}`}>
                  <Card className="p-4 h-full bg-white hover:shadow-md transition-all border-[var(--alo-border)] hover:border-[var(--alo-brand)] rounded-2xl">
                    <div className="h-10 w-10 rounded-xl bg-[var(--alo-page)] border border-[var(--alo-border)] text-[var(--alo-brand)] flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div>
                    <h3 className="text-sm font-bold text-[var(--alo-text)]">{cat.name}</h3>
                    <p className="text-[11px] text-[var(--alo-body)] mt-1 line-clamp-2">{cat.description}</p>
                    <p className="text-[11px] text-[var(--alo-brand)] font-bold mt-2">{dbCat?.resourceCount ? `${dbCat.resourceCount} article${dbCat.resourceCount === 1 ? '' : 's'}` : 'Browse'}</p>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Article cards — spec §28 */}
          {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl animate-pulse" />)}</div> : sorted.length === 0 ? (
            <Card className="p-12 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl text-center"><BookOpen className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-3" /><p className="text-sm text-[var(--alo-body)]">No articles found for this search.</p><p className="text-xs text-[var(--alo-text-muted)] mt-2">Try a different keyword or clear the filters — Check the source and verification label on each article.</p></Card>
          ) : (
            <>
              <p className="text-sm text-[var(--alo-text-muted)] mb-4" role="status">{sorted.length} article{sorted.length === 1 ? '' : 's'} found</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {sorted.map((b: any) => {
                  const catSlug = b.category?.slug || 'study-abroad-guides';
                  return (
                    <Card key={b.id} className="p-5 bg-white border-[var(--alo-border)] rounded-2xl hover:border-[var(--alo-brand)] hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-[11px] font-bold">{b.category?.name || 'Resource'}</Badge>
                          <span className="text-[11px] text-[var(--alo-text-muted)] flex items-center gap-1"><Clock className="w-3 h-3" />{b.readingTime || 5} min</span>
                        </div>
                        <h3 className="font-bold text-sm text-[var(--alo-text)] mb-2 line-clamp-2">{b.title}</h3>
                        <p className="text-xs text-[var(--alo-body)] mb-3 line-clamp-2">{b.excerpt || b.summary || ''}</p>
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--alo-text-muted)] mb-3">
                          {b.countrySlug && <span className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-full px-2 py-0.5">{b.countrySlug}</span>}
                          {b.studyLevel && <span className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-full px-2 py-0.5">{b.studyLevel}</span>}
                        </div>
                        <p className="text-[11px] text-[var(--alo-text-muted)] mb-3">Updated: {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : '—'}{b.lastVerifiedAt ? ` • Last verified: ${new Date(b.lastVerifiedAt).toLocaleDateString()}` : ''} • {b.authorId ? 'ALO Editorial Team' : 'ALO Editorial Team'}</p>
                      </div>
                      <Link href={`/resources/${catSlug}/${b.slug}`} aria-label={`Read ${b.title}`}><Button className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] font-bold h-12 rounded-xl">Read Full Guide <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Final CTA */}
          <Card className="p-8 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-3xl text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
            <p className="text-sm text-[var(--alo-brand-pale)] mb-6">Research first, act with confidence — ALO is your execution and support layer.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/book-consultation"><Button className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] h-12 px-8 font-bold">Book Free Consultation</Button></Link>
              <Link href="/course-finder"><Button className="bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)] h-12 px-6 font-bold">Find Courses</Button></Link>
              <Link href="/eligibility-check"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Check Eligibility</Button></Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
