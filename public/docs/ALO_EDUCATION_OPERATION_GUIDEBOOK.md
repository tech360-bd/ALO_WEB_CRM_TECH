# ALO Education Operation Guidebook

This guide is generated from the current project routes, APIs, scripts and verification results. It does not claim live provider authorization or production database readiness where those checks failed.

## Initial Super Admin Setup

### Purpose
Configure company identity, confirm environment variables, create the first real administrator through the controlled seed or invite flow, and immediately rotate any temporary credentials.

### Authorized roles
SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/dashboard

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/dashboard.
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

## Company Settings

### Purpose
Maintain public company details, compliance text, operational defaults, and provider status without publishing unverified claims.

### Authorized roles
SUPER_ADMIN, ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/settings

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/settings.
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

## Branches

### Purpose
Create and maintain branch records, assign managers, and verify branch scoping before exposing student or lead records.

### Authorized roles
SUPER_ADMIN, ADMIN, BRANCH_MANAGER

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/branch-control

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/branch-control.
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

## Departments

### Purpose
Keep department ownership clear for counseling, application, visa, finance, HR, support and marketing work.

### Authorized roles
SUPER_ADMIN, ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/employee-control

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/employee-control.
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

## Employees

### Purpose
Invite employees, activate accounts, set roles, offboard safely, and preserve audit history.

### Authorized roles
SUPER_ADMIN, HR_MANAGER

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/employees

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/employees.
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

## Roles

### Purpose
Review role purpose, allowed scope and permission assignment before changing access.

### Authorized roles
SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/role-permissions

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/role-permissions.
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

## Permissions

### Purpose
Grant the minimum server-side permissions required for each role and verify 401/403 results.

### Authorized roles
SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/access-control-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/access-control-center.
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

## Leads

### Purpose
Create, deduplicate, assign, update status, and audit lead lifecycle changes.

### Authorized roles
COUNSELOR, BRANCH_MANAGER, FRONT_DESK

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/crm/dashboard

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /crm/dashboard.
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

## Students

### Purpose
Maintain student profiles, timelines, assigned staff and ownership boundaries.

### Authorized roles
COUNSELOR, APPLICATION_TEAM

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/crm/dashboard

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /crm/dashboard.
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

## Partners

### Purpose
Review partner status, referrals, commissions, quotas, requests and support communication.

### Authorized roles
PARTNER, ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/partner/login

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /partner/login.
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

## Applications

### Purpose
Track university applications, statuses, deadlines and document requirements.

### Authorized roles
APPLICATION_TEAM, COUNSELOR

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/crm/dashboard

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /crm/dashboard.
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

## Universities

### Purpose
Maintain verified university data only with official source and verification date.

### Authorized roles
ADMIN, APPLICATION_TEAM

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/countries

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/countries.
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

## Courses

### Purpose
Use Course Finder for real records and avoid fabricated ranking, fee or eligibility data.

### Authorized roles
ADMIN, COUNSELOR

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/course-finder

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/course-finder.
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

## Scholarships

### Purpose
Publish scholarships only when source, eligibility and verification are present.

### Authorized roles
ADMIN, COUNSELOR

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/scholarships

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/scholarships.
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

## Documents

### Purpose
Upload through authorized APIs, validate type and size, and download only after permission checks.

### Authorized roles
STUDENT, COUNSELOR, APPLICATION_TEAM

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/student-portal/documents

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/student-portal/documents.
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

## OCR

### Purpose
Run OCR where configured, review extracted text, and treat document text as untrusted input.

### Authorized roles
APPLICATION_TEAM

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/crm/ucc/ocr/process

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/crm/ucc/ocr/process.
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

## Form Autofill

### Purpose
Review AI suggestions before approval; never submit application data without human confirmation.

### Authorized roles
COUNSELOR, APPLICATION_TEAM

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/crm/ucc/form-fill/approve

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/crm/ucc/form-fill/approve.
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

## Unified Inbox

### Purpose
Use the CRM inbox for permitted conversations and preserve timeline records.

### Authorized roles
SUPPORT_STAFF, COUNSELOR, MARKETING

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/crm/inbox

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /crm/inbox.
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

## WhatsApp

### Purpose
Use official WhatsApp Cloud API configuration only; provider status remains not live until OAuth and webhook verification complete.

### Authorized roles
MARKETING, SUPPORT_STAFF

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/integration-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/integration-center.
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

## Facebook

### Purpose
Connect only through Meta OAuth; never store social passwords.

### Authorized roles
MARKETING

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/integration-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/integration-center.
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

## Instagram

### Purpose
Use Instagram Business APIs through Meta permissions and verified webhooks.

### Authorized roles
MARKETING

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/integration-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/integration-center.
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

## Email

### Purpose
Configure SMTP/IMAP via environment secrets and test sending/receiving before live use.

### Authorized roles
ADMIN, SUPPORT_STAFF

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/integration-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/integration-center.
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

## Other Official Channels

### Purpose
Keep SMS, Telegram and future channels disabled until credentials and webhooks are verified.

### Authorized roles
ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/integration-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/integration-center.
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

## Marketing Dashboard

### Purpose
Review campaigns, approvals, social messages and analytics without fabricating provider results.

### Authorized roles
MARKETING

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/reports

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/reports.
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

## Campaign Approval

### Purpose
Approve publish/send actions only after impact review and audit logging.

### Authorized roles
MARKETING, SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/marketing/approvals

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/marketing/approvals.
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

## Office-Hours AI

### Purpose
Configure office-hour rules and verify after-hours behavior before autonomous replies.

### Authorized roles
SUPER_ADMIN, MARKETING

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/crm/ucc/office-hours

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/crm/ucc/office-hours.
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

## After-Hours AI

### Purpose
Allow FAQ and intake assistance only within approved policies; uncertain cases escalate to staff.

### Authorized roles
SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/crm/ucc/ai-assistant

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/crm/ucc/ai-assistant.
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

## AI Command Center

### Purpose
Current route exists, but persistent command/audit/rollback execution is not verified and must not be treated as complete.

### Authorized roles
SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/ai-command-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/ai-command-center.
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

## AI Agent Management

### Purpose
Review agent registry, permissions, approval requirements and emergency controls before enabling actions.

### Authorized roles
SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/agent-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/agent-center.
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

## Reports

### Purpose
Generate reports from stored data and mark empty states honestly.

### Authorized roles
ADMIN, SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/reports

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/reports.
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

## Analytics

### Purpose
Use internal analytics where data exists; GA4 requires external authorization before live claims.

### Authorized roles
ADMIN, MARKETING

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/crm/analytics

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/crm/analytics.
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

## Audit Logs

### Purpose
Audit sensitive actions such as login, password reset, role, document, finance, provider and command events.

### Authorized roles
SUPER_ADMIN, ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/audit-logs

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/audit-logs.
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

## Integrations

### Purpose
Check provider configuration, token expiry, webhook status and live API verification before enabling production flows.

### Authorized roles
SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/integration-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/integration-center.
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

## Backups

### Purpose
Run backups without embedding passwords in commands or logs.

### Authorized roles
ADMIN, DEVOPS

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
deploy/ubuntu/backup.sh

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open deploy/ubuntu/backup.sh.
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

## Restore

### Purpose
Restore into a separate target first and verify table counts before replacing live data.

### Authorized roles
ADMIN, DEVOPS

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
deploy/ubuntu/restore.sh

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open deploy/ubuntu/restore.sh.
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

## Troubleshooting

### Purpose
Use health checks, server logs, Prisma errors and provider status to isolate issues.

### Authorized roles
ADMIN, DEVOPS

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/health

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/health.
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

## Daily Checklist

### Purpose
Check health, inbox, overdue tasks, provider status, failed jobs and backup status.

### Authorized roles
OPERATIONS

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/crm/dashboard

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /crm/dashboard.
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

## Weekly Checklist

### Purpose
Review reports, RBAC changes, audit logs, provider token expiry and database growth.

### Authorized roles
OPERATIONS

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/reports

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/reports.
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

## Monthly Checklist

### Purpose
Run restore rehearsal, dependency audit, provider review, security review and access recertification.

### Authorized roles
OPERATIONS

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/settings

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/settings.
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

## Incident Handling

### Purpose
Switch to containment, preserve logs, disable risky integrations and document all actions.

### Authorized roles
SUPER_ADMIN, DEVOPS

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
INCIDENT_RESPONSE_GUIDE.md

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open INCIDENT_RESPONSE_GUIDE.md.
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

## Employee Offboarding

### Purpose
Use disposable tests only; revoke sessions, reassign work, preserve history and audit.

### Authorized roles
HR_MANAGER, SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/api/crm/ucc/employee-profiles/offboard

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /api/crm/ucc/employee-profiles/offboard.
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

## Emergency Shutdown

### Purpose
Emergency read-only and agent shutdown require reauthentication and audit records; persistence is not verified in current build.

### Authorized roles
SUPER_ADMIN

### Required permission
Use the role permission matrix in PERMISSION_INVENTORY.csv and enforce the matching server-side API permission. Hidden menus are not authorization.

### Navigation path
/admin/ai-command-center

### Prerequisites
1. User account is active.
2. Session is valid and not revoked.
3. The role has the expected record scope.
4. Required provider credentials exist when an external channel is involved.

### Detailed steps
1. Sign in through the correct portal for the role.
2. Open /admin/ai-command-center.
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

