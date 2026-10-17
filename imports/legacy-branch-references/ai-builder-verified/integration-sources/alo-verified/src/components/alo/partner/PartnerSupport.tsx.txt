'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  HelpCircle, Plus, Search, MessageSquare, Send, Clock,
  CheckCircle2, AlertCircle, ChevronRight, Filter, ArrowUp
} from 'lucide-react'

interface Ticket {
  id: string
  ticketId: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  createdAt: string
  updatedAt: string
  replies: Array<{
    id: string
    body: string
    senderName: string
    senderRole: string
    createdAt: string
  }>
}

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: 'bg-blue-50 text-blue-700', label: 'Open' },
  in_progress: { color: 'bg-amber-50 text-amber-700', label: 'In Progress' },
  waiting_partner: { color: 'bg-purple-50 text-purple-700', label: 'Waiting on You' },
  resolved: { color: 'bg-green-50 text-green-700', label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-500', label: 'Closed' },
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-gray-100 text-gray-600', label: 'Low' },
  normal: { color: 'bg-blue-50 text-blue-600', label: 'Normal' },
  high: { color: 'bg-amber-50 text-amber-600', label: 'High' },
  urgent: { color: 'bg-red-50 text-red-600', label: 'Urgent' },
}

const initialTickets: Ticket[] = [
  {
    id: '1', ticketId: 'TKT-2025-0001', subject: 'Commission payment delayed', description: 'My commission payment for February (INV-2025-002) has not been received yet. The due date was March 15th.', status: 'in_progress', priority: 'high', category: 'billing', createdAt: '2025-03-16T10:00:00', updatedAt: '2025-03-17T09:00:00',
    replies: [
      { id: 'r1', body: 'Thank you for reaching out. We are checking with our finance team and will update you shortly.', senderName: 'David Brown', senderRole: 'Partner Relations', createdAt: '2025-03-16T14:00:00' },
      { id: 'r2', body: 'The payment has been initiated and should reflect in your account within 2-3 business days. We apologize for the delay.', senderName: 'David Brown', senderRole: 'Partner Relations', createdAt: '2025-03-17T09:00:00' },
    ]
  },
  {
    id: '2', ticketId: 'TKT-2025-0002', subject: 'Cannot upload student documents', description: 'The document upload feature is not working when I try to submit student files. Getting an error message.', status: 'waiting_partner', priority: 'normal', category: 'technical', createdAt: '2025-03-14T08:30:00', updatedAt: '2025-03-15T11:00:00',
    replies: [
      { id: 'r3', body: 'Could you please share a screenshot of the error message? Also, what file format are you trying to upload?', senderName: 'Support Team', senderRole: 'Support', createdAt: '2025-03-14T10:00:00' },
    ]
  },
  {
    id: '3', ticketId: 'TKT-2025-0003', subject: 'Request for custom marketing materials', description: 'We need branded flyers for our upcoming education fair in Dhaka. Can you provide customized materials?', status: 'resolved', priority: 'normal', category: 'marketing', createdAt: '2025-03-10T09:00:00', updatedAt: '2025-03-12T16:00:00',
    replies: [
      { id: 'r4', body: 'We would be happy to help! Could you share the specific details - event name, date, and any special requirements?', senderName: 'Lisa Taylor', senderRole: 'Marketing', createdAt: '2025-03-10T11:00:00' },
      { id: 'r5', body: 'The custom flyers have been designed and uploaded to the Marketing Materials section. Please download and let us know if any changes are needed!', senderName: 'Lisa Taylor', senderRole: 'Marketing', createdAt: '2025-03-12T16:00:00' },
    ]
  },
  {
    id: '4', ticketId: 'TKT-2025-0004', subject: 'Agreement renewal question', description: 'Our TYPE1 agreement (AGR-2024-003) is pending renewal. What are the updated commission rates for 2025?', status: 'open', priority: 'normal', category: 'agreements', createdAt: '2025-03-18T14:00:00', updatedAt: '2025-03-18T14:00:00',
    replies: []
  },
]

export default function PartnerSupport() {
  const { currentUser } = useAppStore()
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'normal', category: 'general' })

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  const statusCounts = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    waiting_partner: tickets.filter(t => t.status === 'waiting_partner').length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
  }

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Please fill in subject and description')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTicket,
          userId: currentUser?.id || 'partner',
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setTickets(prev => [created, ...prev])
        toast.success('Support ticket created!')
      } else {
        // Still add locally for demo
        const ticket: Ticket = {
          id: `t-${Date.now()}`,
          ticketId: `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(4, '0')}`,
          subject: newTicket.subject,
          description: newTicket.description,
          status: 'open',
          priority: newTicket.priority,
          category: newTicket.category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          replies: [],
        }
        setTickets(prev => [ticket, ...prev])
        toast.success('Support ticket created!')
      }
    } catch {
      const ticket: Ticket = {
        id: `t-${Date.now()}`,
        ticketId: `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(4, '0')}`,
        subject: newTicket.subject,
        description: newTicket.description,
        status: 'open',
        priority: newTicket.priority,
        category: newTicket.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
      }
      setTickets(prev => [ticket, ...prev])
      toast.success('Support ticket created!')
    }
    setShowCreateDialog(false)
    setNewTicket({ subject: '', description: '', priority: 'normal', category: 'general' })
    setSending(false)
  }

  const handleReply = () => {
    if (!replyText.trim() || !selectedTicket) return
    const reply = {
      id: `r-${Date.now()}`,
      body: replyText.trim(),
      senderName: currentUser?.name || 'Partner',
      senderRole: 'partner',
      createdAt: new Date().toISOString(),
    }
    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return { ...t, replies: [...t.replies, reply], updatedAt: new Date().toISOString() }
      }
      return t
    }))
    setSelectedTicket(prev => {
      if (!prev) return null
      return { ...prev, replies: [...prev.replies, reply], updatedAt: new Date().toISOString() }
    })
    setReplyText('')
    toast.success('Reply sent')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Support</h1>
          <p className="text-sm text-gray-500 mt-1">Get help and manage support tickets</p>
        </div>
        <Button className="bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Ticket
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: statusCounts.open, icon: <HelpCircle className="h-5 w-5" />, bg: 'bg-blue-50', textColor: 'text-blue-600' },
          { label: 'In Progress', value: statusCounts.in_progress, icon: <Clock className="h-5 w-5" />, bg: 'bg-amber-50', textColor: 'text-amber-600' },
          { label: 'Waiting on You', value: statusCounts.waiting_partner, icon: <AlertCircle className="h-5 w-5" />, bg: 'bg-purple-50', textColor: 'text-purple-600' },
          { label: 'Resolved', value: statusCounts.resolved, icon: <CheckCircle2 className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(priorityConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ticket List */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No support tickets found</p>
            <Button className="mt-4 bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create New Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Ticket ID</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Last Updated</TableHead>
                  <TableHead className="text-xs">Replies</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ticket) => {
                  const sc = statusConfig[ticket.status] || { color: 'bg-gray-100 text-gray-600', label: ticket.status }
                  const pc = priorityConfig[ticket.priority] || { color: 'bg-gray-100 text-gray-600', label: ticket.priority }
                  return (
                    <TableRow key={ticket.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => { setSelectedTicket(ticket); setShowDetailDialog(true) }}>
                      <TableCell className="text-xs font-mono text-[#0066CC]">{ticket.ticketId}</TableCell>
                      <TableCell className="text-sm text-[#1A2332] max-w-[250px] truncate">{ticket.subject}</TableCell>
                      <TableCell><Badge className={`text-xs ${pc.color}`}>{pc.label}</Badge></TableCell>
                      <TableCell><Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-500">{new Date(ticket.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs text-gray-500">{ticket.replies.length}</TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-gray-400" /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">Subject</Label>
              <Input className="mt-1" placeholder="Brief description of your issue" value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Category</Label>
              <Select value={newTicket.category} onValueChange={(v) => setNewTicket(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="billing">Billing / Commission</SelectItem>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="marketing">Marketing Materials</SelectItem>
                  <SelectItem value="agreements">Agreements</SelectItem>
                  <SelectItem value="students">Student Related</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Priority</Label>
              <Select value={newTicket.priority} onValueChange={(v) => setNewTicket(prev => ({ ...prev, priority: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <Textarea className="mt-1 min-h-[120px]" placeholder="Describe your issue in detail..." value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateTicket} disabled={sending} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                <Send className="h-4 w-4 mr-2" /> {sending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-[#1A2332]">Ticket Details</DialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">{selectedTicket?.ticketId}</p>
              </div>
              {selectedTicket && (
                <Badge className={statusConfig[selectedTicket.status]?.color || 'bg-gray-100'}>
                  {statusConfig[selectedTicket.status]?.label || selectedTicket.status}
                </Badge>
              )}
            </div>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#1A2332]">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${priorityConfig[selectedTicket.priority]?.color || 'bg-gray-100'}`}>
                    {selectedTicket.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">{selectedTicket.category}</Badge>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{selectedTicket.description}</p>
                <p className="text-[10px] text-gray-400 mt-2">
                  Created {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>
              <Separator />
              {/* Replies */}
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {selectedTicket.replies.map((reply) => (
                    <div key={reply.id} className={`${reply.senderRole === 'partner' ? 'ml-4' : 'mr-4'}`}>
                      <div className={`rounded-lg p-3 ${
                        reply.senderRole === 'partner'
                          ? 'bg-[#F37021]/10 border border-[#F37021]/20'
                          : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-[#1A2332]">{reply.senderName}</p>
                          <p className="text-[10px] text-gray-400">{new Date(reply.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-gray-700">{reply.body}</p>
                      </div>
                    </div>
                  ))}
                  {selectedTicket.replies.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">No replies yet</p>
                  )}
                </div>
              </ScrollArea>
              {/* Reply Input */}
              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      className="bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" /> Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
