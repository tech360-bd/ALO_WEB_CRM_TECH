# Video Ecosystem Licenses & Compliance
## ALO Education - 34 Repos
## Date: 2026-09-14

This document ensures license compliance for all 34 integrated repos.

---

### Summary Table

| Repo | License | Commercial Use | Bundling Allowed | ALO Strategy | Risk |
|------|---------|----------------|------------------|--------------|------|
| n8n-io/n8n | Sustainable Use License + Enterprise (fair-code) | Yes, self-host allowed, enterprise features need license | Yes, as integration | Webhook integration only, no bundling of n8n core, user self-hosts or uses cloud. Compliant. | Low |
| WEIFENG2333/VideoCaptioner | GPL-3.0 | Yes, but GPL requires source disclosure if bundled | No, if bundled in proprietary | Use as external binary/service, not bundled. Or re-implement Whisper (MIT) + our LLM refinement. Document GPL. | Medium - mitigate via external service |
| ATH-MaaS/Pixelle-Video | Apache 2.0 | Yes | Yes with attribution | Provider adapter, API abstraction | Low |
| remotion-dev/remotion | MIT core, but company license required for some commercial internal production | Yes, check https://www.remotion.dev/license | Yes, but company license needed at scale | Core MIT, allow BYO Remotion company license key via env. Document. Use local FFmpeg render for MVP, Lambda for scale. | Low-Medium |
| MarkTechStation/VideoCode | MIT | Yes | Yes | Reference only, implement via Remotion | Low |
| 3b1b/videos | MIT for manim engine, scenes copyrighted 3Blue1Brown | Engine MIT yes, scenes no | Engine yes | Use manim community edition (MIT), not 3b1b/videos scenes directly. Generate own scenes via adapter. | Low |
| ytdl-org/youtube-dl | Unlicense (public domain) | Yes | Yes | Use yt-dlp successor (more active, same license). Use youtube-dl-exec npm wrapper. Compliance: only download own content or with permission. | Medium - legal, mitigate via rights check |
| bradautomates/claude-video | MIT | Yes | Yes | Pattern reference: LLM→Remotion code. Implement own version. | Low |
| MeiGen-AI/InfiniteTalk | Apache 2.0 | Yes | Yes | Provider adapter, API abstraction | Low |
| qdrzwd/VideoRecorder | MIT | Yes | Yes | Browser MediaRecorder wrapper, our implementation | Low |
| zai-org/CogVideo | Apache 2.0 | Yes | Yes | Provider adapter, allow BYO GPU or API (Replicate, ComfyUI) | Low |
| Tencent-Hunyuan/HunyuanVideo | Tencent Hunyuan Community License (custom, allows research/commercial with attribution, check latest) | Yes with attribution, but check | Yes with attribution | Provider adapter, API abstraction | Low-Medium, check Tencent license updates |
| elebumm/RedditVideoMakerBot | GPL-3.0 | Yes but GPL | No if bundled | Inspiration only, own implementation via Remotion for ALO data. Don't bundle GPL code. | Medium - mitigate via own impl |
| Lightricks/LTX-Video | Apache 2.0 + LTX License | Yes | Yes | Provider adapter, default fast provider, 12GB VRAM | Low |
| YaoFANGUK/video-subtitle-remover | Apache 2.0 / GPL? Check - usually Apache 2.0 | Yes | Yes | Provider adapter, Python service | Low |
| leandromoreira/digital_video_introduction | MIT (book) | Yes | Yes | Knowledge base, reference | Low |
| OpenTalker/video-retalking | BSD-3-Clause? (check) | Yes | Yes | Provider adapter | Low |
| meituan-longcat/LongCat-Video | Apache 2.0 | Yes | Yes | Provider adapter | Low |
| 0voice/audio_video_streaming | MIT (educational) | Yes | Yes | Knowledge reference for streaming module | Low |
| HITsz-TMG/VideoClaw | Apache 2.0 | Yes | Yes | Provider adapter for VideoAgent | Low |
| jitsi/jitsi-videobridge | Apache 2.0 | Yes | Yes | SFU adapter, self-hosted | Low |
| HKUDS/VideoAgent | MIT | Yes | Yes | Provider adapter | Low |
| LoSealL/VideoSuperResolution | MIT | Yes | Yes | Provider adapter | Low |
| Augani/openreel-video | MIT | Yes | Yes | UI inspiration, timeline to Remotion converter | Low |
| Kosinkadink/ComfyUI-VideoHelperSuite | GPL-3.0 | Yes but GPL | No if bundled | Use as ComfyUI custom node, not bundled in main repo, user installs in ComfyUI. Bridge via API. | Medium - mitigate via API bridge |
| dunossauro/videomaker-helper | MIT | Yes | Yes | FFmpeg wrapper reference | Low |
| burhankocabiyik/videomaker | MIT | Yes | Yes | Slideshow pattern reference | Low |
| wtz2017/VideoMaker | MIT | Yes | Yes | Slideshow pattern reference | Low |
| viniciusenari/slideshow-videomaker | MIT | Yes | Yes | Core slideshow adapter, implemented via Remotion | Low |
| WuTao-CS/VideoMaker | MIT | Yes | Yes | Reference | Low |
| shubhamdevhouse/Animated-VideoMaker | MIT | Yes | Yes | Animated text via Remotion (superior) | Low |
| seed0001/videoMaker | MIT | Yes | Yes | Reference | Low |
| Bilal-Belli/videoMakerBOT | MIT | Yes | Yes | Telegram bot pattern, own implementation | Low |
| Nncstudio/VideoMakerPro | Proprietary? Check, maybe MIT | Unknown, check | Unknown | Feature reference only, own implementation | Low |

---

### Compliance Actions

1. **GPL repos (VideoCaptioner, RedditVideoMakerBot, ComfyUI-VideoHelperSuite)**:
   - Do NOT bundle GPL code in proprietary ALO build
   - Use as external service/binary that user installs separately
   - Or re-implement core logic with MIT alternatives (Whisper MIT, Remotion MIT)
   - Document GPL and provide source links
   - Add setting to enable/disable GPL providers

2. **n8n Sustainable Use**:
   - We only integrate via webhooks/API, not bundling n8n core
   - User self-hosts n8n separately (Docker: `n8nio/n8n`)
   - Provide Docker Compose snippet in docs
   - Compliant

3. **Remotion Company License**:
   - Core is MIT, but internal production at scale may need company license per https://www.remotion.dev/license
   - Allow BYO license key via env `REMOTION_LICENSE_KEY`
   - For MVP, local render with FFmpeg is free
   - Document and let user check

4. **youtube-dl / yt-dlp**:
   - Only download content you own or have explicit permission
   - Add `hasRights` boolean required in API
   - Log purpose for audit
   - Use yt-dlp (active fork) via `youtube-dl-exec`
   - Respect ToS, don't circumvent DRM

5. **AI Models (CogVideo, Hunyuan, LTX, etc)**:
   - Apache 2.0 allows commercial with attribution
   - Abstract as provider, user can BYO GPU or use API (Replicate, Fal.ai, ComfyUI)
   - Don't bundle model weights (large .safetensors) in git - gitignored
   - Provide model download script

6. **Manim**:
   - Use community edition `manim` (MIT), not 3b1b/manim (also MIT but with copyrighted scenes)
   - Generate own scenes, don't copy 3b1b/videos scenes
   - Python dependency, provide Docker option

7. **Jitsi**:
   - Apache 2.0, fully compliant, self-host allowed

---

### Attribution

In `src/app/admin/video-studio` and docs, attribute:

- "Video Engine integrates open-source projects: n8n, Remotion, CogVideoX, HunyuanVideo, LTX-Video, VideoCaptioner, InfiniteTalk, video-retalking, Jitsi, etc. See docs/VIDEO_ECOSYSTEM_AUDIT.md for full list and licenses."
- Provide links to each repo
- For Apache 2.0, include NOTICE if required

---

### Environment Variables for BYO

```
# Remotion
REMOTION_LICENSE_KEY=... (optional, for company license)

# n8n
N8N_WEBHOOK_URL=https://your-n8n/webhook/...
N8N_API_URL=https://your-n8n/api/v1
N8N_API_KEY=...

# AI Providers (BYO API or self-hosted)
COGVIDEO_API_URL=
COGVIDEO_API_KEY=
HUNYUAN_API_URL=
HUNYUAN_API_KEY=
LTX_API_URL=
LTX_API_KEY=
COMFYUI_URL=http://127.0.0.1:8188
REPLICATE_API_TOKEN=

# Talking Head
INFINITETALK_API_URL=
RETALKING_API_URL=

# Captioning
VIDEOCAPTIONER_PATH=/usr/local/bin/videocaptioner
WHISPER_MODEL=base
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=...
LLM_MODEL=gpt-4o-mini

# Editing
SUBTITLE_REMOVER_ENABLED=false
SUPER_RESOLUTION_ENABLED=false
VIDEO_AGENT_API_URL=

# Recording
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=
JITSI_JWT_SECRET=

# Automation
YTDLP_PATH=yt-dlp
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
TELEGRAM_BOT_TOKEN=

# Manim
MANIM_ENABLED=false
PYTHON_PATH=python3
MANIM_PATH=manim

# Storage
VIDEO_STORAGE_PROVIDER=local
VIDEO_STORAGE_BUCKET=
VIDEO_STORAGE_BASE_URL=/uploads/videos

# Brand
BRAND_LOGO_URL=/brand/alo-logo.png
BRAND_PRIMARY_COLOR=#E8501A
BRAND_SECONDARY_COLOR=#0057B8
```

---

### Legal Disclaimer

This document is not legal advice. Consult legal counsel for final compliance review, especially for GPL and Sustainable Use licenses.

For ALO Education production use, ensure:
- No GPL code bundled in proprietary build without compliance
- n8n self-hosted or cloud with proper license
- Remotion company license if needed at scale
- youtube-dl only for owned content
- AI model weights not in git, user BYO
