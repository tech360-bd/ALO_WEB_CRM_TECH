'use client'

import { useEffect, useState } from 'react'
import {
  Network, Building2, Users, FileText, Globe, Phone, Mail,
  ExternalLink, Search,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'

interface Provider {
  id: string
  partnerId: string
  companyName: string
  contactPerson: string
  email: string
  phone: string | null
  country: string
  city: string | null
  website: string | null
  businessType: string | null
  commissionRate: number
  status: string
  createdAt: string
  stats: {
    totalStudents: number
    totalApplications: number
    b2bApplications: number
    staffCount: number
    commissionRecords: number
  }
  lastB2bActivity: { createdAt: string; status: string } | null
}

export default function ApplicationManagerProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const session = getSession()
    if (!session) return
    fetch('/api/application-manager/providers', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.error || `Request failed: ${r.status}`)
        }
        return r.json()
      })
      .then((d) => setProviders(d.providers || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = providers.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.companyName.toLowerCase().includes(q) ||
      p.contactPerson.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q)
    )
  })

  const totalApps = providers.reduce((s, p) => s + p.stats.totalApplications, 0)
  const totalB2b = providers.reduce((s, p) => s + p.stats.b2bApplications, 0)
  const totalStudents = providers.reduce((s, p) => s + p.stats.totalStudents, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="B2B Provider Directory"
        description="Institutional partners with B2B volume. Click a provider to view their applications."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Providers" value={providers.length} icon={Network} accent="purple" />
        <StatCard label="B2B Applications" value={totalB2b} icon={FileText} accent="blue" />
        <StatCard label="Total Applications" value={totalApps} icon={FileText} accent="orange" />
        <StatCard label="Referred Students" value={totalStudents} icon={Users} accent="green" />
      </div>

      <Card className="p-4 border-0 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, contact, email, or country..."
            className="h-12 pl-10"
          />
        </div>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Provider Network</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Network className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No B2B providers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Apps</TableHead>
                  <TableHead className="text-right">B2B</TableHead>
                  <TableHead className="text-right">Staff</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Last B2B</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#0073E6] flex items-center justify-center text-white text-xs font-bold">
                          {p.companyName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{p.companyName}</p>
                          <p className="text-xs text-slate-500">{p.partnerId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{p.contactPerson}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{p.country}</p>
                      <p className="text-xs text-slate-500">{p.city || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">{p.businessType || 'agency'}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{p.stats.totalStudents}</TableCell>
                    <TableCell className="text-right font-semibold">{p.stats.totalApplications}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-[#0057B8]">{p.stats.b2bApplications}</span>
                    </TableCell>
                    <TableCell className="text-right">{p.stats.staffCount}</TableCell>
                    <TableCell>
                      <Badge className="bg-[#FFF7ED] text-[#E8501A] border-0">{p.commissionRate}%</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {p.lastB2bActivity ? new Date(p.lastB2bActivity.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.slice(0, 6).map((p) => (
          <Card key={p.id} className="p-5 border-0 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#0073E6] flex items-center justify-center text-white font-bold">
                {p.companyName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 truncate">{p.companyName}</p>
                    <p className="text-xs text-slate-500">{p.partnerId} • {p.businessType || 'agency'}</p>
                  </div>
                  <Badge className="bg-green-50 text-green-600 border-0 capitalize">{p.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone || '—'}</p>
                  <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</p>
                  <p className="flex items-center gap-1"><Globe className="h-3 w-3" />{p.website ? (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-[#0057B8] hover:underline truncate inline-flex items-center gap-1">
                      {p.website.replace(/^https?:\/\//, '').slice(0, 24)}<ExternalLink className="h-3 w-3" />
                    </a>
                  ) : '—'}</p>
                  <p className="flex items-center gap-1"><Building2 className="h-3 w-3" />{p.city ? `${p.city}, ` : ''}{p.country}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="rounded-md bg-slate-50 py-2">
                    <p className="text-base font-bold text-slate-900">{p.stats.b2bApplications}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">B2B Apps</p>
                  </div>
                  <div className="rounded-md bg-slate-50 py-2">
                    <p className="text-base font-bold text-slate-900">{p.stats.totalStudents}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Students</p>
                  </div>
                  <div className="rounded-md bg-slate-50 py-2">
                    <p className="text-base font-bold text-slate-900">{p.stats.staffCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Staff</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
