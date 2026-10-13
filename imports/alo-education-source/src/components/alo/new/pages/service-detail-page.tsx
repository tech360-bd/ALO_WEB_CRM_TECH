'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  PenTool,
  CheckCircle,
  Plane,
  MessageSquare,
  Languages,
  Wallet,
  Award,
  Luggage,
  MapPin,
  Briefcase,
  ArrowRight,
  Clock,
  FileCheck,
  ArrowLeftRight,
  Search,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';
import { SERVICES } from '@/components/alo/new/home/homepage-data';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServiceDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface ServiceData {
  title: string;
  slug: string;
  icon?: string;
  description?: string;
  longDescription?: string;
  whatItIs?: string;
  whyStudentsNeed?: string;
  whoItIsFor?: string;
  whatALOdoes?: string;
  stepByStep?: string;
  requiredInfo?: string;
  documentsNeeded?: string;
  timeline?: string;
  whatStudentsGet?: string;
  whatALOdoesNot?: string;
  commonMistakes?: string;
  ctaLabel?: string;
}

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  PenTool,
  CheckCircle,
  Plane,
  MessageSquare,
  Languages,
  Wallet,
  Award,
  Luggage,
  MapPin,
  Briefcase,
};

function getServiceIcon(iconName?: string): LucideIcon {
  if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
  return Briefcase;
}

// ─── Section Component ───────────────────────────────────────────────────────

function ContentSection({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <section className="mb-10">
      {icon && <div className="text-alo-blue mb-2">{icon}</div>}
      <h2 className="text-2xl font-bold text-alo-black mb-4">{title}</h2>
      {children}
    </section>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ServiceDetailPage({ slug, onBack, onNavigate, onLeadOpen }: ServiceDetailPageProps) {
  const [data, setData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchService = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/services/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json.service);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-4 w-48 mb-8" />
            <Skeleton className="h-10 w-80 mb-2" />
            <Skeleton className="h-5 w-96 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <NewFooter onNavigate={onNavigate} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <main className="flex-1 py-8 md:py-12">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-full bg-alo-orange/10 flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-alo-orange" />
            </div>
            <h3 className="text-xl font-semibold text-alo-black mb-2">Failed to Load Service</h3>
            <p className="text-alo-gray mb-6 max-w-md">Something went wrong while fetching the service data.</p>
            <Button onClick={fetchService} className="bg-alo-blue hover:bg-alo-blue-dark text-white rounded-xl transition-all duration-200">
              Try Again
            </Button>
          </div>
        </main>
        <NewFooter onNavigate={onNavigate} />
      </div>
    );
  }

  const IconComponent = getServiceIcon(data.icon);

  const otherServices = SERVICES.filter((s) => s.slug !== slug).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            onClick={onBack}
            className="text-alo-gray hover:text-alo-blue flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-alo-gray mb-6 -mt-4">
            <button onClick={onBack} className="hover:text-alo-blue transition-colors">Home</button>
            <span>/</span>
            <button onClick={onBack} className="hover:text-alo-blue transition-colors">Services</button>
            <span>/</span>
            <span className="text-alo-black font-medium">{data.title}</span>
          </nav>

          {/* Hero */}
          <div className="flex items-start gap-5 mb-10">
            <div className="h-14 w-14 rounded-2xl bg-alo-blue/10 flex items-center justify-center shrink-0">
              <IconComponent className="h-7 w-7 text-alo-blue" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-alo-black mb-2">{data.title}</h1>
              {data.description && (
                <p className="text-alo-gray max-w-2xl">{data.description}</p>
              )}
            </div>
          </div>

          {/* What It Is */}
          {data.whatItIs && (
            <ContentSection title="What Is This Service?" icon={<Search className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.whatItIs}</p>
            </ContentSection>
          )}

          {/* Why Students Need */}
          {data.whyStudentsNeed && (
            <ContentSection title="Why Do Students Need This?" icon={<Users className="h-5 w-5" />}>
              <div className="bg-alo-gray-light rounded-2xl p-6 md:p-8">
                <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.whyStudentsNeed}</p>
              </div>
            </ContentSection>
          )}

          {/* Who It Is For */}
          {data.whoItIsFor && (
            <ContentSection title="Who Is This For?" icon={<GraduationCap className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.whoItIsFor}</p>
            </ContentSection>
          )}

          {/* What ALO Does */}
          {data.whatALOdoes && (
            <ContentSection title="What ALO Does For You" icon={<CheckCircle className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.whatALOdoes}</p>
            </ContentSection>
          )}

          {/* Step by Step */}
          {data.stepByStep && (
            <ContentSection title="How It Works" icon={<ArrowLeftRight className="h-5 w-5" />}>
              <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-6">
                <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.stepByStep}</p>
              </div>
            </ContentSection>
          )}

          {/* Documents Needed */}
          {data.documentsNeeded && (
            <ContentSection title="Documents Needed" icon={<FileCheck className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.documentsNeeded}</p>
            </ContentSection>
          )}

          {/* Timeline */}
          {data.timeline && (
            <ContentSection title="Timeline" icon={<Clock className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.timeline}</p>
            </ContentSection>
          )}

          {/* Long Description */}
          {data.longDescription && (
            <ContentSection title="Detailed Information" icon={<FileText className="h-5 w-5" />}>
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.longDescription}</p>
            </ContentSection>
          )}

          {/* CTA */}
          <section className="bg-gradient-to-r from-alo-blue-dark to-alo-blue rounded-2xl p-8 md:p-10 text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {data.ctaLabel || 'Get Started with This Service'}
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              All ALO services are completely free for students. Get expert support at every step of your study abroad journey.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                  'bg-alo-orange hover:bg-alo-orange-dark',
                  'shadow-lg shadow-alo-orange/20 hover:shadow-xl hover:shadow-alo-orange/30',
                  'transition-all duration-200',
                )}
              >
                Get Started
              </Button>
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm',
                  'bg-white text-alo-blue hover:bg-white/90',
                  'transition-all duration-200',
                )}
              >
                Talk to ALO
              </Button>
            </div>
          </section>

          {/* Other Services Grid */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-alo-black mb-6">Other Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherServices.map((service) => {
                const SvcIcon = getServiceIcon(service.icon);
                return (
                  <button
                    key={service.slug}
                    onClick={() => onNavigate('service', service.slug)}
                    className={cn(
                      'text-left bg-white rounded-xl border border-alo-gray-medium/50 p-6',
                      'card-lift group transition-all duration-200',
                    )}
                  >
                    <SvcIcon className="h-6 w-6 text-alo-blue mb-3 group-hover:text-alo-orange transition-colors" />
                    <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">{service.name}</h3>
                    <p className="text-xs text-alo-gray mt-1 line-clamp-2">{service.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-alo-blue font-medium mt-3 group-hover:gap-2 transition-all">
                      Learn more <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <NewFooter onNavigate={onNavigate} />
    </div>
  );
}
