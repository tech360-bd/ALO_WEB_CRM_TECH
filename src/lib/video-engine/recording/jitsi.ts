/**
 * Jitsi Videobridge Adapter
 * Repo: https://github.com/jitsi/jitsi-videobridge.git
 * SFU for Jitsi Meet, self-hosted Zoom alternative
 */

import type { ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";
import { checkProviderHealth } from "../ai-generation/providers";

export interface JitsiRoomConfig {
  roomName: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  isModerator?: boolean;
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
  enableRecording?: boolean;
  enableLiveStreaming?: boolean;
  enableChat?: boolean;
  enableScreenShare?: boolean;
}

export interface JitsiJWTConfig {
  appId: string;
  privateKey?: string;
  kid?: string;
  jwtSecret?: string;
  roomName: string;
  userId: string;
  userName: string;
  isModerator: boolean;
  expiresInSec: number;
}

export function generateJitsiRoomName(
  counselingSessionId?: string,
  studentId?: string,
  counselorId?: string
): string {
  const base = "ALO";
  const session = counselingSessionId ? `Session_${counselingSessionId}` : `Room_${Date.now()}`;
  const sanitized = session.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${base}_${sanitized}`;
}

export function generateJitsiJWT(config: JitsiJWTConfig): string {
  // In production, use jsonwebtoken library to sign JWT for Jitsi
  // Example payload for JaaS or self-hosted JWT auth
  const payload = {
    iss: config.appId,
    aud: "jitsi",
    exp: Math.floor(Date.now() / 1000) + config.expiresInSec,
    room: config.roomName,
    context: {
      user: {
        id: config.userId,
        name: config.userName,
        moderator: config.isModerator ? "true" : "false",
        email: "",
      },
    },
  };
  
  // Mock JWT - in real use jwt.sign(payload, secret, { algorithm: "HS256", keyid: kid })
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: config.kid })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  // Signature would be HMAC - mock
  const signature = "mock_signature_for_dev";
  return `${header}.${body}.${signature}`;
}

export function getJitsiMeetUrl(
  roomName: string,
  config: Partial<JitsiRoomConfig> = {},
  jwt?: string
): string {
  const cfg = getVideoEngineConfig();
  const domain = cfg.recording.jitsi.domain || "meet.jit.si";
  
  const params = new URLSearchParams();
  if (config.displayName) params.set("userInfo.displayName", config.displayName);
  if (config.email) params.set("userInfo.email", config.email);
  if (jwt) params.set("jwt", jwt);
  if (config.startWithAudioMuted) params.set("config.startWithAudioMuted", "true");
  if (config.startWithVideoMuted) params.set("config.startWithVideoMuted", "true");
  
  const query = params.toString() ? `?${params.toString()}` : "";
  return `https://${domain}/${roomName}${query}`;
}

// Jitsi IFrame API config (for embedding in ALO CRM)
export const JITSI_IFRAME_CONFIG = {
  // From jitsi-videobridge docs + 0voice/audio_video_streaming knowledge
  configOverwrite: {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableWelcomePage: false,
    prejoinPageEnabled: false,
    disableInviteFunctions: true,
    enableClosePage: false,
    // Recording
    hiddenDomain: "recorder.meet.jit.si",
    // From audio_video_streaming repo: WebRTC config
    p2p: { enabled: false }, // Force SFU via videobridge for recording
    // Brand
    defaultLogoUrl: "/brand/alo-logo.png",
  },
  interfaceConfigOverwrite: {
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    DEFAULT_BACKGROUND: "#2563EB",
    TOOLBAR_BUTTONS: [
      "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
      "fodeviceselection", "hangup", "profile", "chat", "recording",
      "livestreaming", "etherpad", "sharedvideo", "settings", "raisehand",
      "videoquality", "filmstrip", "invite", "feedback", "stats", "shortcuts",
      "tileview", "videobackgroundblur", "download", "help", "mute-everyone"
    ],
  },
};

export async function getJitsiHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  const h = await checkProviderHealth("jitsi", "jitsi-videobridge", `https://${config.recording.jitsi.domain}`);
  return {
    ...h,
    status: config.recording.jitsi.enabled ? h.status : "not_configured",
    vramRequiredGB: 0,
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: true },
  };
}

// ─── Jibri Recording (Jitsi recording) ──────────────────────────────

export interface JibriRecordingConfig {
  roomName: string;
  recordingId: string;
  mode: "file" | "stream";
  streamId?: string; // For live streaming to YouTube/RTMP
}

export async function startJibriRecording(
  config: JibriRecordingConfig
): Promise<{ recordingId: string; status: string }> {
  // In production, call Jibri API or Jitsi Prosody module
  // POST to /jibri/api/v1.0/startService with roomName
  return {
    recordingId: config.recordingId,
    status: "recording",
  };
}

export async function stopJibriRecording(
  recordingId: string
): Promise<{ recordingId: string; status: string; outputUrl?: string }> {
  return {
    recordingId,
    status: "stopped",
    outputUrl: `/recordings/${recordingId}.mp4`,
  };
}

// ─── ALO Use Cases ──────────────────────────────────────────────────

export const JITSI_USE_CASES = {
  counseling_1to1: {
    title: "1:1 Counseling Video Call",
    description: "Counselor + student, with recording, screen share for university presentation",
    features: ["HD video", "Screen share", "Recording via Jibri", "Chat", "Raise hand"],
    jitsiConfig: { enableRecording: true, enableScreenShare: true, enableChat: true },
  },
  group_visa_prep: {
    title: "Group Visa Interview Prep",
    description: "Up to 10 students + 1 counselor, mock visa interviews",
    features: ["Gallery view", "Recording", "Breakout rooms (via second room)"],
  },
  webinar_fair: {
    title: "University Fair Webinar",
    description: "University rep + 50+ students, live streaming to YouTube",
    features: ["Live streaming to RTMP/YouTube", "Q&A chat", "Recording", "Large room via videobridge scaling"],
  },
};
