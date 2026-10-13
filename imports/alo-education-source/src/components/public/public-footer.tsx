'use client';

import {
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PublicFooterProps {
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
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
      className="text-[13px] text-gray-400 hover:text-white transition-colors duration-150 py-1.5 leading-relaxed text-left w-full"
    >
      {label}
    </button>
  );
}

// ─── Column Section ──────────────────────────────────────────────────────────

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-white mb-4 uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

// ─── Social Icon ─────────────────────────────────────────────────────────────

function SocialIcon({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg',
        'bg-white/5 text-white/50',
        'hover:bg-[#E8501A] hover:text-white',
        'transition-all duration-200',
      )}
    >
      {icon}
    </a>
  );
}

// ─── CTA Banner ──────────────────────────────────────────────────────────────

function CtaBanner({ onLeadOpen }: { onLeadOpen: () => void }) {
  return (
    <section className="relative w-full py-12 md:py-14 overflow-hidden bg-[#0057B8]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/5" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              Ready to start your study abroad journey?
            </h2>
            <p className="mt-2 text-white/60 text-sm md:text-base max-w-lg mx-auto md:mx-0">
              Get free expert guidance from our certified counselors. No fees, no obligations.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Button
              onClick={onLeadOpen}
              className={cn(
                'h-11 px-7 rounded-lg font-semibold text-[13px] min-w-[210px]',
                'transition-all duration-200 hover:shadow-lg',
              )}
              style={{ backgroundColor: '#E8501A', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D04515')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E8501A')}
            >
              Book Free Consultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Footer ─────────────────────────────────────────────────────────────

export function PublicFooter({ onNavigate, onLeadOpen }: PublicFooterProps) {
  const handleNav = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto">
      <CtaBanner onLeadOpen={onLeadOpen} />

      <div className="bg-[#0B0F1A] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">

            {/* ── Column 1: ALO Education (Brand) ── */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2.5 select-none">
                <div
                  className="flex items-center justify-center rounded-lg font-bold text-white shrink-0 w-9 h-9 text-lg"
                  style={{ background: 'linear-gradient(135deg, #0057B8, #003D82)' }}
                >
                  A
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-[15px] text-white tracking-tight">ALO Education</span>
                  <span className="text-[10px] text-white/40 tracking-wider uppercase">Study Abroad</span>
                </div>
              </div>
              <p className="mt-4 text-[13px] text-white/40 leading-relaxed max-w-[260px]">
                Your trusted partner for international education. Expert counseling for studying in top universities worldwide.
              </p>
              <div className="flex items-center gap-2.5 mt-5">
                <SocialIcon icon={<Facebook className="h-4 w-4" />} label="Facebook" href="#" />
                <SocialIcon icon={<Instagram className="h-4 w-4" />} label="Instagram" href="#" />
                <SocialIcon icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" href="#" />
                <SocialIcon icon={<Youtube className="h-4 w-4" />} label="YouTube" href="#" />
              </div>
            </div>

            {/* ── Column 2: Destinations ── */}
            <FooterColumn title="Destinations">
              <FooterLink label="United Kingdom" onClick={() => handleNav('country', 'uk')} />
              <FooterLink label="USA" onClick={() => handleNav('country', 'usa')} />
              <FooterLink label="Canada" onClick={() => handleNav('country', 'canada')} />
              <FooterLink label="Australia" onClick={() => handleNav('country', 'australia')} />
              <FooterLink label="Ireland" onClick={() => handleNav('country', 'ireland')} />
              <FooterLink label="New Zealand" onClick={() => handleNav('country', 'new-zealand')} />
              <FooterLink label="Dubai / UAE" onClick={() => handleNav('country', 'dubai')} />
            </FooterColumn>

            {/* ── Column 3: Course Finder + Services ── */}
            <FooterColumn title="Quick Links">
              <FooterLink label="Course Finder" onClick={() => handleNav('course-finder')} />
              <FooterLink label="Services" onClick={() => handleNav('services')} />
              <FooterLink label="Scholarships" onClick={() => handleNav('scholarships')} />
              <FooterLink label="About Us" onClick={() => handleNav('about')} />
              <FooterLink label="Contact" onClick={() => handleNav('contact')} />
              <FooterLink label="Blog" onClick={() => handleNav('blog')} />
            </FooterColumn>

            {/* ── Column 4: Language Prep + Resources ── */}
            <FooterColumn title="Resources">
              <FooterLink label="IELTS" onClick={() => handleNav('info-center')} />
              <FooterLink label="PTE Academic" onClick={() => handleNav('info-center')} />
              <FooterLink label="TOEFL iBT" onClick={() => handleNav('info-center')} />
              <FooterLink label="Visa Guides" onClick={() => handleNav('info-center')} />
              <FooterLink label="Success Stories" onClick={() => handleNav('success-stories')} />
              <FooterLink label="FAQs" onClick={() => handleNav('faq')} />
            </FooterColumn>

            {/* ── Column 5: Contact ── */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-[13px] font-semibold text-white mb-4 uppercase tracking-wider">Contact</h3>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-[#E8501A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] text-white/40 mb-0.5">Phone</p>
                    <p className="text-[13px] text-white/70">+880 1700-000000</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-[#E8501A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] text-white/40 mb-0.5">WhatsApp</p>
                    <p className="text-[13px] text-white/70">+880 1700-000000</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-[#E8501A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] text-white/40 mb-0.5">Email</p>
                    <p className="text-[13px] text-white/70">info@aloeducation.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#E8501A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] text-white/40 mb-0.5">Office</p>
                    <p className="text-[13px] text-white/70">House 12, Road 8, Dhanmondi</p>
                    <p className="text-[12px] text-white/50">Dhaka 1209, Bangladesh</p>
                  </div>
                </div>
                {/* Social links for contact column */}
                <div className="flex items-center gap-2 mt-2">
                  <SocialIcon icon={<Facebook className="h-3.5 w-3.5" />} label="Facebook" href="#" />
                  <SocialIcon icon={<Instagram className="h-3.5 w-3.5" />} label="Instagram" href="#" />
                  <SocialIcon icon={<Linkedin className="h-3.5 w-3.5" />} label="LinkedIn" href="#" />
                  <SocialIcon icon={<Youtube className="h-3.5 w-3.5" />} label="YouTube" href="#" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Legal + Bottom Bar ── */}
        <div className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
            {/* Legal Links Row */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-4">
              <button onClick={() => handleNav('about')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
                Terms
              </button>
              <span className="text-white/10">|</span>
              <button onClick={() => handleNav('about')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
                Privacy
              </button>
              <span className="text-white/10">|</span>
              <button onClick={() => handleNav('about')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
                Cookie Policy
              </button>
              <span className="text-white/10">|</span>
              <button onClick={() => handleNav('about')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
                Communication Policy
              </button>
              <span className="text-white/10">|</span>
              <button onClick={() => handleNav('about')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
                Lead Data Usage
              </button>
              <span className="text-white/10">|</span>
              <button onClick={() => handleNav('about')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
                User Guide
              </button>
            </div>
            {/* Copyright */}
            <p className="text-center text-[11px] text-white/25">
              &copy; {new Date().getFullYear()} ALO Education. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
