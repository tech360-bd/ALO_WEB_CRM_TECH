'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

// View group mapping - each key maps to a function that dynamically imports the view group
// Using raw import() inside functions so Turbopack does NOT pre-compile these chunks
// They are only compiled when the user actually navigates to that view
const VIEW_LOADERS: Record<string, () => Promise<any>> = {
  public: () => import('@/components/alo/views/public-views'),
  course: () => import('@/components/alo/views/course-views'),
  portal: () => import('@/components/alo/views/portal-views'),
  tool: () => import('@/components/alo/views/tool-views'),
  studio: () => import('@/components/alo/views/studio-views'),
  diagram: () => import('@/components/alo/views/diagram-views'),
  communication: () => import('@/components/alo/views/communication-views'),
};

const VIEW_GROUP: Record<string, string> = {
  home: 'public', country: 'public', about: 'public', contact: 'public',
  services: 'public', scholarships: 'public', 'info-center': 'public',
  blog: 'public', 'success-stories': 'public', faq: 'public',
  destinations: 'public', universities: 'public', resources: 'public', exams: 'public',
  events: 'public', news: 'public', terms: 'public', privacy: 'public',
  'cookie-policy': 'public', journey: 'public', careers: 'public', partners: 'public',
  'course-finder': 'course', 'course-detail': 'course', 'university-detail': 'course',
  'student-dashboard': 'portal', 'crm-dashboard': 'portal', 'crm-kanban': 'portal', 'marketing-kit': 'portal',
  'ai-assistant': 'tool', 'visa-guide': 'tool', 'cost-planner': 'tool', 'loan-comparison': 'tool', 'cv-sop-builder': 'tool',
  'uk-education-hub': 'tool', 'ukvi-compliance': 'tool', 'n8n-workflows': 'tool', 'ai-lead-scoring': 'tool',
  'video-studio': 'studio', 'seo-dashboard': 'studio', 'omnichannel': 'studio',
  'diagram-showcase': 'diagram', 'student-journey': 'diagram', 'application-flow': 'diagram',
  'app-communication': 'communication',
};

interface ViewRouterProps {
  view: string;
  slug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// Cache loaded modules to avoid re-fetching
const moduleCache: Record<string, any> = {};

export function ViewRouter({ view, slug, onBack, onNavigate, onLeadOpen }: ViewRouterProps) {
  const [ViewComponent, setViewComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentView = useRef(view);

  useEffect(() => {
    currentView.current = view;
    setLoading(true);
    setError(null);

    const group = VIEW_GROUP[view] || 'public';
    const loader = VIEW_LOADERS[group];

    // Check cache first
    if (moduleCache[group]) {
      setViewComponent(() => createRenderer(moduleCache[group], view));
      setLoading(false);
      return;
    }

    // Dynamic import - this happens ONLY when the user navigates to this view
    loader()
      .then(mod => {
        if (currentView.current !== view) return; // Stale navigation
        moduleCache[group] = mod;
        setViewComponent(() => createRenderer(mod, view));
        setLoading(false);
      })
      .catch(err => {
        console.error(`Failed to load view group "${group}":`, err);
        setError(`Failed to load. Please try again.`);
        setLoading(false);
      });
  }, [view]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f5] p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#0066CC] text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading || !ViewComponent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#0066CC] border-t-transparent" />
          <span className="text-sm text-[#5A7299]">Loading view...</span>
        </div>
      </div>
    );
  }

  return <ViewComponent />;
}

// Create a renderer component for the loaded module
function createRenderer(mod: any, view: string) {
  return function LoadedView() {
    const pp = { onBack: () => {}, onNavigate: (p: string, s?: string) => {}, onLeadOpen: () => {}, onFinderOpen: () => {} };

    // Determine which component to render based on the module exports and view key
    if (mod.PublicViews) {
      return <mod.PublicViews view={view} countrySlug={view === 'country' ? '' : 'uk'} {...pp} />;
    }
    if (mod.CourseViews) {
      return <mod.CourseViews view={view} courseSlug="" universitySlug="" {...pp} />;
    }
    if (mod.PortalViews) {
      return <mod.PortalViews view={view} {...pp} />;
    }
    if (mod.ToolViews) {
      return <mod.ToolViews view={view} {...pp} />;
    }
    if (mod.StudioViews) {
      return <mod.StudioViews view={view} onBack={() => {}} onNavigate={(p: string) => {}} />;
    }
    if (mod.DiagramViews) {
      return <mod.DiagramViews view={view} {...pp} />;
    }
    if (mod.CommunicationViews) {
      return <mod.CommunicationViews view={view} onBack={() => {}} />;
    }

    return <div>Unknown view: {view}</div>;
  };
}
