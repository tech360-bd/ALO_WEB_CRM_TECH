'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, Plus, Eye, Edit, Trash2, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  studentId?: string;
  fullName?: string;
  phone?: string;
  preferredCountry?: string;
  preferredSubject?: string;
  journeyStage?: string;
  counselorName?: string;
  status?: string;
  [key: string]: unknown;
}

export default function CrmStudentsPage() {
  const token = usePortalStore(state => state.token);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const loadStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (countryFilter !== 'all') params.set('preferredCountry', countryFilter);
      params.set('limit', '100');
      const res = await fetch(`/api/crm/students?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setStudents(json.data || []);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, countryFilter]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const getStudentStatus = (s: Student) => (s.status || 'active').toLowerCase();

  const filtered = students.filter((s) => {
    const status = getStudentStatus(s);
    return activeTab === 'all' || status === activeTab;
  });

  const counts = {
    all: students.length,
    active: students.filter(s => getStudentStatus(s) === 'active').length,
    inactive: students.filter(s => getStudentStatus(s) === 'inactive').length,
    suspended: students.filter(s => getStudentStatus(s) === 'suspended').length,
  };

  const countries = [...new Set(students.map(s => s.preferredCountry).filter(Boolean))];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Student Management</h1>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-alo-brand hover:bg-alo-brand-light text-white"><Plus className="mr-2 h-4 w-4" />Add Student</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-alo-border">
          <TabsTrigger value="all">All <Badge variant="secondary" className="ml-1">{counts.all}</Badge></TabsTrigger>
          <TabsTrigger value="active">Active <Badge variant="secondary" className="ml-1">{counts.active}</Badge></TabsTrigger>
          <TabsTrigger value="inactive">Inactive <Badge variant="secondary" className="ml-1">{counts.inactive}</Badge></TabsTrigger>
          <TabsTrigger value="suspended">Suspended <Badge variant="secondary" className="ml-1">{counts.suspended}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
                  <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map(c => <SelectItem key={c} value={c || ''}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-alo-border text-left text-alo-text-muted">
                      <th className="pb-3 font-medium">Student ID</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium">Country</th>
                      <th className="pb-3 font-medium">Course</th>
                      <th className="pb-3 font-medium">Stage</th>
                      <th className="pb-3 font-medium">Counselor</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-b border-alo-border/50 hover:bg-[var(--alo-page)]">
                        <td className="py-3 font-mono text-xs text-alo-brand font-medium">{s.studentId || s.id.substring(0, 8)}</td>
                        <td className="py-3 font-medium text-alo-text">{s.fullName}</td>
                        <td className="py-3 text-alo-text-secondary">{s.phone}</td>
                        <td className="py-3 text-alo-text-secondary">{s.preferredCountry}</td>
                        <td className="py-3 text-alo-text-secondary max-w-[160px] truncate">{s.preferredSubject}</td>
                        <td className="py-3 text-alo-text-secondary">{s.journeyStage?.replace(/_/g, ' ')}</td>
                        <td className="py-3 text-alo-text-secondary">{s.counselorName}</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} className="py-8 text-center text-alo-text-muted">No students found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
