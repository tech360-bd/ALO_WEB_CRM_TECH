'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  GraduationCap,
  Menu,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ArrowRight,
} from 'lucide-react'

/**
 * PublicSiteLayout — ALO Education public website shell.
 *
 * Brand colors (per design spec):
 *   - Background: white
 *   - Primary blue: #0057B8
 *   - Primary orange: #E8501A
 *
 * Structure:
 *   - Sticky header (logo + nav + login/register)
 *   - `<main>` flexes to fill the viewport
 *   - Footer pushed to bottom via `mt-auto` (sticky-footer pattern)
 *
 * NOTE: This layout uses real Next.js `<Link>` routing (not the in-memory
 * view-switching store used by the older AloPublicSite). It is safe to wrap
 * both server and client component pages.
 */

const studyDestinations = [
  { label: 'United Kingdom', href: '/universities?country=United+Kingdom', flag: '🇬🇧' },
  { label: 'United States', href: '/universities?country=United+States', flag: '🇺🇸' },
  { label: 'Canada', href: '/universities?country=Canada', flag: '🇨🇦' },
  { label: 'Australia', href: '/universities?country=Australia', flag: '🇦🇺' },
  { label: 'Europe', href: '/universities?country=Europe', flag: '🇪🇺' },
  { label: 'Malaysia', href: '/universities?country=Malaysia', flag: '🇲🇾' },
]

const navLinks: Array<{ label: string; href?: string; hasDropdown?: boolean }> = [
  { label: 'Home', href: '/' },
  { label: 'Universities', href: '/universities' },
  { label: 'Course Finder', href: '/course-finder' },
  { label: 'Scholarships', href: '/scholarships' },
  { label: 'Services', href: '/services' },
  { label: 'Language Prep', href: '/language-prep' },
  { label: 'Resources', href: '/resources' },
  { label: 'Stories', href: '/success-stories' },
  { label: 'Destinations', hasDropdown: true },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function PublicSiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [destDropdownOpen, setDestDropdownOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top info bar */}
      <div className="bg-[#1A2332] text-white text-xs py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> +880 1700-000000
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> info@aloeducation.com
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Dhaka, Bangladesh
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Follow us:</span>
            <div className="flex gap-3">
              <Facebook className="h-3.5 w-3.5 hover:text-[#E8501A] cursor-pointer transition-colors" />
              <Twitter className="h-3.5 w-3.5 hover:text-[#E8501A] cursor-pointer transition-colors" />
              <Instagram className="h-3.5 w-3.5 hover:text-[#E8501A] cursor-pointer transition-colors" />
              <Linkedin className="h-3.5 w-3.5 hover:text-[#E8501A] cursor-pointer transition-colors" />
              <Youtube className="h-3.5 w-3.5 hover:text-[#E8501A] cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: '#E8501A' }}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold text-[#1A2332] tracking-tight">
                ALO<span style={{ color: '#E8501A' }}> Education</span>
              </span>
              <span className="text-[10px] text-[#555555] -mt-0.5 hidden sm:block">
                Your Gateway to Global Education
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div key={link.label} className="relative group">
                  <button className="flex items-center gap-0.5 px-3 py-2 text-sm font-medium text-[#1A2332] hover:text-[#E8501A] transition-colors rounded-md hover:bg-orange-50">
                    {link.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {/* Dropdown */}
                  <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="bg-white border border-gray-100 shadow-lg rounded-md w-56 overflow-hidden">
                      {studyDestinations.map((dest) => (
                        <Link
                          key={dest.href}
                          href={dest.href}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1A2332] hover:bg-orange-50 hover:text-[#E8501A] transition-colors"
                        >
                          <span>{dest.flag}</span>
                          {dest.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href || '#'}
                  className={`px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-orange-50 ${
                    link.href && isActive(pathname, link.href)
                      ? 'text-[#E8501A]'
                      : 'text-[#1A2332] hover:text-[#E8501A]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/book-consultation">
                <Button
                  size="sm"
                  className="h-11 px-4 text-white font-semibold"
                  style={{ background: '#E8501A' }}
                >
                  Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="p-4 border-b bg-[#1A2332] text-white">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: '#E8501A' }}
                      >
                        <GraduationCap className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg font-bold">
                        ALO<span style={{ color: '#E8501A' }}> Education</span>
                      </span>
                    </div>
                  </div>

                  {/* Mobile Nav Links */}
                  <div className="flex-1 overflow-y-auto py-4">
                    {navLinks
                      .filter((l) => !l.hasDropdown)
                      .map((link) => (
                        <Link
                          key={link.label}
                          href={link.href || '#'}
                          onClick={() => setMobileOpen(false)}
                          className="block w-full text-left px-6 py-2.5 text-sm font-medium text-[#1A2332] hover:bg-orange-50 hover:text-[#E8501A] transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}

                    {/* Destinations dropdown (mobile) */}
                    <div className="my-2 border-t" />
                    <button
                      onClick={() => setDestDropdownOpen((v) => !v)}
                      className="w-full text-left px-6 py-2.5 text-sm font-semibold text-[#E8501A] uppercase tracking-wider flex items-center justify-between"
                    >
                      Destinations
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${destDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {destDropdownOpen &&
                      studyDestinations.map((dest) => (
                        <Link
                          key={dest.href}
                          href={dest.href}
                          onClick={() => setMobileOpen(false)}
                          className="block w-full text-left px-8 py-2.5 text-sm text-[#1A2332] hover:bg-orange-50 hover:text-[#E8501A] transition-colors"
                        >
                          <span className="mr-2">{dest.flag}</span>
                          {dest.label}
                        </Link>
                      ))}

                    <div className="my-2 border-t" />
                    <Link
                      href="/book-consultation"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-left px-6 py-2.5 text-sm font-medium text-[#1A2332] hover:bg-orange-50 hover:text-[#E8501A] transition-colors"
                    >
                      Book Free Consultation
                    </Link>
                  </div>

                  {/* Mobile CTA */}
                  <div className="p-4 border-t bg-gray-50">
                    <Link href="/book-consultation" onClick={() => setMobileOpen(false)}>
                      <Button
                        className="w-full h-12 text-white font-semibold"
                        style={{ background: '#E8501A' }}
                      >
                        Book Free Consultation
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#1A2332] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: '#E8501A' }}
                >
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">
                  ALO<span style={{ color: '#E8501A' }}> Education</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                ALO Education is a leading education consultancy helping students achieve their
                dreams of studying abroad. With experienced counselors and verified university
                partnerships, we guide you from your first consultation to arriving at your
                destination campus.
              </p>
              <div className="flex gap-3 pt-2">
                <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E8501A] flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E8501A] flex items-center justify-center transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E8501A] flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E8501A] flex items-center justify-center transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="#" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E8501A] flex items-center justify-center transition-colors">
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#E8501A' }}>
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: 'Universities', href: '/universities' },
                  { label: 'Course Finder', href: '/course-finder' },
                  { label: 'Scholarships', href: '/scholarships' },
                  { label: 'Services', href: '/services' },
                  { label: 'Language Prep', href: '/language-prep' },
                  { label: 'Resources', href: '/resources' },
                  { label: 'Success Stories', href: '/success-stories' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-[#E8501A] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Study Abroad */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#E8501A' }}>
                Study Abroad
              </h3>
              <ul className="space-y-2.5">
                {studyDestinations.map((dest) => (
                  <li key={dest.href}>
                    <Link
                      href={dest.href}
                      className="text-sm text-gray-400 hover:text-[#E8501A] transition-colors flex items-center gap-2"
                    >
                      <span>{dest.flag}</span> {dest.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/book-consultation"
                    className="text-sm text-gray-400 hover:text-[#E8501A] transition-colors"
                  >
                    Book Free Consultation
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#E8501A' }}>
                Contact Us
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#E8501A' }} />
                  <span className="text-sm text-gray-400">
                    House 12, Road 27, Banani<br />
                    Dhaka 1213, Bangladesh
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0" style={{ color: '#E8501A' }} />
                  <span className="text-sm text-gray-400">+880 1700-000000</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0" style={{ color: '#E8501A' }} />
                  <span className="text-sm text-gray-400">info@aloeducation.com</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/book-consultation">
                  <Button
                    className="w-full h-12 text-white font-semibold"
                    style={{ background: '#E8501A' }}
                    size="sm"
                  >
                    Book Free Consultation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} ALO Education. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/resources" className="hover:text-[#E8501A] transition-colors">
                Resources
              </Link>
              <span className="hover:text-[#E8501A] transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#E8501A] transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
