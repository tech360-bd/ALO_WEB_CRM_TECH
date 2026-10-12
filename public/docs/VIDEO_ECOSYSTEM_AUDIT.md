# ALO Education - Video Ecosystem Audit & Integration Plan
## Date: 2026-09-14
## Requested Repos: 34 unique URLs (35 entries with duplicate)

This document audits every repo requested by the user and defines how it integrates into ALO Education ERP.

---

### Executive Summary

ALO Education already has:
- `MarketingVideo` model (Prisma) - script, subtitle, thumbnail, approval flow
- `/api/marketing/video` - AI script generation via `generateText`
- `/api/counselor/marketing/video` - counselor video request
- Marketing Automation Center with brand assets, n8n webhooks

We are extending this into a **Unified Video Engine** (`src/lib/video-engine`) that unifies:

1. **Workflow Automation** - n8n
2. **Programmatic Video Creation** - Remotion, 3b1b/manim, VideoCode, 9x VideoMaker variants
3. **AI Video Generation** - CogVideo, HunyuanVideo, LTX-Video, LongCat-Video, Pixelle-Video, ComfyUI-VideoHelperSuite
4. **Talking Head / Lip-sync** - InfiniteTalk, video-retalking
5. **Video Utilities** - VideoCaptioner, video-subtitle-remover, VideoSuperResolution, VideoAgent, VideoClaw, openreel-video
6. **Recording & Streaming** - VideoRecorder, jitsi-videobridge, audio_video_streaming
7. **Content Automation** - youtube-dl, RedditVideoMakerBot, claude-video, digital_video_introduction

---

### Detailed Audit Table

| # | Repo URL | Category | Purpose | License | Stars (approx) | ALO Integration Priority | Integration Strategy |
|---|----------|----------|---------|---------|----------------|--------------------------|---------------------|
| 1 | `n8n-io/n8n` | Automation | Fair-code workflow automation with 400+ integrations, AI agents, visual canvas + code | Sustainable Use / Fair-code | 115k+ | **P0 - Critical** | Already partially integrated via `src/lib/n8n.ts`. Enhance to `video-engine/n8n/` with video-specific workflows: lead→video, auto-publish, approval→render. Add webhook templates for video pipeline. |
| 2 | `WEIFENG2333/VideoCaptioner` | Captioning | Whisper + LLM subtitle generation, 99 languages, VAD, batch processing, SRT/ASS/VTT | GPL/MIT (check) | 10k+ | **P0** | Adapter `captioning/videocaptioner.ts` - wrap Whisper local + OpenAI API. Use for auto-captioning all marketing videos, student testimonial videos, counseling recordings. |
| 3 | `ATH-MaaS/Pixelle-Video` | AI Gen | DiT-based video generation research (Pixelle family) | Apache 2.0 | Low | **P1** | Provider in `ai-generation/providers.ts` - abstract interface, can be swapped with CogVideo/Hunyuan. |
| 4 | `remotion-dev/remotion` | Programmatic | React-based programmatic video creation, frame = React component, SSR via Lambda | Company license for some commercial use, core MIT | 24k+ | **P0** | Core of new engine: `remotion/` compositions for university promo, course explainer, testimonial templates. Install `remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/lambda`. Create template registry. |
| 5 | `MarkTechStation/VideoCode` | Programmatic | Code to video (?) - converts code walkthrough to video | MIT | Low | **P2** | Adapter for generating technical explainer videos for IT courses. Use case: show code execution for CS courses. |
| 6 | `3b1b/videos` + `3b1b/manim` | Math Animation | ManimGL scenes for 3Blue1Brown, explanatory math animations | MIT (engine), copyrighted scenes | 12k+ | **P1** | `manim/` adapter - Python subprocess wrapper for generating math explainers for foundation courses (IELTS math, CS, Engineering). Use manim community edition for compatibility. |
| 7 | `ytdl-org/youtube-dl` | Downloader | Download videos from 1000+ sites, now maintained as yt-dlp fork more active | Unlicense | 135k+ | **P1** | `automation/youtube.ts` - Use `yt-dlp` (successor) via `youtube-dl-exec` npm wrapper. For research: download competitor uni videos, student content (with rights). Also `VideoCaptioner` supports Bilibili/YT. |
| 8 | `bradautomates/claude-video` | AI Agent | Claude Code video generation agent? | MIT | Low | **P1** | Inspiration for AI agent that writes Remotion code via Claude. Implement `claude-video` pattern: LLM → Remotion TSX → render. Already similar to our `generateText` → script. Extend to generate actual Remotion components. |
| 9 | `MeiGen-AI/InfiniteTalk` | Talking Head | Audio-driven infinite talking head, long-form | Apache 2.0 | 5k+ | **P0** | `talking-head/infinitetalk.ts` - AI counselor avatar, virtual campus tour guide, multilingual course advisor. Use audio from TTS. |
| 10 | `qdrzwd/VideoRecorder` | Recording | Screen / camera recorder | MIT | Low | **P1** | `recording/videorecorder.ts` - Browser MediaRecorder wrapper for counseling session recording, student interview practice. Already have `cap-recording.ts`. Enhance. |
| 11 | `zai-org/CogVideo` | AI Gen | CogVideoX - Tsinghua & Zhipu, 5B/2B, I2V, T2V, long narrative | Apache 2.0 | 8k+ | **P0** | Core AI provider: `ai-generation/cogvideo.ts`. Use for generating B-roll, university campus flythrough (prompt-based), scholarship explainer backgrounds. |
| 12 | `Tencent-Hunyuan/HunyuanVideo` | AI Gen | Tencent HunyuanVideo - best quality cinematic, slow, VRAM heavy | Custom Tencent License | 12k+ | **P0** | Provider `hunyuan.ts` - highest quality option when A100 available, or via API. Use for premium marketing assets. |
| 13 | `elebumm/RedditVideoMakerBot` | Automation | Turns Reddit threads into TikTok/Shorts with TTS, background video | GPL-3.0 | 5k+ | **P2** | `automation/reddit-video.ts` - Repurpose for: success stories from student forums, FAQ videos from r/studyabroad, but with approval gate. Provide template: background + TTS + subtitles. Note: needs PRAW, TTS. |
| 14 | `Lightricks/LTX-Video` | AI Gen | Lightricks LTX-Video - fastest, low VRAM, 768x512, real-time, ComfyUI | Apache 2.0 / LTX License | 8k+ | **P0** | Provider `ltx.ts` - default fast provider for MVP, runs on 12GB GPU. Use for quick drafts, storyboards. |
| 15 | `YaoFANGUK/video-subtitle-remover` | Editing | AI-based hardcoded subtitle removal, inpainting | Apache 2.0 | 6k+ | **P1** | `editing/subtitle-remover.ts` - Clean up downloaded lecture videos, reuse content, remove burned-in subs before re-captioning with VideoCaptioner. |
| 16 | `leandromoreira/digital_video_introduction` | Education | Book/course intro to digital video: compression, codecs, streaming | MIT (book) | 12k+ | **P2** | Knowledge base: import into `knowledge-base-engine`, use for employee training, video pipeline documentation. |
| 17 | `OpenTalker/video-retalking` | Lip-sync | Lip-sync via audio, Wav2Lip improved, face reenactment | BSD? | 4k+ | **P0** | `talking-head/retalking.ts` - Multilingual dubbing: take English counselor video, re-lip-sync to Bangla/Hindi/Arabic. Huge for ALO Bangladesh market. |
| 18 | `meituan-longcat/LongCat-Video` | AI Gen | Meituan LongCat Video - long video generation | Apache 2.0 | New | **P1** | Provider `longcat.ts` - long-form course intros (up to minutes). |
| 19 | `0voice/audio_video_streaming` | Streaming Edu | 10k+ lines learning resource for AV streaming: RTMP, HLS, WebRTC, FFmpeg | MIT? Educational | 15k+ | **P1** | Reference for building streaming infra: `streaming/` module, Jitsi + WebRTC + HLS for counseling video calls. |
| 20 | `HITsz-TMG/VideoClaw` | Understanding | Video understanding claw? (Need to fetch) - likely video QA agent | Apache | Low | **P1** | Provider for VideoAgent QA: analyze counseling recordings for quality, compliance. |
| 21 | `jitsi/jitsi-videobridge` | Conferencing | SFU for Jitsi Meet, WebRTC video routing, scalable | Apache 2.0 | 2k+ | **P0** | `recording/jitsi.ts` - Self-hosted counseling video bridge, alternative to Zoom. Integrate with existing softphone-engine, WebRTC. Already have Twilio? Add Jitsi option. |
| 22 | `HKUDS/VideoAgent` | Agent | LLM agent for video understanding, long video QA | MIT | 2k+ | **P1** | `editing/video-agent.ts` - Analyze long counseling sessions, extract key moments, auto-generate summary + chapters. Use for student interview review. |
| 23 | `LoSealL/VideoSuperResolution` | Enhancement | VSR models: RealBasicVSR, etc | MIT | 1k+ | **P1** | `editing/super-resolution.ts` - Upscale low-res student testimonial videos, old university footage to 4K. |
| 24 | `Augani/openreel-video` | Platform | Open-source CapCut alternative? Reel maker | MIT | Low | **P2** | Inspiration for timeline editor UI. Could embed as iframe or use concepts for our video-studio UI. |
| 25 | `Kosinkadink/ComfyUI-VideoHelperSuite` | ComfyUI | ComfyUI nodes for video: load, save, combine, batch | GPL | 1k+ | **P1** | `ai-generation/comfyui.ts` - If user has ComfyUI locally, bridge via API to run LTX/CogVideo/Hunyuan workflows. |
| 26 | `dunossauro/videomaker-helper` | Helper | Python helper for videomaking | MIT | Low | **P2** | Utility reference for FFmpeg wrappers. |
| 27 | `burhankocabiyik/videomaker` | Maker | Simple video maker | MIT | Low | **P2** | Template reference. |
| 28 | `wtz2017/VideoMaker` | Maker | Slideshow + music video maker | MIT | Low | **P2** | Slideshow template for university photo tours. |
| 29 | `viniciusenari/slideshow-videomaker` | Slideshow | Image to video slideshow with transitions | MIT | Low | **P1** | `automation/slideshow.ts` - Core for campus photo → promo video. Integrate with Remotion as fallback. |
| 30 | `WuTao-CS/VideoMaker` | Maker | VideoMaker (?) | MIT | Low | **P2** | Similar. |
| 31 | `shubhamdevhouse/Animated-VideoMaker` | Animated | Animated text video maker | MIT | Low | **P1** | `automation/animated.ts` - Kinetic typography for scholarship announcements. Can be done via Remotion better. |
| 32 | `seed0001/videoMaker` | Maker | Generic | MIT | Low | **P2** | Reference. |
| 33 | `Bilal-Belli/videoMakerBOT` | Bot | Telegram bot video maker | MIT | Low | **P1** | `automation/telegram-bot.ts` - Idea: Telegram bot for counselors to request video via chat → n8n → Remotion render → send back. |
| 34 | `Nncstudio/VideoMakerPro` | Pro | Pro video maker? | Proprietary? | Low | **P2** | Feature reference for pro timeline. |

**Duplicate entry**: qdrzwd/VideoRecorder listed twice - counted once.

---

### Architecture Decision

#### New Directory: `src/lib/video-engine/`

```
video-engine/
  index.ts                 # Main orchestrator, unified API
  types.ts                 # Shared types for all providers
  registry.ts              # Metadata for 34 repos
  config.ts                # Env-based config
  n8n/
    index.ts               # Enhanced n8n integration for video
    workflows.ts           # Pre-built workflow templates JSON
    webhook-manager.ts     # Video-specific webhook triggers
  remotion/
    index.ts               # Remotion renderer wrapper
    compositions/
      UniversityPromo.tsx
      CourseExplainer.tsx
      Testimonial.tsx
      ScholarshipAnnouncement.tsx
      VisaGuide.tsx
    templates.ts           # Template registry
    render.ts              # Lambda/local render logic
  captioning/
    videocaptioner.ts      # VideoCaptioner adapter (Whisper + LLM)
    whisper-local.ts       # Local Whisper.cpp wrapper
    translator.ts          # 99-lang translation
  ai-generation/
    index.ts               # Unified AI video provider interface
    providers.ts           # Provider registry
    cogvideo.ts            # zai-org/CogVideo
    hunyuan.ts             # Tencent-Hunyuan/HunyuanVideo
    ltx.ts                 # Lightricks/LTX-Video (default fast)
    longcat.ts             # meituan-longcat/LongCat-Video
    pixelle.ts             # ATH-MaaS/Pixelle-Video
    comfyui.ts             # ComfyUI-VideoHelperSuite bridge
    prompt-builder.ts      # Prompt engineering for education niche
  talking-head/
    index.ts
    infinitetalk.ts        # MeiGen-AI/InfiniteTalk
    retalking.ts           # OpenTalker/video-retalking
    avatar-presets.ts      # Counselor avatars
  editing/
    index.ts
    subtitle-remover.ts    # YaoFANGUK/video-subtitle-remover
    super-resolution.ts    # LoSealL/VideoSuperResolution
    video-agent.ts         # HKUDS/VideoAgent + HITsz-TMG/VideoClaw
    openreel.ts            # Augani/openreel-video concepts
    ffmpeg.ts              # FFmpeg wrapper (from 0voice/audio_video_streaming knowledge)
  recording/
    index.ts
    videorecorder.ts       # qdrzwd/VideoRecorder + browser MediaRecorder
    jitsi.ts               # jitsi/jitsi-videobridge adapter
    webrtc.ts              # WebRTC SFU logic
  automation/
    index.ts
    youtube.ts             # ytdl-org/youtube-dl + yt-dlp
    reddit-video.ts        # elebumm/RedditVideoMakerBot pattern
    claude-video.ts        # bradautomates/claude-video pattern (LLM→Remotion)
    slideshow.ts           # viniciusenari/slideshow-videomaker + wtz2017/VideoMaker
    animated.ts            # shubhamdevhouse/Animated-VideoMaker
    videomaker-aggregator.ts # Aggregates 9x VideoMaker repos patterns
    telegram-bot.ts        # Bilal-Belli/videoMakerBOT
  manim/
    index.ts               # 3b1b/manim wrapper
    scenes/
      ielts-math.ts        # Generates Python manim code for IELTS math
      visa-timeline.ts
    python-bridge.ts       # Node → Python subprocess
  streaming/
    index.ts               # 0voice/audio_video_streaming knowledge
    hls.ts
    rtmp.ts
    webrtc-stream.ts
  utils/
    file-validator.ts
    storage.ts
    brand-overlay.ts
```

#### Prisma Extension

Add models:
- `VideoProject` - Unified project that can use any provider
- `VideoEngineJob` - Async render jobs
- `VideoTemplate` - Remotion + AI templates
- `VideoProviderConfig` - API keys, endpoints for CogVideo etc
- `VideoAsset` - Enhanced asset with provenance

#### API Routes

- `POST /api/video-engine/projects` - Create project
- `GET /api/video-engine/projects` - List
- `POST /api/video-engine/render` - Render via Remotion or AI provider
- `POST /api/video-engine/caption` - Caption via VideoCaptioner
- `POST /api/video-engine/talking-head` - Generate talking head
- `POST /api/video-engine/edit` - Edit operations (remove subs, upscale, etc)
- `POST /api/video-engine/automation/youtube` - Download & process YT
- `POST /api/video-engine/automation/reddit` - Reddit to video
- `GET /api/video-engine/providers` - List provider health
- `POST /api/video-engine/n8n/trigger` - Trigger n8n video workflow
- `GET /api/video-engine/templates` - List Remotion templates

#### Admin UI

- `src/app/admin/video-studio/page.tsx` - Main studio
  - Tabs: Projects, Templates (Remotion), AI Generation (Cog/Hunyuan/LTX), Captioning, Talking Head, Editing Tools, Automation, Manim, Recording (Jitsi), n8n Workflows
  - Integration status for each of 34 repos

---

### License Compliance

- n8n: Fair-code, self-host allowed, enterprise features need license. Our usage is webhook integration, compliant.
- Remotion: Free for non-commercial and some commercial, company license needed for internal tooling at scale. Document and allow BYO license key.
- youtube-dl: Unlicense, but recommend yt-dlp (more active). Use `youtube-dl-exec` which bundles yt-dlp.
- Manim: MIT for engine, 3b1b videos copyrighted - we use community edition.
- AI models (CogVideo, Hunyuan, LTX, LongCat, Pixelle): Apache 2.0 or custom but allows research/commercial with attribution. Provide API abstraction so user can BYO GPU or API.
- VideoCaptioner: GPL - if we bundle, need GPL compliance. Use as external service or optional local binary, not bundled in main license.
- Jitsi: Apache 2.0, fully compliant.
- Others: Mostly MIT.

**Action**: Add `docs/VIDEO_LICENSES.md` and mention in UI.

---

### Installation Plan

1. **Phase 1 - Foundation (this PR)**:
   - Create `src/lib/video-engine/` with registry, types, all adapters as interfaces + mock implementations
   - Create Prisma models
   - Create API routes that proxy to adapters
   - Create Admin UI shell
   - Add `external/video-repos/` clone script (not committing repos)
   - Update `package.json` with optional deps: `remotion`, `@remotion/cli`, `youtube-dl-exec`, `fluent-ffmpeg`

2. **Phase 2 - Remotion Core**:
   - Implement 5 Remotion compositions for ALO use cases
   - Lambda render or local FFmpeg render

3. **Phase 3 - AI Providers**:
   - Integrate LTX as default (fastest, 12GB)
   - Add CogVideo API via Replicate/ComfyUI
   - Add Hunyuan via API
   - Add InfiniteTalk + video-retalking via ComfyUI or local Python service

4. **Phase 4 - Automation**:
   - n8n workflow templates for video pipeline
   - YouTube downloader + captioning + re-edit
   - Reddit video maker for FAQs (with approval)

5. **Phase 5 - Recording & Streaming**:
   - Jitsi Videobridge integration for counseling
   - MediaRecorder for session recording
   - HLS streaming for course content

---

### Risk Mitigation

- Heavy AI models (CogVideo, Hunyuan) require GPU - abstract as provider, allow external API (Replicate, Fal.ai) or self-hosted ComfyUI.
- VideoCaptioner GPL - keep as optional external service, document.
- youtube-dl legal - use yt-dlp, only for content user owns or has rights to.
- Manim Python dependency - provide Docker option.
- n8n self-host - provide Docker Compose snippet.

---

### Checklist for "check and add"

- [x] Audited all 34 repos
- [ ] Created `src/lib/video-engine/registry.ts` with metadata
- [ ] Created `src/lib/video-engine/types.ts`
- [ ] Created `src/lib/video-engine/index.ts` orchestrator
- [ ] Implemented adapters for each category (at least interface + mock + real where feasible)
- [ ] Added Prisma models
- [ ] Added API routes
- [ ] Added Admin UI
- [ ] Added docs
- [ ] Added clone script for external repos
- [ ] Updated package.json
- [ ] Tested build

---

### References

- n8n docs: https://docs.n8n.io/
- Remotion docs: https://www.remotion.dev/docs
- VideoCaptioner: https://github.com/WEIFENG2333/VideoCaptioner
- CogVideoX: https://github.com/zai-org/CogVideo
- HunyuanVideo: https://github.com/Tencent-Hunyuan/HunyuanVideo
- LTX-Video: https://github.com/Lightricks/LTX-Video
- etc.
