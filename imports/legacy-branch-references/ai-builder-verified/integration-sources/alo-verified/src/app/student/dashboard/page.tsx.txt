'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Send,
  FileText,
  Calendar,
  MessageSquare,
  GraduationCap,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Award,
  Plane,
  Sparkles,
  AlertCircle,
  Mail,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { getSession } from '@/lib/session'
import { usePortalData } from '@/hooks/use-portal-data'
import { StatCard } from '@/components/alo/portal/StatCard'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { cn } from '@/lib/utils'

const JOURNEY_STAGES = [
  'Lead Created',
  'Profile Completed',
  'Documents Uploaded',
  'Course Shortlisted',
  'Application Submitted',
  'Conditional Offer',
  'Unconditional Offer',
  'Deposit Paid',
  'CAS/I-20/COE',
  'Visa File Ready',
  'Visa Submitted',
  'Visa Decision',
  'Pre-Departure',
  'Enrolled',
]

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-50 text-[#0057B8]',
  under_review: 'bg-amber-50 text-amber-600',
  conditional_offer: 'bg-purple-50 text-purple-600',
  unconditional_offer: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-600',
  enrolled: 'bg-green-50 text-green-700',
}

interface StudentDashboardData {
  role: string
  student?: { id: string; studentId: string; name: string }
  stats: { totalApplications: number; totalDocuments: number; upcomingAppointments: number }
  recent: {
    applications: Array<{
      id: string
      applicationId: string
      status: string
      university?: { name: string; country: string }
      course?: { name: string; level: string }
      createdAt: string
    }>
    documents: Array<{ id: string; fileName: string; documentType: string; status: string; uploadedAt: string }>
    appointments: Array<{ id: string; title: string; date: string; type: string; status: string }>
  }
}

export default function StudentDashboardPage() {
  const session = getSession()
  const { data, loading } = usePortalData<StudentDashboardData>({
    endpoint: '/api/dashboard',
    params: { userId: session?.user.id, userType: 'student' },
  })

  const [journeyStage, setJourneyStage] = useState(4)

  useEffect(() => {
    if (!data?.recent?.applications?.length) {
      setJourneyStage(4)
      return
    }
    const apps = data.recent.applications
    const hasEnrolled = apps.some((a) => a.status === 'enrolled')
    const hasUnconditional = apps.some((a) => a.status === 'unconditional_offer')
    const hasConditional = apps.some((a) => a.status === 'conditional_offer')
    const hasSubmitted = apps.some((a) => a.status === 'submitted' || a.status === 'under_review')

    if (hasEnrolled) setJourneyStage(13)
    else if (hasUnconditional) setJourneyStage(7)
    else if (hasConditional) setJourneyStage(6)
    else if (hasSubmitted) setJourneyStage(5)
    else setJourneyStage(4)
  }, [data])

  const studentName = data?.student?.name || session?.user.name || 'Student'
  const firstName = studentName.split(' ')[0]
  const studentId = data?.student?.studentId || 'AE-20260001'
  const profileCompletion = 78

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}!`}
        description="Here is your study abroad progress at a glance."
        action={
          <Button asChild className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0">
            <Link href="/student/course-finder">
              <Sparkles className="h-4 w-4 mr-2" /> Find Programs
            </Link>
          </Button>
        }
      />

      {/* Identity card */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)', color: 'white' }} className="text-xl font-bold">
              {studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{studentName}</h2>
              <Badge className="bg-[#EFF6FF] text-[#0057B8] hover:bg-[#EFF6FF] border-0">
                Student ID: {studentId}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><Target className="h-4 w-4 text-[#0057B8]" /> Target: United Kingdom</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-[#E8501A]" /> Intake: September 2026</span>
              <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-green-600" /> Counselor: Sarah Johnson</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Profile Completion</div>
            <div className="flex items-center gap-2">
              <Progress value={profileCompletion} className="w-32 h-2" />
              <span className="text-sm font-bold text-slate-900">{profileCompletion}%</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> WhatsApp Verified
          </Badge>
          <Badge variant="outline" className="bg-[#EFF6FF] text-[#0057B8] border-[#0057B8]/20">
            <Mail className="h-3 w-3 mr-1" /> Email Verified
          </Badge>
          {profileCompletion < 100 && (
            <Link href="/student/profile" className="text-xs text-[#E8501A] hover:underline ml-auto">
              Complete your profile →
            </Link>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications" value={data?.stats.totalApplications ?? 0} icon={Send} accent="blue" hint="Active submissions" />
        <StatCard label="Documents" value={data?.stats.totalDocuments ?? 0} icon={FileText} accent="orange" hint="Uploaded total" />
        <StatCard label="Appointments" value={data?.stats.upcomingAppointments ?? 0} icon={Calendar} accent="green" hint="Upcoming" />
        <StatCard label="Unread Messages" value={3} icon={MessageSquare} accent="purple" hint="From counselor" />
      </div>

      {/* Journey */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Application Journey</h3>
            <p className="text-sm text-slate-500">Track your progress from lead to enrolment</p>
          </div>
          <Badge className="bg-[#FFF7ED] text-[#E8501A] hover:bg-[#FFF7ED] border-0">
            Stage {journeyStage + 1} of {JOURNEY_STAGES.length}
          </Badge>
        </div>
        <div className="overflow-x-auto pb-2 alo-scrollbar">
          <div className="flex items-start gap-1 min-w-max">
            {JOURNEY_STAGES.map((stage, idx) => {
              const isComplete = idx < journeyStage
              const isCurrent = idx === journeyStage
              return (
                <div key={stage} className="flex items-center">
                  <div className="flex flex-col items-center" style={{ width: 110 }}>
                    <div
                      className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center transition-colors',
                        isComplete && 'bg-green-500 text-white',
                        isCurrent && 'bg-[#0057B8] text-white ring-4 ring-[#0057B8]/20',
                        !isComplete && !isCurrent && 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isCurrent ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] text-center mt-2 leading-tight',
                        isComplete || isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-400'
                      )}
                    >
                      {stage}
                    </span>
                  </div>
                  {idx < JOURNEY_STAGES.length - 1 && (
                    <div className={cn('h-0.5 w-6 mt-4', idx < journeyStage ? 'bg-green-500' : 'bg-slate-200')} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">My Applications</h3>
              <Link href="/student/applications" className="text-sm text-[#0057B8] hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : data?.recent.applications && data.recent.applications.length > 0 ? (
              <div className="space-y-3">
                {data.recent.applications.slice(0, 4).map((app) => (
                  <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-[#0057B8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{app.course?.name || 'Application'}</p>
                      <p className="text-xs text-slate-500 truncate">{app.university?.name || '—'} • {app.applicationId}</p>
                    </div>
                    <Badge className={cn('border-0 capitalize', statusColors[app.status] || 'bg-slate-100 text-slate-600')}>
                      {app.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Send className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 mb-3">No applications yet</p>
                <Button asChild size="sm" className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                  <Link href="/student/course-finder">Find a program</Link>
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-[#E8501A]" />
              <h3 className="text-lg font-bold text-slate-900">AI Course Recommendations</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { name: 'MSc Computer Science', uni: 'University of Leeds', match: 94, country: 'United Kingdom' },
                { name: 'MSc Data Science', uni: 'University of Manchester', match: 91, country: 'United Kingdom' },
                { name: 'MBA International', uni: 'University of Birmingham', match: 88, country: 'United Kingdom' },
                { name: 'MSc Business Analytics', uni: 'University of Sheffield', match: 85, country: 'United Kingdom' },
              ].map((rec) => (
                <div key={rec.name} className="p-3 rounded-lg border border-slate-100 hover:border-[#0057B8]/30 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{rec.name}</p>
                      <p className="text-xs text-slate-500 truncate">{rec.uni}</p>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-0 shrink-0">{rec.match}% match</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">{rec.country}</span>
                    <Link href="/student/course-finder" className="text-xs text-[#0057B8] hover:underline font-medium">Details →</Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Upcoming Appointments</h3>
              <Link href="/student/appointments" className="text-xs text-[#0057B8] hover:underline">All</Link>
            </div>
            {data?.recent.appointments && data.recent.appointments.length > 0 ? (
              <div className="space-y-3">
                {data.recent.appointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="flex gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="h-10 w-10 rounded-lg bg-[#E8501A]/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-[#E8501A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{apt.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(apt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {apt.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No upcoming appointments</p>
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link href="/student/appointments">Book one</Link>
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Messages</h3>
              <Link href="/student/messages" className="text-xs text-[#0057B8] hover:underline">Inbox</Link>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', msg: 'Your application documents have been reviewed…', time: '2h', unread: true },
                { name: 'Visa Team', msg: 'Please submit your bank statement by Friday.', time: '1d', unread: false },
              ].map((m) => (
                <div key={m.name} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-[#EFF6FF] text-[#0057B8]">
                      {m.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                      <span className="text-[10px] text-slate-400">{m.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{m.msg}</p>
                  </div>
                  {m.unread && <span className="h-2 w-2 rounded-full bg-[#E8501A] mt-1.5" />}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-900">Missing Documents</h3>
            </div>
            <div className="space-y-2">
              {['Passport copy', 'Academic transcripts', 'Statement of Purpose'].map((doc) => (
                <div key={doc} className="flex items-center gap-2 text-sm">
                  <Circle className="h-3 w-3 text-amber-500" />
                  <span className="text-slate-700 flex-1">{doc}</span>
                  <Link href="/student/documents" className="text-xs text-[#0057B8] hover:underline">Upload</Link>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 border-0 shadow-sm">
              <Plane className="h-5 w-5 text-[#0057B8] mb-2" />
              <p className="text-xs text-slate-500">Visa Readiness</p>
              <p className="text-lg font-bold text-slate-900">65%</p>
              <Progress value={65} className="h-1.5 mt-1" />
            </Card>
            <Card className="p-4 border-0 shadow-sm">
              <Award className="h-5 w-5 text-[#E8501A] mb-2" />
              <p className="text-xs text-slate-500">Scholarships</p>
              <p className="text-lg font-bold text-slate-900">3</p>
              <p className="text-[10px] text-slate-400 mt-1">Available for you</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
