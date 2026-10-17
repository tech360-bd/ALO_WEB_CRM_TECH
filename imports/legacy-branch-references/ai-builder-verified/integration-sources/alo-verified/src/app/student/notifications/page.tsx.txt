'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, BellOff, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NotificationRecord {
  id: string
  userId: string
  title: string
  message: string
  type: string
  link: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

interface NotificationsResponse {
  notifications: NotificationRecord[]
  total: number
  unreadCount: number
}

const TYPE_META: Record<string, { bg: string; text: string; iconBg: string; Icon: typeof Info }> = {
  info: { bg: 'bg-blue-50', text: 'text-[#0057B8]', iconBg: 'bg-[#EFF6FF]', Icon: Info },
  success: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', Icon: CheckCircle2 },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', Icon: AlertTriangle },
  error: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100', Icon: XCircle },
}

function formatTimeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function formatFullDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function NotificationsPage() {
  const session = getSession()
  const { data, loading } = usePortalData<NotificationsResponse>({
    endpoint: '/api/notifications',
    params: { userId: session?.user.id || '', limit: 100 },
  })

  const [items, setItems] = useState<NotificationRecord[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data?.notifications) setItems(data.notifications)
  }, [data])

  const unreadCount = items.filter((n) => !n.isRead).length

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    )
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token || ''}`,
        },
        body: JSON.stringify({ notificationIds: [id] }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to mark as read')
      }
      toast.success('Marked as read')
    } catch (e) {
      // Revert on failure
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false, readAt: null } : n)))
      toast.error(e instanceof Error ? e.message : 'Failed to mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    setBusy(true)
    const snapshot = items
    // Optimistic update
    setItems((prev) =>
      prev.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: new Date().toISOString() }))
    )
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token || ''}`,
        },
        body: JSON.stringify({ markAll: true }),
      })
      if (!res.ok) throw new Error('Failed to mark all as read')
      toast.success(`${unreadCount} notification(s) marked as read`)
    } catch (e) {
      setItems(snapshot)
      toast.error(e instanceof Error ? e.message : 'Failed to mark all as read')
    } finally {
      setBusy(false)
    }
  }

  // Role gate: must be logged in as a student
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader title="Notifications" description="Stay updated on your applications, documents, and messages." />
        <Card className="p-12 border-0 shadow-sm text-center">
          <p className="text-sm text-slate-500">You must be signed in to view notifications.</p>
        </Card>
      </div>
    )
  }
  const isStudent =
    session.user.userType === 'student' || session.roles.some((r) => r.name === 'student')
  if (!isStudent) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader title="Notifications" description="Stay updated on your applications, documents, and messages." />
        <Card className="p-12 border-0 shadow-sm text-center">
          <p className="text-sm text-slate-500">This page is restricted to student accounts.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated on your applications, documents, and messages."
        action={
          <Button
            variant="outline"
            className="border-slate-200"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || busy}
          >
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all as read
            {unreadCount > 0 && (
              <Badge className="ml-1.5 h-5 px-1.5 text-[10px] bg-[#E8501A] text-white border-0">{unreadCount}</Badge>
            )}
          </Button>
        }
      />

      <div className="flex-1">
        <Card className="border-0 shadow-sm">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                <BellOff className="h-7 w-7 text-[#0057B8]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No notifications</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                When your counselor or the ALO team updates something — a new message, an application status change, or an
                appointment reminder — it will show up here.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[640px]">
              <div className="divide-y divide-slate-100">
                {items.map((n) => {
                  const meta = TYPE_META[n.type] || TYPE_META.info
                  const Icon = meta.Icon
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        'p-4 flex gap-3 hover:bg-slate-50/50 transition-colors',
                        !n.isRead && 'bg-[#EFF6FF]/30'
                      )}
                    >
                      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', meta.iconBg)}>
                        <Icon className={cn('h-5 w-5', meta.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              'text-sm',
                              n.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'
                            )}
                          >
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0" title={formatFullDate(n.createdAt)}>
                            {formatTimeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {!n.isRead && (
                            <Badge className="bg-[#E8501A]/10 text-[#E8501A] border-0 h-5 px-1.5 text-[10px]">New</Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn('border-0 h-5 px-1.5 text-[10px] capitalize', meta.bg, meta.text)}
                          >
                            {n.type}
                          </Badge>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="text-xs text-[#0057B8] hover:underline ml-auto font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                          {n.isRead && n.link && (
                            <Link href={n.link} className="text-xs text-[#0057B8] hover:underline ml-auto font-medium">
                              View →
                            </Link>
                          )}
                          {n.isRead && !n.link && (
                            <span className="text-[10px] text-slate-400 ml-auto">Read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>

      <footer className="mt-auto pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ALO Education — Empowering students worldwide.
      </footer>
    </div>
  )
}
