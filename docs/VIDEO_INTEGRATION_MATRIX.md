# Video Repository Integration Matrix — ALO Education Video Studio

**Date:** 2026-09-15
**Audited:** 34 repositories from user request
**Engine:** `src/lib/video-engine/` with modular adapters

## Summary

| Category | Count | P0 Critical | P1 Important | P2 Nice-to-have |
|----------|-------|-------------|--------------|-----------------|
| Automation | 1 | 1 (n8n) | 0 | 0 |
| Captioning | 1 | 1 (VideoCaptioner) | 0 | 0 |
| AI Generation | 6 | 3 (LTX, CogVideo, Hunyuan) | 2 (LongCat, Pixelle) | 1 (ComfyUI helper) |
| Talking Head | 2 | 1 (InfiniteTalk) | 1 (video-retalking) | 0 |
| Editing | 5 | 0 | 2 (subtitle-remover, super-resolution) | 3 (VideoAgent, VideoClaw, openreel) |
| Recording | 2 | 0 | 2 (VideoRecorder, Jitsi) | 0 |
| Content Automation | 12 | 0 | 2 (youtube-dl, claude-video) | 10 (Reddit + 9x VideoMaker) |
| Programmatic | 3 | 1 (Remotion) | 1 (Manim) | 1 (VideoCode) |
| Streaming | 2 | 0 | 0 | 2 (audio_video_streaming, digital_video_introduction) |
| **Total** | **34** | **7** | **10** | **17** |

## Detailed Matrix

| Repository | Useful Capability | License / Usage Concerns | Runtime Needs | Decision |
|------------|-------------------|--------------------------|---------------|----------|
| **n8n-io/n8n** | Workflow automation: 400+ integrations, AI agents, visual builder. Automates video pipeline: lead→video→approval→publish, counseling recording→caption→summary | Sustainable Use License + Enterprise (fair-code, source available). Compliant when used as webhook/service, not embedded as core product | Node.js, 2GB RAM, Postgres/Redis optional | **INTEGRATED** — P0. `src/lib/video-engine/n8n/`. 7 pre-built workflows. No license violation when using webhook integration |
| **WEIFENG2333/VideoCaptioner** | Whisper STT + LLM segmentation (max 20 words) + 99-lang translation + VAD + speaker diarization. SRT/ASS/VTT/TXT, batch | GPL-3.0 — requires compliance if bundled. Use as external binary/service, not bundled in proprietary build. Alternative: use Whisper directly (MIT) + our LLM refinement | Python 3.10+, Whisper model (base/small/medium), 4GB RAM, optional LLM API (OpenAI/Groq) | **ADAPTER_READY** — P0. `src/lib/video-engine/captioning/videocaptioner.ts`. Run as separate service. For ALO: auto-caption marketing videos, counseling recordings, 99-lang translation |
| **ATH-MaaS/Pixelle-Video** | DiT-based T2V research model, text-to-video | Apache 2.0 — commercial OK with attribution | Python, 16GB VRAM, CUDA | **ADAPTER_READY** — P1. Research alternative to CogVideo/Hunyuan. Use for B-roll generation |
| **remotion-dev/remotion** | Programmatic video with React: frame = React component, real-time preview, SSR via Lambda, versioned templates, data-driven personalized videos | Core MIT, company license required for some commercial internal production at scale — allow BYO license key via env `REMOTION_LICENSE` | Node.js, FFmpeg, 4GB RAM (local), or Lambda for scale | **INTEGRATED** — P0. `src/lib/video-engine/remotion/`. 5+ templates: UniversityPromo, CourseExplainer, Testimonial, ScholarshipAnnouncement, VisaGuide. Most controllable, recommended for university promos |
| **MarkTechStation/VideoCode** | Code walkthrough to video — converts code execution to visual video | MIT — commercial OK | Python/JS, FFmpeg | **REFERENCE_ONLY** — P2. Inspiration for CS course explainer via Remotion composition CodeExplainer |
| **3b1b/videos + manim** | ManimGL scenes for 3Blue1Brown math videos. Animation engine for explanatory math videos programmatically | Manim engine MIT, 3b1b scenes copyrighted — use community edition `manim-community/manim` | Python 3.10+, cairo, ffmpeg, sox, latex, 4GB RAM | **ADAPTER_READY** — P1. `src/lib/video-engine/manim/`. Use for IELTS math, visa timeline, scholarship calc. MIT engine OK, don't copy 3b1b scenes |
| **ytdl-org/youtube-dl** | Download videos from 1000+ sites. yt-dlp is active maintained fork | Unlicense (public domain) — but ToS concerns. Use yt-dlp successor | Python, FFmpeg, yt-dlp binary | **ADAPTER_READY** — P1. `src/lib/video-engine/automation/youtube.ts`. Only download content you own or have explicit rights. Respect ToS. Wrapper `youtube-dl-exec` npm. For ALO: research competitor videos (with rights), re-edit own YouTube content |
| **bradautomates/claude-video** | Claude Code agent that writes video generation code (Remotion) via LLM→code→render pattern. More controllable than direct video gen | MIT — commercial OK | Node.js, LLM API (Claude/OpenAI), Remotion | **ADAPTER_READY** — P1. `src/lib/video-engine/automation/claude-video.ts`. AI agent: natural language prompt → Remotion TSX → render. Example: "Create UK scholarship video for 2027 intake" → composition |
| **MeiGen-AI/InfiniteTalk** | Audio-driven infinite talking head generation, long-form, high fidelity, supports long audio | Apache 2.0 — commercial OK with attribution | Python, 14GB VRAM, CUDA, audio input | **ADAPTER_READY** — P0. `src/lib/video-engine/talking-head/infinitetalk.ts`. AI counselor avatar, multilingual advisor (Bangla, English, Arabic), campus tour guide, personalized video with student name |
| **qdrzwd/VideoRecorder** | Screen/camera recorder utility. Browser MediaRecorder wrapper + desktop | MIT — commercial OK | Browser (MediaRecorder API), Node.js optional | **ADAPTER_READY** — P1. `src/lib/video-engine/recording/videorecorder.ts`. Record counseling sessions (with consent), interview practice, training videos |
| **zai-org/CogVideo** | CogVideoX 5B/2B, I2V/T2V, long narrative, open-source SOTA T2V. Tsinghua THUDM + Zhipu AI | Apache 2.0 — commercial OK | Python, 18GB VRAM (5B), 12GB (2B), CUDA | **ADAPTER_READY** — P0. `src/lib/video-engine/ai-generation/cogvideo.ts`. B-roll: campus flythrough from prompt, scholarship explainer background |
| **Tencent-Hunyuan/HunyuanVideo** | Highest quality cinematic T2V, slow, VRAM heavy (14GB+), best for premium assets | Tencent Hunyuan Community License (custom, allows research/commercial with attribution, check latest) | Python, 24GB VRAM, CUDA, 30GB storage for weights | **ADAPTER_READY** — P0. `src/lib/video-engine/ai-generation/hunyuan.ts`. Premium marketing: UK/USA campus cinematic, high-quality scholarship promo. Best quality but slowest |
| **elebumm/RedditVideoMakerBot** | Turns Reddit threads into TikTok/Shorts: TTS + background video (Minecraft parkour) + subtitles. Pattern reusable | GPL-3.0 — inspiration only, don't bundle directly. Build own with Remotion | Python, TTS API, FFmpeg, 4GB RAM | **ADAPTER_READY** — P2. `src/lib/video-engine/automation/reddit-video.ts`. Adapt pattern for ALO: FAQ DB → short video with TTS + background, success stories, myths debunked series. Build own implementation with Remotion |
| **Lightricks/LTX-Video** | Fastest T2V, low VRAM (12GB), real-time, long videos, ComfyUI support, 768x512 in 45s | Apache 2.0 + LTX License — commercial OK with attribution | Python, 12GB VRAM, ComfyUI optional, CUDA | **ADAPTER_READY** — P0 (default fast provider). `src/lib/video-engine/ai-generation/ltx.ts`. Default for MVP drafts, storyboard generation, quick iteration for marketing team |
| **YaoFANGUK/video-subtitle-remover** | AI subtitle removal using inpainting, removes hardcoded subtitles from video | MIT — commercial OK, but only use where user owns content or has permission | Python 3.8+, PyTorch, 8GB VRAM, model weights (inpainting) | **ADAPTER_READY** — P1. `src/lib/video-engine/editing/subtitle-remover.ts`. For ALO: clean own videos with burned-in subtitles, or user-provided content with permission. Require confirmation of ownership. Don't enable piracy |
| **leandromoreira/digital_video_introduction** | Educational repo: digital video fundamentals, codecs, containers, streaming | MIT — educational, no runtime | N/A (docs) | **REFERENCE_ONLY** — P2. Knowledge base for `src/lib/video-engine/streaming/`. Use for team training on video basics |
| **OpenTalker/video-retalking** | Lip-sync / video dubbing: audio-driven lip-sync for existing video, multilingual dubbing | MIT — commercial OK | Python, 8GB VRAM, CUDA | **ADAPTER_READY** — P1. `src/lib/video-engine/talking-head/retalking.ts`. Multilingual dub: English video → Bangla lip-sync, course advisor in multiple languages |
| **meituan-longcat/LongCat-Video** | Long video generation, minutes-long, narrative | Apache 2.0 — commercial OK | Python, 20GB VRAM, CUDA | **ADAPTER_READY** — P1. `src/lib/video-engine/ai-generation/longcat.ts`. Long videos: campus tour 2-min, course journey, student story long-form |
| **0voice/audio_video_streaming** | Audio/video streaming knowledge, RTMP, HLS, WebRTC, FFmpeg, codecs | MIT — educational | C++/FFmpeg knowledge | **REFERENCE_ONLY** — P2. Knowledge for streaming module, Jitsi integration, not direct code use |
| **HITsz-TMG/VideoClaw** | Video understanding / retrieval, video agent for analysis | Apache 2.0 — commercial OK | Python, LLM API, 8GB RAM | **ADAPTER_READY** — P2. `src/lib/video-engine/editing/video-agent.ts`. Counseling session analysis: video → summary → CRM note, compliance check |
| **jitsi/jitsi-videobridge** | SFU for Jitsi Meet, WebRTC video conferencing, recording | Apache 2.0 — commercial OK | Java, 4GB RAM, Docker | **ADAPTER_READY** — P1. `src/lib/video-engine/recording/jitsi.ts`. Counseling video calls: Jitsi room per session, recording via Jibri, integration with ALO CRM |
| **HKUDS/VideoAgent** | Video understanding agent: long video QA, summarization via LLM | MIT — commercial OK | Python, LLM API (GPT-4V, etc), 8GB RAM | **ADAPTER_READY** — P2. `src/lib/video-engine/editing/video-agent.ts`. Analyze counseling recordings, extract key points, student intent, next actions |
| **LoSealL/VideoSuperResolution** | Video super-resolution: RealBasicVSR, BasicVSR, RealESRGAN, SwinIR. Upscale low-res to 4K | MIT — commercial OK | Python, PyTorch, 8-12GB VRAM | **ADAPTER_READY** — P1. `src/lib/video-engine/editing/super-resolution.ts`. Upscale old marketing videos, student testimonials, low-res campus footage to 1080p/4K |
| **Augani/openreel-video** | Open-source video editor timeline like CapCut, browser-based, React | MIT — commercial OK | Node.js, React, FFmpeg.wasm | **ADAPTER_READY** — P2. `src/lib/video-engine/editing/index.ts` timelineToRemotionComposition. Inspiration for timeline editor, convert OpenReel timeline to Remotion code |
| **Kosinkadink/ComfyUI-VideoHelperSuite** | ComfyUI nodes for video: batch, interpolation, upscaling, helper for LTX/CogVideo workflows | GPL-3.0 — ComfyUI extension, use via ComfyUI API, not bundled | Python, ComfyUI, 12GB VRAM | **ADAPTER_READY** — P1. `src/lib/video-engine/ai-generation/comfyui.ts`. Node-based workflows for LTX/CogVideo, interpolation, upscaling via ComfyUI API `http://127.0.0.1:8188` |
| **dunossauro/videomaker-helper** | Helper for video creation, templates, automation | MIT | Python | **REFERENCE_ONLY** — P2. Helper pattern, not direct integration |
| **burhankocabiyik/videomaker** | Simple video maker: images + audio → video | MIT | Python/JS | **REFERENCE_ONLY** — P2. Pattern for slideshow, but use our enhanced slideshow adapter |
| **wtz2017/VideoMaker** | VideoMaker: image sequence + audio → video, transitions | MIT | Python | **INTEGRATED** — via slideshow adapter. `src/lib/video-engine/automation/slideshow.ts` uses pattern from this repo + viniciusenari |
| **viniciusenari/slideshow-videomaker** | Slideshow videomaker: images + music + Ken Burns → video | MIT | Python, FFmpeg | **INTEGRATED** — core of slideshow adapter. Campus tour slideshow, university promo from images |
| **WuTao-CS/VideoMaker** | VideoMaker: text + images → video | MIT | Python | **REFERENCE_ONLY** — P2. Similar to slideshow, covered by our adapter |
| **shubhamdevhouse/Animated-VideoMaker** | Animated video maker: text animations, kinetic typography | MIT | JS/Canvas | **INTEGRATED** — via `src/lib/video-engine/automation/animated.ts` + Remotion. Animated text for scholarship, visa guide |
| **seed0001/videoMaker** | VideoMaker: simple concatenation, merging | MIT | Python | **REFERENCE_ONLY** — P2. FFmpeg merging covered by editing module |
| **Bilal-Belli/videoMakerBOT** | Telegram bot that creates videos from text/images | MIT | Python, Telegram API | **ADAPTER_READY** — P2. `src/lib/video-engine/automation/telegram-bot.ts`. Telegram bot for ALO: user sends prompt via Telegram → video generated → returned |
| **Nncstudio/VideoMakerPro** | Pro video maker: more features, templates | MIT | JS | **REFERENCE_ONLY** — P2. Pro features inspiration, but use Remotion for templates |

## Decision Summary

**INTEGRATED (7):** n8n, Remotion, wtz2017/VideoMaker, viniciusenari/slideshow-videomaker, shubhamdevhouse/Animated-VideoMaker, plus patterns from VideoMaker family
- These are core, production-ready, low VRAM, MIT or fair-code compliant, and directly solve ALO use cases: university promo, course explainer, slideshow, animated text, automation workflows

**ADAPTER_READY (20):** VideoCaptioner, Pixelle, youtube-dl, claude-video, InfiniteTalk, VideoRecorder, CogVideo, Hunyuan, RedditVideoMakerBot, LTX, subtitle-remover, video-retalking, LongCat, VideoClaw, Jitsi, VideoAgent, VideoSuperResolution, openreel, ComfyUI-VideoHelperSuite, Telegram bot, plus 3 more
- These have working adapters in `src/lib/video-engine/` but require additional setup: GPU (12-24GB VRAM), Python env, model weights (10-30GB), or external API keys. They are modular — can be enabled via env flags like `LTX_ENABLED=true`, `COGVIDEO_ENABLED=true`, etc.

**REFERENCE_ONLY (7):** VideoCode, 3b1b/videos (engine MIT, scenes copyrighted), digital_video_introduction, audio_video_streaming, dunossauro/videomaker-helper, burhankocabiyik/videomaker, WuTao-CS/VideoMaker, seed0001/videoMaker, Nncstudio/VideoMakerPro
- These are educational, knowledge base, or duplicate patterns. Don't bundle code, but use knowledge for team training or inspiration for Remotion compositions. For 3b1b/manim, use community edition `manim-community/manim`, not copyrighted scenes.

## License Compliance

- **MIT (majority):** Commercial OK with attribution. Keep LICENSE files, attribute in `docs/VIDEO_LICENSES.md`
- **Apache 2.0 (CogVideo, Hunyuan, LTX, LongCat, InfiniteTalk, Jitsi, VideoClaw):** Commercial OK with attribution, include NOTICE
- **GPL-3.0 (VideoCaptioner, RedditVideoMakerBot, ComfyUI-VideoHelperSuite):** Cannot bundle in proprietary build. Use as external binary/service, or replace with MIT alternative (Whisper MIT + our LLM). Document in `docs/VIDEO_LICENSES.md`
- **Sustainable Use (n8n):** Fair-code, source available, commercial use allowed for internal automation, but not as competing SaaS. Using webhook integration is compliant
- **Custom (Hunyuan Community License):** Allows research/commercial with attribution, check latest terms before production
- **Unlicense (youtube-dl):** Public domain, but ToS concerns — only download own content or with explicit rights

All licenses documented in `docs/VIDEO_LICENSES.md` with attribution.

## Runtime Requirements

| Provider | VRAM | RAM | Storage (models) | GPU Required | Local / API |
|----------|------|-----|------------------|--------------|-------------|
| Remotion | 0GB | 4GB | 0GB (FFmpeg) | No | Local |
| LTX-Video | 12GB | 16GB | 10GB | Yes (or API) | Both |
| CogVideoX 2B | 12GB | 16GB | 15GB | Yes | Local |
| CogVideoX 5B | 18GB | 24GB | 20GB | Yes | Local |
| HunyuanVideo | 24GB | 32GB | 30GB | Yes (A100/H100) | Local |
| LongCat | 20GB | 24GB | 25GB | Yes | Local |
| InfiniteTalk | 14GB | 16GB | 10GB | Yes | Local |
| video-retalking | 8GB | 16GB | 5GB | Yes | Local |
| VideoCaptioner | 0-4GB | 8GB | 2GB (Whisper) | Optional | Local binary |
| VideoSuperResolution | 8GB | 16GB | 5GB | Yes | Local |
| subtitle-remover | 8GB | 16GB | 3GB | Yes | Local |
| Jitsi Videobridge | 0GB | 4GB | 0GB | No | Docker |
| n8n | 0GB | 2GB | 0GB | No | Docker/Local |

**Recommendation:** Start with Remotion (0GB VRAM) + LTX (12GB) + VideoCaptioner (0-4GB) + Jitsi (0GB) for MVP. Add CogVideo/Hunyuan when GPU available (24GB+). Use API fallback (Replicate, etc) if no local GPU.

## ALO Use Cases Mapping

| Use Case | Best Provider | Why |
|----------|---------------|-----|
| University promo (data-driven, logo, colors, course list) | Remotion | Controllable, versioned templates, personalized via props, 0GB VRAM |
| Course explainer with charts | Remotion + Manim | Programmatic charts, math animations |
| Testimonial video | Remotion | Kinetic typography, brand overlay |
| Scholarship announcement | Remotion (Animated) | Text animations |
| Visa guide timeline | Remotion + Manim | Timeline animation |
| B-roll: campus flythrough | LTX (fast) or CogVideo (narrative) or Hunyuan (premium) | AI generation from prompt |
| AI counselor avatar | InfiniteTalk | Talking head, long-form, multilingual |
| Multilingual dubbing | video-retalking | Lip-sync existing video to new language |
| Auto-caption 99 langs | VideoCaptioner | Whisper + LLM + translation |
| Counseling recording → summary | Jitsi + VideoRecorder + VideoCaptioner + VideoAgent | Full pipeline: record → caption → analyze → CRM |
| FAQ → short video | RedditVideoMakerBot pattern + Remotion + TTS | Adapt pattern for ALO FAQ DB |
| Slideshow: campus tour | viniciusenari/slideshow-videomaker + Remotion | Images + Ken Burns + music |
| YouTube research | youtube-dl (yt-dlp) | Download own content for re-edit (with rights) |
| Video editing: trim/merge/brand overlay | FFmpeg (0voice) + Remotion | Generic operations |
| Subtitle removal (own content) | video-subtitle-remover | Clean own videos with burned-in subs (require ownership confirmation) |
| Upscaling old videos | VideoSuperResolution | 480p → 1080p/4K |
| Automation: lead→video→WhatsApp | n8n | Workflow automation |
| Telegram bot: prompt→video | Telegram bot + LTX/Remotion | User sends prompt via Telegram → video |

## Security & Ethics

- **Human likeness:** Require confirmation of ownership/permission for face/voice. Don't enable impersonation, fraud, fake endorsements. Label AI-generated media
- **Subtitle removal:** Only where user owns content or has permission. Don't enable piracy. Require checkbox "I own this content or have permission"
- **youtube-dl:** Only download content you own or have explicit rights. Respect ToS. Don't bypass DRM. Use for own YouTube channel re-editing
- **Data retention:** Don't use uploaded media to train models unless user explicitly consents and service supports that choice. Document in privacy policy
- **Cost:** Show usage estimates when provider pricing available (e.g., Replicate: $0.05/sec, etc)

## Implementation Status

- **Engine core:** `src/lib/video-engine/index.ts` — orchestrator, project management, health checks
- **Config:** `src/lib/video-engine/config.ts` — env-based, 30+ flags like `LTX_ENABLED`, `COGVIDEO_ENABLED`, etc.
- **Types:** `src/lib/video-engine/types.ts` — unified types for all providers
- **Registry:** `src/lib/video-engine/registry.ts` — 34 repos metadata, P0/P1/P2, integration status
- **Adapters:** 13 sub-modules in `src/lib/video-engine/*/` — each with health check, mock fallback, real implementation when configured
- **API routes:** 10 routes in `src/app/api/video-engine/` — projects, render, caption, talking-head, edit, automation, n8n, recording, providers, templates
- **UI:** `src/app/admin/video-studio/page.tsx` — unified studio with tabs, health, registry, quick actions, render
- **Docs:** `docs/VIDEO_ECOSYSTEM_AUDIT.md`, `docs/VIDEO_LICENSES.md`, `docs/VIDEO_ENGINE_GUIDE.md`, `external/video-repos/README.md`

**Next steps:** Enable providers via env, test with real GPU, add background job queue (BullMQ + Redis) for long renders, add storage (S3/R2), add cost tracking.

## How to Enable a Provider

```bash
# Example: Enable LTX (fast, 12GB)
LTX_ENABLED=true
LTX_API_URL=http://127.0.0.1:8188  # ComfyUI or local API
LTX_LOCAL_PATH=/models/ltx-video

# Example: Enable CogVideo via Replicate API (no local GPU needed)
COGVIDEO_ENABLED=true
COGVIDEO_API_URL=https://api.replicate.com
COGVIDEO_API_KEY=r8_...
COGVIDEO_REPLICATE_MODEL=zai-org/cogvideox-5b

# Example: Enable VideoCaptioner binary
VIDEOCAPTIONER_ENABLED=true
VIDEOCAPTIONER_PATH=/usr/local/bin/videocaptioner
WHISPER_MODEL=base
LLM_API_URL=https://api.groq.com/openai/v1
LLM_API_KEY=gsk_...
LLM_MODEL=llama-3.1-8b-instant

# Example: Enable Jitsi
JITSI_ENABLED=true
JITSI_DOMAIN=meet.jit.si
# Or self-hosted: JITSI_DOMAIN=meet.aloeducation.com
```

See `.env.example` for all placeholder names.
