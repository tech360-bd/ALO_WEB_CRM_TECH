'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Mail,
  Send,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Users,
  TrendingUp,
  Calendar,
  MoreHorizontal,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePortalData } from '@/hooks/use-portal-data'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  objective: string | null
  targetAudience: string | null
  country: string | null
  platforms: string | null
  startDate: string | null
  endDate: string | null
  budget: number | null
  status: string
  createdAt: string
  _count?: { recipients: number; content: number }
}

interface MarketingResponse {
  campaigns: Campaign[]
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-500 border-slate-200',
  active: 'bg-green-50 text-green-600 border-green-100',
  paused: 'bg-amber-50 text-amber-600 border-amber-100',
  completed: 'bg-blue-50 text-[#0057B8] border-blue-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
}

const audiences = [
  { value: 'all_leads', label: 'All Leads' },
  { value: 'all_students', label: 'All Students' },
  { value: 'active_applicants', label: 'Active Applicants' },
  { value: 'offer_holders', label: 'Offer Holders' },
  { value: 'visa_pending', label: 'Visa Pending' },
  { value: 'partners', label: 'Partners' },
  { value: 'enrolled', label: 'Enrolled Students' },
]

export default function EmailCampaignPage() {
  const [refreshTick, setRefreshTick] = useState(0)
  const { data, loading, error } = usePortalData<MarketingResponse>({
    endpoint: '/api/marketing',
    // refreshTick is included so bumping it forces a re-fetch after a send.
    params: { limit: 50, page: 1, refreshTick },
  })

  const campaigns = data?.campaigns ?? []
  const [addOpen, setAddOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    name: '',
    subject: '',
    audience: 'all_leads',
    template: 'Dear {{first_name}},\n\nWe are excited to share a new opportunity with you...\n\nBest regards,\nALO Education Team',
    schedule: '',
  })

  // Real metrics — derived from campaign recipient counts returned by the API.
  // The /api/marketing GET does NOT currently include per-recipient _count, so
  // when unavailable we show "—" instead of fabricating fake numbers.
  const totalSent = campaigns.reduce(
    (sum, c) => sum + (c._count?.recipients ?? 0),
    0
  )
  // Open-rate tracking is not yet exposed by the API — show "—" rather than mock.
  const avgOpenRate: number | null = null

  const refreshCampaignList = () => setRefreshTick((t) => t + 1)
  void error

  const handleSendOrSchedule = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error('Campaign name and subject are required')
      return
    }
    setSending(true)
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('alo_token')
        : null
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: 'campaign',
          name: form.name.trim(),
          objective: form.subject.trim(),
          targetAudience: form.audience,
          platforms: 'email',
          startDate: form.schedule ? new Date(form.schedule).toISOString() : new Date().toISOString(),
          endDate: form.schedule ? new Date(form.schedule).toISOString() : null,
          budget: null,
          status: 'active',
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || `Failed to ${form.schedule ? 'schedule' : 'send'} campaign (${res.status})`)
      }
      toast.success(
        `Campaign "${form.name.trim()}" ${form.schedule ? 'scheduled' : 'created and activated'}`
      )
      setForm({
        name: '',
        subject: '',
        audience: 'all_leads',
        template: 'Dear {{first_name}},\n\nWe are excited to share a new opportunity with you...\n\nBest regards,\nALO Education Team',
        schedule: '',
      })
      setAddOpen(false)
      refreshCampaignList()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create campaign')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Campaigns"
        description="Create, schedule, and track email marketing campaigns with templates and audience targeting."
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                <Plus className="h-4 w-4 mr-2" /> New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Email Campaign</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Campaign Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. September UK Intake Webinar" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Subject Line *</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Join our UK University Webinar this Saturday" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Audience</Label>
                  <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {audiences.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Schedule Send</Label>
                  <Input type="datetime-local" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Email Template</Label>
                  <Textarea rows={8} className="font-mono text-xs" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} />
                  <p className="text-[10px] text-slate-400">Variables: {`{{first_name}}, {{last_name}}, {{country}}, {{intake}}`}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => toast.info('Preview email')}><Eye className="h-4 w-4 mr-2" /> Preview</Button>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Save Draft</Button>
                <Button className="bg-[#E8501A] hover:bg-[#c44318] text-white" disabled={sending} onClick={handleSendOrSchedule}>
                  {sending ? 'Sending…' : (<><Send className="h-4 w-4 mr-2" /> {form.schedule ? 'Schedule' : 'Send Now'}</>)}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={Mail} accent="blue" />
        <StatCard label="Active" value={campaigns.filter((c) => c.status === 'active').length} icon={Send} accent="green" />
        <StatCard label="Emails Sent" value={totalSent > 0 ? totalSent : '—'} icon={TrendingUp} accent="orange" />
        <StatCard label="Avg Open Rate" value={avgOpenRate !== null ? `${avgOpenRate}%` : '—'} icon={Users} accent="purple" />
      </div>

      {/* Template editor quick-access card */}
      <Card className="p-5 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Quick Template Editor</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => toast.info('Save template')}>Save Template</Button>
        </div>
        <Textarea rows={5} className="font-mono text-xs" defaultValue={`Hi {{first_name}},\n\nDiscover top-ranked universities in {{country}} for the {{intake}} intake. Apply through ALO Education for zero application fees.\n\nClick here to book your free consultation: https://aloeducation.com/consult\n\nBest regards,\nALO Education Team`} />
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <h3 className="font-bold text-slate-900">Campaigns</h3>
          <Badge className="bg-slate-100 text-slate-600 border-0">{campaigns.length}</Badge>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-14 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No campaigns yet</h3>
            <p className="text-sm text-slate-500 mb-5">Create your first email campaign to reach your audience.</p>
            <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Campaign Name</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Subject / Objective</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Audience</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Sent</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Open Rate</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Dates</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  // Real per-campaign recipient counts come from `_count.recipients`
                  // when the API includes it. Open-rate tracking is not exposed yet.
                  const sentCount = c._count?.recipients ?? null
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3 font-medium text-slate-900">{c.name}</td>
                      <td className="p-3 text-xs text-slate-600">
                        <p>{c.objective || 'Email blast'}</p>
                        {c.country && <p className="text-slate-400">{c.country}</p>}
                      </td>
                      <td className="p-3"><Badge className="bg-blue-50 text-[#0057B8] border-0 text-xs capitalize">{(c.targetAudience || 'all').replace(/_/g, ' ')}</Badge></td>
                      <td className="p-3 text-xs text-slate-700">{sentCount !== null ? sentCount.toLocaleString() : '—'}</td>
                      <td className="p-3 text-xs text-slate-400">—</td>
                      <td className="p-3"><Badge className={cn('border text-xs capitalize', statusColors[c.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{c.status}</Badge></td>
                      <td className="p-3 text-xs text-slate-500">
                        {c.startDate && <p>{new Date(c.startDate).toLocaleDateString()}</p>}
                        {c.endDate && <p className="text-slate-400">→ {new Date(c.endDate).toLocaleDateString()}</p>}
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => toast.info(`View ${c.name}`)}><Eye className="h-4 w-4 mr-2" /> View Stats</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Edit campaign')}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Duplicate campaign')}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => toast.info('Delete campaign')}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
