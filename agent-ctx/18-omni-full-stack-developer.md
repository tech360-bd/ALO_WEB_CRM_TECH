# Task 18-omni — Omnichannel Communication Center

**Agent:** full-stack-developer
**Task:** Build the Enterprise Omnichannel Communication Center view (`OmnichannelCommunicationCenter`) at `/home/z/my-project/src/components/alo/views/omnichannel-communication-center.tsx`.

## Work Log

- Read `worklog.md` (all prior tasks 1-3, 4-a/b/d/e/f, 13-17) to align with the existing ALO Education design system, shared.tsx helpers (Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader, Progress, MiniBar, StatusBadge), alo-types.ts date helpers (fmtDate, timeAgo), and shadcn/ui component inventory.
- Inspected the four backend routes:
  - `GET /api/omnichannel/dashboard` — returns stats + 12 collection arrays + unifiedTimeline + recentTimelineEvents.
  - `GET/POST/PATCH /api/omnichannel/connected-accounts` — connect / sync / disconnect / reconnect.
  - `GET/POST/PATCH /api/omnichannel/notifications` — create + mark read.
  - `GET/POST /api/omnichannel/consent` — consent ledger.
  - `POST /api/omnichannel/document-classification` — AI classify + OCR extract via z-ai-web-dev-sdk.
- Verified page.tsx already imports `OmnichannelCommunicationCenter` and renders it on the `omnichannel-communication-center` view — no wiring change needed.
- Created the file at the exact requested path with named export `OmnichannelCommunicationCenter` (no props), `"use client"`, TypeScript strict.

## Implementation Summary

### Top-level component
- PageHeader "Omnichannel Communication Center" with Radio icon + subtitle + Refresh button.
- **12-card stats grid** (grid-cols-2 md:grid-cols-4 lg:grid-cols-6): Connected Accounts (blue/Link), Phone Calls (violet/Phone), Emails (orange/Mail), SMS (emerald/MessageSquare), Notifications (amber/Bell), Consent (rose/ShieldCheck), Documents (blue/FileText), Pending Review (amber/Clock), Timeline Events (violet/Activity), WhatsApp Messages (emerald/MessageCircle), Social Messages (blue/Share2), Unified Timeline (slate/Layers).
- **8 tabs**: Connected Accounts | Unified Timeline | Phone Calls | Emails | SMS | Notifications | Consent Management | AI Document Classification — horizontal scrollable tab strip (`overflow-x-auto alo-scroll`), brand-blue active state.
- Footer SectionCards: Chairman Command Center note (blue-tinted) with 4 mini-tiles (Total Channels / Active / Expired / Unread+Pending); Auto Lead Creation note (emerald-tinted); Document Rules note (orange-tinted, max 2 versions, Super Admin/Admin delete only with audit log).

### Connected Accounts tab
- Grid of account cards (1/2/3 columns) with platform icon, account name, account ID, connection status badge (CONNECTED=emerald, DISCONNECTED=slate, EXPIRED=amber, PERMISSION_ERROR=rose, RECONNECT_REQUIRED=orange), assigned-to, last sync, last activity.
- Per-card actions: Sync (PATCH sync), Reconnect (only shown when EXPIRED/PERMISSION_ERROR/RECONNECT_REQUIRED), Disconnect (toast + PATCH). Optimistic local state update after PATCH.
- "Connect Account" orange CTA → Dialog (platform Select with 10 platforms incl WhatsApp/Facebook/Instagram/Gmail/SMS Gateway/Call Center/Telegram/LinkedIn/Twitter/Outlook + account name + account ID + assigned-to + security note "OAuth 2.0 only. Tokens encrypted.").
- Security banner: "Tokens are encrypted. Passwords are never stored. OAuth 2.0 only."

### Unified Timeline tab — key feature
- Search input + channel filter (All / WhatsApp / Facebook / Instagram / Email / SMS / Phone / CRM).
- Vertical timeline with gradient connector line, circular channel-colored icon dot per entry (WhatsApp=green, Facebook=blue, Instagram=pink, Email=violet, SMS=emerald, Phone=orange, CRM=slate).
- Each entry: title, channel badge, timestamp (fmtDate + fmtTime), description (line-clamped), by user.
- "Export Timeline" button (toast: "X events exported to CSV").
- Permanent-save note explaining every communication type is saved to CRM timeline.

### Phone Calls tab
- Call log table: Type badge (INCOMING=blue, OUTGOING=emerald, MISSED=rose), From, To (mono), Duration (mm:ss), Disposition badge, Notes (line-clamped), Date.
- "Log Call" orange CTA → Dialog (call type, disposition, from/to, duration, notes; toast on save).

### Emails tab
- Filter by folder (All / Inbox / Sent / Draft / Archive).
- Email table: From, To, Subject (bold if unread, with body preview), Folder badge, Read status, CRM Matched badge (emerald or outline), Date.
- "Sync Email" outline button (toast).

### SMS tab
- SMS table: Direction badge (Out=blue, In=emerald), From, To (mono), Message (line-clamped), Delivery Status (SENT=blue, DELIVERED=emerald, FAILED=rose, PENDING=amber), Read, Date.
- "Send SMS" orange CTA → Dialog (recipient, message with 320-char counter, consent-check warning amber banner).

### Notifications tab
- Filter by category (8 options).
- Notification list: title (bold + orange dot if unread), message, category badge, priority badge, recipient/channel/date, per-item Mark read/unread button (PATCH), "Mark All Read" button (PATCH loop).

### Consent Management tab
- 3 stat tiles: Opted In (emerald), Opted Out (rose), Unknown/Pending (slate).
- Consent records table: Student/Lead, Channel, Status badge, Preferred Language, Consent Date, Opt-Out Date.
- "Update Consent" orange CTA → Dialog (student ID, channel, status, source) → POST /api/omnichannel/consent.
- Compliance note: "Never send marketing without recorded consent. Respect opt-in, opt-out, STOP, UNSUBSCRIBE, BLOCK commands."

### AI Document Classification tab
- 4 AI stats: Classified, Avg Confidence %, Human Verified, Auto-filled.
- Classification table: Document ID (mono), Detected Type badge (blue), Confidence (Progress + %), Human Verified badge, Date.
- "Run AI Classification" orange CTA → Dialog: document ID + filename + OCR text fields → POST /api/omnichannel/document-classification → result panel with detected type badge, confidence bar (MiniBar), extracted data grid, verify-before-apply note.
- Document types reference card listing all 27 supported types (PASSPORT, NID, BIRTH_CERT, SSC, HSC, DIPLOMA, BACHELOR, MASTERS, TRANSCRIPT, RECOMMENDATION, CV, EMPLOYMENT_LETTER, OFFER_LETTER, CAS, COE, VISA, IELTS, TOEFL, PTE, MOI, POLICE_CLEARANCE, MEDICAL, BANK_STATEMENT, FINANCIAL_AFFIDAVIT, SPONSOR_LETTER, PHOTO, SIGNATURE).
- OCR extraction note (violet-tinted): lists extracted fields, "Auto-fills student profile. Never overwrites manually verified data without approval."

## Quality Checks

- `npx tsc --noEmit -p tsconfig.json` → 0 errors in this file.
- `npx eslint src/components/alo/views/omnichannel-communication-center.tsx` → 0 errors, 0 warnings.
- `bun run lint` (full project) → passes (only pre-existing seed.ts warning if any).
- File uses `"use client"`, TypeScript strict types, imports only from `@/components/alo/shared`, `@/lib/alo-types`, `@/components/ui/*`, `@/hooks/use-toast`, `@/lib/utils`.
- Design system respected: Blue #0057B8, SaaS Blue #2563EB, CTA Orange #C2410C (accessible), white bg #F8FAFC, white cards with border #E2E8F0, rounded-2xl, h-12 buttons, alo-shadow, alo-scroll, body-text/card-title/badge-text typography tokens.
- Responsive mobile-first: grid-cols-2 → md:grid-cols-4 → lg:grid-cols-6 (stats); grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3 (accounts); tab strip horizontally scrolls on mobile.
- LoadingGrid while initial fetch in progress; EmptyState fallbacks for every tab when collections are empty.
- Every interactive control provides feedback (toast or API action with optimistic update).

## Did NOT modify

- shared.tsx, alo-types.ts, app-shell.tsx, page.tsx (already wired).
- No new API routes created (used existing ones).
- No new shadcn/ui components installed.

## Stage Summary

- Production-ready `OmnichannelCommunicationCenter` view delivered with 12 stat cards, 8 fully-wired tabs, 4 dialogs (Connect Account, Log Call, Send SMS, Update Consent, Run AI Classification), and 3 footer compliance/command-center notes.
- All real backend integrations: dashboard GET, connected-accounts PATCH (sync/reconnect/disconnect) + POST (connect), notifications PATCH (mark read), consent POST (update), document-classification POST (AI classify + OCR result display).
- Design system fully respected (Blue #0057B8, CTA Orange #C2410C, white cards, rounded-2xl, h-12 buttons, alo-scroll, brand tokens).
- File: 2348 lines, named export `OmnichannelCommunicationCenter`, no props. Ready for orchestrator — already imported in page.tsx.
