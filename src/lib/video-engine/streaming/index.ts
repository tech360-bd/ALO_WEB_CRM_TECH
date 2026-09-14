/**
 * Streaming Adapter
 * Repos:
 * - https://github.com/0voice/audio_video_streaming.git (10k+ lines AV learning)
 * - https://github.com/leandromoreira/digital_video_introduction.git (book)
 * - https://github.com/jitsi/jitsi-videobridge.git (SFU, also in recording)
 * 
 * Covers: RTMP, HLS, WebRTC, FFmpeg, codecs, containers
 */

import type { ProviderHealth } from "../types";

export interface StreamingConfig {
  rtmp: { enabled: boolean; url?: string; app?: string };
  hls: { enabled: boolean; outputPath?: string; segmentDurationSec?: number };
  webrtc: { enabled: boolean; stunServers?: string[]; turnServers?: { url: string; username: string; credential: string }[] };
  dash: { enabled: boolean };
}

export function getStreamingConfig(): StreamingConfig {
  return {
    rtmp: {
      enabled: process.env.RTMP_ENABLED === "true" || false,
      url: process.env.RTMP_URL || "rtmp://localhost/live",
      app: process.env.RTMP_APP || "alo",
    },
    hls: {
      enabled: process.env.HLS_ENABLED === "true" || true,
      outputPath: process.env.HLS_OUTPUT_PATH || "/tmp/hls",
      segmentDurationSec: parseInt(process.env.HLS_SEGMENT_DURATION || "6"),
    },
    webrtc: {
      enabled: process.env.WEBRTC_ENABLED === "true" || true,
      stunServers: (process.env.STUN_SERVERS || "stun:stun.l.google.com:19302").split(","),
      turnServers: process.env.TURN_URL ? [{ url: process.env.TURN_URL, username: process.env.TURN_USERNAME || "", credential: process.env.TURN_CREDENTIAL || "" }] : [],
    },
    dash: {
      enabled: process.env.DASH_ENABLED === "true" || false,
    },
  };
}

// ─── HLS Generation (from 0voice/audio_video_streaming knowledge) ───

export function buildHLSCommand(
  inputPath: string,
  outputPath: string,
  segmentDurationSec = 6
): string {
  // From digital_video_introduction book + audio_video_streaming repo
  // HLS: HTTP Live Streaming, Apple, uses .m3u8 playlist + .ts segments
  return `ffmpeg -i ${inputPath} -codec:v libx264 -codec:a aac -hls_time ${segmentDurationSec} -hls_playlist_type vod -hls_segment_filename ${outputPath}/segment_%03d.ts ${outputPath}/playlist.m3u8`;
}

export function buildRTMPCommand(
  inputPath: string,
  rtmpUrl: string
): string {
  // RTMP: Real-Time Messaging Protocol, for live streaming to YouTube, etc
  return `ffmpeg -re -i ${inputPath} -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv ${rtmpUrl}`;
}

export function buildWebRTCConfig(): RTCConfiguration {
  const cfg = getStreamingConfig();
  return {
    iceServers: [
      ...(cfg.webrtc.stunServers || []).map(url => ({ urls: url })),
      ...(cfg.webrtc.turnServers || []).map(s => ({ urls: s.url, username: s.username, credential: s.credential })),
    ],
  };
}

// ─── Transcoding Ladder (for adaptive streaming) ────────────────────

export const TRANSCODE_LADDER = [
  { name: "1080p", width: 1920, height: 1080, bitrate: "5000k", audioBitrate: "128k" },
  { name: "720p", width: 1280, height: 720, bitrate: "3000k", audioBitrate: "128k" },
  { name: "480p", width: 854, height: 480, bitrate: "1500k", audioBitrate: "96k" },
  { name: "360p", width: 640, height: 360, bitrate: "800k", audioBitrate: "96k" },
];

export function buildAdaptiveHLSCommand(
  inputPath: string,
  outputPath: string
): string {
  // Create multi-bitrate HLS (from audio_video_streaming repo examples)
  const variants = TRANSCODE_LADDER.map(ladder => 
    `-map v:0 -map a:0 -c:v:${TRANSCODE_LADDER.indexOf(ladder)} libx264 -b:v:${TRANSCODE_LADDER.indexOf(ladder)} ${ladder.bitrate} -c:a:${TRANSCODE_LADDER.indexOf(ladder)} aac -b:a:${TRANSCODE_LADDER.indexOf(ladder)} ${ladder.audioBitrate} -vf:${TRANSCODE_LADDER.indexOf(ladder)} scale=${ladder.width}:${ladder.height}`
  ).join(" ");

  return `ffmpeg -i ${inputPath} ${variants} -var_stream_map "${TRANSCODE_LADDER.map((_, i) => `v:${i},a:${i}`).join(" ")}" -master_pl_name master.m3u8 -hls_time 6 -hls_list_size 0 ${outputPath}/%v/playlist.m3u8`;
}

// ─── Health ─────────────────────────────────────────────────────────

export async function getStreamingHealth(): Promise<ProviderHealth> {
  return {
    id: "ffmpeg",
    name: "AV Streaming (0voice + digital_video_introduction)",
    category: "streaming",
    status: "online",
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: true },
  };
}

// ─── Educational Content (from digital_video_introduction book) ─────

export const VIDEO_FUNDAMENTALS = {
  codecs: {
    h264: "Most compatible, good compression, widely supported",
    h265: "Better compression than H264, less compatible, needs more CPU",
    vp9: "Google, good for web, YouTube uses",
    av1: "Next-gen, best compression, slow encode",
  },
  containers: {
    mp4: "Most common, H264+AAC, for VOD",
    webm: "VP8/VP9+Vorbis/Opus, for web",
    mkv: "Flexible, many codecs, not for streaming",
    ts: "MPEG-TS, for HLS segments",
  },
  protocols: {
    hls: "HTTP Live Streaming, Apple, .m3u8 + .ts, adaptive, 6-10s latency",
    dash: "MPEG-DASH, standard, .mpd + segments, adaptive",
    rtmp: "Real-Time Messaging Protocol, for ingest to YouTube/Twitch, low latency",
    webrtc: "Real-time, P2P or SFU, <500ms latency, for video calls",
    srt: "Secure Reliable Transport, for contribution, loss recovery",
  },
  concepts: {
    gop: "Group of Pictures: I-frame (key) + P/B frames, affects seeking",
    bitrate: "Bits per second, higher = better quality but more bandwidth",
    crf: "Constant Rate Factor: quality-based encoding, 18-28 typical",
    keyframe: "I-frame, full image, needed for seeking, every 2-10s",
  },
};

export const STREAMING_USE_CASES_ALO = {
  course_content_hls: "Store course videos as HLS adaptive (1080p/720p/480p) for student portal",
  counseling_webrtc: "1:1 counseling via WebRTC (Jitsi Videobridge SFU)",
  webinar_rtmp: "University fair webinar RTMP to YouTube Live",
  recording_hls: "Counseling recordings stored as HLS for efficient playback",
};
