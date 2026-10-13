'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  X,
  ChevronDown,
  Phone,
  MessageCircle,
  GraduationCap,
  Globe,
  BookOpen,
  Award,
  Brain,
  FileText,
  Info,
  Mail,
  Search,
  SearchX,
  Building2,
  ArrowRight,
  LayoutDashboard,
  Briefcase,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ALO_ORANGE = '#F37021';
const EDU_BLUE = '#0066CC';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; desc?: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Study Abroad',
    href: '#study-abroad',
    icon: <GraduationCap className="h-4 w-4" />,
    children: [
      { label: 'Undergraduate Programs', href: '#undergraduate', desc: "Bachelor's degrees worldwide" },
      { label: 'Postgraduate Programs', href: '#postgraduate', desc: "Master's & PhD pathways" },
      { label: 'Foundation Years', href: '#foundation', desc: 'Pathway to top universities' },
      { label: 'Language Programs', href: '#language', desc: 'IELTS & English preparation' },
      { label: 'Summer Schools', href: '#summer', desc: 'Short-term study experiences' },
      { label: 'Vocational & TAFE', href: '#vocational', desc: 'Career-focused training' },
    ],
  },
  {
    label: 'Countries',
    href: '#countries',
    icon: <Globe className="h-4 w-4" />,
  },
  {
    label: 'Universities',
    href: '#universities',
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    label: 'Courses',
    href: '#courses',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: 'Scholarships',
    href: '#scholarships',
    icon: <Award className="h-4 w-4" />,  
  },
  {
    label: 'AI Tools',
    href: '#ai-tools',
    icon: <Brain className="h-4 w-4" />,
    children: [
      { label: 'UK Education Hub', href: '#uk-education-hub', desc: 'Complete guide to UK study' },
      { label: 'UKVI Compliance', href: '#ukvi-compliance', desc: 'Visa tracking & compliance' },
      { label: 'AI Lead Scoring', href: '#ai-lead-scoring', desc: 'Intelligent lead management' },
      { label: 'n8n Workflows', href: '#n8n-workflows', desc: 'Marketing automation' },
    ],
  },
  {
    label: 'Student Portal',
    href: '#student-portal',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Employee Portal',
    href: '#employee-portal',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    label: 'Blog',
    href: '#blog',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: 'About',
    href: '#about',
    icon: <Info className="h-4 w-4" />,
  },
  {
    label: 'Contact',
    href: '#contact',
    icon: <Mail className="h-4 w-4" />,
  },
];

/* ------------------------------------------------------------------ */
/*  Search Data                                                        */
/* ------------------------------------------------------------------ */

interface SearchItem {
  type: 'university' | 'course' | 'scholarship' | 'country';
  name: string;
  subtitle: string;
  icon: LucideIcon;
}

const SEARCH_DATA: SearchItem[] = [
  { type: 'university', name: 'University of Birmingham', subtitle: 'Birmingham, UK \u00b7 QS 84 \u00b7 240+ courses', icon: Building2 },
  { type: 'university', name: 'Manchester Metropolitan University', subtitle: 'Manchester, UK \u00b7 300+ courses', icon: Building2 },
  { type: 'university', name: 'Aston University', subtitle: 'Birmingham, UK \u00b7 QS 447 \u00b7 180+ courses', icon: Building2 },
  { type: 'university', name: 'University of Kent', subtitle: 'Canterbury, UK \u00b7 QS 336 \u00b7 200+ courses', icon: Building2 },
  { type: 'university', name: 'University of Portsmouth', subtitle: 'Portsmouth, UK \u00b7 QS 501 \u00b7 250+ courses', icon: Building2 },
  { type: 'university', name: 'University of Hertfordshire', subtitle: 'Hatfield, UK \u00b7 QS 601 \u00b7 280+ courses', icon: Building2 },
  { type: 'course', name: 'MSc Data Science', subtitle: 'University of Birmingham \u00b7 \u00a324,000/yr \u00b7 96% match', icon: BookOpen },
  { type: 'course', name: 'MBA', subtitle: 'Manchester Metropolitan University \u00b7 \u00a322,000/yr \u00b7 91% match', icon: BookOpen },
  { type: 'course', name: 'MSc Computing', subtitle: 'University of Kent \u00b7 \u00a319,500/yr \u00b7 89% match', icon: BookOpen },
  { type: 'course', name: 'MSc International Business', subtitle: 'Aston University \u00b7 \u00a321,000/yr \u00b7 93% match', icon: BookOpen },
  { type: 'course', name: 'MSc Data Analytics', subtitle: 'University of Portsmouth \u00b7 \u00a318,000/yr \u00b7 87% match', icon: BookOpen },
  { type: 'course', name: 'MSc Cyber Security', subtitle: 'University of Hertfordshire \u00b7 \u00a320,500/yr \u00b7 90% match', icon: BookOpen },
  { type: 'scholarship', name: 'Global Excellence Scholarship', subtitle: '\u00a35,000 \u00b7 University of Birmingham', icon: Award },
  { type: 'scholarship', name: 'Aston Global Scholarship', subtitle: '\u00a34,000 \u00b7 Aston University', icon: Award },
  { type: 'scholarship', name: "Vice-Chancellor's Scholarship", subtitle: '\u00a36,000 \u00b7 Manchester Metropolitan University', icon: Award },
  { type: 'country', name: 'United Kingdom', subtitle: '180+ universities \u00b7 \u00a312K\u201335K tuition', icon: Globe },
  { type: 'country', name: 'United States', subtitle: '200+ universities \u00b7 $20K\u2013$60K tuition', icon: Globe },
  { type: 'country', name: 'Canada', subtitle: '100+ universities \u00b7 CAD 15K\u2013$35K tuition', icon: Globe },
];

const GROUP_CONFIG: { type: SearchItem['type'] | 'all'; label: string; max: number; icon: LucideIcon }[] = [
  { type: 'university', label: 'Universities', max: 3, icon: Building2 },
  { type: 'course', label: 'Courses', max: 3, icon: BookOpen },
  { type: 'scholarship', label: 'Scholarships', max: 2, icon: Award },
  { type: 'country', label: 'Countries', max: 2, icon: Globe },
];

/* ------------------------------------------------------------------ */
/*  Search helpers                                                     */
/* ------------------------------------------------------------------ */

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="font-bold text-alo-orange">{part}</span>
      : part
  );
}

function filterSearch(query: string): { group: typeof GROUP_CONFIG[number]; items: SearchItem[] }[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: { group: typeof GROUP_CONFIG[number]; items: SearchItem[] }[] = [];

  for (const cfg of GROUP_CONFIG) {
    const matched = SEARCH_DATA
      .filter((item) => item.type === cfg.type && (item.name.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)))
      .slice(0, cfg.max);
    if (matched.length > 0) {
      results.push({ group: cfg, items: matched });
    }
  }
  return results;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/*  Desktop dropdown                                                   */
/* ------------------------------------------------------------------ */

function DesktopDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <a
        href={item.href}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-[#F37021] rounded-lg hover:bg-orange-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-1"
        onClick={(e) => {
          if (item.children) e.preventDefault();
        }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {item.label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </a>

      <AnimatePresence>
        {open && item.children && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-1/2 top-full -translate-x-1/2 z-50 mt-1 w-[280px] origin-top rounded-xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-200/40"
          >
            {item.children.map((child) => (
              <a
                key={child.href}
                href={child.href}
                className="group flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-orange-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-1"
              >
                <span className="text-sm font-medium text-slate-800 group-hover:text-[#F37021] transition-colors">
                  {child.label}
                </span>
                {child.desc && (
                  <span className="text-xs text-slate-500 leading-tight">
                    {child.desc}
                  </span>
                )}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile nav section                                                 */
/* ------------------------------------------------------------------ */

function MobileNavItem({
  item,
  onClose,
  onAiToolsClick,
  onStudentPortalClick,
  onEmployeePortalClick,
}: {
  item: NavItem;
  onClose: () => void;
  onAiToolsClick?: () => void;
  onStudentPortalClick?: () => void;
  onEmployeePortalClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (item.children) {
    return (
      <div className="border-b border-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-inset"
          aria-expanded={expanded}
        >
          <span className="flex items-center gap-3">
            <span className="text-[#F37021]">{item.icon}</span>
            {item.label}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden bg-slate-50/60"
            >
              <div className="px-4 pb-3 space-y-0.5">
                {item.children.map((child) => (
                  <SheetClose asChild key={child.href}>
                    <a
                      href={child.href}
                      onClick={onClose}
                      className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-white hover:text-[#F37021] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-1"
                    >
                      <span className="font-medium">{child.label}</span>
                      {child.desc && (
                        <span className="block text-xs text-slate-400 mt-0.5">
                          {child.desc}
                        </span>
                      )}
                    </a>
                  </SheetClose>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const isAiTools = item.href === '#ai-tools';
  const isStudentPortal = item.href === '#student-portal';
  const isEmployeePortal = item.href === '#employee-portal';

  if (isAiTools && onAiToolsClick) {
    return (
      <SheetClose asChild>
        <button
          onClick={() => { onAiToolsClick(); onClose(); }}
          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50/50 hover:text-[#F37021] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-inset text-left"
        >
          <span className="text-[#F37021]">{item.icon}</span>
          {item.label}
        </button>
      </SheetClose>
    );
  }

  if (isStudentPortal && onStudentPortalClick) {
    return (
      <SheetClose asChild>
        <button
          onClick={() => { onStudentPortalClick(); onClose(); }}
          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50/50 hover:text-[#F37021] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-inset text-left"
        >
          <span className="text-[#F37021]">{item.icon}</span>
          {item.label}
        </button>
      </SheetClose>
    );
  }

  if (isEmployeePortal && onEmployeePortalClick) {
    return (
      <SheetClose asChild>
        <button
          onClick={() => { onEmployeePortalClick(); onClose(); }}
          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50/50 hover:text-[#F37021] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-inset text-left"
        >
          <span className="text-[#F37021]">{item.icon}</span>
          {item.label}
        </button>
      </SheetClose>
    );
  }

  return (
    <SheetClose asChild>
      <a
        href={item.href}
        onClick={onClose}
        className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50/50 hover:text-[#F37021] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-inset"
      >
        <span className="text-[#F37021]">{item.icon}</span>
        {item.label}
      </a>
    </SheetClose>
  );
}

/* ------------------------------------------------------------------ */
/*  Search Dropdown (Desktop)                                           */
/* ------------------------------------------------------------------ */

function SearchDropdown({
  query,
  results,
  activeIndex,
  setActiveIndex,
  totalItems,
  onSelect,
  onSuggestionClick,
}: {
  query: string;
  results: { group: typeof GROUP_CONFIG[number]; items: SearchItem[] }[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  totalItems: number;
  onSelect: (item: SearchItem) => void;
  onSuggestionClick: (text: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[data-search-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  let flatIndex = -1;

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 z-50 mt-2 mx-auto max-w-2xl rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 max-h-96 overflow-y-auto alo-scrollbar"
    >
      {!query.trim() ? (
        /* Empty state — recent search suggestions */
        <div className="px-4 py-6 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500 mb-1">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {[`MSc Data Science`, `Birmingham`, `scholarship`].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-alo-orange/40 hover:bg-orange-50 hover:text-alo-orange"
              >
                “{suggestion}”
              </button>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        /* No results */
        <div className="px-4 py-8 text-center">
          <SearchX className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No results found</p>
          <p className="text-xs text-slate-400 mt-1">Try different keywords</p>
        </div>
      ) : (
        /* Grouped results */
        <div className="py-2">
          {results.map((group) => (
            <div key={group.type}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-4 py-1.5">
                <group.group.icon className="h-3 w-3 text-slate-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.group.label}
                </span>
              </div>
              {/* Items */}
              {group.items.map((item) => {
                flatIndex++;
                const currentIndex = flatIndex;
                const Icon = item.icon;
                const isActive = currentIndex === activeIndex;
                return (
                  <button
                    key={`${item.type}-${item.name}`}
                    data-search-active={isActive}
                    className={`
                      flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${isActive ? 'bg-orange-50/80' : 'hover:bg-slate-50'}
                    `}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                    onClick={() => onSelect(item)}
                  >
                    <div className={
                      `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors
                      ${isActive ? 'bg-alo-orange/10 text-alo-orange' : 'bg-slate-100 text-slate-500'}`
                    }>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-alo-orange' : 'text-slate-800'}`}>
                        {highlightMatch(item.name, query)}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {highlightMatch(item.subtitle, query)}
                      </p>
                    </div>
                    <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? 'text-alo-orange' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Navbar                                                        */
/* ------------------------------------------------------------------ */

export default function Navbar({ onLeadOpen, onAiToolsClick, onStudentPortalClick, onEmployeePortalClick, onAuthOpen, activeSection, onScrollToSection }: { onLeadOpen?: () => void; onAiToolsClick?: () => void; onStudentPortalClick?: () => void; onEmployeePortalClick?: () => void; onAuthOpen?: () => void; activeSection?: string; onScrollToSection?: (id: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchQuery, setSearchQueryRaw] = useState('');
  const setSearchQuery = useCallback((val: string | ((prev: string) => string)) => {
    if (typeof val === 'function') {
      setSearchQueryRaw(val);
    } else {
      setSearchQueryRaw(val);
    }
    setActiveIndex(-1);
  }, []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchResults = useMemo(() => filterSearch(debouncedQuery), [debouncedQuery]);
  const totalResultItems = useMemo(
    () => searchResults.reduce((acc, g) => acc + g.items.length, 0),
    [searchResults]
  );

  /* Scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close search and reset state */
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setActiveIndex(-1);
  }, []);

  /* Close search on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        closeSearch();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [searchOpen]);

  /* Search select handler (declared before keyboard handler) */
  const handleSearchSelect = useCallback((item: SearchItem) => {
    closeSearch();
    // Future: navigation based on item.type
  }, [closeSearch]);

  /* Keyboard navigation */
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalResultItems - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalResultItems - 1));
        return;
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        let idx = -1;
        for (const group of searchResults) {
          for (const item of group.items) {
            idx++;
            if (idx === activeIndex) {
              handleSearchSelect(item);
              return;
            }
          }
        }
      }
    },
    [activeIndex, totalResultItems, searchResults]
  );

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* ---------- Main nav bar ---------- */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300
          ${scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md shadow-slate-200/50 border-b border-slate-200/60'
            : 'bg-white border-b border-transparent'
          }
        `}
        role="banner"
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {/* ---- Logo ---- */}
          <a
            href="/"
            className="flex items-center gap-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-2 rounded-md"
            aria-label="ALO Education home"
          >
            <GraduationCap
              className="h-8 w-8 text-[#F37021]"
              strokeWidth={2.2}
            />
            <span className="text-xl font-bold tracking-tight leading-none select-none">
              <span style={{ color: ALO_ORANGE }}>ALO</span>
              <span className="text-slate-800"> Education</span>
            </span>
          </a>

          {/* ---- Desktop nav links ---- */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              if (item.href === '#ai-tools' && onAiToolsClick) {
                return (
                  <button
                    key={item.label}
                    onClick={onAiToolsClick}
                    className="px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-[#F37021] rounded-lg hover:bg-orange-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-1"
                  >
                    {item.label}
                  </button>
                );
              }
              if (item.href === '#student-portal' && onStudentPortalClick) {
                return (
                  <button
                    key={item.label}
                    onClick={onStudentPortalClick}
                    className="px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-[#F37021] rounded-lg hover:bg-orange-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-1"
                  >
                    {item.label}
                  </button>
                );
              }
              if (item.href === '#employee-portal' && onEmployeePortalClick) {
                return (
                  <button
                    key={item.label}
                    onClick={onEmployeePortalClick}
                    className="px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-[#F37021] rounded-lg hover:bg-orange-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-1"
                  >
                    {item.label}
                  </button>
                );
              }
              if (item.children) {
                return <DesktopDropdown key={item.label} item={item} />;
              }
              const sectionId = item.href.replace('#', '');
              const isScrollTarget = onScrollToSection && ['countries', 'universities', 'courses', 'scholarships', 'blog', 'faq'].includes(sectionId);
              const isActive = activeSection === sectionId;
              if (isScrollTarget) {
                return (
                  <button
                    key={item.label}
                    onClick={() => onScrollToSection(sectionId)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-1 ${isActive ? 'text-[#F37021] bg-orange-50/80 font-semibold' : 'text-slate-700 hover:text-[#F37021] hover:bg-orange-50/60'}`}
                  >
                    {item.label}
                  </button>
                );
              }
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-[#F37021] rounded-lg hover:bg-orange-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37021]/40 focus-visible:ring-offset-1"
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* ---- Desktop right side ---- */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Search button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-[#F37021] hover:bg-orange-50 focus-visible:ring-[#F37021]/40"
              onClick={() => { if (searchOpen) closeSearch(); else setSearchOpen(true); }}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* WhatsApp button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-green-600 hover:bg-green-50 focus-visible:ring-green-500/40"
              aria-label="Contact via WhatsApp"
              asChild
            >
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>

            {/* Sign In */}
            <Button
              variant="ghost"
              className="gap-1.5 font-medium text-sm text-slate-600 hover:text-[#0066CC] hover:bg-blue-50 transition-all duration-200 rounded-lg"
              onClick={onAuthOpen}
            >
              <UserCircle className="h-4 w-4" />
              <span className="hidden xl:inline">Sign In</span>
            </Button>

            {/* Talk to Expert CTA */}
            <Button
              className="
                gap-2 font-semibold text-sm
                bg-[#F37021] text-white
                hover:bg-[#e06818]
                active:bg-[#c85a15]
                shadow-sm shadow-orange-200/50
                transition-all duration-200
                focus-visible:ring-[#F37021]/40
                rounded-lg
              "
              onClick={onLeadOpen}
            >
              <Phone className="h-4 w-4" />
              Talk to Expert
            </Button>
          </div>

          {/* ---- Mobile hamburger ---- */}
          <div className="flex lg:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-green-600 hover:bg-green-50 focus-visible:ring-green-500/40"
              aria-label="Contact via WhatsApp"
              asChild
            >
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-700 hover:bg-orange-50 hover:text-[#F37021] focus-visible:ring-[#F37021]/40"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[300px] sm:w-[340px] p-0 overflow-y-auto"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">ALO Education main navigation</SheetDescription>

                {/* Mobile header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                  <a href="/" className="flex items-center gap-1.5">
                    <GraduationCap
                      className="h-6 w-6 text-[#F37021]"
                      strokeWidth={2.2}
                    />
                    <span className="text-lg font-bold tracking-tight">
                      <span style={{ color: ALO_ORANGE }}>ALO</span>
                      <span className="text-slate-800"> Education</span>
                    </span>
                  </a>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-700 focus-visible:ring-[#F37021]/40"
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>

                {/* Mobile search */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search courses, universities..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-[#F37021]/50 focus:ring-2 focus:ring-[#F37021]/20 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Mobile nav items */}
                <div className="py-2">
                  {NAV_ITEMS.map((item) => (
                    <MobileNavItem
                      key={item.label}
                      item={item}
                      onClose={closeMobile}
                      onAiToolsClick={onAiToolsClick}
                      onStudentPortalClick={onStudentPortalClick}
                      onEmployeePortalClick={onEmployeePortalClick}
                    />
                  ))}
                </div>

                {/* Mobile CTA */}
                <div className="px-4 py-5 space-y-3 border-t border-slate-100">
                  <SheetClose asChild>
                    <Button
                      className="
                        w-full gap-2 font-semibold text-sm
                        bg-[#F37021] text-white
                        hover:bg-[#e06818]
                        active:bg-[#c85a15]
                        shadow-sm shadow-orange-200/50
                        rounded-lg
                        focus-visible:ring-[#F37021]/40
                      "
                      onClick={(e) => {
                        e.preventDefault();
                        onLeadOpen?.();
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      Talk to Expert
                    </Button>
                  </SheetClose>

                  <SheetClose asChild>
                    <button
                      onClick={onAiToolsClick}
                      className="
                        flex items-center justify-center gap-2 w-full rounded-lg
                        border border-[#0066CC]/30 bg-[#0066CC]/5
                        px-4 py-2.5 text-sm font-medium text-[#0066CC]
                        transition-colors hover:bg-[#0066CC]/10 hover:border-[#0066CC]/50
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/40 focus-visible:ring-offset-1
                      "
                    >
                      <Brain className="h-4 w-4" />
                      Try AI Tools
                      <Badge
                        variant="secondary"
                        className="ml-1 bg-[#0066CC]/10 text-[#0066CC] text-[10px] px-1.5 py-0 font-semibold"
                      >
                        NEW
                      </Badge>
                    </button>
                  </SheetClose>

                  <SheetClose asChild>
                    <button
                      onClick={() => { onStudentPortalClick?.(); }}
                      className="
                        flex items-center justify-center gap-2 w-full rounded-lg
                        border border-emerald-500/30 bg-emerald-500/5
                        px-4 py-2.5 text-sm font-medium text-emerald-600
                        transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/50
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-1
                      "
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Student Portal
                      <Badge
                        variant="secondary"
                        className="ml-1 bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0 font-semibold"
                      >
                        NEW
                      </Badge>
                    </button>
                  </SheetClose>

                  <SheetClose asChild>
                    <button
                      onClick={() => { onEmployeePortalClick?.(); }}
                      className="
                        flex items-center justify-center gap-2 w-full rounded-lg
                        border border-blue-500/30 bg-blue-500/5
                        px-4 py-2.5 text-sm font-medium text-blue-600
                        transition-colors hover:bg-blue-500/10 hover:border-blue-500/50
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1
                      "
                    >
                      <Briefcase className="h-4 w-4" />
                      Employee Portal
                      <Badge
                        variant="secondary"
                        className="ml-1 bg-blue-500/10 text-blue-600 text-[10px] px-1.5 py-0 font-semibold"
                      >
                        NEW
                      </Badge>
                    </button>
                  </SheetClose>
                </div>

                {/* Mobile footer info */}
                <div className="px-4 pb-6 pt-2">
                  <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/50 p-4">
                    <p className="text-xs font-semibold text-slate-700 mb-1">
                      Free Consultation
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Get personalized guidance from our expert counselors. No fees, no obligations.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-2">
                        {['bg-orange-300', 'bg-amber-300', 'bg-yellow-300'].map((bg, i) => (
                          <div
                            key={i}
                            className={`h-6 w-6 rounded-full ${bg} border-2 border-white`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Trusted by 10,000+ students
                      </span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        {/* ---- Desktop search bar (collapsible) with dropdown ---- */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              ref={searchContainerRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                <div className="relative">
                  <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    data-search-input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search courses, universities, scholarships, countries..."
                    className="w-full bg-transparent pl-7 pr-10 text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-slate-700"
                    onClick={closeSearch}
                    aria-label="Close search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Search dropdown */}
                {(searchQuery.trim() === '' || searchResults.length > 0 || debouncedQuery.trim() !== '') && (
                  <SearchDropdown
                    query={debouncedQuery}
                    results={searchResults}
                    activeIndex={activeIndex}
                    setActiveIndex={setActiveIndex}
                    totalItems={totalResultItems}
                    onSelect={handleSearchSelect}
                    onSuggestionClick={(text) => { setSearchQuery(text); searchInputRef.current?.focus(); }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---------- Spacer for fixed header ---------- */}
      <div className="h-16" />

      {/* ---------- Mobile floating WhatsApp button ---------- */}
      <div className="fixed bottom-6 right-5 z-40 lg:hidden">
        <motion.a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
          className="
            flex h-14 w-14 items-center justify-center rounded-full
            bg-[#25D366] text-white
            shadow-lg shadow-green-500/30
            transition-all duration-200
            hover:bg-[#20bd5a] hover:shadow-xl hover:shadow-green-500/40
            hover:scale-105 active:scale-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60 focus-visible:ring-offset-2
          "
          aria-label="Chat on WhatsApp"
        >
          <Phone className="h-6 w-6" />
        </motion.a>
      </div>
    </>
  );
}