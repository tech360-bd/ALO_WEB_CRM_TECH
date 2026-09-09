# 🗄️ ALO EDUCATION CRM — DATABASE & SCHEMA DOCUMENTATION

## 1. OVERVIEW & ENGINE
- **Database Engine**: MySQL / MariaDB (production compatible with Prisma ORM v5/v6).
- **ORM**: Prisma Schema located at `prisma/schema.prisma`.
- **Encryption**: AES-256-GCM application-level column encryption for OAuth tokens and API secrets.

---

## 2. CORE PRISMA MODEL GROUPS

### Omnichannel Communication Models
- **`UccConversation`**: Primary conversation container. Stores `channel`, `provider`, `customerIdentity`, `assignedToUserId`, `priority`, `status`, and relational links to `MarketingLead` and `StudentProfile`.
- **`UccMessage`**: Messages within a conversation. Tracks `direction` (`inbound`, `outbound`, `internal_note`, `system`), `senderId`, `aiGenerated`, `aiApproved`, and metadata.
- **`SocialIntegration`**: OAuth integration records. Stores encrypted `accessToken`, `refreshToken`, `status`, `provider`, and `lastSyncAt`.

### Document & OCR Intelligence Models
- **`OcrJob`**: Asynchronous document OCR processing queue. Tracks `documentType`, `fileUrl`, `fileHash`, `status`, `confidenceScore`, and human review status.
- **`OcrFieldExtraction`**: Extracted field data (e.g. `passport_number`, `cgpa`) with field-level confidence scores and verification flags.
- **`FormFillSuggestion`**: Candidate form autofill suggestions linked to target entities (`student_profile`, `lead`). Tracks `isHighRisk` flag for sensitive identity/financial data.

### Staff & Security Governance Models
- **`EmployeeCommunicationProfile`**: Employee channel permissions, official phone/email access, working hours, and offboarding status.
- **`ApprovalRequest`**: Universal approval queue for AI replies, content publishing, autofills, and employee offboarding.
- **`IntegrationAuditLog`**: Immutable audit logs recording actor ID, action type (`OAUTH_START`, `EMPLOYEE_OFFBOARD`, `MESSAGE_SENT`), IP address, and timestamp.
