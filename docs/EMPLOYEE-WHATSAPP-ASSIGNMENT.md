# Employee WhatsApp Number & Permission Management — Administrator Guide (ALO Education)

This guide explains how to map each **verified Meta `phone_number_id`** to an employee, set permissions, and enforce sender authorization.

## Concepts

* **Phone number string** (`01805020102`) is what humans see. The **API uses `phone_number_id`** (numeric) — the admin must enter the `phone_number_id` returned by Meta in step 4 of `WHATSAPP-META-SETUP.md`. Until that ID is saved and verified, the UI shows `CONFIGURATION REQUIRED` and **blocks sending** from that number.
* Assignment is **server-enforced**: an employee may send from a company number only if (a) the number is `connected`, (b) the row `WhatsAppOfficialNumber.employeeOwnerId` (or `branch/department` routing) authorizes that employee, and (c) their permission set allows the action.
* Employees may **never** select another employee’s number unless explicitly authorized (the `POST /api/whatsapp/numbers` update is restricted to `super_admin`/`admin`). The send path (`POST /api/whatsapp/send`, `/api/crm/ucc/whatsapp/command`, `/api/whatsapp/routing`) re-checks `employeeId` → `officialPhone` mapping and falls back safely.

## Number plan (intended routing until verified)

| Number | Purpose | Meta `phone_number_id` (to fill) | WABA ID | Assigned employee |
|---|---|---|---|---|
| `01805020100` | Main / default / complaint / follow-up sender | — | — | — (system fallback) |
| `01805020101` | COO / 24-hour urgent support | — | — | COO |
| `01805020102` | Employee line 1 | — | — | — |
| `01805020103` | Employee line 2 | — | — | — |
| … | … | … | … | … |
| `01805020119` | Employee line 18 | — | — | — |

Do **not** mark any row as `connected` until its `phone_number_id` is verified with:

```bash
curl -s "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID?fields=display_phone_number,verified_name,quality_rating" \
  -H "Authorization: Bearer YOUR_LONG_LIVED_SYSTEM_USER_TOKEN"
```

A successful response showing `display_phone_number: "+880 1805-020100"` proves ownership.

## Admin UI: WhatsApp Number Assignment

1. Log in as **Super Admin** or **Admin** (permission `manage_settings` / `ADMIN` role). The page `/admin/whatsapp-numbers` is denied for other roles (403).
2. You see 20 rows, columns:
   * **Phone** (`phoneNumber`, `normalizedPhone`)
   * **Display name** (editable: `ALO Education Main`, `ALO Employee 3`, …)
   * **Owner type** (`ALO_MAIN`, `COO`, `EMPLOYEE`)
   * **Branch** (optional routing hint)
   * **Meta phone_number_id** (paste the verified value)
   * **Meta Business Account ID** (WABA ID, optional but recommended)
   * **Connection status** (`connected` if `metaPhoneNumberId` present + last provider check succeeded, else `CONFIGURATION REQUIRED` / `disconnected`)
   * **Last successful provider check** (timestamp)
   * **Assignment history** (via `WhatsAppNumberAssignmentAudit`)

3. For each employee line:
   * Enter `phoneNumber` (must be in `01805020100-01805020119` — the API rejects any other).
   * Enter `displayName` (e.g., `ALO Counselor — Rafi`).
   * Choose `ownerType = EMPLOYEE`, set `employeeOwnerId` to the target employee’s ID (found in `/admin/employees` → *Employee ID*), optionally set `branch`/`department`.
   * Paste `metaPhoneNumberId` and `metaBusinessAccountId` exactly as Meta shows.
   * Click **Save** → row triggers a server audit entry (`WhatsAppNumberAssignmentAudit` + `AloAuditLog` with actor, IP, timestamp, previous/new value). The `connectionStatus` flips to `connected` if the ID is syntactically valid; the true `verified` flag is set only after a successful webhook/API round-trip.

4. To change ownership: edit the same row, change `employeeOwnerId`, add a `reason` (e.g., “Resigned — reassign to new counselor”), Save. **Nothing is silently reassigned** — history is preserved.

## Permission matrix per employee

On the same page (or via `/admin/access-control-center` → *Communication Management* group) set per-employee flags (stored in employee permissions / `EmployeeCommunicationProfile`):

| Action | Meaning |
|---|---|
| `view` | See inbox threads assigned to them (scoped by `assignedToId`/`student.counselorId`). |
| `reply` | Send text replies via their assigned number. |
| `send_attachment` | Include images/PDFs/voice notes (enforced in `POST /api/storage/upload` + WhatsApp send). |
| `use_templates` | Use approved template messages (`WhatsApp templates` + `communicationTemplate`). |
| `assign` | Reassign a thread to another counselor (requires `MANAGER` scope). |
| `escalate` | Trigger SLA escalation. |
| `manage_settings` | **Admin only**: map numbers, edit Meta IDs. |

If any flag is missing, the UI **hides** the button and the API returns `403` — UI hiding alone is not security.

## How sending is authorized

1. Frontend calls `POST /api/whatsapp/send` or `POST /api/inbox/reply` with `channel=whatsapp`, `to`, `body`.
2. Server: `authenticateRequest` → resolves `auth.userId`, `auth.roles`, `auth.permissions`.
3. Server: `determineSenderNumber({ counselorId: auth.userId, branch, isComplaint, ... })` looks up `WhatsAppOfficialNumber` for that employee. If not `connected` or not assigned to that employee, it **rejects** or falls back only if policy permits:
   * `CONFIGURATION REQUIRED` → 400 with `error: "Sender number not configured"` (no silent fallback).
   * Safe fallback → main number `01805020100` **only** if `ALO policy` allows (currently enabled for `isComplaint`/`isFollowUp`/`isUrgent`; otherwise rejection).
4. Server: `sendWhatsAppMessage` checks `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`; if missing, returns `CONFIGURATION REQUIRED` and does **not** attempt Graph API.
5. On success: creates `SocialInboxMessage` (OUTBOUND), `WhatsAppMessageStatus` (`sent`), `TimelineEvent`, `CommunicationRoutingLog`; on status webhook updates the same rows.

An employee **cannot** spoof `explicitNumber` belonging to another employee unless their permission includes `manage_settings` — the check `if (ctx.explicitNumber && !isAuthorized)` blocks it server-side.

## Personal WhatsApp prohibition

By company policy, personal WhatsApp accounts are **not** connected to the official ALO CRM. If a future policy allows BYOD, it requires a separate flow with explicit consent + separate Meta credential, and is **not** implemented here.

## Diagnostics

* **GET /api/whatsapp/numbers** — list all rows + stats + `connectionStatus`. Requires auth.
* **GET /api/whatsapp/routing?counselorId=…** — logs `CommunicationRoutingLog` with `routingReason` (`student_counselor` / `branch_assignment` / `default_fallback`).
* **GET /api/whatsapp/webhook?** verification test (see WHATSAPP-META-SETUP.md).
* **Admin → SLA Monitor** (`/admin/sla-monitor`) shows per-employee overdue, escalation, and last response.
* **Audit**: `WhatsAppNumberAssignmentAudit` + `AloAuditLog` retain every mapping change with `previousValue`/`newValue`, actor, IP, reason. History is append-only.

## Safe testing without real messages

* Do **not** click *Send test message* in Meta without approval — it sends a real WhatsApp.
* Use the ALO draft mode: set `AI GENERATED DRAFT` in `/api/whatsapp/ai-reply` → review as human → **human approval required** before `POST /api/whatsapp/send` is called with that draft. The draft is labelled `AI GENERATED DRAFT` in the timeline.
* Local simulation: set `.env` without `WHATSAPP_TOKEN` → sends are short-circuited with `CONFIGURATION REQUIRED` and no Graph API call, but inbox/routing/timeline logic still runs.

## Rollback / revocation

* To suspend a number: set `activeStatus = 'inactive'` via the admin POST (requires Super Admin) → sends are blocked instantly (checks `activeStatus`).
* To reassign: follow step 3 — old assignment remains in `WhatsAppNumberAssignmentAudit` and `AloAuditLog`; no silent merge.
* To revoke a Meta token: rotate it in Meta Business Settings → update `.env` → `pm2 restart alo-education --update-env`. No restart exposes old token.

## Checklist before marking an employee live

- [ ] Meta `phone_number_id` verified via Graph API
- [ ] Row saved in `/admin/whatsapp-numbers` with employeeOwnerId
- [ ] `connectionStatus = connected` + last provider check timestamp recent
- [ ] Employee permissions `view` + `reply` at minimum; `send_attachment`/`use_templates` only if needed
- [ ] Test inbox → student → reply flow with `CONFIGURATION REQUIRED` hidden; if shown, do **not** approve live
- [ ] Audit entry visible in number history

Never expose `WHATSAPP_TOKEN` in the UI; it lives only in VPS `.env` and GitHub Secrets.
