'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Send, Search, Phone, Video, Info, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MessageRecord {
  id: string
  fromUserId: string
  toUserId: string
  subject: string | null
  body: string
  type: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

interface Conversation {
  partnerId: string
  partnerLabel: string
  partnerInitials: string
  lastMessage: MessageRecord
  messages: MessageRecord[]
  unread: number
}

function timeAgo(d: string): string {
  try {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

function formatTime(d: string): string {
  try {
    return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function MessagesPage() {
  const session = getSession()
  const { data, loading } = usePortalData<{ messages: MessageRecord[]; total: number }>({
    endpoint: '/api/messages',
    params: { userId: session?.user.id || '', limit: 100 },
  })

  const [search, setSearch] = useState('')
  const [activePartner, setActivePartner] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false)
  const threadEndRef = useRef<HTMLDivElement>(null)

  const conversations = useMemo<Conversation[]>(() => {
    if (!data?.messages || data.messages.length === 0) return []
    const myId = session?.user.id
    const map = new Map<string, Conversation>()
    const sorted = [...data.messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    for (const m of sorted) {
      const partnerId = m.fromUserId === myId ? m.toUserId : m.fromUserId
      if (!map.has(partnerId)) {
        map.set(partnerId, {
          partnerId,
          partnerLabel: partnerId === myId ? 'You' : `Counselor ${partnerId.slice(-4)}`,
          partnerInitials: 'CN',
          lastMessage: m,
          messages: [],
          unread: 0,
        })
      }
      const conv = map.get(partnerId)!
      conv.messages.push(m)
      conv.lastMessage = m
      if (m.toUserId === myId && !m.isRead) conv.unread += 1
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    )
  }, [data, session])

  useEffect(() => {
    if (!activePartner && conversations.length > 0) {
      setActivePartner(conversations[0].partnerId)
    }
  }, [conversations, activePartner])

  const filteredConvos = useMemo(() => {
    if (!search) return conversations
    return conversations.filter((c) =>
      c.partnerLabel.toLowerCase().includes(search.toLowerCase()) ||
      c.messages.some((m) => m.body.toLowerCase().includes(search.toLowerCase()))
    )
  }, [conversations, search])

  const activeConv = conversations.find((c) => c.partnerId === activePartner) || null

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages.length])

  const handleSend = async () => {
    if (!draft.trim() || !activeConv || !session?.user.id) return
    const body = draft.trim()
    setDraft('')
    setSending(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alo_token') : null
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          fromUserId: session.user.id,
          toUserId: activeConv.partnerId,
          body,
          type: 'internal',
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      toast.success('Message sent')
      // Reload to get fresh messages
      setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Send failed')
      setDraft(body)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Chat with your counselor and the ALO support team."
      />

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-[300px_1fr] h-[600px]">
          {/* Conversation List */}
          <div className={cn(
            'flex flex-col border-r border-slate-100',
            mobileThreadOpen && 'hidden md:flex'
          )}>
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="pl-9 h-9 bg-slate-50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto alo-scrollbar">
              {loading ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filteredConvos.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No conversations yet</p>
                </div>
              ) : (
                filteredConvos.map((c) => (
                  <button
                    key={c.partnerId}
                    onClick={() => {
                      setActivePartner(c.partnerId)
                      setMobileThreadOpen(true)
                    }}
                    className={cn(
                      'w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3',
                      activePartner === c.partnerId && 'bg-[#EFF6FF]/60'
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-[#EFF6FF] text-[#0057B8] text-xs">
                        {c.partnerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{c.partnerLabel}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {timeAgo(c.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {c.lastMessage.fromUserId === session?.user.id && 'You: '}
                        {c.lastMessage.body}
                      </p>
                      {c.unread > 0 && (
                        <Badge className="mt-1 h-5 px-1.5 text-[10px] bg-[#E8501A] text-white border-0">
                          {c.unread} new
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Thread */}
          <div className={cn(
            'flex flex-col',
            !mobileThreadOpen && 'hidden md:flex'
          )}>
            {activeConv ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <button
                    className="md:hidden text-slate-500"
                    onClick={() => setMobileThreadOpen(false)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[#EFF6FF] text-[#0057B8] text-xs">
                      {activeConv.partnerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{activeConv.partnerLabel}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Online
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Info className="h-4 w-4" /></Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 alo-scrollbar">
                  {activeConv.messages.map((m) => {
                    const isMe = m.fromUserId === session?.user.id
                    return (
                      <div key={m.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2.5',
                          isMe
                            ? 'bg-[#0057B8] text-white rounded-br-md'
                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-md'
                        )}>
                          {m.subject && !isMe && (
                            <p className="text-xs font-semibold mb-1 opacity-70">{m.subject}</p>
                          )}
                          <p className="text-sm whitespace-pre-line">{m.body}</p>
                          <p className={cn(
                            'text-[10px] mt-1 text-right',
                            isMe ? 'text-blue-100' : 'text-slate-400'
                          )}>
                            {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={threadEndRef} />
                </div>

                {/* Compose */}
                <div className="p-3 border-t border-slate-100">
                  <div className="flex items-end gap-2">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      placeholder="Type a message…"
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      className="bg-[#0057B8] hover:bg-[#00449a] text-white shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                    Press Enter to send • Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    {loading ? 'Loading…' : 'Select a conversation to start chatting'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
