/**
 * ALO Education - Video Engine Config
 * Env-based configuration for all 34 repos
 */

import type { VideoEngineConfig } from "./types";

export function getVideoEngineConfig(): VideoEngineConfig {
  return {
    remotion: {
      enabled: process.env.REMOTION_ENABLED === "true" || true,
      lambdaEnabled: process.env.REMOTION_LAMBDA_ENABLED === "true" || false,
      lambdaRegion: process.env.REMOTION_LAMBDA_REGION || "us-east-1",
      lambdaFunctionName: process.env.REMOTION_LAMBDA_FUNCTION || "remotion-render",
      localFfmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
    },
    aiProviders: {
      cogvideo: {
        enabled: process.env.COGVIDEO_ENABLED === "true" || false,
        apiUrl: process.env.COGVIDEO_API_URL,
        apiKey: process.env.COGVIDEO_API_KEY,
        replicateModel: process.env.COGVIDEO_REPLICATE_MODEL || "zai-org/cogvideox-5b",
      },
      hunyuan: {
        enabled: process.env.HUNYUAN_ENABLED === "true" || false,
        apiUrl: process.env.HUNYUAN_API_URL,
        apiKey: process.env.HUNYUAN_API_KEY,
      },
      ltx: {
        enabled: process.env.LTX_ENABLED === "true" || true, // Default fast
        apiUrl: process.env.LTX_API_URL,
        apiKey: process.env.LTX_API_KEY,
        localPath: process.env.LTX_LOCAL_PATH,
        comfyUiUrl: process.env.COMFYUI_URL || "http://127.0.0.1:8188",
      },
      longcat: {
        enabled: process.env.LONGCAT_ENABLED === "true" || false,
        apiUrl: process.env.LONGCAT_API_URL,
      },
      pixelle: {
        enabled: process.env.PIXELLE_ENABLED === "true" || false,
        apiUrl: process.env.PIXELLE_API_URL,
      },
      comfyui: {
        enabled: process.env.COMFYUI_ENABLED === "true" || false,
        url: process.env.COMFYUI_URL || "http://127.0.0.1:8188",
      },
    },
    talkingHead: {
      infinitetalk: {
        enabled: process.env.INFINITETALK_ENABLED === "true" || false,
        apiUrl: process.env.INFINITETALK_API_URL,
        localPath: process.env.INFINITETALK_LOCAL_PATH,
      },
      retalking: {
        enabled: process.env.RETALKING_ENABLED === "true" || false,
        apiUrl: process.env.RETALKING_API_URL,
        localPath: process.env.RETALKING_LOCAL_PATH,
      },
    },
    captioning: {
      videocaptioner: {
        enabled: process.env.VIDEOCAPTIONER_ENABLED === "true" || true,
        binaryPath: process.env.VIDEOCAPTIONER_PATH,
        whisperModel: process.env.WHISPER_MODEL || "base",
        llmApiUrl: process.env.LLM_API_URL || process.env.OPENAI_API_BASE,
        llmApiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
        llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
      },
      whisperLocal: {
        enabled: process.env.WHISPER_LOCAL_ENABLED === "true" || false,
        modelPath: process.env.WHISPER_LOCAL_MODEL_PATH,
      },
    },
    editing: {
      subtitleRemover: {
        enabled: process.env.SUBTITLE_REMOVER_ENABLED === "true" || false,
        pythonPath: process.env.PYTHON_PATH || "python3",
        modelPath: process.env.SUBTITLE_REMOVER_MODEL_PATH,
      },
      superResolution: {
        enabled: process.env.SUPER_RESOLUTION_ENABLED === "true" || false,
        model: process.env.VSR_MODEL || "RealBasicVSR",
        pythonPath: process.env.PYTHON_PATH || "python3",
      },
      videoAgent: {
        enabled: process.env.VIDEO_AGENT_ENABLED === "true" || false,
        apiUrl: process.env.VIDEO_AGENT_API_URL,
      },
    },
    recording: {
      jitsi: {
        enabled: process.env.JITSI_ENABLED === "true" || false,
        domain: process.env.JITSI_DOMAIN || "meet.jit.si",
        appId: process.env.JITSI_APP_ID,
        jwtSecret: process.env.JITSI_JWT_SECRET,
      },
      videorecorder: {
        enabled: true,
      },
    },
    automation: {
      youtubeDl: {
        enabled: process.env.YOUTUBE_DL_ENABLED === "true" || true,
        binaryPath: process.env.YTDLP_PATH || "yt-dlp",
        useYtDlp: true,
      },
      reddit: {
        enabled: process.env.REDDIT_ENABLED === "true" || false,
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
      },
    },
    manim: {
      enabled: process.env.MANIM_ENABLED === "true" || false,
      pythonPath: process.env.PYTHON_PATH || "python3",
      manimPath: process.env.MANIM_PATH || "manim",
      quality: process.env.MANIM_QUALITY || "medium",
    },
    n8n: {
      enabled: process.env.N8N_ENABLED === "true" || !!process.env.N8N_WEBHOOK_URL,
      webhookUrl: process.env.N8N_WEBHOOK_URL,
      apiUrl: process.env.N8N_API_URL,
      apiKey: process.env.N8N_API_KEY,
    },
    storage: {
      provider: (process.env.VIDEO_STORAGE_PROVIDER as any) || "local",
      bucket: process.env.VIDEO_STORAGE_BUCKET,
      region: process.env.VIDEO_STORAGE_REGION,
      baseUrl: process.env.VIDEO_STORAGE_BASE_URL || "/uploads/videos",
    },
    brand: {
      logoUrl: process.env.BRAND_LOGO_URL || "/brand/alo-logo.png",
      primaryColor: process.env.BRAND_PRIMARY_COLOR || "#E8501A",
      secondaryColor: process.env.BRAND_SECONDARY_COLOR || "#0057B8",
      watermarkEnabled: process.env.BRAND_WATERMARK_ENABLED !== "false",
      watermarkPosition: (process.env.BRAND_WATERMARK_POSITION as any) || "bottom-right",
    },
  };
}

export const VIDEO_ENGINE_DEFAULTS = {
  fps: 30,
  durationSec: 30,
  resolution: "1080p" as const,
  aspectRatio: "16:9" as const,
  platform: "facebook" as const,
  language: "english",
  brandOverlay: true,
  subtitle: true,
};

export function isProviderEnabled(providerId: string): boolean {
  const config = getVideoEngineConfig();
  // Check nested
  if (providerId === "remotion") return config.remotion.enabled;
  if (providerId === "n8n") return config.n8n.enabled;
  if (providerId === "videocaptioner") return config.captioning.videocaptioner.enabled;
  if (providerId === "jitsi") return config.recording.jitsi.enabled;
  if (providerId === "youtube-dl") return config.automation.youtubeDl.enabled;
  if (providerId === "manim") return config.manim.enabled;
  if (providerId in config.aiProviders) return (config.aiProviders as any)[providerId]?.enabled || false;
  if (providerId === "infinitetalk") return config.talkingHead.infinitetalk.enabled;
  if (providerId === "retalking") return config.talkingHead.retalking.enabled;
  if (providerId === "subtitle-remover") return config.editing.subtitleRemover.enabled;
  if (providerId === "super-resolution") return config.editing.superResolution.enabled;
  if (providerId === "video-agent" || providerId === "videoclaw") return config.editing.videoAgent.enabled;
  return false;
}
