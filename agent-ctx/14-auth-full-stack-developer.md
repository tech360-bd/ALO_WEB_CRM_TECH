# Task ID: 14-auth — Authentication Views (Login, Register, Reset Password, Verify OTP)

**Agent:** full-stack-developer
**Status:** COMPLETE — lint 0/0 on 4 new files, typecheck 0 errors
**Files created (exactly 4):**
1. `/home/z/my-project/src/components/alo/views/auth-login.tsx` — exports `AuthLogin`
2. `/home/z/my-project/src/components/alo/views/auth-register.tsx` — exports `AuthRegister`
3. `/home/z/my-project/src/components/alo/views/auth-reset-password.tsx` — exports `AuthResetPassword`
4. `/home/z/my-project/src/components/alo/views/auth-verify-otp.tsx` — exports `AuthVerifyOtp`

All 4 components are `"use client"`, accept `{ onNavigate: (v: ViewKey, slug?: string) => void }` props, use `useToast` from `@/hooks/use-toast`, and import `Icon` from `@/components/alo/shared` and `ViewKey` from `@/lib/alo-types`.

## Props contract (all 4 views)
```tsx
interface AuthXxxProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}
export function AuthXxx({ onNavigate }: AuthXxxProps) { ... }
```

## AuthLogin — key implementation details
- Uses `signIn("credentials", { email, password, redirect: false })` from `next-auth/react` (cleaner than raw fetch — handles CSRF + form encoding internally; matches the task's "simpler approach" intent).
- On success: `GET /api/auth/session` → reads `session.user.role` → maps via `ROLE_DASHBOARDS` (16 roles) → `onNavigate(dashboard)` + success toast.
- `ROLE_DASHBOARDS` mapping:
  - `SUPER_ADMIN` → `super-admin-dashboard`
  - `ADMIN` → `crm`
  - `COUNSELOR` → `counselor-dashboard`
  - `STUDENT` → `student-dashboard`
  - `PARTNER` → `partner-admin-dashboard`
  - `VISA_OFFICER`, `VISA_INTERVIEW_OFFICER` → `visa`
  - `MARKETING_MANAGER`, `MARKETING` → `marketing`
  - `FINANCE` → `finance-dashboard`
  - `HR_MANAGER` → `hrm-dashboard`
  - `APPLICATION_TEAM` → `application-team`
  - `ENGLISH_TRAINER`, `MOCK_TEST_ADMIN` → `english-test-dashboard`
  - `BRANCH_MANAGER`, `FRONT_DESK` → `crm`
  - default → `student-dashboard`
- Quick role logins (2×2 grid, password "alo123"):
  - Student → `student@aloedu.com`
  - Partner → `partner@aloedu.com`
  - Employee → `counselor@aloedu.com`
  - Super Admin → `superadmin@aloedu.com`
- 3 portal links below card (Student/Partner/Employee Portal) → onNavigate with respective dashboard view.
- Security note: "Your password is encrypted with bcrypt. All logins are audit-logged for security."

## AuthRegister — key implementation details
- Role selector (shadcn Select): STUDENT / PARTNER only. Note: "Employees are created by Super Admin only."
- When role=PARTNER: amber banner "Partner accounts require ALO Education approval before activation."
- Fields: name (min 3), email (regex), phone (optional, regex), password (min 8, show/hide toggle, strength meter), confirm password (mismatch warning), terms checkbox.
- Password strength meter: 4 levels (Weak/Fair/Good/Strong) — scored on length + uppercase + digit + symbol.
- `POST /api/auth/register` body `{ name, email, password, role, phone }`. On success:
  - Toast (role-specific message).
  - If `data.otp` returned (dev only): toast with OTP value.
  - Sets `window.__aloOtpEmail = email` BEFORE calling `onNavigate("auth-verify-otp", email)` — this is the side-channel that AuthVerifyOtp reads on mount.
- "Already have an account? Sign In" → onNavigate auth-login.

## AuthResetPassword — key implementation details
- 3-step flow controlled by local `step` state: `"request"` → `"reset"` → `"success"`.
- Visual stepper: 3 StepDot components with check icon when done.
- Step 1: email input → `POST /api/auth/reset-password { email }`. On success: advance to step 2; if `data.resetToken` (dev only): pre-fill token field + show amber dev notice with copy button.
- Step 2: token input (monospace, paste-friendly, pre-filled in dev) + new password (min 8, show/hide) + confirm password → `PATCH /api/auth/reset-password { token, newPassword }`. On success: advance to step 3. "Use a different email" link resets back to step 1.
- Step 3: emerald CheckCircle2 + "Password Reset Successful" + "Sign In" button → onNavigate auth-login.
- Security note: "Reset tokens are single-use, hashed (SHA-256), and expire after 1 hour. All password resets are audit-logged."

## AuthVerifyOtp — key implementation details
- On mount: reads `window.__aloOtpEmail` (set by AuthRegister) and pre-fills the email field; clears the window property after consuming to prevent leaks.
- Uses shadcn `InputOTP` with 6 `InputOTPSlot` (size-12, text-lg) for the 6-digit code.
- Verify button disabled until `otp.length === 6`.
- `POST /api/auth/verify-otp { email, otp }`. On success: switch to success state + toast.
- Resend: 60-second countdown timer (`RESEND_COUNTDOWN = 60`) via `useEffect` + `setTimeout`. Button shows "Resend in {N}s" while counting down, "Resend OTP" when ready. `PATCH /api/auth/verify-otp { email }` on resend → toast + new devOtp hint + reset countdown + clear OTP field.
- Success state: emerald CheckCircle2 (size-16) + "Email Verified!" h1 + "Sign In" button → auth-login + "Back to home" link → public-home.
- Security note: "OTPs are single-use, expire after 10 minutes, and are audit-logged. Never share your code with anyone — ALO Education staff will never ask for it."

## Design system (consistent across all 4 views)
- Background: `bg-white` with `min-h-screen px-4 py-10 sm:py-16` wrapper.
- Card: `rounded-2xl border-2 border-[#E2E8F0] shadow-sm` + `max-w-md mx-auto`.
- Headings: `text-[#0057B8]` (h1 = text-2xl sm:text-3xl font-bold).
- CTAs: `h-12 w-full bg-[#E8501A] text-white hover:bg-[#E8501A]/90 text-sm font-semibold`.
- Inputs: `h-11` with leading icon at `left-3` and `pl-9` padding.
- Error blocks: `border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700` with `AlertCircle` icon.
- Security notes: `bg-[#e8f0fb]/60 px-3 py-2 text-xs text-[#0057B8]` with `ShieldCheck` icon.
- Dev notices: `border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800` with `Info` / `FlaskConical` icon.
- Success states: emerald `CheckCircle2` in `bg-emerald-50` circle (size-16) + emerald text.
- ALO logo: `size-12` rounded-2xl with `bg-alo-gradient alo-shadow text-white` containing `GraduationCap` icon + "ALO Education" wordmark. Clickable → onNavigate "public-home".
- All forms have `noValidate` + manual validation (required, email regex, password ≥8, passwords match).
- All submit buttons have loading states with `Loader2 animate-spin` + status text.
- Mobile-first responsive: single column by default; `sm:` breakpoints for portal grid (3-col).
- Touch targets ≥44px (h-11 inputs, h-12 buttons).

## Lint & typecheck
- `bunx eslint src/components/alo/views/auth-{login,register,reset-password,verify-otp}.tsx` → **0 errors, 0 warnings**.
- `bunx tsc --noEmit --skipLibCheck` → **0 errors** total.
- Pre-existing lint errors in `/api/auth/reset-password/route.ts` (2) and `/api/auth/verify-otp/route.ts` (1) — using `require()` for crypto/bcryptjs — are NOT in this task's scope and were not modified.

## Wiring note for orchestrator
The 4 auth views are **not yet wired** into `src/app/page.tsx`. The orchestrator should:
1. Add 4 imports to `page.tsx`:
   ```ts
   import { AuthLogin } from "@/components/alo/views/auth-login";
   import { AuthRegister } from "@/components/alo/views/auth-register";
   import { AuthResetPassword } from "@/components/alo/views/auth-reset-password";
   import { AuthVerifyOtp } from "@/components/alo/views/auth-verify-otp";
   ```
2. Add `"auth-login", "auth-register", "auth-reset-password", "auth-verify-otp"` to the `PUBLIC_VIEWS` array (so they render in `PublicShell` — or whichever shell is desired).
3. Add conditional renders:
   ```tsx
   {view === "auth-login" && <AuthLogin onNavigate={navigate} />}
   {view === "auth-register" && <AuthRegister onNavigate={navigate} />}
   {view === "auth-reset-password" && <AuthResetPassword onNavigate={navigate} />}
   {view === "auth-verify-otp" && <AuthVerifyOtp onNavigate={navigate} />}
   ```
4. Add nav entry points: e.g., PublicShell navbar "Sign In" → `onNavigate("auth-login")`, PublicHome "Student Login" → `onNavigate("auth-login")`, etc.

## Did NOT modify
- `src/app/page.tsx`
- `src/components/alo/app-shell.tsx`
- `src/components/alo/public-shell.tsx`
- `src/components/alo/shared.tsx`
- `src/lib/alo-types.ts`
- `src/lib/auth.ts`
- Any API route (`/api/auth/*`)
- `src/app/globals.css`
- Any other view file

Only the 4 new files listed above were created.
