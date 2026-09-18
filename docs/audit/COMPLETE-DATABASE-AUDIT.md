# Complete Database Audit

> Generated from `prisma/schema.prisma` on 2026-09-18.
> **479 models**, **0 enums**, **10 migrations.**

## Single-source rule (§30) — canonical entity check

The mandate requires ONE canonical model per core entity. Findings:

| Entity | Bare model? | Where it actually lives | Finding |
|---|---|---|---|
| University | **NO** | `CrmUniversity` (+7 University* satellites) | canonical is `CrmUniversity`; no bare `University` |
| Contact | **NO** | `ContactMatchReview`, `WhatsAppContact`, `UnknownIncomingContact` | **no unified Contact model** — identity layer incomplete (§32) |
| Conversation | **NO** | `UccConversation` | canonical is `UccConversation` |
| Message | **NO** | 9 models: MarketingSocialMessage, StudentMessage, InboundMessage, AloMessage, CommunicationMessage, UccMessage, WhatsAppMessageArchive, WhatsAppMessageStatus, SocialInboxMessage | **fragmented across 9 models** (§30 violation) |
| Course | **NO** | CourseComparison, CrmCourse, CrmCourseIntakeFee, CrmCourseRequirement, CourseTag, CourseIntake… | no bare `Course`; CRM/course satellites |
| Lead | YES | `Lead` | OK |
| Application | YES | `Application` | OK |
| Student | YES | `Student` | OK |
| Employee | YES | `Employee` | OK |
| User | YES | `User` | OK |

## Message-model fragmentation (§30 — highest-priority consolidation)

These models overlap and should be reconciled toward `UccMessage` as canonical:

- `MarketingSocialMessage`
- `StudentMessage`
- `InboundMessage`
- `AloMessage`
- `CommunicationMessage`
- `UccMessage`
- `WhatsAppMessageArchive`
- `WhatsAppMessageStatus`
- `SocialInboxMessage`

> **No destructive migration performed.** Consolidation requires backup +
> review + approval (mandate §101); `prisma generate` is blocked in this
> sandbox, so schema changes cannot be validated here. Recorded as OWNER ACTION.

## Migrations

- `20250915000000_hrms_enterprise`
- `20260731000000_init_mysql`
- `20260801000000_course_data_provenance`
- `20260801024630_official_source_checks`
- `20260913000000_content_management`
- `20260913010000_auth_audit_compatibility`
- `20260913020000_crm_communication_compatibility`
- `20260913030000_keyword_and_lead_linkage`
- `20260913040000_content_intelligence_compatibility`
- `20260913050000_benchmark_capabilities`
