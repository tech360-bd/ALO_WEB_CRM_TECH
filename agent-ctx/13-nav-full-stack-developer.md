# Task ID: 13-nav — Public Shell Navbar Redesign

**Agent:** full-stack-developer
**File updated:** `/home/z/my-project/src/components/alo/public-shell.tsx`
**Status:** COMPLETE — lint 0/0, typecheck 0, dev server 200

## What was done
Replaced the simple horizontal-button navbar in `PublicShell` with a rich, sticky white navbar featuring 4 dropdown menus + 2 direct links + an orange CTA. Mobile menu uses shadcn Sheet + Accordion. Footer (animated graduation caps) was preserved unchanged. The `PublicShellProps` interface, `isActive` function, and `Logo` component were kept intact.

## Navbar structure

**Header (desktop `lg:flex`):**
- Sticky `top-0 z-40 w-full border-b border-[#E2E8F0] bg-white`
- Logo left, nav center, CTA + hamburger right
- `max-w-[1280px]` container

**Desktop menu items (left → right):**

1. **Destinations** dropdown (hover + click toggle)
   - Header: "Main Countries" — UK, USA, Canada, Australia, Ireland, New Zealand, Dubai/UAE
   - Divider, then "More Countries" — Germany, Denmark, Malaysia, Japan, South Korea, Europe
   - All items call `onNavigate("public-country", slug)`
   - Country list fetched from `/api/countries` on mount (graceful fallback to static label map)
   - Panel: `w-72`, white bg, border-2 border-[#E2E8F0], rounded-xl, shadow-lg, p-2
   - Items: `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium`, hover `bg-[#e8f0fb] text-[#0057B8]`

2. **Course Finder** — direct link → `onNavigate("public-course-finder")`

3. **Services** — direct link → `onNavigate("public-home")` + smooth scroll to `#lead-form` + toast

4. **Language Prep** dropdown (2-col grid, 17 items)
   - Slugs routed: IELTS→ielts, PTE Academic→pte, TOEFL iBT→toefl, Duolingo English Test→duolingo, OIETC/ELLT→ellt, GRE→gre, GMAT→gmat, SAT→sat, ACT→act, Free English Placement Test→placement-test
   - "Coming soon" (amber badge) for: IELTS UKVI, Oxford ELLT, LanguageCert, Kaplan English Test, OET, MOI Guidance, English Test Comparison
   - Panel: `w-[34rem] grid grid-cols-2`

5. **Resources** dropdown (10 items)
   - Scholarships by Country → `onNavigate("scholarship-finder")`
   - FAQs → toast "Coming soon"
   - Blogs, Articles, Visa Guides, Success Stories, Application Tips, Pre-Departure Guides, Accommodation Support, Financial Planning → toast "Coming soon" with amber "Soon" badge

6. **Portals** dropdown (3 items)
   - Student Portal → toast "Student login" + `onNavigate("student-dashboard")`
   - Partner Portal → `onNavigate("partner-admin-dashboard")`
   - Employee Portal → toast "Employee login"

**Right side:**
- "Book Free Consultation" — orange `bg-[#E8501A] hover:bg-[#c8451a]`, white text, `h-12 rounded-xl px-5`, hidden on `xs`. Navigates to public-home + smooth-scrolls to `#lead-form`.
- Hamburger (`lg:hidden`) opens shadcn Sheet.

## Mobile menu (Sheet)

- Right-side slide-in, `w-[88vw] max-w-sm`, white bg, overflow-y-auto
- Logo header with bottom border
- shadcn Accordion (`type="multiple"`) with 6 collapsible sections matching the desktop dropdowns:
  - Destinations (Main + More Countries)
  - Course Finder
  - Services
  - Language Prep (single column)
  - Resources
  - Portals
- All tappable items ≥ 44px (min-h-[44px])
- Full-width orange CTA "Book Free Consultation" at bottom of accordion

## Dropdown behavior

- **Desktop hover:** `onMouseEnter` opens after 120ms delay (clears flicker), `onMouseLeave` closes after 150ms (lets user move between trigger and panel)
- **Click toggle:** clicking the trigger also opens/closes (works for touch)
- **Click-away:** `document.mousedown` listener on `navRef` closes dropdown if click is outside the header
- **Navigate closes:** every nav handler calls `setOpenDropdown(null)` before navigating
- Chevron icon rotates 180° when open for visual cue
- Each panel uses `absolute` positioning: Destinations anchored left, Language Prep uses `left-1/2 -translate-x-1/3`, Resources & Portals anchored right

## Color & typography

- Inactive link: `text-[#0F172A]` (dark) with `hover:bg-[#e8f0fb]/60 hover:text-[#0057B8]`
- Active link: `bg-[#e8f0fb] text-[#0057B8]`
- All menu items: `text-sm font-medium`
- Logo: gradient "A" icon + `text-base font-black text-[#0057B8]` "ALO Education"
- CTA: orange `#E8501A` (hover `#c8451a`), white text, `h-12 rounded-xl`
- "Soon" badge: `bg-amber-100 text-amber-700`, 10px uppercase

## Security

- No admin/CRM routes in the public navbar
- No commission data
- Only public routes + 3 portal login links (Student → student-dashboard, Partner → partner-admin-dashboard, Employee → toast only)

## Implementation details

- React state: `openDropdown: string | null` ("destinations" | "language" | "resources" | "portals")
- `hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)` for hover delay
- `navRef = useRef<HTMLDivElement>(null)` attached to `<header>` for click-away
- `countries: CountryLite[]` state populated by `fetch("/api/countries")` on mount
- `useMemo` splits the countries list into `mainCountries` (7 fixed slugs) and `moreCountries` (6 additional slugs), with fallback labels when API doesn't return a country
- Helper components: `DropdownLink` (icon + label + optional "Soon" badge + active state) and `DropdownHeader` (small uppercase group label)
- Reusable nav handlers: `goCountry`, `goExam`, `comingSoon`, `goScholarship`, `goCourseFinder`, `goServices`, `goConsultation`, `goPortal`
- Sheet uses `type="multiple"` accordion so users can have multiple sections expanded at once on mobile
- Mobile nav items have `min-h-[44px]` for touch targets

## Footer (unchanged)
Preserved verbatim — Section 1 (4-column footer), Section 2 (animated graduation caps strip with 3 layers), Section 3 (bottom bar with copyright + legal links).

## Verification
- `bun run lint`: 0 errors, 0 warnings
- `npx tsc --noEmit --skipLibCheck`: no errors in public-shell.tsx
- `dev.log`: `GET / 200`, `GET /api/countries 200` — navbar fetches countries successfully on mount
