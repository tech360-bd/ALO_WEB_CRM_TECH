'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, UserPlus, MessageSquare, Clock, Phone,
  ArrowUpRight, Users, DoorOpen, AlertTriangle,
  Plus, ChevronRight, Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Calendar, DoorOpen, UserPlus, Clock, Phone, MessageSquare
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
    confirmed: 'success',
    waiting: 'warning',
    pending: 'muted',
    cancelled: 'danger',
  };
  return <Badge variant={map[status] || 'muted'} className="text-[10px]">{status}</Badge>;
}

function AvailDot({ status }: { status: string }) {
  const colors: Record<string, string> = { available: 'bg-emerald-500', busy: 'bg-red-500', lunch: 'bg-amber-500' };
  return <span className={`w-2 h-2 rounded-full ${colors[status] || 'bg-gray-400'}`} />;
}

export default function FrontDeskDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/frontdesk/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-alo-brand" /></div>;
  }

  const { appointments = [], walkIns = [], counselorAvailability = [], visitorLog = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Front Desk Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><Calendar className="w-3 h-3 mr-1" />Front Desk</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Phone className="w-4 h-4" /> Log Call</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Plus className="w-4 h-4" /> New Walk-in</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-5 h-5 text-alo-brand" />
                <span className={`inline-flex items-center text-[11px] font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90 text-red-600" />}{kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
              <p className="text-xs text-alo-text-muted mt-0.5">{kpi.label}</p>
              <p className="text-[11px] text-alo-text-muted">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Appointment Schedule */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-alo-brand" /> Today&apos;s Appointment Schedule
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">{appointments.length} appointments</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {appointments.map((a) => (
                  <div key={a.time + a.student} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-semibold text-alo-text-secondary w-16 shrink-0">{a.time}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-alo-text truncate">{a.student}</p>
                        <p className="text-[11px] text-alo-text-muted">{a.purpose} · {a.counselor}</p>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Walk-in Log */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-alo-brand" /> Walk-in Log
                </CardTitle>
                <Badge variant="brand" className="text-[11px]">{walkIns.length} today</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {walkIns.map((w) => (
                  <div key={w.time + w.name} className={`flex items-center justify-between p-3 rounded-lg border ${w.assigned ? 'border-alo-border' : 'border-amber-200 bg-amber-50'}`}>
                    <div>
                      <p className="text-sm font-medium text-alo-text">{w.name}</p>
                      <p className="text-[11px] text-alo-text-muted">{w.time} · {w.interest}</p>
                    </div>
                    {w.assigned ? (
                      <Badge variant="muted" className="text-[10px]">{w.assigned}</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">Unassigned</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Counselor Availability */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Users className="w-4 h-4 text-alo-brand" /> Counselor Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {counselorAvailability.map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <AvailDot status={c.status} />
                      <p className="text-sm font-medium text-alo-text">{c.name}</p>
                    </div>
                    <span className="text-[11px] text-alo-text-muted capitalize">{c.status} · {c.nextSlot}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visitor Log */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-alo-brand" /> Visitor Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {visitorLog.map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-alo-brand-light/20 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-alo-text">{v.visitor}</p>
                      <p className="text-[11px] text-alo-text-muted">{v.time} · {v.type}</p>
                    </div>
                    <Badge variant={v.status === 'In Session' ? 'success' : 'warning'} className="text-[10px]">{v.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start text-sm"><Plus className="w-4 h-4" /> Log New Inquiry</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start text-sm"><Phone className="w-4 h-4" /> Log Missed Call</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" className="w-full justify-start text-sm"><Calendar className="w-4 h-4" /> Book Appointment</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}