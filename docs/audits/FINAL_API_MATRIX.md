# ALO Education — Final API Matrix

## Total: 178 API Routes

## Public APIs (35 routes — no auth required)
| Route | Methods | Description |
|-------|---------|-------------|
| /api/homepage | GET | Homepage data (hero, services, stories, FAQs) |
| /api/countries | GET | Country pages (13 countries) |
| /api/universities | GET | University pages (12 universities) |
| /api/courses | GET | Course pages (13 courses) |
| /api/exams | GET | English exam pages |
| /api/scholarships | GET | Scholarship listings |
| /api/services | GET | Service pages |
| /api/resources | GET | Resource pages |
| /api/blog | GET | Blog posts |
| /api/news | GET | News articles |
| /api/events | GET | Events |
| /api/stats | GET | Homepage statistics |
| /api/leads | GET, POST | Leads (POST public for website forms) |
| /api/chat | POST | AI chat widget |
| /api/ai/match | POST | AI course matching |
| /api/ai/sop | POST | AI SOP generation |
| /api/ai/eligibility | POST | AI eligibility check |
| /api/search | GET | Global search |
| /api/health | GET | Health check |
| /api/approval-center | GET | Human Approval Center |
| /api/ai-command/* | GET, POST, PATCH | AI Command Center (5 routes) |
| /api/communications/* | GET, POST, PATCH | Communication module (21 routes) |
| /api/storage/* | GET, POST, DELETE | Storage (5 routes) |

## RBAC-Protected APIs (31 routes — role-specific)
| Route | Required Roles |
|-------|----------------|
| /api/finance | SUPER_ADMIN, ADMIN, FINANCE |
| /api/hrm | SUPER_ADMIN, ADMIN, HR_MANAGER |
| /api/hr | SUPER_ADMIN, ADMIN, HR_MANAGER |
| /api/employees | SUPER_ADMIN, ADMIN, HR_MANAGER |
| /api/audit | SUPER_ADMIN, ADMIN |
| /api/access-control | SUPER_ADMIN |
| /api/permissions | SUPER_ADMIN, ADMIN |
| /api/storage | SUPER_ADMIN, ADMIN, COUNSELOR, STUDENT |
| /api/enterprise-ai | SUPER_ADMIN, ADMIN |
| /api/ai-registry | SUPER_ADMIN, ADMIN |
| /api/university-monitoring | SUPER_ADMIN, ADMIN |
| /api/partner-admin | SUPER_ADMIN, ADMIN, PARTNER |
| /api/partner-packages | SUPER_ADMIN, ADMIN, PARTNER |
| /api/commissions | SUPER_ADMIN, ADMIN, FINANCE |
| /api/university-agreements | SUPER_ADMIN, ADMIN |
| /api/b2b-contacts | SUPER_ADMIN, ADMIN |
| /api/official-emails | SUPER_ADMIN, ADMIN, MARKETING_MANAGER |
| /api/interview-questions | SUPER_ADMIN, ADMIN, COUNSELOR |
| /api/brand-assets | SUPER_ADMIN, ADMIN (write) |
| /api/learning-posts | SUPER_ADMIN, ADMIN (write) |
| /api/note-versions | SUPER_ADMIN, ADMIN, COUNSELOR |
| /api/agent-tasks | SUPER_ADMIN, ADMIN |
| /api/agent-tools | SUPER_ADMIN, ADMIN |
| /api/csv-import | SUPER_ADMIN, ADMIN |
| /api/import-center | SUPER_ADMIN, ADMIN |
| /api/student-migration | SUPER_ADMIN, ADMIN |
| /api/delete-request | SUPER_ADMIN, ADMIN |

## Authenticated APIs (112 routes — session required)
- /api/students, /api/applications, /api/documents, /api/visa
- /api/mock-tests, /api/interviews, /api/timeline, /api/campaigns
- /api/ai-agents, /api/ai-memory, /api/counselor/*, /api/partner-portal
- /api/automation/dashboard, /api/weekly-reports, /api/dashboard-alarm
- /api/reviews/*, /api/student/*, /api/student-benefits
- /api/quota/*, /api/content-relationships, /api/app-manager/*
- /api/course-finder/*, /api/sop/generate, /api/cv/generate
- /api/marketing/*, /api/omnichannel/*, /api/inbox/*

## AI Command APIs (5 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| /api/ai-command/execute | POST, GET, PATCH | Execute CRM modifications with risk assessment |
| /api/ai-command/replicate | POST, GET | Agent self-replication (3 children per cycle) |
| /api/ai-command/lineage | GET | Agent family tree with generation tracking |
| /api/ai-command/actions | GET | Approval queue for pending actions |
| /api/ai-command/agents | GET | List AI employees available for replication |

## Communication APIs (21 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| /api/communications/templates | GET, POST | Template management |
| /api/communications/templates/[id] | PATCH, DELETE | Template edit/archive |
| /api/communications/quick-replies | GET, POST | Quick reply management |
| /api/communications/contacts/match | POST | Phone number dedup + identity resolution |
| /api/communications/contacts/match/[id]/resolve | POST | Resolve contact match |
| /api/communications/sla/policies | GET, POST | SLA policy management |
| /api/communications/sla/justifications | GET, POST | Counselor justifications |
| /api/communications/sla/justifications/[id]/review | POST | Manager review |
| /api/communications/sla/incidents | GET | SLA incident counters |
| /api/communications/sla/dashboard | GET | SLA dashboard stats |
| /api/communications/escalations | GET, POST | Escalation events |
| /api/communications/escalations/[id] | PATCH | Acknowledge/resolve |
| /api/communications/tasks | GET, POST | Communication tasks |
| /api/communications/tasks/[id] | PATCH | Update task status |
| /api/communications/calls/outcomes | GET, POST | Call outcome logging |
| /api/communications/calls/unknown | GET, POST | Unknown caller handling |
| /api/communications/social-accounts | GET, POST | Social account management |
| /api/communications/social-accounts/[id] | PATCH | Update permissions |
| /api/communications/webhooks/events | GET | Webhook event log |
| /api/communications/drafts | GET, POST | AI communication drafts |
| /api/communications/drafts/[id] | GET, PATCH | Approve/edit/reject drafts |

## Storage APIs (5 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| /api/storage/upload | POST | Multipart upload with checksum + MIME validation |
| /api/storage/download/[id] | GET | Streaming download with access control |
| /api/storage/list | GET | List files with filters |
| /api/storage/[id] | GET, DELETE | File metadata + soft delete |
| /api/storage/health | GET | Storage pool health check |
