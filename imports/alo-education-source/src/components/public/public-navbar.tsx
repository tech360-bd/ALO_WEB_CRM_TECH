'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown,
  Menu,
  Globe,
  Search,
  Briefcase,
  BookOpen,
  FileText,
  Users,
  GraduationCap,
  Phone,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PublicNavbarProps {
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// ─── Country Data ────────────────────────────────────────────────────────────

const COUNTRIES = [
  { label: 'United Kingdom', slug: 'uk' },
  { label: 'USA', slug: 'usa' },
  { label: 'Canada', slug: 'canada' },
  { label: 'Australia', slug: 'australia' },
  { label: 'Ireland', slug: 'ireland' },
  { label: 'New Zealand', slug: 'new-zealand' },
  { label: 'Dubai / UAE', slug: 'dubai' },
];

// ─── Language Prep Data ──────────────────────────────────────────────────────

const LANGUAGE_TESTS = [
  { label: 'IELTS', slug: 'ielts' },
  { label: 'IELTS UKVI', slug: 'ielts-ukvi' },
  { label: 'PTE Academic', slug: 'pte-academic' },
  { label: 'TOEFL iBT', slug: 'toefl-ibt' },
  { label: 'Duolingo English Test', slug: 'duolingo' },
  { label: 'OIETC / ELLT', slug: 'oietc-ellt' },
  { label: 'Oxford ELLT', slug: 'oxford-ellt' },
  { label: 'LanguageCert', slug: 'languagecert' },
  { label: 'Kaplan', slug: 'kaplan' },
  { label: 'OET', slug: 'oet' },
  { label: 'MOI Guidance', slug: 'moi-guidance' },
  { label: 'English Test Comparison', slug: 'english-test-comparison' },
];

// ─── Resources Data ──────────────────────────────────────────────────────────

const RESOURCES = [
  { label: 'Blogs', page: 'blog' },
  { label: 'Articles', page: 'info-center' },
  { label: 'Scholarships', page: 'scholarships' },
  { label: 'Visa Guides', page: 'info-center' },
  { label: 'Success Stories', page: 'success-stories' },
  { label: 'Application Tips', page: 'info-center' },
  { label: 'Pre-Departure', page: 'info-center' },
  { label: 'FAQs', page: 'faq' },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────

function AloLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-lg font-bold text-white shrink-0',
          'w-9 h-9 text-lg shadow-sm',
        )}
        style={{ background: 'linear-gradient(135deg, #0057B8, #003D82)' }}
      >
        A
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-[16px] tracking-tight text-gray-900">
          ALO Education
        </span>
        <span className="text-[10px] tracking-wider text-gray-400 uppercase">Study Abroad</span>
      </div>
    </div>
  );
}

// ─── Desktop Dropdown ────────────────────────────────────────────────────────

function DropdownMenu({
  label,
  children,
  isOpen,
  onToggle,
}: {
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onToggle();
  }, [onToggle]);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (isOpen) onToggle();
    }, 180);
  }, [isOpen, onToggle]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && isOpen) {
        onToggle();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div
           ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1 px-3 py-2 text-[13.5px] font-medium rounded-md transition-colors',
          isOpen ? 'text-[#0057B8]' : 'text-gray-700 hover:text-[#0057B8]',
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 z-50',
          isOpen
            ? 'pointer-events-auto opacity-100 translate-y-0'
            : 'pointer-events-none opacity-0 -translate-y-1.5',
        )}
      >
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[220px] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Accordion Item ───────────────────────────────────────────────────

function MobileAccordion({
  label,
  children,
  isExpanded,
  onToggle,
}: {
  label: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3.5 text-[14px] font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors min-h-[48px]"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-250',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="pl-3 pb-2">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Navbar ─────────────────────────────────────────────────────────────

export function PublicNavbar({ onNavigate, onLeadOpen }: PublicNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  // Scroll detection
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleDropdown = useCallback((key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

  const handleCountryClick = useCallback((slug: string) => {
    onNavigate('country', slug);
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [onNavigate]);

  const handleNavigate = useCallback((page: string) => {
    onNavigate(page);
    setOpenDropdown(null);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate]);

  const handleMobileNav = useCallback((page: string) => {
    onNavigate(page);
    setMobileOpen(false);
    setMobileExpanded(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate]);

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-[#E2E8F0]'
            : 'bg-white border-b border-[#E2E8F0]/60',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px]">
            {/* Logo */}
            <button
              onClick={() => handleNavigate('home')}
              className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] rounded-lg p-1"
              aria-label="ALO Education Home"
            >
              <AloLogo />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
              {/* Destinations */}
              <DropdownMenu
                label="Destinations"
                isOpen={openDropdown === 'destinations'}
                onToggle={() => toggleDropdown('destinations')}
              >
                {COUNTRIES.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => handleCountryClick(c.slug)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#0057B8] transition-colors text-left"
                  >
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                    {c.label}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => handleNavigate('about')}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-500 hover:bg-blue-50 hover:text-[#0057B8] transition-colors text-left"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    More Countries
                  </button>
                </div>
              </DropdownMenu>

              {/* Course Finder */}
              <button
                onClick={() => handleNavigate('course-finder')}
                className="px-3 py-2 text-[13.5px] font-medium text-gray-700 hover:text-[#0057B8] rounded-md transition-colors"
              >
                Course Finder
              </button>

              {/* Services */}
              <button
                onClick={() => handleNavigate('services')}
                className="px-3 py-2 text-[13.5px] font-medium text-gray-700 hover:text-[#0057B8] rounded-md transition-colors"
              >
                Services
              </button>

              {/* Language Prep */}
              <DropdownMenu
                label="Language Prep"
                isOpen={openDropdown === 'language'}
                onToggle={() => toggleDropdown('language')}
              >
                <div className="max-h-[340px] overflow-y-auto">
                  {LANGUAGE_TESTS.map((t) => (
                    <button
                      key={t.slug}
                      onClick={() => handleNavigate('info-center')}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#0057B8] transition-colors text-left"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </DropdownMenu>

              {/* Resources */}
              <DropdownMenu
                label="Resources"
                isOpen={openDropdown === 'resources'}
                onToggle={() => toggleDropdown('resources')}
              >
                {RESOURCES.map((r) => (
                  <button
                    key={r.page}
                    onClick={() => handleNavigate(r.page)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#0057B8] transition-colors text-left"
                  >
                    {r.label === 'Scholarships' && <FileText className="h-3.5 w-3.5 text-gray-400" />}
                    {r.label === 'Success Stories' && <Users className="h-3.5 w-3.5 text-gray-400" />}
                    {r.label === 'FAQs' && <Search className="h-3.5 w-3.5 text-gray-400" />}
                    {!['Scholarships', 'Success Stories', 'FAQs'].includes(r.label) && (
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    {r.label}
                  </button>
                ))}
              </DropdownMenu>

              {/* Portals */}
              <DropdownMenu
                label="Portals"
                isOpen={openDropdown === 'portals'}
                onToggle={() => toggleDropdown('portals')}
              >
                <button
                  onClick={() => handleNavigate('student-dashboard')}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#0057B8] transition-colors text-left"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                  Student Portal
                </button>
                <button
                  onClick={() => handleNavigate('about')}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#0057B8] transition-colors text-left"
                >
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                  Partner Portal
                </button>
                <button
                  onClick={() => handleNavigate('about')}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#0057B8] transition-colors text-left"
                >
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  Employee Portal
                </button>
              </DropdownMenu>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* CTA Button */}
              <Button
                onClick={() => { onLeadOpen(); setMobileOpen(false); }}
                className={cn(
                  'hidden sm:flex h-10 px-5 rounded-lg font-semibold text-[13px]',
                  'transition-all duration-200 hover:shadow-md',
                )}
                style={{ backgroundColor: '#E8501A', color: '#FFFFFF' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D04515')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E8501A')}
              >
                Book Free Consultation
              </Button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  'flex lg:hidden items-center justify-center',
                  'w-10 h-10 rounded-lg',
                  'text-gray-700 hover:bg-gray-100 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]',
                )}
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 w-full max-w-[320px] bg-white shadow-2xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 h-[64px] border-b border-gray-100">
            <AloLogo />
            <button
              onClick={() => setMobileOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Nav Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile navigation">
            {/* Home */}
            <button
              onClick={() => handleMobileNav('home')}
              className="flex items-center w-full px-4 py-3.5 text-[14px] font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors min-h-[48px]"
            >
              ALO Education
            </button>

            {/* Destinations */}
            <MobileAccordion
              label="Destinations"
              isExpanded={mobileExpanded === 'destinations'}
              onToggle={() => setMobileExpanded(mobileExpanded === 'destinations' ? null : 'destinations')}
            >
              {COUNTRIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => handleCountryClick(c.slug)}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-600 hover:text-[#0057B8] hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
                >
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  {c.label}
                </button>
              ))}
              <button
                onClick={() => handleMobileNav('about')}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-500 hover:text-[#0057B8] hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
              >
                <Globe className="h-3.5 w-3.5" />
                More Countries
              </button>
            </MobileAccordion>

            {/* Course Finder */}
            <button
              onClick={() => handleMobileNav('course-finder')}
              className="flex items-center w-full px-4 py-3.5 text-[14px] font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors min-h-[48px]"
            >
              <Search className="h-4 w-4 mr-2.5 text-gray-400" />
              Course Finder
            </button>

            {/* Services */}
            <button
              onClick={() => handleMobileNav('services')}
              className="flex items-center w-full px-4 py-3.5 text-[14px] font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors min-h-[48px]"
            >
              <Briefcase className="h-4 w-4 mr-2.5 text-gray-400" />
              Services
            </button>

            {/* Language Prep */}
            <MobileAccordion
              label="Language Prep"
              isExpanded={mobileExpanded === 'language'}
              onToggle={() => setMobileExpanded(mobileExpanded === 'language' ? null : 'language')}
            >
              {LANGUAGE_TESTS.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => handleMobileNav('info-center')}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-600 hover:text-[#0057B8] hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
                >
                  <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                  {t.label}
                </button>
              ))}
            </MobileAccordion>

            {/* Resources */}
            <MobileAccordion
              label="Resources"
              isExpanded={mobileExpanded === 'resources'}
              onToggle={() => setMobileExpanded(mobileExpanded === 'resources' ? null : 'resources')}
            >
              {RESOURCES.map((r) => (
                <button
                  key={r.page + r.label}
                  onClick={() => handleMobileNav(r.page)}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-600 hover:text-[#0057B8] hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
                >
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  {r.label}
                </button>
              ))}
            </MobileAccordion>

            {/* Portals */}
            <MobileAccordion
              label="Portals"
              isExpanded={mobileExpanded === 'portals'}
              onToggle={() => setMobileExpanded(mobileExpanded === 'portals' ? null : 'portals')}
            >
              <button
                onClick={() => handleMobileNav('student-dashboard')}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-600 hover:text-[#0057B8] hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
              >
                <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                Student Portal
              </button>
              <button
                onClick={() => handleMobileNav('about')}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-600 hover:text-[#0057B8] hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
              >
                <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                Partner Portal
              </button>
              <button
                onClick={() => handleMobileNav('about')}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-600 hover:text-[#0057B8] hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
              >
                <Users className="h-3.5 w-3.5 text-gray-400" />
                Employee Portal
              </button>
            </MobileAccordion>
          </nav>

          {/* Mobile Footer CTA */}
          <div className="px-4 pb-6 pt-4 border-t border-gray-100">
            <Button
              onClick={() => { onLeadOpen(); setMobileOpen(false); }}
              className="w-full h-12 rounded-xl font-semibold text-[14px]"
              style={{ backgroundColor: '#E8501A', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D04515')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E8501A')}
            >
              Book Free Consultation
            </Button>
            <div className="flex items-center justify-center gap-4 mt-4">
              <a
                href="tel:+8801700000000"
                className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-[#0057B8] transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[64px]" />
    </>
  );
}
