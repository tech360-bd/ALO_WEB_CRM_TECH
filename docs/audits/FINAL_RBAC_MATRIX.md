# ALO Education — Final RBAC Matrix

## Authentication
- **System:** NextAuth.js v4 with Credentials provider
- **Session:** JWT strategy, 30-day max age
- **Password:** bcrypt hashing (12 rounds)
- **Pages:** /login, /register, /reset-password, /verify-otp

## Roles (9 defined)
| Role | Description | Access Level |
|------|-------------|---------------|
| SUPER_ADMIN | Full system control | All modules + configuration |
| ADMIN | Administrative access | All operational modules |
| MANAGER | Branch/department management | Assigned modules |
| COUNSELOR | Student/lead management | CRM + students + communications |
| MARKETING | Marketing operations | Campaigns + content + analytics |
| FINANCE | Financial operations | Invoices + payments + commissions |
| DOCUMENTATION | Content management | Blog + content + SEO |
| AGENT | Partner agent | Partner portal + assigned students |
| STUDENT | Student self-service | Own profile + documents + applications |

## Sensitive API Routes (RBAC enforced)
| Route | Allowed Roles | Test Result |
|-------|---------------|-------------|
| /api/finance | SUPER_ADMIN, ADMIN, FINANCE | 401 (no auth) ✅ |
| /api/hrm | SUPER_ADMIN, ADMIN, HR_MANAGER | 401 (no auth) ✅ |
| /api/hr | SUPER_ADMIN, ADMIN, HR_MANAGER | 401 (no auth) ✅ |
| /api/employees | SUPER_ADMIN, ADMIN, HR_MANAGER | 401 (no auth) ✅ |
| /api/audit | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/access-control | SUPER_ADMIN only | 401 (no auth) ✅ |
| /api/permissions | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/storage | SUPER_ADMIN, ADMIN, COUNSELOR, STUDENT | 401 (no auth) ✅ |
| /api/enterprise-ai | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/ai-registry | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/university-monitoring | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/partner-admin | SUPER_ADMIN, ADMIN, PARTNER | 401 (no auth) ✅ |
| /api/partner-packages | SUPER_ADMIN, ADMIN, PARTNER | 401 (no auth) ✅ |
| /api/commissions | SUPER_ADMIN, ADMIN, FINANCE | 401 (no auth) ✅ |
| /api/university-agreements | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/b2b-contacts | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/official-emails | SUPER_ADMIN, ADMIN, MARKETING_MANAGER | 401 (no auth) ✅ |
| /api/interview-questions | SUPER_ADMIN, ADMIN, COUNSELOR | 401 (no auth) ✅ |
| /api/brand-assets | SUPER_ADMIN, ADMIN (write) | 401 (no auth) ✅ |
| /api/learning-posts | SUPER_ADMIN, ADMIN (write) | 401 (no auth) ✅ |
| /api/note-versions | SUPER_ADMIN, ADMIN, COUNSELOR | 401 (no auth) ✅ |
| /api/agent-tasks | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/agent-tools | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/csv-import | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/import-center | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/student-migration | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |
| /api/delete-request | SUPER_ADMIN, ADMIN | 401 (no auth) ✅ |

## AI Risk-Based Authorization
| Risk Level | Example Action | Authorization | Test Result |
|-----------|----------------|---------------|-------------|
| LOW | CREATE_LEAD | Auto-execute | EXECUTED ✅ |
| MEDIUM | BUILD_AGENT | Requires approval | PENDING ✅ |
| HIGH | MODIFY_APPLICATION | Requires approval | PENDING ✅ |
| CRITICAL | MODIFY_CRM Payment | Mandatory human approval | PENDING ✅ |

## Permission Modules (64 permissions)
- students.view/create/edit/delete
- leads.view/create/edit/delete
- applications.view/create/edit/delete
- universities.view/create/edit/delete
- courses.view/create/edit/delete
- documents.view/upload/verify/delete
- tasks.view/create/edit/delete
- communications.view/create/delete
- marketing.view/create/edit/delete/approve
- finance.view/create/edit/delete
- reports.view/export
- users.view/create/edit/delete
- settings.view/edit
- audit.view
- And 15+ more module permissions

## Enforcement Points
1. **Middleware** — checks JWT token + role for sensitive routes
2. **API routes** — each route checks `require_permission()` or `require_role()`
3. **UI components** — navigation items filtered by role
4. **AI actions** — risk-based authorization (LOW auto, CRITICAL requires human)
