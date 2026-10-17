'use client'

import { useEffect, useState } from 'react'
import {
  LifeBuoy, Plus, Send, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface Ticket {
  id: string
  subject: string
  description: string
  category: string | null
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  replies: Array<{ id: string; message: string; createdAt: string; user: { name: string } }>
}

export default function PartnerAdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium' })

  const session = getSession()

  async function load() {
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch(`/api/support-tickets?userId=${session.user.id}&limit=50`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setTickets(json.tickets || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!session) return
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject and description are required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ userId: session.user.id, ...form }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create ticket')
      toast.success('Ticket created — our team will reply shortly')
      setOpen(false)
      setForm({ subject: '', description: '', category: 'general', priority: 'medium' })
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length
  const highPriority = tickets.filter((t) => t.priority === 'high' || t.priority === 'urgent').length

  const STATUS_BADGE: Record<string, 'bg-amber-50 text-amber-600' | 'bg-blue-50 text-blue-600' | 'bg-green-50 text-green-600' | 'bg-slate-100 text-slate-600'> = {
    open: 'bg-amber-50 text-amber-600',
    in_progress: 'bg-blue-50 text-blue-600',
    resolved: 'bg-green-50 text-green-600',
    closed: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Get help from the ALO support team. Tickets are scoped to your account and tracked end-to-end."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 bg-[#E8501A] hover:bg-[#c8420f] text-white border-0">
                <Plus className="h-4 w-4 mr-2" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Open a Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-12 mt-1" placeholder="Brief summary of your issue" />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-1" placeholder="Describe the issue in detail..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-12 w-full mt-1 px-3 rounded-md border border-slate-200 text-sm bg-white">
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="application">Application</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select id="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="h-12 w-full mt-1 px-3 rounded-md border border-slate-200 text-sm bg-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="h-12">Cancel</Button>
                <Button onClick={handleCreate} disabled={creating} className="h-12 bg-[#0057B8] hover:bg-[#004a9c] text-white">
                  <Send className="h-4 w-4 mr-2" /> Submit Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Open / In Progress" value={openCount} icon={Clock} accent="blue" />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCircle2} accent="green" />
        <StatCard label="High Priority" value={highPriority} icon={AlertCircle} accent="orange" />
      </div>

      {/* Tickets table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Your Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <LifeBuoy className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No support tickets yet. Click "New Ticket" to get help.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Replies</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{t.subject}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{t.description}</p>
                    </TableCell>
                    <TableCell className="capitalize text-xs">{t.category || 'general'}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          t.priority === 'urgent'
                            ? 'border-0 bg-red-50 text-red-600 capitalize'
                            : t.priority === 'high'
                            ? 'border-0 bg-amber-50 text-amber-600 capitalize'
                            : 'border-0 bg-slate-100 text-slate-600 capitalize'
                        }
                      >
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-0 capitalize ${STATUS_BADGE[t.status] || STATUS_BADGE.open}`}>
                        {t.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.replies?.length || 0}</TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
