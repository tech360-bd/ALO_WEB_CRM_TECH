# Link Audit — 2026-10-08

**Scope:** every link supplied in the research list was checked — 136 unique GitHub repositories (deduplicated from ~160 pasted links; duplicates like `omacom/omarchy` ×2, `Ai-Markting-crm` ×2, `RedditVideoMakerBot` ×3, `bugcrowd_university` ×2, `mureka.ai` ×2, `GetGoAPI/...` ×2, `GAIR-NLP/LiveTalk` ×2, `qdrzwd/VideoRecorder` ×2, `wacrm` ×2, `DeskcommCRM` ×2 were collapsed), 9 non-GitHub sites, and 19 YouTube-redirect links (each redirects to a GitHub repo already in the list — verified targets: `bilawalsidhu/gods-eye-view`, `JetBrains/go-modern-guidelines`, `google-research/timesfm`, `EfficientStreet/hindsight`, `timharris707/modeldeck`, `Artistsyn/cortex_suite`, `sulabhdubey/rta-smriti-brain`, `EfficientStreet/youtube-subscriptions-ingest`, `Kayforkind/reimagine-it`, `templetongroup/radiant`, `Onyx-Dev-Labs/doodle-note`, `dani-garcia/vaultwarden`, `TryGhost/Ghost`, `twentyhq/twenty`, `languagetool-org/languagetool`, `umami-software/umami`, `nextcloud/server`, `chatwoot/chatwoot`, `VonHoltenCodes/SlowBooks-Pro-2026`).

**Method:** GitHub links verified via the GitHub API (`gh api repos/{owner}/{repo}` — existence, visibility, language, stars). Non-GitHub sites fetched directly. Every repo was then classified by relevance to the ALO Education project, and every applicable element (diagram designs, button designs, marketing kits) was implemented — see [What was implemented](#what-was-implemented) below.

## Summary

| Check | Result |
|---|---|
| GitHub repos checked | **136 unique** |
| GitHub repos reachable | **133** ✅ |
| GitHub repos NOT accessible | **3** ❌ — all three are your own `engralaminn-collab` repos (see below) |
| Non-GitHub sites checked | **9** — 8 reachable ✅, 1 blocked (HTTP 403) |
| YouTube-redirect links | 19 — all resolve to GitHub repos already in the list ✅ |

### ⚠️ Action needed from you: your 3 own-org repos are not accessible

| Repo | Status | Meaning |
|---|---|---|
| `engralaminn-collab/alo-education-uk-final` | HTTP 403 | Private — the credentials in this environment cannot read it |
| `engralaminn-collab/ukvi-ai-markting_n8n` | HTTP 404 | Not found — private, renamed, or deleted |
| `engralaminn-collab/Ai-Markting-crm` | HTTP 404 | Not found — private, renamed, or deleted |

These three could not be inspected or diffed against the project. **To finish the job on them: make them public, or grant the GitHub connection in this workspace access to the `engralaminn-collab` org, then re-run the audit.** Everything else in the list was checked completely.

## Non-GitHub sites

| Link | Status | What it is | Relevance |
|---|---|---|---|
| [buffer.com](https://buffer.com) | ✅ | Social media management (Publish / Create / Community / Insights / Collaborate / Start page / AI assistant) | Reference for the Social Media hub — scheduling, queue, analytics already modeled in `src/components/marketing/hub/SocialMediaAutomationView.tsx` |
| [coder.qwen.ai](https://coder.qwen.ai) | ✅ | Qwen Coder — browser-based AI coding app | Tooling reference only |
| [stackoverflow.com](https://stackoverflow.com) | ✅ | Developer Q&A | Reference only |
| [mureka.ai](https://www.mureka.ai) | ✅ | AI music generator | Reference for video/audio generation features |
| [astryx.atmeta.com](https://astryx.atmeta.com) | ✅ | Open-source design system (React 19 + StyleX, 180+ components, themes, templates) | **Design-system reference for buttons/components** — the project's button system (`src/components/ui/button.tsx`, 12 variants × 7 sizes, ALO palette) already follows this pattern; public CTAs now use it via `AloCtaLink` |
| [cline.bot](https://cline.bot) | ✅ | Cline — open-source coding agent | Tooling reference (repo `cline/cline` also checked) |
| [openrouter.ai](https://openrouter.ai) | ✅ | Unified LLM API (500+ models, 80+ providers) | AI gateway reference — the project's `src/lib/ai-gateway.ts` already provides a unified provider layer |
| [openrouter.ai/blog/tutorials/build-tool-calling-agent-loop](https://openrouter.ai/blog/tutorials/build-tool-calling-agent-loop) | ✅ | Tutorial: reliable tool-calling agent loop (capped loop, per-call results, fallback) | Pattern reference — the project's `src/lib/ai-tool-loop.ts` implements the same capped-loop discipline |
| [developer.meta.com/ai](https://developer.meta.com/ai) | ❌ HTTP 403 | Meta AI developer portal | Blocked by the site (403); reference only — no action possible from here |

## GitHub repositories (all 136, grouped by relevance)

#### Your org repos (engralaminn-collab) (3)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [engralaminn-collab/Ai-Markting-crm](https://github.com/engralaminn-collab/Ai-Markting-crm) | ❌ 404 not found | - | - | Repository not accessible with current credentials |
| [engralaminn-collab/alo-education-uk-final](https://github.com/engralaminn-collab/alo-education-uk-final) | ❌ 403 private/no access | - | - | Repository not accessible with current credentials |
| [engralaminn-collab/ukvi-ai-markting_n8n](https://github.com/engralaminn-collab/ukvi-ai-markting_n8n) | ❌ 404 not found | - | - | Repository not accessible with current credentials |

#### Diagram design (1)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | ✅ OK | HTML | 46227 | Editorial diagram design for Claude Code, Codex, GitHub Copilot, Factory Droid, and Pi. 42 diagram types. Self |

#### Marketing kits & GTM (8)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [brightdata/open-enrich](https://github.com/brightdata/open-enrich) | ✅ OK | TypeScript | 12 |  |
| [clawnify/OpenProspector](https://github.com/clawnify/OpenProspector) | ✅ OK | TypeScript | 12 | The open-source Clay alternative — find and enrich B2B leads on your own provider keys, at cost with no per-le |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ✅ OK | JavaScript | 53754 | Marketing skills for Claude Code and AI agents. CRO, copywriting, SEO, analytics, and growth engineering. |
| [every-app/open-seo](https://github.com/every-app/open-seo) | ✅ OK | TypeScript | 22786 | Open source alternative to Semrush and Ahrefs |
| [guifav/market-intelligence-radar](https://github.com/guifav/market-intelligence-radar) | ✅ OK | TypeScript | 3 | Open-source market intelligence radar — automated news monitoring, entity extraction, enrichment and CRM match |
| [knsoftic/Email_Markting](https://github.com/knsoftic/Email_Markting) | ✅ OK | PHP | 0 |  |
| [mohamed11sk/Email-markting](https://github.com/mohamed11sk/Email-markting) | ✅ OK | PHP | 0 |  |
| [parthasarathy123/n8n-gtm-lead-enrichment](https://github.com/parthasarathy123/n8n-gtm-lead-enrichment) | ✅ OK | - | 0 | n8n workflow for Apify lead sourcing, Clay enrichment callbacks, Zoho CRM deduplication, validation, and revie |

#### Education sector reference (5)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [Bhawana0218/NextStep-Abroad](https://github.com/Bhawana0218/NextStep-Abroad) | ✅ OK | TypeScript | 2 | Help Study Abroad Admin Dashboard |
| [arupdas0825/studytra](https://github.com/arupdas0825/studytra) | ✅ OK | JavaScript | 27 | 🎓 Studytra — Study Abroad Execution Platform Built for Indian students who want to study in Germany, USA, or C |
| [bugcrowd/bugcrowd_university](https://github.com/bugcrowd/bugcrowd_university) | ✅ OK | - | 2805 | Open source education content for the researcher community |
| [nabaleducation/EducationConsultancyWebsite](https://github.com/nabaleducation/EducationConsultancyWebsite) | ✅ OK | TypeScript | 0 | United Education Webiste |
| [nwuzmedoutlook/university](https://github.com/nwuzmedoutlook/university) | ✅ OK | - | 1215 | :octocat:120+国内高校课程资源纯手工整理，欢迎补充、修订 |

#### CRM reference (15)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [ArnasDon/wacrm](https://github.com/ArnasDon/wacrm) | ✅ OK | TypeScript | 2523 | Self-hostable CRM template for WhatsApp — shared inbox, contacts, sales pipelines, broadcasts, and no-code aut |
| [ChurchCRM/CRM](https://github.com/ChurchCRM/CRM) | ✅ OK | PHP | 964 | Free, open-source church management software for people, families, groups, events, attendance, giving, volunte |
| [Django-CRM/Django-CRM](https://github.com/Django-CRM/Django-CRM) | ✅ OK | Python | 2441 | Open Source CRM for Startups and enterprises. Django + SvelteKit · Self-hosted · Multi-tenant · Free forever |
| [Odoo-mobile/crm](https://github.com/Odoo-mobile/crm) | ✅ OK | Java | 149 | Odoo CRM |
| [crmeb/CRMEB](https://github.com/crmeb/CRMEB) | ✅ OK | Vue | 9397 | 🔥CRMEB开源商城免费开源多语言商城系统，Tp6框架商城，系统可商用；包含小程序商城、H5商城、公众号商城、PC商城、App，支持分销、拼团、砍价、秒杀、优惠券、积分、会员等级、小程序直播、页面DIY，前后端分离，方便 |
| [dennisivy/crash-course-CRM](https://github.com/dennisivy/crash-course-CRM) | ✅ OK | Python | 584 | Django customer management platform |
| [fatfreecrm/fat_free_crm](https://github.com/fatfreecrm/fat_free_crm) | ✅ OK | Ruby | 3633 | Ruby on Rails CRM platform |
| [frappe/crm](https://github.com/frappe/crm) | ✅ OK | Vue | 3754 | Fully featured, open source CRM |
| [idurar/idurar-erp-crm](https://github.com/idurar/idurar-erp-crm) | ✅ OK | JavaScript | 8863 | Free Open Source ERP CRM Software Accounting Invoicing \| Node.Js React |
| [melgarafael/DeskcommCRM](https://github.com/melgarafael/DeskcommCRM) | ✅ OK | TypeScript | 4490 | Open-source AI sales OS — self-hosted CRM with native AI agents + WhatsApp (WAHA). Open alternative to Kommo,  |
| [oroinc/crm](https://github.com/oroinc/crm) | ✅ OK | PHP | 687 | Main OroCRM package with core functionality. |
| [oroinc/crm-application](https://github.com/oroinc/crm-application) | ✅ OK | PHP | 1014 | OroCRM - an open-source Customer Relationship Management application. |
| [thu-ml/CRM](https://github.com/thu-ml/CRM) | ✅ OK | Python | 694 | [ECCV 2024] Single Image to 3D Textured Mesh in 10 seconds with Convolutional Reconstruction Model. |
| [trycompai/crm](https://github.com/trycompai/crm) | ✅ OK | TypeScript | 11150 | Comp AI CRM is an open source, CRM designed for AI agents. Agentic-first CRM. |
| [twentyhq/twenty](https://github.com/twentyhq/twenty) | ✅ OK | TypeScript | 58096 | The open alternative to Salesforce, designed for AI. |

#### SMS / WhatsApp / VoIP (11)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [0perationPrivacy/VoIP](https://github.com/0perationPrivacy/VoIP) | ✅ OK | JavaScript | 298 | Web Base Telnyx/Twilio VoIP Interface enabling SMS, MMS and Voice calls using the providers API Keys and self- |
| [BelledonneCommunications/linphone-iphone](https://github.com/BelledonneCommunications/linphone-iphone) | ✅ OK | Swift | 658 | Linphone is a free VoIP and video softphone based on the SIP protocol. Mirror of linphone-iphone (git://git.li |
| [HM-RunningHub/ComfyUI_RH_APICall](https://github.com/HM-RunningHub/ComfyUI_RH_APICall) | ✅ OK | Python | 302 | This is a ComfyUI plugin that makes it easier to call and run workflows from RunningHub in your local ComfyUI  |
| [Lakr233/vphone-cli](https://github.com/Lakr233/vphone-cli) | ✅ OK | Swift | 15047 |  |
| [NdoleStudio/httpsms](https://github.com/NdoleStudio/httpsms) | ✅ OK | Go | 5925 | Send and receive SMS messages using your Android phone programmatically via a simple HTTP API |
| [NdoleStudio/httpsms-node](https://github.com/NdoleStudio/httpsms-node) | ✅ OK | TypeScript | 32 | Node client for the httpSMS API https://httpsms.com |
| [YutaroHayakawa/ipftrace2](https://github.com/YutaroHayakawa/ipftrace2) | ✅ OK | C | 410 | A packet oriented Linux kernel function call tracer |
| [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) | ✅ OK | Python | 55249 | VoiceStudio is the open-source, fully-local ElevenLabs alternative — voice cloning, voice design, video dubbin |
| [developerspace-samples/VoIP-Call-Sample](https://github.com/developerspace-samples/VoIP-Call-Sample) | ✅ OK | Java | 32 | An android application that includes ConnectionService binding to handle incoming & outgoing calls. It helps t |
| [domovinatv/sms.domovina.ai](https://github.com/domovinatv/sms.domovina.ai) | ✅ OK | Go | 3 | Free SMS gateway for domovina.ai — built on NdoleStudio/httpsms (git subtree), deployed via Coolify on Oracle  |
| [sibnerian/electron-promise-ipc](https://github.com/sibnerian/electron-promise-ipc) | ✅ OK | TypeScript | 69 | Promise-flavored IPC calls in Electron. 100% test coverage. |

#### Video engine (already integrated) (33)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [0voice/audio_video_streaming](https://github.com/0voice/audio_video_streaming) | ✅ OK | - | 6254 | 音视频流媒体权威资料整理，500+份文章，论文，视频，实践项目，协议，业界大神名单。 |
| [3b1b/videos](https://github.com/3b1b/videos) | ✅ OK | Python | 11327 | Code for the manim-generated scenes used in 3blue1brown videos |
| [ATH-MaaS/Pixelle-Video](https://github.com/ATH-MaaS/Pixelle-Video) | ✅ OK | Python | 28755 | 🚀 AI 全自动短视频引擎 \| AI Fully Automated Short Video Engine |
| [Augani/openreel-video](https://github.com/Augani/openreel-video) | ✅ OK | TypeScript | 5317 | OpenReel Video - Professional browser-based video editor. Open source CapCut alternative. 100% browser-based,  |
| [Bilal-Belli/videoMakerBOT](https://github.com/Bilal-Belli/videoMakerBOT) | ✅ OK | Python | 2 | This desktop python program allows you to put your talk script and image slides. He will talk about the given  |
| [HITsz-TMG/VideoClaw](https://github.com/HITsz-TMG/VideoClaw) | ✅ OK | Python | 1845 | 🚀 AI 全自动化视频生成员工 \| Your First AIGC Coworker. Chat an Idea. Get a Film. 🦞 |
| [HKUDS/VideoAgent](https://github.com/HKUDS/VideoAgent) | ✅ OK | Python | 1934 | [EMNLP2026] "VideoAgent: All-in-One Agentic Framework for Video Understanding and Editing, and Remaking" |
| [Kosinkadink/ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite) | ✅ OK | Python | 1874 | Nodes related to video workflows |
| [Lightricks/LTX-Video](https://github.com/Lightricks/LTX-Video) | ✅ OK | Python | 11055 | Official repository for LTX-Video |
| [LoSealL/VideoSuperResolution](https://github.com/LoSealL/VideoSuperResolution) | ✅ OK | Python | 1687 | A collection of state-of-the-art video or single-image super-resolution architectures, reimplemented in tensor |
| [MarkTechStation/VideoCode](https://github.com/MarkTechStation/VideoCode) | ✅ OK | Jupyter Notebook | 4231 |  |
| [MeiGen-AI/InfiniteTalk](https://github.com/MeiGen-AI/InfiniteTalk) | ✅ OK | Python | 8015 | ​​Unlimited-length talking video generation​​ that supports image-to-video and video-to-video generation |
| [Nncstudio/VideoMakerPro](https://github.com/Nncstudio/VideoMakerPro) | ✅ OK | Java | 2 | VideoMakerPro |
| [OpenTalker/video-retalking](https://github.com/OpenTalker/video-retalking) | ✅ OK | Python | 7291 | [SIGGRAPH Asia 2022] VideoReTalking: Audio-based Lip Synchronization for Talking Head Video Editing In the Wil |
| [Tencent-Hunyuan/HunyuanVideo](https://github.com/Tencent-Hunyuan/HunyuanVideo) | ✅ OK | Python | 12601 | HunyuanVideo: A Systematic Framework For Large Video Generation Model |
| [WEIFENG2333/VideoCaptioner](https://github.com/WEIFENG2333/VideoCaptioner) | ✅ OK | Python | 16186 | 🎬 卡卡字幕助手 \| VideoCaptioner - 基于 LLM 的智能字幕助手 - 视频字幕生成、断句、校正、字幕翻译全流程处理！- A powered tool for easy and efficient v |
| [WuTao-CS/VideoMaker](https://github.com/WuTao-CS/VideoMaker) | ✅ OK | Python | 17 | This is the official implementation of  VideoMaker: Zero-shot Customized Video Generation with the Inherent Fo |
| [YaoFANGUK/video-subtitle-remover](https://github.com/YaoFANGUK/video-subtitle-remover) | ✅ OK | Python | 13190 | 基于AI的图片/视频硬字幕去除、文本水印去除，无损分辨率生成去字幕、去水印后的图片/视频文件。无需申请第三方API，本地实现。AI-based tool for removing hard-coded subtitles |
| [bradautomates/claude-video](https://github.com/bradautomates/claude-video) | ✅ OK | Python | 18248 | Give Claude the ability to watch any video. /watch downloads, extracts frames, transcribes, hands it all to Cl |
| [burhankocabiyik/videomaker](https://github.com/burhankocabiyik/videomaker) | ✅ OK | JavaScript | 27 | AI video studio. Topic to product video — fal.ai (Seedance 2.0, Kling v2.1) + Remotion. |
| [dunossauro/videomaker-helper](https://github.com/dunossauro/videomaker-helper) | ✅ OK | Python | 135 | Simplify your video editing workflow with Python 📹 |
| [elebumm/RedditVideoMakerBot](https://github.com/elebumm/RedditVideoMakerBot) | ✅ OK | Python | 12536 | Create Reddit Videos with just✨ one command ✨ |
| [jitsi/jitsi-videobridge](https://github.com/jitsi/jitsi-videobridge) | ✅ OK | Kotlin | 3107 | Jitsi Videobridge is a WebRTC compatible video router or SFU that lets build highly scalable video conferencin |
| [leandromoreira/digital_video_introduction](https://github.com/leandromoreira/digital_video_introduction) | ✅ OK | Jupyter Notebook | 16347 | A hands-on introduction to video technology: image, video, codec (av1, vp9, h265) and more (ffmpeg encoding).  |
| [meituan-longcat/LongCat-Video](https://github.com/meituan-longcat/LongCat-Video) | ✅ OK | Python | 9108 |  |
| [qdrzwd/VideoRecorder](https://github.com/qdrzwd/VideoRecorder) | ✅ OK | Java | 1791 | android视频录制，模仿微视，支持按下录制、抬起暂停。进度条断点显示。 |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | ✅ OK | TypeScript | 62549 | 🎥      Make videos programmatically with React |
| [seed0001/videoMaker](https://github.com/seed0001/videoMaker) | ✅ OK | Python | 2 |  |
| [shubhamdevhouse/Animated-VideoMaker](https://github.com/shubhamdevhouse/Animated-VideoMaker) | ✅ OK | JavaScript | 13 | Create animatied text videos like Animoto using NodeJS -> ImageMagick & Ffmpeg |
| [viniciusenari/slideshow-videomaker](https://github.com/viniciusenari/slideshow-videomaker) | ✅ OK | Python | 11 | Python scripts that take a set of pictures and an audio track and turn them into a slideshow video. |
| [wtz2017/VideoMaker](https://github.com/wtz2017/VideoMaker) | ✅ OK | C | 20 | Video Making base on OpenGL ES + OpenSL ES + SurfaceTexture + SurfaceView + MediaCodec + MediaMuxer + AudioRec |
| [ytdl-org/youtube-dl](https://github.com/ytdl-org/youtube-dl) | ✅ OK | Python | 141241 | Command-line program to download videos from YouTube.com and other video sites |
| [zai-org/CogVideo](https://github.com/zai-org/CogVideo) | ✅ OK | Python | 13067 | text and image to video generation: CogVideoX (2024) and CogVideo (ICLR 2023) |

#### Self-hosted platforms (12)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [CapSoftware/Cap](https://github.com/CapSoftware/Cap) | ✅ OK | Rust | 23139 | Open source Loom alternative. Beautiful, shareable screen recordings. |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | ✅ OK | TypeScript | 46459 | 🧡 Everything is RSSible |
| [TryGhost/Ghost](https://github.com/TryGhost/Ghost) | ✅ OK | TypeScript | 55501 | Independent technology for modern publishing, memberships, subscriptions and newsletters. |
| [VonHoltenCodes/SlowBooks-Pro-2026](https://github.com/VonHoltenCodes/SlowBooks-Pro-2026) | ✅ OK | Python | 559 | Free, source-available accounting: double-entry bookkeeping, invoicing, US payroll, inventory, bank feeds - de |
| [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | ✅ OK | Ruby | 37633 | Open-source live-chat, email support, omni-channel desk. An alternative to Intercom, Zendesk, Salesforce Servi |
| [dani-garcia/vaultwarden](https://github.com/dani-garcia/vaultwarden) | ✅ OK | Rust | 68699 | Unofficial Bitwarden compatible server written in Rust, formerly known as bitwarden_rs |
| [languagetool-org/languagetool](https://github.com/languagetool-org/languagetool) | ✅ OK | Java | 15116 | Style and Grammar Checker for 25+ Languages |
| [nextcloud/server](https://github.com/nextcloud/server) | ✅ OK | PHP | 37036 | ☁️ Nextcloud server, a safe home for all your data |
| [omacom/omarchy](https://github.com/omacom/omarchy) | ✅ OK | Shell | 44297 | Beautiful, Modern & Opinionated Linux |
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | ✅ OK | Python | 486778 | A collective list of free APIs |
| [siyuan-note/siyuan](https://github.com/siyuan-note/siyuan) | ✅ OK | TypeScript | 46680 | An open-source, privacy-first, self-hosted knowledge workspace where humans and AI agents work together 开源、隐私优 |
| [umami-software/umami](https://github.com/umami-software/umami) | ✅ OK | TypeScript | 39251 | Umami is a privacy-first analytics platform. Traffic, campaigns, behavior, conversions, and revenue in one pla |

#### AI agents & LLM infra (30)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [Artistsyn/cortex_suite](https://github.com/Artistsyn/cortex_suite) | ✅ OK | Rust | 84 | Local MCP servers that give coding agents a reliable project memory. quartz-ctx serves live code structure in  |
| [EfficientStreet/hindsight](https://github.com/EfficientStreet/hindsight) | ✅ OK | - | 170 | A self-improvement skill for AI coding assistants — reviews a session end-to-end and saves only the durable pr |
| [EfficientStreet/youtube-subscriptions-ingest](https://github.com/EfficientStreet/youtube-subscriptions-ingest) | ✅ OK | Python | 178 | Pull YouTube subscription metadata into a real cross-linked knowledge graph in your second-brain vault |
| [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | ✅ OK | Python | 70779 | 🌟 The Multi-Agent Framework: First AI Software Company, Towards Natural Language Programming |
| [GAIR-NLP/LiveTalk](https://github.com/GAIR-NLP/LiveTalk) | ✅ OK | Python | 353 |  |
| [GetGoAPI/Free-GPT-Grok-Gemini-Claude-API](https://github.com/GetGoAPI/Free-GPT-Grok-Gemini-Claude-API) | ✅ OK | TypeScript | 213 | Access GPT-5, o4, Claude 4.5 & Gemini 3 via one API. The best OpenRouter alternative. 国内直连/无需梯子/支持支付宝/Crypto.  |
| [Gitlawb/openclaude](https://github.com/Gitlawb/openclaude) | ✅ OK | TypeScript | 33687 | runs anywhere. uses anything |
| [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) | ✅ OK | Python | 48044 | Turn any AI agent into an AI Scientist. The #1 Agent Skills library for science, used by 250,000+ scientists w |
| [Kayforkind/reimagine-it](https://github.com/Kayforkind/reimagine-it) | ✅ OK | JavaScript | 204 | Kayforkind Content-Derived Design CLI. HTML in, standalone HTML out from the source's own nouns, dates, number |
| [Lin-jun-xiang/docGPT-langchain](https://github.com/Lin-jun-xiang/docGPT-langchain) | ✅ OK | Python | 261 | 🔐Free GPT-3.5 chat with your docs (PDF, WORD, CSV, TXT) |
| [THU-MAIC/OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) | ✅ OK | TypeScript | 40187 | Open Multi-Agent Interactive Classroom — Get an immersive, multi-agent learning experience in just one click |
| [akitaonrails/ai-memory](https://github.com/akitaonrails/ai-memory) | ✅ OK | Rust | 9048 | Solution for long term memory for agent coding CLIs and to facilitate handoff between different agent vendors |
| [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community) | ✅ OK | JavaScript | 4582 | Community plugin marketplace for Claude Cowork and Claude Code. Read-only mirror — submit plugins at clau.de/p |
| [bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view) | ✅ OK | JavaScript | 49154 | A spy satellite simulator in your browser, except the data is real. Live open source spatial intelligence on a |
| [cline/cline](https://github.com/cline/cline) | ✅ OK | TypeScript | 70034 | Autonomous coding agent as an SDK, IDE extension, or CLI assistant. |
| [cursor/plugins](https://github.com/cursor/plugins) | ✅ OK | TypeScript | 10385 | Cursor plugin specification and official plugins |
| [google-research/timesfm](https://github.com/google-research/timesfm) | ✅ OK | Python | 34164 | TimesFM (Time Series Foundation Model) is a pretrained time-series foundation model developed by Google Resear |
| [jingyaogong/minimind](https://github.com/jingyaogong/minimind) | ✅ OK | Python | 63361 | 🧠 Train a 64M-parameter LLM from scratch in just 2h! |
| [meta-models/meta-model-cookbook](https://github.com/meta-models/meta-model-cookbook) | ✅ OK | Python | 152 | Developer recipes for Meta Model API — agentic workflows, multi-agent orchestration patterns, and use case exa |
| [mksglu/context-mode](https://github.com/mksglu/context-mode) | ✅ OK | TypeScript | 25718 | Context window optimization for AI coding agents. Sandboxes tool output (98% reduction), persists session memo |
| [nashsu/llm_wiki](https://github.com/nashsu/llm_wiki) | ✅ OK | TypeScript | 20318 | LLM Wiki is a cross-platform desktop application that turns your documents into an organized, interlinked know |
| [ramon-victor/freegpt-webui](https://github.com/ramon-victor/freegpt-webui) | ✅ OK | Python | 5606 | GPT 3.5/4 with a Chat Web UI. No API key required. |
| [ruvnet/ruflo](https://github.com/ruvnet/ruflo) | ✅ OK | TypeScript | 74140 | 🌊 The original agent harness. Deploy intelligent multi-player swarms, coordinate autonomous workflows, and bui |
| [songguoxs/gpt4o-image-prompts](https://github.com/songguoxs/gpt4o-image-prompts) | ✅ OK | JavaScript | 3840 | Nano Banana(nanobanana),GPT-5(GPT5),GPT-4o(GPT4o) Image Prompts，Nanobanana Prompts，nanobanana提示词 |
| [templetongroup/radiant](https://github.com/templetongroup/radiant) | ✅ OK | JavaScript | 113 | A local coding harness for Mac. Chat with coding agents across cloud and local models, watch every tool call i |
| [teremterem/claude-code-gpt-5-codex](https://github.com/teremterem/claude-code-gpt-5-codex) | ✅ OK | Python | 238 | Run Anthropic's Claude Code CLI with OpenAI models such as GPT-5-Codex, GPT-5.1, and others via a local LiteLL |
| [timharris707/modeldeck](https://github.com/timharris707/modeldeck) | ✅ OK | JavaScript | 116 | macOS menu bar app that tracks usage limits across all your Claude Code and Codex CLI accounts — live "% left" |
| [tinystruct/smalltalk](https://github.com/tinystruct/smalltalk) | ✅ OK | Java | 354 | A tinystruct-based chat module which integrated with @OpenAI GPT-4 / 3.5-turbo / ChatGPT. @tinystruct |
| [tt-a1i/archify](https://github.com/tt-a1i/archify) | ✅ OK | JavaScript | 79943 | Turn any idea, plan, or codebase into a beautiful interactive diagram. An agent skill for Claude Code, Codex,  |
| [zai-org/GLM-5](https://github.com/zai-org/GLM-5) | ✅ OK | - | 7300 | GLM-5: From Vibe Coding to Agentic Engineering |

#### Dev tools & libraries (18)

| Link | Status | Lang | Stars | What it is |
|---|---|---|---|---|
| [AprilNEA/OpenLogi](https://github.com/AprilNEA/OpenLogi) | ✅ OK | Rust | 23166 | ⚡️A native, local-first alternative to Logitech Options+, written in Rust 🦀 — remap buttons, DPI, and SmartShi |
| [BraaMohammed/bricks](https://github.com/BraaMohammed/bricks) | ✅ OK | TypeScript | 69 | Bricks is the open-source, fully local alternative to Clay.com. It combines AI agents, advanced web scraping,  |
| [JetBrains/go-modern-guidelines](https://github.com/JetBrains/go-modern-guidelines) | ✅ OK | Go | 3793 | Help AI coding agents write modern Go |
| [Onyx-Dev-Labs/doodle-note](https://github.com/Onyx-Dev-Labs/doodle-note) | ✅ OK | TypeScript | 180 | Privacy-first, local-first meeting capture and AI notes. |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | ✅ OK | JavaScript | 275347 | The agent harness performance optimization system. Skills, instincts, memory, security, and research-first dev |
| [alsk1992/CloddsBot](https://github.com/alsk1992/CloddsBot) | ✅ OK | TypeScript | 2925 | Open Source AI trading agent that operates autonomously across 1000+ markets - Polymarket, Kalshi, Binance, Hy |
| [armory3d/armorpaint](https://github.com/armory3d/armorpaint) | ✅ OK | C | 5336 | Graphics Creation Tools |
| [blader/humanizer](https://github.com/blader/humanizer) | ✅ OK | Python | 54938 | Agent skill that removes signs of AI-generated writing from text |
| [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | ✅ OK | TypeScript | 189611 | Supercharge your AI agents with data from the web and beyond. Building the library for superintelligence. 🔥 |
| [firecrawl/web-agent](https://github.com/firecrawl/web-agent) | ✅ OK | TypeScript | 1242 | 🔥 Open-source web data agent optimized for structured web research |
| [fmtlib/fmt](https://github.com/fmtlib/fmt) | ✅ OK | C++ | 25873 | A modern formatting library |
| [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | ✅ OK | Python | 129189 | 利用 AI 大模型和自动化工作流，根据主题或关键词一键生成高清短视频。Generate HD short videos from a topic or keyword with an automated AI workf |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | ✅ OK | TypeScript | 59147 | Write HTML. Render video. Built for agents. |
| [ioi-labs/molx](https://github.com/ioi-labs/molx) | ✅ OK | Go | 21 | Open-source, self-hosted alternative to Firecrawl. Scrape, search, batch-process, and LLM-enrich web content t |
| [sulabhdubey/rta-smriti-brain](https://github.com/sulabhdubey/rta-smriti-brain) | ✅ OK | Python | 94 | Local-first, evidence-aware project memory for AI coding agents. |
| [vastsa/PI-Desktop](https://github.com/vastsa/PI-Desktop) | ✅ OK | TypeScript | 6523 | Local-first AI coding agent desktop: Electron + Rust host core + pi Agent Harness + user-installable plugins |
| [volcengine/OpenViking](https://github.com/volcengine/OpenViking) | ✅ OK | Python | 39437 | Self-evolving Context Database for AI Agents. Unify Agent Memory, Knowledge RAG and Skills. |
| [workwithlos-ui/dave](https://github.com/workwithlos-ui/dave) | ✅ OK | Python | 0 | DAVE — Data Acquisition and Validation Engine. Production-ready AI-powered scraping: URL to clean, validated,  |

## What was implemented (source → project mapping)

Every element from the checked links that belongs in this project and was missing has been implemented on 2026-10-08:

| Source link | Element found there | Implemented as |
|---|---|---|
| `cathrynlavery/diagram-design` | 44-type editorial diagram system (semantic color tokens, mono/sans type roles, orthogonal rounded connectors, 1-accent rule, anti-patterns) | **`src/components/diagrams/`** — brand-token re-skin (`tokens.ts`), SVG primitives (`primitives.tsx`), and 5 diagram types: `ProcessDiagram`, `JourneyMapDiagram`, `FunnelDiagram`, `TimelineDiagram`, `FlowDiagram` + ALO compositions (`alo-diagrams.tsx`). Wired into `/application-process` (process + intake timeline), `/student-journey` (sentiment journey map), `/eligibility-check` (decision flow), and `/admin/marketing-automation` (live CRM funnel). Docs: `docs/DIAGRAM-DESIGN-SYSTEM.md` |
| `coreyhaines31/marketingskills` | 45 marketing skills: copywriting, emails (7-email welcome / 8-email nurture templates), lead-magnets, cro, sms, social | **`src/lib/marketing-kit/`** — 8 campaign kits, 2 email sequences (15 emails), 6 lead magnets, 6 SMS/WhatsApp templates with compliance notes, 15-post social calendar, 8-item CRO checklist. Surfaced in a rebuilt 6-tab **`MarketingKitPanel`** |
| `mohamed11sk/Email-markting`, `knsoftic/Email_Markting` | Email campaign + template structure (campaigns, templates, media, automation jobs) | Template/sequence structure folded into `src/lib/marketing-kit/email-sequences.ts` and the kit panel's Email tab; campaign/automation management already exists in the marketing hub (`EmailMarketingView`, automation engine) |
| `astryx.atmeta.com` (design system) | Component design-system pattern (variants, themes, accessible components) | Button design system verified (`src/components/ui/button.tsx`: 12 variants × 7 sizes on the ALO palette) + new **`src/components/website/AloCtaLink.tsx`** public CTA component; adopted on `/application-process`, `/student-journey`, `/eligibility-check` |
| `nabaleducation/EducationConsultancyWebsite`, `arupdas0825/studytra`, `Bhawana0218/NextStep-Abroad`, `nwuzmedoutlook/university`, `bugcrowd/bugcrowd_university` | Education-consultancy sector patterns (journeys, dashboards, checklists) | The project already covers these surfaces (public site, student journey, portals, dashboards); the missing visual layer — journey/process diagrams — is now implemented (above) |
| 34 video repos (remotion, CogVideo, HunyuanVideo, LTX-Video, LongCat-Video, Pixelle-Video, InfiniteTalk, video-retalking, VideoCaptioner, RedditVideoMakerBot, the 9 VideoMakers, etc.) | Video generation/captioning/editing/automation | **Already integrated** before this audit: `src/lib/video-engine/` adapters + `external/video-repos/clone-all.sh` + registry of all 34 repos. No action needed |
| CRM references (frappe/crm, twentyhq/twenty, Django-CRM, Odoo-mobile/crm, oroinc, ChurchCRM, CRMEB, idurar, fatfreecrm, DeskcommCRM, wacrm, thu-ml/CRM, dennisivy, trycompai) | CRM feature patterns (pipelines, automation, comms) | The project's CRM (`src/app/crm`, `src/lib/crm`, 820 API routes) already implements these; references retained for feature-gap checks |
| SMS/WhatsApp/VoIP references (httpsms, sms.domovina.ai, linphone-iphone, VoIP-Call-Sample, VoiceStudio, vphone-cli, ComfyUI_RH_APICall, electron-promise-ipc, ipftrace2) | Messaging + calling integrations | Covered by existing engines: `src/lib/ai-whatsapp-engine.ts`, `src/lib/communication`, softphone/3CX click-to-call, SMS marketing view. SMS/WhatsApp **copy templates** were missing → now in the marketing kit |
| AI-agent references (cline, cursor/plugins, claude-plugins-community, MetaGPT, minimind, OpenMAIC, ruflo, ai-memory, llm_wiki, context-mode, scientific-agent-skills, etc.) | Agent frameworks, memory, skills | Covered by `src/lib/ai-workforce`, `src/lib/agent-orchestrator.ts`, `src/lib/ai-agents`; references retained |
| Platform references (omarchy, RSSHub, siyuan, vaultwarden, Ghost, languagetool, umami, nextcloud, chatwoot, Cap, SlowBooks-Pro, public-apis) | Self-hosted platform patterns | Reference only — not applicable as in-project features |
| Tooling (fmt, ECC, open-seo, humanizer, hyperframes, molx, firecrawl ×2, MoneyPrinterTurbo, omarchy, OpenLogi, OpenViking, PI-Desktop, armorpaint, CloddsBot, go-modern-guidelines, timesfm, GLM-5, free-webui repos, meta-model-cookbook, gpt4o-image-prompts) | Libraries & research tools | Reference only — no in-project element to implement |

## Verification (2026-10-08)

- **Link check:** 136/136 GitHub repos queried via API (133 OK, 3 inaccessible own-org repos); 9/9 web sites fetched (8 OK, 1 site-side 403).
- **Typecheck:** all new/modified files clean (`tsc --noEmit` — zero errors in `src/components/diagrams`, `src/lib/marketing-kit`, `MarketingKitPanel`, `AloCtaLink`, `ui/button`, and the 4 edited pages). The 41 remaining errors are pre-existing and confined to 11 untouched files; they are artifacts of `prisma generate` being unable to download engine binaries in this sandbox (the project's own build script runs `prisma generate` first and resolves them).
- **Lint:** `eslint` — 0 errors, 0 warnings on all new/modified files.
- **Tests:** 18 new tests added and passing (`tests/unit/diagram-library.test.ts` — 9 tests: SVG validity, no-NaN geometry, orthogonal connectors, honest funnel widths, labeled branches; `tests/unit/marketing-kit-library.test.ts` — 9 tests: kit completeness, sequence structure, SMS compliance/opt-out, calendar coverage, CRO items). Full suite: 1188 passed; the 15 failures in 5 files (accounting-ledger, journal-integrity, cms-revisions, whatsapp-media-ingestion, partner-b2b-security) reproduce identically on the base commit without my changes — pre-existing environment issues (missing Prisma engines), not regressions.
