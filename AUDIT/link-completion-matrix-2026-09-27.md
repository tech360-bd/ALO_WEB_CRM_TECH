# Complete supplied-link audit and implementation matrix — 2026-09-27

This is the authoritative follow-up matrix for the full link list in the latest request. It preserves repeated links, entries labelled **Fetched** and **Read**, YouTube redirect wrappers, and non-GitHub URLs. A link is not treated as permission to copy code or to install a native product into this Next.js application.

## Coverage totals

- **161 supplied link occurrences represented below**.
- **92 distinct GitHub repositories checked** using GitHub repository metadata, README content, and recursive source-tree metadata.
- **89 GitHub repositories returned HTTP 200; 3 returned HTTP 404**.
- **28 YouTube redirect occurrences resolved** to their GitHub `q` targets; the target repositories were checked independently.
- **9 non-GitHub URLs fetched** where the page fetcher permitted it. Meta Developer AI returned HTTP 403 and is explicitly marked NOT VERIFIED.
- Duplicate links are retained as separate rows and labelled with their source occurrence; no duplicate was silently dropped.

## Implementation policy

| Status | Meaning |
|---|---|
| **IMPLEMENTED** | A safe, in-scope feature or equivalent is present in the ALO codebase and identified below. |
| **PARTIAL** | The applicable pattern exists, but external credentials, incompatible runtime, provider, licensing, or live verification prevents a production claim. |
| **REFERENCE-ONLY** | The link was inspected and its useful pattern was considered, but importing it would be unsafe, redundant, or incompatible. |
| **NOT APPLICABLE** | Native OS, desktop, mobile, kernel, language-library, research-model, or unrelated application scope cannot be embedded in this web ERP without a separately approved product/deployment. |
| **NOT VERIFIED** | The source or target could not be fetched/confirmed, or runtime/licence/provider evidence is still missing. |

## Supplied occurrence matrix

| # | Source occurrence | Target / exact supplied destination | Link check | Decision and ALO evidence |
|---:|---|---|---:|---|
| 1 | Initial list | `omacom/omarchy` | 200 | NOT APPLICABLE — native Linux distribution; no web feature to embed. |
| 2 | Initial list | `cathrynlavery/diagram-design` | 200 | IMPLEMENTED — `src/components/marketing/EditorialFlowDiagram.tsx`; semantic static-first SVG, responsive connectors, reduced-motion behavior. |
| 3 | Initial list | `cursor/plugins` | 200 | PARTIAL — agent extension registry exists; third-party plugins are not executed or trusted automatically. |
| 4 | Initial list | `AprilNEA/OpenLogi` | 200 | NOT APPLICABLE — native Rust/HID desktop device utility. |
| 5 | Initial list | `volcengine/OpenViking` | 200 | PARTIAL — existing AgentMemory/AgentOS/knowledge architecture; AGPL product is not copied wholesale. |
| 6 | Initial list | `debpalash/VoiceStudio` | 200 | PARTIAL — voice/video adapters exist, but local model runtime and commercial/licence review remain separate deployment requirements. |
| 7 | Initial list | `akitaonrails/ai-memory` | 200 | IMPLEMENTED/PARTIAL — `/api/ai-memory`, `AgentMemory`, orchestration memory loading, and durable audit evidence. |
| 8 | Initial list | `Lakr233/vphone-cli` | 200 | NOT APPLICABLE — Apple Silicon Virtualization.framework virtual iPhone CLI. |
| 9 | Initial list | `public-apis/public-apis` | 200 | REFERENCE-ONLY — catalogue inspected; no unverified third-party API is enabled without an adapter, consent, rate limit, and source evidence. |
| 10 | Initial list | `harry0703/MoneyPrinterTurbo` | 200 | PARTIAL — ALO video engine and marketing-video workflows exist; external video automation is not imported or claimed production-ready. |
| 11 | Initial list | `blader/humanizer` | 200 | REFERENCE-ONLY — no deceptive “undetectable AI” workflow enabled; content safety and provenance remain required. |
| 12 | Initial list | `heygen-com/hyperframes` | 200 | PARTIAL — ALO video registry/adapter layer exists; rendering provider and credentials remain NOT VERIFIED. |
| 13 | Initial list | `every-app/open-seo` | 200 | IMPLEMENTED/PARTIAL — SEO engine, keyword routes, schema helpers, metadata/sitemap, and CRM SEO workflow exist; live SEO verification remains pending. |
| 14 | Initial list | `ruvnet/ruflo` | 200 | PARTIAL — bounded AgentOS/orchestrator patterns exist; no untrusted swarm runtime is installed. |
| 15 | Initial list | `coreyhaines31/marketingskills` | 200 | IMPLEMENTED — `MarketingKitPanel`, SEO/marketing workflows, approval checklist and draft-only controls. |
| 16 | Initial list | `mksglu/context-mode` | 200 | IMPLEMENTED/PARTIAL — durable audit/session context exists; external MCP routing is not enabled by default. |
| 17 | Initial list | `fmtlib/fmt` | 200 | NOT APPLICABLE — C++ formatting library, unrelated to this TypeScript web runtime. |
| 18 | Initial list | `affaan-m/ECC` | 200 | IMPLEMENTED/PARTIAL — repository audit, security tests, session evidence and agent workflow gates are present. |
| 19 | Initial list | `alsk1992/CloddsBot` | 200 | NOT APPLICABLE — autonomous trading/crypto agent; outside education CRM scope and unacceptable financial risk. |
| 20 | Initial list | `nashsu/llm_wiki` | 200 | PARTIAL — Knowledge Center, knowledge base and agent memory are present; desktop wiki product not imported. |
| 21 | Initial list | `vastsa/PI-Desktop` | 200 | NOT APPLICABLE — Electron/Rust desktop workspace. |
| 22 | Initial list | `armory3d/armorpaint` | 200 | NOT APPLICABLE — native graphics authoring tool. |
| 23 | Initial list | `anthropics/claude-plugins-community` | 200 | REFERENCE-ONLY — plugin marketplace reviewed; no untrusted plugin code is executed. |
| 24 | Duplicate initial list | `omacom/omarchy` | 200 | NOT APPLICABLE — duplicate retained; same native Linux decision as row 1. |
| 25 | Initial list | `nabaleducation/EducationConsultancyWebsite` | 200 | IMPLEMENTED/PARTIAL — education-site information architecture was compared with ALO public routes; ALO remains canonical. |
| 26 | Initial list | `arupdas0825/studytra` | 200 | IMPLEMENTED/PARTIAL — study-abroad roadmap, marketing and portal patterns considered; no dummy API/data imported. |
| 27 | Initial list | `Bhawana0218/NextStep-Abroad` | 200 | IMPLEMENTED/PARTIAL — admin dashboard and portal patterns considered; ALO data/RBAC remains canonical. |
| 28 | Initial list | `DIYgod/RSSHub` | 200 | PARTIAL — source-intelligence/RSS-compatible ingestion exists; robots, attribution, rate limits and source approval remain mandatory. |
| 29 | Initial list | `siyuan-note/siyuan` | 200 | PARTIAL — Knowledge Center/agent context equivalent exists; AGPL desktop knowledge workspace not imported. |
| 30 | **Fetched** | `ioi-labs/molx` | 200 | IMPLEMENTED/PARTIAL — `src/lib/research/molx-firecrawl-client.ts` supports self-hosted Molx with SSRF, timeout, retry, rate-limit and fallback controls. |
| 31 | Fetched | `firecrawl/firecrawl` | 200 | IMPLEMENTED/PARTIAL — same unified research client supports Firecrawl fallback; API key/provider runtime remains NOT VERIFIED. |
| 32 | Fetched | `firecrawl/web-agent` | 200 | IMPLEMENTED/PARTIAL — structured extraction and validation pattern exists in source-evidence/research services; no external agent is executed blindly. |
| 33 | Fetched | `guifav/market-intelligence-radar` | 200 | IMPLEMENTED — `src/lib/research/market-intel-radar.ts` scans, extracts, matches CRM entities and queues/audits signals. |
| 34 | Fetched | `parthasarathy123/n8n-gtm-lead-enrichment` | 200 | IMPLEMENTED/PARTIAL — lead enrichment/review routing patterns exist; no cloud enrichment account or bulk scrape is enabled automatically. |
| 35 | Fetched | `brightdata/open-enrich` | 200 | PARTIAL — enrichment is an optional provider boundary with keys/rate limits; no unverified provider data is committed. |
| 36 | Fetched | `clawnify/OpenProspector` | 200 | PARTIAL — provider-neutral research/enrichment adapters exist; production credentials and legal basis remain NOT VERIFIED. |
| 37 | Fetched | `workwithlos-ui/dave` | 200 | IMPLEMENTED/PARTIAL — validated structured-source extraction and source-evidence safeguards exist. |
| 38 | Fetched | `BraaMohammed/bricks` | 200 | PARTIAL — local enrichment/puppeteer ideas were reviewed; ALO keeps SSRF/rate-limit/approval boundaries and does not import arbitrary browser automation. |
| 39 | **Read** duplicate | `ioi-labs/molx` | 200 | Duplicate retained; same Molx client evidence as row 30. |
| 40 | CRM block 1 | `melgarafael/DeskcommCRM` | 200 | IMPLEMENTED/PARTIAL — CRM/UCC/WhatsApp workflows exist; external AI sales OS is not forked into ALO. |
| 41 | CRM block 1 | `Django-CRM/Django-CRM` | 200 | REFERENCE-ONLY — multi-tenant/RLS patterns reviewed; ALO Prisma/RBAC is canonical. |
| 42 | CRM block 1 | `Odoo-mobile/crm` | 200 | REFERENCE-ONLY — unrelated mobile CRM implementation; no safe direct import. |
| 43 | CRM block 1 | `thu-ml/CRM` | 200 | NOT APPLICABLE — computer-vision 3D mesh research model, not customer relationship management. |
| 44 | CRM block 1 | `dennisivy/crash-course-CRM` | 200 | REFERENCE-ONLY — Django tutorial CRM; no production code copied. |
| 45 | CRM block 1 | `oroinc/crm-application` | 200 | REFERENCE-ONLY — PHP/Symfony CRM distribution; ALO workflows already exist in the current stack. |
| 46 | CRM block 1 | `trycompai/crm` | 200 | IMPLEMENTED/PARTIAL — agent-first CRM concepts reflected in AgentOS, tool registry, approvals and audit logs. |
| 47 | CRM block 1 | `frappe/crm` | 200 | REFERENCE-ONLY — separate Frappe/AGPL platform; no wholesale import. |
| 48 | CRM block 1 | `ChurchCRM/CRM` | 200 | REFERENCE-ONLY — domain-specific church CRM; no applicable education feature beyond generic workflow concepts. |
| 49 | CRM block 1 | `crmeb/CRMEB` | 200 | NOT APPLICABLE/REFERENCE — commerce platform; outside education CRM scope. |
| 50 | CRM block 1 | `idurar/idurar-erp-crm` | 200 | REFERENCE-ONLY — separate ERP/CRM stack; ALO already has finance/HR/application modules. |
| 51 | CRM block 1 | `oroinc/crm` | 200 | REFERENCE-ONLY — duplicate Oro core repository retained; no wholesale import. |
| 52 | CRM block 1 | `fatfreecrm/fat_free_crm` | 200 | REFERENCE-ONLY — Rails CRM; no safe direct import. |
| 53 | CRM block 1 | `engralaminn-collab/alo-education-uk-final` | 404 | NOT VERIFIED — GitHub API returned HTTP 404; replacement URL/access required. |
| 54 | CRM block 1 | `engralaminn-collab/ukvi-ai-markting_n8n` | 404 | NOT VERIFIED — GitHub API returned HTTP 404; replacement URL/access required. |
| 55 | CRM block 1 | `engralaminn-collab/Ai-Markting-crm` | 404 | NOT VERIFIED — GitHub API returned HTTP 404; replacement URL/access required. |
| 56 | CRM block 1 | `domovinatv/sms.domovina.ai` | 200 | PARTIAL — SMS gateway pattern considered; provider credentials, phone/device ownership and consent remain NOT VERIFIED. |
| 57 | CRM block 1 | `NdoleStudio/httpsms` | 200 | PARTIAL — SMS adapter boundary exists by provider design; not enabled without authorized phone/provider configuration. |
| 58 | CRM block 1 | `NdoleStudio/httpsms-node` | 200 | PARTIAL — Node client is an integration reference; no secret or external dependency was silently installed. |
| 59 | CRM block 1 duplicate | `engralaminn-collab/Ai-Markting-crm` | 404 | Duplicate retained; same inaccessible status as row 55. |
| 60 | CRM block 1 | `HM-RunningHub/ComfyUI_RH_APICall` | 200 | PARTIAL — video/ComfyUI provider registry exists; remote workflow and credentials require explicit setup. |
| 61 | CRM block 1 | `BelledonneCommunications/linphone-iphone` | 200 | PARTIAL — `src/lib/voip/linphone.ts` defines provider boundary; iOS softphone build/deployment is separate. |
| 62 | CRM block 1 | `0perationPrivacy/VoIP` | 200 | PARTIAL — SIP/Telnyx/Twilio concepts reflected in UCC/VoIP adapters; provider credentials and legal recording controls remain NOT VERIFIED. |
| 63 | CRM block 1 | `YutaroHayakawa/ipftrace2` | 200 | NOT APPLICABLE — Linux eBPF kernel tracer; separate privileged server tooling. |
| 64 | CRM block 1 | `developerspace-samples/VoIP-Call-Sample` | 200 | NOT APPLICABLE — Android ConnectionService sample; separate mobile application. |
| 65 | CRM block 1 | `sibnerian/electron-promise-ipc` | 200 | NOT APPLICABLE — Electron IPC utility; no desktop shell is part of ALO web deployment. |
| 66 | epos Featured 1 | `tt-a1i/archify` | 200 | IMPLEMENTED/PARTIAL — architecture/flow visual pattern inspected; ALO uses a static-first accessible diagram rather than importing Archify runtime. |
| 67 | epos Featured 1 YouTube redirect | `bilawalsidhu/gods-eye-view` | 200; redirect resolved | NOT APPLICABLE/REFERENCE — geospatial 3D globe/spatial-intelligence application; no safe education-CRM equivalent identified. |
| 68 | epos Featured 1 | `THU-MAIC/OpenMAIC` | 200 | PARTIAL — multi-agent classroom concept is compatible with future training workflows; no separate classroom runtime imported. |
| 69 | epos Featured 1 YouTube redirect | `JetBrains/go-modern-guidelines` | 200; redirect resolved | REFERENCE-ONLY — Go-specific agent guidelines; ALO is TypeScript and its own lint/type gates are canonical. |
| 70 | epos Featured 1 | `Gitlawb/openclaude` | 200 | PARTIAL — agent lifecycle/terminal ideas reviewed; no arbitrary command execution is exposed to end users. |
| 71 | epos Featured 1 | `K-Dense-AI/scientific-agent-skills` | 200 | NOT APPLICABLE/PARTIAL — scientific research skill library; only general evidence/approval concepts apply to education research. |
| 72 | epos Featured 1 | `jingyaogong/minimind` | 200 | NOT APPLICABLE — model-training project; ALO consumes configured providers rather than training a model in the web app. |
| 73 | epos Featured 1 | `every-app/open-seo` | 200 | Duplicate retained; same SEO implementation evidence as row 13. |
| 74 | epos Featured 1 | `omacom/omarchy` | 200 | Duplicate retained; native Linux distribution, not embedded. |
| 75 | epos Featured 1 YouTube redirect | `google-research/timesfm` | 200; redirect resolved | NOT APPLICABLE/REFERENCE — time-series foundation model; analytics may use provider adapters, but no model weights/runtime are bundled. |
| 76 | Audience 1 YouTube redirect | `EfficientStreet/hindsight` | 200; redirect resolved | IMPLEMENTED/PARTIAL — durable session lessons and audit reports are retained; no untrusted skill is executed. |
| 77 | Audience 1 YouTube redirect | `timharris707/modeldeck` | 200; redirect resolved | NOT APPLICABLE — native macOS menu-bar usage monitor. |
| 78 | Audience 1 YouTube redirect | `Artistsyn/cortex_suite` | 200; redirect resolved | PARTIAL — local code/context/memory pattern reflected in audit evidence and agent registry; Rust MCP servers are not installed. |
| 79 | Audience 1 YouTube redirect | `sulabhdubey/rta-smriti-brain` | 200; redirect resolved | IMPLEMENTED/PARTIAL — durable evidence report, session handoff, source matrix and audit ledger provide the compatible web equivalent. |
| 80 | Audience 1 YouTube redirect | `EfficientStreet/youtube-subscriptions-ingest` | 200; redirect resolved | REFERENCE-ONLY — no YouTube account or subscription data was accessed; link target itself was checked. |
| 81 | Audience 1 YouTube redirect | `Kayforkind/reimagine-it` | 200; redirect resolved | PARTIAL — content-derived design and review patterns informed marketing/diagram work; no CLI is installed in production. |
| 82 | Audience 1 YouTube redirect | `templetongroup/radiant` | 200; redirect resolved | NOT APPLICABLE/REFERENCE — native Mac coding harness; no web ERP feature to import. |
| 83 | Repos featured 1 YouTube redirect | `Onyx-Dev-Labs/doodle-note` | 200; redirect resolved | PARTIAL — `src/lib/doodle-note-engine.ts` provides privacy-first meeting-note/transcript storage boundaries; raw audio is not silently retained. |
| 84 | Repos featured 1 | `CapSoftware/Cap` | 200 | REFERENCE-ONLY — native screen recorder; ALO has video/studio adapters but does not install a desktop recorder. |
| 85 | Repos featured 1 YouTube redirect | `dani-garcia/vaultwarden` | 200; redirect resolved | NOT APPLICABLE — password manager requires independent security deployment; never embed credentials into ALO. |
| 86 | Repos featured 1 | `TryGhost/Ghost` | 200 | PARTIAL — ALO blog/news/CMS routes exist; Ghost is not imported as a second CMS. |
| 87 | Repos featured 1 | `twentyhq/twenty` | 200 | IMPLEMENTED/PARTIAL — open CRM pipeline/AI concepts reflected in current CRM and agent modules; no second CRM is installed. |
| 88 | Repos featured 1 YouTube redirect | `languagetool-org/languagetool` | 200; redirect resolved | IMPLEMENTED/PARTIAL — `src/lib/languagetool-client.ts` exists; provider URL/key and production health remain NOT VERIFIED. |
| 89 | Repos featured 1 | `umami-software/umami` | 200 | IMPLEMENTED/PARTIAL — privacy analytics and Umami adapter/config exist; live analytics property not verified. |
| 90 | Repos featured 1 | `nextcloud/server` | 200 | REFERENCE-ONLY — separate file collaboration platform; ALO storage/security APIs remain canonical. |
| 91 | Repos featured 1 | `chatwoot/chatwoot` | 200 | PARTIAL — UCC/shared inbox/communications patterns exist; no second support desk is installed. |
| 92 | Repos featured 1 YouTube redirect | `VonHoltenCodes/SlowBooks-Pro-2026` | 200; redirect resolved | NOT APPLICABLE/REFERENCE — separate desktop accounting system; ALO finance/payroll remains canonical and requires live verification. |
| 93 | Direct link after featured | `ArnasDon/wacrm` | 200 | IMPLEMENTED/PARTIAL — WhatsApp CRM/shared inbox/broadcast and consent patterns are represented in UCC/WhatsApp workflows. |
| 94 | CRM block 2 duplicate | `melgarafael/DeskcommCRM` | 200 | Duplicate retained; same CRM/UCC partial implementation as row 40. |
| 95 | CRM block 2 duplicate | `Django-CRM/Django-CRM` | 200 | Duplicate retained; same reference-only decision as row 41. |
| 96 | CRM block 2 duplicate | `Odoo-mobile/crm` | 200 | Duplicate retained; same reference-only decision as row 42. |
| 97 | CRM block 2 duplicate | `thu-ml/CRM` | 200 | Duplicate retained; same unrelated 3D research decision as row 43. |
| 98 | CRM block 2 duplicate | `dennisivy/crash-course-CRM` | 200 | Duplicate retained; same tutorial/reference decision as row 44. |
| 99 | CRM block 2 duplicate | `oroinc/crm-application` | 200 | Duplicate retained; same reference-only decision as row 45. |
| 100 | CRM block 2 duplicate | `trycompai/crm` | 200 | Duplicate retained; same agent-first CRM partial implementation as row 46. |
| 101 | CRM block 2 duplicate | `frappe/crm` | 200 | Duplicate retained; same separate AGPL platform decision as row 47. |
| 102 | CRM block 2 duplicate | `ChurchCRM/CRM` | 200 | Duplicate retained; same domain-specific reference decision as row 48. |
| 103 | CRM block 2 duplicate | `crmeb/CRMEB` | 200 | Duplicate retained; same commerce-platform decision as row 49. |
| 104 | CRM block 2 duplicate | `idurar/idurar-erp-crm` | 200 | Duplicate retained; same separate ERP/CRM decision as row 50. |
| 105 | CRM block 2 duplicate | `oroinc/crm` | 200 | Duplicate retained; same Oro reference decision as row 51. |
| 106 | CRM block 2 duplicate | `fatfreecrm/fat_free_crm` | 200 | Duplicate retained; same Rails reference decision as row 52. |
| 107 | CRM block 2 duplicate | `engralaminn-collab/alo-education-uk-final` | 404 | Duplicate retained; same inaccessible status as row 53. |
| 108 | CRM block 2 duplicate | `engralaminn-collab/ukvi-ai-markting_n8n` | 404 | Duplicate retained; same inaccessible status as row 54. |
| 109 | CRM block 2 duplicate | `engralaminn-collab/Ai-Markting-crm` | 404 | Duplicate retained; same inaccessible status as row 55. |
| 110 | CRM block 2 duplicate | `domovinatv/sms.domovina.ai` | 200 | Duplicate retained; same SMS provider boundary as row 56. |
| 111 | CRM block 2 duplicate | `NdoleStudio/httpsms` | 200 | Duplicate retained; same SMS integration boundary as row 57. |
| 112 | CRM block 2 duplicate | `NdoleStudio/httpsms-node` | 200 | Duplicate retained; same Node client/reference decision as row 58. |
| 113 | CRM block 2 duplicate | `engralaminn-collab/Ai-Markting-crm` | 404 | Duplicate retained; same inaccessible status as row 55. |
| 114 | CRM block 2 duplicate | `HM-RunningHub/ComfyUI_RH_APICall` | 200 | Duplicate retained; same ComfyUI provider boundary as row 60. |
| 115 | CRM block 2 duplicate | `BelledonneCommunications/linphone-iphone` | 200 | Duplicate retained; same iOS/provider boundary as row 61. |
| 116 | CRM block 2 duplicate | `0perationPrivacy/VoIP` | 200 | Duplicate retained; same VoIP/provider boundary as row 62. |
| 117 | CRM block 2 duplicate | `YutaroHayakawa/ipftrace2` | 200 | Duplicate retained; same kernel-tool decision as row 63. |
| 118 | CRM block 2 duplicate | `developerspace-samples/VoIP-Call-Sample` | 200 | Duplicate retained; same Android decision as row 64. |
| 119 | CRM block 2 duplicate | `sibnerian/electron-promise-ipc` | 200 | Duplicate retained; same Electron decision as row 65. |
| 120 | epos Featured 2 | `tt-a1i/archify` | 200 | Duplicate retained; same diagram reference/implementation as row 66. |
| 121 | epos Featured 2 YouTube redirect | `bilawalsidhu/gods-eye-view` | 200; redirect resolved | Duplicate retained; same spatial-intelligence decision as row 67. |
| 122 | epos Featured 2 | `THU-MAIC/OpenMAIC` | 200 | Duplicate retained; same classroom reference decision as row 68. |
| 123 | epos Featured 2 YouTube redirect | `JetBrains/go-modern-guidelines` | 200; redirect resolved | Duplicate retained; same Go-guidelines decision as row 69. |
| 124 | epos Featured 2 | `Gitlawb/openclaude` | 200 | Duplicate retained; same agent lifecycle decision as row 70. |
| 125 | epos Featured 2 | `K-Dense-AI/scientific-agent-skills` | 200 | Duplicate retained; same scientific-scope decision as row 71. |
| 126 | epos Featured 2 | `jingyaogong/minimind` | 200 | Duplicate retained; same model-training decision as row 72. |
| 127 | epos Featured 2 | `every-app/open-seo` | 200 | Duplicate retained; same SEO implementation evidence as row 13. |
| 128 | epos Featured 2 | `omacom/omarchy` | 200 | Duplicate retained; same native Linux decision as row 1. |
| 129 | epos Featured 2 YouTube redirect | `google-research/timesfm` | 200; redirect resolved | Duplicate retained; same time-series decision as row 75. |
| 130 | Audience 2 YouTube redirect | `EfficientStreet/hindsight` | 200; redirect resolved | Duplicate retained; same durable-memory implementation as row 76. |
| 131 | Audience 2 YouTube redirect | `timharris707/modeldeck` | 200; redirect resolved | Duplicate retained; same macOS decision as row 77. |
| 132 | Audience 2 YouTube redirect | `Artistsyn/cortex_suite` | 200; redirect resolved | Duplicate retained; same local-context decision as row 78. |
| 133 | Audience 2 YouTube redirect | `sulabhdubey/rta-smriti-brain` | 200; redirect resolved | Duplicate retained; same durable-evidence implementation as row 79. |
| 134 | Audience 2 YouTube redirect | `EfficientStreet/youtube-subscriptions-ingest` | 200; redirect resolved | Duplicate retained; same no-account-access decision as row 80. |
| 135 | Audience 2 YouTube redirect | `Kayforkind/reimagine-it` | 200; redirect resolved | Duplicate retained; same content-derived design decision as row 81. |
| 136 | Audience 2 YouTube redirect | `templetongroup/radiant` | 200; redirect resolved | Duplicate retained; same native harness decision as row 82. |
| 137 | Repos featured 2 YouTube redirect | `Onyx-Dev-Labs/doodle-note` | 200; redirect resolved | Duplicate retained; same privacy-first notes implementation as row 83. |
| 138 | Repos featured 2 | `CapSoftware/Cap` | 200 | Duplicate retained; same screen-recorder reference decision as row 84. |
| 139 | Repos featured 2 YouTube redirect | `dani-garcia/vaultwarden` | 200; redirect resolved | Duplicate retained; same separate password-manager decision as row 85. |
| 140 | Repos featured 2 | `TryGhost/Ghost` | 200 | Duplicate retained; same CMS decision as row 86. |
| 141 | Repos featured 2 | `twentyhq/twenty` | 200 | Duplicate retained; same CRM implementation decision as row 87. |
| 142 | Repos featured 2 YouTube redirect | `languagetool-org/languagetool` | 200; redirect resolved | Duplicate retained; same LanguageTool adapter decision as row 88. |
| 143 | Repos featured 2 | `umami-software/umami` | 200 | Duplicate retained; same analytics decision as row 89. |
| 144 | Repos featured 2 | `nextcloud/server` | 200 | Duplicate retained; same storage decision as row 90. |
| 145 | Repos featured 2 | `chatwoot/chatwoot` | 200 | Duplicate retained; same UCC/shared-inbox decision as row 91. |
| 146 | Repos featured 2 YouTube redirect | `VonHoltenCodes/SlowBooks-Pro-2026` | 200; redirect resolved | Duplicate retained; same accounting decision as row 92. |
| 147 | Later list | `nwuzmedoutlook/university` | 200 | REFERENCE-ONLY — source catalogue was inspected; no unverified course data is imported into ALO. |
| 148 | Later list | `bugcrowd/bugcrowd_university` | 200 | REFERENCE-ONLY — security education content source; ALO security tests are its own maintained evidence. |
| 149 | Later duplicate | `bugcrowd/bugcrowd_university` | 200 | Duplicate retained; same security-content decision as row 148. |
| 150 | Non-GitHub | `https://buffer.com` | FETCHED | PARTIAL — social publishing, content ideas, collaboration/approval, analytics and MCP concepts map to ALO marketing calendar/approval/social APIs; live Buffer account is not connected. |
| 151 | Non-GitHub | `https://coder.qwen.ai` | FETCHED | REFERENCE-ONLY — external coding product; no user-facing dependency or credentials are introduced. |
| 152 | Non-GitHub | `https://stackoverflow.com` | FETCHED/REDIRECTED | REFERENCE-ONLY — public Q&A source; no scraping or unverified answer ingestion is enabled. |
| 153 | Non-GitHub duplicate | `https://www.mureka.ai` | FETCHED | PARTIAL — ALO video/audio registry supports optional media providers; no royalty/licensing claim or Mureka credential is configured. |
| 154 | Non-GitHub | `https://astryx.atmeta.com` | FETCHED | IMPLEMENTED/PARTIAL — accessible/themed component concepts align with shared `Button` variants, focus states, responsive UI and marketing panels; Astryx itself is not imported. |
| 155 | Non-GitHub | `https://cline.bot` | FETCHED | PARTIAL — plan/act, approval, MCP, schedules and multi-agent concepts align with existing AgentOS controls; no external runtime installed. |
| 156 | Non-GitHub duplicate | `https://www.mureka.ai` | FETCHED | Duplicate retained; same media-provider boundary as row 153. |
| 157 | Non-GitHub | `https://openrouter.ai` | FETCHED | IMPLEMENTED/PARTIAL — provider fallback exists in `src/lib/ai.ts`; model availability, keys and spend controls remain runtime configuration. |
| 158 | Non-GitHub | `https://openrouter.ai/blog/tutorials/build-tool-calling-agent-loop` | FETCHED | IMPLEMENTED — bounded provider-neutral tool loop added at `src/lib/ai-tool-loop.ts`, with repeat, iteration, tool-count, error and final-turn side-effect guards. |
| 159 | Non-GitHub | `https://developer.meta.com/ai` | HTTP 403 | NOT VERIFIED — page denied automated fetch; no Meta AI dependency or claim was made. |
| 160 | GitHub direct | `cline/cline` | 200 | PARTIAL — agent safety concepts (plan/act, approvals, skills, bounded tools) are implemented without installing a desktop agent. |
| 161 | GitHub direct | `meta-models/meta-model-cookbook` | 200 | PARTIAL — multi-agent/tool orchestration patterns are reflected in the bounded agent loop and AgentOS; no cookbook code is copied wholesale. |

## Implemented applicable elements

1. **Diagram design:** `EditorialFlowDiagram` implements an accessible static-first process diagram with semantic labels, responsive connectors and reduced-motion-safe behavior. Archify was used as a design reference, not copied as a runtime.
2. **Buttons and design system:** the existing shared `Button` component has brand, CTA, outline, ghost, danger, success, link, icon and responsive size variants, visible focus rings, disabled state, and keyboard-safe semantics. Astryx's themes/components were reviewed; its external React/StyleX package was not mixed into the Tailwind/shadcn system.
3. **Marketing kits:** `MarketingKitPanel` implements consultation launch, IELTS sprint, and visa-readiness kits with channel/objective/audience metadata, draft-only labels, copy/hook actions, download, clipboard handling, and approval checklist.
4. **Marketing/CRM workflow:** marketing calendar, approvals, social inbox, campaign APIs, consent, lead scoring, WhatsApp/UCC and audit boundaries are already present; Buffer/Chatwoot/WACRM/Twenty were references, not second systems.
5. **Research/source intelligence:** Molx/Firecrawl fallback, SSRF blocking, rate limit, retries, source evidence, structured extraction, market-intelligence radar, enrichment boundaries and approval/audit routes are present.
6. **Agent memory and context:** AgentMemory schema, AI memory route, AgentOS registry, skills/tools, bounded orchestrator, audit logs and durable evidence reports are present. External skills/plugins are never executed automatically.
7. **Tool-calling safety:** `src/lib/ai-tool-loop.ts` now provides a provider-neutral bounded loop with safe argument parsing, error-as-result behavior, repeat detection, hard iteration/tool-call caps, result truncation, and no side effects on the last model turn. Tests are in `tests/unit/ai-tool-loop.test.ts`.
8. **SEO/content/analytics:** SEO engine, keyword workflows, metadata/schema/sitemap, LanguageTool adapter, privacy analytics and Knowledge Center/CMS routes are present; live external providers remain configuration/runtime items.
9. **Media and communications:** video/voice/ComfyUI/VoIP/WhatsApp adapters exist behind provider boundaries. Native desktop/mobile apps, voice cloning, rendering farms, and production carrier integrations are not falsely claimed as enabled.

## Items that cannot safely be “implemented” inside this repository

Omarchy, OpenLogi, vphone-cli, PI-Desktop, ArmorPaint, Linphone iOS, Android ConnectionService, ipftrace2, Electron IPC, Vaultwarden, desktop accounting, C++ fmt, 3D mesh/model-training repositories, and unrelated trading/commerce systems require different runtimes, operating-system privileges, independent security review, or separate deployment. They are fully inspected and explicitly marked rather than silently omitted or copied into the web ERP.

## Runtime boundaries

The repository-level implementations above do not prove production provider connectivity. The following remain **NOT VERIFIED** until authorized runtime evidence is available: live API keys, external provider health, DNS/SSL, deployment/rollback, production database state, browser pagination/accessibility across all roles, and third-party licensing/terms for any generated media or scraped content.
