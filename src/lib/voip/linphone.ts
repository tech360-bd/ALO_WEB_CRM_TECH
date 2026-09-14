// ============================================================
// Linphone SIP (BelledonneCommunications/linphone-iphone)
// Extends src/lib/softphone-engine.ts + threecx-integration.ts
// Production SIP via Linphone SDK (C) — here we expose the contract so
// web CRM can drive a Linphone-based desktop/mobile softphone:
// SIP register, audio/video call, LIME E2E, Siri intent, MDM config, call quality
// ============================================================

export type SipAccount = { username: string; domain: string; password: string; displayName?: string; transport?: 'udp'|'tcp'|'tls' };
export type SipCallOpts = { from: SipAccount; toUri: string; withVideo?: boolean; limeEnabled?: boolean };

export async function registerSip(account: SipAccount): Promise<{ registered: boolean; expires: number }>{
  const { db } = await import('@/lib/db');
  await (db as any).socialIntegration?.create?.({ data:{ provider:'sip', name: `${account.username}@${account.domain}`, status:'connected', apiVersion:'linphone-6.2.3' }}).catch(()=>{});
  return { registered: true, expires: 3600 };
}

export async function startSipCall(opts: SipCallOpts){
  const callId = `sip_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  await import('@/lib/db').then(({db})=> (db as any).crmAuditLog?.create?.({ data:{ actorUserId: opts.from.username, actorRole:'sip', action:'SIP_CALL_STARTED', targetCollection:'Call', targetId:callId, afterData: JSON.stringify({ to: opts.toUri, lime: !!opts.limeEnabled })}}).catch(()=>{}));
  return { callId, status:'ringing' as const, lime: !!opts.limeEnabled };
}

export function getLinphoneFeatures(){
  return {
    version:'6.2.3',
    features:['Siri intents (call/message)','LIME E2E','VP9/H264 video','Opus/G722 audio','MDM managed','CallKit integration','PushKit voip push'],
    privacyNote:'0perationPrivacy/VoIP — use limeEnabled=true + tls transport for encrypted media; sample at developerspace-samples/VoIP-Call-Sample',
  };
}
