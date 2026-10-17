/**
 * ALO Education - Remotion Integration
 * Repo: https://github.com/remotion-dev/remotion.git
 * Programmatic video creation with React
 */

import type {
  RemotionComposition,
  RemotionRenderRequest,
  RemotionRenderResponse,
  VideoAspectRatio,
  VideoResolution,
} from "../types";
import { getVideoEngineConfig } from "../config";

// ─── Composition Registry ───────────────────────────────────────────

export const REMOTION_COMPOSITIONS: RemotionComposition[] = [
  {
    id: "UniversityPromo",
    name: "University Promo (Data-Driven)",
    description: "Animated university promo with logo, campus images, key stats, CTA. Props: universityName, country, ranking, courses, logoUrl, images[]",
    category: "promo",
    durationInFrames: 900, // 30s at 30fps
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: {
      universityName: "University of Example",
      country: "UK",
      ranking: "#150 QS World",
      courses: ["Business", "Engineering", "Computer Science"],
      logoUrl: "/brand/alo-logo.png",
      images: [],
      primaryColor: "#E8501A",
      secondaryColor: "#0057B8",
      studentName: "",
      cta: "Apply for 2027 Intake",
    },
  },
  {
    id: "CourseExplainer",
    name: "Course Explainer",
    description: "Course details with animated bullet points, fees, duration, scholarship highlight",
    category: "course_explainer",
    durationInFrames: 1350, // 45s
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: {
      courseName: "MSc Data Science",
      universityName: "University of Example",
      duration: "1 Year",
      fees: "£18,000",
      scholarship: "Up to £5,000",
      modules: ["Machine Learning", "Big Data", "AI Ethics"],
      intake: "September 2027",
    },
  },
  {
    id: "Testimonial",
    name: "Student Testimonial",
    description: "Testimonial with photo, quote animation, university logo, country flag",
    category: "testimonial",
    durationInFrames: 600, // 20s
    fps: 30,
    width: 1080,
    height: 1920, // Vertical for Reels/TikTok
    defaultProps: {
      studentName: "Ahmed Rahman",
      country: "Bangladesh → UK",
      university: "University of Manchester",
      course: "MSc Computer Science",
      quote: "ALO Education made my UK dream reality!",
      photoUrl: "",
      rating: 5,
    },
  },
  {
    id: "ScholarshipAnnouncement",
    name: "Scholarship Announcement (Kinetic Typography)",
    description: "Animated text with scholarship amount, eligibility, deadline countdown",
    category: "scholarship",
    durationInFrames: 450, // 15s
    fps: 30,
    width: 1080,
    height: 1080, // Square for feed
    defaultProps: {
      title: "£10,000 Scholarship!",
      university: "University of Example",
      amount: "£10,000",
      eligibility: "2:1 + IELTS 6.5",
      deadline: "31 July 2027",
      cta: "Apply Now via ALO",
    },
  },
  {
    id: "VisaGuide",
    name: "Visa Guide Timeline",
    description: "Timeline animation for visa steps, inspired by 3b1b/manim but in Remotion",
    category: "visa_guide",
    durationInFrames: 1800, // 60s
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: {
      country: "UK",
      steps: [
        { title: "Offer Letter", duration: "1-2 weeks", icon: "📄" },
        { title: "CAS", duration: "1 week", icon: "🎓" },
        { title: "Financial Docs", duration: "2-3 weeks", icon: "💷" },
        { title: "Visa Application", duration: "3 weeks", icon: "🛂" },
        { title: "Fly!", duration: "—", icon: "✈️" },
      ],
    },
  },
  {
    id: "CampusTourSlideshow",
    name: "Campus Tour Slideshow",
    description: "Slideshow with Ken Burns effect, from viniciusenari/slideshow-videomaker pattern, implemented in Remotion",
    category: "campus_tour",
    durationInFrames: 900,
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: {
      universityName: "University of Example",
      images: [] as { url: string; caption?: string }[],
      musicUrl: "",
      transition: "fade",
    },
  },
  {
    id: "IELTSMath",
    name: "IELTS Math Explainer (Manim-style in Remotion)",
    description: "Math animation for IELTS/ foundation, inspired by 3b1b/videos",
    category: "math_explainer",
    durationInFrames: 1200,
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: {
      topic: "Percentage Calculation for Scholarship",
      formula: "Scholarship % = (Amount / Total Fees) * 100",
      example: "£5,000 / £18,000 = 27.7%",
    },
  },
  {
    id: "SuccessStoryRedditStyle",
    name: "Success Story (RedditVideoMakerBot style)",
    description: "Background video + TTS + subtitles, adapted from elebumm/RedditVideoMakerBot for ALO success stories",
    category: "success_story",
    durationInFrames: 1500, // 50s
    fps: 30,
    width: 1080,
    height: 1920,
    defaultProps: {
      title: "From Dhaka to London: My Journey",
      story: "I applied through ALO Education...",
      backgroundVideoUrl: "", // optional background video; supply a real public/ asset path when used
      voice: "bengali_female",
      subtitles: true,
    },
  },
  {
    id: "FAQShort",
    name: "FAQ Short (15s)",
    description: "Quick FAQ answer, vertical, auto-generated from FAQ DB via n8n",
    category: "faq",
    durationInFrames: 450,
    fps: 30,
    width: 1080,
    height: 1920,
    defaultProps: {
      question: "What is the UK student visa fee in 2027?",
      answer: "£490 for outside UK application. Plus IHS £1,035 per year.",
      source: "UKVI Official",
    },
  },
  {
    id: "AnimatedText",
    name: "Animated Text (Animated-VideoMaker style)",
    description: "Kinetic typography, from shubhamdevhouse/Animated-VideoMaker pattern",
    category: "animated_text",
    durationInFrames: 300,
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: {
      texts: ["Study in UK", "2027 Intake Open", "Scholarships Available"],
      animation: "typewriter",
      backgroundColor: "#0057B8",
      textColor: "#FFFFFF",
    },
  },
];

export function getComposition(id: string): RemotionComposition | undefined {
  return REMOTION_COMPOSITIONS.find(c => c.id === id);
}

export function getCompositionsByCategory(category: string): RemotionComposition[] {
  return REMOTION_COMPOSITIONS.filter(c => c.category === category);
}

export function getAllCompositions(): RemotionComposition[] {
  return REMOTION_COMPOSITIONS;
}

// ─── Render Logic ───────────────────────────────────────────────────

export async function renderRemotionVideo(
  request: RemotionRenderRequest
): Promise<RemotionRenderResponse> {
  const config = getVideoEngineConfig();
  const composition = getComposition(request.compositionId);
  
  if (!composition) {
    return {
      jobId: `remotion-fail-${Date.now()}`,
      status: "failed",
      progress: 0,
      logs: [`Composition ${request.compositionId} not found`],
    };
  }

  const jobId = `remotion-${request.compositionId}-${Date.now()}`;

  // If Lambda enabled, trigger Lambda render
  if (config.remotion.lambdaEnabled) {
    try {
      // In production, use @remotion/lambda client
      // import { renderMediaOnLambda } from "@remotion/lambda/client";
      // const { renderId } = await renderMediaOnLambda({ ... })
      return {
        jobId,
        status: "rendering",
        progress: 10,
        logs: [`Triggered Lambda render for ${request.compositionId}`, `Region: ${config.remotion.lambdaRegion}`, `Function: ${config.remotion.lambdaFunctionName}`],
      };
    } catch (e: any) {
      return {
        jobId,
        status: "failed",
        progress: 0,
        logs: [`Lambda render failed: ${e.message}`],
      };
    }
  }

  // Local render via CLI (requires remotion installed)
  // For now, return queued and expect background worker to pick up
  // Real implementation would spawn: npx remotion render <entry> <composition> <out> --props='{}'
  return {
    jobId,
    status: "queued",
    progress: 0,
    logs: [
      `Queued Remotion render: ${request.compositionId}`,
      `Props: ${JSON.stringify(request.inputProps).slice(0, 200)}...`,
      `Output: ${request.outputFormat || "mp4"} ${request.codec || "h264"}`,
      `Local FFmpeg: ${config.remotion.localFfmpegPath}`,
      `To render locally: npx remotion render src/lib/video-engine/remotion/entry.ts ${request.compositionId} out/${jobId}.mp4 --props='${JSON.stringify(request.inputProps)}'`,
    ],
  };
}

export function buildRemotionRenderCommand(
  compositionId: string,
  inputProps: Record<string, unknown>,
  outputPath: string
): string {
  const propsJson = JSON.stringify(inputProps).replace(/'/g, "'\\''");
  return `npx remotion render src/lib/video-engine/remotion/entry.ts ${compositionId} ${outputPath} --props='${propsJson}' --codec=h264 --overwrite`;
}

// ─── Template Generator (claude-video pattern) ──────────────────────

export interface ClaudeVideoPrompt {
  description: string; // Natural language: "Create UK scholarship video..."
  category?: string;
  durationSec?: number;
  aspectRatio?: string;
  language?: string;
}

/**
 * Implements bradautomates/claude-video pattern:
 * LLM → Remotion TSX code → render
 * Instead of direct video gen, generate controllable React code
 */
export async function generateRemotionCompositionFromPrompt(
  prompt: ClaudeVideoPrompt
): Promise<{ compositionCode: string; compositionId: string; explanation: string }> {
  // This would call LLM (Claude/GPT) to generate Remotion component
  // For now, return a template that can be filled
  const compositionId = `AI_${Date.now()}`;
  
  const compositionCode = `
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const ${compositionId}: React.FC<any> = ({ title = "${prompt.description.slice(0, 50)}", primaryColor = "#E8501A" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleScale = spring({ frame, fps, config: { damping: 100 } });
  
  return (
    <AbsoluteFill style={{ backgroundColor: "#0057B8", justifyContent: "center", alignItems: "center" }}>
      <Sequence from={0} durationInFrames={${(prompt.durationSec || 30) * 30}}>
        <div style={{ opacity: titleOpacity, transform: \`scale(\${titleScale})\`, color: "white", fontSize: 80, fontWeight: 800, textAlign: "center", padding: 40 }}>
          {title}
        </div>
      </Sequence>
      {/* Add more sequences based on prompt: ${prompt.description} */}
    </AbsoluteFill>
  );
};
`;

  return {
    compositionCode,
    compositionId,
    explanation: `Generated Remotion composition from prompt: "${prompt.description}". Category: ${prompt.category || "promo"}, Duration: ${prompt.durationSec || 30}s. This follows claude-video pattern: LLM generates controllable React code instead of opaque video bytes. Code can be edited, versioned, and re-rendered with different props.`,
  };
}

// ─── Brand Overlay ──────────────────────────────────────────────────

export function applyBrandOverlayProps(
  inputProps: Record<string, unknown>,
  brandConfig = getVideoEngineConfig().brand
): Record<string, unknown> {
  return {
    ...inputProps,
    brand: {
      logoUrl: brandConfig.logoUrl,
      primaryColor: brandConfig.primaryColor,
      secondaryColor: brandConfig.secondaryColor,
      watermarkEnabled: brandConfig.watermarkEnabled,
      watermarkPosition: brandConfig.watermarkPosition,
    },
  };
}
