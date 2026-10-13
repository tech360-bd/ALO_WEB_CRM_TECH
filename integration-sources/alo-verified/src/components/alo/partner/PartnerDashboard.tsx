'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import {
  GraduationCap, FileText, Wallet, DollarSign, Users, ArrowRight,
  CheckCircle2, Clock, TrendingUp, UserPlus, BarChart3, Building2,
  Download, CreditCard, Briefcase, Shield, ChevronRight
} from 'lucide-react'

const mockPartner = {
  companyName: 'EduBridge Bangladesh',
  partnerId: 'PTR-2024-001',
  partnershipType: 'TYPE1',
  commissionRate: 15,
}

const mockStats = {
  studentsReferred: 47,
  activeApplications: 23,
  commissionEarned: 12500,
  commissionPending: 4200,
}

const mockCommissionMonthly = [
  { month: 'Sep', amount: 1800 },
  { month: 'Oct', amount: 2200 },
  { month: 'Nov', amount: 1500 },
  { month: 'Dec', amount: 2800 },
  { month: 'Jan', amount: 2100 },
  { month: 'Feb', amount: 2100 },
]

const mockReferrals = [
  { id: '1', name: 'Tanvir Ahmed', university: 'University of Manchester', status: 'under_review', date: '2025-03-10' },
  { id: '2', name: 'Fatima Khan', university: 'University of Birmingham', status: 'conditional_offer', date: '2025-03-08' },
  { id: '3', name: 'Rahim Uddin', university: 'University of Leeds', status: 'submitted', date: '2025-03-05' },
  { id: '4', name: 'Nusrat Jahan', university: 'University of Sheffield', status: 'visa_applied', date: '2025-02-28' },
  { id: '5', name: 'Kamal Hossain', university: 'University of Bristol', status: 'enrolled', date: '2025-01-15' },
]

const mockStatusBreakdown = [
  { status: 'Submitted', count: 8, color: 'bg-[#0066CC]' },
  { status: 'Under Review', count: 5, color: 'bg-yellow-400' },
  { status: 'Offer', count: 4, color: 'bg-green-400' },
  { status: 'CAS', count: 3, color: 'bg-purple-400' },
  { status: 'Visa', count: 2, color: 'bg-emerald-400' },
  { status: 'Enrolled', count: 1, color: 'bg-[#F37021]' },
]

const mockStaff = [
  { id: '1', name: 'Ahmed Rahman', role: 'Branch Manager', students: 12, email: 'ahmed@edubridge.bd' },
  { id: '2', name: 'Sadia Islam', role: 'Counselor', students: 8, email: 'sadia@edubridge.bd' },
  { id: '3', name: 'Karim Shah', role: 'Counselor', students: 6, email: 'karim@edubridge.bd' },
]

const statusColorMap: Record<string, string> = {
  submitted: 'bg-blue-50 text-blue-700',
  under_review: 'bg-yellow-50 text-yellow-700',
  conditional_offer: 'bg-orange-50 text-orange-700',
  unconditional_offer: 'bg-green-50 text-green-700',
  visa_applied: 'bg-indigo-50 text-indigo-700',
  enrolled: 'bg-teal-50 text-teal-700',
}

export default function PartnerDashboard() {
  const { currentUser, setCurrentView } = useAppStore()
  const partnerName = currentUser?.name || mockPartner.companyName
  const maxCommission = Math.max(...mockCommissionMonthly.map(m => m.amount))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Welcome, {partnerName}! 🤝</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mockPartner.companyName} · {mockPartner.partnerId}
            <Badge className={`ml-2 text-xs ${mockPartner.partnershipType === 'TYPE1' ? 'bg-[#F37021]/10 text-[#F37021]' : 'bg-[#0066CC]/10 text-[#0066CC]'}`}>
              {mockPartner.partnershipType} Partner · {mockPartner.commissionRate}% Commission
            </Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCurrentView('partner-submit-student')}
            className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
            <UserPlus className="h-4 w-4 mr-2" /> Submit Student
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('partner-commissions')}>
            <Wallet className="h-4 w-4 mr-2" /> Commissions
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Students Referred', value: mockStats.studentsReferred, icon: <GraduationCap className="h-5 w-5" />, bg: 'bg-[#0066CC]/10', textColor: 'text-[#0066CC]' },
          { label: 'Active Applications', value: mockStats.activeApplications, icon: <FileText className="h-5 w-5" />, bg: 'bg-yellow-50', textColor: 'text-yellow-600' },
          { label: 'Commission Earned', value: `£${mockStats.commissionEarned.toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'Commission Pending', value: `£${mockStats.commissionPending.toLocaleString()}`, icon: <Clock className="h-5 w-5" />, bg: 'bg-[#F37021]/10', textColor: 'text-[#F37021]' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Commission Overview Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#F37021]" /> Commission Overview
                </CardTitle>
                <Badge variant="outline" className="text-xs">Last 6 months</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-end gap-2 h-36">
                {mockCommissionMonthly.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-[#1A2332]">£{m.amount.toLocaleString()}</span>
                    <div className="w-full rounded-t-md bg-[#F37021]/20 relative" style={{ height: `${(m.amount / maxCommission) * 100}%` }}>
                      <div className="absolute bottom-0 w-full rounded-t-md bg-[#F37021]" style={{ height: '60%' }} />
                    </div>
                    <span className="text-[10px] text-gray-500">{m.month}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Earned (6 months)</span>
                <span className="font-bold text-[#1A2332]">£{mockCommissionMonthly.reduce((s, m) => s + m.amount, 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Student Referrals */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0066CC]" /> Recent Student Referrals
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#F37021]" onClick={() => setCurrentView('partner-students')}>
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {mockReferrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#0066CC]/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-[#0066CC]">{ref.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A2332]">{ref.name}</p>
                        <p className="text-xs text-gray-500">{ref.university} · {new Date(ref.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${statusColorMap[ref.status] || 'bg-gray-100 text-gray-600'}`}>
                      {ref.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Status Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#F37021]" /> Application Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {mockStatusBreakdown.map((item) => {
                  const total = mockStatusBreakdown.reduce((s, i) => s + i.count, 0)
                  const pct = Math.round((item.count / total) * 100)
                  return (
                    <div key={item.status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{item.status}</span>
                        <span className="text-[#1A2332] font-medium">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${item.color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Links */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A2332]">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                {[
                  { label: 'Submit Student', view: 'partner-submit-student' as const, icon: <UserPlus className="h-4 w-4" />, color: 'text-[#F37021]', desc: 'Refer a new student' },
                  { label: 'View Commissions', view: 'partner-commissions' as const, icon: <Wallet className="h-4 w-4" />, color: 'text-green-600', desc: 'Track earnings' },
                  { label: 'Download Reports', view: 'partner-reports' as const, icon: <Download className="h-4 w-4" />, color: 'text-[#0066CC]', desc: 'Export data' },
                ].map((action) => (
                  <Button key={action.label} variant="outline"
                    className="w-full h-auto py-3 px-4 flex items-center gap-3 hover:bg-gray-50 justify-start"
                    onClick={() => setCurrentView(action.view)}>
                    <span className={action.color}>{action.icon}</span>
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-[#1A2332]">{action.label}</p>
                      <p className="text-[10px] text-gray-400">{action.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Partner Staff Overview */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0066CC]" /> Staff Overview
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#F37021]" onClick={() => setCurrentView('partner-staff')}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {mockStaff.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#1A2332] rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{s.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A2332] truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-500">{s.role} · {s.students} students</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{s.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1A2332] to-[#1A2332]/90 text-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-[#F37021]" />
                <p className="font-semibold">Partner Performance</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Success Rate</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-[#F37021] rounded-full h-1.5" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Visa Approval</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-green-400 rounded-full h-1.5" style={{ width: '92%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Commission Collected</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-[#0066CC] rounded-full h-1.5" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
