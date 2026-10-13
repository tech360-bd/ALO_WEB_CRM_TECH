'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { useAppStore } from '@/lib/store'
import {
  BarChart3, Calendar, TrendingUp, Users, GraduationCap,
  DollarSign, Download, FileText
} from 'lucide-react'

const COLORS = ['#F37021', '#0066CC', '#FFB347', '#1A2332', '#4CAF50', '#9C27B0', '#F44336', '#00BCD4']

interface ReportData {
  studentsByMonth: Array<{ month: string; count: number }>
  applicationsByStatus: Array<{ status: string; count: number }>
  commissionByMonth: Array<{ month: string; amount: number }>
  studentsByCountry: Array<{ country: string; count: number }>
  summary: {
    totalStudents: number
    totalApplications: number
    totalCommission: number
    avgApplicationsPerStudent: number
    conversionRate: number
  }
}

export default function PartnerReports() {
  const { currentUser } = useAppStore()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('12months')

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true)
        const refId = currentUser?.referenceId || ''
        const res = await fetch(`/api/commissions?partnerId=${refId}&limit=100`)
        const comJson = await res.json()

        const stuRes = await fetch(`/api/students?partnerId=${refId}&limit=100`)
        const stuJson = await stuRes.ok ? await stuRes.json() : { students: [] }

        const appRes = await fetch(`/api/applications?partnerId=${refId}&limit=100`)
        const appJson = await appRes.ok ? await appRes.json() : { applications: [] }

        // Process data for charts
        const commissions = comJson.commissions || []
        const students = stuJson.students || []
        const applications = appJson.applications || []

        // Students by month
        const monthMap: Record<string, number> = {}
        students.forEach((s: { createdAt: string }) => {
          const month = new Date(s.createdAt).toLocaleDateString('en', { month: 'short', year: '2-digit' })
          monthMap[month] = (monthMap[month] || 0) + 1
        })
        const studentsByMonth = Object.entries(monthMap).map(([month, count]) => ({ month, count }))

        // Applications by status
        const statusMap: Record<string, number> = {}
        applications.forEach((a: { status: string }) => {
          statusMap[a.status] = (statusMap[a.status] || 0) + 1
        })
        const applicationsByStatus = Object.entries(statusMap).map(([status, count]) => ({
          status: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count,
        }))

        // Commission by month
        const comMonthMap: Record<string, number> = {}
        commissions.forEach((c: { createdAt: string; amount: number }) => {
          const month = new Date(c.createdAt).toLocaleDateString('en', { month: 'short', year: '2-digit' })
          comMonthMap[month] = (comMonthMap[month] || 0) + c.amount
        })
        const commissionByMonth = Object.entries(comMonthMap).map(([month, amount]) => ({ month, amount }))

        // Students by country
        const countryMap: Record<string, number> = {}
        students.forEach((s: { preferredCountry: string; nationality: string }) => {
          const country = s.preferredCountry || s.nationality || 'Unknown'
          countryMap[country] = (countryMap[country] || 0) + 1
        })
        const studentsByCountry = Object.entries(countryMap).map(([country, count]) => ({ country, count }))

        const totalCommission = commissions.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0)
        const offersCount = applications.filter((a: { status: string }) =>
          ['conditional_offer', 'unconditional_offer', 'cas_received', 'visa_approved', 'enrolled'].includes(a.status)
        ).length

        setData({
          studentsByMonth,
          applicationsByStatus,
          commissionByMonth,
          studentsByCountry,
          summary: {
            totalStudents: students.length,
            totalApplications: applications.length,
            totalCommission,
            avgApplicationsPerStudent: students.length > 0 ? Math.round((applications.length / students.length) * 10) / 10 : 0,
            conversionRate: applications.length > 0 ? Math.round((offersCount / applications.length) * 100) : 0,
          },
        })
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [currentUser?.referenceId, dateRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  const summary = data?.summary || {
    totalStudents: 0, totalApplications: 0, totalCommission: 0,
    avgApplicationsPerStudent: 0, conversionRate: 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics and insights for your partnership</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-44">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-alo-blue/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-alo-blue" />
            </div>
            <div>
              <p className="text-xl font-bold text-alo-navy">{summary.totalStudents}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-alo-orange/10 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-alo-orange" />
            </div>
            <div>
              <p className="text-xl font-bold text-alo-navy">{summary.totalApplications}</p>
              <p className="text-xs text-gray-500">Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-alo-navy">£{summary.totalCommission.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Commission</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-alo-navy">{summary.avgApplicationsPerStudent}</p>
              <p className="text-xs text-gray-500">Avg Apps/Student</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-alo-navy">{summary.conversionRate}%</p>
              <p className="text-xs text-gray-500">Conversion Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Over Time */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
              <Users className="h-4 w-4 text-alo-blue" /> Student Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.studentsByMonth?.length || 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.studentsByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0066CC" radius={[4, 4, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Applications by Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
              <FileText className="h-4 w-4 text-alo-orange" /> Applications by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.applicationsByStatus?.length || 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data?.applicationsByStatus || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {(data?.applicationsByStatus || []).map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Commission Trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" /> Commission Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.commissionByMonth?.length || 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data?.commissionByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#F37021" strokeWidth={2} dot={{ r: 4 }} name="Commission (£)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Students by Country */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" /> Students by Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.studentsByCountry?.length || 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.studentsByCountry || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F37021" radius={[0, 4, 4, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
