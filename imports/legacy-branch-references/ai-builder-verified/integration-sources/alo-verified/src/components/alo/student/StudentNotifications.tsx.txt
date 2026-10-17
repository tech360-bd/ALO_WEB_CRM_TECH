'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Bell, CheckCircle2, Clock, FileText, MessageSquare, AlertCircle,
  Filter, CheckCheck, Trash2
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string // info, success, warning, error, application, document, message
  isRead: boolean
  createdAt: string
  link?: string
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  info: { icon: Bell, color: '#0066CC', bg: '#E8F0FE' },
  success: { icon: CheckCircle2, color: '#22C55E', bg: '#F0FDF4' },
  warning: { icon: AlertCircle, color: '#F37021', bg: '#FFF3E8' },
  error: { icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' },
  application: { icon: FileText, color: '#0066CC', bg: '#E8F0FE' },
  document: { icon: FileText, color: '#F37021', bg: '#FFF3E8' },
  message: { icon: MessageSquare, color: '#8B5CF6', bg: '#F3F0FF' },
}

export default function StudentNotifications() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true)
        // Fetch notifications from the API
        if (currentUser?.id) {
          // Try to fetch from messages endpoint as notifications source
          const res = await fetch(`/api/messages?userId=${currentUser.id}&limit=50`)
          if (res.ok) {
            const json = await res.json()
            const msgs: Notification[] = (json.messages || []).map((m: Record<string, unknown>) => ({
              id: m.id as string,
              title: m.subject as string || 'New Message',
              message: m.body as string || '',
              type: (m.category as string) || 'message',
              isRead: m.isRead as boolean || false,
              createdAt: m.createdAt as string,
            }))
            setNotifications(msgs)
          }
        }

        // If API returns empty, keep notifications empty
      } catch {
        toast.error('Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [currentUser?.id])

  function markAsRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  async function markAllAsRead() {
    try {
      setMarkingAll(true)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } finally {
      setMarkingAll(false)
    }
  }

  function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
    toast.success('Notification deleted')
  }

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications.filter(n => n.type === filter)
  const unreadCount = notifications.filter(n => !n.isRead).length

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>Notifications</h1>
          <p className="text-gray-500 text-sm">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={markingAll}>
            <CheckCheck className="w-4 h-4 mr-1" />Mark All Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
          { value: 'application', label: 'Applications' },
          { value: 'document', label: 'Documents' },
          { value: 'message', label: 'Messages' },
          { value: 'warning', label: 'Alerts' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: filter === f.value ? '#F37021' : '#F7F9FC',
              color: filter === f.value ? 'white' : '#1A2332',
            }}
          >
            {f.label}
            {f.value === 'unread' && unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: filter === f.value ? 'rgba(255,255,255,0.3)' : '#F37021', color: filter === f.value ? 'white' : 'white' }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A2332' }}>No Notifications</h3>
            <p className="text-gray-500 text-sm">
              {filter !== 'all' ? 'No notifications matching this filter.' : 'You\'re all caught up!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(notification => {
            const config = typeConfig[notification.type] || typeConfig.info
            const Icon = config.icon
            return (
              <Card
                key={notification.id}
                className={`hover:shadow-sm transition-shadow cursor-pointer ${!notification.isRead ? 'border-l-4' : ''}`}
                style={{ borderLeftColor: !notification.isRead ? config.color : undefined }}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: config.bg }}>
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`} style={{ color: '#1A2332' }}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                        {!notification.isRead && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F37021' }} />}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}>
                    <Trash2 className="w-3 h-3 text-gray-400" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
