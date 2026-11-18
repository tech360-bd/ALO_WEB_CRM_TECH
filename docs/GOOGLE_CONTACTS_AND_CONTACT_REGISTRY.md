# Google Contacts integration & central Contact Registry — operator guide

Date: 2026-11-16 · Branch: `arena/92d9a42c-alo-web-crm-tech` · Spec: "ALO CRM — Central Contact Registry, Live Student Identification, Google Contacts and WhatsApp Integration"

**Read this first:** nothing on this page is "live" until a human with access to the
`alo.allcontacts@gmail.com` account completes the Google Cloud steps below and the
first sync passes. Until then, every screen shows NOT_CONFIGURED / NOT_VERIFIED,
which is the honest state — not a bug.

## 1. Architecture in one paragraph

ALO CRM has **one** central contact registry: the existing `WhatsAppContact`
table, extended by two additive tables (`ContactPhone` for secondary numbers,
`ContactMergeHistory` for merge audit) in migration
`20261117000000_contact_phones_merge_history`. There is no second contact store.
Google Contacts is an **inbound, idempotent, CRM-authoritative** feed into that
registry, reconciled through People API sync tokens. WhatsApp is the **live
identification channel**: an inbound number is matched against the registry and
linked students/leads/guardians — never matched by name alone — and every
uncertain match requires a human confirmation. ALO stays the source of truth;
Google may add a contact or fill a blank ALO field, and may never overwrite a
populated ALO value, a Student ID, a counsellor assignment or a relationship.

## 2. Google Cloud setup (one-time, human required)

1. In the Google Cloud project used for ALO, enable the **People API**.
2. Configure the **OAuth consent screen** for an internal/company workspace or a
   verified external app. Scope required: `https://www.googleapis.com/auth/contacts.readonly`.
3. Create an **OAuth client (Web application)**. Add an authorized redirect URI
   and run the OAuth flow **as `alo.allcontacts@gmail.com`** (the shared ALO
   contacts account — never a personal account, never a service account).
4. Store the resulting refresh token in the protected server environment only:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CONTACTS_REFRESH_TOKEN`
   Never in the repository, never in the browser, never in logs, never in a response.
5. Consumers Gmail (`@gmail.com`) **cannot** be accessed with a service account.
   The application refuses to treat a service account key as a valid Contacts
   credential — this is intentional (`describeContactsConfig`).

## 3. Running a sync (manual / triggered pull — not real-time push)

Via `/admin/google-contacts` (session-authenticated, permission
`google.integrations.view` to see, `google.integrations.manage` to run):

1. **Probe** — "Probe People API" issues one live `people.connections.list` call.
   Verdict flips to PASS only if Google answers. Configuration alone never reports PASS.
2. **Dry-run** — plans the import, writes nothing. Review `counters`, `conflicts`
   and `skipped`.
3. **Apply** — writes the plan. Re-runs are idempotent: an already-linked
   contact (matched by People API resource name, preserved in
   `externalContactId`) is skipped; no duplicate review row is created twice.
4. Every run is recorded in the existing import ledger (`ImportBatch` with
   `sourceCrmName = 'GOOGLE_CONTACTS'`, `ImportError` rows on failure) plus an
   audit-log line. "Last sync", success/failure and pending human reviews are
   visible on the same screen.

Failure recovery: a failed read returns 502/504, records the failure, and
writes nothing. A row that fails to write is counted, lands in `ImportError`
(`completed_with_errors`), and never marks the batch clean. Re-running the sync
is the recovery path — no manual database surgery, no re-mapping of identities.

Sync frequency: choose a cadence that matches your change rate (Google fires
`contactChanged` via webhooks only with the right scopes/verification, so this
integration is a **pull**). A daily/manual sync is the supported model; it is
not advertised as real-time until proven end-to-end with live credentials.

## 4. What a sync will and will never do

| Does | Never does |
| --- | --- |
| Create a registry contact for a number ALO has never seen | Allocate a Student ID from a Google row |
| Fill a **blank** ALO field (name/email) | Overwrite a populated ALO value |
| Link an agreeing existing row (set `externalContactId`) | Rewrite a Student / Student ID / relationship |
| Queue an ambiguous match in `ContactMatchReview` for human decision | Merge anything automatically |
| Respect opt-out/block flags (never writes to a suppressed row) | Grant promotional consent to anyone |
| Skip phone numbers that cannot be normalised | Store or log the refresh token |

## 5. Secondary phone numbers (ContactPhone)

People carry more than one number. `ContactPhone` stores them separately
searchable (spec §3/§10). Managed from the contact detail screen
(`/crm/contacts/[id]` → "Phone numbers") or via the API:

- `GET/POST /api/crm/contacts/{id}/phones` — list/add (`contacts.view` / `contacts.manage`)
- `PATCH/DELETE /api/crm/contacts/{id}/phones/{phoneId}` — set primary/label/WhatsApp, remove
- Numbers shared between contacts are **reported**, never auto-merged.
- Identification resolves a secondary-number match to the owning primary contact;
  identity decisions always go through the match policy (phone-first, name never sufficient).

## 6. Merge history (ContactMergeHistory)

Merges remain reversible alias operations on the registry (`merged_into:` tags,
full audit snapshot, `restore` action). `ContactMergeHistory` now also records
one queryable row per (destination, source) pair — destination/source ids, the
phone numbers, the Google aliases preserved, the actor, and the reason — written
in the same transaction as the merge itself. A rolled-back merge cannot leave
phantom history.

## 7. Student ID format decision (2026-11-16)

- **Decision:** new Student IDs keep the owner-specified shape
  `AE-<YEAR><6-digit sequence>` (e.g. `AE-2026000001`), matching the spec example.
  Earlier rows carry 4/5-digit tails and **are never rewritten**; the match
  policy accepts 4–6 digit tails (`/^AE-\d{4}\d{4,6}$/`).
- Partner (`AEP-`) and employee (`EMP-`) scopes are unchanged (5-digit).
- Sequence overflow > 999,999 per year fails closed. Concurrency guarantee is
  unchanged (atomic `UPDATE … LAST_INSERT_ID` inside the caller's transaction).
- Existing legacy IDs (`AE-20260001`, `AE-202600042`, …) remain valid forever.

## 8. Environment baseline (.env.example)

`ALO_MAIN_WHATSAPP_NUMBER=01805020100`, `ALO_COO_WHATSAPP_NUMBER=01805020101`
and `ALO_EMPLOYEE_WHATSAPP_NUMBERS=01805020102…01805020119` now ship in
`.env.example` as the owner-requested **configuration baseline** for fresh
environments. They are not proof of ownership, Meta registration or
connectivity — no outbound send is possible until a Meta `phone_number_id` /
WABA / token is configured and a provider check passes, and every screen says so.

## 9. Still NOT verified (requires real world actions)

- Google People API consent flow for `alo.allcontacts@gmail.com` (human OAuth).
- Meta Business verification of 01805020100 / ownership of the number set /
  WABA registration / webhook subscription / template approval.
- Any send, sync or verification performed against production credentials.
- Production database migration `20261117000000_contact_phones_merge_history`
  (needs backup + approval per §19/§25 — **not applied** by this change).
