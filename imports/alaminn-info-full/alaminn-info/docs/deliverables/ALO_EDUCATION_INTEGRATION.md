# ALO_EDUCATION_INTEGRATION.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info ↔ ALO Education Referral Integration |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Document how the Higher Study platform on Alaminn.info hands off warm student leads to ALO Education for application processing, including the cryptographic referral token flow, PII guard, 24-hour TTL, and the four required environment variables. |

---

## Architectural roles

| Platform | Role | Domain |
|---|---|---|
| **Alaminn.info** | Discovery platform — surfaces universities, courses, scholarships, PhD/research, supervisors, study resources. Helps students discover and shortlist. Does NOT process applications. | https://alaminn.info |
| **ALO Education** | Application platform — collects student PII, processes applications, generates student IDs, sends OTPs, assigns counsellors, manages the application lifecycle. | (ALO Education's own domain — never exposed in this repo) |

> **Confidentiality**: This document references ALO Education only as an external integration partner. ALO Education's source code, internal API contract details beyond what's documented here, and any credentials are NEVER included in this repository. Alaminn.info integrates via API + HMAC-signed tokens ONLY.

---

## The referral flow (end-to-end)

```
┌─────────────────┐                                  ┌─────────────────┐
│                 │   1. Visitor clicks "Apply Now"  │                 │
│   Alaminn.info  │ ◄──────────────────────────────  │   Visitor       │
│   Higher Study  │                                  │   (browser)     │
│                 │   2. Show transfer notice +      │                 │
│                 │      consent checkbox            │                 │
│                 │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   3. Visitor consents, clicks    │                 │
│                 │      "Continue to ALO Education" │                 │
│                 │ ──────────────────────────────►  │                 │
│                 │                                  │                 │
│                 │   4. POST /api/v1/higher-study/  │                 │
│                 │      referral (with PUBLIC       │                 │
│                 │      context only — NO PII)      │                 │
│                 │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   5. Create HigherStudyReferral  │                 │
│                 │      audit row (status=created,  │                 │
│                 │      expiresAt=now+24h)          │                 │
│                 │                                  │                 │
│                 │   6. Sign HMAC referral token    │                 │
│                 │      (HIGHER_STUDY_REFERRAL_     │                 │
│                 │       SECRET)                    │                 │
│                 │                                  │                 │
│                 │   7. Build ALO Education URL     │                 │
│                 │      with referralCode,          │                 │
│                 │      referralToken, public slugs │                 │
│                 │      (NO PII)                    │                 │
│                 │ ──────────────────────────────►  │                 │
│                 │                                  │                 │
│                 │   8. Return { referralCode,      │                 │
│                 │      targetUrl, referralId }     │                 │
│                 │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   9. Browser redirects to        │                 │
│                 │      targetUrl on ALO Education  │                 │
│                 │      domain                      │                 │
│                 │                                  ──────────────────►
│                 │                                  │                 │
│                 │                                  │   ALO Education│
│                 │                                  │   domain       │
│                 │                                  │                 │
│                 │   10. ALO Education verifies     │                 │
│                 │       the HMAC token against     │                 │
│                 │       the shared secret          │                 │
│                 │                                  │                 │
│                 │   11. ALO Education collects     │                 │
│                 │       student PII (name, email,  │                 │
│                 │       phone) ON THEIR DOMAIN     │                 │
│                 │                                  │                 │
│                 │   12. ALO Education checks for   │                 │
│                 │       duplicate students         │                 │
│                 │                                  │                 │
│                 │   13. If new: creates student,   │                 │
│                 │       generates studentId,       │                 │
│                 │       sends OTP                  │                 │
│                 │                                  │                 │
│                 │   14. ALO Education calls back   │                 │
│                 │       to Alaminn.info:           │                 │
│                 │       POST /api/v1/higher-study/ │                 │
│                 │       referral/[code]/confirm    │                 │
│                 │       (HMAC-signed body)         │                 │
│                 │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   15. Alaminn.info verifies the  │                 │
│                 │       HMAC signature, updates    │                 │
│                 │       HigherStudyReferral row    │                 │
│                 │       (status=completed/failed)  │                 │
│                 │                                  │                 │
│                 │   16. Alaminn.info creates a CRM │                 │
│                 │       StudentReferral row,       │                 │
│                 │       assigns counsellor         │                 │
│                 │                                  │                 │
└─────────────────┘                                  └─────────────────┘
```

### Step-by-step narrative

1. **Visitor discovers** a course/university/scholarship on Alaminn.info (e.g. `/higher-study/courses/msc-computer-science-oxford`).
2. **Visitor clicks "Apply Now"** on the course detail page.
3. Alaminn.info shows a **transfer notice**: "You will be redirected to ALO Education to complete your application. Your details will be collected by ALO Education on their secure domain."
4. A **consent checkbox** is presented: "I consent to share my application context (university, course, study level) with ALO Education." — consent is REQUIRED (the API rejects requests with `consentGiven !== true`).
5. Visitor ticks the checkbox and clicks **Continue to ALO Education**.
6. Browser POSTs to `/api/v1/higher-study/referral` with the **public context** (slugs only — NO PII):
   ```json
   {
     "referralType": "course-application",
     "universitySlug": "university-of-oxford",
     "courseSlug": "msc-computer-science",
     "studyLevel": "masters",
     "intake": "fall-2026",
     "consentGiven": true,
     "consentVersion": "v1.0"
   }
   ```
7. The endpoint:
   - Validates the body (Zod).
   - Validates the context object via `validateReferralContext()` (PII guard — throws on forbidden keys).
   - Generates a 12-char `referralCode` (randomBytes, base36).
   - Signs a referral token with HMAC-SHA256 using `HIGHER_STUDY_REFERRAL_SECRET`.
   - Persists a `HigherStudyReferral` audit row with `status='created'` and `expiresAt = now + 24h`.
   - Builds the ALO Education target URL with safe query params only.
8. The endpoint returns `{ referralCode, targetUrl, referralId }` to the browser.
9. **Browser redirects** (`window.location.href = targetUrl`) to the ALO Education verified registration route.
10. **ALO Education verifies** the HMAC referral token against the shared secret (`HIGHER_STUDY_REFERRAL_SECRET`). If invalid → rejects; if valid → proceeds.
11. **ALO Education collects PII** (name, email, phone, address) on THEIR OWN domain — Alaminn.info never sees, stores, or transmits this PII.
12. ALO Education **checks for duplicates** (by email/phone). If the student already exists, no new record is created — the existing student is associated with the referral.
13. If new: ALO Education **creates the student record**, generates a unique `studentId`, and sends an **OTP** to the student's email for verification.
14. ALO Education **calls back** to Alaminn.info:
    ```
    POST https://alaminn.info/api/v1/higher-study/referral/<referralCode>/confirm
    Headers:
      X-Alaminn-Signature: <HMAC-SHA256 base64url signature of JSON body>
      Content-Type: application/json
    Body:
      {
        "aloStudentId": "stu_abc123",
        "status": "completed",
        "failureReason": null
      }
    ```
15. Alaminn.info verifies the HMAC signature (the token was originally signed by `signReferralToken()`; both sides share `HIGHER_STUDY_REFERRAL_SECRET`). On success, updates the `HigherStudyReferral` row to `status='completed'` (or `'failed'` if ALO reports failure).
16. Alaminn.info creates a CRM `StudentReferral` row in its own database (for CRM tracking, counsellor assignment, sales pipeline) and triggers the **counsellor assignment** workflow.

---

## The four environment variables

| Variable | Required | Description |
|---|---|---|
| `ALO_EDUCATION_API_URL` | Yes | Base URL of the ALO Education application platform API. Used by Alaminn.info when it needs to call ALO Education's API directly (rare; mostly the flow is browser-redirect). Example: `https://aloeducation.com/api/v1`. |
| `ALO_EDUCATION_API_KEY` | Yes | API key sent in the `Authorization: Bearer <key>` header when Alaminn.info calls ALO Education's API server-to-server. NEVER expose in browser JS. |
| `ALO_EDUCATION_SIGNING_SECRET` | Yes | Shared HMAC secret used to sign the JSON body of the server-to-server callback request FROM ALO Education TO Alaminn.info (Step 14 above). ALO Education signs the body; Alaminn.info verifies with the same secret. |
| `HIGHER_STUDY_REFERRAL_SECRET` | Yes | Shared HMAC secret used to sign the **referral token** that travels in the URL when the browser redirects from Alaminn.info to ALO Education (Steps 6–10). ALO Education verifies with the same secret. |

> `ALO_EDUCATION_SIGNING_SECRET` and `HIGHER_STUDY_REFERRAL_SECRET` are TWO DIFFERENT secrets for TWO DIFFERENT cryptographic flows. They MUST be different values (generate each with `openssl rand -hex 32`).

### Where to set them

All four live in `/home/aloeduca/alaminn.info/.env` (mode 600, outside `public_html`). NEVER commit them to git, NEVER paste them in Slack/email, NEVER put them in cPanel UI env vars (which are visible in some cPanel themes).

### Generating new secrets

```bash
# Generate two distinct secrets
openssl rand -hex 32  # for ALO_EDUCATION_SIGNING_SECRET
openssl rand -hex 32  # for HIGHER_STUDY_REFERRAL_SECRET
```

### Sharing secrets with ALO Education

The two HMAC secrets (`ALO_EDUCATION_SIGNING_SECRET` and `HIGHER_STUDY_REFERRAL_SECRET`) MUST be shared with ALO Education's ops team so they can verify the signatures. Share via a secure channel:

- 1Password shared vault
- Bitwarden Send (one-time view)
- GPG-encrypted email
- In-person / phone call (last resort)

NEVER share via plain email, Slack, or any unencrypted channel.

---

## The PII guard (25 forbidden keys)

`validateReferralContext()` in `src/lib/higher-study/integration.ts` enforces a strict allowlist of context fields. If ANY forbidden key appears in the context object, the function throws and the referral is NOT created.

### Allowed context keys (9 — all public slugs/labels)

| Key | Example | Purpose |
|---|---|---|
| `countrySlug` | `uk` | Country the student is interested in |
| `universitySlug` | `university-of-oxford` | University of interest |
| `courseSlug` | `msc-computer-science` | Course of interest |
| `scholarshipSlug` | `chevening-scholarship` | Scholarship of interest |
| `researchSlug` | `ai-safety-phd` | Research project of interest |
| `supervisorSlug` | `prof-jane-smith` | Supervisor of interest |
| `studyLevel` | `masters` | Level of study (foundation/bachelors/masters/phd/...) |
| `intake` | `fall-2026` | Application intake |
| `campaignCode` | `uk-2026-launch` | Marketing campaign attribution |

### Forbidden keys (25 — all PII or credentials)

```
email, phone, whatsapp,
name, fullName, firstName, lastName,
address, street, city, postcode, zip,
dob, dateOfBirth,
nationalId, passport, passportNumber,
gender,
salary, income,
password, token, sessionToken, accessToken, refreshToken,
ssn, nationalInsuranceNumber,
bankAccount, cardNumber, cvv
```

### Why these 25?

These keys cover every common PII field, financial field, and credential field. If any appears in the referral context (even by accident — e.g. a coding mistake passes `req.body` directly into the context), the function throws loudly and the referral is refused. This is the defense-in-depth that prevents PII from leaking into URLs (which would be logged on multiple servers and visible in browser history).

### How the validation works

```typescript
// src/lib/higher-study/integration.ts (excerpt)
const FORBIDDEN_KEYS = new Set([/* ...25 keys... */]);

export function validateReferralContext(ctx: ReferralContext): void {
  if (!ctx || typeof ctx !== "object") return;

  const keys = Object.keys(ctx);
  for (const key of keys) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(
        `Referral context contains forbidden PII field: "${key}". ` +
        `Refusing to attach to URL.`
      );
    }
    if (!ALLOWED_CONTEXT_KEYS.includes(key as keyof ReferralContext)) {
      throw new Error(
        `Referral context contains unknown field: "${key}". ` +
        `Only public context slugs are allowed.`
      );
    }
  }

  // Strings only — no nested objects that could smuggle extra data.
  for (const key of keys) {
    const v = (ctx as Record<string, unknown>)[key];
    if (v !== undefined && v !== null && typeof v !== "string") {
      throw new Error(
        `Referral context field "${key}" must be a string, got ${typeof v}.`
      );
    }
  }
}
```

The validation runs:
- Before building the ALO Education URL (defensive — even if the caller says the context is safe)
- Before persisting the `HigherStudyReferral` DB row
- On every call to `createReferralRecord()`

---

## The 24-hour TTL

Each referral has an `expiresAt` field set to `now + 24 hours` (86,400,000 ms). This is enforced in multiple places:

1. **At creation**: `expiresAt = new Date(now.getTime() + REFERRAL_TOKEN_TTL_MS)` where `REFERRAL_TOKEN_TTL_MS = 86400000`.
2. **At ALO Education callback**: the `isReferralExpired()` function returns `true` if `expiresAt` is in the past OR the referral has reached a terminal status (`completed`, `failed`, `expired`).
3. **At the background sweeper**: `expireStaleReferrals()` runs via the `/api/cron/referral-retry` cron every 15 minutes. It marks referrals with `status IN ('created', 'transferred')` AND `expiresAt < now` as `status='expired'`.

### Why 24 hours?

- Long enough for a student to complete the ALO Education registration (which involves OTP verification and form-filling).
- Short enough that a leaked referral token becomes useless within a day.
- Aligns with industry standard for signed URL tokens (e.g. password-reset links).

### What happens when a referral expires?

- The referral row's status becomes `expired`.
- Any subsequent callback from ALO Education with that `referralCode` is rejected.
- The student must start a new referral from Alaminn.info (which generates a new `referralCode` + token).

---

## The referral record (`HigherStudyReferral` model)

The audit row stored in Alaminn.info's database:

| Field | Type | Purpose |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `referralCode` | String (unique) | 12-char random code (the link between Alaminn.info row and ALO Education session) |
| `source` | String | `ALAMINN_HIGHER_STUDY` (or other source label) |
| `referralType` | String | `course-application` / `university-application` / `scholarship-application` / `phd-application` / `research-application` / `supervisor-enquiry` / `eligibility-check` / `consultation` / `resource-referral` / `deadline-alert` / `english-referral` |
| `targetUrl` | String | The full ALO Education URL the browser was redirected to |
| `countrySlug` | String? | Public context (nullable) |
| `universitySlug` | String? | Public context (nullable) |
| `courseSlug` | String? | Public context (nullable) |
| `scholarshipSlug` | String? | Public context (nullable) |
| `researchSlug` | String? | Public context (nullable) |
| `supervisorSlug` | String? | Public context (nullable) |
| `studyLevel` | String? | Public context (nullable) |
| `intake` | String? | Public context (nullable) |
| `campaignCode` | String? | Marketing attribution |
| `consentGiven` | Boolean | Whether the visitor gave explicit consent |
| `consentVersion` | String? | Version of the consent text (e.g. `v1.0`) |
| `consentTimestamp` | DateTime? | When consent was given |
| `status` | String | `created` / `transferred` / `completed` / `failed` / `expired` |
| `transferredAt` | DateTime? | When the browser redirected to ALO Education |
| `completedAt` | DateTime? | When ALO Education called back with `status=completed` |
| `failureReason` | String? | If `status=failed`, the reason (truncated to 500 chars) |
| `expiresAt` | DateTime? | TTL deadline (now + 24h) |
| `ipHash` | String? | sha256 hash of the visitor's IP (truncated to 16 hex chars — never raw IP) |
| `deviceCategory` | String? | `mobile` / `tablet` / `desktop` |
| `createdAt` | DateTime | When the referral was created |

---

## Status transitions

```
                      ┌─────────────────────────────┐
                      │                             │
   POST /referral     │     created                 │
   ─────────────►     │     (expiresAt = +24h)      │
                      │                             │
                      └──────────┬──────────────────┘
                                 │
                                 │ browser redirects to ALO
                                 │ (markReferralTransferred)
                                 ▼
                      ┌─────────────────────────────┐
                      │     transferred             │
                      │                             │
                      └─────┬──────────────┬────────┘
                            │              │
              ALO callback  │              │ 24h passes
              (status=      │              │ (cron sweeper)
               completed)   │              │
                            ▼              ▼
                      ┌──────────┐   ┌──────────┐
                      │completed │   │ expired  │
                      └──────────┘   └──────────┘

              ALO callback
              (status=failed)
                            │
                            ▼
                      ┌──────────┐
                      │ failed   │
                      └──────────┘
```

### Functions that drive transitions

| Function | Effect |
|---|---|
| `createReferralRecord(opts)` | Creates row with `status='created'`, `expiresAt=now+24h` |
| `markReferralTransferred(referralCode)` | Sets `status='transferred'`, `transferredAt=now` |
| `markReferralCompleted(referralCode)` | Sets `status='completed'`, `completedAt=now` |
| `markReferralFailed(referralCode, reason)` | Sets `status='failed'`, `failureReason=reason.slice(0,500)` |
| `expireStaleReferrals()` | Bulk update: rows with `status IN ('created','transferred')` AND `expiresAt < now` → `status='expired'` |
| `isReferralExpired(referral)` | Boolean check (used by ALO callback endpoint to reject expired referrals) |
| `findReferralByCode(referralCode)` | Lookup by referralCode (used by ALO callback endpoint) |

---

## Source code reference

| File | Purpose |
|---|---|
| `src/lib/higher-study/integration.ts` | The full integration module (referral URL builder, PII guard, persistence, status transitions, expiry check, lookup) |
| `src/lib/higher-study/api-helpers.ts` | `generateReferralCode()`, `signReferralToken()`, `verifyReferralToken()`, `hashIp()`, `getDeviceCategory()` |
| `src/lib/higher-study/constants.ts` | `ALO_EDUCATION_REGISTER_URL`, `REFERRAL_TOKEN_TTL_MS`, `REFERRAL_SOURCE_MAP` |
| `src/lib/higher-study/types.ts` | TypeScript types: `Referral`, `ReferralContext`, `ReferralType`, `CreateReferralOptions` |
| `src/app/api/v1/higher-study/referral/route.ts` | The public POST endpoint that creates a referral |
| `src/app/api/v1/higher-study/referral/[code]/confirm/route.ts` | The server-to-server callback endpoint (HMAC-signed) |
| `prisma/schema.prisma` | The `HigherStudyReferral` model definition |

---

## Security properties

1. **No PII in URLs**: enforced by `validateReferralContext()` throwing on 25 forbidden keys.
2. **No PII stored by Alaminn.info before the callback**: the `HigherStudyReferral` row contains only public slugs, IP hash, device category, and consent metadata.
3. **Signed referral token**: HMAC-SHA256 with `HIGHER_STUDY_REFERRAL_SECRET`; both Alaminn.info and ALO Education verify with the shared secret.
4. **Signed callback body**: ALO Education signs the JSON body of the confirm callback with `ALO_EDUCATION_SIGNING_SECRET`; Alaminn.info verifies with `timingSafeEqual`.
5. **24-hour TTL**: expired referrals can't be used to create a CRM row.
6. **Constant-time comparisons**: `verifyReferralToken()` and `verifyCronAuth()` use `crypto.timingSafeEqual` to prevent timing attacks.
7. **Audit trail**: every referral transition is recorded in the `HigherStudyReferral` table with timestamps and IP hash.
8. **Server-to-server only callbacks**: the `/confirm` endpoint is unauthenticated (no session cookie) — but the HMAC signature is the only auth. A request without a valid signature is rejected.

---

## What is NEVER exposed

In this repository:

- ALO Education's source code (it's a separate codebase owned by ALO Education).
- ALO Education's API contract beyond what's documented here.
- ALO Education's database schema.
- ALO Education's internal business logic.
- The actual production values of `ALO_EDUCATION_API_KEY`, `ALO_EDUCATION_SIGNING_SECRET`, `HIGHER_STUDY_REFERRAL_SECRET` (these are placeholders in `deploy/cpanel/.env.production` and real values in `/home/aloeduca/alaminn.info/.env` only).
- Any student PII (it lives ONLY on ALO Education's domain).

---

## Reference

- **Integration module**: `src/lib/higher-study/integration.ts`
- **API helper**: `src/lib/higher-study/api-helpers.ts`
- **Constants**: `src/lib/higher-study/constants.ts`
- **Types**: `src/lib/higher-study/types.ts`
- **Create endpoint**: `src/app/api/v1/higher-study/referral/route.ts` (POST, public)
- **Confirm endpoint**: `src/app/api/v1/higher-study/referral/[code]/confirm/route.ts` (POST, HMAC-signed)
- **DB model**: `HigherStudyReferral` (Prisma)
- **TTL**: 24 hours (86,400,000 ms)
- **PII guard**: 25 forbidden keys (see list above)
- **Allowed context keys**: 9 (countrySlug, universitySlug, courseSlug, scholarshipSlug, researchSlug, supervisorSlug, studyLevel, intake, campaignCode)
- **Env vars**: `ALO_EDUCATION_API_URL`, `ALO_EDUCATION_API_KEY`, `ALO_EDUCATION_SIGNING_SECRET`, `HIGHER_STUDY_REFERRAL_SECRET`
- **Secret generator**: `openssl rand -hex 32`
- **Status values**: `created` → `transferred` → `completed` / `failed` / `expired`
- **Sweeper cron**: `/api/cron/referral-retry` (every 15 minutes)
