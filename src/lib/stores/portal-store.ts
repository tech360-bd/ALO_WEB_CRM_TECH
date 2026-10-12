import { create } from 'zustand';

// ============================================================
// ALO EDUCATION — MULTI-PORTAL STORE
// ============================================================

export type PortalUserType = 'STUDENT' | 'PARTNER' | 'EMPLOYEE' | 'MARKETING' | 'MARKETING_MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
export type SelectedPortal = 'student' | 'partner' | 'employee' | 'admin';
export type CrmRole =
  | 'super_admin' | 'ceo' | 'branch_manager' | 'counselor'
  | 'application_team' | 'visa_officer' | 'finance'
  | 'marketing_manager' | 'front_desk' | 'hr'
  | 'partner_manager' | 'document_officer' | 'data_manager'
  | 'support_agent' | 'ai_manager';

export type PortalView =
  // Public
  | 'portals' | 'website' | 'login' | 'register' | 'student-login' | 'student-register'
  | 'partner-login' | 'partner-register' | 'employee-login' | 'admin-login'
  | 'forgot-password' | 'reset-password' | 'verify-otp'
  | 'account-suspended' | 'account-pending' | 'unauthorized'
  // Public website sub-pages (SPA-routed via rewrites in next.config.ts)
  | 'public-consultation' | 'public-contact' | 'public-course-finder'
  | 'public-destination' | 'public-universities' | 'public-scholarships'
  | 'public-services' | 'public-about' | 'public-success-stories'
  | 'public-team' | 'public-faqs' | 'public-resources'
  | 'public-language-prep' | 'public-english-test' | 'public-visa-readiness'
  | 'public-privacy' | 'public-terms' | 'public-cookie' | 'public-cookies' | 'public-accessibility' | 'public-communication-policy' | 'public-lead-data-policy' | 'public-user-guide'
  // Student
  | 'student-dashboard' | 'student-profile' | 'student-applications' | 'student-applications-detail'
  | 'student-documents' | 'student-messages' | 'student-course-finder'
  | 'student-favorites' | 'student-compare' | 'student-sop' | 'student-cv'
  | 'student-visa' | 'student-scholarships' | 'student-appointments'
  | 'student-payments' | 'student-notifications' | 'student-settings'
  | 'student-help' | 'student-ai-advisor' | 'student-recommendations'
  | 'student-interviews' | 'student-referrals' | 'student-events' | 'student-onboarding'
  // Employee
  | 'employee-dashboard' | 'employee-profile' | 'employee-tasks'
  | 'employee-leads' | 'employee-students' | 'employee-applications'
  | 'employee-documents' | 'employee-messages' | 'employee-whatsapp'
  | 'employee-calendar' | 'employee-attendance'
  | 'employee-leave' | 'employee-salary' | 'employee-performance'
  | 'employee-reports' | 'employee-notifications' | 'employee-settings' | 'employee-help'
  | 'employee-visa-dashboard' | 'employee-visa-officer' | 'employee-visa-interview-officer'
  | 'employee-visa-cases' | 'employee-visa-interviews' | 'employee-visa-documents'
  | 'employee-visa-readiness' | 'employee-visa-reports'
  | 'partner-dashboard' | 'partner-profile' | 'partner-leads'
  | 'partner-students' | 'partner-applications' | 'partner-documents'
  | 'partner-commission' | 'partner-reports' | 'partner-messages'
  | 'partner-resources' | 'partner-referrals' | 'partner-notifications'
  | 'partner-settings' | 'partner-help'
  // B2B Partner Super Admin Portal
  | 'partner-admin-dashboard' | 'partner-admin-company-profile' | 'partner-admin-users'
  | 'partner-admin-users-create' | 'partner-admin-roles' | 'partner-admin-students'
  | 'partner-admin-leads' | 'partner-admin-applications' | 'partner-admin-documents'
  | 'partner-admin-course-finder' | 'partner-admin-marketing-studio' | 'partner-admin-content-generator'
  | 'partner-admin-image-generator' | 'partner-admin-video-generator' | 'partner-admin-social-scheduler'
  | 'partner-admin-mock-tests' | 'partner-admin-interview-prep' | 'partner-admin-voucher-codes'
  | 'partner-admin-usage-quota' | 'partner-admin-reports' | 'partner-admin-support-request'
  | 'partner-admin-settings'
  // CRM Admin — 20+ modules
  | 'crm-dashboard' | 'crm-users' | 'crm-roles' | 'crm-permissions'
  | 'crm-leads' | 'crm-students' | 'crm-analytics' | 'crm-partners'
  | 'crm-applications' | 'crm-documents' | 'crm-communications'
  | 'crm-whatsapp' | 'crm-social' | 'crm-reports' | 'crm-audit-logs' | 'crm-settings'
  | 'crm-finance' | 'crm-commissions' | 'crm-marketing' | 'crm-hrm'
  | 'crm-accounting' | 'crm-procurement'
  | 'crm-ai-command' | 'crm-tasks' | 'crm-appointments'
  | 'crm-course-finder' | 'crm-universities' | 'crm-visa'
  | 'crm-visa-dashboard' | 'crm-visa-cases' | 'crm-visa-interviews' | 'crm-visa-readiness' | 'crm-visa-reports'
  | 'crm-import-center' | 'crm-university-updates' | 'crm-access-control-center'
  | 'crm-scholarships' | 'crm-support' | 'crm-inbox'
  // SEO Growth System
  | 'crm-seo-dashboard' | 'crm-seo-keywords' | 'crm-seo-content'
  | 'crm-seo-competitors' | 'crm-seo-technical' | 'crm-seo-policy'
  // Marketing Hub
  | 'marketing-dashboard' | 'marketing-campaigns' | 'marketing-social'
  | 'marketing-analytics' | 'marketing-inbox' | 'marketing-approvals'
  | 'marketing-brand-assets' | 'marketing-keywords' | 'marketing-whatsapp'
  | 'marketing-leads' | 'marketing-ai-replies' | 'marketing-assignment'
  | 'marketing-handoff' | 'marketing-workflows' | 'marketing-audit'
  // Knowledge Sharing — included in each dashboard allowing anyone to upload info/updates
  | 'knowledge-sharing-hub' | 'knowledge-sharing-detail'
  // International Officer / Partner Dashboard — university research, partnership communications, contacts, strategy
  | 'international-officer-dashboard' | 'international-officer-research' | 'international-officer-communications'
  | 'international-officer-contacts' | 'international-officer-agreements' | 'international-officer-strategy'
  // Super Admin Master Command — Website CMS + CRM Command Center
  | 'super-admin-master-command' | 'super-admin-website-cms' | 'super-admin-crm-command'
  // Social Media Management — 24 Platforms, Own AI Agent
  | 'social-media-hub' | 'social-inbox' | 'social-analytics' | 'social-content' | 'social-posts' | 'social-automation';

export interface PortalRolePermission {
  module: string;
  feature: string;
  action: string;
  description: string;
}

export interface PortalRole {
  id: string;
  name: string;
  permissions: PortalRolePermission[];
}

export interface PortalUserData {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatar: string;
  userType: PortalUserType;
  status: string;
  firstLoginRequired: boolean;
  crmRole?: CrmRole;
  department?: string;
  branch?: string;
  partnerRole?: string;
  roles?: PortalRole[];
}

interface PortalState {
  currentView: PortalView;
  isAuthenticated: boolean;
  user: PortalUserData | null;
  userType: PortalUserType | null;
  token: string | null;
  selectedPortal: SelectedPortal;
  sidebarOpen: boolean;
  loginLoading: boolean;
  loginError: string | null;
  authMessage: string | null;
  notifications: Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }>;

  // Slug for public sub-pages (destination country, language test, etc.)
  publicPageSlug: string | null;

  setView: (view: PortalView) => void;
  setSelectedPortal: (portal: SelectedPortal) => void;
  selectAndNavigate: (portal: SelectedPortal, view: PortalView) => void;
  setPublicPage: (view: PortalView, slug?: string | null) => void;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; phone: string; password: string; portalType: string }) => Promise<boolean>;
  logout: () => void;
  setSidebarOpen: (open: boolean) => void;
  clearLoginError: () => void;
  clearAuthMessage: () => void;
  setNotifications: (notifications: Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }>) => void;
  hasPermission: (module: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

export const usePortalStore = create<PortalState>((set, get) => ({
  currentView: 'website',
  isAuthenticated: false,
  user: null,
  userType: null,
  token: null,
  selectedPortal: 'student',
  sidebarOpen: false,
  loginLoading: false,
  loginError: null,
  authMessage: null,
  notifications: [],
  publicPageSlug: null,

  setView: (view) => set({ currentView: view, loginError: null }),
  setSelectedPortal: (portal) => set({ selectedPortal: portal }),
  selectAndNavigate: (portal, view) =>
    set({ selectedPortal: portal, currentView: view, loginError: null, authMessage: null }),
  setPublicPage: (view, slug = null) => {
    set({ currentView: view, publicPageSlug: slug, loginError: null });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const rawUser = localStorage.getItem('portal_user');
      localStorage.removeItem('portal_token');
      localStorage.removeItem('student_token');
      localStorage.removeItem('partner_token');
      localStorage.removeItem('employee_token');
      if (!rawUser) return;
      const user = JSON.parse(rawUser) as PortalUserData;
      const viewMap: Record<string, PortalView> = {
        STUDENT: 'student-dashboard',
        PARTNER: 'partner-dashboard',
        EMPLOYEE: 'employee-dashboard',
        MARKETING: 'marketing-dashboard',
        MARKETING_MANAGER: 'marketing-dashboard',
        ADMIN: 'crm-dashboard',
        SUPER_ADMIN: 'crm-dashboard',
      };
      set({
        isAuthenticated: true,
        user,
        userType: user.userType,
        token: null,
        currentView: user.userType === 'PARTNER' && user.partnerRole?.toUpperCase() === 'PARTNER_SUPER_ADMIN'
          ? 'partner-admin-dashboard'
          : viewMap[user.userType] || 'portals',
      });
    } catch {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
    }
  },

  login: async (email, password) => {
    const { selectedPortal } = get();
    set({ loginLoading: true, loginError: null, authMessage: null });
    try {
      const res = await fetch('/api/portal-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portalType: selectedPortal }),
      });
      const data = await res.json();
      if (data.success) {
        const ut = data.user.userType as PortalUserType;
        const viewMap: Record<string, PortalView> = {
          STUDENT: 'student-dashboard',
          PARTNER: 'partner-dashboard',
          EMPLOYEE: 'employee-dashboard',
          MARKETING: 'marketing-dashboard',
          MARKETING_MANAGER: 'marketing-dashboard',
          ADMIN: 'crm-dashboard',
          SUPER_ADMIN: 'crm-dashboard',
        };
        set({
          isAuthenticated: true,
          user: data.user,
          userType: ut,
          token: null,
          loginLoading: false,
          currentView: ut === 'PARTNER' && data.user.partnerRole?.toUpperCase() === 'PARTNER_SUPER_ADMIN'
            ? 'partner-admin-dashboard'
            : viewMap[ut] || 'portals',
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('portal_token');
          localStorage.setItem('portal_user', JSON.stringify(data.user));
          localStorage.removeItem(`${selectedPortal}_token`);
          localStorage.setItem(`${selectedPortal}_user`, JSON.stringify(data.user));
        }
        return true;
      }
      if (data.error === 'account_suspended') {
        set({ loginLoading: false, authMessage: data.message || 'Your account has been suspended.' });
        get().setView('account-suspended');
        return false;
      }
      if (data.error === 'account_pending') {
        set({ loginLoading: false, authMessage: data.message || 'Your account is pending approval.' });
        get().setView('account-pending');
        return false;
      }
      set({ loginLoading: false, loginError: data.error || data.message || 'Invalid credentials' });
      return false;
    } catch {
      set({ loginLoading: false, loginError: 'Network error. Please try again.' });
      return false;
    }
  },

  register: async (regData) => {
    set({ loginLoading: true, loginError: null });
    try {
      const canonicalStudent = regData.portalType === 'student';
      const res = await fetch(canonicalStudent ? '/api/auth/register' : '/api/portal-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canonicalStudent ? { name: regData.name, email: regData.email, phone: regData.phone, password: regData.password, role: 'STUDENT' } : regData),
      });
      const data = await res.json();
      if (data.success) {
        if (data.requireVerification || canonicalStudent) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('portal_otp_email', String(regData.email).trim().toLowerCase());
            localStorage.setItem('portal_otp_type', canonicalStudent ? 'canonical-student' : String(regData.portalType));
          }
          set({ loginLoading: false, currentView: 'verify-otp', authMessage: data.message });
          return true;
        }
        // Registration creates a pending/unverified account; it does not create
        // a session token. Never mark the browser authenticated with a fake
        // token. The register view can show the returned success message.
        if (!data.token) {
          set({ loginLoading: false, authMessage: data.message || 'Registration received.' });
          return true;
        }
        const ut = data.user.userType as PortalUserType;
        set({
          isAuthenticated: true,
          user: data.user,
          userType: ut,
          token: null,
          loginLoading: false,
          currentView: ut === 'STUDENT' ? 'student-dashboard' : 'partner-dashboard',
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('portal_token');
          localStorage.setItem('portal_user', JSON.stringify(data.user));
        }
        return true;
      }
      if (data.accountCreated && typeof window !== 'undefined') {
        localStorage.setItem('portal_otp_email', String(regData.email).trim().toLowerCase());
        localStorage.setItem('portal_otp_type', canonicalStudent ? 'canonical-student' : String(regData.portalType));
        set({ currentView: 'verify-otp' });
      }
      set({ loginLoading: false, loginError: data.error || 'Registration failed' });
      return false;
    } catch {
      set({ loginLoading: false, loginError: 'Network error. Please try again.' });
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/portal-auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch { /* Ignore API errors during logout */ }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      localStorage.removeItem('partner_token');
      localStorage.removeItem('partner_user');
      localStorage.removeItem('employee_token');
      localStorage.removeItem('employee_user');
    }
    set({
      isAuthenticated: false,
      user: null,
      userType: null,
      token: null,
      currentView: 'portals',
      loginError: null,
      authMessage: null,
      loginLoading: false,
      notifications: [],
      sidebarOpen: false,
    });
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  clearLoginError: () => set({ loginError: null }),
  clearAuthMessage: () => set({ authMessage: null }),
  setNotifications: (notifications) => set({ notifications }),
  hasPermission: (module: string, action: string) => {
    const state = get();
    if (!state.user) return false;

    // Super admin and admin have full access
    if (['SUPER_ADMIN', 'ADMIN'].includes(state.user.userType)) return true;

    // Check all roles for matching permission
    for (const role of state.user.roles || []) {
      for (const perm of role.permissions || []) {
        if (perm.module === module && (perm.action === action || perm.action === '*')) {
          return true;
        }
      }
    }

    return false;
  },

  hasRole: (roleName: string) => {
    const state = get();
    if (!state.user) return false;
    if (['SUPER_ADMIN', 'ADMIN'].includes(state.user.userType)) return true;
    return (state.user.roles || []).some((r) => r.name === roleName);
  },

}));
