/**
 * Recording Index
 */

import type { RecordingRequest, RecordingResponse } from "../types";
import { startServerRecording, getVideoRecorderHealth } from "./videorecorder";
import { getJitsiHealth, generateJitsiRoomName, getJitsiMeetUrl, JITSI_IFRAME_CONFIG } from "./jitsi";

export { BROWSER_RECORDER_CODE, COUNSELING_RECORDING_WORKFLOW } from "./videorecorder";
export { generateJitsiRoomName, getJitsiMeetUrl, JITSI_IFRAME_CONFIG, generateJitsiJWT, JITSI_USE_CASES } from "./jitsi";

export async function startRecording(
  req: RecordingRequest
): Promise<RecordingResponse> {
  return startServerRecording(req);
}

export async function getRecordingProvidersHealth() {
  const [videorecorder, jitsi] = await Promise.all([
    getVideoRecorderHealth(),
    getJitsiHealth(),
  ]);
  return { videorecorder, jitsi };
}
