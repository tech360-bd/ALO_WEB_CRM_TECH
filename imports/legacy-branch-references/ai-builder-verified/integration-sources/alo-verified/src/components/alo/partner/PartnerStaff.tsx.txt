'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Users, UserPlus, Search, Filter, Mail, Phone,
  Shield, MoreHorizontal, ChevronRight, CheckCircle2, XCircle, Clock
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  createdAt: string
  lastLoginAt: string | null
}

const roleLabels: Record<string, string> = {
  partner_super_admin: 'Super Admin',
  partner_staff: 'Staff',
}

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'bg-green-50 text-green-700', label: 'Active' },
  inactive: { color: 'bg-gray-100 text-gray-600', label: 'Inactive' },
  suspended: { color: 'bg-red-50 text-red-700', label: 'Suspended' },
  invited: { color: 'bg-blue-50 text-blue-700', label: 'Invited' },
}

export default function PartnerStaff() {
  const { currentUser } = useAppStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoading(true)
        const refId = currentUser?.referenceId || ''
        const res = await fetch(`/api/partners?id=${refId}&include=staff`)
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setStaff(json.staff || json.partners?.[0]?.staff || [])
      } catch {
        setStaff([])
      } finally {
        setLoading(false)
      }
    }
    fetchStaff()
  }, [currentUser?.referenceId])

  const filtered = staff.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = staff.filter(s => s.status === 'active').length
  const invitedCount = staff.filter(s => s.status === 'invited').length

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAdding(true)
    try {
      const formData = new FormData(e.currentTarget)
      const body = {
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        role: formData.get('role') || 'partner_staff',
        partnerId: currentUser?.referenceId || '',
      }
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addStaff', ...body }),
      })
      if (!res.ok) throw new Error('Failed to add staff')
      toast.success('Staff member added successfully')
      setShowAddDialog(false)
      setStaff(prev => [...prev, {
        id: Date.now().toString(),
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        status: 'invited',
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      }])
    } catch {
      toast.error('Failed to add staff member')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team members</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-alo-orange hover:bg-alo-orange/90 text-white">
              <UserPlus className="h-4 w-4 mr-2" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Full Name *</Label>
                <Input name="name" className="mt-1" placeholder="Staff member name" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email *</Label>
                <Input name="email" type="email" className="mt-1" placeholder="staff@email.com" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Phone</Label>
                <Input name="phone" className="mt-1" placeholder="+880" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Role</Label>
                <Select name="role" defaultValue="partner_staff">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partner_staff">Staff</SelectItem>
                    <SelectItem value="partner_super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={adding} className="bg-alo-orange hover:bg-alo-orange/90 text-white">
                  {adding ? 'Adding...' : 'Add Staff'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-alo-blue/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-alo-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{staff.length}</p>
              <p className="text-xs text-gray-500">Total Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{activeCount}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{invitedCount}</p>
              <p className="text-xs text-gray-500">Invited</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9" />
      </div>

      {/* Staff Table */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No staff members</p>
            <p className="text-xs text-gray-400 mt-1">Add team members to help manage students</p>
            <Button className="mt-4 bg-alo-orange hover:bg-alo-orange/90 text-white"
              onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Staff
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Last Login</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => {
                  const sc = statusConfig[member.status] || statusConfig.inactive
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-alo-orange/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-alo-orange">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-alo-navy">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{member.email}</TableCell>
                      <TableCell className="text-xs text-gray-500">{member.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
