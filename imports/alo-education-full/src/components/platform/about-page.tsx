'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  GraduationCap,
  Globe,
  Star,
  Shield,
  Target,
  Zap,
  TrendingUp,
  Heart,
  Award,
  Building2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

type TeamMember = {
  name: string;
  role: string;
  photo?: string;
  bio?: string;
  specialty?: string;
};

type ApiStats = {
  totalCountries?: number;
  totalUniversities?: number;
  totalCourses?: number;
  totalExams?: number;
};

export function AboutPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [apiStats, setApiStats] = useState<ApiStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/homepage')
      .then((r) => r.json())
      .then((data) => {
        if (data?.team) setTeam(data.team);
        if (data?.stats) setApiStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: <Users className="h-6 w-6" />, value: '500+', label: 'Students Placed' },
    { icon: <GraduationCap className="h-6 w-6" />, value: apiStats.totalUniversities ? `${apiStats.totalUniversities}+` : '100+', label: 'Partner Universities' },
    { icon: <Globe className="h-6 w-6" />, value: apiStats.totalCountries ? `${apiStats.totalCountries}+` : '15+', label: 'Countries' },
    { icon: <Calendar className="h-6 w-6" />, value: '10+', label: 'Years of Experience' },
  ];

  const values = [
    { icon: <Target className="h-8 w-8 text-[#F37021]" />, title: 'Our Mission', description: 'To empower Bangladeshi students with world-class education opportunities abroad, providing transparent guidance and end-to-end support from application to arrival.' },
    { icon: <Star className="h-8 w-8 text-[#0066CC]" />, title: 'Our Vision', description: 'To be the most trusted and student-centric education consultancy in South Asia, bridging aspirations with global opportunities through innovation and integrity.' },
    { icon: <Heart className="h-8 w-8 text-[#FFB347]" />, title: 'Our Values', description: 'Transparency, student-first approach, integrity in every interaction, and a commitment to making global education accessible to all deserving students.' },
  ];

  const features = [
    { icon: <Shield className="h-6 w-6" />, title: 'Licensed & Certified', desc: 'Fully licensed education consultancy with government approvals and international accreditations.' },
    { icon: <Users className="h-6 w-6" />, title: 'Expert Counselors', desc: 'Certified counselors with first-hand study abroad experience and university partnerships.' },
    { icon: <CheckCircle2 className="h-6 w-6" />, title: '95% Visa Success', desc: 'Industry-leading visa approval rate backed by thorough documentation support.' },
    { icon: <Globe className="h-6 w-6" />, title: '15+ Countries', desc: 'Extensive network spanning UK, USA, Canada, Australia, Europe, and Asia.' },
    { icon: <Zap className="h-6 w-6" />, title: 'Fast Processing', desc: 'Streamlined application pipeline with dedicated case managers for each student.' },
    { icon: <TrendingUp className="h-6 w-6" />, title: 'Scholarship Access', desc: 'Exclusive scholarship partnerships helping students save up to 50% on tuition.' },
  ];

  const certifications = [
    'British Council Certified Agent',
    'ICEF Trained Agent Counselor',
    'PIER Certified Education Agent',
    'Government of Bangladesh Licensed',
    'QEAC Certified Agent',
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F37021] via-[#0066CC] to-[#101828]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-32 md:py-40 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">About ALO Education</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Your Bridge to Global<span className="block text-[#FFB347]">Education</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            For over a decade, ALO Education has been transforming dreams into reality — connecting Bangladeshi students with world-class universities across 15+ countries.
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20">Our Story</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">From a Small Office in Dhaka to a Global Network</h2>
              <p className="mt-6 text-[#555555] leading-relaxed">
                ALO Education was founded with a simple belief: every deserving student deserves access to world-class education, regardless of their background. What started as a one-person counseling desk in Dhaka has grown into a trusted education consultancy with a global footprint.
              </p>
              <p className="mt-4 text-[#555555] leading-relaxed">
                Over the years, we have helped hundreds of students navigate the complex journey of studying abroad — from choosing the right university and program, to securing admissions, visas, and scholarships. Our team brings first-hand experience and deep institutional knowledge to every student interaction.
              </p>
              <p className="mt-4 text-[#555555] leading-relaxed">
                Today, with offices in Dhaka, Chittagong, and Sylhet, we continue to uphold our founding values of transparency, integrity, and student-centricity.
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#F37021]/10 to-[#0066CC]/10 p-8 md:p-12">
                <div className="space-y-6">
                  {[
                    { num: '1', color: 'bg-[#F37021]', title: 'Founded in Dhaka', desc: 'Started with a mission to make global education accessible' },
                    { num: '2', color: 'bg-[#0066CC]', title: '500+ Students Placed', desc: 'Successfully placed students across 15+ countries worldwide' },
                    { num: '3', color: 'bg-[#FFB347]', title: '3 Offices in Bangladesh', desc: 'Dhaka, Chittagong, and Sylhet serving students nationwide' },
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-white font-bold`}>{item.num}</div>
                      <div>
                        <h3 className="font-semibold text-[#101828]">{item.title}</h3>
                        <p className="text-sm text-[#555555]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">What Drives Us</h2>
            <p className="mt-3 text-[#555555] text-lg max-w-2xl mx-auto">Our mission, vision, and values shape everything we do at ALO Education.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v) => (
              <Card key={v.title} className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <div className="mb-4">{v.icon}</div>
                  <CardTitle className="text-xl text-[#101828]">{v.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#555555] leading-relaxed">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-[#101828] to-[#1a2a4a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#F37021]/20 flex items-center justify-center text-[#F37021]">{s.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-white">{s.value}</div>
                <div className="mt-1 text-sm text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">Meet Our Team</h2>
            <p className="mt-3 text-[#555555] text-lg max-w-2xl mx-auto">Experienced counselors and education experts dedicated to your success.</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : team.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {team.map((m, i) => (
                <Card key={i} className="border-0 shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[3/4] bg-gradient-to-b from-[#F37021]/10 to-[#0066CC]/10 flex items-center justify-center">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="h-16 w-16 text-[#F37021]/40" />
                    )}
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold text-[#101828]">{m.name}</h3>
                    <p className="text-sm text-[#555555]">{m.role}</p>
                    {m.specialty && <p className="text-xs text-[#0066CC] mt-1">{m.specialty}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-[#F37021]/30 mx-auto mb-4" />
              <p className="text-[#555555]">Team information coming soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose ALO */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">Why Choose ALO Education?</h2>
            <p className="mt-3 text-[#555555] text-lg max-w-2xl mx-auto">Six reasons why thousands of students trust us with their future.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border border-gray-100 rounded-2xl hover:border-[#F37021]/30 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="mb-4 w-12 h-12 rounded-xl bg-[#F37021]/10 flex items-center justify-center text-[#F37021]">{f.icon}</div>
                  <h3 className="font-semibold text-[#101828] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#555555] leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">Certifications & Accreditations</h2>
            <p className="mt-3 text-[#555555] text-lg max-w-2xl mx-auto">Recognized and certified by leading international education bodies.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {certifications.map((c) => (
              <div key={c} className="flex items-center gap-2 bg-white px-5 py-3 rounded-full shadow-sm border border-gray-100">
                <Award className="h-5 w-5 text-[#F37021]" />
                <span className="text-sm font-medium text-[#101828]">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-gray-200" />

      {/* CTA */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">Ready to Start Your Journey?</h2>
          <p className="mt-4 text-lg text-[#555555] max-w-2xl mx-auto">Book a free consultation with our expert counselors and take the first step toward your dream university.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onLeadOpen} size="lg" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full px-8">
              Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => onNavigate('home')} variant="outline" size="lg" className="border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC]/5 rounded-full px-8">
              Explore Programs
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
