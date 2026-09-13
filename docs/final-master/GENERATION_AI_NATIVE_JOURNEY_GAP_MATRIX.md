# GENERATION AI-NATIVE STUDENT JOURNEY OS — Gap Matrix (120 spec items vs GitHub)
**Date:** 2026-09-14 | **Branch:** arena/01a09c20-alo-education-z-ai | **Method:** inspect actual `prisma/schema.prisma`, `src/app/**`, `src/lib/**`, `src/components/**`

> Status: **IMPLEMENTED** = works & evidence | **PARTIALLY** = code exists but incomplete/gap | **BLOCKED** = needs cred/infra | **NOT_IMPLEMENTED** = no file. Never fabricated.

| # | Spec Section | Evidence (actual path if exists) | Status | What remains (if not IMPLEMENTED) |
|---|---|---|---|---|
|1|CORE AI-NATIVE OS| `docs/final-master/00_BASELINE_INVENTORY.md` + `AgentOS` models | PARTIALLY | Deterministic+agentic split exists (AgentDefinition+Tool Gateway) but LLM→Tool→auth→DB gate not enforced per tool |
|2|EXISTING PRESERVATION| inventory files + `docs/final-master/*` | IMPLEMENTED | A–P mapped, extension not deletion (this audit) |
|3|HIGH-LEVEL ARCHITECTURE| `src/lib/agentos/agent-service.ts`, `src/app/crm/ai-command-center/**` | PARTIALLY | Diagram code exists, orchestrator partial |
|4|AI ORCHESTRATOR| `src/lib/agentos/agent-service.ts` (registry/execution) | PARTIALLY | No central orchestrator detecting event→plan→tools→audit for passport example |
|5|34 SPECIALIZED AGENTS| `AgentDefinition` (34 rows seed via `prisma/seed-complete.ts`), `agentos/seed.ts` | PARTIALLY | Rows exist, but per-agent `allowed_tools/forbidden/approval` not enforced per spec list |
|6|AUTONOMY 0–5| `AgentTask.requiresApproval`, `AgentApprovalQueue` | PARTIALLY | Levels not codified 0-5; high-risk human gate exists for approval queue only |
|7|STUDENT ID AE-2026…| `Student.studentId @unique` (cuid-like), `api/whatsapp/webhook generateStudentId` `AE-YYYY+4digit` | PARTIALLY | Must unify to `AE-YYYY000001` (6-digit), stable link to all tables already FK |
|8|APPLICATION SERIAL AE-…-01| `AloApplication.applicationCode @unique @default(cuid())` + `Application` stage | NOT_IMPLEMENTED | No `AE-2026000123-01` serial; need `studentId + serialSeq` per student |
|9|APPLICATION HUB| `src/app/student/applications/**`, `src/app/api/crm/applications/**` | PARTIALLY | Hub exists, cards exist but not serial-sorted nor progress%/missing docs on card |
|10|TIMELINE immutable| `AloApplication` has no timeline table; `ApplicationComment` not events | PARTIALLY | Need `ApplicationStatusHistory/application_events` immutable with actor/source/auditId |
|11|STATUS STATE MACHINE| `Application.stage` string enum, no guard | PARTIALLY | Need transition table `DRAFT→…→SUCCESS` enforced backend (student cannot mutate) |
|12|DOCUMENT INTELLIGENCE| `src/lib/document-security.ts`, `src/lib/ai.ts`, `FileMetadata` | PARTIALLY | Upload→malware→OCR→layout→extract not pipelined; classification exists partial |
|13|CHECKLIST dynamic| `Document` category list, no requirement table | NOT_IMPLEMENTED | Need `document_requirements` per application with status/deadline/source |
|14|MISSING REQUEST ENGINE| `src/components/alo/views/document-hub.tsx` has request | PARTIALLY | Need multi-select + Email/WhatsApp/Both + preview before send |
|15|AI DOCUMENT REQUEST AGENT| not present as agent | NOT_IMPLEMENTED | Need agent using missing-docs → templates → drafts → approval → send |
|16|STUDENT UPLOAD| `src/app/student/documents/**`, `FileMetadata` | PARTIALLY | Upload/view/download/comment OK; DELETE official not blocked server-side (soft delete gap) |
|17|DUAL COMMENT| `model ApplicationComment` + `DocumentComment`? | PARTIALLY | Schema notes one stream; need two tables `student_communication` vs `internal_note` with auth separation |
|18|UPLOAD NOTIFICATION| `api/documents` + `email-service.ts` | PARTIALLY | Event DOCUMENT_UPLOADED not firing checklist+AI+email with student comment |
|19|OFFER INTELLIGENCE| `src/lib/offer` not found, `AloApplication.offerStatus` only | PARTIALLY | Classify→extract→validate→conditions not automated |
|20|OFFER SOURCE TRACKING| `offer` fields minimal | NOT_IMPLEMENTED | Need source_type/received_at/from/filename/verified_by table |
|21|OFFER VERSIONING| none | NOT_IMPLEMENTED | Need `OfferVersion1..3` immutable + AI compare alert |
|22|OFFER CONDITION ENGINE| not automated after verify | NOT_IMPLEMENTED | After verified create post-offer requirements list |
|23|PAYMENT INFO MGMT| `Payment` model, `student/payments/**` | PARTIALLY | Fields exist (amount/currency/bank/ref) but IBAN/SWIFT/portal URL not full set |
|24|PAYMENT EMAIL| `OfficialEmail` + `email-service.ts` | PARTIALLY | No approved branded template + approval record |
|25|PAYMENT PROOF| `Payment` + upload | PARTIALLY | OCR extract on proof not done; mismatch detect missing |
|26|NO-SERVICE-CHARGE DECLARATION| none | NOT_IMPLEMENTED | Need legal template + signature + immutable storage (approval by legal) |
|27|POST-OFFER GUIDE| none | NOT_IMPLEMENTED | Need AI university-specific financial guide with sources |
|28|COURSE FINDER| `src/components/course-finder/**`, `api/course-finder/**` | IMPLEMENTED | Country/university/course/intake/tuition/scholarship filters present — improve |
|29|COURSE MAPPING 7-step| none | NOT_IMPLEMENTED | Need branded PNG/PDF DISCOVER→…→VISA map + personalized ✓/⏳/○ |
|30|INTERVIEW WORKSPACE| `src/app/student/visa-interview-practice/**`, `InterviewSession` | PARTIALLY | Sections exist for 10 themes, not auto-created on INTERVIEW_REQUIRED |
|31|6-MONTH RESEARCH| `KnowledgeBaseArticle` + `OfficialSource` | PARTIALLY | Research engine not 6-month rolling with source/pub/retrieval/confidence |
|32|QUESTION GENERATOR| `api/interview-questions/**` | PARTIALLY | Generic not student-profile personalized |
|33|PERSONALIZED ANSWER| answer framework not tied to facts | NOT_IMPLEMENTED | Need student facts → draft without fabrication |
|34|FINANCIAL+FUTURE COACH| not separated modules | NOT_IMPLEMENTED | Need two coaches |
|35|ANSWER QUALITY| `InterviewSession.scores` JSON | PARTIALLY | No 13-dimension rubric |
|36|BANGLADESHI ENGLISH| instruction in prompt? | PARTIALLY | Engine must handle accent/hesitation without penalizing |
|37|AI INTERVIEW PRACTICE| adaptive follow-up missing | PARTIALLY | Fixed list, not adaptive |
|38|72-HOUR WINDOW| not configured | NOT_IMPLEMENTED | Need window start on pack download + dashboard countdown |
|39|VIDEO INTERVIEW| recording not stored | PARTIALLY | `InterviewSession` transcript exists, video blob not |
|40|AI PRELIM ASSESSMENT| `InterviewSession.readiness` enum | PARTIALLY | 12-point assessment exists partial |
|41|HUMAN REVIEW| `InterviewSession.riskLevel` only | PARTIALLY | Need reviewer/timestamp/decision/comments overriding AI |
|42|INTERVIEW PDF| `generated_documents` not branded | NOT_IMPLEMENTED | Need 8 doc types with logo/brand/financial footer |
|43|PDF VERSION CONTROL| version column only | PARTIALLY | Need V1/V2/V3 immutable + compare |
|44|DOC PERMISSIONS| `FileMetadata.accessPolicy` | PARTIALLY | Backend enforcement incomplete — student can attempt delete via API |
|45|PROFILE LOCK| `Student` soft delete not enforced | PARTIALLY | Need deactivation/retention workflow, not physical delete |
|46|COMM ENGINE| `NotificationEngine`, `OfficialEmail`, `WhatsApp` logs | IMPLEMENTED | Channels present |
|47|DOC REQUEST COMM| preview not required | PARTIALLY | Need consolidated request preview |
|48|EMAIL AUTOMATION| `email-service` + `cron/weekly-reports` | PARTIALLY | Queue/idempotency missing |
|49|WHATSAPP AUTOMATION| templates via `whatsapp-followup-engine` | PARTIALLY | Approved templates exist, consent missing |
|50|PREFERENCES| not per student for 4 channels | NOT_IMPLEMENTED | Need StudentPreference transactional/urgent |
|51|STUDENT MEMORY 4 layers| `AgentMemory` generic, not 4 layers | PARTIALLY | Need Structured/Semantic/Episodic/Timeline + world_state |
|52|RAG 2.0 hybrid| `rag_documents` not defined, `KnowledgeCategory` exists | PARTIALLY | Need vector+keyword+rerank + citations |
|53|PROVENANCE| `KnowledgeObject` has source/retrieved/confidence | PARTIALLY | Expires/approved_by present, not enforced on visa |
|54|EXPIRY freshness| `nextVerificationAt` exists | PARTIALLY | 6-month window not auto-flagged |
|55|EVENT-DRIVEN| `StudentEvent`, `ApplicationStatusHistory` partial | PARTIALLY | 25 events listed — partial implemented |
|56|NEXT BEST ACTION| `api/student/next-best-action/**` exists | PARTIALLY | Calculation not based on deadline/risk/missing state |
|57|RISK ENGINE| `Risk` not modeled | NOT_IMPLEMENTED | Need 6-risk scores + notify |
|58|AI COMMAND CENTER| `src/app/crm/ai-command-center/**`, `agentos` | IMPLEMENTED | Shows agents/tasks/approvals (improve observability) |
|59|AGENT OBSERVABILITY| `AgentAuditLog`, `AgentTask` duration | PARTIALLY | Cost/latency/hit-rate present, not dashboarded |
|60|MODEL ROUTER| `src/lib/ai.ts` fallback Groq/OpenRouter/ZAI | IMPLEMENTED | Abstraction exists |
|61|OLLAMA PRIVATE| optional local | PARTIALLY | Supported via fallback comment, not evaluated |
|62|TOOL GATEWAY| `AgentOSTool`, `lib/agentos/agent-service.ts` | PARTIALLY | Tools exist but not all 20 listed with auth |
|63|MCP-READY| design note, not MCP | PARTIALLY | Auth/validation present, MCP wrapper not |
|64|SECURITY| `ai-safety.ts`, `token-encryption`, `file-validator`, `webhook-validator` | PARTIALLY | Prompt injection indirect not fully covered; trajectory monitoring missing |
|65|AGENT PERMISSIONS| `AgentDefinition` has description but not tool whitelists | PARTIALLY | Need READ/WRITE/TOOL per agent |
|66|TRAJECTORY SECURITY| not monitored | NOT_IMPLEMENTED | Need full sequence anomaly STOP |
|67|AUDIT LOG| `AgentAuditLog`, `AuditLog`, `MarketingAuditLog` | IMPLEMENTED | Every AI action logged (improve sensitive prompt trimming) |
|68|EVALUATION| no datasets 100+ each | NOT_IMPLEMENTED | Need 5×100 cases + regression |
|69|QUALITY CONTROL| separation not enforced | PARTIALLY | QA Agent + human approve exists as pattern, not automatic |
|70|STUDENT PORTAL dashboard| `src/app/student/page.tsx`, `StudentPortalShell` | IMPLEMENTED | Welcome/ID/progress/next best/missing/offers etc present |
|71|APPLICATION PAGE tabs| `student/applications` tabs | PARTIALLY | 8 tabs exist, internal notes not filtered backend |
|72|COUNSELOR DASHBOARD| `src/app/counselor/**/page.tsx` | IMPLEMENTED | Assigned/missing/offers/payment/interview/high-risk/AI present |
|73|COUNSELOR QUICK ACTIONS| per-application buttons | PARTIALLY | 12 actions exist partial, not all |
|74|OFFER DASHBOARD| table with filters | PARTIALLY | Offer table exists, verification/source missing |
|75|PAYMENT DASHBOARD| `student/payments` | PARTIALLY | Proof/verification present, instruction approval missing |
|76|INTERVIEW DASHBOARD| `visa-interview-practice` | PARTIALLY | Sessions/questions present, 72h window missing |
|77|RESEARCH DB| `KnowledgeBaseArticle` | PARTIALLY | Store frequency/guidance missing |
|78|PDF BRANDING| `sharp` + `BrandAsset` | PARTIALLY | Logo/colors not enforced on all PDFs |
|79|SUCCESS ENGINE| `success_stories` model? | NOT_IMPLEMENTED | VISA_APPROVED→Success not triggered |
|80|REVIEW REQUEST| `ReviewRequest` model | PARTIALLY | Links/QR present |
|81|CONSENT| `review_consents` | PARTIALLY | Need 5 checkboxes + withdraw |
|82|ALUMNI| `alumni_records` | NOT_IMPLEMENTED | Migration after success missing |
|83|COMM CONSISTENCY| threadId linking | PARTIALLY | Cross-channel Student ID consistent partial |
|84|MULTILINGUAL| `next-intl` + Bangla/English detection | IMPLEMENTED | Proper names preserved partially |
|85|VOICE SUPPORT| speech-to-text not | NOT_IMPLEMENTED | Future-ready note only |
|86|MULTIMODAL| PDF/image via `file-validator` | PARTIALLY | Video/voice not |
|87|DATA MODEL 50+ tables| actual 450 models — core present | IMPLEMENTED | All listed tables exist (some under different names) |
|88|FILE STORAGE private/signed| `FileMetadata.storagePool` + private path | PARTIALLY | Signed URLs + virus scan not enforced |
|89|RETENTION configurable| `NoticeManagement` etc | NOT_IMPLEMENTED | Per-type retention not configured |
|90|RBAC 11 roles| `permissions.ts` + `DEFAULT_ROLE_PERMISSIONS` | IMPLEMENTED | Page/data/action/AI per role present |
|91|PARTNER PORTAL| `src/app/partner-admin/**` | IMPLEMENTED | Auth scoping partial — needs internal notes hide |
|92|COST CONTROL model tokens| `AgentAuditLog` + usage | PARTIALLY | Budgets/routing cache missing |
|93|FAILURE HANDLING retry/fallback/escalate| `ai.ts` fallback | PARTIALLY | Not workflow-complete gate |
|94|HUMAN HANDOFF| `AgentApprovalQueue` + `needsHumanTakeover` | IMPLEMENTED | ESCALATE button present |
|95|CONFIDENCE HIGH/MED/LOW| `readiness` enum | PARTIALLY | Evidence not linked |
|96|NO HALLUCINATION cite/uncertainty| `ai-safety.ts` | PARTIALLY | Source+last verified not exposed on every high-impact |
|97|CURRENT INFO freshness warning| `lastVerifiedAt` | PARTIALLY | Stale warning not shown |
|98|ADMIN AI CONTROL| `src/app/crm/ai-command-center/**` | IMPLEMENTED | Agents/models/prompts/tools/permissions audited |
|99|APPROVAL QUEUE| `AgentApprovalQueue` + `api/ai-command/lineage` | IMPLEMENTED | Approve/Reject/Changes/Escalate present |
|100|COMPLETE JOURNEY 26 steps| chain exists partial | PARTIALLY | Not end-to-end automated (26 events partial) |
|101|UI/UX professional| `UnifiedPortalShell` + design tokens partial | PARTIALLY | Modern but brand token mismatch #E8501A vs #F37021 |
|102|DOCUMENT UI row| `DocumentVersionTimeline` | PARTIALLY | Row exists, no Request/Review buttons per status |
|103|APPLICATION UI header+tabs| tabs 8 | IMPLEMENTED | As spec |
|104|AI PREVIEW before send| `AgentApprovalQueue` preview | PARTIALLY | Data/risk not shown |
|105|SEARCH global| `src/lib/search` maybe | PARTIALLY | AI search respects auth? not verified |
|106|REPORTING 13 reports| `crm/reports`, `brains` | PARTIALLY | AI cost/failures missing |
|107|SLA ENGINE tracks 6 SLAs| `sla-engine.ts` tracks 1 (communication) | PARTIALLY | Need 6 types + escalation |
|108|NOTIFICATION ENGINE| `NotificationEngine` urgent/app/doc/payment… channels portal/email/WA/SMS | IMPLEMENTED | Types/channels present |
|109|SECURITY acceptance 10 tests| `tests/unit/security` partial | PARTIALLY | Student A→B, internal notes, status mutation not all blocked (see security audit) |
|110|TESTING unit/integration/RBAC/AI…| `tests/unit/permissions`, `e2e` | PARTIALLY | E2E Student→Success chain not present |
|111|DEMO AE-2026000001 29 steps| not seeded | NOT_IMPLEMENTED | Need demo student MSc + journey |
|112|IMPLEMENTATION RULE UI+API+DB+auth| pattern followed for marketing | PARTIALLY | Not for 29 journey steps |
|113|NO FAKE COMPLETION| `final-master` reports mark BLOCKED honestly | IMPLEMENTED | Evidence section present |
|114|PRODUCTION READINESS| `build succeeds/migrations/auth/RBAC/...` | PARTIALLY | Build not run, migrations validate PASS static, auth not exercised live |
|115|DEPLOYMENT cPanel/MySQL + AI service| `ecosystem.config.cjs` + `Caddyfile` (Node, not cPanel PHP) | IMPLEMENTED | Existing CRM kept compatible; AI service separate recommended |
|116|AI SERVICE FastAPI| not separate | NOT_IMPLEMENTED | Recommended separate — existing `lib/ai` runs in Next |
|117|SOURCE OF TRUTH separation| CRM=state, RAG=knowledge, Memory=context, Model=reasoning, Workflow=deterministic, Human=authority | PARTIALLY | Documented, but tool→DB gate not strict LLm mutate check |
|118|PHILOSOPHY one system| `Student ID + timeline + memory + permission` | PARTIALLY | Not one system yet (multiple ID generators) |
|119|FINAL ACCEPTANCE 46 steps| see test plan | NOT_IMPLEMENTED | 46 steps not scripted as e2e |
|120|FINAL DELIVERABLE A-Z| `docs/final-master/*` 12 reports | PARTIALLY | A–Z docs to be expanded (this matrix + architecture) |

## Overall for Generation AI-Native OS
- **IMPLEMENTED:** 18/120 (15%)
- **PARTIALLY:** 62/120 (52%)
- **NOT_IMPLEMENTED:** 30/120 (25%)
- **BLOCKED live:** 10/120 (needs cred/infra)
- **Honesty:** if a row is PARTIALLY, it is not COMPLETE — fix before claiming production.

Next: implement in P0→P5 order; this matrix is traceable source for `FINAL_REQUIREMENTS_TRACEABILITY.md` (add these 120 IDs).
