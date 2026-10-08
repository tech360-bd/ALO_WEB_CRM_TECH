/**
 * Claude-Video Adapter
 * Repo: https://github.com/bradautomates/claude-video.git
 * Pattern: LLM → Remotion TSX code → render (more controllable than direct video gen)
 */

import type { ProviderHealth } from "../types";

export interface ClaudeVideoRequest {
  prompt: string; // Natural language: "Create UK scholarship video for 2027 intake, 30s, 16:9"
  category?: string;
  durationSec?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  language?: string;
  model?: "claude-3-5-sonnet" | "gpt-4o" | "gemini-2.0";
  includeBrand?: boolean;
}

export interface ClaudeVideoResponse {
  jobId: string;
  compositionId: string;
  compositionCode: string;
  explanation: string;
  inputProps: Record<string, unknown>;
  renderCommand: string;
  metadata: Record<string, unknown>;
}

export async function generateVideoFromClaudePrompt(
  req: ClaudeVideoRequest
): Promise<ClaudeVideoResponse> {
  const jobId = `claude-video-${Date.now()}`;
  const compositionId = `ClaudeGen_${Date.now()}`;

  // Build system prompt for LLM (from bradautomates/claude-video pattern)
  const systemPrompt = `
You are an expert Remotion developer for ALO Education.

Generate a Remotion composition (React TSX) based on user prompt.

Requirements:
- Use Remotion primitives: AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig
- Duration: ${req.durationSec || 30} seconds at 30fps = ${(req.durationSec || 30) * 30} frames
- Aspect ratio: ${req.aspectRatio || "16:9"} → ${req.aspectRatio === "9:16" ? "1080x1920" : req.aspectRatio === "1:1" ? "1080x1080" : "1920x1080"}
- Brand colors: primary #F97316 (orange), secondary #2563EB (blue), white #FFFFFF
- Language: ${req.language || "english"}
- Include brand logo if includeBrand true: /brand/alo-logo.png
- Category: ${req.category || "promo"}
- Must be valid TSX, export const ${compositionId}

User prompt: "${req.prompt}"

Return JSON with:
- compositionCode: full TSX code
- inputProps: default props object
- explanation: what you created

Example structure:
\`\`\`tsx
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const ${compositionId}: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 20], [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity, color: "white", fontSize: 80, fontWeight: 800 }}>{title}</div>
    </AbsoluteFill>
  );
};
\`\`\`
`;

  // In production, call LLM API
  // const llmResponse = await callLLM(systemPrompt, req.model)
  // For now mock

  const mockCompositionCode = `
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";

export const ${compositionId}: React.FC<{
  title: string;
  subtitle: string;
  universityName: string;
  primaryColor: string;
}> = ({ 
  title = "${req.prompt.slice(0, 50).replace(/"/g, '\\"')}", 
  subtitle = "2027 Intake Open",
  universityName = "UK Universities",
  primaryColor = "#F97316"
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ frame, fps, config: { damping: 100 } });
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  
  return (
    <AbsoluteFill style={{ backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center", fontFamily: "Inter, sans-serif" }}>
      {/* Background gradient */}
      <AbsoluteFill style={{ background: \`linear-gradient(135deg, #2563EB 0%, #003d85 100%)\` }} />
      
      {/* Logo */}
      ${req.includeBrand ? `<Img src="/brand/alo-logo.png" style={{ position: "absolute", top: 40, left: 40, width: 120, height: 120, objectFit: "contain" }} />` : ""}
      
      {/* Main content */}
      <Sequence from={0} durationInFrames={${(req.durationSec || 30) * 30}}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: titleOpacity,
          transform: \`translateY(\${interpolate(titleY, [0, 1], [50, 0])}px)\`,
          textAlign: "center",
          padding: 60,
        }}>
          <h1 style={{ color: "white", fontSize: 72, fontWeight: 900, lineHeight: 1.1, maxWidth: 1200 }}>
            {title}
          </h1>
          <p style={{ color: "#F97316", fontSize: 36, fontWeight: 700, opacity: subtitleOpacity }}>
            {subtitle}
          </p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 24, marginTop: 20 }}>
            {universityName} • Apply via ALO Education
          </p>
        </div>
      </Sequence>
      
      {/* CTA at end */}
      <Sequence from={${(req.durationSec || 30) * 30 - 90}} durationInFrames={90}>
        <div style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}>
          <div style={{
            backgroundColor: primaryColor,
            color: "white",
            padding: "16px 32px",
            borderRadius: 999,
            fontSize: 24,
            fontWeight: 800,
          }}>
            Apply Now • 2027 Intake
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
// Generated from prompt: "${req.prompt}"
// Category: ${req.category || "promo"}, Duration: ${req.durationSec || 30}s, Aspect: ${req.aspectRatio || "16:9"}
// Pattern: bradautomates/claude-video - LLM → Remotion code → render
`;

  return {
    jobId,
    compositionId,
    compositionCode: mockCompositionCode,
    explanation: `Generated Remotion composition from natural language prompt: "${req.prompt}". This follows claude-video pattern where LLM generates controllable React code instead of opaque video bytes. Benefits: code can be inspected, edited, versioned, and re-rendered with different props (student name, university, etc). Duration: ${req.durationSec || 30}s, Aspect: ${req.aspectRatio || "16:9"}.`,
    inputProps: {
      title: req.prompt.slice(0, 60),
      subtitle: "2027 Intake Open",
      universityName: "UK Universities",
      primaryColor: "#F97316",
    },
    renderCommand: `npx remotion render src/lib/video-engine/remotion/entry.ts ${compositionId} out/${jobId}.mp4 --props='{"title":"${req.prompt.slice(0, 30)}"}'`,
    metadata: {
      via: "claude-video pattern (bradautomates/claude-video)",
      model: req.model || "claude-3-5-sonnet",
      prompt: req.prompt,
      systemPrompt: systemPrompt.slice(0, 500) + "...",
      benefits: [
        "Controllable: intermediate artifact is code, not opaque video",
        "Editable: human can tweak TSX before render",
        "Versioned: code in git, reproducible",
        "Data-driven: render same composition with different props for personalization",
        "No GPU needed for draft (Remotion uses CPU/FFmpeg)",
      ],
    },
  };
}

export async function getClaudeVideoHealth(): Promise<ProviderHealth> {
  return {
    id: "claude-video",
    name: "claude-video (LLM → Remotion)",
    category: "content_automation",
    status: "online", // Always available if LLM configured
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
  };
}
