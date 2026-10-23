'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck, RefreshCw, Check, X, Edit3, ExternalLink, Play,
  CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface UpdateRequest {
  id: string;
  universityId: string;
  courseId: string;
  entityType: string;
  entityName: string;
  country: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  evidenceUrl: string;
  aiConfidence: number;
  status: string;
  createdAt: string;
}

export default function UniversityUpdatesCenter() {
  const token = usePortalStore(state => state.token);
  const [updates, setUpdates] = useState<UpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/university-data/updates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUpdates(json.updates || []);
      } else {
        const json = await res.json();
        setMessage({ type: 'error', text: json.error || 'Unable to load proposals' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const handleRunScan = async () => {
    setScanning(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/university-data/run-scan', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: `Scan complete: Checked ${data.universitiesChecked || 0} universities, ${data.coursesChecked || 0} courses. Found ${data.changesFound || 0} potential changes.`
        });
        fetchUpdates();
      } else {
        setMessage({ type: 'error', text: data.error || 'Scan failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setScanning(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/university-data/updates/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Proposal reviewed, not verified or published. Official field evidence is still required.' });
        fetchUpdates();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/university-data/updates/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Update published to live Course Finder and catalog!' });
        fetchUpdates();
      } else {
        const json = await res.json();
        setMessage({ type: 'error', text: json.error || 'Action unavailable' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/university-data/updates/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Update rejected.' });
        fetchUpdates();
      } else {
        const json = await res.json();
        setMessage({ type: 'error', text: json.error || 'Action unavailable' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-text)] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-cta)] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Weekly AI University Update Center</h1>
              <p className="text-[var(--alo-text-muted)] text-sm">Human proposal review — official verification and publication remain required</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunScan}
            disabled={scanning}
            className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white flex items-center gap-2"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Run On-Demand Scan</span>
          </Button>
          <Button onClick={fetchUpdates} variant="outline" className="border-white/10 text-[var(--alo-placeholder)] hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* AI Safeguards Banner */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
        </div>
        <div className="text-xs text-blue-200">
          <p className="font-semibold text-white text-sm">Human-in-the-Loop AI Architecture Active</p>
          <p className="mt-0.5">This queue contains unverified proposals. Legacy scan and publication actions are unavailable until official field-level evidence and versioned publication are implemented.</p>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10">
          <CardTitle className="text-base font-semibold">Review Queue ({updates.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[var(--alo-text-muted)] bg-white/5">
                  <th className="p-3 font-medium">Entity & Country</th>
                  <th className="p-3 font-medium">Field</th>
                  <th className="p-3 font-medium">Current Database</th>
                  <th className="p-3 font-medium">Detected Value</th>
                  <th className="p-3 font-medium">AI Confidence</th>
                  <th className="p-3 font-medium">Evidence Source</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {updates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[var(--alo-text-muted)]">
                      No pending update requests. The weekly scanner runs every Sunday at 02:00 BST.
                    </td>
                  </tr>
                ) : (
                  updates.map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold text-white">{u.entityName}</p>
                        <p className="text-xs text-[var(--alo-text-muted)]">{u.country} - {u.entityType}</p>
                      </td>
                      <td className="p-3 font-mono text-xs text-blue-400">{u.fieldName}</td>
                      <td className="p-3 text-red-400 text-xs line-through">{u.oldValue || 'None'}</td>
                      <td className="p-3 text-emerald-400 text-xs font-semibold">{u.newValue}</td>
                      <td className="p-3">
                        <Badge className={
                          u.aiConfidence >= 0.85 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }>
                          {(u.aiConfidence * 100).toFixed(0)}% CONFIDENCE
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-blue-400">
                        {u.evidenceUrl ? (
                          <a href={u.evidenceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                            <span>Official Page</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[var(--alo-text-muted)]">Official Check</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="border-white/10 text-[var(--alo-placeholder)]">
                          {u.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'pending_approval' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(u.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Review Only
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(u.id)}
                                className="text-red-400 hover:bg-red-500/10"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          {u.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handlePublish(u.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Play className="w-3.5 h-3.5 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
