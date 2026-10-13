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

/* ---------------------------------- Data ---------------------------------- */

interface CountryLite {
  slug: string;
  name: string;
  shortName?: string | null;
  flag?: string | null;
}

// Main countries shown first in the Destinations dropdown (in display order).
const MAIN_COUNTRY_SLUGS = [
  "uk",
  "usa",
  "canada",
  "australia",
  "ireland",
  "new-zealand",
  "dubai",
];

// Friendly label map for the main slugs (used if API doesn't return a country).
const MAIN_COUNTRY_LABELS: Record<string, string> = {
  uk: "United Kingdom",
  usa: "USA",
  canada: "Canada",
  australia: "Australia",
  ireland: "Ireland",
  "new-zealand": "New Zealand",
  dubai: "Dubai / UAE",
};

// Language Prep items — slug routes to /api/exam page (public-exam view), null = toast.
const LANGUAGE_PREP: { label: string; slug?: string; comingSoon?: boolean }[] = [
  { label: "IELTS", slug: "ielts" },
  { label: "IELTS UKVI", comingSoon: true },
  { label: "PTE Academic", slug: "pte" },
  { label: "TOEFL iBT", slug: "toefl" },
  { label: "Duolingo English Test", slug: "duolingo" },
  { label: "OIETC / ELLT", slug: "ellt" },
  { label: "Oxford ELLT", comingSoon: true },
  { label: "LanguageCert", comingSoon: true },
  { label: "Kaplan English Test", comingSoon: true },
  { label: "OET", comingSoon: true },
  { label: "GRE", slug: "gre" },
  { label: "GMAT", slug: "gmat" },
  { label: "SAT", slug: "sat" },
  { label: "ACT", slug: "act" },
  { label: "MOI Guidance", comingSoon: true },
  { label: "English Test Comparison", comingSoon: true },
  { label: "Free English Placement Test", slug: "placement-test" },
];

// Resources items — scholarship navigates, the rest toast "Coming soon".
const RESOURCES: { label: string; icon: string; action: "scholarship" | "comingSoon" | "faq" }[] = [
  { label: "Blogs", icon: "Newspaper", action: "comingSoon" },
  { label: "Articles", icon: "FileText", action: "comingSoon" },
  { label: "Scholarships by Country", icon: "Award", action: "scholarship" },
  { label: "Visa Guides", icon: "Plane", action: "comingSoon" },
  { label: "Success Stories", icon: "Sparkles", action: "comingSoon" },
  { label: "Application Tips", icon: "Lightbulb", action: "comingSoon" },
  { label: "Pre-Departure Guides", icon: "Luggage", action: "comingSoon" },
  { label: "Accommodation Support", icon: "Home", action: "comingSoon" },
  { label: "Financial Planning", icon: "Wallet", action: "comingSoon" },
  { label: "FAQs", icon: "HelpCircle", action: "faq" },
];

// Portals items.
const PORTALS: { label: string; icon: string; action: "student" | "partner" | "employee" }[] = [
  { label: "Student Portal", icon: "GraduationCap", action: "student" },
  { label: "Partner Portal", icon: "Handshake", action: "partner" },
  { label: "Employee Portal", icon: "Briefcase", action: "employee" },
];

/* --------------------------------- Logo ----------------------------------- */

function Logo({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  return (
    <button
      onClick={() => onNavigate("public-home")}
      className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
      aria-label="ALO Education — Home"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-alo-gradient text-white alo-shadow">
        <span className="text-lg font-black tracking-tight">A</span>
      </div>
      <div className="leading-tight text-left">
        <p className="text-base font-black text-[#0057B8]">ALO Education</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Study Abroad OS
        </p>
      </div>
    </button>
  );
}

/* --------------------------- Dropdown menu item --------------------------- */

function DropdownLink({
  label,
  icon,
  onClick,
  active = false,
  comingSoon = false,
}: {
  label: string;
  icon?: string;
  onClick: () => void;
  active?: boolean;
  comingSoon?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[#e8f0fb] text-[#0057B8]"
          : "text-[#0F172A] hover:bg-[#e8f0fb] hover:text-[#0057B8]"
      )}
    >
      {icon && <Icon name={icon} className="size-4 shrink-0" />}
      <span className="flex-1 text-left">{label}</span>
      {comingSoon && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Soon
        </span>
      )}
    </button>
  );
}

function DropdownHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

/* ============================== PublicShell ============================== */

export function PublicShell({ view, onNavigate, children }: PublicShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [countries, setCountries] = React.useState<CountryLite[]>([]);
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isActive = (v: ViewKey) => view === v || (v === "public-home" && view === "landing");

  /* Fetch countries for the Destinations dropdown */
  React.useEffect(() => {
    let mounted = true;
    fetch("/api/countries")
      .then((r) => (r.ok ? r.json() : { countries: [] }))
      .then((data) => {
        if (!mounted) return;
        const list: CountryLite[] = Array.isArray(data?.countries) ? data.countries : [];
        if (list.length > 0) setCountries(list);
      })
      .catch(() => {
        /* silently fall back to the static label map */
      });
    return () => {
      mounted = false;
    };
  }, []);

  /* Build destinations list, split into main + more */
  const mainCountries: CountryLite[] = React.useMemo(() => {
    return MAIN_COUNTRY_SLUGS.map((slug) => {
      const found = countries.find((c) => c.slug === slug);
      if (found) return found;
      return { slug, name: MAIN_COUNTRY_LABELS[slug] ?? slug.replace(/-/g, " ") };
    });
  }, [countries]);

  const moreCountries: CountryLite[] = React.useMemo(() => {
    const moreSlugs = ["germany", "denmark", "malaysia", "japan", "south-korea", "europe"];
    return moreSlugs
      .map((slug) => {
        const found = countries.find((c) => c.slug === slug);
        if (found) return found;
        return { slug, name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
      })
      .filter((c) => c.slug && c.name);
  }, [countries]);

  /* Click-away handler for desktop dropdowns */
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* Clear pending hover timer on unmount */
  React.useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  /* Hover handlers with 200ms delay */
  const openMenu = (key: string) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenDropdown(key), 120);
  };
  const closeMenu = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  /* Navigation helpers */
  const goCountry = (slug: string) => {
    setOpenDropdown(null);
    onNavigate("public-country", slug);
  };
  const goExam = (slug: string) => {
    setOpenDropdown(null);
    onNavigate("public-exam", slug);
  };
  const comingSoon = (label: string) => {
    setOpenDropdown(null);
    toast({ title: `${label}`, description: "Coming soon — stay tuned!" });
  };
  const goScholarship = () => {
    setOpenDropdown(null);
    onNavigate("scholarship-finder");
  };
  const goCourseFinder = () => {
    setOpenDropdown(null);
    onNavigate("public-course-finder");
  };
  const goServices = () => {
    setOpenDropdown(null);
    onNavigate("public-home");
    setTimeout(() => {
      document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
    toast({ title: "Our Services", description: "Scrolling to our service overview." });
  };
  const goConsultation = () => {
    setOpenDropdown(null);
    onNavigate("public-home");
    setTimeout(() => {
      document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
  };
  const goPortal = (action: "student" | "partner" | "employee") => {
    setOpenDropdown(null);
    if (action === "student") {
      toast({ title: "Student login", description: "Redirecting to student portal..." });
      onNavigate("student-dashboard");
    } else if (action === "partner") {
      onNavigate("partner-admin-dashboard");
    } else {
      toast({ title: "Employee login", description: "Please contact HR for credentials." });
    }
  };

  const isDestinationsActive =
    view === "public-destinations" || view === "public-country";
  const isLanguageActive = view === "public-exams" || view === "public-exam";
  const isCourseFinderActive = isActive("public-course-finder");

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header
        ref={navRef}
        className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white"
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 lg:px-6">
          <Logo onNavigate={onNavigate} />

          {/* ----------------------- Desktop menu ----------------------- */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {/* 1. Destinations dropdown */}
            <div
              className="relative"
              onMouseEnter={() => openMenu("destinations")}
              onMouseLeave={closeMenu}
            >
              <button
                onClick={() =>
                  setOpenDropdown((p) => (p === "destinations" ? null : "destinations"))
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isDestinationsActive
                    ? "bg-[#e8f0fb] text-[#0057B8]"
                    : "text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:text-[#0057B8]"
                )}
                aria-expanded={openDropdown === "destinations"}
              >
                <Icon name="Globe" className="size-4" />
                Destinations
                <Icon
                  name="ChevronDown"
                  className={cn(
                    "size-3.5 transition-transform",
                    openDropdown === "destinations" && "rotate-180"
                  )}
                />
              </button>
              {openDropdown === "destinations" && (
                <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border-2 border-[#E2E8F0] bg-white p-2 shadow-lg">
                  <DropdownHeader>Main Countries</DropdownHeader>
                  <div className="space-y-0.5">
                    {mainCountries.map((c) => (
                      <DropdownLink
                        key={c.slug}
                        label={c.name}
                        icon="MapPin"
                        onClick={() => goCountry(c.slug)}
                      />
                    ))}
                  </div>
                  <div className="my-1.5 border-t border-[#E2E8F0]" />
                  <DropdownHeader>More Countries</DropdownHeader>
                  <div className="space-y-0.5">
                    {moreCountries.map((c) => (
                      <DropdownLink
                        key={c.slug}
                        label={c.name}
                        icon="MapPin"
                        onClick={() => goCountry(c.slug)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Course Finder */}
            <button
              onClick={goCourseFinder}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isCourseFinderActive
                  ? "bg-[#e8f0fb] text-[#0057B8]"
                  : "text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:text-[#0057B8]"
              )}
            >
              <Icon name="Search" className="size-4" />
              Course Finder
            </button>

            {/* 3. Services */}
            <button
              onClick={goServices}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:text-[#0057B8]"
              )}
            >
              <Icon name="Briefcase" className="size-4" />
              Services
            </button>

            {/* 4. Language Prep dropdown (2-col grid) */}
            <div
              className="relative"
              onMouseEnter={() => openMenu("language")}
              onMouseLeave={closeMenu}
            >
              <button
                onClick={() => setOpenDropdown((p) => (p === "language" ? null : "language"))}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isLanguageActive
                    ? "bg-[#e8f0fb] text-[#0057B8]"
                    : "text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:text-[#0057B8]"
                )}
                aria-expanded={openDropdown === "language"}
              >
                <Icon name="Languages" className="size-4" />
                Language Prep
                <Icon
                  name="ChevronDown"
                  className={cn(
                    "size-3.5 transition-transform",
                    openDropdown === "language" && "rotate-180"
                  )}
                />
              </button>
              {openDropdown === "language" && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-[34rem] -translate-x-1/3 rounded-xl border-2 border-[#E2E8F0] bg-white p-2 shadow-lg">
                  <DropdownHeader>English Tests & Exam Prep</DropdownHeader>
                  <div className="grid grid-cols-2 gap-0.5">
                    {LANGUAGE_PREP.map((item) => (
                      <DropdownLink
                        key={item.label}
                        label={item.label}
                        icon="FileText"
                        comingSoon={item.comingSoon}
                        onClick={() =>
                          item.comingSoon
                            ? comingSoon(item.label)
                            : item.slug
                              ? goExam(item.slug)
                              : comingSoon(item.label)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Resources dropdown */}
            <div
              className="relative"
              onMouseEnter={() => openMenu("resources")}
              onMouseLeave={closeMenu}
            >
              <button
                onClick={() => setOpenDropdown((p) => (p === "resources" ? null : "resources"))}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:text-[#0057B8]"
                )}
                aria-expanded={openDropdown === "resources"}
              >
                <Icon name="BookOpen" className="size-4" />
                Resources
                <Icon
                  name="ChevronDown"
                  className={cn(
                    "size-3.5 transition-transform",
                    openDropdown === "resources" && "rotate-180"
                  )}
                />
              </button>
              {openDropdown === "resources" && (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border-2 border-[#E2E8F0] bg-white p-2 shadow-lg">
                  <DropdownHeader>Knowledge Hub</DropdownHeader>
                  <div className="space-y-0.5">
                    {RESOURCES.map((r) => (
                      <DropdownLink
                        key={r.label}
                        label={r.label}
                        icon={r.icon}
                        comingSoon={r.action === "comingSoon"}
                        onClick={() => {
                          if (r.action === "scholarship") goScholarship();
                          else if (r.action === "faq") {
                            setOpenDropdown(null);
                            toast({ title: "FAQs", description: "Coming soon — check back shortly." });
                          } else comingSoon(r.label);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Portals dropdown */}
            <div
              className="relative"
              onMouseEnter={() => openMenu("portals")}
              onMouseLeave={closeMenu}
            >
              <button
                onClick={() => setOpenDropdown((p) => (p === "portals" ? null : "portals"))}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:text-[#0057B8]"
                )}
                aria-expanded={openDropdown === "portals"}
              >
                <Icon name="LayoutGrid" className="size-4" />
                Portals
                <Icon
                  name="ChevronDown"
                  className={cn(
                    "size-3.5 transition-transform",
                    openDropdown === "portals" && "rotate-180"
                  )}
                />
              </button>
              {openDropdown === "portals" && (
                <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-xl border-2 border-[#E2E8F0] bg-white p-2 shadow-lg">
                  <DropdownHeader>Login Portals</DropdownHeader>
                  <div className="space-y-0.5">
                    {PORTALS.map((p) => (
                      <DropdownLink
                        key={p.label}
                        label={p.label}
                        icon={p.icon}
                        onClick={() => goPortal(p.action)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* ----------------------------- Right ----------------------------- */}
          <div className="flex items-center gap-2">
            <Button
              onClick={goConsultation}
              className="hidden h-12 rounded-xl bg-[#E8501A] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#c8451a] sm:inline-flex"
            >
              <Icon name="CalendarCheck" className="size-4" />
              Book Free Consultation
            </Button>

            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                >
                  <Icon name="Menu" className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-0">
                <SheetHeader className="border-b border-[#E2E8F0] px-4 py-4">
                  <SheetTitle asChild>
                    <div>
                      <Logo onNavigate={onNavigate} />
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="px-3 py-3">
                  <Accordion type="multiple" className="w-full">
                    {/* Destinations */}
                    <AccordionItem value="destinations" className="border-b border-[#E2E8F0]">
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Icon name="Globe" className="size-4 text-[#0057B8]" />
                          Destinations
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Main Countries
                        </p>
                        <div className="space-y-0.5">
                          {mainCountries.map((c) => (
                            <button
                              key={c.slug}
                              onClick={() => {
                                goCountry(c.slug);
                                setMobileOpen(false);
                              }}
                              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#e8f0fb] hover:text-[#0057B8]"
                            >
                              <Icon name="MapPin" className="size-4" />
                              {c.name}
                            </button>
                          ))}
                        </div>
                        <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          More Countries
                        </p>
                        <div className="space-y-0.5">
                          {moreCountries.map((c) => (
                            <button
                              key={c.slug}
                              onClick={() => {
                                goCountry(c.slug);
                                setMobileOpen(false);
                              }}
                              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#e8f0fb] hover:text-[#0057B8]"
                            >
                              <Icon name="MapPin" className="size-4" />
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Course Finder */}
                    <AccordionItem value="course-finder" className="border-b border-[#E2E8F0]">
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Icon name="Search" className="size-4 text-[#0057B8]" />
                          Course Finder
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <button
                          onClick={() => {
                            goCourseFinder();
                            setMobileOpen(false);
                          }}
                          className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#e8f0fb] hover:text-[#0057B8]"
                        >
                          <Icon name="ArrowRight" className="size-4" />
                          Open Course Finder
                        </button>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Services */}
                    <AccordionItem value="services" className="border-b border-[#E2E8F0]">
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Icon name="Briefcase" className="size-4 text-[#0057B8]" />
                          Services
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <button
                          onClick={() => {
                            goServices();
                            setMobileOpen(false);
                          }}
                          className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#e8f0fb] hover:text-[#0057B8]"
                        >
                          <Icon name="ArrowRight" className="size-4" />
                          View Our Services
                        </button>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Language Prep */}
                    <AccordionItem value="language" className="border-b border-[#E2E8F0]">
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Icon name="Languages" className="size-4 text-[#0057B8]" />
                          Language Prep
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="grid grid-cols-1 gap-0.5">
                          {LANGUAGE_PREP.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                if (item.comingSoon) comingSoon(item.label);
                                else if (item.slug) goExam(item.slug);
                                else comingSoon(item.label);
                                setMobileOpen(false);
                              }}
                              className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#e8f0fb] hover:text-[#0057B8]"
                            >
                              <span className="flex items-center gap-2">
                                <Icon name="FileText" className="size-4" />
                                {item.label}
                              </span>
                              {item.comingSoon && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                  Soon
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Resources */}
                    <AccordionItem value="resources" className="border-b border-[#E2E8F0]">
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Icon name="BookOpen" className="size-4 text-[#0057B8]" />
                          Resources
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="space-y-0.5">
                          {RESOURCES.map((r) => (
                            <button
                              key={r.label}
                              onClick={() => {
                                if (r.action === "scholarship") goScholarship();
                                else if (r.action === "faq") {
                                  toast({
                                    title: "FAQs",
                                    description: "Coming soon — check back shortly.",
                                  });
                                } else comingSoon(r.label);
                                setMobileOpen(false);
                              }}
                              className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#e8f0fb] hover:text-[#0057B8]"
                            >
                              <span className="flex items-center gap-2">
                                <Icon name={r.icon} className="size-4" />
                                {r.label}
                              </span>
                              {r.action === "comingSoon" && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                  Soon
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Portals */}
                    <AccordionItem value="portals" className="border-b border-[#E2E8F0]">
                      <AccordionTrigger className="px-3 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#e8f0fb]/60 hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Icon name="LayoutGrid" className="size-4 text-[#0057B8]" />
                          Portals
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="space-y-0.5">
                          {PORTALS.map((p) => (
                            <button
                              key={p.label}
                              onClick={() => {
                                goPortal(p.action);
                                setMobileOpen(false);
                              }}
                              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#e8f0fb] hover:text-[#0057B8]"
                            >
                              <Icon name={p.icon} className="size-4" />
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* CTA full-width */}
                  <div className="mt-4 px-1">
                    <Button
                      onClick={() => {
                        goConsultation();
                        setMobileOpen(false);
                      }}
                      className="h-12 w-full rounded-xl bg-[#E8501A] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#c8451a]"
                    >
                      <Icon name="CalendarCheck" className="size-4" />
                      Book Free Consultation
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1">{children}</main>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-[#0057B8]/10 bg-[#f7f9fc]">
        {/* SECTION 1 — Main footer content */}
        <div className="mx-auto w-full max-w-[1280px] px-4 py-10 lg:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-alo-gradient text-white">
                  <span className="text-base font-black">A</span>
                </div>
                <p className="font-black text-[#0057B8]">ALO Education</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                From your ambition to admission, we're with you all the way.
              </p>
              {/* Social icons */}
              <div className="mt-4 flex gap-2">
                {["Facebook", "Instagram", "Linkedin", "Youtube"].map((s) => (
                  <button
                    key={s}
                    onClick={() => toast({ title: `Opening ${s}...` })}
                    className="flex size-8 items-center justify-center rounded-lg border border-[#0057B8]/20 bg-white text-[#0057B8] transition-colors hover:bg-[#e8f0fb]"
                  >
                    <Icon name={s} className="size-4" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0057B8]">Destinations</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => onNavigate("public-country", "uk")} className="hover:text-[#0057B8]">United Kingdom</button></li>
                <li><button onClick={() => onNavigate("public-country", "usa")} className="hover:text-[#0057B8]">United States</button></li>
                <li><button onClick={() => onNavigate("public-country", "australia")} className="hover:text-[#0057B8]">Australia</button></li>
                <li><button onClick={() => onNavigate("public-country", "canada")} className="hover:text-[#0057B8]">Canada</button></li>
                <li><button onClick={() => onNavigate("public-country", "new-zealand")} className="hover:text-[#0057B8]">New Zealand</button></li>
                <li><button onClick={() => onNavigate("public-country", "europe")} className="hover:text-[#0057B8]">Europe</button></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0057B8]">Quick Links</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => onNavigate("public-course-finder")} className="hover:text-[#0057B8]">Course Finder</button></li>
                <li><button onClick={() => onNavigate("public-destinations")} className="hover:text-[#0057B8]">Services</button></li>
                <li><button onClick={() => onNavigate("public-exams")} className="hover:text-[#0057B8]">English Test Prep</button></li>
                <li><button onClick={() => onNavigate("scholarship-finder")} className="hover:text-[#0057B8]">Scholarships</button></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0057B8]">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => onNavigate("public-home")} className="hover:text-[#0057B8]">About Us</button></li>
                <li><button onClick={() => onNavigate("student-dashboard")} className="hover:text-[#0057B8]">Team</button></li>
                <li><button onClick={() => onNavigate("public-destinations")} className="hover:text-[#0057B8]">Find Us</button></li>
                <li><button onClick={() => onNavigate("public-destinations")} className="hover:text-[#0057B8]">Contact Us</button></li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 2 — Animated graduation caps strip */}
        <div className="relative h-12 overflow-hidden border-t border-[#0057B8]/5 bg-white">
          {/* Layer 1 — slow, opacity 40% */}
          <div className="pointer-events-none absolute inset-0 flex items-center">
            {[0, 200, 400, 600, 800].map((left, i) => (
              <span
                key={`l1-${i}`}
                className={`cap-layer-1 cap-delay-${(i % 8) + 1} absolute text-[#0057B8]/30`}
                style={{ left: `${left}px`, fontSize: "18px", opacity: 0.4 }}
              >
                <Icon name="GraduationCap" className="size-4" />
              </span>
            ))}
          </div>
          {/* Layer 2 — medium, opacity 70% */}
          <div className="pointer-events-none absolute inset-0 flex items-center">
            {[100, 350, 550, 750, 950].map((left, i) => (
              <span
                key={`l2-${i}`}
                className={`cap-layer-2 cap-delay-${(i % 8) + 1} absolute text-[#E8501A]/50`}
                style={{ left: `${left}px`, fontSize: "16px", opacity: 0.7 }}
              >
                <Icon name="GraduationCap" className="size-4" />
              </span>
            ))}
          </div>
          {/* Layer 3 — slightly faster, opacity 100% */}
          <div className="pointer-events-none absolute inset-0 flex items-center">
            {[50, 280, 500, 720, 900].map((left, i) => (
              <span
                key={`l3-${i}`}
                className={`cap-layer-3 cap-delay-${(i % 8) + 1} absolute text-slate-400`}
                style={{ left: `${left}px`, fontSize: "14px", opacity: 1 }}
              >
                <Icon name="GraduationCap" className="size-3.5" />
              </span>
            ))}
          </div>
        </div>

        {/* SECTION 3 — Bottom bar */}
        <div className="bg-[#f5f5f5]">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row lg:px-6">
            <p>© Copyright {new Date().getFullYear()} ALO Education. All Rights Reserved.</p>
            <div className="flex items-center gap-4">
              <button className="hover:text-[#0057B8]">Cookie Policy</button>
              <button className="hover:text-[#0057B8]">Privacy Policy</button>
              <button className="hover:text-[#0057B8]">Terms</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
