'use client'

import { useState, useMemo } from 'react'
import {
  HelpCircle, Search, Filter, X, Send, Loader2, Mail, MailOpen,
  Reply, Inbox, MessageSquare,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'

interface Message {
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

interface MessagesResponse {
  messages: Message[]
  total: number
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'responded', label: 'Responded' },
]

export default function PartnerEnquiriesPage() {
  const session = getSession()

  const { data, loading } = usePortalData<MessagesResponse>({
    endpoint: '/api/messages',
    params: { userId: session?.user.id || '', limit: 100 },
  })

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [replyDialog, setReplyDialog] = useState<Message | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Enquiries = messages where partner is the recipient
  const enquiries = useMemo(() => {
    const incoming = (data?.messages || []).filter((m) => m.toUserId === session?.user.id)
    return incoming.map((m) => ({
      ...m,
      computedStatus: m.isRead ? 'responded' : 'new',
    }))
  }, [data, session?.user.id])

  const filtered = useMemo(() => {
    let list = enquiries
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((m) =>
        (m.subject || '').toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.fromUserId.toLowerCase().includes(q)
      )
    }
    if (status !== 'all') {
      list = list.filter((m) => m.computedStatus === status)
    }
    return list
  }, [enquiries, search, status])

  const stats = {
    total: enquiries.length,
    new: enquiries.filter((e) => e.computedStatus === 'new').length,
    responded: enquiries.filter((e) => e.computedStatus === 'responded').length,
  }

  const sendReply = async () => {
    if (!replyDialog || !replyText.trim()) {
      toast.error('Reply cannot be empty')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({
          fromUserId: session?.user.id,
          toUserId: replyDialog.fromUserId,
          subject: replyDialog.subject ? `Re: ${replyDialog.subject}` : 'Re: Your enquiry',
          body: replyText,
          type: 'internal',
        }),
      })
      if (!res.ok) throw new Error('Failed to send reply')
      // Mark original as read
      await fetch('/api/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({ messageIds: [replyDialog.id], userId: session?.user.id }),
      })
      toast.success('Reply sent successfully')
      setReplyDialog(null)
      setReplyText('')
      // Soft refresh by reloading after slight delay
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiries"
        description="Student and prospective lead enquiries received by your agency."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Enquiries" value={stats.total} icon={Inbox} accent="blue" />
        <StatCard label="New" value={stats.new} icon={Mail} accent="orange" />
        <StatCard label="Responded" value={stats.responded} icon={MailOpen} accent="green" />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput.trim())}
              placeholder="Search subject, message…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setSearch(searchInput.trim())} className="bg-[#0057B8] hover:bg-[#004a99] text-white border-0">
            <Filter className="h-4 w-4 mr-1" /> Apply
          </Button>
          {(search || status !== 'all') && (
            <Button variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setStatus('all') }}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse mb-2" />
                <div className="h-3 w-full bg-slate-100 rounded animate-pulse mb-1" />
                <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((m) => (
              <div key={m.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={
                    'h-9 w-9 rounded-full flex items-center justify-center shrink-0 ' +
                    (m.computedStatus === 'new' ? 'bg-[#FFF7ED] text-[#E8501A]' : 'bg-slate-100 text-slate-500')
                  }>
                    {m.computedStatus === 'new' ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{m.subject || '(No subject)'}</p>
                      <Badge
                        variant="outline"
                        className={m.computedStatus === 'new'
                          ? 'bg-[#FFF7ED] text-[#E8501A] border-orange-200'
                          : 'bg-green-50 text-green-700 border-green-200'}
                      >
                        {m.computedStatus === 'new' ? 'New' : 'Responded'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      From: <span className="font-mono">{m.fromUserId.slice(-8)}</span> •{' '}
                      {new Date(m.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-slate-700 mt-2 line-clamp-2">{m.body}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setReplyDialog(m); setReplyText('') }}
                    className="border-[#0057B8] text-[#0057B8] hover:bg-[#EFF6FF] shrink-0"
                  >
                    <Reply className="h-3.5 w-3.5 mr-1" /> Respond
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-1 font-medium">No enquiries yet</p>
              <p className="text-xs text-slate-400 mb-4">
                {search || status !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'When students or prospects send you a message, it will appear here.'}
              </p>
              <Button variant="outline" asChild>
                <a href="/partner/students">
                  <HelpCircle className="h-4 w-4 mr-2" /> View My Students
                </a>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Reply dialog */}
      <Dialog open={!!replyDialog} onOpenChange={(open) => !open && setReplyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Enquiry</DialogTitle>
            <DialogDescription>
              Reply to: <span className="font-semibold">{replyDialog?.subject || '(No subject)'}</span>
            </DialogDescription>
          </DialogHeader>
          {replyDialog && (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg bg-slate-50 border-l-2 border-[#0057B8] text-sm">
                <p className="text-xs text-slate-500 mb-1">Original message</p>
                <p className="text-slate-700">{replyDialog.body}</p>
              </div>
              <div>
                <Label>Your Reply</Label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here…"
                  rows={5}
                  className="mt-1"
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialog(null)}>Cancel</Button>
            <Button
              onClick={sendReply}
              disabled={submitting || !replyText.trim()}
              className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Send Reply</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
