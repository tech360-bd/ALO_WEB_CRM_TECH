import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const evidence = fs.existsSync(".current-evidence-dir") ? fs.readFileSync(".current-evidence-dir", "utf8").trim() : "";
const logs = evidence ? path.join(root, evidence, "logs") : root;
const reports = evidence ? path.join(root, evidence, "reports") : root;
fs.mkdirSync(reports, { recursive: true });

const requiredRoleGuides = [
  ["SUPER_ADMIN_USER_GUIDE.md", "Super Admin", "/admin/dashboard", "SUPER_ADMIN", "all administrative and emergency controls"],
  ["ADMIN_USER_GUIDE.md", "Admin", "/admin/dashboard", "ADMIN", "delegated organization and operations management"],
  ["HR_MANAGER_USER_GUIDE.md", "HR Manager", "/admin/employees", "HR_MANAGER", "employee lifecycle, attendance and HR records"],
  ["BRANCH_MANAGER_USER_GUIDE.md", "Branch Manager", "/crm/dashboard", "BRANCH_MANAGER", "branch-scoped leads, students and staff work"],
  ["MARKETING_MANAGER_USER_GUIDE.md", "Marketing Manager", "/admin/integration-center", "MARKETING", "campaigns, social inbox and provider status"],
  ["COUNSELOR_USER_GUIDE.md", "Counselor", "/crm/dashboard", "COUNSELOR", "assigned leads, student advising and follow-ups"],
  ["APPLICATION_TEAM_USER_GUIDE.md", "Application Team", "/crm/dashboard", "APPLICATION_TEAM", "university applications and document readiness"],
  ["VISA_OFFICER_USER_GUIDE.md", "Visa Officer", "/crm/visa-dashboard", "VISA_OFFICER", "visa cases, interviews and readiness checks"],
  ["FINANCE_USER_GUIDE.md", "Finance", "/crm/dashboard", "FINANCE", "payments, commissions and finance reports"],
  ["FRONT_DESK_USER_GUIDE.md", "Front Desk", "/crm/dashboard", "FRONT_DESK", "consultations, walk-ins and appointment intake"],
  ["SUPPORT_STAFF_USER_GUIDE.md", "Support Staff", "/crm/inbox", "SUPPORT_STAFF", "communications, support tickets and escalations"],
  ["EMPLOYEE_USER_GUIDE.md", "Employee", "/employee/ucc", "EMPLOYEE", "daily staff tasks and role-assigned modules"],
  ["STUDENT_PORTAL_USER_GUIDE.md", "Student", "/student/login", "STUDENT", "own applications, documents, payments and messages"],
  ["PARTNER_PORTAL_USER_GUIDE.md", "Partner", "/partner/login", "PARTNER", "own referrals, commissions, documents and support"],
  ["AI_COMMAND_CENTER_USER_GUIDE.md", "AI Command Center User", "/admin/ai-command-center", "SUPER_ADMIN", "AI command review, impact previews and policy blocks"],
];

function read(file) {
  try { return fs.readFileSync(path.join(root, file), "utf8"); } catch { return ""; }
}

function writeBoth(name, body) {
  fs.writeFileSync(path.join(root, name), body);
  fs.writeFileSync(path.join(reports, name), body);
}

function sha(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex");
}

function status(file) {
  return read(path.join(evidence, "logs", file)).trim();
}

function logHead(name, n = 80) {
  const file = path.join(logs, name);
  if (!fs.existsSync(file)) return "Not found";
  return fs.readFileSync(file, "utf8").split(/\r?\n/).slice(0, n).join("\n").trim() || "(empty)";
}

const opChapters = [
  ["Initial Super Admin Setup", "SUPER_ADMIN", "/admin/dashboard", "Configure company identity, confirm environment variables, create the first real administrator through the controlled seed or invite flow, and immediately rotate any temporary credentials."],
  ["Company Settings", "SUPER_ADMIN, ADMIN", "/admin/settings", "Maintain public company details, compliance text, operational defaults, and provider status without publishing unverified claims."],
  ["Branches", "SUPER_ADMIN, ADMIN, BRANCH_MANAGER", "/admin/branch-control", "Create and maintain branch records, assign managers, and verify branch scoping before exposing student or lead records."],
  ["Departments", "SUPER_ADMIN, ADMIN", "/admin/employee-control", "Keep department ownership clear for counseling, application, visa, finance, HR, support and marketing work."],
  ["Employees", "SUPER_ADMIN, HR_MANAGER", "/admin/employees", "Invite employees, activate accounts, set roles, offboard safely, and preserve audit history."],
  ["Roles", "SUPER_ADMIN", "/admin/role-permissions", "Review role purpose, allowed scope and permission assignment before changing access."],
  ["Permissions", "SUPER_ADMIN", "/admin/access-control-center", "Grant the minimum server-side permissions required for each role and verify 401/403 results."],
  ["Leads", "COUNSELOR, BRANCH_MANAGER, FRONT_DESK", "/crm/dashboard", "Create, deduplicate, assign, update status, and audit lead lifecycle changes."],
  ["Students", "COUNSELOR, APPLICATION_TEAM", "/crm/dashboard", "Maintain student profiles, timelines, assigned staff and ownership boundaries."],
  ["Partners", "PARTNER, ADMIN", "/partner/login", "Review partner status, referrals, commissions, quotas, requests and support communication."],
  ["Applications", "APPLICATION_TEAM, COUNSELOR", "/crm/dashboard", "Track university applications, statuses, deadlines and document requirements."],
  ["Universities", "ADMIN, APPLICATION_TEAM", "/admin/countries", "Maintain verified university data only with official source and verification date."],
  ["Courses", "ADMIN, COUNSELOR", "/api/course-finder", "Use Course Finder for real records and avoid fabricated ranking, fee or eligibility data."],
  ["Scholarships", "ADMIN, COUNSELOR", "/api/scholarships", "Publish scholarships only when source, eligibility and verification are present."],
  ["Documents", "STUDENT, COUNSELOR, APPLICATION_TEAM", "/api/student-portal/documents", "Upload through authorized APIs, validate type and size, and download only after permission checks."],
  ["OCR", "APPLICATION_TEAM", "/api/crm/ucc/ocr/process", "Run OCR where configured, review extracted text, and treat document text as untrusted input."],
  ["Form Autofill", "COUNSELOR, APPLICATION_TEAM", "/api/crm/ucc/form-fill/approve", "Review AI suggestions before approval; never submit application data without human confirmation."],
  ["Unified Inbox", "SUPPORT_STAFF, COUNSELOR, MARKETING", "/crm/inbox", "Use the CRM inbox for permitted conversations and preserve timeline records."],
  ["WhatsApp", "MARKETING, SUPPORT_STAFF", "/admin/integration-center", "Use official WhatsApp Cloud API configuration only; provider status remains not live until OAuth and webhook verification complete."],
  ["Facebook", "MARKETING", "/admin/integration-center", "Connect only through Meta OAuth; never store social passwords."],
  ["Instagram", "MARKETING", "/admin/integration-center", "Use Instagram Business APIs through Meta permissions and verified webhooks."],
  ["Email", "ADMIN, SUPPORT_STAFF", "/admin/integration-center", "Configure SMTP/IMAP via environment secrets and test sending/receiving before live use."],
  ["Other Official Channels", "ADMIN", "/admin/integration-center", "Keep SMS, Telegram and future channels disabled until credentials and webhooks are verified."],
  ["Marketing Dashboard", "MARKETING", "/admin/reports", "Review campaigns, approvals, social messages and analytics without fabricating provider results."],
  ["Campaign Approval", "MARKETING, SUPER_ADMIN", "/api/marketing/approvals", "Approve publish/send actions only after impact review and audit logging."],
  ["Office-Hours AI", "SUPER_ADMIN, MARKETING", "/api/crm/ucc/office-hours", "Configure office-hour rules and verify after-hours behavior before autonomous replies."],
  ["After-Hours AI", "SUPER_ADMIN", "/api/crm/ucc/ai-assistant", "Allow FAQ and intake assistance only within approved policies; uncertain cases escalate to staff."],
  ["AI Command Center", "SUPER_ADMIN", "/admin/ai-command-center", "Current route exists, but persistent command/audit/rollback execution is not verified and must not be treated as complete."],
  ["AI Agent Management", "SUPER_ADMIN", "/admin/agent-center", "Review agent registry, permissions, approval requirements and emergency controls before enabling actions."],
  ["Reports", "ADMIN, SUPER_ADMIN", "/admin/reports", "Generate reports from stored data and mark empty states honestly."],
  ["Analytics", "ADMIN, MARKETING", "/api/crm/analytics", "Use internal analytics where data exists; GA4 requires external authorization before live claims."],
  ["Audit Logs", "SUPER_ADMIN, ADMIN", "/admin/audit-logs", "Audit sensitive actions such as login, password reset, role, document, finance, provider and command events."],
  ["Integrations", "SUPER_ADMIN", "/admin/integration-center", "Check provider configuration, token expiry, webhook status and live API verification before enabling production flows."],
  ["Backups", "ADMIN, DEVOPS", "deploy/ubuntu/backup.sh", "Run backups without embedding passwords in commands or logs."],
  ["Restore", "ADMIN, DEVOPS", "deploy/ubuntu/restore.sh", "Restore into a separate target first and verify table counts before replacing live data."],
  ["Troubleshooting", "ADMIN, DEVOPS", "/api/health", "Use health checks, server logs, Prisma errors and provider status to isolate issues."],
  ["Daily Checklist", "OPERATIONS", "/crm/dashboard", "Check health, inbox, overdue tasks, provider status, failed jobs and backup status."],
  ["Weekly Checklist", "OPERATIONS", "/admin/reports", "Review reports, RBAC changes, audit logs, provider token expiry and database growth."],
  ["Monthly Checklist", "OPERATIONS", "/admin/settings", "Run restore rehearsal, dependency audit, provider review, security review and access recertification."],
  ["Incident Handling", "SUPER_ADMIN, DEVOPS", "INCIDENT_RESPONSE_GUIDE.md", "Switch to containment, preserve logs, disable risky integrations and document all actions."],
  ["Employee Offboarding", "HR_MANAGER, SUPER_ADMIN", "/api/crm/ucc/employee-profiles/offboard", "Use disposable tests only; revoke sessions, reassign work, preserve history and audit."],
  ["Emergency Shutdown", "SUPER_ADMIN", "/admin/ai-command-center", "Emergency read-only and agent shutdown require reauthentication and audit records; persistence is not verified in current build."],
];

let op = `# ALO Education Operation Guidebook

This guide is generated from the current project routes, APIs, scripts and verification results. It does not claim live provider authorization or production database readiness where those checks failed.

`;
for (const [chapter, roles, nav, purpose] of opChapters) {
  op += `## ${chapter}

### Purpose
${purpose}

### Authorized roles
${roles}

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
${nav}

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open ${nav}.
3. Confirm the selected branch, assignment or ownership scope before opening records.
4. Enter or review data using the visible form controls.
5. Submit only after validation errors are clear.
6. Verify the saved result from the page, related timeline, report, or API response.
7. Check audit logs for sensitive actions.

### Expected result
The operation persists only authorized records, shows real database-backed data or an honest empty/configuration state, and records audit history where required.

### Validation method
Use the relevant route/API inventory row, HTTP status, database count, and audit record. For external integrations, use provider status and webhook verification before live use.

### Audit-log effect
Sensitive changes should create an audit row naming actor, action, entity type, entity ID and timestamp. If no audit row exists, do not claim the workflow is fully verified.

### Common errors
- 401 means the session is missing or invalid.
- 403 means the role or scope is insufficient.
- Provider configuration errors mean OAuth, webhook or secret setup is incomplete.
- Database errors mean migration, schema or connection state must be repaired first.

### Troubleshooting
Check /api/health, server logs, Prisma logs, provider matrix status, and the exact endpoint in API_INVENTORY.csv. Do not retry destructive actions until backup status is known.

### Security warning
Treat imported files, OCR text, customer messages, emails and social comments as untrusted. Do not expose secrets, raw tokens, passwords, private documents, or cross-scope student/partner data.

### Correction or rollback
For configuration changes, restore the previous saved settings or rollback record. For database incidents, restore into a separate database first and compare counts before replacing production.

`;
}
writeBoth("ALO_EDUCATION_OPERATION_GUIDEBOOK.md", op);

for (const [file, role, route, permission, focus] of requiredRoleGuides) {
  const body = `# ${role} User Guide

## Role purpose
The ${role} role uses ALO Education Web CRM for ${focus}. This manual describes only functionality that should be available to this role through authenticated and authorized routes.

## Login
1. Open the correct portal route: ${route}.
2. Enter the assigned email or employee/student/partner credential.
3. Complete OTP or password reset steps when required by policy.
4. If login fails, confirm the account is ACTIVE and not locked or suspended.

## Dashboard
After login, the dashboard must show role-appropriate data only. Empty databases should show empty states, not fabricated students, applications, payments or messages.

## Main menus
- Daily work: use the assigned dashboard and related CRM modules.
- Communication: open permitted inbox/timeline views only.
- Documents: upload or download documents only through authorized APIs.
- Reports: access only reports allowed by ${permission}.
- Settings: update settings only when this role explicitly has permission.

## Daily tasks
1. Review assigned alerts, tasks and messages.
2. Open only records within OWN, ASSIGNED, BRANCH or ALL scope granted to the role.
3. Update statuses through forms that validate input.
4. Confirm persistence by reopening the record or checking the related timeline/report.
5. Escalate 403 access denials instead of attempting a workaround.

## Communication
Use the unified inbox or portal messages where available. Provider-backed WhatsApp, Facebook, Instagram, SMS and email features require external provider authorization before live operation.

## Documents
All private documents must be uploaded through validated endpoints and retrieved through permission-controlled downloads. Never share direct storage paths.

## Notifications
Review unread notifications and mark them only after completing the related action.

## Reports
Reports must be based on real database data. If a report is empty, keep it empty and verify filters before escalating.

## Security responsibilities
- Keep credentials private.
- Log out after shared-machine use.
- Report unexpected access, missing audit logs, or data from another owner/branch.
- Never paste secrets into AI, chat, notes or provider messages.

## Common problems
- 401: sign in again.
- 403: role or scope does not permit the action.
- Validation error: correct the highlighted fields.
- Provider error: integration is not configured or not live-authorized.
- Database error: report to Super Admin/DevOps; do not retry bulk actions.

## Logout
Use the logout control. Logout must revoke the session and private pages should redirect or reject subsequent access.

## Escalation path
Escalate access or data issues to Super Admin. Escalate provider configuration to the authorized integration owner. Escalate production outages using INCIDENT_RESPONSE_GUIDE.md.
`;
  writeBoth(file, body);
}

writeBoth("DATABASE_MIGRATION_VERIFICATION.md", `# Database Migration Verification

## Engine
- Configured provider in prisma/schema.prisma: mysql
- Production MySQL 8.0.37 verification: required on cPanel or disposable MySQL host
- Required MySQL migrate deploy command: DATABASE_URL=mysql://USER:REPLACE_WITH_PASSWORD@HOST:3306/DB npx prisma migrate deploy
- Result: FAIL

## Evidence
\`\`\`text
${logHead("db-migrate-deploy-tmp.stdout.log", 40)}
${logHead("db-migrate-deploy-tmp.stderr.log", 60)}
\`\`\`

## db push disposable setup
\`\`\`text
${logHead("db-push-runtime.stdout.log", 40)}
${logHead("db-push-runtime.stderr.log", 60)}
\`\`\`

## Manual SQL control check
- Applying committed MySQL migration SQL must be verified against MySQL 8.0.37.
- This does not replace Prisma migrate deploy.

## Verdict
Database deployment requires a live or disposable MySQL connection before final production acceptance.
`);

writeBoth("TEST_REPORT.md", `# Test Report

## Static verification
- prisma format --check: initial FAIL, final PASS after prisma format.
- prisma validate: PASS.
- prisma generate: PASS.
- npm run typecheck: PASS.
- npm run lint: initial FAIL, final PASS after React hook fixes.
- npm run build: PASS.

## Automated tests
### Unit and integration command
\`\`\`text
npm test
${logHead("test.stdout.log", 40)}
\`\`\`

### Integration subset command
\`\`\`text
npm run test:integration
${logHead("test-integration.stdout.log", 40)}
\`\`\`

### Playwright command
\`\`\`text
npm run test:e2e
${logHead("test-e2e-rerun.stdout.log", 80)}
\`\`\`

## Critical gaps
- No full automated RBAC matrix suite exists for every role and scope.
- No real provider OAuth live tests executed.
- No successful Prisma migration/seed test.
- No database-backed AI Command Center persistence test because migration/setup failed and no command persistence API/model was found.
`);

writeBoth("PRODUCTION_BUILD_REPORT.md", `# Production Build Report

- Command: npm run build
- Exit code: ${status("production-build.status.log") || "Not found"}
- Framework: Next.js 16.2.12
- Output: .next/standalone/server.js

## Build output excerpt
\`\`\`text
${logHead("production-build.stdout.log", 180)}
\`\`\`

## Warnings
\`\`\`text
${logHead("production-build.stderr.log", 80)}
\`\`\`
`);

writeBoth("PRODUCTION_STARTUP_AND_HEALTH_REPORT.md", `# Production Startup and Health Report

- Command: HOSTNAME=127.0.0.1 PORT=3210 ... npm start
- Server status: ${logHead("production-start.status.log", 20)}

## HTTP results
\`\`\`csv
route,status,content-type
${logHead("production-http.csv", 40)}
\`\`\`

## Startup output
\`\`\`text
${logHead("production-start.stdout.log", 40)}
\`\`\`
`);

writeBoth("AI_COMMAND_CENTER_VERIFICATION.md", `# AI Command Center Verification

## Route evidence
- Route file: src/app/admin/ai-command-center/page.tsx
- Rendered component: MasterSuperAdminDashboard
- HTTP route status during standalone test: /admin/ai-command-center = 200

## Persistence evidence
No persistent AI command execution model/API with command IDs, approval IDs, rollback snapshot IDs and audit relationships was verified in the active schema/API search.

## Requested illustrative IDs
cmd_read_001, cmd_safe_002, cmd_appr_003, cmd_sec_004, aud_log_9012, aud_log_9013, aud_log_9014, aud_log_9015, appr_req_7819, snap_rec_4012 and snap_rec_4013 are NOT verified database records in this run. They are not used as evidence.

## Blocked/failed tests
- Employee denied: not executed against DB-backed command API because no such persistent API was verified.
- Admin denied where Super Admin required: route-only check insufficient; not counted.
- Raw SQL blocked: not executed because command execution API is not verified.
- Shell command blocked: not executed because command execution API is not verified.
- Prompt injection from conversation/OCR text: not executed because command execution API is not verified.
- Rollback restores persisted data: not executed because rollback records are not verified.
- Emergency read-only mode: not verified as persisted control.

## Verdict
AI Command Center is INCOMPLETE as a production command execution system. The page exists, but controlled persistent actions, approvals, audit records and rollback evidence are not verified.
`);

writeBoth("BACKUP_RESTORE_TEST_REPORT.md", `# Backup and Restore Test

## Scope
Disposable MySQL database initialized with committed migration SQL, not Prisma migrate deploy.

## Evidence
\`\`\`text
${logHead("backup-db-init.status.log", 20)}
${logHead("backup-db-insert.status.log", 20)}
${logHead("backup-command.status.log", 20)}
${logHead("restore-command.status.log", 20)}
${logHead("restore-verify.status.log", 20)}
${logHead("backup-files.log", 20)}
${logHead("backup-sha256.log", 20)}
\`\`\`

## Verdict
Disposable backup/restore utility test passed. Production backup/restore against MySQL/MySQL was not executed.
`);

writeBoth("SECRET_SCAN_REPORT.md", `# Secret Scan Report

Generated by FILE_MANIFEST.csv pattern scan.

## Rules
Scanned delivery-relevant files for common AWS keys, OpenAI-style keys, Slack tokens, private keys, database URLs with inline credentials and password assignments.

## Current result
Review FILE_MANIFEST.csv column "Secret scan result". Real .env and .env.production are excluded from delivery packages.

## Caveat
Pattern scanning is not a replacement for a dedicated secret scanner such as gitleaks/trufflehog. No secret values are printed in this report.
`);

writeBoth("CLEAN_EXTRACT_VERIFICATION.md", `# Clean Extract Verification

Clean extraction has not passed.

Reason: the source package must be rebuilt after current changes, but the mandatory database migration gate fails before a clean package can be accepted.

Required sequence remains blocked at:
1. npx prisma migrate deploy: FAIL
2. npx prisma db seed: FAIL because tables are not created

No CLEAN_INSTALL_VERIFIED claim is made.
`);

writeBoth("PRODUCTION_PACKAGE_RUNTIME_VERIFICATION.md", `# Production Package Runtime Verification

The production deployment archive can only be accepted after clean extraction and runtime test from the archive. Current standalone runtime from the source tree starts and serves smoke routes, but archive-based runtime verification is not yet accepted because the database migration gate fails.
`);

writeBoth("MISSING-FEATURE-STATUS.md", `# Missing Feature Status

## Blocking items
- Prisma migrate deploy fails with schema engine error.
- Prisma db push fails with schema engine error.
- Safe seed fails because tables are not created.
- Production MySQL/MySQL/MariaDB migration not verified; schema currently uses MySQL.
- AI Command Center persistent command execution, approval, rollback and database evidence not verified.
- Full RBAC/ownership matrix automation not implemented for every role and scope.
- Live provider OAuth/webhook/API verification not performed.
- Clean-extract gate not passed.

## Completed in this pass
- Corrected project snapshot and inventories.
- Fixed React lint blockers in communication components.
- Added real Playwright config and browser smoke/auth tests.
- Verified production build and standalone source-tree startup.
- Added disposable MySQL backup/restore scripts and test.
`);

writeBoth("DELIVERY_PACKAGE_VERIFICATION.md", `# Delivery Package Verification

Package verification will be regenerated after archives are rebuilt. Current mandatory gates are not all passing, so archives must not be described as production ready.
`);

// Regenerate inventories after doc writes.
console.log("Docs and verification reports written.");
