# Google Contacts → ALO registry — manual setup

Everything here is performed by a human with access to the ALO Google account and the
server environment. Nothing in the application can do these steps for you, and the
application will **not** pretend they are done.

Target account: **`alo.allcontacts@gmail.com`** (configurable through
`GOOGLE_CONTACTS_ACCOUNT`).

---

## 0. Why a service account cannot be used

The People API reads the address book **of a signed-in user**. A service account has no
mailbox and no address book, so it returns an empty result — which would look exactly
like "the company has no contacts". Domain-wide delegation does not help either:
`alo.allcontacts@gmail.com` is a Google consumer account, not a Workspace user.

The application therefore requires an **OAuth refresh token** for that account and
reports `NOT_CONFIGURED` (with this reason) whenever only a service account is present.
This is enforced in `describeContactsConfig()` in `src/lib/google/contacts.ts` and
covered by a unit test.

---

## 1. Enable the People API

1. Open <https://console.cloud.google.com/apis/library/people.googleapis.com> while
   signed in as the Google Cloud project owner used for the existing Google stack.
2. Select the ALO project (the one holding `GOOGLE_CLIENT_ID`).
3. Press **Enable**. There is no billing requirement and no charge for this API.

## 2. Make sure the OAuth consent screen lists the contacts scope

1. Google Cloud Console → **APIs & Services → OAuth consent screen**.
2. **Data access → Add or remove scopes** → add:
   `https://www.googleapis.com/auth/contacts.readonly`
   (`.../auth/contacts.other.readonly` is **not** requested: "other contacts" are
   auto-collected Gmail correspondents, not company contacts.)
3. If the app is in **Testing**, add `alo.allcontacts@gmail.com` under **Test users**,
   otherwise the consent will be refused.

## 3. Obtain a refresh token as the contacts account

Run this once, on a trusted machine, from any directory. It is the standard
`oauth2l`/manual flow; no ALO code is required.

1. Sign in to <https://accounts.google.com> **as `alo.allcontacts@gmail.com`** in the
   browser you use for step 4 — the token is bound to the account that consents.
2. Open this URL (replace `CLIENT_ID`, keeping the redirect URI exactly as registered
   for `GOOGLE_CLIENT_ID`):

   ```
   https://accounts.google.com/o/oauth2/v2/auth
     ?client_id=CLIENT_ID
     &redirect_uri=https://aloeducation.com/api/google/oauth/callback
     &response_type=code
     &access_type=offline
     &prompt=consent
     &scope=https://www.googleapis.com/auth/contacts.readonly
   ```

3. Approve. The redirect contains `?code=…`. If `aloeducation.com` is not yet the
   registered redirect, use the Google OAuth Playground
   (<https://developers.google.com/oauthplayground>) instead: gear icon →
   *Use your own OAuth credentials* → enter client id/secret → step 1 scope
   `https://www.googleapis.com/auth/contacts.readonly` → *Authorize APIs* → step 2 →
   *Exchange authorization code for tokens*.
4. Copy the **refresh token** (starts with `1//`).

> `access_type=offline` + `prompt=consent` is what makes Google return a refresh token.
> Without `prompt=consent` a second consent for the same client returns none.

## 4. Store it on the server (never in Git, never in the browser)

Add to the production environment (and to local `.env` if you are testing there):

```
GOOGLE_CLIENT_ID=<existing>
GOOGLE_CLIENT_SECRET=<existing>
GOOGLE_CONTACTS_ACCOUNT=alo.allcontacts@gmail.com
GOOGLE_CONTACTS_REFRESH_TOKEN=1//...
```

Rules:

* No `NEXT_PUBLIC_` prefix — this is a server credential.
* Do not commit a real token. `.env.example` declares the keys with empty values.
* `GOOGLE_CONTACTS_REFRESH_TOKEN` takes precedence over `GOOGLE_OAUTH_REFRESH_TOKEN`,
  so the Contacts integration keeps working even if the general token is rotated or a
  service account is configured for Search Console/GA4.
* Restart the application after changing the environment.

## 5. Verify, in this order

1. `/admin/google-stack` → **Google Contacts** panel → **Verify access (live call)**.
   Expected: *Verified by a real API call*.
   A 403 here means the People API is not enabled, or the consent did not include the
   scope, or the token belongs to a different account — the panel prints Google's own
   reason.
2. **Preview import (writes nothing)**. Expected: counts of `create / link / fill blanks /
   review / skipped`, and a sample table. Nothing is written in this step.
3. **Import into registry**. Expected: a batch id, written counts, and the same numbers
   on a second run reported as duplicates (idempotency).
4. Re-run **Preview** — a correctly linked contact must now appear as
   `SKIP_ALREADY_LINKED`.

## 6. What the sync will and will not do

| Google contact | Result |
| --- | --- |
| Number unknown to ALO | New registry contact, `source=GOOGLE_CONTACTS`, unverified, **not** a student |
| Number already in the registry, fields agree | Google id linked; nothing else written |
| Number known, ALO field empty | Only the empty field is filled |
| Number known, ALO field populated and different | **No write.** A `ContactMatchReview` row is queued |
| Number shared by 2+ registry rows | **No write.** Review row queued (never auto-merged) |
| Contact opted out / blocked | Skipped |
| No usable phone number | Reported as skipped — the registry is phone-keyed |
| Deleted in Google | Not propagated; nothing is deleted |

Students, Student IDs, counsellor assignments, guardians and relationships are never
written by this integration.

## 7. Known limitations, stated rather than hidden

* **No photo import.** The People API contacts scope exposes no photo bytes for this
  use, and the CRM has no student photo column. `photoReason` in the identification
  card says so instead of showing a placeholder avatar.
* **Pull, not push.** There is no Google webhook for contacts. Sync runs when triggered
  (panel button or `POST /api/google/contacts/sync`); incremental sync tokens make later
  runs cheap. Do not describe the integration as real-time.
* **Page ceiling.** A run reads at most 20 pages (50 with `maxPages`) and reports
  `truncated: true` when it stops early. Re-running continues because the sync token is
  stored after each run.
* **`contactGroups` are not imported.** Group membership is not part of the requested
  field set, so no category is inferred from it.
