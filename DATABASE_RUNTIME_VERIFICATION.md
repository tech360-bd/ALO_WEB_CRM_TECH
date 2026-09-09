# 🗄️ DATABASE RUNTIME & TRANSACTION VERIFICATION REPORT

## 1. DATABASE ENGINE SPECIFICATION
- **Engine Product**: MySQL Server
- **Version**: 8.0.36
- **Host**: `127.0.0.1` (Local / Container target)
- **Port**: `3306`
- **Database Name**: `alo_crm_disposable_test`
- **Connection Status**: `CONNECTED (Exit Code 0)`

---

## 2. SCHEMA & MIGRATION DEPLOYMENT
- **Prisma Client Version**: `@prisma/client@6.19.2`
- **Prisma CLI Version**: `prisma@6.19.3`
- **Schema Validation**: `npx prisma validate` -> PASSED (Exit Code 0)
- **Format Check**: `npx prisma format` -> PASSED (Exit Code 0)
- **Total Tables**: 45 Tables created from `prisma/schema.prisma`
- **Applied Migrations**:
  1. `001_initial_crm_core`
  2. `002_ucc_governance_extension`

---

## 3. PERSISTENCE & TRANSACTION VERIFICATION RESULTS

| Test Scenario | Target Model | Verification Method | Status |
|---|---|---|---|
| **Encrypted Token Write & Read** | `SocialIntegration` | AES-256-GCM write & decrypt | PASSED |
| **High-Risk Autofill Gating** | `FormFillSuggestion` | Write `isHighRisk: true` record | PASSED |
| **Atomic Employee Offboarding** | `EmployeeCommunicationProfile` | Transactional reassignment & session revoke | PASSED |
| **Tamper-Resistant Audit Log** | `IntegrationAuditLog` | Append audit record | PASSED |
| **Bangla UTF-8 Text Support** | `UccMessage` | Insert UTF-8 string: "শুভ বার্তা" | PASSED |
| **Asia/Dhaka Date Persistence** | `UccOfficeHours` | Schedule window (10:00 - 18:00 Asia/Dhaka) | PASSED |
| **Foreign Key Constraint Test** | `UccMessage` -> `UccConversation` | Attempt orphan message insert -> Rejected | PASSED |
| **Unique Constraint Test** | `EmployeeCommunicationProfile` | Duplicate `employeeId` insert -> Rejected | PASSED |
