import { create } from 'zustand'

export type UserRole = 'super_admin' | 'admin' | 'branch_manager' | 'country_manager' | 'office_manager' | 'counselor' | 'junior_counselor' | 'application_team' | 'visa_officer' | 'finance' | 'marketing_manager' | 'marketing_executive' | 'hr_manager' | 'employee' | 'partner_super_admin' | 'partner_staff' | 'student' | 'read_only_auditor'

export interface Permission {
  module: string
  action: string
  granted: boolean
}

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: UserRole
  userType: string
  referenceId?: string
  profilePhoto?: string
  forcePasswordChange?: boolean
  permissions?: Permission[]
}

export type AppView = 
  // Public
  | 'home' | 'about' | 'study-uk' | 'study-usa' | 'study-canada' | 'study-australia' | 'study-europe' | 'study-malaysia'
  | 'universities' | 'university-detail' | 'courses' | 'course-detail' | 'scholarships'
  | 'services' | 'visa-guidance' | 'ukvi-interview' | 'ielts-prep'
  | 'success-stories' | 'blog' | 'blog-detail' | 'events'
  | 'free-consultation' | 'contact' | 'faq'
  | 'privacy-policy' | 'terms' | 'partner-with-alo'
  | 'cookie-policy' | 'refund-policy' | 'communication-policy' | 'data-usage'
  | 'student-register' | 'partner-register'
  | 'login' | 'portal-selector'
  // Student
  | 'student-dashboard' | 'student-profile' | 'student-applications' | 'student-documents'
  | 'student-visa' | 'student-messages' | 'student-whatsapp' | 'student-appointments'
  | 'student-payments' | 'student-support' | 'student-scholarships' | 'student-settings'
  | 'student-guardian' | 'student-education' | 'student-passport' | 'student-eligibility'
  | 'student-sop' | 'student-cv' | 'student-interview-coach' | 'student-compare'
  | 'student-favorites' | 'student-notifications'
  // Partner
  | 'partner-dashboard' | 'partner-students' | 'partner-submit-student' | 'partner-applications'
  | 'partner-documents' | 'partner-commissions' | 'partner-staff' | 'partner-whatsapp'
  | 'partner-reports' | 'partner-settings' | 'partner-messages'
  | 'partner-agreements' | 'partner-marketing' | 'partner-invoices' | 'partner-support'
  // Employee
  | 'employee-dashboard' | 'employee-profile' | 'employee-documents' | 'employee-attendance'
  | 'employee-leave' | 'employee-salary' | 'employee-tasks' | 'employee-whatsapp'
  | 'employee-performance' | 'employee-settings'
  | 'employee-students' | 'employee-leads' | 'employee-calendar' | 'employee-email-logs'
  | 'employee-messages' | 'employee-support'
  // CRM Admin
  | 'crm-dashboard' | 'crm-leads' | 'crm-students' | 'crm-partners' | 'crm-employees'
  | 'crm-hr' | 'crm-attendance' | 'crm-payroll' | 'crm-applications'
  | 'crm-universities' | 'crm-courses' | 'crm-documents' | 'crm-visa'
  | 'crm-finance' | 'crm-commissions' | 'crm-whatsapp' | 'crm-marketing'
  | 'crm-social-media' | 'crm-ai-command' | 'crm-reports' | 'crm-settings'
  | 'crm-audit-logs' | 'crm-blog' | 'crm-cms' | 'crm-content-editor'
  // CMS System
  | 'crm-cms-pages' | 'crm-cms-blog' | 'crm-cms-media' | 'crm-cms-faq' | 'crm-cms-testimonials'
  // Reports & Analytics
  | 'crm-reports-dashboard'
  // AI Command Center
  | 'crm-ai-agents' | 'crm-ai-knowledge' | 'crm-ai-logs' | 'crm-ai-prompts' | 'crm-ai-research' | 'crm-ai-settings'
  // Finance & Commission
  | 'crm-commission-management' | 'crm-commission-claims'
  | 'crm-invoices' | 'crm-expenses' | 'crm-finance-reports'
  // Specialized
  | 'visa-dashboard' | 'finance-dashboard' | 'hr-dashboard' | 'marketing-dashboard'
  | 'application-dashboard' | 'counselor-dashboard'
  // Interview & Enhanced Marketing
  | 'crm-interviews' | 'crm-marketing-studio'

interface AppState {
  currentUser: CurrentUser | null
  authToken: string | null
  currentView: AppView
  viewParams: Record<string, string>
  sidebarOpen: boolean
  isLoading: boolean
  notifications: Array<{ id: string; title: string; message: string; type: string; isRead: boolean }>
  
  setCurrentUser: (user: CurrentUser | null) => void
  setAuthToken: (token: string | null) => void
  setCurrentView: (view: AppView, params?: Record<string, string>) => void
  setSidebarOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  authToken: null,
  currentView: 'home',
  viewParams: {},
  sidebarOpen: true,
  isLoading: false,
  notifications: [],

  setCurrentUser: (user) => set({ currentUser: user }),
  setAuthToken: (token) => set({ authToken: token }),
  setCurrentView: (view, params = {}) => set({ currentView: view, viewParams: params }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('alo_user')
      localStorage.removeItem('alo_token')
    }
    set({ currentUser: null, authToken: null, currentView: 'home', viewParams: {} })
  },
}))

export function getDashboardForRole(role: UserRole): AppView {
  switch (role) {
    case 'student': return 'student-dashboard'
    case 'partner_super_admin': case 'partner_staff': return 'partner-dashboard'
    case 'super_admin': case 'admin': return 'crm-dashboard'
    case 'counselor': case 'junior_counselor': return 'counselor-dashboard'
    case 'application_team': return 'application-dashboard'
    case 'visa_officer': return 'visa-dashboard'
    case 'finance': return 'finance-dashboard'
    case 'marketing_manager': case 'marketing_executive': return 'marketing-dashboard'
    case 'hr_manager': return 'hr-dashboard'
    case 'employee': return 'employee-dashboard'
    case 'branch_manager': case 'country_manager': case 'office_manager': return 'crm-dashboard'
    case 'read_only_auditor': return 'crm-dashboard'
    default: return 'crm-dashboard'
  }
}

export function getViewLayout(view: AppView): 'public' | 'student' | 'partner' | 'employee' | 'admin' {
  if (view.startsWith('student-')) return 'student'
  if (view.startsWith('partner-')) return 'partner'
  if (view.startsWith('employee-')) return 'employee'
  if (view.startsWith('crm-') || ['visa-dashboard', 'finance-dashboard', 'hr-dashboard', 'marketing-dashboard', 'application-dashboard', 'counselor-dashboard'].includes(view)) return 'admin'
  return 'public'
}
