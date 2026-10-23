import { Metadata } from 'next';
import Link from 'next/link';
import { ApplicationProcessDiagram, IntakeTimelineDiagram } from '@/components/diagrams';
import { AloCtaLink } from '@/components/website/AloCtaLink';

export const metadata: Metadata = {
  title: 'International Study Application Process | ALO Education Bangladesh',
  description: 'Understand the step-by-step application process for studying abroad. From profile evaluation to university application and visa processing.',
};

export default function ApplicationProcessPage() {
  const steps = [
    {
      step: 1,
      title: "Profile Evaluation & Eligibility Check",
      description: "Our experts analyze your academic background, test scores, and career goals to determine the best study destinations and programs for you.",
      timeframe: "1-2 Days",
      documents: ["Academic Transcripts", "CV/Resume", "Language Test Scores (if available)"]
    },
    {
      step: 2,
      title: "Course & University Shortlisting",
      description: "We help you select up to 4 universities that perfectly match your profile, budget, and future career aspirations.",
      timeframe: "3-5 Days",
      documents: ["Career Goals Questionnaire"]
    },
    {
      step: 3,
      title: "ALO Counselor 1-on-1 Review Session",
      description: "A detailed session to finalize your university choices and discuss the exact requirements for each application.",
      timeframe: "1 Day",
      documents: []
    },
    {
      step: 4,
      title: "Document Verification & Translation",
      description: "We ensure all your documents are authenticated, translated if necessary, and formatted according to university standards.",
      timeframe: "3-7 Days",
      documents: ["Passport", "Recommendation Letters", "Statement of Purpose (SOP)"]
    },
    {
      step: 5,
      title: "University Application Submission",
      description: "Our team meticulously fills out and submits your applications to the chosen universities, ensuring zero errors.",
      timeframe: "1-2 Weeks",
      documents: ["Application Forms", "Application Fees (if applicable)"]
    },
    {
      step: 6,
      title: "Offer Letter Processing",
      description: "We track your applications and assist in fulfilling any conditions to secure an Unconditional Offer Letter.",
      timeframe: "2-6 Weeks",
      documents: ["Conditional/Unconditional Offer Letters"]
    },
    {
      step: 7,
      title: "Deposit Payment & Visa Document Issuance",
      description: "Guidance on paying tuition deposits safely to receive vital visa documents like CAS (UK), COE (Australia), or I-20 (USA).",
      timeframe: "1-3 Weeks",
      documents: ["Bank Statements", "Financial Affidavits"]
    },
    {
      step: 8,
      title: "Visa Application & Pre-Departure Briefing",
      description: "Comprehensive visa interview preparation, application submission, and a final briefing to get you ready for campus life.",
      timeframe: "3-8 Weeks",
      documents: ["Visa Application Forms", "Medical Certificates (if required)"]
    }
  ];

  const faqs = [
    {
      question: "How long does the entire application process take?",
      answer: "The complete process from profile evaluation to visa approval typically takes 3 to 6 months, depending on the intake and country."
    },
    {
      question: "Do I need to pay an application fee for universities?",
      answer: "Some universities charge application fees, while others offer waivers. We prioritize universities offering fee waivers for our students whenever possible."
    },
    {
      question: "Is the ALO Education counseling service free?",
      answer: "Yes, our initial counseling and university shortlisting services are completely free of charge."
    },
    {
      question: "Can I apply without an IELTS score?",
      answer: "While IELTS is preferred, many universities accept alternatives like PTE, Duolingo, or offer English waivers based on your academic background (Medium of Instruction letter)."
    },
    {
      question: "What happens if my visa gets rejected?",
      answer: "In the rare event of a visa rejection, our team will analyze the reasons and guide you through the re-application process or explore alternative destinations."
    }
  ];

  return (
    <div className="pt-20 bg-[var(--alo-page)] min-h-screen">
      
      {/* Hero Section */}
      <section className="bg-[var(--alo-brand)] text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--alo-cta)] opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl relative z-10">
          <span className="inline-block bg-[var(--alo-cta)] text-black text-sm font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide">YOUR PATHWAY TO SUCCESS</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">International Study Application Process</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            A transparent, step-by-step roadmap to guide you from your first consultation to your first day on campus.
          </p>
        </div>
      </section>

      {/* Diagram Section — who does what + honest intake timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl space-y-10">
          <ApplicationProcessDiagram />
          <IntakeTimelineDiagram />
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <AloCtaLink href="/book-consultation">Book a Free Session</AloCtaLink>
            <AloCtaLink href="/eligibility-check" variant="brand">Check Your Eligibility</AloCtaLink>
          </div>
        </div>
      </section>

      {/* Stepper / Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-[var(--alo-cta)] before:via-[var(--alo-brand)] before:to-gray-200">
            
            {steps.map((step, index) => (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[var(--alo-brand)] text-white font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {step.step}
                </div>
                
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--alo-border)] hover:shadow-lg transition-shadow">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <h3 className="text-xl font-bold text-[var(--alo-text)]">{step.title}</h3>
                    <span className="bg-orange-50 text-[var(--alo-cta)] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {step.timeframe}
                    </span>
                  </div>
                  <p className="text-[var(--alo-body)] mb-6 text-sm md:text-base">{step.description}</p>
                  
                  {step.documents.length > 0 && (
                    <div className="bg-[var(--alo-page)] rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-[var(--alo-text)] mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--alo-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Key Documents:
                      </h4>
                      <ul className="list-disc list-inside text-sm text-[var(--alo-body)] space-y-1">
                        {step.documents.map((doc, i) => (
                          <li key={i}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--alo-text)] mb-4">Frequently Asked Questions</h2>
            <p className="text-[var(--alo-body)]">Everything you need to know about the application journey.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group bg-[var(--alo-page)] rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden border border-[var(--alo-border)]">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-[var(--alo-text)] text-lg">
                  {faq.question}
                  <span className="transition group-open:rotate-180 bg-white p-2 rounded-full shadow-sm text-[var(--alo-brand)]">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-6 pt-0 text-[var(--alo-body)] leading-relaxed text-base border-t border-[var(--alo-border)] mt-2 mx-6">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[var(--alo-brand)] to-blue-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--alo-cta)] opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Your Application?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of successful students who have realized their study abroad dreams with ALO Education.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/book-consultation" className="bg-[var(--alo-cta)] hover:bg-orange-600 text-black font-bold py-4 px-8 rounded-xl text-lg transition-colors shadow-lg hover:shadow-xl">
              Book a Free Session
            </Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-bold py-4 px-8 rounded-xl text-lg transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
