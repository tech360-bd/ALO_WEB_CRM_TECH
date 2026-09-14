# Bangla Intake AI — ID-First (Website / WhatsApp / Webchat / Facebook) — Super-Admin Managed

One brain for all channels. Fulfills Bengali spec: **website / counselor WhatsApp / web chat → first asks Student ID; if provided informs independent submission without help; handles Bangla/English/docs/voice → analyzes → logical answer + university/country suggestion; office-hours human-like + retains conversation memory; sequential per-question; managed via Super-Admin Dashboard.**

## Architecture
- `src/lib/ai-agents/student-intake-agent.ts` — state machine `ASK_ID → VERIFYING → INFORMED_INDEPENDENT → COUNSELING`, canonical `AE-YYYYXXXXXX` validation, Bangla/English/Banglish detection, office-hours `Asia/Dhaka 10:00-19:00 Sat-Thu`, `AgentMemory` (per `senderId+channel`) + `TimelineEvent` fallback, sequential (`history.slice(-20)`, caller must await), RAG via `aiGateway` (Groq real) + rule fallback with country suggestions.
- `src/app/api/ai/student-intake/route.ts` — unified endpoint `POST` (website/webchat/any) + `GET` contract. Public, no auth required; officeHours flag.
- `src/app/api/whatsapp/webhook/route.ts` — patched to delegate `text|image|document|audio` → `handleStudentIntake` (ID-first) before legacy reply, with STOP respect, idempotency, media ingestion preserved, outbound via Graph.
- `src/app/api/facebook/webhook/route.ts` — extended: page `object==='page'` messaging events `sender.id`, `mid` dedupe, same intake brain, outbound via Graph `me/messages`.
- `src/app/api/admin/ai/student-intake/route.ts` — Super-Admin governance: `GET` health, `PUT` (SUPER_ADMIN only) enable/disable/prompt, audit logged.
- `src/components/admin/StudentIntakeControlPanel.tsx` — embedded in `EnhancedSuperAdminControlCenter`, shows channels/lang/multimodal/office, probe tester, links.
- `src/components/ai/WebChatWidget.tsx` — embed on any page `import WebChatWidget from '@/components/ai/WebChatWidget'`; handles text + file (image/doc) + voice transcription (prompt fallback; replace with Web Speech API / Whisper as needed).

## Flow
1) Every inbound message → `loadMemory(senderId, channel)`; if `ASK_ID` and no `AE-…` in text → reply `ask_id` (BN/EN) + office note + save.
2) If `AE-YYYYXXXXXX` present → `verifyAndInform` via `db.student` (+ legacy) → on hit: `INFORMED_INDEPENDENT` + message *"আপনি কোনো সহায়তা ছাড়াই স্বাধীনভাবে আপনার আবেদন জমা দিতে পারবেন — My Applications → New Application"* (EN equivalent); persists `studentDbId`.
3) Next turns → `COUNSELING`: doc/voice ack + `counselWithRag` → university/country shortlist (UK/Manchester etc. / Canada / Australia) + next step; multilingual, `history` aware, sequential.

## Usage

### Website / Webchat
```bash
curl -X POST http://localhost:3000/api/ai/student-intake \
 -H 'Content-Type: application/json' \
 -d '{"channel":"webchat","senderId":"web-123","text":"Hello"}'
# → ask_id reply

curl -X POST http://localhost:3000/api/ai/student-intake \
 -H 'Content-Type: application/json' \
 -d '{"channel":"webchat","senderId":"web-123","text":"My ID is AE-2025000123"}'
# → verified_independent notice

curl -X POST http://localhost:3000/api/ai/student-intake \
 -H 'Content-Type: application/json' \
 -d '{"channel":"webchat","senderId":"web-123","text":"UK MSc Data Science জন্য কোন ইউনিভার্সিটি ভালো?"}'
# → Bangla counseling + 2 suggestions

# Media + voice
curl -X POST http://localhost:3000/api/ai/student-intake \
 -H 'Content-Type: application/json' \
 -d '{"channel":"website","senderId":"web-123","text":"transcript here","mediaType":"voice","mediaInfo":{"transcription":"UK visa requirement কী?"}}'
```

Embed widget:
```tsx
import WebChatWidget from '@/components/ai/WebChatWidget';
export default function Page(){ return <WebChatWidget channel="webchat" /> }
```

### WhatsApp (Cloud API)
Inbound `POST /api/whatsapp/webhook` already wired — no client change. Text, image, document, audio all routed via intake. First message → asks ID; ID → independent notice; thereafter counseling.

### Facebook Messenger
Inbound `POST /api/facebook/webhook` with `object:page` + `messaging[].message` routed same; outbound via `graph.facebook.com/me/messages`.

### Super-Admin
Dashboard → **Bangla Intake AI** card (inside Super Admin Control Center). Health:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/ai/student-intake
```
Update (SUPER_ADMIN):
```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"paused","description":"Paused for exam week"}' \
  http://localhost:3000/api/admin/ai/student-intake
```

### Office Hours
`isOfficeHours()` Dhaka UTC+6, 10-19 Sat-Thu. Friday = after-hours banner removed but still queues; UI shows `typing sequentially…`.

### Memory
`AgentMemory { agentId: STUDENT_INTAKE_BN, key: intake:channel:senderId, value: JSON(IntakeContext), memoryType:intake }` capped 20 turns; fallback `TimelineEvent stage AI_MEMORY`.

### Voice
- WhatsApp `audio` → `transcription` field if Whisper configured (pass `mediaInfo.transcription`); else `body=[Audio]` but intake still acknowledges.
- Web widget prompt fallback; swap with `webkitSpeechRecognition` or server Whisper + set `mediaType:voice`.

## Security
- Webhooks keep signature verification; intake inherits idempotency + archive + audit.
- Admin governance `SUPER_ADMIN` only, audit logged `INTAKE_AGENT_UPDATE`.
- No fake data; all replies derived from DB or AI gateway; audit via `AloAuditLog` + `PortalAuditLog`.

## Related
- Auto-create Student ID + document: `POST /api/documents/auto-upload` (multipart `file+email+name` → AE-YYYYXXXXXX + portal + Application.APPLICATION_DRAFT when `fullApplication=true`) — see `AUTO_CREATE_STUDENT_ID_GUIDE.md`.
