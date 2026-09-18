# Environment Variable Guide

> Mandate §60–§65. The full data-driven audit is in
> `docs/deployment/ENVIRONMENT-AUDIT.md` / `FINAL-ENVIRONMENT-AUDIT.md` (generated from
> a `process.env.*` scan). This guide explains the categories and the rules.

## Counts (from the scan)
- **211** variables referenced in source (`src/`, `server.js`, `next.config.ts`).
- **171** declared in `.env.example`.
- **120** used-but-undeclared → must be added to `.env.example` (§62).
- **78** declared-but-unused → `LEGACY_UNUSED` candidates (§65), do not delete
  without a source audit.

## Categories (§62)
CORE · AUTH · DATABASE · SECURITY/ENCRYPTION · CRM · COMMUNICATION · META ·
WHATSAPP · INSTAGRAM · LINKEDIN · TIKTOK · YOUTUBE · GOOGLE · TELEGRAM · X ·
EMAIL · SMS · TELEPHONY · AI · VIDEO · AUDIO · VOICE · STORAGE · ANALYTICS ·
WORKFLOW · N8N · MEDIA · CRON · DEPLOYMENT.

## Rules enforced
1. **No fake values (§61).** Missing production secrets are `MISSING`;
   `.env.example` placeholders are `CONFIGURE_IN_SERVER_SECRET_STORE`. Never
   `changeme`/`123`/`example`/`fake-token`.
2. **Secrets only in secure production config (§63).** `.env`, `.env.production`,
   keys, tokens, SSH keys, DB passwords, encryption keys, and certificates are
   never committed. The CI secret-scan step enforces this.
3. **`ENCRYPTION_KEY`** must be a 64-char hex string in production; the token
   encryption module throws if it is missing in prod (no insecure fallback).

## §64 duplicate-name reconciliation (choose canonical, do not blind-delete)

| Pair | Finding | Canonical recommendation |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_TOKEN` | both used + declared | pick ONE; alias the other in code, then deprecate |
| `NEXTCLOUD_USER` / `NEXTCLOUD_USERNAME` | `NEXTCLOUD_USERNAME` used but undeclared | standardise on `NEXTCLOUD_USER`, declare it |
| `VAULTWARDEN_TOKEN` / `VAULTWARDEN_ADMIN_TOKEN` | both used, neither declared | declare both; they are distinct (user vs admin) |
| `APP_URL` / `ALO_APP_URL` | both used + declared | standardise on `ALO_APP_URL`; keep `APP_URL` fallback |
| `MOLX_URL` / `NEXT_PUBLIC_MOLX_URL` | both used + declared | server vs client — keep both, document the split |

> These are recommendations. Each requires a source-reference audit before any
> rename; none was changed in this pass (§64: do not blindly delete).

## §65 legacy environment
Variables belonging to obsolete systems (Firebase/Supabase/Base44/PHP/cPanel) are
flagged `LEGACY_UNUSED` in the audit only after confirming no source references.
`firestore.rules` exists at the repo root — Firebase is a legacy artefact; its env
vars (if any) are `LEGACY_UNUSED` candidates pending the source audit.

## Verification status
The scan is `CODE_COMPLETE` (generated). Marking each variable
`CONFIGURED`/`VERIFIED` requires reading the production environment — an OWNER
action (the sandbox cannot see production secrets, by design).
