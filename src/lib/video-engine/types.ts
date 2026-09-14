/**
 * ALO Education - Unified Video Engine Types
 * Integrates 34 external repos into a single type system
 */

// ─── Core Enums ───────────────────────────────────────────────────

export type VideoProviderId =
  | "remotion"
  | "cogvideo"
  | "hunyuan"
  | "ltx"
  | "longcat"
  | "pixelle"
  | "comfyui"
  | "infinitetalk"
  | "retalking"
  | "manim"
  | "videocaptioner"
  | "subtitle-remover"
  | "super-resolution"
  | "video-agent"
  | "videoclaw"
  | "openreel"
  | "jitsi"
  | "videorecorder"
  | "youtube-dl"
  | "reddit-maker"
  | "claude-video"
  | "slideshow"
  | "animated"
  | "n8n"
  | "ffmpeg"
  | "custom";

export type VideoCategory =
  | "promo"
  | "course_explainer"
  | "testimonial"
  | "scholarship"
  | "visa_guide"
  | "campus_tour"
  | "math_explainer"
  | "ielts_prep"
  | "success_story"
  | "faq"
  | "counseling_recording"
  | "avatar_counselor"
  | "slideshow"
  | "animated_text"
  | "reddit_story"
  | "youtube_compilation";

export type VideoStatus =
  | "draft"
  | "queued"
  | "rendering"
  | "captioning"
  | "editing"
  | "pending_approval"
  | "approved"
  | "published"
  | "failed"
  | "archived";

export type VideoAspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "21:9";
export type VideoResolution = "480p" | "720p" | "1080p" | "4K";
export type VideoPlatform = "facebook" | "instagram" | "tiktok" | "youtube" | "linkedin" | "website" | "whatsapp";

// ─── Provider Health ──────────────────────────────────────────────

export interface ProviderHealth {
  id: VideoProviderId;
  name: string;
  category: string;
  status: "online" | "offline" | "degraded" | "not_configured";
  latencyMs?: number;
  vramRequiredGB?: number;
  supports: {
    t2v: boolean;
    i2v: boolean;
    talkingHead: boolean;
    captioning: boolean;
    editing: boolean;
    streaming: boolean;
  };
  lastCheckedAt: string;
  error?: string;
}

// ─── Project Model ────────────────────────────────────────────────

export interface VideoProjectInput {
  title: string;
  description?: string;
  category: VideoCategory;
  providerId: VideoProviderId;
  templateId?: string;
  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
  platform: VideoPlatform;
  durationSec: number;
  language: string; // e.g., "en", "bn", "mixed"
  script: string;
  voiceoverScript?: string;
  scenes?: VideoScene[];
  assets?: VideoAssetRef[];
  brandOverlay: boolean;
  subtitle: boolean;
  thumbnailConcept?: string;
  prompt?: string; // For AI gen providers
  negativePrompt?: string;
  referenceImageUrl?: string; // For I2V
  audioUrl?: string; // For talking head / lip-sync
  metadata?: Record<string, unknown>;
}

export interface VideoScene {
  id: string;
  index: number;
  durationSec: number;
  visualDescription: string;
  voiceover: string;
  onScreenText?: string;
  transition?: "cut" | "fade" | "slide" | "zoom";
  assetUrl?: string;
  backgroundColor?: string;
}

export interface VideoAssetRef {
  id: string;
  type: "image" | "video" | "audio" | "logo" | "font";
  url: string;
  durationSec?: number;
  metadata?: Record<string, unknown>;
}

export interface VideoProject extends VideoProjectInput {
  id: string;
  status: VideoStatus;
  progress: number; // 0-100
  outputUrl?: string;
  thumbnailUrl?: string;
  subtitleUrl?: string;
  durationActualSec?: number;
  renderJobId?: string;
  providerResponse?: Record<string, unknown>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  approvedById?: string;
  approvedAt?: string;
  publishedAt?: string;
}

// ─── Render Job ───────────────────────────────────────────────────

export interface RenderJob {
  id: string;
  projectId: string;
  providerId: VideoProviderId;
  status: VideoStatus;
  progress: number;
  logs: string[];
  outputUrl?: string;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  estimatedTimeSec?: number;
  costUSD?: number;
}

// ─── AI Generation ────────────────────────────────────────────────

export interface AIGenerationRequest {
  providerId: Extract<VideoProviderId, "cogvideo" | "hunyuan" | "ltx" | "longcat" | "pixelle" | "comfyui">;
  prompt: string;
  negativePrompt?: string;
  referenceImageUrl?: string;
  durationSec: number;
  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
  fps?: number;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
  // Education-specific
  universityName?: string;
  courseName?: string;
  country?: string;
  language?: string;
}

export interface AIGenerationResponse {
  jobId: string;
  status: VideoStatus;
  previewUrl?: string;
  outputUrl?: string;
  promptUsed: string;
  providerId: VideoProviderId;
  metadata: Record<string, unknown>;
}

// ─── Talking Head ─────────────────────────────────────────────────

export interface TalkingHeadRequest {
  providerId: Extract<VideoProviderId, "infinitetalk" | "retalking">;
  audioUrl?: string;
  audioText?: string; // If audioUrl not provided, TTS from text
  referenceImageUrl?: string; // Avatar image
  referenceVideoUrl?: string; // For retalking - video to lip-sync
  language: string;
  avatarPreset?: string;
  emotion?: "neutral" | "happy" | "serious" | "excited";
  backgroundUrl?: string;
}

export interface TalkingHeadResponse {
  jobId: string;
  outputUrl: string;
  durationSec: number;
  providerId: VideoProviderId;
}

// ─── Captioning ───────────────────────────────────────────────────

export interface CaptioningRequest {
  videoUrl: string;
  language: string;
  targetLanguages?: string[]; // For translation - 99 languages via VideoCaptioner
  useWhisperLocal?: boolean;
  useLLMRefinement?: boolean;
  llmModel?: string;
  vadEnabled?: boolean;
  diarize?: boolean; // Speaker separation
}

export interface CaptioningResponse {
  srtUrl: string;
  vttUrl: string;
  assUrl?: string;
  txtUrl: string;
  translated?: Record<string, { srtUrl: string; vttUrl: string }>;
  segments: CaptionSegment[];
}

export interface CaptionSegment {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string;
  confidence: number;
}

// ─── Editing ──────────────────────────────────────────────────────

export interface EditingRequest {
  operation: "remove_subtitles" | "super_resolution" | "analyze" | "trim" | "merge" | "brand_overlay" | "compress";
  videoUrl: string;
  options?: Record<string, unknown>;
  // For remove_subtitles (YaoFANGUK/video-subtitle-remover)
  subtitleArea?: { x: number; y: number; w: number; h: number };
  // For super-resolution (LoSealL/VideoSuperResolution)
  targetResolution?: VideoResolution;
  model?: string;
  // For VideoAgent analysis
  prompt?: string;
}

export interface EditingResponse {
  jobId: string;
  outputUrl: string;
  operation: string;
  metadata: Record<string, unknown>;
}

// ─── Automation ───────────────────────────────────────────────────

export interface YoutubeDownloadRequest {
  url: string;
  quality?: "best" | "1080p" | "720p" | "audio_only";
  extractSubtitles?: boolean;
  subtitleLangs?: string[];
  trim?: { startSec: number; endSec: number };
  // Compliance
  hasRights: boolean; // Must be true
  purpose: string;
}

export interface RedditVideoRequest {
  redditUrl?: string;
  subreddit?: string;
  sortBy?: "hot" | "top" | "new";
  postId?: string;
  backgroundVideoUrl?: string;
  backgroundMusicUrl?: string;
  voice: "male" | "female" | "bengali_male" | "bengali_female";
  maxComments?: number;
  includePost: boolean;
  language: string;
  // For ALO adaptation: use student success stories forum instead of random Reddit
  source: "reddit" | "alo_forum" | "faq_db";
}

export interface SlideshowRequest {
  images: { url: string; durationSec: number; caption?: string }[];
  musicUrl?: string;
  transition: "fade" | "slide" | "zoom" | "cut";
  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
  title?: string;
  subtitle?: boolean;
}

// ─── Recording ────────────────────────────────────────────────────

export interface RecordingRequest {
  type: "screen" | "camera" | "both" | "jitsi_session";
  jitsiRoomName?: string;
  counselingSessionId?: string;
  maxDurationSec: number;
  withAudio: boolean;
}

export interface RecordingResponse {
  recordingId: string;
  outputUrl: string;
  durationSec: number;
  transcriptUrl?: string;
}

// ─── Manim ────────────────────────────────────────────────────────

export interface ManimRequest {
  sceneName: string;
  pythonCode?: string; // If not provided, generate from template
  template: "ielts_math" | "visa_timeline" | "scholarship_calc" | "custom";
  params: Record<string, unknown>;
  quality: "low" | "medium" | "high" | "4k";
  format: "mp4" | "gif" | "webm";
}

export interface ManimResponse {
  jobId: string;
  outputUrl: string;
  pythonCodeUsed: string;
  logs: string[];
}

// ─── Remotion ─────────────────────────────────────────────────────

export interface RemotionComposition {
  id: string;
  name: string;
  description: string;
  category: VideoCategory;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
  thumbnail?: string;
}

export interface RemotionRenderRequest {
  compositionId: string;
  inputProps: Record<string, unknown>;
  codec?: "h264" | "h265" | "vp8" | "vp9";
  outputFormat?: "mp4" | "webm";
  quality?: number;
  scale?: number;
}

export interface RemotionRenderResponse {
  jobId: string;
  outputUrl?: string;
  status: VideoStatus;
  progress: number;
  logs: string[];
}

// ─── n8n Video Workflows ──────────────────────────────────────────

export interface N8nVideoWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: "webhook" | "cron" | "manual" | "event";
  event?: string; // e.g., "lead.created", "video.approved"
  nodes: N8nNode[];
  active: boolean;
}

export interface N8nNode {
  id: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
}

export interface N8nTriggerRequest {
  workflowId: string;
  event: string;
  data: Record<string, unknown>;
}

// ─── Unified Engine Config ────────────────────────────────────────

export interface VideoEngineConfig {
  remotion: {
    enabled: boolean;
    lambdaEnabled: boolean;
    lambdaRegion?: string;
    lambdaFunctionName?: string;
    localFfmpegPath?: string;
  };
  aiProviders: {
    cogvideo: { enabled: boolean; apiUrl?: string; apiKey?: string; replicateModel?: string };
    hunyuan: { enabled: boolean; apiUrl?: string; apiKey?: string };
    ltx: { enabled: boolean; apiUrl?: string; apiKey?: string; localPath?: string; comfyUiUrl?: string };
    longcat: { enabled: boolean; apiUrl?: string };
    pixelle: { enabled: boolean; apiUrl?: string };
    comfyui: { enabled: boolean; url: string };
  };
  talkingHead: {
    infinitetalk: { enabled: boolean; apiUrl?: string; localPath?: string };
    retalking: { enabled: boolean; apiUrl?: string; localPath?: string };
  };
  captioning: {
    videocaptioner: { enabled: boolean; binaryPath?: string; whisperModel?: string; llmApiUrl?: string; llmApiKey?: string; llmModel?: string };
    whisperLocal: { enabled: boolean; modelPath?: string };
  };
  editing: {
    subtitleRemover: { enabled: boolean; pythonPath?: string; modelPath?: string };
    superResolution: { enabled: boolean; model?: string; pythonPath?: string };
    videoAgent: { enabled: boolean; apiUrl?: string };
  };
  recording: {
    jitsi: { enabled: boolean; domain: string; appId?: string; jwtSecret?: string };
    videorecorder: { enabled: boolean };
  };
  automation: {
    youtubeDl: { enabled: boolean; binaryPath?: string; useYtDlp: boolean };
    reddit: { enabled: boolean; clientId?: string; clientSecret?: string };
  };
  manim: {
    enabled: boolean;
    pythonPath: string;
    manimPath?: string;
    quality: string;
  };
  n8n: {
    enabled: boolean;
    webhookUrl?: string;
    apiUrl?: string;
    apiKey?: string;
  };
  storage: {
    provider: "local" | "s3" | "r2" | "gcs";
    bucket?: string;
    region?: string;
    baseUrl: string;
  };
  brand: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    watermarkEnabled: boolean;
    watermarkPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  };
}

// ─── Registry Entry ───────────────────────────────────────────────

export interface ExternalRepoEntry {
  id: string;
  url: string;
  name: string;
  category: "automation" | "captioning" | "ai_generation" | "talking_head" | "editing" | "recording" | "streaming" | "programmatic" | "content_automation" | "education" | "platform";
  description: string;
  license: string;
  language: string; // Primary language
  starsApprox?: number;
  integration: {
    providerId: VideoProviderId;
    priority: "P0" | "P1" | "P2";
    status: "integrated" | "adapter_ready" | "planned" | "reference_only";
    adapterPath: string;
    docsPath?: string;
  };
  aloUseCases: string[];
  complianceNotes?: string;
}
