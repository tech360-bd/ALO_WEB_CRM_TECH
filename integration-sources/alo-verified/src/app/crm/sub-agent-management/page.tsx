'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Briefcase,
  Users,
  Mail,
  Phone,
  Percent,
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  Globe,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { getSession } from '@/lib/session'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Partner {
  id: string
  partnerId: string
  companyName: string
  contactPerson: string
  email: string
  phone: string | null
  whatsappNumber: string | null
  country: string
  city: string | null
  businessType: string | null
  status: string
  commissionRate: number
  createdAt: string
  _count?: { students: number; applications: number; commissions: number; partnerStaff: number }
}

interface PartnersResponse {
  partners: Partner[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-600 border-green-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  suspended: 'bg-amber-50 text-amber-600 border-amber-100',
  terminated: 'bg-red-50 text-red-600 border-red-100',
}

export default function SubAgentManagementPage() {
  const session = getSession()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', phone: '', country: 'Bangladesh', city: '', commissionRate: '10', businessType: 'agency' })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data, loading } = usePortalData<PartnersResponse>({
    endpoint: '/api/partners',
    params: {
      limit: 50,
      page: 1,
      search: debouncedSearch || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    },
  })

  const partners = data?.partners ?? []
  const totalStudents = partners.reduce((s, p) => s + (p._count?.students ?? 0), 0)
  const avgCommission = partners.length > 0 ? partners.reduce((s, p) => s + (p.commissionRate || 0), 0) / partners.length : 0

  const handleCreate = async () => {
    if (!form.companyName || !form.contactPerson || !form.email) {
      toast.error('Company name, contact person, and email are required')
      return
    }
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}` },
        body: JSON.stringify({
          companyName: form.companyName,
          contactPerson: form.contactPerson,
          email: form.email,
          phone: form.phone || null,
          country: form.country,
          city: form.city || null,
          commissionRate: parseFloat(form.commissionRate) || 0,
          businessType: form.businessType,
          status: 'active',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create sub-agent')
      }
      toast.success('Sub-agent created')
      setAddOpen(false)
      setForm({ companyName: '', contactPerson: '', email: '', phone: '', country: 'Bangladesh', city: '', commissionRate: '10', businessType: 'agency' })
      setTimeout(() => window.location.reload(), 800)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create sub-agent')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sub-Agent Management"
        description="Partner agencies and sub-agents: contacts, students, commission rates, and status."
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Sub-Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Sub-Agent</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Company Name *</Label>
                  <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact Person *</Label>
                  <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Business Type</Label>
                  <Select value={form.businessType} onValueChange={(v) => setForm({ ...form, businessType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agency">Agency</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Country</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Commission Rate (%)</Label>
                  <Input type="number" step="0.5" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={handleCreate}>Create Sub-Agent</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Sub-Agents" value={data?.pagination.total ?? 0} icon={Briefcase} accent="blue" />
        <StatCard label="Active" value={partners.filter((p) => p.status === 'active').length} icon={Briefcase} accent="green" />
        <StatCard label="Referred Students" value={totalStudents} icon={Users} accent="orange" />
        <StatCard label="Avg Commission" value={`${avgCommission.toFixed(1)}%`} icon={Percent} accent="purple" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by company, contact, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-14 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : partners.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No sub-agents yet</h3>
            <p className="text-sm text-slate-500 mb-5">Add your first partner agency or sub-agent.</p>
            <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Sub-Agent
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Partner ID</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Company Name</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Contact Person</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Email</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Phone</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Country</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Students</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Commission</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="p-3"><span className="font-semibold text-[#0057B8]">{p.partnerId}</span></td>
                    <td className="p-3">
                      <p className="font-medium text-slate-900">{p.companyName}</p>
                      {p.businessType && <p className="text-xs text-slate-400 capitalize">{p.businessType}</p>}
                    </td>
                    <td className="p-3 text-xs text-slate-700">{p.contactPerson}</td>
                    <td className="p-3 text-xs text-slate-600 flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</td>
                    <td className="p-3 text-xs text-slate-600 flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone || '—'}</td>
                    <td className="p-3 text-xs text-slate-700 flex items-center gap-1"><Globe className="h-3 w-3" /> {p.country}</td>
                    <td className="p-3"><Badge className="bg-blue-50 text-[#0057B8] border-0 text-xs">{p._count?.students ?? 0}</Badge></td>
                    <td className="p-3 text-xs font-semibold text-[#E8501A]">{p.commissionRate}%</td>
                    <td className="p-3"><Badge className={cn('border text-xs capitalize', statusColors[p.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{p.status}</Badge></td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => toast.info(`View ${p.companyName}`)}><Eye className="h-4 w-4 mr-2" /> View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Edit ${p.companyName}`)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => toast.info(`Delete ${p.companyName}`)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
