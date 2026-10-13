"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Phone, Mail,
  Users, Award, CheckCircle2, Clock,
  Calendar, MessageCircle, Shield, Target,
  TrendingUp, FileText, Send, X, Menu, Bell,
  Sparkles, RefreshCw,
  User, AlertCircle, Plus, BarChart3,
  FileCheck, ListTodo, RotateCw,
  ArrowUpRight, ArrowDownRight,
  MessageSquare, DollarSign,
  Activity, ChevronRight, Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { animationVariants, staggerContainer } from "@/lib/animations";

/* ─── Types ─── */
interface CrmDashboardProps { onBack: () => void; }
interface CrmStats {
  totalStudents: number; newLeads: number; activeApplications: number;
  offersReceived: number; visaProcessed: number; revenue: number;
}
interface CrmUser { id: string; name: string; email: string; role: string; }
interface Lead {
  id: string; leadId: string; fullName: string; email: string | null;
  phone: string; source: string; preferredCountry: string | null;
  preferredCourse: string | null; status: string; aiScore: number;
  leadScore: number; createdAt: string; assignedTo?: string | null;
}
interface Student {
  id: string; studentId: string; fullName: string; email: string;
  mobile: string; studyDestination: string | null; programTitle: string | null;
  studyLevel: string | null; profileCompletion: number; status: string;
}
interface Task {
  id: string; title: string; description?: string | null; dueDate: string;
  priority: string; status: string; assignedTo?: string | null;
  leadName?: string | null; type: string;
}

/* ─── Brand Colors ─── */
const ALO_ORANGE = "#E8501A";
const ALO_BLUE = "#0052B8";

/* ─── Pipeline Stages (Frappe CRM pattern) ─── */
const PIPELINE_STAGES = [
  { key: "NEW", label: "New", color: ALO_BLUE, bg: "#EFF6FF", border: "#BFDBFE" },
  { key: "CONTACTED", label: "Contacted", color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
  { key: "QUALIFIED", label: "Qualified", color: ALO_ORANGE, bg: "#FFF7ED", border: "#FED7AA" },
  { key: "CONVERTED", label: "Converted", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
  { key: "LOST", label: "Lost", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
];

/* ─── KPI Cards (OroCRM dashboard pattern) ─── */
const KPI_CARDS = [
  { key: "totalStudents", label: "Students", icon: Users, color: ALO_ORANGE, bg: "#FFF7ED", trend: "+12%", up: true },
  { key: "newLeads", label: "New Leads", icon: Target, color: ALO_BLUE, bg: "#EFF6FF", trend: "+23%", up: true },
  { key: "activeApplications", label: "Active Apps", icon: FileText, color: "#8B5CF6", bg: "#F5F3FF", trend: "+8%", up: true },
  { key: "offersReceived", label: "Offers", icon: Award, color: "#10B981", bg: "#ECFDF5", trend: "+15%", up: true },
  { key: "visaProcessed", label: "Visa Done", icon: Shield, color: "#F59E0B", bg: "#FFFBEB", trend: "-2%", up: false },
  { key: "revenue", label: "Revenue", icon: DollarSign, color: "#EC4899", bg: "#FDF2F8", trend: "+18%", up: true },
];

/* ─── Activity Types (Frappe CRM timeline pattern) ─── */
const ACTIVITY_TYPES: Record<string, { icon: typeof User; color: string; bg: string }> = {
  lead_created: { icon: User, color: ALO_ORANGE, bg: "#FFF7ED" },
  offer_received: { icon: Award, color: "#10B981", bg: "#ECFDF5" },
  visa_approved: { icon: Shield, color: ALO_BLUE, bg: "#EFF6FF" },
  app_submitted: { icon: Send, color: "#8B5CF6", bg: "#F5F3FF" },
  doc_verified: { icon: FileCheck, color: "#F59E0B", bg: "#FFFBEB" },
  whatsapp_msg: { icon: MessageCircle, color: "#25D366", bg: "#F0FDF4" },
  call_made: { icon: Phone, color: ALO_BLUE, bg: "#EFF6FF" },
  email_sent: { icon: Mail, color: "#EC4899", bg: "#FDF2F8" },
  follow_up: { icon: Clock, color: ALO_ORANGE, bg: "#FFF7ED" },
};

/* ─── Demo Data ─── */
const DEMO_STATS: CrmStats = { totalStudents: 234, newLeads: 89, activeApplications: 56, offersReceived: 31, visaProcessed: 18, revenue: 4500000 };
const DEMO_LEADS: Lead[] = [
  { id: "d1", leadId: "LD-001", fullName: "Rahim Ahmed", email: "rahim@email.com", phone: "+880171234567", source: "Website", preferredCountry: "UK", preferredCourse: "MBA", status: "NEW", aiScore: 8, leadScore: 80, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "d2", leadId: "LD-002", fullName: "Fatima Begum", email: "fatima@email.com", phone: "+880189876543", source: "Facebook", preferredCountry: "Canada", preferredCourse: "CS", status: "CONTACTED", aiScore: 7, leadScore: 70, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: "d3", leadId: "LD-003", fullName: "Karim Hossain", email: "karim@email.com", phone: "+880155544433", source: "Referral", preferredCountry: "Australia", preferredCourse: "Engineering", status: "QUALIFIED", aiScore: 9, leadScore: 90, createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: "d4", leadId: "LD-004", fullName: "Nusrat Jahan", email: "nusrat@email.com", phone: "+880167788899", source: "Google Ads", preferredCountry: "USA", preferredCourse: "MS Data Science", status: "CONVERTED", aiScore: 9, leadScore: 95, createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: "d5", leadId: "LD-005", fullName: "Tanvir Alam", email: null, phone: "+880199911122", source: "Website", preferredCountry: "Germany", preferredCourse: "BBA", status: "LOST", aiScore: 3, leadScore: 30, createdAt: new Date(Date.now() - 432000000).toISOString() },
  { id: "d6", leadId: "LD-006", fullName: "Sadia Islam", email: "sadia@email.com", phone: "+880161234567", source: "WhatsApp", preferredCountry: "UK", preferredCourse: "LLB", status: "NEW", aiScore: 6, leadScore: 60, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "d7", leadId: "LD-007", fullName: "Imran Khan", email: "imran@email.com", phone: "+880189876111", source: "Instagram", preferredCountry: "Canada", preferredCourse: "MBA", status: "CONTACTED", aiScore: 7, leadScore: 65, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "d8", leadId: "LD-008", fullName: "Lamia Haque", email: "lamia@email.com", phone: "+880153344455", source: "Referral", preferredCountry: "Australia", preferredCourse: "Nursing", status: "QUALIFIED", aiScore: 8, leadScore: 85, createdAt: new Date(Date.now() - 14400000).toISOString() },
];
const DEMO_STUDENTS: Student[] = [
  { id: "s1", studentId: "ST-001", fullName: "Nusrat Jahan", email: "nusrat@email.com", mobile: "+880167788899", studyDestination: "USA", programTitle: "MS Data Science", studyLevel: "Masters", profileCompletion: 85, status: "ACTIVE" },
  { id: "s2", studentId: "ST-002", fullName: "Sakib Hasan", email: "sakib@email.com", mobile: "+880153344455", studyDestination: "UK", programTitle: "MBA", studyLevel: "Masters", profileCompletion: 60, status: "ACTIVE" },
  { id: "s3", studentId: "ST-003", fullName: "Mithila Das", email: "mithila@email.com", mobile: "+880188877766", studyDestination: "Canada", programTitle: "BBA", studyLevel: "Bachelors", profileCompletion: 95, status: "ACTIVE" },
];
const DEMO_TASKS: Task[] = [
  { id: "t1", title: "Follow up with Rahim Ahmed", dueDate: "2025-03-15", priority: "HIGH", status: "PENDING", leadName: "Rahim Ahmed", type: "FOLLOW_UP" },
  { id: "t2", title: "Review documents for Fatima", dueDate: "2025-03-14", priority: "HIGH", status: "PENDING", leadName: "Fatima Begum", type: "DOCUMENT_REVIEW" },
  { id: "t3", title: "Schedule IELTS prep session", dueDate: "2025-03-20", priority: "MEDIUM", status: "PENDING", type: "SCHEDULING" },
  { id: "t4", title: "Send offer letter to Karim", dueDate: "2025-03-13", priority: "LOW", status: "COMPLETED", leadName: "Karim Hossain", type: "COMMUNICATION" },
];

const DEMO_ACTIVITIES = [
  { type: "lead_created", text: "New lead: Sadia Islam (WhatsApp)", time: "2 min ago" },
  { type: "whatsapp_msg", text: "WhatsApp reply from Rahim Ahmed", time: "15 min ago" },
  { type: "offer_received", text: "Offer received for Nusrat Jahan", time: "1 hr ago" },
  { type: "call_made", text: "Call completed with Fatima Begum", time: "2 hrs ago" },
  { type: "visa_approved", text: "Visa approved: Karim Hossain", time: "3 hrs ago" },
  { type: "app_submitted", text: "Application submitted for Lamia", time: "4 hrs ago" },
  { type: "email_sent", text: "Follow-up email sent to Imran", time: "5 hrs ago" },
  { type: "doc_verified", text: "Documents verified for Nusrat", time: "6 hrs ago" },
  { type: "follow_up", text: "Follow-up scheduled: Tanvir Alam", time: "8 hrs ago" },
];

const SOURCE_DATA = [
  { source: "Website", leads: 42, converted: 12, rate: 28.6 },
  { source: "Facebook", leads: 35, converted: 8, rate: 22.9 },
  { source: "WhatsApp", leads: 28, converted: 11, rate: 39.3 },
  { source: "Google Ads", leads: 22, converted: 7, rate: 31.8 },
  { source: "Referral", leads: 18, converted: 9, rate: 50.0 },
  { source: "Instagram", leads: 15, converted: 3, rate: 20.0 },
];

const MONTHLY_TREND = [
  { month: "Jul", leads: 45, converted: 8, revenue: 320 },
  { month: "Aug", leads: 52, converted: 11, revenue: 440 },
  { month: "Sep", leads: 68, converted: 15, revenue: 600 },
  { month: "Oct", leads: 59, converted: 12, revenue: 480 },
  { month: "Nov", leads: 73, converted: 18, revenue: 720 },
  { month: "Dec", leads: 82, converted: 22, revenue: 880 },
  { month: "Jan", leads: 89, converted: 24, revenue: 960 },
  { month: "Feb", leads: 78, converted: 20, revenue: 800 },
  { month: "Mar", leads: 95, converted: 28, revenue: 1120 },
];

/* ─── Score Badge ─── */
function ScoreBadge({ score }: { score: number }) {
  const tier = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";
  const colors = { HOT: "bg-red-50 text-red-700 border-red-200", WARM: "bg-amber-50 text-amber-700 border-amber-200", COLD: "bg-sky-50 text-sky-700 border-sky-200" };
  return <Badge className={`text-[10px] font-bold border ${colors[tier]}`}>{tier} {score}</Badge>;
}

/* ─── Main Component ─── */
export default function CrmDashboard({ onBack }: CrmDashboardProps) {
  const { data: session, status: authStatus } = useSession();
  const isDemo = authStatus === "unauthenticated";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<CrmUser | null>(null);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsFilter, setLeadsFilter] = useState("ALL");
  const [studentsSearch, setStudentsSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ─── Data Fetching ─── */
  const doFetch = async () => {
    if (isDemo) {
      setStats(DEMO_STATS); setLeads(DEMO_LEADS); setStudents(DEMO_STUDENTS); setTasks(DEMO_TASKS);
      setLoading(false); return;
    }
    if (authStatus !== "authenticated") return;
    setLoading(true); setErrors({});
    const results = await Promise.allSettled([
      fetch("/api/auth/me"), fetch("/api/crm/stats"), fetch("/api/leads"),
      fetch("/api/students"), fetch("/api/tasks"),
    ]);
    const [userRes, statsRes, leadsRes, studentsRes, tasksRes] = results;
    const ne: Record<string, string> = {};
    if (userRes.status === "fulfilled" && userRes.value.ok) { setUser((await userRes.value.json()).user); } else { ne.user = "Failed"; }
    if (statsRes.status === "fulfilled" && statsRes.value.ok) { setStats(await statsRes.value.json()); } else { ne.stats = "Failed"; }
    if (leadsRes.status === "fulfilled" && leadsRes.value.ok) { const d = await leadsRes.value.json(); setLeads(Array.isArray(d) ? d : d.leads || []); } else { ne.leads = "Failed"; }
    if (studentsRes.status === "fulfilled" && studentsRes.value.ok) { const d = await studentsRes.value.json(); setStudents(Array.isArray(d) ? d : d.students || []); } else { ne.students = "Failed"; }
    if (tasksRes.status === "fulfilled" && tasksRes.value.ok) { const d = await tasksRes.value.json(); setTasks(Array.isArray(d) ? d : d.tasks || []); } else { ne.tasks = "Failed"; }
    setErrors(ne); setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (isDemo) { if (!active) return; setStats(DEMO_STATS); setLeads(DEMO_LEADS); setStudents(DEMO_STUDENTS); setTasks(DEMO_TASKS); setLoading(false); return; }
      if (authStatus !== "authenticated") return;
      if (!active) return;
      setLoading(true); setErrors({});
      const results = await Promise.allSettled([fetch("/api/auth/me"), fetch("/api/crm/stats"), fetch("/api/leads"), fetch("/api/students"), fetch("/api/tasks")]);
      if (!active) return;
      const [userR, statsR, leadsR, studentsR, tasksR] = results;
      const ne: Record<string, string> = {};
      if (userR.status === "fulfilled" && userR.value.ok) { setUser((await userR.value.json()).user); } else { ne.user = "Failed"; }
      if (statsR.status === "fulfilled" && statsR.value.ok) { setStats(await statsR.value.json()); } else { ne.stats = "Failed"; }
      if (leadsR.status === "fulfilled" && leadsR.value.ok) { const d = await leadsR.value.json(); setLeads(Array.isArray(d) ? d : d.leads || []); } else { ne.leads = "Failed"; }
      if (studentsR.status === "fulfilled" && studentsR.value.ok) { const d = await studentsR.value.json(); setStudents(Array.isArray(d) ? d : d.students || []); } else { ne.students = "Failed"; }
      if (tasksR.status === "fulfilled" && tasksR.value.ok) { const d = await tasksR.value.json(); setTasks(Array.isArray(d) ? d : d.tasks || []); } else { ne.tasks = "Failed"; }
      setErrors(ne); setLoading(false);
    };
    run();
    return () => { active = false; };
  }, [authStatus, isDemo]);

  const userName = user?.name || (session?.user as Record<string, string>)?.name || (isDemo ? "Demo User" : "Staff");

  const filteredLeads = leads.filter((l) => {
    const q = leadsSearch.toLowerCase();
    const matchSearch = l.fullName.toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q) || (l.phone || "").includes(leadsSearch);
    const matchFilter = leadsFilter === "ALL" || l.status === leadsFilter;
    return matchSearch && matchFilter;
  });

  const filteredStudents = students.filter((s) => {
    const q = studentsSearch.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q);
  });

  /* ─── Computed Analytics ─── */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return counts;
  }, [leads]);

  const conversionRate = useMemo(() => {
    const total = leads.length || 1;
    return Math.round(((statusCounts.CONVERTED || 0) / total) * 100);
  }, [leads, statusCounts]);

  const pipelineValue = useMemo(() => {
    return leads.reduce((sum, l) => sum + (l.leadScore > 50 ? 25000 : 15000), 0);
  }, [leads]);

  const avgLeadScore = useMemo(() => {
    if (leads.length === 0) return 0;
    return Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length);
  }, [leads]);

  const sidebarItems = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "leads", label: "Leads", icon: Target },
    { key: "students", label: "Students", icon: Users },
    { key: "tasks", label: "Tasks", icon: ListTodo },
    { key: "analytics", label: "Analytics", icon: TrendingUp },
    { key: "pipeline", label: "Pipeline", icon: Activity },
  ];

  /* ─── Error Banner ─── */
  const ErrorBanner = () => {
    const errKeys = Object.keys(errors);
    if (errKeys.length === 0) return null;
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-sm text-red-700">{errors[errKeys[0]]}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-red-600 hover:text-red-800" onClick={doFetch}>
          <RotateCw className="w-3.5 h-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  };

  /* ─── Tab Content ─── */
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (<Skeleton key={i} className="h-28 rounded-xl" />))}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
            <ErrorBanner />

            {/* KPI Cards with Trend Arrows (OroCRM pattern) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {KPI_CARDS.map((kpi) => (
                <motion.div key={kpi.key} variants={animationVariants.fadeInUp}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.bg }}>
                          <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                        </div>
                        <div className={`flex items-center text-[11px] font-semibold ${kpi.up ? "text-emerald-600" : "text-red-500"}`}>
                          {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {kpi.trend}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {kpi.key === "revenue" ? (stats?.revenue ? `${(stats.revenue / 100000).toFixed(1)}L` : "0") : ((stats as Record<string, number>)?.[kpi.key] ?? 0)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Row 2: Pipeline Funnel + Activity Timeline (Frappe CRM pattern) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Lead Conversion Funnel (CRMEB sales funnel pattern) */}
              <motion.div variants={animationVariants.fadeInUp} className="lg:col-span-3">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Lead Conversion Funnel</CardTitle>
                      <Badge className="text-xs" style={{ backgroundColor: ALO_BLUE, color: "white" }}>
                        {conversionRate}% conversion
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {(() => {
                      const funnelSteps = PIPELINE_STAGES.map((stage) => ({
                        ...stage,
                        count: statusCounts[stage.key] || 0,
                      }));
                      const maxCount = Math.max(...funnelSteps.map((s) => s.count), 1);
                      return (
                        <div className="space-y-2.5">
                          {funnelSteps.map((step, idx) => {
                            const prevCount = idx > 0 ? funnelSteps[idx - 1].count : step.count;
                            const stageConversion = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 0;
                            return (
                              <div key={step.key} className="flex items-center gap-3">
                                <span className="text-sm text-slate-600 w-20 shrink-0 font-medium">{step.label}</span>
                                <div className="flex-1 h-9 bg-slate-50 rounded-lg overflow-hidden relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max((step.count / maxCount) * 100, step.count > 0 ? 8 : 0)}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                    className="h-full rounded-lg flex items-center px-3"
                                    style={{ backgroundColor: step.color }}
                                  >
                                    <span className="text-white text-sm font-bold">{step.count}</span>
                                  </motion.div>
                                </div>
                                <span className="text-sm text-slate-500 w-12 text-right font-mono">
                                  {leads.length > 0 ? `${Math.round((step.count / leads.length) * 100)}%` : "0%"}
                                </span>
                                {idx > 0 && (
                                  <span className="text-[11px] text-slate-400 w-12 text-right">
                                    {stageConversion}%
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Activity Timeline (Frappe CRM timeline pattern) */}
              <motion.div variants={animationVariants.fadeInUp} className="lg:col-span-2">
                <Card className="border-0 shadow-sm h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
                      <Activity className="w-4 h-4 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-1">
                        {DEMO_ACTIVITIES.map((act, idx) => {
                          const actType = ACTIVITY_TYPES[act.type] || ACTIVITY_TYPES.lead_created;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0"
                            >
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: actType.bg }}>
                                <actType.icon className="w-3.5 h-3.5" style={{ color: actType.color }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-700 font-medium truncate">{act.text}</p>
                                <p className="text-[11px] text-slate-400">{act.time}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Row 3: Quick Stats Bar (IDURAR ERP pattern) */}
            <motion.div variants={animationVariants.fadeInUp}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-slate-500">Avg. Days to Convert</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">28</p>
                  <p className="text-[11px] text-emerald-600 font-medium">-3 from last month</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4" style={{ color: ALO_ORANGE }} />
                    <span className="text-xs text-slate-500">Avg. Lead Score</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{avgLeadScore}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">+5 from last month</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-slate-500">Pipeline Value</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{(pipelineValue / 1000).toFixed(0)}K</p>
                  <p className="text-[11px] text-emerald-600 font-medium">+18% growth</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-slate-500">WhatsApp Replies</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">34</p>
                  <p className="text-[11px] text-emerald-600 font-medium">89% response rate</p>
                </div>
              </div>
            </motion.div>

            {/* Row 4: Source Performance + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={animationVariants.fadeInUp} className="lg:col-span-2">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Lead Sources Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={SOURCE_DATA} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="source" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                        <Bar dataKey="leads" fill={ALO_BLUE} radius={[4, 4, 0, 0]} name="Leads" />
                        <Bar dataKey="converted" fill={ALO_ORANGE} radius={[4, 4, 0, 0]} name="Converted" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={animationVariants.fadeInUp}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {[
                      { icon: Plus, label: "Add New Lead", color: ALO_BLUE },
                      { icon: MessageCircle, label: "WhatsApp Broadcast", color: "#25D366" },
                      { icon: Phone, label: "Schedule Call", color: ALO_ORANGE },
                      { icon: Mail, label: "Email Follow-up", color: "#8B5CF6" },
                      { icon: Calendar, label: "Book Appointment", color: "#10B981" },
                      { icon: FileText, label: "Generate Report", color: "#F59E0B" },
                    ].map((action) => (
                      <button key={action.label} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
                          <action.icon className="w-4 h-4" style={{ color: action.color }} />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{action.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        );

      case "leads":
        return (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            <ErrorBanner />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Leads ({filteredLeads.length})</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search leads..." value={leadsSearch} onChange={(e) => setLeadsSearch(e.target.value)} className="pl-9 h-9 w-56" />
                </div>
                <select value={leadsFilter} onChange={(e) => setLeadsFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="ALL">All Status</option>
                  {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>AI</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const stage = PIPELINE_STAGES.find(s => s.key === lead.status);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{lead.fullName}</p>
                            <p className="text-xs text-slate-400">{lead.email || lead.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{lead.source}</Badge></TableCell>
                        <TableCell className="text-sm">{lead.preferredCountry || "—"}</TableCell>
                        <TableCell>
                          <Badge className="text-xs text-white" style={{ backgroundColor: stage?.color || "#6B7280" }}>{stage?.label || lead.status}</Badge>
                        </TableCell>
                        <TableCell><ScoreBadge score={lead.leadScore} /></TableCell>
                        <TableCell><span className="text-sm font-mono">{lead.aiScore}/10</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button className="p-1 hover:bg-slate-100 rounded"><Phone className="w-3.5 h-3.5 text-slate-400" /></button>
                            <button className="p-1 hover:bg-slate-100 rounded"><Mail className="w-3.5 h-3.5 text-slate-400" /></button>
                            <button className="p-1 hover:bg-green-50 rounded"><MessageCircle className="w-3.5 h-3.5 text-green-500" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        );

      case "students":
        return (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            <ErrorBanner />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Students ({filteredStudents.length})</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search students..." value={studentsSearch} onChange={(e) => setStudentsSearch(e.target.value)} className="pl-9 h-9 w-56" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{s.fullName}</p>
                          <p className="text-xs text-slate-400">{s.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{s.studyDestination || "—"}</TableCell>
                      <TableCell>
                        <p className="text-sm">{s.programTitle || "—"}</p>
                        <p className="text-xs text-slate-400">{s.studyLevel}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={s.profileCompletion} className="w-16 h-1.5" />
                          <span className="text-xs text-slate-500">{s.profileCompletion}%</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className="bg-emerald-50 text-emerald-700 text-xs">Active</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        );

      case "tasks":
        return (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            <ErrorBanner />
            <h2 className="text-xl font-bold text-slate-900">Tasks & Follow-ups</h2>
            <div className="space-y-2">
              {tasks.map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
                const priorityColor = task.priority === "HIGH" ? "text-red-600" : task.priority === "MEDIUM" ? "text-amber-600" : "text-slate-400";
                return (
                  <motion.div key={task.id} variants={animationVariants.fadeInUp} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === "COMPLETED" ? "bg-emerald-500" : isOverdue ? "bg-red-500" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-900"}`}>{task.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {task.leadName && <span className="text-xs text-slate-400">Lead: {task.leadName}</span>}
                        <span className={`text-xs font-medium ${priorityColor}`}>{task.priority}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{task.dueDate}</span>
                        {isOverdue && <Badge className="bg-red-50 text-red-600 text-[10px]">Overdue</Badge>}
                      </div>
                    </div>
                    {task.status !== "COMPLETED" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs">Complete</Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );

      case "analytics":
        return (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
            <ErrorBanner />
            <h2 className="text-xl font-bold text-slate-900">Analytics & Reports</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Monthly Lead Trend</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={MONTHLY_TREND}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="leads" stroke={ALO_BLUE} fill={`${ALO_BLUE}20`} strokeWidth={2} name="Leads" />
                      <Area type="monotone" dataKey="converted" stroke={ALO_ORANGE} fill={`${ALO_ORANGE}20`} strokeWidth={2} name="Converted" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Revenue Trend (BDT K)</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={MONTHLY_TREND}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                      <Bar dataKey="revenue" fill={ALO_ORANGE} radius={[4, 4, 0, 0]} name="Revenue (K)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Source Conversion Rates</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={SOURCE_DATA} layout="vertical" barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 60]} />
                    <YAxis dataKey="source" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                    <Bar dataKey="rate" fill={ALO_BLUE} radius={[0, 4, 4, 0]} name="Conversion %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "pipeline":
        return (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Sales Pipeline View</h2>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {PIPELINE_STAGES.map((stage) => {
                const stageLeads = leads.filter(l => l.status === stage.key);
                const stageValue = stageLeads.reduce((sum, l) => sum + (l.leadScore > 50 ? 25000 : 15000), 0);
                return (
                  <div key={stage.key} className="min-w-[240px] flex-1">
                    <div className="rounded-t-xl px-3 py-2.5" style={{ backgroundColor: stage.bg, borderBottom: `2px solid ${stage.border}` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                          <span className="font-semibold text-sm text-slate-800">{stage.label}</span>
                        </div>
                        <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded">{stageLeads.length}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{(stageValue / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="bg-slate-50 rounded-b-xl p-2 space-y-2 min-h-[200px]">
                      {stageLeads.map(lead => (
                        <div key={lead.id} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-900 truncate">{lead.fullName}</span>
                            <ScoreBadge score={lead.leadScore} />
                          </div>
                          <p className="text-xs text-slate-500">{lead.preferredCountry} &middot; {lead.preferredCourse}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-[10px]">{lead.source}</Badge>
                            <span className="text-[10px] text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      {stageLeads.length === 0 && (
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">
                          No leads
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-slate-900 transform transition-transform duration-200 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:static`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white">ALO CRM</h1>
              <p className="text-[11px] text-white/40">Education Consultancy</p>
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === item.key ? "bg-white/10 text-white font-medium" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: ALO_ORANGE, color: "white" }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-white font-medium">{userName}</p>
                <p className="text-[10px] text-white/40">Counselor</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs" style={{ backgroundColor: ALO_ORANGE, color: "white" }}>
              {leads.length} Leads
            </Badge>
            <button className="p-1.5 hover:bg-slate-100 rounded-lg relative">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>
        <div className="p-4 lg:p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
