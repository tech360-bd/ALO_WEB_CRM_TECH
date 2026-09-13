# 📡 ALO EDUCATION CRM — API & INTEGRATION SPECIFICATION

## 1. AUTHENTICATION & SECURITY HEADERS
- All protected API routes require standard session authentication via NextAuth cookies or Bearer Authorization tokens.
- Scope checking is automatically performed by `authenticateRequest(request)` in `@/lib/auth-middleware`.

---

## 2. CORE OMNICHANNEL & UCC ENDPOINTS

### OAuth Authorization APIs
- `POST /api/crm/ucc/oauth/start`
  - **Body**: `{ "provider": "meta_business" | "google_analytics" | "youtube" | "linkedin" | "x_twitter" }`
  - **Response**: `{ "success": true, "authorizationUrl": "...", "state": "..." }`
- `GET /api/crm/ucc/oauth/callback`
  - **Params**: `code`, `state`
  - **Behavior**: Validates CSRF state token (10-min TTL), encrypts returned access code using AES-256-GCM, stores encrypted `SocialIntegration`, and redirects to `/admin/integration-center`.

### Conversation & Messaging APIs
- `POST /api/crm/ucc/conversations/[id]/reply`
  - **Body**: `{ "content": "...", "messageType": "text", "isInternalNote": boolean, "aiGenerated": boolean }`
  - **Behavior**: Appends message to timeline, updates conversation `lastMessageAt`, and creates `IntegrationAuditLog` entry.
- `POST /api/crm/ucc/conversations/[id]/assign`
  - **Body**: `{ "assignedToUserId": "...", "assignedRole": "..." }`
  - **Behavior**: Updates chat ownership, posts automated system notification to the thread.

### Document Processing & OCR APIs
- `POST /api/crm/ucc/documents/upload`
  - **Body**: `FormData` containing file attachment, `studentId`, `conversationId`.
  - **Behavior**: Performs MIME allowlist validation (<20MB limit), calculates SHA-256 hash, stores file securely, and creates an `OcrJob`.
- `POST /api/crm/ucc/ocr/process`
  - **Body**: `{ "ocrJobId": "..." }`
  - **Behavior**: Extracts key fields (`passport_number`, `ielts_score`, `cgpa`), computes field confidence scores, and generates candidate `FormFillSuggestion` records.
- `POST /api/crm/ucc/form-fill/approve`
  - **Body**: `{ "suggestionId": "...", "action": "approve" | "reject" | "edit", "editedValue": "..." }`
  - **Behavior**: Enforces human approval for high-risk identity and financial fields before updating `StudentProfile` or `MarketingLead`.

### Staff Management & Offboarding APIs
- `POST /api/crm/ucc/employee-profiles/offboard`
  - **Body**: `{ "employeeId": "...", "reassignToEmployeeId": "...", "offboardingNote": "..." }`
  - **Behavior**: Atomic execution — invalidates active sessions, revokes channel permissions, reassigns conversations/leads/tasks, and records audit trail.
