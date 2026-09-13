# ALO Education — Final Route Matrix

## Total Routes
- **Public API Routes:** 35 (accessible without authentication)
- **RBAC-Protected API Routes:** 31 (require specific roles)
- **Authenticated API Routes:** 112 (require session)
- **Total API Routes:** 178

## View Components
- **Total Views:** 118
- **Public Views:** 35
- **Student Portal Views:** 22
- **Counselor Portal Views:** 15
- **CRM Views:** 12
- **Partner Portal Views:** 4
- **Admin/Super Admin Views:** 15
- **AI Command Views:** 5
- **Communication Views:** 7
- **NexAbroad Dashboard:** 1
- **Approval Center:** 1
- **Auth Views:** 4

## Navigation Groups
1. **Public** — Homepage, destinations, courses, scholarships
2. **Student Portal** — Dashboard, profile, documents, applications
3. **Counselor Portal** — Dashboard, student 360, inbox, SOP studio
4. **CRM & Operations** — Dashboard, tasks, follow-ups, analytics
5. **Portals** — Partner, application team, finance, HRM
6. **System** — AI command, audit, access control, university monitoring
7. **Unified Communication** — Command center, WhatsApp, phone, SLA, templates

## Port Configuration
- Dev: `next dev -p 3025`
- Production: `NODE_ENV=production node .next/standalone/server.js`
- .env: `PORT=3025`
