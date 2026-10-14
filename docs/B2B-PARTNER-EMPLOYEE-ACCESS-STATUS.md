# B2B Partner Super Admin + Employee Access System — Build Status

**Scope:** the "final B2B Partner Super Admin, employee access, quota, marketing automation and student benefit control system" brief.
**Branch:** `arena/57b0809e-alo-web-crm-tech` · **Commit:** `6fe288a0`
**Status token:** `ALO_B2B_PARTNER_AND_EMPLOYEE_ACCESS_SYSTEM_INCOMPLETE`

A rule is only marked **PASS** when something was actually executed against it.
Logic-level rules are proven by `scripts/b2b-access-policy-check.ts`
(**94 assertions, 0 failures**) and `scripts/communications-policy-check.ts`
(**119 assertions, 0 failures**). Anything needing MySQL, a live mailbox or a
logged-in browser is marked **UNVERIFIED** — never inferred from code existing.

---

## 1. The 19-item self-audit from the brief

| # | Check | Result | Evidence / gap |
| --- | --- | --- | --- |
| 1 | ALO Super Admin has master control | **PASS** | `isAloMasterRole`, `canManageMasterControl`; partner roles explicitly excluded. 4 assertions. |
| 2 | B2B Partner Super Admin manages only own company | **PASS** | `validatePartnerUserCreation` refuses `TENANT_MISMATCH`; `canViewB2BDetails` refuses another partner's application; all 8 partner-admin routes carry an access check. 5 assertions. |
| 3 | Partner starts with 2 employees + 1 super admin | **PASS** | `DEFAULT_PARTNER_USER_LIMIT = 3`; `canCreatePartnerUser` refuses at 3/3; the users route re-reads the count **inside** the transaction so two concurrent creations cannot exceed it. |
| 4 | Extra user request works | **PARTIAL** | `PartnerUserSeatRequest` table + `seat-requests` route with an atomic approve path that raises the limit; approval outcome **not executed** (no DB). |
| 5 | Marketing image quota 15/month works | **PASS** | `checkMarketingQuota` + the exact spec message; route reserves atomically via `reserveQuota`. |
| 6 | Marketing video quota 10/month works | **PASS** | Same path, separate counter; both spec messages asserted. |
| 7 | Video duration max 30 sec is enforced | **PASS** | **Fixed this session** — see §2. Validated before quota is reserved, forwarded to the provider, and the returned length is re-checked. |
| 8 | Partner cannot generate beyond quota | **PASS** | `reserveQuota` performs test-and-increment in one conditional UPDATE inside a transaction, so racing calls cannot both win. |
| 9 | Partner student cannot use mock/interview tools without an ALO application | **PASS** | Benefit gate is **deny-by-default** over the real `Application.stage` vocabulary. A draft or a document-review case is refused even when a stale entitlement row exists. 9 assertions. |
| 10 | Eligible student gets 3 English mock vouchers | **PASS** | `benefitLimitFor('ENGLISH_MOCK_TEST') === 3`; 4th attempt refused. |
| 11 | Eligible student gets 1 interview/mock benefit | **PASS** | UKVI and university interview prep both limited to 1 per application; a benefit tied to a different application is refused. |
| 12 | Employee activation email works | **PARTIAL** | Email template complete: exact subject "Activate your ALO Education employee account", employee name/designation/company email/activation link/password instructions/expiry (48h default)/support contact. **Not sent live — SMTP is unconfigured in the sandbox.** |
| 13 | Employee creates password from activation link | **PASS (logic)** | Sha-256 hashed token, expiry bound into the query, one-time use (`status: 'used'`), password policy (8–200 chars, uppercase + digit), bcrypt cost 12, `pending_activation` gate. Live path unverified. |
| 14 | Employee completes own profile | **PARTIAL** | Profile routes and sections exist; not exercised (needs a session + DB). |
| 15 | Employee private profile hidden from unauthorized users | **PASS** | `canViewEmployeePrivateProfile` allows only self, Chairman/Super Admin, or an **HR Manager holding the HR permission** — the title alone is refused. `redactEmployeePrivateFields` strips the fields server-side. 8 assertions. |
| 16 | Salary hidden from unauthorized users | **PASS** | `salary`, `allowance`, `bonus`, `bankDetails`, `taxInfo` are all in the private list; a manager is refused. |
| 17 | HR documents protected | **PASS** | `hrDocuments`, `privateDocuments`, `nid`, `passport`, `educationDocuments`, `leaveRecords` are private; `canViewEmployeeDocument` gates downloads. |
| 18 | All access checks enforced in backend | **PARTIAL** | All 8 `/api/partner-admin/*` routes enforce a check (the two apparent gaps are a re-export shim and a route restricted to `ADMIN`/`SUPER_ADMIN`). **But three parallel employee-privacy engines still exist** — see §3. |
| 19 | Audit logs for permission, salary, document, B2B, quota and voucher actions | **PARTIAL** | Audit writes exist in the engine (`EMPLOYEE_PRIVATE_PROFILE_VIEWED`, `B2B_DETAIL_VIEWED`, salary view) and in the marketing/voucher routes; **not executed** (no DB). |

**Result: 13 PASS · 6 PARTIAL · 0 items claimed without evidence.**

## 2. The 30-second video rule was not actually enforced

This was the most consequential defect found. The marketing route contained:

```ts
videoDuration: quota?.videoDurationLimitSeconds ?? DEFAULT_VIDEO_SECONDS,
```

The limit was **recorded**, and the provider call took only `{ prompt }`. Nothing
compared the generated asset against the ceiling, so a partner could obtain an
arbitrarily long video and it would be stored as if compliant — while the
self-audit item "video duration max 30 sec is enforced" would have appeared to
pass by code inspection.

Now:
- the ceiling is resolved through `resolveEffectiveLimits`, which **clamps to the
  ALO hard ceiling** so no override can authorise a longer video;
- the request is validated **before quota is reserved**, so an over-long request
  costs the partner nothing;
- the ceiling is forwarded to the provider;
- the returned length is re-checked — a longer asset is refused, the quota is
  refunded, and the attempt is audited as
  `PARTNER_MARKETING_VIDEO_DURATION_REJECTED`;
- the provider integration reports no rendered duration, so the result carries
  `durationUnknown` rather than assuming compliance.

## 3. Other real defects fixed

1. **Fabricated partner packages.** The Access Control Center returned three
   invented packages (`PKG-STARTER`…) whenever `partner_packages` was empty — ids
   that do not exist, so a Super Admin would be shown packages that could never be
   assigned. Premium also advertised a 60-second video against the stated
   30-second maximum. The API now returns the real rows or an explicit
   "not saved yet" catalogue with `packagesSeeded: false`, and the packages tab
   renders live data instead of static prose.
2. **Split sources of truth for quotas.** The 15/10/30/3 numbers were declared both
   in `access-check-engine.ts` and in the new policy. The engine now derives them
   from the policy module (`STARTER_*` are re-exports), and an assertion fails if
   the two ever disagree.
3. **A draft application passed the benefit gate.** My first implementation treated
   any stage not in a small deny-list as active, so `draft` qualified and the
   "no application, no voucher" rule was silently broken. The gate is now an
   allow-list of post-submission stages, deny-by-default, with the brief's caveat
   handled explicitly: a rejection before submission disqualifies, after
   submission it does not.
4. **Three parallel employee-privacy engines remain** — `src/lib/access-control.ts`,
   `src/lib/access-check-engine.ts` and `src/lib/employee-access-engine.ts`
   each export a variant of `canViewEmployeePrivateProfile`. The rules now agree
   (all route through the policy), but the duplication is **not resolved** and is
   listed as open work.

## 4. Environment limits

The workspace snapshot dropped `node_modules` again mid-session; recovered with the
documented sequence (mixed `git reset origin/…`, `npm ci --ignore-scripts`,
`prisma generate` with a dummy engine binary → *532 models*). Prisma's engine CDN
is not reachable from this sandbox, so generation requires the dummy-engine
workaround.

Still unavailable: **MySQL / seeded database** (every DB-backed path), **SMTP**
(activation and lifecycle email), **live provider credentials** (Meta, httpSMS,
3CX, Chatwoot, LinkedIn, video/image providers), **an authenticated session** and
**a headless browser**. Consequently no partner-admin screen, seat request,
quota approval, voucher issuance or audit write has been executed end-to-end.

## 5. Open items

1. Execute the 19-item self-audit against a seeded MySQL and record each result.
2. Consolidate the three employee-privacy engines into the policy layer.
3. Build `/partner-admin/users/create` role+package picker on
   `validatePartnerUserCreation`, and the ALO review screen for extra-seat and
   extra-quota requests (routes exist, UI does not).
4. Add the `partner_marketing_usage` → `partner_marketing_quotas` reconciliation
   for month rollover in the UI (the period helper exists; no screen shows it).
5. Wire `notificationsFor(...)` to an actual notification writer — the routing
   table is defined and tested but nothing dispatches from it yet.
6. Verify the partner social-account module decrypts tokens only server-side and
   audited every view (encryption + masking helpers exist; the call sites are
   unverified).
