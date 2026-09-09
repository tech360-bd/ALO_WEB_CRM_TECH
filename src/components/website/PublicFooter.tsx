'use client';

import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube, GraduationCap, MapPin, Phone, Mail, Clock } from 'lucide-react';
import React from 'react';

const destinations = [
  { label: 'United Kingdom', href: '/destinations/uk' },
  { label: 'United States', href: '/destinations/usa' },
  { label: 'Australia', href: '/destinations/australia' },
  { label: 'Canada', href: '/destinations/canada' },
  { label: 'Ireland', href: '/destinations/ireland' },
  { label: 'New Zealand', href: '/destinations/new-zealand' },
  { label: 'Dubai / UAE', href: '/destinations/dubai' },
];

const aloLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Why ALO Education', href: '/about#why' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Careers', href: '/careers' },
];

const studyLinks = [
  { label: 'Course Finder', href: '/course-finder' },
  { label: 'Universities', href: '/universities' },
  { label: 'Compare Courses', href: '/compare' },
  { label: 'Scholarships', href: '/scholarships' },
];

const englishTests = [
  { label: 'IELTS Academic', href: '/english-tests/ielts' },
  { label: 'IELTS UKVI', href: '/english-tests/ielts-ukvi' },
  { label: 'PTE Academic', href: '/english-tests/pte' },
  { label: 'TOEFL iBT', href: '/english-tests/toefl' },
  { label: 'Duolingo English Test', href: '/english-tests/duolingo' },
  { label: 'OET (Healthcare)', href: '/english-tests/oet' },
  { label: 'LanguageCert', href: '/english-tests/languagecert' },
  { label: 'OIETC / ELLT', href: '/english-tests/oietc' },
];

const servicesResources = [
  { label: 'Application Assistance', href: '/services' },
  { label: 'Visa Guidance', href: '/visa-support' },
  { label: 'Blog & Articles', href: '/blog' },
  { label: 'FAQs', href: '/faqs' },
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
      <div className="absolute inset-0 flex items-center cap-layer-2 opacity-70 text-[#0066CC]">
        <GraduationCap className="w-10 h-10 mx-20" />
        <GraduationCap className="w-8 h-8 mx-40" />
        <GraduationCap className="w-12 h-12 mx-16" />
      </div>

      {/* Layer 3 - Fast - Orange */}
      <div className="absolute inset-0 flex items-center cap-layer-3 opacity-100 text-[#F37021]">
        <GraduationCap className="w-8 h-8 mx-32" />
        <GraduationCap className="w-10 h-10 mx-20" />
        <GraduationCap className="w-8 h-8 mx-48" />
      </div>
    </div>
  );
};

export default function PublicFooter() {
  return (
    <footer className="w-full bg-white pt-16 mt-auto border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-10 lg:gap-6">
          
          {/* Column 1: Brand, Contact & Socials */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/images/landing/Copy of logo.webp" alt="ALO Education" className="h-10 w-auto" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#0057B8] leading-tight">ALO Education</span>
              </div>
            </Link>
            <p className="text-[#64748B] text-sm leading-relaxed max-w-xs">
              Bangladesh&apos;s trusted study abroad consultancy. Honest guidance from application to arrival — no hidden fees, no false promises.
            </p>

            {/* Contact Info */}
            <div className="flex flex-col gap-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E8501A] mt-0.5 shrink-0" />
                <span>House 08, Road 17/A, Sector 11, Uttara, Dhaka-1230, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E8501A] shrink-0" />
                <a href="tel:+8801805020101" className="hover:text-[#0057B8] transition-colors font-medium">+880 1805 020101</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E8501A] shrink-0" />
                <a href="mailto:info@aloeducation.com" className="hover:text-[#0057B8] transition-colors font-medium">info@aloeducation.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#E8501A] shrink-0" />
                <span>Sat–Thu: 9:00 AM – 7:00 PM</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 text-[#0057B8]">
              <a href="https://facebook.com/aloeducation" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-[#E8501A] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/aloeducation" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-[#E8501A] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/aloeducation" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-[#E8501A] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@aloeducation" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-[#E8501A] transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: ALO Education */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0057B8] text-sm uppercase tracking-wider">ALO Education</h3>
            <ul className="flex flex-col gap-2">
              {aloLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-600 hover:text-[#E8501A] transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Study Destinations */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0057B8] text-sm uppercase tracking-wider">Destinations</h3>
            <ul className="flex flex-col gap-2">
              {destinations.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-600 hover:text-[#E8501A] transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Study / Courses */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0057B8] text-sm uppercase tracking-wider">Study</h3>
            <ul className="flex flex-col gap-2">
              {studyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-600 hover:text-[#E8501A] transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: English Tests */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0057B8] text-sm uppercase tracking-wider">English Tests</h3>
            <ul className="flex flex-col gap-2">
              {englishTests.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-600 hover:text-[#E8501A] transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 6: Services & Resources */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0057B8] text-sm uppercase tracking-wider">Services</h3>
            <ul className="flex flex-col gap-2">
              {servicesResources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-600 hover:text-[#E8501A] transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Book CTA */}
            <div className="mt-4">
              <Link
                href="/book-consultation"
                className="inline-flex items-center gap-2 bg-[#E8501A] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#c73e10] transition-colors whitespace-nowrap"
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
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#E8501A] transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#E8501A] transition-colors">Terms of Use</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-[#E8501A] transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
