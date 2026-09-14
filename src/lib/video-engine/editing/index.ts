/**
 * Editing Index - aggregates all editing tools
 * - subtitle-remover (YaoFANGUK)
 * - super-resolution (LoSealL)
 * - video-agent + videoclaw (HKUDS + HITsz)
 * - openreel (Augani)
 * - ffmpeg (0voice + dunossauro)
 */

import type { EditingRequest, EditingResponse } from "../types";
import { removeSubtitles, getSubtitleRemoverHealth } from "./subtitle-remover";
import { superResolveVideo, getSuperResolutionHealth, VSR_MODELS } from "./super-resolution";
import { analyzeVideoWithAgent, getVideoAgentHealth, analyzeCounselingSession } from "./video-agent";

export { VSR_MODELS } from "./super-resolution";
export { batchRemoveSubtitles } from "./subtitle-remover";
export { analyzeCounselingSession } from "./video-agent";

export async function editVideo(
  req: EditingRequest
): Promise<EditingResponse> {
  switch (req.operation) {
    case "remove_subtitles":
      return removeSubtitles(req);
    case "super_resolution":
      return superResolveVideo(req);
    case "analyze":
      return analyzeVideoWithAgent(req);
    case "trim":
    case "merge":
    case "brand_overlay":
    case "compress":
      // Use FFmpeg for generic operations
      return editViaFFmpeg(req);
    default:
      throw new Error(`Unknown editing operation ${req.operation}`);
  }
}

async function editViaFFmpeg(req: EditingRequest): Promise<EditingResponse> {
  const jobId = `ffmpeg-${req.operation}-${Date.now()}`;
  // Build FFmpeg command based on operation
  let command = "";
  switch (req.operation) {
    case "trim":
      const start = (req.options as any)?.startSec || 0;
      const end = (req.options as any)?.endSec || 10;
      command = `ffmpeg -i ${req.videoUrl} -ss ${start} -to ${end} -c copy /tmp/${jobId}.mp4`;
      break;
    case "merge":
      const inputs = (req.options as any)?.inputs as string[] || [req.videoUrl];
      command = `ffmpeg -f concat -i <(for f in ${inputs.join(" ")}; do echo "file '$f'"; done) -c copy /tmp/${jobId}.mp4`;
      break;
    case "brand_overlay":
      const logoUrl = (req.options as any)?.logoUrl || "/brand/alo-logo.png";
      const position = (req.options as any)?.position || "bottom-right";
      // Example: overlay logo
      const overlayFilter = position === "bottom-right" ? "overlay=W-w-10:H-h-10" : "overlay=10:10";
      command = `ffmpeg -i ${req.videoUrl} -i ${logoUrl} -filter_complex "${overlayFilter}" /tmp/${jobId}.mp4`;
      break;
    case "compress":
      command = `ffmpeg -i ${req.videoUrl} -vcodec libx264 -crf 28 /tmp/${jobId}.mp4`;
      break;
  }

  return {
    jobId,
    outputUrl: `/tmp/${jobId}.mp4`,
    operation: req.operation,
    metadata: { via: "ffmpeg", command, options: req.options },
  };
}

export async function getEditingProvidersHealth() {
  const [subtitleRemover, superRes, videoAgent] = await Promise.all([
    getSubtitleRemoverHealth(),
    getSuperResolutionHealth(),
    getVideoAgentHealth(),
  ]);
  return { subtitleRemover, superResolution: superRes, videoAgent };
}

// ─── OpenReel-inspired timeline ─────────────────────────────────────

export interface TimelineClip {
  id: string;
  type: "video" | "image" | "audio" | "text";
  url?: string;
  text?: string;
  startFrame: number;
  durationFrames: number;
  track: number;
  props?: Record<string, unknown>;
}

export interface TimelineProject {
  id: string;
  fps: number;
  width: number;
  height: number;
  clips: TimelineClip[];
}

export function timelineToRemotionComposition(timeline: TimelineProject): string {
  // Convert OpenReel-style timeline to Remotion component code
  // This is inspired by Augani/openreel-video
  let code = `
import { AbsoluteFill, Sequence, Video, Audio, Img, useCurrentFrame } from "remotion";

export const ${timeline.id}: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
`;

  for (const clip of timeline.clips) {
    code += `      <Sequence from={${clip.startFrame}} durationInFrames={${clip.durationFrames}}>\n`;
    if (clip.type === "video" && clip.url) {
      code += `        <Video src="${clip.url}" />\n`;
    } else if (clip.type === "image" && clip.url) {
      code += `        <Img src="${clip.url}" style={{ width: "100%", height: "100%", objectFit: "cover" }} />\n`;
    } else if (clip.type === "text" && clip.text) {
      code += `        <div style={{ color: "white", fontSize: 60, fontWeight: 800 }}>${clip.text}</div>\n`;
    }
    code += `      </Sequence>\n`;
  }

  code += `    </AbsoluteFill>\n  );\n};\n`;
  return code;
}
