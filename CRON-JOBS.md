# cPanel scheduled automation

No scheduled job was installed. Use the provider's Cron Jobs facility only after its runtime, secrets and outbound HTTPS support are confirmed. No always-running worker is assumed.

For the existing authenticated HTTP jobs, store a curl configuration privately outside the public root with restrictive owner-only permissions. It should contain the chosen HTTPS URL, method, `Authorization: Bearer <secret>` header, connect timeout, total timeout and fail-on-HTTP-error setting. Do not place the token in the URL or visible command. The cPanel command can be `curl --config <PRIVATE_CURL_CONFIG_PATH>` using the provider-confirmed curl executable. The path is an operator placeholder, not an application variable. Match ALO_CRON_SECRET/CRON_SECRET server configuration. Do not follow redirects with secret headers.

The following schedules are **proposals**, not claims of configured cron:

| Route / method | Proposed frequency | Purpose | Timeout | Expected / failure |
|---|---|---|---|---|
| /api/cron/health GET | Every 5 minutes | Operational checks | 30s | Inspect actual JSON; non-2xx/timeout alerts |
| /api/cron/sla-monitor GET | Every 5 minutes | SLA escalation | 60s | Inspect counters and audit, not HTTP alone |
| /api/cron/analytics GET | Daily | Analytics persistence | 120s | Validate CronJobLog and outcome |
| /api/cron/weekly-reports GET | Weekly | Reports | 120s | Validate report rows and outcome |
| /api/cron/followup GET | Pending approval | Outbound followups | 60s | Disabled until provider/approval/dedup verified |
| /api/cron/retry GET | Pending approval | Retry outbound work | 60s | Never blindly retry ambiguous deliveries |
| /api/automation/schedule POST | Pending review | Canonical scheduler | 120s | Requires secret and verified job persistence |
| /api/cron/weekly-ai-agent POST | Pending review | AI workflow | 120s | Credentials and persisted outcome required |
| /api/cron/weekly-university-scan GET | Do not enable | University scan | N/A | Source contains simulated updates; release blocker |
| /api/cron/weekly-university-update GET | Pending review | University updates | 120s | Provider/source verification required |

Confirm cPanel's timezone (TZ in the application does not necessarily control scheduler time). Avoid overlapping runs; existing worker locking is not established as durable. Configure private logs and operator alerts; never treat an HTTP timeout as proof the job did not execute. Existing handler stub/false-success defects must be repaired before activation.
