# ALO EDUCATION — CANONICAL CSV DATA IMPORT MAPPING GUIDE

## Standard Headers & Automatic Aliases
- **University:** `official_name`, `University`, `University Name`, `Institution`
- **Course:** `official_course_title`, `Course`, `Course Name`, `Program`, `Programme Title`
- **Tuition Fee:** `tuitionFee`, `Tuition Fee`, `International Fee`, `Annual Tuition`
- **Intake:** `intakeMonth`, `Intake`, `Start Month`, `Start Date`
- **Requirements:** `academicRequirements`, `Entry Requirement`, `IELTS`, `GPA`
- **Sources:** `sourceUrl`, `Official Course URL`, `Fee Source`

## Transaction & Approval Lifecycle
1. **UPLOADED:** CSV/XLSX uploaded securely via `/admin/data-import`.
2. **MAPPED:** Headers automatically matched to database fields.
3. **VALIDATED:** Enforces non-negative fees, valid HTTP/HTTPS URLs, and non-expired intakes.
4. **STAGED:** Staged into `CrmImportBatch` in database transaction.
5. **SUPER ADMIN REVIEW:** Material changes sent to `/admin/change-approval` approval queue.
6. **PUBLISHED:** Only authorized Super Admin actions publish to production website.
