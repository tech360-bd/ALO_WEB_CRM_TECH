'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Upload, Clock, XCircle, AlertTriangle, FileX, Calendar,
  ArrowUpRight, ChevronRight, CheckCircle2, Eye, Search,
  RotateCcw, Loader2,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Upload, Clock, XCircle, AlertTriangle, FileX, Calendar
};

function DocStatusBadge({ status }: { status: string }) {
  if (status === 'in_review') return <Badge variant="warning" className="text-[11px]">In Review</Badge>;
  return <Badge variant="danger" className="text-[11px]">Pending</Badge>;
}

export default function DocumentReviewDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/documents/dashboard', {
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

  const { reviewQueue = [], rejectedDocs = [], expiredDocs = [], deadlineAlerts = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Document Review Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><Search className="w-3 h-3 mr-1" />Document Officer</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Eye className="w-4 h-4" /> Review Queue</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Upload className="w-4 h-4" /> Bulk Upload</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-5 h-5 text-alo-brand" />
                <span className={`inline-flex items-center text-[11px] font-medium ${kpi.up ? 'text-crm-success-text' : 'text-crm-danger-text'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90 text-crm-danger-text" />}{kpi.change}
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
          {/* Document Review Queue */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Clock className="w-4 h-4 text-alo-brand" /> Document Review Queue
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">{reviewQueue.length} documents</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Student</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Document Type</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Status</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Uploaded</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Reviewer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewQueue.map((d) => (
                      <TableRow key={d.student + d.docType}>
                        <TableCell className="text-sm font-medium text-alo-text">{d.student}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{d.docType}</TableCell>
                        <TableCell><DocStatusBadge status={d.status} /></TableCell>
                        <TableCell className="text-sm text-alo-text-muted">{d.uploaded}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{d.reviewer}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Rejected Documents */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-crm-danger-text" /> Rejected Documents
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">{rejectedDocs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {rejectedDocs.map((d) => (
                  <div key={d.student} className="p-2.5 rounded-lg border border-crm-danger-border bg-crm-danger-bg">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-alo-text truncate">{d.student}</p>
                      <Badge variant="danger" className="text-[11px] shrink-0 ml-1">{d.doc}</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{d.reason}</p>
                    <p className="text-[11px] text-alo-text-muted mt-0.5">Rejected: {d.rejected}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expired Documents */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-crm-warning-text" /> Expired Documents
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">{expiredDocs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {expiredDocs.map((d) => (
                  <div key={d.student + d.doc} className="p-2.5 rounded-lg border border-crm-warning-border bg-crm-warning-bg">
                    <p className="text-sm font-medium text-alo-text">{d.student} — {d.doc}</p>
                    <p className="text-[11px] text-alo-text-muted">Expired: {d.expired}</p>
                    <p className="text-[11px] text-crm-danger-text mt-0.5">{d.action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deadline Alerts */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-crm-danger-text" /> Deadline Alerts
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">{deadlineAlerts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deadlineAlerts.map((d) => (
                  <div key={d.student + d.doc} className="p-2.5 rounded-lg border border-crm-danger-border bg-crm-danger-bg">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-alo-text truncate">{d.student}</p>
                      <Badge variant="danger" className="text-[11px] shrink-0 ml-1">{d.daysLeft}d</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{d.university} — {d.doc}</p>
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