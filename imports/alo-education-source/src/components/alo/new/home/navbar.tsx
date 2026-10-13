'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown,
  Menu,
  Globe,
  GraduationCap,
  BookOpen,
  Award,
  Languages,
  Bot,
  MessageSquareQuote,
  BookText,
  Info,
  Phone,
  X,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewNavbarProps {
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface NavItem {
  label: string;
  page: string;
  icon?: React.ReactNode;
  children?: { label: string; page: string; icon?: React.ReactNode }[];
}

// ─── Navigation Data ────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Study Abroad',
    page: 'study-abroad',
    children: [
      { label: 'Course Finder', page: 'course-finder', icon: <Search className="h-4 w-4" /> },
      { label: 'Countries', page: 'countries', icon: <Globe className="h-4 w-4" /> },
      { label: 'Universities', page: 'universities', icon: <GraduationCap className="h-4 w-4" /> },
      { label: 'Courses', page: 'courses', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Scholarships', page: 'scholarships', icon: <Award className="h-4 w-4" /> },
      { label: 'English Tests', page: 'english-tests', icon: <Languages className="h-4 w-4" /> },
    ],
  },
  { label: 'AI Tools', page: 'ai-tools', icon: <Bot className="h-4 w-4" /> },
  { label: 'Student Stories', page: 'student-stories', icon: <MessageSquareQuote className="h-4 w-4" /> },
  { label: 'Blog / Guides', page: 'blog', icon: <BookText className="h-4 w-4" /> },
  { label: 'About', page: 'about', icon: <Info className="h-4 w-4" /> },
  { label: 'Contact', page: 'contact', icon: <Phone className="h-4 w-4" /> },
];

// ─── Logo Component ──────────────────────────────────────────────────────────

function AloLogo({ className, variant = 'dark' }: { className?: string; variant?: 'dark' | 'light' }) {
  const isLight = variant === 'light';
  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl font-bold text-white shrink-0',
          'w-10 h-10 text-xl shadow-sm',
        )}
        style={{
          background: 'linear-gradient(135deg, #0066CC, #004C99)',
        }}
      >
        A
      </div>
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            'font-bold text-[17px] tracking-tight',
            isLight ? 'text-white' : 'text-[#000000]',
          )}
        >
          ALO Education
        </span>
        <span className={cn('text-xs tracking-wide', isLight ? 'text-white/60' : 'text-[#555555]')}>
          Study Abroad
        </span>
      </div>
    </div>
  );
}

// ─── Dropdown (Desktop) ─────────────────────────────────────────────────────

function DesktopDropdown({
  item,
  isOpen,
  onToggle,
  onNavigate,
}: {
  item: NavItem;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (page: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) onToggle();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1 py-2 text-sm font-medium transition-colors',
          isOpen ? 'text-[#0066CC]' : 'text-[#000000] hover:text-[#0066CC]',
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          'absolute top-full left-0 pt-2 transition-all duration-200',
          isOpen
            ? 'pointer-events-auto opacity-100 translate-y-0'
            : 'pointer-events-none opacity-0 -translate-y-2',
        )}
      >
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-56 overflow-hidden">
          {item.children?.map((child) => (
            <button
              key={child.page}
              onClick={() => onNavigate(child.page)}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#000000] hover:bg-blue-50 hover:text-[#0066CC] transition-colors text-left"
            >
              <span className="text-[#555555]">{child.icon}</span>
              {child.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Sheet Content ────────────────────────────────────────────────────

function MobileSheetNav({
  onNavigate,
  onLeadOpen,
}: {
  onNavigate: (page: string) => void;
  onLeadOpen: () => void;
}) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-0 pt-6 pb-4">
        <SheetTitle>
          <AloLogo />
        </SheetTitle>
      </SheetHeader>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => {
          const isExpanded = expandedItem === item.page;
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.page}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : item.page)}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-[#000000] hover:bg-gray-50 rounded-lg transition-colors min-h-[48px]"
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-[#555555] transition-transform duration-200',
                        isExpanded && 'rotate-180',
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0',
                    )}
                  >
                    <div className="pl-4 pb-1">
                      {item.children!.map((child) => (
                        <button
                          key={child.page}
                          onClick={() => onNavigate(child.page)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#555555] hover:text-[#0066CC] hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
                        >
                          {child.icon}
                          {child.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => onNavigate(item.page)}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-[#000000] hover:bg-gray-50 rounded-lg transition-colors min-h-[48px]"
                >
                  {item.icon && <span className="mr-3 text-[#555555]">{item.icon}</span>}
                  {item.label}
                </button>
              )}
            </div>
          );
        })}
      </nav>

      {/* CTA button at bottom */}
      <SheetFooter className="px-0 pb-6 pt-4 border-t border-gray-100">
        <Button
          onClick={onLeadOpen}
          className="w-full h-12 rounded-xl font-semibold text-base"
          style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
        >
          Talk to an Expert
        </Button>
      </SheetFooter>
    </div>
  );
}

// ─── WhatsApp FAB ─────────────────────────────────────────────────────────────

function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/8801700000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'flex items-center justify-center w-14 h-14 rounded-full',
        'shadow-lg hover:shadow-xl transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'md:hidden',
      )}
      style={{ backgroundColor: '#25D366' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="w-7 h-7"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

// ─── Main Navbar ─────────────────────────────────────────────────────────────

export function NewNavbar({ onNavigate, onLeadOpen }: NewNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Scroll detection ──
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Dropdown close on outside click ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownEnter = useCallback((page: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(page);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
            : 'bg-white',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            {/* ── Left: Logo ── */}
            <button
              onClick={() => onNavigate('home')}
              className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] rounded-lg p-1"
              aria-label="ALO Education Home"
            >
              <AloLogo />
            </button>

            {/* ── Center: Desktop Navigation ── */}
            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label="Main navigation"
            >
              {NAV_ITEMS.map((item) => {
                const hasChildren = item.children && item.children.length > 0;

                if (hasChildren) {
                  return (
                    <div
                      key={item.page}
                      ref={dropdownRef}
                      className="relative"
                      onMouseEnter={() => handleDropdownEnter(item.page)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <button
                        className={cn(
                          'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                          openDropdown === item.page
                            ? 'text-[#0066CC]'
                            : 'text-[#000000] hover:text-[#0066CC]',
                        )}
                        aria-expanded={openDropdown === item.page}
                        aria-haspopup="true"
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 transition-transform duration-200',
                            openDropdown === item.page && 'rotate-180',
                          )}
                        />
                      </button>

                      {/* Dropdown panel */}
                      <div
                        className={cn(
                          'absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200',
                          openDropdown === item.page
                            ? 'pointer-events-auto opacity-100 translate-y-0'
                            : 'pointer-events-none opacity-0 -translate-y-2',
                        )}
                      >
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-56 overflow-hidden">
                          {item.children!.map((child) => (
                            <button
                              key={child.page}
                              onClick={() => {
                                onNavigate(child.page);
                                setOpenDropdown(null);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#000000] hover:bg-blue-50 hover:text-[#0066CC] transition-colors text-left"
                            >
                              <span className="text-[#555555]">{child.icon}</span>
                              {child.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.page}
                    onClick={() => onNavigate(item.page)}
                    className={cn(
                      'relative px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      'text-[#000000] hover:text-[#0066CC]',
                      'after:absolute after:bottom-1 after:left-3 after:right-3 after:h-[2px]',
                      'after:scale-x-0 after:origin-left after:rounded-full',
                      'after:bg-[#F37021] after:transition-transform after:duration-200',
                      'hover:after:scale-x-100',
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* ── Right: CTA + Mobile Menu ── */}
            <div className="flex items-center gap-3">
              {/* Desktop CTA */}
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'hidden md:flex h-12 px-6 rounded-xl font-semibold text-sm',
                  'transition-all duration-200',
                  'hover:shadow-lg hover:shadow-orange-200/50',
                )}
                style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
              >
                Talk to an Expert
              </Button>

              {/* Mobile hamburger */}
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      'flex lg:hidden items-center justify-center',
                      'w-11 h-11 rounded-lg',
                      'text-[#000000] hover:bg-gray-100 transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]',
                    )}
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-sm p-0">
                  <MobileSheetNav onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-[72px]" />

      {/* WhatsApp FAB - mobile only */}
      <WhatsAppFab />
    </>
  );
}
