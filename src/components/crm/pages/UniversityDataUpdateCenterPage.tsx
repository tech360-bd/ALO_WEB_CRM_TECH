'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, CheckCircle2, XCircle, Globe, RefreshCw, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PROPOSAL_STATUS_LABELS } from '@/lib/course-finder/catalog-change-status';

export default function UniversityDataUpdateCenterPage() {
  const { token } = usePortalStore();
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(false);

  const loadUpdates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/university-updates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setUpdates(json.updates || []);
      }
    } catch (err) {
      console.error('Failed to load university updates:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const handleRunWeeklyAiAgent = async () => {
    setRunningAgent(true);
    try {
      const res = await fetch('/api/cron/weekly-ai-agent', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        loadUpdates();
      } else {
        toast.error(json.error || 'Weekly AI agent scan failed');
      }
    } catch (err) {
      toast.error('Weekly AI agent scan failed');
    } finally {
      setRunningAgent(false);
    }
  };

  const handleApproveUpdate = async (requestId: string) => {
    try {
      const res = await fetch('/api/admin/university-updates', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action: 'approve' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        loadUpdates();
      } else {
        toast.error(json.error || 'Approval failed');
      }
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const handleRejectUpdate = async (requestId: string) => {
    try {
      const res = await fetch('/api/admin/university-updates', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action: 'reject' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        loadUpdates();
      } else {
        toast.error(json.error || 'Rejection failed');
      }
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  return (
    <div className="space-y-6 bg-[var(--alo-page)]/50 min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-[var(--alo-border)] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[var(--alo-text)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            University &amp; Course Data Update Center (Weekly AI Agent)
          </h1>
          <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">
            Weekly AI Agent scans official university websites, detects tuition/intake/deadline changes, and submits update requests for Super Admin approval.
          </p>
        </div>

        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
          onClick={handleRunWeeklyAiAgent}
          disabled={runningAgent}
        >
          {runningAgent ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Run Weekly AI Agent Scan Now
        </Button>
      </div>

      {/* Pending Update Requests Table */}
      <Card className="bg-white border-[var(--alo-border)] shadow-xs">
        <CardHeader className="pb-3 border-b border-[var(--alo-border)]">
          <CardTitle className="text-sm font-bold text-[var(--alo-text)]">Pending University Data Update Requests</CardTitle>
          <CardDescription className="text-xs text-[var(--alo-text-muted)]">Review old vs new values here. Approving changes nothing live; a Super Admin applies approved changes at <a className="underline" href="/admin/change-approval">/admin/change-approval</a>, and approval never marks a record verified.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[var(--alo-page)]">
              <TableRow>
                <TableHead className="text-xs font-semibold">Entity / Course</TableHead>
                <TableHead className="text-xs font-semibold">Country</TableHead>
                <TableHead className="text-xs font-semibold">Field Name</TableHead>
                <TableHead className="text-xs font-semibold">Old Value</TableHead>
                <TableHead className="text-xs font-semibold">New Value</TableHead>
                <TableHead className="text-xs font-semibold">Confidence / Source</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-[var(--alo-text-muted)]">
                    No pending university data update requests. Click &quot;Run Weekly AI Agent Scan Now&quot; to trigger a website scan.
                  </TableCell>
                </TableRow>
              ) : (
                updates.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <span className="text-xs font-bold text-[var(--alo-text)] block">{u.entityName}</span>
                        <span className="text-[11px] text-[var(--alo-text-muted)]">Type: {u.entityType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-[var(--alo-body)]">{u.country}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[11px] font-mono">{u.fieldName}</Badge></TableCell>
                    <TableCell className="text-xs text-[var(--alo-text-muted)] line-through">{u.oldValue}</TableCell>
                    <TableCell className="text-xs font-bold text-indigo-600">{u.newValue}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-emerald-50 text-emerald-700 text-[11px]">
                          {Math.round(u.aiConfidence * 100)}% Match
                        </Badge>
                        {u.evidenceUrl && (
                          <a href={u.evidenceUrl} target="_blank" rel="noreferrer" className="text-[var(--alo-text-muted)] hover:text-indigo-600">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {['pending_approval', 'pending', 'apply_failed', 'approved'].includes(u.status) || (u.status === 'reviewed_unverified' && u.approvalFingerprint && u.approvalFingerprint !== 'valid') ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApproveUpdate(u.id)}>
                            {u.status === 'pending_approval' || u.status === 'pending' ? 'Approve (not applied)' : 'Re-approve'}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200" onClick={() => handleRejectUpdate(u.id)}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Badge className={`text-[11px] ${u.status === 'applied' || u.status === 'reviewed_unverified' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {PROPOSAL_STATUS_LABELS[u.status] ?? u.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
