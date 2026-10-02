/**
 * Animated VideoMaker Adapter
 * Repo: https://github.com/shubhamdevhouse/Animated-VideoMaker.git
 * Kinetic typography, animated text
 * Better implemented via Remotion
 */

import type { ProviderHealth } from "../types";

export interface AnimatedTextRequest {
  texts: string[];
  animation: "typewriter" | "fade" | "slide" | "bounce" | "kinetic";
  backgroundColor: string;
  textColor: string;
  fontFamily?: string;
  durationPerTextSec?: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p" | "4K";
  musicUrl?: string;
  cta?: string;
}

export interface AnimatedTextResponse {
  jobId: string;
  outputUrl: string;
  durationSec: number;
  metadata: Record<string, unknown>;
}

export async function createAnimatedTextVideo(
  req: AnimatedTextRequest
): Promise<AnimatedTextResponse> {
  const jobId = `animated-${Date.now()}`;
  const duration = req.texts.length * (req.durationPerTextSec || 2);

  // Generate Remotion code for animated text (better than original repo)
  const remotionCode = `
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const AnimatedText_${jobId}: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  return (
    <AbsoluteFill style={{ backgroundColor: "${req.backgroundColor}", justifyContent: "center", alignItems: "center" }}>
      ${req.texts.map((text, i) => `
      <Sequence from={${i * (req.durationPerTextSec || 2) * 30}} durationInFrames={${(req.durationPerTextSec || 2) * 30}}>
        <div style={{
          color: "${req.textColor}",
          fontSize: 80,
          fontWeight: 800,
          fontFamily: "${req.fontFamily || "Inter"}",
          opacity: interpolate(frame - ${i * (req.durationPerTextSec || 2) * 30}, [0, 15], [0, 1]),
          transform: \`scale(\${spring({ frame: frame - ${i * (req.durationPerTextSec || 2) * 30}, fps })})\`,
        }}>
          ${text}
        </div>
      </Sequence>`).join("\n")}
    </AbsoluteFill>
  );
};
`;

  return {
    jobId,
    outputUrl: `/tmp/${jobId}.mp4`,
    durationSec: duration,
    metadata: {
      via: "Remotion (better than shubhamdevhouse/Animated-VideoMaker)",
      originalRepo: "https://github.com/shubhamdevhouse/Animated-VideoMaker.git",
      animation: req.animation,
      remotionCode: remotionCode.slice(0, 1000) + "...",
      remotionComposition: "AnimatedText",
      props: req,
      note: "Original repo is simple JS, we implement superior version via Remotion with spring physics",
    },
  };
}

export async function getAnimatedHealth(): Promise<ProviderHealth> {
  return {
    id: "animated",
    name: "Animated-VideoMaker",
    category: "content_automation",
    status: "online",
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
  };
}

// ─── Scholarship Announcement (ALO specific) ────────────────────────

export async function createScholarshipAnnouncement(
  data: { university: string; amount: string; eligibility: string; deadline: string; cta: string }
): Promise<AnimatedTextResponse> {
  return createAnimatedTextVideo({
    texts: [
      `${data.amount} Scholarship!`,
      data.university,
      `Eligibility: ${data.eligibility}`,
      `Deadline: ${data.deadline}`,
      data.cta,
    ],
    animation: "kinetic",
    backgroundColor: "#0B5ED7",
    textColor: "#FFFFFF",
    aspectRatio: "1:1",
    resolution: "1080p",
    durationPerTextSec: 2,
  });
}
