'use client'

import React from 'react'
import { useAppStore, getDashboardForRole, type AppView } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  User,
  FileText,
  CreditCard,
  MessageSquare,
  CalendarDays,
  HelpCircle,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  GraduationCap,
  Globe,
  Shield,
  Wallet,
  BarChart3,
  Megaphone,
  Smartphone,
  Brain,
  ClipboardList,
  Briefcase,
  Clock,
  DollarSign,
  Target,
  FileCheck,
  Plane,
  Home,
  Palette,
  BookOpen,
  Code,
  Microscope,
  Star,
  Image as ImageIcon,
} from 'lucide-react'

interface SidebarItem {
  label: string
  view: AppView
  icon: React.ReactNode
}

function getSidebarItems(role: string): SidebarItem[] {
  switch (role) {
    case 'student':
      return [
        { label: 'Dashboard', view: 'student-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'My Profile', view: 'student-profile', icon: <User className="h-4 w-4" /> },
        { label: 'Applications', view: 'student-applications', icon: <FileText className="h-4 w-4" /> },
        { label: 'Documents', view: 'student-documents', icon: <FileCheck className="h-4 w-4" /> },
        { label: 'Visa Status', view: 'student-visa', icon: <Plane className="h-4 w-4" /> },
        { label: 'Messages', view: 'student-messages', icon: <MessageSquare className="h-4 w-4" /> },
        { label: 'Appointments', view: 'student-appointments', icon: <CalendarDays className="h-4 w-4" /> },
        { label: 'Payments', view: 'student-payments', icon: <CreditCard className="h-4 w-4" /> },
        { label: 'Support', view: 'student-support', icon: <HelpCircle className="h-4 w-4" /> },
        { label: 'Settings', view: 'student-settings', icon: <Settings className="h-4 w-4" /> },
      ]
    case 'partner_super_admin':
    case 'partner_staff':
      return [
        { label: 'Dashboard', view: 'partner-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Students', view: 'partner-students', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Submit Student', view: 'partner-submit-student', icon: <UserPlus className="h-4 w-4" /> },
        { label: 'Applications', view: 'partner-applications', icon: <FileText className="h-4 w-4" /> },
        { label: 'Documents', view: 'partner-documents', icon: <FileCheck className="h-4 w-4" /> },
        { label: 'Commissions', view: 'partner-commissions', icon: <Wallet className="h-4 w-4" /> },
        { label: 'Staff', view: 'partner-staff', icon: <Users className="h-4 w-4" /> },
        { label: 'Messages', view: 'partner-messages', icon: <MessageSquare className="h-4 w-4" /> },
        { label: 'Reports', view: 'partner-reports', icon: <BarChart3 className="h-4 w-4" /> },
        { label: 'Settings', view: 'partner-settings', icon: <Settings className="h-4 w-4" /> },
      ]
    case 'super_admin':
    case 'admin':
      return [
        { label: 'Dashboard', view: 'crm-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Leads', view: 'crm-leads', icon: <Target className="h-4 w-4" /> },
        { label: 'Students', view: 'crm-students', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Partners', view: 'crm-partners', icon: <Building2 className="h-4 w-4" /> },
        { label: 'Employees', view: 'crm-employees', icon: <Users className="h-4 w-4" /> },
        { label: 'HR', view: 'crm-hr', icon: <Briefcase className="h-4 w-4" /> },
        { label: 'Attendance', view: 'crm-attendance', icon: <Clock className="h-4 w-4" /> },
        { label: 'Applications', view: 'crm-applications', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'Universities', view: 'crm-universities', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Visa', view: 'crm-visa', icon: <Shield className="h-4 w-4" /> },
        { label: 'Finance', view: 'crm-finance', icon: <DollarSign className="h-4 w-4" /> },
        { label: 'Commissions', view: 'crm-commissions', icon: <Wallet className="h-4 w-4" /> },
        { label: 'Marketing', view: 'crm-marketing', icon: <Megaphone className="h-4 w-4" /> },
        { label: 'WhatsApp', view: 'crm-whatsapp', icon: <Smartphone className="h-4 w-4" /> },
        { label: 'AI Command', view: 'crm-ai-command', icon: <Brain className="h-4 w-4" /> },
        { label: 'AI Agents', view: 'crm-ai-agents', icon: <Brain className="h-4 w-4" /> },
        { label: 'AI Knowledge', view: 'crm-ai-knowledge', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'AI Logs', view: 'crm-ai-logs', icon: <FileText className="h-4 w-4" /> },
        { label: 'AI Prompts', view: 'crm-ai-prompts', icon: <Code className="h-4 w-4" /> },
        { label: 'AI Research', view: 'crm-ai-research', icon: <Microscope className="h-4 w-4" /> },
        { label: 'AI Settings', view: 'crm-ai-settings', icon: <Settings className="h-4 w-4" /> },
        { label: 'Content Editor', view: 'crm-content-editor', icon: <Palette className="h-4 w-4" /> },
        { label: 'Reports', view: 'crm-reports-dashboard', icon: <BarChart3 className="h-4 w-4" /> },
        { label: 'CMS Pages', view: 'crm-cms-pages', icon: <FileText className="h-4 w-4" /> },
        { label: 'Blog Manager', view: 'crm-cms-blog', icon: <Globe className="h-4 w-4" /> },
        { label: 'Media Library', view: 'crm-cms-media', icon: <ImageIcon className="h-4 w-4" /> },
        { label: 'FAQ Manager', view: 'crm-cms-faq', icon: <HelpCircle className="h-4 w-4" /> },
        { label: 'Testimonials', view: 'crm-cms-testimonials', icon: <Star className="h-4 w-4" /> },
        { label: 'Documents', view: 'crm-documents', icon: <FileCheck className="h-4 w-4" /> },
        { label: 'Audit Logs', view: 'crm-audit-logs', icon: <Shield className="h-4 w-4" /> },
        { label: 'Settings', view: 'crm-settings', icon: <Settings className="h-4 w-4" /> },
      ]
    case 'counselor':
    case 'junior_counselor':
      return [
        { label: 'Dashboard', view: 'counselor-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'My Students', view: 'crm-students', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Applications', view: 'crm-applications', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'Universities', view: 'crm-universities', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Messages', view: 'crm-whatsapp', icon: <MessageSquare className="h-4 w-4" /> },
      ]
    case 'visa_officer':
      return [
        { label: 'Dashboard', view: 'visa-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Visa Applications', view: 'crm-visa', icon: <Shield className="h-4 w-4" /> },
        { label: 'Students', view: 'crm-students', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Documents', view: 'crm-documents', icon: <FileCheck className="h-4 w-4" /> },
      ]
    case 'finance':
      return [
        { label: 'Dashboard', view: 'finance-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Payments', view: 'crm-finance', icon: <DollarSign className="h-4 w-4" /> },
        { label: 'Commissions', view: 'crm-commissions', icon: <Wallet className="h-4 w-4" /> },
        { label: 'Reports', view: 'crm-reports-dashboard', icon: <BarChart3 className="h-4 w-4" /> },
      ]
    case 'hr_manager':
      return [
        { label: 'Dashboard', view: 'hr-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Employees', view: 'crm-employees', icon: <Users className="h-4 w-4" /> },
        { label: 'HR', view: 'crm-hr', icon: <Briefcase className="h-4 w-4" /> },
        { label: 'Attendance', view: 'crm-attendance', icon: <Clock className="h-4 w-4" /> },
        { label: 'Payroll', view: 'crm-payroll', icon: <DollarSign className="h-4 w-4" /> },
      ]
    case 'marketing_manager':
    case 'marketing_executive':
      return [
        { label: 'Dashboard', view: 'marketing-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Leads', view: 'crm-leads', icon: <Target className="h-4 w-4" /> },
        { label: 'Marketing', view: 'crm-marketing', icon: <Megaphone className="h-4 w-4" /> },
        { label: 'Content Editor', view: 'crm-content-editor', icon: <Palette className="h-4 w-4" /> },
        { label: 'Social Media', view: 'crm-social-media', icon: <Globe className="h-4 w-4" /> },
        { label: 'Reports', view: 'crm-reports-dashboard', icon: <BarChart3 className="h-4 w-4" /> },
        { label: 'CMS Pages', view: 'crm-cms-pages', icon: <FileText className="h-4 w-4" /> },
        { label: 'Blog Manager', view: 'crm-cms-blog', icon: <Globe className="h-4 w-4" /> },
        { label: 'Media Library', view: 'crm-cms-media', icon: <ImageIcon className="h-4 w-4" /> },
      ]
    case 'application_team':
      return [
        { label: 'Dashboard', view: 'application-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Applications', view: 'crm-applications', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'Universities', view: 'crm-universities', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Documents', view: 'crm-documents', icon: <FileCheck className="h-4 w-4" /> },
      ]
    default:
      return [
        { label: 'Dashboard', view: 'employee-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Profile', view: 'employee-profile', icon: <User className="h-4 w-4" /> },
        { label: 'Documents', view: 'employee-documents', icon: <FileCheck className="h-4 w-4" /> },
        { label: 'Attendance', view: 'employee-attendance', icon: <Clock className="h-4 w-4" /> },
        { label: 'Leave', view: 'employee-leave', icon: <CalendarDays className="h-4 w-4" /> },
        { label: 'Salary', view: 'employee-salary', icon: <DollarSign className="h-4 w-4" /> },
        { label: 'Tasks', view: 'employee-tasks', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'Settings', view: 'employee-settings', icon: <Settings className="h-4 w-4" /> },
      ]
  }
}

function UserPlus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  )
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, currentView, setCurrentView, sidebarOpen, setSidebarOpen, logout } = useAppStore()

  const role = currentUser?.role || 'employee'
  const sidebarItems = getSidebarItems(role)

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: 'Student Portal',
      partner_super_admin: 'Partner Admin',
      partner_staff: 'Partner Staff',
      super_admin: 'Super Admin',
      admin: 'Admin Panel',
      counselor: 'Counselor',
      junior_counselor: 'Junior Counselor',
      visa_officer: 'Visa Officer',
      finance: 'Finance',
      hr_manager: 'HR Manager',
      marketing_manager: 'Marketing Manager',
      marketing_executive: 'Marketing Executive',
      application_team: 'Application Team',
      employee: 'Employee Portal',
    }
    return labels[role] || 'Portal'
  }

  return (
    <div className="min-h-screen flex bg-[#F7F9FC]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-[#1A2332] text-white transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-[68px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 shrink-0">
          {sidebarOpen && (
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 bg-[#F37021] rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold whitespace-nowrap">
                ALO<span className="text-[#F37021]"> Edu</span>
              </span>
            </button>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 bg-[#F37021] rounded-lg flex items-center justify-center mx-auto">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Role Label */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-white/10">
            <span className="text-xs font-semibold text-[#F37021] uppercase tracking-wider">
              {getRoleLabel(role)}
            </span>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {sidebarItems.map((item) => {
            const isActive = currentView === item.view
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-[#F37021] text-white shadow-lg shadow-[#F37021]/25'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${!sidebarOpen ? 'justify-center px-2' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-white/10 p-3 space-y-1 shrink-0">
          <button
            onClick={() => setCurrentView('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all ${
              !sidebarOpen ? 'justify-center px-2' : ''
            }`}
            title={!sidebarOpen ? 'Back to Website' : undefined}
          >
            <Home className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Back to Website</span>}
          </button>
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all ${
              !sidebarOpen ? 'justify-center px-2' : ''
            }`}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-[68px]'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6 gap-4 shrink-0">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students, universities..."
                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex-1 md:flex-none" />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative shrink-0">
                <Bell className="h-5 w-5 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#F37021] text-white text-xs border-0">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <div className="p-3 border-b">
                <span className="font-semibold text-sm">Notifications</span>
              </div>
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">New application submitted</span>
                  <span className="text-xs text-gray-500">2 minutes ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Visa update available</span>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">New partner registered</span>
                  <span className="text-xs text-gray-500">3 hours ago</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#F37021] text-white text-xs font-semibold">
                    {currentUser ? getUserInitials(currentUser.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium text-[#1A2332]">
                    {currentUser?.name || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {currentUser?.role?.replace(/_/g, ' ') || 'Guest'}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setCurrentView(getDashboardForRole(currentUser?.role as Parameters<typeof getDashboardForRole>[0]))}>
                <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
