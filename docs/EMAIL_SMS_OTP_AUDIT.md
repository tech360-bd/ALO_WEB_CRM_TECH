# Email and SMS OTP Audit

Status legend: PASS, PARTIAL, FAIL, BLOCKED, NOT VERIFIED.

## Phone (SMS) OTP — `src/lib/communication/otp-engine.ts`, `src/app/api/crm/communications/otp/route.ts`

| Finding (before) | Status now | Evidence |
|---|---|---|
| Raw OTP written to console (`console.log`) | FIXED | test "never prints it to the console" |
| Code generated with `Math.random` | FIXED — `crypto.randomInt` | source |
| Unkeyed SHA-256 of the code stored | FIXED — HMAC-SHA256 with `OTP_PEPPER`/`NEXTAUTH_SECRET` (fails closed if missing) | test "stores only a keyed digest" |
| Raw OTP returned as `devOtp` outside production | FIXED — removed from all responses | test "never includes a code" |
| "OTP sent" returned although no SMS was sent (placeholder) | FIXED — success only after `sendSms` resolves; delivery failure → 503 and challenge marked `delivery_failed` | tests "reports 503…", "marks the challenge undeliverable" |
| Verification not atomic (two concurrent requests could both pass) | FIXED — conditional `updateMany` consume | test "rejects a code that was consumed by a concurrent request" |
| Attempts not safely counted under concurrency | FIXED — compare-and-increment; block after 5 | test "counts wrong attempts and blocks…" |
| No resend cooldown, weak per-phone limit | FIXED — 60 s cooldown, 5 sends/60 min per phone, older codes superseded | tests |
| Expiry | PASS — 10 min, enforced in query | test "rejects an expired code" |

Still open for SMS:
- **Real provider delivery: NOT VERIFIED.** `sendSms` supports httpsms and a generic provider, but no provider credentials are configured in this sandbox. The unit tests mock the gateway; no real SMS was sent.
- Per-IP limits are not implemented for this route (only per-phone).
- Only one provider path is active at a time; no approved failover exists.

## Email OTP — `src/lib/auth/email-otp.ts`

Reviewed; already follows the required pattern (HMAC pepper, `randomInt`, per-email and per-IP hourly limits, compare-and-increment attempts, conditional single-use consume, delivery-failure retirement). Used by student login. Not modified in this pass. Not yet covered by a dedicated unit test in this pass: NOT VERIFIED for this audit.

## Password reset — `src/app/api/portal-auth/forgot-password/route.ts`, `reset-password/route.ts`

**FAIL — not fixed in this pass.**
- The forgot-password route still generates its code with `Math.random` and stores it in plaintext in `OtpCode.code`.
- The reset email carries a link token, not that code, so the stored code is never delivered.
- `reset-password` accepts the plaintext code. As a result, the reset-by-code path cannot succeed for a real user, and the stored plaintext is an unnecessary secret.
- Needed decision: keep link-token reset only (remove the code path), or switch to `issueEmailOtp` with a dedicated reset template.
