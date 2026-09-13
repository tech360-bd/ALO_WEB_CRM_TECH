# 📧 ALO EDUCATION — EMAIL & COMMUNICATION INTEGRATION GUIDE

## 1. OFFICIAL SSL/TLS EMAIL SPECIFICATION
- **Email Address**: `noreply@aloeducation.com`
- **Incoming Mail Server**: `mail.aloeducation.com`
  - **IMAP Port**: `993` (SSL/TLS Required) — *Primary Sync Protocol*
  - **POP3 Port**: `995` (SSL/TLS Required)
- **Outgoing Mail Server**: `mail.aloeducation.com`
  - **SMTP Port**: `465` (SSL/TLS Required)
- **Authentication**: Mandatory (`SSL/TLS`)

---

## 2. SYSTEM EMAIL CAPABILITIES
The platform automatically sends transactional emails for:
- Account creation & email verification
- Password resets & MFA OTP tokens
- Consultation & appointment confirmations
- Application status milestone updates
- Counselor assignment notifications
- Security alerts & staff offboarding audits
