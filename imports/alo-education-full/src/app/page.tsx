'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PublicNavbar } from '@/components/public/public-navbar';
import { PublicFooter } from '@/components/public/public-footer';

// Only 7 core views loaded via dynamic() - these are the most frequently accessed
const NewHomepage = dynamic(() => import('@/components/alo/new/home/homepage').then(m => ({ default: m.NewHomepage })), { ssr: false });
const CourseFinder = dynamic(() => import('@/components/alo/new/course-finder/course-finder').then(m => ({ default: m.CourseFinder })), { ssr: false });
const StudentDashboard = dynamic(() => import('@/components/platform/student-dashboard'), { ssr: false });
const CrmDashboard = dynamic(() => import('@/components/platform/crm-dashboard'), { ssr: false });

// Modals & Command Palette
const AuthModal = dynamic(() => import('@/components/platform/auth-modal'), { ssr: false });
const LeadModal = dynamic(() => import('@/components/platform/lead-modal'), { ssr: false });
const CommandPalette = dynamic(() => import('@/components/alo/new/platform/command-palette').then(m => ({ default: m.CommandPalette })), { ssr: false });

type PageView = string;

// View name to hash mapping
const VIEW_FROM_HASH: Record<string, PageView> = {
  '': 'home', '0': 'home',
  'course-finder': 'course-finder',
  'app-communication': 'app-communication', 'about': 'about', 'contact': 'contact',
  'services': 'services', 'scholarships': 'scholarships', 'info-center': 'info-center',
  'blog': 'blog', 'success-stories': 'success-stories', 'faq': 'faq',
  'student-dashboard': 'student-dashboard', 'crm-dashboard': 'crm-dashboard',
  'destinations': 'destinations', 'universities': 'universities',
  'resources': 'resources', 'exams': 'exams', 'events': 'events', 'news': 'news',
  'terms': 'terms', 'privacy': 'privacy', 'cookie-policy': 'cookie-policy',
  'journey': 'student-journey', 'careers': 'careers', 'partners': 'partners',
  'diagram-showcase': 'diagram-showcase', 'student-journey': 'student-journey',
  'application-flow': 'application-flow',
  'crm-kanban': 'crm-kanban', 'marketing-kit': 'marketing-kit',
  'ai-assistant': 'ai-assistant', 'visa-guide': 'visa-guide', 'cost-planner': 'cost-planner',
  'loan-comparison': 'loan-comparison', 'cv-sop-builder': 'cv-sop-builder',
  'uk-education-hub': 'uk-education-hub', 'ukvi-compliance': 'ukvi-compliance',
  'n8n-workflows': 'n8n-workflows', 'ai-lead-scoring': 'ai-lead-scoring',
  'video-studio': 'video-studio', 'seo-dashboard': 'seo-dashboard', 'omnichannel': 'omnichannel',
  'lead-enrichment': 'lead-enrichment',
  'sms-campaigns': 'sms-campaigns', 'email-campaigns': 'email-campaigns', 'voip-center': 'voip-center',
  'ai-command-center': 'ai-command-center',
  'seo-audit': 'seo-audit', 'knowledge-hub': 'knowledge-hub',
  'integrations': 'integrations', 'analytics-dashboard': 'analytics-dashboard',
  'api-directory': 'api-directory', 'diagram-builder': 'diagram-builder',
  'ai-education-toolkit': 'ai-education-toolkit',
};

// Hash route mapping for navigateTo
const HASH_FROM_VIEW: Record<string, string> = {
  home: '', 'course-finder': 'course-finder',
  'app-communication': 'app-communication', about: 'about', contact: 'contact',
  services: 'services', scholarships: 'scholarships', 'info-center': 'info-center',
  blog: 'blog', 'success-stories': 'success-stories', faq: 'faq',
  'student-dashboard': 'student-dashboard', 'crm-dashboard': 'crm-dashboard',
  destinations: 'destinations', universities: 'universities',
  resources: 'resources', exams: 'exams', events: 'events', news: 'news',
  terms: 'terms', privacy: 'privacy', 'cookie-policy': 'cookie-policy',
  'student-journey': 'student-journey', careers: 'careers', partners: 'partners',
  'diagram-showcase': 'diagram-showcase', 'application-flow': 'application-flow',
  'crm-kanban': 'crm-kanban', 'marketing-kit': 'marketing-kit',
  'ai-assistant': 'ai-assistant', 'visa-guide': 'visa-guide', 'cost-planner': 'cost-planner',
  'loan-comparison': 'loan-comparison', 'cv-sop-builder': 'cv-sop-builder',
  'uk-education-hub': 'uk-education-hub', 'ukvi-compliance': 'ukvi-compliance',
  'n8n-workflows': 'n8n-workflows', 'ai-lead-scoring': 'ai-lead-scoring',
  'video-studio': 'video-studio', 'seo-dashboard': 'seo-dashboard', 'omnichannel': 'omnichannel',
  'lead-enrichment': 'lead-enrichment',
  'sms-campaigns': 'sms-campaigns', 'email-campaigns': 'email-campaigns', 'voip-center': 'voip-center',
  'ai-command-center': 'ai-command-center',
  'seo-audit': 'seo-audit', 'knowledge-hub': 'knowledge-hub',
  'integrations': 'integrations', 'analytics-dashboard': 'analytics-dashboard',
  'api-directory': 'api-directory', 'diagram-builder': 'diagram-builder', 'ai-education-toolkit': 'ai-education-toolkit',
};

const PORTAL_VIEWS = new Set([
  'student-dashboard', 'crm-dashboard', 'crm-kanban', 'marketing-kit',
  'ai-assistant', 'video-studio', 'seo-dashboard', 'omnichannel',
  'uk-education-hub', 'ukvi-compliance', 'n8n-workflows', 'ai-lead-scoring',
  'lead-enrichment', 'sms-campaigns', 'email-campaigns', 'voip-center',
  'ai-command-center', 'seo-audit', 'knowledge-hub',
  'integrations', 'analytics-dashboard', 'api-directory', 'diagram-builder', 'ai-education-toolkit',
]);

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

// LazyView - uses the view registry for on-demand loading.
// page.tsx now has ZERO inline dynamic imports beyond the 7 core views above.
// The registry dynamically imports only the relevant group file, preventing OOM.
function LazyView({ view, slug, onBack, onNavigate, onLeadOpen }: {
  view: string; slug?: string;
  onBack: () => void; onNavigate: (p: string, s?: string) => void; onLeadOpen: () => void;
}) {
  const [Comp, setComp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setComp(null);
    let cancelled = false;

    const load = async () => {
      try {
        const { loadView } = await import('@/lib/view-registry');
        const result = await loadView(view);
        if (cancelled) return;
        if (result) {
          setComp(() => result.component);
        } else {
          setComp(null);
        }
      } catch {
        if (!cancelled) setComp(null);
      }
      if (!cancelled) setLoading(false);
    };
    load();

    return () => { cancelled = true; };
  }, [view]);

  if (loading && !Comp) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#0052B8] border-t-transparent rounded-full" /></div>;
  if (!Comp) return <div className="min-h-screen flex items-center justify-center p-8"><p className="text-slate-500">Page not found</p></div>;

  const props: any = { onBack, onNavigate, onLeadOpen };
  if (view === 'country') props.countrySlug = slug || 'uk';
  if (view === 'course-detail') props.courseSlug = slug;
  if (view === 'university-detail') props.universitySlug = slug;
  return <Comp {...props} />;
}

export default function Home() {
  const [initial] = useState(() => {
    if (typeof window === 'undefined') return { view: 'home' as PageView, slug: undefined as string | undefined };
    return parseHash(window.location.hash);
  });
  const [view, setView] = useState<PageView>(initial.view);
  const [viewSlug, setViewSlug] = useState(initial.slug || '');
  const [leadOpen, setLeadOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const navigateTo = useCallback((page: string, slug?: string) => {
    let hash: string | undefined;
    if (page === 'country') hash = `country/${slug}`;
    else if (page === 'course') hash = `course/${slug}`;
    else if (page === 'university') hash = `university/${slug}`;
    else hash = HASH_FROM_VIEW[page];
    if (hash === undefined) return;
    if (slug) setViewSlug(slug);
    setView(page);
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setView('home'); setViewSlug(''); window.location.hash = ''; window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLeadOpen = useCallback(() => setLeadOpen(true), []);
  const handleFinderOpen = useCallback(() => navigateTo('course-finder'), [navigateTo]);
  const handleLoginSuccess = useCallback((role: string) => {
    navigateTo(role === 'STUDENT' ? 'student-dashboard' : 'crm-dashboard');
  }, [navigateTo]);

  useEffect(() => {
    const handler = () => {
      const { view: v, slug } = parseHash(window.location.hash);
      if (slug) setViewSlug(slug);
      setView(v);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const isPortal = PORTAL_VIEWS.has(view);
  const isCoreView = view === 'home' || view === 'course-finder' || view === 'student-dashboard' || view === 'crm-dashboard';

  return (
    <div className="min-h-screen flex flex-col">
      {!isPortal && <PublicNavbar onNavigate={navigateTo} onLeadOpen={handleLeadOpen} />}

      <main className="flex-1">
        {view === 'home' && <NewHomepage onNavigate={navigateTo} onLeadOpen={handleLeadOpen} onFinderOpen={handleFinderOpen} />}
        {view === 'course-finder' && <CourseFinder onBack={handleBack} onNavigate={navigateTo} onLeadOpen={handleLeadOpen} />}
        {view === 'student-dashboard' && <StudentDashboard onBack={handleBack} onNavigate={navigateTo} />}
        {view === 'crm-dashboard' && <CrmDashboard onBack={handleBack} />}
        {!isCoreView && <LazyView view={view} slug={viewSlug} onBack={handleBack} onNavigate={navigateTo} onLeadOpen={handleLeadOpen} />}
      </main>

      {!isPortal && <PublicFooter onNavigate={navigateTo} onLeadOpen={handleLeadOpen} />}

      <LeadModal open={leadOpen} onClose={() => setLeadOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onLoginSuccess={handleLoginSuccess} />
      <CommandPalette onNavigate={navigateTo} />
    </div>
  );
}
