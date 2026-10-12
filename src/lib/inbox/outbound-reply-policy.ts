/**
 * These legacy/UCC reply entry points cannot yet establish provider-verified
 * recipient provenance, consent/opt-out state and the current service window.
 * Credentials or an environment toggle must not silently authorize sending.
 * Keep external replies fail-closed until a verified policy replaces this gate.
 * Internal notes are not provider sends and do not use this gate.
 */
export function outboundReplyPolicyBlock() {
  return {
    success: false as const,
    code: 'OUTBOUND_REPLY_POLICY_UNVERIFIED',
    error: 'External replies are disabled until recipient verification, consent and provider messaging-window policy are implemented and verified. No message was sent.',
  };
}
