# ALO Education — Design System (v1)

Single source of truth for colour, type, spacing, radius, shadow and control sizes
across the public website, CRM, portals, admin and AI Command Center.

- Tokens: `src/app/globals.css` (the only place where palette values are defined)
- Primitives: `src/components/ui/*` (Button, Badge, Input, Card, …)
- Rule: components use token utilities (`bg-alo-cta`, `text-alo-navy`, `rounded-button`,
  `shadow-card`…). Do not add new hex literals inside components — add a token first.

## 1. Colour roles (in order of visual weight)

| Role | Token | Hex | Use for |
|---|---|---|---|
| Structure / headings | `alo-navy`, `alo-navy-dark` | #0F172A / #111827 | headings, sidebar text |
| Primary action | `alo-cta` (hover `alo-cta-hover`, active `alo-cta-active`) | #F97316 / #EA580C / #C2410C | primary buttons only |
| Navigation / information / links | `alo-brand` (hover `alo-brand-hover`) | #2563EB / #1D4ED8 | links, selected states, system info |
| Success / WhatsApp | `alo-success`, `alo-whatsapp` | #16A34A / #25D366 | completed, active, verified, WhatsApp |
| AI | `alo-ai`, `alo-ai-soft` | #7C3AED / #F5F3FF | AI-generated or automation content only |
| Destructive / error | `alo-error`, `alo-error-soft` | #DC2626 / #FEF2F2 | delete, failed, urgent errors |
| Warning / pending | `alo-warning`, `alo-warning-soft` | #D97706 / #FFFBEB | pending, SLA risk, incomplete data |
| Neutrals | `alo-page`, `alo-border`, `alo-border-strong`, `alo-text-muted`, `alo-placeholder` | #F8FAFC / #E2E8F0 / #CBD5E1 / #64748B / #94A3B8 | surfaces, borders, text |

Status colours are the same everywhere: Active = success, Pending = warning,
Rejected/Failed = error, Draft/Neutral = neutral, Info = blue, AI = purple.

## 2. Scales

- **Radius:** sm 6 · input 8 · button 10 · card 12–16 (`rounded-2xl`) · feature 20 (`rounded-feature`) · pill (`rounded-pill`)
- **Shadow:** sm `0 2px 8px` · card/md `0 4px 20px rgba(15,23,42,.06)` · modal `0 20px 50px` (`shadow-xl`)
- **Spacing:** Tailwind's 4px scale, used on the spec's 4/8/12/16/20/24/32/40/48/64/80/96 steps
- **Type:** H1 40/1.15 · H2 32/1.2 · H3 24/1.25 · H4 20/1.3 · body 16/1.5 · body-lg 18/1.6 · small 14 · caption 12. CRM page title 28/36 (`text-crm-title`), CRM section 20/28 (`text-crm-section`)
- **Control heights:** button 44 default · 40 `sm` (dense CRM) · 48 `lg` · 52 `xl` (large CTA) · 32 `xs` · input 40 (CRM default)

## 3. Components (shared primitives)

- **Button** — `default` = orange primary · `brand` / `alo` = blue information · `outline` = secondary (white, strong border, navy text) · `ghost` · `link` (blue) · `success` · `destructive` / `danger` = destructive only · `cta` alias of `default`.
- **Badge** — 24px pill, 12px/600. Variants: default, success, warning, danger, info, brand, ai, neutral, muted, outline.
- **Input** — 40px, 8px radius, `#CBD5E1` border, placeholder `#94A3B8`, blue focus ring.
- **Card** — white, 1px `border`, 16px radius, `shadow-md`.

## 4. Public website — duplicate UI removed

| Area | Before | After |
|---|---|---|
| Navbar utility bar + mobile menu | AI / WhatsApp / Facebook button groups | Contact text links only |
| Homepage hero | AI / WhatsApp / Facebook group, stats card, process strip, country pills, two disabled CTAs | Eyebrow, H1, subtitle, 2 working CTAs, one image, dot controls |
| Footer | Three footer implementations (layout `PublicFooter`, homepage `FooterSection`, unused `PublicFooter` in `PublicPages.tsx`) and a 3-button help banner | One `PublicFooter` on every public page, no help-button banner |
| `/book-consultation` | Two navbars (layout + page) | One navbar; WhatsApp CTA is a working link |
| Floating agents | Corner widget + copies in navbar/hero/footer | Corner `FloatingActionWidget` is the only AI / WhatsApp / Facebook control |
| Dead code | `PublicCommunicationBar.tsx`, `WebsiteActionButtons.tsx` | Deleted |

## 5. Known gaps (not yet done — tracked for the next pass)

1. **Hard-coded colours:** about 10,900 literal hex values remain across ~400 source files (inline `style` and `bg-[#…]`). Only the brand blue family was consolidated. Migrate by area, starting with CRM and portals.
2. **Disabled "Not yet wired" controls:** 512 occurrences across 163 files. Many are `<Button disabled>` inside `<a>` (dead links). The hero and booking page were fixed; the rest need either a real handler/link or removal. See `BUTTON-INVENTORY.csv`.
3. **Font:** `--font-inter` is referenced but Inter is not loaded (no `next/font` download in this sandbox). The stack falls back to system UI. Load Inter via `next/font/google` in a connected environment.
4. **Contrast:** white text on `#F97316` is 2.8:1 (WCAG AA needs 4.5:1 for this text size). The spec mandates this pair. Options: keep it and enlarge the text to 18.66px bold, or use `#C2410C` (5.2:1) as the button background for body-size labels.
5. **Office / phone data conflicts in code:** the footer lists "House 08, Road 17/A, Uttara" while the navbar and widget list "Barek Mansion-02, Panthapath"; the older homepage footer listed "Suite 12B, Green Tower, Gulshan-2". Phone numbers also differ (01805020100 vs 01805020101). This needs a business decision before go-live.
6. **Portals / CRM / admin:** tokens are shared, but per-page layouts have not been audited screen by screen.
7. **Visual QA:** no browser is available in the build sandbox, so screenshots were not produced. Verify desktop, tablet and mobile on a real device or preview.
