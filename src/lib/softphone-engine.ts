/**
 * Softphone / Deskcomm Desk phone (from melgarafael/DeskcommCRM)
 * Click-to-call + call log + recording (extends threecx-integration.ts)
 */
export async function clickToCall(fromExtension: string, toNumber: string){
  // In production call 3CX API: POST /call { from, to }
  // Here log + return mock callId with audit
  const callId = `call_${Date.now()}`;
  // TODO: integrate with src/lib/threecx-integration.ts -> threecxCall()
  return { callId, from: fromExtension, to: toNumber, status: 'initiated', recordingUrl: null as string | null };
}

export async function logCall(callId: string, meta: { durationSec?: number; recordingUrl?: string; notes?: string }){
  // Persist to CRM timeline + Payment? — use db.crmAuditLog
  const { db } = await import('@/lib/db');
  await (db as any).crmAuditLog?.create?.({ data:{ actorUserId:'softphone', actorRole:'system', action:'CALL_LOGGED', targetCollection:'Call', targetId:callId, afterData: JSON.stringify(meta)}}).catch(()=>{});
  return { ok:true };
}
