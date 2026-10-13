import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/site/public-chrome";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Al Aminn and Alaminn.info collect, use, and protect personal data submitted through inquiry forms, newsletter signups, and meeting requests.",
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

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED} · Plain-English summary of how Al Aminn handles your data.
          </p>
        </header>

        {/* Body */}
        <Section title="What we collect">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Inquiry form:</strong> name, email, phone, organization, role, country/city, current challenge, desired outcome, timeline, and any notes you choose to share.</li>
            <li><strong>Newsletter signup:</strong> email address only.</li>
            <li><strong>Meeting requests:</strong> name, email, organization, selected meeting type, requested date and time, and an optional topic.</li>
          </ul>
          <p className="mt-2">We do <strong>not</strong> collect payment card numbers, national IDs, or sensitive special-category data through this website.</p>
        </Section>

        <Section title="Why we collect it">
          <ul className="list-disc space-y-1 pl-5">
            <li>To respond to your inquiry and provide the service you asked about.</li>
            <li>To schedule and confirm a requested meeting.</li>
            <li>To send the newsletter you explicitly opted into (you can unsubscribe anytime).</li>
          </ul>
        </Section>

        <Section title="Legal basis">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Consent:</strong> you actively submit a form or subscribe to the newsletter.</li>
            <li><strong>Legitimate interest:</strong> responding to inquiries and fulfilling meeting requests you initiated.</li>
          </ul>
        </Section>

        <Section title="How long we keep it">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Inquiries:</strong> 24 months from submission, then automatically archived.</li>
            <li><strong>Newsletter:</strong> until you unsubscribe, then removed within 30 days.</li>
            <li><strong>Meetings:</strong> 12 months after the scheduled date.</li>
          </ul>
        </Section>

        <Section title="Who has access">
          <p>Al Aminn personally, plus a small number of authorized staff who have role-based access (RBAC) scoped to the specific records they need to do their work. Every access is logged for audit.</p>
        </Section>

        <Section title="Third parties">
          <p>We do <strong>not</strong> sell, rent or trade your data. Data is stored in our own CRM (the Alaminn.info Command Center). Newsletter delivery and meeting-link providers process data only as our processors under written agreement.</p>
        </Section>

        <Section title="Your rights">
          <ul className="list-disc space-y-1 pl-5">
            <li>Access — see what we hold about you.</li>
            <li>Correction — fix anything that is wrong.</li>
            <li>Deletion — ask us to erase your records.</li>
            <li>Export — receive a copy of your data in a portable format.</li>
            <li>Withdrawal of consent — at any time, for any processing based on consent.</li>
          </ul>
        </Section>

        <Section title="How to exercise your rights">
          <p>
            Email{" "}
            <a href="mailto:privacy@alaminn.info" className="font-semibold text-primary underline-offset-2 hover:underline">
              privacy@alaminn.info
            </a>{" "}
            (this address forwards to Al Aminn directly). We respond within 30 days.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            This site uses a small set of essential and preference cookies. See the{" "}
            <Link href="/legal/terms" className="font-semibold text-primary underline-offset-2 hover:underline">
              Terms of Service
            </Link>{" "}
            for the related usage terms, and the in-footer Cookies notice for the full cookie list.
          </p>
        </Section>

        <Section title="Privacy-friendly analytics">
          <p>
            We built our own lightweight, first-party, cookie-less analytics system so we never have
            to load Google Analytics, Segment, Meta Pixel, or any other third-party script on this
            site. We collect only the page path, an anonymous daily-rotating session ID (stored in
            <code className="rounded bg-muted px-1 py-0.5 text-xs">localStorage</code>, not a cookie),
            a truncated sha256 hash of your IP (never the raw IP), and UTM parameters when present.
            We do <strong>not</strong> collect raw IPs, user IDs, emails, names, or device
            fingerprints, and we do not run cross-site tracking. The system respects Do Not Track —
            if you have it enabled, no analytics events are sent.
          </p>
        </Section>

        <Section title="Data breach response">
          <p>If a personal-data breach is confirmed, we will notify affected users without undue delay — and in any case within 72 hours of becoming aware of it — in line with good-practice incident response.</p>
        </Section>

        {/* Contact card */}
        <div className="mt-10 flex items-start gap-3 rounded-xl border bg-muted/30 p-5">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Privacy questions
            </div>
            <a
              href="mailto:privacy@alaminn.info"
              className="font-semibold text-foreground underline-offset-2 hover:underline"
            >
              privacy@alaminn.info
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/legal/terms">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Read Terms of Service
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
