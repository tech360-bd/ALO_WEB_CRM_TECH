'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Search, ChevronDown, ChevronUp, Phone, GraduationCap,
  MapPin, Calendar, MessageSquare, FileText, Clock, User,
} from 'lucide-react';

type StudentStatus = 'Active' | 'Application Submitted' | 'Visa Processing' | 'Enrolled' | 'Inactive' | 'Deferred';
type Destination = 'UK' | 'Australia' | 'USA' | 'Canada' | 'New Zealand' | 'Germany';

interface TimelineEntry { date: string; event: string; by: string; };

interface Student {
  id: string; name: string; studentId: string; phone: string;
  destination: Destination; program: string; status: StudentStatus;
  nextFollowUp: string; timeline: TimelineEntry[];
}

const destinations: Destination[] = ['UK', 'Australia', 'USA', 'Canada', 'New Zealand', 'Germany'];

const mockStudents: Student[] = [
  { id: '1', name: 'Rahim Uddin', studentId: 'ALO-STU-2024-0045', phone: '+880 1612-345678', destination: 'UK', program: 'MSc Computer Science', status: 'Active', nextFollowUp: '2025-01-20', timeline: [{ date: '2025-01-15', event: 'Initial counseling session completed', by: 'Sarah Khan' }, { date: '2025-01-12', event: 'Student registered and profile created', by: 'System' }, { date: '2025-01-10', event: 'Lead converted from Facebook campaign', by: 'Marketing' }] },
  { id: '2', name: 'Fatima Akter', studentId: 'ALO-STU-2024-0038', phone: '+880 1812-234567', destination: 'Australia', program: 'MBA International Business', status: 'Application Submitted', nextFollowUp: '2025-01-22', timeline: [{ date: '2025-01-18', event: 'Application submitted to University of Melbourne', by: 'Sarah Khan' }, { date: '2025-01-14', event: 'Documents verified and uploaded', by: 'Doc Team' }] },
  { id: '3', name: 'Tanvir Ahmed', studentId: 'ALO-STU-2024-0052', phone: '+880 1712-987654', destination: 'UK', program: 'BEng Mechanical Engineering', status: 'Visa Processing', nextFollowUp: '2025-01-19', timeline: [{ date: '2025-01-17', event: 'Visa application submitted to UKVI', by: 'Visa Team' }, { date: '2025-01-15', event: 'CAS received from University of Leeds', by: 'App Team' }] },
  { id: '4', name: 'Nusrat Jahan', studentId: 'ALO-STU-2024-0061', phone: '+880 1912-456789', destination: 'USA', program: 'MS Data Science', status: 'Active', nextFollowUp: '2025-01-21', timeline: [{ date: '2025-01-16', event: 'University shortlist shared with student', by: 'Sarah Khan' }, { date: '2025-01-13', event: 'GRE score received: 320', by: 'System' }] },
  { id: '5', name: 'Imran Hossain', studentId: 'ALO-STU-2024-0033', phone: '+880 1512-567890', destination: 'Canada', program: 'Diploma in Business Management', status: 'Enrolled', nextFollowUp: '—', timeline: [{ date: '2025-01-10', event: 'Student enrolled at Seneca College', by: 'System' }, { date: '2025-01-05', event: 'Visa approved', by: 'Visa Team' }] },
  { id: '6', name: 'Sajib Rahman', studentId: 'ALO-STU-2024-0044', phone: '+880 1612-678901', destination: 'UK', program: 'MA Marketing', status: 'Application Submitted', nextFollowUp: '2025-01-23', timeline: [{ date: '2025-01-17', event: 'SOP finalized and submitted', by: 'Sarah Khan' }, { date: '2025-01-14', event: 'IELTS score verified: 7.0', by: 'System' }] },
  { id: '7', name: 'Mita Das', studentId: 'ALO-STU-2024-0070', phone: '+880 1812-789012', destination: 'New Zealand', program: 'Bachelor of Nursing', status: 'Active', nextFollowUp: '2025-01-24', timeline: [{ date: '2025-01-16', event: 'Initial counseling session', by: 'Sarah Khan' }] },
  { id: '8', name: 'Arif Islam', studentId: 'ALO-STU-2024-0028', phone: '+880 1712-890123', destination: 'Germany', program: 'MS Artificial Intelligence', status: 'Deferred', nextFollowUp: '2025-03-01', timeline: [{ date: '2025-01-08', event: 'Student requested deferral to Summer 2025', by: 'Sarah Khan' }] },
  { id: '9', name: 'Taslima Begum', studentId: 'ALO-STU-2024-0055', phone: '+880 1912-901234', destination: 'Australia', program: 'Master of Professional Accounting', status: 'Active', nextFollowUp: '2025-01-20', timeline: [{ date: '2025-01-17', event: 'University options discussed', by: 'Sarah Khan' }] },
  { id: '10', name: 'Rafi Ahmed', studentId: 'ALO-STU-2024-0048', phone: '+880 1512-012345', destination: 'UK', program: 'LLM International Law', status: 'Inactive', nextFollowUp: '—', timeline: [{ date: '2025-01-02', event: 'Student marked inactive — no response for 30 days', by: 'System' }] },
  { id: '11', name: 'Sumaiya Akhter', studentId: 'ALO-STU-2024-0063', phone: '+880 1612-123456', destination: 'Canada', program: 'BSc Computer Science', status: 'Visa Processing', nextFollowUp: '2025-01-25', timeline: [{ date: '2025-01-18', event: 'Biometrics completed', by: 'Visa Team' }, { date: '2025-01-12', event: 'Visa application filed', by: 'Visa Team' }] },
  { id: '12', name: 'Jamil Hossain', studentId: 'ALO-STU-2024-0041', phone: '+880 1812-234567', destination: 'USA', program: 'MBA Finance', status: 'Active', nextFollowUp: '2025-01-21', timeline: [{ date: '2025-01-18', event: 'GMAT prep resources shared', by: 'Sarah Khan' }] },
];

function statusBadge(status: StudentStatus) {
  const m: Record<StudentStatus, 'brand' | 'success' | 'warning' | 'muted' | 'danger' | 'secondary' | 'outline'> = {
    Active: 'brand', 'Application Submitted': 'warning', 'Visa Processing': 'secondary',
    Enrolled: 'success', Inactive: 'muted', Deferred: 'outline',
  };
  return <Badge variant={m[status]} className="text-[11px]">{status}</Badge>;
}

export default function EmployeeStudentsPage() {
  const { setView } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [destFilter, setDestFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>(mockStudents);

  useEffect(() => {
    const token = usePortalStore.getState().token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/employee/students', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.students?.length) {
          setStudents(data.students.map((s: any) => ({
            id: s.id || s._id,
            name: s.name || s.studentName || 'Unknown',
            studentId: s.studentId || s.id,
            phone: s.phone || '',
            destination: s.destination || 'UK',
            program: s.program || '',
            status: s.status || 'Active',
            nextFollowUp: s.nextFollowUp || '—',
            timeline: s.timeline || [],
          })));
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = students;
    if (search) { const q = search.toLowerCase(); list = list.filter((s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)); }
    if (statusFilter !== 'All') list = list.filter((s) => s.status === statusFilter);
    if (destFilter !== 'All') list = list.filter((s) => s.destination === destFilter);
    return list;
  }, [students, search, statusFilter, destFilter]);

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-alo-text">My Students</h1>
        <p className="text-sm text-alo-text-muted mt-1">Students assigned to you for counseling and follow-up</p>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search by name or student ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-alo-page border-alo-border" />
            </div>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-sm rounded-lg border border-alo-border bg-alo-page text-alo-text focus:outline-none focus:ring-2 focus:ring-alo-brand/20">
                <option value="All">All Status</option>
                {['Active', 'Application Submitted', 'Visa Processing', 'Enrolled', 'Inactive', 'Deferred'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={destFilter} onChange={(e) => setDestFilter(e.target.value)}
                className="h-9 px-3 text-sm rounded-lg border border-alo-border bg-alo-page text-alo-text focus:outline-none focus:ring-2 focus:ring-alo-brand/20">
                <option value="All">All Destinations</option>
                {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border border-alo-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-alo-page/50">
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Student ID</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="hidden lg:table-cell">Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Next Follow-up</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => {
                const isExpanded = expandedId === student.id;
                return (
                  <>
                    <TableRow key={student.id} className="cursor-pointer hover:bg-alo-brand-light/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : student.id)}>
                      <TableCell className="w-8 pl-4">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-alo-text-muted" /> : <ChevronDown className="w-4 h-4 text-alo-text-muted" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-alo-brand-light text-alo-brand flex items-center justify-center text-xs font-semibold shrink-0">
                            {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-medium text-alo-text text-sm whitespace-nowrap">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><span className="text-xs font-mono text-alo-text-secondary">{student.studentId}</span></TableCell>
                      <TableCell className="hidden md:table-cell"><span className="text-xs text-alo-text-secondary">{student.phone}</span></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] gap-1"><MapPin className="w-3 h-3" />{student.destination}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell"><span className="text-xs text-alo-text-secondary">{student.program}</span></TableCell>
                      <TableCell>{statusBadge(student.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={cn('text-xs', student.nextFollowUp === '—' ? 'text-alo-text-muted' : 'text-alo-text-secondary')}>{student.nextFollowUp === '—' ? '—' : new Date(student.nextFollowUp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon-sm" onClick={() => { setView('employee-messages'); toast.info('Opening chat with ' + student.name); }}><MessageSquare className="w-4 h-4 text-alo-brand" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => { setView('employee-applications'); toast.info('Viewing applications for ' + student.name); }}><FileText className="w-4 h-4 text-alo-text-muted" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${student.id}-timeline`}>
                        <TableCell colSpan={9} className="bg-alo-page/30 px-6 py-4">
                          <div className="ml-11">
                            <h4 className="text-sm font-semibold text-alo-text mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-alo-brand" /> Activity Timeline</h4>
                            <div className="relative pl-6 space-y-4">
                              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-alo-border" />
                              {student.timeline.map((entry, i) => (
                                <div key={i} className="relative flex gap-3">
                                  <div className={cn('absolute left-[-15px] top-1.5 w-3 h-3 rounded-full border-2 border-white', i === 0 ? 'bg-alo-brand' : 'bg-alo-border')} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-xs font-medium text-alo-text">{entry.event}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-alo-text-muted">
                                      <span>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      <span>by {entry.by}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-4 pt-3 border-t border-alo-border">
                              <Button variant="brand" size="sm" onClick={() => toast.info('Scheduling follow-up for ' + student.name)}><Calendar className="w-3.5 h-3.5" /> Schedule Follow-up</Button>
                              <Button variant="outline" size="sm" onClick={() => { setView('employee-messages'); toast.info('Opening chat with ' + student.name); }}><MessageSquare className="w-3.5 h-3.5" /> Send Message</Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-12 text-center"><GraduationCap className="w-10 h-10 text-alo-text-muted/40 mx-auto mb-2" /><p className="text-sm text-alo-text-secondary">No students found</p><p className="text-xs text-alo-text-muted mt-1">Try adjusting your filters</p></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
