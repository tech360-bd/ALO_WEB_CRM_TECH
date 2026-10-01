# Financial reconciliation — source evidence, no production mutation

Date: 2026-10-01 Asia/Dhaka. Source commit: 9e504ad2. Production rows, transactions and balances cannot be reconciled while the app reports DB authentication failure and no authorized DB connection is available. No mutation/settlement/refund endpoint was invoked.

| Lifecycle / event | Actual persistence or source | Transition / evidence boundary | Status |
|---|---|---|---|
| Student payment entry | `src/app/api/student-portal/payments/route.ts:88`, `AloPayment` | Student-restricted handler accepts body status, including paid, and sets paidAt without provider evidence. Audit follows create using legacy best-effort logger. No business idempotency reference in model. | BLOCKED |
| CRM finance read/create | `src/app/api/crm/finance/route.ts`, `AloPayment` | withAuth called without role/permission restrictions. GET can enumerate payments and aggregate all records; POST accepts arbitrary studentId/status after generic auth. No demonstrated financial-scope gate in this handler. Create and audit separate. | BLOCKED |
| Summary reconciliation | `/api/crm/finance` reads AloPayment; `/api/finance` reads Payment + EmployeeCommission | Distinct payment representations; not proven to represent same obligations. Missing-table path in CRM finance can return success with empty rows. | BLOCKED |
| Payment model | `Payment`: unique paymentId, Float amount, string status PENDING/PAID/REFUNDED, Student FK with Cascade | Unique row reference alone is not proof of gateway event deduplication, amount/currency authenticity or safe refund linkage. | NOT VERIFIED |
| Mock payment | `MockTestPayment`: transactionId default empty, not unique in schema | No proven provider transaction key uniqueness or credits/settlement atomicity from model declaration. | NOT VERIFIED |
| Application fees/instructions | ApplicationPaymentInstruction; ApplicationFinance maps to application_finances | Payment instructions/finance fields are not provider receipt or settlement proof. | NOT VERIFIED |
| Commission | `/api/commissions`, Commission | Listed status strings accepted; timestamps recorded for approved/sent/received/reconciled; no enforced transition graph/atomic settlement+audit in handler. Code generated from last six timestamp digits; collision risk, not semantic idempotency. | BLOCKED |
| Accounting journal | `double-entry-ledger.ts`, CrmAuditLog JOURNAL_POSTED | Validates cents and balanced lines; deterministic new PK. No dedicated Journal/Ledger table or proven payment->journal calling path found in inspected code. Schema LongText target has not been reconciled with production. | PARTIAL |
| Individual payroll | employee-access/payroll -> EmployeePayroll, items, PortalAuditLog | Named current-branch mutations and audits share transaction; conditional updates and existing maker-checker checks. Not proof deployed or paid funds. | PARTIAL |
| Admin aggregate payroll | admin/payroll -> EmployeePayroll with employeeId="", items, IntegrationAuditLog | Current-branch audit atomicity repaired; aggregate row overlaps alternative payroll representation unless business ownership is specified. | PARTIAL |
| HRM payroll run | hrm/payroll -> HrmPayrollRun + individual rows + HR audit tables | Serializable transaction; named audit boundary repaired. Period-wide updates and other entry points need overlap reconciliation. | PARTIAL |
| Legacy payroll | hr/payroll -> Payroll + audit_logs (AuditLog @@map) | Atomic update/audit in branch; status set allows graph-free transitions. PaidAt is not bank evidence. | PARTIAL |
| Refund/reversal/settlement | Status labels, credit/debit memo helpers; no observed linked transaction chain | No production provider event, original-payment link, partial-refund allocation or reversal journal evidence obtained. | NOT VERIFIED |

## Required decisions and evidence

- Establish the canonical payment/obligation identity across AloPayment, Payment, mock payments and application finances. Define immutable provider/offline reference, event signature verification, idempotency, amount/currency checks and who may attest settlement.
- Student input must not itself establish paid/settled status. Decide permitted student intent (payment request, proof submission, gateway initiation) and authorized review workflow before implementing a replacement; no guessed accounting behavior added here.
- Restrict CRM finance to approved finance roles and record scope. The exact role policy needs ALO Education approval; missing handler restriction is a concrete code finding, not a missing credential.
- Decide whether one employee-period can exist as aggregate and individual rows across admin, HRM and employee-access entry points, and how they reconcile. Never choose a duplicate survivor or delete paid records automatically.
- Obtain aggregate duplicate/status counts under a bounded read-only plan; investigate by approved pseudonymous record IDs only if necessary. Equal amount/date is not enough to call two payments duplicates.
- Define refunds, partial refunds, reversals, closed periods, FX, fees, cancellation, maker-checker and immutable audit retention. Keep business decisions separate from provider configuration.

No claim is made that these vulnerabilities were exercised or that production rows are corrupt. Source defects require code/business review; deployed presence and historical impact need artifact identity and authorized DB evidence.
