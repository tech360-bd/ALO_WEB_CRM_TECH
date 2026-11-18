# Decision record — is a `contact_phones` child table required?

**Decision: NOT REQUIRED (now).** Documented trigger conditions below. No migration was
written.

Phase 2 Task 5 asks whether a `contact_phones` child table is genuinely necessary, and
explicitly says not to create it merely to satisfy a checklist. This is the analysis,
against the models that actually exist.

---

## 1. What the current schema does

`WhatsAppContact` is keyed on a phone number:

```prisma
model WhatsAppContact {
  phone           String @unique
  normalizedPhone String @unique
  email           String @default("")
  normalizedEmail String @default("")
  studentId       String @default("")
  leadId          String @default("")
  ...
}
```

One row = one number = one contact record. Other numbers for the same *person* already
have homes:

| Number | Stored in |
| --- | --- |
| Student's own | `Student.phone` |
| Lead's own and alternate | `Lead.phone`, `Lead.altPhone` |
| Parent/guardian | `ParentGuardian.phone`, `ParentGuardian.whatsapp` |
| Registry row | `WhatsAppContact.phone` / `normalizedPhone` |
| Additional number of the same person | a second `WhatsAppContact` row, optionally **aliased** to the primary by a confirmed merge |

Matching is not limited to exactly-stored strings: `phoneVariants()` in
`src/lib/communications/contact-identity.ts` generates the digit-level forms
(`8801XXXXXXXXX`, `01XXXXXXXXX`, last ten digits) so a number is found regardless of how
it was typed. Every read path (webhook, import, search, identification, dashboard) uses
that helper.

## 2. What a child table would buy

* one contact row with 1..n numbers (`contact_phones(contactId, e164, label, verifiedAt)`);
* a stable person identity independent of any single number;
* a place to record per-number verification/label (mobile/work/home, WhatsApp vs landline).

## 3. What it would cost — measured against this codebase

| Impact area | Files/queries that must change |
| --- | --- |
| Schema + migration | new table, backfill of every existing row, plus a decision on whether `WhatsAppContact.phone` stays (it is `@unique` **and** used as the send target in ~dozens of queries) |
| Webhook and inbound routing | `src/app/api/whatsapp/webhook/*`, idempotency claim, unknown-sender creation |
| Imports | `/api/crm/contacts/import` duplicate detection, Google Contacts sync planning |
| Matching | `resolveContactIdentity`, `/api/communications/contacts/match`, identification card, merge |
| Sending | every send path resolves a destination by `normalizedPhone` |
| Consent | `CommunicationConsent.contactId` semantics per number vs per person |
| Analytics/dashboard | 5 of the 16 metrics count contacts by number |
| Tests | every suite that constructs a contact fixture |

That is a cross-cutting change to the highest-traffic code in the CRM, requiring a
backfill whose correctness cannot be verified in this environment (no database, no
`prisma generate`). Shipping it now would be the opposite of the brief's "safe,
reversible migration" requirement.

## 4. What already covers the operational need

1. **Multiple numbers per person are searchable today** — each stored in its own field or
   its own row, all matched through `phoneVariants`.
2. **Identity is already person-level, not number-level** — `studentId`/`leadId`/
   `partnerId` are the person links; a second row can be linked to the same student.
3. **Confirmed merges keep the extra number alive** — the merge implemented in Phase 2
   (`POST /api/crm/contacts/merge`) keeps the absorbed row as an alias: the number stays
   searchable, keeps its conversations, and now resolves to the same student. A child
   table would model this more elegantly, but not more correctly.
4. **Nothing counts a person twice** — aliases are excluded from the dashboard's contact
   totals and reported separately.

## 5. Trigger conditions that would reverse this decision

Adopt `contact_phones` when **any** of these becomes true:

1. ALO needs to attach **three or more** numbers to one person routinely (today: two, via
   primary + one alternate), or
2. ALO needs per-number metadata that cannot live in a tag — e.g. "this number is a
   landline, never send WhatsApp to it", or per-number verification with its own
   timestamp, or
3. WhatsApp/Meta starts returning multiple numbers per `wa_id` in a way the registry must
   represent as one contact, or
4. A reporting requirement needs "unique people" without relying on alias tags.

## 6. If adopted later — the shape it must take

1. `ContactPhone(contactId, e164, normalized, label, isPrimary, verifiedAt, source)` with
   `@@unique([normalized])` so a number can never belong to two contacts.
2. Keep `WhatsAppContact.phone` as the **primary** number during coexistence, so sending
   and webhook paths keep working while readers migrate. No query breaks.
3. Backfill: one `ContactPhone` row per existing contact from `normalizedPhone`; aliased
   rows (`merged_into:` tag) become additional rows of their destination.
4. Expand → migrate readers → contract (drop duplicate columns) in three separate
   releases, each with its own backup and rollback.
5. Rollback per release: the new table is additive, so dropping it restores the previous
   behaviour exactly; the primary column is never removed until the final release.

**Status: NOT REQUIRED. No schema change, no migration, nothing to roll back.**

---

## Addendum — 2026-11-16 (owner task: "ALO CRM: Central Contact Registry … DONE FULL PROJECT")

**Status change: `NOT REQUIRED (now)` → implemented additively (`ContactPhone`). Decision above preserved unchanged; this addendum records what reversed it and how the original risks were avoided.**

What reversed it:

1. The owner's directive for this pass is explicit: any asked-for feature that does not exist must be created; never delete; add and coordinate into one unified system. The spec (§3/§10) requires *multiple phone numbers per person, each separately searchable*, plus per-number WhatsApp/label metadata — i.e. the second documented trigger condition above (per-number metadata: label, WhatsApp flag, source, per-number creation audit).
2. The spec's §24 requires tests that prove "multi-phone student" behaviour end-to-end at the API level — impossible without a storage place for the additional number's metadata.

How the original cost analysis was respected:

* **No backfill.** The table starts empty. Existing contacts are untouched; `WhatsAppContact.phone`/`normalizedPhone` remain the primary number and the send target, exactly as the analysis demanded ("Keep `WhatsAppContact.phone` as the primary number during coexistence … No query breaks").
* **Additive migration only.** `20261117000000_contact_phones_merge_history` creates two new tables and alters nothing; `migration-safety.test.ts` proves it.
* **No query removed or changed in shape.** Identification only *added* an optional lookup; the primary-number path is unchanged.
* **Rollback is a drop of the new table** — the final "contract" step (dropping duplicate columns) was not performed and would need its own release.
* Per-number *verification timestamps* are deliberately not modeled; `source`/audit covers provenance. Trigger condition 3 (Meta multi-number per wa_id) still does not apply.

If a future pass performs the backfill (one `ContactPhone` row per existing masked number), it must follow §6 above: separate release, backup first, expand → migrate readers → contract.
