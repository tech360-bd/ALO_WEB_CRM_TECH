'use client'

import { useState, useEffect, ComponentType } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSession, clearSession } from '@/lib/session'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu, LogOut, Home, ChevronDown, Bell, LifeBuoy,
  LayoutDashboard, FileText, Network, Building2, Send, Settings,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

const appManagerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/application-manager/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Application Pipeline',
    items: [
      { label: 'Direct Applications', href: '/application-manager/direct-applications', icon: Send },
      { label: 'Partner Applications', href: '/application-manager/partner-applications', icon: FileText },
      { label: 'B2B Applications', href: '/application-manager/b2b-applications', icon: Building2 },
    ],
  },
  {
    title: 'Network & Queue',
    items: [
      { label: 'B2B Providers', href: '/application-manager/providers', icon: Network },
      { label: 'Submission Queue', href: '/application-manager/submission-queue', icon: Send },
    ],
  },
]

export default function ApplicationManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const session = getSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!session) {
      router.replace('/')
    }
  }, [session, router])

  if (!session) return null

  const userName = session.user.name || 'Application Manager'
  const initials = userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'AM'
  const roleLabel = session.roles[0]?.displayName || 'Application Manager'

  function handleLogout() {
    clearSession()
    router.push('/')
  }

  const sidebar = (
    <nav className="flex flex-col gap-6 px-3 py-4 h-full overflow-y-auto">
      <div className="px-3 py-2 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E8501A] to-[#0057B8] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            ALO
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-[#0f172a]">ALO App Manager</span>
            <span className="text-[10px] uppercase tracking-wider text-[#E8501A] font-semibold">Operations</span>
          </div>
        </Link>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {appManagerNav.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-[#0057B8] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0057B8]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-slate-100">
        <Link href="/crm/settings" className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#0057B8] font-medium">
          <LifeBuoy className="h-3.5 w-3.5" />
          Help & Support
        </Link>
      </div>
    </nav>
  )

  const pageTitle = appManagerNav
    .flatMap((g) => g.items)
    .find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))?.label || 'Application Manager'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/95 backdrop-blur flex items-center px-4 lg:px-6 gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {sidebar}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[#0f172a] truncate">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E8501A]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 h-12">
                <Avatar className="h-8 w-8 border border-slate-200">
                  <AvatarFallback className="bg-[#E8501A] text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold text-[#0f172a]">{userName}</span>
                  <span className="text-[10px] text-slate-500">{roleLabel}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/crm/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" /> Back to Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex w-64 shrink-0 border-r border-slate-200 bg-white flex-col">
          {sidebar}
        </aside>
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>

      <footer className="mt-auto bg-[#0F172A] text-white py-4 px-4 lg:px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p className="text-white/70">
            © {new Date().getFullYear()} ALO Education. Application Manager Portal.
          </p>
          <p className="text-white/50">
            Confidential — {session.user.name}
          </p>
        </div>
      </footer>
    </div>
  )
}
