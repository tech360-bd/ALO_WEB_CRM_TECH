# Unified Communication Center — Employee Guide

> Mandate §75, §80. What an authorized employee sees and does at
> `/employee/communications`.

## Sections (RBAC-filtered — you only see authorized data)
- **My Inbox** — assigned + unassigned (if permitted) conversations.
- **My Conversations** — full timeline, attachments, message status.
- **My Leads / My Tasks / My Follow-ups** — CRM work queue.
- **My SLA / My Escalations** — deadlines and escalations relevant to you.
- **Notifications** — assignment/SLA/escalation alerts (no private content leak).
- **Internal Notes** — `INTERNAL_NOTE` type; **never sent to any provider** (§21).
- **Knowledge / AI Assistant** — suggestions require your review before send (§42).

## Actions (mandate §20) — gated by permission
reply · forward (where supported) · attach · add internal note · assign /
reassign · change priority · tag · create lead · create task · schedule
follow-up · mark pending · resolve · reopen · escalate.

## AI assistance (mandate §42, §49)
AI may summarize, suggest replies, translate, classify, and recommend next
actions. **AI never silently sends an external message.** External send follows
`AI suggestion → employee review → approval → provider send` unless a separately
approved automation explicitly authorizes autonomous sending.

## Honesty rule
Provider status badges you see are **computed**, not decorative. A provider shows
`LIVE_VERIFIED` (green) only after a real live test; otherwise it shows
`CONFIGURATION_REQUIRED` / `OAUTH_REQUIRED` / `LIVE_TEST_PENDING` (yellow) or
`ERROR` (red). You will never see a fake "Connected".

## Verification status
The employee workspace UI is `PLANNED` (the data layer, RBAC, and AI-assist
contracts exist; the full screen set is not all wired). Marked honestly.
