'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Scale,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const LAST_UPDATED = 'February 1, 2025';
const EFFECTIVE_DATE = 'March 1, 2025';

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using the ALO Education website, mobile application, or any of our services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use our Services.

These Terms constitute a legally binding agreement between you ("User," "you," or "your") and ALO Education Consultancy ("ALO," "we," "us," or "our"), a registered education consultancy based in Dhaka, Bangladesh.

We reserve the right to modify these Terms at any time. Changes will be effective upon posting to our website. Your continued use of the Services after any modification constitutes your acceptance of the updated Terms.`,
  },
  {
    id: 'services',
    title: '2. Description of Services',
    content: `ALO Education provides the following services to students and educational institutions:

2.1 University Search & Application Assistance: We help students search for, evaluate, and apply to universities and educational institutions in the UK, Australia, New Zealand, Ireland, USA, and Canada.

2.2 Visa Guidance: We provide information and guidance on student visa applications for our destination countries. ALO Education is not a licensed immigration advisor and our guidance should not be considered legal immigration advice.

2.3 Scholarship Information: We curate and share scholarship opportunities available to Bangladeshi students. We do not guarantee scholarship awards.

2.4 Test Preparation Resources: We offer information and resources for standardized tests including IELTS, TOEFL, GRE, GMAT, and SAT.

2.5 Document Assistance: We assist with preparing application documents including Statements of Purpose, CVs, and recommendation letters.

2.6 Event Organization: We organize university fairs, webinars, and information sessions connecting students with institution representatives.

2.7 Career Counselling: We provide general career guidance related to international education pathways.`,
  },
  {
    id: 'eligibility',
    title: '3. User Eligibility',
    content: `3.1 You must be at least 16 years of age to use our Services.

3.2 If you are under 18, you must have the consent of a parent or legal guardian to use our Services and agree to these Terms.

3.3 You must provide accurate, current, and complete information during registration and throughout your use of the Services.

3.4 You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.

3.5 You must not create multiple accounts or use another user's account without authorization.`,
  },
  {
    id: 'user-conduct',
    title: '4. User Conduct',
    content: `You agree not to:

4.1 Use the Services for any unlawful purpose or in violation of any applicable laws or regulations.

4.2 Submit false, misleading, or fraudulent information in applications or inquiries.

4.3 Impersonate any person or entity or misrepresent your affiliation with any person or entity.

4.4 Interfere with or disrupt the Services, servers, or networks connected to the Services.

4.5 Use any automated means (including bots, scrapers, or spiders) to access the Services for any purpose without our express written permission.

4.6 Attempt to gain unauthorized access to any portion of the Services or any systems or networks connected to the Services.

4.7 Upload or transmit viruses, malware, or any other malicious code.

4.8 Use the Services to send unsolicited commercial communications (spam).

4.9 Reverse engineer, decompile, or disassemble any part of the Services.

4.10 Copy, modify, or distribute any content from the Services without our prior written consent.`,
  },
  {
    id: 'intellectual-property',
    title: '5. Intellectual Property',
    content: `5.1 All content, features, and functionality of the Services—including but not limited to text, graphics, logos, icons, images, audio, video, data compilations, software, and the design, selection, and arrangement thereof—are owned by ALO Education or its licensors and are protected by international copyright, trademark, patent, and other intellectual property laws.

5.2 The ALO Education name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of ALO Education Consultancy. You may not use these marks without our prior written permission.

5.3 University names, logos, and trademarks referenced on our platform belong to their respective institutions and are used for informational purposes only.

5.4 You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any content from the Services without our prior written consent, except as permitted by law.`,
  },
  {
    id: 'fees-payment',
    title: '6. Fees and Payment',
    content: `6.1 Some of our Services may require payment of fees. All fees are quoted in Bangladeshi Taka (BDT) or the relevant foreign currency as indicated.

6.2 Consultation fees for our core advising services are outlined in our service agreement, which is separate from these Terms.

6.3 Application assistance fees vary by service tier and destination country. Current fee schedules are available upon request.

6.4 Refund Policy: Fees for completed services are non-refundable. For services not yet commenced, refund requests must be submitted in writing within 14 business days of payment. Refunds, if approved, will be processed within 30 business days.

6.5 We are not responsible for any bank charges, currency conversion fees, or third-party transaction fees.

6.6 Failure to pay applicable fees may result in suspension or termination of your access to the relevant Services.`,
  },
  {
    id: 'limitations',
    title: '7. Limitation of Liability',
    content: `7.1 ALO Education provides guidance and assistance only. We do not guarantee admission to any university, approval of any visa application, or award of any scholarship.

7.2 Admission decisions are made solely by the respective universities. Visa decisions are made solely by the relevant immigration authorities.

7.3 To the maximum extent permitted by applicable law, ALO Education shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or goodwill.

7.4 Our total liability for any claim arising out of or relating to these Terms or the Services shall not exceed the total fees you have paid to ALO Education in the twelve (12) months preceding the claim.

7.5 We are not responsible for the actions or decisions of third parties, including universities, immigration authorities, or financial institutions.`,
  },
  {
    id: 'disclaimers',
    title: '8. Disclaimers',
    content: `8.1 The Services are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, implied, or statutory.

8.2 We do not warrant that the Services will be uninterrupted, error-free, or free of viruses or other harmful components.

8.3 Information provided through the Services—including university requirements, visa regulations, scholarship details, and tuition fees—is for general guidance only and may change without notice. You should verify all information directly with the relevant institution or authority.

8.4 Any links to third-party websites or resources are provided for convenience only. We do not endorse and are not responsible for the content, products, or services of any third-party site.

8.5 Success stories and testimonials featured on our platform represent individual experiences and are not indicative of guaranteed outcomes.`,
  },
  {
    id: 'termination',
    title: '9. Termination',
    content: `9.1 You may terminate your account at any time by contacting us or through your account settings.

9.2 We may suspend or terminate your access to the Services at any time, with or without cause, and with or without notice.

9.3 Causes for termination include, but are not limited to: violation of these Terms, fraudulent activity, abuse of our Services, or conduct that could cause harm to ALO Education or other users.

9.4 Upon termination, your right to use the Services ceases immediately. Provisions that by their nature should survive termination—including Sections 5, 7, 8, and 10—shall remain in effect.

9.5 Termination does not relieve you of any obligations to pay fees incurred prior to termination.`,
  },
  {
    id: 'governing-law',
    title: '10. Governing Law & Dispute Resolution',
    content: `10.1 These Terms are governed by and construed in accordance with the laws of the People's Republic of Bangladesh.

10.2 Any dispute arising out of or in connection with these Terms shall first be resolved through good-faith negotiation between the parties.

10.3 If negotiation fails, disputes shall be submitted to binding arbitration in Dhaka, Bangladesh, in accordance with the Arbitration Act, 2001.

10.4 You agree to resolve disputes with ALO Education on an individual basis and waive any right to participate in class action lawsuits or class-wide arbitration.

10.5 Any claims not resolved within one (1) year of the date the claim arose shall be forever barred.`,
  },
  {
    id: 'contact',
    title: '11. Contact Information',
    content: `For questions about these Terms of Service, please contact us:

ALO Education Consultancy
House 45, Road 11, Gulshan-2
Dhaka 1212, Bangladesh

Phone: +880 2 9854 3210
Email: legal@aloeducation.com
Website: www.aloeducation.com

Office Hours: Sunday – Thursday, 9:00 AM – 6:00 PM (BST)`,
  },
];

export function TermsPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
            <Scale className="h-8 w-8" />
            <Badge className="bg-white/20 text-white border-white/30">Legal</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-white/90 max-w-2xl mb-6">
            Please read these terms carefully before using our services. By using ALO Education, you agree to these terms.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-white/80">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Last Updated: {LAST_UPDATED}</span>
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Effective: {EFFECTIVE_DATE}</span>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-3">JUMP TO SECTION</h3>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-[#0052B8] hover:text-[#0052B8] transition-all"
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
          {/* Intro Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-10">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Important Notice:</strong> These Terms of Service govern your use of ALO Education&apos;s website and services. They define your rights and obligations when using our platform for international education guidance. We recommend reviewing these terms in full. If you have questions, contact us at <span className="text-[#0052B8] font-medium">legal@aloeducation.com</span>.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {SECTIONS.map(section => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <div className="border-b border-slate-200 pb-3 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">{section.title}</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Acknowledgment CTA */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Questions About Our Terms?</h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            If you have any questions or concerns about these Terms of Service, our legal team is here to help.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-6">
              Contact Us
            </Button>
            <Button variant="outline" onClick={() => onNavigate('privacy')} className="border-[#0052B8] text-[#0052B8] hover:bg-[#0052B8]/5">
              View Privacy Policy
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
