'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Handshake,
  GraduationCap,
  Globe,
  Building2,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PARTNER_UNIVERSITIES = [
  { name: 'University of Manchester', country: 'UK', logo: 'UoM', tier: 'Russell Group' },
  { name: 'University of Bristol', country: 'UK', logo: 'UoB', tier: 'Russell Group' },
  { name: 'University of Sheffield', country: 'UK', logo: 'TUoS', tier: 'Russell Group' },
  { name: 'Queen Mary University of London', country: 'UK', logo: 'QMUL', tier: 'Russell Group' },
  { name: 'University of Melbourne', country: 'Australia', logo: 'UoM', tier: 'Group of Eight' },
  { name: 'University of Sydney', country: 'Australia', logo: 'USyd', tier: 'Group of Eight' },
  { name: 'UNSW Sydney', country: 'Australia', logo: 'UNSW', tier: 'Group of Eight' },
  { name: 'Monash University', country: 'Australia', logo: 'Monash', tier: 'Group of Eight' },
  { name: 'University of Auckland', country: 'New Zealand', logo: 'UoA', tier: 'Top 100' },
  { name: 'AUT University', country: 'New Zealand', logo: 'AUT', tier: 'Top 500' },
  { name: 'Trinity College Dublin', country: 'Ireland', logo: 'TCD', tier: 'Top 100' },
  { name: 'University College Dublin', country: 'Ireland', logo: 'UCD', tier: 'Top 200' },
  { name: 'University of Toronto', country: 'Canada', logo: 'UofT', tier: 'Top 30' },
  { name: 'University of British Columbia', country: 'Canada', logo: 'UBC', tier: 'Top 50' },
  { name: 'McGill University', country: 'Canada', logo: 'McGill', tier: 'Top 50' },
  { name: 'University of Galway', country: 'Ireland', logo: 'UoG', tier: 'Top 300' },
];

const COUNTRY_COLORS: Record<string, string> = {
  UK: 'bg-red-100 text-red-700',
  Australia: 'bg-amber-100 text-amber-700',
  'New Zealand': 'bg-emerald-100 text-emerald-700',
  Ireland: 'bg-green-100 text-green-700',
  Canada: 'bg-red-100 text-red-700',
  USA: 'bg-blue-100 text-blue-700',
};

const PARTNER_TYPES = [
  {
    id: 'universities',
    title: 'University Partnerships',
    icon: GraduationCap,
    description: 'We partner with 100+ universities across 6 countries to create seamless application pathways for Bangladeshi students.',
    benefits: [
      'Dedicated application channel with priority processing',
      'Waived or reduced application fees for ALO students',
      'Conditional offer letters for eligible applicants',
      'Direct communication with university admissions teams',
      'Access to exclusive scholarship pools',
      'On-spot admission assessments at ALO events',
    ],
  },
  {
    id: 'agents',
    title: 'Sub-Agent Partnerships',
    icon: Users,
    description: 'We work with trusted sub-agents across Bangladesh to extend our reach and ensure students in every division have access to quality guidance.',
    benefits: [
      'Competitive commission structures on student enrollments',
      'Access to ALO\'s CRM and student management platform',
      'Training and certification on visa and application processes',
      'Co-branded marketing materials and lead support',
      'Regular updates on policy changes and new programs',
      'Priority support from ALO\'s central team',
    ],
  },
  {
    id: 'b2b',
    title: 'B2B & Institutional Partnerships',
    icon: Building2,
    description: 'We collaborate with schools, colleges, financial institutions, and corporates to build comprehensive education ecosystems.',
    benefits: [
      'School partnership programs for early guidance',
      'Corporate education sponsorship management',
      'Education loan facilitation with partner banks',
      'Joint event hosting and co-marketing opportunities',
      'Custom reporting and analytics dashboards',
      'Dedicated account management',
    ],
  },
];

const TESTIMONIALS = [
  {
    quote: 'ALO Education has been one of our most reliable recruitment partners in Bangladesh. Their students consistently arrive well-prepared and their application processing is exceptionally thorough.',
    name: 'Dr. Sarah Mitchell',
    role: 'International Recruitment Manager',
    org: 'University of Manchester',
  },
  {
    quote: 'The partnership with ALO has significantly increased our enrollment from Bangladesh. Their understanding of both the UK education system and the Bangladeshi student market is invaluable.',
    name: 'James O\'Brien',
    role: 'Director of International Office',
    org: 'University of Bristol',
  },
  {
    quote: 'ALO Education\'s professionalism and student-first approach make them an ideal partner. We\'ve seen a 40% increase in quality applications since partnering with them.',
    name: 'Prof. Wei Chen',
    role: 'Associate Dean (International)',
    org: 'University of Melbourne',
  },
];

export function PartnersPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [countryFilter, setCountryFilter] = useState('All');
  const countries = ['All', 'UK', 'Australia', 'New Zealand', 'Ireland', 'Canada'];
  const filtered = countryFilter === 'All' ? PARTNER_UNIVERSITIES : PARTNER_UNIVERSITIES.filter(u => u.country === countryFilter);

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
          <div className="absolute top-10 right-20 w-72 h-72 rounded-full border-2 border-white" />
          <div className="absolute bottom-5 left-20 w-56 h-56 rounded-full border border-white/30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex items-center gap-3 mb-6">
            <Handshake className="h-8 w-8" />
            <Badge className="bg-white/20 text-white border-white/30">Partnerships</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Partner With<br />ALO Education
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
            Join our network of 100+ university partners and trusted agents worldwide. Together, we create life-changing opportunities for students.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-6 py-3 text-base">
              Become a Partner <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="border-white/50 text-white hover:bg-white/10 px-6 py-3 text-base" onClick={() => document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' })}>
              View Partner Universities
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 mt-10 text-white/80 text-sm">
            <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> 100+ University Partners</span>
            <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> 6 Countries</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> 50+ Agent Partners</span>
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Partnership Models</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We offer flexible partnership models tailored to your organization&apos;s needs and goals.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PARTNER_TYPES.map(pt => {
              const Icon = pt.icon;
              return (
                <Card key={pt.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="p-3 rounded-lg bg-[#0052B8]/10 w-fit mb-4">
                      <Icon className="h-7 w-7 text-[#0052B8]" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{pt.title}</h3>
                    <p className="text-slate-600 text-sm mb-4">{pt.description}</p>
                    <div className="space-y-2">
                      {pt.benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-[#0052B8] mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={onLeadOpen} className="mt-5 w-full bg-[#0052B8] hover:bg-[#003d8f] text-white">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partner Universities */}
      <section id="partners" className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Partner Universities</h2>
              <p className="text-slate-600">A selection of our prestigious partner institutions</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {countries.map(c => (
                <button
                  key={c}
                  onClick={() => setCountryFilter(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    countryFilter === c
                      ? 'bg-[#0052B8] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0052B8] hover:text-[#0052B8]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((uni, i) => (
              <motion.div key={uni.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0052B8]/10 flex items-center justify-center text-xs font-bold text-[#0052B8]">
                        {uni.logo}
                      </div>
                      <Badge className={COUNTRY_COLORS[uni.country]}>{uni.country}</Badge>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm mb-1">{uni.name}</h4>
                    <p className="text-xs text-slate-500">{uni.tier}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">What Our Partners Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-slate-600 text-sm italic mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                    <p className="text-xs text-[#0052B8] font-medium">{t.org}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Partner */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 text-center">How to Become a Partner</h2>
          <p className="text-slate-600 text-center mb-10 max-w-xl mx-auto">Our partnership onboarding process is designed to be quick and comprehensive.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Initial Inquiry', desc: 'Submit your partnership interest through our form or contact our partnerships team directly' },
              { step: 2, title: 'Assessment Meeting', desc: 'We schedule a call or meeting to understand your institution\'s goals and requirements' },
              { step: 3, title: 'Agreement & Setup', desc: 'Sign the partnership agreement and complete onboarding including platform access and training' },
              { step: 4, title: 'Launch & Support', desc: 'Go live with your partnership — receive ongoing support, reporting, and optimization' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#0052B8] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0052B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Partner With Us?</h2>
          <p className="text-white/90 max-w-xl mx-auto mb-8">Whether you&apos;re a university, agent, or institution, we&apos;d love to explore how we can create value together.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-8 py-3 text-base">
              Start Partnership Discussion <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 justify-center mt-8 text-white/80 text-sm">
            <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> partnerships@aloeducation.com</span>
            <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +880 2 9854 3210</span>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
