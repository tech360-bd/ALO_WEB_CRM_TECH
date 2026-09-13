# 🛠️ SYSTEM TROUBLESHOOTING & DIAGNOSTIC GUIDE

## 1. COMMON OPERATIONAL ISSUES & RESOLUTIONS

### A. OAuth Connection Failures
- **Symptom**: `OAuth error: missing_code_or_state` or `invalid_state`.
- **Cause**: CSRF state parameter expired (>10 minutes) or callback URL mismatch.
- **Fix**: Re-initiate connection from `/admin/integration-wizard`. Verify `NEXTAUTH_URL` matches the registered Redirect URI in Meta / Google Developer Portals.

### B. Webhook Signature Validation Failure
- **Symptom**: Inbound Meta/WhatsApp messages returning `403 Signature Mismatch`.
- **Cause**: `META_APP_SECRET` mismatch or header format difference.
- **Fix**: Verify `META_APP_SECRET` in `.env`. Ensure raw body stream is passed to `validateMetaWebhookSignature()` before JSON parsing.

### C. OCR Field Extraction Low Confidence Score
- **Symptom**: Document uploaded but fields marked `review_required` with 0 confidence.
- **Cause**: Image glare, low resolution (<150 DPI), or unsupported file format.
- **Fix**: Ask student to upload a clear PDF or 300 DPI image scan. Counselor can manually verify or correct extracted fields via the Form Autofill Approval modal.

### D. Offboarded Employee Still Receiving Notifications
- **Symptom**: Reassigned chats triggering notifications for offboarded staff.
- **Cause**: Incomplete conversation reassignment during manual edit.
- **Fix**: Use the atomic offboarding endpoint (`/api/crm/ucc/employee-profiles/offboard`), which programmatically transfers all `assignedToUserId` values to the replacement employee ID.
