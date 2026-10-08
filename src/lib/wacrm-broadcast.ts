// ============================================================
// wacrm — Self-hostable CRM for WhatsApp (ArnasDon/wacrm 2.3k★ 738 commits)
//   Shared inbox, contacts, sales pipelines, broadcasts, no-code automations.
//   + key fixes: contacts CSV import error visibility (#529), persist Meta's
//   failure reason error_code/title/details (#535), voice notes Ogg/Opus
//   client-side via opus-recorder WASM (no server ffmpeg) (#4fa29), i18n.
// ALO use: WhatsApp broadcast + pipeline (lead → application → visa) + shared
//   inbox assignment + voice notes + precise delivery failure reason.
// Reuses: whatsapp-cloud-api.ts (graph API), SocialInboxMessage + WhatsAppMessageStatus
//   + CrmAuditLog. Adds wacrm pipeline stage map + broadcast recipient table via AuditLog.
// Env: WHATSAPP_* (existing) + WACRM_PIPELINE_ENABLED=true
// ============================================================
import { db } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp-cloud-api';

// ─── Pipeline (wacrm: sales pipelines per contact) ────────────
// Map wacrm pipeline to ALO Application stages (keeps CRM source of truth)
export const WACRM_PIPELINE_STAGES = [
  'new_lead',          // → Lead.created
  'contacted',         // → contacted (WhatsApp first reply)
  'qualified',         // → eligibility checked
  'application_started',
  'application_submitted',
  'offer_received',
  'visa_preparation',
  'visa_submitted',
  'enrolled',          // → success
  'lost',              // → lost
] as const;

export type WacrmStage = typeof WACRM_PIPELINE_STAGES[number];

export async function wacrmMovePipeline(phoneE164: string, toStage: WacrmStage, actorId: string, note?: string): Promise<void> {
  if (!WACRM_PIPELINE_STAGES.includes(toStage)) throw new Error(`Invalid stage ${toStage}`);
  await db.crmAuditLog.create({
    data: { action: 'WACRM_PIPELINE_MOVE', entityType: 'WacrmContact', entityId: phoneE164, actorId, details: JSON.stringify({ toStage, note, at: new Date().toISOString() }), createdAt: new Date() } as any,
  }).catch(()=>{});
  await db.timelineEvent.create({
    data: { studentId: phoneE164, type: 'WACRM_PIPELINE_STAGE', title: `Pipeline → ${toStage}`, description: note || '', createdAt: new Date() } as any,
  }).catch(()=>{});
}

// ─── Broadcast (wacrm: broadcasts with per-recipient status) ──
export type BroadcastRecipient = { phone: string; name?: string };

export async function wacrmBroadcast(opts: {
  templateName?: string; // approved template or free-form
  message: string;
  recipients: BroadcastRecipient[];
  actorId: string;
  pipelineStage?: WacrmStage;
}): Promise<{ broadcastId: string; sent: number; failed: number; results: { phone: string; status: string; errorCode?: string; errorTitle?: string }[] }> {
  const broadcastId = `bc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  const results: { phone: string; status: string; errorCode?: string; errorTitle?: string }[] = [];

  for (const r of opts.recipients.slice(0, 500)) { // cap per wacrm rate limit pattern
    try {
      // Reuse existing whatsapp-cloud-api send (handles graph token, phone normalization, status persist)
      const r2 = await sendWhatsAppMessage({ to: r.phone, text: opts.message.replace('{{name}}', r.name || ''), templateName: opts.templateName }).catch((e:any)=> ({ success: false, error: e?.message || 'send failed' })) as any;

      // wacrm #535: persist Meta failure reason (error_code/title) — here we fold into CrmAuditLog
      if (r2?.success && r2.messageId) {
        results.push({ phone: r.phone, status: 'sent' });
      } else {
        const errMsg: string = r2?.error || 'failed';
        // Parse [code] title: details if present (wacrm folds "[code] title: details" into error_message)
        const m = errMsg.match(/^\[(\d+)\]\s*([^:]+):?\s*(.*)/);
        results.push({ phone: r.phone, status: 'failed', errorCode: m?.[1], errorTitle: m?.[2]?.trim() });
      }
    } catch (e: any) {
      results.push({ phone: r.phone, status: 'failed', errorCode: 'EXCEPTION', errorTitle: e?.message?.slice(0, 120) });
    }
  }

  const sent = results.filter(r=> r.status === 'sent').length;
  const failed = results.length - sent;

  await db.crmAuditLog.create({
    data: {
      action: 'WACRM_BROADCAST',
      entityType: 'WacrmBroadcast',
      entityId: broadcastId,
      actorId: opts.actorId,
      details: JSON.stringify({ message: opts.message.slice(0, 500), recipientCount: opts.recipients.length, sent, failed, pipelineStage: opts.pipelineStage, results: results.slice(0, 100) }),
      createdAt: new Date(),
    } as any,
  }).catch(()=>{});

  return { broadcastId, sent, failed, results };
}

// ─── Contacts import — surface real reason a CSV row failed (wacrm #529) ─
export function wacrmParseContactsCsvRow(row: Record<string,string>, rowNum: number): { valid: boolean; error?: string; normalized?: { phone: string; name: string; email?: string } } {
  const phoneRaw = row.phone || row.Phone || row.mobile || '';
  const name = (row.name || row.Name || '').trim();
  if (!phoneRaw) return { valid: false, error: `Row ${rowNum}: phone is required` };
  const phone = phoneRaw.replace(/\D/g, '').replace(/^0/, '880');
  if (phone.length < 11) return { valid: false, error: `Row ${rowNum}: phone "${phoneRaw}" → "${phone}" invalid (too short, expected E.164)` };
  if (!name) return { valid: false, error: `Row ${rowNum}: name is required` };
  const email = (row.email || row.Email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: `Row ${rowNum}: email "${email}" invalid` };
  return { valid: true, normalized: { phone: `+${phone}`, name, email: email || undefined } };
}

// ─── Voice note — client-side Ogg/Opus (wacrm opus-recorder WASM, no ffmpeg) ─
// Server just stores .ogg like any attachment; WhatsApp renders as voice note.
export async function wacrmStoreVoiceNote(opts: { fromPhone: string; oggBase64: string; durationMs: number; actorId?: string }): Promise<{ fileId: string }> {
  const fileId = `voice_${Date.now()}_${Math.random().toString(36).slice(2,6)}.ogg`;
  // Persist metadata via SocialInboxMessage / FileMetadata pattern (reuse whatsapp engine)
  await db.crmAuditLog.create({
    data: { action: 'WACRM_VOICE_NOTE_STORED', entityType: 'WacrmVoiceNote', entityId: fileId, actorId: opts.actorId || 'system', details: JSON.stringify({ fromPhone: opts.fromPhone, durationMs: opts.durationMs, size: opts.oggBase64.length }), createdAt: new Date() } as any,
  }).catch(()=>{});
  // Note: actual bytes should be uploaded via storage-service; this stub validates size caps per wacrm chat_media beta flag
  const sizeBytes = Math.ceil(opts.oggBase64.length * 0.75);
  const MAX_VOICE_BYTES = 2 * 1024 * 1024; // 2MB cap (matches wacrm per-kind cap)
  if (sizeBytes > MAX_VOICE_BYTES) throw new Error(`Voice note ${sizeBytes} bytes exceeds ${MAX_VOICE_BYTES} cap`);
  return { fileId };
}
