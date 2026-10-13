"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, FolderKanban, FileText, CheckSquare,
  ShieldCheck, FileBarChart, CalendarClock, StickyNote, Image as ImageIcon,
  Newspaper, Search, BarChart3, ScrollText, Bell, Bot, UserCog, Settings,
  LogOut, Menu, X, ChevronRight,
  Globe2, MapPin, BookOpen, Award, Library, UserSquare2, Microscope,
  FlaskConical, CalendarDays, GraduationCap, ClipboardList, HelpCircle, Mail,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "./lib";

type SessionInfo = {
  userId: string;
  email: string;
  name: string;
  role: string;
  expiresAt: number;
};

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/admin/contacts", label: "Contacts", icon: Users },
      { href: "/admin/companies", label: "Companies", icon: Building2 },
      { href: "/admin/meetings", label: "Meetings", icon: CalendarClock },
      { href: "/admin/notes", label: "Notes", icon: StickyNote },
      { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/articles", label: "Articles", icon: Newspaper },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/case-studies", label: "Case Studies", icon: FileText },
      { href: "/admin/media", label: "Media", icon: ImageIcon },
      { href: "/admin/documents", label: "Documents", icon: FileBarChart },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    label: "Higher Study",
    items: [
      { href: "/admin/higher-study/countries", label: "Countries", icon: Globe2 },
      { href: "/admin/higher-study/cities", label: "Cities", icon: MapPin },
      { href: "/admin/higher-study/universities", label: "Universities", icon: Building2 },
      { href: "/admin/higher-study/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/higher-study/scholarships", label: "Scholarships", icon: Award },
      { href: "/admin/higher-study/subjects", label: "Subjects", icon: Library },
      { href: "/admin/higher-study/intakes", label: "Intakes", icon: CalendarClock },
      { href: "/admin/higher-study/supervisors", label: "Supervisors", icon: UserSquare2 },
      { href: "/admin/higher-study/research-areas", label: "Research Areas", icon: Microscope },
      { href: "/admin/higher-study/research-projects", label: "Research Projects", icon: FlaskConical },
      { href: "/admin/higher-study/resources", label: "Resources", icon: FileText },
      { href: "/admin/higher-study/student-stories", label: "Student Stories", icon: Users },
      { href: "/admin/higher-study/events", label: "Events", icon: CalendarDays },
    ],
  },
  {
    label: "English Learning",
    items: [
      { href: "/admin/english-learning/courses", label: "Courses", icon: GraduationCap },
      { href: "/admin/english-learning/lessons", label: "Lessons", icon: BookOpen },
      { href: "/admin/english-learning/practice-tests", label: "Practice Tests", icon: ClipboardList },
      { href: "/admin/english-learning/questions", label: "Questions", icon: HelpCircle },
      { href: "/admin/english-learning/tutors", label: "Tutors", icon: UserSquare2 },
      { href: "/admin/english-learning/resources", label: "Resources", icon: FileText },
    ],
  },
  {
    label: "AI & Insights",
    items: [
      { href: "/admin/ai-assistant", label: "AI Assistant", icon: Bot },
      { href: "/admin/whatsapp-ai", label: "WhatsApp AI", icon: MessageCircle },
      { href: "/admin/approvals", label: "Approvals", icon: ShieldCheck },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/seo", label: "SEO", icon: Search },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/roles", label: "Roles & Perms", icon: UserCog },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const env = await adminFetch<{ session?: SessionInfo }>("/api/v1/admin/dashboard");
        if (!cancelled && env.data.session) {
          setSession(env.data.session);
        } else if (!cancelled) {
          router.replace("/admin/login");
          return;
        }
      } catch {
        if (!cancelled) router.replace("/admin/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    router.replace("/admin/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card fixed inset-y-0 z-40">
        <SidebarContent pathname={pathname} session={session} onLogout={logout} />
      </aside>

      {/* Sidebar (mobile) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card border-r flex flex-col shadow-2xl">
            <button
              className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent pathname={pathname} session={session} onLogout={logout} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b h-14 flex items-center gap-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <nav className="flex items-center text-sm text-muted-foreground gap-1" aria-label="Breadcrumb">
            <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
            {pathname !== "/admin" && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground capitalize">
                  {pathname.split("/").pop()?.replace(/-/g, " ")}
                </span>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {session?.email} · <span className="font-medium text-foreground">{session?.role}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  session,
  onLogout,
}: {
  pathname: string;
  session: SessionInfo | null;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Link href="/admin" className="block rounded-md p-1 -m-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
          <div className="font-bold text-lg tracking-tight">Alaminn.info</div>
          <div className="text-xs text-muted-foreground">Command Center</div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 max-h-[calc(100vh-9rem)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent" aria-label="Admin navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/item relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                  )}
                >
                  {/* Active indicator: left accent bar */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-orange-400"
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      active ? "scale-110" : "group-hover/item:scale-110",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t p-3">
        <div className="text-xs text-muted-foreground mb-2 px-1 truncate">
          {session?.name} · {session?.role}
        </div>
        <Button variant="outline" size="sm" className="w-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
