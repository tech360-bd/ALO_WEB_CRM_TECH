'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Search, Clock, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const typeColors: Record<string, string> = { counseling: 'bg-blue-100 text-blue-700', 'application_review': 'bg-green-100 text-green-700', 'visa_prep': 'bg-amber-100 text-amber-700', 'document_review': 'bg-purple-100 text-purple-700', 'internal_meeting': 'bg-gray-100 text-gray-700' };
const statusBadge: Record<string, string> = { scheduled: 'bg-blue-50 text-blue-700 border-blue-200', completed: 'bg-green-50 text-green-700 border-green-200', cancelled: 'bg-gray-50 text-gray-600 border-gray-200', 'no_show': 'bg-red-50 text-red-700 border-red-200' };

interface Appointment {
  id: string;
  studentId: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  notes: string;
  meetLink: string;
  [key: string]: unknown;
}

export default function CrmAppointmentsPage() {
  const token = usePortalStore(state => state.token);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApt, setSelectedApt] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '100');
      const res = await fetch(`/api/crm/appointments?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json.appointments || json.items || [];
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, typeFilter]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const filtered = useMemo(() => appointments.filter(a => {
    const matchSearch = !search || (a.title || '').toLowerCase().includes(search.toLowerCase()) || (a.studentId || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || (a.type || '').toLowerCase() === typeFilter;
    const matchStatus = !statusFilter || (a.status || '').toLowerCase() === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [appointments, search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      today: appointments.filter(a => a.scheduledAt && a.scheduledAt.startsWith(today) && a.status === 'scheduled').length,
      upcoming: appointments.filter(a => a.scheduledAt && new Date(a.scheduledAt) >= new Date() && a.status === 'scheduled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      total: appointments.length,
    };
  }, [appointments]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/crm/appointments', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500">Manage counselling sessions, reviews, and meetings</p>
        </div>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-alo-brand hover:bg-alo-brand-light text-white"><Plus className="w-4 h-4 mr-2" />New Appointment</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Today</span></div><p className="text-2xl font-bold">{stats.today}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-gray-500">Upcoming</span></div><p className="text-2xl font-bold">{stats.upcoming}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Completed</span></div><p className="text-2xl font-bold">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-500">Total</span></div><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search appointments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="counseling">Counselling</option>
          <option value="application_review">Application Review</option>
          <option value="visa_prep">Visa Prep</option>
          <option value="document_review">Document Review</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-gray-400">No appointments found</Card>
        ) : filtered.map(apt => (
          <Card key={apt.id} className={`cursor-pointer transition-shadow hover:shadow-md ${selectedApt === apt.id ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setSelectedApt(selectedApt === apt.id ? null : apt.id)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={typeColors[(apt.type || '').toLowerCase()] || 'bg-gray-100 text-gray-700'}>{apt.type || 'General'}</Badge>
                    <Badge className={statusBadge[(apt.status || '').toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200'}>{apt.status || 'Scheduled'}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{apt.title || 'Untitled Appointment'}</h3>
                  <p className="text-sm text-gray-500 mt-1">Student: {apt.studentId || 'N/A'}</p>
                  {apt.notes && <p className="text-xs text-gray-400 mt-1">{apt.notes}</p>}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleString() : 'TBD'}
                </div>
              </div>
              {selectedApt === apt.id && (
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {(apt.status || '') !== 'completed' && <Button size="sm" onClick={() => updateStatus(apt.id, 'completed')} className="text-green-600"><CheckCircle className="w-4 h-4 mr-1" />Complete</Button>}
                  {(apt.status || '') !== 'cancelled' && <Button size="sm" onClick={() => updateStatus(apt.id, 'cancelled')} variant="ghost" className="text-gray-500"><XCircle className="w-4 h-4 mr-1" />Cancel</Button>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
