'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  User,
  LogOut,
  Settings,
  LayoutDashboard,
} from 'lucide-react'

const studyDestinations = [
  { label: 'United Kingdom', view: 'study-uk' as const, flag: '🇬🇧' },
  { label: 'United States', view: 'study-usa' as const, flag: '🇺🇸' },
  { label: 'Canada', view: 'study-canada' as const, flag: '🇨🇦' },
  { label: 'Australia', view: 'study-australia' as const, flag: '🇦🇺' },
  { label: 'Europe', view: 'study-europe' as const, flag: '🇪🇺' },
  { label: 'Malaysia', view: 'study-malaysia' as const, flag: '🇲🇾' },
]

const navLinks = [
  { label: 'Home', view: 'home' as const },
  { label: 'About', view: 'about' as const },
  { label: 'Study Destinations', view: null, hasDropdown: true },
  { label: 'Universities', view: 'universities' as const },
  { label: 'Courses', view: 'courses' as const },
  { label: 'Scholarships', view: 'scholarships' as const },
  { label: 'Services', view: 'services' as const },
  { label: 'Blog', view: 'blog' as const },
  { label: 'Contact', view: 'contact' as const },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, setCurrentView, logout } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [destDropdownOpen, setDestDropdownOpen] = useState(false)

  const getDashboardView = () => {
    const role = currentUser?.role
    switch (role) {
      case 'student': return 'student-dashboard' as const
      case 'partner_super_admin': case 'partner_staff': return 'partner-dashboard' as const
      case 'super_admin': case 'admin': return 'crm-dashboard' as const
      case 'counselor': case 'junior_counselor': return 'counselor-dashboard' as const
      case 'application_team': return 'application-dashboard' as const
      case 'visa_officer': return 'visa-dashboard' as const
      case 'finance': return 'finance-dashboard' as const
      case 'marketing_manager': case 'marketing_executive': return 'marketing-dashboard' as const
      case 'hr_manager': return 'hr-dashboard' as const
      case 'employee': return 'employee-dashboard' as const
      default: return 'crm-dashboard' as const
    }
  }

  const handleNav = (view: Parameters<typeof setCurrentView>[0]) => {
    setCurrentView(view)
    setMobileOpen(false)
    setDestDropdownOpen(false)
  }

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
              <Facebook className="h-3.5 w-3.5 hover:text-[#F37021] cursor-pointer transition-colors" />
              <Twitter className="h-3.5 w-3.5 hover:text-[#F37021] cursor-pointer transition-colors" />
              <Instagram className="h-3.5 w-3.5 hover:text-[#F37021] cursor-pointer transition-colors" />
              <Linkedin className="h-3.5 w-3.5 hover:text-[#F37021] cursor-pointer transition-colors" />
              <Youtube className="h-3.5 w-3.5 hover:text-[#F37021] cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 bg-[#F37021] rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold text-[#1A2332] tracking-tight">
                ALO<span className="text-[#F37021]"> Education</span>
              </span>
              <span className="text-[10px] text-[#555555] -mt-0.5 hidden sm:block">
                Your Gateway to Global Education
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <DropdownMenu key={link.label} open={destDropdownOpen} onOpenChange={setDestDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-0.5 px-3 py-2 text-sm font-medium text-[#1A2332] hover:text-[#F37021] transition-colors rounded-md hover:bg-orange-50">
                      {link.label}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    {studyDestinations.map((dest) => (
                      <DropdownMenuItem
                        key={dest.view}
                        onClick={() => handleNav(dest.view)}
                        className="cursor-pointer py-2.5"
                      >
                        <span className="mr-2">{dest.flag}</span>
                        {dest.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  key={link.label}
                  onClick={() => link.view && handleNav(link.view)}
                  className="px-3 py-2 text-sm font-medium text-[#1A2332] hover:text-[#F37021] transition-colors rounded-md hover:bg-orange-50"
                >
                  {link.label}
                </button>
              )
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#F37021] flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-[#1A2332] hidden sm:inline">
                      {currentUser.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleNav(getDashboardView())}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNav('student-profile' as Parameters<typeof setCurrentView>[0])}>
                    <User className="h-4 w-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNav('login')}
                  className="border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC] hover:text-white"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNav('student-register')}
                  className="bg-[#F37021] hover:bg-[#e0651a] text-white"
                >
                  Register
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="p-4 border-b bg-[#1A2332] text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#F37021] rounded-lg flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg font-bold">
                        ALO<span className="text-[#F37021]"> Education</span>
                      </span>
                    </div>
                  </div>

                  {/* Mobile Nav Links */}
                  <div className="flex-1 overflow-y-auto py-4">
                    {navLinks.map((link) =>
                      link.hasDropdown ? (
                        <div key={link.label}>
                          <div className="px-4 py-2.5 text-xs font-semibold text-[#F37021] uppercase tracking-wider">
                            {link.label}
                          </div>
                          {studyDestinations.map((dest) => (
                            <button
                              key={dest.view}
                              onClick={() => handleNav(dest.view)}
                              className="w-full text-left px-8 py-2.5 text-sm text-[#1A2332] hover:bg-orange-50 hover:text-[#F37021] transition-colors flex items-center gap-2"
                            >
                              <span>{dest.flag}</span>
                              {dest.label}
                            </button>
                          ))}
                          <div className="my-2 border-t" />
                        </div>
                      ) : (
                        <button
                          key={link.label}
                          onClick={() => link.view && handleNav(link.view)}
                          className="w-full text-left px-6 py-2.5 text-sm font-medium text-[#1A2332] hover:bg-orange-50 hover:text-[#F37021] transition-colors"
                        >
                          {link.label}
                        </button>
                      )
                    )}
                    <div className="my-2 border-t" />
                    <button
                      onClick={() => handleNav('visa-guidance')}
                      className="w-full text-left px-6 py-2.5 text-sm font-medium text-[#1A2332] hover:bg-orange-50 hover:text-[#F37021] transition-colors"
                    >
                      Visa Guidance
                    </button>
                    <button
                      onClick={() => handleNav('success-stories')}
                      className="w-full text-left px-6 py-2.5 text-sm font-medium text-[#1A2332] hover:bg-orange-50 hover:text-[#F37021] transition-colors"
                    >
                      Success Stories
                    </button>
                    <button
                      onClick={() => handleNav('faq')}
                      className="w-full text-left px-6 py-2.5 text-sm font-medium text-[#1A2332] hover:bg-orange-50 hover:text-[#F37021] transition-colors"
                    >
                      FAQ
                    </button>
                    <button
                      onClick={() => handleNav('free-consultation')}
                      className="w-full text-left px-6 py-2.5 text-sm font-medium text-[#1A2332] hover:bg-orange-50 hover:text-[#F37021] transition-colors"
                    >
                      Free Consultation
                    </button>
                  </div>

                  {/* Mobile Auth Buttons */}
                  <div className="p-4 border-t bg-gray-50 space-y-2">
                    {currentUser ? (
                      <Button
                        className="w-full bg-[#1A2332] hover:bg-[#2a3a50] text-white"
                        onClick={() => { logout(); setMobileOpen(false) }}
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="w-full bg-[#F37021] hover:bg-[#e0651a] text-white"
                          onClick={() => handleNav('student-register')}
                        >
                          Register Now
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-[#0066CC] text-[#0066CC]"
                          onClick={() => handleNav('login')}
                        >
                          Login
                        </Button>
                      </>
                    )}
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
        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-[#F37021] rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">
                  ALO<span className="text-[#F37021]"> Education</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                ALO Education is a leading education consultancy helping students achieve their
                dreams of studying abroad. With over 15 years of experience, we have successfully
                placed thousands of students in top universities worldwide.
              </p>
              <div className="flex gap-3 pt-2">
                <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#F37021] flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#F37021] flex items-center justify-center transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#F37021] flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#F37021] flex items-center justify-center transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#F37021] flex items-center justify-center transition-colors">
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F37021] mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: 'About Us', view: 'about' as const },
                  { label: 'Study Destinations', view: 'study-uk' as const },
                  { label: 'Universities', view: 'universities' as const },
                  { label: 'Courses', view: 'courses' as const },
                  { label: 'Scholarships', view: 'scholarships' as const },
                  { label: 'Services', view: 'services' as const },
                  { label: 'Success Stories', view: 'success-stories' as const },
                  { label: 'Blog', view: 'blog' as const },
                ].map((link) => (
                  <li key={link.view}>
                    <button
                      onClick={() => handleNav(link.view)}
                      className="text-sm text-gray-400 hover:text-[#F37021] transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Study Abroad */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F37021] mb-4">
                Study Abroad
              </h3>
              <ul className="space-y-2.5">
                {studyDestinations.map((dest) => (
                  <li key={dest.view}>
                    <button
                      onClick={() => handleNav(dest.view)}
                      className="text-sm text-gray-400 hover:text-[#F37021] transition-colors flex items-center gap-2"
                    >
                      <span>{dest.flag}</span> {dest.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => handleNav('visa-guidance')}
                    className="text-sm text-gray-400 hover:text-[#F37021] transition-colors"
                  >
                    Visa Guidance
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('free-consultation')}
                    className="text-sm text-gray-400 hover:text-[#F37021] transition-colors"
                  >
                    Free Consultation
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F37021] mb-4">
                Contact Us
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#F37021] mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-400">
                    House 12, Road 27, Banani<br />
                    Dhaka 1213, Bangladesh
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[#F37021] shrink-0" />
                  <span className="text-sm text-gray-400">+880 1700-000000</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#F37021] shrink-0" />
                  <span className="text-sm text-gray-400">info@aloeducation.com</span>
                </li>
              </ul>
              <div className="mt-6">
                <Button
                  onClick={() => handleNav('free-consultation')}
                  className="bg-[#F37021] hover:bg-[#e0651a] text-white w-full"
                  size="sm"
                >
                  Book Free Consultation
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} ALO Education. All rights reserved.</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleNav('faq')}
                className="hover:text-[#F37021] transition-colors"
              >
                FAQ
              </button>
              <button className="hover:text-[#F37021] transition-colors">Privacy Policy</button>
              <button className="hover:text-[#F37021] transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
