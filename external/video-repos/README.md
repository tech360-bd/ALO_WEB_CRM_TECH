# External Video Repos - Local Reference Only

This directory is for **local cloning** of 34 external video-related repos requested for integration into ALO Education Video Engine.

**These repos are NOT committed to git** — they are gitignored. Only the clone script and this README are tracked.

## Quick Start

```bash
# Clone all 34 repos (shallow, ~few GB)
bash external/video-repos/clone-all.sh

# List cloned
ls external/video-repos/
```

## Registry

See `src/lib/video-engine/registry.ts` for full metadata of all 34 repos:

- **Automation**: n8n-io/n8n
- **Captioning**: WEIFENG2333/VideoCaptioner
- **AI Generation**: zai-org/CogVideo, Tencent-Hunyuan/HunyuanVideo, Lightricks/LTX-Video, meituan-longcat/LongCat-Video, ATH-MaaS/Pixelle-Video, Kosinkadink/ComfyUI-VideoHelperSuite
- **Talking Head**: MeiGen-AI/InfiniteTalk, OpenTalker/video-retalking
- **Editing**: YaoFANGUK/video-subtitle-remover, LoSealL/VideoSuperResolution, HKUDS/VideoAgent, HITsz-TMG/VideoClaw, Augani/openreel-video
- **Recording**: qdrzwd/VideoRecorder, jitsi/jitsi-videobridge
- **Content Automation**: ytdl-org/youtube-dl, elebumm/RedditVideoMakerBot, bradautomates/claude-video
- **VideoMakers (9x)**: dunossauro/videomaker-helper, burhankocabiyik/videomaker, wtz2017/VideoMaker, viniciusenari/slideshow-videomaker, WuTao-CS/VideoMaker, seed0001/videoMaker, Bilal-Belli/videoMakerBOT, Nncstudio/VideoMakerPro, shubhamdevhouse/Animated-VideoMaker
- **Programmatic**: remotion-dev/remotion, MarkTechStation/VideoCode, 3b1b/videos (manim)
- **Streaming/Education**: 0voice/audio_video_streaming, leandromoreira/digital_video_introduction

## Integration

All repos are integrated via adapters in `src/lib/video-engine/`:

```
src/lib/video-engine/
  registry.ts          # Metadata for 34 repos
  types.ts             # Unified types
  config.ts            # Env config
  index.ts             # Main orchestrator
  n8n/                 # n8n-io/n8n — workflow automation
  remotion/            # remotion-dev/remotion — React video
  captioning/          # VideoCaptioner — Whisper + LLM
  ai-generation/       # CogVideo, Hunyuan, LTX, LongCat, Pixelle, ComfyUI
  talking-head/        # InfiniteTalk, video-retalking
  editing/             # subtitle-remover, super-resolution, VideoAgent, etc
  recording/           # VideoRecorder, Jitsi
  automation/          # youtube-dl, RedditVideoMakerBot, claude-video, VideoMakers
  manim/               # 3b1b/manim — math animations
  streaming/           # audio_video_streaming knowledge
  utils/               # brand-overlay, storage
```

## License Compliance

See `docs/VIDEO_LICENSES.md` for license details.

- n8n: Sustainable Use (fair-code) — webhook integration compliant
- Remotion: MIT core + company license for scale — allow BYO license key
- VideoCaptioner: GPL-3.0 — use as external binary/service, not bundled
- youtube-dl: Unlicense — recommend yt-dlp successor
- Manim: MIT engine, 3b1b scenes copyrighted — use community edition
- AI models: Apache 2.0 or custom with attribution — abstract as provider
- Jitsi: Apache 2.0 — fully compliant
- Others: Mostly MIT

## ALO Use Cases

- **Marketing**: University promo via Remotion (data-driven), AI B-roll via LTX/CogVideo, auto-caption via VideoCaptioner, multilingual dub via video-retalking
- **Counseling**: Jitsi video calls + MediaRecorder recording → caption → VideoAgent summary → CRM
- **Content**: FAQ DB → short video via RedditVideoMakerBot pattern + Remotion, YouTube research via yt-dlp, slideshow via slideshow-videomaker
- **Education**: IELTS math via Manim, visa timeline animation, scholarship calculator
- **Automation**: n8n workflows — lead→video→WhatsApp, approval→publish, recording pipeline, FAQ batch, AI batch, multilingual dub

## API Routes

- `GET /api/video-engine/providers` — health of all providers
- `GET /api/video-engine/templates` — Remotion + Manim + AI presets + n8n workflows
- `POST /api/video-engine/projects` — create project
- `POST /api/video-engine/render` — render via Remotion or AI
- `POST /api/video-engine/caption` — caption via VideoCaptioner
- `POST /api/video-engine/talking-head` — talking head
- `POST /api/video-engine/edit` — editing ops
- `POST /api/video-engine/automation` — youtube, reddit, slideshow, etc
- `POST /api/video-engine/n8n` — n8n workflows

## Admin UI

`src/app/admin/video-studio/page.tsx` — Unified studio with tabs for each category, health, registry, quick actions.

## Docs

- `docs/VIDEO_ECOSYSTEM_AUDIT.md` — Full audit of 34 repos
- `docs/VIDEO_LICENSES.md` — License compliance
- `docs/VIDEO_ENGINE_GUIDE.md` — Usage guide
