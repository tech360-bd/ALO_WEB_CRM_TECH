'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Search, FileText, Building2, Plane, ChevronRight,
  Filter, Clock, ArrowRight, Briefcase, GraduationCap,
} from 'lucide-react';

/* ── Pipeline Stages ─────────────────────────────── */

const PIPELINE_STAGES = [
  { key: 'all', label: 'All', icon: Briefcase },
  { key: 'new', label: 'New', icon: FileText },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'submitted', label: 'Submitted', icon: ArrowRight },
  { key: 'offer', label: 'Offer', icon: Briefcase },
  { key: 'visa', label: 'Visa', icon: Plane },
  { key: 'enrolled', label: 'Enrolled', icon: GraduationCap },
] as const;

type AppStage = 'new' | 'documents' | 'submitted' | 'offer' | 'visa' | 'enrolled';

interface Application {
  id: string;
  appId: string;
  studentName: string;
  studentId: string;
  university: string;
  course: string;
  destination: string;
  stage: AppStage;
  lastUpdate: string;
  submittedDate: string;
}

/* ── Mock Data ─────────────────────────────────────── */

const mockApplications: Application[] = [
  { id: '1', appId: 'APP-2025-001', studentName: 'Arif Rahman', studentId: 'STU-001', university: 'University of Manchester', course: 'MSc Data Science', destination: 'UK', stage: 'visa', lastUpdate: '2025-01-17', submittedDate: '2025-01-05' },
  { id: '2', appId: 'APP-2025-002', studentName: 'Mitu Sarkar', studentId: 'STU-002', university: 'NYU', course: 'MS Computer Science', destination: 'USA', stage: 'offer', lastUpdate: '2025-01-16', submittedDate: '2024-12-20' },
  { id: '3', appId: 'APP-2025-003', studentName: 'Shakib Hasan', studentId: 'STU-003', university: 'University of Toronto', course: 'MBA', destination: 'Canada', stage: 'enrolled', lastUpdate: '2025-01-15', submittedDate: '2024-11-10' },
  { id: '4', appId: 'APP-2025-004', studentName: 'Priya Das', studentId: 'STU-004', university: 'University of Birmingham', course: 'MSc Finance', destination: 'UK', stage: 'enrolled', lastUpdate: '2025-01-14', submittedDate: '2024-10-15' },
  { id: '5', appId: 'APP-2025-005', studentName: 'Nayeem Islam', studentId: 'STU-005', university: 'RMIT University', course: 'Diploma IT', destination: 'Australia', stage: 'submitted', lastUpdate: '2025-01-13', submittedDate: '2025-01-10' },
  { id: '6', appId: 'APP-2025-006', studentName: 'Taslima Akter', studentId: 'STU-006', university: 'Boston University', course: 'MS MIS', destination: 'USA', stage: 'documents', lastUpdate: '2025-01-12', submittedDate: '2025-01-08' },
  { id: '7', appId: 'APP-2025-007', studentName: 'Farzana Mimi', studentId: 'STU-008', university: 'University of Leeds', course: 'MSc Public Health', destination: 'UK', stage: 'offer', lastUpdate: '2025-01-07', submittedDate: '2024-12-01' },
  { id: '8', appId: 'APP-2025-008', studentName: 'Sumaiya Begum', studentId: 'STU-007', university: 'University of Cambridge', course: 'PhD Biotech', destination: 'UK', stage: 'submitted', lastUpdate: '2025-01-09', submittedDate: '2025-01-06' },
  { id: '9', appId: 'APP-2025-009', studentName: 'Rafiq Ahmed', studentId: 'STU-009', university: 'Monash University', course: 'MSc IT', destination: 'Australia', stage: 'new', lastUpdate: '2025-01-06', submittedDate: '' },
  { id: '10', appId: 'APP-2025-010', studentName: 'Jamil Hossain', studentId: 'STU-010', university: 'UBC', course: 'BEng Civil', destination: 'Canada', stage: 'new', lastUpdate: '2025-01-08', submittedDate: '' },
];

const stageConfig: Record<AppStage, { variant: 'brand' | 'success' | 'warning' | 'outline' | 'secondary' | 'muted'; label: string; color: string }> = {
  new: { variant: 'secondary', label: 'New', color: 'bg-slate-200 text-slate-700' },
  documents: { variant: 'outline', label: 'Documents', color: 'bg-blue-100 text-blue-700' },
  submitted: { variant: 'brand', label: 'Submitted', color: 'bg-sky-100 text-sky-700' },
  offer: { variant: 'warning', label: 'Offer', color: 'bg-amber-100 text-amber-700' },
  visa: { variant: 'outline', label: 'Visa', color: 'bg-purple-100 text-purple-700' },
  enrolled: { variant: 'success', label: 'Enrolled', color: 'bg-emerald-100 text-emerald-700' },
};

/* ── Component ─────────────────────────────────────── */

export default function PartnerApplicationsPage() {
  const { user } = usePortalStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/applications?partnerId=${user?.id || ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setApplications(data.data);
      } else {
        setApplications(mockApplications);
      }
    } catch {
      setApplications(mockApplications);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const filtered = applications.filter((app) => {
    if (stageFilter !== 'all' && app.stage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return app.studentName.toLowerCase().includes(q) || app.appId.toLowerCase().includes(q) || app.university.toLowerCase().includes(q);
    }
    return true;
  });

  const stageCounts = {
    all: applications.length,
    new: applications.filter((a) => a.stage === 'new').length,
    documents: applications.filter((a) => a.stage === 'documents').length,
    submitted: applications.filter((a) => a.stage === 'submitted').length,
    offer: applications.filter((a) => a.stage === 'offer').length,
    visa: applications.filter((a) => a.stage === 'visa').length,
    enrolled: applications.filter((a) => a.stage === 'enrolled').length,
  };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Application Tracker</h1>
          <p className="text-sm text-alo-text-muted mt-0.5">Track application progress across all stages</p>
        </div>
        <Badge variant="muted" className="text-xs w-fit">{filtered.length} applications</Badge>
      </div>

      {/* Pipeline Overview */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {PIPELINE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const count = stageCounts[stage.key as keyof typeof stageCounts] || 0;
              const isActive = stageFilter === stage.key;
              return (
                <div key={stage.key} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="w-4 h-4 text-alo-border shrink-0" />}
                  <button
                    onClick={() => setStageFilter(stage.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border',
                      isActive
                        ? 'bg-alo-brand text-white border-alo-brand shadow-sm'
                        : 'bg-white text-alo-text-secondary border-alo-border hover:border-alo-brand hover:text-alo-brand'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {stage.label}
                    <span className={cn(
                      'text-[11px] px-1.5 py-0.5 rounded-full font-semibold',
                      isActive ? 'bg-white/20 text-white' : 'bg-secondary text-alo-text-muted'
                    )}>
                      {count}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search by student, application ID, or university..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStageFilter('all'); setSearch(''); }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Table */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[120px]">App ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">University</TableHead>
                  <TableHead className="hidden lg:table-cell">Course</TableHead>
                  <TableHead className="hidden sm:table-cell">Destination</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-alo-text-muted">
                      No applications found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((app) => {
                    const cfg = stageConfig[app.stage];
                    return (
                      <TableRow key={app.id} className="hover:bg-alo-brand-light/20 transition-colors">
                        <TableCell className="font-mono text-xs text-alo-text-muted">{app.appId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-alo-text">{app.studentName}</p>
                            <p className="text-xs text-alo-text-muted">{app.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-sm text-alo-text-secondary">
                            <Building2 className="w-3.5 h-3.5 text-alo-text-muted" />
                            {app.university}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-alo-text-secondary">{app.course}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-alo-text-secondary">
                            <Plane className="w-3 h-3" /> {app.destination}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="text-[11px]">
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-alo-text-muted">
                            <Clock className="w-3 h-3" />
                            {formatDate(app.lastUpdate)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-alo-text-muted text-center">
        Showing {filtered.length} of {applications.length} applications
      </p>
    </div>
  );
}

/* ── Helper ────────────────────────────────────────── */

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
