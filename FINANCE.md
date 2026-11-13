# ALO EDUCATION — FINANCE

Spec s26, s36, s48, s49, s70, s71, s90, s116.

---

## 1. Scope

Operational finance: student payments, service fees, refunds, partner and university commission,
expenses, invoices, receipts, outstanding balances, revenue and profit — plus a genuine double-entry
accounting ledger.

**API surface:** `finance-dashboard` UI, `crm-invoices`, the `admin` finance routes, and the accounting
route family (canonical example: `src/app/api/accounting/journal-entries/route.ts`).

> **s49 caveat, stated plainly:** this is operational finance for an education consultancy. It does
> **not** replace regulated accounting software unless it is actually configured and reconciled to do
> so. Export and integration capability is provided; no claim of statutory compliance is made.

---

## 2. Money representation — an important inconsistency

The schema is **not** uniform about money, and code must know which convention applies:

| Where | Type | Convention |
|---|---|---|
| `JournalEntry.totalDebit` / `totalCredit` | **`Int`** | **Cents.** Service-enforced equal. |
| Accounting ledger (`src/lib/accounting/ledger.ts`) | `Int` | **Cents-safe by design** |
| Most other money columns (tuition, commission, payments, scholarships) | **`Float`** | Major units |

Because `Float` cannot represent decimal currency exactly, aggregation over `Float` money columns
carries rounding risk. The ledger avoids this by working in integer cents; code that sums `Float`
amounts does not get that protection for free.

This is recorded as a known design gap rather than silently "fixed", because converting existing
`Float` money columns to integer cents is a large data migration touching live financial records, and
per s2 functioning behaviour must not be broken for architectural convenience.

---

## 3. Double-entry ledger

`JournalEntry` (schema line 10713):

| Field | Purpose |
|---|---|
| `id` | **Deterministic** (`je_<uuid>` or `je_inv_<invoiceId>`) for idempotency (s90) |
| `entryDate`, `memo` | |
| `source` | `finance.invoice` \| `procurement.bill` \| `payroll.run` \| `asset.depreciation` \| `reversal` \| `manual` |
| `sourceRefId` | Business identifier for source-level idempotency |
| `status` | `POSTED` \| `REVERSED` |
| `reversalOfId`, `reversedById` | Reversal chain |
| `currency` | Default `BDT` |
| `totalDebit`, `totalCredit` | **Integer cents**, service-enforced equal |
| `actorId` | Attribution |

Design properties worth relying on:

- **Balanced by construction.** Debit must equal credit; the service enforces it, so an unbalanced
  entry cannot be posted.
- **Idempotent.** A deterministic id plus `sourceRefId` means re-submitting the same invoice does not
  double-post (s90).
- **Reversal, not deletion.** A correction posts a reversal referencing the original. Posted financial
  history is never mutated or deleted — the same principle the audit trail (s65) and rule versioning
  (s106) follow.

`src/lib/double-entry-ledger.ts` provides the higher-level API; `src/lib/accounting/ledger.ts` is the
cents-safe core.

---

## 4. Student payments and deposits (s26)

Tracks required amount, paid amount, currency, payment date, method, reference, receipt, refund,
refund date and outstanding balance.

`Application` carries `paymentStatus` and `depositStatus`. `Payment` (schema line 9223) holds the
transaction records.

**Payment secrets are never exposed** (s26, s66). Payment credentials are on the s66 never-expose list
alongside passwords, API secrets, tokens and private documents.

### Parent / guardian financial responsibility (s13) — built in this work

`ParentGuardianPaymentResponsibility` records who is responsible for what, with `scope` ∈
`TUITION`, `DEPOSIT`, `SERVICE_FEE`, `ACCOMMODATION`, `TRAVEL`, `ALL`.

Guarantees, all unit tested:

- A **negative amount is clamped to 0** on creation — no negative liability can be stored.
- A **non-positive payment is rejected** (`amount <= 0`).
- `paidAmount` is **capped at the owed amount**, so an overpayment cannot create phantom credit. The
  UI warns before submitting and reports the capped result.
- `status` is computed from the real numbers: `PAID` when outstanding reaches 0, `PARTIAL` when part is
  paid, `PENDING` otherwise.
- `outstanding` can never go negative in the summary (`Math.max(0, amount - paidAmount)`).
- The parent portal shows these figures **only** when the parent holds the
  `payment.own_responsibility` capability.

---

## 5. Commission (s36)

Supports university, programme, country, intake and partner dimensions; percentage, fixed, tiered and
bonus models; clawback and refund adjustment; currency; payment status; invoice and statement
generation.

Statuses: `EXPECTED → PENDING → APPROVED → PAYABLE → PAID`, plus `DISPUTED` and `CLAWED_BACK`.

**Paid commission cannot be changed manually without an audit trail**, and a commission adjustment is
one of the five s116 human-in-the-loop actions.

The attention engine reports **unsettled** commissions — `DUE`, `VERIFIED`, `REQUESTED`, `INVOICED`,
`APPROVED`, `SENT` — and deliberately excludes `RECEIVED`, `RECONCILED` and `CLOSED`, so the "unpaid
commissions" figure (s108) counts money actually outstanding rather than every commission row.

The opportunity graph weights settled commission (`RECEIVED`/`RECONCILED`/`CLOSED`) at 1.0 and
unsettled at 0.4, because settled money is a stronger signal than an expectation.

---

## 6. Financial planning (s48)

Calculates tuition, deposit, living cost, visa fee, health insurance, medical, flight, accommodation
and other costs; shows first-year estimated cost, initial funds required, remaining funds and currency
conversion.

**Estimates must be clearly labelled** (s48). Related: the visa funding review (`VisaFundingReview`)
and the financial-evidence component of the readiness score.

---

## 7. Finance dashboard and analytics (s70, s71)

Finance dashboard: payments, outstanding, refunds, commission, revenue. Analytics: revenue,
commission, refund, marketing ROI, source ROI — **using real data only** (s71).

The attention engine (s108) surfaces unpaid commissions as an operational bucket with a link to the
underlying records and a sample of real commission ids.

---

## 8. Verification status

| Item | Status |
|---|---|
| Ledger invariants (balance, idempotency, reversal) | **PARTIAL** — `accounting-ledger` tests pass; not exercised against a database |
| Parent payment responsibility arithmetic | **PASS** — 36 unit tests including clamping and capping |
| Commission unsettled filter | **PASS** — asserted in the attention engine tests |
| Real payment processing | **NOT CONFIGURED** — no gateway credentials |
| Refund and reconciliation flows | **NOT VERIFIED** — requires a database |
| Finance figures in the UI | **PASS** (compiles, in a successful production build) / **NOT VERIFIED** at runtime |
| Statutory accounting compliance | **NOT VERIFIED** — no such claim is made (s49) |

No financial figure produced by this system has been reconciled against a real bank, gateway or
accounting system in this environment.
