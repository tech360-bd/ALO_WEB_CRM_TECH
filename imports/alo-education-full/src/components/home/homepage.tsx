'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/alo/home/navbar';
import Footer from '@/components/alo/home/footer';
import { HeroSection } from '@/components/alo/home/hero-section';
import { TrustBar } from '@/components/alo/home/trust-bar';
import { CountriesSection } from '@/components/alo/home/countries-section';
import { StatsSection } from '@/components/alo/home/stats-section';
import { WhyAloSection } from '@/components/alo/home/why-alo-section';
import { CourseFinderSection } from '@/components/alo/home/course-finder-section';
import { UniversitiesSection } from '@/components/alo/home/universities-section';
import { CoursesSection } from '@/components/alo/home/courses-section';
import { ScholarshipsSection } from '@/components/alo/home/scholarships-section';
import { TestimonialsSection } from '@/components/alo/home/testimonials-section';
import { BlogSection } from '@/components/alo/home/blog-section';
import { FaqSection } from '@/components/alo/home/faq-section';
import { CtaSection } from '@/components/alo/home/cta-section';
import { ScrollToTop } from '@/components/alo/home/scroll-to-top';
import { CountryPage } from '@/components/alo/pages/country-page';
import { AIToolsPage } from '@/components/alo/pages/ai-tools-page';
import { StudentPortalPage } from '@/components/alo/pages/student-portal-page';
import { EmployeePortalPage } from '@/components/alo/pages/employee-portal-page';
import { CourseFinderModal } from '@/components/alo/course-finder/course-finder-modal';
import { LeadModal } from '@/components/alo/home/lead-modal';
import { AuthModal } from '@/components/alo/home/auth-modal';
import { getCountryConfig } from '@/lib/country-configs';

/* ═══════════════════════════════════════════════════════════════════════════════
   Scroll Spy — track which section is in view for navbar highlighting
   ═══════════════════════════════════════════════════════════════════════════════ */

const SCROLL_SPY_IDS = ['countries', 'universities', 'courses', 'scholarships', 'blog', 'faq'];

type PageType = 'home' | 'country' | 'ai-tools' | 'student-portal' | 'employee-portal';

export function HomePage() {
  const [activePage, setActivePage] = useState<PageType>('home');
  const [activeCountrySlug, setActiveCountrySlug] = useState<string>('uk');
  const [finderOpen, setFinderOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const mainRef = useRef<HTMLElement>(null);
  const scrollSpyActive = activePage === 'home';

  /* ── IntersectionObserver for scroll spy ─────────────────────── */
  useEffect(() => {
    if (!scrollSpyActive) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    for (const id of SCROLL_SPY_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [scrollSpyActive]);

  /* ── Smooth scroll to section ──────────────────────────────────── */
  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  const countryConfig = activePage === 'country' ? getCountryConfig(activeCountrySlug) : undefined;

  const navProps = {
    onLeadOpen: () => setLeadOpen(true),
    onAiToolsClick: () => setActivePage('ai-tools'),
    onStudentPortalClick: () => setActivePage('student-portal'),
    onEmployeePortalClick: () => setActivePage('employee-portal'),
    onAuthOpen: () => setAuthOpen(true),
    activeSection,
    onScrollToSection: scrollToSection,
  };

  const handleCountryClick = (slug: string) => {
    setActiveCountrySlug(slug);
    setActivePage('country');
  };

  const goHome = () => setActivePage('home');

  // Country page
  if (activePage === 'country' && countryConfig) {
    return (
      <div className="min-h-screen-flex">
        <Navbar {...navProps} />
        <CountryPage config={countryConfig} onBack={goHome} onLeadOpen={() => setLeadOpen(true)} />
        <ScrollToTop />
        <Footer />
        <CourseFinderModal open={finderOpen} onOpenChange={setFinderOpen} />
        <LeadModal open={leadOpen} onOpenChange={setLeadOpen} />
      </div>
    );
  }

  if (activePage === 'ai-tools') {
    return (
      <div className="min-h-screen-flex">
        <Navbar {...navProps} />
        <AIToolsPage onBack={goHome} onLeadOpen={() => setLeadOpen(true)} />
        <ScrollToTop />
        <Footer />
        <CourseFinderModal open={finderOpen} onOpenChange={setFinderOpen} />
        <LeadModal open={leadOpen} onOpenChange={setLeadOpen} />
      </div>
    );
  }

  if (activePage === 'student-portal') {
    return (
      <div className="min-h-screen-flex">
        <Navbar {...navProps} />
        <StudentPortalPage onBack={goHome} onLeadOpen={() => setLeadOpen(true)} />
        <ScrollToTop />
        <Footer />
        <CourseFinderModal open={finderOpen} onOpenChange={setFinderOpen} />
        <LeadModal open={leadOpen} onOpenChange={setLeadOpen} />
      </div>
    );
  }

  if (activePage === 'employee-portal') {
    return (
      <div className="min-h-screen-flex">
        <Navbar {...navProps} />
        <EmployeePortalPage onBack={goHome} onLeadOpen={() => setLeadOpen(true)} />
        <ScrollToTop />
        <Footer />
        <CourseFinderModal open={finderOpen} onOpenChange={setFinderOpen} />
        <LeadModal open={leadOpen} onOpenChange={setLeadOpen} />
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen-flex">
      <Navbar {...navProps} />
      <main ref={mainRef}>
        <HeroSection onFinderOpen={() => setFinderOpen(true)} onLeadOpen={() => setLeadOpen(true)} />
        <TrustBar />
        <CountriesSection onCountryClick={handleCountryClick} />
        <StatsSection />
        <WhyAloSection />
        <CourseFinderSection onFinderOpen={() => setFinderOpen(true)} />
        <UniversitiesSection />
        <CoursesSection />
        <ScholarshipsSection />
        <TestimonialsSection />
        <BlogSection />
        <FaqSection />
        <CtaSection />
      </main>
      <ScrollToTop />
      <Footer />
      <CourseFinderModal open={finderOpen} onOpenChange={setFinderOpen} />
      <LeadModal open={leadOpen} onOpenChange={setLeadOpen} />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
