'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  HelpCircle,
  ArrowRight,
  Search,
  GraduationCap,
  Shield,
  DollarSign,
  BookOpen,
  Plane,
  MessageSquare,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

const faqCategories = [
  {
    category: 'General',
    icon: <HelpCircle className="h-5 w-5" />,
    faqs: [
      { q: 'What is ALO Education?', a: 'ALO Education is Bangladesh\'s leading education consultancy with over 15 years of experience. We help students achieve their dreams of studying abroad by providing comprehensive services including career counseling, university selection, application processing, visa guidance, and pre-departure support.' },
      { q: 'Where is ALO Education located?', a: 'Our head office is located at House 12, Road 27, Banani, Dhaka 1213, Bangladesh. We also have satellite offices in Chittagong and Sylhet. You can visit us Monday through Saturday from 9 AM to 6 PM.' },
      { q: 'Are your services free?', a: 'We offer free initial consultations to all students. Some specialized services like IELTS/PTE preparation and premium counseling packages may have fees. However, our core application processing and visa guidance services are included when you enroll with us.' },
      { q: 'How is ALO Education different from other consultancies?', a: 'ALO Education stands out with our 98% visa success rate, 200+ direct university partnerships, AI-powered university matching, UKVI-certified visa consultants, and comprehensive end-to-end support from application to arrival.' },
    ],
  },
  {
    category: 'Study Abroad',
    icon: <GraduationCap className="h-5 w-5" />,
    faqs: [
      { q: 'What countries can I study in through ALO Education?', a: 'We help students apply to universities in the UK, USA, Canada, Australia, Europe (Germany, Netherlands, Ireland, Sweden, Italy, France), and Malaysia. Each destination has unique advantages, and our counselors can help you choose the best fit.' },
      { q: 'What are the entry requirements for studying abroad?', a: 'Requirements vary by country, university, and program. Generally, you need academic transcripts, English language proficiency (IELTS/TOEFL/PTE), a personal statement, and financial proof. Our counselors assess your profile and guide you on specific requirements.' },
      { q: 'Can I work while studying abroad?', a: 'Yes, most countries allow part-time work. UK: 20 hours/week during term, USA: on-campus work only, Canada: 20 hours/week, Australia: 48 hours/fortnight, Europe: 20 hours/week (varies), Malaysia: 20 hours/week. Post-study work options are also available.' },
      { q: 'How long does the application process take?', a: 'The timeline varies: UK applications take 2-4 weeks for offers, USA 4-8 weeks, Canada 4-8 weeks, Australia 2-4 weeks. Visa processing adds another 2-12 weeks depending on the country. We recommend starting 6-12 months before your intended start date.' },
    ],
  },
  {
    category: 'Visa',
    icon: <Shield className="h-5 w-5" />,
    faqs: [
      { q: 'What is your visa success rate?', a: 'Our visa success rate is 98%, one of the highest in the industry. This is achieved through thorough document preparation, interview coaching, and our experienced UKVI-certified visa consultants who review every application.' },
      { q: 'Do you help with UKVI credibility interviews?', a: 'Yes! We provide specialized coaching for UKVI credibility interviews, including mock interview sessions, question banks, body language tips, and communication strategies. Our preparation has helped hundreds of students pass their interviews confidently.' },
      { q: 'What if my visa is rejected?', a: 'While our success rate is 98%, in the rare case of a rejection, we analyze the refusal reasons, address the gaps in your application, and help you reapply with a stronger case. We also assist with administrative review requests where applicable.' },
      { q: 'How much money do I need to show for a student visa?', a: 'This varies by country: UK - tuition + £1,023/month (London: £1,334), USA - I-20 amount, Canada - GIC of CAD 20,635 + first year tuition, Australia - AUD 21,041/year + tuition. Our financial counselors help you plan and prepare the necessary documentation.' },
    ],
  },
  {
    category: 'Scholarships & Fees',
    icon: <DollarSign className="h-5 w-5" />,
    faqs: [
      { q: 'Can I get a scholarship to study abroad?', a: 'Yes! Many universities and governments offer scholarships for international students. Our scholarship team helps you identify and apply for relevant opportunities. In the past year, our students have secured over $2 million in scholarships.' },
      { q: 'How much does it cost to study abroad?', a: 'Costs vary significantly: UK £10K-38K/year tuition, USA $20K-60K/year, Canada CAD 15K-35K/year, Australia AUD 20K-45K/year, Europe €0-15K/year, Malaysia MYR 15K-40K/year. Living costs also vary by location. We help you find affordable options and funding.' },
      { q: 'Does ALO Education charge fees for its services?', a: 'Our initial consultation is free. For application processing, our fees are competitive and transparent. Some services are included when you enroll with us. We never have hidden charges, and all fees are discussed upfront before any commitment.' },
    ],
  },
  {
    category: 'Test Preparation',
    icon: <BookOpen className="h-5 w-5" />,
    faqs: [
      { q: 'Do you offer IELTS preparation classes?', a: 'Yes! We offer comprehensive IELTS preparation classes with certified trainers. Our program includes practice tests, mock exams, speaking practice, and personalized feedback. We offer flexible schedules including weekend batches.' },
      { q: 'What English tests are accepted for studying abroad?', a: 'Most universities accept IELTS Academic and TOEFL iBT. Some also accept PTE Academic, Duolingo English Test, and Cambridge English qualifications. The required score varies by institution and program. Our counselors can advise you on which test to take.' },
      { q: 'What score do I need on the IELTS?', a: 'Score requirements vary: UK typically requires 6.0-7.0, USA 6.5-7.5, Canada 6.0-6.5, Australia 6.0-7.0. Some programs like Medicine, Law, and Education may require higher scores. We help you understand the requirements for your specific program.' },
    ],
  },
  {
    category: 'Pre-Departure',
    icon: <Plane className="h-5 w-5" />,
    faqs: [
      { q: 'Do you provide airport pickup at my destination?', a: 'Yes! We arrange airport pickup and transfer to your accommodation through our local partners in the UK, USA, Canada, Australia, and other destinations. This service ensures a safe and smooth arrival in your new country.' },
      { q: 'Do you help with accommodation?', a: 'Yes, we assist with finding suitable accommodation near your university. This includes on-campus housing applications, private rental search, contract review, and even roommate matching. We ensure you find safe and affordable housing.' },
      { q: 'What does the pre-departure briefing cover?', a: 'Our comprehensive pre-departure briefing covers country-specific orientation, culture and lifestyle, banking and finance, SIM card setup, public transportation, health insurance, what to pack, emergency contacts, and tips for settling in.' },
    ],
  },
]

export default function FaqPage() {
  const { setCurrentView } = useAppStore()
  const [search, setSearch] = useState('')

  const allFaqs = faqCategories.flatMap(cat =>
    cat.faqs.map(faq => ({ ...faq, category: cat.category }))
  )

  const filteredFaqs = search
    ? allFaqs.filter(faq =>
        faq.q.toLowerCase().includes(search.toLowerCase()) ||
        faq.a.toLowerCase().includes(search.toLowerCase())
      )
    : null

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2332] to-[#0066CC] text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-3">FAQ</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold">Frequently Asked Questions</h1>
          <p className="mt-3 text-gray-300 max-w-2xl">
            Find answers to common questions about studying abroad, visa processes, scholarships, and our services.
          </p>
          <div className="mt-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4">
          {search && filteredFaqs ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#1A2332] mb-4">
                {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} found
              </h3>
              <Accordion type="single" collapsible className="space-y-3">
                {filteredFaqs.map((faq, i) => (
                  <AccordionItem key={i} value={`search-${i}`} className="bg-white rounded-xl border-0 shadow-sm px-6">
                    <AccordionTrigger className="text-left text-[#1A2332] hover:text-[#F37021] py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-[#555555] text-sm leading-relaxed pb-4">
                      <Badge variant="outline" className="text-xs mb-2">{faq.category}</Badge>
                      <p className="mt-1">{faq.a}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="space-y-10">
              {faqCategories.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center text-[#F37021]">
                      {cat.icon}
                    </div>
                    <h3 className="text-xl font-bold text-[#1A2332]">{cat.category}</h3>
                  </div>
                  <Accordion type="single" collapsible className="space-y-3">
                    {cat.faqs.map((faq, i) => (
                      <AccordionItem key={i} value={`${cat.category}-${i}`} className="bg-white rounded-xl border-0 shadow-sm px-6">
                        <AccordionTrigger className="text-left text-[#1A2332] hover:text-[#F37021] py-4">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-[#555555] text-sm leading-relaxed pb-4">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="bg-gradient-to-r from-[#F37021] to-[#e0651a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <MessageSquare className="h-12 w-12 mx-auto" />
          <h2 className="text-3xl lg:text-4xl font-bold">Still Have Questions?</h2>
          <p className="text-orange-100 max-w-xl mx-auto">
            Our expert counselors are ready to answer all your questions. Book a free consultation today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => setCurrentView('free-consultation')} className="bg-white text-[#F37021] hover:bg-gray-100 h-12 px-8 font-semibold">
              Book Free Consultation <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button onClick={() => setCurrentView('contact')} variant="outline" className="border-white text-white hover:bg-white/10 h-12 px-8">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
