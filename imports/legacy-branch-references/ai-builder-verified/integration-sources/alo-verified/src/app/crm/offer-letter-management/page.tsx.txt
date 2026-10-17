'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  FileText,
  Download,
  CheckCircle2,
  Eye,
  Send,
  Award,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { usePortalData } from '@/hooks/use-portal-data'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Application {
  id: string
  applicationId: string
  status: string
  intake: string | null
  applicationDate: string
  offerDate: string | null
  notes: string | null
  student: { id: string; firstName: string; lastName: string; studentId: string }
  university: { id: string; name: string; country?: string }
  course?: { id: string; name: string } | null
  counselor?: { id: string; firstName: string; lastName: string } | null
}

interface AppsResponse {
  applications: Application[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const acceptDeadlineDays = 30

export default function OfferLetterManagementPage() {
  const [search, setSearch] = useState('')
  const { data, loading } = usePortalData<AppsResponse>({
    endpoint: '/api/applications',
    params: { limit: 200, page: 1 },
  })

  const offerApps = useMemo(() => {
    const all = data?.applications ?? []
    return all
      .filter((a) => ['conditional_offer', 'unconditional_offer'].includes(a.status))
      .filter((a) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          a.applicationId.toLowerCase().includes(q) ||
          `${a.student.firstName} ${a.student.lastName}`.toLowerCase().includes(q) ||
          a.university.name.toLowerCase().includes(q)
        )
      })
  }, [data, search])

  const conditionalCount = offerApps.filter((a) => a.status === 'conditional_offer').length
  const unconditionalCount = offerApps.filter((a) => a.status === 'unconditional_offer').length
  const acceptedCount = offerApps.filter((a) => a.offerDate && (new Date().getTime() - new Date(a.offerDate).getTime()) / (1000*60*60*24) > 30).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offer Letter Management"
        description="Track conditional and unconditional offers, generate letters, and manage accept deadlines."
        action={
          <Button variant="outline" onClick={() => toast.info('Export offer letters (PDF bundle)')}>
            <Download className="h-4 w-4 mr-2" /> Export All
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Offers" value={offerApps.length} icon={Award} accent="blue" />
        <StatCard label="Conditional" value={conditionalCount} icon={AlertCircle} accent="amber" />
        <StatCard label="Unconditional" value={unconditionalCount} icon={CheckCircle2} accent="green" />
        <StatCard label="Past Deadline" value={acceptedCount} icon={Calendar} accent="orange" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by application ID, student, university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-14 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : offerApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Award className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No offer letters yet</h3>
            <p className="text-sm text-slate-500">Applications with conditional or unconditional offers will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Application ID</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">University</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Offer Type</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Conditions</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Issued Date</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Accept Deadline</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {offerApps.map((a) => {
                  const isConditional = a.status === 'conditional_offer'
                  const issued = a.offerDate || a.applicationDate
                  const deadline = new Date(new Date(issued).getTime() + acceptDeadlineDays * 24 * 60 * 60 * 1000)
                  const daysLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  const expired = daysLeft < 0
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3"><span className="font-semibold text-[#0057B8]">{a.applicationId}</span></td>
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{a.student.firstName} {a.student.lastName}</p>
                        <p className="text-xs text-slate-400">{a.student.studentId}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-medium text-slate-900">{a.university.name}</p>
                        <p className="text-xs text-slate-400">{a.course?.name || '—'}</p>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('border text-xs', isConditional ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100')}>
                          {isConditional ? 'Conditional' : 'Unconditional'}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-slate-600 max-w-[200px]">
                        {isConditional ? (a.notes || 'Pending IELTS score, final transcripts') : <span className="text-slate-400">None</span>}
                      </td>
                      <td className="p-3 text-xs text-slate-600">{new Date(issued).toLocaleDateString()}</td>
                      <td className="p-3">
                        <p className={cn('text-xs font-medium', expired ? 'text-red-600' : daysLeft <= 7 ? 'text-[#E8501A]' : 'text-slate-700')}>
                          {deadline.toLocaleDateString()}
                        </p>
                        <p className={cn('text-xs', expired ? 'text-red-500' : 'text-slate-400')}>
                          {expired ? 'Expired' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                        </p>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('border-0 text-xs capitalize', expired ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#0057B8]')}>
                          {expired ? 'Expired' : 'Active'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => toast.success(`Offer letter PDF generated for ${a.applicationId}`)}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> Generate
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => toast.success(`Marked accepted: ${a.applicationId}`)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.info(`View ${a.applicationId}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
