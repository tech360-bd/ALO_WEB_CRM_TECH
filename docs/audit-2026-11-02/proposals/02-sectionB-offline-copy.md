# Section B — Offline messaging copy

Status: **PROPOSED — one string, one file.**
Patch: `patches/2001-offline-copy.patch` (validated with `git apply --check`).

## The exact misleading promise

`src/app/offline/page.tsx:18`

> No internet connection. Some cached pages and CRM data may still be available. **Your actions will sync when you reconnect.**

There is no sync engine behind that sentence. What actually exists:

* `public/sw.js` — version `v2-20261009`, caches static assets only, no background sync,
  no request queue, no `SyncManager` registration;
* `src/components/pwa/PwaRegister.tsx` — registers that worker;
* `src/app/layout.tsx` — mounts the registrar.

So the sentence promises a durability guarantee the product does not have. A counsellor
who types a note while offline is told it will be delivered.

## Change

```diff
-          No internet connection. Some cached pages and CRM data may still be available. Your actions will sync when you reconnect.
+          Some features require an internet connection. Please reconnect to continue.
```

The requested string is used verbatim. The sentence above it on the page ("You are
offline") already conveys the state, so the second sentence now only states the
requirement. No logic, no service worker, no caching behaviour changes.

## What is explicitly not happening

Archived offline-sync functionality is **not** restored. Reinstating it requires
approved design for, at minimum: persistence (where queued writes live and for how
long), encryption (queued PII at rest), conflict handling (two counsellors editing the
same lead), authorization (a queued write replayed after a role change or after an
Acting-As session ended), and data-at-rest requirements on the device. None of that is
designed, so none of it ships.

## Test

No test asserts the old sentence (verified: `grep -rn "will sync" src tests` returns only
the page itself after the patch). A regression test is still worth adding so the promise
cannot return:

```ts
it('never promises offline sync', async () => {
  const { readFileSync } = await import('node:fs');
  const page = readFileSync('src/app/offline/page.tsx', 'utf8');
  expect(page).not.toMatch(/sync(s|ing)? (when|once) you reconnect/i);
  expect(page).toContain('Some features require an internet connection. Please reconnect to continue.');
});
```

Proposed file: `tests/unit/offline-page-copy.test.ts` (add with the patch; not part of
the 13 validated patches because it is new coverage, not a failing test being repaired).
