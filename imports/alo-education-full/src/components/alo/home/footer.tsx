'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  ExternalLink,
  Shield,
  Award,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  ChevronRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ALO_ORANGE = '#F37021';
const EDU_BLUE = '#0066CC';

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const ctaVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const STUDY_ABROAD_LINKS = [
  { label: 'UK', href: '/countries/uk' },
  { label: 'USA', href: '/countries/usa' },
  { label: 'Australia', href: '/countries/australia' },
  { label: 'Canada', href: '/countries/canada' },
  { label: 'New Zealand', href: '/countries/new-zealand' },
  { label: 'Ireland', href: '/countries/ireland' },
  { label: 'Germany', href: '/countries/germany' },
  { label: 'UAE', href: '/countries/uae' },
];

const RESOURCE_LINKS = [
  { label: 'Courses', href: '/courses' },
  { label: 'Scholarships', href: '/scholarships' },
  { label: 'IELTS', href: '/exams/ielts' },
  { label: 'PTE', href: '/exams/pte' },
  { label: 'TOEFL', href: '/exams/toefl' },
  { label: 'Blog', href: '/blog' },
  { label: 'Student Stories', href: '/student-stories' },
  { label: 'AI Tools', href: '/ai-tools' },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Careers', href: '/careers' },
  { label: 'Partners', href: '/partners' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com/aloeducation', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/aloeducation', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/@aloeducation', label: 'YouTube' },
  { icon: Linkedin, href: 'https://linkedin.com/company/aloeducation', label: 'LinkedIn' },
];

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                     */
/* ------------------------------------------------------------------ */

/** TikTok SVG icon (not available in lucide-react) */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.14V11.7a4.83 4.83 0 01-3.77-1.78V6.69h3.77z" />
    </svg>
  );
}

/** Social icon button */
function SocialButton({
  icon: Icon,
  href,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition-all duration-200 hover:border-[#F37021] hover:text-[#F37021] hover:scale-110 focus-ring"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

/** Footer link item */
function FooterLink({
  label,
  href,
  showArrow = false,
}: {
  label: string;
  href: string;
  showArrow?: boolean;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-1.5 text-sm text-white/60 transition-colors duration-200 hover:text-[#0066CC] focus-ring rounded"
    >
      <span>{label}</span>
      {showArrow && (
        <ExternalLink className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
      )}
    </a>
  );
}

/** Section column with heading and links */
function FooterColumn({
  heading,
  links,
  viewAllHref,
}: {
  heading: string;
  links: { label: string; href: string }[];
  viewAllHref?: string;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
        {heading}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <FooterLink label={link.label} href={link.href} />
          </li>
        ))}
        {viewAllHref && (
          <li>
            <a
              href={viewAllHref}
              className="group inline-flex items-center gap-1 text-sm font-medium text-[#F37021] transition-colors duration-200 hover:text-[#F37021]/80 focus-ring rounded"
            >
              <span>View All Countries</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </li>
        )}
      </ul>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Footer                                                        */
/* ------------------------------------------------------------------ */

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: '-50px' });

  return (
    <footer
      ref={footerRef}
      className="w-full bg-[#0A0A0A] text-white"
      role="contentinfo"
    >
      {/* CTA STRIP */}
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={ctaVariants}
        className="relative overflow-hidden"
      >
        {/* Animated gradient border top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] gradient-border" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0066CC]/[0.04] via-transparent to-[#F37021]/[0.04]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Ready to start your study abroad journey?
              </h2>
              <p className="text-sm text-white/50">
                Get personalized guidance from our expert counselors today.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-[#F37021] font-semibold text-white shadow-lg shadow-[#F37021]/20 transition-all duration-200 hover:bg-[#D45A10] hover:shadow-xl hover:shadow-[#F37021]/30 focus-visible:ring-2 focus-visible:ring-[#F37021] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                Find My Course
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 font-semibold text-white transition-all duration-200 hover:border-[#0066CC] hover:bg-[#0066CC] hover:text-white focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
              >
                <Phone className="mr-2 h-4 w-4" />
                Talk to Expert
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MAIN FOOTER CONTENT - 4 COLUMNS */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8"
        >
          {/* COLUMN 1: BRAND */}
          <motion.div
            variants={itemVariants}
            className="sm:col-span-2 lg:col-span-4"
          >
            {/* Logo */}
            <a href="/" className="mb-5 inline-flex items-center gap-1 focus-ring rounded" aria-label="ALO Education Home">
              <span
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: ALO_ORANGE }}
              >
                ALO
              </span>
              <span className="text-2xl font-semibold tracking-tight text-white">
                Education
              </span>
            </a>

            {/* Description */}
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/50">
              Your trusted partner for international education. We help
              students from Bangladesh achieve their dream of studying at
              top universities worldwide.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <SocialButton
                  key={social.label}
                  icon={social.icon}
                  href={social.href}
                  label={social.label}
                />
              ))}
              <SocialButton
                icon={TikTokIcon}
                href="https://tiktok.com/@aloeducation"
                label="TikTok"
              />
            </div>

            {/* Contact Info */}
            <div className="mt-6 space-y-2.5">
              <a
                href="mailto:info@aloeducation.com"
                className="flex items-center gap-2.5 text-sm text-white/50 transition-colors duration-200 hover:text-[#0066CC] focus-ring rounded"
              >
                <Mail className="h-4 w-4 shrink-0 text-[#F37021]" />
                <span>info@aloeducation.com</span>
              </a>
              <a
                href="tel:+8801234567890"
                className="flex items-center gap-2.5 text-sm text-white/50 transition-colors duration-200 hover:text-[#0066CC] focus-ring rounded"
              >
                <Phone className="h-4 w-4 shrink-0 text-[#F37021]" />
                <span>+880 1234 567890</span>
              </a>
              <div className="flex items-start gap-2.5 text-sm text-white/50">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F37021]" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 2: STUDY ABROAD */}
          <div className="sm:col-span-1 lg:col-span-2">
            <FooterColumn
              heading="Study Abroad"
              links={STUDY_ABROAD_LINKS}
              viewAllHref="/countries"
            />
          </div>

          {/* COLUMN 3: RESOURCES */}
          <div className="sm:col-span-1 lg:col-span-3">
            <FooterColumn heading="Resources" links={RESOURCE_LINKS} />
          </div>

          {/* COLUMN 4: COMPANY */}
          <div className="sm:col-span-2 lg:col-span-3">
            <FooterColumn heading="Company" links={COMPANY_LINKS} />
          </div>
        </motion.div>
      </div>

      {/* SEPARATOR */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* BOTTOM BAR */}
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={ctaVariants}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Left: Copyright + Registration */}
            <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
              <p className="text-xs text-white/40">
                © {new Date().getFullYear()} ALO Education. All rights reserved.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-white/30">
                <MapPin className="h-3 w-3" />
                <span>Registered in Bangladesh</span>
              </div>
            </div>

            {/* Right: Badges */}
            <div className="flex items-center gap-4">
              {/* ISO Certified Badge */}
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5">
                <Shield
                  className="h-4 w-4 text-[#0066CC]"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-white/60">
                  ISO Certified
                </span>
              </div>

              {/* British Council Partner Badge */}
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5">
                <Award
                  className="h-4 w-4 text-[#F37021]"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-white/60">
                  British Council Partner
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
