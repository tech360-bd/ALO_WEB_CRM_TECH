// ============================================================================
// ALO Unified Communication — call-recording consent guard (§144)
//
// Call recordings may only exist when consent requirements are satisfied, and
// every recording block carries: consent marker, retention policy reference,
// RBAC note and an audit line. This module validates the consent evidence a
// caller must attach to a call-log write when a recording reference is
// present. Storage of the canonical consent record uses the existing
// CommunicationConsent table (channel "phone"); the call-log note carries a
// machine-readable marker so audits can trace consent for every recording.
// ============================================================================

export const RECORDING_RETENTION_DAYS_DEFAULT = 90;

export interface RecordingConsentCheck {
  ok: boolean;
  error?: string;
  noteMarker?: string;
}

/**
 * Validate the consent evidence supplied with a call-log write.
 * - No recording reference → nothing to check.
 * - Recording present → recordingConsent must be true AND consentText must
 *   state what the caller was told (never blank).
 */
export function validateRecordingConsent(params: {
  recordingPath?: string | null;
  recordingConsent?: unknown;
  consentText?: string | null;
  retentionDays?: number | null;
}): RecordingConsentCheck {
  const hasRecording = typeof params.recordingPath === "string" && params.recordingPath.trim().length > 0;
  if (!hasRecording) return { ok: true };
  if (params.recordingConsent !== true) {
    return {
      ok: false,
      error:
        "recordingConsent=true is required when a call recording is attached (§144 — recordings " +
        "require consent before storage).",
    };
  }
  const consentText = String(params.consentText || "").trim();
  if (!consentText) {
    return {
      ok: false,
      error:
        "consentText describing what the caller was told is required when a call recording is attached (§144).",
    };
  }
  const retentionDays =
    typeof params.retentionDays === "number" && params.retentionDays > 0
      ? Math.floor(params.retentionDays)
      : RECORDING_RETENTION_DAYS_DEFAULT;
  return {
    ok: true,
    noteMarker: JSON.stringify({
      type: "recording-consent",
      consent: true,
      consentText,
      retentionDays,
      rbac: "role-restricted; recordings are never publicly accessible",
      recordedAt: new Date().toISOString(),
    }),
  };
}
