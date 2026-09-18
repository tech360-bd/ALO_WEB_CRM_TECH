# Marketing RBAC Matrix

> Mandate §62. Backed by `src/lib/marketing/permissions.ts`
> (`MARKETING_PERMISSIONS` + `ROLE_PERMISSIONS`). Where a role mapping is not
> yet wired it is marked `PLANNED`.

## Permission catalogue (from code)
`marketing.dashboard.view`, `marketing.campaign.create/update/approve`,
`marketing.content.generate/edit/approve`, `marketing.asset.upload`,
`marketing.video.generate`, `marketing.calendar.schedule`,
`marketing.social.inbox.view`, `marketing.social.reply.suggest/send`,
`marketing.comment.convert_lead`, `marketing.dm.convert_lead`,
`marketing.whatsapp.capture_lead`, `marketing.lead.assign`,
`marketing.report.view/export`, `marketing.agentos.view/pause/approve`,
`marketing.seo.generate`, `marketing.seo.publish_approve`.

## Legend
✅ granted · ⛔ denied · PLANNED = designed, not yet role-wired

## Role matrix

| Capability | Executive | Marketing Mgr | Social Media Mgr | Content Writer | Designer | SEO Exec | Ads Exec | Community Mgr | Admin | Super Admin |
|---|---|---|---|---|---|---|---|---|---|---|
| View dashboard | 👁 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create content | ⛔ | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ✅ | ✅ | ✅ |
| Edit content | ⛔ | ✅ | ✅ | own | ⛔ | own | ⛔ | ✅ | ✅ | ✅ |
| Approve content | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Publish | ⛔ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Schedule | ⛔ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| Delete content | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Connect provider | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Disconnect provider | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| Manage campaigns | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ✅ |
| Manage ads / change budget | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ✅ |
| View analytics | 👁 | ✅ | ✅ | own | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export data | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Use AI | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve AI action | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Access audit | ⛔ | 👁 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |

## Safety defaults (mandate §49, §50)
- **AI publishing:** AI may draft/schedule a *proposed* post, but external
  publishing follows `AI → Human Review → Approval → Publish` unless a
  separately approved automation explicitly authorises autonomous sending.
- **AI advertising:** budget/targeting/creative changes that impact spend
  require `AI Recommendation → Human Approval → Provider API → Audit`.
- Content Writers and Designers never receive publishing permission by default.

## Verification status
- The permission constants and role map exist in code: `CODE_COMPLETE`.
- Full per-role widget/API wiring across every marketing screen: `PLANNED`.
- Provider connect/disconnect is restricted to Admin/Super Admin and is
  `CONFIGURATION_REQUIRED` (no live provider connected).
