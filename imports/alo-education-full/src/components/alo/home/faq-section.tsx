'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does ALO Education help me study abroad?',
    answer:
      "ALO Education provides end-to-end support for your study abroad journey. From AI-powered course matching and university selection to application processing, visa guidance, and pre-departure preparation \u2014 we handle everything so you can focus on your goals.",
  },
  {
    question: "Is ALO Education's service free for students?",
    answer:
      "Yes! Our consultation and application support services are completely free for students. We are partnered with universities who fund our services, so you get expert guidance at no cost.",
  },
  {
    question: 'What countries can I study in through ALO?',
    answer:
      'ALO Education partners with 500+ universities across 14 countries including UK, USA, Canada, Australia, New Zealand, Ireland, Germany, UAE, France, Netherlands, Italy, Malta, Cyprus, and South Korea.',
  },
  {
    question: 'How do I get started?',
    answer:
      "Simply click 'Find My Course' or 'Talk to Expert' on our homepage. Our AI Course Finder will match you with suitable programs, or you can speak directly with an expert counsellor who will guide you through the process.",
  },
  {
    question: 'What documents do I need to apply?',
    answer:
      'Typically you need: academic transcripts, passport, English test score (IELTS/PTE/TOEFL), CV, personal statement, reference letters, and financial documents. Our team will guide you on specific requirements for your chosen university.',
  },
  {
    question: 'Can ALO help with scholarships?',
    answer:
      "Absolutely! Our AI scholarship matching engine identifies scholarships you are eligible for based on your academic profile, country, and chosen course. We have helped students secure over \u00A32.5 million in scholarships.",
  },
  {
    question: 'What is the visa success rate with ALO?',
    answer:
      'ALO Education maintains a 98% visa success rate. Our experienced visa team reviews every application thoroughly, conducts mock interviews, and ensures all documentation meets the requirements before submission.',
  },
  {
    question: 'How long does the application process take?',
    answer:
      'The typical timeline is 4-8 weeks from application to offer letter, plus 3-6 weeks for visa processing. We recommend starting at least 6 months before your intended intake date.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
};

export function FaqSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="bg-alo-gray-light py-16 sm:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="mb-3 inline-flex items-center justify-center rounded-full bg-[#0066CC]/8 p-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-[#0066CC]" />
          </span>
          <span className="mb-3 inline-block rounded-full bg-alo-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-alo-blue">
            FAQ
          </span>
          <h2
            id="faq-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-alo-dark sm:text-4xl"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-alo-gray leading-relaxed">
            Everything you need to know about studying abroad with ALO
            Education.
          </p>
        </div>

        {/* FAQ Accordion */}
        <motion.div
          className="mx-auto max-w-3xl"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem
                  value={`faq-${index}`}
                  className="border-alo-border/50"
                >
                  <AccordionTrigger className="gap-4 py-5 text-left text-base font-semibold text-alo-dark hover:no-underline hover:text-alo-blue sm:text-lg [&>svg]:text-alo-blue [&>svg]:size-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-alo-gray leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
