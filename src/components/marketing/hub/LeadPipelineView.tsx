'use client';

import CrmLeadsPage from '@/components/crm/pages/CrmLeadsPage';

/** Marketing and CRM use the same persisted records, scoped API and controls.
 * No seeded contacts, invented conversions, consent or portal-link claims.
 */
export default function LeadPipelineView() {
  return <CrmLeadsPage />;
}
