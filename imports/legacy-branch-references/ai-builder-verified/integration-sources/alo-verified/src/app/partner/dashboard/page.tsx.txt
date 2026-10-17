'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Send,
  CheckCircle2,
  Wallet,
  TrendingUp,
  Clock,
  Bell,
  QrCode,
  Copy,
  Printer,
  UserPlus,
  Search,
  BookOpen,
  Phone,
  Mail,
  Star,
  XCircle,
  Pause,
  AlertCircle,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getSession } from '@/lib/session'
import { usePortalData } from '@/hooks/use-portal-data'
import { StatCard } from '@/components/alo/portal/StatCard'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { toast } from 'sonner'

interface PartnerDashboardData {
  role: string
  partner?: { id: string; partnerId: string }
  stats: {
    totalStudents: number
    totalApplications: number
    totalCommissions: number
    commissionAmount: number
    pendingCommissions: number
  }
  recent: {
    students: Array<{ id: string; studentId: string; firstName: string; lastName: string; email: string; status: string; createdAt: string }>
    applications: Array<{ id: string; applicationId: string; status: string; student?: { firstName: string; lastName: string }; university?: { name: string } }>
    commissions: Array<{ id: string; amount: number; status: string; createdAt: string }>
  }
}

export default function PartnerDashboardPage() {
  const session = getSession()
  const { data, loading } = usePortalData<PartnerDashboardData>({
    endpoint: '/api/dashboard',
    params: { userId: session?.user.id, userType: 'partner' },
  })

  const [registrationLink, setRegistrationLink] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRegistrationLink(`${window.location.origin}/?register=partner&utm=partner_portal`)
    }
  }, [])

  const copyLink = () => {
    if (registrationLink) {
      navigator.clipboard.writeText(registrationLink)
      toast.success('Registration link copied to clipboard')
    }
  }

  const stats = data?.stats
  const offersCount = data?.recent.applications?.filter(
    (a) => a.status === 'conditional_offer' || a.status === 'unconditional_offer'
  ).length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Dashboard"
        description="Manage your students, applications, and commissions."
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/partner/search-programs">
                <Search className="h-4 w-4 mr-2" /> Request Program
              </Link>
            </Button>
            <Button asChild className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0">
              <Link href="/partner/register-student">
                <UserPlus className="h-4 w-4 mr-2" /> Register Student
              </Link>
            </Button>
          </div>
        }
      />

      {/* Registration QR + Quick filters row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="h-5 w-5 text-[#E8501A]" />
            <h3 className="font-bold text-slate-900">Student Registration</h3>
          </div>
          <div className="flex flex-col items-center text-center py-2">
            <div className="h-32 w-32 bg-white border-4 border-slate-100 rounded-xl flex items-center justify-center p-2 mb-3">
              {/* Stylized QR placeholder using CSS grid */}
              <div className="grid grid-cols-8 gap-px w-full h-full">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-[1px]',
                      [0,1,2,5,6,7,8,15,16,18,21,23,24,28,31,32,34,37,39,40,44,47,48,50,53,55,56,63].includes(i) ||
                      (i % 7 === 0) || (i % 11 === 0)
                        ? 'bg-slate-900'
                        : 'bg-transparent'
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">Scan to register as a student</p>
            <div className="w-full flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={copyLink}>
                <Copy className="h-3 w-3 mr-1" /> Copy Link
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="h-3 w-3 mr-1" /> Print
              </Button>
            </div>
            <div className="mt-3 w-full p-2 rounded-md bg-slate-50 text-[10px] text-slate-500 break-all">
              {registrationLink || 'Loading…'}
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-6 border-0 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4">Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium">Date Range</label>
              <select className="w-full mt-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This year</option>
                <option>All time</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Intake</label>
              <select className="w-full mt-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                <option>All intakes</option>
                <option>September 2026</option>
                <option>January 2027</option>
                <option>September 2027</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Country</label>
              <select className="w-full mt-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                <option>All countries</option>
                <option>United Kingdom</option>
                <option>Canada</option>
                <option>Australia</option>
                <option>United States</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Apps" value={stats?.totalApplications ?? 0} icon={Send} accent="blue" />
        <StatCard label="Offers" value={offersCount} icon={CheckCircle2} accent="green" />
        <StatCard label="Payments" value={stats?.totalCommissions ?? 0} icon={Wallet} accent="purple" />
        <StatCard label="Visa Received" value={Math.floor((stats?.totalApplications ?? 0) * 0.4)} icon={CheckCircle2} accent="green" />
        <StatCard label="Visa Rejected" value={Math.floor((stats?.totalApplications ?? 0) * 0.05)} icon={XCircle} accent="orange" />
        <StatCard label="Non-Enrolments" value={Math.floor((stats?.totalStudents ?? 0) * 0.1)} icon={AlertCircle} accent="slate" />
      </div>

      {/* Deferrals + Pending + Deadlines */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Pause className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-slate-900">Deferrals</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">2</p>
          <p className="text-xs text-slate-500 mt-1">Deferred to next intake</p>
        </Card>
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Pending from Partner</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">5</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting your action</p>
        </Card>
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-[#E8501A]" />
            <h3 className="font-bold text-slate-900">Total Earnings</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ৳{(stats?.commissionAmount ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">{stats?.pendingCommissions ?? 0} pending claims</p>
        </Card>
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Recent Students */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Students</h3>
              <Link href="/partner/students" className="text-sm text-[#E8501A] hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}
              </div>
            ) : data?.recent.students && data.recent.students.length > 0 ? (
              <div className="space-y-2">
                {data.recent.students.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#E8501A] to-[#0057B8] flex items-center justify-center text-white text-xs font-bold">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-slate-500">{s.studentId} • {s.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">{s.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">No students yet</div>
            )}
          </Card>

          {/* Recent Applications */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Applications</h3>
              <Link href="/partner/applications" className="text-sm text-[#E8501A] hover:underline">View all</Link>
            </div>
            {data?.recent.applications && data.recent.applications.length > 0 ? (
              <div className="space-y-2">
                {data.recent.applications.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                    <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                      <Send className="h-4 w-4 text-[#0057B8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {a.student ? `${a.student.firstName} ${a.student.lastName}` : 'Application'} • {a.university?.name || '—'}
                      </p>
                      <p className="text-xs text-slate-500">{a.applicationId}</p>
                    </div>
                    <Badge className="capitalize border-0 bg-slate-100 text-slate-700">{a.status.replace(/_/g,' ')}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">No applications yet</div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0057B8]" />
                <h3 className="font-bold text-slate-900">Upcoming Deadlines</h3>
              </div>
              <Link href="/partner/deadlines" className="text-xs text-[#E8501A] hover:underline">All</Link>
            </div>
            <div className="space-y-3">
              {[
                { uni: 'University of Leeds', intake: 'Sep 2026', days: 12 },
                { uni: 'University of Manchester', intake: 'Jan 2027', days: 28 },
                { uni: 'University of Birmingham', intake: 'Sep 2026', days: 5 },
              ].map((d) => (
                <div key={d.uni} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold',
                    d.days <= 7 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>
                    {d.days}d
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{d.uni}</p>
                    <p className="text-xs text-slate-500">{d.intake}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Important Updates */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-[#E8501A]" />
              <h3 className="font-bold text-slate-900">Important Updates</h3>
            </div>
            <div className="space-y-3">
              {[
                'UK visa processing times updated — expect 15 working days',
                'New scholarship available at University of Sheffield',
                'September 2026 intake deadline approaching',
              ].map((u, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E8501A] mt-1.5 shrink-0" />
                  <p className="text-slate-700">{u}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Partner Account Manager */}
          <Card className="p-6 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}>
            <p className="text-xs text-white/80 mb-3">Your Account Manager</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">SJ</div>
              <div>
                <p className="font-bold text-white">Sarah Johnson</p>
                <p className="text-xs text-white/80">Senior Partner Manager</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1">
                <Phone className="h-3 w-3 mr-1" /> Call
              </Button>
              <Button size="sm" variant="secondary" className="flex-1">
                <Mail className="h-3 w-3 mr-1" /> Email
              </Button>
            </div>
          </Card>

          {/* Quick Links */}
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-3">Quick Links</h3>
            <div className="space-y-1">
              {[
                { label: 'Search Programs', href: '/partner/search-programs', icon: Search },
                { label: 'Commission Structure', href: '/partner/commission-structure', icon: TrendingUp },
                { label: 'Learning Resources', href: '/partner/learning-resources', icon: BookOpen },
                { label: 'AI Mock Interview', href: '/partner/ai-mock-interview', icon: Star },
              ].map((l) => {
                const Icon = l.icon
                return (
                  <Link key={l.href} href={l.href} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700">
                    <Icon className="h-4 w-4 text-[#0057B8]" /> <span className="flex-1">{l.label}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function cn(...args: Array<string | false | undefined>) {
  return args.filter(Boolean).join(' ')
}
