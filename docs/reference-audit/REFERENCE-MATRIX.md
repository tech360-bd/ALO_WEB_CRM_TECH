# Reference Matrix

Status of every reference from the 2026-10-08 audit brief. Evidence levels:

- **README read**: the repository README was fetched via `gh api repos/<slug>/readme` and summarised here. Source code was **not** read.
- **Metadata only**: `gh api repos/<slug>` only (description, SPDX licence, stars, last push). No README or source was read.
- **Candidate**: a GitHub search matched the brief's name. The owner is not confirmed by the brief, so the match needs user confirmation before it counts as the intended reference.
- **Unresolved**: no reliable match was found. The brief gives names only, with no owner or URL.

"Source inspected" is **not claimed for any entry** in this audit. Every decision below is based on metadata or README evidence.

ALO-side evidence was checked against the repository tree (paths given).

## A. Resolved GitHub repositories (23)

| # | Reference (owner/repo) | Licence (GitHub API) | Stars | Last push | Evidence level | What it is | ALO overlap (verified path) | Decision |
|---|---|---|---|---|---|---|---|---|
| 1 | omacom/omarchy | MIT | 44,236 | 2026-10-08 | Metadata only | Linux desktop distribution/config | None | NOT APPLICABLE |
| 2 | cathrynlavery/diagram-design | MIT | 45,452 | 2026-10-08 | README read (screenshot-led) | Editorial diagram patterns | `src/components/marketing/EditorialFlowDiagram.tsx` (its header comment cites this reference) | PATTERN ONLY (applied) |
| 3 | cursor/plugins | **NONE** (no licence file) | 10,306 | 2026-10-08 | Metadata only | Editor plugin collection | None | NOT ADOPTED: no licence, no code reuse |
| 4 | AprilNEA/OpenLogi | Apache-2.0 | 23,123 | 2026-10-08 | Metadata only | Hardware input-device software | None | NOT APPLICABLE |
| 5 | volcengine/OpenViking | **AGPL-3.0** | 39,404 | 2026-10-08 | README read | "Context database for AI agents" | `src/lib/ai-workforce/memory.ts`, `knowledge.ts` | PATTERN ONLY. Do not copy code (AGPL) |
| 6 | debpalash/VoiceStudio | **AGPL-3.0** | 54,884 | 2026-10-08 | Metadata only | Local voice-cloning/TTS studio | Voice work uses the platform speech tool | NOT ADOPTED (AGPL; voice cloning raises consent issues) |
| 7 | akitaonrails/ai-memory | MIT | 9,011 | 2026-10-08 | README read | Long-term memory for coding agents | `src/lib/ai-workforce/memory.ts` | PATTERN ONLY; compare against existing memory module |
| 8 | Lakr233/vphone-cli | MIT | 15,033 | 2026-10-08 | Metadata only (description null) | Swift virtual-phone CLI | None | NOT APPLICABLE (security-sensitive, no product need) |
| 9 | public-apis/public-apis | MIT | 486,861 | 2026-10-05 | Metadata only | Catalogue of public APIs | Integration research list | CATALOGUE ONLY. No code; each API needs separate vetting |
| 10 | harry0703/MoneyPrinterTurbo | MIT | 129,284 | 2026-10-08 | Metadata only | AI short-video generator (script, TTS, stock footage, subtitles) | `src/lib/video-engine/` (Remotion), `src/app/admin/video-studio/` | PATTERN ONLY. Python stack, not adopted. Video provider boundary covers it |
| 11 | blader/humanizer | MIT | 54,782 | 2026-09-28 | README read | Removes AI-writing patterns from text (Python) | AI content generation (`src/lib/ai-workforce/text.ts`) | PATTERN ONLY. Candidate rule set for a content-quality check |
| 12 | heygen-com/hyperframes | Apache-2.0 | 58,822 | 2026-10-08 | README read | "Write HTML. Render video." agent-oriented video framework | Remotion is already used: `package.json` has `remotion`, `@remotion/lambda`, `@remotion/player` | EVALUATE as an alternative video provider behind the provider boundary. Not added. README positions it against the Remotion licence (source-available) |
| 13 | every-app/open-seo | MIT | 22,702 | 2026-10-08 | README read | Self-hostable SEO suite with MCP server, depends on DataForSEO API key | SEO suite: `src/components/crm/seo/` (6 components) | PATTERN ONLY. Paid third-party data dependency, not adopted |
| 14 | ruvnet/ruflo | MIT | 74,101 | 2026-10-08 | Metadata only | Agent orchestration platform (name/metadata only) | AI workforce: `src/lib/ai-workforce/` | NOT ADOPTED pending README/source review |
| 15 | coreyhaines31/marketingskills | MIT | 53,653 | 2026-10-08 | README read | Library of marketing "skills" files for AI agents | AI workforce skills directory `src/lib/ai-workforce/skills/` | PATTERN ONLY (skill-file structure). MIT notice required if any text is copied |
| 16 | mksglu/context-mode | **Elastic-2.0** (README; API returns NOASSERTION) | 25,664 | 2026-10-07 | README read | Context-window reduction for coding agents | None (developer tooling) | NOT ADOPTED. ELv2 forbids hosted/managed use |
| 17 | fmtlib/fmt | MIT | 25,872 | 2026-10-07 | Metadata only | C++ formatting library | None | NOT APPLICABLE |
| 18 | affaan-m/ECC | MIT | 275,149 | 2026-10-05 | Metadata only | Agent-harness/dev-workflow system | None (developer tooling) | NOT APPLICABLE to product |
| 19 | alsk1992/CloddsBot | MIT | 2,908 | 2026-10-02 | Metadata only | Trading agent | None | OUT OF SCOPE |
| 20 | nashsu/llm_wiki | **NOASSERTION** (no clear licence) | 20,300 | 2026-09-28 | Metadata only | LLM-maintained wiki | Knowledge features in `src/lib/ai-workforce/knowledge.ts` | NOT ADOPTED. Licence unclear, do not copy |
| 21 | vastsa/PI-Desktop | **LGPL-3.0** | 6,498 | 2026-10-08 | Metadata only | Desktop app | None | NOT APPLICABLE |
| 22 | armory3d/armorpaint | **NOASSERTION** | 5,332 | 2026-10-07 | Metadata only | 3D painting app (C) | None | NOT APPLICABLE; licence unclear |
| 23 | anthropics/claude-plugins-community | Apache-2.0 | 4,570 | 2026-10-05 | Metadata only | Read-only plugin-marketplace mirror | None | NOT ADOPTED |

## B. Named references with no confirmed owner (brief gave names only)

Search was rate-limited by GitHub partway through, so several names are unresolved. No candidate below is treated as confirmed.

| Name in brief | GitHub search result | Licence | Confidence | Status |
|---|---|---|---|---|
| DeskcommCRM | `melgarafael/DeskcommCRM` (4,480 stars; "self-hosted CRM with native AI agents + WhatsApp (WAHA)"); also `phns-php/DeskcommCRM` (fork) | MIT | Candidate: the star count suggests the main repo | Needs user confirmation. Relevant to ALO's WhatsApp/AI-agent area |
| Django-CRM | `Django-CRM/Django-CRM` (2,441 stars; "Django + SvelteKit, multi-tenant"); `DjangoCRM/django-crm` (632 stars) | MIT / AGPL-3.0 | Candidate, two owners | Needs confirmation. Multi-tenancy is relevant to the B2B brief |
| Odoo | `odoo/odoo` (54,898 stars) | API returns NOASSERTION | Likely the intended repo | Needs confirmation. Do not copy: an ERP suite |
| Crash Course CRM | `dennisivy/crash-course-CRM` (584 stars), `semisbro/crash-course-CRM` | NONE | Low | Needs confirmation. No licence, so no code reuse |
| OroCRM | `sadortun/orocrm` (0 stars, 2016), `oroinc/magento-orocrm-bridge` | NONE | Low. Canonical `oro` repo not verified | Needs the exact URL |
| TryCompAI | `trycompai/crm` (11,136 stars; "agentic-first CRM"); `trycompai/comp` (AGPL-3.0) | MIT / AGPL-3.0 | Candidate | Needs confirmation |
| Frappe CRM | `frappe/crm` (3,750 stars; "fully featured, open source CRM") | AGPL-3.0 | High | Metadata only. AGPL: patterns only |
| ChurchCRM | `ChurchCRM/CRM` (963 stars; church management) | MIT | Candidate | Domain mismatch. Not relevant to ALO |
| CRMEB | not resolved (rate-limited) | - | - | Unresolved |
| IDURAR | not resolved (rate-limited) | - | - | Unresolved |
| Fat Free CRM | not resolved (rate-limited) | - | - | Unresolved |
| Twenty | not resolved (rate-limited) | - | - | Unresolved (`twentyhq/twenty` is the expected repo; not verified) |
| UKVI AI Marketing | not resolved | - | - | Unresolved. Needs the URL |
| AI Marketing CRM | not searched | - | - | Unresolved |
| WA CRM | not resolved (rate-limited) | - | - | Unresolved |
| THU | not searched | - | - | Unresolved. Name is ambiguous |
| Firecrawl | `firecrawl/firecrawl` (189,636 stars); `firecrawl/firecrawl-mcp-server` (MIT) | AGPL-3.0 (main repo) | High | Metadata only. AGPL: use only as a hosted API, if ever |
| OpenProspector | not resolved (rate-limited) | - | - | Unresolved |
| Open Enrich | not resolved (rate-limited) | - | - | Unresolved |
| market-intelligence-radar | not resolved (rate-limited) | - | - | Unresolved |
| n8n | not resolved (rate-limited). ALO already has an n8n integration (`src/lib/video-engine/n8n/`, `src/components/marketing/hub/N8nWorkflowsView.tsx`) | - | - | Unresolved. Fair-code licence not verified in this audit |
| molx | not resolved (rate-limited) | - | - | Unresolved |
| video-framework | not resolved (rate-limited) | - | - | Unresolved. Name is generic |

**Action for the user:** give exact URLs (or confirm the candidates above) for the unresolved and candidate entries. Then re-run the audit for those entries only.
