'use client';

import {
  Search,
  Sparkles,
  GraduationCap,
  FileCheck,
  Wallet,
  UserCheck,
  ArrowRight,
  Video,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Brain,
  Eye,
  Globe,
  BookOpen,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface NexAbroadDashboardProps {
  onBack: () => void;
}

interface MatchedUniversity {
  name: string;
  country: string;
  flag: string;
  tuition: string;
  match: number;
  color: string;
  initials: string;
}

interface Scholarship {
  name: string;
  amount: string;
}

interface CounselorStudent {
  name: string;
  program: string;
  university: string;
  status: 'SOP Generated' | 'Docs Pending' | 'Ready to Submit';
  confidence: number;
  statusColor: string;
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */

const MATCHED_UNIVERSITIES: MatchedUniversity[] = [
  {
    name: 'University of Manchester',
    country: 'UK',
    flag: '🇬🇧',
    tuition: '£28,000/yr',
    match: 98.4,
    color: '#3B82F6',
    initials: 'UoM',
  },
  {
    name: 'TU Munich',
    country: 'Germany',
    flag: '🇩🇪',
    tuition: '€3,000/sem',
    match: 95.1,
    color: '#1E40AF',
    initials: 'TUM',
  },
  {
    name: 'University of Toronto',
    country: 'Canada',
    flag: '🇨🇦',
    tuition: 'C$42,000/yr',
    match: 91.7,
    color: '#60A5FA',
    initials: 'UoT',
  },
];

const SCHOLARSHIPS: Scholarship[] = [
  { name: 'Chevening Scholarship', amount: '£5,000' },
  { name: 'DAAD Grant', amount: '€3,000' },
];

const COUNSELOR_QUEUE: CounselorStudent[] = [
  {
    name: 'Fatima Akter',
    program: 'MSc Data Analytics',
    university: 'Hertfordshire',
    status: 'SOP Generated',
    confidence: 94,
    statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    name: 'Karim Hossain',
    program: 'MSc Petroleum Eng',
    university: 'Dundee',
    status: 'Docs Pending',
    confidence: 87,
    statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    name: 'Nusrat Jahan',
    program: 'MSc Biomedical',
    university: 'Aberdeen',
    status: 'Ready to Submit',
    confidence: 96,
    statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
];

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENT: Global Navigation
   ═══════════════════════════════════════════════════════════════ */

function GlobalNav({ onBack }: { onBack: () => void }) {
  return (
    <nav className="sticky top-0 z-50 nx-glass border-b border-white/5">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-4 px-4 md:px-6 py-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onBack}
            className="hidden sm:flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors"
          >
            <ArrowRight className="w-3 h-3 rotate-180" />
            <span>Back to ALO Education</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tight">NX</span>
            </div>
            <span className="text-white font-semibold text-base hidden sm:block">
              NexAbroad AI
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search students, universities, courses..."
              className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-500 text-[10px] font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: AI Badge + Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="nx-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 text-xs font-medium">70% AI Engine Active</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border border-white/10">
            <span className="text-white text-xs font-semibold">AK</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENT: AI Eligibility Engine Card (TALL)
   ═══════════════════════════════════════════════════════════════ */

function EligibilityEngineCard() {
  return (
    <div className="nx-glass rounded-3xl p-6 nx-bento-lift flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">AI Eligibility Engine</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Predictive matching against 12,000+ universities
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          <Brain className="w-3 h-3 text-blue-400" />
          <span className="text-blue-400 text-[10px] font-medium">GPT-4o</span>
        </div>
      </div>

      {/* Match Score Ring */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24 shrink-0">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(#3B82F6 0% ${98.4}%, rgba(255,255,255,0.06) ${98.4}% 100%)`,
            }}
          />
          <div className="absolute inset-[3px] rounded-full bg-[#0F172A] flex items-center justify-center">
            <div className="text-center">
              <span className="nx-text-gradient text-2xl font-bold">98.4%</span>
              <p className="text-gray-500 text-[9px] mt-0.5">Match Score</p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-300 text-sm leading-relaxed">
            Based on your academic profile, IELTS 7.0, and 3+ years work experience, you are an{' '}
            <span className="text-white font-medium">exceptional candidate</span> for these programs.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Globe className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500 text-xs">3 countries · 12 programs matched</span>
          </div>
        </div>
      </div>

      {/* Matched University Mini-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {MATCHED_UNIVERSITIES.map((uni) => (
          <div
            key={uni.name}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${uni.color}20` }}
            >
              <span className="text-xs font-bold" style={{ color: uni.color }}>
                {uni.initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate group-hover:text-blue-300 transition-colors">
                {uni.flag} {uni.name}
              </p>
              <p className="text-gray-500 text-[10px] mt-0.5">{uni.tuition}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-medium">
                {uni.match}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Scholarship Grants */}
      <div className="mb-6">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2.5">
          Scholarship Grants
        </p>
        <div className="flex flex-col gap-2">
          {SCHOLARSHIPS.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-300 text-xs">{s.name}</span>
              </div>
              <span className="text-emerald-400 text-xs font-semibold">+{s.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer to push button down */}
      <div className="flex-1" />

      {/* Apply Button */}
      <button className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm hover:from-orange-400 hover:to-orange-500 transition-all nx-glow-orange active:scale-[0.98]">
        <span>Apply to Top Match</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENT: Target Campus Preview Card
   ═══════════════════════════════════════════════════════════════ */

function TargetCampusCard() {
  const infoItems = [
    { icon: Wallet, label: 'Tuition', value: '£28,000/yr' },
    { icon: Clock, label: 'Intake', value: 'Sep 2026' },
    { icon: BookOpen, label: 'Duration', value: '12 months' },
    { icon: Award, label: 'Ranking', value: '#51 QS' },
  ];

  return (
    <div className="nx-glass rounded-3xl p-6 nx-bento-lift flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-purple-400" />
        </div>
        <h2 className="text-white font-semibold text-sm">Target Campus</h2>
      </div>

      {/* Campus Photo */}
      <div className="relative rounded-2xl overflow-hidden mb-4">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=300&fit=crop"
          alt="University of Manchester campus"
          className="w-full h-36 md:h-40 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
            🇬🇧 United Kingdom
          </span>
        </div>
      </div>

      {/* University Info */}
      <h3 className="text-white font-semibold text-sm mb-0.5">University of Manchester</h3>
      <p className="text-gray-500 text-xs mb-4">Manchester, UK</p>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {infoItems.map((item) => (
          <div
            key={item.label}
            className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <item.icon className="w-3 h-3 text-gray-500" />
              <span className="text-gray-500 text-[10px] uppercase tracking-wider">
                {item.label}
              </span>
            </div>
            <p className="text-white text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Deadline Badge */}
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <Clock className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-orange-300 text-xs font-medium">
          Application Deadline: 15 Jan 2026
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENT: OCR Document Vault Card
   ═══════════════════════════════════════════════════════════════ */

function DocumentVaultCard() {
  return (
    <div className="nx-glass rounded-3xl p-6 nx-bento-lift flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <h2 className="text-white font-semibold text-sm">Document Vault</h2>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          <Zap className="w-3 h-3 text-blue-400" />
          <span className="text-blue-400 text-[10px] font-medium">AI OCR Extracted</span>
        </span>
      </div>

      {/* Document Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Passport Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 border-l-2 border-l-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="text-white text-xs font-semibold">Bangladeshi Passport</h3>
          </div>
          <div className="space-y-1.5">
            <p className="text-gray-400 text-[11px]">
              <span className="text-gray-500">Name:</span>{' '}
              <span className="text-gray-300">RAHIM UDDIN</span>
            </p>
            <p className="text-gray-400 text-[11px]">
              <span className="text-gray-500">DOB:</span>{' '}
              <span className="text-gray-300">15 Mar 2000</span>
            </p>
            <p className="text-gray-400 text-[11px]">
              <span className="text-gray-500">Passport No:</span>{' '}
              <span className="text-gray-300">MN0123456</span>
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="nx-badge-verified text-xs font-semibold">✓ Verified</span>
          </div>
        </div>

        {/* IELTS Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 border-l-2 border-l-orange-500">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-orange-400" />
            <h3 className="text-white text-xs font-semibold">IELTS Academic</h3>
          </div>
          <div className="mb-2">
            <p className="text-gray-500 text-[10px] mb-1">Overall Band</p>
            <div className="flex items-center gap-2">
              <span className="text-white text-lg font-bold">7.0</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                  style={{ width: '70%' }}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { label: 'L', score: 7.5 },
              { label: 'R', score: 7.0 },
              { label: 'W', score: 6.5 },
              { label: 'S', score: 7.0 },
            ].map((band) => (
              <div
                key={band.label}
                className="text-center p-1.5 rounded-lg bg-white/[0.03]"
              >
                <span className="text-gray-500 text-[9px] block">{band.label}</span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    band.score >= 7.0 ? 'text-emerald-400' : 'text-amber-400',
                  )}
                >
                  {band.score}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="nx-badge-verified text-xs font-semibold">✓ Verified</span>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      <div className="flex-1" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">
          Upload Progress
        </span>
        <span className="text-gray-400 text-xs font-medium">2 of 8 documents</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
          style={{ width: '25%' }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENT: FinTech & Blocked Account Hub Card
   ═══════════════════════════════════════════════════════════════ */

function FinTechHubCard() {
  return (
    <div className="nx-glass rounded-3xl p-6 nx-bento-lift flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-emerald-400" />
        </div>
        <h2 className="text-white font-semibold text-sm">FinTech Hub</h2>
      </div>

      {/* Germany Blocked Account */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white text-xs font-semibold">Germany Blocked Account</h3>
            <p className="text-gray-500 text-[10px] mt-0.5">Expatrio · Sperrkonto</p>
          </div>
          <span className="text-white text-sm font-bold">75.8%</span>
        </div>
        {/* Dual Progress Bar */}
        <div className="relative h-2.5 rounded-full overflow-hidden mb-2.5">
          {/* Blue: required amount (full) */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full" />
          {/* Orange: deposited amount */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
            style={{ width: '75.8%' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">
            <span className="text-orange-400 font-semibold">€8,500</span>{' '}
            <span className="text-gray-600">/</span> €11,208 deposited
          </span>
          <span className="text-gray-500 text-[10px]">€2,708 remaining</span>
        </div>
      </div>

      {/* UK CAS Loan */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white text-xs font-semibold">UK CAS Loan</h3>
            <p className="text-gray-500 text-[10px] mt-0.5">Financial Guarantee</p>
          </div>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 text-[10px] font-medium">In Review</span>
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden mb-2.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
            style={{ width: '60%' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">
            <span className="text-blue-400 font-semibold">£12,000</span>{' '}
            <span className="text-gray-600">/</span> £20,000 approved
          </span>
          <span className="text-gray-500 text-[10px]">60% Complete</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Action Link */}
      <button className="flex items-center gap-1.5 text-gray-400 hover:text-orange-400 text-xs transition-colors group">
        <span>Manage FinTech Profile</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENT: Counselor Approval Panel Card
   ═══════════════════════════════════════════════════════════════ */

function CounselorPanelCard() {
  return (
    <div className="nx-glass rounded-3xl p-6 nx-bento-lift flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">Counselor Review Panel</h2>
            <p className="text-gray-500 text-[10px] mt-0.5">30% Human oversight layer</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold">
          3 Pending
        </span>
      </div>

      {/* Student Queue */}
      <div className="flex flex-col gap-2.5 mb-5">
        {COUNSELOR_QUEUE.map((student) => (
          <div
            key={student.name}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-blue-700/30 flex items-center justify-center shrink-0 border border-white/5">
              <span className="text-white text-[10px] font-semibold">
                {student.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{student.name}</p>
              <p className="text-gray-500 text-[10px] truncate">
                {student.program} @ {student.university}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[9px] font-medium border',
                    student.statusColor,
                  )}
                >
                  {student.status}
                </span>
                <span className="text-gray-500 text-[9px]">
                  Confidence: {student.confidence}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                <Eye className="w-3.5 h-3.5" />
              </button>
              {student.status === 'Ready to Submit' ? (
                <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-semibold hover:from-orange-400 hover:to-orange-500 transition-all">
                  Approve
                </button>
              ) : (
                <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[10px] font-medium hover:bg-white/10 transition-colors">
                  Review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Nusrat's SOP Preview + Confidence */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">
              AI-Generated SOP Preview
            </p>
            <p className="text-gray-300 text-xs leading-relaxed italic">
              &ldquo;My passion for biomedical engineering was ignited during my undergraduate research on
              diagnostic microfluidics at BUET. The MSc Biomedical Engineering program at the University
              of Aberdeen offers the perfect convergence of&hellip;&rdquo;
            </p>
          </div>
          {/* Confidence Ring */}
          <div className="relative w-16 h-16 shrink-0">
            <div
              className="w-full h-full rounded-full nx-confidence-ring"
              style={{ '--nx-confidence': '96%' } as React.CSSProperties}
            />
            <div className="absolute inset-[3px] rounded-full bg-[#0F172A] flex items-center justify-center">
              <span className="nx-text-gradient text-sm font-bold">96%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm hover:from-orange-400 hover:to-orange-500 transition-all nx-glow-orange active:scale-[0.98]">
          <CheckCircle className="w-4 h-4" />
          <span>Approve & Submit Application</span>
        </button>
        <button className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <Video className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: NexAbroad AI Super-CRM Dashboard
   ═══════════════════════════════════════════════════════════════ */

export default function NexAbroadDashboard({ onBack }: NexAbroadDashboardProps) {
  return (
    <>
    <style>{`
      .nx-glass{background:rgba(15,23,42,0.55);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,0.07);box-shadow:0 4px 30px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.05)}
      .nx-glass-light{background:rgba(30,41,59,0.45);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%);border:1px solid rgba(255,255,255,0.06)}
      .nx-glass-accent{background:rgba(30,64,175,0.2);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(30,64,175,0.3);box-shadow:0 0 20px rgba(30,64,175,0.1)}
      .nx-glass-orange{background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);box-shadow:0 0 20px rgba(249,115,22,0.05)}
      .nx-glow-orange{box-shadow:0 0 40px rgba(249,115,22,0.2),0 0 80px rgba(249,115,22,0.08)}
      .nx-bento-lift{transition:transform 0.35s cubic-bezier(0.22,1,0.36,1),box-shadow 0.35s cubic-bezier(0.22,1,0.36,1),border-color 0.35s ease}
      .nx-bento-lift:hover{transform:translateY(-2px);border-color:rgba(255,255,255,0.12);box-shadow:0 8px 40px rgba(0,0,0,0.25),0 0 30px rgba(30,64,175,0.08)}
      .nx-text-gradient{background:linear-gradient(135deg,#F97316 0%,#F59E0B 50%,#FBBF24 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
      .nx-badge-verified{background:linear-gradient(90deg,#10B981 0%,#34D399 40%,#10B981 80%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:nx-badge-shimmer 3s linear infinite}
      @keyframes nx-badge-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      @keyframes nx-ping{0%{transform:scale(1);opacity:0.8}75%,100%{transform:scale(2.2);opacity:0}}
      .nx-ping{animation:nx-ping 1.5s cubic-bezier(0,0,0.2,1) infinite}
    `}</style>
    <div className="min-h-screen" style={{
      background: 'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(30,64,175,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(249,115,22,0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 60%), #0A0E1A'
    }}>
      <GlobalNav onBack={onBack} />

      <main className="mx-auto max-w-[1440px] px-4 md:px-6 py-6">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Row 1-2: AI Eligibility Engine (TALL, spans 2 rows) */}
          <div className="lg:col-span-7 lg:row-span-2">
            <EligibilityEngineCard />
          </div>

          {/* Row 1: Target Campus Preview */}
          <div className="lg:col-span-5">
            <TargetCampusCard />
          </div>

          {/* Row 1: OCR Document Vault */}
          <div className="lg:col-span-5">
            <DocumentVaultCard />
          </div>

          {/* Row 2: FinTech Hub */}
          <div className="lg:col-span-5">
            <FinTechHubCard />
          </div>

          {/* Row 2: Counselor Approval Panel */}
          <div className="lg:col-span-7">
            <CounselorPanelCard />
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
