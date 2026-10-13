# ENGLISH_PLATFORM_INTEGRATION.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info ↔ English Learning Platform Referral Integration |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Document how the English Learning platform on Alaminn.info hands off warm student leads (course packages, tutor bookings, mock-test bundles) to the English Learning destination platform via the same HMAC-signed referral pattern used by the Higher Study integration. |

---

## Architectural roles

| Platform | Role | Domain |
|---|---|---|
| **Alaminn.info /english-learning** | Discovery platform — surfaces English courses, lessons, practice tests, tutors, resources. Helps students shortlist and try practice tests. Does NOT process enrollment or payment. | https://alaminn.info/english-learning |
| **English Learning destination platform** | Application/enrollment platform — collects student PII, processes payment, schedules tutor sessions, issues certificates, tracks progress. | (Configured via `ENGLISH_PLATFORM_URL` env var) |

> This integration mirrors the Higher Study ↔ ALO Education integration in `ALO_EDUCATION_INTEGRATION.md`. The pattern is identical; only the destination URL, secret, and context slugs differ.

---

## The referral flow (end-to-end)

```
┌─────────────────┐                                  ┌─────────────────┐
│                 │   1. Visitor clicks "Apply"      │                 │
│   Alaminn.info  │      or "Book Tutor" or          │   Visitor       │
│   /english-     │      "Get Mock Tests"            │   (browser)     │
│   learning      │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   2. Show transfer notice +      │                 │
│                 │      consent checkbox            │                 │
│                 │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   3. Visitor consents, clicks    │                 │
│                 │      "Continue"                  │                 │
│                 │ ──────────────────────────────►  │                 │
│                 │                                  │                 │
│                 │   4. POST /api/v1/english-       │                 │
│                 │      learning/referral (PUBLIC   │                 │
│                 │      context only — NO PII)      │                 │
│                 │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   5. Create EnglishLearning-     │                 │
│                 │      Referral audit row          │                 │
│                 │      (status=created)            │                 │
│                 │                                  │                 │
│                 │   6. Sign HMAC referral token    │                 │
│                 │      (ENGLISH_LEARNING_          │                 │
│                 │       REFERRAL_SECRET)           │                 │
│                 │                                  │                 │
│                 │   7. Build English platform URL  │                 │
│                 │      with referralCode,          │                 │
│                 │      referralToken, course/tutor │                 │
│                 │      slugs (NO PII)              │                 │
│                 │ ──────────────────────────────►  │                 │
│                 │                                  │                 │
│                 │   8. Return { referralCode,      │                 │
│                 │      targetUrl, referralId }     │                 │
│                 │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   9. Browser redirects to        │                 │
│                 │      targetUrl on English        │                 │
│                 │      Learning platform           │                 │
│                 │                                  ──────────────────►
│                 │                                  │                 │
│                 │                                  │   English       │
│                 │                                  │   platform      │
│                 │                                  │                 │
│                 │   10. English platform verifies  │                 │
│                 │       the HMAC token against     │                 │
│                 │       the shared secret          │                 │
│                 │                                  │                 │
│                 │   11. English platform collects  │                 │
│                 │       student PII (name, email,  │                 │
│                 │       phone, payment) ON THEIR   │                 │
│                 │       DOMAIN                     │                 │
│                 │                                  │                 │
│                 │   12. English platform creates   │                 │
│                 │       enrollment, processes      │                 │
│                 │       payment, schedules tutor   │                 │
│                 │                                  │                 │
│                 │   13. English platform calls     │                 │
│                 │       back to Alaminn.info with  │                 │
│                 │       status (completed/failed)  │                 │
│                 │ ◄──────────────────────────────  │                 │
│                 │                                  │                 │
│                 │   14. Alaminn.info updates the   │                 │
│                 │       EnglishLearningReferral    │                 │
│                 │       row                        │                 │
│                 │                                  │                 │
└─────────────────┘                                  └─────────────────┘
```

### Step-by-step narrative

1. **Visitor discovers** an English course/tutor/practice test on Alaminn.info (e.g. `/english-learning/courses/ielts-preparation`).
2. **Visitor clicks "Apply"** (for a course package), **"Book Tutor"** (for a tutor), or **"Get Mock Tests"** (for a mock-test bundle).
3. Alaminn.info shows a **transfer notice**: "You will be redirected to our English Learning partner to complete your enrollment. Your details will be collected on their secure domain."
4. A **consent checkbox** is presented: "I consent to share my course/tutor interest with the English Learning platform." — consent is REQUIRED.
5. Visitor ticks the checkbox and clicks **Continue**.
6. Browser POSTs to `/api/v1/english-learning/referral` with the **public context** (slugs only — NO PII):
   ```json
   {
     "referralType": "course-package",
     "courseSlug": "ielts-preparation",
     "level": "intermediate",
     "consentGiven": true,
     "consentVersion": "v1.0"
   }
   ```
7. The endpoint:
   - Validates the body (Zod).
   - Validates the context via `validateReferralContext()` (PII guard — throws on forbidden keys).
   - Generates a 12-char `referralCode`.
   - Signs a referral token with HMAC-SHA256 using `ENGLISH_LEARNING_REFERRAL_SECRET`.
   - Persists an `EnglishLearningReferral` audit row with `status='created'`.
   - Builds the English platform target URL with safe query params only.
8. Returns `{ referralCode, targetUrl, referralId }` to the browser.
9. **Browser redirects** to the English Learning platform.
10. The English platform **verifies the HMAC token** against the shared secret. If invalid → rejects.
11. The English platform **collects PII** (name, email, phone, payment) on its own domain.
12. The English platform **creates the enrollment**, processes payment, and (if applicable) schedules the tutor session.
13. The English platform **calls back** to Alaminn.info with the outcome (success/failure).
14. Alaminn.info updates the `EnglishLearningReferral` row to `status='completed'` or `status='failed'`.

---

## The two environment variables

| Variable | Required | Description |
|---|---|---|
| `ENGLISH_PLATFORM_URL` | Yes | Base URL of the English Learning destination platform. Used to build the referral redirect URL. Example: `https://english.alaminn.info` or `https://aloeducation.com/english`. |
| `ENGLISH_LEARNING_REFERRAL_SECRET` | Yes | Shared HMAC secret used to sign the referral token. The English platform verifies with the same secret. Generate with `openssl rand -hex 32`. |

### Where to set them

In `/home/aloeduca/alaminn.info/.env` (mode 600, outside `public_html`):

```bash
ENGLISH_PLATFORM_URL=https://english.alaminn.info
ENGLISH_LEARNING_REFERRAL_SECRET=<REPLACE_WITH_openssl_rand_hex_32>
```

> **Distinct from Higher Study secrets**: `ENGLISH_LEARNING_REFERRAL_SECRET` MUST be a different value from `HIGHER_STUDY_REFERRAL_SECRET`. They protect two separate flows and two separate destinations. If one is compromised, the other must remain secure.

### Generating new secrets

```bash
openssl rand -hex 32
```

---

## The PII guard (25 forbidden keys — same as Higher Study)

`validateReferralContext()` in `src/lib/english-learning/integration.ts` enforces a strict allowlist of context fields. If ANY forbidden key appears, the function throws.

### Allowed context keys (5 — all public slugs/labels)

| Key | Example | Purpose |
|---|---|---|
| `courseSlug` | `ielts-preparation` | Course of interest |
| `tutorSlug` | `jane-smith-tutor` | Tutor of interest |
| `testSlug` | `ielts-reading-practice-1` | Practice test of interest |
| `level` | `intermediate` | Student's English level |
| `campaignCode` | `ielts-2026-launch` | Marketing campaign attribution |

### Forbidden keys (25)

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

> The forbidden-keys list is identical to the Higher Study integration's list (because PII is PII regardless of the destination). The allowed-keys list differs because the English context is narrower (no university/scholarship concepts).

---

## Referral types

The English Learning integration supports 3 referral types (compared to Higher Study's 11):

| `referralType` | Trigger | Destination action |
|---|---|---|
| `course-package` | Visitor clicks "Apply" on `/english-learning/courses/[slug]` | English platform enrolls the student in the course package |
| `tutor-booking` | Visitor clicks "Book Tutor" on `/english-learning/tutors/[slug]` or `/english-learning/book-tutor` | English platform schedules a tutor session |
| `mock-test-bundle` | Visitor clicks "Get Mock Tests" on `/english-learning/practice-tests` | English platform grants access to the mock-test bundle |

---

## The referral record (`EnglishLearningReferral` model)

| Field | Type | Purpose |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `referralCode` | String (unique) | 12-char random code |
| `referralType` | String | `course-package` / `tutor-booking` / `mock-test-bundle` |
| `sourceEntityId` | String? | The ID of the originating course/tutor/test on Alaminn.info |
| `sourceEntityType` | String? | `course` / `tutor` / `practice-test` |
| `targetUrl` | String | The full English platform URL |
| `status` | String | `created` / `transferred` / `completed` / `failed` / `expired` |
| `createdAt` | DateTime | When the referral was created |
| `completedAt` | DateTime? | When the English platform reported completion |
| `ipHash` | String? | sha256 hash of the visitor's IP (truncated) |
| `userAgent` | String? | Visitor's browser user agent |
| `notes` | Json? | Free-form metadata (no PII) |

> Compared to `HigherStudyReferral`, the English model is slightly simpler (no `consentGiven` field, no `expiresAt` TTL — referrals don't expire on the English side because tutor bookings can be initiated then completed days later). The `notes` field is `Json` (vs. the Higher Study's discrete slug columns) for forward flexibility.

---

## Status transitions

```
   POST /referral
   ─────────────►  created
                        │
                        │ browser redirects
                        │ (status=transferred, implicit)
                        ▼
                   transferred
                        │
                        │ English platform callback
                        │ (status=completed)
                        ▼
                   completed

   (Or: English platform callback with status=failed → failed)
   (Or: sweeper cron marks long-stale rows as expired)
```

---

## Source code reference

| File | Purpose |
|---|---|
| `src/lib/english-learning/integration.ts` | The full integration module (referral URL builder, PII guard, persistence, status transitions) |
| `src/lib/english-learning/api-helpers.ts` | `generateReferralCode()`, `signReferralToken()`, `verifyReferralToken()`, `hashIp()`, `getDeviceCategory()` |
| `src/lib/english-learning/constants.ts` | `ALO_EDUCATION_ENGLISH_REFERRAL_URL`, `REFERRAL_TOKEN_TTL_MS`, `REFERRAL_SOURCES` |
| `src/lib/english-learning/types.ts` | TypeScript types: `Referral`, `ReferralContext`, `ReferralType`, `CreateReferralOptions` |
| `src/app/api/v1/english-learning/referral/route.ts` | The public POST endpoint that creates a referral |
| `prisma/schema.prisma` | The `EnglishLearningReferral` model definition |

---

## Security properties

The same security properties as the Higher Study integration:

1. **No PII in URLs**: enforced by `validateReferralContext()` (25 forbidden keys).
2. **No PII stored by Alaminn.info before the callback**: the `EnglishLearningReferral` row contains only public slugs, IP hash, user agent, and free-form `notes` (Json).
3. **Signed referral token**: HMAC-SHA256 with `ENGLISH_LEARNING_REFERRAL_SECRET`.
4. **Constant-time comparisons**: `verifyReferralToken()` uses `crypto.timingSafeEqual`.
5. **Audit trail**: every referral transition is recorded with timestamps.
6. **Distinct secret**: `ENGLISH_LEARNING_REFERRAL_SECRET` is independent from `HIGHER_STUDY_REFERRAL_SECRET` — compromising one does NOT compromise the other.

---

## What is NEVER exposed

- The English Learning platform's source code (it's a separate codebase).
- The actual production value of `ENGLISH_LEARNING_REFERRAL_SECRET` (placeholder in `.env.production`, real value in `/home/aloeduca/alaminn.info/.env` only).
- Any student PII (it lives ONLY on the English Learning platform's domain).
- The English platform's internal API contract beyond what's documented here.

---

## Differences from the Higher Study integration

| Aspect | Higher Study ↔ ALO Education | English Learning ↔ English platform |
|---|---|---|
| **Secret env var** | `HIGHER_STUDY_REFERRAL_SECRET` | `ENGLISH_LEARNING_REFERRAL_SECRET` |
| **Destination URL env var** | Hardcoded in `ALO_EDUCATION_REGISTER_URL` constant | `ENGLISH_PLATFORM_URL` env var (configurable) |
| **Allowed context keys** | 9 (countrySlug, universitySlug, courseSlug, scholarshipSlug, researchSlug, supervisorSlug, studyLevel, intake, campaignCode) | 5 (courseSlug, tutorSlug, testSlug, level, campaignCode) |
| **Referral types** | 11 (course-application, university-application, scholarship-application, phd-application, research-application, supervisor-enquiry, eligibility-check, consultation, resource-referral, deadline-alert, english-referral) | 3 (course-package, tutor-booking, mock-test-bundle) |
| **TTL** | 24 hours (enforced via `expiresAt` + sweeper cron) | No TTL (referrals don't expire — tutor bookings can be initiated then completed days later) |
| **DB model** | `HigherStudyReferral` (discrete slug columns) | `EnglishLearningReferral` (Json `notes` field for flexibility) |
| **Consent tracking** | Explicit `consentGiven` + `consentVersion` + `consentTimestamp` fields | Implicit (consent required by API but not stored as discrete fields) |
| **Source code** | `src/lib/higher-study/integration.ts` | `src/lib/english-learning/integration.ts` |
| **API endpoint** | `POST /api/v1/higher-study/referral` | `POST /api/v1/english-learning/referral` |

---

## Reference

- **Integration module**: `src/lib/english-learning/integration.ts`
- **API helper**: `src/lib/english-learning/api-helpers.ts`
- **Constants**: `src/lib/english-learning/constants.ts`
- **Types**: `src/lib/english-learning/types.ts`
- **Create endpoint**: `src/app/api/v1/english-learning/referral/route.ts` (POST, public)
- **DB model**: `EnglishLearningReferral` (Prisma)
- **Env vars**: `ENGLISH_PLATFORM_URL`, `ENGLISH_LEARNING_REFERRAL_SECRET`
- **Secret generator**: `openssl rand -hex 32`
- **PII guard**: 25 forbidden keys (same list as Higher Study)
- **Allowed context keys**: 5 (courseSlug, tutorSlug, testSlug, level, campaignCode)
- **Referral types**: 3 (course-package, tutor-booking, mock-test-bundle)
- **Status values**: `created` → `transferred` → `completed` / `failed` / `expired`
- **TTL**: none (no expiry enforcement)
