"use client";

/**
 * NexAbroad AI — Next-Generation EdTech Super-CRM
 * ================================================
 * 70% AI Automated + 30% Human Approval
 *
 * Bento Grid 2.0 with Glassmorphism
 * Deep Space Blue + Royal Blue + Vivid Orange
 *
 * Cards:
 * 1. AI Eligibility Engine — matched universities + 1-click apply
 * 2. Target Campus Preview — university photo + tuition + deadlines
 * 3. OCR Document Vault — passport/IELTS with verification badges
 * 4. FinTech & Blocked Account Hub — progress bar for deposits
 * 5. Counselor Approval Panel — approve & submit + confidence score
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Icon,
} from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───
interface MatchedUniversity {
  name: string;
  country: string;
  flag: string;
  matchScore: number;
  tuition: string;
  scholarship: string;
  deadline: string;
  image: string;
}

interface OCRDocument {
  id: string;
  type: "PASSPORT" | "IELTS" | "TRANSCRIPT" | "CV";
  name: string;
  verified: boolean;
  confidence: number;
  extractedData: { label: string; value: string }[];
  thumbnail: string;
}

interface PendingApproval {
  id: string;
  studentName: string;
  studentAvatar: string;
  university: string;
  course: string;
  sopConfidence: number;
  ocrConfidence: number;
  matchConfidence: number;
  overallConfidence: number;
  status: "PENDING" | "REVIEWING";
}

// ─── Mock Data (realistic) ───
const MATCHED_UNIVERSITIES: MatchedUniversity[] = [
  {
    name: "University of Birmingham",
    country: "United Kingdom",
    flag: "🇬🇧",
    matchScore: 98.4,
    tuition: "£24,000/year",
    scholarship: "£5,000 Global Excellence",
    deadline: "Jan 15, 2027",
    image: "https://images.unsplash.com/photo-1562774053-701939366bbc?w=800&q=80",
  },
  {
    name: "University of Toronto",
    country: "Canada",
    flag: "🇨🇦",
    matchScore: 95.2,
    tuition: "CAD $32,000/year",
    scholarship: "CAD $10,000 Lester B. Pearson",
    deadline: "Jan 10, 2027",
    image: "https://images.unsplash.com/photo-1592280771190-3e2e4d571329?w=800&q=80",
  },
  {
    name: "University of Melbourne",
    country: "Australia",
    flag: "🇦🇺",
    matchScore: 92.8,
    tuition: "AUD $38,000/year",
    scholarship: "AUD $8,000 Merit",
    deadline: "Feb 28, 2027",
    image: "https://images.unsplash.com/photo-1571987499613-4afc3f452d62?w=800&q=80",
  },
];

const OCR_DOCUMENTS: OCRDocument[] = [
  {
    id: "doc-1",
    type: "PASSPORT",
    name: "Passport.pdf",
    verified: true,
    confidence: 99.2,
    extractedData: [
      { label: "Full Name", value: "Tanvir Ahmed" },
      { label: "Passport No", value: "BR0123456" },
      { label: "Nationality", value: "Bangladeshi" },
      { label: "DOB", value: "15 Mar 2002" },
    ],
    thumbnail: "https://images.unsplash.com/photo-1633675104092-ede08f5a5c29?w=400&q=80",
  },
  {
    id: "doc-2",
    type: "IELTS",
    name: "IELTS_Result.pdf",
    verified: true,
    confidence: 100,
    extractedData: [
      { label: "Overall", value: "7.5" },
      { label: "Reading", value: "8.0" },
      { label: "Writing", value: "7.0" },
      { label: "Speaking", value: "7.5" },
    ],
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80",
  },
  {
    id: "doc-3",
    type: "TRANSCRIPT",
    name: "BSc_CSE_Transcript.pdf",
    verified: true,
    confidence: 97.8,
    extractedData: [
      { label: "Degree", value: "BSc Computer Science" },
      { label: "GPA", value: "3.78 / 4.00" },
      { label: "University", value: "BUET" },
      { label: "Year", value: "2024" },
    ],
    thumbnail: "https://images.unsplash.com/photo-1524174354095-251a4f6561c5?w=400&q=80",
  },
];

const PENDING_APPROVALS: PendingApproval[] = [
  {
    id: "app-1",
    studentName: "Tanvir Ahmed",
    studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    university: "University of Birmingham",
    course: "MSc Data Science",
    sopConfidence: 94,
    ocrConfidence: 99,
    matchConfidence: 98,
    overallConfidence: 97,
    status: "PENDING",
  },
  {
    id: "app-2",
    studentName: "Fatima Khan",
    studentAvatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80",
    university: "University of Toronto",
    course: "MASc Computer Engineering",
    sopConfidence: 91,
    ocrConfidence: 97,
    matchConfidence: 95,
    overallConfidence: 94,
    status: "PENDING",
  },
];

const AI_PIPELINE_STATS = {
  ocrProcessed: 47,
  sopsDrafted: 23,
  matchesGenerated: 156,
  applicationsStaged: 12,
  humanApprovalsPending: 5,
};

// ════════════════════════════════════════════════════════════════
// MAIN VIEW
// ════════════════════════════════════════════════════════════════
export function NexAbroadDashboard() {
  const { toast } = useToast();
  const [approvals, setApprovals] = React.useState(PENDING_APPROVALS);

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Application Approved & Submitted",
      description: "Student notified. University portal submission triggered automatically.",
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#F8FAFC]">
      {/* ═══ GLOBAL NAVIGATION ═══ */}
      <NexAbroadNav />

      {/* ═══ AI PIPELINE STATUS BAR ═══ */}
      <AIPipelineBar stats={AI_PIPELINE_STATS} />

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        {/* Hero Banner */}
        <div className="mb-8">
          <div className="nx-glass nx-glass-glow-orange p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="nx-pulse flex size-3 rounded-full bg-[#F97316]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">70% AI Engine Active</span>
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">
                  Your AI Co-Pilot is{" "}
                  <span className="bg-gradient-to-r from-[#F97316] to-[#EA580C] bg-clip-text text-transparent">
                    working
                  </span>
                </h1>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  {AI_PIPELINE_STATS.ocrProcessed} documents OCR'd · {AI_PIPELINE_STATS.sopsDrafted} SOPs drafted · {AI_PIPELINE_STATS.matchesGenerated} university matches generated
                </p>
              </div>
              <div className="flex gap-3">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="nx-btn-glow bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white hover:opacity-90 rounded-2xl px-6">
                  <Icon name="Sparkles" className="mr-2 size-4" />
                  Run AI Pipeline
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl px-6">
                  <Icon name="Video" className="mr-2 size-4" />
                  Live Connect
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BENTO GRID ═══ */}
        <div className="nx-bento">
          {/* Card 1: AI Eligibility Engine — span 5 */}
          <div className="nx-bento-sm lg:nx-bento-lg" style={{ gridColumn: "span 5" }}>
            <EligibilityEngineCard universities={MATCHED_UNIVERSITIES} />
          </div>

          {/* Card 2: Target Campus Preview — span 4 */}
          <div style={{ gridColumn: "span 4" }}>
            <CampusPreviewCard university={MATCHED_UNIVERSITIES[0]} />
          </div>

          {/* Card 3: OCR Document Vault — span 3 */}
          <div className="nx-bento-sm" style={{ gridColumn: "span 3" }}>
            <OCRVaultCard documents={OCR_DOCUMENTS} />
          </div>

          {/* Card 4: FinTech & Blocked Account Hub — span 6 */}
          <div className="nx-bento-md" style={{ gridColumn: "span 6" }}>
            <FinTechCard />
          </div>

          {/* Card 5: Counselor Approval Panel — span 6 */}
          <div className="nx-bento-md" style={{ gridColumn: "span 6" }}>
            <CounselorApprovalCard
              approvals={approvals}
              onApprove={handleApprove}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════════
function NexAbroadNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0E1A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F97316] to-[#1E40AF] text-lg font-black text-white">
            N
          </div>
          <div>
            <p className="text-base font-black tracking-tight">NexAbroad</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#64748B]">AI EdTech Platform</p>
          </div>
        </div>

        {/* Search */}
        <div className="hidden flex-1 px-8 lg:block">
          <div className="relative max-w-md">
            <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search students, universities, applications..."
              className="h-9 w-full rounded-xl border border-white/5 bg-white/5 pl-9 pr-16 text-sm text-white placeholder:text-[#64748B] focus:border-[#F97316]/40 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-[#64748B]">⌘K</kbd>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="nx-ai-active hidden items-center gap-2 rounded-full border border-[#F97316]/20 px-3 py-1.5 sm:flex">
            <span className="nx-pulse flex size-2 rounded-full bg-[#F97316]" />
            <span className="text-xs font-semibold text-[#F97316]">AI Engine Active</span>
          </div>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="relative text-[#94A3B8] hover:bg-white/5 hover:text-white">
            <Icon name="Bell" className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#F97316]" />
          </Button>
          <Avatar className="size-9 border border-white/10">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658c42c2b1f?w=100&q=80" />
            <AvatarFallback className="bg-[#1E40AF] text-xs font-bold text-white">RA</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

// ════════════════════════════════════════════════════════════════
// AI PIPELINE STATUS BAR
// ════════════════════════════════════════════════════════════════
function AIPipelineBar({ stats }: { stats: typeof AI_PIPELINE_STATS }) {
  const items = [
    { label: "OCR Processed", value: stats.ocrProcessed, icon: "ScanText", color: "text-[#3B82F6]" },
    { label: "SOPs Drafted", value: stats.sopsDrafted, icon: "FileText", color: "text-[#F97316]" },
    { label: "Matches Generated", value: stats.matchesGenerated, icon: "Target", color: "text-[#22C55E]" },
    { label: "Applications Staged", value: stats.applicationsStaged, icon: "Send", color: "text-[#3B82F6]" },
    { label: "Human Approvals Pending", value: stats.humanApprovalsPending, icon: "UserCheck", color: "text-[#FBBF24]" },
  ];

  return (
    <div className="border-b border-white/5 bg-[#0F172A]/50">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 overflow-x-auto px-4 py-2.5 lg:px-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] whitespace-nowrap">AI Pipeline</span>
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 whitespace-nowrap">
            <Icon name={item.icon} className={cn("size-3.5", item.color)} />
            <span className="text-sm font-bold text-white">{item.value}</span>
            <span className="text-xs text-[#64748B]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CARD 1: AI ELIGIBILITY ENGINE
// ════════════════════════════════════════════════════════════════
function EligibilityEngineCard({ universities }: { universities: MatchedUniversity[] }) {
  return (
    <div className="nx-glass h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C]">
            <Icon name="BrainCircuit" className="size-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Eligibility Engine</h3>
            <p className="text-xs text-[#64748B]">Predictive match against 12,000+ universities</p>
          </div>
        </div>
        <Badge className="border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]">
          <Icon name="Zap" className="mr-1 size-3" />
          Live
        </Badge>
      </div>

      {/* Matched Universities */}
      <div className="mt-5 space-y-3">
        {universities.map((uni, i) => (
          <div
            key={uni.name}
            className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-3 transition-all hover:border-[#F97316]/20 hover:bg-white/8"
          >
            {/* Match Score Circle */}
            <div className="relative flex size-14 shrink-0 items-center justify-center">
              <svg className="size-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke={i === 0 ? "#F97316" : i === 1 ? "#3B82F6" : "#22C55E"}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - uni.matchScore / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="absolute text-sm font-bold text-white">{uni.matchScore}%</span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{uni.flag}</span>
                <p className="truncate text-sm font-bold text-white">{uni.name}</p>
              </div>
              <p className="text-xs text-[#64748B]">{uni.tuition} · {uni.deadline}</p>
              <div className="mt-1 flex items-center gap-1">
                <Icon name="Award" className="size-3 text-[#F97316]" />
                <span className="text-xs font-medium text-[#F97316]">{uni.scholarship}</span>
              </div>
            </div>

            {/* 1-Click Apply */}
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
              size="sm"
              className="shrink-0 bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white hover:opacity-90 rounded-xl"
            >
              <Icon name="Zap" className="mr-1 size-3" />
              1-Click Apply
            </Button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs text-[#64748B]">Visa probability calculated from 847 data points</span>
        <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="text-xs font-semibold text-[#3B82F6] hover:underline">
          View all 156 matches →
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CARD 2: TARGET CAMPUS PREVIEW
// ════════════════════════════════════════════════════════════════
function CampusPreviewCard({ university }: { university: MatchedUniversity }) {
  return (
    <div className="nx-glass nx-glass-glow-blue h-full overflow-hidden p-0">
      {/* Campus Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={university.image}
          alt={`${university.name} campus`}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{university.flag}</span>
            <div>
              <h3 className="text-sm font-bold text-white drop-shadow-lg">{university.name}</h3>
              <p className="text-xs text-white/70">{university.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Tuition Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#94A3B8]">Tuition</span>
            <span className="font-bold text-white">{university.tuition}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#94A3B8]">Scholarship</span>
            <span className="font-bold text-[#F97316]">{university.scholarship}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#94A3B8]">Net Cost</span>
            <span className="font-bold text-[#22C55E]">£19,000/year</span>
          </div>
        </div>

        {/* Deadline */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 p-3">
          <Icon name="CalendarClock" className="size-4 text-[#FBBF24]" />
          <div>
            <p className="text-xs font-semibold text-[#FBBF24]">Application Deadline</p>
            <p className="text-sm font-bold text-white">{university.deadline}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl">
            <Icon name="MapPin" className="mr-1 size-3" />
            Campus Tour
          </Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="flex-1 bg-[#1E40AF] text-white hover:bg-[#1E3A8A] rounded-xl">
            <Icon name="BookOpen" className="mr-1 size-3" />
            Courses
          </Button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CARD 3: OCR DOCUMENT VAULT
// ════════════════════════════════════════════════════════════════
function OCRVaultCard({ documents }: { documents: OCRDocument[] }) {
  const typeIcons: Record<string, string> = {
    PASSPORT: "BookUser",
    IELTS: "FileText",
    TRANSCRIPT: "GraduationCap",
    CV: "FileUser",
  };

  return (
    <div className="nx-glass h-full p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1E40AF]">
            <Icon name="ScanText" className="size-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">OCR Vault</h3>
            <p className="text-[10px] text-[#64748B]">AI-extracted & verified</p>
          </div>
        </div>
        <Badge className="border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]">
          <Icon name="ShieldCheck" className="mr-1 size-2.5" />
          {documents.length} verified
        </Badge>
      </div>

      {/* Document Cards */}
      <div className="mt-4 space-y-2.5">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group rounded-xl border border-white/5 bg-white/5 p-3 transition-all hover:border-white/10 hover:bg-white/8"
          >
            <div className="flex items-center gap-2.5">
              {/* Document Icon */}
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <Icon name={typeIcons[doc.type] || "File"} className="size-4 text-[#3B82F6]" />
              </div>

              {/* Name + Confidence */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{doc.name}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="text-[10px] text-[#22C55E]">{doc.confidence}% confidence</span>
                </div>
              </div>

              {/* Verified Badge */}
              {doc.verified && (
                <div className="flex size-5 items-center justify-center rounded-full bg-[#22C55E]/20">
                  <Icon name="Check" className="size-3 text-[#22C55E]" />
                </div>
              )}
            </div>

            {/* Extracted Data Preview */}
            <div className="mt-2 grid grid-cols-2 gap-1">
              {doc.extractedData.slice(0, 2).map((data) => (
                <div key={data.label} className="text-[10px]">
                  <span className="text-[#64748B]">{data.label}: </span>
                  <span className="font-semibold text-[#94A3B8]">{data.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upload */}
      <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-medium text-[#64748B] transition-colors hover:border-[#F97316]/30 hover:text-[#F97316]">
        <Icon name="Upload" className="size-3.5" />
        Upload new document
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CARD 4: FINTECH & BLOCKED ACCOUNT HUB
// ════════════════════════════════════════════════════════════════
function FinTechCard() {
  const blockedAccount = { target: 11208, current: 11208, currency: "€" };
  const tuitionDeposit = { target: 24000, current: 12000, currency: "£" };
  const livingCost = { target: 12000, current: 6000, currency: "£" };

  const blockedPct = (blockedAccount.current / blockedAccount.target) * 100;
  const tuitionPct = (tuitionDeposit.current / tuitionDeposit.target) * 100;
  const livingPct = (livingCost.current / livingCost.target) * 100;

  return (
    <div className="nx-glass h-full p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22C55E] to-[#15803D]">
            <Icon name="Wallet" className="size-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">FinTech & Blocked Account</h3>
            <p className="text-xs text-[#64748B]">Germany Blocked Account + UK CAS financial readiness</p>
          </div>
        </div>
        <Badge className="border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]">
          <Icon name="CheckCircle2" className="mr-1 size-3" />
          Ready
        </Badge>
      </div>

      {/* Progress Bars */}
      <div className="mt-5 space-y-4">
        {/* Germany Blocked Account */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">🇩🇪 Germany Blocked Account</span>
              {blockedPct === 100 && (
                <Badge className="border-[#22C55E]/20 bg-[#22C55E]/10 px-1.5 py-0 text-[9px] text-[#22C55E]">Verified</Badge>
              )}
            </div>
            <span className="text-sm font-bold text-[#22C55E]">{blockedAccount.currency}{blockedAccount.current.toLocaleString()}</span>
          </div>
          <div className="nx-progress-track">
            <div className="nx-progress-fill" style={{ width: `${blockedPct}%`, background: "linear-gradient(90deg, #22C55E, #15803D)" }} />
          </div>
          <p className="mt-1 text-[10px] text-[#64748B]">Target: €11,208 (Fintiba verified) · 100% complete</p>
        </div>

        {/* UK Tuition Deposit */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">🇬🇧 UK Tuition Deposit</span>
            <span className="text-sm font-bold text-[#F97316]">£{tuitionDeposit.current.toLocaleString()} / £{tuitionDeposit.target.toLocaleString()}</span>
          </div>
          <div className="nx-progress-track">
            <div className="nx-progress-fill nx-progress-gradient" style={{ width: `${tuitionPct}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-[#64748B]">50% complete · CAS pending deposit confirmation</p>
        </div>

        {/* Living Cost */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">🏠 Living Cost Proof</span>
            <span className="text-sm font-bold text-[#3B82F6]">£{livingCost.current.toLocaleString()} / £{livingCost.target.toLocaleString()}</span>
          </div>
          <div className="nx-progress-track">
            <div className="nx-progress-fill" style={{ width: `${livingPct}%`, background: "linear-gradient(90deg, #3B82F6, #1E40AF)" }} />
          </div>
          <p className="mt-1 text-[10px] text-[#64748B]">50% complete · Bank statement uploaded, awaiting verification</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Total Ready</p>
          <p className="mt-0.5 text-lg font-bold text-[#22C55E]">€17,208</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Pending</p>
          <p className="mt-0.5 text-lg font-bold text-[#F97316]">£18,000</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Visa Readiness</p>
          <p className="mt-0.5 text-lg font-bold text-white">67%</p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CARD 5: COUNSELOR APPROVAL PANEL
// ════════════════════════════════════════════════════════════════
function CounselorApprovalCard({
  approvals,
  onApprove,
}: {
  approvals: PendingApproval[];
  onApprove: (id: string) => void;
}) {
  return (
    <div className="nx-glass nx-glass-glow-orange h-full p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C]">
            <Icon name="UserCheck" className="size-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Counselor Approval Panel</h3>
            <p className="text-xs text-[#64748B]">AI-prepared files ready for human review</p>
          </div>
        </div>
        <Badge className="border-[#FBBF24]/20 bg-[#FBBF24]/10 text-[#FBBF24]">
          <Icon name="Clock" className="mr-1 size-3" />
          {approvals.length} pending
        </Badge>
      </div>

      {/* Approval Queue */}
      <div className="mt-5 space-y-4">
        {approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#22C55E]/10">
              <Icon name="CheckCircle2" className="size-6 text-[#22C55E]" />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">All caught up!</p>
            <p className="text-xs text-[#64748B]">No applications pending approval.</p>
          </div>
        ) : (
          approvals.map((app) => (
            <div key={app.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
              {/* Student Info */}
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border border-white/10">
                  <AvatarImage src={app.studentAvatar} />
                  <AvatarFallback className="bg-[#1E40AF] text-xs font-bold text-white">
                    {app.studentName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{app.studentName}</p>
                  <p className="text-xs text-[#64748B]">{app.university} · {app.course}</p>
                </div>
                {/* Overall Confidence */}
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Confidence</p>
                  <p className="text-lg font-bold text-[#22C55E]">{app.overallConfidence}%</p>
                </div>
              </div>

              {/* Confidence Breakdown */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "SOP", value: app.sopConfidence, color: "#F97316" },
                  { label: "OCR", value: app.ocrConfidence, color: "#3B82F6" },
                  { label: "Match", value: app.matchConfidence, color: "#22C55E" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-white/5 p-2 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#64748B]">{item.label}</p>
                    <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}%</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl">
                  <Icon name="Eye" className="mr-1 size-3" />
                  Preview
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl">
                  <Icon name="Pencil" className="mr-1 size-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApprove(app.id)}
                  className="nx-btn-glow ml-auto bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white hover:opacity-90 rounded-xl"
                >
                  <Icon name="Check" className="mr-1 size-3" />
                  Approve & Submit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs text-[#64748B]">
          <Icon name="Info" className="mr-1 inline size-3" />
          AI prepares 70% · You approve the final 30%
        </span>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl">
          <Icon name="Video" className="mr-1 size-3" />
          1:1 Video Connect
        </Button>
      </div>
    </div>
  );
}
export default NexAbroadDashboard;
