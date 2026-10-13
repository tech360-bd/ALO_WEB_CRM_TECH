'use client';

import dynamic from 'next/dynamic';

// AI & Student Tool views — heavy components, dynamic within group
const AIStudyAssistant = dynamic(() => import('@/components/alo/new/ai/ai-study-assistant').then(m => ({ default: m.AIStudyAssistant })), { ssr: false });
const VisaGuidePage = dynamic(() => import('@/components/alo/new/pages/visa-guide-page').then(m => ({ default: m.VisaGuidePage })), { ssr: false });
const CostPlannerPage = dynamic(() => import('@/components/alo/new/pages/cost-planner-page').then(m => ({ default: m.CostPlannerPage })), { ssr: false });
const LoanComparisonPage = dynamic(() => import('@/components/alo/new/pages/loan-comparison-page').then(m => ({ default: m.LoanComparisonPage })), { ssr: false });
const CvSopBuilderPage = dynamic(() => import('@/components/alo/new/pages/cv-sop-builder-page').then(m => ({ default: m.CvSopBuilderPage })), { ssr: false });
const UkEducationHub = dynamic(() => import('@/components/alo/new/pages/uk-education-hub').then(m => ({ default: m.UkEducationHub })), { ssr: false });
const UkviCompliancePage = dynamic(() => import('@/components/alo/new/pages/ukvi-compliance-page').then(m => ({ default: m.UkviCompliancePage })), { ssr: false });
const N8nWorkflowPage = dynamic(() => import('@/components/alo/new/pages/n8n-workflow-page').then(m => ({ default: m.N8nWorkflowPage })), { ssr: false });
const AILeadScoringPage = dynamic(() => import('@/components/alo/new/pages/ai-lead-scoring-page').then(m => ({ default: m.AILeadScoringPage })), { ssr: false });

export type ToolViewKey = 'ai-assistant' | 'visa-guide' | 'cost-planner' | 'loan-comparison' | 'cv-sop-builder' | 'uk-education-hub' | 'ukvi-compliance' | 'n8n-workflows' | 'ai-lead-scoring';

interface ToolViewsProps {
  view: ToolViewKey;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

export function ToolViews({ view, onBack, onNavigate, onLeadOpen }: ToolViewsProps) {
  switch (view) {
    case 'ai-assistant':
      return <AIStudyAssistant onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'visa-guide':
      return <VisaGuidePage onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'cost-planner':
      return <CostPlannerPage onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'loan-comparison':
      return <LoanComparisonPage onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'cv-sop-builder':
      return <CvSopBuilderPage onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'uk-education-hub':
      return <UkEducationHub onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'ukvi-compliance':
      return <UkviCompliancePage onBack={onBack} />;
    case 'n8n-workflows':
      return <N8nWorkflowPage onBack={onBack} />;
    case 'ai-lead-scoring':
      return <AILeadScoringPage onBack={onBack} />;
    default:
      return null;
  }
}
