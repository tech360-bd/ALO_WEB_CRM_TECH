'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import {
  Megaphone, Sparkles, Palette, Calendar, BarChart3, Plus, Search,
  Send, Eye, Edit, Trash2, Copy, CheckCircle2, Clock, Users, TrendingUp,
  FileText, Hash, MessageSquare, Layout, Type, Image as ImageIcon,
  Download, RotateCw, Maximize, ZoomIn, Facebook, Instagram, Linkedin, Twitter,
  ArrowRight, Target, DollarSign, Share2, Link2, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Constants ───
const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2', instagram: '#E4405F', linkedin: '#0A66C2', twitter: '#1DA1F2', whatsapp: '#25D366'
}
const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', twitter: 'Twitter/X', whatsapp: 'WhatsApp'
}

const SIZE_TEMPLATES = [
  { id: 'facebook_post', label: 'Facebook Post', platform: 'facebook', width: 1200, height: 630 },
  { id: 'facebook_story', label: 'Facebook Story', platform: 'facebook', width: 1080, height: 1920 },
  { id: 'instagram_post', label: 'Instagram Post', platform: 'instagram', width: 1080, height: 1080 },
  { id: 'instagram_story', label: 'Instagram Story', platform: 'instagram', width: 1080, height: 1920 },
  { id: 'instagram_reel', label: 'Instagram Reel', platform: 'instagram', width: 1080, height: 1920 },
  { id: 'youtube_thumbnail', label: 'YouTube Thumbnail', platform: 'facebook', width: 1280, height: 720 },
  { id: 'linkedin_post', label: 'LinkedIn Post', platform: 'linkedin', width: 1200, height: 627 },
  { id: 'twitter_post', label: 'Twitter/X Post', platform: 'twitter', width: 1200, height: 675 },
  { id: 'whatsapp_status', label: 'WhatsApp Status', platform: 'whatsapp', width: 1080, height: 1920 },
  { id: 'website_banner', label: 'Website Banner', platform: 'facebook', width: 1920, height: 600 },
]

const CONTENT_TYPES = [
  { value: 'blog_post', label: 'Blog Post', agent: 'blog_writer' },
  { value: 'social_caption', label: 'Social Media Caption', agent: 'social_caption' },
  { value: 'email_copy', label: 'Email Copy', agent: 'campaign_ideas' },
  { value: 'whatsapp_broadcast', label: 'WhatsApp Broadcast', agent: 'campaign_ideas' },
  { value: 'hashtag_set', label: 'Hashtag Set', agent: 'social_caption' },
  { value: 'cta_text', label: 'CTA Generator', agent: 'campaign_ideas' },
  { value: 'lead_magnet', label: 'Lead Magnet Idea', agent: 'campaign_ideas' },
  { value: 'ugc_script', label: 'UGC/Reels Script', agent: 'social_caption' },
  { value: 'story_content', label: 'Story Content', agent: 'social_caption' },
  { value: 'linkedin_group', label: 'LinkedIn/FB Group Post', agent: 'blog_writer' },
]

// ─── Types ───
interface Campaign {
  id: string; name: string; objective: string | null; targetAudience: string | null;
  country: string | null; platforms: string | null; startDate: string | null;
  endDate: string | null; budget: number | null; status: string; createdAt: string;
}

interface MarketingContent {
  id: string; campaignId: string | null; contentType: string; platform: string | null;
  title: string | null; caption: string | null; hashtags: string | null;
  bodyContent: string | null; imagePrompt: string | null; status: string;
  scheduledAt: string | null; ctaText: string | null; ctaLink: string | null;
  createdAt: string;
}

// ─── Text Popup Editor State ───
interface TextLayer {
  id: string; text: string; x: number; y: number; fontSize: number;
  fontFamily: string; fontColor: string; fontWeight: string;
  textShadow: string; strokeColor: string; strokeWidth: number;
  bgEnabled: boolean; bgColor: string; opacity: number;
}

export default function MarketingStudio() {
  const [activeTab, setActiveTab] = useState('campaigns')

  // ─── Campaign State ───
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [campaignForm, setCampaignForm] = useState({ name: '', objective: '', targetAudience: '', country: '', platforms: '', startDate: '', endDate: '', budget: '' })

  // ─── Content Generator State ───
  const [contents, setContents] = useState<MarketingContent[]>([])
  const [genContentType, setGenContentType] = useState('social_caption')
  const [genTopic, setGenTopic] = useState('')
  const [genPlatform, setGenPlatform] = useState('instagram')
  const [genOutput, setGenOutput] = useState('')
  const [genLoading, setGenLoading] = useState(false)

  // ─── Text Popup Editor State ───
  const [selectedTemplate, setSelectedTemplate] = useState(SIZE_TEMPLATES[0])
  const [bgColor, setBgColor] = useState('#1A2332')
  const [bgGradient, setBgGradient] = useState(false)
  const [bgGradientColor, setBgGradientColor] = useState('#F37021')
  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    { id: '1', text: 'Your Text Here', x: 50, y: 50, fontSize: 48, fontFamily: 'Arial', fontColor: '#FFFFFF', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', strokeColor: '#000000', strokeWidth: 0, bgEnabled: false, bgColor: 'rgba(0,0,0,0.5)', opacity: 100 }
  ])
  const [selectedLayerId, setSelectedLayerId] = useState('1')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ─── Scheduler State ───
  const [scheduledPosts, setScheduledPosts] = useState<Array<{ id: string; platform: string; caption: string; scheduledAt: string; status: string; imageUrl: string | null }>>([])
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ platform: 'instagram', caption: '', scheduledAt: '', imageUrl: '' })

  // ─── Data Fetching ───
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/marketing?limit=50')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
        setContents(data.content || [])
      }
    } catch {
      // Use mock data
      setCampaigns([
        { id: 'c1', name: 'Spring 2025 UK Campaign', objective: 'lead_generation', targetAudience: 'Students interested in UK', country: 'United Kingdom', platforms: 'facebook,instagram,whatsapp', startDate: '2025-03-01', endDate: '2025-05-31', budget: 5000, status: 'active', createdAt: '2025-02-15' },
        { id: 'c2', name: 'Canada Express Entry Promo', objective: 'brand_awareness', targetAudience: 'Working professionals', country: 'Canada', platforms: 'linkedin,twitter', startDate: '2025-04-01', endDate: '2025-06-30', budget: 3000, status: 'draft', createdAt: '2025-03-01' },
        { id: 'c3', name: 'Australia Education Week', objective: 'university_promotion', targetAudience: 'High school students', country: 'Australia', platforms: 'instagram,facebook', startDate: '2025-02-01', endDate: '2025-02-28', budget: 2500, status: 'completed', createdAt: '2025-01-15' },
      ])
      setContents([
        { id: 'ct1', campaignId: 'c1', contentType: 'instagram_post', platform: 'instagram', title: 'Study in UK - Spring Intake', caption: '🎓 Your dream of studying in the UK starts here! Spring 2025 intake is OPEN. Apply now and get up to 50% scholarship! #StudyInUK #ALOEducation', hashtags: '#StudyInUK #ALOEducation #Scholarship', bodyContent: null, imagePrompt: null, status: 'approved', scheduledAt: '2025-03-05T10:00:00', ctaText: 'Apply Now', ctaLink: '/free-consultation', createdAt: '2025-02-20' },
        { id: 'ct2', campaignId: 'c1', contentType: 'whatsapp_broadcast', platform: 'whatsapp', title: 'UK Spring Broadcast', caption: 'Hi {name}! 🇬🇧 Spring 2025 UK university applications are now open. Limited scholarships available. Reply YES to book a free consultation!', hashtags: null, bodyContent: null, imagePrompt: null, status: 'draft', scheduledAt: null, ctaText: null, ctaLink: null, createdAt: '2025-02-21' },
        { id: 'ct3', campaignId: 'c2', contentType: 'linkedin_post', platform: 'linkedin', title: 'Canada Express Entry', caption: 'Canada is calling! 🇨🇦 Express Entry pathways for skilled professionals looking to advance their careers through education.', hashtags: '#CanadaImmigration #ExpressEntry', bodyContent: null, imagePrompt: null, status: 'under_review', scheduledAt: null, ctaText: 'Learn More', ctaLink: '/study-canada', createdAt: '2025-03-02' },
      ])
      setScheduledPosts([
        { id: 'sp1', platform: 'instagram', caption: '🎓 Study in UK Spring 2025 - Apply Now!', scheduledAt: '2025-03-05T10:00:00', status: 'approved', imageUrl: null },
        { id: 'sp2', platform: 'facebook', caption: 'Free consultation for UK universities this week!', scheduledAt: '2025-03-06T14:00:00', status: 'pending_approval', imageUrl: null },
        { id: 'sp3', platform: 'linkedin', caption: 'Canada Express Entry - Your pathway to a global career', scheduledAt: '2025-03-07T09:00:00', status: 'scheduled', imageUrl: null },
        { id: 'sp4', platform: 'whatsapp', caption: 'Hi! Spring 2025 applications are open. Reply to book a free session.', scheduledAt: '2025-03-08T11:00:00', status: 'draft', imageUrl: null },
        { id: 'sp5', platform: 'twitter', caption: '🇬🇧 UK Spring intake is OPEN! Get up to 50% scholarship with ALO Education.', scheduledAt: '2025-03-09T16:00:00', status: 'approved', imageUrl: null },
      ])
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Canvas Rendering ───
  useEffect(() => {
    renderCanvas()
  }, [selectedTemplate, bgColor, bgGradient, bgGradientColor, textLayers])

  const renderCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scale for display (max 600px wide)
    const scale = Math.min(600 / selectedTemplate.width, 400 / selectedTemplate.height, 1)
    canvas.width = selectedTemplate.width * scale
    canvas.height = selectedTemplate.height * scale

    // Background
    if (bgGradient) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      grad.addColorStop(0, bgColor)
      grad.addColorStop(1, bgGradientColor)
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = bgColor
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Text layers
    textLayers.forEach(layer => {
      ctx.save()
      const x = (layer.x / 100) * canvas.width
      const y = (layer.y / 100) * canvas.height
      const fontSize = layer.fontSize * scale

      ctx.globalAlpha = layer.opacity / 100
      ctx.font = `${layer.fontWeight} ${fontSize}px ${layer.fontFamily}`
      ctx.textAlign = 'center'

      // Background
      if (layer.bgEnabled) {
        const metrics = ctx.measureText(layer.text)
        const padding = 10 * scale
        ctx.fillStyle = layer.bgColor
        ctx.fillRect(
          x - metrics.width / 2 - padding,
          y - fontSize / 2 - padding,
          metrics.width + padding * 2,
          fontSize + padding * 2
        )
      }

      // Stroke
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor
        ctx.lineWidth = layer.strokeWidth * scale
        ctx.lineJoin = 'round'
        ctx.strokeText(layer.text, x, y + fontSize / 3)
      }

      // Shadow
      if (layer.textShadow) {
        const match = layer.textShadow.match(/(\d+)px\s+(\d+)px\s+(\d+)px/)
        if (match) {
          ctx.shadowOffsetX = parseInt(match[1]) * scale
          ctx.shadowOffsetY = parseInt(match[2]) * scale
          ctx.shadowBlur = parseInt(match[3]) * scale
          ctx.shadowColor = 'rgba(0,0,0,0.5)'
        }
      }

      ctx.fillStyle = layer.fontColor
      ctx.fillText(layer.text, x, y + fontSize / 3)
      ctx.restore()
    })
  }

  const exportCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Create full-resolution canvas
    const fullCanvas = document.createElement('canvas')
    fullCanvas.width = selectedTemplate.width
    fullCanvas.height = selectedTemplate.height
    const ctx = fullCanvas.getContext('2d')
    if (!ctx) return

    const scaleX = selectedTemplate.width / canvas.width
    const scaleY = selectedTemplate.height / canvas.height

    // Background
    if (bgGradient) {
      const grad = ctx.createLinearGradient(0, 0, fullCanvas.width, fullCanvas.height)
      grad.addColorStop(0, bgColor)
      grad.addColorStop(1, bgGradientColor)
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = bgColor
    }
    ctx.fillRect(0, 0, fullCanvas.width, fullCanvas.height)

    textLayers.forEach(layer => {
      ctx.save()
      const x = (layer.x / 100) * fullCanvas.width
      const y = (layer.y / 100) * fullCanvas.height

      ctx.globalAlpha = layer.opacity / 100
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`
      ctx.textAlign = 'center'

      if (layer.bgEnabled) {
        const metrics = ctx.measureText(layer.text)
        const padding = 20
        ctx.fillStyle = layer.bgColor
        ctx.fillRect(x - metrics.width / 2 - padding, y - layer.fontSize / 2 - padding, metrics.width + padding * 2, layer.fontSize + padding * 2)
      }

      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor
        ctx.lineWidth = layer.strokeWidth * 2
        ctx.lineJoin = 'round'
        ctx.strokeText(layer.text, x, y + layer.fontSize / 3)
      }

      if (layer.textShadow) {
        const match = layer.textShadow.match(/(\d+)px\s+(\d+)px\s+(\d+)px/)
        if (match) {
          ctx.shadowOffsetX = parseInt(match[1]) * 2
          ctx.shadowOffsetY = parseInt(match[2]) * 2
          ctx.shadowBlur = parseInt(match[3]) * 2
          ctx.shadowColor = 'rgba(0,0,0,0.5)'
        }
      }

      ctx.fillStyle = layer.fontColor
      ctx.fillText(layer.text, x, y + layer.fontSize / 3)
      ctx.restore()
    })

    const link = document.createElement('a')
    link.download = `alo-marketing-${selectedTemplate.id}.png`
    link.href = fullCanvas.toDataURL('image/png')
    link.click()
    toast.success('Image exported successfully!')
  }

  // ─── Campaign Actions ───
  const handleCreateCampaign = async () => {
    if (!campaignForm.name) { toast.error('Campaign name is required'); return }
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'campaign', ...campaignForm, budget: campaignForm.budget ? parseFloat(campaignForm.budget) : null }),
      })
      if (res.ok) {
        toast.success('Campaign created!')
        setShowCampaignDialog(false)
        setCampaignForm({ name: '', objective: '', targetAudience: '', country: '', platforms: '', startDate: '', endDate: '', budget: '' })
        fetchData()
      } else {
        toast.error('Failed to create campaign')
      }
    } catch {
      toast.error('Network error')
    }
  }

  // ─── Content Generation ───
  const handleGenerateContent = async () => {
    if (!genTopic) { toast.error('Please enter a topic'); return }
    setGenLoading(true)
    setGenOutput('')
    try {
      const ct = CONTENT_TYPES.find(c => c.value === genContentType)
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `Generate ${genContentType.replace(/_/g, ' ')} content about "${genTopic}" for ${genPlatform} platform. Make it engaging and professional for an education consultancy called ALO Education.`,
          agentType: ct?.agent || 'blog_writer',
          inputText: `Type: ${genContentType}, Topic: ${genTopic}, Platform: ${genPlatform}`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGenOutput(data.output || 'Content generated successfully. Please review and customize as needed.')
        toast.success('Content generated!')
      }
    } catch {
      setGenOutput('Content generation failed. Please try again or use manual input.')
      toast.error('Generation failed')
    } finally {
      setGenLoading(false)
    }
  }

  // ─── Schedule Post ───
  const handleSchedulePost = async () => {
    if (!scheduleForm.caption || !scheduleForm.scheduledAt) {
      toast.error('Caption and schedule time are required')
      return
    }
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'social_post',
          platform: scheduleForm.platform,
          caption: scheduleForm.caption,
          status: 'draft',
          scheduledAt: scheduleForm.scheduledAt,
        }),
      })
      if (res.ok) {
        toast.success('Post scheduled!')
        setShowScheduleDialog(false)
        setScheduleForm({ platform: 'instagram', caption: '', scheduledAt: '', imageUrl: '' })
        fetchData()
      }
    } catch {
      toast.error('Failed to schedule post')
    }
  }

  const selectedLayer = textLayers.find(l => l.id === selectedLayerId)

  // ─── Analytics Mock Data ───
  const analyticsData = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalLeads: 342,
    conversionRate: 8.5,
    roi: 340,
    topChannels: [
      { channel: 'WhatsApp', leads: 142, conversion: 12.5 },
      { channel: 'Instagram', leads: 98, conversion: 9.2 },
      { channel: 'Facebook', leads: 65, conversion: 6.8 },
      { channel: 'LinkedIn', leads: 25, conversion: 15.0 },
      { channel: 'Email', leads: 12, conversion: 18.5 },
    ],
    contentPerformance: [
      { type: 'Reels/Short Video', engagement: 4.8, reach: 12500 },
      { type: 'Carousel Posts', engagement: 3.2, reach: 8900 },
      { type: 'Story Content', engagement: 2.8, reach: 6700 },
      { type: 'Static Posts', engagement: 1.5, reach: 5400 },
      { type: 'Blog Articles', engagement: 2.1, reach: 3200 },
    ],
    monthlyMetrics: [
      { month: 'Jan', leads: 45, conversions: 3, spend: 800 },
      { month: 'Feb', leads: 62, conversions: 5, spend: 950 },
      { month: 'Mar', leads: 78, conversions: 7, spend: 1200 },
      { month: 'Apr', leads: 55, conversions: 4, spend: 1100 },
      { month: 'May', leads: 92, conversions: 8, spend: 1500 },
      { month: 'Jun', leads: 110, conversions: 11, spend: 1800 },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#F37021]" />
            Marketing Studio
          </h1>
          <p className="text-sm text-muted-foreground">Campaigns, content, design & scheduling — all in one place</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value={activeTab} className="mt-0">
          {/* Tab navigation rendered as buttons since TabsList scroll on mobile */}
        </TabsContent>

        <div className="flex gap-2 overflow-x-auto pb-2 border-b">
          {[
            { value: 'campaigns', icon: <Megaphone className="w-4 h-4" />, label: 'Campaign Builder' },
            { value: 'content', icon: <Sparkles className="w-4 h-4" />, label: 'Content Generator' },
            { value: 'editor', icon: <Palette className="w-4 h-4" />, label: 'Text Popup Editor' },
            { value: 'scheduler', icon: <Calendar className="w-4 h-4" />, label: 'Scheduler' },
            { value: 'analytics', icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? 'bg-white text-[#F37021] border-b-2 border-[#F37021]'
                  : 'text-muted-foreground hover:text-[#1A2332]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════ TAB 1: CAMPAIGN BUILDER ═══════════ */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button className="bg-[#F37021] hover:bg-[#E06010]" onClick={() => setShowCampaignDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Campaign
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Campaigns', value: campaigns.length, icon: <Megaphone className="w-6 h-6 text-[#F37021]" /> },
                { label: 'Active', value: campaigns.filter(c => c.status === 'active').length, icon: <TrendingUp className="w-6 h-6 text-green-500" /> },
                { label: 'Total Budget', value: `£${campaigns.reduce((a, c) => a + (c.budget || 0), 0).toLocaleString()}`, icon: <DollarSign className="w-6 h-6 text-blue-500" /> },
                { label: 'Avg ROI', value: '340%', icon: <Target className="w-6 h-6 text-purple-500" /> },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold text-[#1A2332]">{s.value}</p>
                    </div>
                    <div className="opacity-50">{s.icon}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Campaigns Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Objective</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>UTM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map(c => (
                      <TableRow key={c.id} className="hover:bg-[#F37021]/5">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            {c.country && <p className="text-xs text-muted-foreground">{c.country}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{(c.objective || 'general').replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(c.platforms || '').split(',').filter(Boolean).map(p => (
                              <div key={p} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: PLATFORM_COLORS[p] || '#999' }}>
                                <span className="text-[8px] text-white font-bold">{p[0].toUpperCase()}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c.budget ? `£${c.budget.toLocaleString()}` : '-'}</TableCell>
                        <TableCell className="text-xs">
                          {c.startDate ? new Date(c.startDate).toLocaleDateString() : '-'} → {c.endDate ? new Date(c.endDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            c.status === 'active' ? 'bg-green-100 text-green-700' :
                            c.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            c.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => {
                            const utm = `?utm_source=alo&utm_medium=campaign&utm_campaign=${c.id}&utm_content=gen`
                            navigator.clipboard.writeText(`https://aloeducation.com${utm}`)
                            toast.success('UTM link copied!')
                          }}>
                            <Link2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* A/B Test Tracking */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#1A2332]">A/B Test Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'UK Spring Campaign - Headline Test', variantA: 'Study in UK Today', variantB: 'Your UK Journey Starts Here', scoreA: 4.2, scoreB: 6.8, winner: 'B' },
                    { name: 'WhatsApp Broadcast - CTA Test', variantA: 'Apply Now', variantB: 'Get Free Consultation', scoreA: 3.5, scoreB: 5.1, winner: 'B' },
                  ].map((test, i) => (
                    <div key={i} className="p-3 rounded-lg border">
                      <p className="font-medium text-sm mb-2">{test.name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-2 rounded ${test.winner === 'A' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <p className="text-xs font-medium">Variant A: {test.variantA}</p>
                          <p className="text-lg font-bold">{test.scoreA}% CTR</p>
                          {test.winner === 'A' && <Badge className="bg-green-600 text-white text-[10px]">Winner</Badge>}
                        </div>
                        <div className={`p-2 rounded ${test.winner === 'B' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <p className="text-xs font-medium">Variant B: {test.variantB}</p>
                          <p className="text-lg font-bold">{test.scoreB}% CTR</p>
                          {test.winner === 'B' && <Badge className="bg-green-600 text-white text-[10px]">Winner</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audience Segmentation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#1A2332]">Audience Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'UK Aspirants', count: 245, criteria: 'Country=UK, Status=Lead', color: '#0066CC' },
                    { name: 'Budget-Conscious', count: 180, criteria: 'Budget<£10k, Status=Lead', color: '#F37021' },
                    { name: 'Scholarship Seekers', count: 320, criteria: 'Interest=Scholarship', color: '#22c55e' },
                  ].map((seg, i) => (
                    <div key={i} className="p-3 rounded-lg border" style={{ borderLeftColor: seg.color, borderLeftWidth: 3 }}>
                      <p className="font-medium text-sm">{seg.name}</p>
                      <p className="text-2xl font-bold">{seg.count}</p>
                      <p className="text-xs text-muted-foreground">{seg.criteria}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════ TAB 2: CONTENT GENERATOR ═══════════ */}
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                  <Sparkles className="w-5 h-5 text-[#F37021]" /> AI Content Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Content Type</Label>
                  <Select value={genContentType} onValueChange={setGenContentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select value={genPlatform} onValueChange={setGenPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Topic / Prompt</Label>
                  <Textarea
                    value={genTopic}
                    onChange={e => setGenTopic(e.target.value)}
                    placeholder="e.g., Spring 2025 UK university intake, scholarship opportunities..."
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full bg-[#F37021] hover:bg-[#E06010]"
                  onClick={handleGenerateContent}
                  disabled={genLoading}
                >
                  {genLoading ? <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Content</>}
                </Button>

                {genOutput && (
                  <div className="space-y-3">
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Generated Content</Label>
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(genOutput); toast.success('Copied!') }}>
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 border text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {genOutput}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => {
                      navigator.clipboard.writeText(genOutput)
                      toast.success('Content copied to clipboard!')
                    }}>
                      <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Generators */}
            <div className="space-y-4">
              {/* Hashtag Generator */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#F37021]" /> Hashtag Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="Enter topic e.g. study in UK" id="hashtag-input" />
                    <Button variant="outline" onClick={() => {
                      const input = document.getElementById('hashtag-input') as HTMLInputElement
                      if (input?.value) {
                        const tags = ['#StudyAbroad', '#StudyInUK', '#ALOEducation', '#InternationalStudents', '#Scholarship', '#UKUniversities', '#StudentVisa', '#HigherEducation', '#StudyOverseas', '#EducationConsultancy']
                        navigator.clipboard.writeText(tags.join(' '))
                        toast.success(`Generated ${tags.length} hashtags!`)
                      }
                    }}>
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['#StudyAbroad', '#StudyInUK', '#ALOEducation', '#Scholarship', '#InternationalStudents', '#UKVisa'].map(h => (
                      <Badge key={h} variant="outline" className="text-[#0066CC] cursor-pointer hover:bg-[#0066CC]/10" onClick={() => { navigator.clipboard.writeText(h); toast.success('Copied!') }}>{h}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Generator */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#F37021]" /> CTA Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {['Book Free Consultation', 'Apply Now', 'Get Your Scholarship', 'Start Your Journey', 'Claim Your Spot', 'Get Started Today'].map(cta => (
                      <Button key={cta} variant="outline" size="sm" className="justify-start text-xs" onClick={() => { navigator.clipboard.writeText(cta); toast.success('CTA copied!') }}>
                        <ArrowRight className="w-3 h-3 mr-1" /> {cta}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp Template */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#25D366]" /> WhatsApp Broadcast Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {[
                        { name: 'New Intake Alert', body: 'Hi {name}! 🎓 New intake for {country} universities is now open. Limited seats available. Reply YES to book a free consultation!' },
                        { name: 'Scholarship Alert', body: '🎉 Great news {name}! {university} is offering up to {amount} scholarship for {course}. Don\'t miss out - apply before {deadline}!' },
                        { name: 'Visa Update', body: 'Hi {name}, your visa application for {country} has been updated. Status: {status}. Our team will contact you shortly with next steps.' },
                      ].map((tpl, i) => (
                        <div key={i} className="p-2 rounded border hover:border-[#25D366] cursor-pointer" onClick={() => { navigator.clipboard.writeText(tpl.body); toast.success('Template copied!') }}>
                          <p className="font-medium text-xs text-[#25D366]">{tpl.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.body}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Existing Content */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Recent Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {contents.map(ct => (
                        <div key={ct.id} className="p-2 rounded border hover:border-[#F37021]/30">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-xs">{ct.title || 'Untitled'}</p>
                            <Badge className={`text-[10px] ${ct.status === 'approved' ? 'bg-green-100 text-green-700' : ct.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>
                              {ct.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{ct.caption}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ═══════════ TAB 3: TEXT POPUP EDITOR ═══════════ */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Controls */}
            <div className="space-y-4 lg:col-span-1">
              {/* Template Selector */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Template Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedTemplate.id} onValueChange={v => setSelectedTemplate(SIZE_TEMPLATES.find(t => t.id === v) || SIZE_TEMPLATES[0])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIZE_TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label} ({t.width}×{t.height})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Current: {selectedTemplate.width}×{selectedTemplate.height}px
                  </p>
                </CardContent>
              </Card>

              {/* Background */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Color</Label>
                    <Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-8 p-0 border-0" />
                    <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Gradient</Label>
                    <Switch checked={bgGradient} onCheckedChange={setBgGradient} />
                  </div>
                  {bgGradient && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-16">End</Label>
                      <Input type="color" value={bgGradientColor} onChange={e => setBgGradientColor(e.target.value)} className="w-10 h-8 p-0 border-0" />
                      <Input value={bgGradientColor} onChange={e => setBgGradientColor(e.target.value)} className="flex-1 text-xs" />
                    </div>
                  )}
                  {/* Quick Colors */}
                  <div className="flex gap-1 flex-wrap">
                    {['#1A2332', '#F37021', '#0066CC', '#22c55e', '#000000', '#FFFFFF', '#8b5cf6', '#ef4444'].map(c => (
                      <button key={c} className="w-6 h-6 rounded border" style={{ backgroundColor: c }} onClick={() => setBgColor(c)} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Text Layers */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#1A2332]">Text Layers</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => {
                      const id = `layer-${Date.now()}`
                      setTextLayers(prev => [...prev, {
                        id, text: 'New Text', x: 50, y: 50, fontSize: 32, fontFamily: 'Arial',
                        fontColor: '#FFFFFF', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                        strokeColor: '#000000', strokeWidth: 0, bgEnabled: false, bgColor: 'rgba(0,0,0,0.5)', opacity: 100
                      }])
                      setSelectedLayerId(id)
                    }}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Layer list */}
                  <div className="space-y-1">
                    {textLayers.map(l => (
                      <div key={l.id}
                        className={`p-2 rounded border cursor-pointer text-xs ${selectedLayerId === l.id ? 'border-[#F37021] bg-[#F37021]/5' : 'border-gray-200'}`}
                        onClick={() => setSelectedLayerId(l.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{l.text}</span>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setTextLayers(prev => prev.filter(tl => tl.id !== l.id)) }}>
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedLayer && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Text</Label>
                          <Input value={selectedLayer.text} onChange={e => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, text: e.target.value } : l))} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">X Position</Label>
                            <Slider value={[selectedLayer.x]} min={0} max={100} step={1} onValueChange={v => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, x: v[0] } : l))} />
                            <span className="text-[10px] text-muted-foreground">{selectedLayer.x}%</span>
                          </div>
                          <div>
                            <Label className="text-xs">Y Position</Label>
                            <Slider value={[selectedLayer.y]} min={0} max={100} step={1} onValueChange={v => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, y: v[0] } : l))} />
                            <span className="text-[10px] text-muted-foreground">{selectedLayer.y}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <Input type="number" value={selectedLayer.fontSize} onChange={e => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, fontSize: parseInt(e.target.value) || 16 } : l))} />
                          </div>
                          <div>
                            <Label className="text-xs">Font Weight</Label>
                            <Select value={selectedLayer.fontWeight} onValueChange={v => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, fontWeight: v } : l))}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                                <SelectItem value="lighter">Light</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Font Color</Label>
                            <Input type="color" value={selectedLayer.fontColor} onChange={e => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, fontColor: e.target.value } : l))} className="w-full h-8 p-0 border-0" />
                          </div>
                          <div>
                            <Label className="text-xs">Font Family</Label>
                            <Select value={selectedLayer.fontFamily} onValueChange={v => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, fontFamily: v } : l))}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                <SelectItem value="Verdana">Verdana</SelectItem>
                                <SelectItem value="Impact">Impact</SelectItem>
                                <SelectItem value="Courier New">Courier New</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Text Shadow</Label>
                          <Switch checked={selectedLayer.textShadow !== 'none'}
                            onCheckedChange={v => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, textShadow: v ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none' } : l))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Stroke</Label>
                          <Switch checked={selectedLayer.strokeWidth > 0}
                            onCheckedChange={v => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, strokeWidth: v ? 2 : 0 } : l))}
                          />
                        </div>
                        {selectedLayer.strokeWidth > 0 && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Stroke Color</Label>
                            <Input type="color" value={selectedLayer.strokeColor} onChange={e => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, strokeColor: e.target.value } : l))} className="w-8 h-6 p-0 border-0" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Text Background</Label>
                          <Switch checked={selectedLayer.bgEnabled} onCheckedChange={v => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, bgEnabled: v } : l))} />
                        </div>
                        <div>
                          <Label className="text-xs">Opacity: {selectedLayer.opacity}%</Label>
                          <Slider value={[selectedLayer.opacity]} min={10} max={100} step={5} onValueChange={v => setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, opacity: v[0] } : l))} />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Canvas Preview */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#1A2332]">Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => renderCanvas()}>
                        <RotateCw className="w-3 h-3 mr-1" /> Refresh
                      </Button>
                      <Button size="sm" className="bg-[#F37021] hover:bg-[#E06010]" onClick={exportCanvas}>
                        <Download className="w-3 h-3 mr-1" /> Export PNG
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[300px]">
                    <canvas
                      ref={canvasRef}
                      className="border border-gray-200 shadow-lg max-w-full"
                      style={{ imageRendering: 'auto' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {selectedTemplate.label} — {selectedTemplate.width}×{selectedTemplate.height}px
                  </p>
                </CardContent>
              </Card>

              {/* Quick Presets */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Quick Presets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { name: 'ALO Orange', bg: '#F37021', textColor: '#FFFFFF' },
                      { name: 'Navy Blue', bg: '#1A2332', textColor: '#FFFFFF' },
                      { name: 'Education Blue', bg: '#0066CC', textColor: '#FFFFFF' },
                      { name: 'Clean White', bg: '#FFFFFF', textColor: '#1A2332' },
                      { name: 'Dark Gradient', bg: '#1A2332', textColor: '#F37021', gradient: '#F37021' },
                      { name: 'Blue Gradient', bg: '#0066CC', textColor: '#FFFFFF', gradient: '#003d7a' },
                      { name: 'Warm Gradient', bg: '#F37021', textColor: '#FFFFFF', gradient: '#FFB347' },
                      { name: 'Purple Night', bg: '#4c1d95', textColor: '#FFFFFF' },
                    ].map((preset, i) => (
                      <button
                        key={i}
                        className="p-2 rounded-lg border hover:border-[#F37021] text-xs text-center"
                        style={{ backgroundColor: preset.bg, color: preset.textColor }}
                        onClick={() => {
                          setBgColor(preset.bg)
                          setBgGradient(!!preset.gradient)
                          if (preset.gradient) setBgGradientColor(preset.gradient)
                          setTextLayers(prev => prev.map(l => ({ ...l, fontColor: preset.textColor })))
                        }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ═══════════ TAB 4: SOCIAL MEDIA SCHEDULER ═══════════ */}
        {activeTab === 'scheduler' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#1A2332]">Social Media Scheduler</h2>
              <Button className="bg-[#F37021] hover:bg-[#E06010]" onClick={() => setShowScheduleDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Schedule Post
              </Button>
            </div>

            {/* Calendar View */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#1A2332]">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">{day}</div>
                  ))}
                  {[1,2,3,4,5,6,7].map(day => {
                    const dayPosts = scheduledPosts.filter(p => {
                      const d = new Date(p.scheduledAt)
                      return d.getDay() === day % 7
                    })
                    return (
                      <div key={day} className="min-h-[80px] border rounded p-1">
                        <p className="text-[10px] text-muted-foreground">Mar {day + 4}</p>
                        {dayPosts.map(post => (
                          <div key={post.id} className="mt-1 p-1 rounded text-[8px] text-white cursor-pointer" style={{ backgroundColor: PLATFORM_COLORS[post.platform] || '#999' }}>
                            {post.caption.slice(0, 20)}...
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Posts Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Caption</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledPosts.map(post => {
                      const statusColors: Record<string, string> = {
                        draft: 'bg-gray-100 text-gray-700',
                        pending_approval: 'bg-amber-100 text-amber-700',
                        approved: 'bg-blue-100 text-blue-700',
                        scheduled: 'bg-purple-100 text-purple-700',
                        published: 'bg-green-100 text-green-700',
                      }
                      return (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: PLATFORM_COLORS[post.platform] || '#999' }}>
                                <span className="text-[8px] text-white font-bold">{post.platform[0].toUpperCase()}</span>
                              </div>
                              <span className="text-sm">{PLATFORM_LABELS[post.platform] || post.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{post.caption}</TableCell>
                          <TableCell className="text-xs">{new Date(post.scheduledAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[post.status] || 'bg-gray-100 text-gray-700'}>
                              {post.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {post.status === 'pending_approval' && (
                                <>
                                  <Button size="sm" variant="outline" className="text-green-600 text-xs" onClick={() => {
                                    setScheduledPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'approved' } : p))
                                    toast.success('Post approved')
                                  }}>
                                    <CheckCircle2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                              {post.status === 'approved' && (
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                                  setScheduledPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'scheduled' } : p))
                                  toast.success('Post scheduled')
                                }}>
                                  <Clock className="w-3 h-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => {
                                setScheduledPosts(prev => prev.filter(p => p.id !== post.id))
                                toast.success('Post removed')
                              }}>
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Approval Workflow */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#1A2332]">Approval Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  {['Draft', 'Pending Review', 'Approved', 'Scheduled', 'Published'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium">
                        <div className="w-5 h-5 rounded-full bg-[#F37021] text-white flex items-center justify-center text-[10px]">{i + 1}</div>
                        {step}
                      </div>
                      {i < 4 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════ TAB 5: ANALYTICS ═══════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Leads', value: analyticsData.totalLeads, change: '+12%', icon: <Users className="w-6 h-6 text-[#F37021]" /> },
                { label: 'Conversion Rate', value: `${analyticsData.conversionRate}%`, change: '+1.2%', icon: <TrendingUp className="w-6 h-6 text-green-500" /> },
                { label: 'ROI', value: `${analyticsData.roi}%`, change: '+45%', icon: <DollarSign className="w-6 h-6 text-blue-500" /> },
                { label: 'Active Campaigns', value: analyticsData.activeCampaigns, change: '0%', icon: <Megaphone className="w-6 h-6 text-purple-500" /> },
              ].map((kpi, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        <p className="text-2xl font-bold text-[#1A2332]">{kpi.value}</p>
                        <p className="text-xs text-green-600">{kpi.change}</p>
                      </div>
                      <div className="opacity-50">{kpi.icon}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Source Attribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Lead Source Attribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.topChannels.map((ch, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{ch.channel}</span>
                          <span className="text-muted-foreground">{ch.leads} leads ({ch.conversion}% conv.)</span>
                        </div>
                        <Progress value={(ch.leads / 150) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Performance */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Content Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Reach</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.contentPerformance.map((cp, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{cp.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={cp.engagement * 20} className="h-2 w-16" />
                              <span className="text-sm">{cp.engagement}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{cp.reach.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Monthly Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.monthlyMetrics.map((m, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-medium w-8">{m.month}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                            <div className="bg-[#F37021] h-full rounded-full" style={{ width: `${(m.leads / 120) * 100}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{m.leads}</span>
                        </div>
                        <span className="text-xs text-green-600">{m.conversions} conv.</span>
                        <span className="text-xs text-muted-foreground">£{m.spend}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ROI Calculator */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#1A2332]">ROI Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Total Ad Spend (£)</Label>
                      <Input type="number" defaultValue="5000" id="roi-spend" />
                    </div>
                    <div>
                      <Label className="text-xs">Revenue from Leads (£)</Label>
                      <Input type="number" defaultValue="22000" id="roi-revenue" />
                    </div>
                    <div>
                      <Label className="text-xs">Number of Leads</Label>
                      <Input type="number" defaultValue="342" id="roi-leads" />
                    </div>
                    <div>
                      <Label className="text-xs">Conversions</Label>
                      <Input type="number" defaultValue="29" id="roi-conv" />
                    </div>
                  </div>
                  <Button className="w-full bg-[#F37021] hover:bg-[#E06010]" onClick={() => {
                    const spend = parseFloat((document.getElementById('roi-spend') as HTMLInputElement)?.value || '0')
                    const revenue = parseFloat((document.getElementById('roi-revenue') as HTMLInputElement)?.value || '0')
                    const leads = parseInt((document.getElementById('roi-leads') as HTMLInputElement)?.value || '0')
                    const conv = parseInt((document.getElementById('roi-conv') as HTMLInputElement)?.value || '0')
                    const roi = spend > 0 ? Math.round(((revenue - spend) / spend) * 100) : 0
                    const cpl = leads > 0 ? Math.round(spend / leads * 100) / 100 : 0
                    const cpa = conv > 0 ? Math.round(spend / conv * 100) / 100 : 0
                    toast.success(`ROI: ${roi}% | Cost/Lead: £${cpl} | Cost/Acquisition: £${cpa}`)
                  }}>
                    <BarChart3 className="w-4 h-4 mr-2" /> Calculate ROI
                  </Button>
                  <div className="p-3 rounded-lg bg-[#1A2332] text-white">
                    <p className="text-xs text-gray-400 mb-1">Estimated Performance</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xl font-bold text-[#F37021]">340%</p>
                        <p className="text-[10px] text-gray-400">ROI</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[#0066CC]">£14.62</p>
                        <p className="text-[10px] text-gray-400">Cost/Lead</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-green-400">£172.41</p>
                        <p className="text-[10px] text-gray-400">Cost/Acquisition</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Tabs>

      {/* ─── Create Campaign Dialog ─── */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Create Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Campaign Name *</Label>
                <Input value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Spring 2025 UK Campaign" />
              </div>
              <div>
                <Label>Objective</Label>
                <Select value={campaignForm.objective} onValueChange={v => setCampaignForm(p => ({ ...p, objective: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select objective" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_generation">Lead Generation</SelectItem>
                    <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                    <SelectItem value="university_promotion">University Promotion</SelectItem>
                    <SelectItem value="country_campaign">Country Campaign</SelectItem>
                    <SelectItem value="retargeting">Retargeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Input value={campaignForm.targetAudience} onChange={e => setCampaignForm(p => ({ ...p, targetAudience: e.target.value }))} placeholder="e.g., Students interested in UK" />
              </div>
              <div>
                <Label>Country</Label>
                <Select value={campaignForm.country} onValueChange={v => setCampaignForm(p => ({ ...p, country: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Ireland">Ireland</SelectItem>
                    <SelectItem value="Malaysia">Malaysia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Platforms</Label>
                <Input value={campaignForm.platforms} onChange={e => setCampaignForm(p => ({ ...p, platforms: e.target.value }))} placeholder="facebook,instagram,whatsapp" />
              </div>
              <div>
                <Label>Budget (£)</Label>
                <Input type="number" value={campaignForm.budget} onChange={e => setCampaignForm(p => ({ ...p, budget: e.target.value }))} placeholder="5000" />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={campaignForm.startDate} onChange={e => setCampaignForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={campaignForm.endDate} onChange={e => setCampaignForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full bg-[#F37021] hover:bg-[#E06010]" onClick={handleCreateCampaign}>
              <Plus className="w-4 h-4 mr-2" /> Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Schedule Post Dialog ─── */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Schedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Platform</Label>
              <Select value={scheduleForm.platform} onValueChange={v => setScheduleForm(p => ({ ...p, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Caption</Label>
              <Textarea value={scheduleForm.caption} onChange={e => setScheduleForm(p => ({ ...p, caption: e.target.value }))} placeholder="Write your post caption..." rows={4} />
            </div>
            <div>
              <Label>Schedule Date & Time</Label>
              <Input type="datetime-local" value={scheduleForm.scheduledAt} onChange={e => setScheduleForm(p => ({ ...p, scheduledAt: e.target.value }))} />
            </div>
            <Button className="w-full bg-[#F37021] hover:bg-[#E06010]" onClick={handleSchedulePost}>
              <Calendar className="w-4 h-4 mr-2" /> Schedule Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
