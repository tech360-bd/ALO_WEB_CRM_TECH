# Weekly AI University Verification Agent Specification

## Agent Overview
- **Agent Name:** `UniversityCourseVerificationAgent`
- **Default Schedule:** Every Sunday at 00:00 (Asia/Dhaka)
- **Targeting Policy:** Inspects official university course pages, tuition fee pages, entry requirement pages, and scholarship portals.
- **Safety Policy:** 100% compliant with robots.txt, domain rate-limiting (max 2 requests/sec), and access policies.
- **Change Detection:** Computes SHA-256 page content hashes and creates staged field items in the Super Admin Approval Queue.
