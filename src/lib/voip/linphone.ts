/** Linphone is a native SIP SDK, not a browser HTTP API.
 * ALO has no installed native bridge. Never synthesize registrations, call IDs,
 * ringing states or encryption guarantees. Web click-to-call uses the separate
 * authenticated 3CX integration, not this native capability boundary.
 */
export type SipAccount = { username: string; domain: string; password: string; displayName?: string; transport?: 'udp' | 'tcp' | 'tls' };
export type SipCallOpts = { from: SipAccount; toUri: string; withVideo?: boolean; limeEnabled?: boolean };
const reason = 'Linphone native bridge is not installed. Configure and verify a native SIP client before calling.';

export async function registerSip(_account: SipAccount) {
  return { registered: false, expires: 0, status: 'not_configured' as const, error: reason };
}
export async function startSipCall(_opts: SipCallOpts) {
  return { callId: null, status: 'not_configured' as const, lime: false, error: reason };
}
export function getLinphoneFeatures() {
  return {
    available: false, version: null, features: [],
    status: 'not_configured' as const,
    privacyNote: 'TLS signaling alone does not guarantee encrypted media. Native SDK, media encryption, device permissions and provider interoperability require separate verification.',
  };
}
