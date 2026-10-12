'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, BookOpen, Clock, Tag, RefreshCw, ArrowRight, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type Resource = {
  slug: string; title: string; category?: string; excerpt?: string;
  heroImage?: string; author?: string; readingTime?: number; createdAt?: string;
};

const CATEGORY_ICONS: Record<string, string> = {
  'Visa Guides': '🛂', 'Application Tips': '📋', 'English Tests': '📝',
  'Scholarships': '🎓', 'Pre-Departure': '✈️', 'Country Guide': '🌍',
  'University Guide': '🏛️', 'Career': '💼', 'Student Life': '🎉',
};

const DEFAULT_CATEGORIES = ['Visa Guides', 'Application Tips', 'English Tests', 'Scholarships', 'Pre-Departure'];

export function ResourcesPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    fetch('/api/resources')
      .then(r => r.json())
      .then(data => {
        if (data?.resources) {
          setResources(data.resources);
          setTotal(data.total || 0);
          if (data.categories?.length) setCategories(data.categories);
        } else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [retryKey]);

  const handleRetry = useCallback(() => { setLoading(true); setError(false); setRetryKey(k => k + 1); }, []);

  const filtered = resources.filter(r => {
    const matchCat = activeCategory === 'all' || r.category === activeCategory;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.excerpt || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC] via-[#F37021] to-[#101828]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-28 md:py-36 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Resources & Guides</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Your Guide to Studying Abroad</h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Comprehensive guides on visa applications, document preparation, English tests, scholarships, and more.</p>
        </div>
      </section>

      {/* Search + Category Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guides..." className="pl-10 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setActiveCategory('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-[#0066CC] text-white shadow-md' : 'bg-gray-100 text-[#555555] hover:bg-gray-200'}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-[#0066CC] text-white shadow-md' : 'bg-gray-100 text-[#555555] hover:bg-gray-200'}`}>
                {CATEGORY_ICONS[cat] || '📄'} {cat}
              </button>
            ))}
            <span className="ml-auto text-sm text-[#555555]">{filtered.length} guide{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-8 md:py-12 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center py-20"><p className="text-[#555555] mb-4">Failed to load resources.</p><Button onClick={handleRetry} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button></div>
          ) : loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="space-y-3"><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></div>))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20"><BookOpen className="h-12 w-12 text-[#0066CC]/30 mx-auto mb-4" /><p className="text-[#555555]">No guides found.</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map(r => (
                <Card key={r.slug} className="border-0 shadow-md rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="h-36 bg-gradient-to-br from-[#0066CC]/10 to-[#F37021]/10 flex items-center justify-center">
                    {r.heroImage ? <img src={r.heroImage} alt={r.title} className="w-full h-full object-cover" /> : <FileText className="h-12 w-12 text-[#0066CC]/20" />}
                  </div>
                  <CardContent className="p-4">
                    {r.category && <Badge className="mb-2 bg-[#F37021]/10 text-[#F37021] border-0 text-xs">{CATEGORY_ICONS[r.category] || '📄'} {r.category}</Badge>}
                    <h3 className="font-semibold text-[#101828] text-sm leading-tight line-clamp-2">{r.title}</h3>
                    {r.excerpt && <p className="mt-1.5 text-xs text-[#555555] line-clamp-2">{r.excerpt}</p>}
                    <div className="flex items-center gap-3 mt-3 text-xs text-[#555555]">
                      {r.readingTime && <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.readingTime} min</div>}
                      {r.author && <div className="flex items-center gap-1"><Tag className="h-3 w-3" />{r.author}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-[#101828]">Need Personalized Guidance?</h2>
          <p className="mt-4 text-[#555555]">Our counselors can help you navigate the entire process from start to finish.</p>
          <Button onClick={onLeadOpen} size="lg" className="mt-6 bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full px-8">Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </section>
    </motion.div>
  );
}
