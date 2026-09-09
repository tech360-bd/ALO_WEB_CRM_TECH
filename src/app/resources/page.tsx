import React from 'react';
import { Metadata } from 'next';
import { MASTER_BLOGS_DATA } from '@/lib/blogs-data';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Award, Shield, Star, Globe, Building2, HelpCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Study Abroad Resources & Knowledge Hub | ALO Education',
  description: 'Comprehensive study abroad knowledge hub: Blogs, Student Visa Guides, Scholarship Directories, Pre-Departure Checklists, and Financial Calculators.',
  alternates: { canonical: 'https://aloeducation.com/resources' },
};

export default function ResourcesHubPage() {
  const RESOURCE_SECTIONS = [
    { icon: BookOpen, title: 'Blogs & Articles', desc: '10 High-quality SEO guides on visas, scholarships, and test prep.', href: '/resources/blogs', count: '10 Articles' },
    { icon: Shield, title: 'Visa Guides & Readiness', desc: 'Step-by-step visa rules for UK, USA, Australia, Canada, Germany & Ireland.', href: '/visa-guide', count: '10 Countries' },
    { icon: Award, title: 'Scholarships Directory', desc: 'Chevening, Commonwealth, Fulbright & ALO Merit Grants.', href: '/scholarships', count: '19 Pages' },
    { icon: BookOpen, title: 'English Test Prep', desc: 'IELTS, PTE, Duolingo, TOEFL, GRE, GMAT preparation modules.', href: '/english-test-prep', count: '12 Tests' },
    { icon: Globe, title: 'Pre-Departure Checklists', desc: 'Essential packing, foreign currency, and airport clearance guides.', href: '/eligibility-check', count: 'Checklist' },
    { icon: Building2, title: 'Living Cost Calculator', desc: 'Estimate student budgets in London, Sydney, Toronto, and Berlin.', href: '/resources/cost-calculator', count: 'Calculator' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* HERO BANNER */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-3xl p-8 md:p-12 text-white mb-12 shadow-xl">
            <Badge className="bg-[#E8501A] text-white font-bold text-xs px-3 py-1 mb-4 uppercase">
              ALO KNOWLEDGE & GUIDANCE HUB
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Study Abroad Resources Hub
            </h1>
            <p className="text-base md:text-lg text-blue-100 max-w-3xl leading-relaxed">
              Explore high-quality guides, official visa checklists, scholarship application strategies, and language test prep modules tailored for Bangladeshi students.
            </p>
          </div>

          {/* RESOURCE SECTIONS GRID */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {RESOURCE_SECTIONS.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <Card key={idx} className="p-6 bg-white hover:shadow-xl transition-all border-slate-200 hover:border-[#0057B8] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#0057B8] flex items-center justify-center font-bold">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge className="bg-slate-100 text-slate-700 text-[10px] font-bold">{sec.count}</Badge>
                    </div>

                    <h3 className="text-xl font-bold text-[#0F172A] mb-2">{sec.title}</h3>
                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">{sec.desc}</p>
                  </div>

                  <a href={sec.href} className="block w-full">
                    <Button className="w-full bg-[#0057B8] text-white hover:bg-[#003d80] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      Open Resource <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </Card>
              );
            })}
          </div>

          {/* FEATURED BLOGS SECTION */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0F172A]">Featured SEO Articles & Guides</h2>
                <p className="text-xs text-slate-500 mt-1">Authoritative study abroad guidance for Bangladeshi applicants</p>
              </div>
              <a href="/resources/blogs">
                <Button variant="outline" className="text-xs border-[#0057B8] text-[#0057B8]">
                  View All 10 Articles →
                </Button>
              </a>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MASTER_BLOGS_DATA.slice(0, 3).map((b) => (
                <Card key={b.id} className="p-5 bg-slate-50 border-slate-200">
                  <Badge className="bg-blue-100 text-[#0057B8] text-[10px] font-bold mb-2">{b.category}</Badge>
                  <h3 className="font-bold text-sm text-[#0F172A] mb-2 line-clamp-2">{b.title}</h3>
                  <p className="text-xs text-slate-600 mb-4 line-clamp-2">{b.excerpt}</p>
                  <a href={`/resources/blogs/${b.slug}`} className="text-xs font-bold text-[#0057B8] hover:underline flex items-center gap-1">
                    Read Article <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </Card>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
