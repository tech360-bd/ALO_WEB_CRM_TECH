"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Icon,
  SectionCard,
} from "@/components/alo/shared";
import { LegalLayout } from "@/components/alo/views/public-privacy";
import { type ViewKey } from "@/lib/alo-types";

interface PublicAccessibilityProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const COMMITMENTS = [
  { icon: "Eye", title: "Perceivable", description: "Information and user interface components must be presentable to users in ways they can perceive." },
  { icon: "MousePointerClick", title: "Operable", description: "User interface components and navigation must be operable — every interactive element is keyboard accessible." },
  { icon: "BrainCircuit", title: "Understandable", description: "Information and the operation of user interface must be understandable — content is clear and predictable." },
  { icon: "ShieldCheck", title: "Robust", description: "Content must be robust enough to be interpreted reliably by a wide variety of user agents, including assistive technologies." },
];

const FEATURES = [
  "Semantic HTML: We use proper HTML5 semantic elements (header, nav, main, article, section, footer) throughout.",
  "Keyboard navigation: Every interactive element can be accessed and operated using only a keyboard.",
  "Focus indicators: Visible focus outlines on all interactive elements (buttons, links, form fields).",
  "Alt text: All meaningful images include descriptive alt text. Decorative images use empty alt attributes.",
  "Color contrast: We follow WCAG 2.1 AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text).",
  "Form labels: Every form field has an associated label. Required fields are clearly marked.",
  "Heading hierarchy: Headings (h1, h2, h3) follow a logical, hierarchical order without skipping levels.",
  "ARIA: We use ARIA attributes where appropriate to enhance screen reader experience.",
  "Screen reader text: We use sr-only classes for screen reader-only content (like breadcrumbs and form hints).",
  "Touch targets: Mobile interactive elements meet the 44px minimum touch target size.",
  "Responsive design: Our website works on mobile, tablet, and desktop viewports.",
  "Reduced motion: We respect prefers-reduced-motion for users with motion sensitivity.",
];

const KNOWN_LIMITATIONS = [
  "Some third-party content (embedded YouTube videos, university website iframes) may not be fully accessible — we have no control over external content.",
  "Some older PDFs (university brochures, government visa documents) may not be screen-reader compatible — we are working on providing accessible alternatives.",
  "Bangla language support for screen readers is limited (this is a limitation of screen reader technology, not our website).",
  "Our AI chat widget may not be fully keyboard-accessible — we are working on improvements.",
];

const SECTIONS = [
  {
    title: "1. Our Commitment",
    body: [
      "ALO Education is committed to making our website, portals, and services accessible to everyone, including people with disabilities. We believe equal access to education information is a fundamental right.",
      "We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA as our accessibility standard. These guidelines explain how to make web content more accessible to people with visual, auditory, motor, and cognitive disabilities.",
    ],
  },
];

export function PublicAccessibility({ onNavigate }: PublicAccessibilityProps) {
  return (
    <LegalLayout
      title="Accessibility Statement"
      icon="Accessibility"
      subtitle="ALO Education is committed to making our website accessible to everyone, including people with disabilities."
      onNavigate={onNavigate}
    >
      {/* WCAG principles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COMMITMENTS.map((c) => (
          <Card key={c.title} className="rounded-2xl border border-[#0066CC]/15 bg-[#EAF3FF]/40">
            <CardContent className="p-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#0066CC] text-white">
                <Icon name={c.icon} className="size-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-[#0B2447]">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#5A7299]">{c.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold text-[#0B2447]">{section.title}</h2>
            <div className="mt-3 space-y-2">
              {section.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-[#5A7299]">{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-bold text-[#0B2447]">2. Accessibility Features</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A7299]">
            Our website includes the following accessibility features:
          </p>
          <ul className="mt-3 space-y-2">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#0B2447]">
                <Icon name="Check" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0B2447]">3. Known Limitations</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A7299]">
            Despite our best efforts, some content may not be fully accessible. We are aware of the following limitations:
          </p>
          <ul className="mt-3 space-y-2">
            {KNOWN_LIMITATIONS.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#5A7299]">
                <Icon name="Info" className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0B2447]">4. Assistive Technology Compatibility</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A7299]">
            Our website is tested for compatibility with the following assistive technologies:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[#0B2447]">
            <li>• Screen readers: NVDA (Windows), VoiceOver (macOS, iOS), TalkBack (Android), JAWS (Windows).</li>
            <li>• Screen magnifiers: ZoomText, Magnifier (Windows), Zoom (macOS).</li>
            <li>• Voice control: Dragon NaturallySpeaking, Apple Voice Control.</li>
            <li>• Keyboard-only navigation (no mouse).</li>
            <li>• High contrast mode (Windows High Contrast, macOS Increase Contrast).</li>
            <li>• Latest versions of Chrome, Firefox, Safari, and Edge browsers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0B2447]">5. Reporting Accessibility Issues</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A7299]">
            If you encounter an accessibility barrier on our website, please let us know. We take all feedback
            seriously and will work to fix issues as quickly as possible.
          </p>
          <div className="mt-4">
            <SectionCard title="How to report" icon="Mail" className="rounded-2xl border-[#0066CC]/15 bg-[#EAF3FF]/40">
              <div className="space-y-2 text-sm text-[#0B2447]">
                <p><span className="font-semibold">Email:</span> hello@aloeducation.com</p>
                <p><span className="font-semibold">Phone:</span> +880 1805 020101 (during office hours)</p>
                <p><span className="font-semibold">WhatsApp:</span> +880 1805 020101</p>
                <p><span className="font-semibold">In person:</span> House 25, Road 11, Banani, Dhaka 1213</p>
              </div>
              <p className="mt-3 text-xs text-[#5A7299]">
                Please include: the page URL, the assistive technology you're using, and a description of the issue.
                We aim to respond to all accessibility reports within 5 working days.
              </p>
            </SectionCard>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0B2447]">6. Continuous Improvement</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A7299]">
            Accessibility is an ongoing commitment, not a one-time project. We continuously audit and improve our
            website to meet WCAG 2.1 AA standards. Major improvements are documented in our release notes.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#5A7299]">
            If you have suggestions for how we can improve accessibility, we welcome your feedback.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0B2447]">7. Formal Complaints</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A7299]">
            If you are not satisfied with our response to an accessibility issue, you may file a formal complaint with
            the Bangladesh Telecommunication Regulatory Commission (BTRC) or your local disability rights authority.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0B2447]">8. Last Updated</h2>
          <p className="mt-3 text-sm text-[#5A7299]">August 2025</p>
        </section>
      </div>
    </LegalLayout>
  );
}
