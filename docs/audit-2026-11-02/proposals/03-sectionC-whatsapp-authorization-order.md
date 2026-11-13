# Section C — WhatsApp number configuration: authorization before validation

Status: **PROPOSED.** Patch `patches/3001-whatsapp-authz-before-validation.patch`.
Regression tests: `tests/whatsapp-numbers-authorization-order.test.ts` (6 tests).

## The defect

`src/app/api/whatsapp/numbers/route.ts`, POST, before the patch:

```
canAssign(auth)                       403 if the caller may not assign
toBdDisplayPhone(body.phoneNumber)    → 400 if the number is malformed
OFFICIAL_NUMBERS.includes(phone)      → 400 if it is not configured for this deployment
sensitive-field probe (metaPhoneNumberId / metaBusinessAccountId)
isSuperAdmin(auth)                    → 403
```

A caller holding `whatsapp.numbers.assign` but **not** the Super Admin role therefore
gets `400` for a malformed payload and `403` for a well-formed one. That difference is an
oracle over two things it should not learn:

1. **the validator** — which inputs are structurally acceptable;
2. **the deployment configuration** — `OFFICIAL_NUMBERS` is env-derived, so a `400` vs
   `403` distinction tells an unauthorised caller which numbers this deployment has
   configured as official senders.

## The fix

Move the Super-Admin decision above the phone validation. Nothing else changes:

```
canAssign(auth)                       403   (unchanged, still first)
sensitive-field probe (keys only)
  + isSuperAdmin(auth)                403   (moved up)
toBdDisplayPhone / OFFICIAL_NUMBERS   400   (moved down)
string-field validation, lookup, transaction
```

The probe reads `Object.prototype.hasOwnProperty` on two key names — it inspects the
body's shape, not its values, and reveals nothing that `GET /api/whatsapp/numbers/[id]`
does not already show to an authorised viewer.

`RBAC` is not weakened anywhere: `canAssign` still runs first, `isSuperAdmin` is still
required for the sensitive surface, and the `seed_official_pool` branch is untouched
(it already gates Super Admin at line 84, before any other work, and returns early).

## Regression tests (all four requested cases, plus two guards)

`tests/whatsapp-numbers-authorization-order.test.ts` — six tests, real route handler with
the module's existing mocking idiom:

| Case | Caller | Payload | Expected |
|---|---|---|---|
| unauthorised + valid | `ADMIN` + `whatsapp.numbers.assign` | configured number + `metaPhoneNumberId` | **403**, no DB read, no transaction |
| unauthorised + invalid | same | `not-a-phone` + `metaPhoneNumberId` | **403** (not 400), no DB read |
| authorised + invalid | Super Admin | `not-a-phone` | **400** |
| authorised + unconfigured | Super Admin | `01712345678` (valid shape, not configured) | **400** |
| authorised + valid | Super Admin | configured number + Meta id | **200**, one update, one audit row |
| unauthorised seed | `ADMIN` + assign | `action: 'seed_official_pool'` | **403**, no `createMany` |

Evidence of the oracle, captured before and after the patch:

```
before:  × denies an unauthorized caller with a malformed payload with the same 403, not a 400
           AssertionError: expected 400 to be 403
after :  6 passed (6)
```

Deployment configuration for the test is declared in `vi.hoisted` (see section D) because
the sender registry reads operator numbers from the environment and ships blank.

## Related defect found while testing this route

`src/lib/whatsapp-number-pool.ts` `toBdDisplayPhone()` sliced the country code with
`slice(2)` instead of `slice(3)`, turning `8801805020100` into `001805020100`. Every
configured sender number was corrupted, so routing, seeding and the official-number check
would all fail in a deployment that *did* configure numbers. See section D, code fix
`3002`. It is proposed separately because it is independent of the authorization order.

## Not in scope

* No change to who may assign numbers, to `canAssign`, or to the Super-Admin role definition.
* No new error text: the existing 400/403 messages are reused verbatim.
