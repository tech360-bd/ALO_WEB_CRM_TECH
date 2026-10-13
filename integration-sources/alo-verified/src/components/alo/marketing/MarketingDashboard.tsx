'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Megaphone, FileImage, Globe, Users, Mail, MessageSquare,
  TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles, Calendar,
  BarChart3, Target, Zap, Eye,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useAppStore } from '@/lib/store'

const CHART_COLORS = ['#F37021', '#0066CC', '#FFB347', '#4CAF50', '#8b5cf6', '#E91E63']

const campaignPerformance = [
  { month: 'Oct', reach: 12000, conversions: 45 },
  { month: 'Nov', reach: 18000, conversions: 62 },
  { month: 'Dec', reach: 15000, conversions: 51 },
  { month: 'Jan', reach: 22000, conversions: 78 },
  { month: 'Feb', reach: 28000, conversions: 92 },
  { month: 'Mar', reach: 32000, conversions: 105 },
]

const contentPipeline = [
  { stage: 'Ideas', count: 8, color: 'bg-gray-100' },
  { stage: 'In Progress', count: 5, color: 'bg-blue-50' },
  { stage: 'Review', count: 3, color: 'bg-amber-50' },
  { stage: 'Approved', count: 4, color: 'bg-green-50' },
  { stage: 'Scheduled', count: 6, color: 'bg-purple-50' },
  { stage: 'Published', count: 12, color: 'bg-[#F37021]/10' },
]

const socialEngagement = [
  { platform: 'Facebook', followers: 5200, engagement: 4.2, icon: '📘', color: '#1877F2' },
  { platform: 'Instagram', followers: 8400, engagement: 5.8, icon: '📸', color: '#E4405F' },
  { platform: 'TikTok', followers: 3100, engagement: 7.1, icon: '🎵', color: '#000000' },
  { platform: 'LinkedIn', followers: 2600, engagement: 3.4, icon: '💼', color: '#0A66C2' },
  { platform: 'YouTube', followers: 1800, engagement: 2.9, icon: '🎬', color: '#FF0000' },
]

const leadSources = [
  { source: 'Facebook Ads', count: 45, color: '#1877F2' },
  { source: 'Google Search', count: 38, color: '#4CAF50' },
  { source: 'WhatsApp', count: 32, color: '#25D366' },
  { source: 'Referral', count: 25, color: '#F37021' },
  { source: 'Instagram', count: 20, color: '#E4405F' },
  { source: 'Website', count: 15, color: '#0066CC' },
]

export default function MarketingDashboard() {
  const { setCurrentView } = useAppStore()

  const stats = [
    { title: 'Active Campaigns', value: 6, icon: <Megaphone className="h-5 w-5" />, color: 'text-[#F37021]', bg: 'bg-[#F37021]/10', trend: '+2', up: true },
    { title: 'Content Published', value: 12, icon: <FileImage className="h-5 w-5" />, color: 'text-[#0066CC]', bg: 'bg-[#0066CC]/10', trend: '+5', up: true },
    { title: 'Social Reach', value: '32K', icon: <Globe className="h-5 w-5" />, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', trend: '+18%', up: true },
    { title: 'Lead Conversions', value: 105, icon: <Target className="h-5 w-5" />, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10', trend: '+14%', up: true },
    { title: 'Email Open Rate', value: '28%', icon: <Mail className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+3%', up: true },
    { title: 'WhatsApp Responses', value: 89, icon: <MessageSquare className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50', trend: '+22%', up: true },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Marketing Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Campaigns, content scheduling and social analytics</p>
        </div>
        <Badge variant="outline" className="w-fit border-[#FFB347]/30 text-[#FFB347] bg-[#FFB347]/5 px-3 py-1 text-xs font-medium">
          Marketing
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{s.trend}
                </span>
              </div>
              <p className="text-xl font-bold text-[#1A2332]">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Performance Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#F37021]" /> Campaign Performance (6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={campaignPerformance} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar yAxisId="left" dataKey="reach" fill="#F37021" radius={[4, 4, 0, 0]} barSize={28} name="Reach" />
              <Bar yAxisId="right" dataKey="conversions" fill="#0066CC" radius={[4, 4, 0, 0]} barSize={28} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#F37021]" /><span className="text-[11px] text-gray-500">Reach</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#0066CC]" /><span className="text-[11px] text-gray-500">Conversions</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Content Pipeline & Social Media */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Pipeline */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <FileImage className="h-4 w-4 text-[#0066CC]" /> Content Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5">
              {contentPipeline.map((c, i) => (
                <div key={i} className={`flex items-center justify-between p-3 ${c.color} rounded-lg`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1A2332]">{c.stage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(c.count / 12) * 100} className="h-2 w-20" />
                    <span className="text-sm font-bold text-[#1A2332]">{c.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Media Engagement */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#4CAF50]" /> Social Media Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5">
              {socialEngagement.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{s.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">{s.platform}</p>
                      <p className="text-[10px] text-gray-500">{s.followers.toLocaleString()} followers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={s.engagement * 10} className="h-2 w-16" />
                    <span className="text-xs font-semibold text-[#1A2332]">{s.engagement}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Source Breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <Target className="h-4 w-4 text-[#F37021]" /> Lead Source Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            {leadSources.map((l, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg min-w-[150px] flex-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                <div>
                  <p className="text-sm font-medium text-[#1A2332]">{l.count}</p>
                  <p className="text-[10px] text-gray-500">{l.source}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-marketing')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F37021]/10 rounded-xl flex items-center justify-center text-[#F37021]"><Megaphone className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">New Campaign</p><p className="text-[11px] text-gray-500">Launch marketing campaign</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-marketing')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#F37021] to-[#FFB347] rounded-xl flex items-center justify-center text-white"><Sparkles className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">AI Generate Content</p><p className="text-[11px] text-gray-500">Create with AI assistant</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-marketing')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0066CC]/10 rounded-xl flex items-center justify-center text-[#0066CC]"><Calendar className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Schedule Post</p><p className="text-[11px] text-gray-500">Plan social media posts</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
