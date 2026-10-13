"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Sparkles,
  CheckCircle2,
  ScrollText,
  X,
  Command,
  Search,
  Bell,
  Plus,
  TrendingUp,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Clock,
  FileText,
  Send,
  RotateCcw,
  CheckCircle,
  Loader2,
  Mail,
  Eye,
  Calendar,
  Filter,
  CalendarClock,
  CircleSlash,
  CircleCheck,
  LogOut,
  Lock,
  UserCircle,
  TrendingDown,
  Minus,
  ArrowRight,
  Download,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";
import { useToast } from "@/hooks/use-toast";

export type CommandData = {
  inquiries: { id: string; type: string; status: string; createdAt: string; contact: { fullName: string; organization: string | null } }[];
  opportunities: { id: string; title: string; stage: string; priority: string; contact: { fullName: string } }[];
  aiTasks: { id: string; workflow: string; objective: string; status: string; sensitivity: string; createdAt: string }[];
  meetings: { id: string; reference: string; meetingType: string; requestedDate: string; requestedTime: string; contactName: string; contactEmail: string; organization: string | null; topic: string | null; status: string; timezone: string; createdAt: string }[];
  contacts: number;
  newsletters: number;
};

const PIPELINE_STAGES = [
  "new", "review-required", "qualified", "discovery-scheduled", "discovery-completed",
  "scope-required", "proposal-drafting", "proposal-sent", "negotiation", "approved",
  "in-progress", "won", "lost", "on-hold", "archived",
];

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "ai", label: "AI Workspace", icon: Sparkles },
  { id: "approvals", label: "Approvals", icon: CheckCircle2 },
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "audit", label: "Audit Log", icon: ScrollText },
];

const STAGE_COLOR: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  qualified: "bg-indigo-50 text-indigo-700",
  "proposal-sent": "bg-amber-50 text-amber-700",
  won: "bg-emerald-50 text-emerald-700",
  lost: "bg-red-50 text-red-700",
  "in-progress": "bg-orange-50 text-orange-700",
};

const AI_STATUS_COLOR: Record<string, string> = {
  "awaiting-approval": "bg-orange-50 text-orange-700 ring-orange-200",
  "quality-review": "bg-blue-50 text-blue-700 ring-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "revision-requested": "bg-amber-50 text-amber-700 ring-amber-200",
};

// Meeting type badge colors (dark theme)
const MEETING_TYPE_COLOR: Record<string, string> = {
  discovery: "bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/20",
  strategy: "bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/20",
  partnership: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/20",
  education: "bg-blue-700/20 text-blue-200 ring-1 ring-blue-400/20",
};

// Meeting status badge colors (dark theme)
const MEETING_STATUS_COLOR: Record<string, string> = {
  new: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30",
  confirmed: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30",
  rescheduled: "bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30",
  cancelled: "bg-red-500/20 text-red-200 ring-1 ring-red-400/30",
  completed: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30",
};

// Quick-create workflows (the 6 specific ones requested)
const QUICK_CREATE_WORKFLOWS = [
  { value: "content-draft", label: "Content Draft" },
  { value: "research-brief", label: "Research Brief" },
  { value: "operations-audit", label: "Operations Audit" },
  { value: "pipeline-summary", label: "Pipeline Summary" },
  { value: "newsletter-draft", label: "Newsletter Draft" },
  { value: "partnership-brief", label: "Partnership Brief" },
];

const SENSITIVITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
];

const OUTPUT_FORMATS = [
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
  { value: "plain-text", label: "Plain Text" },
];

// ─── RBAC Configuration ──────────────────────────────────────────────────
// All 11 roles from the production RBAC spec. The `tabs` array drives
// which nav tabs are visible; `canAct` is a coarse UI hint — the real
// permission check happens server-side on every API call.
type UserRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "EXECUTIVE_ASSISTANT"
  | "CRM_MANAGER"
  | "PARTNERSHIP_MANAGER"
  | "CONTENT_MANAGER"
  | "MARKETING_MANAGER"
  | "PROJECT_MANAGER"
  | "AI_REVIEWER"
  | "SECURITY_AUDITOR"
  | "VIEWER";

const ROLE_CONFIG: Record<UserRole, {
  label: string;
  color: string;
  dotColor: string;
  icon: typeof ShieldCheck;
  tabs: string[];
  canAct: boolean;
  description: string;
}> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    color: "text-red-300 bg-red-500/15 ring-red-400/20",
    dotColor: "bg-red-400",
    icon: ShieldCheck,
    tabs: ["dashboard", "pipeline", "ai", "approvals", "meetings", "audit"],
    canAct: true,
    description: "Full access to all Command Center tabs and actions",
  },
  OWNER: {
    label: "Owner",
    color: "text-orange-300 bg-orange-500/15 ring-orange-400/20",
    dotColor: "bg-orange-400",
    icon: UserCircle,
    tabs: ["dashboard", "pipeline", "ai", "approvals", "meetings", "audit"],
    canAct: true,
    description: "Full access to all tabs (owner provisioned)",
  },
  EXECUTIVE_ASSISTANT: {
    label: "Executive Assistant",
    color: "text-blue-300 bg-blue-500/15 ring-blue-400/20",
    dotColor: "bg-blue-400",
    icon: Users,
    tabs: ["dashboard", "pipeline", "ai", "meetings"],
    canAct: true,
    description: "Dashboard, Pipeline, AI Workspace, Meetings",
  },
  CRM_MANAGER: {
    label: "CRM Manager",
    color: "text-emerald-300 bg-emerald-500/15 ring-emerald-400/20",
    dotColor: "bg-emerald-400",
    icon: Users,
    tabs: ["dashboard", "pipeline", "meetings"],
    canAct: true,
    description: "Dashboard, Pipeline, Meetings",
  },
  PARTNERSHIP_MANAGER: {
    label: "Partnership Manager",
    color: "text-purple-300 bg-purple-500/15 ring-purple-400/20",
    dotColor: "bg-purple-400",
    icon: Users,
    tabs: ["dashboard", "pipeline", "meetings"],
    canAct: true,
    description: "Dashboard, Pipeline, Meetings (partnership focus)",
  },
  CONTENT_MANAGER: {
    label: "Content Manager",
    color: "text-cyan-300 bg-cyan-500/15 ring-cyan-400/20",
    dotColor: "bg-cyan-400",
    icon: FileText,
    tabs: ["dashboard", "ai", "approvals"],
    canAct: true,
    description: "Dashboard, AI Workspace, Approvals (content focus)",
  },
  MARKETING_MANAGER: {
    label: "Marketing Manager",
    color: "text-pink-300 bg-pink-500/15 ring-pink-400/20",
    dotColor: "bg-pink-400",
    icon: TrendingUp,
    tabs: ["dashboard", "ai", "approvals"],
    canAct: true,
    description: "Dashboard, AI Workspace, Approvals (marketing focus)",
  },
  PROJECT_MANAGER: {
    label: "Project Manager",
    color: "text-amber-300 bg-amber-500/15 ring-amber-400/20",
    dotColor: "bg-amber-400",
    icon: GitBranch,
    tabs: ["dashboard", "pipeline", "meetings"],
    canAct: true,
    description: "Dashboard, Pipeline, Meetings (project delivery)",
  },
  AI_REVIEWER: {
    label: "AI Reviewer",
    color: "text-orange-300 bg-orange-500/15 ring-orange-400/20",
    dotColor: "bg-orange-400",
    icon: Sparkles,
    tabs: ["dashboard", "ai", "approvals", "audit"],
    canAct: true,
    description: "Dashboard, AI Workspace, Approvals, Audit Log",
  },
  SECURITY_AUDITOR: {
    label: "Security Auditor",
    color: "text-rose-300 bg-rose-500/15 ring-rose-400/20",
    dotColor: "bg-rose-400",
    icon: ShieldCheck,
    tabs: ["dashboard", "audit"],
    canAct: false,
    description: "Dashboard + Audit Log (read-only security review)",
  },
  VIEWER: {
    label: "Viewer",
    color: "text-ink-300 bg-white/10 ring-white/15",
    dotColor: "bg-ink-400",
    icon: Eye,
    tabs: ["dashboard"],
    canAct: false,
    description: "Dashboard only (read-only)",
  },
};

// Pipeline bar chart stage groupings with colors
const PIPELINE_BAR_GROUPS = [
  { stages: ["new", "review-required", "qualified"], label: "Discovery", color: "bg-blue-400", lastWeek: 3 },
  { stages: ["discovery-scheduled", "discovery-completed", "scope-required"], label: "Exploration", color: "bg-cyan-400", lastWeek: 2 },
  { stages: ["proposal-drafting", "proposal-sent", "negotiation"], label: "Proposal", color: "bg-amber-400", lastWeek: 2 },
  { stages: ["approved", "in-progress"], label: "Execution", color: "bg-orange-500", lastWeek: 1 },
  { stages: ["won"], label: "Won", color: "bg-emerald-400", lastWeek: 1 },
  { stages: ["lost", "on-hold", "archived"], label: "Closed/Lost", color: "bg-red-400/70", lastWeek: 0 },
];

// ─── Sparkline / trend helpers ──────────────────────────────────────────

type Trend = { direction: "up" | "down" | "neutral"; value: string };

/**
 * Deterministic pseudo-random generator seeded from a string.
 * Returns an array of `points` normalized values in [0,1].
 */
function generateSparklineData(seed: string, points = 7): number[] {
  // Simple xfn hash → numeric seed
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // mulberry32 PRNG
  let a = h >>> 0;
  const rand = () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: number[] = [];
  let last = 0.35 + rand() * 0.3; // start somewhere mid-range
  for (let i = 0; i < points; i++) {
    // gentle random walk so the sparkline looks organic, not chaotic
    const drift = (rand() - 0.45) * 0.28;
    last = Math.min(0.95, Math.max(0.08, last + drift));
    out.push(last);
  }
  return out;
}

/** Compact "time ago" formatter (e.g. "2h ago", "1d ago", "just now"). */
function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Mini SVG sparkline (7 points) used at the bottom of each StatCard. */
function Sparkline({
  data,
  accent,
  idKey,
  width = 96,
  height = 24,
}: {
  data: number[];
  accent: "blue" | "orange";
  idKey: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - ((v - min) / span) * h);
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`))
    .join(" ");
  const areaPath = `${path} L ${(pad + w).toFixed(1)} ${(pad + h).toFixed(1)} L ${pad.toFixed(1)} ${(pad + h).toFixed(1)} Z`;
  const stroke = accent === "blue" ? "#3B82F6" : "#F26113";
  // sanitize idKey for url use
  const fillId = `spark-${accent}-${idKey.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" aria-hidden>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} stroke="none" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="1.6" fill={stroke} />
    </svg>
  );
}

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [quickCreate, setQuickCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ─── Auth + data state ────────────────────────────────────────────────
  // The role and dashboard data come from the SERVER via authenticated
  // API calls — never from localStorage. The public page ships NO CRM
  // payload; data is fetched only after a successful login.
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [sessionUser, setSessionUser] = useState<{ name: string; email: string } | null>(null);
  const [data, setData] = useState<CommandData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // On mount, check if a valid session already exists (cookie-based).
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/session", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.success && json?.data?.user?.role) {
        setRole(json.data.user.role as UserRole);
        setSessionUser({ name: json.data.user.name, email: json.data.user.email });
      }
    } catch { /* no-op */ }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const res = await fetch("/api/v1/admin/dashboard", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        if (res.status === 401) {
          setRole(null);
          setSessionUser(null);
          setData(null);
        } else if (res.status === 403) {
          setDataError("Your role does not have permission to view the dashboard.");
        } else {
          setDataError(json?.message || "Failed to load dashboard data.");
        }
        return;
      }
      setData(json.data as CommandData);
    } catch {
      setDataError("Network error while loading dashboard.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Initial session check on mount; if logged in, fetch dashboard.
  useEffect(() => {
    (async () => {
      await fetchSession();
    })();
  }, [fetchSession]);

  // ─── Discreet staff access ───────────────────────────────────────────
  // The floating launcher is ONLY shown to authenticated staff. To let
  // staff reach the login modal in the first place (before they have a
  // session), we listen for:
  //   1. A keyboard shortcut: Ctrl+Shift+C (or Cmd+Shift+C on macOS)
  //   2. A URL hash: #staff
  // Neither is advertised anywhere in the public UI. This keeps the
  // Command Center invisible to casual visitors while remaining reachable
  // for staff who know the access gesture.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onHash = () => {
      if (typeof window !== "undefined" && window.location.hash === "#staff") {
        setOpen(true);
        // Clean the hash so it doesn't keep reopening on every hashchange
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    // Check on mount too (in case the page loaded with #staff already set)
    onHash();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  // Real server-side login. Posts credentials to /api/v1/auth/login which
  // validates against the User table and sets an HMAC-signed session cookie.
  const handleLogin = useCallback(async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setLoginError(json?.message || "Login failed.");
        return;
      }
      const userRole = json.data?.user?.role as UserRole | undefined;
      if (!userRole) {
        setLoginError("Server did not return a role.");
        return;
      }
      setRole(userRole);
      setSessionUser({ name: json.data.user.name, email: json.data.user.email });
      setLoginPassword("");
      setTab("dashboard");
      void fetchDashboard();
    } catch {
      setLoginError("Network error during login.");
    } finally {
      setLoginLoading(false);
    }
  }, [loginEmail, loginPassword, fetchDashboard]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch { /* no-op */ }
    setRole(null);
    setSessionUser(null);
    setData(null);
    setTab("dashboard");
    setLoginEmail("");
    setLoginPassword("");
    setLoginError(null);
  }, []);

  // Refresh dashboard data (used after create/approve/etc.).
  const refresh = useCallback(() => {
    if (role) void fetchDashboard();
  }, [role, fetchDashboard]);

  // Respond to external open requests (from SiteChrome ⌘E / command palette).
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("alaminn:open-command-center", handler);
    return () => window.removeEventListener("alaminn:open-command-center", handler);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Derived: visible tabs based on role
  const visibleTabs = useMemo(() => {
    if (!role) return [];
    const allowed = ROLE_CONFIG[role].tabs;
    return TABS.filter((t) => allowed.includes(t.id));
  }, [role]);

  // Derived: can user perform actions? (UI hint only — server enforces truth.)
  const canAct = !!role && ROLE_CONFIG[role].canAct;

  // Cross-tab search results
  const searchResults = useMemo(() => {
    if (!data || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { type: "inquiry" | "opportunity" | "ai-task"; id: string; label: string; sub: string; tabTarget: string }[] = [];

    for (const i of data.inquiries) {
      if (i.contact.fullName.toLowerCase().includes(q) || i.type.replace(/-/g, " ").toLowerCase().includes(q)) {
        results.push({ type: "inquiry", id: i.id, label: i.contact.fullName, sub: i.type.replace(/-/g, " "), tabTarget: "audit" });
      }
    }
    for (const o of data.opportunities) {
      if (o.title.toLowerCase().includes(q) || o.contact.fullName.toLowerCase().includes(q)) {
        results.push({ type: "opportunity", id: o.id, label: o.title, sub: o.contact.fullName, tabTarget: "pipeline" });
      }
    }
    for (const t of data.aiTasks) {
      if (t.objective.toLowerCase().includes(q) || t.workflow.replace(/-/g, " ").toLowerCase().includes(q)) {
        results.push({ type: "ai-task", id: t.id, label: t.workflow.replace(/-/g, " "), sub: t.objective, tabTarget: "ai" });
      }
    }
    return results.slice(0, 8);
  }, [searchQuery, data]);

  const pendingApprovals = data?.aiTasks.filter((t) => t.status === "awaiting-approval") ?? [];
  const newInquiries = data?.inquiries.filter((i) => i.status === "new") ?? [];
  const newMeetings = data?.meetings.filter((m) => m.status === "new") ?? [];

  return (
    <>
      {/* Floating launcher — STAFF ONLY.
          The launcher is rendered ONLY when the user has an authenticated
          session. Unauthenticated visitors never see this button. Staff who
          need to sign in can open the login modal via the discreet keyboard
          shortcut Ctrl+Shift+C (Cmd+Shift+C on macOS) or by visiting #staff. */}
      {sessionUser && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-2xl grad-intelligence px-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-blue"
          aria-label="Open Command Center"
        >
          <Command className="h-5 w-5" />
          <span className="hidden sm:inline">Command Center</span>
          {pendingApprovals.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold">
              {pendingApprovals.length}
            </span>
          )}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-stretch justify-end"
          >
            <div
              className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="relative flex w-full max-w-[1080px] flex-col bg-ink-950 text-blue-100 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl grad-intelligence">
                    <Command className="h-4 w-4 text-white" />
                  </span>
                  <div>
                    <div className="font-display text-sm font-extrabold text-white">
                      Command Center
                    </div>
                    <div className="text-[10px] text-blue-300">
                      CRM · AI Workspace · Governance
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Search input */}
                  <div ref={searchRef} className="relative">
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-200">
                      <Search className="h-3.5 w-3.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSearchOpen(e.target.value.length > 0);
                        }}
                        onFocus={() => searchQuery && setSearchOpen(true)}
                        placeholder="Search..."
                        className="w-24 bg-transparent text-xs text-white placeholder:text-blue-300/60 focus:w-40 focus:outline-none sm:w-32 sm:focus:w-48 transition-all"
                        aria-label="Search command center"
                      />
                      <kbd className="hidden rounded border border-white/10 px-1.5 text-[10px] sm:inline">⌘K</kbd>
                    </div>
                    {/* Search dropdown overlay */}
                    <AnimatePresence>
                      {searchOpen && searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/15 bg-ink-900/95 p-2 shadow-xl backdrop-blur-md"
                        >
                          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                            Search results
                          </div>
                          {searchResults.map((r) => (
                            <button
                              key={r.id + r.type}
                              onClick={() => {
                                setTab(r.tabTarget);
                                setSearchOpen(false);
                                setSearchQuery("");
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/10"
                            >
                              <span className={cn(
                                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                r.type === "inquiry" ? "bg-blue-500/20 text-blue-300" :
                                r.type === "opportunity" ? "bg-orange-500/20 text-orange-300" :
                                "bg-purple-500/20 text-purple-300"
                              )}>
                                {r.type === "inquiry" ? <Users className="h-3.5 w-3.5" /> :
                                 r.type === "opportunity" ? <TrendingUp className="h-3.5 w-3.5" /> :
                                 <Sparkles className="h-3.5 w-3.5" />}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold text-white">{r.label}</div>
                                <div className="truncate text-[10px] text-blue-300">{r.sub}</div>
                              </div>
                              <span className="ml-auto shrink-0 text-[9px] uppercase text-blue-400/60">{r.type.replace("-", " ")}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                      {searchOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-white/15 bg-ink-900/95 p-4 text-center shadow-xl backdrop-blur-md"
                        >
                          <div className="text-xs text-blue-300">No results for &ldquo;{searchQuery}&rdquo;</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-blue-200 hover:bg-white/10">
                    <Bell className="h-4 w-4" />
                    {pendingApprovals.length > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                        {pendingApprovals.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-blue-200 hover:bg-white/10"
                    aria-label="Close command center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tabs — filtered by RBAC role */}
              <div className="flex items-center gap-1 border-b border-white/10 px-4 py-2">
                {visibleTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                      tab === t.id
                        ? "bg-white/10 text-white"
                        : "text-blue-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t.label}</span>
                    {t.id === "approvals" && pendingApprovals.length > 0 && (
                      <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                        {pendingApprovals.length}
                      </span>
                    )}
                    {t.id === "meetings" && newMeetings.length > 0 && (
                      <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                        {newMeetings.length}
                      </span>
                    )}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  {canAct && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setTab("ai");
                        setQuickCreate(true);
                      }}
                      className="h-8 gap-1.5 rounded-lg bg-orange-600 px-3 text-xs hover:bg-orange-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Quick create</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Content — gated by RBAC */}
              <div className="flex-1 overflow-y-auto scroll-area p-5">
                {!role ? (
                  <RBACLoginOverlay
                    email={loginEmail}
                    setEmail={setLoginEmail}
                    password={loginPassword}
                    setPassword={setLoginPassword}
                    onSubmit={handleLogin}
                    loading={loginLoading}
                    error={loginError}
                  />
                ) : !data ? (
                  dataLoading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
                      <p className="text-sm text-blue-300">Loading dashboard data…</p>
                    </div>
                  ) : dataError ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <AlertTriangle className="h-7 w-7 text-amber-400" />
                      <p className="text-sm text-blue-300">{dataError}</p>
                      <button onClick={() => void fetchDashboard()} className="text-xs text-orange-300 hover:text-orange-200">Retry</button>
                    </div>
                  ) : null
                ) : !visibleTabs.some((t) => t.id === tab) ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <Lock className="h-8 w-8 text-blue-400/40" />
                    <p className="text-sm text-blue-300">You don&apos;t have access to this tab.</p>
                    <button onClick={() => setTab("dashboard")} className="text-xs text-orange-300 hover:text-orange-200">Go to Dashboard</button>
                  </div>
                ) : (
                  <>
                    {tab === "dashboard" && <DashboardTab data={data} newInquiries={newInquiries} pendingApprovals={pendingApprovals} readOnly={!canAct} onNavigateTab={(t) => { if (visibleTabs.some((vt) => vt.id === t)) setTab(t); }} />}
                    {tab === "pipeline" && <PipelineTab opportunities={data.opportunities} readOnly={!canAct} />}
                    {tab === "ai" && <AiTab tasks={data.aiTasks} onRefresh={refresh} quickCreateSignal={quickCreate} onQuickCreateConsumed={() => setQuickCreate(false)} readOnly={!canAct} />}
                    {tab === "approvals" && <ApprovalsTab tasks={pendingApprovals} onRefresh={refresh} readOnly={!canAct} />}
                    {tab === "meetings" && <MeetingsTab meetings={data.meetings} onRefresh={refresh} readOnly={!canAct} />}
                    {tab === "audit" && <AuditTab inquiries={data.inquiries} />}
                  </>
                )}
              </div>

              {/* RBAC & Permissions bar */}
              <div className="border-t border-white/10 bg-white/[0.03] backdrop-blur-md px-5 py-2.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Role badge — dynamic based on RBAC */}
                    {role && (() => {
                      const RoleIcon = ROLE_CONFIG[role].icon;
                      return (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1",
                          ROLE_CONFIG[role].color
                        )}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {sessionUser?.name || ROLE_CONFIG[role].label}
                        <span className="text-current/50">·</span>
                        <span className="font-normal text-current/70">{ROLE_CONFIG[role].label}</span>
                        <button
                          onClick={handleLogout}
                          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-current/60 hover:bg-white/10 hover:text-white"
                          title="Log out"
                        >
                          <LogOut className="h-2.5 w-2.5" />
                        </button>
                      </motion.span>
                      );
                    })()}
                    {!role && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 ring-1 ring-white/10">
                        <Lock className="h-3 w-3" />
                        Not authenticated
                      </span>
                    )}
                    {/* Permission pills — dynamic */}
                    {role && (
                      <div className="flex items-center gap-1.5">
                        {ROLE_CONFIG[role].tabs.map((tabId) => {
                          const tabDef = TABS.find((t) => t.id === tabId);
                          if (!tabDef) return null;
                          return (
                            <span key={tabId} className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300 ring-1 ring-blue-400/15">
                              {tabDef.label}
                            </span>
                          );
                        })}
                        {!ROLE_CONFIG[role].canAct && (
                          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-ink-400 ring-1 ring-white/10">Read-only</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-blue-300/70">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 node-active" />
                      System healthy
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-blue-400" />
                      Agent Hub: connected
                    </span>
                    <span className="hidden sm:inline text-blue-300/50">Al Aminn</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── RBAC Login Overlay (real server-side auth) ─────────────────────────
function RBACLoginOverlay({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  error,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex items-center justify-center py-6">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
      >
        {/* Gradient top bar */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 via-orange-500 to-blue-500" />

        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl grad-intelligence">
            <Lock className="h-5 w-5 text-white" />
          </span>
          <div>
            <h3 className="font-display text-base font-extrabold text-white">
              Command Center Access
            </h3>
            <p className="text-[11px] text-blue-300">
              Sign in with your staff account to access CRM, AI Workspace & governance tools.
            </p>
          </div>
        </div>

        {/* Real login form */}
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="mb-4 space-y-3"
          aria-label="Command Center login"
        >
          <div>
            <label htmlFor="cc-login-email" className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Email</label>
            <input
              id="cc-login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@alaminn.info"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-blue-300/40 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <div>
            <label htmlFor="cc-login-password" className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Password</label>
            <input
              id="cc-login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-blue-300/40 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Sign in securely
              </>
            )}
          </button>
        </form>

        {/* Security notice */}
        <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[10px] leading-relaxed text-blue-300/70">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <div>
            <strong className="text-blue-200">Protected access.</strong> Credentials are
            verified server-side against the staff directory. Sessions are HMAC-signed,
            HttpOnly, and expire after 8 hours. All sign-in attempts are recorded in the
            audit log. Unauthorized access attempts are rate-limited and locked out after
            5 failed tries.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent: "blue" | "orange";
  trend?: Trend;
}) {
  const { ref, display } = useCountUp(value, { duration: 1100, immediate: true });
  // Deterministic 7-point sparkline data (stable per label)
  const sparkData = useMemo(() => generateSparklineData(label, 7), [label]);
  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-300"
      : trend?.direction === "down"
        ? "text-red-300"
        : "text-blue-300";
  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/[0.07]"
    >
      {/* hover gradient sheen */}
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-100",
          accent === "blue" ? "bg-blue-500/30" : "bg-orange-500/30"
        )}
      />
      <div className="relative flex items-center justify-between">
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
            accent === "blue" ? "bg-blue-500/20 text-blue-200" : "bg-orange-500/20 text-orange-200"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100",
            accent === "blue" ? "text-blue-300" : "text-orange-300"
          )}
        >
          live
        </span>
      </div>
      <div className="relative mt-3 font-display text-2xl font-extrabold text-white tabular">
        {display}
      </div>
      <div className="relative text-[10px] uppercase tracking-wider text-blue-300">{label}</div>

      {/* Trend indicator */}
      {trend && (
        <div className={cn("relative mt-1.5 flex items-center gap-1 text-[10px] font-semibold", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{trend.value}</span>
        </div>
      )}

      {/* Sparkline */}
      <div className="relative mt-2 flex items-end justify-between gap-2">
        <Sparkline data={sparkData} accent={accent} idKey={label} />
      </div>
    </div>
  );
}

/** Mini horizontal bar chart showing opportunities grouped by pipeline stage */
function PipelineBarChart({
  opportunities,
  onNavigateToPipeline,
}: {
  opportunities: CommandData["opportunities"];
  onNavigateToPipeline?: () => void;
}) {
  const total = opportunities.length || 1;
  const groups = PIPELINE_BAR_GROUPS.map((g) => {
    const count = opportunities.filter((o) => g.stages.includes(o.stage)).length;
    return { ...g, count, pct: Math.round((count / total) * 100) };
  });

  // Hover tooltip state — which segment is currently hovered
  const [hovered, setHovered] = useState<{ label: string; count: number; pct: number; x: number } | null>(null);
  const barContainerRef = useRef<HTMLDivElement>(null);

  // Visible (non-empty) segments — precomputed so we can mark first/last for rounding
  const visibleGroups = groups.filter((g) => g.count > 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-sm font-bold text-white">Pipeline Overview</div>
        <span className="text-[10px] text-blue-300">{opportunities.length} opportunities</span>
      </div>
      {/* Stacked horizontal bar (with hover tooltip) */}
      <div className="relative mb-3">
        <div
          ref={barContainerRef}
          className="flex h-6 overflow-visible rounded-lg bg-white/5"
          onMouseLeave={() => setHovered(null)}
        >
          {visibleGroups.map((g, vIdx) => (
            <button
              key={g.label}
              type="button"
              onClick={() => onNavigateToPipeline?.()}
              onMouseEnter={(e) => {
                const rect = barContainerRef.current?.getBoundingClientRect();
                const target = e.currentTarget.getBoundingClientRect();
                if (rect) {
                  setHovered({
                    label: g.label,
                    count: g.count,
                    pct: g.pct,
                    x: target.left - rect.left + target.width / 2,
                  });
                }
              }}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "group/seg relative flex h-6 items-center justify-center text-[9px] font-bold text-white transition-all duration-200 hover:h-7 hover:brightness-110",
                g.color,
                vIdx === 0 ? "rounded-l-lg" : "",
                vIdx === visibleGroups.length - 1 ? "rounded-r-lg" : "",
              )}
              style={{ width: `${g.pct}%` }}
              aria-label={`${g.label}: ${g.count} opportunities (${g.pct}%) — click to view pipeline`}
            >
              {g.pct >= 12 && g.count}
            </button>
          ))}
        </div>
        {/* Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute -top-2 z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-white/15 bg-ink-900/95 px-2.5 py-1.5 shadow-xl backdrop-blur-md"
              style={{ left: hovered.x }}
            >
              <div className="text-[10px] font-semibold text-white">{hovered.label}</div>
              <div className="text-[9px] text-blue-300">
                {hovered.count} · {hovered.pct}%
              </div>
              {/* Tooltip arrow */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink-900/95" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Legend with trend arrows */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {groups.map((g) => {
          const grew = g.count > g.lastWeek;
          const TrendIcon = grew ? TrendingUp : null;
          return (
            <div key={g.label} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", g.color)} />
              <span className="text-[10px] text-blue-300">
                {g.label} <span className="font-semibold text-white">{g.count}</span>
              </span>
              {TrendIcon && (
                <TrendIcon className="h-2.5 w-2.5 text-emerald-300" aria-label={`+${g.count - g.lastWeek} since last week`} />
              )}
            </div>
          );
        })}
      </div>
      {/* View detailed pipeline link */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onNavigateToPipeline?.()}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-300 transition-colors hover:text-orange-200"
        >
          View detailed pipeline
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/** Combined recent activity timeline (inquiries + AI tasks, last 5) */
function RecentActivityTimeline({
  data,
  onNavigateTab,
}: {
  data: CommandData;
  onNavigateTab?: (tab: string) => void;
}) {
  const activities = useMemo(() => {
    const inquiryEvents = data.inquiries.map((i) => ({
      id: i.id + "-inq",
      type: "inquiry" as const,
      label: `New inquiry from ${i.contact.fullName}`,
      detail: i.type.replace(/-/g, " "),
      createdAt: i.createdAt,
      icon: Users,
      iconBg: "bg-blue-500/20 text-blue-300",
      borderClass: "border-l-blue-400",
      tabTarget: "audit" as const,
    }));
    const taskEvents = data.aiTasks.map((t) => ({
      id: t.id + "-task",
      type: "ai-task" as const,
      label: `AI task: ${t.workflow.replace(/-/g, " ")}`,
      detail: t.objective,
      createdAt: t.createdAt,
      icon: Sparkles,
      iconBg: "bg-orange-500/20 text-orange-300",
      borderClass: "border-l-orange-400",
      tabTarget: "ai" as const,
    }));
    const meetingEvents = data.meetings.map((m) => ({
      id: m.id + "-mtg",
      type: "meeting" as const,
      label: `Meeting request from ${m.contactName}`,
      detail: `${m.meetingType} · ${m.requestedTime}`,
      createdAt: m.createdAt,
      icon: Calendar,
      iconBg: "bg-cyan-500/20 text-cyan-300",
      borderClass: "border-l-cyan-400",
      tabTarget: "meetings" as const,
    }));
    return [...inquiryEvents, ...taskEvents, ...meetingEvents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 font-display text-sm font-bold text-white">Recent Activity</div>
      {activities.length === 0 ? (
        <div className="text-center text-xs text-blue-300 py-4">No activity yet.</div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[14px] top-2 bottom-2 w-px bg-white/10" />
          <div className="space-y-2">
            {activities.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => onNavigateTab?.(act.tabTarget)}
                className={cn(
                  "relative flex w-full items-start gap-3 rounded-lg border-l-2 py-1.5 pl-2 pr-2 text-left transition-colors hover:bg-white/5",
                  act.borderClass,
                )}
              >
                <span className={cn(
                  "relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  act.iconBg
                )}>
                  <act.icon className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-xs font-semibold text-white">{act.label}</div>
                  <div className="line-clamp-1 text-[10px] text-blue-300">{act.detail}</div>
                </div>
                <div className="shrink-0 pt-0.5 text-[10px] text-blue-400/60" title={new Date(act.createdAt).toLocaleString()}>
                  {formatTimeAgo(act.createdAt)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* View all activity link */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onNavigateTab?.("audit")}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-300 transition-colors hover:text-orange-200"
        >
          View all activity
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function DashboardTab({
  data,
  newInquiries,
  pendingApprovals,
  readOnly = false,
  onNavigateTab,
}: {
  data: CommandData;
  newInquiries: CommandData["inquiries"];
  pendingApprovals: CommandData["aiTasks"];
  readOnly?: boolean;
  onNavigateTab?: (tab: string) => void;
}) {
  const { toast } = useToast();
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Triggers a CSV download by fetching the export endpoint with the
  // session cookie, building a Blob, and clicking a hidden anchor.
  // Falls back to a toast error if the response isn't a CSV (e.g. 403).
  async function downloadExport(endpoint: string, fallbackName: string) {
    setExportMenuOpen(false);
    try {
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) {
        let msg = `Export failed (HTTP ${res.status})`;
        try {
          const j = (await res.json()) as { message?: string };
          if (j?.message) msg = j.message;
        } catch {
          /* ignore parse error */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      // Pull the filename from Content-Disposition if present.
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] || fallbackName;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Release the blob URL after a tick so the download has time to start.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({
        title: "Export started",
        description: `Downloading ${filename}.`,
      });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error.",
        variant: "destructive",
      });
    }
  }

  const EXPORT_OPTIONS: { label: string; endpoint: string; fallback: string }[] = [
    { label: "Contacts", endpoint: "/api/v1/admin/contacts/export", fallback: "contacts.csv" },
    { label: "Inquiries", endpoint: "/api/v1/admin/inquiries/export", fallback: "inquiries.csv" },
    { label: "Opportunities", endpoint: "/api/v1/admin/opportunities/export", fallback: "opportunities.csv" },
    { label: "Newsletter", endpoint: "/api/v1/admin/newsletter/export", fallback: "newsletter.csv" },
    { label: "Audit logs", endpoint: "/api/v1/admin/audit-logs/export", fallback: "audit-logs.csv" },
  ];

  const stats = [
    { label: "New inquiries", value: newInquiries.length, icon: Users, accent: "blue" as const, trend: { direction: "up" as const, value: "+2 this week" } },
    { label: "Active opportunities", value: data.opportunities.length, icon: TrendingUp, accent: "orange" as const, trend: { direction: "up" as const, value: "+1 today" } },
    { label: "Contacts", value: data.contacts, icon: Users, accent: "blue" as const, trend: { direction: "up" as const, value: "+3 this week" } },
    { label: "Pending AI approvals", value: pendingApprovals.length, icon: AlertTriangle, accent: "orange" as const, trend: pendingApprovals.length > 0 ? { direction: "up" as const, value: "Needs attention" } : { direction: "neutral" as const, value: "All clear" } },
    { label: "Meeting requests", value: data.meetings.length, icon: Calendar, accent: "blue" as const, trend: { direction: "up" as const, value: "+1 today" } },
    { label: "AI tasks (total)", value: data.aiTasks.length, icon: Sparkles, accent: "orange" as const, trend: { direction: "up" as const, value: "+2 this week" } },
  ];
  const newMeetings = data.meetings.filter((m) => m.status === "new");

  // Quick actions
  const quickActions = [
    {
      label: "New AI Task",
      icon: Sparkles,
      accent: "orange" as const,
      onClick: () => onNavigateTab?.("ai"),
      badge: undefined as number | undefined,
    },
    {
      label: "Review Approvals",
      icon: CheckCircle2,
      accent: "blue" as const,
      onClick: () => onNavigateTab?.("approvals"),
      badge: pendingApprovals.length > 0 ? pendingApprovals.length : undefined,
    },
    {
      label: "View Meetings",
      icon: Calendar,
      accent: "blue" as const,
      onClick: () => onNavigateTab?.("meetings"),
      badge: newMeetings.length > 0 ? newMeetings.length : undefined,
    },
    {
      label: "Export Report",
      icon: Download,
      accent: "orange" as const,
      onClick: () => setExportMenuOpen((v) => !v),
      badge: undefined as number | undefined,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quick Actions */}
      {!readOnly && (
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            <Zap className="h-3 w-3" />
            Quick actions
          </span>
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={cn(
                "group relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg",
                a.accent === "blue"
                  ? "border-blue-400/30 bg-blue-500/10 text-blue-200 hover:border-blue-400/50 hover:bg-blue-500/15 hover:shadow-blue"
                  : "border-orange-400/30 bg-orange-500/10 text-orange-200 hover:border-orange-400/50 hover:bg-orange-500/15 hover:shadow-orange",
              )}
            >
              <a.icon className="h-3.5 w-3.5" />
              <span>{a.label}</span>
              {a.badge !== undefined && (
                <span className={cn(
                  "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white",
                  a.accent === "blue" ? "bg-blue-500" : "bg-orange-500",
                )}>
                  {a.badge}
                </span>
              )}
            </button>
          ))}
          {exportMenuOpen && (
            <>
              {/* Click-away catcher */}
              <button
                type="button"
                aria-label="Close export menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setExportMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-slate-700 bg-slate-900/95 p-1 shadow-2xl backdrop-blur">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Export CSV
                </div>
                {EXPORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.endpoint}
                    type="button"
                    onClick={() => downloadExport(opt.endpoint, opt.fallback)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-200 hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5 text-orange-300" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pipeline chart + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineBarChart opportunities={data.opportunities} onNavigateToPipeline={() => onNavigateTab?.("pipeline")} />
        <RecentActivityTimeline data={data} onNavigateTab={onNavigateTab} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent inquiries */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm font-bold text-white">Recent inquiries</div>
            <span className="text-[10px] text-blue-300">{data.inquiries.length} total</span>
          </div>
          <div className="space-y-2">
            {data.inquiries.slice(0, 5).map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{i.contact.fullName}</div>
                  <div className="truncate text-[11px] text-blue-300">
                    {i.contact.organization || i.type.replace(/-/g, " ")}
                  </div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", STAGE_COLOR[i.status] ?? "bg-ink-700 text-blue-200")}>
                  {i.status.replace(/-/g, " ")}
                </span>
              </div>
            ))}
            {data.inquiries.length === 0 && (
              <div className="rounded-xl bg-white/5 p-4 text-center text-xs text-blue-300">
                No inquiries yet. Submit the contact form to see one here.
              </div>
            )}
          </div>
        </div>

        {/* Pending approvals preview */}
        <div className="rounded-2xl border border-orange-400/20 bg-orange-500/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm font-bold text-white">Pending AI approvals</div>
            <span className="text-[10px] text-orange-300">{pendingApprovals.length} waiting</span>
          </div>
          <div className="space-y-2">
            {pendingApprovals.slice(0, 4).map((t) => (
              <div key={t.id} className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white">{t.workflow.replace(/-/g, " ")}</div>
                  <Clock className="h-3 w-3 text-orange-300" />
                </div>
                <div className="mt-1 line-clamp-1 text-[11px] text-blue-300">{t.objective}</div>
              </div>
            ))}
            {pendingApprovals.length === 0 && (
              <div className="rounded-xl bg-white/5 p-4 text-center text-xs text-blue-300">
                No pending approvals. AI governance is up to date.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meeting requests */}
      {data.meetings.length > 0 && (
        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-300" />
              <div className="font-display text-sm font-bold text-white">Recent meeting requests</div>
            </div>
            <span className="text-[10px] text-blue-300">
              {newMeetings.length} new · {data.meetings.length} total
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.meetings.slice(0, 6).map((m) => {
              const d = new Date(m.requestedDate);
              return (
                <div
                  key={m.id}
                  className="flex items-start justify-between rounded-xl bg-white/5 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold text-white">{m.contactName}</span>
                      <span className="rounded bg-blue-500/20 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-200">
                        {m.meetingType}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-blue-300">
                      {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {m.requestedTime} · {m.contactEmail}
                    </div>
                    {m.topic && (
                      <div className="mt-0.5 line-clamp-1 text-[10px] text-blue-400/70">
                        {m.topic}
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase",
                      m.status === "new"
                        ? "bg-orange-500/20 text-orange-200"
                        : "bg-emerald-500/20 text-emerald-200"
                    )}
                  >
                    {m.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Email Template Preview Cards */}
      <EmailTemplatePreviewCards />
    </div>
  );
}

function PipelineTab({ opportunities, readOnly: _readOnly = false }: { opportunities: CommandData["opportunities"]; readOnly?: boolean }) {
  return (
    <div>
      <div className="mb-4 font-display text-sm font-bold text-white">
        Opportunity pipeline · {opportunities.length} opportunities
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        {PIPELINE_STAGES.slice(0, 10).map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage);
          return (
            <div key={stage} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                  {stage.replace(/-/g, " ")}
                </span>
                <span className="text-[10px] text-blue-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((o) => (
                  <div key={o.id} className="rounded-xl bg-white/5 p-2.5">
                    <div className="text-xs font-semibold text-white">{o.title}</div>
                    <div className="text-[10px] text-blue-300">{o.contact.fullName}</div>
                    <div className="mt-1.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", `priority-${o.priority}`)}>
                        {o.priority}
                      </span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-2 text-center text-[10px] text-blue-400/50">
                    empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const APPROVED_WORKFLOWS = [
  "executive-linkedin-post", "facebook-authority-post", "professional-x-post",
  "article-research-brief", "seo-article-draft", "newsletter-draft",
  "case-study-draft", "project-summary", "partnership-proposal",
  "university-research-brief", "bangladesh-market-brief", "operations-audit",
  "sales-process-review", "crm-requirements-draft", "presentation-outline",
  "speaking-notes", "media-response", "executive-biography",
  "website-content-update", "content-repurposing", "video-script",
  "social-content-calendar", "professional-follow-up", "meeting-preparation",
  "meeting-summary", "monthly-authority-report", "competitor-research",
  "resource-checklist-generator", "risk-review", "brand-consistency-audit",
];

function AiTab({
  tasks,
  onRefresh,
  quickCreateSignal,
  onQuickCreateConsumed,
  readOnly = false,
}: {
  tasks: CommandData["aiTasks"];
  onRefresh: () => void;
  quickCreateSignal?: boolean;
  onQuickCreateConsumed?: () => void;
  readOnly?: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    workflow: "content-draft",
    objective: "",
    prompt: "",
    project: "",
    sensitivity: "internal",
    outputFormat: "markdown",
    deadline: "",
  });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Respond to the external "Quick create" trigger from the header button.
  useEffect(() => {
    if (quickCreateSignal) {
      setCreating(true);
      onQuickCreateConsumed?.();
    }
  }, [quickCreateSignal, onQuickCreateConsumed]);

  const submitTask = async () => {
    if (!form.objective.trim()) {
      setMsg({ type: "err", text: "Objective is required (min 20 chars)." });
      return;
    }
    if (form.objective.trim().length < 20) {
      setMsg({ type: "err", text: "Objective must be at least 20 characters." });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const payload = {
        workflow: form.workflow,
        objective: form.objective,
        prompt: form.prompt || undefined,
        project: form.project || undefined,
        sensitivity: form.sensitivity,
        outputFormat: form.outputFormat,
        deadline: form.deadline || undefined,
      };
      const res = await fetch("/api/v1/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message || "Failed");
      setMsg({ type: "ok", text: `Task created — status: ${resData.data.status}` });
      setForm({ workflow: "content-draft", objective: "", prompt: "", project: "", sensitivity: "internal", outputFormat: "markdown", deadline: "" });
      onRefresh();
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-sm font-bold text-white">AI Workspace · {tasks.length} tasks</div>
        {!readOnly && (
          <button
            onClick={() => setCreating(!creating)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
          >
            <Plus className="h-3.5 w-3.5" />
            {creating ? "Cancel" : "New AI Task"}
          </button>
        )}
        {readOnly && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-300 ring-1 ring-white/10">
            <Lock className="h-3 w-3" />
            Read-only
          </span>
        )}
      </div>

      {/* Quick-create / AI task creation form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 overflow-hidden"
          >
            <div className="rounded-2xl border border-orange-400/30 bg-orange-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-200">
                <Sparkles className="h-4 w-4" />
                Quick AI Task
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Workflow selector */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Workflow</label>
                  <select
                    value={form.workflow}
                    onChange={(e) => setForm((f) => ({ ...f, workflow: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none"
                  >
                    {QUICK_CREATE_WORKFLOWS.map((w) => (
                      <option key={w.value} value={w.value} className="bg-ink-900">{w.label}</option>
                    ))}
                    <option disabled className="bg-ink-900">──────────</option>
                    {APPROVED_WORKFLOWS.filter(w => !QUICK_CREATE_WORKFLOWS.some(q => q.value === w)).map((w) => (
                      <option key={w} value={w} className="bg-ink-900">{w.replace(/-/g, " ")}</option>
                    ))}
                  </select>
                </div>
                {/* Project (optional) */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Project (optional)</label>
                  <input
                    type="text"
                    value={form.project}
                    onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
                    placeholder="e.g. ALO Education CRM"
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-blue-300/40 focus:border-orange-400/50 focus:outline-none"
                  />
                </div>
                {/* Sensitivity selector */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Sensitivity</label>
                  <select
                    value={form.sensitivity}
                    onChange={(e) => setForm((f) => ({ ...f, sensitivity: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none"
                  >
                    {SENSITIVITY_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value} className="bg-ink-900">{s.label}</option>
                    ))}
                  </select>
                </div>
                {/* Output format */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Output format</label>
                  <select
                    value={form.outputFormat}
                    onChange={(e) => setForm((f) => ({ ...f, outputFormat: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none"
                  >
                    {OUTPUT_FORMATS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-ink-900">{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Objective input */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                  Objective <span className="text-blue-400/60">(min 20 chars)</span>
                </label>
                <textarea
                  value={form.objective}
                  onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
                  placeholder="What should the AI accomplish?"
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-blue-300/40 focus:border-orange-400/50 focus:outline-none resize-none"
                />
              </div>
              {/* Prompt input */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                  AI Prompt <span className="text-blue-400/60">(optional — detailed instructions)</span>
                </label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  placeholder="Provide specific instructions, context, or requirements for the AI..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-blue-300/40 focus:border-orange-400/50 focus:outline-none resize-none"
                />
              </div>
              {/* Deadline */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                  Deadline <span className="text-blue-400/60">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="mt-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={submitTask}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {submitting ? "Submitting..." : "Submit AI Task"}
                </button>
                {msg && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn("text-xs", msg.type === "ok" ? "text-emerald-300" : "text-red-300")}
                  >
                    {msg.type === "ok" && <CheckCircle className="mr-1 inline h-3 w-3" />}
                    {msg.text}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-blue-300">
                <ShieldCheck className="h-3 w-3 text-emerald-300" />
                All tasks require human approval before publication
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* task list */}
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-orange-300" />
                  <span className="text-sm font-semibold text-white">
                    {t.workflow.replace(/-/g, " ")}
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-200">
                    {t.sensitivity}
                  </span>
                </div>
                <div className="mt-1 text-xs text-blue-300">{t.objective}</div>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 shrink-0", AI_STATUS_COLOR[t.status] ?? "bg-ink-700 text-blue-200 ring-white/10")}>
                {t.status.replace(/-/g, " ")}
              </span>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-blue-400/40" />
            <p className="mt-2 text-sm text-blue-300">No AI tasks yet. Click &ldquo;New AI Task&rdquo; to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ApprovalsTab({ tasks, onRefresh, readOnly = false }: { tasks: CommandData["aiTasks"]; onRefresh: () => void; readOnly?: boolean }) {
  const [acting, setActing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleAction = async (taskId: string, action: "approve" | "revision") => {
    setActing(taskId + action);
    setMsg(null);
    try {
      const res = await fetch("/api/v1/ai/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action }),
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message || "Failed");
      setMsg({
        type: "ok",
        text: action === "approve" ? "Task approved successfully." : "Revision requested.",
      });
      onRefresh();
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="mb-4 font-display text-sm font-bold text-white">
        AI Approvals · {tasks.length} awaiting decision
      </div>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={cn("mb-3 rounded-xl px-4 py-2 text-xs", msg.type === "ok" ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200")}
        >
          {msg.type === "ok" && <CheckCircle className="mr-1 inline h-3 w-3" />}
          {msg.text}
        </motion.div>
      )}
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
          <p className="mt-2 text-sm text-blue-200">All clear. No AI outputs awaiting approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-2xl border border-orange-400/20 bg-orange-500/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-orange-300" />
                    <span className="text-sm font-semibold text-white">{t.workflow.replace(/-/g, " ")}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-200">
                      {t.sensitivity}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-blue-300">{t.objective}</div>
                  <div className="mt-1 text-[10px] text-blue-400/60">
                    Created {new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}ID: {t.id.slice(0, 8)}…
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!readOnly ? (<>
                  {/* Approve button (green) */}
                  <button
                    onClick={() => handleAction(t.id, "approve")}
                    disabled={acting !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {acting === t.id + "approve" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </button>
                  {/* Request revision button (amber) */}
                  <button
                    onClick={() => handleAction(t.id, "revision")}
                    disabled={acting !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {acting === t.id + "revision" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Request revision
                  </button>
                  </>) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-400/50">
                      <Lock className="h-3 w-3" /> Read-only
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTab({ inquiries }: { inquiries: CommandData["inquiries"] }) {
  return (
    <div>
      <div className="mb-4 font-display text-sm font-bold text-white">Audit Log</div>
      <div className="space-y-2">
        {inquiries.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-200">
                <ScrollText className="h-3.5 w-3.5" />
              </span>
              <div>
                <div className="font-semibold text-white">Inquiry created</div>
                <div className="text-[10px] text-blue-300">
                  {i.contact.fullName} · {i.type.replace(/-/g, " ")}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-blue-400">
              {new Date(i.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        {inquiries.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-xs text-blue-300">
            No audit events yet.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Meetings Admin Tab ──────────────────────────────────────────────────

const MEETING_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const VALID_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "20:00", "20:30", "21:00",
];

function MeetingsTab({
  meetings,
  onRefresh,
  readOnly = false,
}: {
  meetings: CommandData["meetings"];
  onRefresh: () => void;
  readOnly?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ newDate: "", newTime: "09:00" });

  // Fetch full meeting list from admin API (for freshest data)
  const [allMeetings, setAllMeetings] = useState<CommandData["meetings"]>(meetings);
  const [loading, setLoading] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all"
        ? "/api/v1/meetings/admin"
        : `/api/v1/meetings/admin?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data?.meetings) {
        setAllMeetings(data.data.meetings);
      }
    } catch {
      // Fall back to server-provided data
      setAllMeetings(meetings);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, meetings]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleAction = async (
    meetingId: string,
    action: "confirmed" | "rescheduled" | "cancelled" | "completed",
    extra?: { newDate?: string; newTime?: string }
  ) => {
    setActing(meetingId + action);
    setMsg(null);
    try {
      const res = await fetch("/api/v1/meetings/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: meetingId,
          status: action,
          ...(extra || {}),
        }),
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message || "Failed");
      setMsg({ type: "ok", text: `Meeting ${action} successfully.` });
      setRescheduleId(null);
      onRefresh();
      fetchMeetings();
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setActing(null);
    }
  };

  const newCount = allMeetings.filter((m) => m.status === "new").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-sm font-bold text-white">
          Meetings · {allMeetings.length} requests
          {newCount > 0 && <span className="ml-2 text-amber-300">({newCount} new)</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-blue-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white focus:border-orange-400/50 focus:outline-none"
            >
              {MEETING_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-ink-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchMeetings}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-blue-200 hover:bg-white/5 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Message toast */}
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={cn(
            "mb-3 rounded-xl px-4 py-2 text-xs",
            msg.type === "ok" ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"
          )}
        >
          {msg.type === "ok" && <CheckCircle className="mr-1 inline h-3 w-3" />}
          {msg.text}
        </motion.div>
      )}

      {/* Meeting list */}
      {loading && allMeetings.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : allMeetings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <Calendar className="mx-auto h-8 w-8 text-blue-400/40" />
          <p className="mt-2 text-sm text-blue-300">
            No meeting requests{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""} yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[65vh] overflow-y-auto scroll-area pr-1">
          {allMeetings.map((m) => {
            const d = new Date(m.requestedDate);
            const isRescheduling = rescheduleId === m.id;
            const isActing = acting !== null && acting.startsWith(m.id);

            return (
              <motion.div
                key={m.id}
                layout
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/[0.07]"
              >
                {/* Top row: info + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{m.contactName}</span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                        MEETING_TYPE_COLOR[m.meetingType] ?? "bg-white/10 text-blue-200 ring-1 ring-white/10"
                      )}>
                        {m.meetingType}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-blue-300">
                      {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {m.requestedTime} · {m.timezone}
                    </div>
                    <div className="mt-0.5 text-[10px] text-blue-400/70">
                      {m.contactEmail}
                      {m.organization && ` · ${m.organization}`}
                    </div>
                    {m.topic && (
                      <div className="mt-1 line-clamp-2 text-[11px] text-blue-300/80">
                        {m.topic}
                      </div>
                    )}
                    <div className="mt-1 text-[10px] text-blue-500/60 font-mono">
                      {m.reference}
                    </div>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase",
                    MEETING_STATUS_COLOR[m.status] ?? "bg-white/10 text-blue-200 ring-1 ring-white/10"
                  )}>
                    {m.status}
                  </span>
                </div>

                {/* Reschedule inline form */}
                <AnimatePresence>
                  {isRescheduling && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-3 space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                          Reschedule to new date/time
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={rescheduleForm.newDate}
                            onChange={(e) => setRescheduleForm((f) => ({ ...f, newDate: e.target.value }))}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:border-blue-400/50 focus:outline-none"
                          />
                          <select
                            value={rescheduleForm.newTime}
                            onChange={(e) => setRescheduleForm((f) => ({ ...f, newTime: e.target.value }))}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:border-blue-400/50 focus:outline-none"
                          >
                            {VALID_TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot} className="bg-ink-900">{slot}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAction(m.id, "rescheduled", {
                              newDate: rescheduleForm.newDate,
                              newTime: rescheduleForm.newTime,
                            })}
                            disabled={!rescheduleForm.newDate || isActing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {acting === m.id + "rescheduled" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CalendarClock className="h-3 w-3" />
                            )}
                            Confirm reschedule
                          </button>
                          <button
                            onClick={() => setRescheduleId(null)}
                            className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-blue-300 hover:bg-white/5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {!readOnly && m.status === "new" && (
                    <>
                      <button
                        onClick={() => handleAction(m.id, "confirmed")}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {acting === m.id + "confirmed" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setRescheduleId(m.id);
                          setRescheduleForm({ newDate: "", newTime: "09:00" });
                        }}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CalendarClock className="h-3 w-3" />
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleAction(m.id, "cancelled")}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {acting === m.id + "cancelled" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CircleSlash className="h-3 w-3" />
                        )}
                        Cancel
                      </button>
                    </>
                  )}
                  {!readOnly && (m.status === "confirmed" || m.status === "rescheduled") && (
                    <>
                      <button
                        onClick={() => handleAction(m.id, "completed")}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {acting === m.id + "completed" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CircleCheck className="h-3 w-3" />
                        )}
                        Complete
                      </button>
                      <button
                        onClick={() => {
                          setRescheduleId(m.id);
                          setRescheduleForm({ newDate: "", newTime: "09:00" });
                        }}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CalendarClock className="h-3 w-3" />
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleAction(m.id, "cancelled")}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {acting === m.id + "cancelled" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CircleSlash className="h-3 w-3" />
                        )}
                        Cancel
                      </button>
                    </>
                  )}
                  {(m.status === "cancelled" || m.status === "completed") && (
                    <span className="text-[10px] text-blue-400/60 italic">No further actions available</span>
                  )}
                  {readOnly && m.status === "new" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-400/50">
                      <Lock className="h-3 w-3" /> Read-only
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Email template preview cards — 2×2 grid showing notification email previews */
const EMAIL_TEMPLATES = [
  {
    id: "inquiry-confirmation",
    title: "Inquiry Confirmation",
    from: "Al Aminn <hello@alaminn.info>",
    to: "{{contact.email}}",
    subject: "Thank you for your inquiry — Al Aminn",
    accent: "orange" as const,
    body: "Thank you for reaching out. We\u2019ve received your inquiry and will respond within 24 hours. Our team is reviewing the details and will connect you with the right specialist.",
  },
  {
    id: "meeting-confirmation",
    title: "Meeting Confirmation",
    from: "Al Aminn <schedule@alaminn.info>",
    to: "{{contact.email}}",
    subject: "Your meeting is confirmed — {{date}}",
    accent: "blue" as const,
    body: "Your discovery meeting has been confirmed. Please find the calendar invite attached. We look forward to discussing your strategic goals and exploring how we can help.",
  },
  {
    id: "newsletter-verification",
    title: "Newsletter Verification",
    from: "Al Aminn <updates@alaminn.info>",
    to: "{{subscriber.email}}",
    subject: "Please verify your email — Alaminn Newsletter",
    accent: "blue" as const,
    body: "Welcome! Please confirm your email address to start receiving executive insights and operational strategy updates. Click the verification link below to activate your subscription.",
  },
  {
    id: "ai-task-completed",
    title: "AI Task Completed",
    from: "AI Workspace <ai@alaminn.info>",
    to: "Al Aminn <al@alaminn.info>",
    subject: "Your AI task output is ready for review",
    accent: "orange" as const,
    body: "Your AI task \u2018{{workflow}}\u2019 has completed processing. The output is awaiting your approval before publication. Review the results and approve or request revisions.",
  },
];

function EmailTemplatePreviewCards() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4 text-orange-300" />
        <div className="font-display text-sm font-bold text-white">Email Templates</div>
        <span className="text-[10px] text-blue-300/60">{EMAIL_TEMPLATES.length} active</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {EMAIL_TEMPLATES.map((tpl, i) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/[0.07]"
          >
            {/* Accent top bar */}
            <div className={cn(
              "absolute inset-x-0 top-0 h-0.5",
              tpl.accent === "orange" ? "bg-orange-500/60" : "bg-blue-500/60"
            )} />

            {/* Card header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md",
                  tpl.accent === "orange" ? "bg-orange-500/20 text-orange-300" : "bg-blue-500/20 text-blue-300"
                )}>
                  <Mail className="h-3 w-3" />
                </span>
                <span className={cn(
                  "text-xs font-semibold",
                  tpl.accent === "orange" ? "text-orange-200" : "text-blue-200"
                )}>{tpl.title}</span>
              </div>
              <button className="inline-flex items-center gap-1 text-[10px] text-blue-400/60 transition-colors hover:text-blue-300">
                <Eye className="h-3 w-3" />
                View template
              </button>
            </div>

            {/* Mini email header */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 space-y-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-blue-400/60">From:</span>
                <span className="truncate text-blue-200">{tpl.from}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-blue-400/60">To:</span>
                <span className="truncate text-blue-300">{tpl.to}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-blue-400/60">Subj:</span>
                <span className={cn("truncate font-medium", tpl.accent === "orange" ? "text-orange-200" : "text-blue-200")}>{tpl.subject}</span>
              </div>
            </div>

            {/* Truncated body preview */}
            <div className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-blue-300/80">
              {tpl.body}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
