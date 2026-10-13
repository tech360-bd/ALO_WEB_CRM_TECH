'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Clock,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type BlogPost = {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  tags?: string;
  authorName?: string;
  authorRole?: string;
  readMinutes?: number;
  featured?: boolean;
  publishedAt?: string;
};

const ITEMS_PER_PAGE = 9;

export function BlogPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);

  const handleSearchChange = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleCategoryChange = useCallback((c: string) => { setActiveCategory(c); setPage(1); }, []);

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.posts)) setPosts(data.posts);
        else if (Array.isArray(data)) setPosts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean) as string[]))];

  const filtered = posts.filter((p) => {
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.authorName || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[45vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#101828] via-[#0066CC] to-[#0066CC]/60" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-32 md:py-36 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Blog & Resources</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Insights & Guides</h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Expert advice, university reviews, visa tips, and student success stories.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search articles..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange(cat)} className={`rounded-full whitespace-nowrap ${activeCategory === cat ? 'bg-[#F37021] hover:bg-[#F37021]/90 text-white' : ''}`}>
                  {cat === 'all' ? 'All' : cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12 md:py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : paginated.length > 0 ? (
            <>
              <p className="text-sm text-[#555555] mb-6">Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} article{filtered.length !== 1 ? 's' : ''}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginated.map((post) => (
                  <Card key={post.id} className="rounded-2xl border-0 shadow-md hover:shadow-lg transition-all overflow-hidden group cursor-pointer" onClick={() => post.slug && onNavigate('blog', post.slug)}>
                    {post.coverImage ? (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-[#F37021]/10 to-[#0066CC]/10 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-[#F37021]/30" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        {post.category && <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC] border-0 text-xs">{post.category}</Badge>}
                        {post.featured && <Badge variant="secondary" className="bg-[#F37021]/10 text-[#F37021] border-0 text-xs">Featured</Badge>}
                      </div>
                      <h3 className="text-lg font-semibold text-[#101828] line-clamp-2 mb-2 group-hover:text-[#F37021] transition-colors">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-[#555555] line-clamp-3 leading-relaxed mb-4">{post.excerpt}</p>}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          {post.authorName && <div className="flex items-center gap-1"><User className="h-3 w-3" />{post.authorName}</div>}
                          {post.readMinutes && <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readMinutes} min</div>}
                        </div>
                        {post.publishedAt && <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)} className={`rounded-full w-9 ${page === p ? 'bg-[#F37021] hover:bg-[#F37021]/90 text-white' : ''}`}>{p}</Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-full"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 text-[#F37021]/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#101828] mb-2">No articles found</h3>
              <p className="text-[#555555] mb-4">Try adjusting your search or category filter.</p>
              <Button onClick={() => { setSearch(''); setActiveCategory('all'); }} variant="outline" className="rounded-full">Clear Filters</Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[#F37021] to-[#FFB347]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Stay Updated</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">Get the latest study abroad tips, scholarship updates, and university news delivered to you.</p>
          <div className="mt-8">
            <Button onClick={onLeadOpen} size="lg" className="bg-white text-[#F37021] hover:bg-white/90 rounded-full px-8">Subscribe for Updates <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
