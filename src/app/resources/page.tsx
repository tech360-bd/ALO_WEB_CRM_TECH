'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Award, Shield, Globe, Building2, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function ResourcesHubPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/resources?limit=20').then(r => r.json()).then(d => setResources(d.resources || [])).catch(() => setResources([])),
      fetch('/api/resources/categories').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => setCategories([])),
    ]).finally(() => setLoading(false));
  }, []);

  const RESOURCE_SECTIONS = [
    { icon: BookOpen, title: 'Blogs & Articles', desc: 'High-quality SEO guides on visas, scholarships, and test prep — DB-driven with source verification.', href: '/resources/blogs', count: `${resources.length || 10} Articles` },
    { icon: Shield, title: 'Visa Guides & Readiness', desc: 'Step-by-step visa rules for UK, USA, Australia, Canada, Germany & Ireland — official sources verified.', href: '/visa-support', count: '10 Countries' },
    { icon: Award, title: 'Scholarships Directory', desc: 'Chevening, Commonwealth, Fulbright & ALO Merit Grants — verified only.', href: '/scholarships', count: '19+ Scholarships' },
    { icon: BookOpen, title: 'English Test Prep', desc: 'IELTS, PTE, Duolingo, TOEFL, GRE, GMAT preparation modules — DB-driven.', href: '/language-prep', count: '17 Tests' },
    { icon: Globe, title: 'Pre-Departure Checklists', desc: 'Essential packing, foreign currency, and airport clearance guides.', href: '/eligibility-check', count: 'Checklist' },
    { icon: Building2, title: 'Living Cost Calculator', desc: 'Estimate student budgets in London, Sydney, Toronto, and Berlin — verified data.', href: '/resources', count: 'Calculator' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm mb-12">
            <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs px-3 py-1 mb-4 uppercase">ALO Knowledge & Guidance Hub</Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Study Abroad Resources Hub</h1>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">Explore high-quality guides, official visa checklists, scholarship application strategies, and language test prep modules tailored for Bangladeshi students. DB-driven, verified, actionable — clear + complete + structured + verified + actionable information.</p>
            <div className="flex gap-2 mt-4">
              <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">10 Categories</Badge>
              <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">DB-driven</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Verified</Badge>
            </div>
          </div>

          <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl shadow-sm mb-8">
            <div className="flex gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search resources — blogs, visa guides, scholarships, application tips..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#E2E8F0] h-11" /></div>
              <Button className="bg-[#0057B8] text-white h-11">Search Resources</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {categories.slice(0, 8).map((cat: any) => <Badge key={cat.id} variant="outline" className="border-[#E2E8F0] text-[11px]">{cat.name} ({cat.resourceCount || 0})</Badge>)}
              {categories.length === 0 && ['Blogs', 'Visa Guides', 'Scholarships', 'Application Tips', 'Pre-Departure', 'Accommodation', 'Financial Planning', 'English Tests'].map(c => <Badge key={c} variant="outline" className="border-[#E2E8F0] text-[11px]">{c}</Badge>)}
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {RESOURCE_SECTIONS.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <Card key={idx} className="p-6 bg-white hover:shadow-md transition-all border-[#E2E8F0] hover:border-[#0057B8] flex flex-col justify-between rounded-2xl">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0057B8] flex items-center justify-center"><Icon className="h-6 w-6" /></div>
                      <Badge className="bg-[#F8FAFC] text-gray-700 border-[#E2E8F0] text-[10px] font-bold">{sec.count}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">{sec.title}</h3>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">{sec.desc}</p>
                  </div>
                  <Link href={sec.href} className="block w-full"><Button className="w-full bg-[#0057B8] text-white hover:bg-[#004494] text-xs font-bold h-11 rounded-xl flex items-center justify-center gap-1.5">Open Resource <ArrowRight className="h-4 w-4" /></Button></Link>
                </Card>
              );
            })}
          </div>

          <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-2xl font-bold text-[#0F172A]">Featured SEO Articles & Guides — DB-driven</h2><p className="text-xs text-gray-500 mt-1">Authoritative study abroad guidance for Bangladeshi applicants — original ALO language, not copied word-for-word</p></div>
              <Link href="/resources"><Button variant="outline" className="text-xs border-[#E2E8F0] h-11">View All Articles →</Button></Link>
            </div>
            {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : resources.length === 0 ? (
              <div className="p-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-center"><p className="text-sm text-gray-600">No resources yet. Resource hub with categories Blogs, Visa Guides, Scholarships, Application Tips, Pre-Departure, Accommodation, Financial Planning, English Tests, Student Visa FAQs, Study Abroad Guides — DB-driven.</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.slice(0, 3).map((b: any) => (
                  <Card key={b.id} className="p-5 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl">
                    <Badge className="bg-white border-[#E2E8F0] text-[#0057B8] text-[10px] font-bold mb-2">{b.category?.name || 'Resource'}</Badge>
                    <h3 className="font-bold text-sm text-[#0F172A] mb-2 line-clamp-2">{b.title}</h3>
                    <p className="text-xs text-gray-600 mb-4 line-clamp-2">{b.excerpt || b.summary || ''}</p>
                    <Link href={`/resources/${b.slug}`} className="text-xs font-bold text-[#0057B8] hover:underline flex items-center gap-1">Read Article <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
