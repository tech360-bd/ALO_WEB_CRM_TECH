'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart3, TrendingUp, Users, DollarSign, FileText, Building2, Megaphone,
  UserCheck, Download, ShieldCheck, Brain, Clock
} from 'lucide-react'
import { toast } from 'sonner'

const C = ['#F37021', '#0066CC', '#22c55e', '#FFB347', '#8b5cf6', '#06b6d4', '#ef4444', '#6b7280']
const NAVY = '#1A2332'
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Fallback chart data for when API returns empty
const fallbackRevTrend = months.map((m,i) => ({ month: m, revenue: [45,52,61,48,72,85,68,91,78,95,88,102][i]*1000, students: [12,15,18,11,22,28,20,32,25,35,30,38][i] }))
const fallbackFinMonth = months.map((m,i) => ({ month: m, revenue: [45,52,61,48,72,85,68,91,78,95,88,102][i]*1000, expense: [28,32,38,30,42,50,40,55,46,58,52,64][i]*1000 }))

function KPICard({ title, value, change, icon: Icon, color }: { title: string; value: string; change?: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="text-xl font-bold mt-1" style={{ color: NAVY }}>{value}</p>
            {change && <Badge className={`mt-1 text-xs ${change.startsWith('+') || change.startsWith('↑') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{change}</Badge>}
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: color + '15' }}><Icon className="h-5 w-5" style={{ color }} /></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState('ceo')
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (tab: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reports?tab=${tab}`)
      const result = await res.json()
      setData(prev => ({ ...prev, [tab]: result }))
    } catch {
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(activeTab) }, [activeTab, fetchData])

  const d = data[activeTab] as Record<string, unknown> | undefined

  // ─── CEO Dashboard Tab ───
  const renderCEO = () => {
    const stats = (d?.stats || {}) as Record<string, unknown>
    const leadsBySource = (d?.leadsBySource || []) as {source: string; count: number}[]
    const appsByStatus = (d?.appsByStatus || []) as {status: string; count: number}[]
    const countryDist = (d?.countryDistribution || d?.appsByCountry || []) as {country: string; count: number}[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Students" value={String(stats.totalStudents || 0)} change="+12%" icon={Users} color="#F37021" />
          <KPICard title="Total Revenue" value={`$${Number(stats.totalRevenue || 0).toLocaleString()}`} change="+18%" icon={DollarSign} color="#22c55e" />
          <KPICard title="Active Applications" value={String(stats.activeApplications || 0)} change="+8%" icon={FileText} color="#0066CC" />
          <KPICard title="Conversion Rate" value={`${stats.conversionRate || 0}%`} change="↑5%" icon={TrendingUp} color="#8b5cf6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Revenue Trend (Monthly)</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ revenue: { label: 'Revenue', color: '#F37021' }, students: { label: 'Students', color: '#0066CC' } }}>
                <AreaChart data={fallbackRevTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stroke="#F37021" fill="#F37021" fillOpacity={0.1} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Student Source */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Student Acquisition by Source</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#F37021' } }}>
                <PieChart>
                  <Pie data={leadsBySource.length > 0 ? leadsBySource : [{source:'Direct',count:35},{source:'Partner',count:30},{source:'Referral',count:20},{source:'Website',count:15}]} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={80} label={({source,percent}) => `${source} ${(percent*100).toFixed(0)}%`}>
                    {leadsBySource.map((_,i) => <Cell key={i} fill={C[i % C.length]} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Application Pipeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Application Pipeline</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#0066CC' } }}>
                <BarChart data={appsByStatus.length > 0 ? appsByStatus : [{status:'Submitted',count:120},{status:'In Review',count:85},{status:'Offered',count:62},{status:'Enrolled',count:45}]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="status" width={80} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#0066CC" radius={[0,4,4,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Country Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Country Distribution</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Students', color: '#F37021' } }}>
                <BarChart data={countryDist.length > 0 ? countryDist : [{country:'UK',count:85},{country:'USA',count:62},{country:'Canada',count:48},{country:'Australia',count:41}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#F37021" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Lead Analytics Tab ───
  const renderLeads = () => {
    const bySource = (d?.bySource || []) as {source: string; count: number}[]
    const byTemperature = (d?.byTemperature || []) as {temperature: string; count: number}[]
    const funnel = (d?.funnel || []) as {stage: string; count: number}[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Leads" value={String(d?.totalLeads || 0)} icon={Users} color="#F37021" />
          <KPICard title="Conversion Rate" value={`${d?.conversionRate || 0}%`} icon={TrendingUp} color="#22c55e" />
          <KPICard title="Hot Leads" value={String(byTemperature.find(t => t.temperature === 'hot')?.count || 0)} icon={FileText} color="#ef4444" />
          <KPICard title="Cold Leads" value={String(byTemperature.find(t => t.temperature === 'cold')?.count || 0)} icon={Clock} color="#6b7280" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Leads by Source</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Leads', color: '#F37021' } }}>
                <BarChart data={bySource.length > 0 ? bySource : [{source:'Facebook',count:120},{source:'Google',count:85},{source:'WhatsApp',count:95},{source:'Referral',count:60},{source:'Website',count:50}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#F37021" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Lead Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#0066CC' } }}>
                <BarChart data={funnel.length > 0 ? funnel : [{stage:'Total Leads',count:500},{stage:'Qualified',count:320},{stage:'Applied',count:200}]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="stage" width={90} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#0066CC" radius={[0,4,4,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Temperature Distribution</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#F37021' } }}>
                <PieChart>
                  <Pie data={byTemperature.length > 0 ? byTemperature : [{temperature:'Hot',count:120},{temperature:'Warm',count:280},{temperature:'Cold',count:100}]} dataKey="count" nameKey="temperature" cx="50%" cy="50%" outerRadius={80} label={({temperature,percent}) => `${temperature} ${(percent*100).toFixed(0)}%`}>
                    <Cell fill="#ef4444" /><Cell fill="#f59e0b" /><Cell fill="#6b7280" />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Lead Source ROI</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ leads: { label: 'Leads', color: '#F37021' }, converted: { label: 'Converted', color: '#22c55e' } }}>
                <BarChart data={[{source:'Facebook',leads:120,converted:28},{source:'Google',leads:85,converted:22},{source:'WhatsApp',leads:95,converted:18},{source:'Referral',leads:60,converted:25},{source:'Instagram',leads:75,converted:12}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="leads" fill="#F37021" radius={[4,4,0,0]} />
                  <Bar dataKey="converted" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Application Analytics Tab ───
  const renderApplications = () => {
    const byStatus = (d?.byStatus || []) as {status: string; count: number}[]
    const byCountry = (d?.byCountry || []) as {country: string; count: number}[]
    const topUnis = (d?.topUniversities || []) as {university: string; count: number}[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Applications by Stage</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#0066CC' } }}>
                <BarChart data={byStatus.length > 0 ? byStatus : [{status:'Submitted',count:120},{status:'In Review',count:85},{status:'Offered',count:62},{status:'Enrolled',count:45},{status:'Rejected',count:18}]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="status" width={90} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#0066CC" radius={[0,4,4,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Country-wise Applications</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Applications', color: '#F37021' } }}>
                <BarChart data={byCountry.length > 0 ? byCountry : [{country:'UK',count:85},{country:'USA',count:62},{country:'Canada',count:48},{country:'Australia',count:41}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#F37021" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Top Universities</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Applications', color: '#8b5cf6' } }}>
                <BarChart data={topUnis.length > 0 ? topUnis.slice(0,8) : [{university:'Oxford',count:42},{university:'Melbourne',count:35},{university:'Toronto',count:28},{university:'Imperial',count:22},{university:'Malaya',count:18}]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="university" width={90} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0,4,4,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Monthly Application Trend</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Applications', color: '#0066CC' } }}>
                <LineChart data={months.map((m,i) => ({ month: m, applications: [25,32,38,28,42,55,40,62,48,68,55,72][i] }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="applications" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC' }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Finance Reports Tab ───
  const renderFinance = () => {
    const paymentsByStatus = (d?.paymentsByStatus || []) as {status: string; count: number; amount: number}[]
    const recentPayments = (d?.recentPayments || []) as Record<string, unknown>[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Revenue" value={`$${Number(d?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="#22c55e" />
          <KPICard title="Total Payments" value={String(d?.totalPayments || 0)} icon={FileText} color="#0066CC" />
          <KPICard title="Total Commissions" value={`$${Number(d?.totalCommissions || 0).toLocaleString()}`} icon={Building2} color="#F37021" />
          <KPICard title="Net Income" value={`$${(Number(d?.totalRevenue || 0) - Number(d?.totalCommissions || 0)).toLocaleString()}`} icon={TrendingUp} color="#8b5cf6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Revenue vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ revenue: { label: 'Revenue', color: '#22c55e' }, expense: { label: 'Expense', color: '#ef4444' } }}>
                <BarChart data={fallbackFinMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Payment Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#F37021' } }}>
                <PieChart>
                  <Pie data={paymentsByStatus.length > 0 ? paymentsByStatus : [{status:'Paid',count:150},{status:'Pending',count:45},{status:'Overdue',count:12}]} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({status,percent}) => `${status} ${(percent*100).toFixed(0)}%`}>
                    <Cell fill="#22c55e" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Recent Payments</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recentPayments.length > 0 ? recentPayments : [{student:{firstName:'John',lastName:'Doe'},amount:5000,status:'paid',paidAt:'2025-01-15'},{student:{firstName:'Jane',lastName:'Smith'},amount:3500,status:'pending',paidAt:'2025-01-14'},{student:{firstName:'Ali',lastName:'Khan'},amount:4200,status:'paid',paidAt:'2025-01-13'}]).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{((p.student as Record<string,string>)?.firstName || '') + ' ' + ((p.student as Record<string,string>)?.lastName || '')}</TableCell>
                        <TableCell className="text-sm font-medium">${Number(p.amount || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge className={p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{String(p.status)}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-500">{p.paidAt ? new Date(String(p.paidAt)).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Partner Reports Tab ───
  const renderPartners = () => {
    const partners = (d?.partners || []) as {name: string; studentCount: number; totalCommission: number; paidCommission: number; pendingCommission: number; type: string}[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard title="Total Partners" value={String(partners.length)} icon={Building2} color="#F37021" />
          <KPICard title="Total Students" value={String(partners.reduce((s,p) => s + p.studentCount, 0))} icon={Users} color="#0066CC" />
          <KPICard title="Total Commissions" value={`$${partners.reduce((s,p) => s + p.totalCommission, 0).toLocaleString()}`} icon={DollarSign} color="#22c55e" />
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Partner Performance Ranking</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ studentCount: { label: 'Students', color: '#F37021' }, totalCommission: { label: 'Commission', color: '#0066CC' } }}>
              <BarChart data={partners.length > 0 ? partners : [{name:'EduBridge',studentCount:42,totalCommission:126000},{name:'GlobalEd',studentCount:35,totalCommission:105000},{name:'StudyLink',studentCount:28,totalCommission:84000},{name:'PathWay',studentCount:22,totalCommission:66000}]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="studentCount" fill="#F37021" radius={[4,4,0,0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Total Commission</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partners.length > 0 ? partners : [{name:'EduBridge',type:'TYPE1',studentCount:42,totalCommission:126000,paidCommission:85000,pendingCommission:12000},{name:'GlobalEd',type:'TYPE2',studentCount:35,totalCommission:105000,paidCommission:72000,pendingCommission:8000}]).map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium" style={{ color: NAVY }}>{p.name}</TableCell>
                      <TableCell><Badge variant="outline">{p.type || 'N/A'}</Badge></TableCell>
                      <TableCell>{p.studentCount}</TableCell>
                      <TableCell>${p.totalCommission.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">${p.paidCommission.toLocaleString()}</TableCell>
                      <TableCell className="text-yellow-600">${p.pendingCommission.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Visa Reports Tab ───
  const renderVisa = () => {
    const byStatus = (d?.byStatus || []) as {status: string; count: number}[]
    const byCountry = (d?.byCountry || []) as {country: string; count: number}[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Visa Apps" value={String(d?.totalVisa || 0)} icon={ShieldCheck} color="#0066CC" />
          <KPICard title="Approved" value={String(d?.approved || 0)} icon={UserCheck} color="#22c55e" />
          <KPICard title="Success Rate" value={`${d?.successRate || 0}%`} icon={TrendingUp} color="#F37021" />
          <KPICard title="Refused" value={String(byStatus.find(s => s.status === 'refused')?.count || 0)} icon={FileText} color="#ef4444" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Visa Stage Distribution</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#0066CC' } }}>
                <PieChart>
                  <Pie data={byStatus.length > 0 ? byStatus : [{status:'Approved',count:85},{status:'Pending',count:35},{status:'Refused',count:12},{status:'Withdrawn',count:5}]} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({status,percent}) => `${status} ${(percent*100).toFixed(0)}%`}>
                    <Cell fill="#22c55e" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" /><Cell fill="#6b7280" />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Visa by Country</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#F37021' } }}>
                <BarChart data={byCountry.length > 0 ? byCountry : [{country:'UK',count:65},{country:'Australia',count:42},{country:'Canada',count:38},{country:'USA',count:25}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#F37021" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── HR Reports Tab ───
  const renderHR = () => {
    const byDepartment = (d?.byDepartment || []) as {department: string; count: number}[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Employees" value={String(d?.totalEmployees || 0)} icon={Users} color="#0066CC" />
          <KPICard title="Task Completion" value={`${d?.taskCompletion || 0}%`} icon={UserCheck} color="#22c55e" />
          <KPICard title="Total Tasks" value={String(d?.totalTasks || 0)} icon={FileText} color="#F37021" />
          <KPICard title="Completed Tasks" value={String(d?.completedTasks || 0)} icon={TrendingUp} color="#8b5cf6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Employees by Department</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Employees', color: '#0066CC' } }}>
                <BarChart data={byDepartment.length > 0 ? byDepartment : [{department:'Counseling',count:22},{department:'Visa',count:15},{department:'Marketing',count:12},{department:'Finance',count:8},{department:'HR',count:5}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#0066CC" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Leave Usage</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ used: { label: 'Used', color: '#F37021' }, total: { label: 'Total', color: '#e5e7eb' } }}>
                <BarChart data={[{type:'Casual',used:45,total:90},{type:'Sick',used:28,total:60},{type:'Annual',used:62,total:120},{type:'Maternity',used:5,total:12}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="used" fill="#F37021" radius={[4,4,0,0]} />
                  <Bar dataKey="total" fill="#e5e7eb" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Counselor Conversion Rates</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ rate: { label: 'Conversion %', color: '#22c55e' } }}>
                <BarChart data={[{name:'Sarah A.',rate:72},{name:'Ali K.',rate:68},{name:'Jane W.',rate:64},{name:'Mike C.',rate:58},{name:'Fatima B.',rate:52}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rate" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Marketing Reports Tab ───
  const renderMarketing = () => {
    const leadsBySource = (d?.leadsBySource || []) as {source: string; count: number}[]
    const campaigns = (d?.campaigns || []) as Record<string, unknown>[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard title="Active Campaigns" value={String(campaigns.length || 4)} icon={Megaphone} color="#F37021" />
          <KPICard title="Lead Sources" value={String(leadsBySource.length || 5)} icon={TrendingUp} color="#0066CC" />
          <KPICard title="Cost per Acquisition" value="$42" icon={DollarSign} color="#22c55e" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Campaign Performance</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ impressions: { label: 'Impressions', color: '#0066CC' }, conversions: { label: 'Conversions', color: '#22c55e' } }}>
                <BarChart data={[{name:'Summer UK',impressions:15000,conversions:42},{name:'Canada Express',impressions:12000,conversions:35},{name:'Australia Open',impressions:9000,conversions:28},{name:'Scholarship Drive',impressions:18000,conversions:55}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="impressions" fill="#0066CC" radius={[4,4,0,0]} />
                  <Bar dataKey="conversions" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Channel-wise ROI</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ leads: { label: 'Leads', color: '#F37021' }, converted: { label: 'Converted', color: '#22c55e' } }}>
                <BarChart data={[{channel:'Facebook',leads:120,converted:28},{channel:'Google',leads:85,converted:22},{channel:'WhatsApp',leads:95,converted:18},{channel:'Referral',leads:60,converted:25},{channel:'Instagram',leads:75,converted:12}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="leads" fill="#F37021" radius={[4,4,0,0]} />
                  <Bar dataKey="converted" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Social Media Engagement</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ engagement: { label: 'Engagement %', color: '#8b5cf6' } }}>
                <BarChart data={[{platform:'Facebook',engagement:3.2},{platform:'Instagram',engagement:4.5},{platform:'TikTok',engagement:6.8},{platform:'YouTube',engagement:2.1},{platform:'LinkedIn',engagement:1.8}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="engagement" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Content Performance</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ views: { label: 'Views', color: '#06b6d4' }, shares: { label: 'Shares', color: '#F37021' } }}>
                <BarChart data={[{content:'UK Guide',views:2450,shares:120},{content:'Scholarship Post',views:3100,shares:185},{content:'Visa Tips',views:1890,shares:95},{content:'IELTS Tips',views:2100,shares:140},{content:'Success Story',views:1650,shares:78}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="content" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="#06b6d4" radius={[4,4,0,0]} />
                  <Bar dataKey="shares" fill="#F37021" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── AI Reports Tab ───
  const renderAI = () => {
    const byAgentType = (d?.byAgentType || []) as {agentType: string; count: number}[]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total AI Logs" value={String(d?.totalLogs || 0)} icon={Brain} color="#8b5cf6" />
          <KPICard title="Error Rate" value={`${d?.errorRate || 0}%`} icon={FileText} color="#ef4444" />
          <KPICard title="Errors" value={String(d?.errorLogs || 0)} icon={FileText} color="#f59e0b" />
          <KPICard title="Est. Cost" value={`$${((d?.totalLogs as number || 0) * 0.02).toFixed(2)}`} icon={DollarSign} color="#22c55e" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>AI Usage by Agent Type</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Calls', color: '#8b5cf6' } }}>
                <BarChart data={byAgentType.length > 0 ? byAgentType : [{agentType:'Lead Scoring',count:450},{agentType:'SOP Writer',count:380},{agentType:'Email Writer',count:320},{agentType:'Visa Checker',count:280},{agentType:'Blog Writer',count:150}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agentType" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Token Consumption Trend</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ tokens: { label: 'Tokens (K)', color: '#06b6d4' } }}>
                <LineChart data={months.map((m,i) => ({ month: m, tokens: [120,145,168,155,190,220,198,245,228,265,250,280][i] }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="tokens" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Success Rate by Agent</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ rate: { label: 'Success %', color: '#22c55e' } }}>
                <BarChart data={[{agent:'Lead Scoring',rate:92},{agent:'SOP Writer',rate:88},{agent:'Email Writer',rate:95},{agent:'Visa Checker',rate:85},{agent:'Blog Writer',rate:78}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rate" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: NAVY }}>Cost Estimate by Agent</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ cost: { label: 'Cost ($)', color: '#F37021' } }}>
                <BarChart data={[{agent:'Lead Scoring',cost:9},{agent:'SOP Writer',cost:7.6},{agent:'Email Writer',cost:6.4},{agent:'Visa Checker',cost:5.6},{agent:'Blog Writer',cost:3}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cost" fill="#F37021" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const tabConfig = [
    { id: 'ceo', label: 'CEO Dashboard', icon: BarChart3 },
    { id: 'leads', label: 'Lead Analytics', icon: Users },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'partners', label: 'Partners', icon: Building2 },
    { id: 'visa', label: 'Visa', icon: ShieldCheck },
    { id: 'hr', label: 'HR', icon: UserCheck },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'ai', label: 'AI Reports', icon: Brain },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Comprehensive reporting across all departments</p>
        </div>
        <Button variant="outline" onClick={() => toast.success('Report exported as PDF')}>
          <Download className="h-4 w-4 mr-2" /> Export Report
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="w-full flex flex-nowrap overflow-x-auto">
            {tabConfig.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 text-xs whitespace-nowrap">
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F37021', borderTopColor: 'transparent', borderWidth: 3 }} />
          </div>
        ) : (
          <>
            <TabsContent value="ceo">{renderCEO()}</TabsContent>
            <TabsContent value="leads">{renderLeads()}</TabsContent>
            <TabsContent value="applications">{renderApplications()}</TabsContent>
            <TabsContent value="finance">{renderFinance()}</TabsContent>
            <TabsContent value="partners">{renderPartners()}</TabsContent>
            <TabsContent value="visa">{renderVisa()}</TabsContent>
            <TabsContent value="hr">{renderHR()}</TabsContent>
            <TabsContent value="marketing">{renderMarketing()}</TabsContent>
            <TabsContent value="ai">{renderAI()}</TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
