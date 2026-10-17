'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import {
  GraduationCap, Target, Users, Building2, DollarSign,
  Briefcase, Globe, TrendingUp, ClipboardList, Wallet
} from 'lucide-react'

const COLORS = ['#F37021', '#0066CC', '#22c55e', '#FFB347', '#8b5cf6', '#06b6d4', '#ef4444', '#6b7280']

interface DashboardData {
  role: string
  stats: {
    totalStudents: number
    totalLeads: number
    totalApplications: number
    totalPartners: number
    totalEmployees: number
    activeApplications: number
    revenue: number
    totalCommissionAmount: number
    pendingCommissions: number
  }
  charts: {
    leadsByStatus: Array<{ status: string; count: number }>
    applicationsByStatus: Array<{ status: string; count: number }>
  }
  recent: {
    leads: Array<any>
    applications: Array<any>
    activities: Array<any>
  }
}

export default function CRMDashboard() {
  const { currentUser } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [currentUser])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const userId = currentUser?.id
      if (!userId) return
      const res = await fetch(`/api/dashboard?userId=${userId}&userType=admin`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const stats = data?.stats || {}
  const leadsByStatus = data?.charts?.leadsByStatus || []
  const applicationsByStatus = data?.charts?.applicationsByStatus || []
  const recentLeads = data?.recent?.leads || []
  const recentApps = data?.recent?.applications || []

  // Monthly revenue data for bar chart
  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 61000 },
    { month: 'Apr', revenue: 48000 },
    { month: 'May', revenue: 72000 },
    { month: 'Jun', revenue: 85000 },
    { month: 'Jul', revenue: 68000 },
    { month: 'Aug', revenue: 91000 },
    { month: 'Sep', revenue: 78000 },
    { month: 'Oct', revenue: 95000 },
    { month: 'Nov', revenue: 88000 },
    { month: 'Dec', revenue: 102000 },
  ]

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents || 0, icon: GraduationCap, color: '#F37021' },
    { label: 'Total Leads', value: stats.totalLeads || 0, icon: Target, color: '#0066CC' },
    { label: 'Active Applications', value: stats.activeApplications || 0, icon: ClipboardList, color: '#22c55e' },
    { label: 'Revenue', value: `৳${(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: '#FFB347' },
    { label: 'Partners', value: stats.totalPartners || 0, icon: Building2, color: '#8b5cf6' },
    { label: 'Employees', value: stats.totalEmployees || 0, icon: Users, color: '#06b6d4' },
  ]

  const leadStatusColors: Record<string, string> = {
    new: '#3b82f6', contacted: '#f59e0b', qualified: '#22c55e', enrolled: '#8b5cf6',
    lost: '#ef4444', unresponsive: '#6b7280', converted: '#10b981'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${card.color}15` }}>
                  <card.icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-[#1A2332] truncate">{card.value}</p>
                  <p className="text-xs text-gray-500 truncate">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Conversion Funnel */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#F37021]" /> Lead Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsByStatus.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No lead data available</div>
            ) : (
              <div className="space-y-2">
                {leadsByStatus.map((item, idx) => {
                  const maxCount = Math.max(...leadsByStatus.map(l => l.count), 1)
                  const width = (item.count / maxCount) * 100
                  return (
                    <div key={item.status} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-24 capitalize shrink-0">{item.status}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center px-3 transition-all"
                          style={{ width: `${Math.max(width, 15)}%`, backgroundColor: leadStatusColors[item.status] || COLORS[idx % COLORS.length] }}
                        >
                          <span className="text-xs text-white font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Status Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#0066CC]" /> Application Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsByStatus.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No application data available</div>
            ) : (
              <ChartContainer config={{}} className="h-56">
                <PieChart>
                  <Pie
                    data={applicationsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {applicationsByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart & Commission Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#22c55e]" /> Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { color: '#F37021' } }} className="h-56">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="#F37021" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Commission Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#8b5cf6]" /> Commission Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F37021]/5 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500">Total Commissions</p>
                  <p className="text-xl font-bold text-[#1A2332]">৳{(stats.totalCommissionAmount || 0).toLocaleString()}</p>
                </div>
                <Wallet className="h-8 w-8 text-[#F37021]" />
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500">Pending Commissions</p>
                  <p className="text-xl font-bold text-amber-600">{stats.pendingCommissions || 0}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700">Awaiting Review</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-600">৳{(stats.totalCommissionAmount * 0.65 || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Paid</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-600">৳{(stats.totalCommissionAmount * 0.35 || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Outstanding</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332]">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No recent leads</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLeads.slice(0, 5).map((lead: any) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.firstName} {lead.lastName}</TableCell>
                        <TableCell className="capitalize text-sm">{lead.source}</TableCell>
                        <TableCell>
                          <Badge className={
                            lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                            lead.status === 'qualified' ? 'bg-green-100 text-green-700' :
                            lead.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {lead.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332]">Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No recent applications</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentApps.slice(0, 5).map((app: any) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {app.student?.firstName} {app.student?.lastName}
                        </TableCell>
                        <TableCell className="text-sm">{app.university?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={
                            app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            app.status === 'conditional_offer' ? 'bg-green-100 text-green-700' :
                            app.status === 'unconditional_offer' ? 'bg-emerald-100 text-emerald-700' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }>
                            {app.status?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#25D366]" /> WhatsApp Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">128</p>
              <p className="text-xs text-gray-500">Messages Sent Today</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">45</p>
              <p className="text-xs text-gray-500">Active Conversations</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">12</p>
              <p className="text-xs text-gray-500">Pending Replies</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">3</p>
              <p className="text-xs text-gray-500">Number Pool</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
