"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Globe,
  BookOpen,
  MessageCircle,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Languages,
  Building2,
  BarChart3,
  Link,
  Tag,
} from "lucide-react";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Brand Colors ─── */
const ALO_BLUE = "#0052B8";
const ALO_ORANGE = "#E8501A";

/* ─── Options ─── */
const COUNTRIES = [
  "United Kingdom", "Australia", "Canada", "United States",
  "Germany", "New Zealand", "Ireland", "Netherlands",
  "Sweden", "Denmark", "Japan", "Malaysia", "Singapore",
];

const COURSES = [
  "Foundation", "Undergraduate (Bachelor's)", "Postgraduate (Master's)",
  "PhD / Research", "Diploma", "Vocational", "English Language",
];

const SOURCES = [
  "Website", "Facebook", "Instagram", "Google Ads", "WhatsApp",
  "Referral", "Walk-in", "Phone Call", "Email Campaign", "LinkedIn", "Other",
];

const INTAKE_PERIODS = [
  "September 2025", "January 2026", "May 2026", "September 2026",
];

const ENGLISH_TESTS = ["IELTS", "TOEFL", "PTE", "Duolingo", "Not Yet"];
const QUALIFICATIONS = ["HSC/A-Levels", "Bachelor's", "Master's", "Diploma", "Other"];
const BUDGET_RANGES = ["Under 5L BDT", "5-10L BDT", "10-20L BDT", "20-50L BDT", "50L+ BDT", "Not Sure"];

/* ─── Lead Scoring Model (Comp CRM + Dynamics 365 pattern) ─── */
function calculateLeadScore(data: {
  hasCountry: boolean; hasCourse: boolean; hasEmail: boolean;
  hasBudget: boolean; hasEnglish: boolean; hasQualification: boolean;
  source: string; intakeUrgency: number; // 0=not set, 1=more than 6mo, 2=3-6mo, 3=within 3mo
}) {
  let score = 0;
  // Profile completeness scoring
  if (data.hasCountry) score += 15;
  if (data.hasCourse) score += 15;
  if (data.hasEmail) score += 10;
  if (data.hasBudget) score += 12;
  if (data.hasEnglish) score += 10;
  if (data.hasQualification) score += 8;

  // Source quality scoring
  const sourceScores: Record<string, number> = {
    "Referral": 15, "WhatsApp": 12, "Walk-in": 12, "Phone Call": 10,
    "Google Ads": 8, "Website": 8, "Facebook": 6, "Instagram": 5,
    "LinkedIn": 7, "Email Campaign": 5, "Other": 3,
  };
  score += sourceScores[data.source] || 5;

  // Intake urgency scoring
  score += data.intakeUrgency * 5;

  return Math.min(score, 100);
}

function getScoreTier(score: number) {
  if (score >= 70) return { tier: "HOT", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  if (score >= 40) return { tier: "WARM", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
  return { tier: "COLD", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" };
}

export default function LeadModal({ open, onClose }: LeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Core fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredCountry, setPreferredCountry] = useState("");
  const [preferredCourse, setPreferredCourse] = useState("");
  const [message, setMessage] = useState("");

  // Enrichment fields (Comp CRM pattern)
  const [source, setSource] = useState("Website");
  const [intakePeriod, setIntakePeriod] = useState("");
  const [englishTest, setEnglishTest] = useState("");
  const [englishScore, setEnglishScore] = useState("");
  const [qualification, setQualification] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [currentInstitution, setCurrentInstitution] = useState("");

  // Source tracking (UTM pattern)
  const [utmSource, setUtmSource] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [referrer, setReferrer] = useState("");

  // Follow-up scheduling
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpType, setFollowUpType] = useState("call");

  const [showAdvanced, setShowAdvanced] = useState(false);

  /* ─── Lead Score Computation ─── */
  const leadScore = useMemo(() => {
    let intakeUrgency = 0;
    if (intakePeriod) {
      if (intakePeriod.includes("2025")) intakeUrgency = 3;
      else if (intakePeriod.includes("January 2026")) intakeUrgency = 2;
      else intakeUrgency = 1;
    }
    return calculateLeadScore({
      hasCountry: !!preferredCountry,
      hasCourse: !!preferredCourse,
      hasEmail: !!email.trim(),
      hasBudget: !!budgetRange,
      hasEnglish: !!englishTest && englishTest !== "Not Yet",
      hasQualification: !!qualification,
      source,
      intakeUrgency,
    });
  }, [preferredCountry, preferredCourse, email, budgetRange, englishTest, qualification, source, intakePeriod]);

  const scoreTier = getScoreTier(leadScore);

  const profileCompleteness = useMemo(() => {
    let filled = 0;
    const total = 8;
    if (fullName.trim()) filled++;
    if (phone.trim()) filled++;
    if (email.trim()) filled++;
    if (preferredCountry) filled++;
    if (preferredCourse) filled++;
    if (budgetRange) filled++;
    if (englishTest && englishTest !== "Not Yet") filled++;
    if (qualification) filled++;
    return Math.round((filled / total) * 100);
  }, [fullName, phone, email, preferredCountry, preferredCourse, budgetRange, englishTest, qualification]);

  const resetForm = () => {
    setFullName(""); setEmail(""); setPhone(""); setPreferredCountry(""); setPreferredCourse("");
    setMessage(""); setSource("Website"); setIntakePeriod(""); setEnglishTest(""); setEnglishScore("");
    setQualification(""); setBudgetRange(""); setCurrentInstitution("");
    setUtmSource(""); setUtmCampaign(""); setReferrer("");
    setFollowUpDate(""); setFollowUpType("call"); setShowAdvanced(false);
    setError(""); setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!phone.trim()) { setError("Phone number is required."); return; }

    setLoading(true);

    try {
      const res = await fetch("/api/leads/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim(),
          preferredCountry: preferredCountry || undefined,
          preferredCourse: preferredCourse || undefined,
          source: source || undefined,
          intakePeriod: intakePeriod || undefined,
          englishTest: englishTest || undefined,
          englishScore: englishScore || undefined,
          qualification: qualification || undefined,
          budgetRange: budgetRange || undefined,
          currentInstitution: currentInstitution.trim() || undefined,
          utmSource: utmSource.trim() || undefined,
          utmCampaign: utmCampaign.trim() || undefined,
          referrer: referrer.trim() || undefined,
          followUpDate: followUpDate || undefined,
          followUpType: followUpType || undefined,
          notes: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      resetForm();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) { onClose(); resetForm(); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#0052B8] via-[#0052B8] to-[#003D8F] px-6 pt-8 pb-10 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="relative">
            <DialogHeader>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4"
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </motion.div>
              <DialogTitle className="text-2xl font-bold text-white">
                Book Free Consultation
              </DialogTitle>
              <DialogDescription className="text-white/75 text-sm mt-1">
                Tell us about your study plans — our expert counselors will guide you
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Form / Success */}
        <div className="px-6 pb-6 -mt-5">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="bg-white rounded-2xl p-8 text-center shadow-sm"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Consultation Booked!</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Thank you, <span className="font-semibold text-slate-700">{fullName}</span>! Our counseling team will reach out to you within 24 hours.
                </p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: ALO_ORANGE }}>{leadScore}</div>
                    <div className="text-xs text-slate-500">Lead Score</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${scoreTier.color}`}>{scoreTier.tier}</div>
                    <div className="text-xs text-slate-500">Priority Tier</div>
                  </div>
                </div>
                <Button onClick={() => { setSuccess(false); onClose(); }} className="text-white font-semibold rounded-xl px-8" style={{ backgroundColor: ALO_ORANGE }}>
                  Done
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
              >
                {/* Lead Score Indicator (Comp CRM pattern) */}
                <div className={`p-3 rounded-xl border ${scoreTier.border} ${scoreTier.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: ALO_ORANGE }} />
                      <span className="text-sm font-semibold text-slate-700">Lead Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: ALO_ORANGE }}>{leadScore}</span>
                      <Badge className={`text-[10px] font-bold ${scoreTier.color} ${scoreTier.bg} border ${scoreTier.border}`}>
                        {scoreTier.tier}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={leadScore} className="h-2" />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-slate-500">Profile: {profileCompleteness}% complete</span>
                    <span className="text-[11px] text-slate-500">Source: {source}</span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-name" className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="lead-name" type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="pl-10 h-10 border-slate-200 focus:border-[#0052B8]" disabled={loading} />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-email" className="text-sm font-medium text-slate-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="lead-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-10 border-slate-200 focus:border-[#0052B8]" disabled={loading} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-phone" className="text-sm font-medium text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="lead-phone" type="tel" placeholder="+880 1XXX-XXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required className="pl-10 h-10 border-slate-200 focus:border-[#0052B8]" disabled={loading} />
                    </div>
                  </div>

                  {/* Source */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Lead Source</Label>
                    <Select value={source} onValueChange={setSource} disabled={loading}>
                      <SelectTrigger className="h-10 border-slate-200">
                        <Target className="w-4 h-4 text-slate-400 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preferred Country */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Preferred Country</Label>
                    <Select value={preferredCountry} onValueChange={setPreferredCountry} disabled={loading}>
                      <SelectTrigger className="h-10 border-slate-200">
                        <Globe className="w-4 h-4 text-slate-400 mr-2" />
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preferred Course */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Preferred Course</Label>
                    <Select value={preferredCourse} onValueChange={setPreferredCourse} disabled={loading}>
                      <SelectTrigger className="h-10 border-slate-200">
                        <BookOpen className="w-4 h-4 text-slate-400 mr-2" />
                        <SelectValue placeholder="Select course level" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Intake Period */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Target Intake</Label>
                    <Select value={intakePeriod} onValueChange={setIntakePeriod} disabled={loading}>
                      <SelectTrigger className="h-10 border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                        <SelectValue placeholder="When do you plan to start?" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTAKE_PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget Range */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Budget Range</Label>
                    <Select value={budgetRange} onValueChange={setBudgetRange} disabled={loading}>
                      <SelectTrigger className="h-10 border-slate-200">
                        <DollarSign className="w-4 h-4 text-slate-400 mr-2" />
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced/Enrichment Section (toggle) */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Enrichment & Tracking
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{showAdvanced ? "Hide" : "Show"}</Badge>
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {/* English Test */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">English Test</Label>
                          <Select value={englishTest} onValueChange={setEnglishTest} disabled={loading}>
                            <SelectTrigger className="h-10 border-slate-200">
                              <Languages className="w-4 h-4 text-slate-400 mr-2" />
                              <SelectValue placeholder="Select test" />
                            </SelectTrigger>
                            <SelectContent>
                              {ENGLISH_TESTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* English Score */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">English Score</Label>
                          <Input placeholder="e.g. IELTS 6.5" value={englishScore} onChange={(e) => setEnglishScore(e.target.value)} className="h-10 border-slate-200" disabled={loading} />
                        </div>

                        {/* Qualification */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">Current Qualification</Label>
                          <Select value={qualification} onValueChange={setQualification} disabled={loading}>
                            <SelectTrigger className="h-10 border-slate-200">
                              <GraduationCap className="w-4 h-4 text-slate-400 mr-2" />
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                            <SelectContent>
                              {QUALIFICATIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Current Institution */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">Current Institution</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="School/University name" value={currentInstitution} onChange={(e) => setCurrentInstitution(e.target.value)} className="pl-10 h-10 border-slate-200" disabled={loading} />
                          </div>
                        </div>

                        {/* Follow-up Date */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">Follow-up Date</Label>
                          <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="h-10 border-slate-200" disabled={loading} />
                        </div>

                        {/* Follow-up Type */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">Follow-up Type</Label>
                          <Select value={followUpType} onValueChange={setFollowUpType} disabled={loading}>
                            <SelectTrigger className="h-10 border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Phone Call</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">In-person Meeting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* UTM Source */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">UTM Source</Label>
                          <div className="relative">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="e.g. google, facebook" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} className="pl-10 h-10 border-slate-200" disabled={loading} />
                          </div>
                        </div>

                        {/* UTM Campaign */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">UTM Campaign</Label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="e.g. spring2025_uk" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} className="pl-10 h-10 border-slate-200" disabled={loading} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="lead-message" className="text-sm font-medium text-slate-700">Message (Optional)</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea id="lead-message" rows={3} placeholder="Tell us about your study goals, preferred universities, or any questions..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading} className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#0052B8] focus:ring-2 focus:ring-[#0052B8]/20 resize-none disabled:opacity-50 transition-colors" />
                  </div>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={loading} className="w-full h-12 text-white font-semibold rounded-xl transition-all hover:shadow-lg" style={{ backgroundColor: ALO_ORANGE }}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Book My Free Consultation</>
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  Free consultation • No obligation • Expert guidance • Score: {leadScore} ({scoreTier.tier})
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
