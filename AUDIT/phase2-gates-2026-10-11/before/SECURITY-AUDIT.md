# ALO Education ERP — Security Audit

**Date:** 2026-07-27
**Project:** alo-education-erp v0.3.0
**Scope:** Application code, authentication, RBAC, session management, API routes, database, deployment configuration.

---

## 1. Executive Summary

The ALO Education ERP implements defense-in-depth security controls across authentication, authorization, session management, transport security, and deployment hardening. No critical vulnerabilities were identified. Several recommendations for production hardening are documented below.

**Audit Result:** ✅ PASS for staging. Recommendations for production hardening documented in §9.

---

## 2. Authentication

| Control | Implementation | Status |
|---------|----------------|--------|
| Password hashing | bcryptjs with cost factor ≥10 (default) | ✅ |
| Password storage | Only `passwordHash` stored, never plaintext | ✅ |
| Login rate limiting | `LoginAttempt` table records every attempt; configurable via `RATE_LIMIT_LOGIN_PER_MINUTE` | ✅ |
| Account lockout | `status="suspended"` blocks login (returns 403) | ✅ |
| Failed login logging | `failureReason` captured (`user_not_found`, `wrong_password`, `account_suspended`) | ✅ |
| No user enumeration | Generic "Invalid credentials" for both wrong email and wrong password | ✅ |
| Session token generation | 48-byte cryptographically random hex (`crypto.randomBytes(48).toString('hex')`) | ✅ |
| Session expiry | 7-day expiry, checked on every request | ✅ |
| Session revocation | `revokedAt` field; revoked sessions return 401 | ✅ |
| Account status check | `status !== "active"` returns 403 with `account_<status>` error code | ✅ |
| First-login enforcement | `firstLoginRequired` field exposed in login response for UI to enforce password change | ✅ |
| Password reset tokens | `PasswordResetToken` model with expiry + single-use | ✅ |
| OTP codes | `OtpCode` model with expiry + max attempts | ✅ |

### Password Reset Flow

```
forgot-password request
  → validate email format
  → if user exists, generate token + hash + store with expiry
  → if user does NOT exist, return same success response (no enumeration)
  → send email with reset link (or log if EMAIL_PROVIDER=none)

reset-password request
  → validate token (hashed comparison)
  → check expiry
  → check single-use (mark used after success)
  → check account status
  → update passwordHash
  → revoke all existing sessions for the user
  → create audit log entry
```

---

## 3. Authorization (RBAC)

### 3.1 Role Model

13 RBAC roles are seeded:

| Role | Scope | Intended User |
|------|-------|---------------|
| SUPER_ADMIN | ALL | System administrator |
| ADMIN | ALL | Business administrator |
| HR_MANAGER | ALL | HR staff |
| BRANCH_MANAGER | BRANCH | Branch manager |
| COUNSELOR | ASSIGNED | Student counselor |
| APPLICATION_TEAM | ASSIGNED | Application processor |
| VISA_OFFICER | ASSIGNED | Visa officer |
| FINANCE | ALL | Finance staff |
| MARKETING | ALL | Marketing staff |
| FRONT_DESK | BRANCH | Reception |
| SUPPORT_STAFF | ASSIGNED | Helpdesk |
| PARTNER | ASSIGNED | External partner |
| STUDENT | ASSIGNED | End-user student |

### 3.2 Permission Model

- `PortalRole` table — defines roles
- `PortalPermission` table — defines permissions (e.g. `leads.read`, `users.create`)
- `PortalUserRole` junction — user ↔ role mapping
- `PortalRolePermission` junction — role ↔ permission mapping with `granted` boolean

### 3.3 Enforcement Points

| Layer | Enforcement | Status |
|-------|-------------|--------|
| API route | `withAuth(handler, {requireRoles, requirePermissions, requireUserTypes})` | ✅ |
| Database query | Branch/assigned scope applied in Prisma `where` clauses | ✅ |
| Frontend menu | Components hide menu items based on `auth.roles` and `auth.permissions` | ✅ |
| Ownership check | `checkOwnership(auth, resourceUserId)` helper for resource-specific access | ✅ |

### 3.4 Verified Test Cases

| Test | Expected | Actual |
|------|----------|--------|
| Admin token → `/api/admin/users` | 200 | ✅ |
| Counselor token → `/api/admin/users` | 403 (insufficient role) | ✅ |
| Missing token → `/api/admin/users` | 401 | ✅ |
| Invalid token → `/api/admin/users` | 401 | ✅ |
| Student token → `/api/counselor/dashboard` | 403 | ✅ |

---

## 4. Session Management

| Property | Value | Notes |
|----------|-------|-------|
| Token storage | DB (`PortalSession` table) | Enables revocation |
| Token format | 48-byte hex (192 bits entropy) | Sufficient |
| Transport | `Authorization: Bearer <token>` header | NOT in URL (prevents logging) |
| Expiry | 7 days from creation | Checked on every request |
| Revocation | `revokedAt` field set on logout / password reset | Effective immediately |
| Device binding | `userAgent` + `ipAddress` stored for audit | Not enforced (allows roaming) |
| Concurrent sessions | Multiple sessions per user allowed | Suitable for multi-device |

### Cookie Security

The current implementation uses bearer tokens (not cookies). This is intentional for the SPA architecture. If cookie-based sessions are added later:

- **HttpOnly:** Must be `true` (prevents XSS theft)
- **Secure:** Must be `true` in production (HTTPS only)
- **SameSite:** Recommended `Lax` or `Strict` (CSRF mitigation)
- **Path:** `/` (or restricted to auth paths)

---

## 5. Input Validation

| Layer | Implementation | Status |
|-------|----------------|--------|
| Email format | Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | ✅ |
| Phone format | Regex `/^[+\d\s()\-]{7,20}$/` | ✅ |
| Required fields | Server-side check before DB write | ✅ |
| Request body size | Next.js default (1 MB) | ✅ |
| JSON parsing | `await request.json()` in try/catch | ✅ |
| SQL injection | Prisma parameterized queries throughout | ✅ |
| XSS | React escapes by default; no `dangerouslySetInnerHTML` on user input | ✅ |
| Path traversal | File uploads use sanitized filenames (no `..` paths) | ✅ |
| Command injection | No `exec()` / `spawn()` with user input | ✅ |

---

## 6. File Upload Safety

| Control | Status |
|---------|--------|
| MIME type checking | ✅ (via file extension + content sniffing) |
| File size limit | ✅ (configurable) |
| Filename sanitization | ✅ (special chars stripped) |
| Path traversal protection | ✅ (uploads stored under `./upload/`, no `..` allowed) |
| Download authorization | ✅ (`checkOwnership` before serving) |

---

## 7. Transport Security

### 7.1 Production (Caddy)

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | HSTS — forces HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Disables device APIs |
| `Cross-Origin-Opener-Policy` | `same-origin` | Process isolation |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Cross-origin resource safety |
| `Cross-Origin-Resource-Policy` | `same-origin` | Restricts resource loading |
| `-Server` | (removed) | Hides server version |

### 7.2 Application Binding

The Next.js standalone server binds to `127.0.0.1:3000` only. It is NOT exposed on `0.0.0.0`. The public internet reaches the app exclusively through Caddy's HTTPS reverse proxy.

---

## 8. Deployment Hardening

### 8.1 systemd Service

| Restriction | Value |
|-------------|-------|
| `User`/`Group` | `alo` (dedicated service account, no shell login) |
| `NoNewPrivileges` | `true` (blocks setuid) |
| `PrivateTmp` | `true` (isolated /tmp) |
| `ProtectSystem` | `strict` (filesystem mostly read-only) |
| `ProtectHome` | `true` (no /home access) |
| `ReadWritePaths` | `/opt/alo-education /var/log/alo-education` (only needed paths) |
| `ProtectKernelTunables` | `true` |
| `ProtectKernelModules` | `true` |
| `ProtectControlGroups` | `true` |
| `RestrictAddressFamilies` | `AF_INET AF_INET6 AF_UNIX` |
| `RestrictNamespaces` | `true` |
| `LockPersonality` | `true` |
| `RestrictRealtime` | `true` |
| `RestrictSUIDSGID` | `true` |
| `LimitNOFILE` | `65535` |

### 8.2 File Permissions

| File | Owner | Mode |
|------|-------|------|
| `/opt/alo-education/.env` | `alo:alo` | `0600` |
| `/opt/alo-education/db/custom.db` | `alo:alo` | `0640` |
| `/opt/alo-education/.next/standalone/server.js` | `alo:alo` | `0644` |
| Backup directories | `root:root` | `0750` |
| Backup `.env` copies | `root:root` | `0600` |

---

## 9. Audit Logging

| Action Type | Logged? | Stored In |
|-------------|---------|-----------|
| `user.create` | ✅ | `PortalAuditLog` |
| `user.update` | ✅ | `PortalAuditLog` |
| `user.delete` | ✅ | `PortalAuditLog` |
| `user.login` | ✅ | `LoginAttempt` |
| `user.login_failed` | ✅ | `LoginAttempt` |
| `user.logout` | ✅ | `PortalAuditLog` + session revocation |
| `lead.create` | ✅ | `PortalAuditLog` + `TimelineEvent` |
| `lead.update` | ✅ | `PortalAuditLog` |
| `lead.assign` | ✅ | `PortalAuditLog` |
| `application.create` | ✅ | `PortalAuditLog` |
| `document.upload` | ✅ | `PortalAuditLog` |
| `document.download` | ✅ | `PortalAuditLog` |
| `password.reset_request` | ✅ | `PortalAuditLog` |
| `password.reset_complete` | ✅ | `PortalAuditLog` |
| `role.assign` | ✅ | `PortalAuditLog` |
| `permission.grant` | ✅ | `PortalAuditLog` |

Audit log entries include: `actorUserId`, `action`, `entityType`, `entityId`, `ipAddress`, `userAgent`, `metadata` (JSON), `createdAt`.

---

## 10. Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| `SESSION_SECRET` | `.env` file (mode 0600) | Manual — generate with `openssl rand -hex 32` |
| `AUTH_SECRET` | `.env` file | Manual |
| `ENCRYPTION_KEY` | `.env` file | Manual — used for PII encryption at rest |
| `DATABASE_URL` | `.env` file | Database-dependent |
| `SEED_ADMIN_PASSWORD` | `.env` file | Change immediately after first login |
| `ZAI_API_KEY` | `.env` file | Manual — for AI provider |
| `SMTP_PASSWORD` | `.env` file | Email provider-dependent |
| `S3_SECRET_ACCESS_KEY` | `.env` file | AWS IAM rotation |

**`.env.example`** contains only placeholder values — no real secrets.

`.gitignore` excludes `.env` from version control.

---

## 11. Rate Limiting

| Endpoint Category | Limit | Implementation |
|-------------------|-------|----------------|
| Login (`/api/portal-auth/login`) | 10 per IP per minute (configurable) | `LoginAttempt` table count + env var `RATE_LIMIT_LOGIN_PER_MINUTE` |
| OTP send | 5 per phone/email per hour | `OtpCode` table count + env var `RATE_LIMIT_OTP_PER_HOUR` |
| Password reset request | 3 per email per hour | `PasswordResetToken` table count + env var `RATE_LIMIT_PASSWORD_RESET_PER_HOUR` |
| Public consultation submission | No hard limit | Duplicate detection within 30 days prevents spam |

**Recommendation for production:** Add a global IP-based rate limiter at the Caddy layer for additional protection against DDoS.

---

## 12. Production Hardening Recommendations

These are NOT blocking for staging, but should be addressed before production launch:

1. **Database:** Use MySQL. MySQL's single-writer model will bottleneck under concurrent staff load.
2. **CSRF protection:** If cookie-based sessions replace bearer tokens, add CSRF tokens (currently N/A — bearer tokens are immune to CSRF).
3. **CSP header:** Add a Content-Security-Policy header in Caddyfile restricting script sources.
4. **Backups encryption:** Encrypt backup `.tar.gz` files at rest (e.g. with `gpg --symmetric`).
5. **Log rotation:** Verify Caddy and systemd logs are rotated (configured in Caddyfile + systemd journal).
6. **Vulnerability scanning:** Run `npm audit --omit=dev` periodically and address high/critical findings.
7. **Penetration testing:** Before public launch, commission an external pentest covering OWASP Top 10.
8. **Anomaly detection:** Set up monitoring for unusual login patterns (failed attempts from new IPs, mass data export, etc.).

---

## 13. Conclusion

The ALO Education ERP implements comprehensive security controls across all layers of the stack. The codebase passes the security audit for staging deployment. The production hardening recommendations in §12 should be addressed before public launch.
