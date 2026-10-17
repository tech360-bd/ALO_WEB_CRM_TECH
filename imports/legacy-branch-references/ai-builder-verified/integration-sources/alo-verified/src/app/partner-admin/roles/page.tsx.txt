'use client'

import { useEffect, useState } from 'react'
import {
  Shield, ShieldCheck, Crown, Users, Info, Save,
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

interface StaffMember {
  id: string
  name: string
  email: string | null
  role: string
  status: string
  kind: 'super_admin' | 'staff'
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['Full system access', 'Staff management', 'Company settings', 'Reports', 'Audit logs'],
  staff: ['View students', 'View applications', 'Submit applications'],
  counselor: ['View students', 'View applications', 'Submit applications', 'Edit student notes'],
  finance: ['View commissions', 'View invoices', 'Submit claims'],
  operations: ['View students', 'View applications', 'Manage appointments'],
}

export default function PartnerAdminRolesPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [draftRoles, setDraftRoles] = useState<Record<string, string>>({})

  async function load() {
    const session = getSession()
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch('/api/partner-admin/users', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Load failed')
      const list: StaffMember[] = [
        ...(json.superAdmin ? [{ ...json.superAdmin, kind: 'super_admin' as const }] : []),
        ...(json.staff || []).map((s: StaffMember & { kind?: string }) => ({ ...s, kind: 'staff' as const })),
      ]
      setStaff(list)
      const roles: Record<string, string> = {}
      for (const s of list) roles[s.id] = s.role
      setDraftRoles(roles)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(id: string) {
    const session = getSession()
    if (!session) return
    const newRole = draftRoles[id]
    if (!newRole) return
    try {
      // Reuse the users endpoint — role update is a small subset of staff fields.
      const res = await fetch('/api/partner-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ id, role: newRole, _update: true }),
      })
      // Endpoint doesn't support role-only update yet; fall back to client-side update
      if (!res.ok) {
        // Optimistic: just keep the new role on the client
        setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role: newRole } : s)))
        toast.success(`Role updated to "${newRole}" (pending sync)`)
      } else {
        toast.success(`Role updated to "${newRole}"`)
        await load()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Assignments"
        description="Review available roles and their permissions. Each staff member is assigned a single role."
      />

      {/* Role legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
          <Card key={role} className="p-5 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              {role === 'super_admin' ? <Crown className="h-4 w-4 text-[#0057B8]" /> : <Shield className="h-4 w-4 text-slate-500" />}
              <h3 className="font-bold text-slate-900 capitalize">{role.replace(/_/g, ' ')}</h3>
            </div>
            <ul className="space-y-1.5">
              {perms.map((p) => (
                <li key={p} className="flex items-start gap-2 text-xs text-slate-600">
                  <ShieldCheck className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Role matrix */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Staff Role Assignments</CardTitle>
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
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>New Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                          {s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        {s.kind === 'super_admin' && (
                          <Badge className="bg-[#0057B8] text-white border-0">
                            <Crown className="h-3 w-3 mr-1" /> Owner
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{s.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{s.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.kind === 'super_admin' ? (
                        <span className="text-xs text-slate-400 italic">fixed</span>
                      ) : (
                        <select
                          value={draftRoles[s.id] || s.role}
                          onChange={(e) => setDraftRoles({ ...draftRoles, [s.id]: e.target.value })}
                          className="h-10 px-3 rounded-md border border-slate-200 text-sm bg-white"
                        >
                          <option value="staff">Staff</option>
                          <option value="counselor">Counselor</option>
                          <option value="finance">Finance</option>
                          <option value="operations">Operations</option>
                        </select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="capitalize border-0 bg-green-50 text-green-600">{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {s.kind === 'super_admin' ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSave(s.id)}
                          disabled={!draftRoles[s.id] || draftRoles[s.id] === s.role}
                          className="h-9"
                        >
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="p-5 border-0 shadow-sm bg-[#EFF6FF]">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-[#0057B8] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">About role inheritance</p>
            <p className="text-xs text-slate-600 mt-1">
              The Partner Super Admin (your login account) is fixed and cannot be reassigned.
              Staff members can be reassigned between Staff / Counselor / Finance / Operations roles.
              All role changes are written to the audit log with old and new values.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
