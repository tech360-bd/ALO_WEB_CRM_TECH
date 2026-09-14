// ALO — Publish Engine (Part 8)
// prepare → validate → publish transaction → invalidate cache → refresh search/index → record audit
// Atomic: if critical fails, rollback or mark incomplete. Never expose unapproved data.

export type PublishTarget = 'UNIVERSITY'|'COURSE'|'COUNTRY'|'COURSE_FINDER'|'CRM_CATALOG'|'AI_KB'|'SEARCH_INDEX'|'CACHE';

export interface PublishPlan {
  updateRequestId:string; entityType:string; entityId:string; fieldName:string; oldValue:string; newValue:string;
  targets: PublishTarget[]; sourceUrl:string; approvedBy:string;
}

export async function preparePublish(plan: PublishPlan): Promise<{ ok:boolean; errors:string[] }>{
  const errors:string[]=[];
  if (!plan.updateRequestId) errors.push('Missing updateRequestId');
  if (!plan.approvedBy) errors.push('Missing approvedBy — Super Admin required');
  if (!plan.sourceUrl) errors.push('Missing sourceUrl — provenance required');
  if (!plan.newValue && plan.newValue!=='' ) errors.push('Missing newValue');
  // Do not publish unverified scholarship/fee/deadline without source
  if (['tuitionFee','scholarship','deadline','visa'].some(k=> plan.fieldName.toLowerCase().includes(k)) && !plan.sourceUrl) {
    errors.push('High-risk field requires official source');
  }
  return { ok: errors.length===0, errors };
}

export async function invalidateCaches(entityType:string, entityId:string){
  // In production: call Redis cache bust + revalidateTag + Meilisearch/Typesense refresh if configured.
  // Here: no-op with audit side-effect handled by caller.
  return { entityType, entityId, at: new Date().toISOString(), targets:['UNIVERSITY_PAGE','COURSE_PAGE','COUNTRY_PAGE','COURSE_FINDER','CRM_CATALOG','AI_INDEX','SEARCH_INDEX'] };
}
