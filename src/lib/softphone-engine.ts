/**
 * Softphone / Deskcomm Desk phone (from melgarafael/DeskcommCRM)
 * Click-to-call + call log + recording — delegates to the real 3CX
 * integration (src/lib/threecx-integration.ts). NEVER simulates a call:
 * when 3CX is not configured the result is explicitly NOT_CONFIGURED
 * instead of a fake "initiated" status.
 */
import { initiateClickToCall } from '@/lib/threecx-integration';

export interface SoftphoneCallResult {
  ok: boolean;
  callId: string | null;
  from: string;
  to: string;
  status: 'initiated' | 'not_configured' | 'failed';
  recordingUrl: string | null;
  error?: string;
}

export async function clickToCall(fromExtension: string, toNumber: string): Promise<SoftphoneCallResult> {
  try {
    // Real HTTP call to the configured 3CX PBX (audited inside the integration).
    const result = await initiateClickToCall(fromExtension, toNumber);
    if (!result?.success) {
      return {
        ok: false,
        callId: null,
        from: fromExtension,
        to: toNumber,
        status: 'failed',
        recordingUrl: null,
        error: result?.error || `3CX responded with HTTP ${result?.httpStatus ?? 'unknown'}`,
      };
    }
    return {
      ok: true,
      callId: result?.body?.CallId ?? result?.body?.callId ?? null,
      from: fromExtension,
      to: toNumber,
      status: 'initiated',
      recordingUrl: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Click-to-call failed';
    // No active 3CX integration is an expected, explicitly-surfaced state —
    // never a silent success.
    const notConfigured = /no active 3cx/i.test(message);
    return {
      ok: false,
      callId: null,
      from: fromExtension,
      to: toNumber,
      status: notConfigured ? 'not_configured' : 'failed',
      recordingUrl: null,
      error: message,
    };
  }
}

export async function logCall(callId: string, meta: { durationSec?: number; recordingUrl?: string; notes?: string }) {
  // Persist to CRM timeline via audit log (best-effort, non-fatal).
  const { db } = await import('@/lib/db');
  await (db as any).crmAuditLog?.create?.({
    data: {
      actorUserId: 'softphone',
      actorRole: 'system',
      action: 'CALL_LOGGED',
      targetCollection: 'Call',
      targetId: callId,
      afterData: JSON.stringify(meta),
    },
  }).catch(() => {});
  return { ok: true };
}
