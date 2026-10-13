/**
 * ALO Education - Unified API Client
 *
 * Central API layer for all frontend ↔ backend communication.
 * Handles token management, authorization headers, and 401 redirects.
 */

// ─── Token Management ────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('alo_token')
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('alo_token', token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('alo_token')
}

// ─── Base Fetch Wrapper ──────────────────────────────────────────────────────

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown>
  params?: Record<string, string | number | boolean | undefined>
}

async function apiFetch<T = unknown>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = options

  // Build URL with query params
  const url = new URL(endpoint, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  // Build headers
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (body && (rest.method === 'POST' || rest.method === 'PUT' || rest.method === 'PATCH')) {
    headers['Content-Type'] = 'application/json'
  }
  if (customHeaders) {
    // Merge custom headers
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => { headers[key] = value })
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => { headers[key] = String(value) })
    } else {
      Object.entries(customHeaders).forEach(([key, value]) => {
        if (value) headers[key] = String(value)
      })
    }
  }

  const res = await fetch(url.pathname + url.search, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Handle 401 - clear token and redirect to login
  if (res.status === 401) {
    clearToken()
    localStorage.removeItem('alo_user')
    // Use store to navigate if possible, otherwise hard redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    throw new Error('Unauthorized')
  }

  // Parse response
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `API Error: ${res.status}`)
  }

  return data as T
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  login(email: string, password: string) {
    return apiFetch<{
      user: {
        id: string; email: string; name: string; phone?: string
        profilePhoto?: string; userType: string; referenceId?: string
        forcePasswordChange?: boolean; status: string
      }
      roles: Array<{ id: string; name: string; displayName: string }>
      permissions: Array<{ module: string; action: string; granted: boolean }>
      token: string
      redirectUrl: string
    }>('/api/auth', { method: 'POST', body: { email, password } })
  },

  register(data: {
    name: string; email: string; password: string; phone?: string
    userType: string; referenceId?: string
  }) {
    return apiFetch<{ user: Record<string, unknown>; token: string }>('/api/auth/register', {
      method: 'POST',
      body: data,
    })
  },
}

// ─── Dashboard API ───────────────────────────────────────────────────────────

export const dashboardApi = {
  get(role: string, userId: string) {
    return apiFetch('/api/dashboard', { params: { role, userId } })
  },
}

// ─── Students API ────────────────────────────────────────────────────────────

export const studentsApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/students', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/students', { method: 'POST', body: data })
  },

  update(id: string, data: Record<string, unknown>) {
    return apiFetch(`/api/students?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: data,
    })
  },
}

// ─── Partners API ────────────────────────────────────────────────────────────

export const partnersApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/partners', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/partners', { method: 'POST', body: data })
  },
}

// ─── Employees API ───────────────────────────────────────────────────────────

export const employeesApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/employees', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/employees', { method: 'POST', body: data })
  },
}

// ─── Leads API ───────────────────────────────────────────────────────────────

export const leadsApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/leads', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/leads', { method: 'POST', body: data })
  },
}

// ─── Applications API ────────────────────────────────────────────────────────

export const applicationsApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/applications', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/applications', { method: 'POST', body: data })
  },
}

// ─── Universities API ────────────────────────────────────────────────────────

export const universitiesApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/universities', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/universities', { method: 'POST', body: data })
  },
}

// ─── Commissions API ─────────────────────────────────────────────────────────

export const commissionsApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/commissions', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/commissions', { method: 'POST', body: data })
  },

  summary(userId: string) {
    return apiFetch('/api/commissions', { params: { summary: 'true', userId } })
  },
}

// ─── Finance API ─────────────────────────────────────────────────────────────

export const financeApi = {
  payments(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/payments', { params })
  },

  createPayment(data: Record<string, unknown>) {
    return apiFetch('/api/payments', { method: 'POST', body: data })
  },

  invoices(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/payments', { params: { ...params, type: 'invoice' } })
  },
}

// ─── Visa API ────────────────────────────────────────────────────────────────

export const visaApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/visa', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/visa', { method: 'POST', body: data })
  },
}

// ─── Attendance API ──────────────────────────────────────────────────────────

export const attendanceApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/attendance', { params })
  },

  clockIn(data: { employeeId: string; location?: string }) {
    return apiFetch('/api/attendance', { method: 'POST', body: { ...data, action: 'clock_in' } })
  },

  clockOut(data: { employeeId: string }) {
    return apiFetch('/api/attendance', { method: 'POST', body: { ...data, action: 'clock_out' } })
  },
}

// ─── Payroll API ─────────────────────────────────────────────────────────────

export const payrollApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/payroll', { params })
  },

  generate(data: Record<string, unknown>) {
    return apiFetch('/api/payroll', { method: 'POST', body: data })
  },
}

// ─── WhatsApp API ────────────────────────────────────────────────────────────

export const whatsappApi = {
  conversations(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/whatsapp', { params })
  },

  sendMessage(data: Record<string, unknown>) {
    return apiFetch('/api/whatsapp', { method: 'POST', body: data })
  },
}

// ─── AI API ──────────────────────────────────────────────────────────────────

export const aiApi = {
  command(data: Record<string, unknown>) {
    return apiFetch('/api/ai', { method: 'POST', body: data })
  },

  agents() {
    return apiFetch('/api/agents')
  },

  knowledge(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/knowledge', { params })
  },

  research(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/research', { params })
  },
}

// ─── Marketing API ───────────────────────────────────────────────────────────

export const marketingApi = {
  campaigns(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/marketing', { params })
  },

  createCampaign(data: Record<string, unknown>) {
    return apiFetch('/api/marketing', { method: 'POST', body: data })
  },
}

// ─── Blog API ────────────────────────────────────────────────────────────────

export const blogApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/blog', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/blog', { method: 'POST', body: data })
  },
}

// ─── Documents API ───────────────────────────────────────────────────────────

export const documentsApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/documents', { params })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/documents', { method: 'POST', body: data })
  },
}

// ─── Settings API ────────────────────────────────────────────────────────────

export const settingsApi = {
  get(group?: string) {
    return apiFetch('/api/settings', { params: group ? { group } : undefined })
  },

  update(data: Record<string, unknown>) {
    return apiFetch('/api/settings', { method: 'PUT', body: data })
  },
}

// ─── Reports API ─────────────────────────────────────────────────────────────

export const reportsApi = {
  get(tab: string, params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/reports', { params: { tab, ...params } })
  },
}

// ─── Support Tickets API ─────────────────────────────────────────────────────

export const supportApi = {
  list(userId: string) {
    return apiFetch('/api/support-tickets', { params: { userId } })
  },

  create(data: Record<string, unknown>) {
    return apiFetch('/api/support-tickets', { method: 'POST', body: data })
  },
}

// ─── Messages API ────────────────────────────────────────────────────────────

export const messagesApi = {
  list(userId: string) {
    return apiFetch('/api/messages', { params: { userId } })
  },

  send(data: Record<string, unknown>) {
    return apiFetch('/api/messages', { method: 'POST', body: data })
  },

  markRead(userId: string) {
    return apiFetch('/api/messages', { method: 'PUT', body: { userId, action: 'mark_read' } })
  },
}

// ─── Content Editor API ──────────────────────────────────────────────────────

export const contentEditorApi = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/content-editor', { params })
  },

  get(id: string) {
    return apiFetch('/api/content-editor', { params: { id } })
  },

  save(data: Record<string, unknown>) {
    return apiFetch('/api/content-editor', { method: 'POST', body: data })
  },

  delete(id: string) {
    return apiFetch(`/api/content-editor?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}

// ─── CMS API (Testimonials, FAQ, Success Stories, Pages) ────────────────────

export const cmsApi = {
  testimonials(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/testimonials', { params })
  },

  faqs(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/faqs', { params })
  },

  successStories(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/success-stories', { params })
  },

  pages(params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch('/api/pages', { params })
  },
}

// ─── Unified Export ──────────────────────────────────────────────────────────

export const api = {
  // Token helpers
  getToken,
  setToken,
  clearToken,

  // Raw fetch (for advanced use)
  fetch: apiFetch,

  // API modules
  auth: authApi,
  dashboard: dashboardApi,
  students: studentsApi,
  partners: partnersApi,
  employees: employeesApi,
  leads: leadsApi,
  applications: applicationsApi,
  universities: universitiesApi,
  commissions: commissionsApi,
  finance: financeApi,
  visa: visaApi,
  attendance: attendanceApi,
  payroll: payrollApi,
  whatsapp: whatsappApi,
  ai: aiApi,
  marketing: marketingApi,
  blog: blogApi,
  documents: documentsApi,
  settings: settingsApi,
  reports: reportsApi,
  support: supportApi,
  messages: messagesApi,
  contentEditor: contentEditorApi,
  cms: cmsApi,
}

export default api
