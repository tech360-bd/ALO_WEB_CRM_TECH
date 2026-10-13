"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronRight, Search, BookOpen, GraduationCap,
  Users, CheckCircle2, Clock, Calendar, MessageCircle, Shield,
  Zap, FileText, Send, X, Bell, Settings, LogOut, Upload, Eye,
  Brain, Sparkles, Bot, RefreshCw, User, Edit3, AlertCircle,
  Plus, BarChart3, FileCheck, CreditCard, Globe, Target, Star,
  ArrowRight, Wallet, Receipt, Plane, ClipboardCheck, Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { animationVariants, staggerContainer } from "@/lib/animations";

interface StudentDashboardProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
}

interface UserProfile {
  id: string; name: string; email: string; phone?: string; role: string; status: string;
}

interface Application {
  id: string; applicationId: string; university: string; course: string;
  country: string; intake: string; studyLevel: string; stage: string;
  priority: string; createdAt: string;
}

interface Notification {
  id: string; title: string; message: string; read: boolean; createdAt: string;
}

interface Document {
  id: string; category: string; name: string; status: "pending" | "uploaded" | "verified" | "rejected";
  uploadedAt?: string; fileName?: string;
}

interface VisaStep {
  id: string; title: string; status: "completed" | "current" | "upcoming"; description: string;
}

interface Payment {
  id: string; description: string; amount: number; currency: string; status: "paid" | "pending" | "overdue";
  dueDate: string; paidAt?: string; invoiceUrl?: string;
}

interface ChatMessage {
  role: "user" | "assistant"; content: string;
}

interface ApiError {
  endpoint: string; message: string;
}

const STAGE_ORDER = ["COUNSELING", "DOCUMENT_COLLECTED", "APPLICATION_SUBMITTED", "OFFER_RECEIVED", "VISA_PROCESSING", "ENROLLED"];
const STAGE_LABELS: Record<string, string> = {
  COUNSELING: "Counseling", DOCUMENT_COLLECTED: "Documents", APPLICATION_SUBMITTED: "Applied",
  OFFER_RECEIVED: "Offer", VISA_PROCESSING: "Visa", ENROLLED: "Enrolled",
};
const STAGE_COLORS: Record<string, string> = {
  COUNSELING: "bg-slate-100 text-slate-600", DOCUMENT_COLLECTED: "bg-amber-50 text-amber-700",
  APPLICATION_SUBMITTED: "bg-blue-50 text-blue-700", OFFER_RECEIVED: "bg-emerald-50 text-emerald-700",
  VISA_PROCESSING: "bg-purple-50 text-purple-700", ENROLLED: "bg-[#F37021]/10 text-[#F37021]",
};

// Demo data for unauthenticated visitors
const DEMO_PROFILE: UserProfile = { id: "demo", name: "Sarah Johnson", email: "sarah@example.com", role: "student", status: "active" };
const DEMO_APPLICATIONS: Application[] = [
  { id: "d1", applicationId: "ALO-2024-001", university: "University of Manchester", course: "MSc Computer Science", country: "UK", intake: "Sep 2025", studyLevel: "Masters", stage: "APPLICATION_SUBMITTED", priority: "high", createdAt: "2024-12-01" },
  { id: "d2", applicationId: "ALO-2024-002", university: "University of Melbourne", course: "BSc Data Science", country: "Australia", intake: "Feb 2025", studyLevel: "Bachelors", stage: "DOCUMENT_COLLECTED", priority: "medium", createdAt: "2024-11-15" },
  { id: "d3", applicationId: "ALO-2024-003", university: "TU Munich", course: "MSc AI & Robotics", country: "Germany", intake: "Oct 2025", studyLevel: "Masters", stage: "COUNSELING", priority: "high", createdAt: "2024-12-10" },
];
const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Application Update", message: "Your Manchester application is now under review.", read: false, createdAt: "2024-12-20" },
  { id: "n2", title: "Document Required", message: "Please upload your IELTS score report.", read: false, createdAt: "2024-12-19" },
  { id: "n3", title: "Offer Letter", message: "Congratulations! Conditional offer from Melbourne.", read: true, createdAt: "2024-12-15" },
];
const DEMO_DOCUMENTS: Document[] = [
  { id: "dd1", category: "Identity", name: "Passport Copy", status: "verified", uploadedAt: "2024-11-20" },
  { id: "dd2", category: "Academic", name: "Academic Transcripts", status: "uploaded", uploadedAt: "2024-11-22" },
  { id: "dd3", category: "Language", name: "IELTS Score Report", status: "pending" },
  { id: "dd4", category: "Personal", name: "Statement of Purpose", status: "rejected", uploadedAt: "2024-11-25" },
  { id: "dd5", category: "Personal", name: "CV / Resume", status: "uploaded", uploadedAt: "2024-12-01" },
  { id: "dd6", category: "Financial", name: "Bank Statement", status: "pending" },
  { id: "dd7", category: "Academic", name: "Letters of Recommendation", status: "pending" },
];
const DEMO_VISA_STEPS: VisaStep[] = [
  { id: "v1", title: "Receive CAS/COE Letter", status: "completed", description: "Confirmation of Acceptance received" },
  { id: "v2", title: "Prepare Financial Evidence", status: "current", description: "Gather bank statements & sponsorship letters" },
  { id: "v3", title: "Complete Visa Application Form", status: "upcoming", description: "Fill online visa application" },
  { id: "v4", title: "Book Biometrics Appointment", status: "upcoming", description: "Schedule fingerprint & photo appointment" },
  { id: "v5", title: "Attend Visa Interview", status: "upcoming", description: "Attend in-person appointment" },
  { id: "v6", title: "Receive Visa Decision", status: "upcoming", description: "Wait for visa decision notification" },
];
const DEMO_PAYMENTS: Payment[] = [
  { id: "p1", description: "Application Fee - Manchester", amount: 150, currency: "GBP", status: "paid", dueDate: "2024-12-01", paidAt: "2024-11-28" },
  { id: "p2", description: "ALO Service Fee", amount: 25000, currency: "INR", status: "paid", dueDate: "2024-12-05", paidAt: "2024-12-03" },
  { id: "p3", description: "Application Fee - Melbourne", amount: 100, currency: "AUD", status: "pending", dueDate: "2025-01-15" },
  { id: "p4", description: "Visa Application Fee", amount: 348, currency: "GBP", status: "pending", dueDate: "2025-02-01" },
  { id: "p5", description: "IELTS Exam Fee", amount: 16250, currency: "INR", status: "overdue", dueDate: "2024-12-10" },
];

const AI_SUGGESTIONS = [
  "What are the entry requirements for UK universities?",
  "How do I apply for a student visa?",
  "What scholarships are available in Australia?",
  "Compare Masters programs in Germany vs UK",
  "What IELTS score do I need?",
  "Help me with my Statement of Purpose",
];

const DOC_STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: typeof CheckCircle2; iconColor: string; bg: string }> = {
  verified: { label: "Verified", badgeClass: "bg-emerald-50 text-emerald-700", icon: CheckCircle2, iconColor: "text-emerald-600", bg: "bg-emerald-50" },
  uploaded: { label: "Uploaded", badgeClass: "bg-blue-50 text-blue-700", icon: Eye, iconColor: "text-blue-600", bg: "bg-blue-50" },
  pending: { label: "Pending", badgeClass: "bg-amber-50 text-amber-700", icon: Clock, iconColor: "text-amber-600", bg: "bg-amber-50" },
  rejected: { label: "Rejected", badgeClass: "bg-red-50 text-red-600", icon: AlertCircle, iconColor: "text-red-500", bg: "bg-red-50" },
};

export default function StudentDashboard({ onBack, onNavigate }: StudentDashboardProps) {
  const { data: session, status: authStatus } = useSession();
  const isDemo = authStatus === "unauthenticated";

  const [activeTab, setActiveTab] = useState("overview");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [visaSteps, setVisaSteps] = useState<VisaStep[]>([]);
  const [visaReadiness, setVisaReadiness] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiErrors, setApiErrors] = useState<ApiError[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // AI Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Add API error helper
  const addError = useCallback((endpoint: string, message: string) => {
    setApiErrors((prev) => prev.filter((e) => e.endpoint !== endpoint).concat({ endpoint, message }));
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (isDemo) {
      setUserProfile(DEMO_PROFILE);
      setApplications(DEMO_APPLICATIONS);
      setNotifications(DEMO_NOTIFICATIONS);
      setDocuments(DEMO_DOCUMENTS);
      setVisaSteps(DEMO_VISA_STEPS);
      setVisaReadiness(58);
      setPayments(DEMO_PAYMENTS);
      setLoading(false);
      return;
    }
    if (authStatus !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    setApiErrors([]);

    try {
      const endpoints = [
        { url: "/api/auth/me", handler: async (r: Response) => { const d = await r.json(); setUserProfile(d.user); } },
        { url: "/api/applications", handler: async (r: Response) => { const d = await r.json(); setApplications(Array.isArray(d) ? d : d.applications || []); } },
        { url: "/api/notifications", handler: async (r: Response) => { const d = await r.json(); setNotifications(Array.isArray(d) ? d : d.notifications || []); } },
        { url: "/api/documents", handler: async (r: Response) => { const d = await r.json(); setDocuments(Array.isArray(d) ? d : d.documents || []); } },
        { url: "/api/visa", handler: async (r: Response) => { const d = await r.json(); setVisaSteps(d.steps || []); setVisaReadiness(d.readiness || 0); } },
        { url: "/api/payments", handler: async (r: Response) => { const d = await r.json(); setPayments(Array.isArray(d) ? d : d.payments || []); } },
      ];

      const results = await Promise.allSettled(endpoints.map((e) => fetch(e.url)));

      for (let i = 0; i < results.length; i++) {
        if (cancelled) return;
        const result = results[i];
        if (result.status === "fulfilled" && result.value.ok) {
          await endpoints[i].handler(result.value);
        } else {
          addError(endpoints[i].url, `Failed to load data from ${endpoints[i].url}`);
        }
      }
    } catch {
      addError("general", "Network error. Please check your connection.");
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => { cancelled = true; };
  }, [authStatus, isDemo, addError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const sendChatMessage = async (text?: string) => {
    const msg = text || chatInput.trim();
    if (!msg || chatLoading) return;
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context: "student-dashboard" }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.message || data.response || "I'm here to help with your study abroad journey!" }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const userName = userProfile?.name || (session?.user as any)?.name || (isDemo ? "Sarah" : "Student");
  const userEmail = userProfile?.email || (session?.user as any)?.email || "";
  const profileCompletion = isDemo ? 65 : 65; // Would come from API

  const getStageProgress = (stage: string) => {
    const idx = STAGE_ORDER.indexOf(stage);
    return idx >= 0 ? ((idx + 1) / STAGE_ORDER.length) * 100 : 0;
  };

  // Demo banner
  const DemoBanner = () => (
    <div className="bg-gradient-to-r from-[#F37021]/10 to-[#0066CC]/10 border-b border-[#F37021]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-[#F37021]" />
          <span className="text-slate-700">You're viewing a <strong>demo</strong> of the student portal</span>
        </div>
        <Button size="sm" className="h-7 bg-[#F37021] hover:bg-[#E85D10] text-white text-xs" onClick={() => onNavigate("auth")}>
          Sign In
        </Button>
      </div>
    </div>
  );

  // Error banner with retry
  const ErrorBanner = () => {
    if (apiErrors.length === 0) return null;
    return (
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span>{apiErrors.length === 1 ? apiErrors[0].message : "Some data failed to load."}</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100" onClick={() => fetchData()}>
            <RefreshCw className="w-3 h-3 mr-1" /> Retry
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isDemo && <DemoBanner />}
      {!isDemo && <ErrorBanner />}

      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F37021] rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 hidden sm:block">ALO</span>
              <Badge variant="secondary" className="text-[10px] bg-[#0066CC]/10 text-[#0066CC] hidden sm:flex">Student Portal</Badge>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {isDemo && <Badge className="bg-[#F37021]/10 text-[#F37021] text-xs border-0">Demo</Badge>}
            <span className="text-sm font-medium text-slate-700 hidden md:block">{userName}</span>

            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#F37021] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifications</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-[#F37021]" onClick={() => setShowNotifications(false)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <ScrollArea className="max-h-64">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">No notifications yet</div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {notifications.map((n) => (
                            <div key={n.id} className={`p-3 ${!n.read ? "bg-[#F37021]/5" : ""}`}>
                              <p className="text-sm font-medium text-slate-800">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="w-5 h-5 text-slate-600" />
            </Button>

            {!isDemo && (
              <Button variant="ghost" size="sm" className="h-9 text-slate-500 hover:text-red-600" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-32 rounded-xl" />))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full flex overflow-x-auto bg-white border border-slate-200 rounded-xl p-1 h-auto gap-1 mb-6 no-scrollbar">
                {[
                  { key: "overview", label: "Overview", icon: BarChart3 },
                  { key: "applications", label: "Applications", icon: FileText },
                  { key: "documents", label: "Documents", icon: FileCheck },
                  { key: "visa", label: "Visa", icon: Plane },
                  { key: "payments", label: "Payments", icon: CreditCard },
                  { key: "messages", label: "Messages", icon: MessageCircle },
                  { key: "timeline", label: "Timeline", icon: Clock },
                ].map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium data-[state=active]:bg-[#F37021] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg whitespace-nowrap transition-all">
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ===== OVERVIEW TAB ===== */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Welcome + Profile Card */}
                  <motion.div variants={animationVariants.fadeInUp}>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#F37021] to-[#FFB347] rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">Welcome, {userName.split(" ")[0]}!</h3>
                            <p className="text-sm text-slate-500">{userEmail}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Profile Completion</span>
                            <span className="font-semibold text-[#F37021]">{profileCompletion}%</span>
                          </div>
                          <Progress value={profileCompletion} className="h-2 bg-slate-100" />
                          <p className="text-xs text-slate-400">Complete your profile to unlock all features</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4 border-[#F37021]/30 text-[#F37021] hover:bg-[#F37021]/5">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Complete Profile
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Application Pipeline */}
                  <motion.div variants={animationVariants.fadeInUp} className="lg:col-span-2">
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Target className="w-5 h-5 text-[#F37021]" />
                          Application Pipeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        {applications.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No active applications</p>
                            <Button size="sm" className="mt-3 bg-[#F37021] hover:bg-[#E85D10] text-white">
                              <Plus className="w-4 h-4 mr-1" /> Start Application
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {applications.slice(0, 3).map((app) => (
                              <div key={app.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-sm text-slate-900">{app.university}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{app.course} · {app.country}</p>
                                  </div>
                                  <Badge variant="secondary" className={STAGE_COLORS[app.stage] || "bg-slate-100 text-slate-600"}>
                                    {STAGE_LABELS[app.stage] || app.stage}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  {STAGE_ORDER.map((s, idx) => (
                                    <div key={s} className="flex items-center">
                                      <div className={`w-full h-1.5 rounded-full transition-colors ${STAGE_ORDER.indexOf(app.stage) >= idx ? "bg-[#F37021]" : "bg-slate-200"}`} style={{ width: idx === STAGE_ORDER.length - 1 ? "1.5rem" : "2rem" }} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div variants={animationVariants.fadeInUp}>
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[#0066CC]" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 grid grid-cols-2 gap-2">
                        {[
                          { label: "Book Appointment", icon: Calendar, color: "text-[#F37021]", bg: "bg-[#F37021]/10" },
                          { label: "Upload Document", icon: Upload, color: "text-[#0066CC]", bg: "bg-[#0066CC]/10" },
                          { label: "View Offers", icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
                          { label: "Course Finder", icon: Search, color: "text-purple-600", bg: "bg-purple-50" },
                        ].map((action) => (
                          <button key={action.label} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className={`w-10 h-10 ${action.bg} rounded-xl flex items-center justify-center`}>
                              <action.icon className={`w-5 h-5 ${action.color}`} />
                            </div>
                            <span className="text-xs font-medium text-slate-600 text-center">{action.label}</span>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recent Notifications */}
                  <motion.div variants={animationVariants.fadeInUp}>
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Bell className="w-5 h-5 text-[#F37021]" />
                          Recent Notifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">No notifications</p>
                        ) : (
                          <div className="space-y-3">
                            {notifications.slice(0, 3).map((n) => (
                              <div key={n.id} className={`p-3 rounded-lg ${!n.read ? "bg-[#F37021]/5 border border-[#F37021]/10" : "bg-slate-50"}`}>
                                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* AI Assistant Chat */}
                  <motion.div variants={animationVariants.fadeInUp} className="lg:col-span-2">
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-600" />
                          <Sparkles className="w-4 h-4 text-[#F37021]" />
                          ALO AI Assistant
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <div className="bg-slate-50 rounded-xl h-64 overflow-y-auto p-4 space-y-3 max-h-96">
                          {chatMessages.length === 0 && (
                            <div className="text-center py-6">
                              <Bot className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                              <p className="text-sm text-slate-400 mb-4">Ask me about universities, courses, visas, or scholarships!</p>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {AI_SUGGESTIONS.slice(0, 4).map((s) => (
                                  <button key={s} onClick={() => sendChatMessage(s)} className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-[#F37021]/40 hover:text-[#F37021] transition-colors">
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {chatMessages.map((msg, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === "user" ? "bg-[#F37021] text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"}`}>
                                {msg.content}
                              </div>
                            </motion.div>
                          ))}
                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                        {/* Suggested questions when chat has messages */}
                        {chatMessages.length > 0 && chatMessages.length < 4 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {AI_SUGGESTIONS.slice(4).map((s) => (
                              <button key={s} onClick={() => sendChatMessage(s)} className="text-[11px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-slate-500 hover:border-[#F37021]/40 hover:text-[#F37021] transition-colors">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Input placeholder="Ask about universities, courses, visas..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChatMessage()} disabled={chatLoading} className="flex-1 h-10 bg-slate-50 border-slate-200" />
                          <Button onClick={() => sendChatMessage()} disabled={chatLoading || !chatInput.trim()} size="icon" className="h-10 w-10 bg-[#F37021] hover:bg-[#E85D10] text-white shrink-0">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              {/* ===== APPLICATIONS TAB ===== */}
              <TabsContent value="applications">
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">My Applications</h2>
                    <Button className="bg-[#F37021] hover:bg-[#E85D10] text-white" size="sm">
                      <Plus className="w-4 h-4 mr-2" /> New Application
                    </Button>
                  </div>
                  {applications.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-slate-700 mb-1">No Applications Yet</h3>
                        <p className="text-sm text-slate-500 mb-4">Start your study abroad journey by creating your first application.</p>
                        <Button className="bg-[#F37021] hover:bg-[#E85D10] text-white">
                          <Plus className="w-4 h-4 mr-2" /> Create Application
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applications.map((app) => (
                        <motion.div key={app.id} variants={animationVariants.fadeInUp}>
                          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Globe className="w-4 h-4 text-[#0066CC]" />
                                    <span className="text-xs text-slate-400">{app.country}</span>
                                  </div>
                                  <h3 className="font-semibold text-slate-900">{app.university}</h3>
                                  <p className="text-sm text-slate-500 mt-0.5">{app.course}</p>
                                </div>
                                <Badge variant="secondary" className={STAGE_COLORS[app.stage] || "bg-slate-100 text-slate-600"}>
                                  {STAGE_LABELS[app.stage] || app.stage}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {app.intake}</span>
                                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {app.studyLevel}</span>
                              </div>
                              <div className="mb-3">
                                <div className="flex items-center gap-1 mb-2">
                                  {STAGE_ORDER.map((s, sidx) => (
                                    <div key={s} className="flex items-center">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${STAGE_ORDER.indexOf(app.stage) >= sidx ? "bg-[#F37021] text-white" : "bg-slate-100 text-slate-400"}`}>
                                        {STAGE_ORDER.indexOf(app.stage) >= sidx ? <CheckCircle2 className="w-3.5 h-3.5" /> : sidx + 1}
                                      </div>
                                      {sidx < STAGE_ORDER.length - 1 && (
                                        <div className={`w-4 h-0.5 ${STAGE_ORDER.indexOf(app.stage) > sidx ? "bg-[#F37021]" : "bg-slate-200"}`} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <Progress value={getStageProgress(app.stage)} className="h-1.5 bg-slate-100" />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">ID: {app.applicationId}</span>
                                <Button variant="ghost" size="sm" className="text-[#0066CC] text-xs h-7">
                                  View Details <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              {/* ===== DOCUMENTS TAB ===== */}
              <TabsContent value="documents">
                <motion.div variants={animationVariants.fadeInUp} initial="initial" animate="animate" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Document Checklist</h2>
                      <p className="text-sm text-slate-500 mt-0.5">{documents.filter((d) => d.status === "verified").length} of {documents.length} documents verified</p>
                    </div>
                    <Button className="bg-[#F37021] hover:bg-[#E85D10] text-white" size="sm">
                      <Upload className="w-4 h-4 mr-2" /> Upload Document
                    </Button>
                  </div>

                  {/* Document Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Verified", count: documents.filter((d) => d.status === "verified").length, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
                      { label: "Uploaded", count: documents.filter((d) => d.status === "uploaded").length, color: "text-blue-600", bg: "bg-blue-50", icon: Eye },
                      { label: "Pending", count: documents.filter((d) => d.status === "pending").length, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
                      { label: "Rejected", count: documents.filter((d) => d.status === "rejected").length, color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
                    ].map((stat) => (
                      <Card key={stat.label} className="border-0 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                            <p className="text-xs text-slate-500">{stat.label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {documents.length === 0 ? (
                          <div className="p-12 text-center">
                            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm">No documents yet. Upload your first document.</p>
                          </div>
                        ) : documents.map((doc) => {
                          const cfg = DOC_STATUS_CONFIG[doc.status];
                          const IconComp = cfg.icon;
                          return (
                            <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center`}>
                                  <IconComp className={`w-5 h-5 ${cfg.iconColor}`} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                                  <p className="text-xs text-slate-400">{doc.category} {doc.uploadedAt ? `· ${doc.uploadedAt}` : ""}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={cfg.badgeClass}>{cfg.label}</Badge>
                                {(doc.status === "pending" || doc.status === "rejected") && (
                                  <Button variant="ghost" size="sm" className="h-8 text-[#F37021] hover:bg-[#F37021]/5">
                                    <Upload className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* ===== VISA TAB ===== */}
              <TabsContent value="visa">
                <motion.div variants={animationVariants.fadeInUp} initial="initial" animate="animate" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Visa Application</h2>
                    <Badge className="bg-purple-50 text-purple-700 border-0">In Progress</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Readiness Score */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6 text-center">
                        <Gauge className="w-8 h-8 text-[#0066CC] mx-auto mb-3" />
                        <h3 className="text-sm font-medium text-slate-600 mb-2">Readiness Score</h3>
                        <div className="relative w-24 h-24 mx-auto mb-3">
                          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#F37021" strokeWidth="8" strokeDasharray={`${visaReadiness * 2.51} 251`} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-900">{visaReadiness}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">{visaReadiness >= 80 ? "Almost ready!" : visaReadiness >= 50 ? "Good progress" : "More documents needed"}</p>
                      </CardContent>
                    </Card>

                    {/* Visa Checklist */}
                    <Card className="border-0 shadow-sm md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <ClipboardCheck className="w-5 h-5 text-[#F37021]" />
                          Visa Checklist
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <div className="space-y-3">
                          {[
                            { item: "Valid Passport (6+ months)", done: true },
                            { item: "CAS/COE Letter", done: true },
                            { item: "Financial Evidence", done: false },
                            { item: "Tuberculosis Test (if applicable)", done: false },
                            { item: "ATAS Certificate (if applicable)", done: false },
                          ].map((c) => (
                            <div key={c.item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${c.done ? "bg-emerald-100" : "bg-slate-100"}`}>
                                {c.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
                              </div>
                              <span className={`text-sm ${c.done ? "text-slate-700" : "text-slate-500"}`}>{c.item}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Visa Timeline */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#0066CC]" />
                        Visa Steps Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      {visaSteps.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No visa steps yet. Apply for an offer first.</p>
                      ) : (
                        <div className="relative">
                          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
                          <div className="space-y-6">
                            {visaSteps.map((step, idx) => (
                              <motion.div key={step.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }} className="flex items-start gap-4 relative">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-sm ${step.status === "completed" ? "bg-emerald-500 text-white" : step.status === "current" ? "bg-[#F37021] text-white" : "bg-slate-100 text-slate-400"}`}>
                                  {step.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                                </div>
                                <div className="flex-1 pb-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${step.status === "completed" ? "text-emerald-600" : step.status === "current" ? "text-[#F37021]" : "text-slate-400"}`}>
                                      {step.status === "completed" ? "Done" : step.status === "current" ? "In Progress" : "Upcoming"}
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-sm text-slate-900">{step.title}</h4>
                                  <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* ===== PAYMENTS TAB ===== */}
              <TabsContent value="payments">
                <motion.div variants={animationVariants.fadeInUp} initial="initial" animate="animate" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
                    <Button variant="outline" size="sm" className="border-[#F37021]/30 text-[#F37021]">
                      <Receipt className="w-4 h-4 mr-2" /> Download Invoice
                    </Button>
                  </div>

                  {/* Payment Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Total Paid", amount: payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0), icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Pending", amount: payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Overdue", amount: payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0), icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
                    ].map((stat) => (
                      <Card key={stat.label} className="border-0 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stat.amount > 1000 ? `₹${stat.amount.toLocaleString()}` : `£${stat.amount}`}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Payment List */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {payments.length === 0 ? (
                          <div className="p-12 text-center">
                            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm">No payments recorded yet.</p>
                          </div>
                        ) : payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payment.status === "paid" ? "bg-emerald-50" : payment.status === "pending" ? "bg-amber-50" : "bg-red-50"}`}>
                                <CreditCard className={`w-5 h-5 ${payment.status === "paid" ? "text-emerald-600" : payment.status === "pending" ? "text-amber-600" : "text-red-600"}`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{payment.description}</p>
                                <p className="text-xs text-slate-400">
                                  {payment.status === "paid" ? `Paid ${payment.paidAt}` : `Due ${payment.dueDate}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-slate-900">
                                {payment.currency === "INR" ? `₹${payment.amount.toLocaleString()}` : payment.currency === "AUD" ? `A${payment.amount}` : `£${payment.amount}`}
                              </span>
                              <Badge variant="secondary" className={payment.status === "paid" ? "bg-emerald-50 text-emerald-700" : payment.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}>
                                {payment.status === "paid" ? "Paid" : payment.status === "pending" ? "Pending" : "Overdue"}
                              </Badge>
                              {payment.status !== "paid" && (
                                <Button size="sm" className="h-8 bg-[#F37021] hover:bg-[#E85D10] text-white text-xs">
                                  Pay Now
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* ===== MESSAGES TAB ===== */}
              <TabsContent value="messages">
                <motion.div variants={animationVariants.fadeInUp} initial="initial" animate="animate" className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {[
                          { from: "ALO Counseling Team", subject: "Welcome to ALO Education!", preview: "We're excited to guide you through your study abroad journey.", time: "2 days ago", unread: true },
                          { from: "Document Team", subject: "Documents Required for Application", preview: "Please upload the following documents to proceed.", time: "5 days ago", unread: true },
                          { from: "ALO Admissions", subject: "Application Update - University of Manchester", preview: "Your application has been received and is under review.", time: "1 week ago", unread: false },
                          { from: "Visa Support", subject: "Visa Preparation Guide", preview: "Here's your comprehensive guide for your student visa application.", time: "2 weeks ago", unread: false },
                        ].map((msg, idx) => (
                          <div key={idx} className={`flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${msg.unread ? "bg-[#F37021]/5" : ""}`}>
                            <div className="w-10 h-10 bg-[#0066CC]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                              <MessageCircle className="w-5 h-5 text-[#0066CC]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-sm ${msg.unread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>{msg.from}</span>
                                <span className="text-xs text-slate-400 shrink-0 ml-2">{msg.time}</span>
                              </div>
                              <p className={`text-sm ${msg.unread ? "font-medium text-slate-800" : "text-slate-600"}`}>{msg.subject}</p>
                              <p className="text-xs text-slate-400 mt-0.5 truncate">{msg.preview}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* ===== TIMELINE TAB ===== */}
              <TabsContent value="timeline">
                <motion.div variants={animationVariants.fadeInUp} initial="initial" animate="animate" className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">My Timeline</h2>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
                        <div className="space-y-6">
                          {[
                            { date: "Today", title: "Profile Created", desc: "Welcome to ALO Education! Your student portal is now active.", icon: Star, color: "bg-[#F37021] text-white" },
                            { date: "Today", title: "Consultation Booked", desc: "Your free consultation has been scheduled.", icon: Calendar, color: "bg-[#0066CC] text-white" },
                            { date: "Upcoming", title: "Counselor Assignment", desc: "A dedicated counselor will be assigned to guide you.", icon: Users, color: "bg-emerald-500 text-white" },
                            { date: "Upcoming", title: "Document Collection", desc: "Gather and upload required documents.", icon: FileCheck, color: "bg-purple-500 text-white" },
                            { date: "Future", title: "Application Submission", desc: "Submit your university applications with ALO's guidance.", icon: Send, color: "bg-amber-500 text-white" },
                          ].map((event, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-start gap-4 relative">
                              <div className={`w-10 h-10 ${event.color} rounded-xl flex items-center justify-center shrink-0 z-10 shadow-sm`}>
                                <event.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${event.date === "Today" ? "text-[#F37021]" : event.date === "Upcoming" ? "text-[#0066CC]" : "text-slate-400"}`}>{event.date}</span>
                                </div>
                                <h4 className="font-semibold text-sm text-slate-900">{event.title}</h4>
                                <p className="text-sm text-slate-500 mt-0.5">{event.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} ALO Education. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <button className="hover:text-slate-600 transition-colors">Privacy</button>
            <button className="hover:text-slate-600 transition-colors">Terms</button>
            <button className="hover:text-slate-600 transition-colors">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
