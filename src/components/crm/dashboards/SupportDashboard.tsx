'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MessageSquare, Clock, UserX, UserCheck, Bot, AlertTriangle,
  ArrowUpRight, ChevronRight, Phone, Search, Sparkles,
  Send, Loader2,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  MessageSquare, Clock, UserX, UserCheck, Bot, AlertTriangle
};

export default function SupportDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/support/dashboard', {
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

  const { inboxPreview = [], activeThreads = [], escalatedChats = [], unknownContacts = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Support Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><MessageSquare className="w-3 h-3 mr-1" />Support Agent</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Search className="w-4 h-4" /> Search Inbox</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Send className="w-4 h-4" /> Open Inbox</Button>
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

      {/* AI vs Human Split */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" /> AI vs Human Response Split (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="relative h-10 rounded-lg overflow-hidden bg-[var(--alo-surface-muted)]">
                <div className="h-full bg-purple-500 rounded-l-lg flex items-center pl-4" style={{ width: '62%' }}>
                  <span className="text-xs font-bold text-white">AI: 62%</span>
                </div>
                <div className="absolute right-0 top-0 h-full bg-alo-brand rounded-r-lg flex items-center justify-end pr-4" style={{ width: '38%' }}>
                  <span className="text-xs font-bold text-white">Human: 38%</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-alo-text-muted">Avg response time</p>
              <p className="text-sm font-semibold text-alo-text">AI: 12s · Human: 4.2m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* WhatsApp/Support Inbox Preview */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-alo-brand" /> Inbox Preview
                </CardTitle>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-xs text-alo-brand">Open Full Inbox <ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {inboxPreview.map((m) => (
                  <div key={m.contact} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${m.unread ? 'bg-alo-brand' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-alo-text truncate">{m.contact}</p>
                          <Badge variant="muted" className="text-[11px]">{m.channel}</Badge>
                          {m.matched ? (
                            <UserCheck className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <UserX className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-alo-text-muted truncate">{m.lastMsg}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-alo-text-muted shrink-0 ml-2">{m.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* SLA Timer for Active Threads */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-alo-brand" /> Active SLA Timers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeThreads.map((t) => (
                  <div key={t.student} className="p-2.5 rounded-lg border border-alo-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-alo-text">{t.student}</p>
                      <Badge variant={t.agent === 'Bot' ? 'muted' : 'brand'} className="text-[11px]">{t.agent}</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{t.topic}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress value={parseInt(t.remaining)} className="h-1.5 flex-1" />
                      <span className="text-[11px] text-alo-text-secondary">{t.sla}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Escalated Chats */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Escalated Chats
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">{escalatedChats.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {escalatedChats.slice(0, 4).map((e) => (
                  <div key={e.contact} className={`p-2.5 rounded-lg border ${e.priority === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-alo-text">{e.contact}</p>
                      <Badge variant={e.priority === 'high' ? 'danger' : 'warning'} className="text-[11px] shrink-0 ml-1">{e.priority}</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{e.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unknown Contacts */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-500" /> Unknown Contacts
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">{unknownContacts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {unknownContacts.map((c) => (
                  <div key={c.phone} className="flex items-center justify-between p-2.5 rounded-lg border border-amber-200 bg-amber-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-alo-text">{c.phone}</p>
                      <p className="text-[11px] text-alo-text-muted truncate">{c.lastMsg} · {c.msgCount} msgs</p>
                    </div>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-[11px] text-alo-brand shrink-0 ml-1">Match</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}