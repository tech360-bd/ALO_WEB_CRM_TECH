# Financial lifecycle audit — 2026-10-01 continuation

Status: **BLOCKED**. Source inspection, not bank settlement or database reconciliation. No accounting rules or settlement transactions were invented.

| Event | Database records | State transition | Journal impact | Audit impact | Authorization | Reversal behavior |
|---|---|---|---|---|---|---|
| Legacy payroll status `/api/hr/payroll` | Payroll | Listed DRAFT/PENDING/APPROVED/PAID/CANCELLED; no enforced transition graph | No linked journal call | Now same transaction as AuditLog insert | Existing FINANCE/HR/CEO + admin middleware | Can change statuses; cancellation/refund accounting rule unresolved |
| Per-employee draft `/api/employee-access/payroll` | EmployeePayroll, EmployeePayrollItem | draft/review_pending | None wired | PortalAuditLog now in same transaction | Existing HR/Finance controls | No reversal defined |
| Per-employee review/approval/pay | EmployeePayroll | Existing payroll-controls graph, maker-checker, conditional update | No bank transfer or ledger linkage | PortalAuditLog now atomic | Existing HR/Finance controls | Paid flag is not settlement proof |
| HRM run generate/review/approve/pay `/api/hrm/payroll` | HrmPayrollRun, EmployeePayroll, items | Existing graph, Serializable transaction | None wired | HrmAuditLog + EmployeeAuditLog now in same transaction | Existing maker-checker; salary list IDOR repaired for explicit employeeId in all views | Bulk period update may overlap other entry points; business ownership rule needed |
| Admin aggregate run `/api/admin/payroll` | EmployeePayroll with empty employeeId + items | Existing guarded transitions | None wired | IntegrationAuditLog now inside same transaction | Existing access checks + maker-checker | No provider payout/refund workflow established |
| Commission creation `/api/commissions` | Commission | DUE | No journal call | Missing required transactional audit here | Staff finance types | No credit/reversal rule |
| Commission update | Commission approval/sent/received/reconciled timestamps | Listed statuses accepted without a graph | No enforced journal/settlement pairing | Actor stamped on approval; comprehensive audit missing | Existing staff authorization, not a proven maker-checker lifecycle | Arbitrary back transitions remain a blocker |
| Payment | Payment (Float amount, currency, status PENDING/PAID/REFUNDED), Student relation | Model labels do not prove provider confirmation | No established linkage to legacy journal adapter | Payment audit coverage not complete | Must review each writer/provider hook | REFUNDED label is not proof of refund or reversal |
| Journal adapter `src/lib/double-entry-ledger.ts` | CrmAuditLog JOURNAL_POSTED | Balanced integer-cent validation, deterministic ID/PK | Persists journal JSON, not dedicated accounts/period ledger | Row itself is journal record | Requires actor; consumer must authorize | Invoice/bill/credit/debit helpers exist, no proven payment lifecycle wiring |

`rg postJournal/postInvoice` finds adapter definitions rather than an end-to-end payment posting service. LongText target addresses journal payload capacity, but actual database widening and integration remain unverified. Existing deterministic IDs reject new duplicate journal IDs; historical rows and mixed-version writers require reconciliation.

## Decisions required, not implementation defaults

- Which payroll representation is authoritative, and may all three entry points issue obligations for the same employee/period? How do aggregate records reconcile with individual records?
- What provider/bank evidence constitutes settlement? Who may record offline payments, with what immutable reference?
- Which commission status transitions, segregation-of-duties rules, currencies and recognition dates are approved?
- How are partial refunds, cancellations, corrections, closed periods, FX and fees posted? What links a refund to its original obligation?
- Are financial records/agent audit records allowed to cascade-delete with parent entities? Existing FKs need retention review.

These are unresolved repository/business-model blockers, **not** merely credentials. The changes in this checkpoint repair atomic audit boundaries in named payroll paths; they do not certify balances, payment lifecycle or full accounting consistency.

## Full-functionality continuation — local repairs, not deployment (2026-10-01)

| EVENT | DATABASE RECORDS | STATE TRANSITION | JOURNAL IMPACT | AUDIT IMPACT | AUTHORIZATION | REVERSAL BEHAVIOR |
|---|---|---|---|---|---|---|
| Student payment request | AloPayment + PortalAuditLog | Strict pending-only; caller paid/target rejected, paidAt=null | None; NOT a settlement/obligation posting | Now required in same interactive transaction | Own PortalStudentProfile.id; existing student restriction/admin bypass | No refund/reversal flow implemented by this request |
| CRM finance read | AloPayment, Student name lookup | Read only; DB failures no longer empty success | None; mixed-currency summary still defective | Read audit policy not established | New finance/finance_officer/CEO roles + retained admin bypass | Not applicable to read |
| CRM finance create | AloPayment | Role restricted; arbitrary status/target and missing lifecycle constraints remain | None | Now required inside same interactive transaction; validation rejects partial numeric strings | Finance/CEO/admin only, full target scope unresolved | No established settlement/refund/reversal chain |
| CEO counts | PortalStudentApplication, MarketingLead, PortalStudentProfile, VisaCase | Read-only record counts; removed fictional financial totals/conversion/growth | None; financial KPI explicitly unavailable | Read audit policy not established | Executive/admin gate | Not applicable |
| Student receipt controls | UI only | Explicitly unavailable rather than dead clickable upload/download | None | None | No new upload path exposed | Not applicable |

Full production financial status remains **BLOCKED**. Payable/receivable recognition, invoice → collection → provider confirmation → allocation → journal → reconciliation → partial/full refund → reversal → reports/audit has not been demonstrated. Creation of a row, successful request, journal JSON or paid flag cannot satisfy this chain.

No row remapping or balance correction performed. See [DATABASE_RECONCILIATION.md](DATABASE_RECONCILIATION.md) for payment ID namespace ambiguity. CRM summary currently adds different currencies and labels all non-empty pending due dates overdue. Commission frontend consumes payment data; it is not a verified commission lifecycle. Float amounts, date strings, dual payment models, historical artificial scan/data and overlapping payroll runs require explicit business/data decisions. The pending-only student fix prevents a security defect without inventing settlement rules.
