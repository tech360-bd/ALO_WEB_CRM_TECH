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
  FileText, Shield, Award, Mic, BookOpen, Plane,
  ArrowRight, CheckCircle2, MessageSquare, Target,
  ChevronRight, Sparkles, Headphones, Users,
} from 'lucide-react'

const services = [
  {
    icon: FileText,
    title: 'University Application',
    desc: 'End-to-end application support from shortlisting to admission confirmation.',
    features: ['University shortlisting based on profile', 'Application form completion', 'Document preparation & review', 'Offer letter tracking & follow-up', 'Conditional/unconditional offer management'],
    color: '#F37021',
    gradient: 'from-[#F37021]/10 to-[#FFB347]/5',
  },
  {
    icon: Shield,
    title: 'Visa Guidance',
    desc: 'Complete visa processing with 98% success rate by UKVI-certified consultants.',
    features: ['Complete visa application support', 'Document checklist & verification', 'Financial guidance & bank letter', 'Biometrics appointment scheduling', 'Visa refusal appeal assistance'],
    color: '#0066CC',
    gradient: 'from-[#0066CC]/10 to-[#4da3ff]/5',
  },
  {
    icon: Award,
    title: 'Scholarship Search',
    desc: 'Find and secure funding opportunities to reduce your education costs.',
    features: ['AI-powered scholarship matching', 'Application essay review', 'Interview preparation', 'Profile optimization for scholarships', 'Deadline tracking & reminders'],
    color: '#059669',
    gradient: 'from-green-600/10 to-green-400/5',
  },
  {
    icon: Mic,
    title: 'UKVI Interview Prep',
    desc: 'Ace your visa credibility interview with expert coaching and mock sessions.',
    features: ['Mock interview sessions', 'Question bank & preparation guide', 'Body language & communication tips', 'Stress management techniques', 'Post-interview support'],
    color: '#7c3aed',
    gradient: 'from-purple-600/10 to-purple-400/5',
  },
  {
    icon: BookOpen,
    title: 'IELTS Preparation',
    desc: 'Score improvement with certified trainers and proven strategies.',
    features: ['Experienced & certified trainers', 'Practice tests & mock exams', 'Flexible batch schedules', 'Score improvement guarantee', 'Speaking & writing workshops'],
    color: '#dc2626',
    gradient: 'from-red-600/10 to-red-400/5',
  },
  {
    icon: Plane,
    title: 'Pre-Departure Support',
    desc: 'Everything you need before you fly — orientation, packing, and more.',
    features: ['Country-specific orientation', 'Culture & lifestyle briefing', 'Banking & SIM card guidance', 'Airport pickup arrangement', 'What to pack checklist'],
    color: '#0891b2',
    gradient: 'from-cyan-600/10 to-cyan-400/5',
  },
]

const processSteps = [
  { step: 1, icon: MessageSquare, title: 'Free Consultation', desc: 'Book a free session with our certified counselors to discuss your goals.' },
  { step: 2, icon: Target, title: 'Personalized Plan', desc: 'We create a tailored roadmap based on your academic profile and career aspirations.' },
  { step: 3, icon: FileText, title: 'Application & Visa', desc: 'We handle your university applications and complete visa processing end-to-end.' },
  { step: 4, icon: Plane, title: 'Pre-Departure & Beyond', desc: 'Orientation, travel arrangement, and ongoing support until you settle in.' },
]

const faqs = [
  { q: 'Are your services really free for students?', a: 'Yes! All our core services including university applications, visa guidance, and scholarship search are completely free for students. We are funded by our partner universities.' },
  { q: 'How long does the application process take?', a: 'The typical process takes 4-8 weeks from initial consultation to receiving your offer letter. Visa processing adds another 3-6 weeks depending on the country.' },
  { q: 'What is your visa success rate?', a: 'We maintain a 98% visa success rate across all our student applications. Our UKVI-certified consultants ensure every application is thorough and compelling.' },
  { q: 'Do you help with scholarships?', a: 'Absolutely! We have a dedicated scholarship search team that uses AI-powered matching to find scholarships you qualify for, and we help with the entire application process.' },
  { q: 'Can I apply to multiple countries?', a: 'Yes! You can apply to universities in the UK, USA, Canada, Australia, Europe, and Malaysia simultaneously. Our counselors will help you manage multiple applications.' },
  { q: 'What if my visa gets refused?', a: 'In the rare case of a visa refusal, our team provides comprehensive appeal assistance. We review the refusal reasons, strengthen your application, and guide you through the appeal process.' },
]

export default function ServicesPage() {
  const { setCurrentView } = useAppStore()
  const [selectedService, setSelectedService] = useState<number | null>(null)

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1A2332] via-[#1A2332] to-[#F37021]/30 text-white py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, #F37021 1px, transparent 1px), radial-gradient(circle at 85% 40%, #0066CC 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-4">Our Services</Badge>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Comprehensive <span className="bg-gradient-to-r from-[#F37021] to-[#FFB347] bg-clip-text text-transparent">Education Services</span>
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl text-lg">From your first consultation to arriving at your dream university, we provide end-to-end support — completely free for students.</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <Card key={i} className={`border-0 shadow-sm hover:shadow-xl transition-all group cursor-pointer overflow-hidden ${selectedService === i ? 'ring-2 ring-[#F37021]' : ''}`} onClick={() => setSelectedService(selectedService === i ? null : i)}>
                <div className="h-1" style={{ background: s.color }} />
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4`} style={{ background: `${s.color}15` }}>
                    <s.icon className="h-7 w-7" style={{ color: s.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A2332] group-hover:text-[#F37021] transition-colors">{s.title}</h3>
                  <p className="text-sm text-[#555555] mt-2">{s.desc}</p>
                  <div className="mt-4 space-y-2">
                    {s.features.slice(0, selectedService === i ? 5 : 3).map((f, fi) => (
                      <div key={fi} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: s.color }} />
                        <span className="text-sm text-[#555555]">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="mt-4 text-[#F37021] hover:text-[#e0651a] p-0 h-auto font-semibold text-sm group" onClick={e => { e.stopPropagation(); setCurrentView('free-consultation') }}>
                    Learn More <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">How It Works</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Your Journey in 4 Simple Steps</h2>
            <p className="text-[#555555] mt-2">We handle the complexity so you can focus on your dreams</p>
          </div>
          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F37021] via-[#0066CC] to-[#1A2332]" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map(s => (
                <div key={s.step} className="text-center relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#F37021] to-[#FFB347] rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg relative z-10">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#F37021]">STEP {s.step}</div>
                  <h4 className="font-semibold text-[#1A2332] mt-1">{s.title}</h4>
                  <p className="text-xs text-[#555555] mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gradient-to-r from-[#1A2332] to-[#0066CC] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-[#F37021] rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles className="h-8 w-8 text-white" /></div>
          <h2 className="text-3xl lg:text-4xl font-bold">Our Services Are FREE for Students!</h2>
          <p className="text-gray-300 mt-4 max-w-xl mx-auto">That&apos;s right — university applications, visa guidance, scholarship search, interview prep, and pre-departure support are all completely free. We&apos;re funded by our partner universities, so you get premium service at zero cost.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Application Fee', value: 'FREE' },
              { label: 'Visa Guidance', value: 'FREE' },
              { label: 'Scholarship Help', value: 'FREE' },
              { label: 'Interview Prep', value: 'FREE' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-xl font-bold text-[#FFB347]">{item.value}</div>
                <div className="text-xs text-gray-300 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
          <Button onClick={() => setCurrentView('free-consultation')} className="mt-8 bg-[#F37021] hover:bg-[#e0651a] text-white h-12 px-8 font-semibold">
            Start Your Free Consultation <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">FAQ</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-5 data-[state=open]:shadow-md transition-all">
                <AccordionTrigger className="text-left font-semibold text-[#1A2332] hover:text-[#F37021] hover:no-underline py-4">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-[#555555] pb-4">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#F37021] to-[#e0651a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto"><Headphones className="h-8 w-8 text-white" /></div>
          <h2 className="text-3xl lg:text-4xl font-bold">Start Your Free Consultation</h2>
          <p className="text-orange-100 max-w-xl mx-auto">Join 5,000+ students who trusted ALO Education for their study abroad journey. Our expert counselors are ready to help.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => setCurrentView('free-consultation')} className="bg-white text-[#F37021] hover:bg-gray-100 h-12 px-8 font-semibold">
              Book Free Consultation <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button onClick={() => setCurrentView('contact')} variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8">
              <Users className="h-4 w-4 mr-2" />Talk to Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
