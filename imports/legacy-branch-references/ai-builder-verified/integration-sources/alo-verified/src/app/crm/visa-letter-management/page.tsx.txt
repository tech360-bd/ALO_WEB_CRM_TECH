'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  FileText,
  Download,
  Eye,
  Plane,
  FileCheck,
  Clock,
  Send,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  casDate: string | null
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

// Visa-letter statuses: deposit_paid, cas_received, visa_applied, visa_approved
const VISA_STATUSES = ['deposit_paid', 'cas_received', 'visa_applied', 'visa_approved']

function visaLetterType(country?: string): string {
  if (!country) return 'CAS'
  const c = country.toLowerCase()
  if (c.includes('usa') || c.includes('united states')) return 'I-20'
  if (c.includes('australia')) return 'CoE'
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('england')) return 'CAS'
  return 'Visa Letter'
}

const letterTypeColors: Record<string, string> = {
  'CAS': 'bg-blue-50 text-[#0057B8] border-blue-100',
  'I-20': 'bg-purple-50 text-purple-600 border-purple-100',
  'CoE': 'bg-green-50 text-green-600 border-green-100',
  'Visa Letter': 'bg-amber-50 text-amber-600 border-amber-100',
}

export default function VisaLetterManagementPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const { data, loading } = usePortalData<AppsResponse>({
    endpoint: '/api/applications',
    params: { limit: 200, page: 1 },
  })

  const visaApps = useMemo(() => {
    const all = data?.applications ?? []
    return all
      .filter((a) => VISA_STATUSES.includes(a.status))
      .filter((a) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          a.applicationId.toLowerCase().includes(q) ||
          `${a.student.firstName} ${a.student.lastName}`.toLowerCase().includes(q) ||
          a.university.name.toLowerCase().includes(q)
        )
      })
      .filter((a) => {
        if (filterType === 'all') return true
        return visaLetterType(a.university.country) === filterType
      })
  }, [data, search, filterType])

  const requested = visaApps.filter((a) => a.status === 'deposit_paid' || a.status === 'cas_received').length
  const issued = visaApps.filter((a) => a.casDate || a.status === 'cas_received').length
  const pending = visaApps.length - issued

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visa Letter Management"
        description="Manage CAS (UK), I-20 (USA), and CoE (Australia) visa letters — request, issue, and track."
        action={
          <Button variant="outline" onClick={() => toast.info('Export visa letters (CSV)')}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Visa Letters" value={visaApps.length} icon={FileCheck} accent="blue" />
        <StatCard label="Requested" value={requested} icon={Send} accent="amber" />
        <StatCard label="Issued" value={issued} icon={FileCheck} accent="green" />
        <StatCard label="Pending Issue" value={pending} icon={Clock} accent="orange" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by application ID, student, university..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Letter type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="CAS">CAS (UK)</SelectItem>
              <SelectItem value="I-20">I-20 (USA)</SelectItem>
              <SelectItem value="CoE">CoE (Australia)</SelectItem>
              <SelectItem value="Visa Letter">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-14 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : visaApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No visa letters in progress</h3>
            <p className="text-sm text-slate-500">Applications in CAS/I-20/CoE stage will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Application ID</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">University</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Visa Letter Type</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Requested Date</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Issued Date</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {visaApps.map((a) => {
                  const letterType = visaLetterType(a.university.country)
                  const requestedDate = a.applicationDate
                  const issuedDate = a.casDate
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3"><span className="font-semibold text-[#0057B8]">{a.applicationId}</span></td>
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{a.student.firstName} {a.student.lastName}</p>
                        <p className="text-xs text-slate-400">{a.student.studentId}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-medium text-slate-900">{a.university.name}</p>
                        <p className="text-xs text-slate-400">{a.university.country}</p>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('border text-xs', letterTypeColors[letterType] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                          {letterType}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-slate-600">{new Date(requestedDate).toLocaleDateString()}</td>
                      <td className="p-3 text-xs text-slate-600">
                        {issuedDate ? new Date(issuedDate).toLocaleDateString() : <span className="text-slate-400">Pending</span>}
                      </td>
                      <td className="p-3">
                        <Badge className={cn('border-0 text-xs capitalize', issuedDate ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600')}>
                          {issuedDate ? 'Issued' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!issuedDate && (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => toast.success(`Visa letter marked as issued for ${a.applicationId}`)}>
                              <FileCheck className="h-3.5 w-3.5 mr-1" /> Mark Issued
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => toast.success(`Visa letter PDF generated for ${a.applicationId}`)}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> Generate
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
