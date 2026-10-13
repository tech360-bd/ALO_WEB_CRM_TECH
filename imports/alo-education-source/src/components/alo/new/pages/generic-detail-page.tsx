'use client';

import {
  ArrowLeft,
  Globe,
  GraduationCap,
  BookOpen,
  Award,
  Briefcase,
  Building2,
  Construction,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GenericDetailPageProps {
  title: string;
  pageType: string;
  slug?: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// ─── Related Section Config ─────────────────────────────────────────────────

function getRelatedSections(pageType: string) {
  const sections: { label: string; page: string; slug?: string; icon: React.ReactNode }[] = [];

  const allSections = [
    { label: 'Course Finder', page: 'course-finder', icon: <BookOpen className="h-6 w-6 text-alo-blue" /> },
    { label: 'Universities', page: 'home', icon: <Building2 className="h-6 w-6 text-alo-blue" /> },
    { label: 'Scholarships', page: 'resources', slug: 'scholarships', icon: <Award className="h-6 w-6 text-alo-orange" /> },
    { label: 'English Tests', page: 'language-prep', icon: <GraduationCap className="h-6 w-6 text-alo-blue" /> },
    { label: 'Services', page: 'services', icon: <Briefcase className="h-6 w-6 text-alo-orange" /> },
    { label: 'Destinations', page: 'destinations', icon: <Globe className="h-6 w-6 text-alo-blue" /> },
    { label: 'Blogs & Resources', page: 'resources', slug: 'blogs', icon: <BookOpen className="h-6 w-6 text-alo-sunshine" /> },
  ];

  // Select 6 related sections based on page type
  switch (pageType) {
    case 'country':
      return [
        allSections[0], // Course Finder
        allSections[1], // Universities
        allSections[2], // Scholarships
        allSections[3], // English Tests
        allSections[4], // Services
        allSections[5], // Destinations
      ];
    case 'about':
    case 'team':
    case 'contact':
      return [allSections[0], allSections[4], allSections[2], allSections[5], allSections[6]];
    case 'careers':
    case 'partner':
      return [allSections[4], allSections[6]];
    default:
      return allSections.slice(0, 6);
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function GenericDetailPage({ title, pageType, slug, onBack, onNavigate, onLeadOpen }: GenericDetailPageProps) {
  const relatedSections = getRelatedSections(pageType);

  const pageTypeLabel = pageType
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

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
            <span className="text-alo-black font-medium">{pageTypeLabel}{title ? ` / ${title}` : ''}</span>
          </nav>

          {/* Coming Soon Card */}
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <div className="h-20 w-20 rounded-2xl bg-alo-blue/10 flex items-center justify-center mb-6">
              <Construction className="h-10 w-10 text-alo-blue" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-alo-black mb-3">
              {title || pageTypeLabel}
            </h1>
            <p className="text-alo-gray max-w-lg mx-auto mb-2">
              This page is currently under construction.
            </p>
            <p className="text-sm text-alo-gray max-w-md mx-auto mb-8">
              We&apos;re working hard to bring you detailed information here. In the meantime, explore what ALO Education has to offer or talk to our counsellors for personalised help.
            </p>

            {slug && (
              <p className="text-xs text-alo-gray/60 mb-8 font-mono">/{pageType}/{slug}</p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                  'bg-alo-blue hover:bg-alo-blue-dark',
                  'shadow-lg shadow-alo-blue/20 hover:shadow-xl hover:shadow-alo-blue/30',
                  'transition-all duration-200',
                )}
              >
                Talk to ALO
              </Button>
              <Button
                onClick={() => onNavigate('course-finder')}
                variant="outline"
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm',
                  'border-alo-gray-medium/50 hover:bg-alo-gray-light',
                  'transition-all duration-200',
                )}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Course Finder
              </Button>
            </div>
          </div>

          {/* Related Sections */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-alo-black mb-6">Explore ALO Education</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedSections.map((section) => (
                <button
                  key={`${section.page}-${section.slug ?? 'root'}`}
                  onClick={() => onNavigate(section.page, section.slug)}
                  className={cn(
                    'text-left bg-white rounded-xl border border-alo-gray-medium/50 p-6',
                    'card-lift group transition-all duration-200',
                  )}
                >
                  {section.icon}
                  <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors mt-3">
                    {section.label}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs text-alo-blue font-medium mt-2 group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <NewFooter onNavigate={onNavigate} />
    </div>
  );
}
