'use client';

import dynamic from 'next/dynamic';

// Portal views are heavy — use dynamic imports within the group
const StudentDashboard = dynamic(() => import('@/components/platform/student-dashboard'), { ssr: false });
const CrmDashboard = dynamic(() => import('@/components/platform/crm-dashboard'), { ssr: false });
const CrmKanbanPage = dynamic(() => import('@/components/alo/new/pages/crm-kanban-page').then(m => ({ default: m.CrmKanbanPage })), { ssr: false });
const MarketingKitPage = dynamic(() => import('@/components/alo/new/pages/marketing-kit-page').then(m => ({ default: m.MarketingKitPage })), { ssr: false });

export type PortalViewKey = 'student-dashboard' | 'crm-dashboard' | 'crm-kanban' | 'marketing-kit';

interface PortalViewsProps {
  view: PortalViewKey;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
}

export function PortalViews({ view, onBack, onNavigate }: PortalViewsProps) {
  switch (view) {
    case 'student-dashboard':
      return <StudentDashboard onBack={onBack} onNavigate={onNavigate} />;
    case 'crm-dashboard':
      return <CrmDashboard onBack={onBack} />;
    case 'crm-kanban':
      return <CrmKanbanPage onBack={onBack} />;
    case 'marketing-kit':
      return <MarketingKitPage onBack={onBack} />;
    default:
      return null;
  }
}
