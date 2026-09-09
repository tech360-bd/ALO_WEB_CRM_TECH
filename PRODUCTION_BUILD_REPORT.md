# Production Build Report

- Command: npm run build
- Exit code: production-build_exit=0
- Framework: Next.js 16.2.12
- Output: .next/standalone/server.js

## Build output excerpt
```text
> alo-education-erp@0.3.0 build
> prisma generate && next build --webpack && node scripts/prepare-standalone.mjs

Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.3) to ./node_modules/@prisma/client in 488ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate

▲ Next.js 16.2.12 (webpack)
- Environments: .env.production, .env

  Creating an optimized production build ...
✓ Compiled successfully in 16.6s
  Running TypeScript ...
  Finished TypeScript in 61s ...
  Collecting page data using 9 workers ...
  Generating static pages using 9 workers (0/210) ...
  Generating static pages using 9 workers (52/210) 
  Generating static pages using 9 workers (104/210) 
  Generating static pages using 9 workers (157/210) 
✓ Generating static pages using 9 workers (210/210) in 837ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin/access-control-center
├ ○ /admin/agent-center
├ ○ /admin/ai-command-center
├ ○ /admin/audit-logs
├ ○ /admin/branch-control
├ ○ /admin/countries
├ ○ /admin/countries/create
├ ƒ /admin/countries/edit/[id]
├ ○ /admin/country-control
├ ○ /admin/dashboard
├ ○ /admin/employee-control
├ ○ /admin/employees
├ ○ /admin/import-center/city-living-costs
├ ○ /admin/import-center/countries
├ ○ /admin/import-center/country-facts
├ ○ /admin/import-center/country-pages
├ ○ /admin/import-center/visa-rules
├ ○ /admin/integration-center
├ ○ /admin/integration-wizard
├ ○ /admin/reports
├ ○ /admin/role-permissions
├ ○ /admin/settings
├ ○ /admin/system-builder
├ ƒ /api
├ ƒ /api/admin/access-control
├ ƒ /api/admin/access-control-center
├ ƒ /api/admin/audit
├ ƒ /api/admin/countries
├ ƒ /api/admin/employees
├ ƒ /api/admin/employees/[id]
├ ƒ /api/admin/employees/activate
├ ƒ /api/admin/employees/create
├ ƒ /api/admin/employees/resend-activation
├ ƒ /api/admin/import-center
├ ƒ /api/admin/packages
├ ƒ /api/admin/partner-assignments
├ ƒ /api/admin/quota-requests
├ ƒ /api/admin/quotas
├ ƒ /api/admin/student-benefits
├ ƒ /api/admin/university-updates
├ ƒ /api/admin/users
├ ƒ /api/agentos/agents
├ ƒ /api/chat
├ ƒ /api/counselor/dashboard
├ ƒ /api/counselor/inbox
├ ƒ /api/counselor/students/[studentId]
├ ƒ /api/course-finder
├ ƒ /api/course-finder/compare
├ ƒ /api/course-finder/pro
├ ƒ /api/crm/analytics
├ ƒ /api/crm/applications
├ ƒ /api/crm/appointments
├ ƒ /api/crm/audit-logs
├ ƒ /api/crm/communications
├ ƒ /api/crm/communications/inbox
├ ƒ /api/crm/communications/timeline
├ ƒ /api/crm/course-import/confirm
├ ƒ /api/crm/course-import/download-errors
├ ƒ /api/crm/course-import/errors
├ ƒ /api/crm/course-import/history
├ ƒ /api/crm/course-import/map-university
├ ƒ /api/crm/course-import/rollback
├ ƒ /api/crm/course-import/stats
├ ƒ /api/crm/course-import/template/course
├ ƒ /api/crm/course-import/template/university
├ ƒ /api/crm/course-import/validate
├ ƒ /api/crm/courses
├ ƒ /api/crm/dashboard
├ ƒ /api/crm/documents
├ ƒ /api/crm/finance
├ ƒ /api/crm/hrm
├ ƒ /api/crm/inbox
├ ƒ /api/crm/leads
├ ƒ /api/crm/partners
├ ƒ /api/crm/reports
├ ƒ /api/crm/roles
├ ƒ /api/crm/scholarships
├ ƒ /api/crm/seed
├ ƒ /api/crm/seed-universities
├ ƒ /api/crm/settings
├ ƒ /api/crm/social
├ ƒ /api/crm/students
├ ƒ /api/crm/support
├ ƒ /api/crm/tasks
├ ƒ /api/crm/ucc/ai-assistant
├ ƒ /api/crm/ucc/analytics
├ ƒ /api/crm/ucc/conversations
├ ƒ /api/crm/ucc/conversations/[id]/assign
├ ƒ /api/crm/ucc/conversations/[id]/lead
├ ƒ /api/crm/ucc/conversations/[id]/notes
├ ƒ /api/crm/ucc/conversations/[id]/reply
├ ƒ /api/crm/ucc/documents/upload
├ ƒ /api/crm/ucc/employee-profiles
├ ƒ /api/crm/ucc/employee-profiles/offboard
├ ƒ /api/crm/ucc/form-fill/approve
├ ƒ /api/crm/ucc/integrations
├ ƒ /api/crm/ucc/morning-summary
├ ƒ /api/crm/ucc/oauth/callback
├ ƒ /api/crm/ucc/oauth/start
├ ƒ /api/crm/ucc/ocr/process
├ ƒ /api/crm/ucc/office-hours
├ ƒ /api/crm/ucc/webhooks/[provider]
├ ƒ /api/crm/universities
├ ƒ /api/crm/users
├ ƒ /api/crm/whatsapp
├ ƒ /api/cron/weekly-ai-agent
├ ƒ /api/destinations/[slug]
├ ƒ /api/employee/applications
├ ƒ /api/employee/attendance
├ ƒ /api/employee/documents
├ ƒ /api/employee/leave
├ ƒ /api/employee/messages
├ ƒ /api/employee/performance
├ ƒ /api/employee/profile
├ ƒ /api/employee/reports
├ ƒ /api/employee/salary
├ ƒ /api/employee/settings
├ ƒ /api/employee/students
├ ƒ /api/employee/tasks
├ ƒ /api/health
├ ƒ /api/marketing/agentos
├ ƒ /api/marketing/approvals
├ ƒ /api/marketing/calendar
├ ƒ /api/marketing/campaigns
├ ƒ /api/marketing/comments/convert-lead
├ ƒ /api/marketing/content
├ ƒ /api/marketing/dashboard
├ ƒ /api/marketing/dm/convert-lead
├ ƒ /api/marketing/seo
├ ƒ /api/marketing/social
├ ƒ /api/marketing/video
├ ƒ /api/marketing/webhooks
├ ƒ /api/partner/applications
├ ƒ /api/partner/commission
├ ƒ /api/partner/documents
├ ƒ /api/partner/help
├ ƒ /api/partner/leads
├ ƒ /api/partner/marketing
├ ƒ /api/partner/marketing/approve
├ ƒ /api/partner/marketing/generate
├ ƒ /api/partner/marketing/requests
├ ƒ /api/partner/marketing/usage
├ ƒ /api/partner/messages
├ ƒ /api/partner/notifications
├ ƒ /api/partner/profile
├ ƒ /api/partner/referrals
├ ƒ /api/partner/reports
├ ƒ /api/partner/resources
├ ƒ /api/partner/settings
```

## Warnings
```text
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Environment variables loaded from .env
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
(node:50568) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
```
