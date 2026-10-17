'use client'

import { useEffect, useState } from 'react'
import {
  Users, UserPlus, Trash2, ShieldCheck, Mail, Phone,
  AlertCircle, Crown, Loader2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'

interface StaffMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  status: string
  createdAt: string
  kind: 'super_admin' | 'staff'
  displayName?: string
}

interface UsersData {
  seatLimit: number
  seatsUsed: number
  seatsRemaining: number
  superAdmin: StaffMember | null
  staff: StaffMember[]
}

export default function PartnerAdminUsersPage() {
  const [data, setData] = useState<UsersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', role: 'staff' })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function load() {
    const session = getSession()
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch('/api/partner-admin/users', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    const session = getSession()
    if (!session) return
    if (!newStaff.name.trim()) {
      toast.error('Name is required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/partner-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(newStaff),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.code === 'SEAT_LIMIT') {
          toast.error(json.detail || 'Seat limit reached')
        } else {
          throw new Error(json.error || 'Failed to create')
        }
      } else {
        toast.success('Staff member added')
        setAddOpen(false)
        setNewStaff({ name: '', email: '', phone: '', role: 'staff' })
        await load()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    const session = getSession()
    if (!session) return
    if (!confirm('Remove this staff member? They will lose portal access immediately.')) return
    try {
      const res = await fetch(`/api/partner-admin/users?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete')
      toast.success('Staff member removed')
      setDeleteId(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const seatsUsed = data?.seatsUsed ?? 0
  const seatLimit = data?.seatLimit ?? 3
  const seatsRemaining = data?.seatsRemaining ?? 0
  const atLimit = seatsRemaining <= 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Users"
        description="Manage staff seats for your organization. Each subscription includes 3 seats: 1 super admin + 2 staff."
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button disabled={atLimit} className="h-12 bg-[#E8501A] hover:bg-[#c8420f] text-white border-0">
                <UserPlus className="h-4 w-4 mr-2" /> Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="h-12 mt-1" placeholder="Jane Doe" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className="h-12 mt-1" placeholder="jane@example.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} className="h-12 mt-1" placeholder="+880 1XXX-XXXXXX" />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="h-12 w-full mt-1 px-3 rounded-md border border-slate-200 text-sm bg-white"
                  >
                    <option value="staff">Staff (default)</option>
                    <option value="counselor">Counselor</option>
                    <option value="finance">Finance</option>
                    <option value="operations">Operations</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500">
                  Seats used: {seatsUsed} / {seatLimit}. After this addition, {Math.max(0, seatsRemaining - 1)} seat(s) will remain.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} className="h-12">Cancel</Button>
                <Button onClick={handleCreate} disabled={creating} className="h-12 bg-[#0057B8] hover:bg-[#004a9c] text-white">
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Add Staff
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Seat usage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Seats Used" value={`${seatsUsed} / ${seatLimit}`} icon={Users} accent="blue" />
        <StatCard label="Seats Remaining" value={seatsRemaining} icon={ShieldCheck} accent={seatsRemaining > 0 ? 'green' : 'orange'} />
        <StatCard label="Active Staff" value={data?.staff.filter((s) => s.status === 'active').length ?? 0} icon={Crown} accent="purple" />
      </div>

      {atLimit && (
        <Card className="p-4 border-0 shadow-sm bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Seat limit reached</p>
              <p className="text-xs text-slate-600 mt-1">
                Your subscription allows {seatLimit} seats total. To add more staff, contact your ALO account manager
                to upgrade your plan, or remove an existing staff member below.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Users table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.superAdmin && (
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#0057B8] text-white flex items-center justify-center text-xs font-bold">
                          {data.superAdmin.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{data.superAdmin.name}</p>
                          <p className="text-xs text-slate-500">Super Admin (login owner)</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{data.superAdmin.email || '—'}</TableCell>
                    <TableCell>{data.superAdmin.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge className="bg-[#0057B8] text-white border-0">
                        <Crown className="h-3 w-3 mr-1" /> Super Admin
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="capitalize border-0 bg-green-50 text-green-600">{data.superAdmin.status}</Badge>
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-right text-xs text-slate-400">—</TableCell>
                  </TableRow>
                )}
                {data?.staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">
                      No staff members yet. Click "Add Staff" to invite your first team member.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                            {s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <p className="font-semibold text-slate-900">{s.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{s.email ? <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span> : '—'}</TableCell>
                      <TableCell>{s.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span> : '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{s.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize border-0 bg-green-50 text-green-600">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(s.id)}
                          className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
