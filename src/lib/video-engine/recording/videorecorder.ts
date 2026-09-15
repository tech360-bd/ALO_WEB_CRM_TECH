/**
 * VideoRecorder Adapter
 * Repo: https://github.com/qdrzwd/VideoRecorder.git
 * Browser MediaRecorder + screen recording
 * Enhances existing src/lib/cap-recording.ts
 */

import type { RecordingRequest, RecordingResponse, ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";

export interface BrowserRecordingOptions {
  type: "screen" | "camera" | "both";
  withAudio: boolean;
  maxDurationSec: number;
  mimeType?: string;
  videoBitsPerSecond?: number;
}

// Client-side recording helper (to be used in React components)
export const BROWSER_RECORDER_CODE = `
// Browser MediaRecorder example - from qdrzwd/VideoRecorder pattern
async function startRecording(options: { type: 'screen'|'camera'|'both', withAudio: boolean }) {
  let stream: MediaStream;
  
  if (options.type === 'screen') {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: options.withAudio });
  } else if (options.type === 'camera') {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: options.withAudio });
  } else {
    const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const camera = await navigator.mediaDevices.getUserMedia({ video: true, audio: options.withAudio });
    // Combine streams
    stream = new MediaStream([...screen.getVideoTracks(), ...camera.getVideoTracks(), ...camera.getAudioTracks()]);
  }

  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  const chunks: Blob[] = [];
  
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    // Upload to /api/video-engine/recording
    const form = new FormData();
    form.append('video', blob, 'recording.webm');
    const res = await fetch('/api/video-engine/recording', { method: 'POST', body: form });
    const json = await res.json();
    console.log('Recording uploaded:', json);
  };
  
  recorder.start();
  return recorder;
}
`;

export async function startServerRecording(
  req: RecordingRequest
): Promise<RecordingResponse> {
  const jobId = `recording-${Date.now()}`;
  
  // For server-side, we can't actually record - this is for Jitsi or API-based
  // Browser recording is client-side via MediaRecorder
  
  if (req.type === "jitsi_session" && req.jitsiRoomName) {
    // Jitsi recording via Jibri
    return {
      recordingId: jobId,
      outputUrl: `https://mock.alo-education.com/recordings/${jobId}.mp4`,
      durationSec: 0,
    };
  }

  return {
    recordingId: jobId,
    outputUrl: `https://mock.alo-education.com/recordings/${jobId}.webm`,
    durationSec: req.maxDurationSec,
  };
}

export async function getVideoRecorderHealth(): Promise<ProviderHealth> {
  return {
    id: "videorecorder",
    name: "VideoRecorder (Browser)",
    category: "recording",
    status: "online", // Browser API always available
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
    vramRequiredGB: 0,
  };
}

// ─── Upload handler for browser recordings ──────────────────────────

export async function handleRecordingUpload(
  file: File | Blob,
  metadata: { counselingSessionId?: string; studentId?: string; type: string }
): Promise<RecordingResponse> {
  // In real implementation, save to storage (S3/R2/local) and create DB record
  const recordingId = `rec-${Date.now()}`;
  
  // Mock upload
  return {
    recordingId,
    outputUrl: `/uploads/recordings/${recordingId}.webm`,
    durationSec: 0, // Would parse from file
    transcriptUrl: undefined,
  };
}

// ─── ALO Counseling Recording Workflow ──────────────────────────────

export const COUNSELING_RECORDING_WORKFLOW = {
  steps: [
    "1. Counselor clicks 'Start Recording' in CRM (with student consent checkbox)",
    "2. Browser MediaRecorder captures screen + camera + audio (via qdrzwd/VideoRecorder pattern)",
    "3. On stop, upload to /api/video-engine/recording",
    "4. Trigger n8n workflow: video.recording.completed",
    "5. Auto-caption via VideoCaptioner (WEIFENG2333)",
    "6. Analyze via VideoAgent (HKUDS) for summary, chapters, action items, compliance",
    "7. Save transcript + summary to CRM student notes",
    "8. Optional: Generate personalized follow-up video via Remotion",
  ],
  consentRequired: true,
  retentionDays: 90,
  compliance: "Must have student consent, GDPR/Bangladesh DPA, no sensitive data in recording name",
};
