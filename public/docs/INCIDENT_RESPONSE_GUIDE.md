# Incident Response Guide

## Severity Levels
- Critical: data exposure, credential compromise, payment/finance tampering, production outage.
- High: RBAC bypass, provider token failure, destructive command attempt, upload security failure.
- Medium: single workflow outage, failed background job, provider degradation.

## Response Steps
1. Contain the issue by disabling affected integration, command agent, user session or API path.
2. Preserve logs and do not rotate or delete audit evidence.
3. Confirm affected users, records, branches, files and providers.
4. Restore service from a verified backup only after testing restore integrity.
5. Record all corrective action in audit logs and release notes.

## Emergency AI Controls
If AI Command Center or agents behave unexpectedly, switch to read-only mode, disable scheduled commands, disable production changes and revoke agent service sessions.
