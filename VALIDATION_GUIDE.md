# ALO EDUCATION — DATA VALIDATION GUIDE

- **Formula Injection Safeguard:** Values starting with `=`, `+`, `-`, `@` are sanitized with a leading quote.
- **Maximum File Size:** 20 MB limit enforced on upload.
- **RBAC Security:** Anonymous & Non-Admin users blocked with `401 Unauthorized` or `403 Forbidden`.
- **URL Verification:** Verifies HTTPS protocol, response headers, and matching official university domain.
- **Duplicate Prevention:** Matches normalized titles, award types, campus, and study mode.
