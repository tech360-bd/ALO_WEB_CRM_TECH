'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  HelpCircle, Plus, Search, Clock, CheckCircle2, MessageSquare,
  AlertCircle, ChevronLeft, Send, User, Calendar, Tag, Filter
} from 'lucide-react'

interface TicketReply {
  id: string
  body: string
  senderName: string
  senderRole: string
  createdAt: string
}

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
  replies: TicketReply[]
}

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: 'bg-blue-50 text-blue-700', label: 'Open' },
  in_progress: { color: 'bg-yellow-50 text-yellow-700', label: 'In Progress' },
  resolved: { color: 'bg-green-50 text-green-700', label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-600', label: 'Closed' },
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-gray-50 text-gray-600', label: 'Low' },
  normal: { color: 'bg-blue-50 text-blue-600', label: 'Normal' },
  high: { color: 'bg-orange-50 text-orange-600', label: 'High' },
  urgent: { color: 'bg-red-50 text-red-600', label: 'Urgent' },
}

export default function StudentSupport() {
  const { currentUser } = useAppStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true)
        const userId = currentUser?.id || ''
        const res = await fetch(`/api/support-tickets?userId=${userId}&limit=50`)
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setTickets(json.tickets || json || [])
      } catch {
        setTickets([])
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [currentUser?.id])

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.ticketId.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    try {
      const formData = new FormData(e.currentTarget)
      const body = {
        userId: currentUser?.id || '',
        subject: formData.get('subject') || '',
        description: formData.get('description') || '',
        category: formData.get('category') || 'general',
        priority: formData.get('priority') || 'normal',
      }
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create ticket')
      toast.success('Support ticket created')
      setShowCreateDialog(false)
      const json = await res.json()
      setTickets(prev => [json, ...prev])
    } catch {
      toast.error('Failed to create ticket')
    } finally {
      setCreating(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: replyText,
          senderId: currentUser?.id || '',
          senderName: currentUser?.name || 'Student',
          senderRole: 'student',
        }),
      })
      if (!res.ok) throw new Error('Failed to send reply')
      toast.success('Reply sent')
      setReplyText('')
      setSelectedTicket(prev => prev ? {
        ...prev,
        replies: [...prev.replies, {
          id: Date.now().toString(),
          body: replyText,
          senderName: currentUser?.name || 'Student',
          senderRole: 'student',
          createdAt: new Date().toISOString(),
        }]
      } : prev)
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSendingReply(false)
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

  // Ticket Detail View
  if (selectedTicket) {
    const sc = statusConfig[selectedTicket.status] || statusConfig.open
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="text-gray-500">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Tickets
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-alo-navy">{selectedTicket.subject}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                  <Badge className={`text-xs ${priorityConfig[selectedTicket.priority]?.color || 'bg-gray-50 text-gray-600'}`}>
                    {priorityConfig[selectedTicket.priority]?.label || selectedTicket.priority}
                  </Badge>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {selectedTicket.category}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-400">{selectedTicket.ticketId}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-50 rounded-lg mb-6">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Created: {new Date(selectedTicket.createdAt).toLocaleString()}
              </p>
            </div>

            <Separator className="my-4" />

            {/* Replies */}
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar mb-4">
              {selectedTicket.replies.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No replies yet</p>
              ) : (
                selectedTicket.replies.map((reply) => (
                  <div key={reply.id} className={`flex gap-3 ${reply.senderRole === 'student' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      reply.senderRole === 'student' ? 'bg-alo-orange/10' : 'bg-alo-blue/10'
                    }`}>
                      <User className={`h-4 w-4 ${reply.senderRole === 'student' ? 'text-alo-orange' : 'text-alo-blue'}`} />
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      reply.senderRole === 'student' ? 'bg-alo-orange/5' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-alo-navy">{reply.senderName}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input */}
            <div className="border-t pt-4">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="min-h-[80px]"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleReply}
                  disabled={!replyText.trim() || sendingReply}
                  className="bg-alo-orange hover:bg-alo-orange/90 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">Support</h1>
          <p className="text-sm text-gray-500 mt-1">Get help with your applications and queries</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-alo-orange hover:bg-alo-orange/90 text-white">
              <Plus className="h-4 w-4 mr-2" /> Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Subject</Label>
                <Input name="subject" className="mt-1" placeholder="Brief description of your issue" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Category</Label>
                <Select name="category" defaultValue="general">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="application">Application Issue</SelectItem>
                    <SelectItem value="visa">Visa Question</SelectItem>
                    <SelectItem value="payment">Payment Issue</SelectItem>
                    <SelectItem value="document">Document Upload</SelectItem>
                    <SelectItem value="technical">Technical Problem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Priority</Label>
                <Select name="priority" defaultValue="normal">
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
                <Textarea name="description" className="mt-1 min-h-[120px]" placeholder="Describe your issue in detail..." required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={creating} className="bg-alo-orange hover:bg-alo-orange/90 text-white">
                  {creating ? 'Creating...' : 'Submit Ticket'}
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
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{tickets.length}</p>
              <p className="text-xs text-gray-500">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{openCount}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{resolvedCount}</p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No support tickets</p>
            <p className="text-xs text-gray-400 mt-1">Create a ticket if you need help</p>
            <Button className="mt-4 bg-alo-orange hover:bg-alo-orange/90 text-white"
              onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const sc = statusConfig[ticket.status] || statusConfig.open
            const pc = priorityConfig[ticket.priority] || priorityConfig.normal
            return (
              <Card
                key={ticket.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    ticket.status === 'open' || ticket.status === 'in_progress' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    {ticket.status === 'open' || ticket.status === 'in_progress'
                      ? <AlertCircle className="h-5 w-5 text-yellow-600" />
                      : <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-alo-navy truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                      <Badge className={`text-[10px] ${pc.color}`}>{pc.label}</Badge>
                      <span className="text-[10px] text-gray-400">{ticket.replies?.length || 0} replies</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-400">{ticket.ticketId}</p>
                    <p className="text-[10px] text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
