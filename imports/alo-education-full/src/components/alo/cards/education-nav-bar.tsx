'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Home,
  GraduationCap,
  BookOpen,
  MapPin,
  DollarSign,
  FileText,
  Plane,
  MessageSquare,
  Phone,
  Search,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Heart,
  User,
  LogIn,
} from 'lucide-react';

/**
 * Education Consultancy Navigation Bar
 *
 * Patterns from Nabal Education Figma design:
 * - Top announcement bar (promo/campaign)
 * - Sticky header with logo + nav links
 * - CTA button ("Book Free Counseling")
 * - Phone number prominently displayed
 * - Mobile hamburger menu
 *
 * Patterns from Studytra:
 * - Search icon in nav
 * - AI Assistant access
 * - User profile dropdown
 * - Country quick links
 *
 * Patterns from NextStep-Abroad:
 * - Auth state toggle (Login vs Profile)
 * - Responsive design with sheet/drawer on mobile
 */

// ─── Navigation Items ────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  hash: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: { label: string; hash: string; description?: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', hash: '#home', icon: Home },
  {
    label: 'Study Abroad',
    hash: '#destinations',
    icon: MapPin,
    children: [
      { label: 'UK', hash: '#country-uk', description: 'United Kingdom' },
      { label: 'USA', hash: '#country-us', description: 'United States' },
      { label: 'Canada', hash: '#country-ca', description: 'Canada' },
      { label: 'Germany', hash: '#country-de', description: 'Germany' },
      { label: 'Australia', hash: '#country-au', description: 'Australia' },
    ],
  },
  { label: 'Universities', hash: '#universities', icon: GraduationCap },
  { label: 'Courses', hash: '#course-finder', icon: BookOpen },
  {
    label: 'Resources',
    hash: '#resources',
    icon: FileText,
    children: [
      { label: 'Scholarships', hash: '#scholarships' },
      { label: 'Exams', hash: '#exams' },
      { label: 'Visa Guide', hash: '#visa-support' },
      { label: 'Blog', hash: '#blog' },
    ],
  },
  { label: 'Cost Planner', hash: '#cost-planner', icon: DollarSign },
  { label: 'Contact', hash: '#contact', icon: Phone },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface EducationNavBarProps {
  /** Current active hash route */
  activeHash?: string;
  /** Navigate to hash */
  onNavigate?: (hash: string) => void;
  /** Open lead/counseling modal */
  onBookCounseling?: () => void;
  /** Open auth modal */
  onAuthOpen?: () => void;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** Student name if authenticated */
  studentName?: string;
  /** Show announcement bar */
  showAnnouncement?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EducationNavBar({
  activeHash = '#home',
  onNavigate,
  onBookCounseling,
  onAuthOpen,
  isAuthenticated = false,
  studentName,
  showAnnouncement = true,
}: EducationNavBarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for sticky styling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (hash: string) => {
    onNavigate?.(hash);
    setIsMobileOpen(false);
    setOpenDropdown(null);
  };

  return (
    <>
      {/* ── Announcement Bar ──────────────────────────────────────── */}
      {showAnnouncement && (
        <div className="bg-alo-orange text-white text-center py-1.5 px-4 text-xs font-medium">
          <span className="mr-2">🎓</span>
          Spring 2026 Intake — Applications Open!
          <button
            type="button"
            className="ml-3 underline underline-offset-2 hover:no-underline font-semibold"
            onClick={() => handleNav('#course-finder')}
          >
            Find Courses →
          </button>
        </div>
      )}

      {/* ── Main Navigation ───────────────────────────────────────── */}
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-200',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-white'
        )}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              type="button"
              className="flex items-center gap-2 shrink-0"
              onClick={() => handleNav('#home')}
            >
              <div className="w-8 h-8 rounded-lg bg-alo-orange flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-alo-blue">
                ALO<span className="text-alo-orange">Education</span>
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map(item => {
                const isActive = activeHash === item.hash;
                const Icon = item.icon;

                return (
                  <div key={item.label} className="relative">
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-alo-blue-light text-alo-blue'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-alo-blue'
                      )}
                      onClick={() => {
                        if (item.children) {
                          setOpenDropdown(openDropdown === item.label ? null : item.label);
                        } else {
                          handleNav(item.hash);
                        }
                      }}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.label}
                      {item.badge && (
                        <Badge className="h-4 min-w-4 px-1 text-[9px] bg-alo-orange text-white border-0">
                          {item.badge}
                        </Badge>
                      )}
                      {item.children && <ChevronDown className="h-3 w-3" />}
                    </button>

                    {/* Dropdown */}
                    {item.children && openDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-1 w-52 rounded-xl bg-white border border-gray-200 shadow-lg py-2 z-50">
                        {item.children.map(child => (
                          <button
                            key={child.label}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-alo-blue-light hover:text-alo-blue transition-colors"
                            onClick={() => handleNav(child.hash)}
                          >
                            <span className="font-medium">{child.label}</span>
                            {child.description && (
                              <span className="block text-xs text-muted-foreground">{child.description}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Right Side: Search + CTA + Auth */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search */}
              <button
                type="button"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-alo-blue"
                onClick={() => handleNav('#search')}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* AI Assistant */}
              <button
                type="button"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-violet-50 hover:text-violet-600"
                onClick={() => handleNav('#ai-assistant')}
                aria-label="AI Assistant"
              >
                <Sparkles className="h-4 w-4" />
              </button>

              {/* Book Counseling CTA */}
              <Button
                size="sm"
                className="hidden md:flex h-9 bg-alo-orange hover:bg-[#D45A10] text-white text-xs font-semibold gap-1.5"
                onClick={onBookCounseling}
              >
                <Phone className="h-3.5 w-3.5" />
                Book Free Counseling
              </Button>

              {/* Auth */}
              {isAuthenticated ? (
                <button
                  type="button"
                  className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-alo-blue hover:bg-alo-blue-light"
                  onClick={() => handleNav('#student-dashboard')}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-20 truncate">{studentName || 'Dashboard'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-alo-blue px-3 text-xs font-semibold text-alo-blue hover:bg-alo-blue-light"
                  onClick={onAuthOpen}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}

              {/* Mobile Hamburger */}
              <button
                type="button"
                className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ─────────────────────────────────────────────── */}
        {isMobileOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeHash === item.hash;

                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-alo-blue-light text-alo-blue'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                      onClick={() => {
                        if (item.children) {
                          setOpenDropdown(openDropdown === item.label ? null : item.label);
                        } else {
                          handleNav(item.hash);
                        }
                      }}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.label}
                    </button>

                    {/* Mobile sub-items */}
                    {item.children && openDropdown === item.label && (
                      <div className="ml-8 space-y-0.5 py-1">
                        {item.children.map(child => (
                          <button
                            key={child.label}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-alo-blue"
                            onClick={() => handleNav(child.hash)}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile CTA */}
              <div className="pt-2 border-t border-gray-100">
                <Button
                  className="w-full bg-alo-orange hover:bg-[#D45A10] text-white gap-2"
                  onClick={onBookCounseling}
                >
                  <Phone className="h-4 w-4" />
                  Book Free Counseling
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
