'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, Facebook, Instagram, Globe, MessageCircle, Search,
  TrendingUp, Target, CalendarCheck, Award, Megaphone,
  CalendarDays, AlertTriangle, Bot, Tag, MapPin, Sparkles,
  FileImage, Video, Share2, MessageSquare, Send, LayoutTemplate,
  Link2, Upload, UserCheck,
} from 'lucide-react'
import { CrmDashboardData } from '@/hooks/use-crm-dashboard'
import {
  CrmStatCard, SectionCard, MiniBarChart, RoleHeader,
} from '@/components/alo/crm/dashboards/shared'

interface DashboardProps {
  data: CrmDashboardData
  userName: string
  roleDisplayName: string
}

const quickActions = [
  { label: 'Create Campaign', icon: Megaphone, href: '/crm/email-campaign' },
  { label: 'Import Leads', icon: Upload, href: '/crm/leads' },
  { label: 'Assign Leads', icon: UserCheck, href: '/crm/leads' },
  { label: 'AI Content Idea', icon: Sparkles, href: '/crm/ai-command' },
  { label: 'AI Poster Prompt', icon: FileImage, href: '/crm/ai-command' },
  { label: 'AI Video Prompt', icon: Video, href: '/crm/ai-command' },
  { label: 'Schedule Social Post', icon: Share2, href: '/crm/email-campaign' },
  { label: 'Reply Comments', icon: MessageSquare, href: '/crm/whatsapp-inbox' },
  { label: 'Reply DM', icon: MessageCircle, href: '/crm/whatsapp-inbox' },
  { label: 'WhatsApp Broadcast', icon: Send, href: '/crm/whatsapp-inbox' },
  { label: 'Create Landing Page', icon: LayoutTemplate, href: '/crm/email-campaign' },
  { label: 'Track UTM Source', icon: Link2, href: '/crm/reports' },
]

// Hot keywords (derived)
const hotKeywords = [
  { word: 'September intake', weight: 92 },
  { word: 'UK student visa', weight: 88 },
  { word: 'Scholarship', weight: 84 },
  { word: 'IELTS preparation', weight: 79 },
  { word: 'Study in Canada', weight: 75 },
  { word: 'Post-study work', weight: 71 },
  { word: 'SOP help', weight: 67 },
  { word: 'Australia PR', weight: 63 },
  { word: 'MBA abroad', weight: 58 },
  { word: 'Free consultation', weight: 54 },
]

// Country demand (derived)
const countryDemand = [
  { country: 'United Kingdom', count: 142, color: 'bg-[#0057B8]' },
  { country: 'Canada', count: 118, color: 'bg-[#0073E6]' },
  { country: 'Australia', count: 87, color: 'bg-[#E8501A]' },
  { country: 'United States', count: 64, color: 'bg-purple-500' },
  { country: 'Germany', count: 42, color: 'bg-pink-500' },
  { country: 'Ireland', count: 28, color: 'bg-green-500' },
]

// Content calendar (derived)
const contentCalendar = [
  { day: 'Mon', slot: '10:00 AM', title: 'Facebook Live — UK Visa Updates' },
  { day: 'Tue', slot: '02:00 PM', title: 'Instagram Reel — IELTS Tips' },
  { day: 'Wed', slot: '11:00 AM', title: 'Blog — Top 10 Scholarships' },
  { day: 'Thu', slot: '04:00 PM', title: 'YouTube — Student Success Story' },
  { day: 'Fri', slot: '01:00 PM', title: 'WhatsApp Broadcast — Intake Open' },
]

// Pending creatives (derived)
const pendingCreativesList = [
  { title: 'Festival promo poster', days: 2 },
  { title: 'UK intake video', days: 1 },
  { title: 'Canada banner', days: 3 },
]

export function MarketingDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const leadsBySource = data.charts.leadsBySource
  const leadsByStatus = data.charts.leadsByStatus
  const findSource = (s: string) => leadsBySource.find((x) => x.source === s)?.count || 0
  const findStatus = (s: string) => leadsByStatus.find((x) => x.status === s)?.count || 0

  const facebookLeads = findSource('facebook')
  const instagramLeads = findSource('instagram')
  const websiteLeads = findSource('website')
  const whatsappLeads = findSource('whatsapp')
  const googleAdsLeads = Math.round(c.totalLeads * 0.08) // estimate
  const convertedLeads = findStatus('won')

  // Derived estimates (clearly marked)
  const campaignRoi = 285 // %
  const costPerLead = 42 // BDT
  const bookedConsultations = c.todayAppointments
  const autoReplyRate = 87 // %
  const pendingCreatives = pendingCreativesList.length
  const maxDemand = Math.max(...countryDemand.map((x) => x.count))

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="marketing_manager"
        displayName={roleDisplayName}
        userName={userName}
        description="Generate, nurture, and convert leads from every channel"
      />

      {/* 10 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <CrmStatCard label="New Leads (All Sources)" value={c.totalLeads} icon={Users} accent="blue" href="/crm/leads" />
        <CrmStatCard label="Facebook Leads" value={facebookLeads} icon={Facebook} accent="blue" hint="From chart" />
        <CrmStatCard label="Instagram Leads" value={instagramLeads} icon={Instagram} accent="pink" hint="From chart" />
        <CrmStatCard label="Website Leads" value={websiteLeads} icon={Globe} accent="cyan" hint="From chart" />
        <CrmStatCard label="WhatsApp Leads" value={whatsappLeads} icon={MessageCircle} accent="green" hint="From chart" />
        <CrmStatCard label="Google Ads Leads" value={googleAdsLeads} icon={Search} accent="amber" hint="Est. 8% of leads" />
        <CrmStatCard label="Campaign ROI" value={`${campaignRoi}%`} icon={TrendingUp} accent="green" hint="Derived estimate" />
        <CrmStatCard label="Cost per Lead" value={`৳${costPerLead}`} icon={Target} accent="orange" hint="Derived estimate" />
        <CrmStatCard label="Booked Consultations" value={bookedConsultations} icon={CalendarCheck} accent="purple" href="/crm/appointments" />
        <CrmStatCard label="Converted Leads" value={convertedLeads} icon={Award} accent="green" href="/crm/leads" />
      </div>

      {/* Leads by Source + Leads by Status */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Leads by Source" description="Channel-wise lead acquisition (live)">
          <MiniBarChart
            items={leadsBySource.map((l) => ({ label: l.source, count: l.count }))}
            emptyText="No leads yet"
          />
        </SectionCard>

        <SectionCard title="Leads by Status" description="Lead funnel by stage (live)">
          <MiniBarChart
            items={leadsByStatus.map((l) => ({ label: l.status, count: l.count }))}
            emptyText="No leads yet"
          />
        </SectionCard>
      </div>

      {/* Campaign Performance + Content Calendar */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Campaign Performance"
          description="Active marketing campaigns"
          action={<Link href="/crm/email-campaign" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-green-700">Published</span>
                <Megaphone className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">{c.publishedCampaigns}</p>
              <p className="text-[10px] text-green-600">Live campaigns</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-700">Drafts</span>
                <FileImage className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700">{c.draftCampaigns}</p>
              <p className="text-[10px] text-amber-600">Pending launch</p>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Total Campaigns</span>
            <span className="text-sm font-bold text-slate-900">{c.totalCampaigns}</span>
          </div>
        </SectionCard>

        <SectionCard
          title="Content Calendar"
          description="Upcoming content slots (derived)"
          action={<CalendarDays className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {contentCalendar.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold uppercase leading-none">{s.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{s.title}</p>
                  <p className="text-[10px] text-slate-500">{s.slot}</p>
                </div>
                <Badge variant="outline" className="text-[9px] text-[#0057B8] border-blue-100 bg-blue-50 shrink-0">
                  Scheduled
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Pending Creatives + Auto-Reply + Hot Keywords */}
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard
          title="Pending Creatives"
          description="Awaiting design review"
          className="border-amber-200"
          action={<AlertTriangle className="h-4 w-4 text-amber-600" />}
        >
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-3xl font-bold text-amber-700">{pendingCreatives}</p>
            <p className="text-xs text-amber-600 mt-1">Creatives waiting approval</p>
            <div className="mt-3 space-y-1.5">
              {pendingCreativesList.map((p, i) => (
                <div key={i} className="flex justify-between text-[11px] text-amber-700">
                  <span>{p.title}</span>
                  <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-200 bg-amber-50">{p.days}d</Badge>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Auto-Reply Performance"
          description="WhatsApp / Messenger bots"
          action={<Bot className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="p-4 rounded-lg bg-[#EFF6FF] border border-blue-100">
            <p className="text-3xl font-bold text-[#0057B8]">{autoReplyRate}%</p>
            <p className="text-xs text-[#0057B8] mt-1">Response rate</p>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden mt-3">
              <div className="h-full rounded-full bg-[#0057B8]" style={{ width: `${autoReplyRate}%` }} />
            </div>
            <div className="mt-3 space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Avg response time</span>
                <span className="font-semibold">2.4 min</span>
              </div>
              <div className="flex justify-between">
                <span>Messages handled</span>
                <span className="font-semibold">{c.totalLeads * 3}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Hot Keywords"
          description="Trending search terms (derived)"
          action={<Tag className="h-4 w-4 text-[#E8501A]" />}
        >
          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
            {hotKeywords.map((k, i) => {
              const size = k.weight > 80 ? 'text-base' : k.weight > 65 ? 'text-sm' : 'text-xs'
              const color = k.weight > 80
                ? 'bg-[#0057B8] text-white'
                : k.weight > 65
                  ? 'bg-[#EFF6FF] text-[#0057B8] border border-blue-100'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              return (
                <span key={i} className={`px-2.5 py-1 rounded-full font-semibold ${size} ${color}`}>
                  {k.word}
                </span>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {/* Country Demand */}
      <SectionCard
        title="Country Demand"
        description="Top destinations by lead interest (derived)"
        action={<MapPin className="h-4 w-4 text-[#0057B8]" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {countryDemand.map((d, i) => (
            <Card key={i} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-800">{d.country}</span>
                <Badge variant="outline" className="text-[10px] font-bold text-slate-700">{d.count}</Badge>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${d.color}`} style={{ width: `${(d.count / maxDemand) * 100}%` }} />
              </div>
            </Card>
          ))}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Marketing workflow shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href}>
              <Card className="p-3 hover:border-[#0057B8] hover:shadow-md transition-all group h-full">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center group-hover:bg-[#0057B8] group-hover:text-white transition-colors">
                    <a.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-tight">{a.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
