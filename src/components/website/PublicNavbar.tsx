'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Menu,
  ChevronDown,
  GraduationCap,
  Globe,
  LayoutGrid,
  LogIn,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/* ------------------------------------------------------------------ */
/*  DATA (defaults – overridden by API when available)                 */
/* ------------------------------------------------------------------ */

const DEFAULT_DESTINATIONS = [
  { label: 'United Kingdom', href: '/destinations/uk' },
  { label: 'USA', href: '/destinations/usa' },
  { label: 'Canada', href: '/destinations/canada' },
  { label: 'Australia', href: '/destinations/australia' },
  { label: 'Ireland', href: '/destinations/ireland' },
  { label: 'New Zealand', href: '/destinations/new-zealand' },
  { label: 'Dubai / UAE', href: '/destinations/dubai' },
  { label: 'All Destinations', href: '/destinations' },
];

const studyItems = [
  { label: 'Course Finder', href: '/course-finder' },
  { label: 'Universities', href: '/universities' },
  { label: 'Compare Courses', href: '/compare' },
  { label: 'Scholarships', href: '/scholarships' },
];

const languagePrepItems = [
  { label: 'IELTS Academic', href: '/english-tests/ielts' },
  { label: 'IELTS UKVI', href: '/english-tests/ielts-ukvi' },
  { label: 'PTE Academic', href: '/english-tests/pte' },
  { label: 'TOEFL iBT', href: '/english-tests/toefl' },
  { label: 'Duolingo English Test', href: '/english-tests/duolingo' },
  { label: 'OET (Healthcare)', href: '/english-tests/oet' },
  { label: 'LanguageCert', href: '/english-tests/languagecert' },
  { label: 'OIETC / ELLT', href: '/english-tests/oietc' },
  { label: 'English Test Comparison', href: '/language-prep/comparison' },
];

const serviceItems = [
  { label: 'Application Assistance', href: '/services' },
  { label: 'Visa Guidance', href: '/visa-support' },
  { label: 'Scholarship Guidance', href: '/services' },
  { label: 'Career Guidance', href: '/services' },
  { label: 'Consultation', href: '/book-consultation' },
];

const resourceItems = [
  { label: 'Study Guides', href: '/resources' },
  { label: 'Student Life', href: '/resources' },
  { label: 'Blog / Resources', href: '/blog' },
  { label: 'FAQs', href: '/faqs' },
];

const portalItems = [
  { label: 'Student Portal', href: '/student/login', icon: GraduationCap },
  { label: 'Partner Portal', href: '/partner/login', icon: LayoutGrid },
  { label: 'Employee Portal', href: '/employee/login', icon: LogIn },
];

/* ------------------------------------------------------------------ */
/*  DROPDOWN ANIMATION VARIANTS                                         */
/* ------------------------------------------------------------------ */

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15, ease: 'easeIn' } },
};

/* ------------------------------------------------------------------ */
/*  MOBILE LINK                                                        */
/* ------------------------------------------------------------------ */

function MobileLink({ href, label, icon: Icon, onClick }: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#000000] hover:bg-slate-50 transition-colors"
    >
      {Icon && <Icon className="h-4 w-4 text-[#0057B8]" />}
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  DESKTOP DROPDOWN TRIGGER                                            */
/* ------------------------------------------------------------------ */

interface DropdownTriggerProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
  className?: string;
}

function DropdownTrigger({ label, isOpen, onToggle, onMouseEnter, onMouseLeave, children, className = '' }: DropdownTriggerProps) {
  return (
    <div className={`relative ${className}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#000000] rounded-lg hover:bg-slate-50 transition-colors"
      >
        {label}
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-0 top-full pt-2"
            style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          >
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl p-3 min-w-[220px]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isOpen && <div className="absolute left-0 top-full h-2 w-full" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DESKTOP DROPDOWN LINK ROW                                           */
/* ------------------------------------------------------------------ */

function DropdownLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-[#000000] hover:bg-slate-50 transition-colors">
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function PublicNavbar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [destinations, setDestinations] = useState(DEFAULT_DESTINATIONS);

  // Load destinations from API (unique countries from universities)
  useEffect(() => {
    fetch('/api/universities?limit=200')
      .then(r => r.json())
      .then(data => {
        if (data.universities?.length) {
          const countryMap = new Map<string, number>();
          data.universities.forEach((u: { country: string }) => {
            if (u.country) {
              const key = u.country.trim();
              if (!countryMap.has(key)) countryMap.set(key, 1);
            }
          });
          if (countryMap.size > 0) {
            const apiDests = Array.from(countryMap.keys()).sort().map(country => ({
              label: country,
              href: `/destinations/${country.toLowerCase().replace(/\s+/g, '-')}`,
            }));
            setDestinations(apiDests);
          }
        }
      })
      .catch(() => { /* keep DEFAULT_DESTINATIONS */ });
  }, []);

  const closeMobile = () => setMobileOpen(false);
  const handleDesktopEnter = (key: string) => setOpenDropdown(key);
  const handleDesktopLeave = () => setOpenDropdown(null);
  const handleToggle = (key: string) => setOpenDropdown((prev) => (prev === key ? null : key));

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm"
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div whileHover={{ scale: 1.08 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <img src="/images/landing/Copy of logo.webp" alt="ALO Education" className="h-9 w-auto" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#0057B8] leading-tight">ALO Education</span>
            <span className="text-[11px] italic text-[#E8501A] font-medium -mt-0.5" style={{ fontFamily: 'Open Sans, sans-serif' }}>Your Dream – Our Commitment</span>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden lg:flex items-center gap-1">
          <DropdownTrigger
            label="Study Destinations"
            isOpen={openDropdown === 'destinations'}
            onToggle={() => handleToggle('destinations')}
            onMouseEnter={() => handleDesktopEnter('destinations')}
            onMouseLeave={handleDesktopLeave}
          >
            <div className="flex flex-col gap-1">
              {destinations.map((d) => (
                <DropdownLink key={d.href} href={d.href} label={d.label} />
              ))}
            </div>
          </DropdownTrigger>

          <DropdownTrigger
            label="Study"
            isOpen={openDropdown === 'study'}
            onToggle={() => handleToggle('study')}
            onMouseEnter={() => handleDesktopEnter('study')}
            onMouseLeave={handleDesktopLeave}
          >
            <div className="flex flex-col gap-1">
              {studyItems.map((item) => (
                <DropdownLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </DropdownTrigger>

          <DropdownTrigger
            label="English Tests"
            isOpen={openDropdown === 'language-prep'}
            onToggle={() => handleToggle('language-prep')}
            onMouseEnter={() => handleDesktopEnter('language-prep')}
            onMouseLeave={handleDesktopLeave}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-[460px]">
              {languagePrepItems.map((item) => (
                <DropdownLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </DropdownTrigger>

          <DropdownTrigger
            label="Services"
            isOpen={openDropdown === 'services'}
            onToggle={() => handleToggle('services')}
            onMouseEnter={() => handleDesktopEnter('services')}
            onMouseLeave={handleDesktopLeave}
          >
            <div className="flex flex-col gap-1">
              {serviceItems.map((item) => (
                <DropdownLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </DropdownTrigger>

          <DropdownTrigger
            label="Resources"
            isOpen={openDropdown === 'resources'}
            onToggle={() => handleToggle('resources')}
            onMouseEnter={() => handleDesktopEnter('resources')}
            onMouseLeave={handleDesktopLeave}
          >
            <div className="flex flex-col gap-1">
              {resourceItems.map((item) => (
                <DropdownLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </DropdownTrigger>

          <DropdownTrigger
            label="Portals"
            isOpen={openDropdown === 'portals'}
            onToggle={() => handleToggle('portals')}
            onMouseEnter={() => handleDesktopEnter('portals')}
            onMouseLeave={handleDesktopLeave}
          >
            <div className="flex flex-col gap-1 min-w-[200px]">
              {portalItems.map((p) => {
                const Icon = p.icon;
                return (
                  <Link key={p.href} href={p.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-slate-50 transition-colors">
                    <Icon className="h-4 w-4 text-[#0057B8]" />
                    {p.label}
                  </Link>
                );
              })}
            </div>
          </DropdownTrigger>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          <Link href="/book-consultation" className="hidden lg:block">
            <Button className="bg-[#E8501A] text-white h-12 rounded-xl px-5 font-semibold shadow-sm hover:shadow-md hover:brightness-110 transition-all">
              Book Free Consultation
            </Button>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu className="h-6 w-6 text-[#0F172A]" />
              </Button>
            </SheetTrigger>

            <AnimatePresence>
              {mobileOpen && (
                <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-3">
                    <Link href="/" onClick={closeMobile} className="flex items-center gap-2">
                      <img src="/images/landing/Copy of logo.webp" alt="ALO Education" className="h-7 w-auto" />
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-[#0057B8] leading-tight">ALO Education</span>
                        <span className="text-[10px] italic text-[#E8501A] font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>Your Dream – Our Commitment</span>
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={closeMobile} aria-label="Close navigation menu">
                      <X className="h-5 w-5 text-[#0F172A]" />
                    </Button>
                  </div>

                  <div className="px-4 py-4 flex flex-col gap-2">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="destinations" className="border-b-0">
                        <AccordionTrigger className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#000000] hover:bg-slate-50 rounded-lg hover:no-underline">
                          Study Destinations
                        </AccordionTrigger>
                        <AccordionContent className="pb-1">
                          <div className="flex flex-col gap-0.5 pl-4">
                            {destinations.map((d) => (
                              <MobileLink key={d.href} href={d.href} label={d.label} onClick={closeMobile} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="study" className="border-b-0">
                        <AccordionTrigger className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#000000] hover:bg-slate-50 rounded-lg hover:no-underline">
                          Study
                        </AccordionTrigger>
                        <AccordionContent className="pb-1">
                          <div className="flex flex-col gap-0.5 pl-4">
                            {studyItems.map((item) => (
                              <MobileLink key={item.href} href={item.href} label={item.label} onClick={closeMobile} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="language-prep" className="border-b-0">
                        <AccordionTrigger className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#000000] hover:bg-slate-50 rounded-lg hover:no-underline">
                          English Tests
                        </AccordionTrigger>
                        <AccordionContent className="pb-1">
                          <div className="grid grid-cols-1 gap-0.5 pl-4">
                            {languagePrepItems.map((item) => (
                              <MobileLink key={item.href} href={item.href} label={item.label} onClick={closeMobile} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="services" className="border-b-0">
                        <AccordionTrigger className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#000000] hover:bg-slate-50 rounded-lg hover:no-underline">
                          Services
                        </AccordionTrigger>
                        <AccordionContent className="pb-1">
                          <div className="flex flex-col gap-0.5 pl-4">
                            {serviceItems.map((item) => (
                              <MobileLink key={item.href} href={item.href} label={item.label} onClick={closeMobile} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="resources" className="border-b-0">
                        <AccordionTrigger className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#000000] hover:bg-slate-50 rounded-lg hover:no-underline">
                          Resources
                        </AccordionTrigger>
                        <AccordionContent className="pb-1">
                          <div className="flex flex-col gap-0.5 pl-4">
                            {resourceItems.map((item) => (
                              <MobileLink key={item.href} href={item.href} label={item.label} onClick={closeMobile} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="portals" className="border-b-0">
                        <AccordionTrigger className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#000000] hover:bg-slate-50 rounded-lg hover:no-underline">
                          Portals
                        </AccordionTrigger>
                        <AccordionContent className="pb-1">
                          <div className="flex flex-col gap-0.5 pl-4">
                            {portalItems.map((p) => (
                              <MobileLink key={p.href} href={p.href} label={p.label} icon={p.icon} onClick={closeMobile} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                      <Link href="/book-consultation" onClick={closeMobile} className="block">
                        <Button className="w-full bg-[#E8501A] text-white h-12 rounded-xl font-semibold shadow-sm hover:shadow-md hover:brightness-110 transition-all">
                          Book Free Consultation
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              )}
            </AnimatePresence>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
