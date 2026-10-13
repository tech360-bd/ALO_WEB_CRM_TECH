'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Sparkles, Users, Target, Zap, Mail, MessageCircle,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  BarChart3, Award, Flame, Snowflake, Sun, Play, Pause, Plus,
  Eye, Send, Calendar, FileText, Bot, Brain, Shield, Phone
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const AI_PURPLE = '#8b5cf6';
const CORAL = '#bf4520';
const NAVY = '#1a1a2e';

// ── AI Lead Scoring Types ──────────────────────────────────────────────────
type LeadTier = 'HOT' | 'WARM' | 'COLD';

interface AILeadScore {
  leadId: string;
  studentName: string;
  email: string;
  phone: string;
  targetCountry: string;
  courseInterest: string;
  score: number; // 0-100
  tier: LeadTier;
  factors: ScoringFactor[];
  predictedConversion: number;
  recommendedAction: string;
  lastActivity: string;
  stage: string;
  counselor: string;
}

interface ScoringFactor {
  name: string;
  weight: number;
  score: number;
  reason: string;
}

// ── Drip Campaign Types ────────────────────────────────────────────────────
type DripStatus = 'active' | 'paused' | 'completed' | 'draft';

interface DripStep {
  id: string;
  type: 'email' | 'whatsapp' | 'sms' | 'delay' | 'condition';
  template: string;
  delayHours: number;
  subject?: string;
}

interface DripCampaign {
  id: string;
  name: string;
  description: string;
  status: DripStatus;
  triggerStage: string;
  steps: DripStep[];
  enrolledLeads: number;
  completedLeads: number;
  conversionRate: number;
  avgDaysToConvert: number;
}

// ── Demo Data ──────────────────────────────────────────────────────────────
const AI_LEADS: AILeadScore[] = [
  {
    leadId: 'l1', studentName: 'Rahim Ahmed', email: 'rahim@gmail.com', phone: '+8801712345678',
    targetCountry: 'UK', courseInterest: 'MSc Computer Science', score: 92, tier: 'HOT',
    factors: [
      { name: 'Profile Completeness', weight: 25, score: 95, reason: 'All docs uploaded' },
      { name: 'Engagement Level', weight: 20, score: 90, reason: 'Opened 8/10 emails, visited 12 pages' },
      { name: 'Academic Fit', weight: 20, score: 88, reason: 'GPA 3.7, IELTS 7.0' },
      { name: 'Financial Readiness', weight: 15, score: 85, reason: 'Bank statement verified' },
      { name: 'Response Speed', weight: 10, score: 95, reason: 'Replies within 2 hours' },
      { name: 'Source Quality', weight: 10, score: 80, reason: 'Referral from enrolled student' },
    ],
    predictedConversion: 87, recommendedAction: 'Fast-track application', lastActivity: '2 hours ago',
    stage: 'QUALIFIED', counselor: 'Sarah Khan',
  },
  {
    leadId: 'l2', studentName: 'Fatima Begum', email: 'fatima@yahoo.com', phone: '+8801898765432',
    targetCountry: 'Canada', courseInterest: 'MBA', score: 74, tier: 'WARM',
    factors: [
      { name: 'Profile Completeness', weight: 25, score: 70, reason: 'Missing transcripts' },
      { name: 'Engagement Level', weight: 20, score: 65, reason: 'Opened 3/8 emails' },
      { name: 'Academic Fit', weight: 20, score: 80, reason: 'GPA 3.4, IELTS 6.5' },
      { name: 'Financial Readiness', weight: 15, score: 60, reason: 'Bank statement pending' },
      { name: 'Response Speed', weight: 10, score: 70, reason: 'Replies within 1 day' },
      { name: 'Source Quality', weight: 10, score: 90, reason: 'Facebook lead ad (high intent)' },
    ],
    predictedConversion: 58, recommendedAction: 'Send missing docs reminder', lastActivity: '1 day ago',
    stage: 'CONTACTED', counselor: 'Ali Rahman',
  },
  {
    leadId: 'l3', studentName: 'Karim Hossain', email: 'karim@hotmail.com', phone: '+8801555444333',
    targetCountry: 'Australia', courseInterest: 'BEng Civil', score: 35, tier: 'COLD',
    factors: [
      { name: 'Profile Completeness', weight: 25, score: 20, reason: 'Only basic info filled' },
      { name: 'Engagement Level', weight: 20, score: 30, reason: 'Opened 1/6 emails' },
      { name: 'Academic Fit', weight: 20, score: 40, reason: 'GPA 2.8, no IELTS yet' },
      { name: 'Financial Readiness', weight: 15, score: 30, reason: 'No financial docs' },
      { name: 'Response Speed', weight: 10, score: 20, reason: 'No reply in 5 days' },
      { name: 'Source Quality', weight: 10, score: 50, reason: 'Organic search (low intent)' },
    ],
    predictedConversion: 15, recommendedAction: 'Nurture campaign + WhatsApp', lastActivity: '5 days ago',
    stage: 'NEW', counselor: 'Unassigned',
  },
  {
    leadId: 'l4', studentName: 'Nusrat Jahan', email: 'nusrat@gmail.com', phone: '+8801677888999',
    targetCountry: 'UK', courseInterest: 'LLB Law', score: 85, tier: 'HOT',
    factors: [
      { name: 'Profile Completeness', weight: 25, score: 90, reason: 'All docs uploaded' },
      { name: 'Engagement Level', weight: 20, score: 85, reason: 'Attended webinar, opened 7/7 emails' },
      { name: 'Academic Fit', weight: 20, score: 82, reason: 'GPA 3.6, IELTS 7.5' },
      { name: 'Financial Readiness', weight: 15, score: 80, reason: 'Sponsor letter ready' },
      { name: 'Response Speed', weight: 10, score: 90, reason: 'Replies within 4 hours' },
      { name: 'Source Quality', weight: 10, score: 85, reason: 'Direct website inquiry' },
    ],
    predictedConversion: 78, recommendedAction: 'Schedule consultation', lastActivity: '4 hours ago',
    stage: 'QUALIFIED', counselor: 'Sarah Khan',
  },
];

const DRIP_CAMPAIGNS: DripCampaign[] = [
  {
    id: 'dc1', name: 'New Lead Welcome Series', description: '5-step onboarding drip for new leads',
    status: 'active', triggerStage: 'NEW',
    steps: [
      { id: 's1', type: 'email', template: 'welcome-email', delayHours: 0, subject: 'Welcome to ALO Education! 🎓' },
      { id: 's2', type: 'whatsapp', template: 'intro-whatsapp', delayHours: 24 },
      { id: 's3', type: 'email', template: 'course-options', delayHours: 72, subject: 'Find Your Perfect Course' },
      { id: 's4', type: 'delay', template: '', delayHours: 48 },
      { id: 's5', type: 'condition', template: 'check-engagement', delayHours: 0 },
    ],
    enrolledLeads: 45, completedLeads: 28, conversionRate: 32, avgDaysToConvert: 8.5,
  },
  {
    id: 'dc2', name: 'Contacted → Qualified Nurture', description: 'Engagement series for contacted leads',
    status: 'active', triggerStage: 'CONTACTED',
    steps: [
      { id: 's1', type: 'email', template: 'consultation-reminder', delayHours: 0, subject: 'Your Free Consultation Awaits' },
      { id: 's2', type: 'whatsapp', template: 'book-appointment', delayHours: 48 },
      { id: 's3', type: 'email', template: 'success-stories', delayHours: 120, subject: 'Students Like You Who Made It' },
      { id: 's4', type: 'sms', template: 'follow-up-sms', delayHours: 168 },
    ],
    enrolledLeads: 32, completedLeads: 18, conversionRate: 45, avgDaysToConvert: 12.3,
  },
  {
    id: 'dc3', name: 'Document Collection Drip', description: 'Automated reminders for missing documents',
    status: 'active', triggerStage: 'APPLICATION',
    steps: [
      { id: 's1', type: 'email', template: 'docs-needed', delayHours: 0, subject: 'Documents Required for Your Application' },
      { id: 's2', type: 'whatsapp', template: 'docs-reminder-wa', delayHours: 72 },
      { id: 's3', type: 'email', template: 'docs-urgent', delayHours: 168, subject: '⚠️ Urgent: Missing Documents' },
    ],
    enrolledLeads: 21, completedLeads: 15, conversionRate: 71, avgDaysToConvert: 5.2,
  },
  {
    id: 'dc4', name: 'Win-Back Cold Leads', description: 'Re-engagement campaign for cold leads',
    status: 'paused', triggerStage: 'LOST',
    steps: [
      { id: 's1', type: 'whatsapp', template: 'we-miss-you', delayHours: 0 },
      { id: 's2', type: 'email', template: 'new-opportunities', delayHours: 168, subject: 'New Scholarships Available! 🎉' },
      { id: 's3', type: 'sms', template: 'winback-sms', delayHours: 336 },
    ],
    enrolledLeads: 12, completedLeads: 3, conversionRate: 8, avgDaysToConvert: 21.0,
  },
];

// ── Score tier styling ─────────────────────────────────────────────────────
const TIER_CONFIG: Record<LeadTier, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  HOT: { icon: <Flame className="h-4 w-4" />, color: '#dc2626', bg: '#fef2f2', label: 'Hot Lead' },
  WARM: { icon: <Sun className="h-4 w-4" />, color: '#d97706', bg: '#fffbeb', label: 'Warm Lead' },
  COLD: { icon: <Snowflake className="h-4 w-4" />, color: '#0066CC', bg: '#eff6ff', label: 'Cold Lead' },
};

interface AILeadScoringPageProps {
  onBack?: () => void;
}

export function AILeadScoringPage({ onBack }: AILeadScoringPageProps) {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string>('all');

  const filteredLeads = tierFilter === 'all'
    ? AI_LEADS
    : AI_LEADS.filter(l => l.tier === tierFilter);

  const selectedLeadData = AI_LEADS.find(l => l.leadId === selectedLead);

  const avgScore = AI_LEADS.reduce((a, l) => a + l.score, 0) / AI_LEADS.length;
  const hotCount = AI_LEADS.filter(l => l.tier === 'HOT').length;
  const warmCount = AI_LEADS.filter(l => l.tier === 'WARM').length;
  const coldCount = AI_LEADS.filter(l => l.tier === 'COLD').length;

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="text-white px-4 py-3" style={{ background: `linear-gradient(135deg, ${AI_PURPLE}, ${NAVY})` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1 text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Lead Scoring & Drip Campaigns
              </h1>
              <p className="text-xs text-white/50">Intelligent lead management from Ai-Markting-crm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs bg-white/20 text-white border-0" style={{ borderRadius: '4px' }}>
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>
      </header>

      <Tabs defaultValue="scoring" className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#e5e7eb] px-4">
          <div className="max-w-6xl mx-auto overflow-x-auto">
            <TabsList className="bg-transparent h-10 gap-0.5 p-0">
              {[
                { value: 'scoring', label: '🧠 Lead Scoring' },
                { value: 'drip', label: '💧 Drip Campaigns' },
                { value: 'analytics', label: '📊 Analytics' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#8b5cf6] data-[state=active]:text-[#1a1a2e] data-[state=active]:font-semibold text-[#6b7280] h-10 rounded-none px-4 text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Lead Scoring Tab */}
        <TabsContent value="scoring" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-[#8b5cf6]" />
                    <span className="text-xs text-[#6b7280]">Avg AI Score</span>
                  </div>
                  <div className="text-2xl font-bold text-[#1a1a2e]">{avgScore.toFixed(0)}</div>
                </CardContent>
              </Card>
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-[#dc2626]" />
                    <span className="text-xs text-[#6b7280]">Hot Leads</span>
                  </div>
                  <div className="text-2xl font-bold text-[#dc2626]">{hotCount}</div>
                </CardContent>
              </Card>
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="h-4 w-4 text-[#d97706]" />
                    <span className="text-xs text-[#6b7280]">Warm Leads</span>
                  </div>
                  <div className="text-2xl font-bold text-[#d97706]">{warmCount}</div>
                </CardContent>
              </Card>
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Snowflake className="h-4 w-4 text-[#0066CC]" />
                    <span className="text-xs text-[#6b7280]">Cold Leads</span>
                  </div>
                  <div className="text-2xl font-bold text-[#0066CC]">{coldCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tier filter */}
            <div className="flex items-center gap-2 mb-4">
              {['all', 'HOT', 'WARM', 'COLD'].map(tier => (
                <Button
                  key={tier}
                  variant={tierFilter === tier ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTierFilter(tier)}
                  className={tierFilter === tier ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs' : 'text-xs'}
                  style={{ borderRadius: '6px' }}
                >
                  {tier === 'all' ? 'All' : TIER_CONFIG[tier as LeadTier].label}
                </Button>
              ))}
            </div>

            {/* Lead cards */}
            <div className="space-y-3">
              {filteredLeads.map(lead => {
                const tierCfg = TIER_CONFIG[lead.tier];
                return (
                  <Card
                    key={lead.leadId}
                    className={`border cursor-pointer hover:shadow-md transition-all ${selectedLead === lead.leadId ? 'border-[#8b5cf6] ring-1 ring-[#8b5cf6]/30' : 'border-[#e5e7eb]'}`}
                    onClick={() => setSelectedLead(selectedLead === lead.leadId ? null : lead.leadId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#1a1a2e]">{lead.studentName}</h3>
                            <Badge className="text-xs border-0" style={{ backgroundColor: tierCfg.bg, color: tierCfg.color, borderRadius: '4px' }}>
                              {tierCfg.icon} {tierCfg.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs" style={{ borderRadius: '4px' }}>{lead.stage}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>
                            <span>→ {lead.targetCountry} · {lead.courseInterest}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {/* Score circle */}
                          <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                              <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                              <circle
                                cx="28" cy="28" r="24" fill="none"
                                stroke={tierCfg.color} strokeWidth="4"
                                strokeDasharray={`${(lead.score / 100) * 150.8} 150.8`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold" style={{ color: tierCfg.color }}>{lead.score}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {selectedLead === lead.leadId && (
                        <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                          {/* Scoring factors */}
                          <h4 className="text-sm font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
                            AI Scoring Breakdown
                          </h4>
                          <div className="space-y-2 mb-4">
                            {lead.factors.map(factor => (
                              <div key={factor.name} className="flex items-center gap-3">
                                <div className="w-32 text-xs text-[#6b7280] shrink-0">{factor.name}</div>
                                <div className="flex-1">
                                  <div className="h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${factor.score}%`, backgroundColor: factor.score >= 80 ? '#22c55e' : factor.score >= 60 ? '#f59e0b' : '#dc2626' }}
                                    />
                                  </div>
                                </div>
                                <div className="w-8 text-xs font-bold text-right text-[#1a1a2e]">{factor.score}</div>
                                <div className="w-8 text-xs text-[#9ca3af] text-right">({factor.weight}%)</div>
                              </div>
                            ))}
                          </div>

                          {/* Prediction & action */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#f5f3ff] rounded-lg p-3">
                              <div className="text-xs text-[#6b7280] mb-1">Predicted Conversion</div>
                              <div className="text-lg font-bold text-[#8b5cf6]">{lead.predictedConversion}%</div>
                            </div>
                            <div className="bg-[#f0fdf4] rounded-lg p-3">
                              <div className="text-xs text-[#6b7280] mb-1">Recommended Action</div>
                              <div className="text-sm font-bold text-[#22c55e]">{lead.recommendedAction}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Drip Campaigns Tab */}
        <TabsContent value="drip" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#8b5cf6]">{DRIP_CAMPAIGNS.filter(c => c.status === 'active').length}</div>
                  <div className="text-xs text-[#6b7280]">Active Campaigns</div>
                </CardContent>
              </Card>
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#1a1a2e]">{DRIP_CAMPAIGNS.reduce((a, c) => a + c.enrolledLeads, 0)}</div>
                  <div className="text-xs text-[#6b7280]">Enrolled Leads</div>
                </CardContent>
              </Card>
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#22c55e]">{(DRIP_CAMPAIGNS.reduce((a, c) => a + c.conversionRate, 0) / DRIP_CAMPAIGNS.length).toFixed(0)}%</div>
                  <div className="text-xs text-[#6b7280]">Avg Conversion</div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign cards */}
            {DRIP_CAMPAIGNS.map(campaign => (
              <Card key={campaign.id} className="border border-[#e5e7eb]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#1a1a2e]">{campaign.name}</h3>
                        <Badge
                          className="text-xs border-0"
                          style={{
                            backgroundColor: campaign.status === 'active' ? '#f0fdf4' : campaign.status === 'paused' ? '#fffbeb' : '#f3f4f6',
                            color: campaign.status === 'active' ? '#22c55e' : campaign.status === 'paused' ? '#d97706' : '#6b7280',
                            borderRadius: '4px',
                          }}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#6b7280]">{campaign.description}</p>
                      <p className="text-xs text-[#9ca3af] mt-1">Trigger: Lead enters &quot;{campaign.triggerStage}&quot; stage</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-[#22c55e]">{campaign.conversionRate}%</div>
                      <div className="text-xs text-[#6b7280]">conversion</div>
                    </div>
                  </div>

                  {/* Drip steps */}
                  <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                    {campaign.steps.map((step, i) => {
                      const stepIcons: Record<string, React.ReactNode> = {
                        email: <Mail className="h-3.5 w-3.5" />,
                        whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
                        sms: <Phone className="h-3.5 w-3.5" />,
                        delay: <Clock className="h-3.5 w-3.5" />,
                        condition: <Target className="h-3.5 w-3.5" />,
                      };
                      const stepColors: Record<string, string> = {
                        email: '#0066CC', whatsapp: '#22c55e', sms: '#8b5cf6', delay: '#6b7280', condition: '#f59e0b',
                      };
                      return (
                        <React.Fragment key={step.id}>
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 border"
                            style={{ backgroundColor: `${stepColors[step.type]}08`, color: stepColors[step.type], borderColor: `${stepColors[step.type]}30` }}
                          >
                            {stepIcons[step.type]}
                            <span>{step.type === 'delay' ? `${step.delayHours}h wait` : step.type === 'condition' ? 'Check' : step.template}</span>
                          </div>
                          {i < campaign.steps.length - 1 && <ArrowRight className="h-3 w-3 text-[#9ca3af] shrink-0" />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-[#6b7280]">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {campaign.enrolledLeads} enrolled</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {campaign.completedLeads} completed</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {campaign.avgDaysToConvert} avg days</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Conversion funnel */}
            <Card className="border-[#e5e7eb]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-[#8b5cf6]" />
                  Lead Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { stage: 'New Leads', count: 120, pct: 100, color: '#6b7280' },
                    { stage: 'Contacted', count: 85, pct: 71, color: '#0066CC' },
                    { stage: 'Qualified', count: 52, pct: 43, color: '#f59e0b' },
                    { stage: 'Application', count: 31, pct: 26, color: '#8b5cf6' },
                    { stage: 'Offered', count: 22, pct: 18, color: '#14b8a6' },
                    { stage: 'Enrolled', count: 15, pct: 12.5, color: '#22c55e' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium text-[#1a1a2e] shrink-0">{item.stage}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-[#f3f4f6] rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg flex items-center px-3 transition-all"
                            style={{ width: `${item.pct}%`, backgroundColor: `${item.color}20`, borderLeft: `3px solid ${item.color}` }}
                          >
                            <span className="text-xs font-bold" style={{ color: item.color }}>{item.count}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-16 text-sm font-bold text-right text-[#1a1a2e]">{item.pct}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI model performance */}
            <Card className="border-[#e5e7eb]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-[#8b5cf6]" />
                  AI Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Accuracy', value: '94.2%', icon: <Target className="h-4 w-4" />, color: '#22c55e' },
                    { label: 'Precision', value: '91.8%', icon: <Zap className="h-4 w-4" />, color: '#0066CC' },
                    { label: 'Recall', value: '89.5%', icon: <TrendingUp className="h-4 w-4" />, color: '#8b5cf6' },
                    { label: 'F1 Score', value: '90.6%', icon: <Award className="h-4 w-4" />, color: '#f59e0b' },
                  ].map((metric, i) => (
                    <div key={i} className="bg-[#f9fafb] rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2" style={{ color: metric.color }}>
                        {metric.icon}
                      </div>
                      <div className="text-lg font-bold text-[#1a1a2e]">{metric.value}</div>
                      <div className="text-xs text-[#6b7280]">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
