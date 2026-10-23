'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, Download, Eye, Loader2 } from 'lucide-react';

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700', update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700', login: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  export: 'bg-purple-100 text-purple-700', status_change: 'bg-orange-100 text-orange-700',
  assign: 'bg-cyan-100 text-cyan-700', upload: 'bg-amber-100 text-amber-700',
  import_batch_completed: 'bg-emerald-100 text-emerald-700', import_batch_rolled_back: 'bg-red-100 text-red-700',
};

interface AuditLog {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string;
  ipAddress: string;
  [key: string]: unknown;
}

export default function CrmAuditLogsPage() {
  const token = usePortalStore(state => state.token);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const loadLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (entityFilter !== 'all') params.set('entityType', entityFilter);
      params.set('limit', '50');
      const res = await fetch(`/api/crm/audit-logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || json.logs || json.items || []);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search, actionFilter, entityFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter((l) => {
    const matchAction = actionFilter === 'all' || (l.action || '').toLowerCase() === actionFilter;
    const matchEntity = entityFilter === 'all' || (l.entityType || '').toLowerCase() === entityFilter;
    return matchAction && matchEntity;
  });

  const actions = [...new Set(logs.map(l => (l.action || 'unknown').toLowerCase()))];
  const entities = [...new Set(logs.map(l => (l.entityType || 'unknown').toLowerCase()))];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Audit Logs</h1>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="border-alo-border text-alo-text"><Download className="mr-2 h-4 w-4" />Export Logs</Button>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
              <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Action Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Entity Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="border-b border-alo-border text-left text-alo-text-muted">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Resource</th>
                  <th className="pb-3 font-medium">Details</th>
                  <th className="pb-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-[var(--alo-text-muted)]">No audit logs found</td></tr>
                ) : filtered.map((l) => {
                  let details = l.metadata || '';
                  if (typeof details === 'string') {
                    try { details = JSON.parse(details); } catch { /* keep as string */ }
                  }
                  const detailStr = typeof details === 'object' ? Object.entries(details as Record<string, unknown>).map(([k,v]) => `${k}: ${v}`).join(', ') : String(details);
                  return (
                    <tr key={l.id} className="border-b border-alo-border/50 hover:bg-[var(--alo-page)]">
                      <td className="py-3 text-xs text-alo-text-muted font-mono">{l.createdAt ? new Date(l.createdAt).toLocaleString() : 'N/A'}</td>
                      <td className="py-3 font-medium text-alo-text">{l.actorUserId || 'System'}</td>
                      <td className="py-3 text-alo-text-secondary">{l.actorRole || 'Automated'}</td>
                      <td className="py-3"><Badge className={actionColors[(l.action || '').toLowerCase()] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}>{l.action || 'unknown'}</Badge></td>
                      <td className="py-3 text-alo-text-secondary">{l.entityType || '—'}</td>
                      <td className="py-3 text-alo-text-secondary max-w-[200px] truncate" title={detailStr}>{detailStr || '—'}</td>
                      <td className="py-3 text-xs text-alo-text-muted">{l.ipAddress || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
