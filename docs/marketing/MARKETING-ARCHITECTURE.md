# Marketing Command Center — Architecture

> Mandate §63, §64, §65, §69. ONE reusable Marketing Command Center, not many
> separate dashboards. It plugs into the SAME RBAC, employee, provider, OAuth,
> webhook, audit, CRM, notification, and AI systems as the UCC.

## One platform, many projections (mandate §2, §69)

```
EMPLOYEE → DASHBOARD → { CRM · UNIFIED COMMUNICATION · MARKETING · CONTENT ·
  CAMPAIGNS · ADVERTISING · SEO · ANALYTICS · AI AGENTS · TASKS · SLA ·
  APPROVALS · AUDIT · PROVIDER CONNECTIONS }
```

Access is decided by `USER → EMPLOYEE → ROLE → DEPARTMENT → PERMISSIONS →
ASSIGNED ACCOUNTS → ASSIGNED CAMPAIGNS → ASSIGNED WORK`. There is no separate
`FacebookDashboard`, `TikTokDashboard`, etc. — those are channel projections of
one center (mandate §2).

## Modules
Channel · Campaign · Content · Creative · Publishing · Advertising · Community ·
Analytics · SEO · Attribution · AI.

## Reused, never duplicated (mandate §65)
- RBAC: `src/lib/marketing/permissions.ts` + `src/lib/rbac/`
- Provider/OAuth/webhook: `src/lib/ucc/providers/` (shared with UCC)
- Token encryption: `src/lib/token-encryption.ts`
- Audit: `MarketingAuditLog` + `logAuditAction`
- CRM: existing `MarketingLead`, `Lead`, `Contact` models
- AI: existing agent registry / approval system (extended, not replaced)

## Existing marketing models reconciled (not duplicated)
`MarketingCampaign`, `Campaign`, `CampaignPost`, `MarketingContentIdea`,
`MarketingGeneratedContent`, `ContentApproval`, `MarketingApproval`,
`ContentAsset`/`MarketingAsset`/`BrandAsset`, `MarketingCalendar`,
`MarketingSocialMessage`, `MarketingComment`, `MarketingDMThread`,
`MarketingLead`/`MarketingLeadScore`, `SeoOpportunity`/`SeoTask`,
`MarketingReport`, `MarketingUserAccess`, `MarketingAgentJob`/`MarketingAgentMemory`.

> Where two models overlap (e.g. `Campaign` vs `MarketingCampaign`,
> `ContentAsset` vs `MarketingAsset` vs `BrandAsset`), the go-forward canonical
> is documented in `FINAL-MARKETING-AUDIT.md`. No destructive migration performed.

## AI safety (mandate §49, §50)
- Publishing: `AI → Human Review → Approval → Publish` (default).
- Advertising (budget/targeting/creative): `AI Recommendation → Human Approval
  → Provider API → Audit`.
- No silent autonomous publishing or spend changes.

## Attribution (mandate §51, §52)
`Social Post → UTM → Landing Page → Website Event → Lead → CRM → Application →
Conversion`, retaining source/campaign/channel/creative/UTM/first-touch/
last-touch/assigned employee/conversion status.

## Verification status
The marketing data layer and RBAC are `CODE_COMPLETE`. The Marketing Command
Center UI, channel adapters, and live publishing/analytics are `PLANNED` /
`CONFIGURATION_REQUIRED` / `LIVE_TEST_PENDING`. **No channel is `LIVE_VERIFIED`.**
