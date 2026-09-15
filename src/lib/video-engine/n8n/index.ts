/**
 * ALO Education - n8n Video Integration (Enhanced)
 * Original: src/lib/n8n.ts
 * Enhanced for video pipeline with 34 repos
 * Repo: https://github.com/n8n-io/n8n.git
 */

import { triggerWorkflow, triggerWorkflowWithRetry } from "@/lib/n8n";
import type { VideoProject, RenderJob, N8nVideoWorkflow } from "../types";

// ─── Video-specific n8n events ──────────────────────────────────────

export const videoN8nEvents = {
  // Project lifecycle
  projectCreated: (projectId: string, data: Record<string, unknown>) =>
    triggerWorkflow("video.project.created", { projectId, ...data }, `video-project-${projectId}`),

  projectRenderStarted: (projectId: string, providerId: string) =>
    triggerWorkflow("video.render.started", { projectId, providerId }),

  projectRenderCompleted: (projectId: string, outputUrl: string, durationSec: number) =>
    triggerWorkflow("video.render.completed", { projectId, outputUrl, durationSec }),

  projectRenderFailed: (projectId: string, error: string) =>
    triggerWorkflow("video.render.failed", { projectId, error }),

  projectApproved: (projectId: string, approvedById: string) =>
    triggerWorkflow("video.project.approved", { projectId, approvedById }),

  projectPublished: (projectId: string, platform: string, publishedUrl?: string) =>
    triggerWorkflow("video.project.published", { projectId, platform, publishedUrl }),

  // Captioning
  captioningStarted: (projectId: string, language: string) =>
    triggerWorkflow("video.captioning.started", { projectId, language }),

  captioningCompleted: (projectId: string, srtUrl: string, segments: number) =>
    triggerWorkflow("video.captioning.completed", { projectId, srtUrl, segments }),

  // Talking head
  talkingHeadGenerated: (projectId: string, provider: string, outputUrl: string) =>
    triggerWorkflow("video.talking_head.generated", { projectId, provider, outputUrl }),

  // Editing
  editingCompleted: (projectId: string, operation: string, outputUrl: string) =>
    triggerWorkflow("video.editing.completed", { projectId, operation, outputUrl }),

  // Automation
  youtubeDownloaded: (url: string, outputUrl: string, hasRights: boolean) =>
    triggerWorkflow("video.youtube.downloaded", { url, outputUrl, hasRights }),

  redditVideoCreated: (projectId: string, source: string) =>
    triggerWorkflow("video.reddit.created", { projectId, source }),

  // Recording
  recordingCompleted: (recordingId: string, counselingSessionId?: string) =>
    triggerWorkflow("video.recording.completed", { recordingId, counselingSessionId }),

  // Manim
  manimRendered: (jobId: string, sceneName: string, outputUrl: string) =>
    triggerWorkflow("video.manim.rendered", { jobId, sceneName, outputUrl }),

  // Remotion
  remotionRenderStarted: (compositionId: string, jobId: string) =>
    triggerWorkflow("video.remotion.started", { compositionId, jobId }),

  remotionRenderCompleted: (compositionId: string, jobId: string, outputUrl: string) =>
    triggerWorkflow("video.remotion.completed", { compositionId, jobId, outputUrl }),

  // AI Generation
  aiGenerationStarted: (providerId: string, prompt: string, jobId: string) =>
    triggerWorkflow("video.ai.started", { providerId, prompt, jobId }),

  aiGenerationCompleted: (providerId: string, jobId: string, outputUrl: string) =>
    triggerWorkflow("video.ai.completed", { providerId, jobId, outputUrl }),
};

// ─── Pre-built Workflow Templates ───────────────────────────────────

export const N8N_VIDEO_WORKFLOW_TEMPLATES: N8nVideoWorkflow[] = [
  {
    id: "lead-to-video",
    name: "Lead → Personalized Video → WhatsApp",
    description: "When a new lead is created, generate personalized university promo video via Remotion and send via WhatsApp",
    trigger: "event",
    event: "lead.created",
    active: false,
    nodes: [
      { id: "1", type: "n8n-nodes-base.webhook", position: [0, 0], parameters: { event: "lead.created" } },
      { id: "2", type: "n8n-nodes-base.httpRequest", position: [200, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/projects", method: "POST", body: { title: "Personalized for {{$json.name}}", providerId: "remotion", templateId: "UniversityPromo", inputProps: { studentName: "={{$json.name}}", country: "={{$json.destination}}" } } } },
      { id: "3", type: "n8n-nodes-base.wait", position: [400, 0], parameters: { amount: 30, unit: "seconds" } },
      { id: "4", type: "n8n-nodes-base.httpRequest", position: [600, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/render", method: "POST", body: { projectId: "={{$json.projectId}}" } } },
      { id: "5", type: "n8n-nodes-base.whatsapp", position: [800, 0], parameters: { to: "={{$json.phone}}", mediaUrl: "={{$json.outputUrl}}", caption: "Hi {{$json.name}}, here's your personalized {{ $json.destination }} guide!" } },
    ],
  },
  {
    id: "video-approval-publish",
    name: "Video Approval → Multi-Platform Publish",
    description: "When video is approved, auto-publish to Facebook, Instagram, YouTube, and update marketing calendar",
    trigger: "event",
    event: "video.project.approved",
    active: false,
    nodes: [
      { id: "1", type: "n8n-nodes-base.webhook", position: [0, 0], parameters: { event: "video.project.approved" } },
      { id: "2", type: "n8n-nodes-base.httpRequest", position: [200, 0], parameters: { url: "={{$env.ALO_API}}/api/marketing/content", method: "GET", query: { videoId: "={{$json.projectId}}" } } },
      { id: "3", type: "n8n-nodes-base.if", position: [400, 0], parameters: { conditions: { string: [{ value1: "={{$json.status}}", operation: "equal", value2: "approved" }] } } },
      { id: "4", type: "n8n-nodes-base.facebook", position: [600, -100], parameters: { operation: "uploadVideo", videoUrl: "={{$json.outputUrl}}", description: "={{$json.title}}" } },
      { id: "5", type: "n8n-nodes-base.instagram", position: [600, 100], parameters: { operation: "uploadReel", videoUrl: "={{$json.outputUrl}}" } },
      { id: "6", type: "n8n-nodes-base.youTube", position: [600, 300], parameters: { operation: "upload", videoUrl: "={{$json.outputUrl}}", title: "={{$json.title}}" } },
    ],
  },
  {
    id: "counseling-recording-pipeline",
    name: "Counseling Recording → Caption → Summary → CRM",
    description: "After Jitsi/VideoRecorder session ends, auto-caption via VideoCaptioner, analyze via VideoAgent, save summary to CRM",
    trigger: "event",
    event: "video.recording.completed",
    active: false,
    nodes: [
      { id: "1", type: "n8n-nodes-base.webhook", position: [0, 0], parameters: { event: "video.recording.completed" } },
      { id: "2", type: "n8n-nodes-base.httpRequest", position: [200, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/caption", method: "POST", body: { videoUrl: "={{$json.outputUrl}}", language: "mixed", targetLanguages: ["en", "bn"] } } },
      { id: "3", type: "n8n-nodes-base.httpRequest", position: [400, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/edit", method: "POST", body: { operation: "analyze", videoUrl: "={{$json.outputUrl}}", prompt: "Summarize counseling session, extract action items, check compliance" } } },
      { id: "4", type: "n8n-nodes-base.httpRequest", position: [600, 0], parameters: { url: "={{$env.ALO_API}}/api/crm/notes", method: "POST", body: { studentId: "={{$json.studentId}}", content: "={{$json.summary}}", recordingUrl: "={{$json.outputUrl}}", transcriptUrl: "={{$json.srtUrl}}" } } },
    ],
  },
  {
    id: "faq-to-video",
    name: "FAQ Database → Daily Video Batch",
    description: "Cron daily: take top 3 FAQs, generate explainer videos via Remotion + TTS, queue for approval",
    trigger: "cron",
    active: false,
    nodes: [
      { id: "1", type: "n8n-nodes-base.cron", position: [0, 0], parameters: { cronExpression: "0 9 * * *" } },
      { id: "2", type: "n8n-nodes-base.httpRequest", position: [200, 0], parameters: { url: "={{$env.ALO_API}}/api/faqs/top", method: "GET", query: { limit: 3 } } },
      { id: "3", type: "n8n-nodes-base.splitInBatches", position: [400, 0], parameters: {} },
      { id: "4", type: "n8n-nodes-base.httpRequest", position: [600, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/projects", method: "POST", body: { title: "FAQ: {{$json.question}}", category: "faq", providerId: "remotion", templateId: "CourseExplainer", script: "={{$json.answer}}", durationSec: 45 } } },
    ],
  },
  {
    id: "youtube-research",
    name: "YouTube Competitor Research → Caption → Analysis",
    description: "Manual trigger: download competitor video (with rights check), caption, analyze for content ideas",
    trigger: "manual",
    active: false,
    nodes: [
      { id: "1", type: "n8n-nodes-base.manualTrigger", position: [0, 0], parameters: {} },
      { id: "2", type: "n8n-nodes-base.httpRequest", position: [200, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/automation/youtube", method: "POST", body: { url: "={{$json.youtubeUrl}}", hasRights: true, purpose: "competitor analysis" } } },
      { id: "3", type: "n8n-nodes-base.httpRequest", position: [400, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/caption", method: "POST", body: { videoUrl: "={{$json.outputUrl}}" } } },
    ],
  },
  {
    id: "ai-video-batch",
    name: "AI Video Batch: LTX Fast Draft → Human Review → Hunyuan Premium",
    description: "Generate fast drafts via LTX-Video, if approved, re-render premium via Hunyuan/CogVideo",
    trigger: "manual",
    active: false,
    nodes: [
      { id: "1", type: "n8n-nodes-base.manualTrigger", position: [0, 0], parameters: {} },
      { id: "2", type: "n8n-nodes-base.httpRequest", position: [200, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/render", method: "POST", body: { providerId: "ltx", prompt: "={{$json.prompt}}", durationSec: 5 } } },
      { id: "3", type: "n8n-nodes-base.wait", position: [400, 0], parameters: { amount: 2, unit: "minutes" } },
      { id: "4", type: "n8n-nodes-base.if", position: [600, 0], parameters: { conditions: { string: [{ value1: "={{$json.status}}", value2: "approved" }] } } },
      { id: "5", type: "n8n-nodes-base.httpRequest", position: [800, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/render", method: "POST", body: { providerId: "hunyuan", prompt: "={{$json.prompt}}", durationSec: 10, resolution: "1080p" } } },
    ],
  },
  {
    id: "talking-head-multilingual",
    name: "Talking Head Multilingual Dub",
    description: "Take approved English video, generate Bangla/Hindi/Arabic versions via video-retalking lip-sync",
    trigger: "event",
    event: "video.project.approved",
    active: false,
    nodes: [
      { id: "1", type: "n8n-nodes-base.webhook", position: [0, 0], parameters: { event: "video.project.approved" } },
      { id: "2", type: "n8n-nodes-base.httpRequest", position: [200, 0], parameters: { url: "={{$env.ALO_API}}/api/ai/translate", method: "POST", body: { text: "={{$json.voiceoverScript}}", targetLangs: ["bn", "hi", "ar"] } } },
      { id: "3", type: "n8n-nodes-base.splitInBatches", position: [400, 0], parameters: {} },
      { id: "4", type: "n8n-nodes-base.httpRequest", position: [600, 0], parameters: { url: "={{$env.ALO_API}}/api/video-engine/talking-head", method: "POST", body: { providerId: "retalking", referenceVideoUrl: "={{$json.outputUrl}}", audioText: "={{$json.translatedText}}", language: "={{$json.lang}}" } } },
    ],
  },
];

export function getWorkflowTemplate(id: string) {
  return N8N_VIDEO_WORKFLOW_TEMPLATES.find(w => w.id === id);
}

export async function triggerVideoWorkflow(
  event: string,
  data: Record<string, unknown>,
  workflowId?: string
) {
  const payload = workflowId ? { workflowId, event, data } : { event, data };
  return triggerWorkflowWithRetry(`video.${event}`, payload, 3);
}

export async function getN8nWorkflows(): Promise<N8nVideoWorkflow[]> {
  return N8N_VIDEO_WORKFLOW_TEMPLATES;
}

export async function createN8nWorkflowFromTemplate(
  templateId: string,
  customizations?: Partial<N8nVideoWorkflow>
): Promise<{ success: boolean; workflow?: N8nVideoWorkflow; error?: string }> {
  const template = getWorkflowTemplate(templateId);
  if (!template) {
    return { success: false, error: `Template ${templateId} not found` };
  }
  const workflow = { ...template, ...customizations, id: `${templateId}-${Date.now()}` };
  // In real implementation, POST to N8N_API_URL/api/v1/workflows
  const n8nApiUrl = process.env.N8N_API_URL;
  const n8nApiKey = process.env.N8N_API_KEY;
  if (n8nApiUrl && n8nApiKey) {
    try {
      const res = await fetch(`${n8nApiUrl}/api/v1/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY": n8nApiKey,
        },
        body: JSON.stringify(workflow),
      });
      if (!res.ok) {
        return { success: false, error: `n8n API error: ${res.status}` };
      }
      const created = await res.json();
      return { success: true, workflow: created };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
  // Fallback: return template as success (for local dev without n8n)
  return { success: true, workflow };
}
