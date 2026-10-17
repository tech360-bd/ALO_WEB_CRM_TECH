'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCheck,
  MessageCircle,
  Users,
  Bell,
  Archive,
  Filter,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WhatsappMessage {
  id: string
  conversationId: string
  messageText: string | null
  mediaUrl: string | null
  mediaType: string | null
  direction: string
  status: string
  sentAt: string
}

interface Conversation {
  id: string
  phoneNumber: string
  contactNumber: string
  contactName: string | null
  studentId: string | null
  partnerId: string | null
  employeeId: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  status: string
  createdAt: string
  updatedAt: string
  messages_relation: WhatsappMessage[]
}

interface WhatsappResponse {
  conversations: Conversation[]
  numberPool: Array<{ id: string; phoneNumber: string; category: string; assignedTo: string | null; status: string }>
  templates: Array<{ id: string; name: string; body: string; language: string; status: string }>
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface SlaEscalation {
  id: string
  conversationId: string | null
  channel: string
  contactIdentifier: string | null
  assignedTo: string | null
  currentLevel: number
  resolvedAt: string | null
  createdAt: string
}

interface SlaApiResponse {
  escalations: SlaEscalation[]
  stats: { level1: number; level2: number; level3: number; overdue: number; resolved: number }
}

export default function WhatsappInboxPage() {
  const session = getSession()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [overdueByConversation, setOverdueByConversation] = useState<Map<string, number>>(new Map())
  const [assigning, setAssigning] = useState(false)

  const { data, loading } = usePortalData<WhatsappResponse>({
    endpoint: '/api/whatsapp',
    params: { limit: 100 },
  })

  const conversations = data?.conversations ?? []
  const numberPool = data?.numberPool ?? []

  // Fetch SLA escalations and build a lookup of conversationId → max escalation level.
  // Conversations with currentLevel > 0 get an "SLA Level N" badge.
  useEffect(() => {
    if (!session?.token) return
    let cancelled = false
    fetch('/api/marketing/sla', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as SlaApiResponse
      })
      .then((d) => {
        if (cancelled || !d) return
        const map = new Map<string, number>()
        for (const e of d.escalations || []) {
          if (!e.conversationId) continue
          if (e.resolvedAt) continue
          if (e.currentLevel <= 0) continue
          const prev = map.get(e.conversationId) ?? 0
          if (e.currentLevel > prev) map.set(e.conversationId, e.currentLevel)
        }
        setOverdueByConversation(map)
      })
      .catch(() => {
        // Silently ignore — SLA badge is non-critical
      })
    return () => {
      cancelled = true
    }
  }, [session?.token])

  const filteredConversations = conversations.filter((c) => {
    if (filter === 'unread' && c.unreadCount === 0) return false
    if (filter === 'assigned' && !c.employeeId) return false
    if (search) {
      const q = search.toLowerCase()
      return (c.contactName || '').toLowerCase().includes(q) || c.contactNumber.includes(q) || (c.lastMessage || '').toLowerCase().includes(q)
    }
    return true
  })

  const selected = conversations.find((c) => c.id === selectedId) || null

  // Auto-select first conversation on load
  useEffect(() => {
    if (!selectedId && filteredConversations.length > 0) {
      setSelectedId(filteredConversations[0].id)
    }
  }, [filteredConversations, selectedId])

  const handleSend = async () => {
    if (!draft.trim() || !selected) return
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}` },
        body: JSON.stringify({
          conversationId: selected.id,
          messageText: draft,
        }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      toast.success('Message sent')
      setDraft('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send')
    }
  }

  const handleAssign = async () => {
    if (!selected) return
    const employeeId = window.prompt(
      'Enter the Employee ID (UUID) to assign this conversation to:',
      selected.employeeId || ''
    )
    if (employeeId === null) return // user cancelled
    if (!employeeId.trim()) {
      toast.error('Employee ID is required')
      return
    }
    setAssigning(true)
    try {
      // POST /api/whatsapp with conversationId + assignedEmployeeId — the
      // WhatsApp route persists the assignment on the conversation row.
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}` },
        body: JSON.stringify({
          conversationId: selected.id,
          action: 'assign',
          assignedEmployeeId: employeeId.trim(),
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || `Failed to assign (${res.status})`)
      }
      toast.success(`Conversation assigned to ${employeeId.trim()}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign')
    } finally {
      setAssigning(false)
    }
  }

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)
  const assigned = conversations.filter((c) => c.employeeId).length
  const open = conversations.filter((c) => c.status === 'open').length

  return (
    <div className="space-y-4">
      <PageHeader
        title="WhatsApp Inbox"
        description="Unified WhatsApp inbox — manage conversations across number pool, assign agents, and reply in real time."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Conversations" value={conversations.length} icon={MessageCircle} accent="blue" />
        <StatCard label="Unread" value={totalUnread} icon={Bell} accent="orange" />
        <StatCard label="Assigned" value={assigned} icon={Users} accent="purple" />
        <StatCard label="Open" value={open} icon={MessageCircle} accent="green" />
      </div>

      {/* Number pool */}
      {numberPool.length > 0 && (
        <Card className="p-3 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-4 w-4 text-[#0057B8]" />
            <h3 className="text-xs font-semibold text-slate-700">WhatsApp Number Pool</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {numberPool.map((n) => (
              <Badge key={n.id} className="bg-slate-100 text-slate-700 border-0 text-xs">
                {n.phoneNumber} <span className="text-slate-400 ml-1">·</span> <span className="capitalize">{n.category}</span>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[600px]">
        {/* Conversation list */}
        <Card className="border-0 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="flex items-center gap-1">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                  <SelectItem value="assigned">Assigned to me</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-3 space-y-2">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-16 rounded bg-slate-100 animate-pulse" />)}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <MessageCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                No conversations found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredConversations.map((c) => {
                  const initials = (c.contactName || c.contactNumber.slice(-2)).toUpperCase()
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        'w-full text-left p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors',
                        selectedId === c.id && 'bg-blue-50/60'
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white text-xs font-bold">
                          {initials.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{c.contactName || c.contactNumber}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{c.lastMessage || 'No messages yet'}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {overdueByConversation.has(c.id) && (
                            <Badge className="bg-red-500 text-white border-0 text-[10px] gap-0.5 animate-pulse">
                              <AlertTriangle className="h-2.5 w-2.5" /> SLA Level {overdueByConversation.get(c.id)}
                            </Badge>
                          )}
                          {c.employeeId && <Badge className="bg-blue-50 text-[#0057B8] border-0 text-[10px]">Assigned</Badge>}
                          {c.unreadCount > 0 && <Badge className="bg-[#E8501A] text-white border-0 text-[10px]">{c.unreadCount}</Badge>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat thread */}
        <Card className="border-0 shadow-sm overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white text-xs font-bold">
                      {(selected.contactName || selected.contactNumber.slice(-2)).toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selected.contactName || selected.contactNumber}</p>
                    <p className="text-xs text-slate-500">{selected.phoneNumber} → {selected.contactNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.info('Voice call (would dial via WhatsApp)')}><Phone className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.info('Video call')}><Video className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 gap-1" disabled={assigning} onClick={handleAssign} title="Assign this conversation to an employee">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">{assigning ? 'Assigning…' : 'Assign'}</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 bg-slate-50/50">
                <div className="p-4 space-y-3">
                  {selected.messages_relation && selected.messages_relation.length > 0 ? (
                    selected.messages_relation.map((m) => (
                      <div key={m.id} className={cn('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                          m.direction === 'outbound' ? 'bg-[#0057B8] text-white rounded-br-none' : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                        )}>
                          <p>{m.messageText || '[Media]'}</p>
                          <div className={cn('flex items-center gap-1 mt-1 text-[10px]', m.direction === 'outbound' ? 'text-white/70' : 'text-slate-400')}>
                            <span>{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {m.direction === 'outbound' && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-8">No messages in this conversation yet.</div>
                  )}
                  {selected.lastMessage && (
                    <div className={cn('flex', 'justify-start')}>
                      <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-bl-none">
                        <p>{selected.lastMessage}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{selected.lastMessageAt ? new Date(selected.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Compose box */}
              <div className="p-3 border-t border-slate-100">
                <div className="flex items-end gap-2">
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={() => toast.info('Attach file')}><Paperclip className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={() => toast.info('Emoji picker')}><Smile className="h-4 w-4" /></Button>
                  <Input
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    className="flex-1 h-9"
                  />
                  <Button size="sm" className="h-9 bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={handleSend} disabled={!draft.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
