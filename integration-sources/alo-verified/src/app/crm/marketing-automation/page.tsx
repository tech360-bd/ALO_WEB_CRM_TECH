'use client'

import { useEffect, useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Sparkles, Palette, MessageSquare, Bot, Webhook, ShieldCheck,
  Plus, CheckCircle2, XCircle, Clock, Users, Send, Trash2, Edit3, Zap,
  TrendingUp, Hash, Upload, AlertTriangle, Activity,
  RefreshCw, FileText, Image as ImageIcon, Lock, Timer,
  KeyRound, UserCheck, Calendar, ScrollText,
} from 'lucide-react'

// ─── Types ───
interface BrandAsset {
  id: string
  assetType: string
  name: string
  fileUrl: string | null
  value: string | null
  isPrimary: boolean
  status: string
  createdAt: string
}

interface MarketingContent {
  id: string
  contentType: string
  platform: string | null
  title: string | null
  caption: string | null
  hashtags: string | null
  bodyContent: string | null
  imagePrompt: string | null
  videoScript: string | null
  ctaText: string | null
  ctaLink: string | null
  sizeTemplate: string | null
  status: string
  approvedBy: string | null
  approvedAt: string | null
  publishedAt: string | null
  createdAt: string
  campaign?: { id: string; name: string } | null
}

interface KeywordTrigger {
  id: string
  keyword: string
  platform: string
  autoReplyText: string
  autoDmText: string | null
  createLead: boolean
  assignCounselorId: string | null
  status: string
  matchCount: number
  createdAt: string
}

interface SocialComment {
  id: string
  platform: string
  commenterName: string | null
  commenterId: string | null
  commentText: string
  matchedKeyword: string | null
  autoReplySent: boolean
  dmSent: boolean
  leadId: string | null
  status: string
  receivedAt: string
}

interface SlaEscalation {
  id: string
  channel: string
  contactIdentifier: string
  assignedTo: string | null
  currentLevel: number
  level1EscalatedAt: string | null
  level2EscalatedAt: string | null
  level3EscalatedAt: string | null
  resolvedAt: string | null
  resolutionNote: string | null
  createdAt: string
}

interface N8nWebhook {
  id: string
  name: string
  webhookUrl: string | null
  secretToken: string | null
  workflowType: string
  isActive: boolean
  lastTriggeredAt: string | null
  triggerCount: number
  createdAt: string
}

// ─── Constants ───
const CONTENT_TYPES = [
  { value: 'facebook_post', label: 'Facebook Post' },
  { value: 'instagram_post', label: 'Instagram Post' },
  { value: 'instagram_reel', label: 'Instagram Reel' },
  { value: 'tiktok_video', label: 'TikTok Video' },
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'whatsapp_broadcast', label: 'WhatsApp Broadcast' },
  { value: 'blog_article', label: 'Blog Article' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'sms_campaign', label: 'SMS Campaign' },
]

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'blog', label: 'Blog' },
]

const SIZE_TEMPLATES = [
  'Facebook Post 1200x630',
  'Instagram Square 1080x1080',
  'Instagram Story 1080x1920',
  'TikTok Video 1080x1920',
  'YouTube Thumbnail 1280x720',
  'LinkedIn Post 1200x627',
  'WhatsApp Status 1080x1920',
]

const SUGGESTED_KEYWORDS = [
  'Study Abroad', 'IELTS', 'Visa', 'UK', 'Canada', 'Australia', 'Scholarship', 'Apply',
]

const WORKFLOW_TYPES = [
  { value: 'lead_sync', label: 'Lead Sync' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'whatsapp_sequence', label: 'WhatsApp Sequence' },
  { value: 'email_sequence', label: 'Email Sequence' },
  { value: 'sms_sequence', label: 'SMS Sequence' },
  { value: 'campaign_report', label: 'Campaign Report' },
  { value: 'counselor_notify', label: 'Counselor Notify' },
]

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  ai_generated: 'bg-purple-50 text-purple-700',
  under_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  scheduled: 'bg-blue-50 text-blue-700',
  published: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  new: 'bg-blue-50 text-blue-700',
  replied: 'bg-amber-50 text-amber-700',
  converted: 'bg-green-50 text-green-700',
  ignored: 'bg-slate-100 text-slate-500',
  spam: 'bg-red-50 text-red-700',
}

const BRAND_COLORS = [
  { hex: '#0057B8', name: 'Primary Blue', desc: 'ALO primary brand blue — used in headers, CTAs, primary actions' },
  { hex: '#E8501A', name: 'CTA Orange', desc: 'Action accents — CTA buttons, highlights, urgency badges' },
  { hex: '#FFFFFF', name: 'White Background', desc: 'Base background — neutral canvas for content' },
]

// ─── Helper functions ───
function useApi<T>(endpoint: string, deps: unknown[] = []): {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), [])

  useEffect(() => {
    const session = getSession()
    let cancelled = false
    // setLoading(true) synchronously here is intentional — it resets the loading
    // state whenever the endpoint changes or refresh is called. The rule
    // react-hooks/set-state-in-effect warns about cascading renders, but this
    // is the standard data-fetching pattern and the extra render is unavoidable
    // when re-fetching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch(endpoint, {
      headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Request failed: ${res.status}`)
        }
        return res.json()
      })
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [endpoint, refreshTick, ...deps])

  return { data, loading, error, refresh }
}

function apiPost(endpoint: string, body: unknown, method = 'POST') {
  const session = getSession()
  return fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
    return data
  })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

function timeSince(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 60) return `${min} min`
  const hr = Math.floor(min / 60)
  const rem = min % 60
  return `${hr}h ${rem}m`
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function MarketingAutomationPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const session = getSession()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Marketing Automation"
        description="Central command for brand assets, content approval, comment-to-lead capture, WhatsApp AI, SLA escalation, n8n webhooks, and access control."
        action={
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-0 gap-1 h-7">
            <ShieldCheck className="h-3.5 w-3.5" />
            Marketing Manager
          </Badge>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="bg-white border border-slate-200 h-auto p-1 flex w-max min-w-full">
            <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-[#0057B8] data-[state=active]:text-white h-9">
              <Activity className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="brand" className="gap-1.5 data-[state=active]:bg-[#0057B8] data-[state=active]:text-white h-9">
              <Palette className="h-4 w-4" /> Brand Assets
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-1.5 data-[state=active]:bg-[#0057B8] data-[state=active]:text-white h-9">
              <FileText className="h-4 w-4" /> Posts & Approvals
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1.5 data-[state=active]:bg-[#0057B8] data-[state=active]:text-white h-9">
              <MessageSquare className="h-4 w-4" /> Comment-to-Lead
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-1.5 data-[state=active]:bg-[#0057B8] data-[state=active]:text-white h-9">
              <Bot className="h-4 w-4" /> WhatsApp AI + SLA
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-1.5 data-[state=active]:bg-[#0057B8] data-[state=active]:text-white h-9">
              <Webhook className="h-4 w-4" /> n8n Webhooks
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-1.5 data-[state=active]:bg-[#0057B8] data-[state=active]:text-white h-9">
              <Lock className="h-4 w-4" /> Access Control
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 data-[state=active]:bg-[#0057B8] data-[state=active]:text-white h-9">
              <ScrollText className="h-4 w-4" /> Audit Logs
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="overview">
          <OverviewTab onJump={setActiveTab} session={session} />
        </TabsContent>
        <TabsContent value="brand">
          <BrandAssetsTab />
        </TabsContent>
        <TabsContent value="posts">
          <PostsTab session={session} />
        </TabsContent>
        <TabsContent value="comments">
          <CommentsTab />
        </TabsContent>
        <TabsContent value="whatsapp">
          <WhatsAppTab />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksTab session={session} />
        </TabsContent>
        <TabsContent value="access">
          <AccessTab session={session} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// TAB 1: OVERVIEW
// ============================================================
interface AloSessionLite {
  user: { id: string; referenceId: string | null; name: string }
  token: string
}
function OverviewTab({ onJump, session }: { onJump: (t: string) => void; session: AloSessionLite | null }) {
  const postsApi = useApi<{ posts: MarketingContent[]; pendingApprovals: number }>('/api/marketing/posts?limit=100')
  const slaApi = useApi<{ stats: { level1: number; level2: number; level3: number; overdue: number; resolved: number }; escalations: SlaEscalation[] }>('/api/marketing/sla')
  const commentsApi = useApi<{ comments: SocialComment[]; convertedCount: number }>('/api/marketing/comments?limit=50')
  const triggersApi = useApi<{ triggers: KeywordTrigger[] }>('/api/marketing/keyword-triggers')

  // Office hours check
  const now = new Date()
  const hour = now.getHours()
  const isOfficeHours = hour >= 10 && hour < 18

  const totalConversations = (slaApi.data?.escalations?.length ?? 0) + (commentsApi.data?.comments?.length ?? 0)
  const pendingApprovals = postsApi.data?.pendingApprovals ?? 0
  const slaOverdue = slaApi.data?.stats?.overdue ?? 0
  const leadsFromComments = commentsApi.data?.convertedCount ?? 0
  const scheduledPosts = postsApi.data?.posts?.filter((p) => p.status === 'scheduled').length ?? 0
  const activeTriggers = triggersApi.data?.triggers?.filter((t) => t.status === 'active').length ?? 0

  // Recent activity (last 10 automation events — combine escalations + comments + posts)
  const recentActivity: Array<{ id: string; type: string; title: string; meta: string; time: string }> = []
  slaApi.data?.escalations?.slice(0, 5).forEach((e) => {
    recentActivity.push({
      id: e.id,
      type: 'sla',
      title: `SLA Escalation - Level ${e.currentLevel}`,
      meta: `${e.channel} · ${e.contactIdentifier}`,
      time: e.createdAt,
    })
  })
  commentsApi.data?.comments?.slice(0, 5).forEach((c) => {
    recentActivity.push({
      id: c.id,
      type: 'comment',
      title: `Comment on ${c.platform}${c.matchedKeyword ? ` · "${c.matchedKeyword}"` : ''}`,
      meta: c.commenterName || c.commentText.slice(0, 50),
      time: c.receivedAt,
    })
  })
  postsApi.data?.posts?.slice(0, 5).forEach((p) => {
    recentActivity.push({
      id: p.id,
      type: 'post',
      title: `${p.contentType.replace(/_/g, ' ')} · ${p.title || 'Untitled'}`,
      meta: `Status: ${p.status}`,
      time: p.createdAt,
    })
  })
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Live snapshot of marketing automation across all channels." />

      {/* Office Hours Banner */}
      <Card className={cn('p-4 border-0 shadow-sm', isOfficeHours ? 'bg-green-50' : 'bg-amber-50')}>
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', isOfficeHours ? 'bg-green-100' : 'bg-amber-100')}>
            <Bot className={cn('h-5 w-5', isOfficeHours ? 'text-green-700' : 'text-amber-700')} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {isOfficeHours ? 'Office Hours Active — Human agents online' : 'After Hours — AI Auto-Responding'}
            </p>
            <p className="text-xs text-slate-600">
              {isOfficeHours
                ? 'WhatsApp messages are routed to human counselors first; AI assists as fallback.'
                : 'AI is handling all inbound WhatsApp messages automatically. SLA escalation is active.'}
            </p>
          </div>
          <Badge className={cn('border-0', isOfficeHours ? 'bg-green-600 text-white' : 'bg-amber-600 text-white')}>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </Card>

      {/* 6 StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {postsApi.loading || slaApi.loading || commentsApi.loading || triggersApi.loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <StatCard label="Total Conversations" value={totalConversations} icon={MessageSquare} accent="blue" />
            <StatCard label="Pending Approvals" value={pendingApprovals} icon={Clock} accent="orange" />
            <StatCard label="SLA Overdue" value={slaOverdue} icon={AlertTriangle} accent="amber" />
            <StatCard label="Leads from Comments" value={leadsFromComments} icon={TrendingUp} accent="green" />
            <StatCard label="Scheduled Posts" value={scheduledPosts} icon={Calendar} accent="blue" />
            <StatCard label="Active Triggers" value={activeTriggers} icon={Zap} accent="purple" />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-12 border-slate-200 hover:border-[#0057B8] hover:text-[#0057B8] justify-start gap-2"
            onClick={() => onJump('posts')}
          >
            <FileText className="h-4 w-4" /> Create Post
          </Button>
          <Button
            variant="outline"
            className="h-12 border-slate-200 hover:border-[#0057B8] hover:text-[#0057B8] justify-start gap-2"
            onClick={() => onJump('comments')}
          >
            <Hash className="h-4 w-4" /> Add Keyword Trigger
          </Button>
          <Button
            variant="outline"
            className="h-12 border-slate-200 hover:border-[#0057B8] hover:text-[#0057B8] justify-start gap-2"
            onClick={() => onJump('brand')}
          >
            <Upload className="h-4 w-4" /> Upload Brand Asset
          </Button>
          <Button
            variant="outline"
            className="h-12 border-slate-200 hover:border-[#0057B8] hover:text-[#0057B8] justify-start gap-2"
            onClick={() => onJump('webhooks')}
          >
            <Webhook className="h-4 w-4" /> Configure Webhook
          </Button>
        </div>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Automation Activity</CardTitle>
            <Badge className="bg-slate-100 text-slate-600 border-0">{recentActivity.length} events</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              <Activity className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              No recent automation events yet. Create posts, add triggers, or send test comments to see activity here.
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((a) => (
                  <div key={`${a.type}-${a.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50">
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                      a.type === 'sla' ? 'bg-red-50 text-red-600' :
                      a.type === 'comment' ? 'bg-orange-50 text-[#E8501A]' :
                      'bg-blue-50 text-[#0057B8]'
                    )}>
                      {a.type === 'sla' ? <AlertTriangle className="h-4 w-4" /> :
                       a.type === 'comment' ? <MessageSquare className="h-4 w-4" /> :
                       <FileText className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{a.title}</p>
                      <p className="text-xs text-slate-500 truncate">{a.meta}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{timeAgo(a.time)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 text-center">
        Logged in as <span className="font-medium text-slate-600">{session?.user?.name || 'Marketing Manager'}</span> · All actions are audit-logged
      </p>
    </div>
  )
}

// ============================================================
// TAB 2: BRAND ASSETS
// ============================================================
function BrandAssetsTab() {
  const { data, loading, refresh } = useApi<{ assets: BrandAsset[]; primaryLogo: BrandAsset | null; brandColors: BrandAsset[] }>(
    '/api/marketing/brand-assets'
  )

  const [uploadOpen, setUploadOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [uploadType, setUploadType] = useState('logo')
  const [uploadName, setUploadName] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#0057B8')
  const [saving, setSaving] = useState(false)

  const handleSaveLogo = async () => {
    if (!uploadName.trim() || !uploadUrl.trim()) {
      toast.error('Please provide asset name and file URL')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/marketing/brand-assets', {
        assetType: uploadType,
        name: uploadName,
        fileUrl: uploadUrl,
        isPrimary: uploadType === 'logo',
      })
      toast.success('Asset uploaded and set as primary')
      setUploadName('')
      setUploadUrl('')
      setUploadOpen(false)
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveColor = async () => {
    if (!colorName.trim()) {
      toast.error('Color name required')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/marketing/brand-assets', {
        assetType: 'color_palette',
        name: colorName,
        value: colorHex,
        isPrimary: false,
      })
      toast.success('Brand color saved')
      setColorName('')
      setColorOpen(false)
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSetPrimary = async (id: string) => {
    try {
      await apiPost('/api/marketing/brand-assets', { id, isPrimary: true }, 'PUT')
      toast.success('Set as primary')
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand asset?')) return
    try {
      await fetch(`/api/marketing/brand-assets?id=${id}`, {
        method: 'DELETE',
      }).then((r) => r.json())
      toast.success('Asset deleted')
      refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const hasPrimaryLogo = !!data?.primaryLogo
  const colors = data?.assets?.filter((a) => a.assetType === 'color_palette') ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Assets"
        description="Upload and manage the ALO logo, brand colors, fonts, and templates. Every AI-generated image and video uses these assets."
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="h-12 border-slate-200" onClick={() => setColorOpen(true)}>
              <Plus className="h-4 w-4" /> Add Color
            </Button>
            <Button className="h-12 bg-[#0057B8] hover:bg-[#00449a]" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" /> Upload Asset
            </Button>
          </div>
        }
      />

      {/* No primary logo alert */}
      {!loading && !hasPrimaryLogo && (
        <Card className="p-4 border-0 shadow-sm bg-amber-50 border-l-4 border-l-amber-400">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">No primary logo uploaded</p>
              <p className="text-xs text-slate-600 mt-1">
                Please upload the ALO logo before creating posts. Every generated image/video uses the ALO logo and brand colors.
              </p>
              <Button className="h-9 mt-3 bg-[#0057B8] hover:bg-[#00449a] text-xs" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Upload Logo Now
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Primary Logo Display */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#0057B8]" /> Primary Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : hasPrimaryLogo ? (
            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg flex-wrap">
              <div className="h-24 w-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2 shrink-0">
                <img src={data!.primaryLogo!.fileUrl || '/placeholder-logo.png'} alt={data!.primaryLogo!.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{data!.primaryLogo!.name}</p>
                <p className="text-xs text-slate-500 mt-1 break-all">{data!.primaryLogo!.fileUrl}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-50 text-green-700 border-0">Primary</Badge>
                  <span className="text-xs text-slate-400">Uploaded {timeAgo(data!.primaryLogo!.createdAt)}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-9 border-slate-200 shrink-0" onClick={() => setUploadOpen(true)}>
                <Edit3 className="h-3.5 w-3.5" /> Replace
              </Button>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
              <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">No primary logo set yet</p>
              <Button className="h-9 bg-[#0057B8] hover:bg-[#00449a]" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Upload Logo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#E8501A]" /> Brand Colors
            </CardTitle>
            <Button variant="outline" size="sm" className="h-9 border-slate-200" onClick={() => setColorOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Color
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Default brand colors */}
            {BRAND_COLORS.map((c) => (
              <div key={c.hex} className="p-4 rounded-lg border border-slate-200 bg-white">
                <div
                  className="h-16 w-full rounded-lg border border-slate-200 mb-3"
                  style={{ background: c.hex }}
                />
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{c.hex}</p>
                <p className="text-xs text-slate-400 mt-1">{c.desc}</p>
              </div>
            ))}
            {/* User-added colors */}
            {colors.map((c) => (
              <div key={c.id} className="p-4 rounded-lg border border-slate-200 bg-white relative group">
                <div className="h-16 w-full rounded-lg border border-slate-200 mb-3" style={{ background: c.value || '#ccc' }} />
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{c.value}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Assets List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Brand Assets ({data?.assets?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (data?.assets?.length ?? 0) === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              <Palette className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              No assets yet. Upload your first brand asset to get started.
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Value / URL</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.assets ?? []).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Badge className="bg-slate-100 text-slate-700 border-0 capitalize">{a.assetType.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{a.name}</TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">{a.value || a.fileUrl || '-'}</TableCell>
                      <TableCell>
                        {a.isPrimary ? (
                          <Badge className="bg-green-50 text-green-700 border-0">Primary</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => handleSetPrimary(a.id)}>
                            Set as primary
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-[#0057B8] shrink-0 mt-0.5" />
        <span>Every generated image/video must use the ALO logo, brand colors, and approved layout. Upload a brand guide for full consistency.</span>
      </p>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Brand Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium">Asset Type</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="logo">Logo</SelectItem>
                  <SelectItem value="color_palette">Color Palette</SelectItem>
                  <SelectItem value="font">Font</SelectItem>
                  <SelectItem value="image">Stock Image</SelectItem>
                  <SelectItem value="video_template">Video Template</SelectItem>
                  <SelectItem value="brand_guide">Brand Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Asset Name</Label>
              <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="e.g. ALO Primary Logo" className="h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">File URL (image, video, or doc URL)</Label>
              <Input value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder="https://..." className="h-10 mt-1" />
              <p className="text-xs text-slate-400 mt-1">Paste a CDN URL or upload via your file storage and paste the link here.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button className="h-10 bg-[#0057B8] hover:bg-[#00449a]" disabled={saving} onClick={handleSaveLogo}>
              {saving ? 'Saving...' : uploadType === 'logo' ? 'Set as Primary Logo' : 'Save Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Color Dialog */}
      <Dialog open={colorOpen} onOpenChange={setColorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Brand Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium">Color Name</Label>
              <Input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="e.g. Accent Teal" className="h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Hex Value</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-10 w-14 rounded border border-slate-200 cursor-pointer" />
                <Input value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-10 font-mono" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setColorOpen(false)}>Cancel</Button>
            <Button className="h-10 bg-[#0057B8] hover:bg-[#00449a]" disabled={saving} onClick={handleSaveColor}>
              {saving ? 'Saving...' : 'Save Color'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// TAB 3: POSTS & APPROVALS
// ============================================================
function PostsTab({ session }: { session: AloSessionLite | null }) {
  const { data, loading, refresh } = useApi<{ posts: MarketingContent[]; pendingApprovals: number; approvals: Array<{ id: string; contentId: string | null }> }>('/api/marketing/posts?limit=100')
  // Brand enforcement: require an active primary logo before any post can be drafted.
  const brandApi = useApi<{ assets: BrandAsset[]; primaryLogo: BrandAsset | null; brandColors: BrandAsset[] }>(
    '/api/marketing/brand-assets'
  )
  const hasPrimaryLogo = !!brandApi.data?.primaryLogo

  const [form, setForm] = useState({
    contentType: 'facebook_post',
    platform: 'facebook',
    title: '',
    caption: '',
    hashtags: '',
    bodyContent: '',
    imagePrompt: '',
    videoScript: '',
    ctaText: '',
    ctaLink: '',
    sizeTemplate: SIZE_TEMPLATES[0],
  })
  const [saving, setSaving] = useState(false)
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('all')

  const reviewerId = session?.user?.id || session?.user?.referenceId || 'unknown'

  const handleSaveDraft = async () => {
    if (!hasPrimaryLogo) {
      toast.error('Please upload the ALO logo in Brand Assets before creating posts')
      return
    }
    if (!form.title.trim() && !form.caption.trim()) {
      toast.error('Add at least a title or caption')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/marketing/posts', {
        action: 'create_draft',
        ...form,
        requestedBy: reviewerId,
      })
      toast.success('Draft saved — moved to approval queue')
      setForm({ ...form, title: '', caption: '', hashtags: '', bodyContent: '', imagePrompt: '', videoScript: '', ctaText: '', ctaLink: '' })
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (contentId: string) => {
    try {
      await apiPost('/api/marketing/posts', {
        action: 'approve',
        contentId,
        reviewedBy: reviewerId,
        reviewNote: reviewNote[contentId] || 'Approved via dashboard',
      })
      toast.success('Post approved')
      setReviewNote((r) => ({ ...r, [contentId]: '' }))
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve')
    }
  }

  const handleReject = async (contentId: string) => {
    if (!reviewNote[contentId]?.trim()) {
      toast.error('Please add a review note explaining the rejection')
      return
    }
    try {
      await apiPost('/api/marketing/posts', {
        action: 'reject',
        contentId,
        reviewedBy: reviewerId,
        reviewNote: reviewNote[contentId],
      })
      toast.success('Post rejected')
      setReviewNote((r) => ({ ...r, [contentId]: '' }))
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject')
    }
  }

  const pendingPosts = data?.posts?.filter((p) => p.status === 'under_review') ?? []
  const allPosts = data?.posts?.filter((p) => filter === 'all' || p.status === filter) ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Social Post Creator & Approval Workflow" description="Create draft posts, route them to Marketing Manager for approval. Nothing posts automatically without approval." />

      {/* Brand enforcement gate */}
      {brandApi.loading ? null : !hasPrimaryLogo ? (
        <Card className="border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Brand asset required</p>
              <p className="text-xs text-slate-600 mt-1">
                Please upload the ALO logo in <button onClick={() => { window.dispatchEvent(new CustomEvent('alo:marketing-tab', { detail: 'brand' })) }} className="font-semibold text-[#0057B8] underline">Brand Assets</button> before creating posts. Drafts are blocked until a primary logo is configured.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Create New Post Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#0057B8]" /> Create New Post
              {!hasPrimaryLogo && !brandApi.loading && (
                <Badge className="bg-amber-50 text-amber-700 border-0 ml-1 text-[10px]">blocked</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Content Type</Label>
                <Select value={form.contentType} onValueChange={(v) => setForm({ ...form, contentType: v, platform: v.split('_')[0] })}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Study in UK — September Intake Open" className="h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Caption</Label>
              <Textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Write the social caption..." className="mt-1 min-h-[80px]" />
            </div>
            <div>
              <Label className="text-xs font-medium">Hashtags (comma-separated)</Label>
              <Input value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} placeholder="#StudyInUK #IELTS #ALO" className="h-10 mt-1 font-mono text-xs" />
            </div>
            {(form.contentType === 'blog_article' || form.contentType === 'email_campaign') && (
              <div>
                <Label className="text-xs font-medium">Body Content</Label>
                <Textarea value={form.bodyContent} onChange={(e) => setForm({ ...form, bodyContent: e.target.value })} placeholder="Long-form content for blog or email..." className="mt-1 min-h-[120px] font-mono text-xs" />
              </div>
            )}
            <div>
              <Label className="text-xs font-medium">Image Prompt (for AI image generation)</Label>
              <Textarea value={form.imagePrompt} onChange={(e) => setForm({ ...form, imagePrompt: e.target.value })} placeholder="A modern university campus with ALO logo in corner, students smiling..." className="mt-1 min-h-[60px] text-xs" />
            </div>
            {(form.contentType.includes('reel') || form.contentType.includes('video') || form.contentType.includes('shorts')) && (
              <div>
                <Label className="text-xs font-medium">Video Script</Label>
                <Textarea value={form.videoScript} onChange={(e) => setForm({ ...form, videoScript: e.target.value })} placeholder="Scene 1: ... Scene 2: ..." className="mt-1 min-h-[80px] text-xs" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">CTA Text</Label>
                <Input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Apply Now" className="h-10 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">CTA Link</Label>
                <Input value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="https://..." className="h-10 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Size Template</Label>
              <Select value={form.sizeTemplate} onValueChange={(v) => setForm({ ...form, sizeTemplate: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SIZE_TEMPLATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="h-12 flex-1 border-slate-200" onClick={() => toast.info('AI generation coming soon')}>
                <Sparkles className="h-4 w-4 mr-1.5" /> Generate with AI
              </Button>
              <Button
                className="h-12 flex-1 bg-[#0057B8] hover:bg-[#00449a]"
                disabled={saving || (!hasPrimaryLogo && !brandApi.loading)}
                onClick={handleSaveDraft}
                title={!hasPrimaryLogo && !brandApi.loading ? 'Upload the ALO logo in Brand Assets first' : undefined}
              >
                {saving ? 'Saving...' : <><FileText className="h-4 w-4 mr-1.5" /> Save Draft</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Pending Approvals Queue */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#E8501A]" /> Pending Approvals
                <Badge className="bg-amber-50 text-amber-700 border-0 ml-1">{pendingPosts.length}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : pendingPosts.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-500">
                <CheckCircle2 className="h-10 w-10 text-green-300 mx-auto mb-2" />
                No posts pending approval.
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {pendingPosts.map((p) => (
                    <div key={p.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{p.title || 'Untitled'}</p>
                          <p className="text-xs text-slate-500 truncate">{p.contentType.replace(/_/g, ' ')} · {p.platform}</p>
                        </div>
                        <Badge className="bg-amber-50 text-amber-700 border-0 shrink-0">{p.status.replace(/_/g, ' ')}</Badge>
                      </div>
                      {p.caption && <p className="text-xs text-slate-600 mb-2 line-clamp-2">{p.caption}</p>}
                      <Input
                        value={reviewNote[p.id] || ''}
                        onChange={(e) => setReviewNote((r) => ({ ...r, [p.id]: e.target.value }))}
                        placeholder="Review note (required for reject)"
                        className="h-9 text-xs mb-2"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-9 flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(p.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleReject(p.id)}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Posts Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base">All Posts ({data?.posts?.length ?? 0})</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : allPosts.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              No posts yet. Create your first draft on the left.
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPosts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-slate-900 max-w-xs truncate">{p.title || <span className="text-slate-400 italic">Untitled</span>}</TableCell>
                      <TableCell className="text-xs text-slate-500 capitalize">{p.contentType.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-xs text-slate-500 capitalize">{p.platform || '-'}</TableCell>
                      <TableCell>
                        <Badge className={cn('border-0 capitalize', STATUS_BADGES[p.status] || 'bg-slate-100 text-slate-700')}>
                          {p.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{timeAgo(p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <span>Nothing posts automatically without Marketing Manager or Super Admin approval. Approved posts move to scheduling, then publish when n8n workflow runs.</span>
      </p>
    </div>
  )
}

// ============================================================
// TAB 4: COMMENT-TO-LEAD AUTOMATION
// ============================================================
function CommentsTab() {
  const triggersApi = useApi<{ triggers: KeywordTrigger[] }>('/api/marketing/keyword-triggers')
  const commentsApi = useApi<{ comments: SocialComment[]; convertedCount: number }>('/api/marketing/comments?limit=100')

  const [showAddForm, setShowAddForm] = useState(false)
  const [showSimDialog, setShowSimDialog] = useState(false)
  const [newTrigger, setNewTrigger] = useState({
    keyword: '',
    platform: 'all',
    autoReplyText: '',
    autoDmText: '',
    createLead: true,
    assignCounselorId: '',
  })
  const [sim, setSim] = useState({
    platform: 'facebook',
    commenterName: 'Test User',
    commenterId: 'fb_test_001',
    commentText: 'I want to study in UK, please help with IELTS',
    phone: '+8801XXXXXXXXX',
    email: '',
  })
  const [saving, setSaving] = useState(false)
  const [simResult, setSimResult] = useState<{ matched: boolean; leadCreated: boolean; comment: SocialComment } | null>(null)

  const handleAddTrigger = async () => {
    if (!newTrigger.keyword.trim() || !newTrigger.autoReplyText.trim()) {
      toast.error('Keyword and auto-reply text are required')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/marketing/keyword-triggers', {
        keyword: newTrigger.keyword,
        platform: newTrigger.platform,
        autoReplyText: newTrigger.autoReplyText,
        autoDmText: newTrigger.autoDmText || null,
        createLead: newTrigger.createLead,
        assignCounselorId: newTrigger.assignCounselorId || null,
      })
      toast.success(`Trigger "${newTrigger.keyword}" added`)
      setNewTrigger({ keyword: '', platform: 'all', autoReplyText: '', autoDmText: '', createLead: true, assignCounselorId: '' })
      setShowAddForm(false)
      triggersApi.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add trigger')
    } finally {
      setSaving(false)
    }
  }

  const quickAddKeyword = async (kw: string) => {
    try {
      await apiPost('/api/marketing/keyword-triggers', {
        keyword: kw.toLowerCase(),
        platform: 'all',
        autoReplyText: `Hi! Thanks for your interest in "${kw}". Send us your phone number and our counselor will contact you within 24 hours. Or WhatsApp us at +8801XXXXXXXXX.`,
        autoDmText: `Hello! We received your comment about ${kw}. Reply with your phone number to get a free consultation.`,
        createLead: true,
      })
      toast.success(`Trigger "${kw}" added`)
      triggersApi.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleToggleTrigger = async (id: string, current: string) => {
    try {
      await apiPost('/api/marketing/keyword-triggers', {
        id,
        status: current === 'active' ? 'paused' : 'active',
      }, 'PUT')
      toast.success('Trigger updated')
      triggersApi.refresh()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDeleteTrigger = async (id: string) => {
    if (!confirm('Delete this trigger?')) return
    try {
      await fetch(`/api/marketing/keyword-triggers?id=${id}`, { method: 'DELETE' }).then((r) => r.json())
      toast.success('Trigger deleted')
      triggersApi.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleSimulate = async () => {
    setSaving(true)
    setSimResult(null)
    try {
      const res = await apiPost('/api/marketing/comments', sim)
      setSimResult(res)
      toast.success(res.matched ? `Keyword matched: "${res.comment.matchedKeyword}"${res.leadCreated ? ' · Lead created!' : ''}` : 'Comment received (no keyword match)')
      commentsApi.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to simulate')
    } finally {
      setSaving(false)
    }
  }

  const totalComments = commentsApi.data?.comments?.length ?? 0
  const autoReplied = commentsApi.data?.comments?.filter((c) => c.autoReplySent).length ?? 0
  const leadsCreated = commentsApi.data?.convertedCount ?? 0
  const conversionRate = totalComments > 0 ? Math.round((leadsCreated / totalComments) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comment-to-Lead Automation"
        description="Auto-reply to social comments with keyword triggers, send DMs, and convert comments into CRM leads."
        action={
          <Button className="h-12 bg-[#0057B8] hover:bg-[#00449a]" onClick={() => setShowSimDialog(true)}>
            <Send className="h-4 w-4 mr-1.5" /> Simulate Inbound Comment
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {commentsApi.loading || triggersApi.loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <StatCard label="Total Comments" value={totalComments} icon={MessageSquare} accent="blue" />
            <StatCard label="Auto-Replied" value={autoReplied} icon={Bot} accent="orange" />
            <StatCard label="Leads Created" value={leadsCreated} icon={UserCheck} accent="green" />
            <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} accent="purple" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Keyword Triggers */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#0057B8]" /> Keyword Triggers
                <Badge className="bg-slate-100 text-slate-600 border-0">{triggersApi.data?.triggers?.length ?? 0}</Badge>
              </CardTitle>
              <Button variant="outline" size="sm" className="h-9 border-slate-200" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="h-3.5 w-3.5" /> Add Trigger
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Suggested keywords */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-slate-700 mb-2">Quick-add suggested keywords:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => quickAddKeyword(kw)}
                    className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#0057B8]/30 text-[#0057B8] hover:bg-[#0057B8] hover:text-white transition-colors"
                  >
                    + {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="mb-4 p-3 border border-slate-200 rounded-lg space-y-2 bg-slate-50">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={newTrigger.keyword} onChange={(e) => setNewTrigger({ ...newTrigger, keyword: e.target.value })} placeholder="Keyword (e.g. IELTS)" className="h-9 text-sm" />
                  <Select value={newTrigger.platform} onValueChange={(v) => setNewTrigger({ ...newTrigger, platform: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea value={newTrigger.autoReplyText} onChange={(e) => setNewTrigger({ ...newTrigger, autoReplyText: e.target.value })} placeholder="Public auto-reply text..." className="min-h-[60px] text-sm" />
                <Textarea value={newTrigger.autoDmText} onChange={(e) => setNewTrigger({ ...newTrigger, autoDmText: e.target.value })} placeholder="DM text (optional)..." className="min-h-[40px] text-sm" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={newTrigger.createLead} onCheckedChange={(c) => setNewTrigger({ ...newTrigger, createLead: c })} />
                    <span>Create Lead in CRM</span>
                  </label>
                  <Input value={newTrigger.assignCounselorId} onChange={(e) => setNewTrigger({ ...newTrigger, assignCounselorId: e.target.value })} placeholder="Counselor ID (optional)" className="h-9 w-44 text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-9" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button size="sm" className="h-9 bg-[#0057B8] hover:bg-[#00449a]" disabled={saving} onClick={handleAddTrigger}>
                    {saving ? 'Saving...' : 'Save Trigger'}
                  </Button>
                </div>
              </div>
            )}

            {/* Triggers list */}
            {triggersApi.loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : (triggersApi.data?.triggers?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                <Hash className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                No triggers yet. Quick-add suggested keywords above.
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {triggersApi.data?.triggers?.map((t) => (
                    <div key={t.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-900">#{t.keyword}</span>
                            <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] capitalize">{t.platform}</Badge>
                            <Badge className="bg-blue-50 text-[#0057B8] border-0 text-[10px]">{t.matchCount} matches</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{t.autoReplyText}</p>
                        </div>
                        <Switch checked={t.status === 'active'} onCheckedChange={() => handleToggleTrigger(t.id, t.status)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {t.createLead && <Badge className="bg-green-50 text-green-700 border-0 text-[10px]">Lead Auto-Create</Badge>}
                          {t.autoDmText && <Badge className="bg-purple-50 text-purple-700 border-0 text-[10px]">DM</Badge>}
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteTrigger(t.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Recent Comments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#E8501A]" /> Recent Comments
              <Badge className="bg-slate-100 text-slate-600 border-0">{commentsApi.data?.comments?.length ?? 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commentsApi.loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : (commentsApi.data?.comments?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                No comments yet. Click &quot;Simulate Inbound Comment&quot; to test the flow.
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-2">
                  {commentsApi.data?.comments?.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white text-xs font-bold">
                            {(c.commenterName || '?').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900 truncate">{c.commenterName || 'Anonymous'}</p>
                            <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(c.receivedAt)}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{c.commentText}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] capitalize">{c.platform}</Badge>
                            {c.matchedKeyword && <Badge className="bg-blue-50 text-[#0057B8] border-0 text-[10px]">#{c.matchedKeyword}</Badge>}
                            {c.autoReplySent && <Badge className="bg-purple-50 text-purple-700 border-0 text-[10px]">Auto-replied</Badge>}
                            {c.dmSent && <Badge className="bg-indigo-50 text-indigo-700 border-0 text-[10px]">DM Sent</Badge>}
                            {c.leadId && <Badge className="bg-green-50 text-green-700 border-0 text-[10px]">Lead Created</Badge>}
                            <Badge className={cn('border-0 text-[10px] capitalize', STATUS_BADGES[c.status] || 'bg-slate-100 text-slate-600')}>
                              {c.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Simulate Dialog */}
      <Dialog open={showSimDialog} onOpenChange={setShowSimDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Simulate Inbound Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-500">Test the comment-to-lead flow by simulating a real social comment. The system will match keyword triggers, send auto-replies, and create leads.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Platform</Label>
                <Select value={sim.platform} onValueChange={(v) => setSim({ ...sim, platform: v })}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Commenter Name</Label>
                <Input value={sim.commenterName} onChange={(e) => setSim({ ...sim, commenterName: e.target.value })} className="h-10 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Comment Text (try using a keyword like &quot;IELTS&quot;, &quot;UK&quot;, &quot;Study Abroad&quot;)</Label>
              <Textarea value={sim.commentText} onChange={(e) => setSim({ ...sim, commentText: e.target.value })} className="mt-1 min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Commenter Phone</Label>
                <Input value={sim.phone} onChange={(e) => setSim({ ...sim, phone: e.target.value })} className="h-10 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Commenter Email</Label>
                <Input value={sim.email} onChange={(e) => setSim({ ...sim, email: e.target.value })} className="h-10 mt-1" />
              </div>
            </div>

            {simResult && (
              <div className={cn('p-3 rounded-lg', simResult.matched ? 'bg-green-50' : 'bg-amber-50')}>
                <p className="text-sm font-semibold text-slate-900">
                  {simResult.matched ? '✓ Keyword Matched' : '⚠ No Match'}
                </p>
                {simResult.comment.matchedKeyword && (
                  <p className="text-xs text-slate-600 mt-1">Matched keyword: <span className="font-mono font-bold">#{simResult.comment.matchedKeyword}</span></p>
                )}
                <p className="text-xs text-slate-600 mt-1">
                  Auto-reply sent: {simResult.comment.autoReplySent ? 'Yes' : 'No'} · Lead created: {simResult.leadCreated ? 'Yes' : 'No'}
                </p>
                {simResult.comment.autoReplyText && (
                  <p className="text-xs text-slate-700 mt-2 italic bg-white p-2 rounded border border-slate-200">
                    &quot;{simResult.comment.autoReplyText}&quot;
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setShowSimDialog(false)}>Close</Button>
            <Button className="h-10 bg-[#0057B8] hover:bg-[#00449a]" disabled={saving} onClick={handleSimulate}>
              {saving ? 'Simulating...' : <><Send className="h-4 w-4 mr-1.5" /> Simulate</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// TAB 5: WHATSAPP AI + SLA
// ============================================================
function WhatsAppTab() {
  const slaApi = useApi<{ escalations: SlaEscalation[]; slaConfig: { firstReminderMinutes: number; secondReminderMinutes: number; finalReminderMinutes: number } | null; stats: { level1: number; level2: number; level3: number; overdue: number; resolved: number } }>('/api/marketing/sla')

  // AI Config — persisted to /api/marketing/ai-config (GET on mount, PUT on save)
  const [aiConfig, setAiConfig] = useState({
    aiEnabled: true,
    officeHoursOnly: true,
    businessHoursStart: '10:00',
    businessHoursEnd: '18:00',
    timezone: 'Asia/Dhaka',
    requireOtpForPrivate: true,
    humanHandoffKeywords: 'complaint, refund, refuse, refusal, angry, emergency, payment issue, cheating, fraud, sue',
  })
  const [aiConfigSaved, setAiConfigSaved] = useState(false)
  const [aiConfigLoading, setAiConfigLoading] = useState(true)
  const [aiConfigSaving, setAiConfigSaving] = useState(false)

  // Load current AI config from API on mount so the form reflects what's stored in DB.
  useEffect(() => {
    const sess = getSession()
    let cancelled = false
    setAiConfigLoading(true)
    fetch('/api/marketing/ai-config', {
      headers: sess?.token ? { Authorization: `Bearer ${sess.token}` } : {},
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `Failed to load AI config (${res.status})`)
        return data as {
          config: {
            aiEnabled: boolean
            officeHoursOnly: boolean
            businessHoursStart: string
            businessHoursEnd: string
            timezone: string
            requireOtpForPrivate: boolean
            humanHandoffKeywords: string | null
          } | null
        }
      })
      .then((payload) => {
        if (cancelled || !payload?.config) return
        const c = payload.config
        setAiConfig({
          aiEnabled: c.aiEnabled,
          officeHoursOnly: c.officeHoursOnly,
          businessHoursStart: c.businessHoursStart,
          businessHoursEnd: c.businessHoursEnd,
          timezone: c.timezone,
          requireOtpForPrivate: c.requireOtpForPrivate,
          humanHandoffKeywords: c.humanHandoffKeywords || '',
        })
        setAiConfigSaved(true)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          // Non-fatal: keep defaults if load fails (e.g. no config row yet)
          toast.error(e instanceof Error ? e.message : 'Failed to load AI config — using defaults')
        }
      })
      .finally(() => {
        if (!cancelled) setAiConfigLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveAi = async () => {
    setAiConfigSaving(true)
    try {
      await apiPost('/api/marketing/ai-config', {
        aiEnabled: aiConfig.aiEnabled,
        officeHoursOnly: aiConfig.officeHoursOnly,
        businessHoursStart: aiConfig.businessHoursStart,
        businessHoursEnd: aiConfig.businessHoursEnd,
        timezone: aiConfig.timezone,
        requireOtpForPrivate: aiConfig.requireOtpForPrivate,
        humanHandoffKeywords: aiConfig.humanHandoffKeywords,
      }, 'PUT')
      setAiConfigSaved(true)
      toast.success('AI configuration saved')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save AI configuration')
    } finally {
      setAiConfigSaving(false)
    }
  }

  // Test AI Reply
  const [testPhone, setTestPhone] = useState('+8801712345678')
  const [testMessage, setTestMessage] = useState('Hello, I want to study in UK')
  const [testResult, setTestResult] = useState<{ reply: string; source: string; studentMatched: boolean; otpGenerated: boolean; escalated: boolean } | null>(null)
  const [testing, setTesting] = useState(false)

  // Resolve note
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({})

  const handleTestAi = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.error('Phone and message required')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await apiPost('/api/whatsapp/ai-reply', {
        phoneNumber: testPhone,
        messageText: testMessage,
      })
      setTestResult(res)
      toast.success(`Reply source: ${res.source}`)
      slaApi.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to test AI reply')
    } finally {
      setTesting(false)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await apiPost('/api/marketing/sla', {
        action: 'resolve',
        id,
        resolutionNote: resolveNotes[id] || 'Resolved by Marketing Manager',
      })
      toast.success('Escalation resolved')
      setResolveNotes((r) => ({ ...r, [id]: '' }))
      slaApi.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleSweep = async () => {
    try {
      const res = await apiPost('/api/marketing/sla', { action: 'sweep' })
      toast.success(`Sweep complete — ${res.escalated} escalations updated out of ${res.checked} open`)
      slaApi.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    }
  }

  const stats = slaApi.data?.stats
  const escalations = slaApi.data?.escalations ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp AI Configuration & SLA Escalation"
        description="Configure the WhatsApp AI reply engine, test replies, and monitor SLA escalation across 3 levels."
        action={
          <Button variant="outline" className="h-12 border-slate-200" onClick={handleSweep}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Run Escalation Sweep
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* WhatsApp AI Config */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#0057B8]" /> WhatsApp AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900">AI Enabled</p>
                <p className="text-xs text-slate-500">Master toggle for AI auto-reply engine</p>
              </div>
              <Switch checked={aiConfig.aiEnabled} onCheckedChange={(c) => { setAiConfig({ ...aiConfig, aiEnabled: c }); setAiConfigSaved(false) }} />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900">Office Hours Only</p>
                <p className="text-xs text-slate-500">AI handles after-hours; humans handle during office hours</p>
              </div>
              <Switch checked={aiConfig.officeHoursOnly} onCheckedChange={(c) => { setAiConfig({ ...aiConfig, officeHoursOnly: c }); setAiConfigSaved(false) }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Business Hours Start</Label>
                <Input type="time" value={aiConfig.businessHoursStart} onChange={(e) => { setAiConfig({ ...aiConfig, businessHoursStart: e.target.value }); setAiConfigSaved(false) }} className="h-10 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Business Hours End</Label>
                <Input type="time" value={aiConfig.businessHoursEnd} onChange={(e) => { setAiConfig({ ...aiConfig, businessHoursEnd: e.target.value }); setAiConfigSaved(false) }} className="h-10 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Timezone</Label>
              <Select value={aiConfig.timezone} onValueChange={(v) => { setAiConfig({ ...aiConfig, timezone: v }); setAiConfigSaved(false) }}>
                <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Dhaka">Asia/Dhaka (BST, GMT+6)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST, GMT+5:30)</SelectItem>
                  <SelectItem value="Asia/Karachi">Asia/Karachi (PKT, GMT+5)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST, GMT+4)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900">Require OTP for Private Data</p>
                <p className="text-xs text-slate-500">Ask for OTP before sharing application/payment/visa info</p>
              </div>
              <Switch checked={aiConfig.requireOtpForPrivate} onCheckedChange={(c) => { setAiConfig({ ...aiConfig, requireOtpForPrivate: c }); setAiConfigSaved(false) }} />
            </div>
            <div>
              <Label className="text-xs font-medium">Human Handoff Keywords (comma-separated)</Label>
              <Textarea value={aiConfig.humanHandoffKeywords} onChange={(e) => { setAiConfig({ ...aiConfig, humanHandoffKeywords: e.target.value }); setAiConfigSaved(false) }} className="mt-1 min-h-[60px] text-xs font-mono" />
              <p className="text-xs text-slate-400 mt-1">When these words appear, AI escalates to human counselor immediately.</p>
            </div>
            <Button
              className="h-12 w-full bg-[#0057B8] hover:bg-[#00449a]"
              onClick={handleSaveAi}
              disabled={aiConfigSaving || aiConfigLoading}
            >
              {aiConfigSaving ? (
                <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</>
              ) : aiConfigLoading ? (
                <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Loading…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-1.5" /> {aiConfigSaved ? 'Saved' : 'Save AI Configuration'}</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test AI Reply */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-[#E8501A]" /> Test AI Reply Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Phone Number</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Message Text</Label>
              <Textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} className="mt-1 min-h-[60px]" placeholder="Try: 'hi', 'I want visa status', 'complaint about refund'" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button onClick={() => setTestMessage('hi')} className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200">hi</button>
                <button onClick={() => setTestMessage('hello')} className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200">hello</button>
                <button onClick={() => setTestMessage('I want my visa status')} className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200">visa status (OTP)</button>
                <button onClick={() => setTestMessage('I want to complaint about refund')} className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200">complaint (handoff)</button>
              </div>
            </div>
            <Button className="h-12 w-full bg-[#0057B8] hover:bg-[#00449a]" disabled={testing} onClick={handleTestAi}>
              {testing ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-1.5" /> Send & Get AI Reply</>}
            </Button>

            {testResult && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn('border-0 capitalize',
                    testResult.source === 'rule_based' ? 'bg-blue-50 text-blue-700' :
                    testResult.source === 'ai' ? 'bg-purple-50 text-purple-700' :
                    testResult.source === 'human_handoff' ? 'bg-red-50 text-red-700' :
                    testResult.source === 'otp_required' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  )}>
                    Source: {testResult.source.replace(/_/g, ' ')}
                  </Badge>
                  {testResult.studentMatched && <Badge className="bg-green-50 text-green-700 border-0">Student Matched</Badge>}
                  {testResult.otpGenerated && <Badge className="bg-amber-50 text-amber-700 border-0"><KeyRound className="h-3 w-3 mr-1" />OTP Generated</Badge>}
                  {testResult.escalated && <Badge className="bg-red-50 text-red-700 border-0">Escalated</Badge>}
                </div>
                <p className="text-sm text-slate-900 bg-white p-2 rounded border border-slate-200">{testResult.reply}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SLA Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {slaApi.loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <StatCard label="Level 1" value={stats?.level1 ?? 0} icon={ShieldCheck} accent="blue" hint="Counselor" />
            <StatCard label="Level 2" value={stats?.level2 ?? 0} icon={ShieldCheck} accent="orange" hint="Branch Manager" />
            <StatCard label="Level 3" value={stats?.level3 ?? 0} icon={ShieldCheck} accent="amber" hint="Super Admin / CEO" />
            <StatCard label="Overdue" value={stats?.overdue ?? 0} icon={AlertTriangle} accent="purple" hint="Open > 50 min" />
            <StatCard label="Resolved" value={stats?.resolved ?? 0} icon={CheckCircle2} accent="green" hint="All time" />
          </>
        )}
      </div>

      {/* SLA Rules */}
      <Card className="border-0 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="h-4 w-4 text-[#0057B8]" />
          <h3 className="text-sm font-semibold text-slate-900">SLA Escalation Rules</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-xs font-semibold text-[#0057B8]">Level 1 · 20 min</p>
            <p className="text-sm font-medium text-slate-900 mt-1">Counselor</p>
            <p className="text-xs text-slate-500 mt-0.5">First reminder to assigned counselor</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
            <p className="text-xs font-semibold text-[#E8501A]">Level 2 · 40 min</p>
            <p className="text-sm font-medium text-slate-900 mt-1">Branch Manager</p>
            <p className="text-xs text-slate-500 mt-0.5">Escalated to branch manager</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-xs font-semibold text-red-600">Level 3 · 50 min</p>
            <p className="text-sm font-medium text-slate-900 mt-1">Super Admin / CEO</p>
            <p className="text-xs text-slate-500 mt-0.5">Final escalation to leadership</p>
          </div>
        </div>
      </Card>

      {/* Open Escalations */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Open SLA Escalations
              <Badge className="bg-red-50 text-red-700 border-0">{escalations.length}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {slaApi.loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : escalations.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              <CheckCircle2 className="h-10 w-10 text-green-300 mx-auto mb-2" />
              No open SLA escalations. All caught up.
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {escalations.map((e) => (
                  <div key={e.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn('border-0',
                            e.currentLevel >= 3 ? 'bg-red-50 text-red-700' :
                            e.currentLevel === 2 ? 'bg-orange-50 text-orange-700' :
                            'bg-blue-50 text-blue-700'
                          )}>
                            Level {e.currentLevel}
                          </Badge>
                          <span className="text-xs text-slate-500 capitalize">{e.channel}</span>
                          <span className="text-xs text-slate-400">· {timeSince(e.createdAt)} elapsed</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 mt-1">{e.contactIdentifier}</p>
                        {e.assignedTo && <p className="text-xs text-slate-500">Assigned: {e.assignedTo}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={resolveNotes[e.id] || ''}
                        onChange={(ev) => setResolveNotes((r) => ({ ...r, [e.id]: ev.target.value }))}
                        placeholder="Resolution note..."
                        className="h-9 text-xs flex-1"
                      />
                      <Button size="sm" className="h-9 bg-green-600 hover:bg-green-700" onClick={() => handleResolve(e.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// TAB 6: n8n WEBHOOKS
// ============================================================
function WebhooksTab({ session }: { session: AloSessionLite | null }) {
  const { data, loading, refresh } = useApi<{ webhooks: N8nWebhook[] }>('/api/marketing/webhooks')

  const [showAdd, setShowAdd] = useState(false)
  const [newHook, setNewHook] = useState({
    name: '',
    workflowType: 'lead_sync',
    webhookUrl: '',
    secretToken: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [triggering, setTriggering] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newHook.name.trim() || !newHook.workflowType) {
      toast.error('Name and workflow type required')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/marketing/webhooks', {
        name: newHook.name,
        workflowType: newHook.workflowType,
        webhookUrl: newHook.webhookUrl || null,
        secretToken: newHook.secretToken || null,
        isActive: newHook.isActive,
        createdBy: session?.user?.id || null,
      })
      toast.success('Webhook added')
      setNewHook({ name: '', workflowType: 'lead_sync', webhookUrl: '', secretToken: '', isActive: true })
      setShowAdd(false)
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiPost('/api/marketing/webhooks', { id, isActive: !isActive }, 'PUT')
      toast.success(`Webhook ${!isActive ? 'activated' : 'paused'}`)
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleTrigger = async (id: string, name: string) => {
    setTriggering(id)
    try {
      await apiPost('/api/marketing/webhooks', { action: 'trigger', id })
      toast.success(`Webhook "${name}" triggered`)
      refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setTriggering(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="n8n Webhooks"
        description="Configure and toggle n8n automation workflows for lead sync, follow-ups, sequences, and reporting — without server access."
        action={
          <Button className="h-12 bg-[#0057B8] hover:bg-[#00449a]" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Webhook
          </Button>
        }
      />

      <Card className="border-0 shadow-sm p-4 bg-blue-50">
        <div className="flex items-start gap-3">
          <Webhook className="h-5 w-5 text-[#0057B8] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">How n8n webhooks work</p>
            <p className="text-xs text-slate-600 mt-1">
              n8n workflows automate lead sync, follow-ups, sequences, and reporting without server access. Toggle workflows on/off here. Each trigger sends a POST to the configured webhook URL with the secret token in the header.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4 text-[#E8501A]" /> Configured Webhooks
            <Badge className="bg-slate-100 text-slate-600 border-0">{data?.webhooks?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : (data?.webhooks?.length ?? 0) === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              <Webhook className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              No webhooks configured yet. Add your first n8n webhook to start automating.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.webhooks?.map((w) => (
                <div key={w.id} className="p-4 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                        w.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                      )}>
                        <Webhook className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                          <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px]">{w.workflowType.replace(/_/g, ' ')}</Badge>
                          {w.isActive ? (
                            <Badge className="bg-green-50 text-green-700 border-0 text-[10px]">Active</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px]">Paused</Badge>
                          )}
                        </div>
                        {w.webhookUrl && (
                          <p className="text-xs text-slate-500 mt-1 break-all font-mono">{w.webhookUrl}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {w.triggerCount} triggers</span>
                          {w.lastTriggeredAt && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last: {timeAgo(w.lastTriggeredAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Switch checked={w.isActive} onCheckedChange={() => handleToggle(w.id, w.isActive)} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 border-[#0057B8]/30 text-[#0057B8] hover:bg-[#0057B8] hover:text-white"
                        disabled={triggering === w.id}
                        onClick={() => handleTrigger(w.id, w.name)}
                      >
                        {triggering === w.id ? <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Triggering</> : <><Zap className="h-3.5 w-3.5 mr-1" /> Trigger Now</>}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Webhook Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add n8n Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium">Name</Label>
              <Input value={newHook.name} onChange={(e) => setNewHook({ ...newHook, name: e.target.value })} placeholder="e.g. New Lead → CRM Sync" className="h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Workflow Type</Label>
              <Select value={newHook.workflowType} onValueChange={(v) => setNewHook({ ...newHook, workflowType: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORKFLOW_TYPES.map((w) => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Webhook URL (n8n production URL)</Label>
              <Input value={newHook.webhookUrl} onChange={(e) => setNewHook({ ...newHook, webhookUrl: e.target.value })} placeholder="https://n8n.example.com/webhook/..." className="h-10 mt-1 font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium">Secret Token (sent in x-webhook-secret header)</Label>
              <Input value={newHook.secretToken} onChange={(e) => setNewHook({ ...newHook, secretToken: e.target.value })} placeholder="Optional secret token" className="h-10 mt-1 font-mono text-xs" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={newHook.isActive} onCheckedChange={(c) => setNewHook({ ...newHook, isActive: c })} />
              <span>Active immediately</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="h-10 bg-[#0057B8] hover:bg-[#00449a]" disabled={saving} onClick={handleAdd}>
              {saving ? 'Saving...' : 'Add Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// TAB 7: ACCESS CONTROL
// ============================================================
interface ApprovedUser {
  id: string
  userId: string
  accessLevel: 'full' | 'limited'
  status: 'active' | 'revoked'
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string
    phone: string | null
    profilePhoto: string | null
    userType: string
    status: string
  }
  employee: {
    id: string
    employeeId: string | null
    firstName: string | null
    lastName: string | null
    role: string | null
    designationId: string | null
  } | null
}

interface AccessApiResponse {
  accessRecords: ApprovedUser[]
  activeCount: number
  maxAllowed: number
}

function AccessTab({ session }: { session: AloSessionLite | null }) {
  const [users, setUsers] = useState<ApprovedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [granting, setGranting] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ userId: '', accessLevel: 'limited' as 'full' | 'limited' })
  const [auditLog, setAuditLog] = useState<Array<{ action: string; user: string; timestamp: string }>>([])

  const fetchAccess = useCallback(async () => {
    const sess = getSession()
    if (!sess?.token) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/marketing/access', {
        headers: { Authorization: `Bearer ${sess.token}` },
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || `Failed to load access records (${res.status})`)
      }
      const data = payload as AccessApiResponse
      setUsers(data.accessRecords || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load access records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccess()
  }, [fetchAccess])

  const addAudit = (action: string, user: string) => {
    setAuditLog((prev) => [{ action, user, timestamp: new Date().toISOString() }, ...prev].slice(0, 20))
  }

  const handleRevoke = async (rec: ApprovedUser) => {
    if (!confirm('Revoke this user\'s marketing access? They will lose access to official social media accounts immediately.')) return
    setRevokingId(rec.id)
    try {
      const sess = getSession()
      const res = await fetch(`/api/marketing/access?userId=${encodeURIComponent(rec.userId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sess?.token || ''}` },
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || `Failed to revoke access (${res.status})`)
      }
      addAudit('REVOKE_ACCESS', rec.user.name || rec.user.email)
      toast.success('Access revoked')
      fetchAccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to revoke access')
    } finally {
      setRevokingId(null)
    }
  }

  const handleReactivate = async (rec: ApprovedUser) => {
    // Reactivation uses POST /api/marketing/access — the API reactivates revoked records.
    setRevokingId(rec.id)
    try {
      const sess = getSession()
      const res = await fetch('/api/marketing/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sess?.token || ''}`,
        },
        body: JSON.stringify({ userId: rec.userId, accessLevel: rec.accessLevel }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || `Failed to reactivate (${res.status})`)
      }
      addAudit('REACTIVATE_ACCESS', rec.user.name || rec.user.email)
      toast.success('Access reactivated')
      fetchAccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reactivate')
    } finally {
      setRevokingId(null)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.userId.trim()) {
      toast.error('User ID is required')
      return
    }
    if (users.filter((u) => u.status === 'active').length >= 3) {
      toast.error('Only 3 approved marketing users allowed')
      return
    }
    setGranting(true)
    try {
      const sess = getSession()
      const res = await fetch('/api/marketing/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sess?.token || ''}`,
        },
        body: JSON.stringify({
          userId: newUser.userId.trim(),
          accessLevel: newUser.accessLevel,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(payload.error || 'Only 3 approved marketing users allowed')
        }
        throw new Error(payload.error || `Failed to grant access (${res.status})`)
      }
      addAudit('GRANT_ACCESS', newUser.userId.trim())
      toast.success('Marketing access granted')
      setNewUser({ userId: '', accessLevel: 'limited' })
      setShowAdd(false)
      fetchAccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to grant access')
    } finally {
      setGranting(false)
    }
  }

  const activeCount = users.filter((u) => u.status === 'active').length
  const fullAccessCount = users.filter((u) => u.accessLevel === 'full' && u.status === 'active').length
  const limitedAccessCount = users.filter((u) => u.accessLevel === 'limited' && u.status === 'active').length
  const revokedCount = users.filter((u) => u.status === 'revoked').length
  const capReached = activeCount >= 3

  const displayName = (u: ApprovedUser): string =>
    u.user.name ||
    (u.employee && [u.employee.firstName, u.employee.lastName].filter(Boolean).join(' ')) ||
    u.user.email

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Access Control"
        description="Only 3 approved marketing employees can use the same official social media access with limited permission. Other employees cannot access company official Facebook/Instagram/Messenger/social campaign controls."
        action={
          <Button className="h-12 bg-[#0057B8] hover:bg-[#00449a]" onClick={() => setShowAdd(true)} disabled={capReached}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Approved User
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Approved Users" value={`${activeCount} / 3`} icon={Users} accent="blue" />
        <StatCard label="Full Access" value={fullAccessCount} icon={ShieldCheck} accent="orange" hint="Marketing Manager" />
        <StatCard label="Limited Access" value={limitedAccessCount} icon={Lock} accent="purple" hint="Employees" />
        <StatCard label="Revoked" value={revokedCount} icon={XCircle} accent="amber" />
      </div>

      {/* Cap-reached warning */}
      {capReached && (
        <Card className="border-0 shadow-sm p-4 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">3-user cap reached</p>
              <p className="text-xs text-slate-600 mt-1">
                The maximum of 3 active approved marketing users has been reached. Revoke an existing user before granting access to a new one.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Policy Card */}
      <Card className="border-0 shadow-sm p-4 bg-amber-50">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Marketing Manager Access Policy</p>
            <p className="text-xs text-slate-600 mt-1">
              Marketing Manager has full company marketing control. 3 approved marketing employees can use the same official social media access with limited permission. Other employees cannot access company official Facebook/Instagram/Messenger/social campaign controls.
            </p>
          </div>
        </div>
      </Card>

      {/* Approved Users */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0057B8]" /> Approved Marketing Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              No approved marketing users yet. Grant access to up to 3 employees.
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const name = displayName(u)
                const initials = (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <div key={u.id} className={cn(
                    'p-4 rounded-lg border bg-white',
                    u.status === 'active' ? 'border-slate-200' : 'border-red-200 bg-red-50/30'
                  )}>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarFallback className={cn(
                          'text-white font-bold text-sm',
                          u.accessLevel === 'full' ? 'bg-gradient-to-br from-[#0057B8] to-[#E8501A]' : 'bg-gradient-to-br from-slate-400 to-slate-600'
                        )}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          {u.accessLevel === 'full' ? (
                            <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-0">
                              <ShieldCheck className="h-3 w-3 mr-1" /> Full Access
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600 border-0">
                              <Lock className="h-3 w-3 mr-1" /> Limited Access
                            </Badge>
                          )}
                          {u.status === 'revoked' && <Badge className="bg-red-50 text-red-700 border-0">Revoked</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{u.user.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="capitalize">{u.user.userType}</span>
                          {u.employee?.role && <span>· {u.employee.role}</span>}
                          <span>· Granted {u.approvedAt ? timeAgo(u.approvedAt) : timeAgo(u.createdAt)}</span>
                        </div>
                      </div>
                      {u.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 border-red-200 text-red-600 hover:bg-red-50"
                          disabled={revokingId === u.id}
                          onClick={() => handleRevoke(u)}
                        >
                          {revokingId === u.id ? 'Revoking…' : (<><XCircle className="h-3.5 w-3.5 mr-1" /> Revoke Access</>)}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 border-green-200 text-green-600 hover:bg-green-50"
                          disabled={revokingId === u.id || capReached}
                          onClick={() => handleReactivate(u)}
                        >
                          {revokingId === u.id ? 'Reactivating…' : (<><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Reactivate</>)}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#E8501A]" /> Access Audit Log (this session)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">
              <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No access changes logged in this session. The server writes every grant/revoke to <code className="font-mono">audit_logs</code>.
            </div>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="space-y-2">
                {auditLog.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded text-xs">
                    <Badge className={cn('border-0',
                      entry.action === 'GRANT_ACCESS' ? 'bg-green-50 text-green-700' :
                      entry.action === 'REVOKE_ACCESS' ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    )}>
                      {entry.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-slate-700">{entry.user}</span>
                    <span className="text-slate-400 ml-auto">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <p className="text-xs text-slate-400 mt-3 bg-slate-50 p-2 rounded">
            All access changes are also logged server-side in <code className="text-slate-600 font-mono">audit_logs</code>. Marketing Manager and Super Admin can review the full history via the Audit Logs page.
          </p>
        </CardContent>
      </Card>

      {/* Current Session */}
      {session?.user && (
        <Card className="border-0 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0057B8]/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-[#0057B8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">You are viewing as: {session.user.name}</p>
              <p className="text-xs text-slate-500">User ID: {session.user.id} · Reference: {session.user.referenceId || 'N/A'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Approved Marketing User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-500">
              Grant marketing access to an existing user by their User ID. Maximum 3 active users allowed. The User ID is the UUID shown in each user&rsquo;s profile or in the Employees directory.
            </p>
            <div>
              <Label className="text-xs font-medium">User ID (UUID) *</Label>
              <Input
                value={newUser.userId}
                onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                placeholder="e.g. cm5abc123…"
                className="h-10 mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Access Level</Label>
              <Select value={newUser.accessLevel} onValueChange={(v) => setNewUser({ ...newUser, accessLevel: v as 'full' | 'limited' })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="limited">Limited (read + create drafts)</SelectItem>
                  <SelectItem value="full">Full (publish + approve)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="h-10 bg-[#0057B8] hover:bg-[#00449a]" disabled={granting || capReached} onClick={handleAddUser}>
              {granting ? 'Granting…' : 'Grant Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// TAB 8: AUDIT LOGS
// ============================================================
interface AuditLogRecord {
  id: string
  userId: string | null
  action: string
  module: string
  recordId: string | null
  oldData: string | null
  newData: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; name: string; email: string } | null
}

function AuditLogsTab() {
  const api = useApi<{ logs: AuditLogRecord[]; total: number }>(
    '/api/audit-logs?module=marketing&limit=50'
  )

  const isForbidden =
    !!api.error &&
    (api.error.includes('403') ||
      api.error.toLowerCase().includes('forbidden') ||
      api.error.toLowerCase().includes('insufficient'))

  const logs = api.data?.logs ?? []
  const initialsFor = (name: string | null | undefined, email: string | null | undefined) => {
    const src = (name && name.length > 0 ? name : email) || '?'
    return src
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Marketing Audit Logs"
        description="Immutable record of every marketing action — config changes, brand assets, approvals, and access grants."
        action={
          <Button variant="outline" className="h-10 border-slate-200" onClick={() => api.refresh()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
        }
      />

      {isForbidden ? (
        <Card className="p-12 border-0 shadow-sm text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Access restricted</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You need <span className="font-semibold">super_admin</span>, <span className="font-semibold">admin</span>, or{' '}
            <span className="font-semibold">marketing_manager</span> role to view marketing audit logs.
          </p>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {api.loading ? (
              <div className="p-6 space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-3">
                  <ScrollText className="h-7 w-7 text-[#0057B8]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No audit entries yet</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  When marketing actions happen — saving AI config, approving a post, granting access — they will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100">
                      <TableHead className="text-xs">Timestamp</TableHead>
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">Module</TableHead>
                      <TableHead className="text-xs">Record ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/40">
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className="text-[10px] bg-[#EFF6FF] text-[#0057B8]">
                                  {initialsFor(log.user.name, log.user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-slate-900 font-medium truncate max-w-[150px]">
                                {log.user.name || log.user.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[#EFF6FF] text-[#0057B8] border-0 h-5 px-1.5 text-[10px] font-mono">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 capitalize">{log.module}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-500 truncate max-w-[140px]">
                          {log.recordId || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {logs.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
              Showing {logs.length} of {api.data?.total ?? logs.length} audit log entries
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
