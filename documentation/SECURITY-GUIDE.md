# ALO Education — Security Guide

## Authentication
- bcrypt password hashing (12 rounds)
- NextAuth.js JWT sessions (30-day expiry)
- HttpOnly, Secure, SameSite cookies
- OTP verification for email/phone
- Password reset with SHA-256 hashed tokens (1-hour expiry)
- Account lockout on failed attempts
- Audit logging for all login/logout events

## RBAC
- 57 permissions across 8 modules
- Role-based route protection via middleware.ts
- Backend permission checks on all protected APIs
- Data ownership scoping (ASSIGNED_ONLY, BRANCH, ALL)
- Frontend PermissionGate only hides UI — backend is final authority

## Data Protection
- Employee salary/bank/NID hidden behind PrivacyToggle + SensitiveField
- B2B provider details hidden from students, partners, counselors
- Document downloads require permission check
- All sensitive data access is audit-logged
- No public URLs for private documents

## API Security
- All non-public APIs require authentication (401 if no session)
- RBAC enforcement on API routes (403 if insufficient permissions)
- Input validation on all POST/PATCH endpoints
- CSRF protection via NextAuth
- Prepared statements via Prisma ORM

## File Upload Security
- File type validation
- File size limits (10MB)
- Private storage paths (no public URLs)
- Audit logging for all uploads
