'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import {
  TrendingUp, DollarSign, BarChart3, Download, ArrowUpRight,
  ArrowDownRight, Calendar, Wallet, CreditCard, Users, Building2
} from 'lucide-react'
import { toast } from 'sonner'

// Brand colors
const COLORS = ['#F37021', '#0066CC', '#22c55e', '#FFB347', '#8b5cf6', '#06b6d4', '#ef4444', '#6b7280']

const chartConfig = {
  revenue: { label: 'Revenue', color: '#F37021' },
  expenses: { label: 'Expenses', color: '#0066CC' },
  profit: { label: 'Profit', color: '#22c55e' },
  pending: { label: 'Pending', color: '#FFB347' },
  paid: { label: 'Paid', color: '#22c55e' },
  commissions: { label: 'Commissions', color: '#8b5cf6' },
  income: { label: 'Income', color: '#F37021' },
  outgoing: { label: 'Outgoing', color: '#0066CC' },
  cashflow: { label: 'Cash Flow', color: '#22c55e' },
}

// --- Mock Data ---
const revenueMonthly = [
  { month: 'Sep', revenue: 45000, expenses: 28000 },
  { month: 'Oct', revenue: 52000, expenses: 31000 },
  { month: 'Nov', revenue: 48000, expenses: 29000 },
  { month: 'Dec', revenue: 61000, expenses: 35000 },
  { month: 'Jan', revenue: 58000, expenses: 32000 },
  { month: 'Feb', revenue: 72000, expenses: 38000 },
]

const expenseByCategory = [
  { name: 'Office', value: 8500, color: '#0066CC' },
  { name: 'Marketing', value: 12400, color: '#8b5cf6' },
  { name: 'Travel', value: 4200, color: '#22c55e' },
  { name: 'Salary', value: 36000, color: '#F37021' },
  { name: 'Commission', value: 12800, color: '#FFB347' },
  { name: 'Technology', value: 3600, color: '#06b6d4' },
  { name: 'Other', value: 1800, color: '#6b7280' },
]

const incomeVsExpenses = [
  { month: 'Sep', income: 45000, expenses: 28000 },
  { month: 'Oct', income: 52000, expenses: 31000 },
  { month: 'Nov', income: 48000, expenses: 29000 },
  { month: 'Dec', income: 61000, expenses: 35000 },
  { month: 'Jan', income: 58000, expenses: 32000 },
  { month: 'Feb', income: 72000, expenses: 38000 },
]

const outstandingPayments = [
  { student: 'Ahmed Rahman', invoice: 'INV-20260003', amount: 8500, days: 35, status: 'overdue' },
  { student: 'Sarah Khan', invoice: 'INV-20260002', amount: 11000, days: 12, status: 'partial' },
  { student: 'Mohammed Ali', invoice: 'INV-20260005', amount: 18000, days: 5, status: 'pending' },
  { student: 'Rina Akter', invoice: 'INV-20260010', amount: 6500, days: 2, status: 'pending' },
]

const commissionPayouts = [
  { partner: 'EduBridge Bangladesh', total: 12800, pending: 3200, paid: 9600, rate: '15%' },
  { partner: 'StudyLink International', total: 8500, pending: 4500, paid: 4000, rate: '10%' },
  { partner: 'Global Education BD', total: 6200, pending: 0, paid: 6200, rate: '12%' },
  { partner: 'Campus Connect', total: 3100, pending: 3100, paid: 0, rate: '15%' },
]

const studentPaymentStatus = [
  { name: 'Fully Paid', value: 45, color: '#22c55e' },
  { name: 'Partial', value: 18, color: '#0066CC' },
  { name: 'Pending', value: 22, color: '#FFB347' },
  { name: 'Overdue', value: 8, color: '#ef4444' },
  { name: 'Refunded', value: 3, color: '#8b5cf6' },
]

const cashFlowData = [
  { month: 'Sep', inflow: 48000, outflow: 32000, net: 16000 },
  { month: 'Oct', inflow: 55000, outflow: 34000, net: 21000 },
  { month: 'Nov', inflow: 49000, outflow: 31000, net: 18000 },
  { month: 'Dec', inflow: 63000, outflow: 38000, net: 25000 },
  { month: 'Jan', inflow: 60000, outflow: 35000, net: 25000 },
  { month: 'Feb', inflow: 78000, outflow: 40000, net: 38000 },
]

export default function FinanceReports() {
  const [period, setPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleExport = () => {
    toast.success('Financial report exported successfully')
  }

  // Compute summary stats
  const totalRevenue = revenueMonthly.reduce((s, m) => s + m.revenue, 0)
  const totalExpenses = revenueMonthly.reduce((s, m) => s + m.expenses, 0)
  const netProfit = totalRevenue - totalExpenses
  const totalOutstanding = outstandingPayments.reduce((s, p) => s + p.amount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-64 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Finance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive financial analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} className="border-[#F37021] text-[#F37021]">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[#F37021]" />
            </div>
            <div>
              <p className="text-lg font-bold">£{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> +12.5%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-bold">£{totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-xs text-red-600 flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" /> +8.2%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">£{netProfit.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Net Profit</p>
              <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> +18.3%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold">£{totalOutstanding.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="text-xs text-amber-600">{outstandingPayments.length} invoices</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Revenue Trend + Expense Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Revenue Summary</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart data={revenueMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="#F37021" fill="#F37021" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Expense Breakdown by Category</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Income vs Expenses Bar + Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="#F37021" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#0066CC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Cash Flow</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="inflow" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="outflow" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="net" stroke="#F37021" fill="#F37021" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Student Payment Distribution + Commission Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Payment Status Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Student Payment Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ChartContainer config={chartConfig} className="h-48 w-48">
                <PieChart>
                  <Pie
                    data={studentPaymentStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {studentPaymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="space-y-2">
                {studentPaymentStatus.map(s => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm">{s.name}</span>
                    <span className="text-sm font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Payouts Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Commission Payouts Summary</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <BarChart data={commissionPayouts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="partner" fontSize={11} width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="paid" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" fill="#FFB347" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Payments Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Outstanding Payments</CardTitle>
          <Badge className="bg-amber-100 text-amber-700 border-0">{outstandingPayments.length} invoices</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead><TableHead>Invoice</TableHead><TableHead>Amount</TableHead>
                  <TableHead>Days Outstanding</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingPayments.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.student}</TableCell>
                    <TableCell className="font-mono text-xs">{p.invoice}</TableCell>
                    <TableCell className="font-semibold">£{p.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${p.days > 30 ? 'text-red-600' : p.days > 10 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {p.days} days
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        p.status === 'overdue' ? 'bg-red-100 text-red-700 border-0' :
                        p.status === 'partial' ? 'bg-blue-100 text-blue-700 border-0' :
                        'bg-yellow-100 text-yellow-700 border-0'
                      }>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Commission Payout Details */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Commission Payout Details</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead><TableHead>Total Commission</TableHead>
                  <TableHead>Paid</TableHead><TableHead>Pending</TableHead><TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionPayouts.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.partner}</TableCell>
                    <TableCell className="font-semibold">£{c.total.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">£{c.paid.toLocaleString()}</TableCell>
                    <TableCell className={c.pending > 0 ? 'text-amber-600' : 'text-gray-400'}>
                      {c.pending > 0 ? `£${c.pending.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell><Badge variant="outline">{c.rate}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
