'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  BRAND, fadeUp, fadeIn, scaleUp, slideFromLeft, slideFromRight,
  staggerContainer, staggerItem, staggerItemScale,
  sectionTitle, sectionSubtitle, viewportOnce, gradients,
} from './animations';
import { Card, CardContent } from '@/components/ui/card';
import { ALO_CONTACT } from '@/lib/alo-site-info';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  BookOpen, Search, ClipboardList, Languages, Award, ShieldCheck,
  PenTool, Clock, Globe, ArrowRight, Star, GraduationCap, Briefcase,
  Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin,
  MessageCircle, CheckCircle2, User, ChevronRight, Heart, DollarSign,
  FileText, Target, Users, Zap, BookMarked, Compass,
  CalendarCheck, Lightbulb, HeadphonesIcon, type LucideIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   BRAND COLORS
   ═══════════════════════════════════════════════════════════════ */
const C = BRAND;

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface ResourceItem {
  icon: LucideIcon;
  title: string;
  href: string;
  color: string;
}

interface SuccessStory {
  name: string;
  photo: string;
  course: string;
  stars?: number;
  testimonial: string;
  university: string;
}

interface TeamMember {
  name: string;
  role: string;
  specialty: string;
  bio: string;
  photo?: string;
  initials: string;
  gradient: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

/* ═══════════════════════════════════════════════════════════════
   HARDCODED FALLBACK DATA
   ═══════════════════════════════════════════════════════════════ */
const RESOURCES: ResourceItem[] = [
  { icon: BookOpen, title: 'Study Abroad Guide', href: '/resources/study-abroad-guide', color: C.blue },
  { icon: Search, title: 'University Search', href: '/resources/university-search', color: C.orange },
  { icon: ClipboardList, title: 'Application Checklist', href: '/resources/application-checklist', color: '#0284C7' },
  { icon: Languages, title: 'IELTS Preparation', href: '/language-prep/ielts', color: '#003F87' },
  { icon: Award, title: 'Scholarship Finder', href: '/resources/scholarships', color: '#003F87' },
  { icon: ShieldCheck, title: 'Visa Requirements', href: '/resources/visa-guide', color: '#003F87' },
  { icon: PenTool, title: 'SOP Writing Tips', href: '/resources/sop-tips', color: '#003F87' },
  { icon: Clock, title: 'Intake Calendar', href: '/resources/intake-calendar', color: '#0284C7' },
  { icon: Globe, title: 'Country Comparison', href: '/resources/country-compare', color: C.blue },
  { icon: GraduationCap, title: 'Course Finder', href: '/resources/course-finder', color: C.orange },
  { icon: FileText, title: 'CV Templates', href: '/resources/cv-templates', color: '#0284C7' },
  { icon: Target, title: 'Cost Calculator', href: '/resources/cost-calculator', color: '#003F87' },
  { icon: Users, title: 'Student Community', href: '/resources/community', color: '#003F87' },
  { icon: Zap, title: 'Pre-Departure Guide', href: '/resources/pre-departure', color: '#003F87' },
  { icon: BookMarked, title: 'Education Blog', href: '/resources/blog', color: '#003F87' },
  { icon: Compass, title: 'Career Path Finder', href: '/resources/career-paths', color: '#0284C7' },
  { icon: CalendarCheck, title: 'Deadline Tracker', href: '/resources/deadlines', color: C.blue },
  { icon: Lightbulb, title: 'FAQ Library', href: '/resources/faqs', color: C.orange },
  { icon: HeadphonesIcon, title: 'Support Center', href: '/resources/support', color: '#0284C7' },
  { icon: Heart, title: 'Mental Wellness Guide', href: '/resources/wellness', color: '#003F87' },
  { icon: DollarSign, title: 'Financial Planning', href: '/resources/financial-planning', color: C.blue },
  { icon: Globe, title: 'Accommodation Guide', href: '/resources/accommodation', color: C.orange },
  { icon: ShieldCheck, title: 'Insurance Guide', href: '/resources/insurance', color: '#0284C7' },
];


const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Taslima Akter',
    role: 'CEO & Founder',
    specialty: 'Strategic Planning & Partnerships',
    bio: 'Founded ALO Education to make global education pathways clearer for Bangladeshi students.',
    initials: 'TA',
    gradient: 'linear-gradient(135deg, #0057B8 0%, #0EA5E9 100%)',
  },
  {
    name: 'Al Aminn',
    role: 'Chief Operating Officer',
    specialty: 'Operations & Process Optimization',
    bio: 'Oversees day-to-day operations across counselling, applications and visa casework.',
    initials: 'AA',
    gradient: 'linear-gradient(135deg, #E8501A 0%, #C93D13 100%)',
  },
  {
    name: 'Nusrat Jahan',
    role: 'Head of Admissions',
    specialty: 'University Applications & Documentation',
    bio: 'Leads university applications and documentation for UK, USA and Canadian programmes.',
    initials: 'NJ',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
  },
  {
    name: 'Rafiqul Islam',
    role: 'Visa Specialist',
    specialty: 'Immigration Law & Visa Processing',
    bio: 'Handles student visa casework and interview preparation for UK, USA, Canada and Australia.',
    initials: 'RI',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
  },
];

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: 'How do I start the study abroad process with ALO Education?',
    answer: 'Simply fill out our inquiry form on this page or call us directly. A dedicated counselor will be assigned to you within 24 hours to begin your personalized study abroad journey.',
  },
  {
    question: 'What countries does ALO Education help students study in?',
    answer: 'We specialize in the UK, USA, Canada, Australia, Germany, and Ireland. Each destination has dedicated counselors with extensive knowledge of universities, visa requirements, and student life.',
  },
  {
    question: 'Do I need an agent to study abroad?',
    answer: 'While you can apply independently, working with ALO Education significantly increases your chances of acceptance. We provide expert guidance on university selection, application preparation, and visa processing.',
  },
  {
    question: 'What are the English language requirements?',
    answer: 'Most universities require IELTS (6.0–7.5), TOEFL (80–100), or PTE Academic (50–65). Requirements vary by institution and programme. We help you prepare and identify the best test for your goals.',
  },
  {
    question: 'How much does it cost to study abroad?',
    answer: 'Costs vary widely by country, university, and programme. UK tuition ranges from £10,000–£35,000/year, USA from $20,000–$60,000/year, and Canada from CAD 15,000–CAD 35,000/year. We provide detailed cost breakdowns for each option.',
  },
  {
    question: 'Are scholarships available for international students?',
    answer: 'Yes! Many universities and governments offer scholarships for international students. We maintain a comprehensive database and help you identify and apply for scholarships that match your profile.',
  },
  {
    question: 'How long does the application process take?',
    answer: 'The full process typically takes 3–6 months from initial consultation to enrollment. We recommend starting at least 6 months before your intended intake for the best university options.',
  },
  {
    question: 'How do you support the visa application?',
    answer: 'Our visa specialists build a document checklist for your specific country, review every file before submission, and run mock credibility interviews. We do not publish an approval-rate figure, because visa decisions are made solely by the issuing government and no agency can guarantee an outcome. Current official requirements and fees are linked on each destination page.',
  },
  {
    question: 'Can I work while studying abroad?',
    answer: 'Most countries allow international students to work part-time during studies. The UK allows 20 hours/week during term and full-time during breaks. Canada allows 20 hours/week off-campus. We provide detailed guidance on work regulations.',
  },
  {
    question: 'What support do you provide after I arrive?',
    answer: 'We offer comprehensive pre-departure orientation, airport pickup coordination, accommodation assistance, and ongoing support throughout your studies. Our team remains available for any challenges you face abroad.',
  },
  {
    question: 'Do you help with post-study work visas?',
    answer: 'Yes, we guide students through post-study work visa applications, including the UK Graduate Route, Canadian PGWP, and Australian Temporary Graduate Visa. We also provide career placement support.',
  },
  {
    question: 'What documents do I need to apply?',
    answer: 'Typical documents include academic transcripts, passport, English test scores, CV, statement of purpose, and reference letters. Our counselors provide a personalized checklist based on your target universities.',
  },
  {
    question: 'Can I apply to multiple countries simultaneously?',
    answer: 'Yes, many students apply to multiple countries to maximize their options. We can manage parallel applications and help you compare offers to make the best decision.',
  },
  {
    question: 'What is a Statement of Purpose (SOP)?',
    answer: 'An SOP is a personalized essay explaining your academic background, career goals, and reasons for choosing a specific programme and university. It is a critical part of your application. Our AI SOP Helper and expert reviewers can help you craft a compelling SOP.',
  },
  {
    question: 'How do I choose the right university?',
    answer: 'We consider multiple factors: your academic profile, budget, career goals, preferred location, and programme rankings. Our counselors use data-driven matching to recommend universities where you have the highest chance of acceptance.',
  },
  {
    question: 'What if my visa application is refused?',
    answer: 'In the rare case of a visa refusal, our team analyzes the refusal reasons and prepares a strong reapplication or appeal. We also explore alternative destinations and pathways to ensure your study abroad plans continue.',
  },
  {
    question: 'Are there part-time or distance learning options?',
    answer: 'Yes, many universities offer part-time and online programmes. These can be more affordable and flexible. We can help you explore all available options based on your preferences.',
  },
  {
    question: 'Do you offer preparation for English tests?',
    answer: 'Yes, we provide IELTS, TOEFL, and PTE preparation resources, including practice tests, study materials, and tips from our experienced instructors. We also partner with test preparation centres for comprehensive courses.',
  },
  {
    question: 'How do I book a consultation with ALO Education?',
    answer: 'You can request a consultation through our website, call our hotline, send a WhatsApp message, or visit our office. Our consultations are obligation-free and designed to understand your goals.',
  },
  {
    question: 'What makes ALO Education different from other agencies?',
    answer: 'We combine AI-assisted tools with named human counselors, so course matching and drafting are fast but every recommendation is reviewed by a person. Fees and timelines are stated upfront with no hidden charges, and we do not quote success-rate figures we cannot substantiate. Our focus is the right course for your career, not the highest commission.',
  },
];

/* ═══════════════════════════════════════════════════════════════
   SECTION 19 — RESOURCES HUB
   ═══════════════════════════════════════════════════════════════ */
function ResourcesSection() {
  return (
    <section className="py-16 md:py-20" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={sectionTitle}>
            <Badge className="mb-4 text-xs font-semibold px-4 py-1.5 rounded-full" style={{ backgroundColor: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}30` }}>
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Resources Hub
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            Everything You Need to Study Abroad
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Free guides, tools, and resources to help you navigate your international education journey
          </motion.p>
        </motion.div>

        {/* Resource Cards Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {RESOURCES.map((resource, i) => {
            const Icon = resource.icon;
            return (
              <motion.div key={i} variants={staggerItemScale}>
                <Link href={resource.href}>
                  <Card className="h-full rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer" style={{ borderColor: C.border, background: '#FFFFFF' }}>
                    <CardContent className="p-4 md:p-5 flex flex-col items-center text-center h-full">
                      <div
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${resource.color}12`, color: resource.color }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: C.text }}>
                        {resource.title}
                      </h3>
                      <div className="mt-auto flex items-center gap-1 text-xs font-medium transition-all duration-300 group-hover:gap-2" style={{ color: resource.color }}>
                        Explore
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <Button
            className="h-12 px-8 rounded-full text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            style={{ backgroundColor: C.blue }}
            asChild
          >
            <Link href="/resources">
              Open Resources Hub
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 20 — SUCCESS STORIES
   ═══════════════════════════════════════════════════════════════ */
function SuccessStoriesSection() {
  const [stories, setStories] = useState<SuccessStory[]>([]);

  useEffect(() => {
    fetch('/api/website/homepage')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.successStories?.length > 0) {
          const mapped = data.data.successStories.slice(0, 10)
            .filter((s: Record<string, unknown>) => s.status === 'approved' && s.consentStatus === 'verified')
            .map((s: Record<string, unknown>) => ({
              name: (s.studentName as string) || '',
              photo: (s.photo as string) || '/images/testimonials/default.png',
              course: (s.course as string) || '',
              stars: typeof s.rating === 'number' ? Math.max(0, Math.min(5, Math.round(s.rating))) : undefined,
              testimonial: (s.testimonial as string) || '',
              university: (s.university as string) || '',
            }));
          if (mapped.length > 0) setStories(mapped);
        }
      })
      .catch(() => { /* no verified stories yet — section stays hidden */ });
  }, []);

  // Only approved, consent-verified stories from the API are shown. With none
  // available the section is omitted entirely — testimonials are never invented.
  if (stories.length === 0) return null;

  return (
    <section className="py-16 md:py-20" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={sectionTitle}>
            <Badge className="mb-4 text-xs font-semibold px-4 py-1.5 rounded-full" style={{ backgroundColor: `${C.orange}15`, color: C.orange, border: `1px solid ${C.orange}30` }}>
              <Star className="mr-1.5 h-3.5 w-3.5" />
              Success Stories
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            Hear From Our Students
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Real stories from students who achieved their study abroad dreams with ALO Education
          </motion.p>
        </motion.div>

        {/* Stories Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {stories.map((story, i) => (
            <motion.div key={i} variants={staggerItemScale}>
              <Card className="h-full rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" style={{ borderColor: C.border }}>
                <CardContent className="p-6 md:p-8 flex flex-col h-full">
                  {/* Photo + Name Row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 shadow-sm" style={{ borderColor: C.orange }}>
                      <Image
                        src={story.photo}
                        alt={story.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.style.background = gradients.orange;
                            target.parentElement.innerHTML = `<span class="text-white font-bold text-lg">${story.name.split(' ').map(n => n[0]).join('')}</span>`;
                          }
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold" style={{ color: C.text }}>{story.name}</h3>
                      <p className="text-sm" style={{ color: C.textSoft }}>{story.course}</p>
                    </div>
                  </div>

                  {/* Stars */}
                  {typeof story.stars === 'number' && (
                  <div className="flex gap-1 mb-4" aria-label={`Rated ${story.stars} out of 5`}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={`h-4.5 w-4.5 ${si < (story.stars ?? 0) ? 'fill-amber-400 text-crm-warning-text' : 'text-[var(--alo-placeholder)]'}`}
                      />
                    ))}
                  </div>
                  )}

                  {/* Testimonial */}
                  <p className="text-sm leading-relaxed flex-grow mb-4" style={{ color: C.textSoft }}>
                    &ldquo;{story.testimonial}&rdquo;
                  </p>

                  {/* University Badge */}
                  <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: C.border }}>
                    <GraduationCap className="h-4 w-4" style={{ color: C.blue }} />
                    <span className="text-sm font-semibold" style={{ color: C.blue }}>
                      Now studying at {story.university}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 21 — TEAM SECTION
   ═══════════════════════════════════════════════════════════════ */
function TeamSection({ dbMembers }: { dbMembers?: Array<{ id: string; name: string; role: string; specialty: string; bio: string; photo: string; sortOrder: number }> }) {
  const members = dbMembers && dbMembers.length > 0
    ? dbMembers.slice(0, 5).map((m) => ({
        name: m.name,
        role: m.role,
        specialty: m.specialty,
        bio: m.bio,
        photo: m.photo,
        initials: m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        gradient: 'linear-gradient(135deg, #0057B8 0%, #0EA5E9 100%)',
      }))
    : TEAM_MEMBERS;
  return (
    <section className="py-16 md:py-20" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={sectionTitle}>
            <Badge className="mb-4 text-xs font-semibold px-4 py-1.5 rounded-full" style={{ backgroundColor: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}30` }}>
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Our Team
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            Meet the Experts Behind Your Success
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Our experienced team is dedicated to guiding you every step of the way
          </motion.p>
        </motion.div>

        {/* Team Cards Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {TEAM_MEMBERS.map((member, i) => (
            <motion.div key={i} variants={staggerItemScale}>
              <Card className="h-full rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group" style={{ borderColor: C.border, background: '#FFFFFF' }}>
                <CardContent className="p-5 flex flex-col items-center text-center h-full">
                  {/* Avatar / Initials */}
                  {member.photo ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 shadow-sm group-hover:scale-105 transition-transform duration-300" style={{ borderColor: C.border }}>
                      <Image
                        src={member.photo}
                        alt={member.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300"
                      style={{ background: member.gradient }}
                    >
                      <span className="text-white font-bold text-xl">{member.initials}</span>
                    </div>
                  )}

                  {/* Name & Role */}
                  <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>{member.name}</h3>
                  <p className="text-xs font-semibold mb-1" style={{ color: C.orange }}>{member.role}</p>
                  <p className="text-xs mb-3" style={{ color: C.textSoft }}>{member.specialty}</p>

                  {/* Bio */}
                  <p className="text-xs leading-relaxed flex-grow" style={{ color: C.textSoft }}>
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 22 — FAQ SECTION
   ═══════════════════════════════════════════════════════════════ */
function FaqSection() {
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);

  useEffect(() => {
    fetch('/api/website/homepage')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.faqs?.length > 0) {
          const mapped = data.data.faqs.map((f: Record<string, unknown>) => ({
            question: (f.question as string) || '',
            answer: (f.answer as string) || (f.response as string) || '',
          })).filter((f: FaqItem) => f.question && f.answer);
          if (mapped.length > 0) setFaqs(mapped.slice(0, 20));
        }
      })
      .catch(() => { /* no verified stories yet — section stays hidden */ });
  }, []);

  return (
    <section className="py-16 md:py-20" style={{ background: '#FFFFFF' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={sectionTitle}>
            <Badge className="mb-4 text-xs font-semibold px-4 py-1.5 rounded-full" style={{ backgroundColor: `${C.orange}15`, color: C.orange, border: `1px solid ${C.orange}30` }}>
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
              FAQ
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Find answers to common questions about studying abroad
          </motion.p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b" style={{ borderColor: C.border }}>
                <AccordionTrigger className="text-sm md:text-base font-semibold py-4 md:py-5 text-left hover:no-underline" style={{ color: C.text }}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed" style={{ color: C.textSoft }}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Still have questions CTA */}
        <motion.div
          className="text-center mt-10 p-6 rounded-2xl"
          style={{ backgroundColor: `${C.blue}08`, border: `1px solid ${C.blue}20` }}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <p className="text-sm font-medium mb-3" style={{ color: C.text }}>
            Still have questions?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              className="h-12 px-6 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: C.blue }}
              asChild
            >
              <Link href="/resources/faqs">
                <MessageCircle className="mr-2 h-4 w-4" />
                Browse All FAQs
              </Link>
            </Button>

          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 23 — FINAL CTA SECTION
   ═══════════════════════════════════════════════════════════════ */
function FinalCtaSection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredCountry: '',
    preferredLevel: '',
    preferredSubject: '',
    intake: '',
    budget: '',
    englishTest: '',
    englishScore: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch('/api/website/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'homepage',
          sourceSection: 'final_cta',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitResult({ success: true, message: data.message || 'Your inquiry has been submitted successfully!' });
        setFormData({
          name: '', phone: '', email: '', preferredCountry: '', preferredLevel: '',
          preferredSubject: '', intake: '', budget: '', englishTest: '', englishScore: '', message: '',
        });
      } else {
        setSubmitResult({ success: false, message: data.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      setSubmitResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  return (
    <section className="py-16 md:py-20 relative overflow-hidden bg-[var(--alo-cta-soft)]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column — Content */}
          <motion.div
            className="text-[var(--alo-text)]"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideFromLeft}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Ready to Start Your Study Abroad Journey?
            </h2>
            <p className="text-base md:text-lg mb-8 text-[var(--alo-body)] leading-relaxed">
              Take the first step today. Fill out the form and one of our expert counselors will get back to you within 24 hours with a personalized plan.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Button
                className="h-12 min-h-[48px] px-6 md:px-8 rounded-full text-sm font-semibold text-black hover:text-white shadow-lg"
                asChild
              >
                <Link href="/book-consultation">
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Request a Consultation
                </Link>
              </Button>
              <Button
                className="h-12 min-h-[48px] px-6 md:px-8 rounded-full text-sm font-semibold bg-white shadow-card border border-[var(--alo-brand-border)]"
                style={{ color: 'var(--alo-brand)' }}
                asChild
              >
                <Link href="/course-finder">
                  <Search className="mr-2 h-4 w-4" />
                  Find Your Course
                </Link>
              </Button>

            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {(ALO_CONTACT.hasContactPhone || ALO_CONTACT.hasWhatsApp) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--alo-brand-light)] flex items-center justify-center">
                    <Phone className="h-4.5 w-4.5 text-[var(--alo-brand)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--alo-text-muted)]">{ALO_CONTACT.hasWhatsApp ? 'Call / WhatsApp' : 'Call'}</p>
                    {ALO_CONTACT.hasWhatsApp ? (
                      <a href={ALO_CONTACT.whatsappHref} className="text-sm font-semibold hover:underline">{ALO_CONTACT.whatsappDisplay}</a>
                    ) : (
                      <a href={ALO_CONTACT.mobileHref} className="text-sm font-semibold hover:underline">{ALO_CONTACT.mobileDisplay}</a>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--alo-brand-light)] flex items-center justify-center">
                  <Mail className="h-4.5 w-4.5 text-[var(--alo-brand)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--alo-text-muted)]">Email Us</p>
                  <a href={ALO_CONTACT.emailHref} className="text-sm font-semibold hover:underline">
                    {ALO_CONTACT.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--alo-brand-light)] flex items-center justify-center">
                  <MapPin className="h-4.5 w-4.5 text-[var(--alo-brand)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--alo-text-muted)]">Visit Us</p>
                  <a
                    href={ALO_CONTACT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline"
                  >
                    {ALO_CONTACT.address}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column — Lead Form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideFromRight}
          >
            <Card className="rounded-2xl shadow-xl border-none">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl font-bold mb-1" style={{ color: C.text }}>Request a Consultation</h3>
                <p className="text-sm mb-6" style={{ color: C.textSoft }}>Fill in the form below and we&apos;ll reach out within 24 hours.</p>

                {submitResult && (
                  <div
                    className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
                      submitResult.success
                        ? 'border border-crm-success-border bg-crm-success-bg'
                        : 'border border-crm-danger-border bg-crm-danger-bg'
                    }`}
                  >
                    <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 ${submitResult.success ? 'text-crm-success-text' : 'text-crm-danger-text'}`} />
                    <p className={`text-sm ${submitResult.success ? 'text-crm-success-text' : 'text-crm-danger-text'}`}>
                      {submitResult.message}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Row 1: Name, Phone, Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lead-name" className="text-xs font-medium" style={{ color: C.text }}>Full Name *</Label>
                      <Input
                        id="lead-name"
                        placeholder="Your name"
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="h-11 rounded-lg text-sm"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lead-phone" className="text-xs font-medium" style={{ color: C.text }}>Phone *</Label>
                      <Input
                        id="lead-phone"
                        type="tel"
                        placeholder="+880"
                        required
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="h-11 rounded-lg text-sm"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lead-email" className="text-xs font-medium" style={{ color: C.text }}>Email *</Label>
                      <Input
                        id="lead-email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="h-11 rounded-lg text-sm"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Country, Level, Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium" style={{ color: C.text }}>Preferred Country</Label>
                      <Select value={formData.preferredCountry} onValueChange={(v) => handleChange('preferredCountry', v)}>
                        <SelectTrigger className="w-full h-11 rounded-lg text-sm" style={{ borderColor: C.border }}>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="usa">United States</SelectItem>
                          <SelectItem value="canada">Canada</SelectItem>
                          <SelectItem value="australia">Australia</SelectItem>
                          <SelectItem value="germany">Germany</SelectItem>
                          <SelectItem value="ireland">Ireland</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium" style={{ color: C.text }}>Study Level</Label>
                      <Select value={formData.preferredLevel} onValueChange={(v) => handleChange('preferredLevel', v)}>
                        <SelectTrigger className="w-full h-11 rounded-lg text-sm" style={{ borderColor: C.border }}>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="foundation">Foundation</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="postgraduate">Postgraduate (Master&apos;s)</SelectItem>
                          <SelectItem value="phd">PhD / Doctorate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium" style={{ color: C.text }}>Subject Area</Label>
                      <Select value={formData.preferredSubject} onValueChange={(v) => handleChange('preferredSubject', v)}>
                        <SelectTrigger className="w-full h-11 rounded-lg text-sm" style={{ borderColor: C.border }}>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business & Management</SelectItem>
                          <SelectItem value="computing">Computing & IT</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="health">Health & Medicine</SelectItem>
                          <SelectItem value="law">Law</SelectItem>
                          <SelectItem value="arts">Arts & Design</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="social">Social Sciences</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 3: Intake, Budget, English Test */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium" style={{ color: C.text }}>Intake</Label>
                      <Select value={formData.intake} onValueChange={(v) => handleChange('intake', v)}>
                        <SelectTrigger className="w-full h-11 rounded-lg text-sm" style={{ borderColor: C.border }}>
                          <SelectValue placeholder="Select intake" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sep-2025">September 2025</SelectItem>
                          <SelectItem value="oct-2025">October 2025</SelectItem>
                          <SelectItem value="jan-2026">January 2026</SelectItem>
                          <SelectItem value="feb-2026">February 2026</SelectItem>
                          <SelectItem value="may-2026">May 2026</SelectItem>
                          <SelectItem value="sep-2026">September 2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium" style={{ color: C.text }}>Budget Range</Label>
                      <Select value={formData.budget} onValueChange={(v) => handleChange('budget', v)}>
                        <SelectTrigger className="w-full h-11 rounded-lg text-sm" style={{ borderColor: C.border }}>
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-15k">Under £15,000/year</SelectItem>
                          <SelectItem value="15k-25k">£15,000 – £25,000/year</SelectItem>
                          <SelectItem value="25k-35k">£25,000 – £35,000/year</SelectItem>
                          <SelectItem value="over-35k">Over £35,000/year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium" style={{ color: C.text }}>English Test</Label>
                      <Select value={formData.englishTest} onValueChange={(v) => handleChange('englishTest', v)}>
                        <SelectTrigger className="w-full h-11 rounded-lg text-sm" style={{ borderColor: C.border }}>
                          <SelectValue placeholder="Select test" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ielts">IELTS</SelectItem>
                          <SelectItem value="toefl">TOEFL</SelectItem>
                          <SelectItem value="pte">PTE Academic</SelectItem>
                          <SelectItem value="duolingo">Duolingo</SelectItem>
                          <SelectItem value="not-taken">Not taken yet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 4: Score + Message */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lead-score" className="text-xs font-medium" style={{ color: C.text }}>Test Score</Label>
                      <Input
                        id="lead-score"
                        placeholder="e.g. 6.5 overall"
                        value={formData.englishScore}
                        onChange={(e) => handleChange('englishScore', e.target.value)}
                        className="h-11 rounded-lg text-sm"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lead-message" className="text-xs font-medium" style={{ color: C.text }}>Additional Message</Label>
                      <Textarea
                        id="lead-message"
                        placeholder="Any specific questions?"
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        rows={3}
                        className="rounded-lg text-sm"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl text-sm font-semibold text-black hover:text-white shadow-lg mt-2"

                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <SendIcon className="h-4 w-4" />
                        Submit Your Inquiry
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center" style={{ color: C.textSoft }}>
                    By submitting, you agree to our Privacy Policy. We&apos;ll never share your data.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* Send icon component for form submit button */
function SendIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 24 — FOOTER
   ═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export default function HomepagePart4() {
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: string; specialty: string; bio: string; photo: string; sortOrder: number }>>([]);

  useEffect(() => {
    fetch('/api/website/homepage')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.teamMembers?.length > 0) {
          setTeamMembers(data.data.teamMembers);
        }
      })
      .catch((err) => { console.error('Team members fetch failed:', err); });
  }, []);

  return (
    <>
      <ResourcesSection />
      <SuccessStoriesSection />
      <TeamSection dbMembers={teamMembers} />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
