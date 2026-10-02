'use client';

import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube, GraduationCap, MapPin, Phone, Mail, Clock } from 'lucide-react';
import React from 'react';
import WebsiteActionButtons from '@/components/website/WebsiteActionButtons';

const destinations = [
  { label: 'United Kingdom', href: '/destinations/uk' },
  { label: 'USA', href: '/destinations/usa' },
  { label: 'Canada', href: '/destinations/canada' },
  { label: 'Australia', href: '/destinations/australia' },
  { label: 'Ireland', href: '/destinations/ireland' },
  { label: 'New Zealand', href: '/destinations/new-zealand' },
  { label: 'Dubai / UAE', href: '/destinations/dubai' },
  { label: 'Germany', href: '/destinations/germany' },
  { label: 'Malaysia', href: '/destinations/malaysia' },
  { label: 'Netherlands', href: '/destinations/netherlands' },
  { label: 'Cyprus', href: '/destinations/cyprus' },
  { label: 'Sweden', href: '/destinations/sweden' },
  { label: 'South Korea', href: '/destinations/south-korea' },
  { label: 'Malta', href: '/destinations/malta' },
  { label: 'Brazil', href: '/destinations/brazil' },
  { label: 'Russia', href: '/destinations/russia' },
  { label: 'India', href: '/destinations/india' },
  { label: 'China', href: '/destinations/china' },
  { label: 'South Africa', href: '/destinations/south-africa' },
];

const quickLinks = [
  { label: 'Course Finder', href: '/course-finder' },
  { label: 'Our Services', href: '/services' },
  { label: 'English Test Prep', href: '/english-test-prep' },
  { label: 'Scholarships', href: '/scholarships' },
  { label: 'Application Process', href: '/application-process' },
  { label: 'Visa Support', href: '/visa-support' },
  { label: 'Admission Requirements', href: '/admission-requirements' },
];

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Success Stories', href: '/success-stories' },
  { label: 'Events & Webinars', href: '/events' },
  { label: 'Blog & Articles', href: '/resources' },
  { label: 'News', href: '/news' },
  { label: 'FAQ', href: '/faqs' },
  { label: 'Contact Us', href: '/contact' },
];

const GraduationCapStrip = () => {
  return (
    <div className="relative w-full h-16 overflow-hidden bg-white border-y border-[#E2E8F0]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-caps {
          0% { transform: translateX(-100%) translateY(0) rotate(0deg); }
          50% { transform: translateX(50vw) translateY(-5px) rotate(10deg); }
          100% { transform: translateX(200vw) translateY(0) rotate(-10deg); }
        }
        .cap-layer-1 {
          animation: float-caps 25s linear infinite;
        }
        .cap-layer-2 {
          animation: float-caps 20s linear infinite;
          animation-delay: -5s;
        }
        .cap-layer-3 {
          animation: float-caps 15s linear infinite;
          animation-delay: -10s;
        }
      `}} />
      
      {/* Layer 1 - Slow - Gray */}
      <div className="absolute inset-0 flex items-center cap-layer-1 opacity-40 text-gray-400">
        <GraduationCap className="w-8 h-8 mx-12" />
        <GraduationCap className="w-10 h-10 mx-32" />
        <GraduationCap className="w-6 h-6 mx-24" />
      </div>

      {/* Layer 2 - Medium - Blue */}
      <div className="absolute inset-0 flex items-center cap-layer-2 opacity-70 text-[#0B5ED7]">
        <GraduationCap className="w-10 h-10 mx-20" />
        <GraduationCap className="w-8 h-8 mx-40" />
        <GraduationCap className="w-12 h-12 mx-16" />
      </div>

      {/* Layer 3 - Fast - Orange */}
      <div className="absolute inset-0 flex items-center cap-layer-3 opacity-100 text-[#F97316]">
        <GraduationCap className="w-8 h-8 mx-32" />
        <GraduationCap className="w-10 h-10 mx-20" />
        <GraduationCap className="w-8 h-8 mx-48" />
      </div>
    </div>
  );
};

// ─── CMS-managed footer content (Virtual Editor) ──────────────
// Footer link columns are editable by Super Admins via
// /admin/website-cms ("Site-Wide & CRM" tab, type 'footer').
// The constants above are the compiled-in fallback used until
// items are published, so the footer never renders empty.
interface FooterLink { label: string; href: string }
function useCmsFooterLinks() {
  const [links, setLinks] = React.useState<{
    destinations: FooterLink[];
    quickLinks: FooterLink[];
    companyLinks: FooterLink[];
  }>({ destinations, quickLinks, companyLinks });
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/website/cms-content?type=footer')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.success || !Array.isArray(j.items) || j.items.length === 0) return;
        const bySection: Record<string, FooterLink[]> = {};
        for (const item of j.items) {
          const section = String(item.section || '');
          const label = String(item.label || '');
          const href = String((item.data as Record<string, unknown>)?.href ?? '');
          if (!section || !label || !href) continue;
          (bySection[section] ||= []).push({ label, href });
        }
        if (Object.keys(bySection).length === 0) return;
        setLinks((prev) => ({
          destinations: bySection.destinations?.length ? bySection.destinations : prev.destinations,
          quickLinks: bySection.quickLinks?.length ? bySection.quickLinks : prev.quickLinks,
          companyLinks: bySection.companyLinks?.length ? bySection.companyLinks : prev.companyLinks,
        }));
      })
      .catch(() => {/* keep fallback */ });
    return () => { cancelled = true; };
  }, []);
  return links;
}

export default function PublicFooter() {
  const cmsLinks = useCmsFooterLinks();
  const { destinations: destLinks, quickLinks: quickL, companyLinks: companyL } = cmsLinks;
  return (
    <footer className="w-full bg-white pt-8 mt-auto border-t border-slate-100">
      {/* Footer contact 3-button placement — Get Instant Help banner with office address + map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <WebsiteActionButtons variant="footer" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-6">
          
          {/* Column 1: Brand, Contact & Socials */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/images/landing/Copy of logo.webp" alt="ALO Education" className="h-10 w-auto" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#0B5ED7] leading-tight">ALO Education</span>
              </div>
            </Link>
            <p className="text-[#64748B] text-sm leading-relaxed max-w-xs">
              Bangladesh&apos;s trusted study abroad consultancy. Honest guidance from application to arrival — no hidden fees, no false promises.
            </p>

            {/* Contact Info */}
            <div className="flex flex-col gap-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#F97316] mt-0.5 shrink-0" />
                <span>House 08, Road 17/A, Sector 11, Uttara, Dhaka-1230, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                <a href="tel:+8801805020101" className="hover:text-[#0B5ED7] transition-colors font-medium">+880 1805 020101</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                <a href="mailto:info@aloeducation.com" className="hover:text-[#0B5ED7] transition-colors font-medium">info@aloeducation.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                <span>Sat–Thu: 9:00 AM – 7:00 PM</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 text-[#0B5ED7]">
              <a href="https://facebook.com/aloeducation" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-[#F97316] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/aloeducation" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-[#F97316] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/aloeducation" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-[#F97316] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@aloeducation" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-[#F97316] transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Destinations */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0B5ED7] text-sm uppercase tracking-wider">Destinations</h3>
            <ul className="flex flex-col gap-2">
              {destLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-600 hover:text-[#F97316] transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0B5ED7] text-sm uppercase tracking-wider">Study Abroad</h3>
            <ul className="flex flex-col gap-2">
              {quickL.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-600 hover:text-[#F97316] transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0B5ED7] text-sm uppercase tracking-wider">Company</h3>
            <ul className="flex flex-col gap-2">
              {companyL.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-600 hover:text-[#F97316] transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Book CTA */}
            <div className="mt-4">
              <Link
                href="/book-consultation"
                className="inline-flex items-center gap-2 bg-[#F97316] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#EA580C] transition-colors"
              >
                Book Free Consultation →
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Graduation Cap Animation Strip */}
      <GraduationCapStrip />

      {/* Bottom Bar */}
      <div className="bg-[#f5f5f5] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#666666]">
          <p>© {new Date().getFullYear()} ALO Education Bangladesh. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center sm:justify-end">
            <Link href="/privacy-policy" className="hover:text-[#F97316] transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#F97316] transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-[#F97316] transition-colors">Cookies</Link>
            <span>·</span>
            <Link href="/communication-policy" className="hover:text-[#F97316] transition-colors">Communication</Link>
            <span>·</span>
            <Link href="/lead-data-usage-policy" className="hover:text-[#F97316] transition-colors">Lead Data</Link>
            <span>·</span>
            <Link href="/user-guide" className="hover:text-[#F97316] transition-colors">User Guide</Link>
            <span>·</span>
            <Link href="/accessibility" className="hover:text-[#F97316] transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
