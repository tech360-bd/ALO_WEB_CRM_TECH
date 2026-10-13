/**
 * Group D: Advanced platform/CRM pages (kanban, marketing, seo, campaigns, etc.)
 * These are the heaviest pages with large dependency trees (CRM, analytics, AI).
 */

export async function loadAdvancedView(view: string): Promise<{ component: React.ComponentType<any>; needsSlug?: boolean } | null> {
  let mod: any;
  switch (view) {
    case 'crm-kanban':
      mod = await import('@/components/alo/new/pages/crm-kanban-page');
      return { component: mod.CrmKanbanPage };
    case 'marketing-kit':
      mod = await import('@/components/alo/new/pages/marketing-kit-page');
      return { component: mod.MarketingKitPage };
    case 'video-studio':
      mod = await import('@/components/alo/new/pages/video-studio-page');
      return { component: mod.VideoStudioPage };
    case 'seo-dashboard':
      mod = await import('@/components/alo/new/pages/seo-dashboard-page');
      return { component: mod.SeoDashboardPage };
    case 'omnichannel':
      mod = await import('@/components/alo/new/communication/omnichannel-center');
      return { component: mod.OmnichannelCenter };
    case 'lead-enrichment':
      mod = await import('@/components/platform/lead-enrichment-page');
      return { component: mod.LeadEnrichmentPage };
    case 'sms-campaigns':
      mod = await import('@/components/platform/sms-campaign-page');
      return { component: mod.SmsCampaignPage };
    case 'email-campaigns':
      mod = await import('@/components/platform/email-campaign-page');
      return { component: mod.EmailCampaignPage };
    case 'voip-center':
      mod = await import('@/components/platform/voip-call-center-page');
      return { component: mod.VoipCallCenterPage };
    case 'ai-command-center':
      mod = await import('@/components/platform/ai-command-center-page');
      return { component: mod.AICommandCenterPage };
    case 'seo-audit':
      mod = await import('@/components/platform/seo-audit-page');
      return { component: mod.SeoAuditPage };
    case 'knowledge-hub':
      mod = await import('@/components/platform/knowledge-hub-page');
      return { component: mod.KnowledgeHubPage };
    case 'api-directory':
      mod = await import('@/components/platform/api-directory-page');
      return { component: mod.ApiDirectoryPage };
    case 'diagram-builder':
      mod = await import('@/components/platform/diagram-builder-page');
      return { component: mod.DiagramBuilderPage };
    case 'ai-education-toolkit':
      mod = await import('@/components/platform/ai-education-toolkit-page');
      return { component: mod.AIEducationToolkitPage };
    case 'integrations':
      mod = await import('@/components/platform/integrations-page');
      return { component: mod.IntegrationsPage };
    case 'analytics-dashboard':
      mod = await import('@/components/platform/analytics-dashboard-page');
      return { component: mod.AnalyticsDashboardPage };
    // Fallback views that redirect to existing components
    case 'ukvi-compliance':
    case 'n8n-workflows':
      mod = await import('@/components/platform/crm-dashboard');
      return { component: mod.CrmDashboard };
    case 'ai-lead-scoring':
      mod = await import('@/components/platform/lead-enrichment-page');
      return { component: mod.LeadEnrichmentPage };
    default:
      return null;
  }
}
