# Branch Manager User Guide

## Role purpose
The Branch Manager role uses ALO Education Web CRM for branch-scoped leads, students and staff work. This manual describes only functionality that should be available to this role through authenticated and authorized routes.

## Login
1. Open the correct portal route: /crm/dashboard.
2. Enter the assigned email or employee/student/partner credential.
3. Complete OTP or password reset steps when required by policy.
4. If login fails, confirm the account is ACTIVE and not locked or suspended.

## Dashboard
After login, the dashboard must show role-appropriate data only. Empty databases should show empty states, not fabricated students, applications, payments or messages.

## Main menus
- Daily work: use the assigned dashboard and related CRM modules.
- Communication: open permitted inbox/timeline views only.
- Documents: upload or download documents only through authorized APIs.
- Reports: access only reports allowed by BRANCH_MANAGER.
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
