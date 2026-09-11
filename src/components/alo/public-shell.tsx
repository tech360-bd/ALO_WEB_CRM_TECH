"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Icon } from "./shared";
import { type ViewKey } from "@/lib/alo-types";
import { useToast } from "@/hooks/use-toast";

interface PublicShellProps {
  view: ViewKey;
  onNavigate: (v: ViewKey, slug?: string) => void;
  children: React.ReactNode;
}

/* ─── Brand Colors (per spec) ─── */
const BLUE = "#0057B8";
const ORANGE = "#E8501A";
const BORDER = "#E2E8F0";
const TEXT = "#0F172A";
const SOFT_BG = "#F8FAFC";

/* ─── Countries ─── */
interface CountryLite { slug: string; name: string; shortName?: string | null; flag?: string | null; }

const MAIN_COUNTRIES = [
  { slug: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { slug: "usa", name: "USA", flag: "🇺🇸" },
  { slug: "canada", name: "Canada", flag: "🇨🇦" },
  { slug: "australia", name: "Australia", flag: "🇦🇺" },
  { slug: "ireland", name: "Ireland", flag: "🇮🇪" },
  { slug: "new-zealand", name: "New Zealand", flag: "🇳🇿" },
  { slug: "dubai", name: "Dubai / UAE", flag: "🇦🇪" },
];

const MORE_COUNTRIES = [
  { slug: "germany", name: "Germany", flag: "🇩🇪" },
  { slug: "malaysia", name: "Malaysia", flag: "🇲🇾" },
  { slug: "denmark", name: "Denmark", flag: "🇩🇰" },
  { slug: "japan", name: "Japan", flag: "🇯🇵" },
  { slug: "south-korea", name: "South Korea", flag: "🇰🇷" },
  { slug: "europe", name: "Europe (Schengen)", flag: "🇪🇺" },
];

/* ─── Language Prep ─── */
const LANGUAGE_PREP = [
  { label: "IELTS", slug: "ielts" },
  { label: "IELTS UKVI", slug: "ielts-ukvi" },
  { label: "PTE Academic", slug: "pte" },
  { label: "TOEFL iBT", slug: "toefl" },
  { label: "Duolingo English Test", slug: "duolingo" },
  { label: "OIETC / ELLT", slug: "ellt" },
  { label: "Oxford ELLT", slug: "oxford-ellt" },
  { label: "LanguageCert", slug: "languagecert" },
  { label: "Kaplan", slug: "kaplan" },
  { label: "OET", slug: "oet" },
  { label: "MOI Guidance", slug: "moi" },
  { label: "English Test Comparison", slug: "english-test-comparison" },
];

/* ─── Resources ─── */
const RESOURCES = [
  { label: "Blogs", icon: "Newspaper", view: "public-blog" as ViewKey, slug: undefined as string | undefined },
  { label: "Articles", icon: "FileText", view: "public-resources" as ViewKey, slug: undefined as string | undefined },
  { label: "Scholarships", icon: "Award", view: "scholarship-finder" as ViewKey, slug: undefined as string | undefined },
  { label: "Visa Guides", icon: "Plane", view: "public-visa-support" as ViewKey, slug: undefined as string | undefined },
  { label: "Success Stories", icon: "Sparkles", view: "public-success-stories" as ViewKey, slug: undefined as string | undefined },
  { label: "Application Tips", icon: "Lightbulb", view: "public-application-process" as ViewKey, slug: undefined as string | undefined },
  { label: "Pre-Departure", icon: "Luggage", view: "public-services" as ViewKey, slug: "pre-departure-orientation" as string | undefined },
  { label: "FAQs", icon: "HelpCircle", view: "public-faq" as ViewKey, slug: undefined as string | undefined },
];

/* ─── Portals ─── */
const PORTALS = [
  { label: "Student Portal", icon: "GraduationCap", action: "student" as const },
  { label: "Partner Portal", icon: "Handshake", action: "partner" as const },
  { label: "Employee Portal", icon: "Briefcase", action: "employee" as const },
];

/* ─── Footer columns ─── */
const FOOTER_DESTINATIONS = [
  { label: "United Kingdom", slug: "uk" },
  { label: "USA", slug: "usa" },
  { label: "Canada", slug: "canada" },
  { label: "Australia", slug: "australia" },
  { label: "Ireland", slug: "ireland" },
  { label: "New Zealand", slug: "new-zealand" },
  { label: "Germany", slug: "germany" },
  { label: "Dubai / UAE", slug: "dubai" },
  { label: "Malaysia", slug: "malaysia" },
  { label: "Denmark", slug: "denmark" },
  { label: "Japan", slug: "japan" },
  { label: "South Korea", slug: "south-korea" },
  { label: "Europe", slug: "europe" },
];

const FOOTER_QUICK_LINKS = [
  { label: "Course Finder", view: "public-course-finder" as ViewKey },
  { label: "Services", view: "public-services" as ViewKey },
  { label: "Language Prep", view: "public-exams" as ViewKey },
  { label: "Resources", view: "public-resources" as ViewKey },
  { label: "Scholarships", view: "scholarship-finder" as ViewKey },
];

const FOOTER_COMPANY = [
  { label: "About Us", view: "public-about" as ViewKey },
  { label: "Success Stories", view: "public-success-stories" as ViewKey },
  { label: "Events & Webinars", view: "public-events" as ViewKey },
  { label: "Blog", view: "public-blog" as ViewKey },
  { label: "News", view: "public-news" as ViewKey },
  { label: "FAQ", view: "public-faq" as ViewKey },
  { label: "Contact Us", view: "public-contact" as ViewKey },
];

const FOOTER_LEGAL = [
  { label: "Terms of Service", view: "public-terms" as ViewKey },
  { label: "Privacy Policy", view: "public-privacy" as ViewKey },
  { label: "Cookie Policy", view: "public-cookie" as ViewKey },
];

/* ─── Logo ─── */
function Logo({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  return (
    <button
      onClick={() => onNavigate("public-home")}
      className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
      aria-label="ALO Education — Home"
    >
      <div className="flex size-10 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #3B82F6 100%)` }}>
        <span className="text-lg font-black tracking-tight">A</span>
      </div>
      <div className="leading-tight text-left">
        <p className="text-base font-black" style={{ color: BLUE }}>ALO Education</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Study Abroad OS</p>
      </div>
    </button>
  );
}

/* ─── Dropdown helpers ─── */
function DropdownHeader({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</p>;
}
function DropdownLink({ label, icon, flag, onClick }: { label: string; icon?: string; flag?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
      style={{ color: TEXT }}
    >
      {flag ? <span className="text-base">{flag}</span> : icon ? <Icon name={icon} className="size-4 text-[#0057B8]" /> : null}
      <span>{label}</span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC SHELL
   ════════════════════════════════════════════════════════════════ */
export function PublicShell({ view, onNavigate, children }: PublicShellProps) {
  const { toast } = useToast();
  const navRef = React.useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [countries, setCountries] = React.useState<CountryLite[]>([]);

  // Fetch countries
  React.useEffect(() => {
    fetch("/api/countries")
      .then((r) => r.json())
      .then((data) => setCountries(data.countries || []))
      .catch(() => {});
  }, []);

  const allCountries: CountryLite[] = countries.length > 0 ? countries : [...MAIN_COUNTRIES, ...MORE_COUNTRIES].map((c) => ({ slug: c.slug, name: c.name, flag: c.flag }));
  const mainCountries = MAIN_COUNTRIES.map((mc) => { const c = allCountries.find((x) => x.slug === mc.slug); return { slug: mc.slug, name: c?.name ?? mc.name, flag: c?.flag ?? mc.flag }; });
  const moreCountries = MORE_COUNTRIES.map((mc) => { const c = allCountries.find((x) => x.slug === mc.slug); return { slug: mc.slug, name: c?.name ?? mc.name, flag: c?.flag ?? mc.flag }; });

  const closeMenu = React.useCallback(() => setOpenDropdown(null), []);
  const openMenu = (name: string) => setOpenDropdown(name);

  const goCountry = (slug: string) => { onNavigate("public-country", slug); setOpenDropdown(null); };
  const goCourseFinder = () => { onNavigate("public-course-finder"); setOpenDropdown(null); };
  const goServices = () => { onNavigate("public-services"); setOpenDropdown(null); };
  const goConsultation = () => { onNavigate("public-contact"); };
  const goExam = (slug: string) => { onNavigate("public-exam", slug); setOpenDropdown(null); };
  const goPortal = (action: string) => { onNavigate("auth-login"); setOpenDropdown(null); };
  const goResource = (res: typeof RESOURCES[0]) => { onNavigate(res.view, res.slug); setOpenDropdown(null); };

  const isDestinationsActive = view === "public-destinations" || view === "public-country";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ════════════════════════════════════════════════════════
          NAVBAR — single, clean, premium
          ════════════════════════════════════════════════════════ */}
      <header
        ref={navRef}
        className="sticky top-0 z-40 w-full border-b bg-white"
        style={{ borderColor: BORDER, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 lg:px-6">
          {/* ─── Logo ─── */}
          <Logo onNavigate={onNavigate} />

          {/* ─── Desktop nav ─── */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {/* 1. Destinations */}
            <div className="relative" onMouseEnter={() => openMenu("destinations")} onMouseLeave={closeMenu}>
              <button
                onClick={() => setOpenDropdown((p) => (p === "destinations" ? null : "destinations"))}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors", isDestinationsActive ? "bg-blue-50" : "hover:bg-slate-50")}
                style={{ color: isDestinationsActive ? BLUE : TEXT }}
              >
                <Icon name="Globe" className="size-4" />
                Destinations
                <Icon name="ChevronDown" className={cn("size-3.5 transition-transform", openDropdown === "destinations" && "rotate-180")} />
              </button>
              {openDropdown === "destinations" && (
                <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border-2 bg-white p-2 shadow-lg" style={{ borderColor: BORDER }}>
                  <DropdownHeader>Main Countries</DropdownHeader>
                  {mainCountries.map((c) => <DropdownLink key={c.slug} label={c.name} flag={c.flag} onClick={() => goCountry(c.slug)} />)}
                  <DropdownHeader>More Countries</DropdownHeader>
                  {moreCountries.map((c) => <DropdownLink key={c.slug} label={c.name} flag={c.flag} onClick={() => goCountry(c.slug)} />)}
                </div>
              )}
            </div>

            {/* 2. Course Finder */}
            <button onClick={goCourseFinder} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors", view === "public-course-finder" ? "bg-blue-50" : "hover:bg-slate-50")} style={{ color: view === "public-course-finder" ? BLUE : TEXT }}>
              <Icon name="Search" className="size-4" /> Course Finder
            </button>

            {/* 3. Services */}
            <button onClick={goServices} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors", view === "public-services" ? "bg-blue-50" : "hover:bg-slate-50")} style={{ color: view === "public-services" ? BLUE : TEXT }}>
              <Icon name="Briefcase" className="size-4" /> Services
            </button>

            {/* 4. Language Prep */}
            <div className="relative" onMouseEnter={() => openMenu("lang")} onMouseLeave={closeMenu}>
              <button onClick={() => setOpenDropdown((p) => (p === "lang" ? null : "lang"))} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50", view === "public-exams" || view === "public-exam" ? "bg-blue-50" : "")} style={{ color: view === "public-exams" || view === "public-exam" ? BLUE : TEXT }}>
                <Icon name="Languages" className="size-4" /> Language Prep
                <Icon name="ChevronDown" className={cn("size-3.5 transition-transform", openDropdown === "lang" && "rotate-180")} />
              </button>
              {openDropdown === "lang" && (
                <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border-2 bg-white p-2 shadow-lg" style={{ borderColor: BORDER }}>
                  <DropdownHeader>English Tests</DropdownHeader>
                  {LANGUAGE_PREP.map((t) => <DropdownLink key={t.slug} label={t.label} icon="BookOpen" onClick={() => goExam(t.slug!)} />)}
                </div>
              )}
            </div>

            {/* 5. Resources */}
            <div className="relative" onMouseEnter={() => openMenu("resources")} onMouseLeave={closeMenu}>
              <button onClick={() => setOpenDropdown((p) => (p === "resources" ? null : "resources"))} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50")} style={{ color: TEXT }}>
                <Icon name="BookOpen" className="size-4" /> Resources
                <Icon name="ChevronDown" className={cn("size-3.5 transition-transform", openDropdown === "resources" && "rotate-180")} />
              </button>
              {openDropdown === "resources" && (
                <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border-2 bg-white p-2 shadow-lg" style={{ borderColor: BORDER }}>
                  {RESOURCES.map((r) => <DropdownLink key={r.label} label={r.label} icon={r.icon} onClick={() => goResource(r)} />)}
                </div>
              )}
            </div>

            {/* 6. Portals */}
            <div className="relative" onMouseEnter={() => openMenu("portals")} onMouseLeave={closeMenu}>
              <button onClick={() => setOpenDropdown((p) => (p === "portals" ? null : "portals"))} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50")} style={{ color: TEXT }}>
                <Icon name="Users" className="size-4" /> Portals
                <Icon name="ChevronDown" className={cn("size-3.5 transition-transform", openDropdown === "portals" && "rotate-180")} />
              </button>
              {openDropdown === "portals" && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border-2 bg-white p-2 shadow-lg" style={{ borderColor: BORDER }}>
                  <DropdownHeader>Login Portals</DropdownHeader>
                  {PORTALS.map((p) => <DropdownLink key={p.label} label={p.label} icon={p.icon} onClick={() => goPortal(p.action)} />)}
                </div>
              )}
            </div>
          </nav>

          {/* ─── Right CTA ─── */}
          <div className="flex items-center gap-2">
            <Button
              onClick={goConsultation}
              className="hidden h-12 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-colors sm:inline-flex"
              style={{ backgroundColor: ORANGE }}
            >
              <Icon name="CalendarCheck" className="size-4" /> Book Free Consultation
            </Button>

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Icon name="Menu" className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-0">
                <SheetHeader className="border-b px-4 py-4" style={{ borderColor: BORDER }}>
                  <SheetTitle asChild><div><Logo onNavigate={onNavigate} /></div></SheetTitle>
                </SheetHeader>
                <div className="px-3 py-3">
                  <Accordion type="multiple" className="w-full">
                    {/* Destinations */}
                    <AccordionItem value="destinations" className="border-b" style={{ borderColor: BORDER }}>
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:bg-slate-50 hover:no-underline" style={{ color: TEXT }}>
                        <span className="flex items-center gap-2"><Icon name="Globe" className="size-4 text-[#0057B8]" /> Destinations</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        {[...mainCountries, ...moreCountries].map((c) => (
                          <button key={c.slug} onClick={() => { goCountry(c.slug); setMobileOpen(false); }} className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50" style={{ color: TEXT }}>
                            <span className="text-base">{c.flag}</span> {c.name}
                          </button>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    {/* Course Finder */}
                    <AccordionItem value="cf" className="border-b" style={{ borderColor: BORDER }}>
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:bg-slate-50 hover:no-underline" style={{ color: TEXT }}>
                        <span className="flex items-center gap-2"><Icon name="Search" className="size-4 text-[#0057B8]" /> Course Finder</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <button onClick={() => { goCourseFinder(); setMobileOpen(false); }} className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50" style={{ color: TEXT }}>
                          <Icon name="ArrowRight" className="size-4" /> Open Course Finder
                        </button>
                      </AccordionContent>
                    </AccordionItem>
                    {/* Services */}
                    <AccordionItem value="svc" className="border-b" style={{ borderColor: BORDER }}>
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:bg-slate-50 hover:no-underline" style={{ color: TEXT }}>
                        <span className="flex items-center gap-2"><Icon name="Briefcase" className="size-4 text-[#0057B8]" /> Services</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <button onClick={() => { goServices(); setMobileOpen(false); }} className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50" style={{ color: TEXT }}>
                          <Icon name="ArrowRight" className="size-4" /> All Services
                        </button>
                      </AccordionContent>
                    </AccordionItem>
                    {/* Language Prep */}
                    <AccordionItem value="lang" className="border-b" style={{ borderColor: BORDER }}>
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:bg-slate-50 hover:no-underline" style={{ color: TEXT }}>
                        <span className="flex items-center gap-2"><Icon name="Languages" className="size-4 text-[#0057B8]" /> Language Prep</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        {LANGUAGE_PREP.map((t) => (
                          <button key={t.slug} onClick={() => { goExam(t.slug!); setMobileOpen(false); }} className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50" style={{ color: TEXT }}>
                            <Icon name="BookOpen" className="size-4" /> {t.label}
                          </button>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    {/* Resources */}
                    <AccordionItem value="res" className="border-b" style={{ borderColor: BORDER }}>
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:bg-slate-50 hover:no-underline" style={{ color: TEXT }}>
                        <span className="flex items-center gap-2"><Icon name="BookOpen" className="size-4 text-[#0057B8]" /> Resources</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        {RESOURCES.map((r) => (
                          <button key={r.label} onClick={() => { goResource(r); setMobileOpen(false); }} className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50" style={{ color: TEXT }}>
                            <Icon name={r.icon} className="size-4" /> {r.label}
                          </button>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    {/* Portals */}
                    <AccordionItem value="portals" className="border-b" style={{ borderColor: BORDER }}>
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:bg-slate-50 hover:no-underline" style={{ color: TEXT }}>
                        <span className="flex items-center gap-2"><Icon name="Users" className="size-4 text-[#0057B8]" /> Portals</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        {PORTALS.map((p) => (
                          <button key={p.label} onClick={() => { goPortal(p.action); setMobileOpen(false); }} className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50" style={{ color: TEXT }}>
                            <Icon name={p.icon} className="size-4" /> {p.label}
                          </button>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Full-width CTA */}
                  <div className="mt-4 px-1">
                    <Button onClick={() => { goConsultation(); setMobileOpen(false); }} className="h-12 w-full rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: ORANGE }}>
                      <Icon name="CalendarCheck" className="size-4" /> Book Free Consultation
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT
          ════════════════════════════════════════════════════════ */}
      <main className="min-w-0 flex-1">{children}</main>

      {/* ════════════════════════════════════════════════════════
          FOOTER — premium, 9 columns + animation strip + bottom bar
          ════════════════════════════════════════════════════════ */}
      <footer className="mt-auto border-t" style={{ borderColor: BORDER, backgroundColor: SOFT_BG }}>
        {/* Main footer grid */}
        <div className="mx-auto w-full max-w-[1280px] px-4 py-12 lg:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
            {/* Col 1: ALO Education */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #3B82F6 100%)` }}>
                  <span className="text-base font-black">A</span>
                </div>
                <p className="font-black" style={{ color: BLUE }}>ALO Education</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">From your ambition to admission, we're with you all the way.</p>
              {/* Social icons */}
              <div className="mt-4 flex gap-2">
                <a href="https://www.facebook.com/aloeducation" target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-lg border bg-white transition-colors hover:bg-blue-50" style={{ borderColor: BORDER, color: BLUE }}>
                  <Icon name="Facebook" className="size-4" />
                </a>
                <a href="https://www.instagram.com/aloeducation" target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-lg border bg-white transition-colors hover:bg-blue-50" style={{ borderColor: BORDER, color: BLUE }}>
                  <Icon name="Instagram" className="size-4" />
                </a>
                <a href="https://www.linkedin.com/company/aloeducation" target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-lg border bg-white transition-colors hover:bg-blue-50" style={{ borderColor: BORDER, color: BLUE }}>
                  <Icon name="Linkedin" className="size-4" />
                </a>
                <a href="https://www.youtube.com/@aloeducation" target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-lg border bg-white transition-colors hover:bg-blue-50" style={{ borderColor: BORDER, color: BLUE }}>
                  <Icon name="Youtube" className="size-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Destinations */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: BLUE }}>Destinations</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {FOOTER_DESTINATIONS.map((d) => (
                  <li key={d.slug}><button onClick={() => onNavigate("public-country", d.slug)} className="hover:text-[#0057B8]">{d.label}</button></li>
                ))}
              </ul>
            </div>

            {/* Col 3: Quick Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: BLUE }}>Quick Links</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {FOOTER_QUICK_LINKS.map((q) => (
                  <li key={q.label}><button onClick={() => onNavigate(q.view)} className="hover:text-[#0057B8]">{q.label}</button></li>
                ))}
              </ul>
            </div>

            {/* Col 4: Company */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: BLUE }}>Company</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {FOOTER_COMPANY.map((c) => (
                  <li key={c.label}><button onClick={() => onNavigate(c.view)} className="hover:text-[#0057B8]">{c.label}</button></li>
                ))}
              </ul>
            </div>

            {/* Col 5: Legal + Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: BLUE }}>Legal</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {FOOTER_LEGAL.map((l) => (
                  <li key={l.label}><button onClick={() => onNavigate(l.view)} className="hover:text-[#0057B8]">{l.label}</button></li>
                ))}
              </ul>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider" style={{ color: BLUE }}>Contact</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="tel:01805020101" className="hover:text-[#0057B8]">📞 01805020101</a></li>
                <li><a href="https://wa.me/8801805020100" target="_blank" rel="noopener noreferrer" className="hover:text-[#0057B8]">💬 WhatsApp</a></li>
                <li><a href="mailto:info@aloeducation.com" className="hover:text-[#0057B8]">✉️ Email</a></li>
                <li><button onClick={() => onNavigate("public-contact")} className="hover:text-[#0057B8]">📍 Office</button></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Animation strip — graduation caps */}
        <div className="relative h-12 overflow-hidden border-t bg-white" style={{ borderColor: BORDER }}>
          {/* Layer 1 — Orange, slow, opacity 40% */}
          <div className="pointer-events-none absolute inset-0 flex items-center">
            {[0, 200, 400, 600, 800, 1000, 1200].map((left, i) => (
              <span key={`l1-${i}`} className={`cap-layer-1 cap-delay-${(i % 8) + 1} absolute`} style={{ left: `${left}px`, fontSize: "18px", opacity: 0.4, color: ORANGE }}>
                <Icon name="GraduationCap" className="size-4" />
              </span>
            ))}
          </div>
          {/* Layer 2 — Blue, medium, opacity 70% */}
          <div className="pointer-events-none absolute inset-0 flex items-center">
            {[100, 350, 550, 750, 950, 1150].map((left, i) => (
              <span key={`l2-${i}`} className={`cap-layer-2 cap-delay-${(i % 8) + 1} absolute`} style={{ left: `${left}px`, fontSize: "16px", opacity: 0.7, color: BLUE }}>
                <Icon name="GraduationCap" className="size-4" />
              </span>
            ))}
          </div>
          {/* Layer 3 — Gray, faster, opacity 100% */}
          <div className="pointer-events-none absolute inset-0 flex items-center">
            {[50, 280, 500, 720, 900, 1100, 1300].map((left, i) => (
              <span key={`l3-${i}`} className={`cap-layer-3 cap-delay-${(i % 8) + 1} absolute text-slate-400`} style={{ left: `${left}px`, fontSize: "14px", opacity: 1 }}>
                <Icon name="GraduationCap" className="size-3.5" />
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#f5f5f5]">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-slate-500 sm:flex-row lg:px-6">
            <p>© Copyright 2025 ALO Education. All Rights Reserved.</p>
            <button onClick={() => onNavigate("public-cookie")} className="hover:text-[#0057B8]">Cookie Policy</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
