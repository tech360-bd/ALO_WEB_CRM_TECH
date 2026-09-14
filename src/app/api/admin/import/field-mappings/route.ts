import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// Minimal field-mapping persistence using CrmAuditLog + ImportBatch metadata for reuse per spec
// GET /api/admin/import/field-mappings → list saved templates (from audit log JSON)
// POST { name, sourceCrmName, mappings } → save template
export const GET = withAuth(async () => {
  try {
    const rows = await db.crmAuditLog.findMany({ where:{ action:'IMPORT_FIELD_MAPPING_SAVED' }, orderBy:{ createdAt:'desc' }, take:20 }).catch(()=>[]) as any[];
    const templates = rows.map(r=> { try { return JSON.parse(r.afterData||'{}'); } catch { return null; }}).filter(Boolean);
    return NextResponse.json({ success:true, templates });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
});
export const POST = withAuth(async (request: Request, auth:any) => {
  const body = await request.json().catch(()=>({}));
  if (!body.name || !body.mappings) return NextResponse.json({ success:false, error:'name and mappings required' }, { status:400 });
  try {
    await db.crmAuditLog.create({ data:{ actorUserId: auth.userId, actorRole: auth.roles.join(','), action:'IMPORT_FIELD_MAPPING_SAVED', afterData: JSON.stringify({ name: body.name, sourceCrmName: body.sourceCrmName||'Old CRM', mappings: body.mappings, at: new Date().toISOString(), by: auth.userId }) } as any });
    return NextResponse.json({ success:true });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
});
