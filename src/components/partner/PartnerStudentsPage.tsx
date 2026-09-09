'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Search, GraduationCap, Plane, Phone, User as UserIcon,
  Clock, Filter, Users, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────── */

type StudentStatus = 'active' | 'enrolled' | 'visa_processing' | 'offer_received' | 'application_submitted' | 'inactive' | 'withdrawn';

interface Student {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  email: string;
  destination: string;
  program: string;
  status: StudentStatus;
  counselor: string;
  lastUpdate: string;
}

/* ── Mock Data ─────────────────────────────────────── */

const mockStudents: Student[] = [
  { id: '1', studentId: 'STU-2025-001', name: 'Arif Rahman', phone: '+880 1712-345678', email: 'arif@mail.com', destination: 'UK', program: 'MSc Data Science', status: 'visa_processing', counselor: 'Sarah Khan', lastUpdate: '2025-01-17' },
  { id: '2', studentId: 'STU-2025-002', name: 'Mitu Sarkar', phone: '+880 1898-123456', email: 'mitu@mail.com', destination: 'USA', program: 'MS Computer Science', status: 'offer_received', counselor: 'Rahim Uddin', lastUpdate: '2025-01-16' },
  { id: '3', studentId: 'STU-2025-003', name: 'Shakib Hasan', phone: '+880 1534-987654', email: 'shakib@mail.com', destination: 'Canada', program: 'MBA', status: 'enrolled', counselor: 'Fatima Akter', lastUpdate: '2025-01-15' },
  { id: '4', studentId: 'STU-2025-004', name: 'Priya Das', phone: '+880 1678-456789', email: 'priya@mail.com', destination: 'UK', program: 'MSc Finance', status: 'enrolled', counselor: 'Sarah Khan', lastUpdate: '2025-01-14' },
  { id: '5', studentId: 'STU-2025-005', name: 'Nayeem Islam', phone: '+880 1345-789012', email: 'nayeem@mail.com', destination: 'Australia', program: 'Diploma IT', status: 'application_submitted', counselor: 'Rahim Uddin', lastUpdate: '2025-01-13' },
  { id: '6', studentId: 'STU-2025-006', name: 'Taslima Akter', phone: '+880 1567-234567', email: 'taslima@mail.com', destination: 'USA', program: 'MS MIS', status: 'active', counselor: 'Fatima Akter', lastUpdate: '2025-01-12' },
  { id: '7', studentId: 'STU-2025-007', name: 'Jamil Hossain', phone: '+880 1890-345678', email: 'jamil@mail.com', destination: 'Canada', program: 'BEng Civil', status: 'inactive', counselor: 'Sarah Khan', lastUpdate: '2025-01-08' },
  { id: '8', studentId: 'STU-2025-008', name: 'Sumaiya Begum', phone: '+880 1711-567890', email: 'sumaiya@mail.com', destination: 'UK', program: 'PhD Biotech', status: 'active', counselor: 'Rahim Uddin', lastUpdate: '2025-01-09' },
  { id: '9', studentId: 'STU-2025-009', name: 'Rafiq Ahmed', phone: '+880 1522-678901', email: 'rafiq@mail.com', destination: 'Australia', program: 'MSc IT', status: 'withdrawn', counselor: 'Fatima Akter', lastUpdate: '2025-01-06' },
  { id: '10', studentId: 'STU-2025-010', name: 'Farzana Mimi', phone: '+880 1833-789012', email: 'farzana@mail.com', destination: 'UK', program: 'MSc Public Health', status: 'offer_received', counselor: 'Sarah Khan', lastUpdate: '2025-01-07' },
];

const statusConfig: Record<StudentStatus, { variant: 'success' | 'brand' | 'warning' | 'outline' | 'secondary' | 'muted' | 'danger'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  enrolled: { variant: 'brand', label: 'Enrolled' },
  visa_processing: { variant: 'warning', label: 'Visa Processing' },
  offer_received: { variant: 'outline', label: 'Offer Received' },
  application_submitted: { variant: 'secondary', label: 'Application Submitted' },
  inactive: { variant: 'muted', label: 'Inactive' },
  withdrawn: { variant: 'danger', label: 'Withdrawn' },
};

/* ── Component ─────────────────────────────────────── */

export default function PartnerStudentsPage() {
  const { user } = usePortalStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [destFilter, setDestFilter] = useState<string>('All');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [studentApps, setStudentApps] = useState<any[]>([]);

  const fetchStudents = useCallback(async (status?: string, dest?: string) => {
    setLoading(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const params = new URLSearchParams({ partnerId: user?.id || '' });
      if (status && status !== 'all') params.set('status', status);
      if (dest && dest !== 'All') params.set('destination', dest);
      const res = await fetch(`/api/partner/students?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setStudents(data.data);
      } else {
        setStudents(mockStudents);
      }
    } catch {
      setStudents(mockStudents);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleExpandStudent = async (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
      setStudentApps([]);
      return;
    }
    setExpandedStudent(studentId);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch(`/api/partner/applications?studentId=${studentId}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setStudentApps(data.applications);
      } else {
        setStudentApps([
          { id: 'app-mock-1', university: 'University of Manchester', program: 'MSc Data Science', stage: 'submitted', updatedAt: '2025-01-17' },
          { id: 'app-mock-2', university: 'University of Birmingham', program: 'MSc Finance', stage: 'offer', updatedAt: '2025-01-10' },
        ]);
      }
    } catch {
      setStudentApps([
        { id: 'app-mock-1', university: 'University of Manchester', program: 'MSc Data Science', stage: 'submitted', updatedAt: '2025-01-17' },
        { id: 'app-mock-2', university: 'University of Birmingham', program: 'MSc Finance', stage: 'offer', updatedAt: '2025-01-10' },
      ]);
    }
  };

  const filtered = students
    .filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (destFilter !== 'All' && s.destination !== destFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.lastUpdate).getTime();
      const db = new Date(b.lastUpdate).getTime();
      return sortDir === 'desc' ? db - da : da - db;
    });

  const statusCounts: Record<string, number> = {
    all: students.length,
    active: students.filter((s) => s.status === 'active').length,
    enrolled: students.filter((s) => s.status === 'enrolled').length,
    visa_processing: students.filter((s) => s.status === 'visa_processing').length,
    offer_received: students.filter((s) => s.status === 'offer_received').length,
    application_submitted: students.filter((s) => s.status === 'application_submitted').length,
  };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">My Students</h1>
          <p className="text-sm text-alo-text-muted mt-0.5">Track all students referred through your agency</p>
        </div>
        <Badge variant="muted" className="text-xs w-fit">{filtered.length} students shown</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-alo-brand" /><span className="text-xs text-alo-text-muted">Total</span></div>
            <p className="text-2xl font-bold text-alo-text">{students.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><GraduationCap className="w-4 h-4 text-emerald-500" /><span className="text-xs text-alo-text-muted">Enrolled</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.enrolled}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Plane className="w-4 h-4 text-amber-500" /><span className="text-xs text-alo-text-muted">Visa Processing</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.visa_processing}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Eye className="w-4 h-4 text-blue-500" /><span className="text-xs text-alo-text-muted">Offers</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.offer_received}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search by name, student ID, or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" />
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); fetchStudents(v, destFilter); }}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="visa_processing">Visa Processing</SelectItem>
                  <SelectItem value="offer_received">Offer Received</SelectItem>
                  <SelectItem value="application_submitted">Application Submitted</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={destFilter} onValueChange={(v) => { setDestFilter(v); fetchStudents(statusFilter, v); }}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['All', 'UK', 'USA', 'Canada', 'Australia', 'New Zealand', 'Germany', 'Ireland'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')} title="Sort by last update">
                <Clock className="w-4 h-4" />
                {sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[120px]">Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="hidden lg:table-cell">Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Counselor</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-alo-text-muted">
                      No students found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((student) => {
                    const cfg = statusConfig[student.status];
                    const isExpanded = expandedStudent === student.id;
                    return (
                      <>
                      <TableRow key={student.id} className={cn('hover:bg-alo-brand-light/20 transition-colors cursor-pointer', isExpanded && 'bg-alo-brand-light/10')}>
                        <TableCell className="font-mono text-xs text-alo-text-muted">
                          <button onClick={() => handleExpandStudent(student.id)} className="flex items-center gap-1">
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {student.studentId}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-alo-text">{student.name}</p>
                            <p className="text-xs text-alo-text-muted md:hidden">{student.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-alo-text-secondary inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {student.phone}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs text-alo-text-secondary">
                            <Plane className="w-3 h-3" /> {student.destination}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-alo-text-secondary">{student.program}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="text-[11px]">{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-alo-text-secondary">{student.counselor}</TableCell>
                        <TableCell className="text-xs text-alo-text-muted">
                          {formatDate(student.lastUpdate)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${student.id}-detail`}>
                          <TableCell colSpan={8} className="bg-alo-brand-light/5 px-8 py-4">
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-alo-text">Application History</p>
                              {studentApps.length === 0 ? (
                                <p className="text-xs text-alo-text-muted">No applications found.</p>
                              ) : (
                                <div className="space-y-2">
                                  {studentApps.map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white border border-alo-border">
                                      <div>
                                        <p className="text-sm font-medium text-alo-text">{app.university}</p>
                                        <p className="text-xs text-alo-text-muted">{app.program}</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Badge variant={app.stage === 'enrolled' ? 'success' : app.stage === 'offer' ? 'warning' : app.stage === 'visa' ? 'brand' : 'outline'} className="text-[11px]">
                                          {app.stage || app.status}
                                        </Badge>
                                        <span className="text-[11px] text-alo-text-muted">{app.updatedAt ? formatDate(app.updatedAt) : ''}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-alo-text-muted text-center">
        Showing {filtered.length} of {students.length} students
      </p>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────── */

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
