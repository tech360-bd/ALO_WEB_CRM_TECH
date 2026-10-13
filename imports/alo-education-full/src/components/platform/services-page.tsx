'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  Globe,
  FileText,
  Plane,
  Briefcase,
  Search,
  BookOpen,
  Shield,
  Star,
  Target,
  Zap,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Service = {
  id?: number;
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  icon?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export function ServicesPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.services)) setServices(data.services);
        else if (Array.isArray(data)) setServices(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const processSteps = [
    { step: 1, title: 'Free Consultation', icon: <MessageCircle className="h-6 w-6" />, desc: 'Discuss your goals, preferences, and budget with our expert counselors.' },
    { step: 2, title: 'Profile Building', icon: <FileText className="h-6 w-6" />, desc: 'We assess your academic profile and identify the best path forward.' },
    { step: 3, title: 'University Shortlist', icon: <Search className="h-6 w-6" />, desc: 'Curated list of universities matching your profile and aspirations.' },
    { step: 4, title: 'Application Support', icon: <Briefcase className="h-6 w-6" />, desc: 'Complete application assistance including SOPs, LORs, and essays.' },
    { step: 5, title: 'Visa Guidance', icon: <Shield className="h-6 w-6" />, desc: 'End-to-end visa documentation, mock interviews, and submission support.' },
    { step: 6, title: 'Pre-Departure', icon: <Plane className="h-6 w-6" />, desc: 'Pre-departure briefing, accommodation help, and airport pickup coordination.' },
  ];

  const serviceIcons: Record<string, React.ReactNode> = {
    admission: <GraduationCap className="h-7 w-7" />,
    visa: <Shield className="h-7 w-7" />,
    scholarship: <Star className="h-7 w-7" />,
    consultation: <Target className="h-7 w-7" />,
    counselling: <MessageCircle className="h-7 w-7" />,
    default: <Zap className="h-7 w-7" />,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#101828] via-[#0066CC] to-[#F37021]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-32 md:py-40 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Our Services</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Comprehensive Support for<span className="block text-[#FFB347]">Your Study Abroad Journey</span>
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">From your first consultation to landing at your dream university — we're with you every step of the way.</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">What We Offer</h2>
            <p className="mt-3 text-[#555555] text-lg max-w-2xl mx-auto">Explore our full range of services designed for international students.</p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-56 w-full rounded-2xl" />))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc, idx) => {
                const isExpanded = expandedIdx === idx;
                const iconKey = (svc.icon || 'default').toLowerCase();
                return (
                  <Card
                    key={idx}
                    className={`rounded-2xl border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${isExpanded ? 'ring-2 ring-[#F37021]' : ''}`}
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-[#F37021]/10 flex items-center justify-center text-[#F37021]">
                          {serviceIcons[iconKey] || serviceIcons.default}
                        </div>
                        <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC] border-0 text-xs">Service</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-[#101828] mb-2">{svc.title}</h3>
                      <p className="text-sm text-[#555555] leading-relaxed">{svc.shortDescription || svc.description || 'Comprehensive support for your study abroad needs.'}</p>

                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-gray-100">
                          {svc.description && svc.shortDescription && (
                            <p className="text-sm text-[#555555] mb-3">{svc.description}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => { e.stopPropagation(); onLeadOpen(); }}
                              size="sm"
                              className="bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full"
                            >
                              Get Started <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                            {svc.slug && (
                              <Button
                                onClick={(e) => { e.stopPropagation(); onNavigate('service', svc.slug); }}
                                variant="outline"
                                size="sm"
                                className="rounded-full border-[#0066CC] text-[#0066CC]"
                              >
                                View Details
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {!isExpanded && (
                        <div className="mt-4 flex items-center text-sm text-[#F37021] font-medium">
                          Learn more <ChevronRight className="ml-1 h-4 w-4" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="h-12 w-12 text-[#F37021]/30 mx-auto mb-4" />
              <p className="text-[#555555]">Services information coming soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* 6-Step Process */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">How It Works</h2>
            <p className="mt-3 text-[#555555] text-lg max-w-2xl mx-auto">Our proven 6-step process takes you from initial consultation to your first day at university.</p>
          </div>

          {/* Desktop */}
          <div className="hidden md:grid grid-cols-6 gap-4">
            {processSteps.map((ps) => (
              <div key={ps.step} className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-white border-2 border-[#F37021] shadow-md flex items-center justify-center text-[#F37021]">
                  {ps.icon}
                </div>
                <div className="mt-2 mx-auto w-7 h-7 rounded-full bg-[#F37021] text-white text-xs font-bold flex items-center justify-center">
                  {ps.step}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#101828]">{ps.title}</h3>
                <p className="mt-1 text-xs text-[#555555] leading-relaxed">{ps.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {processSteps.map((ps) => (
              <div key={ps.step} className="flex items-start gap-4 p-4 bg-[#F8FAFC] rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F37021] text-white text-sm font-bold flex items-center justify-center">
                  {ps.step}
                </div>
                <div>
                  <h3 className="font-semibold text-[#101828] text-sm">{ps.title}</h3>
                  <p className="text-xs text-[#555555] mt-1">{ps.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#F37021] to-[#FFB347]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">Book a free consultation and let our experts guide you through every step of your study abroad journey.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onLeadOpen} size="lg" className="bg-white text-[#F37021] hover:bg-white/90 rounded-full px-8">
              Free Consultation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => onNavigate('home')} variant="outline" size="lg" className="border-white text-white hover:bg-white/10 rounded-full px-8">
              Browse Countries
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
