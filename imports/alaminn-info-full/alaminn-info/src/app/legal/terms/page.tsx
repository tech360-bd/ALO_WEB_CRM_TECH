import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/site/public-chrome";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of Alaminn.info — acceptance of terms, services, permitted and prohibited use, intellectual property, disclaimers and limitation of liability.",
};

const LAST_UPDATED = "July 11, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 font-display text-xl font-bold text-foreground">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground space-y-2">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <PublicPage>
      <article className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
        {/* Header */}
        <header className="mb-10 border-b pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <FileText className="h-4 w-4" />
            Legal
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED} · The terms that govern your use of Alaminn.info.
          </p>
        </header>

        {/* Body */}
        <Section title="Acceptance of terms">
          <p>By accessing or using Alaminn.info, you agree to these terms. If you do not agree, please do not use the site or submit any inquiry.</p>
        </Section>

        <Section title="Description of services">
          <p>Alaminn.info is the personal platform of Al Aminn, offering professional consulting, written content, resources, and routes to engage — including inquiry submission, meeting scheduling, and a newsletter. Specific engagement details and fees are confirmed through the inquiry flow, not on this site.</p>
        </Section>

        <Section title="No guarantee of specific outcomes">
          <p>Strategy, operations, growth and AI advisory work depends on many factors outside anyone&apos;s control. Information on this site and through engagements is provided in good faith, but Al Aminn does not guarantee any specific business, financial, enrollment or operational outcome.</p>
        </Section>

        <Section title="Intellectual property">
          <p>All content on this site — including writing, design, the Operating Constellation visual, section layouts, downloadable resources and brand marks — is © Al Aminn unless otherwise noted on the specific piece of content. Ecosystem platforms (ALO Education, ALO Labs, TECH360, English AI, ICLA) retain their own separate branding and ownership.</p>
        </Section>

        <Section title="Permitted use">
          <ul className="list-disc space-y-1 pl-5">
            <li>Reading and referencing content for personal or internal professional use.</li>
            <li>Contacting Al Aminn about a possible engagement via the inquiry form or meeting scheduler.</li>
            <li>Subscribing to the newsletter and unsubscribing at any time.</li>
          </ul>
        </Section>

        <Section title="Prohibited use">
          <ul className="list-disc space-y-1 pl-5">
            <li>Scraping, crawling or bulk-copying content for redistribution.</li>
            <li>Spamming the inquiry, newsletter or meeting systems.</li>
            <li>Impersonating Al Aminn or any associated entity.</li>
            <li>Reverse engineering, attacking or disrupting the site, the Command Center or any API endpoint.</li>
            <li>Using the site to transmit unlawful, harmful or abusive material.</li>
          </ul>
        </Section>

        <Section title="Inquiry submissions">
          <p>When you submit an inquiry, you grant Al Aminn permission to contact you about that inquiry through your preferred channel, and to store the submitted information for the retention period stated in the{" "}
            <Link href="/legal/privacy" className="font-semibold text-primary underline-offset-2 hover:underline">
              Privacy Policy
            </Link>. Student referrals are routed to ALO Education only when you explicitly consent at submission time.
          </p>
        </Section>

        <Section title="Disclaimer">
          <p>Content on this site is general information, not legal, financial, tax or investment advice. Case studies and impact records describe specific past engagements and do not predict future results. For advice specific to your situation, please engage Al Aminn directly or consult a qualified professional.</p>
        </Section>

        <Section title="Limitation of liability">
          <p>To the maximum extent permitted by law, Al Aminn&apos;s liability for any claim arising from your use of this site is limited to the amount, if any, you have paid Al Aminn through this site in the 12 months preceding the claim. We are not liable for indirect, incidental or consequential damages.</p>
        </Section>

        <Section title="Changes to terms">
          <p>We may update these terms from time to time. Material changes will be reflected by updating the &quot;Last updated&quot; date at the top of this notice. Continued use after a change constitutes acceptance of the updated terms.</p>
        </Section>

        <Section title="Governing law">
          <p>These terms are governed by the laws of Bangladesh, where Al Aminn operates. Any disputes will be resolved in the courts of Dhaka, Bangladesh, unless otherwise required by applicable consumer-protection law.</p>
        </Section>

        {/* Contact card */}
        <div className="mt-10 flex items-start gap-3 rounded-xl border bg-muted/30 p-5">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Terms questions
            </div>
            <a
              href="mailto:terms@alaminn.info"
              className="font-semibold text-foreground underline-offset-2 hover:underline"
            >
              terms@alaminn.info
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/legal/privacy">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Read Privacy Policy
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </article>
    </PublicPage>
  );
}
