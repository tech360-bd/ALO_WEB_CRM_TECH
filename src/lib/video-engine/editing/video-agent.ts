/**
 * VideoAgent + VideoClaw Adapter
 * Repos:
 * - https://github.com/HKUDS/VideoAgent.git - LLM agent for long video QA, chapter gen, summary
 * - https://github.com/HITsz-TMG/VideoClaw.git - Video understanding QA
 */

import type { EditingRequest, EditingResponse, ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";
import { checkProviderHealth } from "../ai-generation/providers";

export interface VideoAnalysisResult {
  summary: string;
  chapters: { startSec: number; endSec: number; title: string; summary: string }[];
  keyMoments: { timestampSec: number; description: string; importance: number }[];
  actionItems: string[];
  complianceChecks: { check: string; passed: boolean; notes: string }[];
  transcript?: string;
  qaPairs: { question: string; answer: string; timestampSec?: number }[];
}

export async function analyzeVideoWithAgent(
  req: EditingRequest
): Promise<EditingResponse & { analysis?: VideoAnalysisResult }> {
  const config = getVideoEngineConfig();
  const jobId = `video-agent-${Date.now()}`;

  if (!config.editing.videoAgent.enabled) {
    // Mock analysis for dev
    const mockAnalysis: VideoAnalysisResult = {
      summary: "Counseling session for UK MSc Data Science, 2027 intake. Student has IELTS 6.5, budget £20k, interested in scholarship.",
      chapters: [
        { startSec: 0, endSec: 120, title: "Introduction & Profile", summary: "Student intro, academic background" },
        { startSec: 120, endSec: 400, title: "Course Discussion", summary: "Discussed Data Science courses in UK" },
        { startSec: 400, endSec: 600, title: "Visa & Finance", summary: "Financial docs, visa requirements explained" },
      ],
      keyMoments: [
        { timestampSec: 150, description: "Student mentions scholarship need", importance: 0.9 },
        { timestampSec: 350, description: "Counselor recommends 3 universities", importance: 0.85 },
      ],
      actionItems: [
        "Send university list to student via WhatsApp",
        "Schedule follow-up for financial docs review",
        "Create personalized video for recommended universities",
      ],
      complianceChecks: [
        { check: "Mentioned visa requirements", passed: true, notes: "Explained UKVI financial requirement" },
        { check: "No false promises", passed: true, notes: "No guaranteed visa claims" },
        { check: "Data privacy", passed: true, notes: "No sensitive data exposed" },
      ],
      qaPairs: [
        { question: "What courses were recommended?", answer: "MSc Data Science at Manchester, Leeds, Birmingham", timestampSec: 350 },
        { question: "What is student's budget?", answer: "£20k including living", timestampSec: 200 },
      ],
    };

    return {
      jobId,
      outputUrl: req.videoUrl,
      operation: "analyze",
      metadata: { note: "Mock analysis - set VIDEO_AGENT_ENABLED=true and VIDEO_AGENT_API_URL", provider: "VideoAgent (HKUDS) + VideoClaw (HITsz)" },
      analysis: mockAnalysis,
    };
  }

  // Real API call
  try {
    const res = await fetch(`${config.editing.videoAgent.apiUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: req.videoUrl,
        prompt: req.prompt || "Summarize counseling session, extract chapters, action items, compliance checks",
      }),
    });
    if (!res.ok) throw new Error(`VideoAgent API ${res.status}`);
    const json = await res.json();
    return {
      jobId: json.job_id || jobId,
      outputUrl: req.videoUrl,
      operation: "analyze",
      metadata: { via: "api", response: json },
      analysis: json.analysis as VideoAnalysisResult,
    };
  } catch (e: any) {
    return {
      jobId,
      outputUrl: req.videoUrl,
      operation: "analyze",
      metadata: { error: e.message },
    };
  }
}

export async function getVideoAgentHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  const h = await checkProviderHealth("video-agent", "VideoAgent + VideoClaw", config.editing.videoAgent.apiUrl);
  return {
    ...h,
    status: config.editing.videoAgent.enabled ? h.status : "not_configured",
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: true, streaming: false },
  };
}

// ─── Counseling Session Analyzer (ALO specific) ─────────────────────

export async function analyzeCounselingSession(
  videoUrl: string,
  studentId?: string,
  counselingSessionId?: string
): Promise<VideoAnalysisResult> {
  const result = await analyzeVideoWithAgent({
    operation: "analyze",
    videoUrl,
    prompt: `
Analyze this counseling session video for ALO Education:

1. Summary: 2-3 sentence summary
2. Chapters: Split into logical chapters with timestamps
3. Key Moments: Important timestamps (scholarship mention, university recommendation, etc)
4. Action Items: What counselor should do next
5. Compliance: Check if counselor mentioned visa requirements, didn't make false promises, respected data privacy
6. QA: Extract Q&A pairs

StudentId: ${studentId || "unknown"}
SessionId: ${counselingSessionId || "unknown"}

Return JSON with structure: { summary, chapters, keyMoments, actionItems, complianceChecks, qaPairs }
`,
  });

  return result.analysis || {
    summary: "Analysis failed",
    chapters: [],
    keyMoments: [],
    actionItems: [],
    complianceChecks: [],
    qaPairs: [],
  };
}
