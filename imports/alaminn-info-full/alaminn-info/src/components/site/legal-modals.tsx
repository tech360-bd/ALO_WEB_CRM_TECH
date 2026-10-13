"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ArrowUp, Mail, ShieldCheck, FileText, Cookie, Accessibility, BarChart3 } from "lucide-react";

/**
 * LegalModals
 *
 * Renders the footer "Legal" column (4 buttons) plus 4 accessible Radix
 * Dialog modals (Privacy / Terms / Cookies / Accessibility). Per the
 * single-route constraint we cannot create /privacy /terms /cookies
 * /accessibility as separate Next.js routes, so these are surfaced as
 * accessible modals triggered from the footer.
 *
 * Accessibility:
 *  - Radix Dialog provides focus trap, scroll lock, ESC-to-close, and
 *    restores focus to the trigger on close.
 *  - Each Dialog has a labelled DialogTitle and a DialogDescription for
 *    screen readers.
 *  - A "Back to top" / close button sits at the bottom of each modal
 *    body so keyboard users can dismiss without scrolling back up.
 *  - All interactive controls are <button> elements (44px+ touch target).
 */

type LegalModalId = "privacy" | "terms" | "cookies" | "accessibility";

const LEGAL_LINKS: { id: LegalModalId; label: string }[] = [
  { id: "privacy", label: "Privacy" },
  { id: "terms", label: "Terms" },
  { id: "cookies", label: "Cookies" },
  { id: "accessibility", label: "Accessibility" },
];

// "Last updated" date — kept as a constant to avoid SSR/CSR hydration drift.
const LAST_UPDATED = "July 11, 2026";

export function LegalModals() {
  const [open, setOpen] = useState<LegalModalId | null>(null);

  return (
    <>
      {/* Footer "Legal" column — 4 buttons that open the corresponding modal */}
      <div>
        <div className="eyebrow text-blue-300">Legal</div>
        <ul className="mt-4 space-y-2.5">
          {LEGAL_LINKS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpen(item.id)}
                className="hover-underline text-sm text-blue-200 transition-colors hover:text-white"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Privacy Policy modal */}
      <Dialog open={open === "privacy"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[88vh] w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-ink-100 bg-ink-50/60 px-6 py-5 text-left">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-orange-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Legal
            </div>
            <DialogTitle className="mt-2 font-display text-2xl font-extrabold text-ink-900">
              Privacy Policy
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-500">
              Last updated: {LAST_UPDATED} · Plain-English summary of how Al Aminn handles your data.
            </DialogDescription>
          </DialogHeader>

          <LegalBody>
            <LegalSection title="What we collect">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Inquiry form:</strong> name, email, phone, organization, role, country/city, current challenge, desired outcome, timeline, and any notes you choose to share.</li>
                <li><strong>Newsletter signup:</strong> email address only.</li>
                <li><strong>Meeting requests:</strong> name, email, organization, selected meeting type, requested date and time, and an optional topic.</li>
              </ul>
              <p className="mt-2">We do <strong>not</strong> collect payment card numbers, national IDs, or sensitive special-category data through this website.</p>
            </LegalSection>

            <LegalSection title="Why we collect it">
              <ul className="list-disc space-y-1 pl-5">
                <li>To respond to your inquiry and provide the service you asked about.</li>
                <li>To schedule and confirm a requested meeting.</li>
                <li>To send the newsletter you explicitly opted into (you can unsubscribe anytime).</li>
              </ul>
            </LegalSection>

            <LegalSection title="Legal basis">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Consent:</strong> you actively submit a form or subscribe to the newsletter.</li>
                <li><strong>Legitimate interest:</strong> responding to inquiries and fulfilling meeting requests you initiated.</li>
              </ul>
            </LegalSection>

            <LegalSection title="How long we keep it">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Inquiries:</strong> 24 months from submission, then automatically archived.</li>
                <li><strong>Newsletter:</strong> until you unsubscribe, then removed within 30 days.</li>
                <li><strong>Meetings:</strong> 12 months after the scheduled date.</li>
              </ul>
            </LegalSection>

            <LegalSection title="Who has access">
              <p>Al Aminn personally, plus a small number of authorized staff who have role-based access (RBAC) scoped to the specific records they need to do their work. Every access is logged for audit.</p>
            </LegalSection>

            <LegalSection title="Third parties">
              <p>We do <strong>not</strong> sell, rent or trade your data. Data is stored in our own CRM (the Alaminn.info Command Center). Newsletter delivery and meeting-link providers process data only as our processors under written agreement.</p>
            </LegalSection>

            <LegalSection title="Your rights">
              <ul className="list-disc space-y-1 pl-5">
                <li>Access — see what we hold about you.</li>
                <li>Correction — fix anything that is wrong.</li>
                <li>Deletion — ask us to erase your records.</li>
                <li>Export — receive a copy of your data in a portable format.</li>
                <li>Withdrawal of consent — at any time, for any processing based on consent.</li>
              </ul>
            </LegalSection>

            <LegalSection title="How to exercise your rights">
              <p>Email{" "}
                <a href="mailto:privacy@alaminn.info" className="font-semibold text-orange-600 underline-offset-2 hover:underline">
                  privacy@alaminn.info
                </a>{" "}
                (this address forwards to Al Aminn directly). We respond within 30 days.
              </p>
            </LegalSection>

            <LegalSection title="Cookies">
              <p>This site uses a small set of essential and preference cookies. See the{" "}
                <button
                  type="button"
                  onClick={() => setOpen("cookies")}
                  className="font-semibold text-orange-600 underline-offset-2 hover:underline"
                >
                  Cookies
                </button>{" "}
                notice for the full list.
              </p>
            </LegalSection>

            <LegalSection title="Privacy-friendly analytics">
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs leading-relaxed text-emerald-900">
                  <strong>First-party, cookie-less, no third-party tracking.</strong>{" "}
                  We built our own lightweight analytics so we never have to load Google
                  Analytics, Segment, Meta Pixel, or any other third-party script on this site.
                </p>
              </div>
              <p className="mb-1.5"><strong>What we collect:</strong></p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The <strong>page path</strong> you visited (pathname, search, and on-page anchor like <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">#about</code> — used to track section views in this single-page site) and the page that referred you here (origin and path only — query strings stripped, so no personal data from other sites is captured).</li>
                <li>An <strong>anonymous, daily-rotating session ID</strong> (today's date + 8 random characters) stored in your browser's <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">localStorage</code> — not in a cookie. It cannot be linked back to you across days, devices, or browsers.</li>
                <li>A <strong>sha256 hash of your IP address</strong>, truncated to 16 characters. We never store the raw IP. The hash is one-way: it cannot be reversed to recover your IP. We use it only for rate-limiting and abuse detection.</li>
                <li><strong>UTM parameters</strong> (utm_source, utm_medium, utm_campaign, utm_content, utm_term) when you arrive from a tagged link — so we know which outreach is working.</li>
                <li><strong>Event-specific metadata</strong> like scroll-depth milestones (25/50/75/100%), which CTA you clicked (by an internal label, not the link text), and which external domain a link points to (host only — no query string).</li>
              </ul>
              <p className="mt-2 mb-1.5"><strong>What we do NOT collect:</strong></p>
              <ul className="list-disc space-y-1 pl-5">
                <li>No cookies of any kind for analytics (no consent banner needed).</li>
                <li>No raw IP addresses, no user IDs, no emails, no names, no device fingerprints.</li>
                <li>No cross-site tracking, no behavioural profiling, no advertising identifiers.</li>
                <li>No third-party scripts loaded into your browser.</li>
              </ul>
              <p className="mt-2"><strong>How to opt out:</strong> This analytics system{" "}
                <strong>respects Do Not Track</strong>. If you have enabled{" "}
                <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">Do Not Track</code> in your
                browser settings, no analytics events will be sent — period. You can also clear
                the anonymous session ID at any time by clearing your browser's{" "}
                <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">localStorage</code> for this
                site (the key is <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">alaminn:analytics-session</code>).
              </p>
            </LegalSection>

            <LegalSection title="Data breach response">
              <p>If a personal-data breach is confirmed, we will notify affected users without undue delay — and in any case within 72 hours of becoming aware of it — in line with good-practice incident response.</p>
            </LegalSection>

            <LegalContact email="privacy@alaminn.info" label="Privacy questions" />

            <BackToTopButton onClose={() => setOpen(null)} />
          </LegalBody>
        </DialogContent>
      </Dialog>

      {/* Terms of Service modal */}
      <Dialog open={open === "terms"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[88vh] w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-ink-100 bg-ink-50/60 px-6 py-5 text-left">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-orange-600">
              <FileText className="h-3.5 w-3.5" />
              Legal
            </div>
            <DialogTitle className="mt-2 font-display text-2xl font-extrabold text-ink-900">
              Terms of Service
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-500">
              Last updated: {LAST_UPDATED} · The terms that govern your use of Alaminn.info.
            </DialogDescription>
          </DialogHeader>

          <LegalBody>
            <LegalSection title="Acceptance of terms">
              <p>By accessing or using Alaminn.info, you agree to these terms. If you do not agree, please do not use the site or submit any inquiry.</p>
            </LegalSection>

            <LegalSection title="Description of services">
              <p>Alaminn.info is the personal platform of Al Aminn, offering professional consulting, written content, resources, and routes to engage — including inquiry submission, meeting scheduling, and a newsletter. Specific engagement details and fees are confirmed through the inquiry flow, not on this site.</p>
            </LegalSection>

            <LegalSection title="No guarantee of specific outcomes">
              <p>Strategy, operations, growth and AI advisory work depends on many factors outside anyone's control. Information on this site and through engagements is provided in good faith, but Al Aminn does not guarantee any specific business, financial, enrollment or operational outcome.</p>
            </LegalSection>

            <LegalSection title="Intellectual property">
              <p>All content on this site — including writing, design, the Operating Constellation visual, section layouts, downloadable resources and brand marks — is © Al Aminn unless otherwise noted on the specific piece of content. Ecosystem platforms (ALO Education, ALO Labs, TECH360, English AI, ICLA) retain their own separate branding and ownership.</p>
            </LegalSection>

            <LegalSection title="Permitted use">
              <ul className="list-disc space-y-1 pl-5">
                <li>Reading and referencing content for personal or internal professional use.</li>
                <li>Contacting Al Aminn about a possible engagement via the inquiry form or meeting scheduler.</li>
                <li>Subscribing to the newsletter and unsubscribing at any time.</li>
              </ul>
            </LegalSection>

            <LegalSection title="Prohibited use">
              <ul className="list-disc space-y-1 pl-5">
                <li>Scraping, crawling or bulk-copying content for redistribution.</li>
                <li>Spamming the inquiry, newsletter or meeting systems.</li>
                <li>Impersonating Al Aminn or any associated entity.</li>
                <li>Reverse engineering, attacking or disrupting the site, the Command Center or any API endpoint.</li>
                <li>Using the site to transmit unlawful, harmful or abusive material.</li>
              </ul>
            </LegalSection>

            <LegalSection title="Inquiry submissions">
              <p>When you submit an inquiry, you grant Al Aminn permission to contact you about that inquiry through your preferred channel, and to store the submitted information for the retention period stated in the Privacy Policy. Student referrals are routed to ALO Education only when you explicitly consent at submission time.</p>
            </LegalSection>

            <LegalSection title="Disclaimer">
              <p>Content on this site is general information, not legal, financial, tax or investment advice. Case studies and impact records describe specific past engagements and do not predict future results. For advice specific to your situation, please engage Al Aminn directly or consult a qualified professional.</p>
            </LegalSection>

            <LegalSection title="Limitation of liability">
              <p>To the maximum extent permitted by law, Al Aminn's liability for any claim arising from your use of this site is limited to the amount, if any, you have paid Al Aminn through this site in the 12 months preceding the claim. We are not liable for indirect, incidental or consequential damages.</p>
            </LegalSection>

            <LegalSection title="Changes to terms">
              <p>We may update these terms from time to time. Material changes will be reflected by updating the "Last updated" date at the top of this notice. Continued use after a change constitutes acceptance of the updated terms.</p>
            </LegalSection>

            <LegalSection title="Governing law">
              <p>These terms are governed by the laws of Bangladesh, where Al Aminn operates. Any disputes will be resolved in the courts of Dhaka, Bangladesh, unless otherwise required by applicable consumer-protection law.</p>
            </LegalSection>

            <LegalContact email="terms@alaminn.info" label="Terms questions" />

            <BackToTopButton onClose={() => setOpen(null)} />
          </LegalBody>
        </DialogContent>
      </Dialog>

      {/* Cookies modal */}
      <Dialog open={open === "cookies"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[88vh] w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-ink-100 bg-ink-50/60 px-6 py-5 text-left">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-orange-600">
              <Cookie className="h-3.5 w-3.5" />
              Legal
            </div>
            <DialogTitle className="mt-2 font-display text-2xl font-extrabold text-ink-900">
              Cookies
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-500">
              Last updated: {LAST_UPDATED} · What this site stores in your browser.
            </DialogDescription>
          </DialogHeader>

          <LegalBody>
            <LegalSection title="What cookies are">
              <p>Cookies are small text files stored by your browser when you visit a website. They let the site remember things like your theme preference or whether you're logged in. Cookies do not access the rest of your device.</p>
            </LegalSection>

            <LegalSection title="Categories used on this site">
              <div className="space-y-3">
                <CookieRow
                  name="alaminn_session"
                  category="Essential"
                  purpose="Keeps you logged in to the Command Center after you authenticate."
                  lifetime="8 hours"
                  attributes="HttpOnly · Secure · SameSite=Lax"
                />
                <CookieRow
                  name="theme"
                  category="Preference"
                  purpose="Remembers whether you picked light or dark mode."
                  lifetime="1 year"
                  attributes="SameSite=Lax"
                />
                <CookieRow
                  name="(analytics — not yet in use)"
                  category="Analytics"
                  purpose="Privacy-aware traffic analytics, only after explicit consent. None set today."
                  lifetime="—"
                  attributes="Will be consent-gated"
                />
              </div>
            </LegalSection>

            <LegalSection title="What we do not use">
              <ul className="list-disc space-y-1 pl-5">
                <li>No third-party advertising cookies.</li>
                <li>No tracking pixels from social or ad networks.</li>
                <li>No cross-site behavioural tracking.</li>
              </ul>
            </LegalSection>

            <LegalSection title="How to manage cookies">
              <p>You can view, block or delete cookies in your browser settings at any time. Most browsers explain how under "Help" or "Settings". Disabling the essential session cookie means you cannot log in to the Command Center — the public site will continue to work normally.</p>
            </LegalSection>

            <LegalSection title="Effect of disabling">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Essential disabled:</strong> Command Center login will not work; you will not be able to access CRM / Approvals / AI Workspace / Audit.</li>
                <li><strong>Preference disabled:</strong> the site will default to your operating system's light/dark preference instead of remembering your last choice.</li>
                <li><strong>Analytics disabled:</strong> no impact on your experience — analytics is opt-in and not currently enabled.</li>
              </ul>
            </LegalSection>

            <LegalContact email="privacy@alaminn.info" label="Cookie questions" />

            <BackToTopButton onClose={() => setOpen(null)} />
          </LegalBody>
        </DialogContent>
      </Dialog>

      {/* Accessibility modal */}
      <Dialog open={open === "accessibility"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[88vh] w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-ink-100 bg-ink-50/60 px-6 py-5 text-left">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-orange-600">
              <Accessibility className="h-3.5 w-3.5" />
              Legal
            </div>
            <DialogTitle className="mt-2 font-display text-2xl font-extrabold text-ink-900">
              Accessibility
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-500">
              Last updated: {LAST_UPDATED} · Our commitment and current state.
            </DialogDescription>
          </DialogHeader>

          <LegalBody>
            <LegalSection title="Our commitment">
              <p>Al Aminn is committed to making Alaminn.info usable by as many people as possible. We target <strong>WCAG 2.1 Level AA</strong> as our baseline and continue to improve as we learn about specific barriers.</p>
            </LegalSection>

            <LegalSection title="What's implemented">
              <ul className="list-disc space-y-1.5 pl-5">
                <li><strong>Semantic HTML</strong> — proper <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">&lt;header&gt;</code>, <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">&lt;nav&gt;</code>, <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">&lt;main&gt;</code>, <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">&lt;section&gt;</code>, <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">&lt;article&gt;</code>, <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">&lt;footer&gt;</code> landmark roles throughout.</li>
                <li><strong>ARIA labels</strong> on icon-only buttons, interactive controls and status indicators.</li>
                <li><strong>Keyboard navigation</strong> — every interactive control is reachable via Tab; Escape closes modals and the command palette; arrow keys move the testimonials carousel and date picker.</li>
                <li><strong>Focus management</strong> in modals — Radix Dialog provides focus trap and restores focus to the trigger on close.</li>
                <li><strong>Reduced-motion support</strong> — animations respect the <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">prefers-reduced-motion</code> setting and degrade gracefully.</li>
                <li><strong>Color contrast</strong> — the orange (#F26113) and blue (#0B63CE) brand colors on white and ink backgrounds meet AA contrast ratios for body text and UI.</li>
                <li><strong>Screen reader support</strong> — <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">sr-only</code> labels for visual-only content and <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">aria-live</code> regions for dynamic status (form submission, newsletter, etc.).</li>
                <li><strong>Skip-to-content link</strong> — visible on first keyboard focus, jumps straight to the main content.</li>
              </ul>
            </LegalSection>

            <LegalSection title="Known limitations">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>The <strong>Operating Constellation</strong> animation in the hero is a complex animated SVG that some screen readers may interpret noisily. We provide a static accessible label and a legend so the meaning ("Al Aminn at the center of an integrated operating model") is conveyed without the animation.</li>
                <li>Some <strong>third-party embedded content</strong> (e.g. future video or map embeds) may not be fully accessible. We will review each embed before publishing and provide alternatives where possible.</li>
              </ul>
            </LegalSection>

            <LegalSection title="How to report issues">
              <p>If you encounter a barrier on this site, please tell us. Email{" "}
                <a href="mailto:accessibility@alaminn.info" className="font-semibold text-orange-600 underline-offset-2 hover:underline">
                  accessibility@alaminn.info
                </a>{" "}
                with a short description of the issue and the page or section where it happened. We read every report and prioritise fixes.
              </p>
            </LegalSection>

            <LegalContact email="accessibility@alaminn.info" label="Accessibility reports" />

            <BackToTopButton onClose={() => setOpen(null)} />
          </LegalBody>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------- small building blocks ---------- */

function LegalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal-body max-h-[calc(88vh-7.5rem)] overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink-700">
      {children}
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1.5 font-display text-base font-bold text-ink-900">{title}</h3>
      <div className="text-sm text-ink-700">{children}</div>
    </section>
  );
}

function LegalContact({ email, label }: { email: string; label: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-ink-200 bg-ink-50/70 p-4">
      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
      <div className="text-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</div>
        <a
          href={`mailto:${email}`}
          className="font-semibold text-ink-900 underline-offset-2 hover:underline"
        >
          {email}
        </a>
      </div>
    </div>
  );
}

function BackToTopButton({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-2 flex justify-end">
      <DialogClose asChild>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange transition-colors hover:bg-orange-700"
        >
          <ArrowUp className="h-4 w-4" />
          Close
        </button>
      </DialogClose>
    </div>
  );
}

function CookieRow({
  name,
  category,
  purpose,
  lifetime,
  attributes,
}: {
  name: string;
  category: string;
  purpose: string;
  lifetime: string;
  attributes: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-ink-900 px-2 py-0.5 text-xs font-bold text-orange-300">{name}</code>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
          {category}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-ink-600">{purpose}</p>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
        <span><strong className="text-ink-700">Lifetime:</strong> {lifetime}</span>
        <span><strong className="text-ink-700">Attributes:</strong> {attributes}</span>
      </div>
    </div>
  );
}
