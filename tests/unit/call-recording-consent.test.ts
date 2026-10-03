import { describe, expect, it } from "vitest";
import { validateRecordingConsent, RECORDING_RETENTION_DAYS_DEFAULT } from "@/lib/communication/call-consent";

describe("§144 — call recording consent guard", () => {
  it("passes when no recording is attached", () => {
    expect(validateRecordingConsent({ recordingPath: null })).toEqual({ ok: true });
    expect(validateRecordingConsent({ recordingPath: "" })).toEqual({ ok: true });
  });

  it("rejects a recording without recorded consent", () => {
    const c = validateRecordingConsent({ recordingPath: "recordings/x.mp3", recordingConsent: false });
    expect(c.ok).toBe(false);
    expect(c.error).toMatch(/recordingConsent=true is required/);
  });

  it("rejects a recording with consent true but blank consent text", () => {
    const c = validateRecordingConsent({ recordingPath: "r.mp3", recordingConsent: true, consentText: "  " });
    expect(c.ok).toBe(false);
    expect(c.error).toMatch(/consentText/);
  });

  it("accepts recordings with full consent evidence and emits audit marker", () => {
    const c = validateRecordingConsent({
      recordingPath: "recordings/2026/call-9.mp3",
      recordingConsent: true,
      consentText: "Caller notified recording for quality & compliance at call start.",
    });
    expect(c.ok).toBe(true);
    const marker = JSON.parse(c.noteMarker as string);
    expect(marker.type).toBe("recording-consent");
    expect(marker.consent).toBe(true);
    expect(marker.retentionDays).toBe(RECORDING_RETENTION_DAYS_DEFAULT);
    expect(marker.rbac).toMatch(/never publicly accessible/);
  });

  it("honors explicit retention days", () => {
    const c = validateRecordingConsent({
      recordingPath: "r.mp3",
      recordingConsent: true,
      consentText: "consent recorded",
      retentionDays: 30,
    });
    expect(JSON.parse(c.noteMarker as string).retentionDays).toBe(30);
  });
});
