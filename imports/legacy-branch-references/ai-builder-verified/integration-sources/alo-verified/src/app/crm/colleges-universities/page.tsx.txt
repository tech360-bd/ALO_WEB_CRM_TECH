'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Building2,
  MapPin,
  Award,
  Globe,
  GraduationCap,
  Send,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
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
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface University {
  id: string
  name: string
  slug: string
  country: string
  city: string | null
  website: string | null
  logoUrl: string | null
  ranking: number | null
  type: string | null
  description: string | null
  scholarshipAvailable: boolean
  status: string
  _count?: { courses: number; applications: number; scholarships: number }
}

interface UniversitiesResponse {
  universities: University[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export default function UniversitiesPage() {
  const session = getSession()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', country: '', city: '', website: '', type: 'public', ranking: '', description: '' })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data, loading } = usePortalData<UniversitiesResponse>({
    endpoint: '/api/universities',
    params: {
      limit: 50,
      page: 1,
      search: debouncedSearch || undefined,
      country: filterCountry !== 'all' ? filterCountry : undefined,
    },
  })

  const universities = data?.universities ?? []
  const countryOptions = Array.from(new Set(universities.map((u) => u.country).filter(Boolean)))

  const totalCourses = universities.reduce((s, u) => s + (u._count?.courses ?? 0), 0)
  const totalApps = universities.reduce((s, u) => s + (u._count?.applications ?? 0), 0)

  const handleCreate = async () => {
    if (!form.name || !form.country) {
      toast.error('Name and country are required')
      return
    }
    try {
      const res = await fetch('/api/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}` },
        body: JSON.stringify({
          name: form.name,
          country: form.country,
          city: form.city || null,
          website: form.website || null,
          type: form.type,
          ranking: form.ranking ? parseInt(form.ranking) : null,
          description: form.description || null,
          status: 'active',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create university')
      }
      toast.success('University created')
      setAddOpen(false)
      setForm({ name: '', country: '', city: '', website: '', type: 'public', ranking: '', description: '' })
      setTimeout(() => window.location.reload(), 800)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create university')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colleges & Universities"
        description="Manage partner institutions: programs, rankings, locations, and application counts."
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                <Plus className="h-4 w-4 mr-2" /> Add University
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New University</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. University of Oxford" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Country *</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. UK" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Oxford" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Website</Label>
                  <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">World Ranking</Label>
                  <Input type="number" value={form.ranking} onChange={(e) => setForm({ ...form, ranking: e.target.value })} placeholder="e.g. 5" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={handleCreate}>Create University</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Universities" value={data?.pagination.total ?? 0} icon={Building2} accent="blue" />
        <StatCard label="Countries" value={countryOptions.length} icon={Globe} accent="orange" />
        <StatCard label="Total Courses" value={totalCourses} icon={GraduationCap} accent="purple" />
        <StatCard label="Total Applications" value={totalApps} icon={Send} accent="green" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, city, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : universities.length === 0 ? (
        <Card className="p-12 border-0 shadow-sm text-center">
          <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-[#0057B8]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No universities found</h3>
          <p className="text-sm text-slate-500 mb-5">Add your first partner university.</p>
          <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add University
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((u) => (
            <Card key={u.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {u.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 truncate" title={u.name}>{u.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {[u.city, u.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => toast.info(`View ${u.name}`)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info(`Edit ${u.name}`)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => toast.info(`Delete ${u.name}`)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-md bg-slate-50 p-2">
                  <p className="text-[10px] text-slate-500 uppercase">Courses</p>
                  <p className="text-sm font-bold text-slate-900">{u._count?.courses ?? 0}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-2">
                  <p className="text-[10px] text-slate-500 uppercase">Apps</p>
                  <p className="text-sm font-bold text-slate-900">{u._count?.applications ?? 0}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-2">
                  <p className="text-[10px] text-slate-500 uppercase">Rank</p>
                  <p className="text-sm font-bold text-slate-900">#{u.ranking || '—'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={cn('border-0 text-xs capitalize', u.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500')}>
                    {u.status}
                  </Badge>
                  {u.type && <Badge variant="outline" className="text-xs capitalize">{u.type}</Badge>}
                  {u.scholarshipAvailable && <Badge className="bg-orange-50 text-[#E8501A] border-0 text-xs"><Award className="h-3 w-3 mr-1" /> Scholarships</Badge>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
