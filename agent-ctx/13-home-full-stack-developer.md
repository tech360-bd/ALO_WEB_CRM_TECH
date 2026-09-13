# Task 13-home — ALO Education Public Home (24 sections)

**Agent:** full-stack-developer
**Task:** Rebuild ALO Education homepage with 24 sections + auto-changing country hero
**File:** `/home/z/my-project/src/components/alo/views/public-home.tsx`
**Props:** `{ onNavigate: (v: ViewKey, slug?: string) => void }`
**Size:** 2049 lines

## Work Log

### Context read
- Read `/home/z/my-project/worklog.md` (full history — design system #0057B8 blue / #E8501A orange, white bg, rounded-2xl border-2 cards, h-12 orange CTAs; prior agents' patterns).
- Read shared infrastructure:
  * `src/components/alo/shared.tsx` — exports `Icon`, `StatCard`, `SectionCard`, `EmptyState`, `LoadingGrid`, `PageHeader`, `Progress`, `MiniBar` (plus `StatusBadge`, `InfoRow`, `CompletionRing`, re-exports Tooltip).
  * `src/components/alo/public-lead-form.tsx` — `PublicLeadForm` with `sourceTag`, `preferredCountry`, `preferredCourse`, `compact`, `title`, `subtitle` props. POSTs to `/api/leads`.
  * `src/lib/alo-types.ts` — `ViewKey` (includes `public-home`, `public-country`, `public-courses`, `public-course-finder`, `public-universities`, `public-exams`, `scholarship-finder`, `student-dashboard`, `partner-portal`, `english-test`, `ai-interview`), `COUNTRIES` array, `fmtDate`, `timeAgo`.
  * `src/app/api/homepage/route.ts` — returns `{ heroSlides, services, stories, team, faqs, countries, courses, universities, scholarships, exams, stats }` with the exact shapes documented in the task brief.
  * `src/app/api/lead-forms/route.ts` — POST contract documented in task; `PublicLeadForm` covers lead creation via `/api/leads` so this endpoint is informational.
  * `src/components/alo/public-shell.tsx` — `PublicShell` renders header + footer; the footer is section 24 (handled by shell — I do NOT render a separate footer).
  * `prisma/schema.prisma` — confirmed `HomeHeroSlide`, `Service`, `SuccessStory`, `TeamMember`, `HomepageFaq`, `CountryPage`, `CoursePage`, `UniversityPage`, `ExamPage`, `LeadForm` shapes.
- Confirmed `tw-animate-css` + `tailwindcss-animate` packages installed — `animate-in fade-in slide-in-from-bottom-2 duration-700` classes are available for smooth fade/slide transitions.

### Implementation
Created `/home/z/my-project/src/components/alo/views/public-home.tsx` (2049 lines, `"use client"`, named export `PublicHome`, props `{ onNavigate }`):

**Section 2 — Auto-Changing Country Hero:**
- Premium WHITE hero (no dark overlay, no black hero) with auto-rotating country slides every 5s.
- `useState(currentSlide)`, `useState(paused)`, `useRef(prefersReducedMotion)`.
- `useEffect` checks `window.matchMedia('(prefers-reduced-motion: reduce)')` once on mount.
- `useEffect` with `setInterval(5000)` advances `currentSlide` — early-returns when `paused || prefersReducedMotion.current || heroSlides.length === 0`.
- Pause-on-hover: `onMouseEnter={() => setPaused(true)}` / `onMouseLeave={() => setPaused(false)}` on the section wrapper (both left and right sides pause together).
- 2-column layout (`lg:grid-cols-2`):
  * LEFT: orange "Your Future Starts Here" badge with animated ping pulse dot (Tailwind `animate-ping`); H1 with the dynamic country name wrapped in a `key={country-${safeIndex}}` + `animate-in fade-in slide-in-from-bottom-2 duration-700` so React remounts and the animation replays on each slide change; subtitle (also keyed for fade); 4 CTA buttons (orange "Book Free Consultation" h-12, blue-outline "Find Courses" h-12, ghost "Check Eligibility", green-outline "WhatsApp 01805020101"); 4 trust stat tiles (Countries/Universities/Courses/Exams from `stats`); 7 manual country dots (clickable, current is wider/longer blue).
  * RIGHT: country image card — color band header using `slide.accentColor`, large emoji flag in white-rounded tile, "Last verified: Jan 2025" badge using `fmtDate(slide.lastVerifiedAt)`, country name + capital, 4-stat grid (Popular City / Popular Intake / Universities / Courses), scholarship label strip, floating quick-facts card (absolute positioned, `hidden sm:block`, parsed from `slide.country.quickFacts` JSON showing top 4 facts). Card content uses `key={card-${safeIndex}}` + `animate-in fade-in slide-in-from-bottom-3 duration-700` for smooth fade/slide on country change.
- Fallback: if `heroSlides` is empty, a placeholder card with Globe icon and "Hero slides will appear here" message.
- NO layout shift: all transitions use opacity + translateY (no width/height changes).

**Section 3 — Smart Course Finder Search:**
- Card with 6 selects (Country from API, Study Level, Subject, Intake, Budget, English Test) + 2 buttons (orange "Find Courses" → `onNavigate("public-course-finder")` + toast "Opening Course Finder with your filters"; blue-outline "AI Course Match" → same navigate + toast).

**Section 4 — Study Destinations:**
- Grid of 7 country cards from `heroSlides.slice(0, 7)` (1 col mobile → 2 tablet → 3 desktop).
- Each card: flag emoji, name, capital, popular city/intake/universities/courses grid, study levels + visa type from parsed quickFacts, scholarship label, last verified date, "View Country Guide" (outline → `onNavigate("public-country", slug)`) + "Find Courses" (orange → `onNavigate("public-courses")`).
- "View All Destinations" CTA at bottom → `onNavigate("public-destinations")`.

**Section 5 — About ALO Education:**
- 2-column: LEFT = founder story (Taslima Akter, February 2023, Dhaka roots, transparent process, student portal tracking, WhatsApp support), "Learn More" + "Book Free Consultation" CTAs. RIGHT = 6 mini cards (Dhaka Roots, Bangladesh Focus, Transparent Process, Student Portal, WhatsApp Support, Audit-Logged).

**Section 6 — Mission, Vision, Values:** 8 cards (Mission, Vision, Excellence, Trust, Innovation, Transparency, Student-first guidance, Professional support) — each with Lucide icon + heading + 2-3 line explanation.

**Section 7 — Why Choose ALO:** 12 cards (Expert counselors, Transparent process, Course matching, University shortlisting, Application support, SOP/CV support, Visa-focused preparation and document guidance (NOT "98% visa success" — explicitly the safer wording), Interview preparation, Document review, Student portal tracking, WhatsApp support, Scholarship guidance). 4-col grid on desktop.

**Section 8 — Services (Dynamic):** Up to 15 service cards from `data.services` — icon, title, description, CTA link with toast. EmptyState fallback when no services.

**Section 9 — Student Journey Timeline:** 12-step grid (Free Counseling → Profile Review → Course Match → University Shortlist → Document Upload → Application Submit → Offer Receive → Deposit/CAS → Visa Preparation → Visa Decision → Pre-Departure → Enrollment). Each card has Lucide icon in blue tile + step number badge + title + short explanation.

**Section 10 — Country Intelligence Cards:** For each of 7 main countries — capital, popular cities, popular intakes, study levels, tuition range, living cost, visa type, work/post-study summary, last verified date. All from parsed `quickFacts` JSON. If a field is missing/unverified: shows "Check with counselor" (explicit per task requirement). Verified badge (emerald) vs Needs review badge (amber) based on `lastVerifiedAt`.

**Section 11 — Popular Courses (Dynamic + Tabs):** Tabs (Business, Computer Science, Data Science, Cyber Security, Engineering, Healthcare, Law, Hospitality, AI, Project Management) using shadcn `Tabs`. Each tab filters `data.courses` by loose subject match (falls back to showing all courses if no match). Up to 12 course cards per tab — name, university, country flag, level + subject badges, city, duration, intake, deadline, tuition (prominent blue), scholarship strip, English requirement, View Details + Compare + Apply buttons. NEVER shows commission.

**Section 12 — Trusted Universities (Dynamic):** Up to 8 university cards from `data.universities` — text-based (no logos), name, city + country, overview (line-clamped), intakes, english tests, scholarship badge, last verified, "View Courses" + "Apply" buttons.

**Section 13 — Scholarships (Dynamic):** Up to 8 scholarship cards from `data.scholarships` — Award icon, name, country + university, amount, eligibility (line-clamped), deadline, "Check Eligibility" button (scrolls to final CTA). "Open Scholarship Finder" CTA at bottom.

**Section 14 — English Language Tests:** 11 test cards (IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo, OIETC/ELLT, Oxford ELLT, LanguageCert, Kaplan, OET, MOI Guidance) — name, full name, best for, accepted destinations, score range, Learn More + Start Mock Test buttons. Plus a comparison table (sticky header, 5 columns) and bottom CTAs.

**Section 15 — Visa and Compliance Support:** 6 cards (Visa checklist, Financial proof guidance, Credibility interview practice, Visa refusal prevention, Document review, Pre-departure checklist). Amber disclaimer banner: "Visa and work rules may change. Final checklist must be verified by ALO staff." Two CTAs (Start Visa Readiness Check → ai-interview, Book Visa Consultation → scroll to final CTA).

**Section 16 — Student Portal Preview:** 8 dashboard preview tiles (Profile completion, Active applications, Documents, Messages, Visa readiness, Appointments, AI recommendations, Timeline) with sample values. Plus a sample-progress card with 4 `Progress` bars. CTAs: Student Login → `onNavigate("student-dashboard")`, Create Student Account → scroll to final CTA.

**Section 17 — Partner Portal Preview:** 8 feature cards (Register students, Search programs, Submit applications, Upload documents, Track applications, Commission tracking, Learning resources, Deadlines). CTAs: Partner Login → `onNavigate("partner-portal")`, Become A Partner → toast.

**Section 18 — AI Support Tools:** 8 AI tool cards (AI Course Match, AI SOP Helper, AI CV Helper, AI Visa Coach, AI Interview Practice, AI Document Checklist, AI Scholarship Match, AI Study Cost Estimate) — violet-tinted icons. Orange-tinted AI Safety banner: "AI gives preparation guidance only. ALO counselor final review required. AI cannot guarantee admission or visa."

**Section 19 — Resources Hub:** 28 resource cards across 10 categories (Blog, Visa Guide, Scholarship, Success Story, Application Tips, Pre-Departure, Accommodation, Financial, FAQ, Interview, Documents, English Test). Each card is clickable with toast. "Open Resources Hub" CTA.

**Section 20 — Success Stories (Dynamic):** Up to 4 story cards from `data.stories` — avatar initials in gradient circle (no stolen photos), student name, home district, destination country (with flag from `flagFor()`), university, course, outcome (emerald), testimonial (italic line-clamped), consent status badge. "Read More" CTA per card.

**Section 21 — Expert Team (Dynamic):** Up to 6 team member cards from `data.team` — text-based (avatar initials in gradient square, no stolen photos), name, role, specialty badge, short bio, "Meet Our Team" CTA.

**Section 22 — FAQ (Dynamic, Accordion):** Up to 20 FAQs in shadcn `Accordion` (single collapsible). "View All FAQs" CTA.

**Section 23 — Final CTA and Lead Form:** Split card — LEFT = `bg-alo-hero` gradient pitch panel with "Ready to Start Your Study Abroad Journey?" headline, 4 CTA buttons (Book Free Consultation, Find Courses, Check Eligibility, WhatsApp), 3-stat row (Countries/Universities/Courses). RIGHT = `<PublicLeadForm sourceTag="Homepage final CTA" />`.

**Section 24 — Footer:** Handled by `PublicShell` (no separate render — per task instructions).

### Design system adherence
- Background `#FFFFFF`, soft bg `#F8FAFC`, alternating section backgrounds for visual rhythm.
- Primary blue `#0057B8`, CTA orange `#E8501A`, text `#0F172A`, border `#E2E8F0`.
- All cards: `rounded-2xl border-2 border-[#E2E8F0]`, `h-full` on card content for same-height alignment.
- All CTAs: `h-12` (48px), orange CTAs `bg-[#E8501A] hover:bg-[#E8501A]/90 text-white`, blue outline `border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]`.
- NO dark overlay, NO black hero.
- Section headers: small orange uppercase label + large blue H2 + subtitle (`SectionHeader` helper component, supports center/left align).
- Mobile-first responsive: 1 col mobile → 2 tablet → 3/4 desktop.
- `"use client"` at top.
- `useToast` from `@/hooks/use-toast` for all notifications.

### API integration
- `GET /api/homepage` fetched on mount with `cache: "no-store"` — single call, populates all dynamic sections.
- `LoadingGrid` + hero skeleton while fetching.
- All dynamic sections have `EmptyState` fallbacks when API returns empty arrays.
- No hardcoded fake numbers — all counts come from `data.stats`.
- `safeParse` helper for `quickFacts` JSON fields (try/catch with fallback `{}` or `[]`).

### Interactive behavior
- Every button has a handler: toast, navigate, scroll-to-element, or form submit.
- Hero manual dots: clicking sets `currentSlide` and the auto-rotate continues from there.
- Hero pause-on-hover: both left content and right card pause rotation.
- `prefers-reduced-motion`: auto-rotation stops entirely (ref-based check).
- Course finder tab switching: instant client-side filter, no refetch needed.
- Resource cards: clickable with toast feedback.
- Smooth scroll to `#final-cta` when "Book Free Consultation" / "Create Student Account" / "Check Eligibility" (from scholarship) is clicked.

### Lint & dev log
- `bun run lint`: 0 errors, 0 warnings across the new file (and the whole project).
- `dev.log`: dev server compiles cleanly; no module-not-found or syntax errors related to `public-home.tsx`.

### What I did NOT modify
- `shared.tsx`, `alo-types.ts`, `public-shell.tsx`, `public-lead-form.tsx`, `app-shell.tsx`, `page.tsx`, `globals.css`, or any API routes. Only the single file `src/components/alo/views/public-home.tsx` was overwritten.

## Stage Summary
- Delivered a 2049-line production-ready `PublicHome` component with all 24 sections (Section 1 = PublicShell header; Sections 2-23 = rendered in this file; Section 24 = PublicShell footer).
- Auto-changing country hero with 5s rotation, pause-on-hover, prefers-reduced-motion support, manual country dots, smooth fade/slide transitions (no layout shift).
- All 22 content sections (3-23) implemented with dynamic data from `/api/homepage`, real Bangladeshi copy (no lorem ipsum), no unverified claims (no "98% visa success"), explicit "Check with counselor" fallbacks for unverified country intelligence fields, AI safety banner, visa disclaimer, text-based university/team cards (no stolen logos/photos), no commission shown on courses.
- Design system fully respected (blue #0057B8, orange #E8501A, white bg, #F8FAFC alt bg, rounded-2xl border-2 cards, h-12 orange CTAs, mobile-first responsive, same-height cards).
- Every interactive element wired to a working handler (toast, navigate, scroll, or form submit).
- Ready for orchestrator to wire into `page.tsx` (file already exists at the requested path with the correct named export and props).
