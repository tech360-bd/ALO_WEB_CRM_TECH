# FIX-TEMPLATE-LITERALS — main agent

## Task
Fix 7 broken TypeScript view files in `/home/z/my-project/src/components/alo/views/` whose template literals were mangled by an earlier sed-based refactor, and restore correct `useStudentId` hook usage.

## Files touched (13 total — 7 listed + 6 same-pattern siblings)

### Listed (7) — explicitly required by user:
1. `student-cv.tsx` — `/api/student/cv` GET/POST + `/api/cv/generate` POST
2. `student-notifications.tsx` — `/api/student/notifications` GET/PATCH
3. `student-referrals.tsx` — `/api/student/referrals` GET/POST
4. `student-sop.tsx` — `/api/student/sop` GET/POST + `/api/sop/generate` POST
5. `student-timeline.tsx` — `/api/timeline` GET (with `take=50`)
6. `student-visa-checklist.tsx` — `/api/student/visa-readiness` GET
7. `student-visa-readiness.tsx` — `/api/student/visa-readiness` GET

### Additional (6) — same sed-mangled pattern, blocking "verify 0 errors":
8. `student-compare.tsx` — `/api/course-finder/compare` GET
9. `student-messages.tsx` — `/api/inbox/unified` GET/POST
10. `student-mock-tests.tsx` — `/api/mock-tests` GET
11. `student-offers.tsx` — `/api/applications` GET/PATCH
12. `student-payments.tsx` — `/api/finance` GET
13. `student-shortlist.tsx` — `/api/course-finder/shortlist` GET/DELETE

## Pattern applied to every file
- `"use client";` at top
- `import { useStudentId } from "@/hooks/use-student-id";`
- `import { cn } from "@/lib/utils";`
- `const { studentId } = useStudentId();` as first line inside component
- All fetch URLs: backtick template literals — e.g. `` fetch(`/api/student/sop?studentId=${studentId}`) ``
- All POST/PATCH/DELETE bodies: `studentId: studentId || ""`
- `React.useEffect` deps: `[studentId]` (was previously `[]`)
- Early return with `<PageHeader>` + `<EmptyState icon="LogIn" title="Please log in" />` when `studentId === null`
- Cancellation guard (`let cancelled = false;` + cleanup) on every fetch
- Removed `const STUDENT_ID = "";` placeholder constants everywhere
- Replaced string-concat conditional classNames with `cn(...)`
- ALO color palette throughout: #0066CC, #F37021, #0B2447, #5A7299, #DCE8F5, #EAF3FF, #F7FAFE
- Mobile-first responsive (`grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3`, `p-4 lg:p-6`)

## Verification
- `npx tsc --noEmit --skipLibCheck` → exit code 0, **0 errors**
- `bun run lint` → ESLint exits 0, no errors or warnings

## Notes for next agent
- `useStudentId()` returns `{ studentId: string | null, loading: boolean }`. The `loading` flag was not needed by any of these views because the early-return-on-null pattern is sufficient (the hook resolves quickly from sessionStorage / auth session).
- All 13 files now have a typed state interface instead of `any[]` for the data they receive.
- All files export both a named export and a default export for compatibility.
