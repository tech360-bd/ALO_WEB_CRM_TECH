'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import PortalFooter from '@/components/portals/PortalFooter';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Award,
  User, Map, CreditCard, LogOut, Menu, X, Bell, ChevronRight,
  BookOpen, GraduationCap, Shield, ListChecks, Bookmark
} from 'lucide-react';

// ============================================================
// Student Auth Context
// ============================================================
interface StudentUser {
  id: string;
  studentId: string; // New IDs: AE-YYYYNNNN; legacy IDs remain valid
  name: string;
  email: string;
  phone: string;
  profileComplete: number;
  journeyStage: string;
  counselorName?: string;
}

interface StudentAuthContextType {
  student: StudentUser | null;
  token: string | null;
  loading: boolean;
  logout: () => void;
}

export const StudentAuthContext = createContext<StudentAuthContextType>({
  student: null, token: null, loading: true, logout: () => {}
});

export const useStudentAuth = () => useContext(StudentAuthContext);

// ============================================================
// Nav items
// ============================================================
const NAV_ITEMS = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/journey', label: 'My Journey', icon: Map },
  { href: '/student/tasks', label: 'My Tasks', icon: ListChecks },
  { href: '/student/applications', label: 'Applications', icon: FolderOpen },
  { href: '/student/documents', label: 'Documents', icon: FileText },
  { href: '/student/offers', label: 'Offers', icon: Award },
  { href: '/student/saved', label: 'Saved Courses', icon: Bookmark },
  { href: '/student/phd', label: 'PhD Builder', icon: GraduationCap },
  { href: '/student/sop', label: 'Statement of Purpose', icon: FileText },
  { href: '/student/interview', label: 'Interview Prep', icon: BookOpen },
  { href: '/student/visa', label: 'Visa Readiness', icon: Shield },
  { href: '/student/finance', label: 'Finance', icon: CreditCard },
  { href: '/student/messages', label: 'Messages', icon: MessageSquare },
  { href: '/student/profile', label: 'My Profile', icon: User },
];

// ============================================================
// Layout Component
// ============================================================
export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Public student pages (sign-in and registration) are exempt from the portal
  // session check. Without this, anonymous visitors to /student/register were
  // redirected to /student/login.
  const isPublicStudentPage = pathname === '/student/login' || pathname === '/student/register';

  useEffect(() => {
    if (isPublicStudentPage) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setStudent(null);
    setToken(null);
    // Cached profile is not evidence of an authenticated session. Fail closed
    // on HTTP errors AND network failures; never display another cached user.
    fetch('/api/student/auth/me', { credentials: 'include' }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.success || !data.student) throw new Error('Invalid student session');
      if (cancelled) return;
      setStudent(data.student);
      localStorage.setItem('student_user', JSON.stringify(data.student));
      setUnreadCount(data.unreadMessages || 0);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      setStudent(null);
      router.replace('/student/login');
    });
    return () => { cancelled = true; };
  }, [pathname, isPublicStudentPage, router]);

  const logout = async () => {
    await fetch('/api/student/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    router.push('/student/login');
  };

  // Show login page without auth wrapper
  if (isPublicStudentPage) {
    return (
      <StudentAuthContext.Provider value={{ student: null, token: null, loading: false, logout }}>
        {children}
      </StudentAuthContext.Provider>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--alo-page)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] flex items-center justify-center animate-pulse">
            <GraduationCap className="w-8 h-8 text-[var(--alo-text)]" />
          </div>
          <p className="text-[var(--alo-text-muted)] text-sm">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <StudentAuthContext.Provider value={{ student, token, loading, logout }}>
      <div className="min-h-screen bg-[var(--alo-page)] flex">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-[var(--alo-navy)]/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed left-0 top-0 h-full w-64 bg-[var(--alo-page)] border-r border-[var(--alo-border)] z-40 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:block
        `}>
          {/* Logo */}
          <div className="p-6 border-b border-[var(--alo-border)]">
            <Link href="/student/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-cta)] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[var(--alo-text)]" />
              </div>
              <div>
                <p className="text-[var(--alo-text)] font-bold text-sm">Student Portal</p>
                <p className="text-[var(--alo-brand)] text-xs font-medium">ALO Education</p>
              </div>
            </Link>
          </div>

          {/* Student ID Card */}
          {student && (
            <div className="p-4 mx-3 mt-4 bg-gradient-to-br from-[var(--alo-brand)]/20 to-[var(--alo-cta)]/10 rounded-xl border border-[var(--alo-brand)]/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--alo-text)] text-sm font-bold">{student.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--alo-text)] text-sm font-semibold truncate">{student.name}</p>
                  <p className="text-[#60a5fa] text-xs font-mono">{student.studentId}</p>
                </div>
              </div>
              {student.profileComplete < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-[var(--alo-text-muted)] mb-1">
                    <span>Profile Complete</span>
                    <span>{student.profileComplete}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--alo-surface-muted)] rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-cta)] rounded-full transition-all"
                      style={{ width: `${student.profileComplete}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="p-3 mt-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                    ${isActive
                      ? 'bg-[var(--alo-brand)] text-[var(--alo-text)] shadow-lg shadow-alo-brand/20'
                      : 'text-[var(--alo-text-muted)] hover:text-[var(--alo-text)] hover:bg-[var(--alo-page)]'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[var(--alo-text)]' : 'text-[var(--alo-text-muted)] group-hover:text-[var(--alo-placeholder)]'}`} />
                  <span>{item.label}</span>
                  {item.href === '/student/messages' && unreadCount > 0 && (
                    <span className="ml-auto bg-[var(--alo-cta-solid)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--alo-border)]">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--alo-text-muted)] hover:text-crm-danger-text hover:bg-[var(--alo-surface-muted)] transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-20 bg-[var(--alo-page)]/90 backdrop-blur border-b border-[var(--alo-border)] px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-[var(--alo-text-muted)] hover:text-[var(--alo-text)] hover:bg-[var(--alo-page)]"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 lg:ml-auto">
              <Link href="/student/messages" aria-label={unreadCount > 0 ? `Messages, ${unreadCount} unread` : 'Messages'} className="relative p-2 rounded-lg text-[var(--alo-text-muted)] hover:text-[var(--alo-text)] hover:bg-[var(--alo-page)] transition-all">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--alo-cta)] rounded-full" />
                )}
              </Link>
              {student && (
                <div className="flex items-center gap-2 pl-2 border-l border-[var(--alo-border)]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] flex items-center justify-center">
                    <span className="text-[var(--alo-text)] text-sm font-bold">{student.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[var(--alo-text)] text-sm font-medium leading-none">{student.name}</p>
                    <p className="text-[var(--alo-text-muted)] text-xs mt-0.5">{student.studentId}</p>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
          {/* General ALO footer + partner block for B2B-linked students. */}
          <PortalFooter scope="student" />
        </div>
      </div>
    </StudentAuthContext.Provider>
  );
}
