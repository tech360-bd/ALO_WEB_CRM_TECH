'use client';

// ============================================================================
// /resources/{category} — category listing (spec: RESOURCES SYSTEM routes).
// Breadcrumb → category intro → filter chips → article cards linking to
// /resources/{category}/{article-slug}. DB-driven via /api/resources?category=
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Clock, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface Props {
  categorySlug: string;
  categoryName: string;
  intro?: string;
}

export default function ResourcesCategoryListing({ categorySlug, categoryName, intro }: Props) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ category: categorySlug, limit: '100' });
    if (search.trim()) params.set('search', search.trim());
    if (level) params.set('level', level);
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/resources?${params.toString()}`)
        .then(r => r.json())
        .then(d => setResources(d.resources || []))
        .catch(() => setResources([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [categorySlug, search, level]);

  const items = useMemo(() => resources, [resources]);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-8">
        <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#0066CC]">Home</Link><span>›</span>
          <Link href="/resources" className="hover:text-[#0066CC]">Resources</Link><span>›</span>
          <span className="text-[#0066CC] font-bold">{categoryName}</span>
        </nav>

        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 text-xs px-3 py-1 mb-3">{categoryName}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-2">{categoryName} — ALO Education</h1>
          <p className="text-sm md:text-base text-gray-600 max-w-3xl">{intro || `Practical ${categoryName.toLowerCase()} guidance — database-driven, verified where time-sensitive.`}</p>
        </div>

        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
          <form role="search" onSubmit={(e) => e.preventDefault()} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
              <Input aria-label={`Search ${categoryName}`} placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white border-[#E2E8F0] h-11" />
            </div>
            <select aria-label="Study level" value={level} onChange={(e) => setLevel(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 text-sm h-11">
              <option value="">All Levels</option><option value="undergraduate">Undergraduate</option><option value="postgraduate">Postgraduate</option>
            </select>
          </form>
        </Card>

        {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : items.length === 0 ? (
          <Card className="p-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No {categoryName.toLowerCase()} articles published yet.</p>
            <p className="text-xs text-gray-500 mt-2">ALO publishes only complete, verified articles — check other categories or return soon.</p>
            <Link href="/resources"><Button className="mt-4 bg-[#0066CC] text-white h-12 px-6">Browse All Resources</Button></Link>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((b: any) => (
              <Card key={b.id} className="p-5 bg-white border-[#E2E8F0] rounded-2xl hover:border-[#0066CC] hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 text-[10px]">{b.category?.name || categoryName}</Badge>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{b.readingTime || 5} min</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#0F172A] mb-2 line-clamp-2">{b.title}</h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-3">{b.excerpt || b.summary || ''}</p>
                  <p className="text-[10px] text-gray-500">Updated: {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : '—'}{b.lastVerifiedAt ? ` • Last verified: ${new Date(b.lastVerifiedAt).toLocaleDateString()}` : ''} • ALO Editorial Team</p>
                </div>
                <Link href={`/resources/${categorySlug}/${b.slug}`} aria-label={`Read ${b.title}`}><Button className="w-full bg-[#0066CC] text-white hover:bg-[#003D7A] text-xs font-bold h-12 rounded-xl mt-4">Read Full Guide <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
