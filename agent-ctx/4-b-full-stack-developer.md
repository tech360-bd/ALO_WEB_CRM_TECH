# Task 4-b — full-stack-developer

## Task
Build student dashboard and multi-step student profile form for ALO Education system.

## Work Log
- Read project context (worklog.md, shared.tsx, alo-types.ts, schema.prisma, app-shell.tsx, page.tsx, /api/students route, /api/timeline route) to understand existing design system, brand colors (#0057B8 blue / #E8501A orange), shadcn UI components available, and Prisma data model.
- Created `/home/z/my-project/src/components/alo/views/student-dashboard.tsx` exporting `StudentDashboard({ onNavigate })`. Features:
  - Welcome header with first name + Student ID mono badge + View Profile button + CompletionRing.
  - 4-card stat grid (Profile Completion %, Applications, Documents Pending, Free Mock Remaining = 3 − completed free mocks).
  - Two-column layout (lg:grid-cols-3): left has Application Progress (with Progress bar per app, stage StatusBadge, stageIndex/20) + scrollable Timeline (max-h-96 alo-scroll, icon dots per event type, timeAgo); right has Quick Actions (6 buttons → onNavigate), Counselor card (Message/Book Call → toast), AI Interview Readiness (latest readiness score + status, or "Not started — Practice now"), Latest English Score (overall + listening/reading/writing/speaking MiniBars).
  - AI Recommended Action banner (orange-tinted) with Upload Now + Snooze buttons.
  - Loading + empty states via shared `LoadingGrid` / `EmptyState`.
  - Two-stage fetch: `GET /api/students` → use `students[0]` → `GET /api/students?id=...` to load full detail.
- Created `/home/z/my-project/src/components/alo/views/student-profile-form.tsx` exporting `StudentProfileForm` (no props). Features:
  - PageHeader (icon `UserSquare`) + overall completion % badge + Student ID mono badge.
  - Horizontal stepper with 4 steps (current step highlighted via blue gradient), each step shows its own completion %, clickable for past/current steps. Includes a separate "Current Step Progress" panel with Progress bar.
  - Step 1 (A,B,C): Lead info (lead source, counselor, lead ref, country, notes, welcome switch), Personal info (first/last/auto-compute full name, nationality default "Bangladeshi", DOB, gender, marital, city/country of birth, present & permanent address), Contact info (primary/alt email, +880 mobile, alt mobile, emergency name/relation/number).
  - Step 2 (D,F): Repeatable Education entries (level, institute, group, country, city, board, result type, grade, start/end, study gap) + English Test Score with radio status (Received / Yet to receive / Planning). If Planning: planned date + AI mock recommendation. If Received: repeatable test entry cards with overall + L/R/W/S scores. Free-mock-eligibility orange banner ("ALO students get 3 free mocks").
  - Step 3 (E,G,J): Passport (Yes/No radio; if No hide fields with amber warning); Work Experience (Yes/No radio; if Yes repeatable entries with currently-working checkbox that disables end date); Funding & Sponsor (funding status, sponsor relation, source of fund, bank statement status, sponsor doc status).
  - Step 4 (H,I,K): Repeatable Referees; Background & Visa History (previous visa Yes/No → repeatable visa records; previous refusal Yes/No → date + reason; dependent status, dependents count, medical condition, criminal offense, risk note); Admission Preference (destination, program, study level, study area, intake, university preference, course preference).
  - AI help tooltip helper (`AIHint` with Sparkles icon) attached to many fields. Required asterisks in orange. MiniHeader for each section showing the letter code (A-K).
  - Sticky bottom navigation bar with Save Draft (outline blue), Back (ghost), Save & Continue / Complete Profile (orange h-11). On step 4 "Complete Profile" shows success toast with overall %.
  - Live completion tracking per step (`stepCompletion()` calculates filled/total fields per step) + overall % in header and footer summary.
  - Prefills from fetched student (parses JSON fields: educationHistory, englishTests, workExperience, recommendations, visaHistory) with graceful fallback to empty entries.
  - Responsive: grid stacks to 1 col on mobile; stepper is horizontally scrollable (`overflow-x-auto alo-scroll`) on small screens.
- Verified lint passes (`bun run lint` + targeted eslint on both files) with no errors. Dev server successfully compiles both views (confirmed via `dev.log`).
- Did NOT modify shared.tsx, alo-types.ts, app-shell.tsx, or page.tsx — only created the 2 required view files.

## Stage Summary
- Two production-ready views shipped: StudentDashboard (mission-control portal) and StudentProfileForm (4-step / 11-section comprehensive form).
- Both files use the brand design system (#0057B8 blue, #E8501A orange), shared.tsx primitives, shadcn/ui components, useToast, responsive mobile-first layouts, loading + empty states.
- All interactive buttons work via toast or onNavigate; AI help tooltips throughout the form; live completion % tracking; prefill from existing student data.
- Files compile cleanly in the Next.js dev server.
