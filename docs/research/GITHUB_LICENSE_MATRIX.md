# GitHub License Matrix — Submitted Source Repositories

**Generated:** 2026-10-18
**Method:** every submitted URL was resolved against the GitHub REST API (`GET /repos/{owner}/{repo}`)
using an authenticated token. License is the `license.spdx_id` field GitHub reports from the
repository's detected license file — not a guess and not a read of the README.
**Companion data:** [`GITHUB_SOURCE_CATALOG.csv`](./GITHUB_SOURCE_CATALOG.csv) holds one row per
repository with branch, last-push date, archived flag, language, stars and disposition.

**123 submitted URLs → 122 repositories + 1 account link.** Every URL resolved; none 404'd.

---

## 1. Disposition rubric

Applied mechanically, then overridden by hand only where a repository addresses a gap that was
verified to exist in `tech360-bd/ALO_WEB_CRM_TECH`. Overrides are individually justified in the CSV.

| Disposition | Rule |
|---|---|
| **INTEGRATE** | Addresses a verified gap **and** can be deployed as a separate service or under a compatible license, with no code copied into the CRM where copyleft applies. |
| **ADAPT** | Permissive license, addresses a verified gap, and code may be derived with attribution. |
| **REFERENCE** | Read for design and approach. **No code may be copied** — either the license forbids it or no verified gap justifies adoption. |
| **DEFER** | Technically usable but archived upstream or blocked pending a decision. |
| **REJECT** | Conflicts with the project's own rules, or has no server-side integration path. |
| **NEEDS_CLARIFICATION** | Submitted URL is an account, not a repository. |

Result: **INTEGRATE 6 · ADAPT 3 · REFERENCE 104 · REJECT 7 · DEFER 2 · NEEDS_CLARIFICATION 1**

The high REFERENCE count is the honest outcome, not laziness: this repository already contains
911 API routes and 533 Prisma models covering CRM, WhatsApp, documents, social OAuth and an AI
gateway. Most submitted CRM and agent frameworks are *competitors to what already exists*, and
adopting them would break the standing "reuse existing implementations, do not duplicate" rule.

---

## 2. License distribution

| License | Count | Copying permitted into ALO? |
|---|---|---|
| MIT | 49 | Yes, with attribution |
| Apache-2.0 | 21 | Yes, with attribution and NOTICE retention |
| **NOASSERTION (no license file)** | **33** | **No — see section 3** |
| AGPL-3.0 | 11 | No, unless run as a fully separate service |
| GPL-3.0 | 6 | No, unless run as a fully separate process |
| LGPL-2.1 / LGPL-3.0 | 2 | Dynamic-linking only; sidecar service preferred |
| Account link, not a repo | 1 | n/a |

---

## 3. The 33 unlicensed repositories — the largest legal risk in this list

GitHub returned no license for these. Under copyright law the absence of a license means
**all rights reserved**: the code may be read, but copying, adapting or vendoring it is
infringement regardless of how public or popular it is. Star count is not permission.

Several are popular enough to be tempting, which is exactly why they are listed:

| Repository | Stars | Note |
|---|---|---|
| `remotion-dev/remotion` | 64,951 | Ships a **custom commercial license**, not open source. Requires paid review before any use. |
| `twentyhq/twenty` | 58,488 | Frequently mistaken for MIT. No license file detected. |
| `bilawalsidhu/gods-eye-view` | 57,850 | No license file. |
| `chatwoot/chatwoot` | 37,924 | Chatwoot is normally MIT; GitHub detected no license file on the default branch at inspection time. **Re-verify before use.** |
| `Twigpine/openclaude` | 33,986 | Submitted as `Gitlawb/openclaude` — see section 5. |
| `mksglu/context-mode` | 30,658 | No license file. |
| `CapSoftware/Cap` | 23,402 | No license file. |
| `nashsu/llm_wiki` | 20,747 | No license file. |
| `cursor/plugins` | 12,614 | No license file. |
| `Tencent-Hunyuan/HunyuanVideo` | 12,632 | Model weights carry separate terms; check the model card, not the repo. |
| `3b1b/videos` | 11,378 | Personal educational content. |
| `armory3d/armorpaint` | 5,379 | No license file. |

The remaining 21 are smaller or project-specific and are listed in full in the CSV.

**Rule adopted:** unlicensed repositories are `REFERENCE` at most. No code from any of them
enters this repository.

---

## 4. Copyleft repositories — 19 total

AGPL-3.0 (11): `ToolJet/ToolJet`, `volcengine/OpenViking`, `firecrawl/firecrawl`, `DIYgod/RSSHub`,
`frappe/crm`, `idurar/idurar-erp-crm`, `NdoleStudio/httpsms`, `nextcloud/server`,
`siyuan-note/siyuan`, `dani-garcia/vaultwarden`, `debpalash/VoiceStudio`

GPL-3.0 (6): `0perationPrivacy/VoIP`, `BelledonneCommunications/linphone-iphone`,
`Kosinkadink/ComfyUI-VideoHelperSuite`, `WEIFENG2333/VideoCaptioner`, `elebumm/RedditVideoMakerBot`,
`ramon-victor/freegpt-webui`

LGPL (2): `languagetool-org/languagetool` (LGPL-2.1), `vastsa/PI-Desktop` (LGPL-3.0)

**Why this matters for ALO specifically.** AGPL-3.0 §13 closes the network loophole: offering a
modified AGPL program to users over a network obliges you to offer them your source. ALO operates
a commercial CRM SaaS. Copying AGPL code into it would create a source-disclosure obligation
across the whole product. Therefore:

- AGPL/GPL components may be **run as separate services** (their own process, own repository,
  communicating over HTTP). This is how `httpsms` and `vaultwarden` are already used here.
- AGPL/GPL code is **never imported, vendored or adapted** into `src/`.
- LGPL components are consumed as sidecar HTTP services rather than linked libraries, which
  sidesteps the dynamic-linking question entirely.

Two AGPL components are **already in production use** in this repository and were verified during
the Phase 1 audit: `NdoleStudio/httpsms` (the httpSMS channel in the communications registry) and
`dani-garcia/vaultwarden` (`src/lib/vaultwarden-client.ts`). Both are correctly isolated as
external services. Neither has had its AGPL posture formally reviewed by the owner — that review
is recommended and is recorded as an open item.

---

## 5. One submitted URL does not point where it appears to

| Submitted | Resolves to | Why it matters |
|---|---|---|
| `github.com/Gitlawb/openclaude` | **`Twigpine/openclaude`** | The repository was renamed or transferred. The submitted URL still works via redirect, so this is invisible in a browser. It also has **no license file**. Anyone trusting the original URL would be copying unlicensed code from an owner different from the one they researched. |

One submitted URL is an **account, not a repository**: `github.com/Onyx-Dev-Labs`. Disposition
`NEEDS_CLARIFICATION` — which repository under that account was intended?

---

## 6. Explicit rejections and the reason for each

| Repository | Reason |
|---|---|
| `GetGoAPI/Free-GPT-Grok-Gemini-Claude-API` | Unofficial free proxy reselling GPT / Grok / Gemini / Claude. This is exactly what `PAID_AI_API_ALLOWED=false` and the payment guard exist to prevent, and it breaches the upstream providers' terms. Recorded in the provider catalog as an unofficial proxy, disabled by default. |
| `blader/humanizer` | Its purpose is to disguise AI-authored text as human-written. Conflicts with the honesty requirement in the specification's own final delivery rules. |
| `0perationPrivacy/VoIP` | Consumer VoIP guide, GPL-3.0, no server-side CRM integration path. |
| `BelledonneCommunications/linphone-iphone` | Native iOS telephony library. ALO is a web CRM. |
| `armory3d/armorpaint` | Desktop 3D paint application, no license file, no server-side use case. |
| `3b1b/videos` | Personal video-generation scripts, no license file, copyrighted educational content. |
| `public-apis/public-apis` | A link directory rather than software. Nothing to integrate. |

---

## 7. Deferred

| Repository | Reason |
|---|---|
| `huggingface/education-toolkit` | **Archived** upstream (Apache-2.0). Content remains readable but the project is unmaintained. |
| `ramon-victor/freegpt-webui` | **Archived** upstream and GPL-3.0. |

---

## 8. What was NOT verified, stated plainly

- **License text was not read.** Dispositions rest on the SPDX identifier GitHub detects. Before
  any `ADAPT` or `INTEGRATE` becomes a real code change, the actual LICENSE file and any NOTICE or
  model-weight terms must be read. Model repositories in particular (`zai-org/GLM-5`,
  `Tencent-Hunyuan/HunyuanVideo`, `zai-org/CogVideo`) carry **weight licenses separate from the
  code license**, and those were not inspected.
- **Commercial-use permission was not confirmed** for any repository. Apache-2.0 and MIT permit
  commercial use by their terms; individual model weights often add restrictions.
- **No repository code was executed, cloned or installed.** No `curl | bash`, no remote install
  scripts, consistent with the specification's own rule.
- **Star counts and push dates are a snapshot of 2026-10-18** and will drift.
