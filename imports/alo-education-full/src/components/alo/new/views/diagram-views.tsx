'use client';

import dynamic from 'next/dynamic';

// Diagram views — heavy components, dynamic within group
const DiagramShowcase = dynamic(() => import('@/components/alo/new/pages/diagram-showcase').then(m => ({ default: m.DiagramShowcase })), { ssr: false });
const StudentJourneyPage = dynamic(() => import('@/components/alo/new/pages/student-journey-page').then(m => ({ default: m.StudentJourneyPage })), { ssr: false });

export type DiagramViewKey = 'diagram-showcase' | 'student-journey' | 'application-flow';

interface DiagramViewsProps {
  view: DiagramViewKey;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

export function DiagramViews({ view, onBack, onNavigate, onLeadOpen }: DiagramViewsProps) {
  switch (view) {
    case 'diagram-showcase':
      return <DiagramShowcase onBack={onBack} onNavigate={onNavigate} />;
    case 'student-journey':
      return <StudentJourneyPage onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'application-flow':
      return <StudentJourneyPage onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    default:
      return null;
  }
}
