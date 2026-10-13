'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Calendar,
  Lock,
  Eye,
  Database,
  Share2,
  UserCheck,
  Globe,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const LAST_UPDATED = 'February 1, 2025';

const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction',
    icon: Shield,
    content: `ALO Education Consultancy ("ALO," "we," "us," or "our") is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, store, and disclose personal information when you use our website, mobile application, and services (collectively, the "Services").

This policy applies to all users of our Services, including prospective students, current students, parents, guardians, educational institution representatives, and business partners.

We comply with the Digital Security Act, 2023 of Bangladesh and align our practices with international data protection standards including the EU General Data Protection Regulation (GDPR) where applicable to our international users.`,
  },
  {
    id: 'data-collection',
    title: '2. Information We Collect',
    icon: Database,
    content: `We collect the following categories of personal information:

2.1 Information You Provide Directly:
• Full name, email address, phone number, and postal address
• Date of birth, nationality, and passport information
• Academic records, test scores (IELTS, TOEFL, GRE, GMAT, SAT), and transcripts
• University and program preferences
• Financial information for scholarship and funding assessments
• Documents uploaded for application assistance (CVs, SOPs, recommendation letters)
• Communication preferences and feedback

2.2 Information Collected Automatically:
• IP address, browser type, device information, and operating system
• Pages visited, features used, and time spent on the Services
• Referral source and search terms used to find our website
• Cookie and tracking pixel data (see our Cookie Policy)

2.3 Information from Third Parties:
• University partners may share application status updates
• Test preparation platforms may share score reports (with your consent)
• Referral partners may share basic contact information
• Public social media profiles if you connect social accounts`,
  },
  {
    id: 'data-usage',
    title: '3. How We Use Your Information',
    icon: Eye,
    content: `We use your personal information for the following purposes:

3.1 Service Delivery: To provide, operate, and improve our education consultancy services, including university search, application assistance, and visa guidance.

3.2 Communication: To respond to your inquiries, send application updates, event invitations, and newsletters (with your consent).

3.3 Personalization: To tailor our recommendations, content, and services to your educational goals and preferences.

3.4 Analytics: To analyze usage patterns, measure the effectiveness of our services, and improve user experience.

3.5 Compliance: To comply with legal obligations, respond to lawful requests from public authorities, and enforce our Terms of Service.

3.6 Marketing: To send promotional communications about our services, events, and partner offerings (with your opt-in consent).

3.7 Security: To detect, prevent, and address fraud, security issues, and technical problems.

3.8 Research: To conduct internal research and develop new services, always in aggregated or anonymized form.`,
  },
  {
    id: 'data-protection',
    title: '4. Data Protection & Security',
    icon: Lock,
    content: `We implement robust technical and organizational measures to protect your personal information:

4.1 Encryption: All data in transit is encrypted using TLS 1.3. Sensitive data at rest is encrypted using AES-256 encryption.

4.2 Access Controls: Role-based access controls limit employee access to personal data on a need-to-know basis. All access is logged and audited.

4.3 Secure Infrastructure: Our systems are hosted on SOC 2 Type II certified cloud infrastructure with regular security assessments and penetration testing.

4.4 Data Minimization: We collect only the personal data necessary for the purposes described in this policy.

4.5 Retention: Personal data is retained only for as long as necessary for the stated purpose or as required by law. Application-related data is retained for 7 years; marketing data is retained until consent is withdrawn.

4.6 Breach Response: In the event of a data breach, we will notify affected users within 72 hours and the relevant authorities as required by law.

4.7 Regular Audits: We conduct annual data protection audits and vulnerability assessments to ensure ongoing compliance and security.`,
  },
  {
    id: 'third-parties',
    title: '5. Third-Party Sharing',
    icon: Share2,
    content: `We share your personal information only in the following circumstances:

5.1 University Partners: With your explicit consent, we share application-related information with universities and educational institutions you are applying to. This includes academic records, test scores, and application documents.

5.2 Service Providers: We share data with trusted third-party service providers who assist in operating our Services (e.g., cloud hosting, email delivery, analytics, payment processing). These providers are bound by data processing agreements and may not use your data for other purposes.

5.3 Legal Requirements: We may disclose information when required by law, in response to legal processes, or to protect the rights, property, or safety of ALO Education, our users, or the public.

5.4 Business Transfers: In the event of a merger, acquisition, or sale of assets, your personal data may be transferred to the acquiring entity, subject to the same privacy protections.

5.5 We do NOT sell, rent, or trade your personal information to third parties for marketing purposes.

5.6 We do NOT share your personal information with social media platforms for advertising targeting.`,
  },
  {
    id: 'your-rights',
    title: '6. Your Rights',
    icon: UserCheck,
    content: `You have the following rights regarding your personal data:

6.1 Access: You can request a copy of the personal data we hold about you at any time.

6.2 Correction: You can update or correct inaccurate personal data through your account settings or by contacting us.

6.3 Deletion: You can request deletion of your personal data, subject to legal retention requirements. We will delete data within 30 days of a valid request, except where retention is required by law.

6.4 Portability: You can request your personal data in a structured, machine-readable format for transfer to another service provider.

6.5 Objection: You can object to the processing of your personal data for direct marketing purposes at any time.

6.6 Restriction: You can request that we restrict the processing of your personal data in certain circumstances, such as when you contest the accuracy of the data.

6.7 Consent Withdrawal: Where processing is based on consent, you can withdraw your consent at any time without affecting the lawfulness of processing prior to withdrawal.

To exercise any of these rights, contact us at privacy@aloeducation.com or through your account settings. We will respond to your request within 30 days.`,
  },
  {
    id: 'cookies',
    title: '7. Cookies & Tracking Technologies',
    icon: Globe,
    content: `We use cookies and similar technologies to enhance your experience on our platform. This includes:

• Essential cookies for site functionality and security
• Analytics cookies to understand how you use our Services
• Preference cookies to remember your settings and choices
• Marketing cookies to deliver relevant advertisements (with consent)

For detailed information about the cookies we use and how to manage them, please read our Cookie Policy.

You can manage your cookie preferences at any time through your browser settings or our cookie consent tool.`,
  },
  {
    id: 'children',
    title: '8. Children&apos;s Privacy',
    icon: Shield,
    content: `Our Services are not directed to children under the age of 16. We do not knowingly collect personal information from children under 16 without parental consent.

If we become aware that we have collected personal data from a child under 16 without verified parental consent, we will take steps to delete that information promptly.

Parents or guardians who believe their child has provided personal information to us should contact us immediately at privacy@aloeducation.com.`,
  },
  {
    id: 'international',
    title: '9. International Data Transfers',
    icon: Globe,
    content: `As an international education consultancy, your personal data may be transferred to and processed in countries other than Bangladesh, including the UK, Australia, New Zealand, Ireland, USA, and Canada.

We ensure that international transfers are protected by:
• Standard contractual clauses approved by relevant data protection authorities
• Adequacy decisions where the receiving country provides sufficient data protection
• Explicit consent for transfers to countries without adequate protection
• Encryption of data in transit for all international transfers`,
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    icon: Bell,
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors.

When we make material changes, we will:
• Post the updated policy on our website with a new "Last Updated" date
• Send email notification to registered users for significant changes
• Obtain new consent where required by law

We encourage you to review this Privacy Policy periodically. Your continued use of the Services after any changes constitutes acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    icon: Bell,
    content: `For any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Officer:

ALO Education Consultancy — Data Protection Office
House 45, Road 11, Gulshan-2
Dhaka 1212, Bangladesh

Email: privacy@aloeducation.com
Phone: +880 2 9854 3210

We aim to respond to all privacy-related inquiries within 10 business days.

If you are not satisfied with our response, you may lodge a complaint with the relevant data protection authority in your jurisdiction.`,
  },
];

export function PrivacyPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Back button */}
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative bg-[#0052B8] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full border-2 border-white" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8" />
            <Badge className="bg-white/20 text-white border-white/30">Legal</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-white/90 max-w-2xl mb-6">
            Your privacy is important to us. This policy explains how ALO Education collects, uses, and protects your personal information.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-white/80">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Last Updated: {LAST_UPDATED}</span>
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="text-sm font-semibold text-slate-500 mb-4">KEY PRIVACY COMMITMENTS</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Lock className="h-5 w-5 text-[#0052B8]" />, title: 'AES-256 Encryption', desc: 'Industry-standard encryption for data at rest' },
              { icon: <UserCheck className="h-5 w-5 text-[#0052B8]" />, title: 'Your Rights Protected', desc: 'Access, correct, delete your data anytime' },
              { icon: <Share2 className="h-5 w-5 text-[#0052B8]" />, title: 'No Data Selling', desc: 'We never sell your personal information' },
              { icon: <Shield className="h-5 w-5 text-[#0052B8]" />, title: 'GDPR Aligned', desc: 'International best practices for data protection' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-100">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:border-[#0052B8] hover:text-[#0052B8] transition-all"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="space-y-10">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <div key={section.id} id={section.id} className="scroll-mt-24">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                    <Icon className="h-5 w-5 text-[#0052B8]" />
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{section.title}</h2>
                  </div>
                  <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Have Privacy Questions?</h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            Our Data Protection Officer is available to address any concerns about how we handle your data.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-6">
              Contact DPO
            </Button>
            <Button variant="outline" onClick={() => onNavigate('cookie-policy')} className="border-[#0052B8] text-[#0052B8] hover:bg-[#0052B8]/5">
              Cookie Policy
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
