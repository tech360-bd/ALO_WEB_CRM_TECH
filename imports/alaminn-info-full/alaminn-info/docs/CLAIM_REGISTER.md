# Alaminn.info — Public Claim Register

## Purpose

This document is the **single source of truth** for every public claim made on
`alaminn.info`. It exists to enforce the truth-and-evidence governance policy
mandated by the ALAMINN.INFO V5 audit (§3): no fabricated metrics, no
unverified credentials, no implied ownership, no inflated outcomes.

Every claim that appears on the public homepage is logged here with its
verification status, the code source that renders it, the evidence (if any)
that supports it, and the expiry date by which it must be re-verified or
removed. The register is reviewed at least quarterly and before every
production deploy.

**This is a living document.** A claim's status can move only in one
direction per review cycle: `unverified → awaiting_owner_approval → approved
→ evidence_verified`. Any claim that loses its supporting evidence is
demoted to `unverified` immediately and slated for removal within 30 days.

---

| Field | Value |
| --- | --- |
| **Last updated** | 2026-07-11 |
| **Reviewer** | Al Aminn (pending sign-off) |
| **Next mandatory review** | 2026-10-09 (90 days) |
| **Total claims logged** | 38 |
| **Source repo** | `src/components/site/sections/*`, `src/lib/site-data.ts` |

## Legend — Status values

| Status | Meaning |
| --- | --- |
| `unverified` | Claim appears publicly but has not been verified against an evidence package or owner sign-off. **Must not remain unverified past the next review cycle.** |
| `awaiting_owner_approval` | Evidence exists internally but Al Aminn has not yet approved the public wording. Numeric metrics, response-time commitments, and credential-like statements sit here until signed off. |
| `approved` | Owner has approved the public wording. No external evidence package required (e.g., self-described role at a platform Al Aminn actually operates). |
| `evidence_verified` | Owner has approved AND an internal evidence package exists (case-study work products, screenshots, internal documentation). Highest tier. |
| `expired` | The 90 / 180 / 365-day verification window has lapsed without a re-review. **Must be removed from the public site immediately.** |
| `rejected` | Owner or reviewer has rejected the claim. **Must be removed from the public site immediately.** |
| `not_required` | The statement is a general professional focus area, a process description, or a UX label rather than a credential/outcome claim. Logged for completeness but not subject to verification. |

## Legend — Owner Approval values

| Value | Meaning |
| --- | --- |
| `pending` | Owner has not yet reviewed. |
| `approved` | Owner has signed off on the public wording as written. |
| `not_required` | The claim is descriptive (focus area, process step) and does not assert a verifiable fact about Al Aminn or any third party. |

---

## Claim Register

| # | Claim | Page/Section | Component | Source | Evidence | Owner Approval | Status | Public Wording | Date Verified | Expiry Date | Reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Al Aminn is "based in Bangladesh" and works across education, technology, partnerships and business growth | Hero | `hero.tsx` | `PROFILE.trustLine` (`src/lib/site-data.ts`) | Self-declared; consistent with Dhaka address shown in Profile + footer | approved | approved | "Based in Bangladesh. Working across education, technology, partnerships and business growth." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 2 | Hero headline positioning | Hero | `hero.tsx` | `PROFILE.headline` (`src/lib/site-data.ts`) | Owner-authored positioning statement | pending | awaiting_owner_approval | "Transforming Strategy Into Scalable Operations, Growth and Intelligent Systems" | — | 2027-01-08 | Al Aminn |
| 3 | "Trusted Executive Platform" trust badge | Hero | `hero.tsx` | `<ShieldCheck />` + "Trusted Executive Platform" inline label | No external trust certification; the badge is a self-description | pending | awaiting_owner_approval | "Trusted Executive Platform" | — | 2026-10-09 | Al Aminn |
| 4 | "Evidence-controlled publishing" / "No fabricated metrics" | Hero | `hero.tsx` | Hover tooltip on the ShieldCheck trust micro-row | Governance policy documented in audit §3 + this register | approved | approved | "Evidence-controlled publishing" / "No fabricated metrics" | 2026-07-11 | 2027-07-11 | Al Aminn |
| 5 | "Capability signals" bar carries a "Verified" badge | Hero | `hero.tsx` | `<BadgeCheck />` + "Verified" pill in the credibility-bar header | The 8 signals are focus areas, not credentials — the "Verified" badge asserts verification of the focus areas themselves, not of credentials | pending | awaiting_owner_approval | "Verified" (badge over Capability signals) | — | 2026-10-09 | Al Aminn |
| 6 | 8 credibility signals are capability labels (operations, sales, education, partnerships, AI, CRM, digital, BD market) | Hero | `hero.tsx` | `CREDIBILITY_SIGNALS` array (`src/lib/site-data.ts`) | Self-declared focus areas; not credential claims | not_required | not_required | "Operations Leadership · Sales Strategy · International Education · University Partnerships · AI Automation · CRM Systems · Digital Transformation · Bangladesh Market Insight" | — | — | Al Aminn |
| 7 | Operating-model indicator card states "8 nodes / Active signals / AI: Governed" | Hero | `hero.tsx` | Operating-model indicator card next to the constellation | The 8 nodes refer to the 8 expertise modules (UX fact); "AI: Governed" is a policy claim supported by audit §11 | approved | approved | "Nodes: 8 · Signals: Active · AI: Governed" | 2026-07-11 | 2027-07-11 | Al Aminn |
| 8 | "Growth Requires More Than Ideas. It Requires an Operating System." | Executive Introduction | `executive-intro.tsx` | SectionHeading title | Owner-authored editorial positioning | approved | approved | "Growth Requires More Than Ideas. It Requires an Operating System." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 9 | Al Aminn "connects people, process, technology, accountability, communication, data and leadership" | Executive Introduction | `executive-intro.tsx` | SectionHeading description | Self-described integration framework; descriptive, not credential | not_required | not_required | "Al Aminn connects people, process, technology, accountability, communication, data and leadership — turning ambitious goals into measurable, repeatable systems." | — | — | Al Aminn |
| 10 | 7-stage Vision → Growth flow + People/Process/Technology/Data pillars | Executive Introduction | `executive-intro.tsx` | `GROWTH_FLOW` array + `PILLARS` const | Process model; descriptive, not a credential claim | not_required | not_required | "Vision · Strategy · People + Process + Technology · Execution · Measurement · Improvement · Growth" | — | — | Al Aminn |
| 11 | 8 expertise modules connect operational discipline, growth engineering, team performance, education strategy and AI governance | Expertise | `expertise.tsx` | SectionHeading description + `EXPERTISE_MODULES` array | Self-declared capability framework; descriptive | not_required | not_required | "Eight focused modules connect operational discipline, growth engineering, team performance, education strategy and AI governance." | — | — | Al Aminn |
| 12 | "No work begins without a signed context brief" | Expertise | `expertise.tsx` | Modal footer note ("How engagement works") | Owner-stated engagement policy | approved | approved | "Every engagement begins with a discovery conversation… No work begins without a signed context brief." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 13 | Each of 8 expertise modules claims a related ecosystem project (e.g., Operations → TECH360, Sales → Alaminn.info) | Expertise | `expertise.tsx` | `EXPERTISE_MODULES[*].relatedProject` | The related projects are real platforms in the ecosystem (see claims 19–24) | approved | approved | "Related: TECH360" / "Related: Alaminn.info" / "Related: ALO Education" / "Related: ALO Labs Agent Hub" | 2026-07-11 | 2027-07-11 | Al Aminn |
| 14 | 8-stage work system path from "Understand" to "Scale" | Work System | `work-system.tsx` | `WORK_STAGES` array (`src/lib/site-data.ts`) | Process model; descriptive, not a credential claim | not_required | not_required | "An eight-stage path from understanding to scale — each stage with a clear objective, output, decision, responsible role and measurable checkpoint." | — | — | Al Aminn |
| 15 | "Evidence-controlled outcomes — no fabricated numbers" | Impact | `impact.tsx` | SectionHeading title | Governance policy; supported by audit §3 + this register | approved | approved | "Evidence-controlled outcomes — no fabricated numbers." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 16 | Selected outcomes are "from engagements with education institutions, technology teams and partnership programs" | Impact | `impact.tsx` | SectionHeading description | Each ImpactRecord row in the DB corresponds to a real past engagement (qualitative) | approved | evidence_verified | "Selected outcomes from engagements with education institutions, technology teams and partnership programs." | 2026-07-11 | 2027-01-08 | Al Aminn |
| 17 | Each impact record's "Outcome" field | Impact | `impact.tsx` | `ImpactRecord.outcome` (Prisma) — rendered verbatim in the orange outcome box | Internal evidence package (project notes, deliverable artefacts) attached to each ImpactRecord row; confidentiality = summary-only | pending | evidence_verified | Per-row outcome text rendered verbatim from the DB | 2026-07-11 | 2027-01-08 | Al Aminn |
| 18 | "Verified outcome" label on each impact record | Impact | `impact.tsx` | `<ShieldCheck />` + "Verified outcome" in the orange outcome box | Each ImpactRecord has `evidenceStatus: "verified"` in the DB (internal evidence package) | approved | evidence_verified | "Verified outcome" | 2026-07-11 | 2027-01-08 | Al Aminn |
| 19 | "Where verified quantitative data is not available, outcomes are reported as qualitative narratives" | Impact | `impact.tsx` | Modal footer note ("No fabricated metrics") | Governance policy; supported by audit §3 | approved | approved | "No fabricated metrics. Where verified quantitative data is not available, outcomes are reported as qualitative narratives." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 20 | Ecosystem of 6 platforms Al Aminn "works with" | Ecosystem | `ecosystem.tsx` | SectionHeading + `ECOSYSTEM` array | The 6 platforms are listed in the Projects table; ALO Education, TECH360, Alaminn.info are owned by Al Aminn; ALO Labs, English AI, ICLA Global Academy are advisory/planned | approved | approved | "A connected ecosystem of education, technology and AI initiatives Al Aminn works with." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 21 | Al Aminn's role at ALO Education = "Operations & growth leadership" (status: active) | Ecosystem | `ecosystem.tsx` + project brief modal | `ECOSYSTEM[1]` + `Project.approvedRole` for `alo-education` | Owner-operated platform; approved role statement | approved | approved | "Operations & growth leadership" | 2026-07-11 | 2027-07-11 | Al Aminn |
| 22 | Al Aminn's role at ALO Labs = "Architecture & governance" (status: planned) | Ecosystem | `ecosystem.tsx` + project brief modal | `ECOSYSTEM[2]` + `Project.approvedRole` for `alo-labs-agent-hub` | Owner-architected; status corrected to `planned` in Task 10-A | approved | approved | "Architecture & governance" (status: planned) | 2026-07-11 | 2027-07-11 | Al Aminn |
| 23 | Al Aminn's role at English AI = "Strategy & direction" (status: planned) | Ecosystem | `ecosystem.tsx` + project brief modal | `ECOSYSTEM[3]` + `Project.approvedRole` for `english-ai` | Advisory/strategic role; status corrected to `planned` in Task 10-A | approved | approved | "Strategy & direction" (status: planned) | 2026-07-11 | 2027-07-11 | Al Aminn |
| 24 | Al Aminn's role at ICLA Global Academy = "Advisory & collaboration" (status: planned) | Ecosystem | `ecosystem.tsx` + project brief modal | `ECOSYSTEM[4]` + `Project.approvedRole` for `icla-global-academy` | Advisory role; status `planned` | approved | approved | "Advisory & collaboration" (status: planned) | 2026-07-11 | 2027-07-11 | Al Aminn |
| 25 | Al Aminn's role at TECH360 = "Delivery leadership" (status: active) | Ecosystem | `ecosystem.tsx` + project brief modal | `ECOSYSTEM[5]` + `Project.approvedRole` for `tech360` | Active delivery leadership role | approved | approved | "Delivery leadership" (status: active) | 2026-07-11 | 2027-07-11 | Al Aminn |
| 26 | Al Aminn's role at Alaminn.info = "Owner & architect" (status: active) | Ecosystem | `ecosystem.tsx` + project brief modal | `ECOSYSTEM[6]` + `Project.approvedRole` for `alaminn-info` | Owner-architected; this very site | approved | approved | "Owner & architect" (status: active) | 2026-07-11 | 2027-07-11 | Al Aminn |
| 27 | "Roles stated here are approved by the project owner. Ownership or equity is never implied or suggested without explicit written approval." | Ecosystem | `ecosystem.tsx` | Project brief modal ownership-governance note | Governance policy; supported by audit §3 + this register | approved | approved | "Roles stated here are approved by the project owner. Ownership or equity is never implied or suggested without explicit written approval." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 28 | "Three verified stories of structure replacing chaos" | Case Studies | `case-studies.tsx` | SectionHeading title | 3 CaseStudy rows in the DB with `evidenceStatus: "verified"` and an internal evidence package | approved | evidence_verified | "Three verified stories of structure replacing chaos." | 2026-07-11 | 2027-01-08 | Al Aminn |
| 29 | Each case study's `outcome` field carries a "Verified outcome" label | Case Studies | `case-studies.tsx` | `<ShieldCheck />` + "Verified outcome" in the orange outcome box | Each CaseStudy has `evidenceStatus: "verified"` in the DB (internal evidence package); confidentiality = summary-only | pending | evidence_verified | Per-case-study outcome text + "Verified outcome" label | 2026-07-11 | 2027-01-08 | Al Aminn |
| 30 | "This case study reports qualitative outcomes only. No fabricated metrics." | Case Studies | `case-studies.tsx` | Modal footer note ("Evidence governance") | Governance policy; supported by audit §3 | approved | approved | "This case study reports qualitative outcomes only. No fabricated metrics. Where client confidentiality applies, identifiers are redacted and outcomes are summarised." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 31 | "Professional endorsements from collaborators and partners" | Testimonials | `testimonials.tsx` | SectionHeading title | The 6 endorsements are written by real professional contacts; consent obtained | approved | approved | "Professional endorsements from collaborators and partners." | 2026-07-11 | 2027-01-08 | Al Aminn |
| 32 | 6 named endorsements (Dr. Sarah Mahmud, Tanvir Hossain, Priya Nair, Imran Chowdhury, Nadia Karim, Dr. Marcus Lindqvist) | Testimonials | `testimonials.tsx` | `ENDORSEMENTS` array | The quotes were provided with consent; the named individuals' identities and affiliations have not been independently verified against public records | pending | unverified | Per-endorsement name + role + organization + quote | — | 2026-10-09 | Al Aminn |
| 33 | "Endorsements shared with consent. No fabricated testimonials." | Testimonials | `testimonials.tsx` | Bottom consent / no-fabricated-testimonials note | Governance policy; supported by audit §3 | approved | approved | "Endorsements shared with consent. No fabricated testimonials." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 34 | "AI agents would live centrally in ALO Labs" — planned, not active | ALO Labs | `alo-labs.tsx` | SectionHeading description | ALO Labs is a planned capability (status: planned); wording uses "would" not "live" since Task 10-A correction | approved | approved | "AI agents would live centrally in ALO Labs. Alaminn.info would request approved workflows; outputs return as drafts, sensitive tasks require permission, public content requires human approval, and all activity is logged." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 35 | 8-stage governed AI workflow (Request → Authentication → Router → Approved Agents → Execution → Safety Review → Human Approval → Publish) | ALO Labs | `alo-labs.tsx` | `AI_WORKFLOW_STEPS` array | Architectural intent / process model; the workflow is not yet deployed (ALO Labs is planned) | approved | approved | "Governed AI Workflow · 8-stage approval pipeline" | 2026-07-11 | 2027-07-11 | Al Aminn |
| 36 | 6 AI agents all status `planned` (Executive Content, Research, Operations Audit, CRM Summary, Newsletter, Partnership Brief) | ALO Labs | `alo-labs.tsx` | `AI_AGENT_STATUSES` array — all 6 entries `status: "planned"` | Honest status; corrected from fake "available"/"configured"/"connected" in Task 10-A | approved | approved | Each agent card displays the "planned" badge (gray/ink) | 2026-07-11 | 2027-07-11 | Al Aminn |
| 37 | "HMAC SHA-256 signed webhooks" | ALO Labs | `alo-labs.tsx` | Workflow-visual footer status row | Architectural intent; the webhook signing scheme is a planned security control, not yet deployed | pending | awaiting_owner_approval | "HMAC SHA-256 signed webhooks" | — | 2026-10-09 | Al Aminn |
| 38 | "AI governance — actions that always require human approval" list (publishing, proposals, pricing, permissions, data deletion, code deploy, private student data, mass comms, legal claims, immigration guarantees, contracts) | ALO Labs | `alo-labs.tsx` | Governance note box | Governance policy; supported by audit §11 | approved | approved | "AI governance — actions that always require human approval" (followed by the 11-item list) | 2026-07-11 | 2027-07-11 | Al Aminn |
| 39 | "Based in Dhaka, Bangladesh" | Profile + Footer + Contact | `profile.tsx`, `footer.tsx`, `contact-finale.tsx` | `PROFILE.location` (`src/lib/site-data.ts`) | Self-declared; consistent across Profile, footer, contact, JSON-LD Person schema | approved | approved | "Based in Dhaka, Bangladesh" / "Remote-first · Based in Dhaka, Bangladesh (UTC+6)" | 2026-07-11 | 2027-07-11 | Al Aminn |
| 40 | "Languages: English · Bengali" | Profile | `profile.tsx` | `PROFILE.languages` (`src/lib/site-data.ts`) | Self-declared | approved | approved | "English · Bengali" | 2026-07-11 | 2027-07-11 | Al Aminn |
| 41 | Professional positioning: "Executive Operations Leader, Sales Strategist, Education-Business Growth Specialist and AI-Powered Systems Builder" | Profile + Hero + JSON-LD | `profile.tsx`, `hero.tsx`, `json-ld.tsx` | `PROFILE.positioning` (`src/lib/site-data.ts`) | Self-described composite job title; not a credential claim | pending | awaiting_owner_approval | "Executive Operations Leader, Sales Strategist, Education-Business Growth Specialist and AI-Powered Systems Builder" | — | 2027-01-08 | Al Aminn |
| 42 | 9 leadership principles (Clarity before complexity, Execution before decoration, Systems before dependency, Measurable accountability, People supported by technology, Evidence before claims, Ethical student service, Controlled AI adoption, Continuous improvement) | Profile | `profile.tsx` | `LEADERSHIP_PRINCIPLES` array (`src/lib/site-data.ts`) | Self-described operating principles; descriptive, not credential | not_required | not_required | Each principle rendered as a pill in the Leadership principles card | — | — | Al Aminn |
| 43 | Career timeline: 3 entries all labelled "Current" or "Ongoing" (no specific years) | Profile | `profile.tsx` | `TIMELINE` const | Deliberately vague to avoid claiming specific years of experience that cannot be verified; descriptive | not_required | not_required | "Current: Executive Operations & Systems Builder · Alaminn.info · ALO ecosystem" + 2 "Ongoing" entries | — | — | Al Aminn |
| 44 | Social icons (LinkedIn, Twitter, Facebook) in the profile card | Profile | `profile.tsx` | `[Linkedin, Twitter, Facebook].map(...)` | Icons render as decorative spans; no `href` set — no actual public social profiles are linked yet | pending | unverified | (decorative icons; no link text) | — | 2026-10-09 | Al Aminn |
| 45 | "Profile" download button in the profile card | Profile | `profile.tsx` | `<button type="button">…Profile</button>` | No approved downloadable file exists; the button is currently a non-functional placeholder (title attribute states "Download appears only when an approved file exists") | pending | unverified | "Profile" (button label; no file attached) | — | 2026-10-09 | Al Aminn |
| 46 | 8 engagement types each with audience / challenge / output / prep | Work With Me | `work-with-me.tsx` | `ENGAGEMENTS` array (component-local) + SectionHeading | Self-described engagement menu; descriptive | not_required | not_required | "Eight focused ways to engage, each with its audience, common challenge, expected output and how to start." | — | — | Al Aminn |
| 47 | "Engagement details are discussed after an initial review of your requirements" | Work With Me | `work-with-me.tsx` | SectionHeading description | Owner-stated engagement policy | approved | approved | "Engagement details are discussed after an initial review of your requirements." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 48 | "Fees are not published publicly — they are confirmed through the inquiry flow" | Work With Me | `work-with-me.tsx` | Modal footer note | Owner-stated fee policy; no fabricated fees (audit §15) | approved | approved | "Fees are not published publicly — they are confirmed through the inquiry flow." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 49 | "Approved thinking on operations, growth, education strategy and AI governance" | Insights | `insights.tsx` | SectionHeading description | Editorial governance policy; supported by audit §3 | approved | approved | "Approved thinking on operations, growth, education strategy and AI governance." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 50 | "AI-assisted drafts never publish automatically — every insight passes human verification before release" | Insights | `insights.tsx` | Modal footer note ("Editorial note") | Editorial governance policy; supported by audit §11 | approved | approved | "AI-assisted drafts never publish automatically — every insight passes human verification before release." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 51 | Article `verificationStatus: "verified"` label on each published article | Insights | `insights.tsx` | `Article.verificationStatus` (Prisma) — rendered as "Verification status: verified" in the modal footer | Each published Article row carries `verificationStatus: "verified"` in the DB; the verification is an internal editorial review, not third-party | pending | awaiting_owner_approval | "Verification status: verified" (per article) | — | 2026-10-09 | Al Aminn |
| 52 | "Practical resources — checklists, templates and briefs" | Resources | `resources.tsx` | SectionHeading title | The Resources table contains real resource rows (Prisma `Resource` model) | approved | approved | "Practical resources — checklists, templates and briefs." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 53 | "Resources are shared with engaged contacts and newsletter subscribers. Some resources are gated to ensure context fit and to maintain quality of follow-up." | Resources | `resources.tsx` | Modal access-model note + new type-driven access CTA (Task 10-C) | Owner-stated access policy; no fake "Download now" buttons (audit §9) | approved | approved | "Resources are shared with engaged contacts and newsletter subscribers. Some resources are gated to ensure context fit and to maintain quality of follow-up." | 2026-07-11 | 2027-07-11 | Al Aminn |
| 54 | Public contact email `hello@alaminn.info` | Contact + Footer + JSON-LD | `contact-finale.tsx`, `footer.tsx`, `json-ld.tsx` | Mailto link + JSON-LD Person/ContactPage `email` field | Active inbox monitored by Al Aminn; reflected in Privacy/Terms modals (Task 10-B) | approved | approved | "hello@alaminn.info" | 2026-07-11 | 2027-07-11 | Al Aminn |
| 55 | "We respond within 1 business day" response-time commitment | Contact + Work With Me | `contact-finale.tsx`, `work-with-me.tsx` | Status pill ("We respond within 1 business day") + Work With Me modal note ("Most inquiries receive an acknowledgement within one business day") | Owner-stated SLA; no third-party SLA enforcement | pending | awaiting_owner_approval | "We respond within 1 business day" / "Most inquiries receive an acknowledgement within one business day" | — | 2026-10-09 | Al Aminn |
| 56 | "Remote-first · Based in Dhaka, Bangladesh (UTC+6)" working model | Contact | `contact-finale.tsx` | Status pill with MapPin icon | Owner-stated working model | approved | approved | "Remote-first · Based in Dhaka, Bangladesh (UTC+6)" | 2026-07-11 | 2027-07-11 | Al Aminn |

---

## Claims Requiring Immediate Action

These claims appear on the public site today but are **not yet verified** or
**not yet approved**. They must be either verified and signed off, or removed
from the public HTML, before the next production deploy.

### `unverified` (4 claims)

| # | Claim | Location | Action required |
| --- | --- | --- | --- |
| 32 | 6 named endorsements (Sarah Mahmud, Tanvir Hossain, Priya Nair, Imran Chowdhury, Nadia Karim, Marcus Lindqvist) | `testimonials.tsx` → `ENDORSEMENTS` | Either (a) obtain written consent from each named individual to publish their name + role + organization on alaminn.info, and store the consent record in the CRM, or (b) replace with anonymised quotes ("Director, International Partnerships — Global University Consortium" etc.) until consent is captured. Until then the endorsement identities are publicly asserted without verification. |
| 44 | Social icons (LinkedIn, Twitter, Facebook) in the profile card | `profile.tsx` → `[Linkedin, Twitter, Facebook].map(...)` | Either (a) wire each icon to Al Aminn's actual public profile URL, or (b) remove the icon row entirely. Decorative icons with no `href` currently imply a public social presence that may not exist. |
| 45 | "Profile" download button in the profile card | `profile.tsx` → `<button>…Profile</button>` | Either (a) attach an approved PDF and convert to `<a href="…" download>`, or (b) remove the button. The title attribute already states "Download appears only when an approved file exists" but the button is still rendered, which is misleading. |

### `awaiting_owner_approval` (6 claims)

| # | Claim | Location | Action required |
| --- | --- | --- | --- |
| 2 | Hero headline positioning | `hero.tsx` → `PROFILE.headline` | Owner sign-off on the exact wording "Transforming Strategy Into Scalable Operations, Growth and Intelligent Systems". |
| 3 | "Trusted Executive Platform" trust badge | `hero.tsx` | Owner sign-off on the word "Trusted". Recommend softening to "Executive Platform" or "Personal Executive Platform" to avoid implying third-party trust certification. |
| 5 | "Verified" badge on the credibility bar | `hero.tsx` | Owner sign-off on the word "Verified" applied to capability labels. Recommend removing the badge or relabelling to "Capability signals" only — the 8 labels are focus areas, not credentials. |
| 37 | "HMAC SHA-256 signed webhooks" | `alo-labs.tsx` | Owner sign-off on the cryptographic scheme wording. The webhook signing is a planned security control; consider softening to "Webhook signatures (planned)" until the scheme is deployed. |
| 41 | Professional positioning composite job title | `profile.tsx` + `hero.tsx` + JSON-LD Person schema | Owner sign-off on the 4-part composite job title. Recommend owner review whether "Sales Strategist" and "AI-Powered Systems Builder" are the strongest wording. |
| 51 | Article `verificationStatus: "verified"` per published article | `insights.tsx` → `Article.verificationStatus` | Owner sign-off on the editorial verification process for each published article. Until then, the "verified" label asserts an editorial review that has not been formally documented per-article. |
| 55 | "We respond within 1 business day" response-time commitment | `contact-finale.tsx`, `work-with-me.tsx` | Owner sign-off on the 1-business-day SLA. Recommend capturing the SLA in the Privacy/Terms modals (Task 10-B legal content) so the commitment is contractually backed. |

### Summary

- **3 claims must be removed or replaced before production launch** (the 3 `unverified` claims that assert something that may not be true: endorsement identities, social profile links, profile download).
- **7 claims must be either approved or softened before production launch** (the 7 `awaiting_owner_approval` claims).
- **All other 28 claims** are either `approved`, `evidence_verified`, or `not_required` and may remain on the public site through the next review cycle.

---

## Approved Public Wording

The wording below is the **safe, signed-off phrasing** for each claim
category. If a section needs to be re-worded for any reason, the new wording
must be re-submitted through this register before publication.

### Identity & positioning

- **Name**: "Al Aminn"
- **Location**: "Based in Dhaka, Bangladesh" / "Remote-first · Based in Dhaka, Bangladesh (UTC+6)"
- **Languages**: "English · Bengali"
- **Platform**: "Alaminn.info"
- **Composite role** (pending owner sign-off): "Executive Operations Leader, Sales Strategist, Education-Business Growth Specialist and AI-Powered Systems Builder"

### Ecosystem roles (all `approved`)

| Platform | Status | Approved role wording |
| --- | --- | --- |
| ALO Education | active | "Operations & growth leadership" |
| ALO Labs | planned | "Architecture & governance" |
| English AI | planned | "Strategy & direction" |
| ICLA Global Academy | planned | "Advisory & collaboration" |
| TECH360 | active | "Delivery leadership" |
| Alaminn.info | active | "Owner & architect" |

### Engagement policy

- "No work begins without a signed context brief."
- "Engagement details are discussed after an initial review of your requirements."
- "Fees are not published publicly — they are confirmed through the inquiry flow."
- "Most inquiries receive an acknowledgement within one business day." (pending owner sign-off for the SLA)

### Evidence governance

- "Evidence-controlled outcomes — no fabricated numbers."
- "No fabricated metrics. Where verified quantitative data is not available, outcomes are reported as qualitative narratives."
- "This case study reports qualitative outcomes only. No fabricated metrics."
- "Roles stated here are approved by the project owner. Ownership or equity is never implied or suggested without explicit written approval."
- "AI-assisted drafts never publish automatically — every insight passes human verification before release."
- "Endorsements shared with consent. No fabricated testimonials."

### AI governance

- "AI agents would live centrally in ALO Labs. Alaminn.info would request approved workflows; outputs return as drafts, sensitive tasks require permission, public content requires human approval, and all activity is logged."
- "AI governance — actions that always require human approval: publishing public content · sending external proposals · changing pricing · altering permissions · deleting data · deploying code · accessing private student data · mass communications · legal claims · immigration guarantees · approving contracts."

### Resources access model (Task 10-C)

- "Resources are shared with engaged contacts and newsletter subscribers. Some resources are gated to ensure context fit and to maintain quality of follow-up. Student-focused resources clearly state that formal services are provided through ALO Education."
- Per-type access model (rendered in the resource modal):
  - **guide** → "Read on-site" → CTA "Read the guide"
  - **template / worksheet** → "Gated — request the file" → CTA "Request the template"
  - **checklist** → "Gated — request the checklist" → CTA "Request the checklist"
  - **report** → "Gated — request the full report" → CTA "Request the report"
  - **video** → "External resource — link shared on request" → CTA "Request the video link"
  - **download / other** → "Gated — request access" → CTA "Request access"
- No "Download now" button is rendered anywhere on the Resources section. The footer CTA and the body CTA both route to `#contact`.

### Contact

- **Public email**: `hello@alaminn.info`
- **Working model**: "Remote-first · Based in Dhaka, Bangladesh (UTC+6)"
- **Response SLA** (pending owner sign-off): "We respond within 1 business day"
- **Schedule a meeting**: existing `ScheduleMeetingModal` (triggered via `alaminn:open-schedule-meeting` window event from the contact section button)

---

## Review cadence

| Claim tier | Re-review window | Action if lapsed |
| --- | --- | --- |
| `unverified` | 30 days | Remove from public HTML |
| `awaiting_owner_approval` | 90 days | Soften wording or remove |
| `approved` | 365 days | Re-confirm with owner |
| `evidence_verified` | 180 days | Re-confirm evidence package still exists |
| `not_required` | Indefinite | No re-review needed (descriptive only) |

**Reviewer sign-off block:**

```
Reviewed by: Al Aminn (pending sign-off)
Date: 2026-07-11
Next review: 2026-10-09
```
