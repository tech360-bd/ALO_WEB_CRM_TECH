'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Eye,
  ChevronRight,
  Building2,
  BookOpen,
  Globe2,
  CalendarDays,
  DollarSign,
  ArrowRight,
  Send,
  CalendarPlus,
  Upload,
  Plane,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  StatCard,
  SectionCard,
  PageHeader,
  TimelineStep,
  EmptyState,
  LoadingGrid,
  PipelineStage,
  StatusBadge,
  Icon,
  MetricRow,
  MiniBar,
} from '@/components/alo/shared';
import { timeAgo, fmtDate } from '@/lib/alo-types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ApplicationManagerProps {
  onNavigate?: (view: string, slug?: string) => void;
}

// ─── Stage Definitions ───────────────────────────────────────────────────────

const STAGES = [
  'LEAD', 'COUNSELLING', 'SHORTLIST', 'APPLICATION', 'SUBMITTED',
  'OFFER', 'CAS', 'VISA', 'PRE_DEPARTURE', 'ENROLLED',
];

const STAGE_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  COUNSELLING: 'Counselling',
  SHORTLIST: 'Shortlist',
  APPLICATION: 'Application',
  SUBMITTED: 'Submitted',
  OFFER: 'Offer Received',
  CAS: 'CAS Issued',
  VISA: 'Visa Approved',
  PRE_DEPARTURE: 'Pre-departure',
  ENROLLED: 'Enrolled',
};

const STAGE_COLORS: Record<string, string> = {
  LEAD: 'bg-alo-gray-light text-alo-gray',
  COUNSELLING: 'bg-alo-blue-light text-alo-blue',
  SHORTLIST: 'bg-violet-50 text-violet-600',
  APPLICATION: 'bg-alo-orange-light text-alo-orange',
  SUBMITTED: 'bg-amber-50 text-amber-600',
  OFFER: 'bg-emerald-50 text-emerald-600',
  CAS: 'bg-emerald-50 text-emerald-600',
  VISA: 'bg-emerald-50 text-emerald-600',
  PRE_DEPARTURE: 'bg-alo-blue-light text-alo-blue',
  ENROLLED: 'bg-alo-blue text-white',
};

const PIPELINE_CONFIG = [
  { key: 'LEAD', label: 'Lead', color: 'blue' as const },
  { key: 'COUNSELLING', label: 'Counselling', color: 'blue' as const },
  { key: 'SHORTLIST', label: 'Shortlist', color: 'violet' as const },
  { key: 'APPLICATION', label: 'Application', color: 'orange' as const },
  { key: 'SUBMITTED', label: 'Submitted', color: 'amber' as const },
  { key: 'OFFER', label: 'Offer', color: 'emerald' as const },
  { key: 'CAS', label: 'CAS', color: 'emerald' as const },
  { key: 'VISA', label: 'Visa', color: 'emerald' as const },
  { key: 'PRE_DEPARTURE', label: 'Pre-dep', color: 'blue' as const },
  { key: 'ENROLLED', label: 'Enrolled', color: 'emerald' as const },
];

const DOC_STATUS_COLORS: Record<string, string> = {
  UPLOADED: 'bg-alo-blue-light text-alo-blue',
  VERIFIED: 'bg-emerald-50 text-emerald-600',
  REJECTED: 'bg-rose-50 text-rose-600',
  MISSING: 'bg-amber-50 text-amber-600',
  PENDING: 'bg-alo-gray-light text-alo-gray',
};

const DOC_STATUS_ICONS: Record<string, string> = {
  UPLOADED: 'FileUp',
  VERIFIED: 'FileCheck',
  REJECTED: 'FileX',
  MISSING: 'FileQuestion',
  PENDING: 'Clock',
};

const COUNTRY_FLAGS: Record<string, string> = {
  UK: 'GB',
  USA: 'US',
  Canada: 'CA',
  Australia: 'AU',
  Germany: 'DE',
  Ireland: 'IE',
  Malaysia: 'MY',
  'New Zealand': 'NZ',
  Finland: 'FI',
  Sweden: 'SE',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Application {
  id: string;
  applicationId: string;
  studentName?: string;
  university: string;
  course: string;
  country: string;
  intake?: string;
  studyLevel?: string;
  stage: string;
  priority?: string;
  deadline?: string | null;
  counselorId?: string | null;
  counselor?: { id: string; name: string; email?: string } | null;
  createdAt: string;
  updatedAt: string;
  tuition?: string;
  student?: {
    studentId: string;
    fullName: string;
    email?: string;
    phone?: string;
  } | null;
  [key: string]: unknown;
}

interface AppDocument {
  id: string;
  documentType: string;
  status: string;
  reviewNote?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

interface Offer {
  id: string;
  applicationId: string;
  offerType?: string;
  status?: string;
  casNumber?: string;
  issuedAt?: string;
  [key: string]: unknown;
}

interface VisaRecord {
  id: string;
  applicationId: string;
  decision?: string;
  submittedAt?: string;
  decisionDate?: string;
  visaType?: string;
  [key: string]: unknown;
}

interface DashboardStats {
  counts?: Record<string, number>;
  appsByStage?: Record<string, number>;
  [key: string]: unknown;
}

interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  userName?: string;
  createdAt: string;
  [key: string]: unknown;
}

// ─── Demo Fallback Data ──────────────────────────────────────────────────────

const DEMO_STATS: DashboardStats = {
  counts: {
    totalApplications: 156,
    pendingReview: 34,
    offersReceived: 28,
    visaApproved: 18,
  totalLeads: 89,
  totalCounselling: 62,
    totalShortlist: 48,
    totalApplication: 41,
    totalSubmitted: 38,
    totalOffer: 28,
    totalCas: 22,
    totalVisa: 18,
    totalPreDeparture: 14,
    totalEnrolled: 12,
  totalStudents: 142,
  todayLeads: 8,
  activeApplications: 89,
    conversionRate: 22.5,
  revenue: 245000,
    pendingPayments: 42000,
  avgProfileCompletion: 72,
},
docsByStatus: { PENDING: 34, UPLOADED: 67, UNDER_REVIEW: 23, APPROVED: 89, REJECTED: 5 },
finance: { revenue: 184500, pendingPayments: 32500 },
marketing: { conversionRate: 22.2 },
appsByStage: {
    LEAD: 89, COUNSELLING: 62, SHORTLIST: 48, APPLICATION: 41,
    SUBMITTED: 38, OFFER: 28, CAS: 22, VISA: 18, PRE_DEPARTURE: 14, ENROLLED: 12,
  },
};

const DEMO_APPLICATIONS: Application[] = [
  { id: 'a1', applicationId: 'ALO-A-0042', studentName: 'Ahmed Al-Rashid', university: 'University of Manchester', course: 'MSc Computer Science', country: 'UK', intake: 'Sep 2025', studyLevel: 'Masters', stage: 'SUBMITTED', priority: 'HIGH', deadline: '2025-06-15', counselor: { id: 'c1', name: 'Sarah Johnson' }, createdAt: '2025-01-10T10:00:00Z', updatedAt: '2025-02-20T14:00:00Z', tuition: '£28,000', student: { studentId: 'S001', fullName: 'Ahmed Al-Rashid', email: 'ahmed@email.com', phone: '+971501234567' } },
  { id: 'a2', applicationId: 'ALO-A-0038', studentName: 'Priya Sharma', university: 'University of Melbourne', course: 'MBA International Business', country: 'Australia', intake: 'Feb 2026', studyLevel: 'Masters', stage: 'OFFER', priority: 'NORMAL', counselor: { id: 'c2', name: 'Mike Chen' }, createdAt: '2025-01-12T14:00:00Z', updatedAt: '2025-02-18T09:00:00Z', tuition: 'A$52,000', student: { studentId: 'S002', fullName: 'Priya Sharma', email: 'priya@email.com', phone: '+919876543210' } },
  { id: 'a3', applicationId: 'ALO-A-0051', studentName: 'Fatima Hassan', university: 'University of Toronto', course: 'BEng Mechanical Engineering', country: 'Canada', intake: 'Sep 2025', studyLevel: 'Bachelors', stage: 'COUNSELLING', priority: 'URGENT', deadline: '2025-03-01', counselor: { id: 'c1', name: 'Sarah Johnson' }, createdAt: '2025-01-14T09:00:00Z', updatedAt: '2025-02-15T11:00:00Z', tuition: 'C$45,000', student: { studentId: 'S003', fullName: 'Fatima Hassan', email: 'fatima@email.com', phone: '+966551234567' } },
  { id: 'a4', applicationId: 'ALO-A-0029', studentName: 'James Okonkwo', university: 'University College London', course: 'MSc Data Science', country: 'UK', intake: 'Sep 2025', studyLevel: 'Masters', stage: 'VISA', priority: 'HIGH', counselor: { id: 'c3', name: 'Anna Weber' }, createdAt: '2025-01-08T11:00:00Z', updatedAt: '2025-02-22T16:00:00Z', tuition: '£35,000', student: { studentId: 'S004', fullName: 'James Okonkwo', email: 'james@email.com', phone: '+2348012345678' } },
  { id: 'a5', applicationId: 'ALO-A-0060', studentName: 'Nguyen Thi Lan', university: 'TU Munich', course: 'MSc Artificial Intelligence', country: 'Germany', intake: 'Oct 2025', studyLevel: 'Masters', stage: 'APPLICATION', priority: 'NORMAL', counselor: { id: 'c2', name: 'Mike Chen' }, createdAt: '2025-01-15T16:00:00Z', updatedAt: '2025-02-10T10:00:00Z', tuition: '€3,000/sem', student: { studentId: 'S005', fullName: 'Nguyen Thi Lan', email: 'lan@email.com', phone: '+84901234567' } },
  { id: 'a6', applicationId: 'ALO-A-0071', studentName: 'Maria Santos', university: 'Trinity College Dublin', course: 'MSc Finance', country: 'Ireland', intake: 'Sep 2025', studyLevel: 'Masters', stage: 'SHORTLIST', priority: 'LOW', counselor: { id: 'c1', name: 'Sarah Johnson' }, createdAt: '2025-01-20T08:00:00Z', updatedAt: '2025-02-12T13:00:00Z', tuition: '€24,500', student: { studentId: 'S006', fullName: 'Maria Santos', email: 'maria@email.com', phone: '+353871234567' } },
  { id: 'a7', applicationId: 'ALO-A-0045', studentName: 'Chen Wei', university: 'Imperial College London', course: 'MEng Electrical Engineering', country: 'UK', intake: 'Sep 2025', studyLevel: 'Masters', stage: 'CAS', priority: 'HIGH', counselor: { id: 'c3', name: 'Anna Weber' }, createdAt: '2025-01-05T12:00:00Z', updatedAt: '2025-02-25T09:00:00Z', tuition: '£38,700', student: { studentId: 'S007', fullName: 'Chen Wei', email: 'chen@email.com', phone: '+8613912345678' } },
  { id: 'a8', applicationId: 'ALO-A-0055', studentName: 'Olga Petrov', university: 'University of Sydney', course: 'Bachelor of Nursing', country: 'Australia', intake: 'Mar 2026', studyLevel: 'Bachelors', stage: 'LEAD', priority: 'NORMAL', counselor: null, createdAt: '2025-02-01T10:00:00Z', updatedAt: '2025-02-01T10:00:00Z', tuition: 'A$42,000', student: { studentId: 'S008', fullName: 'Olga Petrov', email: 'olga@email.com', phone: '+79031234567' } },
  { id: 'a9', applicationId: 'ALO-A-0033', studentName: 'Kwame Asante', university: 'University of British Columbia', course: 'MSc Forest Science', country: 'Canada', intake: 'Sep 2025', studyLevel: 'Masters', stage: 'ENROLLED', priority: 'NORMAL', counselor: { id: 'c2', name: 'Mike Chen' }, createdAt: '2024-11-15T09:00:00Z', updatedAt: '2025-02-20T15:00:00Z', tuition: 'C$38,000', student: { studentId: 'S009', fullName: 'Kwame Asante', email: 'kwame@email.com', phone: '+233241234567' } },
  { id: 'a10', applicationId: 'ALO-A-0068', studentName: 'Yuki Tanaka', university: 'University of Edinburgh', course: 'LLM International Law', country: 'UK', intake: 'Sep 2025', studyLevel: 'Masters', stage: 'PRE_DEPARTURE', priority: 'HIGH', counselor: { id: 'c3', name: 'Anna Weber' }, createdAt: '2024-12-01T08:00:00Z', updatedAt: '2025-02-24T11:00:00Z', tuition: '£31,200', student: { studentId: 'S010', fullName: 'Yuki Tanaka', email: 'yuki@email.com', phone: '+819012345678' } },
  { id: 'a11', applicationId: 'ALO-A-0075', studentName: 'Ravi Patel', university: 'University of Birmingham', course: 'MSc Cyber Security', country: 'UK', intake: 'Jan 2026', studyLevel: 'Masters', stage: 'APPLICATION', priority: 'NORMAL', counselor: { id: 'c1', name: 'Sarah Johnson' }, createdAt: '2025-02-05T14:00:00Z', updatedAt: '2025-02-20T10:00:00Z', tuition: '£27,500', student: { studentId: 'S011', fullName: 'Ravi Patel', email: 'ravi@email.com', phone: '+919876543211' } },
  { id: 'a12', applicationId: 'ALO-A-0080', studentName: 'Sofia Martinez', university: 'Monash University', course: 'BBA Business', country: 'Australia', intake: 'Feb 2026', studyLevel: 'Bachelors', stage: 'OFFER', priority: 'URGENT', deadline: '2025-03-10', counselor: { id: 'c2', name: 'Mike Chen' }, createdAt: '2025-01-25T09:00:00Z', updatedAt: '2025-02-22T16:00:00Z', tuition: 'A$48,000', student: { studentId: 'S012', fullName: 'Sofia Martinez', email: 'sofia@email.com', phone: '+5491112345678' } },
];

const DEMO_DOCUMENTS: AppDocument[] = [
  { id: 'd1', documentType: 'Passport', status: 'VERIFIED', createdAt: '2025-01-10T10:00:00Z' },
  { id: 'd2', documentType: 'Academic Transcripts', status: 'VERIFIED', createdAt: '2025-01-12T14:00:00Z' },
  { id: 'd3', documentType: 'Degree Certificate', status: 'UPLOADED', createdAt: '2025-01-15T09:00:00Z' },
  { id: 'd4', documentType: 'English Test (IELTS)', status: 'VERIFIED', createdAt: '2025-01-18T11:00:00Z' },
  { id: 'd5', documentType: 'Personal Statement (SOP)', status: 'UPLOADED', createdAt: '2025-01-20T08:00:00Z' },
  { id: 'd6', documentType: 'CV / Resume', status: 'VERIFIED', createdAt: '2025-01-22T10:00:00Z' },
  { id: 'd7', documentType: 'Reference Letter (Academic)', status: 'REJECTED', reviewNote: 'Not on letterhead', createdAt: '2025-01-25T14:00:00Z' },
  { id: 'd8', documentType: 'Reference Letter (Professional)', status: 'MISSING' },
  { id: 'd9', documentType: 'Bank Statement', status: 'PENDING' },
  { id: 'd10', documentType: 'Tuberculosis Test Certificate', status: 'MISSING' },
];

const DEMO_OFFERS: Offer[] = [
  { id: 'o1', applicationId: 'a2', offerType: 'CONDITIONAL', status: 'ACCEPTED', issuedAt: '2025-02-10T10:00:00Z' },
  { id: 'o2', applicationId: 'a12', offerType: 'UNCONDITIONAL', status: 'PENDING_RESPONSE', issuedAt: '2025-02-20T14:00:00Z' },
];

const DEMO_VISA: VisaRecord[] = [
  { id: 'v1', applicationId: 'a4', decision: 'APPROVED', submittedAt: '2025-02-01T09:00:00Z', decisionDate: '2025-02-22T16:00:00Z', visaType: 'Student Visa (Tier 4)' },
];

const DEMO_ACTIVITY: ActivityLog[] = [
  { id: 'al1', action: 'Stage Advanced', details: 'Moved from APPLICATION to SUBMITTED by Sarah Johnson', userName: 'Sarah Johnson', createdAt: '2025-02-20T14:00:00Z' },
  { id: 'al2', action: 'Document Verified', details: 'IELTS score card verified — Overall 7.0', userName: 'Anna Weber', createdAt: '2025-02-18T11:00:00Z' },
  { id: 'al3', action: 'Offer Received', details: 'Conditional offer from University of Melbourne', userName: 'Mike Chen', createdAt: '2025-02-15T09:00:00Z' },
  { id: 'al4', action: 'Comment Added', details: 'Student requested expedited review', userName: 'Sarah Johnson', createdAt: '2025-02-12T16:00:00Z' },
  { id: 'al5', action: 'Document Rejected', details: 'Academic reference letter not on official letterhead', userName: 'Anna Weber', createdAt: '2025-02-10T10:00:00Z' },
  { id: 'al6', action: 'Application Created', details: 'New application initiated for MSc Computer Science', userName: 'Sarah Johnson', createdAt: '2025-01-10T10:00:00Z' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ApplicationManager({ onNavigate }: ApplicationManagerProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [stats, setStats] = useState<DashboardStats>(DEMO_STATS);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>(DEMO_DOCUMENTS);
  const [offers, setOffers] = useState<Offer[]>(DEMO_OFFERS);
  const [visaRecords, setVisaRecords] = useState<VisaRecord[]>(DEMO_VISA);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(DEMO_ACTIVITY);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');

  // Detail Sheet
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Advance Stage Dialog
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // ─── Fetch Data ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        fetch('/api/dashboard/stats').then((r) => r.json()),
        fetch('/api/applications').then((r) => r.json()),
        fetch('/api/documents/list').then((r) => r.json()),
        fetch('/api/offers').then((r) => r.json()),
        fetch('/api/visa').then((r) => r.json()),
      ]);

      if (cancelled) return;

      // Stats
      if (results[0].status === 'fulfilled' && results[0].value) {
        const raw = results[0].value;
        setStats({
          counts: raw.counts || raw.kpis ? {
            ...raw.counts,
            totalApplications: raw.counts?.totalApplications || raw.counts?.applications || raw.kpis?.totalApplications || DEMO_STATS.counts!.totalApplications,
            pendingReview: raw.counts?.pendingReview || raw.kpis?.decisionPending || DEMO_STATS.counts!.pendingReview,
            offersReceived: raw.counts?.offersReceived || raw.kpis?.conditionalOffers || DEMO_STATS.counts!.offersReceived,
            visaApproved: raw.counts?.visaApproved || raw.kpis?.visaApproved || DEMO_STATS.counts!.visaApproved,
            ...raw.counts,
          } : DEMO_STATS.counts!,
          appsByStage: raw.appsByStage || raw.counts?.appsByStage || DEMO_STATS.appsByStage,
        });
      }

      // Applications
      if (results[1].status === 'fulfilled' && results[1].value) {
        const raw = results[1].value;
        const apps: Application[] = Array.isArray(raw.applications)
          ? raw.applications
          : Array.isArray(raw)
            ? raw
            : [];
        if (apps.length > 0) {
          setApplications(apps);
        } else {
          setApplications(DEMO_APPLICATIONS);
        }
      } else {
        setApplications(DEMO_APPLICATIONS);
      }

      // Documents
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value?.documents)) {
        const docs = results[2].value.documents;
        if (docs.length > 0) setDocuments(docs);
      }

      // Offers
      if (results[3].status === 'fulfilled' && Array.isArray(results[3].value?.offers)) {
        const offs = results[3].value.offers;
        if (offs.length > 0) setOffers(offs);
      } else if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) {
        const offs = results[3].value;
        if (offs.length > 0) setOffers(offs);
      }

      // Visa
      if (results[4].status === 'fulfilled' && Array.isArray(results[4].value?.visaApplications)) {
        const visas = results[4].value.visaApplications;
        if (visas.length > 0) setVisaRecords(visas);
      } else if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
        const visas = results[4].value;
        if (visas.length > 0) setVisaRecords(visas);
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // ─── Computed ───────────────────────────────────────────────────────────

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGES.forEach((s) => { counts[s] = 0; });
    applications.forEach((app) => {
      const stage = app.stage?.toUpperCase() || 'LEAD';
      // Map old stages to new simplified stages
      const mapped = mapOldStage(stage);
      if (mapped && counts[mapped] !== undefined) {
        counts[mapped]++;
      } else if (counts[stage] !== undefined) {
        counts[stage]++;
      }
    });
    // Merge API data if available
    if (stats.appsByStage) {
      Object.entries(stats.appsByStage).forEach(([k, v]) => {
        const mapped = mapOldStage(k);
        if (mapped && counts[mapped] !== undefined) {
          counts[mapped] = Math.max(counts[mapped], v as number);
        } else if (counts[k] !== undefined) {
          counts[k] = Math.max(counts[k], v as number);
        }
      });
    }
    return counts;
  }, [applications, stats.appsByStage]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch = !searchQuery ||
        app.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicationId.toLowerCase().includes(searchQuery.toLowerCase());

      const appStage = mapOldStage(app.stage?.toUpperCase() || 'LEAD') || app.stage;
      const matchStage = stageFilter === 'ALL' || appStage === stageFilter;
      const matchCountry = countryFilter === 'ALL' || app.country === countryFilter;
      return matchSearch && matchStage && matchCountry;
    });
  }, [applications, searchQuery, stageFilter, countryFilter]);

  const selectedAppDocs = useMemo(() => {
    if (!selectedApp) return documents;
    return documents.filter((d) => (d as Record<string, unknown>).applicationId === selectedApp.id || documents.indexOf(d) < 10);
  }, [selectedApp, documents]);

  const selectedAppOffer = useMemo(() => {
    if (!selectedApp) return null;
    return offers.find((o) => o.applicationId === selectedApp.id) || offers[0] || null;
  }, [selectedApp, offers]);

  const selectedAppVisa = useMemo(() => {
    if (!selectedApp) return null;
    return visaRecords.find((v) => v.applicationId === selectedApp.id) || visaRecords[0] || null;
  }, [selectedApp, visaRecords]);

  const totalApps = stats.counts?.totalApplications ?? applications.length;
  const pendingReview = stats.counts?.pendingReview ?? applications.filter((a) => mapOldStage(a.stage) === 'APPLICATION' || mapOldStage(a.stage) === 'SHORTLIST').length;
  const offersReceived = stats.counts?.offersReceived ?? stageCounts.OFFER ?? 0;
  const visaApproved = stats.counts?.visaApproved ?? stageCounts.VISA ?? 0;

  const countries = useMemo(() => {
    const set = new Set(applications.map((a) => a.country));
    return Array.from(set).sort();
  }, [applications]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const openDetail = useCallback((app: Application) => {
    setSelectedApp(app);
    setSheetOpen(true);
  }, []);

  const handleAdvanceStage = useCallback(async () => {
    if (!selectedApp) return;
    const currentIdx = STAGES.indexOf(mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage);
    if (currentIdx < 0 || currentIdx >= STAGES.length - 1) return;

    setAdvancing(true);
    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedApp.id, stage: STAGES[currentIdx + 1] }),
      });
      // Optimistic update
      setApplications((prev) => prev.map((a) =>
        a.id === selectedApp.id ? { ...a, stage: STAGES[currentIdx + 1] } : a
      ));
      setSelectedApp((prev) => prev ? { ...prev, stage: STAGES[currentIdx + 1] } : prev);
      setAdvanceDialogOpen(false);
    } catch {
      // Silently fail — will retry on next fetch
    }
    setAdvancing(false);
  }, [selectedApp]);

  const nextStage = selectedApp
    ? STAGES[STAGES.indexOf(mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage) + 1]
    : null;

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingGrid count={4} />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Failed to load"
        description={error}
        action={
          <Button onClick={handleRefresh} variant="outline" className="rounded-xl">
            Retry
          </Button>
        }
      />
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ─── 1. Page Header ──────────────────────────────────────────── */}
        <PageHeader
          title="Application Manager"
          subtitle={`${totalApps} total applications across all stages`}
          icon="FolderKanban"
          action={
            <Button
              onClick={() => handleRefresh()}
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
            >
              <Icon name="RefreshCw" className="size-4" />
              Refresh
            </Button>
          }
        />

        {/* ─── 2. Overview Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Applications"
            value={totalApps}
            icon="FileText"
            accent="blue"
            hint={`${stageCounts.COUNSELLING || 0} in counselling`}
          />
          <StatCard
            label="Pending Review"
            value={pendingReview}
            icon="Clock"
            accent="orange"
            hint="Needs attention"
          />
          <StatCard
            label="Offers Received"
            value={offersReceived}
            icon="Award"
            accent="emerald"
            hint="This quarter"
          />
          <StatCard
            label="Visa Approved"
            value={visaApproved}
            icon="CheckCircle2"
            accent="sunshine"
            hint="Ready for enrolment"
          />
        </div>

        {/* ─── 3. Application Pipeline ─────────────────────────────────── */}
        <SectionCard title="Application Pipeline" icon="GitBranch">
          <div className="flex gap-2 overflow-x-auto pb-2 alo-scroll">
            <div
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 min-w-[72px]',
                stageFilter === 'ALL'
                  ? 'bg-alo-blue text-white'
                  : 'bg-alo-blue-light text-alo-blue hover:bg-alo-blue/10'
              )}
              onClick={() => setStageFilter('ALL')}
            >
              <span className="text-lg font-bold tabular-nums">{applications.length}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">All</span>
            </div>
            {PIPELINE_CONFIG.map((stage, idx) => (
              <div key={stage.key} className="flex items-center gap-2">
                {idx > 0 && (
                  <ChevronRight className="hidden size-4 flex-shrink-0 text-border lg:block" />
                )}
                <div
                  className={cn(
                    'cursor-pointer transition-all duration-200 min-w-[72px]',
                  )}
                  onClick={() => setStageFilter(stageFilter === stage.key ? 'ALL' : stage.key)}
                >
                  <PipelineStage
                    label={stage.label}
                    count={stageCounts[stage.key] || 0}
                    color={stage.color}
                    active={stageFilter === stage.key}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ─── 4. Applications Table ──────────────────────────────────── */}
        <SectionCard
          title="All Applications"
          icon="ClipboardList"
          action={
            <span className="text-sm text-alo-gray">
              {filteredApps.length} of {applications.length}
            </span>
          }
        >
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-alo-gray" />
              <Input
                placeholder="Search by student, university, course, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-xl border-border pl-10 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-gray hover:text-alo-black"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-10 w-[160px] rounded-xl border-border">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Stages</SelectItem>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="h-10 w-[150px] rounded-xl border-border">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Countries</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {filteredApps.length === 0 ? (
            <EmptyState
              icon="Search"
              title="No applications found"
              description="Try adjusting your filters or search query"
              action={
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => { setSearchQuery(''); setStageFilter('ALL'); setCountryFilter('ALL'); }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-alo-gray-light/50 hover:bg-alo-gray-light/50">
                    <TableHead className="font-semibold">Student</TableHead>
                    <TableHead className="hidden font-semibold md:table-cell">University</TableHead>
                    <TableHead className="hidden font-semibold lg:table-cell">Course</TableHead>
                    <TableHead className="hidden font-semibold sm:table-cell">Country</TableHead>
                    <TableHead className="font-semibold">Stage</TableHead>
                    <TableHead className="hidden font-semibold xl:table-cell">Submitted</TableHead>
                    <TableHead className="hidden font-semibold xl:table-cell">Counselor</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => {
                    const appStage = mapOldStage(app.stage?.toUpperCase()) || app.stage;
                    const stageLabel = STAGE_LABELS[appStage] || app.stage;
                    const stageColor = STAGE_COLORS[appStage] || 'bg-slate-100 text-slate-700';
                    const flag = COUNTRY_FLAGS[app.country];
                    const studentName = app.studentName || app.student?.fullName || 'Unknown';
                    const counselorName = app.counselor?.name || 'Unassigned';

                    return (
                      <TableRow
                        key={app.id}
                        className="group cursor-pointer transition-colors hover:bg-alo-blue-light/30"
                        onClick={() => openDetail(app)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-alo-blue-light text-xs font-bold text-alo-blue">
                              {studentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-alo-black">{studentName}</p>
                              <p className="truncate text-xs text-alo-gray">{app.applicationId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="truncate text-sm font-medium text-alo-black">{app.university}</p>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <p className="max-w-[200px] truncate text-sm text-alo-gray">{app.course}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            {flag && <span className="text-base">{getFlagEmoji(flag)}</span>}
                            <span className="text-sm text-alo-gray">{app.country}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', stageColor)}>
                            {stageLabel}
                          </span>
                          {app.priority === 'URGENT' && (
                            <Badge variant="destructive" className="ml-1.5 rounded-full px-1.5 py-0 text-[10px]">
                              Urgent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-sm text-alo-gray">{fmtDate(app.createdAt)}</span>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-sm text-alo-gray">{counselorName}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg"
                                  onClick={(e) => { e.stopPropagation(); openDetail(app); }}
                                >
                                  <Eye className="size-4 text-alo-gray" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApp(app);
                                    setAdvanceDialogOpen(true);
                                  }}
                                >
                                  <ArrowRight className="size-4 text-alo-blue" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Advance Stage</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>

        {/* ─── 5. Application Detail Sheet ─────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl lg:max-w-2xl">
            {selectedApp && (
              <div className="alo-scroll">
                {/* Sheet Header */}
                <div className="sticky top-0 z-10 border-b border-border bg-white px-6 py-4">
                  <SheetHeader className="text-left">
                    <SheetTitle className="text-lg font-bold text-alo-black">
                      {selectedApp.studentName || selectedApp.student?.fullName || 'Application'}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-alo-gray">
                      {selectedApp.applicationId} · {selectedApp.university}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge
                      status={mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage}
                      colorMap={STAGE_COLORS}
                      labels={STAGE_LABELS}
                    />
                    {selectedApp.priority === 'URGENT' && (
                      <Badge variant="destructive" className="rounded-full text-xs">Urgent</Badge>
                    )}
                    {selectedApp.priority === 'HIGH' && (
                      <Badge className="rounded-full bg-alo-orange-light text-alo-orange text-xs">High Priority</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {/* ─── Animated Timeline ──────────────────────────────── */}
                  <div className="rounded-2xl border border-border bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-alo-black">
                      <Icon name="GitBranch" className="size-4 text-alo-blue" />
                      Application Timeline
                    </h3>
                    <div className="space-y-0">
                      {STAGES.map((stage, idx) => {
                        const currentMapped = mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage;
                        const currentIdx = STAGES.indexOf(currentMapped);
                        let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
                        if (idx < currentIdx) status = 'completed';
                        else if (idx === currentIdx) status = 'current';

                        return (
                          <TimelineStep
                            key={stage}
                            step={idx + 1}
                            label={STAGE_LABELS[stage]}
                            status={status}
                            isLast={idx === STAGES.length - 1}
                          />
                        );
                      })}
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-alo-gray">Overall Progress</span>
                        <span className="text-xs font-bold text-alo-blue">
                          {Math.round(((STAGES.indexOf(mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage) + 1) / STAGES.length) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={((STAGES.indexOf(mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage) + 1) / STAGES.length) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>

                  {/* ─── Student Info Card ──────────────────────────────── */}
                  <div className="rounded-2xl border border-border bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-alo-black">
                      <Icon name="User" className="size-4 text-alo-blue" />
                      Student Information
                    </h3>
                    <div className="flex items-start gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-alo-blue to-alo-blue-dark text-lg font-bold text-white">
                        {(selectedApp.studentName || selectedApp.student?.fullName || '??').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-alo-black">
                          {selectedApp.studentName || selectedApp.student?.fullName || 'Unknown'}
                        </p>
                        <p className="text-sm text-alo-gray">{selectedApp.student?.studentId || selectedApp.applicationId}</p>
                        <div className="mt-3 space-y-2">
                          {selectedApp.student?.email && (
                            <MetricRow label="Email" value={selectedApp.student.email} />
                          )}
                          {selectedApp.student?.phone && (
                            <MetricRow label="Phone" value={selectedApp.student.phone} />
                          )}
                          <MetricRow
                            label="Profile Completion"
                            value={
                              <div className="flex items-center gap-2">
                                <MiniBar
                                  value={72}
                                  max={100}
                                  color="var(--color-alo-blue)"
                                />
                                <span className="text-xs font-medium text-alo-blue">72%</span>
                              </div>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─── Application Details ────────────────────────────── */}
                  <div className="rounded-2xl border border-border bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-alo-black">
                      <Icon name="GraduationCap" className="size-4 text-alo-blue" />
                      Application Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-alo-gray">University</p>
                        <p className="text-sm font-semibold text-alo-black flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-alo-gray" />
                          {selectedApp.university}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-alo-gray">Course</p>
                        <p className="text-sm font-semibold text-alo-black flex items-center gap-1.5">
                          <BookOpen className="size-3.5 text-alo-gray" />
                          {selectedApp.course}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-alo-gray">Intake</p>
                        <p className="text-sm font-semibold text-alo-black flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-alo-gray" />
                          {selectedApp.intake || '—'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-alo-gray">Tuition</p>
                        <p className="text-sm font-semibold text-alo-black flex items-center gap-1.5">
                          <DollarSign className="size-3.5 text-alo-gray" />
                          {selectedApp.tuition || '—'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-alo-gray">Country</p>
                        <p className="text-sm font-semibold text-alo-black flex items-center gap-1.5">
                          <Globe2 className="size-3.5 text-alo-gray" />
                          {selectedApp.country}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-alo-gray">Study Level</p>
                        <p className="text-sm font-semibold text-alo-black">
                          {selectedApp.studyLevel || '—'}
                        </p>
                      </div>
                    </div>
                    {selectedApp.deadline && (
                      <div className="mt-4 rounded-xl bg-amber-50 p-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="size-4 text-amber-600" />
                          <div>
                            <p className="text-xs font-semibold text-amber-700">Deadline</p>
                            <p className="text-sm font-medium text-amber-800">{fmtDate(selectedApp.deadline)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── Documents Section ──────────────────────────────── */}
                  <div className="rounded-2xl border border-border bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-alo-black">
                      <Icon name="FileCheck" className="size-4 text-alo-blue" />
                      Documents
                      <Badge variant="secondary" className="ml-auto rounded-full text-xs">
                        {selectedAppDocs.filter((d) => d.status === 'VERIFIED').length}/{selectedAppDocs.length} verified
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {selectedAppDocs.map((doc) => {
                        const statusCls = DOC_STATUS_COLORS[doc.status] || DOC_STATUS_COLORS.PENDING;
                        const statusIcon = DOC_STATUS_ICONS[doc.status] || 'Clock';
                        const statusLabel = doc.status.charAt(0) + doc.status.slice(1).toLowerCase();
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between rounded-xl border border-border px-4 py-3 transition-colors hover:bg-alo-gray-light/30"
                          >
                            <div className="flex items-center gap-3">
                              <Icon name={statusIcon} className={cn('size-4',
                                doc.status === 'VERIFIED' ? 'text-emerald-600' :
                                doc.status === 'REJECTED' ? 'text-rose-600' :
                                doc.status === 'MISSING' ? 'text-amber-600' :
                                doc.status === 'UPLOADED' ? 'text-alo-blue' :
                                'text-alo-gray'
                              )} />
                              <span className="text-sm font-medium text-alo-black">{doc.documentType}</span>
                              {doc.reviewNote && doc.status === 'REJECTED' && (
                                <span className="text-xs text-rose-600">— {doc.reviewNote}</span>
                              )}
                            </div>
                            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusCls)}>
                              {statusLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── Offer & CAS Status ────────────────────────────── */}
                  {(selectedAppOffer || ['OFFER', 'CAS', 'VISA', 'PRE_DEPARTURE', 'ENROLLED'].includes(mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage)) && (
                    <div className="rounded-2xl border border-border bg-white p-5">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-alo-black">
                        <Icon name="Award" className="size-4 text-alo-blue" />
                        Offer & CAS Status
                      </h3>
                      {selectedAppOffer ? (
                        <div className="space-y-3">
                          <MetricRow
                            label="Offer Type"
                            value={selectedAppOffer.offerType?.replace(/_/g, ' ') || '—'}
                          />
                          <MetricRow
                            label="Status"
                            value={
                              <StatusBadge
                                status={selectedAppOffer.status || 'PENDING'}
                                colorMap={{
                                  ACCEPTED: 'bg-emerald-50 text-emerald-600',
                                  PENDING_RESPONSE: 'bg-amber-50 text-amber-600',
                                  CONDITIONAL: 'bg-violet-50 text-violet-600',
                                  UNCONDITIONAL: 'bg-emerald-50 text-emerald-600',
                                  REJECTED: 'bg-rose-50 text-rose-600',
                                  PENDING: 'bg-amber-50 text-amber-600',
                                  ISSUED: 'bg-emerald-50 text-emerald-600',
                                }}
                                labels={{
                                  ACCEPTED: 'Accepted',
                                  PENDING_RESPONSE: 'Pending Response',
                                  CONDITIONAL: 'Conditional',
                                  UNCONDITIONAL: 'Unconditional',
                                  REJECTED: 'Rejected',
                                  PENDING: 'Pending',
                                  ISSUED: 'Issued',
                                }}
                              />
                            }
                          />
                          {selectedAppOffer.issuedAt && (
                            <MetricRow label="Issued" value={fmtDate(selectedAppOffer.issuedAt)} />
                          )}
                          {selectedAppOffer.casNumber && (
                            <div className="rounded-xl bg-emerald-50 p-3">
                              <p className="text-xs font-medium text-emerald-700">CAS Number</p>
                              <p className="font-mono text-sm font-bold text-emerald-800">{selectedAppOffer.casNumber}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl bg-alo-gray-light/50 p-4">
                          <Icon name="Clock" className="size-5 text-alo-gray" />
                          <div>
                            <p className="text-sm font-medium text-alo-gray">No offer yet</p>
                            <p className="text-xs text-alo-gray">Offer details will appear here once received</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Visa Status ────────────────────────────────────── */}
                  {(selectedAppVisa || ['VISA', 'PRE_DEPARTURE', 'ENROLLED'].includes(mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage)) && (
                    <div className="rounded-2xl border border-border bg-white p-5">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-alo-black">
                        <Icon name="Plane" className="size-4 text-alo-blue" />
                        Visa Status
                      </h3>
                      {selectedAppVisa ? (
                        <div className="space-y-3">
                          <MetricRow
                            label="Visa Type"
                            value={selectedAppVisa.visaType || '—'}
                          />
                          <MetricRow
                            label="Decision"
                            value={
                              <StatusBadge
                                status={selectedAppVisa.decision || 'PENDING'}
                                colorMap={{
                                  APPROVED: 'bg-emerald-50 text-emerald-600',
                                  REJECTED: 'bg-rose-50 text-rose-600',
                                  PENDING: 'bg-amber-50 text-amber-600',
                                  SUBMITTED: 'bg-alo-blue-light text-alo-blue',
                                }}
                                labels={{
                                  APPROVED: 'Approved',
                                  REJECTED: 'Refused',
                                  PENDING: 'Pending',
                                  SUBMITTED: 'Submitted',
                                }}
                              />
                            }
                          />
                          {selectedAppVisa.submittedAt && (
                            <MetricRow label="Submitted" value={fmtDate(selectedAppVisa.submittedAt)} />
                          )}
                          {selectedAppVisa.decisionDate && (
                            <MetricRow label="Decision Date" value={fmtDate(selectedAppVisa.decisionDate)} />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl bg-alo-gray-light/50 p-4">
                          <Icon name="Plane" className="size-5 text-alo-gray" />
                          <div>
                            <p className="text-sm font-medium text-alo-gray">Visa not yet applied</p>
                            <p className="text-xs text-alo-gray">Visa details will appear here once submitted</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Activity Log ───────────────────────────────────── */}
                  <div className="rounded-2xl border border-border bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-alo-black">
                      <Icon name="Activity" className="size-4 text-alo-blue" />
                      Recent Activity
                    </h3>
                    <div className="max-h-64 space-y-3 overflow-y-auto alo-scroll">
                      {activityLog.map((log) => (
                        <div key={log.id} className="flex gap-3">
                          <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-alo-blue-light">
                            <Icon
                              name={getActivityIcon(log.action)}
                              className="size-3.5 text-alo-blue"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-alo-black">{log.action}</p>
                            <p className="text-xs text-alo-gray line-clamp-2">{log.details}</p>
                            <div className="mt-1 flex items-center gap-2">
                              {log.userName && (
                                <span className="text-xs font-medium text-alo-blue">{log.userName}</span>
                              )}
                              <span className="text-xs text-alo-gray">{timeAgo(log.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ─── Quick Actions ──────────────────────────────────── */}
                  <div className="rounded-2xl border border-border bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-alo-black">
                      <Icon name="Zap" className="size-4 text-alo-blue" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        className="h-auto flex-col gap-2 rounded-xl bg-alo-blue py-4 text-white hover:bg-alo-blue-dark"
                        onClick={() => setAdvanceDialogOpen(true)}
                      >
                        <ArrowRight className="size-5" />
                        <span className="text-xs font-semibold">Advance Stage</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 rounded-xl border-alo-orange/20 py-4 text-alo-orange hover:bg-alo-orange-light"
                        onClick={() => {}}
                      >
                        <Upload className="size-5" />
                        <span className="text-xs font-semibold">Request Document</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 rounded-xl py-4 text-alo-blue hover:bg-alo-blue-light"
                        onClick={() => {}}
                      >
                        <Send className="size-5" />
                        <span className="text-xs font-semibold">Send Email</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 rounded-xl py-4 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => {}}
                      >
                        <CalendarPlus className="size-5" />
                        <span className="text-xs font-semibold">Schedule Meeting</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* ─── 6. Advance Stage Dialog ─────────────────────────────────── */}
        <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-alo-black">Advance Application Stage</DialogTitle>
              <DialogDescription>
                Move this application to the next stage in the pipeline.
              </DialogDescription>
            </DialogHeader>
            {selectedApp && nextStage && (
              <div className="space-y-4">
                <div className="rounded-xl bg-alo-gray-light/50 p-4">
                  <p className="text-sm text-alo-gray">Student</p>
                  <p className="text-base font-bold text-alo-black">
                    {selectedApp.studentName || selectedApp.student?.fullName}
                  </p>
                  <p className="text-sm text-alo-gray mt-1">{selectedApp.university} — {selectedApp.course}</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-alo-gray-light">
                    <span className={cn('text-xs font-bold', STAGE_COLORS[mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage]?.split(' ')[1])}>
                      {STAGES.indexOf(mapOldStage(selectedApp.stage?.toUpperCase()) || selectedApp.stage) + 1}
                    </span>
                  </div>
                  <Icon name="ArrowRight" className="size-5 text-alo-blue" />
                  <div className="flex size-10 items-center justify-center rounded-full bg-alo-blue text-white">
                    <span className="text-xs font-bold">
                      {STAGES.indexOf(nextStage) + 1}
                    </span>
                  </div>
                  <div className="ml-1">
                    <p className="text-sm font-bold text-alo-black">{STAGE_LABELS[nextStage]}</p>
                    <p className="text-xs text-alo-gray">Next stage</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setAdvanceDialogOpen(false)}
                disabled={advancing}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-alo-blue text-white hover:bg-alo-blue-dark"
                onClick={handleAdvanceStage}
                disabled={advancing || !nextStage}
              >
                {advancing ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Advancing...
                  </span>
                ) : (
                  'Advance to ' + (nextStage ? STAGE_LABELS[nextStage] : '')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function mapOldStage(stage: string): string {
  // Map legacy stages from alo-types to simplified 10-stage pipeline
  const mapping: Record<string, string> = {
    LEAD: 'LEAD',
    COUNSELLING: 'COUNSELLING',
    COUNSELING: 'COUNSELLING',
    ELIGIBILITY_CHECKED: 'COUNSELLING',
    SHORTLIST: 'SHORTLIST',
    UNIVERSITY_SHORTLISTED: 'SHORTLIST',
    APPLICATION: 'APPLICATION',
    APPLICATION_PREPARING: 'APPLICATION',
    DOCUMENTS_PENDING: 'APPLICATION',
    DOCUMENTS_RECEIVED: 'APPLICATION',
    SUBMITTED: 'SUBMITTED',
    APPLICATION_SUBMITTED: 'SUBMITTED',
    OFFER: 'OFFER',
    CONDITIONAL_OFFFER: 'OFFER',
    UNCONDITIONAL_OFFER: 'OFFER',
    DEPOSIT_PENDING: 'OFFER',
    CAS: 'CAS',
    CAS_PENDING: 'CAS',
    CAS_INTERVIEW: 'CAS',
    CAS_ISSUED: 'CAS',
    VISA: 'VISA',
    VISA_DOCUMENTS: 'VISA',
    VISA_SUBMITTED: 'VISA',
    VISA_DECISION_PENDING: 'VISA',
    VISA_APPROVED: 'VISA',
    VISA_REFUSED: 'VISA',
    PRE_DEPARTURE: 'PRE_DEPARTURE',
    ENROLLED: 'ENROLLED',
  };
  return mapping[stage] || stage;
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getActivityIcon(action: string): string {
  const icons: Record<string, string> = {
    'Stage Advanced': 'GitBranch',
    'Document Verified': 'FileCheck',
    'Document Rejected': 'FileX',
    'Document Uploaded': 'FileUp',
    'Offer Received': 'Award',
    'Comment Added': 'MessageSquare',
    'Application Created': 'FileText',
    'Visa Submitted': 'Plane',
    'CAS Issued': 'Shield',
    'Status Changed': 'RefreshCw',
  };
  return icons[action] || 'Activity';
}
