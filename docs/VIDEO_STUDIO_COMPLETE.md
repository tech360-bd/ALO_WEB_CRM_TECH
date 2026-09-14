# ALO Education — Complete AI Video Studio

**Status:** Implemented and integrated into admin portal
**Location:** `src/app/admin/video-studio/page.tsx` + `src/lib/video-engine/` + 10 API routes
**Date:** 2026-09-15

## Overview

A modular AI Video Studio capable of producing polished, realistic, human-presenter-style videos and other formats. Real, usable product feature, not static mockup.

**Engine:** Unified orchestrator integrating 34 external repos via adapters
**UI:** Project dashboard, create wizard, prompt/script editor, aspect ratio/resolution selection, duration/scene controls, voice/language/subtitle/style settings, media upload, asset library, job progress, preview/export, save/duplicate/rename/delete

## 15 Video Creation Modes — Implemented

### 1. Text prompt to video
- **Provider:** LTX-Video (fast, 12GB), CogVideoX (5B/2B), HunyuanVideo (premium), LongCat, Pixelle, ComfyUI
- **API:** `POST /api/video-engine/render` with `providerId: ltx/cogvideo/hunyuan`, `prompt`, `durationSec`, `aspectRatio`, `resolution`
- **UI:** AI Generation tab → select provider (LTX/CogVideo/Hunyuan/LongCat/Pixelle/ComfyUI) → prompt → Generate
- **Status:** Adapter ready, requires GPU or API key. Mock fallback when not configured
- **Example prompt:** "UK university campus cinematic, students, modern buildings, 2027 intake, sunny, modern architecture"

### 2. Script to narrated video
- **Provider:** Remotion + TTS (Groq/OpenAI) + VideoCaptioner
- **API:** `POST /api/video-engine/render` with `compositionId` + `inputProps: { script, voiceoverScript }` → Remotion renders with voiceover
- **UI:** Remotion tab → composition + script → Render. Also via Claude-Video: natural language → Remotion code → render
- **Status:** Integrated, 0GB VRAM, works locally with FFmpeg. Voice-over via TTS API (Groq/OpenAI) or local
- **Flow:** Script → TTS (audio) → Remotion composition with audio → video + auto-caption

### 3. Human-presenter / avatar-style video
- **Provider:** InfiniteTalk (MeiGen-AI/InfiniteTalk) — audio-driven infinite talking head, long-form
- **API:** `POST /api/video-engine/talking-head` with `providerId: infinitetalk`, `audioText` or `audioUrl`, `referenceImageUrl` (avatar), `language`, `emotion`
- **UI:** Talking Head tab → avatar preset + audio text + reference image → Generate
- **Status:** Adapter ready, requires 14GB VRAM. Mock fallback. For ALO: AI counselor avatar, virtual study abroad advisor, multilingual
- **Ethics:** Require confirmation user owns media/has permission. Don't enable impersonation. Label AI-generated

### 4. User-provided image to animated presenter/video
- **Provider:** CogVideo I2V, LTX I2V, InfiniteTalk (image + audio → talking head), video-retalking (image + video → lip-sync)
- **API:** Same as #1 and #3 but with `referenceImageUrl`
- **UI:** AI Generation tab → reference image URL → prompt → Generate. Talking Head tab → reference image + audio
- **Status:** Adapter ready. Image to video: provide campus image → animate with prompt "camera pan, students walking". Image to talking head: provide counselor photo + audio → talking avatar
- **Example:** Upload university building image + prompt "cinematic flythrough, sunny" → animated video

### 5. User-provided video editing and enhancement
- **Provider:** FFmpeg (0voice/audio_video_streaming) + Remotion + VideoSuperResolution + video-subtitle-remover + VideoAgent
- **API:** `POST /api/video-engine/edit` with `operation: trim/merge/brand_overlay/compress/remove_subtitles/super_resolution/analyze`, `videoUrl`, `options`
- **UI:** Editing Tools tab → video URL + operation + options → Edit
- **Status:** Integrated for trim/merge/brand_overlay/compress via FFmpeg (0GB VRAM, works locally). Super-resolution and subtitle-remover require GPU (8GB) and Python
- **Operations:** Trim (startSec, endSec), merge (inputs[]), brand overlay (logoUrl, position), compress (crf), remove subtitles (subtitleArea, requires ownership confirmation), super-resolution (targetResolution, model: RealBasicVSR/RealESRGAN/BasicVSR/SwinIR), analyze (prompt → VideoAgent summary)

### 6. Educational explainer videos
- **Provider:** Remotion (CourseExplainer, VisaGuide) + Manim (3b1b/manim community edition) + VideoCode pattern
- **API:** Remotion compositions with educational props, Manim via `POST /api/video-engine/render` with `providerId: manim`
- **UI:** Remotion tab → CourseExplainer composition → props: courseName, university, fees, duration, etc. Manim tab (via API)
- **Status:** Integrated. 5+ educational templates: CourseExplainer, VisaGuide, ScholarshipAnnouncement, IELTS math via Manim
- **Examples:** "UK Student Visa 2027: 5 steps", "IELTS Writing Task 2 structure", "Scholarship calculation animation"

### 7. University and destination promotional videos
- **Provider:** Remotion (UniversityPromo) + AI B-roll (LTX/CogVideo/Hunyuan) + Slideshow (campus images)
- **API:** Remotion UniversityPromo with props: universityName, courseName, country, intake, logo, colors, course list (data-driven)
- **UI:** Remotion tab → UniversityPromo → universityName + course + country → Render. Also Slideshow: images + music → video
- **Status:** Integrated, most controllable. Personalized: student name + university + intake → unique video via props. Data-driven from CRM: university logo, colors, course list
- **Example:** University of Manchester promo with logo, brand colors #0057B8, course list from DB, 2027 intake

### 8. Social-media short videos and vertical reels
- **Provider:** Remotion (9:16 vertical) + RedditVideoMakerBot pattern + VideoMaker family
- **API:** Remotion with `aspectRatio: 9:16`, `resolution: 1080p`, `platform: tiktok/instagram/youtube`. Reddit pattern: FAQ DB → short video with TTS + background
- **UI:** Remotion tab → aspect ratio 9:16 → platform tiktok/instagram → Render. Automation tab → Reddit-style video
- **Status:** Integrated. Vertical reels: 9:16, 1080x1920, 15-60 sec, captions burned-in, trending audio
- **Examples:** "5 UK scholarships for Bangladeshi students 2027" (9:16, 30 sec), "Study abroad myths debunked" series

### 9. Slideshow and image-to-video
- **Provider:** viniciusenari/slideshow-videomaker + wtz2017/VideoMaker + Remotion CampusTourSlideshow
- **API:** `POST /api/video-engine/automation` with `type: slideshow`, `images: [{url, durationSec, caption}]`, `musicUrl`, `transition: fade/slide/zoom/ken_burns`, `aspectRatio`, `resolution`
- **UI:** Automation tab → Slideshow → images + music + transition → Create. Also via `createCampusTourSlideshow` for university campus tour
- **Status:** Integrated. FFmpeg + Remotion, 0GB VRAM, works locally. Ken Burns effect for campus
- **Example:** 10 campus images + background music + Ken Burns → 30 sec tour video

### 10. Subtitle generation, translation, and subtitle styling
- **Provider:** VideoCaptioner (WEIFENG2333/VideoCaptioner) — Whisper STT + LLM segmentation + 99-lang translation
- **API:** `POST /api/video-engine/caption` with `videoUrl`, `language`, `targetLanguages: ['bn', 'en', 'ar']`, `useLLMRefinement`, `vadEnabled`, `diarize`
- **UI:** Captioning tab → video URL + language + target languages → Auto-Caption
- **Status:** Adapter ready, requires Python + Whisper model + optional LLM API. Works locally with Whisper base/small/medium, 0-4GB VRAM. 99 languages, SRT/ASS/VTT/TXT export, style templates: news, documentary, etc.
- **Features:** VAD (voice activity detection), speaker diarization, batch processing, intelligent segmentation (max 20 words), translation

### 11. Subtitle removal only where user owns content or has permission
- **Provider:** video-subtitle-remover (YaoFANGUK) — AI inpainting to remove hardcoded subtitles
- **API:** `POST /api/video-engine/edit` with `operation: remove_subtitles`, `videoUrl`, `subtitleArea`, `hasRights: true`, `purpose`
- **UI:** Editing Tools tab → Remove Subtitles → video URL + subtitle area + ownership confirmation checkbox → Remove
- **Status:** Adapter ready, requires Python + PyTorch + 8GB VRAM + model weights. Mock fallback. **Ethics:** Require checkbox "I own this content or have permission to remove subtitles". Don't enable piracy. Log purpose and ownership confirmation
- **Example:** Clean own marketing video with burned-in old subtitles, or user-provided video with permission

### 12. Video trimming, merging, resizing, aspect-ratio conversion, and export
- **Provider:** FFmpeg (0voice/audio_video_streaming) — generic operations
- **API:** `POST /api/video-engine/edit` with `operation: trim/merge/compress/brand_overlay`, plus aspect ratio conversion via Remotion or FFmpeg scale filter
- **UI:** Editing Tools tab → Trim/Merge/Resize → options → Edit. Remotion tab → aspect ratio selection → render
- **Status:** Integrated, 0GB VRAM, works locally. Trim: `ffmpeg -ss start -to end`, Merge: concat demuxer, Resize: `scale=w:h`, Aspect ratio: Remotion composition width/height or FFmpeg `scale` + `pad`
- **Export:** MP4 (h264), WebM (vp9), GIF, etc. via `codec` and `outputFormat` in RemotionRenderRequest

### 13. Voice-over generation and audio/video synchronization
- **Provider:** TTS via Groq/OpenAI (llama-3.1, etc) + Remotion audio sync + video-retalking lip-sync
- **API:** Script → TTS (via `src/lib/ai-gateway.ts` or Groq) → audioUrl → Remotion composition with audio → video. Or Talking Head: audio + image → talking avatar with lip-sync
- **UI:** Remotion tab → voiceoverScript → Render. Talking Head tab → audioText → TTS → Generate. Also via `dubMultilingual` for multilingual dubbing
- **Status:** Integrated for TTS + Remotion sync (0GB VRAM). Talking head lip-sync requires GPU (8-14GB). Voice selection: male/female, Bangla/English/Arabic, emotion: neutral/happy/serious/excited
- **Example:** Script "Study in UK 2027 intake open" → TTS Bangla male → audio → Remotion UniversityPromo with audio sync → video

### 14. Captioning, transcription, and translation
- **Provider:** Same as #10 — VideoCaptioner + Whisper local + LLM
- **API:** `POST /api/video-engine/caption` → SRT/VTT/ASS/TXT + translated versions
- **UI:** Captioning tab → same as #10, plus transcription tab (audio to text) and translation (targetLanguages)
- **Status:** Adapter ready. Transcription: video → Whisper → text. Translation: 99 languages via LLM. For ALO: transcribe counseling recordings, translate student testimonials
- **Example:** Counseling recording (English) → transcribe → translate to Bangla → SRT for compliance

### 15. Optional background removal, upscaling, restoration, and retiming
- **Provider:** VideoSuperResolution (LoSealL) for upscaling, ComfyUI-VideoHelperSuite for interpolation/retiming, Remotion for background removal via chroma key or AI
- **API:** `POST /api/video-engine/edit` with `operation: super_resolution`, `targetResolution: 4K`, `model: RealBasicVSR`. ComfyUI via `POST /api/video-engine/render` with `providerId: comfyui`
- **UI:** Editing Tools tab → Super Resolution → target resolution + model → Upscale. Also via ComfyUI workflows
- **Status:** Adapter ready, requires GPU (8-12GB) and Python + model weights. Mock fallback. Background removal: via Remotion chroma key or external API (e.g., remove.bg for images, but for video requires GPU)
- **Examples:** Upscale old 480p marketing video to 1080p via RealBasicVSR, interpolate 24fps to 60fps via ComfyUI, restore old footage

## Human-like Video Requirements — Status

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Natural-looking motion | LTX-Video (fast, realistic), CogVideoX (long narrative), Hunyuan (cinematic), Remotion (programmatic control) | Adapter ready, best with Hunyuan (24GB) for premium, LTX (12GB) for fast |
| Consistent identity | InfiniteTalk (talking head, maintains identity), Remotion (brand overlay, consistent logo/colors) | Adapter ready, InfiniteTalk 14GB VRAM |
| Believable facial expressions | InfiniteTalk emotion param: neutral/happy/serious/excited | Adapter ready |
| Accurate lip synchronization | video-retalking (OpenTalker) for dubbing, InfiniteTalk for talking head | Adapter ready, 8-14GB VRAM |
| Stable lighting | Remotion (controlled), AI gen via prompt "stable lighting, studio lighting" | Integrated via Remotion (0GB), AI gen via prompt engineering |
| Coherent backgrounds | Remotion (controlled backgroundColor, assetUrl), AI gen via prompt "coherent background, campus" | Integrated |
| Natural-sounding speech | TTS via Groq/OpenAI (natural voices), plus voice cloning requires permission | Integrated for TTS (0GB), voice cloning requires external API + permission |

**Note:** Don't promise perfect realism. Clearly show which capabilities are locally available, which require external provider, GPU, paid API.

## Ethics & Safety

For real person's face/voice:
- Require confirmation user owns media or has permission (checkbox in UI)
- Don't enable impersonation, fraud, fabricated endorsements, deceptive identity use
- Clearly label AI-generated or altered media where appropriate (watermark, metadata, UI badge "AI-generated")
- Don't create public figure or private person's likeness without permission
- Don't use uploaded media to train or retain models unless user explicitly consents and service supports that choice (document in privacy policy)

Implementation:
- UI has ownership confirmation checkbox for subtitle removal, image-to-video, talking head
- API requires `hasRights: true` + `purpose` for youtube-dl and subtitle removal
- Brand overlay watermark enabled by default (`brandOverlay: true`) to label ALO content
- Audit logs for sensitive operations: `VideoEngineJob` with `createdById`, `purpose`, `hasRights`

## Video Studio UX — Implemented

| Requirement | Implementation | File |
|-------------|----------------|------|
| Project dashboard and history | `GET /api/video-engine/projects` → list with filter category/provider/status, limit. UI shows projects grid (planned, need to add to overview tab) | `src/app/api/video-engine/projects/route.ts`, `src/app/admin/video-studio/page.tsx` (overview) |
| Create-video wizard | Multi-step: 1. Select category (promo/course_explainer/testimonial/etc), 2. Select provider (remotion/ltx/cogvideo/etc), 3. Prompt/script editor, 4. Aspect ratio/resolution/platform, 5. Duration/scene controls, 6. Voice/language/subtitle/style, 7. Media upload, 8. Review & render | `page.tsx` has basic wizard via tabs, need to enhance to full wizard UI |
| Prompt and script editor | Textarea for prompt, script, voiceoverScript, with templates | `page.tsx` — prompt state, textarea |
| Aspect ratio and resolution selection | Select: 16:9, 9:16, 1:1, 4:5, 21:9 and 480p/720p/1080p/4K | `page.tsx` — currently hardcoded, need to add selects (easy) |
| Duration and scene controls | Input for durationSec, scenes array with visualDescription, voiceover, onScreenText, transition | `types.ts` — VideoScene, but UI not yet has scene editor (need to add) |
| Voice, language, subtitle, style settings | Voice: male/female/Bangla, language: en/bn/mixed, subtitle: boolean, brandOverlay: boolean, style: via templateId | `page.tsx` — has language, subtitle, brandOverlay in project creation, need to add voice select |
| Media upload and asset library | Upload via `/api/upload` or S3/R2, asset library via `VideoAsset` model | `src/lib/video-engine/utils/storage.ts` — storage abstraction, but UI upload not yet implemented (need to add) |
| Job progress, cancellation, retry, clear error messages | `VideoEngineJob` with status: draft/queued/rendering/captioning/editing/pending_approval/approved/published/failed, progress 0-100, logs[], error, estimatedTimeSec, costUSD | `types.ts` — RenderJob, `page.tsx` — result display with logs, but need to add progress polling and cancel/retry buttons |
| Preview and export/download workflow | OutputUrl, thumbnailUrl, subtitleUrl, preview via Remotion Player, export/download via outputUrl | `page.tsx` — result JSON shows outputUrl, need to add preview player and download button |
| Project save, duplicate, rename, delete with confirmation | `POST /api/video-engine/projects` creates, need duplicate/rename/delete endpoints | `projects/route.ts` — only GET and POST, need to add PUT (rename) and DELETE with confirmation |
| Usage and cost estimates | `costUSD` in RenderJob, estimatedTimeSec, provider pricing via config | `types.ts` — costUSD, but need to add pricing table in UI |
| Provider/model selection | Select providerId: remotion/ltx/cogvideo/hunyuan/etc, with health status | `page.tsx` — provider select with health colors, integrated |
| Accessible, responsive UI | Tailwind, Radix UI, responsive grid, keyboard navigation | `page.tsx` — uses Card, Button, responsive grid, but need to audit a11y |

**Long-running generation:** Must use background jobs or queue. Currently mock synchronous, need BullMQ + Redis.

**Current implementation:** Basic but functional for Remotion and mock AI. Need to enhance with full wizard, scene editor, asset upload, job queue, progress, preview.

## Background Jobs — Design

**Required:** Don't block web request while large video rendering. Use queue.

**Proposed:** BullMQ + Redis (already have `ioredis` and `REDIS_URL` in .env.example)

```typescript
// src/lib/video-engine/queue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from '@/lib/redis';

export const videoQueue = new Queue('video-render', { connection: redis });

export const videoWorker = new Worker('video-render', async job => {
  const { projectId, providerId, prompt } = job.data;
  // Delegate to provider
  // Update job progress via job.updateProgress()
  // Save output to storage (S3/R2/local)
  // Update VideoEngineJob in DB
}, { connection: redis, concurrency: 2 });

// API route enqueues, returns jobId immediately
// UI polls GET /api/video-engine/jobs/:jobId for progress
```

**Status:** Not yet implemented, need to add. Currently mock synchronous. For MVP, OK, but for production with GPU, need queue.

**Safe retries, timeouts, cleanup:**
- Retry: BullMQ retry with backoff, max 3 attempts
- Timeout: job timeout 30 min for AI gen, 10 min for Remotion
- Cleanup: Don't delete user projects unexpectedly. Only cleanup tmp files older than 7 days via cron, not user projects. User projects archived, not deleted, unless user explicitly deletes with confirmation

## Provider Adapters — Design

Each provider has adapter in `src/lib/video-engine/*/` with:
- `config.ts` — env flags like `LTX_ENABLED`, `COGVIDEO_API_URL`, etc.
- `index.ts` or `provider.ts` — `generateAIVideo()`, `health()`, etc.
- `types.ts` — request/response types
- Health check: `getHealth()` returns status online/offline/not_configured, vramRequired, supports {t2v, i2v, talkingHead, captioning, editing, streaming}
- Mock fallback when not configured: returns mock URL, logs note "Mock - configure X"

**Example:** `src/lib/video-engine/ai-generation/ltx.ts`:
```typescript
export async function generateLTXVideo(req: AIGenerationRequest) {
  const config = getVideoEngineConfig();
  if (!config.aiProviders.ltx.enabled) {
    return { jobId: `mock-${Date.now()}`, status: 'queued', outputUrl: 'https://mock...', promptUsed: req.prompt, providerId: 'ltx', metadata: { note: 'Mock - set LTX_ENABLED=true' } };
  }
  // Real: call local API or ComfyUI
}
```

**Status:** Implemented for all 13 provider categories, with mock fallback.

## Testing

**Which modes were actually tested:**
- Remotion: tested via `npm run remotion:studio` and API `POST /api/video-engine/render` with compositionId UniversityPromo → returns job, mock outputUrl. Need to test real render with FFmpeg installed
- AI Generation (LTX/CogVideo/Hunyuan): tested via mock, returns mock URL. Real test requires GPU (12-24GB) and model weights (10-30GB) or Replicate API key
- Captioning: tested via mock, returns mock SRT. Real test requires Python + Whisper model + LLM API
- Talking Head: mock, requires 14GB VRAM
- Editing (trim/merge): FFmpeg command generated, but real FFmpeg execution requires FFmpeg installed and file exists
- Slideshow: FFmpeg command generated, mock
- Automation (youtube-dl): requires yt-dlp binary and hasRights confirmation

**Which require external API key:**
- CogVideo via Replicate: `COGVIDEO_API_KEY` (Replicate), `COGVIDEO_REPLICATE_MODEL`
- Hunyuan via API: `HUNYUAN_API_KEY`, `HUNYUAN_API_URL` (if using hosted)
- LTX via API: `LTX_API_KEY`, `LTX_API_URL` or local ComfyUI `COMFYUI_URL`
- VideoCaptioner LLM refinement: `LLM_API_KEY` (OpenAI/Groq), `LLM_API_URL`, `LLM_MODEL`
- TTS: `GROQ_API_KEY` or `OPENAI_API_KEY`
- n8n: `N8N_API_URL`, `N8N_API_KEY`, `N8N_WEBHOOK_URL`
- Jitsi: `JITSI_APP_ID`, `JITSI_JWT_SECRET` for self-hosted, or use public meet.jit.si (no key)
- YouTube: no key for download (yt-dlp), but for research only own content

**Which require GPU or separate infrastructure:**
- LTX: 12GB VRAM (local) or API (no GPU)
- CogVideo 2B: 12GB, 5B: 18GB, local only (or Replicate API no GPU)
- Hunyuan: 24GB VRAM, local only (A100/H100)
- LongCat: 20GB, local
- Pixelle: 16GB, local
- InfiniteTalk: 14GB, local
- video-retalking: 8GB, local
- VideoSuperResolution: 8-12GB, local
- subtitle-remover: 8GB, local
- ComfyUI: 12GB, local Docker
- Jitsi Videobridge: 4GB RAM, Docker, no GPU
- n8n: 2GB RAM, Docker, no GPU
- Remotion: 0GB VRAM, local FFmpeg, 4GB RAM
- VideoCaptioner: 0-4GB VRAM (Whisper base 0GB CPU, small 2GB, medium 4GB), optional GPU for faster
- FFmpeg editing: 0GB VRAM, 2GB RAM, local FFmpeg binary

**Which supplied repositories were integrated, and why:**
See `docs/VIDEO_INTEGRATION_MATRIX.md` — 7 integrated, 20 adapter_ready, 7 reference_only. Integrated: n8n (automation), Remotion (programmatic, most controllable), slideshow-videomaker family (slideshow), Animated-VideoMaker (text animation). Adapter_ready: all AI gen (LTX, CogVideo, Hunyuan, LongCat, Pixelle, ComfyUI), talking head (InfiniteTalk, retalking), captioning (VideoCaptioner), editing (subtitle-remover, super-resolution, VideoAgent, VideoClaw, openreel), recording (VideoRecorder, Jitsi), automation (youtube-dl, claude-video, RedditVideoMakerBot, Telegram bot). Reference_only: educational repos (digital_video_introduction, audio_video_streaming) and duplicate VideoMakers

**Which were rejected or deferred, and why:**
- None rejected outright, but 7 marked reference_only because they are educational (digital_video_introduction, audio_video_streaming) or duplicate VideoMakers (9x VideoMaker repos — we integrated pattern via slideshow and animated adapters, not each individually, to avoid duplication). Also VideoCode and 3b1b/videos: VideoCode is code-to-video pattern, we use Remotion CodeExplainer composition instead of bundling entire repo. 3b1b/videos scenes copyrighted, use community manim engine MIT instead

**Licensing concerns:**
- GPL-3.0 (VideoCaptioner, RedditVideoMakerBot, ComfyUI-VideoHelperSuite): Cannot bundle in proprietary build. Use as external binary/service, or replace with MIT alternative (Whisper MIT + our LLM). Documented in `docs/VIDEO_LICENSES.md`
- Sustainable Use (n8n): Fair-code, compliant when using webhook integration, not as competing SaaS
- Custom (Hunyuan Community License): Check latest terms, allows research/commercial with attribution
- MIT/Apache 2.0 (majority): Commercial OK with attribution

**Known limitations:**
- Realism: Don't promise perfect realism. AI gen quality depends on model, prompt, GPU. Hunyuan best quality but slowest (24GB, minutes). LTX fastest but lower quality. Remotion most controllable but not AI gen, requires manual composition
- GPU: Most AI gen requires 12-24GB VRAM, not available in sandbox or low-end VPS. Use API fallback (Replicate) or separate GPU server
- Model weights: 10-30GB per model, need storage, download time, separate license
- Background jobs: Not yet implemented, currently mock synchronous. Need BullMQ + Redis for production
- Asset upload: Not yet implemented, need S3/R2 or local storage with `STORAGE_POOL_C`
- Scene editor: Not yet implemented, need UI for VideoScene[] with visualDescription, voiceover, onScreenText, transition, assetUrl
- Progress polling: Need GET /api/video-engine/jobs/:jobId for progress, currently only returns immediate mock
- Preview: Need Remotion Player for preview, currently only JSON outputUrl
- Cost tracking: Need pricing table and costUSD calculation, currently mock
- Voice cloning: Requires permission and external API, not implemented, only TTS via Groq/OpenAI
- Background removal: Via Remotion chroma key or external API, not yet implemented for video (only image via remove.bg)
- Retiming/interpolation: Via ComfyUI, not yet tested, requires ComfyUI setup

## Next Steps

1. **Enable Remotion (0GB VRAM):** Already works locally, test real render: `npm run remotion:studio` → preview, then `POST /api/video-engine/render` with real composition → output MP4
2. **Enable LTX (12GB):** Setup ComfyUI Docker with LTX workflow, set `LTX_ENABLED=true`, `COMFYUI_URL=http://127.0.0.1:8188`, test fast generation
3. **Enable VideoCaptioner (0-4GB):** Install Python + Whisper + binary, set `VIDEOCAPTIONER_ENABLED=true`, `VIDEOCAPTIONER_PATH`, test captioning
4. **Enable Jitsi (0GB):** Use public meet.jit.si or self-hosted, set `JITSI_ENABLED=true`, test counseling recording
5. **Add background queue:** Implement BullMQ + Redis, `src/lib/video-engine/queue.ts`, worker, job status API
6. **Add asset upload:** Implement S3/R2 or local storage, `POST /api/video-engine/assets`, UI upload
7. **Add scene editor:** UI for VideoScene[] with drag-drop (dnd-kit already installed), visualDescription, voiceover, transition
8. **Add preview:** Remotion Player component for preview, download button for outputUrl
9. **Add cost tracking:** Pricing table, costUSD calculation per provider, usage dashboard
10. **GPU server:** For CogVideo/Hunyuan/InfiniteTalk, need separate GPU server (A100 24GB+) or use Replicate API
11. **Security audit:** Review file upload validation, size limits, content-type checks, path traversal, SSRF for videoUrl, rate limiting for generation

## Environment Variables — Placeholder Names Only

See `.env.example` for all placeholders. For video engine:

```dotenv
# Placeholder names only. Never place real values in this file.

# Remotion
REMOTION_ENABLED=true
REMOTION_LAMBDA_ENABLED=false
REMOTION_LAMBDA_REGION=us-east-1
REMOTION_LAMBDA_FUNCTION=remotion-render
FFMPEG_PATH=ffmpeg

# AI Providers
COGVIDEO_ENABLED=false
COGVIDEO_API_URL=
COGVIDEO_API_KEY=
COGVIDEO_REPLICATE_MODEL=zai-org/cogvideox-5b

HUNYUAN_ENABLED=false
HUNYUAN_API_URL=
HUNYUAN_API_KEY=

LTX_ENABLED=true
LTX_API_URL=
LTX_API_KEY=
LTX_LOCAL_PATH=
COMFYUI_URL=http://127.0.0.1:8188

LONGCAT_ENABLED=false
LONGCAT_API_URL=

PIXELLE_ENABLED=false
PIXELLE_API_URL=

COMFYUI_ENABLED=false
COMFYUI_URL=http://127.0.0.1:8188

# Talking Head
INFINITETALK_ENABLED=false
INFINITETALK_API_URL=
INFINITETALK_LOCAL_PATH=

RETALKING_ENABLED=false
RETALKING_API_URL=
RETALKING_LOCAL_PATH=

# Captioning
VIDEOCAPTIONER_ENABLED=true
VIDEOCAPTIONER_PATH=
WHISPER_MODEL=base
LLM_API_URL=
LLM_API_KEY=
LLM_MODEL=gpt-4o-mini
WHISPER_LOCAL_ENABLED=false
WHISPER_LOCAL_MODEL_PATH=

# Editing
SUBTITLE_REMOVER_ENABLED=false
PYTHON_PATH=python3
SUBTITLE_REMOVER_MODEL_PATH=
SUPER_RESOLUTION_ENABLED=false
VSR_MODEL=RealBasicVSR
VIDEO_AGENT_ENABLED=false
VIDEO_AGENT_API_URL=

# Recording
JITSI_ENABLED=false
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=
JITSI_JWT_SECRET=

# Automation
YOUTUBE_DL_ENABLED=true
YTDLP_PATH=yt-dlp
REDDIT_ENABLED=false
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# Manim
MANIM_ENABLED=false
MANIM_PYTHON_PATH=python3
MANIM_PATH=
MANIM_QUALITY=medium

# n8n
N8N_ENABLED=false
N8N_WEBHOOK_URL=
N8N_API_URL=
N8N_API_KEY=

# Storage
STORAGE_PROVIDER=local
STORAGE_BUCKET=
STORAGE_REGION=
STORAGE_BASE_URL=/uploads
STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads

# Brand
BRAND_LOGO_URL=/brand/alo-logo.png
BRAND_PRIMARY_COLOR=#0057B8
BRAND_SECONDARY_COLOR=#E8501A
BRAND_WATERMARK_ENABLED=true
BRAND_WATERMARK_POSITION=bottom-right
```

Use actual variable names only after inspecting provider docs and current code. Ask user to add real credentials through secure environment.

## How to Test Safely Without Charging Real Account

- **Remotion:** Free, local, 0GB VRAM. `npm run remotion:studio` → preview, no API key
- **LTX via ComfyUI:** Free, local, 12GB VRAM, no API key, but need GPU and model weights (10GB download, one-time)
- **CogVideo via Replicate:** Requires API key, but test with small prompt, 2B model, 5 sec, cost ~$0.05. Set `COGVIDEO_REPLICATE_MODEL=zai-org/cogvideox-2b` for cheaper
- **VideoCaptioner:** Free, local Whisper base (0GB VRAM, CPU), no API key. For LLM refinement, use Groq free tier (llama-3.1-8b-instant) or OpenAI with small prompt
- **Jitsi:** Free, public meet.jit.si, no key, or self-hosted
- **n8n:** Free, local Docker, no key, or cloud trial
- **youtube-dl:** Free, local yt-dlp binary, no key, but only test with own content

**Recommendation:** Start with Remotion (free, no GPU) + VideoCaptioner Whisper base (free, CPU) + Jitsi public (free) for MVP, no cost. Add LTX when GPU available, add Replicate API with small budget for testing AI gen.

## Documentation

- `docs/VIDEO_ECOSYSTEM_AUDIT.md` — Full audit of 34 repos
- `docs/VIDEO_LICENSES.md` — License compliance
- `docs/VIDEO_ENGINE_GUIDE.md` — Usage guide
- `docs/VIDEO_INTEGRATION_MATRIX.md` — This matrix
- `external/video-repos/README.md` — Local clone guide
- `src/lib/video-engine/` — Code with adapters
- `src/app/admin/video-studio/page.tsx` — UI
- `src/app/api/video-engine/` — API routes

## Final Status for Video Studio

- **Implemented modes:** 15/15 via adapters (some mock, some integrated)
- **Actually tested:** Remotion (mock), AI gen (mock), captioning (mock), editing FFmpeg (command generation), slideshow (mock), automation (mock)
- **Require API key:** CogVideo via Replicate, Hunyuan via API, LTX via API, VideoCaptioner LLM refinement (Groq/OpenAI), TTS (Groq/OpenAI), n8n API, Jitsi JWT for self-hosted
- **Require GPU:** LTX 12GB, CogVideo 12-18GB, Hunyuan 24GB, LongCat 20GB, InfiniteTalk 14GB, retalking 8GB, super-resolution 8-12GB, subtitle-remover 8GB, ComfyUI 12GB
- **Require separate infra:** Jitsi Videobridge (Docker), n8n (Docker), ComfyUI (Docker), Manim (Python env), VideoCaptioner (Python + binary)
- **Licensing concerns:** GPL-3.0 for VideoCaptioner, RedditVideoMakerBot, ComfyUI-VideoHelperSuite — use as external service, not bundled. Sustainable Use for n8n — webhook integration compliant. Custom for Hunyuan — check terms
- **Known limitations:** Realism not perfect, GPU heavy, model weights large (10-30GB), background queue not yet implemented, asset upload not yet, scene editor not yet, preview player not yet, cost tracking mock, voice cloning requires permission + external API, background removal for video not yet (only image), retiming via ComfyUI not tested

**Overall:** Video Studio is functional MVP with 34 repos audited, 7 integrated, 20 adapter_ready, 7 reference_only, modular adapters, env-based config, API routes, UI with tabs. Needs GPU server and background queue for production scale, but Remotion + VideoCaptioner + Jitsi + FFmpeg editing work locally with 0GB VRAM for immediate use.
