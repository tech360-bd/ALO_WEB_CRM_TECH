# ALO Education — RBAC Guide

## Roles
| Role | Access Level |
|------|-------------|
| SUPER_ADMIN | Full system access |
| ADMIN | System management (permission-based) |
| HR_MANAGER | HR operations |
| BRANCH_MANAGER | Branch operations |
| COUNSELOR | Assigned students only |
| APPLICATION_TEAM | Application processing + B2B |
| VISA_OFFICER | Visa cases |
| VISA_INTERVIEW_OFFICER | Visa interviews |
| FINANCE | Payments, commission, payroll |
| MARKETING_MANAGER | Full marketing control |
| MARKETING | Limited marketing (3 approved users) |
| FRONT_DESK | Front desk operations |
| SUPPORT_STAFF | Support operations |
| PARTNER | Own company only |
| STUDENT | Own profile only |
| ENGLISH_TRAINER | English test management |
| MOCK_TEST_ADMIN | Mock test management |

## Permission Modules
1. **Student** (7 permissions): view_assigned, view_all, view_partner_referred, update_assigned, export, view_internal_notes, view_private_notes
2. **Documents** (9 permissions): view, upload_on_behalf, request, review, approve, reject, download, delete, archive
3. **Communication** (8 permissions): view_assigned, send_whatsapp, send_email, send_sms, use_ai_reply, approve_ai_reply, internal_comment, student_visible_comment
4. **Application** (6 permissions): view_assigned, create_draft, update_stage, submit_to_university, view_partner_submission_channel, view_commission_amount
5. **Visa** (6 permissions): view, comment_internal, request_documents, interview_schedule, readiness_view, status_update
6. **Marketing** (9 permissions): dashboard.view, content.generate, image.generate_request, video.generate_request, social.reply, auto_post, comment_to_lead, approve_ai_content, reports.view
7. **HR Self** (7 permissions): self_profile.view, self_attendance.view, self_commission.view, self_bonus.view, self_increment.view, self_salary.view, self_documents.view
8. **Private HR** (5 permissions): salary.manage, increment.manage, bonus.manage, attendance.manage, performance.manage

## Permission Matrix
Access via: Super Admin → Permission Matrix (tick-box UI)
API: `GET/PATCH /api/permissions`
Backend enforcement: `src/lib/access-control.ts`
