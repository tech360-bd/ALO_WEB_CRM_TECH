'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

// ─── Navbar & Footer (loaded immediately as they're always shown) ──────
const PublicNavbar = dynamic(() => import('@/components/public/public-navbar').then(m => ({ default: m.PublicNavbar })), { ssr: false });
const PublicFooter = dynamic(() => import('@/components/public/public-footer').then(m => ({ default: m.PublicFooter })), { ssr: false });

// ─── View groups — loaded on demand ─────────────────────────────────────
const PublicViews = dynamic(() => import('@/components/alo/views/public-views').then(m => ({ default: m.PublicViews })), { ssr: false });
const CourseViews = dynamic(() => import('@/components/alo/views/course-views').then(m => ({ default: m.CourseViews })), { ssr: false });
const PortalViews = dynamic(() => import('@/components/alo/views/portal-views').then(m => ({ default: m.PortalViews })), { ssr: false });
const ToolViews = dynamic(() => import('@/components/alo/views/tool-views').then(m => ({ default: m.ToolViews })), { ssr: false });
const StudioViews = dynamic(() => import('@/components/alo/views/studio-views').then(m => ({ default: m.StudioViews })), { ssr: false });
const DiagramViews = dynamic(() => import('@/components/alo/views/diagram-views').then(m => ({ default: m.DiagramViews })), { ssr: false });
const CommunicationViews = dynamic(() => import('@/components/alo/views/communication-views').then(m => ({ default: m.CommunicationViews })), { ssr: false });

// Modals + Command Palette
const AuthModal = dynamic(() => import('@/components/platform/auth-modal'), { ssr: false });
const LeadModal = dynamic(() => import('@/components/platform/lead-modal'), { ssr: false });
const CommandPalette = dynamic(() => import('@/components/alo/new/platform/command-palette').then(m => ({ default: m.CommandPalette })), { ssr: false });

// ─── Types ──────────────────────────────────────────────────────────────
type PublicViewKey =
  | 'home' | 'country' | 'about' | 'contact' | 'services' | 'scholarships'
  | 'info-center' | 'blog' | 'success-stories' | 'faq'
  | 'destinations' | 'universities' | 'resources' | 'exams'
  | 'events' | 'news' | 'terms' | 'privacy' | 'cookie-policy'
  | 'journey' | 'careers' | 'partners';

type CourseViewKey = 'course-finder' | 'course-detail' | 'university-detail';
type PortalViewKey = 'student-dashboard' | 'crm-dashboard' | 'crm-kanban' | 'marketing-kit';
type ToolViewKey = 'ai-assistant' | 'visa-guide' | 'cost-planner' | 'loan-comparison' | 'cv-sop-builder';
type StudioViewKey = 'video-studio' | 'seo-dashboard' | 'omnichannel';
type DiagramViewKey = 'diagram-showcase' | 'student-journey' | 'application-flow';
type CommunicationViewKey = 'app-communication';

type PageView =
  | PublicViewKey | CourseViewKey | PortalViewKey
  | ToolViewKey | StudioViewKey | DiagramViewKey | CommunicationViewKey;

// ─── View group membership ─────────────────────────────────────────────
const PUBLIC_VIEWS = new Set<string>([
  'home', 'country', 'about', 'contact', 'services', 'scholarships',
  'info-center', 'blog', 'success-stories', 'faq',
  'destinations', 'universities', 'resources', 'exams',
  'events', 'news', 'terms', 'privacy', 'cookie-policy',
  'journey', 'careers', 'partners',
]);
const COURSE_VIEWS = new Set<string>(['course-finder', 'course-detail', 'university-detail']);
const PORTAL_VIEWS_SET = new Set<string>(['student-dashboard', 'crm-dashboard', 'crm-kanban', 'marketing-kit']);
const TOOL_VIEWS = new Set<string>(['ai-assistant', 'visa-guide', 'cost-planner', 'loan-comparison', 'cv-sop-builder']);
const STUDIO_VIEWS = new Set<string>(['video-studio', 'seo-dashboard', 'omnichannel']);
const DIAGRAM_VIEWS = new Set<string>(['diagram-showcase', 'student-journey', 'application-flow']);
const COMMUNICATION_VIEWS = new Set<string>(['app-communication']);

const NO_NAV_FOOTER = new Set<string>([
  'student-dashboard', 'crm-dashboard', 'crm-kanban', 'marketing-kit',
  'ai-assistant', 'video-studio', 'seo-dashboard', 'omnichannel',
]);

// ─── Hash routing ──────────────────────────────────────────────────────
const VIEW_FROM_HASH: Record<string, PageView> = {
  '': 'home', '0': 'home',
  'course-finder': 'course-finder', 'app-communication': 'app-communication',
  'about': 'about', 'contact': 'contact', 'services': 'services',
  'scholarships': 'scholarships', 'info-center': 'info-center',
  'blog': 'blog', 'success-stories': 'success-stories', 'faq': 'faq',
  'student-dashboard': 'student-dashboard', 'crm-dashboard': 'crm-dashboard',
  'destinations': 'destinations', 'universities': 'universities',
  'resources': 'resources', 'exams': 'exams', 'events': 'events', 'news': 'news',
  'terms': 'terms', 'privacy': 'privacy', 'cookie-policy': 'cookie-policy',
  'journey': 'journey', 'careers': 'careers', 'partners': 'partners',
  'diagram-showcase': 'diagram-showcase', 'student-journey': 'student-journey', 'application-flow': 'application-flow',
  'crm-kanban': 'crm-kanban', 'marketing-kit': 'marketing-kit',
  'ai-assistant': 'ai-assistant', 'visa-guide': 'visa-guide', 'cost-planner': 'cost-planner',
  'loan-comparison': 'loan-comparison', 'cv-sop-builder': 'cv-sop-builder',
  'video-studio': 'video-studio', 'seo-dashboard': 'seo-dashboard', 'omnichannel': 'omnichannel',
};

function parseHash(hash: string): { view: PageView; slug?: string } {
  const h = hash.replace('#', '');
  if (!h || h === '0') return { view: 'home' };
  if (h.startsWith('country/')) return { view: 'country', slug: h.replace('country/', '') };
  if (h.startsWith('course/')) return { view: 'course-detail', slug: h.replace('course/', '') };
  if (h.startsWith('university/')) return { view: 'university-detail', slug: h.replace('university/', '') };
  const mapped = VIEW_FROM_HASH[h];
  if (mapped) return { view: mapped };
  return { view: 'home' };
}

// Loading fallback for view groups
function ViewLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f5]">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-[#0066CC] border-t-transparent" />
        <span className="text-sm text-[#5A7299]">Loading...</span>
      </div>
    </div>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────
export function AppShell() {
  const [initial] = useState(() => {
    if (typeof window === 'undefined') return { view: 'home' as PageView, slug: undefined as string | undefined };
    return parseHash(window.location.hash);
  });
  const [view, setView] = useState<PageView>(initial.view);
  const [countrySlug, setCountrySlug] = useState(initial.slug || 'uk');
  const [courseSlug, setCourseSlug] = useState(initial.slug || '');
  const [universitySlug, setUniversitySlug] = useState(initial.slug || '');
  const [leadOpen, setLeadOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const navigateTo = useCallback((page: string, slug?: string) => {
    const hashMap: Record<string, string> = {
      country: `country/${slug}`, 'course-finder': 'course-finder', home: '',
      course: `course/${slug}`, university: `university/${slug}`,
      'app-communication': 'app-communication', about: 'about', contact: 'contact',
      services: 'services', scholarships: 'scholarships', 'info-center': 'info-center',
      blog: 'blog', 'success-stories': 'success-stories', faq: 'faq',
      'student-dashboard': 'student-dashboard', 'crm-dashboard': 'crm-dashboard',
      destinations: 'destinations', universities: 'universities',
      resources: 'resources', exams: 'exams', events: 'events', news: 'news',
      terms: 'terms', privacy: 'privacy', 'cookie-policy': 'cookie-policy',
      journey: 'journey', careers: 'careers', partners: 'partners',
      'diagram-showcase': 'diagram-showcase', 'student-journey': 'student-journey', 'application-flow': 'application-flow',
      'crm-kanban': 'crm-kanban', 'marketing-kit': 'marketing-kit',
      'ai-assistant': 'ai-assistant', 'visa-guide': 'visa-guide', 'cost-planner': 'cost-planner',
      'loan-comparison': 'loan-comparison', 'cv-sop-builder': 'cv-sop-builder',
      'video-studio': 'video-studio', 'seo-dashboard': 'seo-dashboard', 'omnichannel': 'omnichannel',
    };
    const hash = hashMap[page];
    if (hash === undefined) return;
    if (page === 'country' && slug) setCountrySlug(slug);
    if (page === 'course' && slug) setCourseSlug(slug);
    if (page === 'university' && slug) setUniversitySlug(slug);
    setView(page as PageView);
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setView('home'); window.location.hash = ''; window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLeadOpen = useCallback(() => setLeadOpen(true), []);
  const handleFinderOpen = useCallback(() => navigateTo('course-finder'), [navigateTo]);
  const handleLoginSuccess = useCallback((role: string) => {
    navigateTo(role === 'STUDENT' ? 'student-dashboard' : 'crm-dashboard');
  }, [navigateTo]);

  useEffect(() => {
    const handler = () => {
      const { view: v, slug } = parseHash(window.location.hash);
      if (v === 'country' && slug) setCountrySlug(slug);
      if (v === 'course-detail' && slug) setCourseSlug(slug);
      if (v === 'university-detail' && slug) setUniversitySlug(slug);
      setView(v);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const isNoNavFooter = NO_NAV_FOOTER.has(view);

  // Render the appropriate view group
  function renderView() {
    if (PUBLIC_VIEWS.has(view)) {
      return (
        <Suspense fallback={<ViewLoading />}>
          <PublicViews
            view={view as PublicViewKey}
            countrySlug={countrySlug}
            onBack={handleBack}
            onNavigate={navigateTo}
            onLeadOpen={handleLeadOpen}
            onFinderOpen={handleFinderOpen}
          />
        </Suspense>
      );
    }
    if (COURSE_VIEWS.has(view)) {
      return (
        <Suspense fallback={<ViewLoading />}>
          <CourseViews
            view={view as CourseViewKey}
            courseSlug={courseSlug}
            universitySlug={universitySlug}
            onBack={handleBack}
            onNavigate={navigateTo}
            onLeadOpen={handleLeadOpen}
          />
        </Suspense>
      );
    }
    if (PORTAL_VIEWS_SET.has(view)) {
      return (
        <Suspense fallback={<ViewLoading />}>
          <PortalViews
            view={view as PortalViewKey}
            onBack={handleBack}
            onNavigate={navigateTo}
          />
        </Suspense>
      );
    }
    if (TOOL_VIEWS.has(view)) {
      return (
        <Suspense fallback={<ViewLoading />}>
          <ToolViews
            view={view as ToolViewKey}
            onBack={handleBack}
            onNavigate={navigateTo}
            onLeadOpen={handleLeadOpen}
          />
        </Suspense>
      );
    }
    if (STUDIO_VIEWS.has(view)) {
      return (
        <Suspense fallback={<ViewLoading />}>
          <StudioViews
            view={view as StudioViewKey}
            onBack={handleBack}
            onNavigate={navigateTo}
          />
        </Suspense>
      );
    }
    if (DIAGRAM_VIEWS.has(view)) {
      return (
        <Suspense fallback={<ViewLoading />}>
          <DiagramViews
            view={view as DiagramViewKey}
            onBack={handleBack}
            onNavigate={navigateTo}
            onLeadOpen={handleLeadOpen}
          />
        </Suspense>
      );
    }
    if (COMMUNICATION_VIEWS.has(view)) {
      return (
        <Suspense fallback={<ViewLoading />}>
          <CommunicationViews
            view={view as CommunicationViewKey}
            onBack={handleBack}
          />
        </Suspense>
      );
    }
    // Fallback — home
    return (
      <Suspense fallback={<ViewLoading />}>
        <PublicViews
          view="home"
          onBack={handleBack}
          onNavigate={navigateTo}
          onLeadOpen={handleLeadOpen}
          onFinderOpen={handleFinderOpen}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isNoNavFooter && <PublicNavbar onNavigate={navigateTo} onLeadOpen={handleLeadOpen} />}

      <main className="flex-1">
        {renderView()}
      </main>

      {!isNoNavFooter && <PublicFooter onNavigate={navigateTo} onLeadOpen={handleLeadOpen} />}

      <Suspense fallback={null}>
        <LeadModal open={leadOpen} onClose={() => setLeadOpen(false)} />
      </Suspense>
      <Suspense fallback={null}>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onLoginSuccess={handleLoginSuccess} />
      </Suspense>
      <Suspense fallback={null}>
        <CommandPalette onNavigate={navigateTo} />
      </Suspense>
    </div>
  );
}
