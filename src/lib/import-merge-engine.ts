// ALO — Merge Engine (side-by-side, field-level decisions, merge safety)
// Never overwrites immutable without explicit Super Admin approval.
// Preserves old/new/source/timestamp/actor for audit.

export type MergeFieldDecision = 'KEEP_EXISTING' | 'USE_IMPORTED' | 'MERGE' | 'SKIP';

export const IMMUTABLE_FIELDS = new Set(['studentId','verifiedIdentity','financialRecords','visaDecision','officialDocuments','passportNumber']);
export const PROTECTED_FIELDS = new Set(['studentId','passportHash','visaStatusVerified','offerStatus']);

export interface FieldComparison {
  field: string;
  existingValue: any;
  importedValue: any;
  existingSource: string;
  importedSource: string;
  lastUpdatedExisting: string;
  conflict: boolean;
  decision: MergeFieldDecision;
}

export function buildMergePreviewFields(existing: Record<string,any>, imported: Record<string,any>): FieldComparison[] {
  const allKeys = new Set([...Object.keys(existing||{}), ...Object.keys(imported||{})]);
  return Array.from(allKeys).map(field => {
    const ev = existing?.[field]; const iv = imported?.[field];
    const conflict = ev!=null && iv!=null && String(ev)!==String(iv);
    const decision: MergeFieldDecision = conflict ? 'KEEP_EXISTING' : (iv!=null ? 'USE_IMPORTED' : 'KEEP_EXISTING');
    return {
      field, existingValue: ev, importedValue: iv,
      existingSource: existing?._source || 'ALO', importedSource: imported?._source || 'OLD_CRM',
      lastUpdatedExisting: existing?._updatedAt || '', conflict, decision
    };
  });
}

export interface MergeAuditRecord {
  batchId:string; stagedId:string; matchedStudentId:string;
  actorId:string; actorRole:string;
  fieldDecisions: Array<{ field:string; decision:MergeFieldDecision; existingValue:any; importedValue:any }>;
  createdAt:string;
  sourceSystem:string; sourceRecordId:string;
}

export function validateMergeDecisions(comparisons: FieldComparison[]): { ok:boolean; errors:string[] } {
  const errors:string[]=[];
  for (const f of comparisons) {
    if (IMMUTABLE_FIELDS.has(f.field) && f.decision==='USE_IMPORTED') {
      errors.push(`Field ${f.field} is immutable — requires explicit authorized approval`);
    }
    if (PROTECTED_FIELDS.has(f.field) && f.conflict && f.decision!=='KEEP_EXISTING' && f.decision!=='SKIP') {
      errors.push(`Protected field ${f.field} must KEEP_EXISTING or SKIP without approval`);
    }
  }
  return { ok: errors.length===0, errors };
}

export function applyMerge(student: Record<string,any>, imported: Record<string,any>, decisions: Record<string,MergeFieldDecision>): Record<string,any> {
  const out = { ...student };
  for (const [field, decision] of Object.entries(decisions)) {
    if (decision==='USE_IMPORTED') out[field]=imported[field];
    else if (decision==='MERGE' && typeof imported[field]==='string' && typeof out[field]==='string') out[field]= `${out[field]}`.trim() + '\n' + `${imported[field]}`.trim();
    // KEEP_EXISTING / SKIP → no change
  }
  return out;
}
