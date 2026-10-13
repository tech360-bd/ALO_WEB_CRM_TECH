'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Sparkles, Users, Target, Zap, Mail, Globe, Linkedin,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  BarChart3, Award, Search, RefreshCw, Shield, Phone, Building2,
  Eye, Send, Bot, Brain, Activity, DollarSign, Calendar,
  Monitor, FileText, MapPin, GraduationCap, Briefcase,
  ExternalLink, CircleDollarSign, Rss, Siren, ArrowUpRight,
  ArrowDownRight, Minus, Loader2, Verified, CircleAlert, CircleCheck
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const PRIMARY_BLUE = '#0052B8';
const ORANGE_CTA = '#E8501A';
const ENRICH_GREEN = '#10b981';
const ENRICH_AMBER = '#f59e0b';
const ENRICH_RED = '#ef4444';

// ── Types ──────────────────────────────────────────────────────────────────
type EnrichStatus = 'pending' | 'enriching' | 'complete' | 'failed';
type LeadTier = 'HOT' | 'WARM' | 'COLD';
type IntelType = 'competitor' | 'trend' | 'pricing' | 'opportunity';

interface ScoringFactor {
  name: string;
  icon: React.ReactNode;
  weight: number; // percentage weight
  score: number; // 0-100
  reason: string;
  color: string;
}

interface EnrichedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  targetCountry: string;
  courseInterest: string;
  score: number;
  tier: LeadTier;
  factors: ScoringFactor[];
  status: EnrichStatus;
  progress: number;
  // Enriched fields
  company?: string;
  companySize?: string;
  industry?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  socialProfiles: SocialProfile[];
  lastActivity: string;
  predictedConversion: number;
  budget?: string;
  timeline?: string;
}

interface SocialProfile {
  platform: string;
  url: string;
  verified: boolean;
  followers?: number;
}

interface EnrichQueueItem {
  id: string;
  leadName: string;
  status: EnrichStatus;
  startedAt?: string;
  completedAt?: string;
  steps: EnrichStep[];
}

interface EnrichStep {
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
  duration?: number;
}

interface IntelAlert {
  id: string;
  type: IntelType;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
  metric?: string;
  change?: number; // percentage
}

interface MarketTrend {
  id: string;
  name: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  category: string;
  data: number[];
}

// ── Demo Data: Scoring Factors ─────────────────────────────────────────────
const SCORING_FACTORS_DEF: Omit<ScoringFactor, 'score' | 'reason'>[] = [
  { name: 'Source Quality', icon: <Target className="w-4 h-4" />, weight: 20, color: PRIMARY_BLUE },
  { name: 'Engagement Level', icon: <Activity className="w-4 h-4" />, weight: 25, color: ENRICH_GREEN },
  { name: 'Budget Fit', icon: <DollarSign className="w-4 h-4" />, weight: 15, color: ORANGE_CTA },
  { name: 'Timeline Readiness', icon: <Clock className="w-4 h-4" />, weight: 15, color: ENRICH_AMBER },
  { name: 'Qualification Match', icon: <GraduationCap className="w-4 h-4" />, weight: 15, color: '#8b5cf6' },
  { name: 'Profile Completeness', icon: <Shield className="w-4 h-4" />, weight: 10, color: '#06b6d4' },
];

// ── Demo Data: Enriched Leads ──────────────────────────────────────────────
const ENRICHED_LEADS: EnrichedLead[] = [
  {
    id: 'el1', name: 'Rahim Ahmed', email: 'rahim.ahmed@gmail.com', phone: '+8801712345678',
    source: 'Website Form', targetCountry: 'UK', courseInterest: 'MSc Computer Science',
    score: 87, tier: 'HOT', status: 'complete', progress: 100,
    company: 'TechVenture BD', companySize: '50-200', industry: 'Technology',
    linkedin: 'linkedin.com/in/rahimahmed', website: 'techventurebd.com',
    location: 'Dhaka, Bangladesh', emailVerified: true, phoneVerified: true,
    budget: '$30,000-40,000', timeline: 'Fall 2025',
    socialProfiles: [
      { platform: 'LinkedIn', url: 'linkedin.com/in/rahimahmed', verified: true, followers: 1200 },
      { platform: 'GitHub', url: 'github.com/rahimdev', verified: true, followers: 85 },
    ],
    lastActivity: '2 hours ago', predictedConversion: 78,
    factors: [
      { name: 'Source Quality', icon: <Target className="w-4 h-4" />, weight: 20, score: 90, reason: 'Direct website form - high intent', color: PRIMARY_BLUE },
      { name: 'Engagement Level', icon: <Activity className="w-4 h-4" />, weight: 25, score: 85, reason: 'Opened 3 emails, visited pricing page', color: ENRICH_GREEN },
      { name: 'Budget Fit', icon: <DollarSign className="w-4 h-4" />, weight: 15, score: 80, reason: 'Budget aligns with UK MSc programs', color: ORANGE_CTA },
      { name: 'Timeline Readiness', icon: <Clock className="w-4 h-4" />, weight: 15, score: 88, reason: 'Applying for Fall 2025 intake', color: ENRICH_AMBER },
      { name: 'Qualification Match', icon: <GraduationCap className="w-4 h-4" />, weight: 15, score: 92, reason: 'BSc CS with 3.6 GPA meets requirements', color: '#8b5cf6' },
      { name: 'Profile Completeness', icon: <Shield className="w-4 h-4" />, weight: 10, score: 95, reason: 'All fields enriched & verified', color: '#06b6d4' },
    ],
  },
  {
    id: 'el2', name: 'Fatima Khan', email: 'fatima.khan@outlook.com', phone: '+8801898765432',
    source: 'Facebook Lead Ad', targetCountry: 'Canada', courseInterest: 'MBA Finance',
    score: 72, tier: 'WARM', status: 'complete', progress: 100,
    company: 'BRAC Microfinance', companySize: '200-500', industry: 'Finance',
    linkedin: 'linkedin.com/in/fatimakhan', website: undefined,
    location: 'Chittagong, Bangladesh', emailVerified: true, phoneVerified: false,
    budget: '$25,000-35,000', timeline: 'Spring 2026',
    socialProfiles: [
      { platform: 'LinkedIn', url: 'linkedin.com/in/fatimakhan', verified: true, followers: 340 },
    ],
    lastActivity: '1 day ago', predictedConversion: 52,
    factors: [
      { name: 'Source Quality', icon: <Target className="w-4 h-4" />, weight: 20, score: 65, reason: 'Social ad lead - moderate intent', color: PRIMARY_BLUE },
      { name: 'Engagement Level', icon: <Activity className="w-4 h-4" />, weight: 25, score: 70, reason: 'Opened 1 email, downloaded brochure', color: ENRICH_GREEN },
      { name: 'Budget Fit', icon: <DollarSign className="w-4 h-4" />, weight: 15, score: 75, reason: 'Budget partially matches program cost', color: ORANGE_CTA },
      { name: 'Timeline Readiness', icon: <Clock className="w-4 h-4" />, weight: 15, score: 60, reason: 'Exploring Spring 2026 - longer horizon', color: ENRICH_AMBER },
      { name: 'Qualification Match', icon: <GraduationCap className="w-4 h-4" />, weight: 15, score: 78, reason: 'BBA with work experience fits MBA', color: '#8b5cf6' },
      { name: 'Profile Completeness', icon: <Shield className="w-4 h-4" />, weight: 10, score: 80, reason: 'Phone not yet verified', color: '#06b6d4' },
    ],
  },
  {
    id: 'el3', name: 'Arjun Patel', email: 'arjun.p@company.in', phone: '+919876543210',
    source: 'Google Ads', targetCountry: 'Australia', courseInterest: 'BSc Nursing',
    score: 58, tier: 'COLD', status: 'enriching', progress: 65,
    company: undefined, companySize: undefined, industry: 'Healthcare',
    linkedin: undefined, website: undefined,
    location: 'Mumbai, India', emailVerified: true, phoneVerified: false,
    budget: undefined, timeline: undefined,
    socialProfiles: [],
    lastActivity: '3 days ago', predictedConversion: 30,
    factors: [
      { name: 'Source Quality', icon: <Target className="w-4 h-4" />, weight: 20, score: 55, reason: 'Paid search - broad intent', color: PRIMARY_BLUE },
      { name: 'Engagement Level', icon: <Activity className="w-4 h-4" />, weight: 25, score: 40, reason: 'Only visited landing page', color: ENRICH_GREEN },
      { name: 'Budget Fit', icon: <DollarSign className="w-4 h-4" />, weight: 15, score: 50, reason: 'Budget unknown', color: ORANGE_CTA },
      { name: 'Timeline Readiness', icon: <Clock className="w-4 h-4" />, weight: 15, score: 55, reason: 'Timeline not specified', color: ENRICH_AMBER },
      { name: 'Qualification Match', icon: <GraduationCap className="w-4 h-4" />, weight: 15, score: 70, reason: 'Science background relevant', color: '#8b5cf6' },
      { name: 'Profile Completeness', icon: <Shield className="w-4 h-4" />, weight: 10, score: 60, reason: 'Missing several key fields', color: '#06b6d4' },
    ],
  },
  {
    id: 'el4', name: 'Nusrat Jahan', email: 'nusrat.j@gmail.com', phone: '+8801534567890',
    source: 'Referral', targetCountry: 'Germany', courseInterest: 'MSc Data Science',
    score: 91, tier: 'HOT', status: 'complete', progress: 100,
    company: 'Grameen Solutions', companySize: '50-200', industry: 'IT Services',
    linkedin: 'linkedin.com/in/nusratjahan', website: 'nusratjahan.dev',
    location: 'Sylhet, Bangladesh', emailVerified: true, phoneVerified: true,
    budget: '$20,000-30,000', timeline: 'Winter 2025',
    socialProfiles: [
      { platform: 'LinkedIn', url: 'linkedin.com/in/nusratjahan', verified: true, followers: 890 },
      { platform: 'GitHub', url: 'github.com/nusratdev', verified: true, followers: 210 },
      { platform: 'Twitter', url: 'twitter.com/nusratj', verified: false, followers: 450 },
    ],
    lastActivity: '30 min ago', predictedConversion: 85,
    factors: [
      { name: 'Source Quality', icon: <Target className="w-4 h-4" />, weight: 20, score: 95, reason: 'Referral from converted student', color: PRIMARY_BLUE },
      { name: 'Engagement Level', icon: <Activity className="w-4 h-4" />, weight: 25, score: 92, reason: 'Responded to 2 emails, booked consultation', color: ENRICH_GREEN },
      { name: 'Budget Fit', icon: <DollarSign className="w-4 h-4" />, weight: 15, score: 88, reason: 'Budget confirmed for German programs', color: ORANGE_CTA },
      { name: 'Timeline Readiness', icon: <Clock className="w-4 h-4" />, weight: 15, score: 90, reason: 'Winter 2025 - immediate readiness', color: ENRICH_AMBER },
      { name: 'Qualification Match', icon: <GraduationCap className="w-4 h-4" />, weight: 15, score: 94, reason: 'BSc Statistics + Python skills', color: '#8b5cf6' },
      { name: 'Profile Completeness', icon: <Shield className="w-4 h-4" />, weight: 10, score: 98, reason: 'Fully enriched with 3 social profiles', color: '#06b6d4' },
    ],
  },
  {
    id: 'el5', name: 'Kamal Hossain', email: 'kamal.h@yahoo.com', phone: '+8801645678901',
    source: 'Webinar Registration', targetCountry: 'USA', courseInterest: 'MS Mechanical Eng',
    score: 45, tier: 'COLD', status: 'pending', progress: 0,
    company: undefined, companySize: undefined, industry: undefined,
    linkedin: undefined, website: undefined,
    location: undefined, emailVerified: false, phoneVerified: false,
    budget: undefined, timeline: undefined,
    socialProfiles: [],
    lastActivity: '5 days ago', predictedConversion: 18,
    factors: [
      { name: 'Source Quality', icon: <Target className="w-4 h-4" />, weight: 20, score: 50, reason: 'Webinar - interest but low commitment', color: PRIMARY_BLUE },
      { name: 'Engagement Level', icon: <Activity className="w-4 h-4" />, weight: 25, score: 30, reason: 'No further engagement after webinar', color: ENRICH_GREEN },
      { name: 'Budget Fit', icon: <DollarSign className="w-4 h-4" />, weight: 15, score: 40, reason: 'Budget unknown', color: ORANGE_CTA },
      { name: 'Timeline Readiness', icon: <Clock className="w-4 h-4" />, weight: 15, score: 35, reason: 'No timeline indicated', color: ENRICH_AMBER },
      { name: 'Qualification Match', icon: <GraduationCap className="w-4 h-4" />, weight: 15, score: 60, reason: 'BSc Engineering background', color: '#8b5cf6' },
      { name: 'Profile Completeness', icon: <Shield className="w-4 h-4" />, weight: 10, score: 30, reason: 'Minimal data - not enriched', color: '#06b6d4' },
    ],
  },
];

// ── Demo Data: Enrichment Queue ─────────────────────────────────────────────
const ENRICH_QUEUE: EnrichQueueItem[] = [
  {
    id: 'eq1', leadName: 'Kamal Hossain', status: 'pending',
    steps: [
      { name: 'Email Verification', status: 'pending' },
      { name: 'Phone Validation', status: 'pending' },
      { name: 'Company Lookup', status: 'pending' },
      { name: 'Social Profile Scan', status: 'pending' },
      { name: 'Budget Estimation', status: 'pending' },
    ],
  },
  {
    id: 'eq2', leadName: 'Arjun Patel', status: 'enriching', startedAt: '2 min ago',
    steps: [
      { name: 'Email Verification', status: 'done', duration: 1.2 },
      { name: 'Phone Validation', status: 'done', duration: 0.8 },
      { name: 'Company Lookup', status: 'running' },
      { name: 'Social Profile Scan', status: 'pending' },
      { name: 'Budget Estimation', status: 'pending' },
    ],
  },
  {
    id: 'eq3', leadName: 'Priya Sharma', status: 'pending',
    steps: [
      { name: 'Email Verification', status: 'pending' },
      { name: 'Phone Validation', status: 'pending' },
      { name: 'Company Lookup', status: 'pending' },
      { name: 'Social Profile Scan', status: 'pending' },
      { name: 'Budget Estimation', status: 'pending' },
    ],
  },
  {
    id: 'eq4', leadName: 'Sanjay Gupta', status: 'failed',
    steps: [
      { name: 'Email Verification', status: 'done', duration: 0.9 },
      { name: 'Phone Validation', status: 'error' },
      { name: 'Company Lookup', status: 'pending' },
      { name: 'Social Profile Scan', status: 'pending' },
      { name: 'Budget Estimation', status: 'pending' },
    ],
  },
];

// ── Demo Data: Market Intelligence ─────────────────────────────────────────
const INTEL_ALERTS: IntelAlert[] = [
  {
    id: 'ia1', type: 'competitor', title: 'IDP Education launched new UK scholarship portal',
    description: 'IDP released a dedicated UK scholarship matching tool with 200+ programs. Could impact our UK lead conversion rates.',
    severity: 'high', timestamp: '2 hours ago', source: 'Web Scraping', metric: 'UK Lead Share', change: -5,
  },
  {
    id: 'ia2', type: 'pricing', title: 'Australian university application fees increased 8%',
    description: 'Group of Eight universities raised application processing fees from AUD$100 to AUD$108 average.',
    severity: 'medium', timestamp: '5 hours ago', source: 'Price Monitor', metric: 'Avg App Fee (AU)', change: 8,
  },
  {
    id: 'ia3', type: 'trend', title: 'German tuition-free programs gaining 23% more interest',
    description: 'Search volume for "study in Germany free" from South Asia increased 23% YoY. Opportunity to capture demand.',
    severity: 'high', timestamp: '1 day ago', source: 'Google Trends', metric: 'Search Interest', change: 23,
  },
  {
    id: 'ia4', type: 'opportunity', title: 'New Canada SDS stream for Bangladesh applicants',
    description: 'Canada expanded Student Direct Stream to include Bangladesh. Faster visa processing = higher conversion potential.',
    severity: 'high', timestamp: '2 days ago', source: 'IRCC Updates', metric: 'Visa Approval Rate', change: 15,
  },
  {
    id: 'ia5', type: 'competitor', title: 'AECC Global running 50% off consultation promo',
    description: 'Competitor offering half-price consultations for next 2 weeks. May impact our new lead inflow.',
    severity: 'medium', timestamp: '3 days ago', source: 'Social Monitor', metric: 'Lead Inflow', change: -8,
  },
  {
    id: 'ia6', type: 'trend', title: 'IELTS One Skill Retake adoption at 67% of test centers',
    description: 'Most IELTS centers now offer one-skill retake. Students can improve scores without full retest.',
    severity: 'low', timestamp: '4 days ago', source: 'IELTS Updates', metric: 'Test Retake Rate', change: 12,
  },
];

const MARKET_TRENDS: MarketTrend[] = [
  { id: 'mt1', name: 'UK Student Visa Apps (BD)', direction: 'up', change: 12, category: 'Visa', data: [320, 345, 360, 380, 410] },
  { id: 'mt2', name: 'Canada Study Permits (BD)', direction: 'up', change: 18, category: 'Visa', data: [280, 310, 340, 360, 390] },
  { id: 'mt3', name: 'AU Int\'l Enrolments', direction: 'down', change: -6, category: 'Enrolment', data: [450, 440, 430, 425, 420] },
  { id: 'mt4', name: 'IELTS Test Volume (BD)', direction: 'up', change: 8, category: 'Testing', data: [500, 520, 535, 540, 560] },
  { id: 'mt5', name: 'Avg Consultation Fee', direction: 'stable', change: 1, category: 'Pricing', data: [150, 152, 150, 151, 152] },
  { id: 'mt6', name: 'Germany Program Interest', direction: 'up', change: 23, category: 'Interest', data: [100, 120, 150, 180, 220] },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function tierColor(tier: LeadTier) {
  if (tier === 'HOT') return 'bg-red-100 text-red-700 border-red-200';
  if (tier === 'WARM') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-blue-100 text-blue-600 border-blue-200';
}

function statusColor(status: EnrichStatus) {
  if (status === 'complete') return 'bg-emerald-100 text-emerald-700';
  if (status === 'enriching') return 'bg-amber-100 text-amber-700';
  if (status === 'pending') return 'bg-slate-100 text-slate-600';
  return 'bg-red-100 text-red-700';
}

function statusIcon(status: EnrichStatus) {
  if (status === 'complete') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'enriching') return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
  if (status === 'pending') return <Clock className="w-4 h-4 text-slate-400" />;
  return <AlertTriangle className="w-4 h-4 text-red-500" />;
}

function stepStatusIcon(status: string) {
  if (status === 'done') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === 'running') return <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />;
  if (status === 'error') return <CircleAlert className="w-3.5 h-3.5 text-red-500" />;
  return <Clock className="w-3.5 h-3.5 text-slate-300" />;
}

function severityColor(severity: string) {
  if (severity === 'high') return 'border-l-4 border-l-red-500 bg-red-50/50';
  if (severity === 'medium') return 'border-l-4 border-l-amber-500 bg-amber-50/50';
  return 'border-l-4 border-l-blue-400 bg-blue-50/30';
}

function intelIcon(type: IntelType) {
  switch (type) {
    case 'competitor': return <Siren className="w-4 h-4 text-red-500" />;
    case 'pricing': return <CircleDollarSign className="w-4 h-4 text-amber-500" />;
    case 'trend': return <TrendingUp className="w-4 h-4 text-blue-500" />;
    case 'opportunity': return <Zap className="w-4 h-4 text-emerald-500" />;
  }
}

function directionIcon(dir: 'up' | 'down' | 'stable') {
  if (dir === 'up') return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
  if (dir === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function sparkline(data: number[]) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke={PRIMARY_BLUE} strokeWidth="1.5" points={points} />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function LeadEnrichmentPage({ onBack, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState('scoring');
  const [selectedLead, setSelectedLead] = useState<EnrichedLead | null>(ENRICHED_LEADS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<string | null>(null);

  // Stats
  const totalLeads = ENRICHED_LEADS.length;
  const enrichedCount = ENRICHED_LEADS.filter(l => l.status === 'complete').length;
  const enrichingCount = ENRICHED_LEADS.filter(l => l.status === 'enriching').length;
  const pendingCount = ENRICHED_LEADS.filter(l => l.status === 'pending').length;
  const avgScore = Math.round(ENRICHED_LEADS.reduce((a, l) => a + l.score, 0) / totalLeads);

  const handleEnrichLead = useCallback(async (leadId: string) => {
    setIsEnriching(true);
    setEnrichResult(null);
    try {
      const res = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      setEnrichResult(data.message || 'Enrichment started successfully');
    } catch {
      setEnrichResult('Enrichment request failed');
    } finally {
      setIsEnriching(false);
    }
  }, []);

  const filteredLeads = ENRICHED_LEADS.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.courseInterest.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PRIMARY_BLUE }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Lead Enrichment Center</h1>
                <p className="text-xs text-slate-500">AI-powered scoring, enrichment & market intelligence</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Brain className="w-3 h-3 mr-1" /> AI Active
            </Badge>
            <Button size="sm" style={{ background: ORANGE_CTA }} className="text-white hover:opacity-90" onClick={() => handleEnrichLead('bulk')} disabled={isEnriching}>
              {isEnriching ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Enrich All Pending
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Leads', value: totalLeads, icon: <Users className="w-4 h-4" />, color: PRIMARY_BLUE },
            { label: 'Enriched', value: enrichedCount, icon: <CheckCircle2 className="w-4 h-4" />, color: ENRICH_GREEN },
            { label: 'Enriching', value: enrichingCount, icon: <Loader2 className="w-4 h-4" />, color: ENRICH_AMBER },
            { label: 'Pending', value: pendingCount, icon: <Clock className="w-4 h-4" />, color: '#94a3b8' },
            { label: 'Avg Score', value: avgScore, icon: <Award className="w-4 h-4" />, color: ORANGE_CTA },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 shadow-sm mb-4">
            <TabsTrigger value="scoring" className="gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Lead Scoring
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Enrichment Queue
            </TabsTrigger>
            <TabsTrigger value="profiles" className="gap-1.5">
              <Users className="w-3.5 h-3.5" /> Enriched Profiles
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-1.5">
              <Rss className="w-3.5 h-3.5" /> Market Intel
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Lead Scoring ──────────────────────────────────────── */}
          <TabsContent value="scoring">
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Lead List */}
              <div className="lg:col-span-1 space-y-2">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {filteredLeads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedLead?.id === lead.id
                          ? 'border-blue-300 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-slate-900">{lead.name}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${tierColor(lead.tier)}`}>{lead.tier}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{lead.courseInterest}</span>
                        <span className="text-sm font-bold" style={{ color: lead.score >= 80 ? ENRICH_GREEN : lead.score >= 60 ? ENRICH_AMBER : ENRICH_RED }}>
                          {lead.score}
                        </span>
                      </div>
                      <Progress value={lead.score} className="h-1 mt-1" />
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {statusIcon(lead.status)}
                        <span className="text-[10px] text-slate-400 capitalize">{lead.status}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{lead.lastActivity}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoring Detail */}
              <div className="lg:col-span-2">
                {selectedLead ? (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{selectedLead.name}</CardTitle>
                          <CardDescription>{selectedLead.email} • {selectedLead.targetCountry} • {selectedLead.courseInterest}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black" style={{ color: selectedLead.score >= 80 ? ENRICH_GREEN : selectedLead.score >= 60 ? ENRICH_AMBER : ENRICH_RED }}>
                            {selectedLead.score}
                          </div>
                          <Badge className={`text-xs ${tierColor(selectedLead.tier)}`}>{selectedLead.tier} Lead</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Score Breakdown */}
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                        <Brain className="w-4 h-4" style={{ color: PRIMARY_BLUE }} /> Scoring Factor Breakdown
                      </h4>
                      <div className="space-y-3 mb-6">
                        {selectedLead.factors.map((factor, i) => (
                          <div key={i} className="bg-white rounded-lg border border-slate-100 p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span style={{ color: factor.color }}>{factor.icon}</span>
                                <span className="text-sm font-medium text-slate-800">{factor.name}</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0">{factor.weight}% weight</Badge>
                              </div>
                              <span className="text-sm font-bold" style={{ color: factor.color }}>{factor.score}/100</span>
                            </div>
                            <Progress value={factor.score} className="h-2 mb-1" />
                            <p className="text-xs text-slate-500">{factor.reason}</p>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      {/* Scoring Algorithm Visualization */}
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4" style={{ color: PRIMARY_BLUE }} /> Composite Score Calculation
                      </h4>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex flex-wrap gap-2 items-center justify-center text-xs">
                          {selectedLead.factors.map((f, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-slate-400 font-mono">+</span>}
                              <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 text-center">
                                <div className="font-bold" style={{ color: f.color }}>{f.score}</div>
                                <div className="text-[10px] text-slate-500">× {f.weight / 100}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{f.name}</div>
                              </div>
                            </React.Fragment>
                          ))}
                          <span className="text-slate-400 font-mono">=</span>
                          <div className="rounded-lg px-3 py-1.5 text-center" style={{ background: `${PRIMARY_BLUE}15`, border: `1px solid ${PRIMARY_BLUE}30` }}>
                            <div className="text-lg font-black" style={{ color: PRIMARY_BLUE }}>{selectedLead.score}</div>
                            <div className="text-[10px] text-slate-500">Composite</div>
                          </div>
                        </div>
                      </div>

                      {/* Predicted Conversion */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                          <p className="text-xs text-emerald-600 mb-1">Predicted Conversion</p>
                          <p className="text-2xl font-bold text-emerald-700">{selectedLead.predictedConversion}%</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-blue-600 mb-1">Data Completeness</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {Math.round(selectedLead.factors.find(f => f.name === 'Profile Completeness')!.score)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-sm h-64 flex items-center justify-center">
                    <p className="text-slate-400">Select a lead to view scoring details</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 2: Enrichment Queue ──────────────────────────────────── */}
          <TabsContent value="queue">
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Pending', count: ENRICH_QUEUE.filter(q => q.status === 'pending').length, color: '#94a3b8', icon: <Clock className="w-4 h-4" /> },
                { label: 'In Progress', count: ENRICH_QUEUE.filter(q => q.status === 'enriching').length, color: ENRICH_AMBER, icon: <Loader2 className="w-4 h-4" /> },
                { label: 'Failed', count: ENRICH_QUEUE.filter(q => q.status === 'failed').length, color: ENRICH_RED, icon: <AlertTriangle className="w-4 h-4" /> },
              ].map((s, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                      <span style={{ color: s.color }}>{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              {ENRICH_QUEUE.map(item => (
                <Card key={item.id} className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                      {statusIcon(item.status)}
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900">{item.leadName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] ${statusColor(item.status)}`}>
                            {item.status}
                          </Badge>
                          {item.startedAt && <span className="text-[10px] text-slate-400">Started: {item.startedAt}</span>}
                        </div>
                      </div>
                      {item.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => handleEnrichLead(item.id)} disabled={isEnriching}>
                          <Play className="w-3 h-3 mr-1" /> Start
                        </Button>
                      )}
                      {item.status === 'failed' && (
                        <Button size="sm" variant="outline" onClick={() => handleEnrichLead(item.id)} disabled={isEnriching}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Retry
                        </Button>
                      )}
                    </div>
                    {/* Pipeline Steps */}
                    <div className="px-4 py-3 bg-slate-50/50">
                      <div className="flex items-center gap-1">
                        {item.steps.map((step, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                            <div className="flex items-center gap-1 bg-white rounded-md px-2 py-1 border border-slate-100">
                              {stepStatusIcon(step.status)}
                              <span className={`text-[10px] ${step.status === 'running' ? 'text-amber-600 font-medium' : step.status === 'done' ? 'text-emerald-600' : step.status === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
                                {step.name}
                              </span>
                              {step.duration && <span className="text-[9px] text-slate-300">{step.duration}s</span>}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {enrichResult && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">{enrichResult}</span>
              </div>
            )}
          </TabsContent>

          {/* ── Tab 3: Enriched Profiles ─────────────────────────────────── */}
          <TabsContent value="profiles">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ENRICHED_LEADS.filter(l => l.status === 'complete').map(lead => (
                <Card key={lead.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{lead.name}</h4>
                        <p className="text-xs text-slate-500">{lead.courseInterest}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: lead.score >= 80 ? ENRICH_GREEN : ENRICH_AMBER }}>{lead.score}</div>
                        <Badge className={`text-[9px] px-1 py-0 ${tierColor(lead.tier)}`}>{lead.tier}</Badge>
                      </div>
                    </div>

                    {/* Verification Badges */}
                    <div className="flex items-center gap-1.5 mb-3">
                      {lead.emailVerified && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 text-emerald-600 border-emerald-200">
                          <Verified className="w-3 h-3" /> Email
                        </Badge>
                      )}
                      {lead.phoneVerified && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 text-emerald-600 border-emerald-200">
                          <Verified className="w-3 h-3" /> Phone
                        </Badge>
                      )}
                      {!lead.emailVerified && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 text-slate-400 border-slate-200">
                          <CircleAlert className="w-3 h-3" /> Email Unverified
                        </Badge>
                      )}
                      {!lead.phoneVerified && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 text-slate-400 border-slate-200">
                          <CircleAlert className="w-3 h-3" /> Phone Unverified
                        </Badge>
                      )}
                    </div>

                    <Separator className="my-3" />

                    {/* Company Info */}
                    {lead.company && (
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Building2 className="w-3 h-3 text-slate-400" /> {lead.company}
                          <span className="text-slate-400">• {lead.companySize} employees</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Briefcase className="w-3 h-3 text-slate-400" /> {lead.industry}
                        </div>
                        {lead.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" /> {lead.location}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Budget & Timeline */}
                    {(lead.budget || lead.timeline) && (
                      <div className="flex items-center gap-3 mb-3">
                        {lead.budget && (
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <DollarSign className="w-3 h-3 text-emerald-500" /> {lead.budget}
                          </div>
                        )}
                        {lead.timeline && (
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <Calendar className="w-3 h-3 text-blue-500" /> {lead.timeline}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Social Profiles */}
                    {lead.socialProfiles.length > 0 && (
                      <div className="space-y-1 mb-3">
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Social Profiles</p>
                        {lead.socialProfiles.map((sp, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {sp.platform === 'LinkedIn' && <Linkedin className="w-3 h-3 text-blue-600" />}
                            {sp.platform === 'GitHub' && <Monitor className="w-3 h-3 text-slate-700" />}
                            {sp.platform === 'Twitter' && <Globe className="w-3 h-3 text-sky-500" />}
                            <span className="text-slate-700">{sp.platform}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{sp.followers?.toLocaleString()} followers</span>
                            {sp.verified && <Verified className="w-3 h-3 text-blue-500" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contact */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        <Phone className="w-3 h-3" /> Call
                      </Button>
                      {lead.linkedin && (
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          <Linkedin className="w-3 h-3" /> LinkedIn
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Tab 4: Market Intelligence ───────────────────────────────── */}
          <TabsContent value="intelligence">
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Intel Alerts */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Rss className="w-4 h-4" style={{ color: PRIMARY_BLUE }} /> Intelligence Feed
                </h3>
                {INTEL_ALERTS.map(alert => (
                  <Card key={alert.id} className={`border-0 shadow-sm overflow-hidden ${severityColor(alert.severity)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{intelIcon(alert.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-slate-900">{alert.title}</h4>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {alert.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span>{alert.timestamp}</span>
                            <span>•</span>
                            <span>{alert.source}</span>
                            {alert.metric && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-slate-600">{alert.metric}</span>
                              </>
                            )}
                            {alert.change !== undefined && (
                              <span className={`font-bold ${alert.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {alert.change > 0 ? '+' : ''}{alert.change}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Market Trends */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: PRIMARY_BLUE }} /> Market Trends
                </h3>
                {MARKET_TRENDS.map(trend => (
                  <Card key={trend.id} className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {directionIcon(trend.direction)}
                          <span className="text-sm font-medium text-slate-800">{trend.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px]">
                          {trend.category}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${trend.direction === 'up' ? 'text-emerald-600' : trend.direction === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
                          {trend.change > 0 ? '+' : ''}{trend.change}%
                        </span>
                        {sparkline(trend.data)}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Competitor Watch */}
                <Separator className="my-2" />
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-3 mb-2">
                  <Siren className="w-4 h-4 text-red-500" /> Competitor Watch
                </h3>
                {[
                  { name: 'IDP Education', status: 'Active', threat: 'high', recentAction: 'New UK portal launch' },
                  { name: 'AECC Global', status: 'Promotional', threat: 'medium', recentAction: '50% off consultations' },
                  { name: 'SI-UK', status: 'Stable', threat: 'low', recentAction: 'No new activity' },
                  { name: 'The Chopras', status: 'Declining', threat: 'low', recentAction: 'Reduced ad spend' },
                ].map((comp, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{comp.name}</span>
                      <Badge variant="outline" className={`text-[9px] ${comp.threat === 'high' ? 'text-red-600 border-red-200' : comp.threat === 'medium' ? 'text-amber-600 border-amber-200' : 'text-slate-500 border-slate-200'}`}>
                        {comp.threat} threat
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500">{comp.status}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-600">{comp.recentAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default LeadEnrichmentPage;
