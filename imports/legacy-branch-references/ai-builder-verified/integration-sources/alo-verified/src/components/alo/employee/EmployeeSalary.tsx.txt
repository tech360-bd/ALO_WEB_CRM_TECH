'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DollarSign, Download, Eye, Banknote, Receipt, TrendingUp,
  Wallet, PiggyBank, Building, CreditCard, FileText, Shield,
} from 'lucide-react'
import { toast } from 'sonner'

interface Payslip {
  id: string
  month: number
  year: number
  basicSalary: number
  totalAllowance: number
  totalDeduction: number
  netSalary: number
  status: string
  employee: { firstName: string; lastName: string; employeeId: string }
}

const mockSalaryBreakdown = {
  basic: 35000,
  hra: 12000,
  transport: 5000,
  medical: 3000,
  special: 4000,
  providentFund: 4200,
  tax: 3500,
  insurance: 1500,
}

export default function EmployeeSalary() {
  const { currentUser } = useAppStore()
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [summary, setSummary] = useState({ totalNetSalary: 0, totalBasicSalary: 0, totalAllowance: 0, totalDeduction: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())

  useEffect(() => { fetchPayslips() }, [currentUser, filterYear])

  const fetchPayslips = async () => {
    try {
      setLoading(true)
      const empId = currentUser?.referenceId
      if (!empId) { setLoading(false); return }
      const url = `/api/payroll?employeeId=${empId}&limit=12&year=${filterYear}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setPayslips(json.payslips || [])
        setSummary(json.summary || { totalNetSalary: 0, totalBasicSalary: 0, totalAllowance: 0, totalDeduction: 0 })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const viewPayslip = (payslip: Payslip) => { setSelectedPayslip(payslip); setDetailOpen(true) }
  const downloadPayslip = (payslip: Payslip) => { toast.success(`Downloading payslip for ${getMonthName(payslip.month)} ${payslip.year}`) }
  const getMonthName = (month: number) => ['January','February','March','April','May','June','July','August','September','October','November','December'][month - 1] || ''

  const totalEarnings = mockSalaryBreakdown.basic + mockSalaryBreakdown.hra + mockSalaryBreakdown.transport + mockSalaryBreakdown.medical + mockSalaryBreakdown.special
  const totalDeductions = mockSalaryBreakdown.providentFund + mockSalaryBreakdown.tax + mockSalaryBreakdown.insurance
  const netPay = totalEarnings - totalDeductions

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Salary & Payslips</h1>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Current Month Salary Overview */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-[#1A2332] to-[#0066CC] text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#F37021] rounded-xl flex items-center justify-center">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Current Month Net Pay</p>
                <p className="text-3xl font-bold">৳{netPay.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{getMonthName(new Date().getMonth() + 1)} {new Date().getFullYear()}</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-4 py-1 text-sm">Paid</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Salary Component Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center">
              <Banknote className="h-5 w-5 text-[#F37021]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A2332]">৳{mockSalaryBreakdown.basic.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Basic Salary</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0066CC]/10 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-[#0066CC]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A2332]">৳{mockSalaryBreakdown.hra.toLocaleString()}</p>
              <p className="text-xs text-gray-500">HRA</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A2332]">৳{(totalEarnings - mockSalaryBreakdown.basic).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Allowances</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Receipt className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A2332]">৳{totalDeductions.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Deductions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Breakdown with Progress Bars */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A2332]">Salary Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Earnings */}
            <div>
              <h4 className="font-semibold text-[#1A2332] mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" /> Earnings
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Basic Salary', value: mockSalaryBreakdown.basic, color: 'bg-[#F37021]' },
                  { label: 'HRA', value: mockSalaryBreakdown.hra, color: 'bg-[#0066CC]' },
                  { label: 'Transport Allowance', value: mockSalaryBreakdown.transport, color: 'bg-green-500' },
                  { label: 'Medical Allowance', value: mockSalaryBreakdown.medical, color: 'bg-purple-500' },
                  { label: 'Special Allowance', value: mockSalaryBreakdown.special, color: 'bg-teal-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#555555]">{item.label}</span>
                      <span className="font-medium text-[#1A2332]">৳{item.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.value / totalEarnings) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span className="text-green-700">Total Earnings</span>
                  <span className="text-green-700">৳{totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 className="font-semibold text-[#1A2332] mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-red-600" /> Deductions
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Provident Fund', value: mockSalaryBreakdown.providentFund, color: 'bg-red-500' },
                  { label: 'Income Tax', value: mockSalaryBreakdown.tax, color: 'bg-orange-500' },
                  { label: 'Health Insurance', value: mockSalaryBreakdown.insurance, color: 'bg-pink-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#555555]">{item.label}</span>
                      <span className="font-medium text-[#1A2332]">৳{item.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.value / totalEarnings) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span className="text-red-700">Total Deductions</span>
                  <span className="text-red-700">৳{totalDeductions.toLocaleString()}</span>
                </div>
                <div className="bg-[#F7F9FC] p-4 rounded-lg mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-[#1A2332]">Net Pay</span>
                    <span className="text-[#F37021]">৳{netPay.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payslip History */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A2332]">Payslip History</CardTitle>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No payslips found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-medium">{getMonthName(payslip.month)} {payslip.year}</TableCell>
                      <TableCell>৳{payslip.basicSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">+৳{payslip.totalAllowance.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">-৳{payslip.totalDeduction.toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">৳{payslip.netSalary.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={payslip.status === 'paid' ? 'bg-green-100 text-green-700' : payslip.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'}>
                          {payslip.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewPayslip(payslip)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => downloadPayslip(payslip)}><Download className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Info + Bank Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tax Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0066CC]" /> Tax Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-[#555555]">Tax ID (TIN)</span>
              <span className="font-medium text-[#1A2332]">XXXX-XXXX-1234</span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-[#555555]">Tax Bracket</span>
              <span className="font-medium text-[#1A2332]">10%</span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-[#555555]">YTD Tax Paid</span>
              <span className="font-medium text-[#1A2332]">৳{(mockSalaryBreakdown.tax * 7).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-[#555555]">YTD Gross Income</span>
              <span className="font-medium text-[#1A2332]">৳{(totalEarnings * 7).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#F37021]" /> Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-[#555555]">Bank Name</span>
              <span className="font-medium text-[#1A2332]">Dutch-Bangla Bank Ltd</span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-[#555555]">Account Number</span>
              <span className="font-medium text-[#1A2332]">XXXX-XXXX-5678</span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-[#555555]">Account Type</span>
              <span className="font-medium text-[#1A2332]">Savings</span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-[#555555]">Branch</span>
              <span className="font-medium text-[#1A2332]">Banani, Dhaka</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslip Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">
              Payslip - {selectedPayslip ? `${getMonthName(selectedPayslip.month)} ${selectedPayslip.year}` : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-4">
              <div className="bg-[#F7F9FC] p-4 rounded-lg">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-[#1A2332]">ALO Education</h3>
                  <p className="text-sm text-gray-500">Salary Breakdown</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Basic Salary</span><span className="font-medium">৳{selectedPayslip.basicSalary.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-green-600"><span>+ Total Allowances</span><span>৳{selectedPayslip.totalAllowance.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-red-600"><span>- Total Deductions</span><span>৳{selectedPayslip.totalDeduction.toLocaleString()}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-[#1A2332]"><span>Net Salary</span><span>৳{selectedPayslip.netSalary.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Badge className={selectedPayslip.status === 'paid' ? 'bg-green-100 text-green-700' : selectedPayslip.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'}>
                  {selectedPayslip.status}
                </Badge>
                <Button onClick={() => downloadPayslip(selectedPayslip)} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
