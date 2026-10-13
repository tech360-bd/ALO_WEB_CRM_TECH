'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign, Clock, Wallet, FileText, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Receipt, CreditCard, Users, Zap,
  PiggyBank, BarChart3,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { useAppStore } from '@/lib/store'

const revenueData = [
  { month: 'Apr', revenue: 42000, expenses: 28000 },
  { month: 'May', revenue: 55000, expenses: 31000 },
  { month: 'Jun', revenue: 48000, expenses: 27000 },
  { month: 'Jul', revenue: 61000, expenses: 33000 },
  { month: 'Aug', revenue: 72000, expenses: 36000 },
  { month: 'Sep', revenue: 85000, expenses: 39000 },
  { month: 'Oct', revenue: 78000, expenses: 35000 },
  { month: 'Nov', revenue: 69000, expenses: 32000 },
  { month: 'Dec', revenue: 82000, expenses: 37000 },
  { month: 'Jan', revenue: 91000, expenses: 41000 },
  { month: 'Feb', revenue: 95000, expenses: 38000 },
  { month: 'Mar', revenue: 102000, expenses: 42000 },
]

const agingData = [
  { range: '0-30 days', amount: 32000, color: '#4CAF50' },
  { range: '31-60 days', amount: 18500, color: '#F37021' },
  { range: '61-90 days', amount: 9200, color: '#FFB347' },
  { range: '90+ days', amount: 4300, color: '#E91E63' },
]

const recentPayments = [
  { id: 'PAY-001', partner: 'EduBridge BD', student: 'Tanvir Ahmed', amount: 1500, date: '2025-03-06', method: 'Bank Transfer' },
  { id: 'PAY-002', partner: 'Global Study', student: 'Fatima Begum', amount: 2200, date: '2025-03-05', method: 'Wire Transfer' },
  { id: 'PAY-003', partner: 'StudyUK Ltd', student: 'Arif Khan', amount: 1800, date: '2025-03-04', method: 'Bank Transfer' },
  { id: 'PAY-004', partner: 'EduBridge BD', student: 'Sadia Islam', amount: 1200, date: '2025-03-03', method: 'Cheque' },
]

const commissionSummary = [
  { partner: 'EduBridge BD', earned: 8500, pending: 3200, type: 'TYPE1' },
  { partner: 'Global Study', earned: 6200, pending: 2100, type: 'TYPE2' },
  { partner: 'StudyUK Ltd', earned: 4800, pending: 1500, type: 'TYPE1' },
  { partner: 'Campus Connect', earned: 3100, pending: 800, type: 'TYPE2' },
]

export default function FinanceDashboard() {
  const { setCurrentView } = useAppStore()

  const stats = [
    { title: 'Total Revenue', value: '£102K', icon: <DollarSign className="h-5 w-5" />, color: 'text-[#F37021]', bg: 'bg-[#F37021]/10', trend: '+18%', up: true },
    { title: 'Outstanding Invoices', value: '£64K', icon: <FileText className="h-5 w-5" />, color: 'text-[#0066CC]', bg: 'bg-[#0066CC]/10', trend: '-5%', up: false },
    { title: 'Commission Payable', value: '£7.6K', icon: <Wallet className="h-5 w-5" />, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10', trend: '+8%', up: true },
    { title: 'Monthly Collection', value: '£95K', icon: <CreditCard className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50', trend: '+12%', up: true },
    { title: 'Expenses', value: '£42K', icon: <TrendingDown className="h-5 w-5" />, color: 'text-red-500', bg: 'bg-red-50', trend: '+3%', up: true },
    { title: 'Net Profit', value: '£60K', icon: <PiggyBank className="h-5 w-5" />, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', trend: '+22%', up: true },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Finance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Revenue, invoices, commissions and payment tracking</p>
        </div>
        <Badge variant="outline" className="w-fit border-[#0066CC]/30 text-[#0066CC] bg-[#0066CC]/5 px-3 py-1 text-xs font-medium">
          Finance Team
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{s.trend}
                </span>
              </div>
              <p className="text-xl font-bold text-[#1A2332]">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#F37021]" /> Revenue Trend (12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, name: string) => [`£${v.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#F37021" fill="#F37021" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#0066CC" fill="#0066CC" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Invoice Aging & Commission Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Aging */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#0066CC]" /> Invoice Aging Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agingData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`£${v.toLocaleString()}`, 'Outstanding']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                  {agingData.map((entry, i) => (
                    <rect key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {agingData.map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="text-xs text-gray-600">{a.range}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1A2332]">£{a.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Commission Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#FFB347]" /> Commission Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {commissionSummary.map((c, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1A2332]">{c.partner}</span>
                      <Badge className={`${c.type === 'TYPE1' ? 'bg-[#F37021]/10 text-[#F37021]' : 'bg-[#0066CC]/10 text-[#0066CC]'} text-[9px] border-0`}>{c.type}</Badge>
                    </div>
                    <span className="text-sm font-bold text-[#1A2332]">£{c.earned.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(c.earned / (c.earned + c.pending)) * 100} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-gray-500">£{c.pending.toLocaleString()} pending</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-green-600" /> Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Partner</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#0066CC]">{p.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.partner}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.student}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600">£{p.amount.toLocaleString()}</td>
                    <td className="py-3 px-4"><Badge className="bg-gray-100 text-gray-600 text-[10px] border-0">{p.method}</Badge></td>
                    <td className="py-3 px-4 text-sm text-gray-500">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-finance')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F37021]/10 rounded-xl flex items-center justify-center text-[#F37021]"><Receipt className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Create Invoice</p><p className="text-[11px] text-gray-500">Generate new invoice</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-finance')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600"><CreditCard className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Record Payment</p><p className="text-[11px] text-gray-500">Log received payment</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-commissions')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0066CC]/10 rounded-xl flex items-center justify-center text-[#0066CC]"><Wallet className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Process Commissions</p><p className="text-[11px] text-gray-500">Review & pay commissions</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
