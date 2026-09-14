/**
 * ALO Education - Unified Video Engine
 * Main orchestrator that integrates 34 external repos
 * 
 * Categories:
 * - Automation: n8n-io/n8n
 * - Captioning: WEIFENG2333/VideoCaptioner
 * - AI Generation: CogVideo, Hunyuan, LTX, LongCat, Pixelle, ComfyUI
 * - Talking Head: InfiniteTalk, video-retalking
 * - Editing: subtitle-remover, VideoSuperResolution, VideoAgent, VideoClaw, openreel
 * - Recording: VideoRecorder, jitsi-videobridge
 * - Content Automation: youtube-dl, RedditVideoMakerBot, claude-video, 9x VideoMaker
 * - Programmatic: remotion, VideoCode, 3b1b/manim
 * - Streaming: audio_video_streaming, digital_video_introduction
 */

import type {
  VideoProject,
  VideoProjectInput,
  RenderJob,
  ProviderHealth,
  VideoProviderId,
  AIGenerationRequest,
  CaptioningRequest,
  TalkingHeadRequest,
  EditingRequest,
  YoutubeDownloadRequest,
  RedditVideoRequest,
  SlideshowRequest,
  RecordingRequest,
  ManimRequest,
  RemotionRenderRequest,
} from "./types";

import { getVideoEngineConfig, isProviderEnabled } from "./config";
import { VIDEO_ECOSYSTEM_REGISTRY, VIDEO_ECOSYSTEM_STATS } from "./registry";

// Sub-modules
import * as n8nModule from "./n8n";
import * as remotionModule from "./remotion";
import * as captioningModule from "./captioning/videocaptioner";
import * as aiModule from "./ai-generation";
import * as talkingHeadModule from "./talking-head";
import * as editingModule from "./editing";
import * as recordingModule from "./recording";
import * as automationModule from "./automation";
import * as manimModule from "./manim";
import * as streamingModule from "./streaming";

// ─── Main Engine Class ──────────────────────────────────────────────

export class VideoEngine {
  private config = getVideoEngineConfig();

  // ─── Project Management ───────────────────────────────────────────

  async createProject(
    input: VideoProjectInput,
    createdById: string
  ): Promise<VideoProject> {
    const project: VideoProject = {
      ...input,
      id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "draft",
      progress: 0,
      createdById,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Trigger n8n workflow
    await n8nModule.videoN8nEvents.projectCreated(project.id, {
      title: project.title,
      category: project.category,
      providerId: project.providerId,
    }).catch(() => {});

    return project;
  }

  async renderProject(
    projectId: string,
    providerOverride?: VideoProviderId
  ): Promise<RenderJob> {
    const jobId = `render_${projectId}_${Date.now()}`;
    
    // In real implementation, fetch project from DB and delegate to provider
    const job: RenderJob = {
      id: jobId,
      projectId,
      providerId: providerOverride || "remotion",
      status: "queued",
      progress: 0,
      logs: [`Render job ${jobId} queued for project ${projectId}`],
      estimatedTimeSec: 60,
    };

    return job;
  }

  // ─── Remotion ─────────────────────────────────────────────────────

  async renderRemotion(
    req: RemotionRenderRequest
  ) {
    return remotionModule.renderRemotionVideo(req);
  }

  getRemotionCompositions() {
    return remotionModule.getAllCompositions();
  }

  getRemotionComposition(id: string) {
    return remotionModule.getComposition(id);
  }

  async generateRemotionFromPrompt(prompt: string, options?: any) {
    return remotionModule.generateRemotionCompositionFromPrompt({
      description: prompt,
      ...options,
    });
  }

  // ─── AI Generation ────────────────────────────────────────────────

  async generateAI(
    req: AIGenerationRequest
  ) {
    return aiModule.generateAIVideo(req);
  }

  async generateAIWithFallback(
    req: Omit<AIGenerationRequest, "providerId"> & { preferredProviders?: VideoProviderId[] }
  ) {
    return aiModule.generateWithFallback(req);
  }

  getAIProviders() {
    return aiModule.getAllAIProviders();
  }

  // ─── Captioning (VideoCaptioner) ──────────────────────────────────

  async captionVideo(req: CaptioningRequest) {
    return captioningModule.captionVideo(req);
  }

  async batchCaption(videoUrls: string[], options?: Partial<CaptioningRequest>) {
    return captioningModule.batchCaptionVideos(videoUrls, options || {});
  }

  // ─── Talking Head ─────────────────────────────────────────────────

  async generateTalkingHead(req: TalkingHeadRequest) {
    return talkingHeadModule.generateTalkingHead(req);
  }

  async dubMultilingual(
    videoUrl: string,
    translations: { language: string; audioText?: string; audioUrl?: string }[]
  ) {
    return talkingHeadModule.dubVideoMultilingual(videoUrl, translations);
  }

  getAvatarPresets() {
    return talkingHeadModule.getAllAvatarPresets();
  }

  // ─── Editing ──────────────────────────────────────────────────────

  async editVideo(req: EditingRequest) {
    return editingModule.editVideo(req);
  }

  async analyzeVideo(req: EditingRequest) {
    return editingModule.editVideo(req);
  }

  async analyzeCounselingSession(videoUrl: string, studentId?: string, sessionId?: string) {
    return editingModule.analyzeCounselingSession(videoUrl, studentId, sessionId);
  }

  // ─── Recording ────────────────────────────────────────────────────

  async startRecording(req: RecordingRequest) {
    return recordingModule.startRecording(req);
  }

  getJitsiRoomName(sessionId?: string, studentId?: string, counselorId?: string) {
    return recordingModule.generateJitsiRoomName(sessionId, studentId, counselorId);
  }

  getJitsiMeetUrl(roomName: string, config?: any, jwt?: string) {
    return recordingModule.getJitsiMeetUrl(roomName, config, jwt);
  }

  // ─── Automation ───────────────────────────────────────────────────

  async downloadYoutube(req: YoutubeDownloadRequest) {
    return automationModule.downloadYoutubeVideo(req);
  }

  async createRedditVideo(req: RedditVideoRequest) {
    return automationModule.createRedditStyleVideo(req);
  }

  async createSlideshow(req: SlideshowRequest) {
    return automationModule.createSlideshowVideo(req as any);
  }

  async createAnimatedText(req: any) {
    return automationModule.createAnimatedTextVideo(req);
  }

  async generateViaClaudeVideo(prompt: string, options?: any) {
    return automationModule.generateVideoFromClaudePrompt({ prompt, ...options });
  }

  // ─── Manim ────────────────────────────────────────────────────────

  async renderManim(req: ManimRequest) {
    return manimModule.renderManimScene(req);
  }

  // ─── Health ───────────────────────────────────────────────────────

  async getProvidersHealth(): Promise<Record<string, ProviderHealth>> {
    const [
      remotion,
      aiProviders,
      captioning,
      talkingHead,
      editing,
      recording,
      automation,
      manim,
      streaming,
      n8n,
    ] = await Promise.all([
      this.getRemotionHealth(),
      this.getAIProvidersHealth(),
      this.getCaptioningHealth(),
      talkingHeadModule.getTalkingHeadProvidersHealth(),
      editingModule.getEditingProvidersHealth(),
      recordingModule.getRecordingProvidersHealth(),
      automationModule.getAutomationProvidersHealth(),
      manimModule.getManimHealth(),
      streamingModule.getStreamingHealth(),
      this.getN8nHealth(),
    ]);

    return {
      remotion,
      ...aiProviders,
      captioning,
      ...talkingHead,
      ...editing,
      ...recording,
      ...automation,
      manim,
      streaming,
      n8n,
    } as any;
  }

  private async getRemotionHealth(): Promise<ProviderHealth> {
    return {
      id: "remotion",
      name: "Remotion",
      category: "programmatic",
      status: this.config.remotion.enabled ? "online" : "not_configured",
      lastCheckedAt: new Date().toISOString(),
      supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: true, streaming: false },
    };
  }

  private async getAIProvidersHealth(): Promise<Record<string, ProviderHealth>> {
    const providers = aiModule.getAllAIProviders();
    const health: Record<string, ProviderHealth> = {};
    for (const p of providers) {
      try {
        health[p.id] = await p.health();
      } catch {
        health[p.id] = {
          id: p.id,
          name: p.name,
          category: "ai_generation",
          status: "offline",
          lastCheckedAt: new Date().toISOString(),
          supports: { t2v: true, i2v: true, talkingHead: false, captioning: false, editing: false, streaming: false },
        };
      }
    }
    return health;
  }

  private async getCaptioningHealth(): Promise<ProviderHealth> {
    return {
      id: "videocaptioner",
      name: "VideoCaptioner",
      category: "captioning",
      status: this.config.captioning.videocaptioner.enabled ? "online" : "not_configured",
      lastCheckedAt: new Date().toISOString(),
      supports: { t2v: false, i2v: false, talkingHead: false, captioning: true, editing: false, streaming: false },
    };
  }

  private async getN8nHealth(): Promise<ProviderHealth> {
    return {
      id: "n8n",
      name: "n8n",
      category: "automation",
      status: this.config.n8n.enabled ? "online" : "not_configured",
      lastCheckedAt: new Date().toISOString(),
      supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
    };
  }

  // ─── Registry ─────────────────────────────────────────────────────

  getRegistry() {
    return VIDEO_ECOSYSTEM_REGISTRY;
  }

  getStats() {
    return VIDEO_ECOSYSTEM_STATS;
  }

  getConfig() {
    return this.config;
  }
}

// ─── Singleton ──────────────────────────────────────────────────────

let engineInstance: VideoEngine | null = null;

export function getVideoEngine(): VideoEngine {
  if (!engineInstance) {
    engineInstance = new VideoEngine();
  }
  return engineInstance;
}

// ─── Convenience exports ────────────────────────────────────────────

export * from "./types";
export * from "./registry";
export * from "./config";
export { VIDEO_ECOSYSTEM_REGISTRY, VIDEO_ECOSYSTEM_STATS } from "./registry";

// Re-export sub-modules for direct use
export * as n8n from "./n8n";
export * as remotion from "./remotion";
export * as captioning from "./captioning/videocaptioner";
export * as aiGeneration from "./ai-generation";
export * as talkingHead from "./talking-head";
export * as editing from "./editing";
export * as recording from "./recording";
export * as automation from "./automation";
export * as manim from "./manim";
export * as streaming from "./streaming";
