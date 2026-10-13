'use client';

import {
  Globe,
  GraduationCap,
  BookOpen,
  Award,
  Languages,
  Bot,
  BookText,
  MessageSquareQuote,
  Info,
  Plane,
  FileText,
  Compass,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewFooterProps {
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// ─── CTA Strip ───────────────────────────────────────────────────────────────

function CtaStrip({ onNavigate, onLeadOpen }: NewFooterProps) {
  return (
    <section
      className="relative w-full py-12 md:py-16 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #004C99 0%, #0066CC 100%)',
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              Ready to start your study abroad journey?
            </h2>
            <p className="mt-2 text-white/70 text-sm md:text-base max-w-lg mx-auto md:mx-0">
              Get free expert guidance from our certified counselors. No fees, no obligations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Button
              onClick={onLeadOpen}
              className={cn(
                'h-12 px-8 rounded-xl font-semibold text-sm min-w-[220px]',
                'transition-all duration-200',
                'hover:shadow-lg hover:shadow-orange-500/30',
              )}
              style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
            >
              Book Free Consultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => onNavigate('courses')}
              variant="outline"
              className={cn(
                'h-12 px-8 rounded-xl font-semibold text-sm min-w-[200px]',
                'bg-transparent text-white border-white/30',
                'hover:bg-white/10 hover:text-white hover:border-white/50',
                'transition-all duration-200',
              )}
            >
              Explore Courses
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social Icons ─────────────────────────────────────────────────────────────

function SocialIcons({ onNavigate }: { onNavigate: (page: string) => void }) {
  const socials = [
    { icon: <Facebook className="h-4 w-4" />, label: 'Facebook', href: '#' },
    { icon: <Instagram className="h-4 w-4" />, label: 'Instagram', href: '#' },
    { icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn', href: '#' },
    { icon: <Youtube className="h-4 w-4" />, label: 'YouTube', href: '#' },
  ];

  return (
    <div className="flex items-center gap-3 mt-5">
      {socials.map((social) => (
        <a
          key={social.label}
          href={social.href}
          aria-label={social.label}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg',
            'bg-white/10 text-white/70',
            'hover:bg-[#F37021] hover:text-white',
            'transition-all duration-200',
          )}
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
}

// ─── Footer Link ─────────────────────────────────────────────────────────────

function FooterLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-sm text-white/60 hover:text-white transition-colors duration-200',
        'py-1.5 leading-relaxed text-left',
      )}
    >
      {label}
    </button>
  );
}

// ─── Contact Item ─────────────────────────────────────────────────────────────

function ContactItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-[#F37021] mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-white/60 leading-relaxed">{children}</span>
    </div>
  );
}

// ─── Logo (Light) ─────────────────────────────────────────────────────────────

function FooterLogo() {
  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={cn(
          'flex items-center justify-center rounded-xl font-bold text-white shrink-0',
          'w-10 h-10 text-xl',
        )}
        style={{
          background: 'linear-gradient(135deg, #0066CC, #004C99)',
        }}
      >
        A
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-[17px] text-white tracking-tight">
          ALO Education
        </span>
        <span className="text-xs text-white/50 tracking-wide">Study Abroad</span>
      </div>
    </div>
  );
}

// ─── Main Footer ──────────────────────────────────────────────────────────────

function MainFooter({ onNavigate }: NewFooterProps) {
  return (
    <div className="bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* ── Column 1: Brand ── */}
          <div>
            <FooterLogo />
            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
              Your trusted partner for international education. Expert counseling
              for studying in top universities worldwide.
            </p>
            <SocialIcons onNavigate={onNavigate} />
          </div>

          {/* ── Column 2: Study Abroad ── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">
              Study Abroad
            </h3>
            <div className="flex flex-col">
              <FooterLink label="Countries" onClick={() => onNavigate('countries')} />
              <FooterLink label="Universities" onClick={() => onNavigate('universities')} />
              <FooterLink label="Courses" onClick={() => onNavigate('courses')} />
              <FooterLink label="Scholarships" onClick={() => onNavigate('scholarships')} />
              <FooterLink label="English Tests" onClick={() => onNavigate('english-tests')} />
              <FooterLink label="AI Tools" onClick={() => onNavigate('ai-tools')} />
            </div>
          </div>

          {/* ── Column 3: Resources ── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">
              Resources
            </h3>
            <div className="flex flex-col">
              <FooterLink label="Blog" onClick={() => onNavigate('blog')} />
              <FooterLink label="Student Stories" onClick={() => onNavigate('student-stories')} />
              <FooterLink label="Visa Guides" onClick={() => onNavigate('visa-guides')} />
              <FooterLink label="Application Tips" onClick={() => onNavigate('application-tips')} />
              <FooterLink label="Pre-Departure" onClick={() => onNavigate('pre-departure')} />
              <FooterLink label="About" onClick={() => onNavigate('about')} />
            </div>
          </div>

          {/* ── Column 4: Contact ── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">
              Contact
            </h3>
            <div className="flex flex-col">
              <ContactItem icon={<MapPin className="h-4 w-4" />}>
                House 12, Road 8, Dhanmondi<br />
                Dhaka 1209, Bangladesh
              </ContactItem>
              <ContactItem icon={<Phone className="h-4 w-4" />}>
                +880 1700-000000
              </ContactItem>
              <ContactItem icon={<Mail className="h-4 w-4" />}>
                info@aloeducation.com
              </ContactItem>
              <ContactItem icon={<Phone className="h-4 w-4" />}>
                WhatsApp: +880 1700-000000
              </ContactItem>
              <ContactItem icon={<Clock className="h-4 w-4" />}>
                Sun – Thu: 9:00 AM – 7:00 PM
              </ContactItem>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} ALO Education. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => onNavigate('privacy')}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => onNavigate('terms')}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Footer Export ───────────────────────────────────────────────────────

export function NewFooter({ onNavigate, onLeadOpen }: NewFooterProps) {
  return (
    <footer className="mt-auto">
      <CtaStrip onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
      <MainFooter onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
    </footer>
  );
}
