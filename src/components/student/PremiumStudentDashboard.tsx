'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  messages: { unread?: number; lastMessage?: { content?: string; createdAt?: string } };
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

function normalizeJourneyStage(value: unknown): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function PremiumStudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Use the dedicated student-session APIs. The older student-portal APIs
        // require a different User/Portal session and are not valid for the
        // StudentSession cookie issued by /api/student/auth/login.
        const loadJson = async (path: string) => {
          const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.success) {
            throw new Error(payload?.error || `Student data is temporarily unavailable (${response.status}).`);
          }
          return payload;
        };
        const [dashboardRes, profileRes, appsRes, docsRes] = await Promise.all([
          loadJson('/api/student/dashboard'),
          loadJson('/api/student-portal/profile'),
          loadJson('/api/student/applications'),
          loadJson('/api/student/documents'),
        ]);

        const dashboard = dashboardRes.data || {};
        const student = dashboard.student || profileRes.data || null;
        const profile = profileRes.data || student || null;
        const applications = Array.isArray(appsRes.data) ? appsRes.data : [];
        const documents = Array.isArray(docsRes.data) ? docsRes.data : [];
        const timeline = Array.isArray(dashboard.timeline) ? dashboard.timeline : [];
        const storedAction = Array.isArray(dashboard.nextBestActions) ? dashboard.nextBestActions[0] : null;
        const nextAction = storedAction
          ? { text: storedAction.title, reason: storedAction.description, cta: 'Continue', actionUrl: '/student/journey' }
          : calculateNextBestAction(profile, applications, documents, timeline);

        setData({
          student,
          profile,
          applications,
          documents,
          timeline,
          notifications: Array.isArray(dashboard.notifications) ? dashboard.notifications : [],
          appointments: Array.isArray(dashboard.appointments) ? dashboard.appointments : [],
          payments: Array.isArray(dashboard.payments) ? dashboard.payments : [],
          englishTests: Array.isArray(dashboard.englishTests) ? dashboard.englishTests : [],
          interviewSessions: Array.isArray(dashboard.interviewSessions) ? dashboard.interviewSessions : [],
          visaChecklist: Array.isArray(dashboard.visaChecklist) ? dashboard.visaChecklist : [],
          messages: dashboard.messages || {},
          nextAction,
          journeyStage: profile?.journeyStage || student?.journeyStage || 'Stage unavailable',
          profileCompletion: profile?.profileCompletion ?? student?.profileComplete ?? 0,
        });
      } catch (e: any) {
        setError(e instanceof Error ? e.message : 'Student data is temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--alo-page)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-32 bg-white border border-[var(--alo-border)] rounded-3xl animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" />
              <div className="h-64 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" />
            </div>
            <div className="h-96 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" />
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
  const journeyStage = data?.journeyStage || 'Stage unavailable';

  if (error) {
    return (
      <div className="min-h-[50vh] bg-[var(--alo-page)] p-6 flex items-center justify-center">
        <Card role="alert" className="max-w-xl p-8 bg-white border-[var(--alo-border)] rounded-3xl text-center">
          <AlertTriangle className="w-10 h-10 text-crm-warning-text mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--alo-text)]">Your student data could not be loaded</h2>
          <p className="text-sm text-[var(--alo-body)] mt-2">{error}</p>
          <Button className="mt-5 h-12 px-8" onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  // A missing record is not a successful, pre-created portal or a sample profile.
  if (!student && !profile) {
    return (
      <div className="min-h-screen bg-[var(--alo-page)] p-6 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-12 bg-white border-[var(--alo-border)] rounded-3xl shadow-sm text-center">
            <AlertTriangle className="w-12 h-12 text-crm-warning-text mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--alo-text)]">No student profile is linked to this session</h2>
            <p className="text-sm text-[var(--alo-body)] mt-3 max-w-2xl mx-auto">Sign in to load your existing student record, or start the secure registration process. Your profile and journey will appear here after they are linked to your account.</p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link href="/student/register"><Button className="bg-[var(--alo-brand)] text-white h-12 px-8 font-bold rounded-xl">Start Registration</Button></Link>
              <Link href="/student/login"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-8 rounded-xl">Student Login</Button></Link>
              <Link href="/book-consultation"><Button className="bg-[var(--alo-cta)] text-white h-12 px-8 font-bold rounded-xl">Book Consultation</Button></Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--alo-page)] text-[var(--alo-text)]">
      {/* 7. DASHBOARD HEADER — Logo, Student name, ID, type, destination, current application, journey stage, profile completion, notification, messages, language, help, logout */}
      <div className="bg-white border-b border-[var(--alo-border)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--alo-brand)] text-white flex items-center justify-center font-black">ALO</div>
              <div>
                <h1 className="text-xl font-bold text-[var(--alo-text)]">Welcome back, {profile?.fullName || profile?.givenName || student?.name || 'Student'}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20">{profile?.studentId || student?.studentId || 'Student ID unavailable'}</Badge>
                  {(profile?.studentType || student?.userType) && <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)]">{profile?.studentType || student?.userType}</Badge>}
                  <span className="text-[var(--alo-text-muted)]">{profile?.preferredCountry || 'Destination not selected'} Admission Journey</span>
                  <span className="text-[var(--alo-text-muted)]">•</span>
                  <span className="text-[var(--alo-body)]">Profile: {profileCompletion}%</span>
                  <span className="text-[var(--alo-text-muted)]">•</span>
                  <span className="font-semibold text-[var(--alo-brand)]">Current stage: {journeyStage}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]">Next: {nextAction?.text || 'No next action recorded'}</Badge>
              <Link href="/student/messages"><Button size="sm" variant="outline" className="border-[var(--alo-border)] "><MessageSquare className="w-4 h-4 mr-1" />Messages</Button></Link>
              <Link href="/student/notifications"><Button size="sm" variant="outline" className="border-[var(--alo-border)] ">Notifications</Button></Link>
              <Link href="/student/help"><Button size="sm" variant="outline" className="border-[var(--alo-border)]">Help</Button></Link>
              <Button size="sm" variant="outline" className="border-[var(--alo-border)]" onClick={() => { void fetch('/api/student/auth/logout', { method: 'POST', credentials: 'same-origin' }).finally(() => router.push('/student/login')); }}>Log out everywhere</Button>
            </div>
          </div>
          <Progress value={profileCompletion} className="h-2 mt-4" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 8. PRIMARY NEXT-ACTION ENGINE — Large dynamic YOUR NEXT BEST ACTION — AI determines from */}
        <Card className="p-6 md:p-8 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-3xl text-white shadow-xl border-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-[var(--alo-cta-accent)]" /><Badge className="bg-white/20 text-white border-white/30 text-[11px] font-bold">YOUR NEXT ACTION — Based on your student record</Badge></div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{nextAction?.text || 'Complete Your Profile'}</h2>
              <p className="text-sm text-[var(--alo-brand-pale)] mt-2 max-w-2xl leading-relaxed">{nextAction?.reason || 'No next action is currently available from your student record.'}</p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link href={nextAction?.actionUrl || '/student/profile'}><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-8 font-bold rounded-xl shadow-md">{nextAction?.cta || 'Continue'} →</Button></Link>
              <Link href="/student/messages"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 rounded-xl ">Message ALO for help</Button></Link>
            </div>
          </div>
        </Card>

        {/* 9. DASHBOARD QUICK ACTIONS — Large action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Continue Application', icon: FileText, href: '/student/applications', color: 'bg-[var(--alo-brand)] text-white' },
            { label: 'Find Courses', icon: Search, href: '/student/course-finder', color: 'bg-white border-[var(--alo-border)] text-[var(--alo-text)] hover:bg-[var(--alo-page)]' },
            { label: 'Upload Documents', icon: Upload, href: '/student/documents', color: 'bg-white border-[var(--alo-border)] text-[var(--alo-text)]' },
            { label: 'Message Counselor', icon: MessageSquare, href: '/student/messages', color: 'bg-white border-[var(--alo-border)] text-[var(--alo-text)]' },
            { label: 'Help & Support', icon: Sparkles, href: '/student/help', color: 'bg-[var(--alo-cta)]/10 border-[var(--alo-cta)]/20 text-[var(--alo-cta)] hover:bg-[var(--alo-cta)] hover:text-white' },
            { label: 'Start Mock Test', icon: BookOpen, href: '/student/mock-tests', color: 'bg-white border-[var(--alo-border)] text-[var(--alo-text)]' },
            { label: 'Practice Interview', icon: Users, href: '/student/ai-interview', color: 'bg-white border-[var(--alo-border)] text-[var(--alo-text)]' },
            { label: 'Visa Readiness', icon: ShieldCheck, href: '/student/visa/readiness', color: 'bg-white border-[var(--alo-border)] text-[var(--alo-text)]' },
            { label: 'View Timeline', icon: Clock, href: '/student/timeline', color: 'bg-white border-[var(--alo-border)] text-[var(--alo-text)]' },
            { label: 'Refer a Friend', icon: Users, href: '/student/referrals', color: 'bg-crm-success-bg border-crm-success-border text-crm-success-text hover:bg-[var(--alo-success-dark)] hover:text-white' },
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
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3"><h4 className="font-bold text-sm flex items-center gap-2"><User className="w-4 h-4 text-[var(--alo-brand)]" />Profile</h4><Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">{profileCompletion}%</Badge></div>
                  <Progress value={profileCompletion} className="h-2 mb-3" />
                  <p className="text-xs text-[var(--alo-body)]">Profile completion: {profileCompletion}%. Keep your personal, education, and study preference details up to date.</p>
                </div>
                <Link href="/student/profile" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">View Profile — My Journey</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[var(--alo-brand)]" />Applications</h4>
                  {applications.length === 0 ? <p className="text-xs text-[var(--alo-text-muted)]">No active applications yet. Your application status, next deadline, counselor, application officer, visa officer, current status, progress, last update will appear here.</p> : (
                    <div className="space-y-2">
                      {applications.slice(0,2).map((app:any)=>(
                        <div key={app.id || app.applicationCode} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 text-xs">
                          <p className="font-semibold">{app.universityName || app.university} — {app.courseName || app.course}</p>
                          <p className="text-[var(--alo-text-muted)]">Stage: {app.stage} • Status: {app.status} • Deadline: {app.deadline || 'Check'}</p>
                          <p className="text-[var(--alo-brand)] font-medium">Next: {app.nextAction || 'Check with counselor'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/student/applications" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">View Applications — My Applications</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--alo-brand)]" />Documents</h4>
                  {documents.length === 0 ? <p className="text-xs text-[var(--alo-text-muted)]">No documents are currently linked to your student record.</p> : (
                    <div className="space-y-1.5">
                      {documents.slice(0,4).map((doc:any)=>(
                        <div key={doc.id || doc.name} className="flex items-center justify-between bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 text-xs">
                          <span className="font-medium truncate">{doc.name || doc.category || doc.documentType}</span>
                          <Badge className={`${doc.status==='approved' ? 'bg-crm-success-bg text-crm-success-text border-crm-success-border' : doc.status==='rejected' ? 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border' : 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border'} text-[11px]`}>{doc.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/student/documents" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">View Documents — My Documents</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[var(--alo-brand)]" />English Test</h4>
                  {data?.englishTests.length ? <p className="text-xs text-[var(--alo-body)]">Latest recorded result: {data.englishTests[0].testType || data.englishTests[0].testName || 'English test'} · Score: {data.englishTests[0].overallScore ?? data.englishTests[0].score ?? 'Not recorded'}</p> : <p className="text-xs text-[var(--alo-text-muted)]">No English test result is linked to your student record yet.</p>}
                </div>
                <Link href="/student/english-test" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">View English Tests — My Tests</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-[var(--alo-brand)]" />AI Interview</h4>
                  {data?.interviewSessions.length ? <p className="text-xs text-[var(--alo-body)]">Latest practice: {data.interviewSessions[0].createdAt ? new Date(data.interviewSessions[0].createdAt).toLocaleDateString() : 'Date not recorded'} · Status: {data.interviewSessions[0].status || 'Not recorded'}</p> : <p className="text-xs text-[var(--alo-text-muted)]">No interview practice is linked to your student record yet.</p>}
                </div>
                <Link href="/student/ai-interview" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">Practice Interview — My Interviews</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[var(--alo-brand)]" />Visa</h4>
                  {data?.visaChecklist.length ? <p className="text-xs text-[var(--alo-body)]">{data.visaChecklist.filter((item: any) => !['approved', 'verified', 'complete'].includes(String(item.status || '').toLowerCase())).length} checklist item(s) still need review. See your visa workspace for details.</p> : <p className="text-xs text-[var(--alo-text-muted)]">No visa checklist is linked to your student record yet. This is not a visa readiness assessment.</p>}
                </div>
                <Link href="/student/visa" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">View Visa — My Visa</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[var(--alo-brand)]" />Messages — Unified Communication Center</h4>
                  <p className="text-xs text-[var(--alo-body)]">Unread portal messages: {data?.messages?.unread ?? 'Not available'}{data?.messages?.lastMessage?.createdAt ? ` · Latest update: ${new Date(data.messages.lastMessage.createdAt).toLocaleString()}` : ''}. Open Messages to view the conversations available to your account.</p>
                </div>
                <Link href="/student/messages" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">View Messages — My Messages</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[var(--alo-brand)]" />Appointment</h4>
                  <p className="text-xs text-[var(--alo-body)]">Appointments on record: {data?.appointments.length ?? 0}{data?.appointments[0]?.scheduledAt ? ` · Latest scheduled: ${new Date(data.appointments[0].scheduledAt).toLocaleString()}` : ''}</p>
                </div>
                <Link href="/student/appointments" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">View Appointments — My Appointments</Button></Link>
              </Card>

              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-[var(--alo-brand)]" />Payment</h4>
                  <p className="text-xs text-[var(--alo-body)]">Payments on record: {data?.payments.length ?? 0}. View Payments for the persisted status and receipt details available to your account.</p>
                </div>
                <Link href="/student/payments" className="block mt-4"><Button variant="outline" className="w-full border-[var(--alo-border)] ">View Payments — My Payments</Button></Link>
              </Card>
            </div>

            {/* 11. COMPLETE STUDENT JOURNEY TIMELINE — Visual journey */}
            <Card className="p-6 md:p-8 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-[var(--alo-text)] mb-6">Your Journey — Recorded Activity</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--alo-brand)] via-[var(--alo-cta)] to-emerald-500 hidden md:block" />
                <div className="space-y-4">
                  {JOURNEY_STAGES.map((stage, i) => {
                    const stageKey = normalizeJourneyStage(stage);
                    const currentKey = normalizeJourneyStage(journeyStage);
                    const currentStageIndex = JOURNEY_STAGES.findIndex((item) => normalizeJourneyStage(item) === currentKey);
                    const timelineEvents = timeline.filter((event: any) => {
                      const eventKey = normalizeJourneyStage(`${event.stage || ''} ${event.title || ''}`);
                      return eventKey.length > 0 && stageKey.length > 0 && (eventKey.includes(stageKey) || stageKey.includes(eventKey));
                    });
                    const isCurrent = currentStageIndex === i;
                    const isCompleted = timelineEvents.length > 0 || (currentStageIndex >= 0 && i < currentStageIndex);
                    return (
                      <div key={stage} className="relative flex gap-4">
                        <div className={`hidden md:flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold shrink-0 ${isCompleted ? 'bg-[var(--alo-success)] text-white' : isCurrent ? 'bg-[var(--alo-brand)] text-white animate-pulse' : 'bg-white border border-[var(--alo-border)] text-[var(--alo-text-muted)]'}`}>{isCompleted ? '✓' : i+1}</div>
                        <div className={`flex-1 p-4 rounded-2xl border ${isCurrent ? 'bg-[var(--alo-brand)]/5 border-[var(--alo-brand)]/20' : isCompleted ? 'bg-crm-success-bg/50 border-crm-success-border' : 'bg-[var(--alo-page)] border-[var(--alo-border)]'} `}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">{stage} {isCurrent && <Badge className="bg-[var(--alo-brand)] text-white text-[11px] ml-2">Current</Badge>} {isCompleted && <Badge className="bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px] ml-2">Completed</Badge>}</h4>
                            <span className="text-[11px] text-[var(--alo-text-muted)]">{timelineEvents[0]?.createdAt ? new Date(timelineEvents[0].createdAt).toLocaleString() : 'Pending'}</span>
                          </div>
                          {timelineEvents.length > 0 ? (
                            <div className="mt-2 space-y-1.5">
                              {timelineEvents.slice(0,2).map((ev:any, idx:number)=>(
                                <div key={idx} className="bg-white border border-[var(--alo-border)] rounded-xl p-3 text-xs">
                                  <p className="font-medium">{ev.title || ev.description || 'Timeline event'}</p>
                                  <p className="text-[11px] text-[var(--alo-text-muted)] mt-1">{ev.actorName || ev.actor ? `Responsible: ${ev.actorName || ev.actor} · ` : ''}{ev.createdAt ? new Date(ev.createdAt).toLocaleString() : 'Time not recorded'}{ev.status ? ` · Status: ${ev.status}` : ''}{ev.description ? ` · ${ev.description.substring(0, 120)}` : ''}{ev.documentId ? ` · Document: ${ev.documentId}` : ''}{ev.actionUrl ? <> · <a href={ev.actionUrl} className="text-[var(--alo-brand)] underline">View action</a></> : ''}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--alo-text-muted)] mt-2">No timeline event is recorded for this stage yet.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-6 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">Showing recorded events associated with your student account. An empty stage means no event is currently available to display.</p>
            </Card>

            {/* 53. FINAL JOURNEY VISUAL — Permanent journey indicator */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-sm mb-4">Journey Stages</h3>
              <div className="flex flex-wrap gap-2">
                {FINAL_JOURNEY_INDICATOR.map((stage, i) => {
                  const stageKey = normalizeJourneyStage(stage);
                  const currentKey = normalizeJourneyStage(journeyStage);
                  const currentIndex = FINAL_JOURNEY_INDICATOR.findIndex((item) => normalizeJourneyStage(item) === currentKey);
                  const hasRecordedEvent = timeline.some((event: any) => {
                    const eventKey = normalizeJourneyStage(`${event.stage || ''} ${event.title || ''}`);
                    return eventKey.length > 0 && stageKey.length > 0 && (eventKey.includes(stageKey) || stageKey.includes(eventKey));
                  });
                  const isCurrent = currentIndex === i;
                  const isCompleted = hasRecordedEvent || (currentIndex >= 0 && i < currentIndex);
                  const isLocked = currentIndex >= 0 && i > currentIndex;
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <Badge className={`${isCompleted ? 'bg-[var(--alo-success)] text-white' : isCurrent ? 'bg-[var(--alo-brand)] text-white animate-pulse' : isLocked ? 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)] border-[var(--alo-border)]' : 'bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-body)]'} text-[11px] px-3 py-1.5`}>{isCompleted ? '✓' : isLocked ? '🔒' : '•'} {stage} {isCurrent ? '(Current)' : isCompleted ? '(Done)' : isLocked ? '(Locked)' : ''}</Badge>
                      {i < FINAL_JOURNEY_INDICATOR.length - 1 && <ArrowRight className="w-3 h-3 text-[var(--alo-placeholder)]" />}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-3">Stage completion is shown only when recorded in your journey data. Missing stage records are not treated as completed.</p>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h4 className="font-bold text-sm mb-3">Your Student Record</h4>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Student ID: {profile?.studentId || student?.studentId || 'Not assigned'} · Name: {profile?.fullName || student?.name || 'Not provided'} · Phone: {profile?.mobile || profile?.contactPhone || student?.phone || 'Not provided'} · Email: {profile?.primaryEmail || profile?.leadEmail || student?.email || 'Not provided'}</p>
            </Card>

            <Card className="p-6 bg-[var(--alo-brand)]/5 border-[var(--alo-brand)]/20 rounded-2xl">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[var(--alo-brand)]" />Need help with your journey?</h4>
              <p className="text-xs text-[var(--alo-body)]">Send a message to the ALO team for case-specific support.</p>
              <Link href="/student/messages" className="block mt-4"><Button className="w-full h-12">Message ALO</Button></Link>
            </Card>

            <Card className="p-6 bg-crm-success-bg border-crm-success-border rounded-2xl">
              <h4 className="font-bold text-sm mb-3 text-crm-success-text flex items-center gap-2"><Users className="w-4 h-4" />Refer a Friend</h4>
              <p className="text-xs text-crm-success-text">Open your referral center to view referral status and available offers. Referral codes and rewards are shown only when issued by the referral service.</p>
              <Link href="/student/referrals" className="block mt-4"><Button variant="outline" className="w-full border-crm-success-border text-crm-success-text">View My Referrals</Button></Link>
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
    return { text: `Upload ${missing?.name || missing?.category || 'document'}`, reason: 'A document in your account is marked as not uploaded. Review the requirement and upload the correct file.', cta: 'Open Documents', actionUrl: '/student/documents' };
  }
  if (applications.length === 0) {
    return { text: 'Explore courses', reason: 'No application is linked to your student record yet. Review course options and eligibility before deciding whether to apply.', cta: 'Open Course Finder', actionUrl: '/student/course-finder' };
  }
  const pendingOffer = applications.find((a:any)=> ['APPLICATION_SUBMITTED','DECISION_PENDING','CONDITIONAL_OFFER'].includes(a.stage) || ['PENDING','CONDITIONAL_OFFER'].includes(a.offerStatus));
  if (pendingOffer) {
    return { text: `Review application update — ${pendingOffer.universityName || pendingOffer.university || 'your university'}`, reason: 'Review the current application and offer details recorded in your account. Contact your counselor if any condition or deadline is unclear.', cta: 'Review Application', actionUrl: '/student/offers' };
  }
  const casPending = applications.find((a:any)=> ['DEPOSIT_PAID','CAS_PENDING','CONDITIONAL_OFFER'].includes(a.stage));
  if (casPending) {
    return { text: 'Complete CAS Questionnaire & Credibility Interview', reason: 'CAS / Final Admission Center shows offer status, conditions, deposit status, CAS questionnaire, credibility interview, CAS documents, CAS status, CAS issued date — when CAS issued automatically unlock VISA PREPARATION.', cta: 'Complete CAS', actionUrl: '/student/cas' };
  }
  const visaPrep = applications.find((a:any)=> ['CAS_RECEIVED','CAS_ISSUED','VISA_PREPARATION'].includes(a.stage) || a.casI20CoeStatus==='RECEIVED');
  if (visaPrep) {
    return { text: 'Review your visa checklist', reason: 'Check your visa workspace for recorded requirements and contact your visa officer if you need clarification. This is not a visa readiness prediction.', cta: 'Open Visa Workspace', actionUrl: '/student/visa' };
  }
  return { text: 'Practice Credibility Interview — AI Interview', reason: 'Practice credibility interview — why this country? why this university? why this course? previous education, career goals, study gap, sponsor, funding, accommodation, future plan, visa history, refusal history — scores communication/confidence/course knowledge/university knowledge/country knowledge/financial explanation/sponsor explanation/study-gap explanation/future plan/visa risk/overall readiness — results READY/NEEDS_PRACTICE/HIGH_RISK/HUMAN_REVIEW_REQUIRED — save result to Student Portal/CRM timeline/Counselor dashboard/Visa Officer dashboard.', cta: 'Practice Interview', actionUrl: '/student/ai-interview' };
}
