"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  SectionCard,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { type ViewKey } from "@/lib/alo-types";

interface PublicPrivacyProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const SECTIONS = [
  {
    title: "1. Introduction",
    body: [
      "ALO Education (ALO, we, us) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website, mobile portal, services, or interact with our counselors.",
      "ALO Education was founded in February 2023 by Taslima Akter in Dhaka, Bangladesh. We are a study-abroad counseling service registered in Bangladesh.",
    ],
  },
  {
    title: "2. Data We Collect",
    body: [
      "We collect the following categories of personal data:",
      "• Identity data: full name, date of birth, gender, nationality, passport details.",
      "• Contact data: phone number, email, address, alternative phone.",
      "• Academic data: transcripts, certificates, English test scores, work experience.",
      "• Financial data: bank statements, sponsor details, scholarship information (only when required for visa applications).",
      "• Usage data: pages visited, time spent on site, IP address, browser type.",
      "• Communication data: messages exchanged with counselors, calls, emails, WhatsApp messages.",
      "• Document data: any document you upload to our secure Document Hub.",
    ],
  },
  {
    title: "3. How We Use Your Data",
    body: [
      "We use your personal data for the following purposes:",
      "• To provide study-abroad counseling and application support services.",
      "• To communicate with you about your applications, visa process, and university updates.",
      "• To apply to universities on your behalf (only with your explicit consent per application).",
      "• To apply for your student visa (only with your explicit consent).",
      "• To improve our services, website, and counseling quality.",
      "• To comply with legal and regulatory requirements in Bangladesh and your destination country.",
      "• To send you relevant news, scholarship alerts, and event invitations (you can opt out anytime).",
    ],
  },
  {
    title: "4. Legal Basis for Processing",
    body: [
      "We process your personal data based on:",
      "• Your explicit consent (when you submit forms, accept terms, or upload documents).",
      "• Contractual necessity (to provide the services you've requested).",
      "• Legal obligation (to comply with Bangladesh and international laws).",
      "• Legitimate interests (to improve our services and prevent fraud).",
    ],
  },
  {
    title: "5. Data Sharing",
    body: [
      "We share your data ONLY in the following circumstances:",
      "• With universities you've explicitly authorised us to apply to on your behalf.",
      "• With visa authorities (UKVI, IRCC, DHA, USCIS, INIS, INZ, etc.) when applying for your student visa.",
      "• With partner sub-agents ONLY when you've explicitly authorised this in writing.",
      "• With Bangladeshi law enforcement if legally compelled.",
      "• We NEVER sell your data to third parties.",
      "• We NEVER share your data with marketing companies.",
    ],
  },
  {
    title: "6. Data Security",
    body: [
      "We implement industry-standard security measures:",
      "• Role-Based Access Control (RBAC) — only authorised counselors can access your data.",
      "• All data access is audit-logged. You can request an audit log of who accessed your data.",
      "• Documents are stored with SHA-256 checksums in 3 access-controlled storage pools (STUDENT_PARTNER, OFFICIAL, OPERATIONAL).",
      "• Files are validated for MIME type and dangerous extensions (.exe, .sh, .php) are rejected.",
      "• Path traversal attacks are prevented via UUID storage naming.",
      "• Database backups are encrypted.",
      "• HTTPS/TLS encryption for all web traffic.",
    ],
  },
  {
    title: "7. Data Retention",
    body: [
      "We retain your data for the following periods:",
      "• Active student records: throughout your engagement with ALO + 7 years after your course ends.",
      "• Lead data (if you didn't enroll): 3 years from last contact, then deleted.",
      "• Document data: same as student records (7 years after course ends).",
      "• Audit logs: 7 years (legal requirement).",
      "• Marketing communications: until you unsubscribe.",
      "You can request early deletion of your data at any time (subject to legal retention requirements).",
    ],
  },
  {
    title: "8. Your Rights",
    body: [
      "You have the following rights regarding your personal data:",
      "• Right to access: request a copy of all data we hold about you.",
      "• Right to rectification: correct inaccurate data.",
      "• Right to erasure ('right to be forgotten'): request deletion of your data.",
      "• Right to restrict processing: limit how we use your data.",
      "• Right to data portability: receive your data in a structured, machine-readable format.",
      "• Right to object: object to specific processing activities.",
      "• Right to withdraw consent: withdraw any consent you've previously given.",
      "To exercise these rights, contact us at hello@aloeducation.com or call 01805020101.",
    ],
  },
  {
    title: "9. Cookies",
    body: [
      "We use minimal cookies to operate this website. See our Cookie Policy for details. You can control cookies through your browser settings.",
    ],
  },
  {
    title: "10. International Transfers",
    body: [
      "Your data may be transferred outside Bangladesh to universities and visa authorities in your destination country (UK, USA, Canada, Australia, Ireland, New Zealand, Germany, UAE, etc.). These transfers are necessary to provide our services and are subject to the data protection laws of those countries.",
    ],
  },
  {
    title: "11. Children's Privacy",
    body: [
      "Our services are not directed at children under 16. We do not knowingly collect data from children under 16. If you believe we have collected data from a child under 16, please contact us immediately.",
      "Students aged 16-18 must have parent or guardian consent to use our services.",
    ],
  },
  {
    title: "12. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. We will notify you of any material changes via email or WhatsApp at least 30 days before the changes take effect.",
      "Last updated: August 2025.",
    ],
  },
  {
    title: "13. Contact Us",
    body: [
      "If you have any questions about this Privacy Policy or want to exercise your data rights, contact us:",
      "ALO Education, House 25, Road 11, Banani, Dhaka 1213, Bangladesh.",
      "Phone: +880 1805 020101.",
      "Email: hello@aloeducation.com.",
    ],
  },
];

export function PublicPrivacy({ onNavigate }: PublicPrivacyProps) {
  return (
    <LegalLayout
      title="Privacy Policy"
      icon="ShieldCheck"
      subtitle="How ALO Education collects, uses, stores, and protects your personal data."
      onNavigate={onNavigate}
    >
      <div className="space-y-8">
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
      </div>
    </LegalLayout>
  );
}

// Shared layout component for legal pages
export function LegalLayout({
  title,
  icon,
  subtitle,
  onNavigate,
  children,
}: {
  title: string;
  icon: string;
  subtitle: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0B5ED7]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-white">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: title },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#EAF3FF] text-[#0B5ED7] border border-[#0B5ED7]/20 hover:bg-[#EAF3FF]">
              <Icon name={icon} className="mr-1 size-3" />
              Legal Document
            </Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0B2447] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[#5A7299] sm:text-lg">{subtitle}</p>
            <p className="mt-3 text-xs text-[#5A7299]">Last updated: August 2025</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-6 lg:py-16">
        {children}

        {/* Contact CTA */}
        <div className="mt-12 rounded-2xl border-2 border-[#0B5ED7]/15 bg-gradient-to-br from-[#EAF3FF]/60 to-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-bold text-[#0B2447]">Questions about this policy?</p>
              <p className="text-sm text-[#5A7299]">Our team is happy to clarify any section.</p>
            </div>
            <Button onClick={() => onNavigate("public-contact")} className="h-11 shrink-0 bg-[#F97316] text-white hover:bg-[#c8451a]">
              <Icon name="Phone" className="size-4" />
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default PublicPrivacy;
