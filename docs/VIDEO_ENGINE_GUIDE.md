# ALO Video Engine — Usage Guide
## Unified Engine for 34 Repos
## Date: 2026-09-14

---

## Overview

ALO Video Engine (`src/lib/video-engine`) unifies 34 external video repos into a single orchestrator for ALO Education ERP.

**Goal**: Marketing automation, counseling recordings, content creation, education.

---

## Quick Start

### 1. Install Optional Dependencies

```bash
# Remotion (programmatic video with React)
npm install remotion @remotion/cli @remotion/player @remotion/lambda

# YouTube downloader (yt-dlp wrapper)
npm install youtube-dl-exec

# FFmpeg (required for all video ops)
# Ubuntu: sudo apt install ffmpeg
# Mac: brew install ffmpeg
```

### 2. Environment

Copy from `.env.example` and set:

```env
# Video Engine
REMOTION_ENABLED=true
LTX_ENABLED=true
VIDEOCAPTIONER_ENABLED=true
YOUTUBE_DL_ENABLED=true
N8N_ENABLED=true
N8N_WEBHOOK_URL=https://your-n8n/webhook/...

# Optional AI providers
COGVIDEO_ENABLED=false
HUNYUAN_ENABLED=false
COMFYUI_ENABLED=false
COMFYUI_URL=http://127.0.0.1:8188
```

### 3. Clone External Repos (Optional, for reference)

```bash
bash external/video-repos/clone-all.sh
# Clones 34 repos shallow into external/video-repos/ (gitignored)
```

---

## Architecture

```
src/lib/video-engine/
  index.ts                 # VideoEngine class, singleton getVideoEngine()
  types.ts                 # Shared types
  registry.ts              # 34 repos metadata
  config.ts                # Env config
  n8n/                     # n8n-io/n8n — 7 workflow templates
  remotion/                # remotion-dev/remotion — 10 compositions
    compositions/
      UniversityPromo.tsx  # Data-driven uni promo
      CourseExplainer.tsx  # Course details
      Testimonial.tsx      # Student testimonial (vertical)
      ScholarshipAnnouncement.tsx # Kinetic typography
      VisaGuide.tsx        # Timeline animation
  captioning/              # WEIFENG2333/VideoCaptioner — Whisper + LLM, 99 langs
  ai-generation/           # CogVideo, Hunyuan, LTX, LongCat, Pixelle, ComfyUI
  talking-head/            # InfiniteTalk, video-retalking — avatar + lip-sync
  editing/                 # subtitle-remover, super-resolution, VideoAgent, etc
  recording/               # VideoRecorder (MediaRecorder) + Jitsi Videobridge
  automation/              # youtube-dl, RedditVideoMakerBot, claude-video, VideoMakers
  manim/                   # 3b1b/manim — math animations
  streaming/               # 0voice/audio_video_streaming — HLS/RTMP/WebRTC
  utils/                   # brand-overlay, storage
```

---

## API Routes

### Projects

```bash
# Create project
POST /api/video-engine/projects
{
  "title": "UK Scholarship 2027",
  "category": "scholarship",
  "providerId": "remotion",
  "templateId": "ScholarshipAnnouncement",
  "durationSec": 15,
  "language": "english",
  "script": "£5000 scholarship at University of Manchester..."
}

# List
GET /api/video-engine/projects?category=scholarship&limit=20
```

### Render

```bash
# Remotion
POST /api/video-engine/render
{
  "providerId": "remotion",
  "compositionId": "UniversityPromo",
  "inputProps": { "universityName": "University of Manchester", "country": "UK" }
}

# AI (LTX fast)
POST /api/video-engine/render
{
  "providerId": "ltx",
  "prompt": "UK university campus cinematic, students, 2027 intake",
  "durationSec": 5,
  "aspectRatio": "16:9",
  "resolution": "720p"
}

# AI with fallback (try LTX, then CogVideo, then Hunyuan)
# Uses generateWithFallback internally
```

### Captioning (VideoCaptioner)

```bash
POST /api/video-engine/caption
{
  "videoUrl": "/uploads/videos/xxx.mp4",
  "language": "en",
  "targetLanguages": ["bn", "en"],
  "useLLMRefinement": true
}
# Returns: srtUrl, vttUrl, segments[], translated{}
```

### Talking Head

```bash
# InfiniteTalk - audio-driven avatar
POST /api/video-engine/talking-head
{
  "providerId": "infinitetalk",
  "audioText": "Hello, I'm your ALO counselor...",
  "referenceImageUrl": "/avatars/counselor-bn-f.jpg",
  "language": "bn",
  "avatarPreset": "counselor_bangla_female"
}

# video-retalking - lip-sync for dubbing
POST /api/video-engine/talking-head
{
  "providerId": "retalking",
  "referenceVideoUrl": "/uploads/videos/english_counselor.mp4",
  "audioText": "Translated Bangla audio text...",
  "language": "bn"
}

# List avatar presets
GET /api/video-engine/talking-head
```

### Editing

```bash
# Remove hardcoded subtitles (YaoFANGUK/video-subtitle-remover)
POST /api/video-engine/edit
{
  "operation": "remove_subtitles",
  "videoUrl": "/uploads/videos/lecture_with_subs.mp4",
  "subtitleArea": { "x": 0, "y": 800, "w": 1920, "h": 200 }
}

# Super-resolution (LoSealL/VideoSuperResolution)
POST /api/video-engine/edit
{
  "operation": "super_resolution",
  "videoUrl": "/uploads/videos/low_res.mp4",
  "targetResolution": "4K",
  "model": "RealBasicVSR"
}

# Analyze via VideoAgent (HKUDS/VideoAgent + HITsz/VideoClaw)
POST /api/video-engine/edit
{
  "operation": "analyze",
  "videoUrl": "/uploads/recordings/counseling_123.mp4",
  "prompt": "Summarize counseling session, extract action items, compliance check"
}

# Generic FFmpeg: trim, merge, brand_overlay, compress
POST /api/video-engine/edit
{
  "operation": "brand_overlay",
  "videoUrl": "/uploads/videos/promo.mp4",
  "options": { "logoUrl": "/brand/alo-logo.png", "position": "bottom-right" }
}
```

### Automation

```bash
# YouTube download (ytdl-org/youtube-dl / yt-dlp)
POST /api/video-engine/automation
{
  "type": "youtube",
  "url": "https://youtube.com/watch?v=...",
  "hasRights": true,
  "purpose": "own_content_reedit",
  "quality": "720p"
}

# Reddit-style video (elebumm/RedditVideoMakerBot pattern) for ALO FAQ/success stories
POST /api/video-engine/automation
{
  "type": "reddit",
  "source": "faq_db",
  "title": "What is UK visa fee?",
  "customText": "UK student visa fee is £490 plus IHS...",
  "voice": "bengali_female",
  "language": "mixed"
}

# Slideshow (viniciusenari/slideshow-videomaker)
POST /api/video-engine/automation
{
  "type": "slideshow",
  "images": [{ "url": "/images/campus1.jpg", "durationSec": 3 }, { "url": "/images/campus2.jpg", "durationSec": 3 }],
  "transition": "ken_burns",
  "aspectRatio": "16:9",
  "resolution": "1080p"
}

# Animated text (shubhamdevhouse/Animated-VideoMaker)
POST /api/video-engine/automation
{
  "type": "animated",
  "texts": ["Study in UK", "2027 Intake Open", "Scholarships Available"],
  "animation": "kinetic",
  "backgroundColor": "#0057B8",
  "textColor": "#FFFFFF"
}

# Claude-Video (bradautomates/claude-video) - LLM → Remotion code
POST /api/video-engine/automation
{
  "type": "claude_video",
  "prompt": "Create UK scholarship video for 2027 intake, 30s, 16:9, with ALO branding",
  "durationSec": 30,
  "aspectRatio": "16:9",
  "includeBrand": true
}
```

### Providers Health

```bash
GET /api/video-engine/providers
# Returns health of all 34 repos providers, registry, stats, config
```

### Templates

```bash
GET /api/video-engine/templates
GET /api/video-engine/templates?category=scholarship
# Returns Remotion compositions, Manim templates, AI presets, talking-head use cases, n8n workflows
```

### n8n Workflows

```bash
GET /api/video-engine/n8n
# List 7 pre-built workflow templates

POST /api/video-engine/n8n
{
  "action": "create_from_template",
  "templateId": "lead-to-video"
}

POST /api/video-engine/n8n
{
  "action": "trigger",
  "event": "video.project.approved",
  "data": { "projectId": "vid_123", "outputUrl": "..." }
}
```

---

## n8n Workflow Templates (7)

1. **lead-to-video**: Lead created → personalized Remotion video → WhatsApp
2. **video-approval-publish**: Video approved → publish to FB, IG, YouTube + calendar
3. **counseling-recording-pipeline**: Recording completed → caption → VideoAgent summary → CRM note
4. **faq-to-video**: Cron daily → top 3 FAQs → Remotion videos → approval queue
5. **youtube-research**: Manual → download competitor video (rights check) → caption → analysis
6. **ai-video-batch**: LTX fast draft → human review → Hunyuan premium if approved
7. **talking-head-multilingual**: Approved EN video → translate → lip-sync to BN/HI/AR via video-retalking

See `src/lib/video-engine/n8n/index.ts`

---

## Remotion Compositions (10)

- **UniversityPromo**: Data-driven uni promo with logo, ranking, courses, CTA, personalized studentName
- **CourseExplainer**: Course details, fees, duration, scholarship, modules, intake
- **Testimonial**: Vertical 1080x1920 for Reels/TikTok, photo, quote, rating
- **ScholarshipAnnouncement**: Kinetic typography, amount, eligibility, deadline
- **VisaGuide**: Timeline animation for visa steps (inspired by 3b1b/manim)
- **CampusTourSlideshow**: Ken Burns slideshow from viniciusenari pattern
- **IELTSMath**: Math explainer (Manim-style in Remotion)
- **SuccessStoryRedditStyle**: Background video + TTS + subs (RedditVideoMakerBot style for ALO stories)
- **FAQShort**: 15s vertical FAQ
- **AnimatedText**: Kinetic typography from Animated-VideoMaker

---

## AI Providers Comparison

| Provider | Repo | VRAM | Quality | Speed | Best For |
|----------|------|------|---------|-------|----------|
| LTX-Video | Lightricks/LTX-Video | 12GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ (45s) | Fast drafts, MVP, 12GB GPU |
| CogVideoX | zai-org/CogVideo | 18GB | ⭐⭐⭐⭐ | ⭐⭐⭐ (8min) | Long narrative, text accuracy |
| HunyuanVideo | Tencent-Hunyuan/HunyuanVideo | 24GB | ⭐⭐⭐⭐⭐ | ⭐ (15min) | Premium cinematic, A100 |
| LongCat-Video | meituan-longcat/LongCat-Video | 20GB | ⭐⭐⭐⭐ | ⭐⭐ | Long videos, minutes |
| Pixelle-Video | ATH-MaaS/Pixelle-Video | 16GB | ⭐⭐⭐ | ⭐⭐⭐ | Research |
| ComfyUI | Kosinkadink/ComfyUI-VideoHelperSuite | 12GB | ⭐⭐⭐⭐ | ⭐⭐⭐ | Node workflows, bridge |

**Default**: LTX-Video (fastest, runs on RTX 3060 12GB)

**Fallback chain**: LTX → CogVideo → Hunyuan (via `generateWithFallback`)

---

## Talking Head

### InfiniteTalk (MeiGen-AI/InfiniteTalk)

Audio-driven infinite talking head, long-form.

**ALO Use Cases**:
- AI counselor avatar (Bangla/English, 24/7)
- Campus tour guide
- Personalized video message (studentName + uni + course)
- Visa officer avatar

**Avatar Presets**: `counselor_bangla_female`, `counselor_english_male`, `counselor_english_female`, `campus_guide`, `visa_officer`

### video-retalking (OpenTalker/video-retalking)

Lip-sync via audio, multilingual dubbing.

**ALO Use Cases**:
- English counselor video → Bangla/Hindi/Arabic lip-sync (huge for BD market)
- Personalized: same video, different language audio

**Workflow**:
1. Record English counselor video
2. Translate voiceover script via LLM
3. TTS to target language audio
4. video-retalking lip-sync
5. Output: Bangla video with correct lip movement

---

## Captioning (VideoCaptioner)

**Repo**: WEIFENG2333/VideoCaptioner

**Features**:
- Whisper local or API (free, fast)
- LLM intelligent segmentation (max 20 words, natural reading)
- 99-language translation
- VAD + speaker diarization
- Batch processing
- SRT/ASS/VTT/TXT + style templates

**ALO Use Cases**:
- Auto-caption all marketing videos (BN/EN/mixed)
- Caption counseling recordings for compliance
- Translate testimonials to 99 languages
- Generate SRT for Remotion compositions

---

## Editing Tools

### video-subtitle-remover (YaoFANGUK)

AI hardcoded subtitle removal via inpainting.

Use: Clean lecture videos with burned-in subs before re-captioning with VideoCaptioner.

### VideoSuperResolution (LoSealL)

VSR models: RealBasicVSR, RealESRGAN, BasicVSR, SwinIR.

Use: Upscale low-res student testimonials (phone) to 4K, old university footage.

### VideoAgent (HKUDS) + VideoClaw (HITsz)

LLM agent for long video QA, chapter generation, summary, compliance check.

**ALO Use Cases**:
- 1-hour counseling session → summary + chapters + action items
- Student interview review: auto-detect weak answers
- Compliance: did counselor mention visa requirements?

### openreel-video (Augani)

Open-source CapCut/Reels alternative, timeline editor.

Use: Inspiration for timeline UI, converter: OpenReel timeline → Remotion component via `timelineToRemotionComposition()`.

---

## Recording & Streaming

### VideoRecorder (qdrzwd/VideoRecorder)

Browser MediaRecorder pattern: screen + camera + audio → upload.

**ALO Workflow** (see `COUNSELING_RECORDING_WORKFLOW`):
1. Counselor clicks "Start Recording" with consent checkbox
2. Browser MediaRecorder captures
3. On stop, upload to `/api/video-engine/recording`
4. Trigger n8n: video.recording.completed
5. Auto-caption via VideoCaptioner
6. Analyze via VideoAgent
7. Save to CRM

### Jitsi Videobridge (jitsi/jitsi-videobridge)

SFU for Jitsi Meet, self-hosted Zoom alternative.

**ALO Use Cases**:
- 1:1 counseling video call (with Jibri recording)
- Group visa interview prep (10 students)
- Webinar university fair (50+ students, RTMP to YouTube Live)

**Config**: See `JITSI_IFRAME_CONFIG` for toolbar, branding.

---

## Automation

### youtube-dl / yt-dlp (ytdl-org/youtube-dl)

Download from 1000+ sites via `youtube-dl-exec` npm wrapper.

**Compliance**: Only own content or with permission. `hasRights` boolean required, purpose logged.

### RedditVideoMakerBot (elebumm/RedditVideoMakerBot)

Pattern: TTS + background video (Minecraft parkour) + subtitles → TikTok/Shorts.

**ALO Adaptation**: FAQ DB / success stories → short video with TTS + campus B-roll + subs, via Remotion composition `SuccessStoryRedditStyle` / `FAQShort`.

### claude-video (bradautomates/claude-video)

Pattern: LLM → Remotion TSX code → render. More controllable than direct video gen because intermediate is code that can be inspected, edited, versioned, re-rendered with different props.

**Example**: Counselor types "Create UK scholarship video for 2027 intake" → LLM generates Remotion component → render.

### VideoMaker Aggregator (9 repos)

Aggregates 9 VideoMaker repos patterns into unified interface, implemented via superior Remotion + FFmpeg.

- slideshow-videomaker (viniciusenari) — core slideshow with transitions
- VideoMaker (wtz2017) — slideshow+music
- videomaker (burhankocabiyik) — image+audio→video
- VideoMaker (WuTao-CS), videoMaker (seed0001) — generic
- Animated-VideoMaker (shubhamdevhouse) — kinetic typography → Remotion
- videoMakerBOT (Bilal-Belli) — Telegram bot → n8n → Remotion → Telegram send
- VideoMakerPro (Nncstudio) + openreel-video (Augani) — pro timeline inspiration

### Telegram Bot (videoMakerBOT)

`/video <type> <description>` → n8n → Remotion → send back video.

---

## Manim (3b1b)

Math animation engine for explanatory videos.

**Templates**:
- **ielts_math**: Percentage, scholarship calculation
- **visa_timeline**: Timeline animation
- **scholarship_calc**: Fees - scholarship = you pay

Generates Python code that runs via `manim` CLI.

---

## Streaming (0voice + digital_video_introduction)

Knowledge from `0voice/audio_video_streaming` (10k+ lines) + book `leandromoreira/digital_video_introduction`.

**Concepts**: HLS (.m3u8 + .ts), DASH, RTMP (ingest), WebRTC (calls, <500ms), codecs H264/H265/VP9/AV1, containers MP4/WebM/MKV, GOP, bitrate, CRF, keyframe.

**ALO Use Cases**:
- Course content HLS adaptive (1080p/720p/480p)
- Counseling WebRTC via Jitsi SFU
- Webinar RTMP to YouTube Live
- Recordings HLS for efficient playback

**Commands**: See `buildHLSCommand()`, `buildRTMPCommand()`, `buildAdaptiveHLSCommand()` in `streaming/index.ts`

---

## Admin UI

`src/app/admin/video-studio/page.tsx`

Tabs:
- Overview & Health — provider health for 34 repos, stats
- Remotion — render compositions, claude-video LLM→code
- AI Generation — LTX/CogVideo/Hunyuan/LongCat/Pixelle/ComfyUI
- Captioning — VideoCaptioner 99 langs
- Talking Head — InfiniteTalk + video-retalking + avatars
- Editing Tools — subtitle-remover, super-resolution, VideoAgent
- Automation — youtube-dl, RedditVideoMakerBot, VideoMakers, Telegram bot, n8n workflows
- Recording & Jitsi — MediaRecorder + Jitsi Meet
- 34 Repos Registry — full audit table

---

## Prisma Models

- `VideoProject` — unified project
- `VideoEngineJob` — async jobs
- `VideoTemplate` — Remotion + Manim templates
- `VideoProviderConfig` — provider configs, health
- `VideoAsset` — assets
- `VideoCaption` — captions
- `VideoRecording` — recordings
- `VideoAnalytics` — views, leads, etc

---

## Next Steps (Phase 2-5)

- **Phase 2**: Implement 5 Remotion compositions as real React components (currently placeholder entry.ts), Lambda render
- **Phase 3**: Integrate LTX local via ComfyUI, CogVideo via Replicate API, Hunyuan via API
- **Phase 4**: n8n Docker Compose, YouTube downloader + captioning pipeline, Reddit FAQ batch
- **Phase 5**: Jitsi self-host, Jibri recording, HLS streaming, Telegram bot webhook

---

## References

- Full audit: `docs/VIDEO_ECOSYSTEM_AUDIT.md`
- Licenses: `docs/VIDEO_LICENSES.md`
- Registry: `src/lib/video-engine/registry.ts`
- External clone: `external/video-repos/clone-all.sh`
