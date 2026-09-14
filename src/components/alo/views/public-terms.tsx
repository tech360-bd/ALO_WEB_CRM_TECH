"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Icon,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { LegalLayout } from "@/components/alo/views/public-privacy";
import { type ViewKey } from "@/lib/alo-types";

interface PublicTermsProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing and using the ALO Education website (aloeducation.com), mobile portal, or any of our services, you agree to be bound by these Terms of Service ('Terms'). If you do not agree to these Terms, please do not use our services.",
      "These Terms form a legally binding agreement between you ('the Student', 'you') and ALO Education ('ALO', 'we', 'us').",
    ],
  },
  {
    title: "2. Our Services",
    body: [
      "ALO Education provides the following services to Bangladeshi students seeking to study abroad:",
      "• Free counseling and profile assessment.",
      "• University shortlisting and application support.",
      "• SOP and CV writing support.",
      "• Scholarship guidance and application support.",
      "• Visa application support (document review, form filling, biometrics booking).",
      "• English test preparation and free mock tests.",
      "• Pre-departure and post-arrival support.",
      "• Mock credibility interview practice.",
      "All our services are 100% free for students. We are funded by partner university commissions.",
    ],
  },
  {
    title: "3. Your Obligations",
    body: [
      "As a student using our services, you agree to:",
      "• Provide accurate, truthful, and complete information at all times.",
      "• Submit original documents (no forgeries, alterations, or fabricated documents).",
      "• Respond to counselor requests within reasonable timeframes.",
      "• Not misrepresent your academic credentials, English scores, or financial status.",
      "• Pay university application fees, deposits, and visa fees as required (ALO does not pay these on your behalf).",
      "• Attend scheduled counseling sessions and mock interviews on time.",
      "• Use our Document Hub only for genuine application documents.",
    ],
  },
  {
    title: "4. Honesty & Anti-Fraud Policy",
    body: [
      "ALO Education operates a strict anti-fraud policy:",
      "• We will NEVER submit a fabricated document on your behalf.",
      "• We will NEVER help you falsify academic transcripts, English test scores, bank statements, or any other document.",
      "• If we discover that you have submitted fabricated documents, we will immediately terminate our services, report to relevant authorities, and may notify the affected universities.",
      "• We will NEVER encourage you to lie in your SOP, visa interview, or credibility interview.",
      "• We will NEVER advise you to overstate or understate your financial situation.",
      "Honesty protects you. Fraud can result in visa refusal, university expulsion, and a 10-year ban from entering your destination country.",
    ],
  },
  {
    title: "5. Application Outcomes",
    body: [
      "While ALO counselors work hard to maximise your chance of admission, we cannot guarantee:",
      "• University admission (final decisions rest with the university).",
      "• Scholarship awards (final decisions rest with the scholarship committee).",
      "• Visa approval (final decisions rest with the visa officer).",
      "• Specific processing times (set by universities and visa authorities, not ALO).",
      "We commit to providing expert guidance, complete document preparation, and timely submission — but the final decision is always outside our control.",
    ],
  },
  {
    title: "6. Application Fees & Refunds",
    body: [
      "Application fees charged by universities are non-refundable once submitted. ALO does not charge any service fees to students.",
      "If you've paid a deposit to a university and your visa is refused, refund policies vary by university:",
      "• Some universities refund 100% of the deposit with proof of visa refusal.",
      "• Some universities retain an administrative fee (typically £500-£1,000).",
      "• Some universities refund only if refusal is appealed and overturned.",
      "ALO will help you request a refund from the university, but the final decision rests with the university.",
    ],
  },
  {
    title: "7. Document Storage & Access",
    body: [
      "Documents you upload to our Document Hub are:",
      "• Stored on secure, access-controlled servers in Bangladesh.",
      "• Accessible only to authorised counselors (RBAC-controlled).",
      "• Audit-logged (every access is recorded with timestamp and user ID).",
      "• Retained for 7 years after your course ends (legal requirement).",
      "• Never shared with third parties without your explicit written consent.",
      "You can request deletion of your documents at any time (subject to legal retention requirements). See our Privacy Policy for details.",
    ],
  },
  {
    title: "8. Intellectual Property",
    body: [
      "All content on this website — including blog posts, course information, university profiles, FAQ answers, and design elements — is the intellectual property of ALO Education unless otherwise stated.",
      "You may not reproduce, republish, or redistribute our content without written permission.",
      "SOPs, CVs, and other documents we help you create remain your intellectual property — we do not retain copyright over your personal documents.",
    ],
  },
  {
    title: "9. Prohibited Use",
    body: [
      "You may not use our website or services to:",
      "• Submit fabricated or altered documents.",
      "• Apply to universities on behalf of another person without their consent.",
      "• Send spam, viruses, or malicious code through our forms or portals.",
      "• Scrape, copy, or systematically extract our content.",
      "• Impersonate another student or ALO staff member.",
      "• Use our platform for any illegal activity.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, ALO Education shall not be liable for:",
      "• University admission refusals (final decisions rest with universities).",
      "• Visa refusals (final decisions rest with visa officers).",
      "• Changes to visa, immigration, or university policies after your application is submitted.",
      "• Delays caused by universities, visa authorities, or third-party services.",
      "• Loss of scholarship opportunities due to missed deadlines (if you failed to provide required information on time).",
      "• Any indirect, incidental, or consequential damages arising from your use of our services.",
      "Our total liability for any claim arising from these Terms is limited to the total fees paid by you to ALO Education (which is typically zero, as our services are free for students).",
    ],
  },
  {
    title: "11. Indemnification",
    body: [
      "You agree to indemnify and hold ALO Education harmless from any claims, damages, or losses arising from:",
      "• Your submission of inaccurate or fabricated information.",
      "• Your violation of these Terms.",
      "• Your violation of any rights of a third party (including universities, visa authorities, or other students).",
    ],
  },
  {
    title: "12. Termination",
    body: [
      "ALO may terminate or suspend your access to our services if:",
      "• You breach any of these Terms.",
      "• You submit fabricated or fraudulent documents.",
      "• You harass, threaten, or abuse our staff or other students.",
      "• Your account is inactive for more than 24 months.",
      "You may terminate your engagement with ALO at any time by notifying us in writing.",
    ],
  },
  {
    title: "13. Governing Law",
    body: [
      "These Terms are governed by the laws of the People's Republic of Bangladesh.",
      "Any disputes arising from these Terms shall be resolved in the courts of Dhaka, Bangladesh.",
      "We will always attempt to resolve disputes amicably through direct communication before pursuing legal action.",
    ],
  },
  {
    title: "14. Changes to Terms",
    body: [
      "We may update these Terms of Service from time to time. We will notify you of any material changes via email or WhatsApp at least 30 days before the changes take effect.",
      "Last updated: August 2025.",
    ],
  },
  {
    title: "15. Contact Us",
    body: [
      "If you have any questions about these Terms, contact us:",
      "ALO Education, House 25, Road 11, Banani, Dhaka 1213, Bangladesh.",
      "Phone: +880 1805 020101.",
      "Email: hello@aloeducation.com.",
    ],
  },
];

export function PublicTerms({ onNavigate }: PublicTermsProps) {
  return (
    <LegalLayout
      title="Terms of Service"
      icon="FileText"
      subtitle="The terms and conditions for using ALO Education's website and services."
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
export default PublicTerms;
