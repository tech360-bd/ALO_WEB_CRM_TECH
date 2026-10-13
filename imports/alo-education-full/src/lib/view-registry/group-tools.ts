/**
 * Group C: Tool/utility pages (journey, visa, cost, loan, cv-sop, diagram)
 * These pages have moderate dependencies - charts, forms, wizards.
 */

export async function loadToolView(view: string): Promise<{ component: React.ComponentType<any>; needsSlug?: boolean } | null> {
  let mod: any;
  switch (view) {
    case 'student-journey':
    case 'application-flow':
      mod = await import('@/components/alo/new/pages/student-journey-page');
      return { component: mod.StudentJourneyPage };
    case 'diagram-showcase':
      mod = await import('@/components/alo/new/pages/diagram-showcase');
      return { component: mod.DiagramShowcase };
    case 'visa-guide':
      mod = await import('@/components/alo/new/pages/visa-guide-page');
      return { component: mod.VisaGuidePage };
    case 'cost-planner':
      mod = await import('@/components/alo/new/pages/cost-planner-page');
      return { component: mod.CostPlannerPage };
    case 'loan-comparison':
      mod = await import('@/components/alo/new/pages/loan-comparison-page');
      return { component: mod.LoanComparisonPage };
    case 'cv-sop-builder':
      mod = await import('@/components/alo/new/pages/cv-sop-builder-page');
      return { component: mod.CvSopBuilderPage };
    case 'ai-assistant':
      mod = await import('@/components/alo/new/ai/ai-study-assistant');
      return { component: mod.AIStudyAssistant };
    case 'uk-education-hub':
      mod = await import('@/components/alo/new/pages/country-page');
      return { component: mod.CountryPage };
    default:
      return null;
  }
}
