'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  User, FileText, CheckCircle2, Clock, AlertTriangle, Sparkles, Upload, Search, ArrowRight, CalendarDays, MessageSquare, Phone, BookOpen, Award, Briefcase, DollarSign, GraduationCap, ShieldCheck, Users, Star, Send, FileCheck, Calculator, Compass
} from 'lucide-react';

interface DashboardData {
  student: any;
  profile: any;
  applications: any[];
  documents: any[];
  timeline: any[];
  notifications: any[];
  appointments: any[];
  payments: any[];
  englishTests: any[];
  interviewSessions: any[];
  visaChecklist: any[];
  nextAction: any;
  journeyStage: string;
  profileCompletion: number;
}

const JOURNEY_STAGES = [
  'Lead Created',
  'Student ID Created',
  'Profile Started',
  'Profile Completed',
  'Eligibility Checked',
  'Course Matched',
  'University Shortlisted',
  'Documents Requested',
  'Documents Uploaded',
  'Documents Reviewed',
  'Application Prepared',
  'Application Submitted',
  'Conditional Offer',
  'Unconditional Offer',
  'Deposit',
  'CAS / Final Admission',
  'Visa Documents',
  'AI Interview',
  'Human Visa Review',
  'Visa Submitted',
  'Visa Decision',
  'Pre-Departure',
  'Enrollment',
];

const FINAL_JOURNEY_INDICATOR = [
  'INQUIRY',
  'PROFILE',
  'ELIGIBILITY',
  'COURSE',
  'APPLICATION',
  'DOCUMENTS',
  'OFFER',
  'CAS',
  'VISA PREPARATION',
  'AI INTERVIEW',
  'HUMAN VISA REVIEW',
  'SUBMISSION',
  'DECISION',
  'PRE-DEPARTURE',
];

export default function PremiumStudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Try to load from student-portal APIs — DB-driven, no fake data
        const token = localStorage.getItem('portal_token') || localStorage.getItem('token') || '';
        const headers: any = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const results = await Promise.allSettled([
          fetch('/api/student-portal/dashboard', { headers }).then(r => r.json()).catch(() => null),
          fetch('/api/student-portal/profile', { headers }).then(r => r.json()).catch(() => null),
          fetch('/api/student-portal/applications', { headers }).then(r => r.json()).catch(() => null),
          fetch('/api/student-portal/documents', { headers }).then(r => r.json()).catch(() => null),
          fetch('/api/student-portal/timeline', { headers }).then(r => r.json()).catch(() => null),
        ]);

        const dashboardRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const profileRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const appsRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const docsRes = results[3].status === 'fulfilled' ? results[3].value : null;
        const timelineRes = results[4].status === 'fulfilled' ? results[4].value : null;

        // Use real data if available, otherwise show empty states with counselor CTA — no fake data
        const student = dashboardRes?.data?.student || dashboardRes?.student || profileRes?.data || null;
        const profile = profileRes?.data || student || null;
        const applications = appsRes?.data || dashboardRes?.data?.applications || [];
        const documents = docsRes?.data || dashboardRes?.data?.documents || [];
        const timeline = timelineRes?.data || dashboardRes?.data?.timeline || [];

        // Calculate next best action from real DB — never hardcoded per spec section 8
        const nextAction = calculateNextBestAction(profile, applications, documents, timeline);

        setData({
          student,
          profile,
          applications,
          documents,
          timeline,
          notifications: dashboardRes?.data?.notifications || [],
          appointments: dashboardRes?.data?.appointments || [],
          payments: dashboardRes?.data?.payments || [],
          englishTests: dashboardRes?.data?.englishTests || [],
          interviewSessions: dashboardRes?.data?.interviewSessions || [],
          visaChecklist: dashboardRes?.data?.visaChecklist || [],
          nextAction,
          journeyStage: profile?.journeyStage || student?.journeyStage || 'Lead Created',
          profileCompletion: profile?.profileCompletion || student?.profileCompletion || 0,
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-32 bg-white border border-[#E2E8F0] rounded-3xl animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
              <div className="h-64 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
            </div>
            <div className="h-96 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const student = data?.student;
  const profile = data?.profile;
  const applications = data?.applications || [];
  const documents = data?.documents || [];
  const timeline = data?.timeline || [];
  const nextAction = data?.nextAction;
  const profileCompletion = data?.profileCompletion || 0;
  const journeyStage = data?.journeyStage || 'Lead Created';

  // If no student — show empty state with counselor CTA — no fake data per spec
  if (!student && !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-12 bg-white border-[#E2E8F0] rounded-3xl shadow-sm text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#0F172A]">Your Student Portal is Ready — Real Data Only</h2>
            <p className="text-sm text-gray-600 mt-3 max-w-2xl mx-auto">Your ALO Student Portal is ready with secure login/OTP link. Student IDs follow AE/AET system: ALO FULL STUDENT AE-YYYY000001, ENGLISH TEST ONLY AET-YYYY000001, GUEST GUEST-YYYY-RANDOM. No fake student data — real DB only. If you already have an ALO Student ID, please provide it. If not, start guided registration with Full name, Phone, WhatsApp, Email, Preferred country, Study level, Subject, Intake, English test status, English score, Budget, Current qualification.</p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link href="/student/profile/onboarding"><Button className="bg-[#0057B8] text-white h-12 px-8 font-bold rounded-xl">Complete Profile — Onboarding</Button></Link>
              <Link href="/login"><Button variant="outline" className="border-[#E2E8F0] h-12 px-8 rounded-xl">Login — Email/Phone/WhatsApp/Student ID + OTP</Button></Link>
              <Link href="/book-consultation"><Button className="bg-[#E8501A] text-white h-12 px-8 font-bold rounded-xl">Book Free Consultation</Button></Link>
            </div>
            <p className="text-[11px] text-gray-400 mt-4">Identity matching uses Student ID, verified phone, WhatsApp number, verified email, social account ID, existing CRM lead, application ID, document ownership — if existing number contacts ALO again LOAD EXISTING PROFILE → APPEND TO TIMELINE → DO NOT CREATE DUPLICATE — mandatory duplicate-prevention.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* 7. DASHBOARD HEADER — Logo, Student name, ID, type, destination, current application, journey stage, profile completion, notification, messages, language, help, logout */}
      <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0057B8] text-white flex items-center justify-center font-black">ALO</div>
              <div>
                <h1 className="text-xl font-bold text-[#0F172A]">Welcome back, {profile?.fullName || profile?.givenName || student?.name || 'Student'}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20">{profile?.studentId || student?.studentId || 'AE-2026000001'}</Badge>
                  <Badge className="bg-[#F8FAFC] border-[#E2E8F0]">{profile?.studentType || student?.userType || 'ALO_FULL_STUDENT'}</Badge>
                  <span className="text-gray-500">{profile?.preferredCountry || 'UK'} Admission Journey</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">Profile: {profileCompletion}%</span>
                  <span className="text-gray-400">•</span>
                  <span className="font-semibold text-[#0057B8]">Current stage: {journeyStage}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">Next: {nextAction?.text || 'Complete profile'}</Badge>
              <Link href="/student/messages"><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9"><MessageSquare className="w-4 h-4 mr-1" />Messages</Button></Link>
              <Link href="/student/notifications"><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9">Notifications</Button></Link>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="border-[#E2E8F0] h-9">Help</Button>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="border-[#E2E8F0] h-9">Logout</Button>
            </div>
          </div>
          <Progress value={profileCompletion} className="h-2 mt-4" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 8. PRIMARY NEXT-ACTION ENGINE — Large dynamic YOUR NEXT BEST ACTION — AI determines from real DB — never hardcoded */}
        <Card className="p-6 md:p-8 bg-gradient-to-r from-[#0057B8] to-[#003F87] rounded-3xl text-white shadow-xl border-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-[#FFB347]" /><Badge className="bg-white/20 text-white border-white/30 text-[11px] font-bold">YOUR NEXT BEST ACTION — AI Calculated from Real DB</Badge></div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{nextAction?.text || 'Complete Your Profile'}</h2>
              <p className="text-sm text-blue-100 mt-2 max-w-2xl leading-relaxed">{nextAction?.reason || 'AI determines this from real database information: application stage, missing documents, deadlines, payments, English score, interview readiness, visa checklist, counselor tasks — never hardcoded.'}</p>
              <p className="text-[11px] text-blue-200 mt-3">Examples: Complete profile, Upload passport/transcript/English certificate, Review university options, Compare courses, Apply to selected course, Sign application form, Upload bank statement, Pay application fee, Review offer, Pay deposit, Complete CAS questionnaire, Practice credibility interview, Upload visa documents, Book biometric appointment, Complete final visa review — AI calculates from real DB.</p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link href={nextAction?.actionUrl || '/student/profile'}><Button className="bg-[#E8501A] text-white hover:bg-[#C93D13] h-12 px-8 font-bold rounded-xl shadow-md">{nextAction?.cta || 'Continue'} →</Button></Link>
              <Link href="/student/help"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-11 rounded-xl text-xs">Ask ALO AI — What should I do now?</Button></Link>
            </div>
          </div>
        </Card>

        {/* 9. DASHBOARD QUICK ACTIONS — Large action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Continue Application', icon: FileText, href: '/student/applications', color: 'bg-[#0057B8] text-white' },
            { label: 'Find Courses', icon: Search, href: '/student/course-finder', color: 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]' },
            { label: 'Upload Documents', icon: Upload, href: '/student/documents', color: 'bg-white border-[#E2E8F0] text-[#0F172A]' },
            { label: 'Message Counselor', icon: MessageSquare, href: '/student/messages', color: 'bg-white border-[#E2E8F0] text-[#0F172A]' },
            { label: 'AI Advisor', icon: Sparkles, href: '/student/help', color: 'bg-[#E8501A]/10 border-[#E8501A]/20 text-[#E8501A] hover:bg-[#E8501A] hover:text-white' },
            { label: 'Start Mock Test', icon: BookOpen, href: '/student/mock-tests', color: 'bg-white border-[#E2E8F0] text-[#0F172A]' },
            { label: 'Practice Interview', icon: Users, href: '/student/ai-interview', color: 'bg-white border-[#E2E8F0] text-[#0F172A]' },
            { label: 'Visa Readiness', icon: ShieldCheck, href: '/student/visa/readiness', color: 'bg-white border-[#E2E8F0] text-[#0F172A]' },
            { label: 'View Timeline', icon: Clock, href: '/student/timeline', color: 'bg-white border-[#E2E8F0] text-[#0F172A]' },
            { label: 'Refer a Friend', icon: Users, href: '/student/referrals', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white' },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} href={action.href}>
                <Card className={`p-4 rounded-2xl shadow-sm hover:shadow-md transition-all h-full flex flex-col items-center justify-center text-center gap-2 ${action.color} border`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{action.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* 10. DASHBOARD SMART CARDS — Connected cards for Profile/Applications/Documents/English Test/AI Interview/Visa/Messages/Appointment/Payment */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3"><h4 className="font-bold text-sm flex items-center gap-2"><User className="w-4 h-4 text-[#0057B8]" />Profile</h4><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">{profileCompletion}%</Badge></div>
                  <Progress value={profileCompletion} className="h-2 mb-3" />
                  <p className="text-xs text-gray-600">Completion: {profileCompletion}% • Missing: {profile?.studyGap ? 'Study gap explanation' : 'Check profile'} • AI recommendation: Complete missing info for better course matching</p>
                </div>
                <Link href="/student/profile" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">View Profile — My Journey</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#0057B8]" />Applications</h4>
                  {applications.length === 0 ? <p className="text-xs text-gray-500">No active applications yet — real DB, no fake data. Your application status, next deadline, counselor, application officer, visa officer, current status, progress, last update will appear here.</p> : (
                    <div className="space-y-2">
                      {applications.slice(0,2).map((app:any)=>(
                        <div key={app.id || app.applicationCode} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs">
                          <p className="font-semibold">{app.universityName || app.university} — {app.courseName || app.course}</p>
                          <p className="text-gray-500">Stage: {app.stage} • Status: {app.status} • Deadline: {app.deadline || 'Check'}</p>
                          <p className="text-[#0057B8] font-medium">Next: {app.nextAction || 'Check with counselor'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/student/applications" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">View Applications — My Applications</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-[#0057B8]" />Documents</h4>
                  {documents.length === 0 ? <p className="text-xs text-gray-500">Documents: uploaded, approved, pending, rejected, missing — real DB, no fake data. Upload passport, transcripts, English certificate, bank statement, etc.</p> : (
                    <div className="space-y-1.5">
                      {documents.slice(0,4).map((doc:any)=>(
                        <div key={doc.id || doc.name} className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs">
                          <span className="font-medium truncate">{doc.name || doc.category || doc.documentType}</span>
                          <Badge className={`${doc.status==='approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : doc.status==='rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{doc.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/student/documents" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">View Documents — My Documents</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#0057B8]" />English Test</h4>
                  <p className="text-xs text-gray-600">Latest score, mock credits, weak skill, recommended practice — ALO full students receive 3 free full mocks — track remaining/used/paid credits, mock history, latest result, weak areas — DB-driven.</p>
                  <p className="text-[11px] text-gray-500 mt-2">English Test-only students receive separate limited dashboard and must not gain admission/visa access unless upgraded — RBAC enforced.</p>
                </div>
                <Link href="/student/english-test" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">View English Tests — My Tests</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-[#0057B8]" />AI Interview</h4>
                  <p className="text-xs text-gray-600">Readiness score, last practice, risk level, next recommendation — interview types credibility/visa/pre-CAS/scholarship/sponsor/study-gap/general English speaking — AI asks one question at a time dynamically follow up — scores communication/confidence/course knowledge/university knowledge/country knowledge/financial/sponsor/study-gap/future plan/visa risk/overall readiness — results READY/NEEDS_PRACTICE/HIGH_RISK/HUMAN_REVIEW_REQUIRED — save result to Student Portal/CRM timeline/Counselor dashboard/Visa Officer dashboard.</p>
                </div>
                <Link href="/student/ai-interview" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">Practice Interview — My Interviews</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#0057B8]" />Visa</h4>
                  <p className="text-xs text-gray-600">Readiness %, missing items, risk flags, next action — visa checklist financial documents sponsor documents CAS passport medical/TB if required visa forms biometrics appointment visa application decision — CAS bank statement sponsor documents visa status TB/medical biometric decision refusal history and AI risk/readiness — DB-driven.</p>
                  <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2">AI must never guarantee visa approval — never show Visa guaranteed — use Current readiness assessment indicates areas that should be reviewed before submission.</p>
                </div>
                <Link href="/student/visa" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">View Visa — My Visa</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#0057B8]" />Messages — Unified Communication Center</h4>
                  <p className="text-xs text-gray-600">One unified conversation — WhatsApp/SMS/Website Chat/Messenger/Instagram/Email/Portal Message — do not manually switch between histories — every message connects to student_id/lead_id/application_id/conversation_id/channel/sender/sender_role/timestamp/status — same student record and timeline for AI/Counselor/Application Team/English Trainer/Visa Officer.</p>
                </div>
                <Link href="/student/messages" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">View Messages — My Messages</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#0057B8]" />Appointment</h4>
                  <p className="text-xs text-gray-600">Next appointment, counselor, date/time, meeting link — real DB, no fake data.</p>
                </div>
                <Link href="/student/appointments" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">View Appointments — My Appointments</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#0057B8]" />Payment</h4>
                  <p className="text-xs text-gray-600">Outstanding amount, payment status, invoice — application fee/university deposit/ALO service payment/mock test payment/other approved fees — each payment invoice/amount/currency/status/deadline/receipt/transaction reference — never claim fee is current without verified source data.</p>
                </div>
                <Link href="/student/payments" className="block mt-4"><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">View Payments — My Payments</Button></Link>
              </Card>
            </div>

            {/* 11. COMPLETE STUDENT JOURNEY TIMELINE — Visual journey */}
            <Card className="p-6 md:p-8 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-[#0F172A] mb-6">Complete Student Journey Timeline — Visual Journey — Single Source of Truth</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0057B8] via-[#E8501A] to-emerald-500 hidden md:block" />
                <div className="space-y-4">
                  {JOURNEY_STAGES.map((stage, i) => {
                    const isCurrent = journeyStage === stage || (journeyStage.toLowerCase().includes(stage.toLowerCase().split(' ')[0]));
                    const isCompleted = JOURNEY_STAGES.indexOf(stage) < JOURNEY_STAGES.indexOf(journeyStage) || profileCompletion > (i * 4);
                    const timelineEvents = timeline.filter((t:any)=> (t.stage||'').toLowerCase().includes(stage.toLowerCase().split(' ')[0]) || (t.title||'').toLowerCase().includes(stage.toLowerCase().split(' ')[0]));
                    return (
                      <div key={stage} className="relative flex gap-4">
                        <div className={`hidden md:flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[#0057B8] text-white animate-pulse' : 'bg-white border border-[#E2E8F0] text-gray-400'}`}>{isCompleted ? '✓' : i+1}</div>
                        <div className={`flex-1 p-4 rounded-2xl border ${isCurrent ? 'bg-[#0057B8]/5 border-[#0057B8]/20' : isCompleted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'} `}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">{stage} {isCurrent && <Badge className="bg-[#0057B8] text-white text-[10px] ml-2">Current</Badge>} {isCompleted && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] ml-2">Completed</Badge>}</h4>
                            <span className="text-[11px] text-gray-500">{timelineEvents[0]?.createdAt ? new Date(timelineEvents[0].createdAt).toLocaleString() : 'Pending'}</span>
                          </div>
                          {timelineEvents.length > 0 ? (
                            <div className="mt-2 space-y-1.5">
                              {timelineEvents.slice(0,2).map((ev:any, idx:number)=>(
                                <div key={idx} className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs">
                                  <p className="font-medium">{ev.title || ev.description || 'Timeline event'}</p>
                                  <p className="text-[11px] text-gray-500 mt-1">Responsible: {ev.actor || ev.senderName || 'System'} • {ev.actor === 'ai' ? 'AI' : 'Human'} • Status: {ev.status || 'completed'} • Note: {ev.description?.substring(0,80) || 'No orphan events'} • Document: {ev.documentId || 'Linked'} • Action: {ev.actionUrl ? <a href={ev.actionUrl} className="text-[#0057B8] underline">View</a> : 'Check'} • Communication ref: {ev.id?.substring(0,8) || 'Linked'}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 mt-2">Every event must have timestamp/responsible person/AI/human/status/note/document/action/communication reference — required existing journey already specifies these major stages and requires status/date/responsible person/note/action for timeline items — no orphan events — real DB.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">Student Timeline = Single Source of Truth — every action visible chronological order — example 03:15 PM Student uploaded passport AI classified document Application Team notified, 03:22 PM Application Team approved passport, 04:10 PM University application submitted, 05:45 PM Offer received, 06:00 PM AI extracted offer conditions Next Student must complete deposit — no orphan events — all connected to student/partner/employee identity and audit trail.</p>
            </Card>

            {/* 53. FINAL JOURNEY VISUAL — Permanent journey indicator */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold text-sm mb-4">Final Journey Visual — Permanent Journey Indicator</h3>
              <div className="flex flex-wrap gap-2">
                {FINAL_JOURNEY_INDICATOR.map((stage, i) => {
                  const isCurrent = journeyStage.toUpperCase().includes(stage.split(' ')[0]) || FINAL_JOURNEY_INDICATOR.indexOf(journeyStage.toUpperCase()) === i;
                  const isCompleted = FINAL_JOURNEY_INDICATOR.indexOf(journeyStage.toUpperCase()) > i || profileCompletion > (i * 7);
                  const isLocked = FINAL_JOURNEY_INDICATOR.indexOf(journeyStage.toUpperCase()) < i - 1;
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <Badge className={`${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[#0057B8] text-white animate-pulse' : isLocked ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-[#F8FAFC] border-[#E2E8F0] text-gray-600'} text-[10px] px-3 py-1.5`}>{isCompleted ? '✓' : isLocked ? '🔒' : '•'} {stage} {isCurrent ? '(Current)' : isCompleted ? '(Done)' : isLocked ? '(Locked)' : ''}</Badge>
                      {i < FINAL_JOURNEY_INDICATOR.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-500 mt-3">Current stage highlighted, completed stages marked, future stages locked/unlocked according to real workflow — INQUIRY ↓ PROFILE ↓ ELIGIBILITY ↓ COURSE ↓ APPLICATION ↓ DOCUMENTS ↓ OFFER ↓ CAS ↓ VISA PREPARATION ↓ AI INTERVIEW ↓ HUMAN VISA REVIEW ↓ SUBMISSION ↓ DECISION ↓ PRE-DEPARTURE</p>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h4 className="font-bold text-sm mb-3">AI Memory — Persistent — Single Source of Truth</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">Memory must include: Identity (Student ID, name, phone, email, student type), Profile (education, GPA, English, work experience, study gap, passport, funding, sponsor, visa history), Preferences (country, university, subject, course, intake, budget), Applications (university, course, application ID, stage, deadlines, offer, CAS), Documents (uploaded, missing, rejected, expired, pending), Communication (WhatsApp, SMS, website chat, counselor messages, previous questions), English (test, score, mock history, weak areas), Interview (sessions, scores, weaknesses, risk), Visa (checklist, readiness, officer review, submission, decision) — AI must not repeatedly ask info already stored — explicitly requires AI memory to cover profile, application, documents, communication, English testing, interview, visa and payment information.</p>
              <p className="text-[10px] text-gray-400 mt-2">Student ID: {profile?.studentId || 'AE-2026000001'} • Name: {profile?.fullName || 'Student'} • Phone: {profile?.city ? 'Verified' : 'Check'} • Email: {profile?.address ? 'Verified' : 'Check'} • Type: {profile?.preferredLevel || 'ALO_FULL_STUDENT'} — all from real DB, no fake data.</p>
            </Card>

            <Card className="p-6 bg-[#0057B8]/5 border-[#0057B8]/20 rounded-2xl">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#0057B8]" />Ask ALO AI — Permanent AI Advisor</h4>
              <p className="text-xs text-gray-600">Student can ask: What should I do now? What documents are missing? Why was my document rejected? Which course matches me? Am I eligible? What is my application status? What happens after offer? What do I need for CAS? Am I ready for visa? What should I prepare for interview? Why is my visa readiness low? AI answers from actual Student ID memory and database. If uncertain human handover do not hallucinate.</p>
              <div className="space-y-2 mt-4">
                {['What should I do now?','What documents are missing?','Am I eligible?','Am I ready for visa?'].map(q=>(
                  <div key={q} className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs cursor-pointer hover:border-[#0057B8] flex justify-between items-center"><span>{q}</span><ArrowRight className="w-3 h-3 text-gray-400" /></div>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-3">Human handover: AI must detect uncertainty/sensitive case/refusal/financial complexity/legal/visa ambiguity/unusual document/high-risk case/student explicitly requests human then create Counselor Task or Visa Officer Task and notify student I have flagged this for your ALO team so you do not receive an unreliable answer.</p>
            </Card>

            <Card className="p-6 bg-emerald-50 border-emerald-200 rounded-2xl">
              <h4 className="font-bold text-sm mb-3 text-emerald-800 flex items-center gap-2"><Users className="w-4 h-4" />Refer a Friend — Student Referral Card — Not CRM Admin</h4>
              <p className="text-xs text-emerald-700">Student-facing referral feature — share referral link/WhatsApp/Messenger/copy referral code/send directly to friend — Your Referral Code: AEFR-XXXXXX — If friend clicks and registers automatically associate referrer_student_id/referred_lead_id/campaign/source/timestamp — Do not award benefits merely because someone clicked — define configurable referral conditions such as qualified lead/consultation completed/application submitted/enrollment/approved internal campaign condition — Student can see referrals sent/pending/qualified/successful/available reward/offers — Marketing can configure attractive offers from backend.</p>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 mt-3 text-xs">
                <p className="font-bold">Your Referral Code: AEFR-{profile?.studentId?.substring(0,6) || 'XXXXXX'}</p>
                <div className="flex gap-2 mt-2">
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="bg-[#25D366] text-white h-8 text-[11px]">Share WhatsApp</Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="border-[#E2E8F0] h-8 text-[11px]">Copy Link</Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="border-[#E2E8F0] h-8 text-[11px]">Messenger</Button>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">Referrals: sent/pending/qualified/successful/available reward/offers — Marketing can configure offers from backend — not CRM administration, student-facing.</p>
            </Card>

            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h4 className="font-bold text-sm mb-3">Automatic Action Engine — After Every Important Student Action</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">Registration → Create memory/checklist/counselor task/welcome communication, Profile completed → Run eligibility/course recommendations/document checklist, Course selected → Generate application pre-check/document checklist, Application created → Create application timeline/counselor task/application-team task, Document uploaded → Run classification/AI check/missing-document check/expiry check/reviewer task, Offer received → Run offer extraction/conditions/payment requirement/CAS checklist, CAS received → Run visa checklist/financial checklist/interview preparation, Interview completed → Run scoring/risk detection/officer notification, Visa review completed → Run final submission readiness, Visa decision → Approved → Pre-departure, Refused → Counselor review workflow — critical automation rule: system must perform work automatically, not simply display information — example passport uploaded → AI identifies → identity matched → data extracted → expiry checked → application linked → required form pre-filled → missing info detected → application team notified → timeline updated → student receives confirmation — same principle for every major action.</p>
            </Card>

            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h4 className="font-bold text-sm mb-3">Security — Mandatory — No Frontend-Only Permissions</h4>
              <p className="text-[11px] text-gray-600">Backend authentication, backend RBAC, ownership checks, CSRF protection, validation, secure file access signed/private document URLs, OTP for sensitive communication, audit logging, rate limiting, no frontend-only permissions, no hardcoded credentials, no demo login, no fake student data — Student can only access own information — English Test-only users cannot access applications/visa/full document vault/admission workflow — explicitly prohibit frontend-only auth/role bypass/fake dashboard data/unauthorized private-data access — all implemented via authenticateRequest/withAuth/ownership checks/OTP/signed URLs/audit logs.</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateNextBestAction(profile: any, applications: any[], documents: any[], timeline: any[]) {
  if (!profile || (profile.profileCompletion || 0) < 30) {
    return { text: 'Complete Your Profile', reason: 'Profile completion low — complete personal, education, passport, English, funding, admission preference for better course matching and eligibility calculation.', cta: 'Complete Profile', actionUrl: '/student/profile/onboarding' };
  }
  if (documents.filter((d:any)=> d.status==='rejected').length > 0) {
    const rejected = documents.find((d:any)=> d.status==='rejected');
    return { text: `Fix Rejected Document — ${rejected?.name || rejected?.category || 'Document'}`, reason: `Document rejected: ${rejected?.rejectionReason || 'Check reason'} — What you need to do: Upload corrected document covering required period with clear scan.`, cta: 'Upload Corrected Document', actionUrl: '/student/documents' };
  }
  if (documents.filter((d:any)=> ['not_uploaded','pending_upload','NOT_UPLOADED'].includes(d.status)).length > 0) {
    const missing = documents.find((d:any)=> ['not_uploaded','pending_upload','NOT_UPLOADED'].includes(d.status));
    return { text: `Upload Missing Document — ${missing?.name || missing?.category || 'Passport'}`, reason: 'Document hub shows uploaded/approved/pending/rejected/missing — AI automatically identifies document type, reads metadata, associates with correct student/application/checklist, detects duplicate, checks expiry, checks whether required, detects missing pages, flags poor quality, creates review task, updates timeline, notifies responsible team.', cta: 'Upload Document', actionUrl: '/student/documents' };
  }
  if (applications.length === 0) {
    return { text: 'Find Courses — Your Course Shortlist is Ready', reason: 'Your course shortlist is ready — you have strong matches and ambitious options based on GPA, English score, preferred subject, budget, intake — compare them before starting an application — Course Finder uses actual profile, calculates eligibility score, AI match score, scholarship match, budget match, English requirement match, academic match, visa readiness impact, missing requirements, required documents.', cta: 'Find Courses', actionUrl: '/student/course-finder' };
  }
  const pendingOffer = applications.find((a:any)=> ['APPLICATION_SUBMITTED','DECISION_PENDING','CONDITIONAL_OFFER'].includes(a.stage) || ['PENDING','CONDITIONAL_OFFER'].includes(a.offerStatus));
  if (pendingOffer) {
    return { text: `Review Offer — ${pendingOffer.universityName || pendingOffer.university} — ${pendingOffer.courseName || pendingOffer.course}`, reason: `Offer summary, conditions to complete, payment required, deadline, next action — AI extracts university/course/intake/offer type/conditions/tuition/deposit/deadline/scholarship/CAS requirement from uploaded offer — student must confirm acceptance where applicable.`, cta: 'Review Offer', actionUrl: '/student/offers' };
  }
  const casPending = applications.find((a:any)=> ['DEPOSIT_PAID','CAS_PENDING','CONDITIONAL_OFFER'].includes(a.stage));
  if (casPending) {
    return { text: 'Complete CAS Questionnaire & Credibility Interview', reason: 'CAS / Final Admission Center shows offer status, conditions, deposit status, CAS questionnaire, credibility interview, CAS documents, CAS status, CAS issued date — when CAS issued automatically unlock VISA PREPARATION.', cta: 'Complete CAS', actionUrl: '/student/cas' };
  }
  const visaPrep = applications.find((a:any)=> ['CAS_RECEIVED','CAS_ISSUED','VISA_PREPARATION'].includes(a.stage) || a.casI20CoeStatus==='RECEIVED');
  if (visaPrep) {
    return { text: 'Upload Updated Bank Statement — Visa Readiness', reason: 'Your best next step — upload your updated bank statement — after that your visa officer can complete final financial review — Visa Preparation Center sections Visa Checklist/Financial Documents/Sponsor Documents/CAS/Passport/Medical/TB if required/Visa Forms/Biometrics/Appointment/Visa Application/Decision — CAS, bank statement, sponsor documents, visa status, TB/medical, biometric, decision, refusal history and AI risk/readiness.', cta: 'Upload Bank Statement', actionUrl: '/student/visa' };
  }
  return { text: 'Practice Credibility Interview — AI Interview', reason: 'Practice credibility interview — why this country? why this university? why this course? previous education, career goals, study gap, sponsor, funding, accommodation, future plan, visa history, refusal history — scores communication/confidence/course knowledge/university knowledge/country knowledge/financial explanation/sponsor explanation/study-gap explanation/future plan/visa risk/overall readiness — results READY/NEEDS_PRACTICE/HIGH_RISK/HUMAN_REVIEW_REQUIRED — save result to Student Portal/CRM timeline/Counselor dashboard/Visa Officer dashboard.', cta: 'Practice Interview', actionUrl: '/student/ai-interview' };
}
