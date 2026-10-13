'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Users,
  GraduationCap,
  Globe,
  MapPin,
  Flag,
  Search,
  Heart,
  Play,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type Story = {
  studentName: string;
  homeDistrict?: string;
  countrySlug?: string;
  universityName?: string;
  courseName?: string;
  outcome?: string;
  testimonial?: string;
  photo?: string;
  videoUrl?: string;
};

const COUNTRY_MAP: Record<string, string> = {
  uk: 'United Kingdom',
  us: 'United States',
  usa: 'United States',
  ca: 'Canada',
  au: 'Australia',
  de: 'Germany',
  my: 'Malaysia',
  ie: 'Ireland',
  nz: 'New Zealand',
};

export function SuccessStoriesPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/homepage')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.stories)) setStories(data.stories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const countries = Array.from(new Set(stories.map((s) => s.countrySlug).filter(Boolean) as string[]));

  const filtered = stories.filter((s) => {
    const matchesSearch = !search ||
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (s.universityName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.testimonial || '').toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === 'all' || s.countrySlug === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const stats = [
    { icon: <Users className="h-6 w-6" />, value: stories.length > 0 ? `${stories.length}+` : '500+', label: 'Success Stories' },
    { icon: <Star className="h-6 w-6" />, value: '4.9', label: 'Average Rating' },
    { icon: <GraduationCap className="h-6 w-6" />, value: '100+', label: 'Universities' },
    { icon: <Globe className="h-6 w-6" />, value: '15+', label: 'Countries' },
  ];

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
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Student Stories</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Their Success,<span className="block text-[#FFB347]">Your Inspiration</span></h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">Real stories from real students who achieved their dream of studying abroad with ALO Education.</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-[#F37021]/10 flex items-center justify-center text-[#F37021]">{s.icon}</div>
                <div className="text-2xl md:text-3xl font-bold text-[#101828]">{s.value}</div>
                <div className="text-xs text-[#555555]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-[#F8FAFC] border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name, university, or keyword..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Button variant={countryFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCountryFilter('all')} className={`rounded-full whitespace-nowrap ${countryFilter === 'all' ? 'bg-[#F37021] hover:bg-[#F37021]/90 text-white' : ''}`}>
                <Globe className="h-4 w-4 mr-1" /> All
              </Button>
              {countries.map((c) => (
                <Button key={c} variant={countryFilter === c ? 'default' : 'outline'} size="sm" onClick={() => setCountryFilter(c)} className={`rounded-full whitespace-nowrap ${countryFilter === c ? 'bg-[#F37021] hover:bg-[#F37021]/90 text-white' : ''}`}>
                  <Flag className="h-3 w-3 mr-1" /> {COUNTRY_MAP[c] || c}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-12 md:py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-80 w-full rounded-2xl" />))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-sm text-[#555555] mb-6">Showing {filtered.length} storie{filtered.length !== 1 ? 's' : ''}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((story, idx) => {
                  const countryName = story.countrySlug ? (COUNTRY_MAP[story.countrySlug] || story.countrySlug) : '';
                  const storyKey = `story-${idx}`;
                  const isVideoPlaying = playingVideo === storyKey;
                  return (
                    <Card key={idx} className="rounded-2xl border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F37021]/20 to-[#0066CC]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {story.photo ? (
                              <img src={story.photo} alt={story.studentName} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="h-7 w-7 text-[#F37021]/50" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[#101828] truncate">{story.studentName}</h3>
                            {story.universityName && (
                              <div className="flex items-center gap-1 text-sm text-[#0066CC]">
                                <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{story.universityName}</span>
                              </div>
                            )}
                            {countryName && (
                              <div className="flex items-center gap-1 text-xs text-[#555555]">
                                <MapPin className="h-3 w-3 flex-shrink-0" />{countryName}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < 5 ? 'text-[#FFB347] fill-[#FFB347]' : 'text-gray-200'}`} />
                          ))}
                        </div>

                        {story.testimonial && (
                          <p className="text-sm text-[#555555] leading-relaxed line-clamp-4 italic">&ldquo;{story.testimonial}&rdquo;</p>
                        )}

                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          {story.courseName && <Badge variant="secondary" className="bg-[#F8FAFC] text-[#555555] border-0 text-xs">{story.courseName}</Badge>}
                          {story.outcome && <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC] border-0 text-xs">{story.outcome}</Badge>}
                          {story.homeDistrict && <Badge variant="secondary" className="bg-[#F37021]/10 text-[#F37021] border-0 text-xs">{story.homeDistrict}</Badge>}
                        </div>

                        {/* Video Testimonial */}
                        {story.videoUrl && (
                          <div className="mt-4">
                            {isVideoPlaying ? (
                              <div className="rounded-xl overflow-hidden aspect-video">
                                <iframe src={story.videoUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={`Video testimonial from ${story.studentName}`} />
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => setPlayingVideo(storyKey)} className="rounded-full border-[#F37021] text-[#F37021] hover:bg-[#F37021]/5 w-full">
                                <Play className="h-4 w-4 mr-2" /> Watch Video Testimonial
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Heart className="h-12 w-12 text-[#F37021]/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#101828] mb-2">No stories found</h3>
              <p className="text-[#555555] mb-4">Try adjusting your search or filter.</p>
              <Button onClick={() => { setSearch(''); setCountryFilter('all'); }} variant="outline" className="rounded-full">Clear Filters</Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0066CC] to-[#101828]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Write Your Own Success Story</h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Join hundreds of ALO students who turned their study abroad dreams into reality.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onLeadOpen} size="lg" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full px-8">Start Your Journey <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button onClick={() => onNavigate('home')} variant="outline" size="lg" className="border-white text-white hover:bg-white/10 rounded-full px-8">Explore Countries</Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
