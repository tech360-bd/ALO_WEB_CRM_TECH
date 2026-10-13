'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Heart,
  Users,
  GraduationCap,
  Globe,
  Award,
  Zap,
  Coffee,
  TrendingUp,
  ArrowRight,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const JOB_OPENINGS = [
  {
    id: 1,
    title: 'Senior Education Counsellor',
    department: 'Student Advisory',
    location: 'Dhaka, Bangladesh',
    type: 'Full-Time',
    experience: '3-5 years',
    description: 'Lead student counselling sessions for UK and Australia destinations. Guide students through university selection, application preparation, and visa processes.',
    requirements: ['Bachelor\'s degree minimum', 'Experience in international education consultancy', 'Strong knowledge of UK/Australia visa processes', 'Excellent English communication skills'],
    posted: 'February 15, 2025',
    featured: true,
  },
  {
    id: 2,
    title: 'IELTS Trainer & Test Prep Specialist',
    department: 'Test Preparation',
    location: 'Dhaka, Bangladesh',
    type: 'Full-Time',
    experience: '2-4 years',
    description: 'Deliver IELTS preparation classes and develop curriculum for Band 7+ targeting students. Conduct mock tests and provide personalized feedback.',
    requirements: ['British Council or IDP certification preferred', 'IELTS band 8.0+ preferred', 'Teaching experience in test preparation', 'Strong curriculum development skills'],
    posted: 'February 10, 2025',
    featured: false,
  },
  {
    id: 3,
    title: 'University Partnerships Manager',
    department: 'Partnerships',
    location: 'Dhaka, Bangladesh',
    type: 'Full-Time',
    experience: '5+ years',
    description: 'Build and maintain relationships with university partners across UK, Australia, and Canada. Negotiate commission structures and manage partnership agreements.',
    requirements: ['5+ years in B2B partnerships or business development', 'Experience in the education sector', 'International travel readiness', 'Strong negotiation and networking skills'],
    posted: 'February 8, 2025',
    featured: true,
  },
  {
    id: 4,
    title: 'Digital Marketing Executive',
    department: 'Marketing',
    location: 'Dhaka, Bangladesh',
    type: 'Full-Time',
    experience: '2-3 years',
    description: 'Plan and execute digital marketing campaigns across social media, Google Ads, and email. Generate student leads and optimize conversion funnels.',
    requirements: ['Experience with Meta Ads & Google Ads', 'SEO/SEM knowledge', 'Content creation skills', 'Data analytics proficiency'],
    posted: 'February 5, 2025',
    featured: false,
  },
  {
    id: 5,
    title: 'Application Processing Officer',
    department: 'Operations',
    location: 'Dhaka, Bangladesh',
    type: 'Full-Time',
    experience: '1-2 years',
    description: 'Process student university applications, manage document verification, and coordinate with university admissions offices for status updates.',
    requirements: ['Bachelor\'s degree', 'Attention to detail', 'Experience in administrative/processing roles', 'Proficiency in MS Office and CRM systems'],
    posted: 'January 28, 2025',
    featured: false,
  },
  {
    id: 6,
    title: 'Regional Manager — Chittagong',
    department: 'Regional Operations',
    location: 'Chittagong, Bangladesh',
    type: 'Full-Time',
    experience: '5+ years',
    description: 'Lead ALO Education\'s Chittagong office operations, manage a team of counsellors, and drive student enrollment targets for the region.',
    requirements: ['5+ years in education consultancy or related field', 'Team management experience', 'Strong local network in Chittagong', 'Target-driven mindset'],
    posted: 'January 25, 2025',
    featured: false,
  },
  {
    id: 7,
    title: 'Content Writer (Education Focus)',
    department: 'Marketing',
    location: 'Remote',
    type: 'Part-Time',
    experience: '1-3 years',
    description: 'Create engaging blog posts, university guides, and social media content about studying abroad. Research education trends and policy changes.',
    requirements: ['Excellent English writing skills', 'Knowledge of international education', 'SEO writing experience', 'Research and fact-checking skills'],
    posted: 'January 20, 2025',
    featured: false,
  },
  {
    id: 8,
    title: 'Student Visa Consultant',
    department: 'Visa Advisory',
    location: 'Dhaka, Bangladesh',
    type: 'Full-Time',
    experience: '3-5 years',
    description: 'Provide comprehensive visa guidance for students applying to study in New Zealand and Ireland. Stay updated on immigration policy changes and prepare visa documentation.',
    requirements: ['3+ years visa consultancy experience', 'Specialization in NZ/Ireland immigration', 'Strong documentation skills', 'Client-facing communication skills'],
    posted: 'January 15, 2025',
    featured: false,
  },
];

const BENEFITS = [
  { icon: <Heart className="h-7 w-7 text-[#0052B8]" />, title: 'Health Insurance', desc: 'Comprehensive medical coverage for you and your family' },
  { icon: <GraduationCap className="h-7 w-7 text-[#0052B8]" />, title: 'Professional Development', desc: 'Annual training budget and certification sponsorship' },
  { icon: <Globe className="h-7 w-7 text-[#0052B8]" />, title: 'International Travel', desc: 'Opportunities to visit partner universities abroad' },
  { icon: <Zap className="h-7 w-7 text-[#0052B8]" />, title: 'Performance Bonuses', desc: 'Quarterly and annual performance-based incentives' },
  { icon: <Coffee className="h-7 w-7 text-[#0052B8]" />, title: 'Flexible Working', desc: 'Hybrid work options and flexible hours for eligible roles' },
  { icon: <TrendingUp className="h-7 w-7 text-[#0052B8]" />, title: 'Career Growth', desc: 'Clear progression paths with mentoring programs' },
];

const TYPE_COLORS: Record<string, string> = {
  'Full-Time': 'bg-emerald-100 text-emerald-700',
  'Part-Time': 'bg-amber-100 text-amber-700',
  'Contract': 'bg-blue-100 text-blue-700',
};

export function CareersPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [selectedDept, setSelectedDept] = useState('All');
  const [expanded, setExpanded] = useState<number | null>(null);

  const departments = ['All', ...Array.from(new Set(JOB_OPENINGS.map(j => j.department)))];
  const filtered = selectedDept === 'All' ? JOB_OPENINGS : JOB_OPENINGS.filter(j => j.department === selectedDept);

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
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full border-2 border-white" />
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full border border-white/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="h-8 w-8" />
            <Badge className="bg-white/20 text-white border-white/30">Careers</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Help Students Achieve<br />Their Global Dreams
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
            Join ALO Education and be part of a team that transforms lives through international education. We&apos;re looking for passionate professionals who share our mission.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => document.getElementById('openings')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-6 py-3 text-base">
              View Open Positions <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="border-white/50 text-white hover:bg-white/10 px-6 py-3 text-base" onClick={onLeadOpen}>
              Send Open Application
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 mt-10 text-white/80 text-sm">
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> 120+ Team Members</span>
            <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> 3 Offices in Bangladesh</span>
            <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> 6 Country Destinations</span>
          </div>
        </div>
      </section>

      {/* Why Work at ALO */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Why Work at ALO Education?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We invest in our people because they invest in our students&apos; futures.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <Card key={i} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">{b.icon}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                  <p className="text-slate-600 text-sm">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Our Culture</h2>
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>At ALO Education, we believe that great outcomes for students begin with a great workplace. Our culture is built on collaboration, continuous learning, and a shared passion for making international education accessible.</p>
                <p>We celebrate diversity and inclusion — our team represents all divisions of Bangladesh and brings varied perspectives that enrich our service. We encourage open communication, feedback, and innovation at every level.</p>
                <p>From weekly knowledge-sharing sessions to annual team retreats, we make sure our people stay connected, motivated, and growing both professionally and personally.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '120+', label: 'Team Members' },
                { num: '85%', label: 'Employee Retention' },
                { num: '4.6/5', label: 'Satisfaction Score' },
                { num: '50+', label: 'Training Hours/Year' },
              ].map((stat, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="p-5">
                    <div className="text-3xl font-bold text-[#0052B8] mb-1">{stat.num}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section id="openings" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Open Positions</h2>
              <p className="text-slate-600">{filtered.length} positions available</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedDept === dept
                      ? 'bg-[#0052B8] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filtered.map(job => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
                <Card className={`hover:shadow-md transition-all ${job.featured ? 'ring-2 ring-[#0052B8]/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={TYPE_COLORS[job.type]}>{job.type}</Badge>
                          <Badge variant="outline" className="text-slate-500">{job.department}</Badge>
                          {job.featured && <Badge className="bg-[#0052B8] text-white">Urgent</Badge>}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{job.title}</h3>
                        <p className="text-slate-600 text-sm mb-3">{job.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.experience}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Posted {job.posted}</span>
                        </div>
                        {expanded === job.id && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-slate-900 text-sm mb-2">Requirements:</h4>
                            <ul className="space-y-1">
                              {job.requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                  <CheckCircle2 className="h-4 w-4 text-[#0052B8] mt-0.5 shrink-0" /> {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white text-sm w-full md:w-auto">
                          Apply Now
                        </Button>
                        <Button variant="ghost" size="sm" className="text-[#0052B8] text-xs w-full md:w-auto" onClick={() => setExpanded(expanded === job.id ? null : job.id)}>
                          {expanded === job.id ? 'Hide Details' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 text-center">How to Apply</h2>
          <p className="text-slate-600 text-center mb-10 max-w-xl mx-auto">Our application process is straightforward and designed to be completed within 2 weeks.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Submit Application', desc: 'Send your CV and cover letter through our form or email careers@aloeducation.com' },
              { step: 2, title: 'Initial Screening', desc: 'Our HR team reviews your application within 5 business days and contacts shortlisted candidates' },
              { step: 3, title: 'Interview Process', desc: 'Two rounds of interviews — a technical/role-specific round and a culture-fit round with leadership' },
              { step: 4, title: 'Welcome to ALO!', desc: 'Receive your offer, complete onboarding, and join a team that\'s transforming lives through education' },
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Don&apos;t See the Right Role?</h2>
          <p className="text-white/90 max-w-xl mx-auto mb-8">We&apos;re always looking for talented individuals. Send us your CV and we&apos;ll reach out when a matching position opens.</p>
          <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-8 py-3 text-base">
            Send Open Application <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </motion.div>
  );
}
