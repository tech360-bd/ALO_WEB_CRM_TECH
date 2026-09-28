'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Award,
  User, Map, CreditCard, LogOut, Menu, X, Bell, ChevronRight,
  BookOpen, GraduationCap, Shield
} from 'lucide-react';

// ============================================================
// Student Auth Context
// ============================================================
interface StudentUser {
  id: string;
  studentId: string; // AE-YYYYXXXXXX
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
  { href: '/student/applications', label: 'Applications', icon: FolderOpen },
  { href: '/student/documents', label: 'Documents', icon: FileText },
  { href: '/student/offers', label: 'Offers', icon: Award },
  { href: '/student/interview', label: 'Interview Prep', icon: BookOpen },
  { href: '/student/visa', label: 'Visa Readiness', icon: Shield },
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

  // Login page is exempt from auth check
  const isLoginPage = pathname === '/student/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const savedStudent = localStorage.getItem('student_user');

    try {
      if (savedStudent) setStudent(JSON.parse(savedStudent));
      setToken(null);
      // The HttpOnly session cookie is sent automatically; never read a
      // session token from JavaScript or localStorage.
      fetch('/api/student/auth/me', { credentials: 'include' }).then(async (res) => {
        if (!res.ok) {
          // Token invalid → logout
          localStorage.removeItem('student_token');
          localStorage.removeItem('student_user');
          router.replace('/student/login');
          return;
        }
        const data = await res.json();
        if (data.success && data.student) {
          setStudent(data.student);
          localStorage.setItem('student_user', JSON.stringify(data.student));
          setUnreadCount(data.unreadMessages || 0);
        }
      }).catch(() => {
        // Network error — use cached data
      });
    } catch {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      router.replace('/student/login');
    }
  }, [pathname, isLoginPage, router]);

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
  if (isLoginPage) {
    return (
      <StudentAuthContext.Provider value={{ student: null, token: null, loading: false, logout }}>
        {children}
      </StudentAuthContext.Provider>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0057B8] to-[#003d82] flex items-center justify-center animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400 text-sm">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <StudentAuthContext.Provider value={{ student, token, loading, logout }}>
      <div className="min-h-screen bg-[#0a0f1e] flex">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed left-0 top-0 h-full w-64 bg-[#0d1526] border-r border-white/5 z-40 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:block
        `}>
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <Link href="/student/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Student Portal</p>
                <p className="text-[#0057B8] text-xs font-medium">ALO Education</p>
              </div>
            </Link>
          </div>

          {/* Student ID Card */}
          {student && (
            <div className="p-4 mx-3 mt-4 bg-gradient-to-br from-[#0057B8]/20 to-[#E8501A]/10 rounded-xl border border-[#0057B8]/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0057B8] to-[#003d82] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{student.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{student.name}</p>
                  <p className="text-[#60a5fa] text-xs font-mono">{student.studentId}</p>
                </div>
              </div>
              {student.profileComplete < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Profile Complete</span>
                    <span>{student.profileComplete}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-[#0057B8] to-[#E8501A] rounded-full transition-all"
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
                      ? 'bg-[#0057B8] text-white shadow-lg shadow-[#0057B8]/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <span>{item.label}</span>
                  {item.href === '/student/messages' && unreadCount > 0 && (
                    <span className="ml-auto bg-[#E8501A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-20 bg-[#0d1526]/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 lg:ml-auto">
              <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#E8501A] rounded-full" />
                )}
              </button>
              {student && (
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0057B8] to-[#003d82] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{student.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white text-sm font-medium leading-none">{student.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{student.studentId}</p>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </StudentAuthContext.Provider>
  );
}
