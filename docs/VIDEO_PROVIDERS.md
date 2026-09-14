# Video Providers — Configuration & Security

## Provider Adapters Design

Modular adapters so application can support different video, speech, image models without coupling whole product to one provider.

Each provider in `src/lib/video-engine/config.ts` has env flags and adapter in `src/lib/video-engine/*/`:

- `getVideoEngineConfig()` reads env, returns config object
- Each adapter has `health()` check, `generate*()` method, mock fallback when not configured
- `isProviderEnabled(id)` checks env flag

## Supported Providers & Features

| Provider ID | Category | Features | Env Flag | Required Secrets | Local GPU | API Alternative |
|-------------|----------|----------|----------|------------------|-----------|-----------------|
| remotion | programmatic | University promo, course explainer, testimonial, scholarship, visa guide, personalized video, data-driven, 9:16 reels, slideshow, animated text, brand overlay, trim/merge/resize | REMOTION_ENABLED | None (FFmpeg) | No (0GB) | No — local only |
| ltx | ai_generation | Text-to-video, image-to-video, fast, 12GB, 45s, storyboard, B-roll | LTX_ENABLED | LTX_API_URL, LTX_API_KEY or COMFYUI_URL | 12GB or API | Yes via ComfyUI or Replicate |
| cogvideo | ai_generation | T2V, I2V, long narrative, B-roll, course intro | COGVIDEO_ENABLED | COGVIDEO_API_URL, COGVIDEO_API_KEY, COGVIDEO_REPLICATE_MODEL | 12GB (2B) / 18GB (5B) or API | Yes via Replicate |
| hunyuan | ai_generation | Premium cinematic T2V, best quality, slow, high VRAM | HUNYUAN_ENABLED | HUNYUAN_API_URL, HUNYUAN_API_KEY | 24GB (A100) | No — local only (or custom API) |
| longcat | ai_generation | Long videos minutes, narrative, campus tour long-form | LONGCAT_ENABLED | LONGCAT_API_URL | 20GB | No |
| pixelle | ai_generation | DiT research T2V | PIXELLE_ENABLED | PIXELLE_API_URL | 16GB | No |
| comfyui | ai_generation | Node-based workflows, interpolation, upscaling, LTX/CogVideo via ComfyUI | COMFYUI_ENABLED | COMFYUI_URL (http://127.0.0.1:8188) | 12GB | No — local ComfyUI |
| infinitetalk | talking_head | Audio-driven infinite talking head, long-form, AI counselor avatar, multilingual | INFINITETALK_ENABLED | INFINITETALK_API_URL, INFINITETALK_LOCAL_PATH | 14GB | No |
| retalking | talking_head | Lip-sync, video dubbing, multilingual dub | RETALKING_ENABLED | RETALKING_API_URL, RETALKING_LOCAL_PATH | 8GB | No |
| videocaptioner | captioning | Whisper STT + LLM segmentation + 99-lang translation + VAD + diarization, SRT/ASS/VTT | VIDEOCAPTIONER_ENABLED | VIDEOCAPTIONER_PATH, WHISPER_MODEL, LLM_API_URL, LLM_API_KEY, LLM_MODEL | 0-4GB (Whisper) | LLM via Groq/OpenAI |
| subtitle-remover | editing | Remove hardcoded subtitles via inpainting, requires ownership confirmation | SUBTITLE_REMOVER_ENABLED | PYTHON_PATH, SUBTITLE_REMOVER_MODEL_PATH | 8GB | No |
| super-resolution | editing | Upscale 480p→1080p/4K via RealBasicVSR/RealESRGAN/BasicVSR/SwinIR | SUPER_RESOLUTION_ENABLED | PYTHON_PATH, VSR_MODEL | 8-12GB | No |
| video-agent | editing | Video understanding, summarization, counseling session analysis | VIDEO_AGENT_ENABLED | VIDEO_AGENT_API_URL (LLM) | 0GB + LLM API | Yes via LLM API |
| videorecorder | recording | Browser MediaRecorder, screen/camera/both | Always enabled | None | No | No — browser |
| jitsi | recording | Jitsi Videobridge SFU, video conferencing, recording via Jibri | JITSI_ENABLED | JITSI_DOMAIN, JITSI_APP_ID, JITSI_JWT_SECRET (for self-hosted) | No (Docker) | Public meet.jit.si free |
| youtube-dl | automation | Download from 1000+ sites via yt-dlp, only own content with rights | YOUTUBE_DL_ENABLED | YTDLP_PATH (yt-dlp binary) | No | No |
| reddit-maker | automation | Reddit thread → Shorts pattern, TTS + background + subtitles, adapted for ALO FAQ→video | REDDIT_ENABLED (optional) | REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET (for Reddit API) or use ALO forum/FAQ DB | No | No |
| claude-video | automation | LLM→Remotion code→render, natural language → video composition | Part of automation | LLM API (Claude/OpenAI via GROQ_API_KEY etc) | No | Yes via LLM API |
| slideshow | automation | Images + music + transitions → video, Ken Burns, campus tour | Always via FFmpeg/Remotion | None | No | No |
| animated | automation | Animated text, kinetic typography via Remotion | Always | None | No | No |
| n8n | automation | Workflow automation: lead→video→approval→publish, 400+ integrations | N8N_ENABLED | N8N_WEBHOOK_URL, N8N_API_URL, N8N_API_KEY | No (Docker) | Cloud trial |

## Required Secret Names (Placeholder Only)

**Never place real values in `.env.example`, only placeholders:**

```dotenv
# Placeholder names only. Never place real values in this file.

# AI Layer (existing)
GROQ_API_KEY=
OPENROUTER_API_KEY=
ZAI_API_KEY=

# Video Providers — AI Generation
COGVIDEO_API_KEY=
COGVIDEO_API_URL=
COGVIDEO_REPLICATE_MODEL=zai-org/cogvideox-5b

HUNYUAN_API_KEY=
HUNYUAN_API_URL=

LTX_API_KEY=
LTX_API_URL=
LTX_LOCAL_PATH=
COMFYUI_URL=http://127.0.0.1:8188

LONGCAT_API_URL=
PIXELLE_API_URL=

COMFYUI_URL=http://127.0.0.1:8188

# Talking Head
INFINITETALK_API_URL=
INFINITETALK_LOCAL_PATH=
RETALKING_API_URL=
RETALKING_LOCAL_PATH=

# Captioning
VIDEOCAPTIONER_PATH=
WHISPER_MODEL=base
LLM_API_URL=
LLM_API_KEY=
LLM_MODEL=gpt-4o-mini
WHISPER_LOCAL_MODEL_PATH=

# Editing
PYTHON_PATH=python3
SUBTITLE_REMOVER_MODEL_PATH=
VSR_MODEL=RealBasicVSR
VIDEO_AGENT_API_URL=

# Recording
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=
JITSI_JWT_SECRET=

# Automation
YTDLP_PATH=yt-dlp
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# Manim
MANIM_PYTHON_PATH=python3
MANIM_PATH=
MANIM_QUALITY=medium

# n8n
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

# Existing ALO secrets (never commit real values)
DATABASE_URL=
NEXTAUTH_SECRET=
ENCRYPTION_KEY=
FILE_SIGN_SECRET=
# ... see .env.example for full list
```

## Pricing / Usage Limits (Verified as of 2026-09-15)

| Provider | Pricing | Limits | Notes |
|----------|---------|--------|-------|
| Remotion | Free local, Lambda: $0.0001/sec + AWS costs, License: $0 for OSS, $500/mo for company at scale | No limit local, Lambda scales | Most cost-effective, 0GB VRAM, recommended for university promos |
| LTX via Replicate | Replicate: ~$0.0005/sec, 5 sec video ~$0.05 | Rate limit per account | Fast, cheap, good for drafts |
| CogVideo via Replicate | Replicate: 2B ~$0.05, 5B ~$0.15 per 5 sec | Rate limit | 2B cheaper for testing |
| Hunyuan | No public API, local only, cost = GPU server (A100 $2-3/hr) | VRAM 24GB | Best quality but expensive GPU |
| VideoCaptioner | Free local Whisper, LLM refinement via Groq free tier (llama-3.1-8b-instant) or OpenAI $0.001/1K tokens | Groq free: 30 req/min | Free for MVP with Whisper base |
| Jitsi | Public meet.jit.si free, self-hosted: server cost $20-50/mo | No limit public, but no SLA | Free for counseling calls |
| n8n | Self-hosted free, cloud: $20/mo starter | Self-hosted no limit | Fair-code, webhook integration compliant |
| youtube-dl | Free, yt-dlp binary, no API key | ToS: only own content | Free but compliance required |

**Note:** Pricing changes, verify via official docs before production. Show usage estimates in UI when provider pricing available.

## Region & Availability

- **Remotion:** Global, Node.js + FFmpeg, works anywhere
- **LTX/CogVideo/Hunyuan:** Require GPU, availability depends on GPU server region (US/EU). Replicate API global
- **VideoCaptioner:** Whisper local global, LLM API (Groq/OpenAI) global but check region for data residency
- **Jitsi:** Public meet.jit.si global, self-hosted in your region (e.g., EU for GDPR, Asia for latency)
- **n8n:** Self-hosted in your region, cloud in US/EU

## Data Retention & Privacy

| Provider | Data Retention | Privacy | Recommendation |
|----------|----------------|---------|----------------|
| Remotion (local) | No retention, local render, output to your storage | Private, no external API | Best for privacy, recommended |
| LTX local | No retention, local | Private | Good for privacy |
| CogVideo via Replicate | Replicate retains for 24h for abuse, then deletes. Check Replicate privacy policy | Data sent to Replicate US | For sensitive student data, use local GPU instead of API, or anonymize prompt |
| Hunyuan local | No retention, local | Private | Best for sensitive |
| VideoCaptioner local Whisper | No retention, local | Private | Good |
| VideoCaptioner LLM refinement via Groq/OpenAI | Groq: no training on data, retains for 30 days for abuse. OpenAI: check policy, opt-out of training | Data sent to LLM provider | For counseling recordings with PII, use local LLM or redact PII before sending to LLM. Or use Whisper local only without LLM refinement |
| Jitsi public meet.jit.si | Jitsi public: no recording by default, but check Jitsi privacy. Self-hosted: you control retention | Public: less control, self-hosted: private | For counseling sessions with sensitive data, use self-hosted Jitsi in your VPC, not public |
| n8n self-hosted | You control retention, no external | Private | Good |
| youtube-dl | No retention, local download | Private, but respect ToS | Only own content |

**For ALO:** Counseling recordings contain sensitive student data. Use self-hosted Jitsi + local Whisper + local VideoAgent (or redact PII before LLM) to maintain privacy. Don't send PII to external APIs unless user consents and service supports no-training.

## Local GPU Deployment Possible?

| Provider | Local GPU Possible | How |
|----------|-------------------|-----|
| Remotion | Yes, 0GB VRAM, CPU + FFmpeg | `npm run remotion:studio`, local render |
| LTX | Yes, 12GB VRAM, ComfyUI or local API | Docker ComfyUI with LTX workflow, `COMFYUI_URL=http://127.0.0.1:8188` |
| CogVideo | Yes, 12GB (2B) / 18GB (5B), CUDA | Python env, `pip install -r requirements.txt`, download weights 15-20GB |
| Hunyuan | Yes, 24GB VRAM, A100/H100 | Python env, download weights 30GB, `python app.py` |
| InfiniteTalk | Yes, 14GB VRAM | Python env, download weights 10GB |
| video-retalking | Yes, 8GB VRAM | Python env, 5GB weights |
| VideoCaptioner | Yes, 0-4GB VRAM, CPU ok | Python + binary, Whisper model 1-5GB |
| VideoSuperResolution | Yes, 8-12GB VRAM | Python + PyTorch + weights 5GB |
| subtitle-remover | Yes, 8GB VRAM | Python + PyTorch + inpainting model 3GB |
| Jitsi | Yes, Docker, no GPU | `docker-compose up -d` Jitsi |
| n8n | Yes, Docker, no GPU | `docker run n8nio/n8n` |

**Recommendation:** Start with 0GB providers (Remotion, FFmpeg, VideoRecorder, Jitsi public, n8n Docker) for MVP, no GPU needed. Add 12GB GPU server for LTX + VideoCaptioner + super-resolution. Add 24GB A100 for Hunyuan/CogVideo 5B/InfiniteTalk when budget allows.

## How to Test Safely Without Charging Real Account

- **Remotion:** `npm run remotion:studio` → open http://localhost:3000, preview compositions, no API key, no cost, 0GB VRAM
- **LTX via ComfyUI:** Install ComfyUI Docker, download LTX workflow (free), set `LTX_ENABLED=true`, `COMFYUI_URL=http://127.0.0.1:8188`, generate 5 sec video, no API key, cost = GPU server electricity, 12GB VRAM
- **CogVideo via Replicate (cheap test):** Set `COGVIDEO_ENABLED=true`, `COGVIDEO_API_URL=https://api.replicate.com`, `COGVIDEO_API_KEY=r8_...`, `COGVIDEO_REPLICATE_MODEL=zai-org/cogvideox-2b`, generate 5 sec, cost ~$0.05. Test with small prompt, not large
- **VideoCaptioner Whisper base:** `WHISPER_MODEL=base` (74M params, CPU), no LLM refinement (`LLM_API_URL=` empty), test with 10 sec video, no cost, 0GB VRAM
- **VideoCaptioner with Groq free:** Set `LLM_API_URL=https://api.groq.com/openai/v1`, `LLM_API_KEY=gsk_...` (Groq free tier), `LLM_MODEL=llama-3.1-8b-instant`, test with short transcript, free tier 30 req/min, no cost
- **Jitsi public:** `JITSI_DOMAIN=meet.jit.si`, no key, create room, record via browser MediaRecorder, no cost
- **n8n local:** `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n`, open http://localhost:5678, create workflow, no cost
- **youtube-dl:** `yt-dlp --version`, test with own YouTube video URL (you own), `hasRights: true`, no cost, but only own content

**Never test with production data or real student PII in external APIs.** Use dummy data for API tests.

## Security — Never Expose Secrets

- Never log private key, DATABASE_URL, JWT, API keys, tokens in workflow logs, build artifacts, client bundles, error messages
- Use `set -Eeuo pipefail` not `set -x` in deployment scripts (set -x would log secrets)
- `.env` excluded from Git via `.gitignore`, production `.env` preserved, never overwritten, chmod 600, owner root or deploy
- Secrets via GitHub Actions Secrets: `PRODUCTION_VPS_HOST`, `PRODUCTION_VPS_PORT`, `PRODUCTION_VPS_USER`, `PRODUCTION_VPS_SSH_KEY`, optional `PRODUCTION_VPS_FINGERPRINT`
- Video provider API keys via VPS `.env`, not GitHub Secrets (unless needed for CI), never in client bundle (only server-side `process.env`)
- Validate file upload: size limits (e.g., 100MB for video), content-type checks (video/*, image/*), path traversal prevention, SSRF prevention for videoUrl (only allow http/https, not file://, not internal IPs)
- Rate limiting for video generation: e.g., 10 renders per user per hour, to prevent abuse and cost explosion
- Audit logging for sensitive operations: VideoProject creation, render, delete, with createdById, purpose, hasRights

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `LTX_ENABLED=true` but status not_configured | ComfyUI not running or URL wrong | Check `COMFYUI_URL=http://127.0.0.1:8188`, `curl http://127.0.0.1:8188`, `docker ps \| grep comfyui` |
| `CogVideo` fails with 403 | API key missing or wrong | Check `COGVIDEO_API_KEY`, `COGVIDEO_API_URL`, test via `curl -H "Authorization: Token $COGVIDEO_API_KEY" https://api.replicate.com/v1/models` |
| `VideoCaptioner` fails | Python or Whisper model missing | Check `VIDEOCAPTIONER_PATH`, `WHISPER_MODEL`, `python3 --version`, `pip list \| grep whisper` |
| `Jitsi` room not found | Domain wrong or JWT invalid | Check `JITSI_DOMAIN`, for self-hosted check JWT secret, for public use `meet.jit.si` |
| `n8n` webhook 404 | n8n not running or workflow not active | Check `N8N_API_URL`, `docker ps \| grep n8n`, activate workflow in n8n UI |
| Video render OOM | Too many concurrent renders, or GPU VRAM insufficient | Reduce concurrency (BullMQ concurrency 1), use smaller model (CogVideo 2B not 5B), or use API fallback |
| `prisma generate` fails with TLS | Network blocked to binaries.prisma.sh | Allow outbound to binaries.prisma.sh, or generate client in env with internet, commit `node_modules/.prisma`? No, don't commit. Instead generate on VPS with internet |

## Final Checklist for Production

- [ ] Remotion works locally: `npm run remotion:studio` → preview
- [ ] FFmpeg installed: `ffmpeg -version`
- [ ] VideoCaptioner Whisper base works: test with 10 sec video, no LLM
- [ ] Jitsi public works: create room, record via MediaRecorder
- [ ] n8n Docker works: `docker run n8nio/n8n`, create workflow
- [ ] Storage configured: `STORAGE_PROVIDER=local` or `s3` with bucket, `STORAGE_POOL_C` exists
- [ ] Brand config: `BRAND_LOGO_URL`, `BRAND_PRIMARY_COLOR`, etc.
- [ ] Env placeholders in `.env.example`, real values in VPS `.env` (chmod 600)
- [ ] File upload validation: size limits, content-type, path traversal, SSRF
- [ ] Rate limiting: 10 renders per user per hour
- [ ] Audit logging: VideoProject, VideoEngineJob with createdById
- [ ] Background queue: BullMQ + Redis for long renders (not yet implemented, need to add)
- [ ] Cost tracking: costUSD, usage dashboard (mock, need real pricing)
- [ ] GPU server: For LTX/CogVideo/Hunyuan/InfiniteTalk, need 12-24GB VRAM server or Replicate API
- [ ] Security: No secrets in logs, .env excluded from Git, ownership confirmation for face/voice and subtitle removal
- [ ] Ethics: Label AI-generated media, require permission for face/voice, don't enable impersonation
- [ ] Docs: `docs/VIDEO_ECOSYSTEM_AUDIT.md`, `docs/VIDEO_LICENSES.md`, `docs/VIDEO_ENGINE_GUIDE.md`, `docs/VIDEO_INTEGRATION_MATRIX.md`, `docs/VIDEO_STUDIO_COMPLETE.md`, `docs/VIDEO_PROVIDERS.md`
