'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Plus, ShieldAlert, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type WorkflowRecord = {
  id: string;
  name: string;
  description?: string | null;
  triggerType: string;
  status: string;
  reportedIsActive: boolean;
  hasStoredEndpoint: boolean;
  hasStoredSecret: boolean;
  reportedTriggerCount: number;
  reportedLastTriggeredAt?: string | null;
  createdAt: string;
};

const TRIGGER_TYPES = [
  ['LEAD_CREATED', 'Lead created'],
  ['FOLLOW_UP', 'Follow-up'],
  ['WHATSAPP_REPLY', 'WhatsApp reply'],
  ['CAMPAIGN_REPORT', 'Campaign report'],
  ['COUNSELOR_NOTIFY', 'Counselor notification'],
] as const;

export default function N8nWorkflowsView() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', triggerType: 'LEAD_CREATED' });

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/marketing/n8n-workflows', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Workflow configuration is unavailable.');
      setWorkflows(Array.isArray(result?.workflows) ? result.workflows : []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Workflow configuration is unavailable.');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadWorkflows(); }, [loadWorkflows]);

  const createPlaceholder = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Workflow name required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/marketing/n8n-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.workflow) throw new Error(result?.error || 'Placeholder could not be saved.');
      toast({ title: 'Placeholder saved', description: result.message });
      setForm({ name: '', description: '', triggerType: 'LEAD_CREATED' });
      setCreateOpen(false);
      await loadWorkflows();
    } catch (error) {
      toast({ title: 'Could not save placeholder', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const clearLocalConfig = async (workflow: WorkflowRecord) => {
    setClearingId(workflow.id);
    try {
      const response = await fetch('/api/marketing/n8n-workflows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: workflow.id, isActive: false }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Local configuration could not be cleared.');
      toast({ title: 'Local configuration cleared', description: result.message });
      await loadWorkflows();
    } catch (error) {
      toast({ title: 'Cleanup failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setClearingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">n8n Workflow Configuration</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Only local configuration records are shown. External endpoints and execution are not configured or verified.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add placeholder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create workflow placeholder</DialogTitle>
              <DialogDescription>This creates an inactive local record only. Do not enter endpoint URLs or secrets; n8n will not be contacted.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Name</Label>
                <Input id="workflow-name" maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea id="workflow-description" maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Planned trigger</Label>
                <Select value={form.triggerType} onValueChange={(triggerType) => setForm({ ...form, triggerType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRIGGER_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button disabled={saving} onClick={createPlaceholder}>{saving ? 'Saving…' : 'Save placeholder'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5" />Stored workflow records</CardTitle>
          <CardDescription>{loading ? 'Loading…' : `${workflows.length} record(s); provider state is NOT VERIFIED`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadError && <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">{loadError}</div>}
          {!loading && !loadError && workflows.length === 0 && <p className="text-sm text-muted-foreground">No workflow records are stored. Nothing is connected or running.</p>}
          {workflows.map((workflow) => {
            const hasLocalConfig = workflow.hasStoredEndpoint || workflow.hasStoredSecret || workflow.reportedIsActive;
            return (
              <div key={workflow.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{workflow.name}</span>
                    <Badge variant="outline">{workflow.triggerType}</Badge>
                    <Badge variant="secondary">NOT VERIFIED</Badge>
                  </div>
                  {workflow.description && <p className="text-sm text-muted-foreground">{workflow.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    Endpoint: {workflow.hasStoredEndpoint ? 'stored (value hidden)' : 'none'} · Secret: {workflow.hasStoredSecret ? 'stored (value hidden)' : 'none'} · Historical active flag and execution counters are unverified.
                  </p>
                </div>
                {hasLocalConfig && <Button size="sm" variant="outline" disabled={clearingId === workflow.id} onClick={() => clearLocalConfig(workflow)}>{clearingId === workflow.id ? 'Clearing…' : 'Clear local config'}</Button>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-3 rounded-lg border border-crm-warning-border bg-crm-warning-bg p-4 text-sm text-crm-warning-text">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex gap-2"><ShieldAlert className="hidden h-4 w-4 shrink-0 sm:block" /><p>No webhook is called from this page. Clearing local configuration does not disable or revoke an external n8n workflow. Provider access and live execution remain NOT VERIFIED.</p></div>
      </div>
    </div>
  );
}
