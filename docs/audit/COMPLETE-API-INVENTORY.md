# Complete API Inventory

> Generated from the filesystem on 2026-09-18. **819 API route handlers.**
> Auth posture classified by static analysis of each handler's imports/calls.

## Auth posture summary

| Posture | Count |
|---|---|
| Authenticated (session/withAuth/requireUserTypes) | 576 |
| Signature / webhook / cron-secret | 15 |
| **None detected** | **228** |

> The 228 "none" routes include legitimately public endpoints (login, public
> lead capture, OAuth callbacks, health). Each must be triaged individually —
> see `AUDIT/ARENA-ROUTE-INVENTORY.csv` for the per-route classification and
> `docs/security/FINAL-SECURITY-AUDIT.md` for the privileged-prefix triage.

## By API group

| Group | Total | Auth | Sig | None |
|---|---|---|---|---|
| `/api/crm` | 81 | 71 | 2 | 8 |
| `/api/admin` | 78 | 77 | 0 | 1 |
| `/api/employee-access` | 39 | 39 | 0 | 0 |
| `/api/visa` | 38 | 34 | 0 | 4 |
| `/api/employee` | 36 | 35 | 0 | 1 |
| `/api/marketing` | 34 | 28 | 0 | 6 |
| `/api/brains` | 28 | 13 | 0 | 15 |
| `/api/counselor` | 26 | 23 | 0 | 3 |
| `/api/student` | 23 | 5 | 0 | 18 |
| `/api/applications` | 22 | 22 | 0 | 0 |
| `/api/communications` | 21 | 0 | 0 | 21 |
| `/api/partner` | 20 | 20 | 0 | 0 |
| `/api/student-portal` | 16 | 16 | 0 | 0 |
| `/api/hrm` | 14 | 13 | 0 | 1 |
| `/api/integrations` | 14 | 14 | 0 | 0 |
| `/api/course-finder` | 13 | 1 | 0 | 12 |
| `/api/whatsapp` | 13 | 9 | 2 | 2 |
| `/api/agentos` | 11 | 11 | 0 | 0 |
| `/api/university-monitoring` | 11 | 1 | 0 | 10 |
| `/api/video-engine` | 10 | 10 | 0 | 0 |
| `/api/cron` | 9 | 0 | 9 | 0 |
| `/api/portal-auth` | 9 | 4 | 0 | 5 |
| `/api/reviews` | 9 | 4 | 0 | 5 |
| `/api/seo` | 9 | 4 | 0 | 5 |
| `/api/website` | 9 | 1 | 0 | 8 |
| `/api/ai-command` | 8 | 4 | 0 | 4 |
| `/api/partner-admin` | 8 | 6 | 0 | 2 |
| `/api/content-engine` | 7 | 7 | 0 | 0 |
| `/api/language-prep` | 7 | 1 | 0 | 6 |
| `/api/social` | 7 | 6 | 0 | 1 |
| `/api/storage` | 7 | 3 | 0 | 4 |
| `/api/auth` | 6 | 2 | 0 | 4 |
| `/api/international-officer` | 6 | 6 | 0 | 0 |
| `/api/hr` | 5 | 2 | 0 | 3 |
| `/api/omnichannel` | 5 | 0 | 1 | 4 |
| `/api/source-intelligence` | 5 | 5 | 0 | 0 |
| `/api/workforce` | 5 | 5 | 0 | 0 |
| `/api/ai-safety` | 4 | 4 | 0 | 0 |
| `/api/ai` | 4 | 0 | 0 | 4 |
| `/api/app-manager` | 4 | 4 | 0 | 0 |
| `/api/automation` | 4 | 3 | 0 | 1 |
| `/api/inbox` | 4 | 3 | 0 | 1 |
| `/api/knowledge-center` | 4 | 0 | 0 | 4 |
| `/api/knowledge-sharing` | 4 | 4 | 0 | 0 |
| `/api/application-documents` | 3 | 3 | 0 | 0 |
| `/api/courses` | 3 | 0 | 0 | 3 |
| `/api/documents` | 3 | 3 | 0 | 0 |
| `/api/employee-learning` | 3 | 3 | 0 | 0 |
| `/api/employees` | 3 | 0 | 0 | 3 |
| `/api/enterprise-ai` | 3 | 1 | 0 | 2 |
| `/api/event-bus` | 3 | 1 | 0 | 2 |
| `/api/facebook` | 3 | 1 | 1 | 1 |
| `/api/knowledge-base` | 3 | 2 | 0 | 1 |
| `/api/referrals` | 3 | 2 | 0 | 1 |
| `/api/resources` | 3 | 2 | 0 | 1 |
| `/api/sop` | 3 | 2 | 0 | 1 |
| `/api/super-admin` | 3 | 3 | 0 | 0 |
| `/api/b2b` | 2 | 2 | 0 | 0 |
| `/api/content-relationships` | 2 | 2 | 0 | 0 |
| `/api/countries` | 2 | 0 | 0 | 2 |
| `/api/cv` | 2 | 2 | 0 | 0 |
| `/api/exams` | 2 | 0 | 0 | 2 |
| `/api/interview-questions` | 2 | 0 | 0 | 2 |
| `/api/lead-scoring` | 2 | 2 | 0 | 0 |
| `/api/live-edit` | 2 | 2 | 0 | 0 |
| `/api/quota` | 2 | 0 | 0 | 2 |
| `/api/scholarships` | 2 | 0 | 0 | 2 |
| `/api/services` | 2 | 1 | 0 | 1 |
| `/api/universities` | 2 | 0 | 0 | 2 |
| `/api/access-control` | 1 | 1 | 0 | 0 |
| `/api/agent` | 1 | 0 | 0 | 1 |
| `/api/agent-tasks` | 1 | 1 | 0 | 0 |
| `/api/agent-tools` | 1 | 1 | 0 | 0 |
| `/api/ai-agents` | 1 | 1 | 0 | 0 |
| `/api/ai-memory` | 1 | 1 | 0 | 0 |
| `/api/ai-registry` | 1 | 1 | 0 | 0 |
| `/api/application-team` | 1 | 0 | 0 | 1 |
| `/api/approval-center` | 1 | 0 | 0 | 1 |
| `/api/audit` | 1 | 0 | 0 | 1 |
| `/api/b2b-contacts` | 1 | 0 | 0 | 1 |
| `/api/behavior` | 1 | 0 | 0 | 1 |
| `/api/blog` | 1 | 0 | 0 | 1 |
| `/api/brand-assets` | 1 | 0 | 0 | 1 |
| `/api/campaigns` | 1 | 0 | 0 | 1 |
| `/api/chat` | 1 | 1 | 0 | 0 |
| `/api/commissions` | 1 | 1 | 0 | 0 |
| `/api/csv-import` | 1 | 0 | 0 | 1 |
| `/api/dashboard-alarm` | 1 | 1 | 0 | 0 |
| `/api/dashboard` | 1 | 1 | 0 | 0 |
| `/api/data-quality` | 1 | 1 | 0 | 0 |
| `/api/delete-request` | 1 | 1 | 0 | 0 |
| `/api/destinations` | 1 | 0 | 0 | 1 |
| `/api/email` | 1 | 1 | 0 | 0 |
| `/api/events` | 1 | 0 | 0 | 1 |
| `/api/faqs` | 1 | 0 | 0 | 1 |
| `/api/finance` | 1 | 1 | 0 | 0 |
| `/api/health` | 1 | 0 | 0 | 1 |
| `/api/homepage` | 1 | 0 | 0 | 1 |
| `/api/import-center` | 1 | 0 | 0 | 1 |
| `/api/interview` | 1 | 0 | 0 | 1 |
| `/api/interviews` | 1 | 0 | 0 | 1 |
| `/api/lead-forms` | 1 | 0 | 0 | 1 |
| `/api/leads` | 1 | 0 | 0 | 1 |
| `/api/learning-posts` | 1 | 0 | 0 | 1 |
| `/api/messages` | 1 | 1 | 0 | 0 |
| `/api/mock-tests` | 1 | 0 | 0 | 1 |
| `/api/news` | 1 | 0 | 0 | 1 |
| `/api/note-versions` | 1 | 1 | 0 | 0 |
| `/api/official-emails` | 1 | 0 | 0 | 1 |
| `/api/official-sources` | 1 | 0 | 0 | 1 |
| `/api/partner-packages` | 1 | 0 | 0 | 1 |
| `/api/partner-portal` | 1 | 0 | 0 | 1 |
| `/api/permissions` | 1 | 1 | 0 | 0 |
| `/api/related-content` | 1 | 0 | 0 | 1 |
| `/api/research` | 1 | 0 | 0 | 1 |
| `/api/(root)` | 1 | 0 | 0 | 1 |
| `/api/search` | 1 | 0 | 0 | 1 |
| `/api/source-logs` | 1 | 1 | 0 | 0 |
| `/api/stats` | 1 | 0 | 0 | 1 |
| `/api/student-benefits` | 1 | 0 | 0 | 1 |
| `/api/student-migration` | 1 | 1 | 0 | 0 |
| `/api/students` | 1 | 0 | 0 | 1 |
| `/api/timeline` | 1 | 0 | 0 | 1 |
| `/api/unified-communication` | 1 | 0 | 0 | 1 |
| `/api/university-agreements` | 1 | 0 | 0 | 1 |
| `/api/users` | 1 | 1 | 0 | 0 |
| `/api/weekly-reports` | 1 | 1 | 0 | 0 |
| `/api/weekly-updates` | 1 | 1 | 0 | 0 |
