'use client';

/**
 * ALO Education — public header (every page BEFORE login).
 *
 * Brand specification implemented here:
 *   • Logo (ALO Education) + tagline "Your Dream – Our Commitment" (italic, orange)
 *   • Menu order: Destinations ▾ · Course Finder · Services · Language Prep ·
 *     Resources ▾ · Portal ▾ · AI SUPPORT ▾
 *   • CTA: "Request Counseling" (ALO Orange #F37021 button)
 *   • Education Blue #0066CC for navigation/links, #FFB347 accent, #000/#555
 *     neutral text — all values come from the design tokens in globals.css.
 *
 * The footer and this header are mounted once for the whole public site by
 * src/components/website/PublicLayoutWrapper.tsx (root layout), so a single
 * component covers every pre-login route. Authenticated portals render standalone — see public-chrome-policy.ts.
 *
 * Nothing here is invented: destinations, when unpublished in the CMS, come
 * from the countries table (`/api/website/homepage`) and fall back to the
 * curated static list below.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ChevronDown,
  GraduationCap,
  LayoutGrid,
  LogIn,
  MapPin,
  Menu,
  Phone,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EnglishExamButton } from '@/components/website/EnglishExamCta';
import LanguageToggle from '@/components/website/LanguageToggle';
import { useI18n } from '@/i18n';
import { mergePublicDestinations } from '@/lib/public-navigation-policy';
import { ALO_CONTACT, ALO_TAGLINE } from '@/lib/alo-site-info';
import { ALO_BRAND_ALT, ALO_BRAND_ASSETS } from '@/lib/brand/brand-assets';

/* ------------------------------------------------------------------ */
/*  CONTENT (defaults — Destinations is overridden by live data)       */
/* ------------------------------------------------------------------ */

const TAGLINE = ALO_TAGLINE;

const DEFAULT_DESTINATIONS = [
  { label: 'United Kingdom', href: '/destinations/uk' },
  { label: 'United States', href: '/destinations/usa' },
  { label: 'Canada', href: '/destinations/canada' },
  { label: 'Australia', href: '/destinations/australia' },
  { label: 'Ireland', href: '/destinations/ireland' },
  { label: 'New Zealand', href: '/destinations/new-zealand' },
  { label: 'Dubai / UAE', href: '/destinations/dubai' },
  { label: 'More Countries', href: '/destinations' },
];

const RESOURCE_ITEMS = [
  { label: 'Blogs', href: '/blog' },
  // "Articles" previously pointed at /resources/articles, which is not a
  // canonical resource category (the slug list has `blogs`) and had no route,
  // so the header produced a 404. /resources/blogs is the DB-driven listing.
  { label: 'Articles', href: '/resources/blogs' },
  { label: 'Scholarships by Country', href: '/scholarships' },
  { label: 'Visa Guides', href: '/visa' },
  { label: 'Success Stories', href: '/success-stories' },
  { label: 'Application Tips', href: '/application-process' },
  { label: 'Pre-Departure Guides', href: '/resources/pre-departure' },
  { label: 'Accommodation Support', href: '/resources/accommodation' },
  { label: 'Financial Planning', href: '/resources/financial-planning' },
  { label: 'FAQs', href: '/faqs' },
];

const PORTAL_ITEMS = [
  { label: 'Student Portal', href: '/student/login', icon: GraduationCap },
  { label: 'Partner Portal', href: '/partner/login', icon: LayoutGrid },
  { label: 'Employee Portal', href: '/employee/login', icon: LogIn },
];

// Planning tools. Each runs on deterministic rules over verified data; none of
// them promise an admission, award or visa outcome.
const AI_TOOL_ITEMS = [
  { label: 'AI Course Match', href: '/ai/course-match' },
  { label: 'AI Scholarship Match', href: '/ai/scholarship-match' },
  { label: 'AI Visa Coach', href: '/ai/visa-coach' },
  { label: 'AI SOP Helper', href: '/ai/sop-helper' },
  { label: 'AI CV Helper', href: '/ai/cv-helper' },
  { label: 'Eligibility Check', href: '/eligibility-check' },
];

/* ------------------------------------------------------------------ */
/*  SHARED STYLES                                                      */
/* ------------------------------------------------------------------ */

// Menu labels use the heading font (Montserrat bold) per the brand spec.
const MENU_ITEM_BASE =
  'flex items-center gap-1 whitespace-nowrap rounded-button px-2.5 py-2 font-heading text-[13px] font-bold tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alo-brand focus-visible:ring-offset-2';

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.12, ease: 'easeIn' } },
};

function isActiveRoute(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (pathname === href) return true;
  return href !== '/' && pathname.startsWith(`${href}/`);
}

/* ------------------------------------------------------------------ */
/*  DESKTOP DROPDOWN TRIGGER                                           */
/* ------------------------------------------------------------------ */

interface DropdownTriggerProps {
  label: string;
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  panelClassName?: string;
  children: React.ReactNode;
}

function DropdownTrigger({
  label,
  id,
  isOpen,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  panelClassName = 'left-0',
  children,
}: DropdownTriggerProps) {
  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        className={`${MENU_ITEM_BASE} ${
          isOpen ? 'bg-alo-brand-light text-alo-brand' : 'text-alo-body hover:bg-alo-brand-light hover:text-alo-brand'
        }`}
      >
        {label}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={isOpen ? 'text-alo-cta' : 'text-alo-text-muted'}
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute top-full pt-2 ${panelClassName}`}
            style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          >
            <div
              id={`${id}-panel`}
              role="menu"
              aria-label={label}
              className="overflow-hidden rounded-xl border border-alo-border bg-white p-2 shadow-xl"
            >
              {/* Accent hairline — brand accent #FFB347 */}
              <span className="mb-2 block h-[3px] w-10 rounded-full bg-alo-cta-accent" aria-hidden="true" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DESKTOP LINK / DROPDOWN ROW                                        */
/* ------------------------------------------------------------------ */

function DesktopLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = isActiveRoute(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${MENU_ITEM_BASE} ${
        active ? 'bg-alo-brand-light text-alo-brand' : 'text-alo-body hover:bg-alo-brand-light hover:text-alo-brand'
      }`}
    >
      {label}
    </Link>
  );
}

function DropdownLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-alo-text transition-colors hover:bg-alo-brand-light hover:text-alo-brand focus-visible:bg-alo-brand-light focus-visible:text-alo-brand focus-visible:outline-none"
    >
      {Icon && <Icon className="h-4 w-4 text-alo-brand" aria-hidden="true" />}
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  MOBILE (Sheet + Accordion)                                         */
/* ------------------------------------------------------------------ */

function MobileLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-heading text-[13px] font-bold text-alo-text transition-colors hover:bg-alo-brand-light hover:text-alo-brand"
    >
      {Icon && <Icon className="h-4 w-4 text-alo-brand" aria-hidden="true" />}
      {label}
    </Link>
  );
}

function MobileAccordionSection({
  value,
  label,
  children,
}: {
  value: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className="border-b-0">
      <AccordionTrigger className="min-h-[44px] rounded-lg px-3 py-2 font-heading text-[13px] font-bold text-alo-text hover:bg-alo-brand-light hover:text-alo-brand hover:no-underline">
        {label}
      </AccordionTrigger>
      <AccordionContent className="pb-1">
        <div className="flex flex-col gap-0.5 pl-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

/** Brand lock-up: logo + "ALO Education" wordmark + italic orange tagline. */
function BrandLockUp({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label={`ALO Education — ${TAGLINE}`}
      className="group flex shrink-0 items-center gap-2.5"
    >
      <img
        src={ALO_BRAND_ASSETS.logo}
        alt={ALO_BRAND_ALT.logo}
        className={compact ? 'h-8 w-auto' : 'h-10 w-auto'}
        width={compact ? 32 : 40}
        height={compact ? 32 : 40}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-heading font-extrabold tracking-tight text-alo-brand ${
            compact ? 'text-base' : 'text-[19px]'
          }`}
        >
          ALO Education
        </span>
        <span
          className={`mt-0.5 font-semibold italic text-alo-cta ${compact ? 'text-[11px]' : 'text-[11px]'}`}
        >
          {TAGLINE}
        </span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function PublicNavbar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [destinations, setDestinations] = useState(DEFAULT_DESTINATIONS);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  /* ── Destinations data ─────────────────────────────────────────── */
  // Priority: Curated CMS navigation → countries table → static fallback.
  useEffect(() => {
    let cancelled = false;
    let curated = false;

    fetch('/api/website/cms-content?type=navigation')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.success || !Array.isArray(j.items)) return;
        const cmsDests = j.items
          .filter((i: { section?: string; label?: string; data?: { href?: string } }) =>
            i.section === 'destinations' && i.label && i.data?.href
          )
          .map((i: { label: string; data: { href: string } }) => ({
            label: String(i.label),
            href: String(i.data.href),
          }));
        if (cmsDests.length > 0) {
          curated = true;
          setDestinations(mergePublicDestinations(DEFAULT_DESTINATIONS, cmsDests));
        }
      })
      .catch(() => {
        /* keep the existing list */
      });

    fetch('/api/website/homepage')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || curated) return; // curated CMS navigation wins
        const countries = data?.countries || data?.data?.countries || [];
        if (Array.isArray(countries) && countries.length > 0) {
          const active = countries.filter((c: { status?: string }) => !c.status || c.status === 'active');
          if (active.length > 0) {
            const first7 = active
              .slice(0, 7)
              .map((c: { name: string; slug: string }) => ({ label: c.name, href: `/destinations/${c.slug}` }));
            setDestinations(
              mergePublicDestinations(DEFAULT_DESTINATIONS, first7)
            );
          }
        }
      })
      .catch(() => {
        /* keep DEFAULT_DESTINATIONS — nothing is invented */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Dropdown behaviour: hover intent, click toggle, click-away, Esc ── */
  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(
    (key: string) => {
      clearHoverTimer();
      hoverTimer.current = setTimeout(() => setOpenDropdown(key), 90);
    },
    [clearHoverTimer]
  );

  const scheduleClose = useCallback(() => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenDropdown(null), 150);
  }, [clearHoverTimer]);

  const toggleDropdown = useCallback((key: string) => {
    clearHoverTimer();
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, [clearHoverTimer]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        clearHoverTimer();
        setOpenDropdown(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearHoverTimer();
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      clearHoverTimer();
    };
  }, [clearHoverTimer]);

  // Close every menu and pending hover on navigation.
  useEffect(() => {
    clearHoverTimer();
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname, clearHoverTimer]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const triggerProps = (key: string) => ({
    isOpen: openDropdown === key,
    onToggle: () => toggleDropdown(key),
    onMouseEnter: () => scheduleOpen(key),
    onMouseLeave: scheduleClose,
  });

  return (
    <motion.header
      ref={headerRef}
      id="alo-public-header"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-alo-border bg-white/95 backdrop-blur-md shadow-sm"
    >
      {/* ── Utility strip — contact details + language switch ───────── */}
      <div className="hidden w-full bg-alo-brand text-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <MapPin className="h-3.5 w-3.5 text-alo-cta-accent" aria-hidden="true" />
            <span className="hidden lg:inline">{ALO_CONTACT.addressShort}</span>
            <a
              href={ALO_CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:text-alo-cta-accent"
            >
              Maps
            </a>
            {ALO_CONTACT.hasContactPhone && (
              <>
                <span className="opacity-40" aria-hidden="true">|</span>
                <a href={ALO_CONTACT.mobileHref} className="flex items-center gap-1.5 font-semibold hover:text-alo-cta-accent">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Call: {ALO_CONTACT.mobileDisplay}
                </a>
              </>
            )}
          </div>
          <LanguageToggle compact onDark />
        </div>
      </div>

      {/* ── Main bar — logo + tagline, menu, CTA ────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
      >
        <BrandLockUp />

        {/* DESKTOP MENU — spec order */}
        <div className="hidden items-center gap-0.5 xl:flex">
          <DropdownTrigger label={t('nav.destinations')} id="header-destinations" {...triggerProps('destinations')}>
            <div className="flex max-h-[70vh] min-w-[230px] flex-col gap-0.5 overflow-y-auto">
              {destinations.map((d) => (
                <DropdownLink key={d.href + d.label} href={d.href} label={d.label} />
              ))}
            </div>
          </DropdownTrigger>

          <DesktopLink href="/course-finder" label={t('nav.courseFinder')} />
          <DesktopLink href="/services" label={t('nav.services')} />
          <DesktopLink href="/language-prep" label={t('nav.languagePrep')} />
          <DropdownTrigger label={t('nav.resources')} id="header-resources" {...triggerProps('resources')}>
            <div className="grid w-[440px] grid-cols-2 gap-x-4 gap-y-0.5">
              {RESOURCE_ITEMS.map((item) => (
                <DropdownLink key={item.href} href={item.href} label={item.label} />
              ))}
              <EnglishExamButton
                location="navbar"
                label={t('nav.englishTest')}
                role="menuitem"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-alo-text transition-colors hover:bg-alo-brand-light hover:text-alo-brand focus-visible:bg-alo-brand-light focus-visible:text-alo-brand focus-visible:outline-none"
              />
            </div>
          </DropdownTrigger>

          <DropdownTrigger
            label={t('nav.portal')}
            id="header-portal"
            panelClassName="right-0"
            {...triggerProps('portal')}
          >
            <div className="flex min-w-[220px] flex-col gap-0.5">
              {PORTAL_ITEMS.map((p) => (
                <DropdownLink key={p.href} href={p.href} label={p.label} icon={p.icon} />
              ))}
            </div>
          </DropdownTrigger>

          <DropdownTrigger
            label={t('nav.aiSupportTools')}
            id="header-ai-tools"
            panelClassName="right-0"
            {...triggerProps('ai-tools')}
          >
            <div className="flex w-[260px] flex-col gap-0.5">
              {AI_TOOL_ITEMS.map((item) => (
                <DropdownLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </DropdownTrigger>
        </div>

        {/* RIGHT — CTA + mobile trigger */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="lg"
            className="hidden shrink-0 bg-alo-cta px-5 font-heading text-[14px] font-bold text-black shadow-sm transition-all hover:bg-alo-cta-hover hover:shadow-md focus-visible:ring-alo-cta-accent xl:inline-flex"
          >
            <Link href="/book-consultation">{t('cta.bookConsultation')}</Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6 text-alo-text" />
              </Button>
            </SheetTrigger>

            <AnimatePresence>
              {mobileOpen && (
                <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-alo-border bg-white px-4 py-3">
                    <BrandLockUp compact onClick={closeMobile} />
                    <Button variant="ghost" size="icon" onClick={closeMobile} aria-label="Close navigation menu">
                      <X className="h-5 w-5 text-alo-text" />
                    </Button>
                  </div>

                  <div className="flex flex-col gap-1 px-4 py-4">
                    <Accordion type="single" collapsible className="w-full">
                      <MobileAccordionSection value="destinations" label={t('nav.destinations')}>
                        {destinations.map((d) => (
                          <MobileLink key={d.href + d.label} href={d.href} label={d.label} onClick={closeMobile} />
                        ))}
                      </MobileAccordionSection>

                      <MobileLink href="/course-finder" label={t('nav.courseFinder')} onClick={closeMobile} />
                      <MobileLink href="/services" label={t('nav.services')} onClick={closeMobile} />
                      <MobileLink href="/language-prep" label={t('nav.languagePrep')} onClick={closeMobile} />
                      <MobileAccordionSection value="resources" label={t('nav.resources')}>
                        {RESOURCE_ITEMS.map((item) => (
                          <MobileLink key={item.href} href={item.href} label={item.label} onClick={closeMobile} />
                        ))}
                        <EnglishExamButton
                          location="mobile_navbar"
                          label={t('nav.englishTest')}
                          onNavigate={closeMobile}
                          className="flex min-h-[44px] items-center rounded-lg px-3 py-2 font-heading text-[13px] font-bold text-alo-text transition-colors hover:bg-alo-brand-light hover:text-alo-brand"
                        />
                      </MobileAccordionSection>

                      <MobileAccordionSection value="portal" label={t('nav.portal')}>
                        {PORTAL_ITEMS.map((p) => (
                          <MobileLink
                            key={p.href}
                            href={p.href}
                            label={p.label}
                            icon={p.icon}
                            onClick={closeMobile}
                          />
                        ))}
                      </MobileAccordionSection>

                      <MobileAccordionSection value="ai-tools" label={t('nav.aiSupportTools')}>
                        {AI_TOOL_ITEMS.map((item) => (
                          <MobileLink key={item.href} href={item.href} label={item.label} onClick={closeMobile} />
                        ))}
                      </MobileAccordionSection>
                    </Accordion>

                    <div className="mt-3 space-y-3 border-t border-alo-border pt-4">
                      <LanguageToggle />
                      <Button
                        asChild
                        size="lg"
                        className="w-full bg-alo-cta font-heading text-[14px] font-bold text-black shadow-sm transition-all hover:bg-alo-cta-hover"
                      >
                        <Link href="/book-consultation" onClick={closeMobile}>
                          {t('cta.bookConsultation')}
                        </Link>
                      </Button>
                      {/* Contact details as text — chat / WhatsApp live in the corner widget. */}
                      <p className="text-xs leading-snug text-alo-text-muted">
                        Office: {ALO_CONTACT.addressShort} •{' '}
                        <a
                          href={ALO_CONTACT.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-alo-brand underline"
                        >
                          Maps
                        </a>{' '}
                        {ALO_CONTACT.hasWhatsApp && (
                          <>
                            •{' '}
                            <a href={ALO_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-alo-brand underline">
                              WhatsApp: {ALO_CONTACT.whatsappDisplay}
                            </a>
                          </>
                        )}
                      </p>
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
