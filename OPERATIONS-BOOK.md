# ALO Education — Operations Book

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Deployment Guide](#3-deployment-guide)
4. [Database Setup](#4-database-setup)
5. [Portals & Access](#5-portals--access)
6. [AI Workforce Management](#6-ai-workforce-management)
7. [Communication Channels](#7-communication-channels)
8. [Document Management](#8-document-management)
9. [CRM Operations](#9-crm-operations)
10. [Application & Visa Workflow](#10-application--visa-workflow)
11. [Security & RBAC](#11-security--rbac)
12. [Cron Jobs & Automation](#12-cron-jobs--automation)
13. [Backup & Recovery](#13-backup--recovery)
14. [Troubleshooting](#14-troubleshooting)
15. [External Integrations](#15-external-integrations)

---

## 1. System Overview

**Framework:** Next.js 16.1.3 (Turbopack) + React 19 + TypeScript 5
**Database:** MySQL 8 (Prisma 6.11.1 ORM)
**Runtime:** Bun
**Port:** 3025

### Inventory
| Component | Count |
|-----------|-------|
| API Routes | 178 |
| View Components | 118 |
| Prisma Models | 180 |
| shadcn UI Components | 48 |
| ALO Design System Components | 11 |
| AI Departments | 100 |
| AI Employees | 2,000 |
| Skills | 10,000 |
| Prompt Templates | 50,000 |
| Constitutional Rules | 500 |
| SOPs | 500 |
| AI Engines | 20 |
| Seed Files | 19 |
| Mini Services | 3 |
| Real Images | 12 |

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| ALO Orange | #F37021 | Primary CTA, actions |
| Education Blue | #0066CC | Navigation, trust, headings |
| Sunshine | #FFB347 | Highlights, AI recommendations |
| Black | #000000 | Primary text |
| Gray | #555555 | Secondary text |
| White | #FFFFFF | Main surface |

---

## 2. Architecture

```
                    ┌──────────────────────────┐
                    │     Caddy (HTTPS/443)     │
                    │   aloeducation.com        │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Next.js (Port 3025)     │
                    │  PM2 Managed              │
                    └────────────┬─────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
    ┌──────▼──────┐    ┌────────▼────────┐    ┌───────▼───────┐
    │ MySQL 8     │    │ Redis 7         │    │ Storage Pools │
    │ Port 3306   │    │ Port 6379       │    │ /mnt/ssd1,2  │
    │ db_education│    │ Cache + Sessions│    │ /home/aloedu │
    └─────────────┘    └────────────────┘    └───────────────┘

    ┌──────────────────────────────────────────────────────┐
    │  Mini-Services (PM2)                                 │
    │  • university-monitor (port 3001)                    │
    │  • sla-monitor (port 3002)                           │
    │  • follow-up-sender (port 3003)                     │
    └──────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────┐
    │  External Integrations                               │
    │  • OpenAI / Groq (AI)                               │
    │  • WhatsApp Business API (CONFIGURATION REQUIRED)   │
    │  • Resend Email (CONFIGURATION REQUIRED)             │
    │  • n8n (Workflow Automation)                        │
    │  • Twilio SMS (CONFIGURATION REQUIRED)               │
    └──────────────────────────────────────────────────────┘
```

### Three-Layer Architecture
1. **Experience Layer** — UI/UX/Animation/Design System
2. **Application Layer** — CRM/Student/Counselor/Partner/AI/Communication
3. **Data Layer** — MySQL/Prisma/Storage/APIs

---

## 3. Deployment Guide

### Prerequisites
- Ubuntu 22.04+ VPS with 8GB+ RAM
- Node.js 20+ / Bun 1.2+
- MySQL 8+
- Redis 7+
- Caddy (reverse proxy)

### Steps

```bash
# 1. Upload and extract
scp alo-last-final.zip root@server:/opt/
cd /opt && unzip alo-last-final.zip -d alo-education && cd alo-education

# 2. Install dependencies
bun install

# 3. Create storage directories
mkdir -p /mnt/ssd1 /mnt/ssd2 /home/aloedu/storage/uploads
chown -R www-data:www-data /mnt/ssd1 /mnt/ssd2 /home/aloedu/storage

# 4. Configure database
bunx prisma generate
bunx prisma db push
bun run db:seed

# 5. Build
bun run build

# 6. Start with PM2
pm2 start ecosystem.config.cjs --env production
pm2 save && pm2 startup

# 7. Configure Caddy
caddy reload --config /etc/caddy/Caddyfile
```

### Environment Variables
Configure in `.env`:
- `DATABASE_URL` — MySQL connection string
- `NEXTAUTH_SECRET` — 32-char hex string
- `OPENAI_API_KEY` — OpenAI/OpenRouter key
- `GROQ_API_KEY` — Groq API key
- `RESEND_API_KEY` — Email provider key
- `STORAGE_POOL_A/B/C` — Storage mount points
- `REDIS_URL` — Redis connection

---

## 4. Database Setup

### Provider
- **Production:** MySQL 8 (`provider = "mysql"`)
- **Development:** SQLite (switch temporarily for local dev)

### Schema
- 180 Prisma models
- Foreign keys with cascade deletes where appropriate
- Indexes on: CRM IDs, student_id, lead_id, counselor_id, status, created_at

### Seeding
```bash
bun run db:seed
```
Seeds: 100 departments, 2000 AI employees, 10000 skills, 50000 prompts, 500 rules, 500 SOPs, 20 engines, 13 countries, 12 universities, 13 courses, leads, students, applications, documents, payments, audit logs.

---

## 5. Portals & Access

### Port 3025 — Main Application

| Portal | Role | Access |
|--------|------|--------|
| Public Website | Public | No auth |
| Student Portal | STUDENT | Login required |
| Counselor Portal | COUNSELOR | Login + RBAC |
| CRM | COUNSELOR+ | Login + RBAC |
| Partner Portal | PARTNER | Login + RBAC |
| Admin | ADMIN | Login + RBAC |
| Super Admin | SUPER_ADMIN | Login + RBAC |
| AI Command Center | SUPER_ADMIN, ADMIN | Login + RBAC |
| Approval Center | SUPER_ADMIN, ADMIN | Login + RBAC |
| NexAbroad AI | SUPER_ADMIN, ADMIN, COUNSELOR | Login + RBAC |
| Communication Center | COUNSELOR+ | Login + RBAC |

### Default Login
- Email: `admin@aloeducation.com`
- Password: `alo123`
- Role: SUPER_ADMIN

---

## 6. AI Workforce Management

### Inventory
- 100 Departments (61 DCC Certified)
- 2,000 AI Employees (20 per department)
- 10,000 Skills
- 50,000 Prompt Templates
- 500 Constitutional Rules
- 500 SOPs
- 20 AI Engines (all ACTIVE)

### AI Command Center
Access: Sidebar → "AI Command Center" or "Enterprise AI Command"

**Commands:**
| Command | Risk | Auto-Execute |
|---------|------|-------------|
| CREATE_LEAD | LOW | Yes |
| UPDATE_STUDENT | MEDIUM | No |
| BUILD_AGENT | MEDIUM | No |
| MODIFY_APPLICATION | HIGH | No |
| MODIFY_CRM Payment | CRITICAL | No |

### Agent Self-Replication
- Each agent creates 3 children per 3-month cycle
- After 2 cycles → graduates to "2-loop AI model"
- DCC certification required (9 criteria)
- Lineage tracking with generation depth

### DCC Certification Criteria
1. SOP Coverage ≥ 95%
2. Knowledge Coverage ≥ 95%
3. Skill Coverage ≥ 95%
4. Test Pass Rate ≥ 95%
5. KPI Achievement ≥ 90%
6. Security Compliance = 100%
7. Audit Compliance = 100%
8. Self-Recovery Success ≥ 90%
9. Human Escalation Rate ≤ 10%

### 20 AI Engines
Knowledge Graph, RAG, Multi-Agent Collaboration, Memory, Planning, Reflection, Self-Healing, Self-Optimization, Evaluation, Governance, Security, Audit, Compliance, Observability, Workflow Orchestration, Event Bus, API Gateway, MCP Integration, Data Lake, Identity & RBAC

---

## 7. Communication Channels

### Unified Communication Center
All channels feed into one timeline:
- WhatsApp
- Email
- SMS
- Facebook/Instagram
- Website Chat
- Internal CRM
- AI Agent

### Configuration Status
| Channel | Code Status | Live Status |
|---------|------------|-------------|
| WhatsApp | Complete | CONFIGURATION REQUIRED |
| Email | Complete | CONFIGURATION REQUIRED |
| SMS | Complete | CONFIGURATION REQUIRED |
| Facebook/Instagram | Complete | CONFIGURATION REQUIRED |
| Website Chat | Complete | WORKING |
| Unified Inbox | Complete | WORKING |

### CRM ID System
Format: `ALO-CRM-2026-XXXXXX`

Identity Resolution:
1. Incoming message → normalize phone
2. Search students, leads, partners by phone/email
3. If match → attach to existing CRM
4. If no match → create new lead + CRM ID
5. Start SLA timer

### SLA Engine
- Configurable per channel, priority, student type
- Visual states: NORMAL (green), WARNING (amber), OVERDUE (red), CRITICAL (deep red)
- Auto-escalation at configurable thresholds
- Counselor justification system with manager review

---

## 8. Document Management

### Upload Flow
1. Student uploads file
2. MIME validation + extension check
3. Dangerous extensions blocked (.exe, .bat, .sh, etc.)
4. SHA-256 checksum generated
5. File stored in secure storage pool
6. FileMetadata + FileEvent records created
7. Access policy enforced (OWNER_ONLY, OWNER_AND_STAFF, STAFF_ONLY)

### Storage Pools
| Pool | Path | Purpose |
|------|------|---------|
| STUDENT_PARTNER | /mnt/ssd1 | Student documents, passports, certificates |
| OFFICIAL | /mnt/ssd2 | Company policies, SOPs, brand assets |
| OPERATIONAL | /home/aloedu/storage | Marketing media, reports, AI-generated |

### Access Control
- Files never publicly accessible
- Download requires authentication + access policy check
- Soft delete only (never hard-delete for audit)
- Every action logged in FileEvent

---

## 9. CRM Operations

### Lead Pipeline
```
NEW → CONTACTED → QUALIFIED → COUNSELING → APPLICATION → OFFER → CAS → VISA → ENROLLED
```

### Lead Drawer (Right-Side)
- Student Profile
- AI Match % + Lead Score
- Lead Information (destination, course, source, status)
- Next Best Action (AI-suggested)
- Actions: WhatsApp, Call, Email, Assign, Schedule, Convert

### CRM IDs
- Format: `ALO-CRM-2026-XXXXXX`
- Generated automatically on lead creation
- Permanent — never changes
- Used across all communications, documents, applications

---

## 10. Application & Visa Workflow

### Application Pipeline
```
DRAFT → SUBMITTED → UNDER_REVIEW → CONDITIONAL_OFFER → UNCONDITIONAL_OFFER → CAS → VISA → ENROLLED
```

Each stage logs: owner, deadline, SLA, documents, tasks, communications, audit.

### Visa Workflow
```
OFFER → PREPARATION → DOCUMENT_COLLECTION → VERIFICATION → FINANCIAL_REVIEW → INTERVIEW_PREPARATION → INTERVIEW → SUBMISSION → DECISION
```

### Visa Interview AI
- AI interviewer asks questions
- Adapts difficulty based on answers
- Tracks clarity, consistency, confidence
- Generates feedback + improvement plan
- Labeled as AI practice (not real immigration officer)

---

## 11. Security & RBAC

### Authentication
- NextAuth.js v4 with Credentials provider
- JWT sessions (30-day max age)
- bcrypt password hashing (12 rounds)
- Brute-force protection (5 attempts, 15-min lockout)

### RBAC (9 Roles)
| Role | Access |
|------|--------|
| SUPER_ADMIN | Everything + configuration |
| ADMIN | All operational modules |
| MANAGER | Branch/department modules |
| COUNSELOR | CRM + students + communications |
| MARKETING | Campaigns + content + analytics |
| FINANCE | Invoices + payments + commissions |
| DOCUMENTATION | Blog + content + SEO |
| AGENT | Partner portal |
| STUDENT | Own profile + documents |

### Enforcement Points
1. Middleware (JWT token + role check)
2. API routes (require_permission / require_role)
3. UI components (navigation filtered by role)
4. AI actions (risk-based authorization)

### Security Checklist
- ✅ CSRF protection
- ✅ Input validation
- ✅ File upload MIME/extension/size validation
- ✅ Path traversal prevention
- ✅ Audit logging on all sensitive actions
- ✅ No secrets in client-side code
- ✅ Environment variables for all credentials

---

## 12. Cron Jobs & Automation

### Mini Services
| Service | Port | Frequency | Purpose |
|---------|------|-----------|---------|
| university-monitor | 3001 | Hourly | Monitors university websites for data changes |
| sla-monitor | 3002 | Every 5 min | Monitors SLA breaches and escalations |
| follow-up-sender | 3003 | Daily | Sends automated follow-up messages |

### Automation Workflows
| Trigger | Actions |
|---------|---------|
| New lead (Website/WhatsApp/Facebook) | Create lead → AI score → Assign counselor → Welcome message → Follow-up task |
| Document upload | Store → Checksum → Validate → AI classify → Notify counselor |
| SLA breach | Warning → Urgent → Overdue → Escalation |
| Offer received | Update application → Notify counselor + student → Create tasks |
| Missing document | Detect → Notify student → Remind → Escalate counselor |

### 80/20 Target Model
- **80% AI:** Research, draft, classify, match, summarize, generate, route, notify
- **20% Human:** Approve, decide, counsel, handle exceptions, accountability

---

## 13. Backup & Recovery

> **SECURITY (2026-09-18):** a real production database password was previously committed in this file. It has been removed and **must be treated as compromised — rotate it**. Never put credentials in documentation; read them from the server's `.env` / secret store at runtime.

### Database Backup
```bash
# Daily MySQL backup
# Credentials come from the server's .env — never hardcode them in docs.
DB_USER=$(grep -E '^DB_USERNAME=' /path/to/.env | cut -d= -f2-)
DB_NAME=$(grep -E '^DB_DATABASE=' /path/to/.env | cut -d= -f2-)
mysqldump -u "$DB_USER" -p "$DB_NAME" | gzip > /backup/db_$(date +%Y%m%d).sql.gz

# Keep 30 days
find /backup -name "*.sql.gz" -mtime +30 -delete
```

### Storage Backup
```bash
# Weekly storage backup
rsync -av /mnt/ssd1/ /backup/ssd1/
rsync -av /mnt/ssd2/ /backup/ssd2/
```

### PM2 Process Recovery
```bash
pm2 resurrect  # Restarts all processes from saved list
```

---

## 14. Troubleshooting

### Server Won't Start
```bash
# Check port
lsof -i :3025
# Check PM2
pm2 status
pm2 logs alo-education
# Check memory
free -m
```

### Database Connection Failed
```bash
mysql -u "$DB_USER" -p "$DB_NAME" -e "SELECT 1"
# Check .env DATABASE_URL has no quotes
```

### Prisma Client Error
```bash
# For dev (SQLite):
sed -i 's/provider = "mysql"/provider = "sqlite"/' prisma/schema.prisma
DATABASE_URL="file:./db/custom.db" bunx prisma generate

# For production (MySQL):
sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
bunx prisma generate
```

### OOM (Out of Memory)
- Ensure 8GB+ RAM in production
- Set `PRISMA_CLIENT_ENGINE_TYPE=binary`
- Set `NODE_OPTIONS="--max-old-space-size=1536"`
- Prisma logging: `['error']` only (not `['query']`)

---

## 15. External Integrations

### Required Credentials
| Integration | Env Var | How to Get |
|-------------|---------|------------|
| WhatsApp Business | `WHATSAPP_ACCESS_TOKEN` | Meta Business Manager |
| Email (Resend) | `RESEND_API_KEY` | resend.com |
| SMS (Twilio) | `TWILIO_ACCOUNT_SID` | twilio.com |
| Facebook Graph | `FACEBOOK_APP_ID` | developers.facebook.com |
| Google OAuth | `GOOGLE_CLIENT_ID` | Google Cloud Console |
| OpenAI | `OPENAI_API_KEY` | platform.openai.com |
| Groq | `GROQ_API_KEY` | console.groq.com |

### Integration Status Display
Unconfigured integrations show "CONFIGURATION REQUIRED" — no fake success messages.

---

## Images

### Real AI-Generated Images (12 files)
| Image | Location | Purpose |
|-------|----------|---------|
| study-abroad-hero.png | public/images/hero/ | Homepage hero |
| uk.png | public/images/cards/ | UK destination card |
| canada.png | public/images/cards/ | Canada destination card |
| australia.png | public/images/cards/ | Australia destination card |
| usa.png | public/images/cards/ | USA destination card |
| ireland.png | public/images/cards/ | Ireland destination card |
| new-zealand.png | public/images/cards/ | New Zealand destination card |
| dubai.png | public/images/cards/ | Dubai destination card |
| counseling.png | public/images/services/ | Counseling service |
| english-test.png | public/images/services/ | English test service |
| visa.png | public/images/services/ | Visa service |
| success.png | public/images/services/ | Graduation success |

All images: lazy-loaded, descriptive alt text, responsive, optimized.

---

*ALO Education — Complete Student Management, CRM, Admission & Visa Workflow System*
*Operations Book v1.0*
