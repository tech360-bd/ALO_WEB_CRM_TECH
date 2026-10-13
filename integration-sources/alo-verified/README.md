# ALO Education Web + CRM — Production Verified

## Quick Start
1. Extract ZIP
2. npm install
3. Copy .env.example to .env, fill in values
4. npx prisma migrate deploy
5. npm run build
6. npm start

## Verified Stats
- Pages: 102
- API routes: 103
- Prisma models: 133
- Schema: MySQL
- Migration: 2536 lines
- Production build: PASS

## Key Features
- Public website (22 pages): destinations, universities, courses, scholarships, services, language prep, resources, book consultation
- Student portal (24 pages)
- Partner portal (15 pages)
- Partner-Admin portal (7 pages) — with $transaction seat limit
- Application-Manager portal (6 pages) — with 14-state transition machine
- CRM (21 pages)
- Auth (7 routes): login, register, logout, forgot-password, verify-otp, reset-password, change-password
- RBAC: requireAuth, requireRole, requireMarketingAccess, counselorScope
- Employee privacy: role-based field filtering (no PII to non-HR roles)
- Payroll RBAC: finance/HR only
- Private file downloads: auth-gated, path traversal protected
- WhatsApp: HMAC webhook, AI reply with LLM, SLA escalation
- Cron jobs: SLA sweep, OTP cleanup, session cleanup
- Marketing: campaigns, SEO tools, diagram studio, marketing kit, unified inbox
- Country pages: 7 countries with country-specific data
