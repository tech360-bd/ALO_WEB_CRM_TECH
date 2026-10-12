'use client';

import { NewHomepage } from '@/components/alo/new/home/homepage';
import { CountryPage } from '@/components/alo/new/pages/country-page';
import { AboutPage } from '@/components/platform/about-page';
import { ContactPage } from '@/components/platform/contact-page';
import { ServicesPage } from '@/components/platform/services-page';
import { ScholarshipsPage } from '@/components/platform/scholarships-page';
import { StudentInfoCenter } from '@/components/platform/student-info-center';
import { BlogPage } from '@/components/platform/blog-page';
import { SuccessStoriesPage } from '@/components/platform/success-stories-page';
import { FaqPage } from '@/components/platform/faq-page';
import { DestinationsPage } from '@/components/platform/destinations-page';
import { UniversitiesPage } from '@/components/platform/universities-page';
import { ResourcesPage } from '@/components/platform/resources-page';
import { ExamsPage } from '@/components/platform/exams-page';
import { StudentJourneyPage } from '@/components/alo/new/pages/student-journey-page';

export type PublicViewKey =
  | 'home' | 'country' | 'about' | 'contact' | 'services' | 'scholarships'
  | 'info-center' | 'blog' | 'success-stories' | 'faq'
  | 'destinations' | 'universities' | 'resources' | 'exams'
  | 'events' | 'news' | 'terms' | 'privacy' | 'cookie-policy'
  | 'journey' | 'careers' | 'partners';

interface PublicViewsProps {
  view: PublicViewKey;
  countrySlug?: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
  onFinderOpen?: () => void;
}

// Static placeholder for pages not yet built as full components
function StaticPlaceholder({ title, desc, onBack }: { title: string; desc: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-lg px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">{title}</h1>
        <p className="text-slate-600 mb-8">{desc}</p>
        <button onClick={onBack} className="text-[#0066CC] hover:underline font-medium">
          &larr; Back to Home
        </button>
      </div>
    </div>
  );
}

export function PublicViews({ view, countrySlug, onBack, onNavigate, onLeadOpen, onFinderOpen }: PublicViewsProps) {
  const pp = { onBack, onNavigate, onLeadOpen };

  switch (view) {
    case 'home':
      return <NewHomepage onNavigate={onNavigate} onLeadOpen={onLeadOpen} onFinderOpen={onFinderOpen || (() => onNavigate('course-finder'))} />;
    case 'country':
      return <CountryPage countrySlug={countrySlug || 'uk'} {...pp} />;
    case 'about':
      return <AboutPage {...pp} />;
    case 'contact':
      return <ContactPage {...pp} />;
    case 'services':
      return <ServicesPage {...pp} />;
    case 'scholarships':
      return <ScholarshipsPage {...pp} />;
    case 'info-center':
      return <StudentInfoCenter {...pp} />;
    case 'blog':
      return <BlogPage {...pp} />;
    case 'success-stories':
      return <SuccessStoriesPage {...pp} />;
    case 'faq':
      return <FaqPage {...pp} />;
    case 'destinations':
      return <DestinationsPage {...pp} />;
    case 'universities':
      return <UniversitiesPage {...pp} />;
    case 'resources':
      return <ResourcesPage {...pp} />;
    case 'exams':
      return <ExamsPage {...pp} />;
    case 'journey':
      return <StudentJourneyPage onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    // Static placeholders
    case 'events':
      return <StaticPlaceholder title="Events & Webinars" desc="Join our upcoming university fairs, webinars, and information sessions. Meet university representatives and get your questions answered." onBack={onBack} />;
    case 'news':
      return <StaticPlaceholder title="News & Updates" desc="Stay updated with the latest in international education — policy changes, new programs, scholarship announcements, and more." onBack={onBack} />;
    case 'terms':
      return <StaticPlaceholder title="Terms of Service" desc="By using ALO Education's services, you agree to our terms and conditions designed to protect both students and our organization." onBack={onBack} />;
    case 'privacy':
      return <StaticPlaceholder title="Privacy Policy" desc="Your privacy matters to us. Learn how ALO Education collects, uses, and protects your personal information." onBack={onBack} />;
    case 'cookie-policy':
      return <StaticPlaceholder title="Cookie Policy" desc="Understand how ALO Education uses cookies and similar technologies to improve your browsing experience." onBack={onBack} />;
    case 'careers':
      return <StaticPlaceholder title="Careers at ALO" desc="Join our team and help students achieve their global education dreams. View current openings and apply." onBack={onBack} />;
    case 'partners':
      return <StaticPlaceholder title="Partner With ALO" desc="Become an ALO Education partner. We work with universities, agents, and organizations worldwide to create pathways for students." onBack={onBack} />;
    default:
      return <StaticPlaceholder title="Page Not Found" desc="The page you are looking for does not exist." onBack={onBack} />;
  }
}
