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
    <div className="min-h-screen bg-white text-[#0F172A]">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero — spec §26 exact copy */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm mb-8">
            <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs px-3 py-1 mb-4 uppercase">ALO Knowledge & Guidance Hub</Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Your Complete Study Abroad Knowledge Hub</h1>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">Practical, updated and student-friendly guidance for researching courses, universities, applications, scholarships, visas and life abroad.</p>
            <div className="flex gap-2 mt-4">
              <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">10 Categories</Badge>
              <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">Database-driven</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Verified where time-sensitive</Badge>
            </div>
          </div>

          {/* Search + filters — spec §27 */}
          <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl shadow-sm mb-8">
            <form role="search" onSubmit={(e) => e.preventDefault()} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
                <Input aria-label="Search articles" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#E2E8F0] h-12" />
              </div>
              <select aria-label="Country" value={country} onChange={e => setCountry(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 text-sm h-12 hidden sm:block"><option value="">All Countries</option>{['uk','usa','canada','australia','germany'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select>
              <select aria-label="Study level" value={level} onChange={e => setLevel(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 text-sm h-12 hidden sm:block"><option value="">All Levels</option><option value="undergraduate">Undergraduate</option><option value="postgraduate">Postgraduate</option></select>
              <select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value as any)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 text-sm h-12"><option value="recent">Popular / Newest</option><option value="updated">Recently updated</option></select>
            </form>
            <div className="flex flex-wrap gap-2 mt-3" role="tablist" aria-label="Resource categories">
              <button type="button" onClick={() => setActiveCategory(null)} className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors min-h-[32px] ${activeCategory === null ? 'bg-[#0057B8] text-white border-[#0057B8]' : 'bg-white text-gray-700 border-[#E2E8F0]'}`}>All</button>
              {categories.map((cat) => {
                const dbCat = categories.find((c: any) => c.slug === cat.slug);
                return (
                  <button key={cat.slug} type="button" onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)} className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors min-h-[32px] ${activeCategory === cat.slug ? 'bg-[#0057B8] text-white border-[#0057B8]' : 'bg-white text-gray-700 border-[#E2E8F0]'}`}>
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
                  <Card className="p-4 h-full bg-white hover:shadow-md transition-all border-[#E2E8F0] hover:border-[#0057B8] rounded-2xl">
                    <div className="h-10 w-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0057B8] flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div>
                    <h3 className="text-sm font-bold text-[#0F172A]">{cat.name}</h3>
                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{cat.description}</p>
                    <p className="text-[10px] text-[#0057B8] font-bold mt-2">{dbCat?.resourceCount ? `${dbCat.resourceCount} article${dbCat.resourceCount === 1 ? '' : 's'}` : 'Browse'}</p>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Article cards — spec §28 */}
          {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : sorted.length === 0 ? (
            <Card className="p-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">No articles found for this search.</p><p className="text-xs text-gray-500 mt-2">Try a different keyword or clear the filters — Check the source and verification label on each article.</p></Card>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4" role="status">{sorted.length} article{sorted.length === 1 ? '' : 's'} found</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {sorted.map((b: any) => {
                  const catSlug = b.category?.slug || 'study-abroad-guides';
                  return (
                    <Card key={b.id} className="p-5 bg-white border-[#E2E8F0] rounded-2xl hover:border-[#0057B8] hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-[10px] font-bold">{b.category?.name || 'Resource'}</Badge>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{b.readingTime || 5} min</span>
                        </div>
                        <h3 className="font-bold text-sm text-[#0F172A] mb-2 line-clamp-2">{b.title}</h3>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{b.excerpt || b.summary || ''}</p>
                        <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-500 mb-3">
                          {b.countrySlug && <span className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-2 py-0.5">{b.countrySlug}</span>}
                          {b.studyLevel && <span className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-2 py-0.5">{b.studyLevel}</span>}
                        </div>
                        <p className="text-[10px] text-gray-500 mb-3">Updated: {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : '—'}{b.lastVerifiedAt ? ` • Last verified: ${new Date(b.lastVerifiedAt).toLocaleDateString()}` : ''} • {b.authorId ? 'ALO Editorial Team' : 'ALO Editorial Team'}</p>
                      </div>
                      <Link href={`/resources/${catSlug}/${b.slug}`} aria-label={`Read ${b.title}`}><Button className="w-full bg-[#0057B8] text-white hover:bg-[#003F87] text-xs font-bold h-12 rounded-xl">Read Full Guide <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Final CTA */}
          <Card className="p-8 bg-gradient-to-r from-[#0057B8] to-[#003F87] rounded-3xl text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
            <p className="text-sm text-blue-100 mb-6">Research first, act with confidence — ALO is your execution and support layer.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/book-consultation"><Button className="bg-[#E8501A] text-white hover:bg-[#C84012] h-12 px-8 font-bold">Book Free Consultation</Button></Link>
              <Link href="/course-finder"><Button className="bg-white text-[#0057B8] hover:bg-blue-50 h-12 px-6 font-bold">Find Courses</Button></Link>
              <Link href="/eligibility-check"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Check Eligibility</Button></Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
