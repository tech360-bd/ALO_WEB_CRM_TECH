'use client'

import { useEffect, useState } from 'react'
import { getSession } from '@/lib/session'

// Shape returned by GET /api/crm/dashboard
export interface CrmDashboardData {
  role: string
  timestamp: string
  common: {
    totalLeads: number
    totalStudents: number
    totalPartners: number
    totalEmployees: number
    totalApplications: number
    totalUniversities: number
    totalCourses: number
    totalScholarships: number
    totalVisaFiles: number
    totalDocuments: number
    totalInvoices: number
    totalPayments: number
    totalCommissions: number
    totalAiLogs: number
    totalTasks: number
    totalAppointments: number
    totalWhatsappNumbers: number
    totalCampaigns: number
    totalBlogPosts: number
    totalAuditLogs: number
    activeApplications: number
    activeEmployees: number
    totalLeaveRequests: number
    revenue: number
    commissionAmount: number
    pendingCommissionsCount: number
    paidCommissionsCount: number
    pendingInvoicesCount: number
    documentsPendingReview: number
    documentsApproved: number
    documentsRejected: number
    visaPending: number
    visaApproved: number
    visaRejected: number
    aiLogsPending: number
    aiLogsApproved: number
    aiLogsRejected: number
    publishedCampaigns: number
    draftCampaigns: number
    publishedBlogPosts: number
    draftBlogPosts: number
    attendanceToday: number
    overdueTasks: number
    todayAppointments: number
  }
  charts: {
    leadsByStatus: Array<{ status: string; count: number }>
    applicationsByStatus: Array<{ status: string; count: number }>
    leadsBySource: Array<{ source: string; count: number }>
    commissionsByStatus: Array<{ status: string; count: number; amount: number }>
    documentsByStatus: Array<{ status: string; count: number }>
    visaByStatus: Array<{ status: string; count: number }>
  }
  recent: {
    leads: Array<Record<string, any>>
    applications: Array<Record<string, any>>
    commissions: Array<Record<string, any>>
    aiLogs: Array<Record<string, any>>
    auditLogs: Array<Record<string, any>>
    appointments: Array<Record<string, any>>
  }
  counselor: {
    leadsCount: number
    studentsCount: number
    applicationsCount: number
    appointments: Array<Record<string, any>>
    todaysFollowups: number
    overdueFollowups: number
  } | null
}

export function useCrmDashboard() {
  const [data, setData] = useState<CrmDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      setError('No session')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch('/api/crm/dashboard', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Request failed: ${res.status}`)
        }
        return res.json()
      })
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
