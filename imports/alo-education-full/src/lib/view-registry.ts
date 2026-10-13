/**
 * View Registry - On-demand view loading with grouped imports.
 *
 * Architecture:
 *   page.tsx -> dynamic import -> view-registry.ts -> dynamic import -> group-*.ts
 *
 * This 3-level dynamic import chain prevents Turbopack from resolving
 * all 40+ view dependencies simultaneously, which was causing OOM
 * with the 4GB RAM limit. Each group file has ~8-18 imports, keeping
 * peak memory well under the limit.
 *
 * Groups:
 *   - group-public:   Public pages (about, contact, services, blog, etc.)
 *   - group-legal:    Legal/policy pages + detail views (terms, privacy, course-detail, etc.)
 *   - group-tools:    Tool/utility pages (journey, visa, cost-planner, cv-sop, etc.)
 *   - group-advanced: Heavy platform/CRM pages (kanban, marketing, seo, campaigns, etc.)
 */

import type { ComponentType } from 'react';

export interface ViewLoadResult {
  component: ComponentType<any>;
  needsSlug?: boolean;
}

/**
 * Map each view key to its group for O(1) lookup without loading all groups.
 */
const VIEW_GROUP: Record<string, 'public' | 'legal' | 'tools' | 'advanced'> = {
  // Public group
  about: 'public', contact: 'public', services: 'public', scholarships: 'public',
  'info-center': 'public', blog: 'public', 'success-stories': 'public', faq: 'public',
  destinations: 'public', universities: 'public', resources: 'public', exams: 'public',
  events: 'public', news: 'public', careers: 'public', partners: 'public', country: 'public',

  // Legal group
  terms: 'legal', privacy: 'legal', 'cookie-policy': 'legal',
  'course-detail': 'legal', 'university-detail': 'legal', 'app-communication': 'legal',

  // Tools group
  'student-journey': 'tools', 'application-flow': 'tools', 'diagram-showcase': 'tools',
  'visa-guide': 'tools', 'cost-planner': 'tools', 'loan-comparison': 'tools',
  'cv-sop-builder': 'tools', 'ai-assistant': 'tools', 'uk-education-hub': 'tools',

  // Advanced group
  'crm-kanban': 'advanced', 'marketing-kit': 'advanced', 'video-studio': 'advanced',
  'seo-dashboard': 'advanced', 'omnichannel': 'advanced', 'lead-enrichment': 'advanced',
  'sms-campaigns': 'advanced', 'email-campaigns': 'advanced', 'voip-center': 'advanced',
  'ai-command-center': 'advanced', 'seo-audit': 'advanced', 'knowledge-hub': 'advanced',
  'api-directory': 'advanced', 'diagram-builder': 'advanced', 'ai-education-toolkit': 'advanced',
  'integrations': 'advanced', 'analytics-dashboard': 'advanced',
  'ukvi-compliance': 'advanced', 'n8n-workflows': 'advanced', 'ai-lead-scoring': 'advanced',
};

/**
 * Group loaders - each dynamically imports its group file only when needed.
 * This is the key to preventing OOM: only one group is resolved at a time.
 */
const GROUP_LOADERS: Record<string, () => Promise<{ loadView: (view: string) => Promise<ViewLoadResult | null> }>> = {
  public: () => import('./view-registry/group-public').then(m => ({ loadView: m.loadPublicView })),
  legal: () => import('./view-registry/group-legal').then(m => ({ loadView: m.loadLegalView })),
  tools: () => import('./view-registry/group-tools').then(m => ({ loadView: m.loadToolView })),
  advanced: () => import('./view-registry/group-advanced').then(m => ({ loadView: m.loadAdvancedView })),
};

/**
 * Load a view component by key. Only the relevant group file is loaded,
 * keeping Turbopack's simultaneous dependency resolution minimal.
 */
export async function loadView(view: string): Promise<ViewLoadResult | null> {
  const group = VIEW_GROUP[view];
  if (!group) return null;

  const loader = GROUP_LOADERS[group];
  if (!loader) return null;

  const { loadView: groupLoader } = await loader();
  return groupLoader(view);
}

/**
 * Check if a view key is known to the registry.
 */
export function isKnownView(view: string): boolean {
  return view in VIEW_GROUP;
}
