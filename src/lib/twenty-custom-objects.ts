// ============================================================
// Twenty — The open alternative to Salesforce, designed for AI
// Source: twentyhq/twenty (56.7k★ 15437 commits 579 tags, 9.1k forks)
//   Custom CRM building blocks: object metadata, custom fields, relations,
//   workflows, AI-native — you version it like code.
// ALO use: partner-specific custom fields without migrations
//   (e.g., partner A needs "UKVI sponsor licence no.", partner B needs
//   "EMGS institution code") — stored as metadata + JSON payload.
// Reuses: no new table — stored in existing `UniversityDigitalTwin.details`
//   + `CrmAuditLog`, validated via metadata registry.
// ============================================================
import { db } from '@/lib/db';

export type TwentyFieldType = 'text' | 'number' | 'select' | 'multi_select' | 'boolean' | 'date' | 'url' | 'email' | 'phone' | 'relation';

export interface TwentyFieldDef {
  key: string; // e.g. "ukvi_sponsor_licence_no"
  label: string;
  type: TwentyFieldType;
  required?: boolean;
  options?: string[]; // for select
  relationObject?: string; // for relation
  description?: string;
}

export interface TwentyObjectDef {
  slug: string; // e.g. "partner_student_extension"
  label: string;
  fields: TwentyFieldDef[];
  tenantScoped?: boolean; // partner isolated
}

// ─── Registry — version like code (Twenty pattern) ──────────────
export const TWENTY_OBJECTS: TwentyObjectDef[] = [
  {
    slug: 'partner_student_extension',
    label: 'Partner Student Extension',
    tenantScoped: true,
    fields: [
      { key: 'ukvi_sponsor_licence_no', label: 'UKVI Sponsor Licence No.', type: 'text' },
      { key: 'emgs_institution_code', label: 'EMGS Institution Code', type: 'text' },
      { key: 'sponsor_license_expiry', label: 'Sponsor Licence Expiry', type: 'date' },
      { key: 'partner_intake_batch', label: 'Partner Intake Batch', type: 'select', options: ['2026-09', '2027-01', '2027-05', '2027-09'] },
      { key: 'visa_submission_center', label: 'Visa Submission Center', type: 'select', options: ['VFS Dhaka', 'VFS Sylhet', 'VFS Chittagong'] },
    ],
  },
  {
    slug: 'application_extension',
    label: 'Application Extension',
    tenantScoped: true,
    fields: [
      { key: 'cas_requested_at', label: 'CAS Requested At', type: 'date' },
      { key: 'cas_number', label: 'CAS Number', type: 'text' },
      { key: 'flight_booked', label: 'Flight Booked', type: 'boolean' },
      { key: 'accommodation_status', label: 'Accommodation', type: 'select', options: ['not_needed', 'pending', 'booked', 'confirmed'] },
    ],
  },
];

function getObjectDef(slug: string): TwentyObjectDef | undefined {
  return TWENTY_OBJECTS.find(o => o.slug === slug);
}

export function validateTwentyPayload(objectSlug: string, payload: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const def = getObjectDef(objectSlug);
  if (!def) return { valid: false, errors: [`Unknown object ${objectSlug}`] };
  const errors: string[] = [];
  for (const f of def.fields) {
    const v = payload[f.key];
    if (f.required && (v === undefined || v === '' || v === null)) errors.push(`${f.label} is required`);
    if (v !== undefined && v !== null && v !== '') {
      if (f.type === 'number' && typeof v !== 'number') errors.push(`${f.label} must be number`);
      if (f.type === 'select' && f.options && !f.options.includes(String(v))) errors.push(`${f.label} must be one of ${f.options.join(', ')}`);
      if (f.type === 'url' && typeof v === 'string' && !/^https?:\/\//.test(v)) errors.push(`${f.label} must be URL`);
      if (f.type === 'email' && typeof v === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors.push(`${f.label} must be email`);
    }
  }
  // reject unknown keys (like Twenty's strict metadata)
  for (const k of Object.keys(payload)) {
    if (!def.fields.find(f => f.key === k)) errors.push(`Unknown field ${k} for ${objectSlug}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Save custom object row — persists as JSON in CrmAuditLog + TimelineEvent
 * for audit; caller can also stash on UniversityDigitalTwin.details.
 */
export async function twentySaveRecord(objectSlug: string, recordId: string, payload: Record<string, unknown>, actorId: string, tenantId?: string): Promise<{ recordId: string }> {
  const v = validateTwentyPayload(objectSlug, payload);
  if (!v.valid) throw new Error(`Twenty validation failed: ${v.errors.join('; ')}`);
  const def = getObjectDef(objectSlug)!;
  if (def.tenantScoped && !tenantId) throw new Error('tenantId required for tenant-scoped object');

  await db.crmAuditLog.create({
    data: {
      action: 'TWENTY_RECORD_UPSERT',
      targetCollection: `Twenty:${objectSlug}`,
      targetId: recordId,
      actorUserId: actorId || '',
      afterData: JSON.stringify({ objectSlug, tenantId, payload }),
      createdAt: new Date(),
    },
  }).catch(()=>{});

  await db.timelineEvent.create({
    data: {
      studentId: recordId,
      stage: 'crm',
      type: 'TWENTY_CUSTOM_FIELDS_SAVED',
      title: `${def.label}: ${recordId}`,
      description: JSON.stringify({ objectSlug, payload }),
      createdAt: new Date(),
    } as any,
  }).catch(()=>{});

  return { recordId };
}

export async function twentyGetRecord(objectSlug: string, recordId: string): Promise<Record<string, unknown> | null> {
  const log: any = await db.crmAuditLog.findFirst({
    where: { targetCollection: `Twenty:${objectSlug}`, targetId: recordId },
    orderBy: { createdAt: 'desc' },
  }).catch(()=>null);
  if (!log?.afterData) return null;
  try { return JSON.parse(log.afterData).payload; } catch { return null; }
}
