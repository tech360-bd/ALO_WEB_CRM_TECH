'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Rule = { id: string; ownerType: string; ownerId: string; featureKey: string; isEnabled: boolean; requiresApproval: boolean; limitValue: number };
type Employee = { id: string; name?: string; employeeId?: string };

export default function FeatureAccessRulesPanel({ employees, rules, onSaved }: {
  employees: Employee[]; rules: Rule[]; onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Rule | null>(null);
  const [ownerId, setOwnerId] = useState('');
  const [featureKey, setFeatureKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [approval, setApproval] = useState(false);
  const [limit, setLimit] = useState(0);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/employee-access/feature-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(editing ? { id: editing.id } : {}), ownerType: editing?.ownerType.toUpperCase() || 'EMPLOYEE',
          ownerId, featureKey, isEnabled: enabled, requiresApproval: approval, limitValue: limit, reason }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Permission change failed.');
      await onSaved(); setMessage('Permission saved with its audit record.'); setEditing(null); setReason('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Permission change failed.'); }
    finally { setBusy(false); }
  }

  return <section className="space-y-4" aria-label="Employee feature permissions">
    <h3 className="font-semibold">Employee feature permissions</h3>
    <p className="text-sm text-gray-600">Use the exact feature and action key, such as employee.fields.salary.view. An enabled rule remains limited by the server’s record scope. A disabled rule or approval requirement blocks access.</p>
    <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
      <label className="text-sm">Employee
        <select className="mt-1 w-full rounded-md border bg-white p-2" value={ownerId} required disabled={!!editing} onChange={e => setOwnerId(e.target.value)}>
          <option value="">Select employee</option>
          {editing ? <option value={editing.ownerId}>{employees.find(e => e.id === editing.ownerId)?.name || editing.ownerId}</option> : employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name || employee.employeeId || employee.id}</option>)}
        </select>
      </label>
      <label className="text-sm">Feature and action key<Input value={featureKey} required maxLength={191} pattern="[a-zA-Z0-9_.-]+" onChange={e => setFeatureKey(e.target.value)} /></label>
      <label className="text-sm">Usage limit<Input type="number" min={0} max={2147483647} value={limit} required onChange={e => setLimit(Number(e.target.value))} /></label>
      <label className="text-sm">Reason<Input value={reason} minLength={8} maxLength={500} required onChange={e => setReason(e.target.value)} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />Enabled</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={approval} onChange={e => setApproval(e.target.checked)} />Requires approval</label>
      <div className="flex gap-2"><Button type="submit" disabled={busy || !ownerId} className="bg-[var(--alo-cta)]">{busy ? 'Saving…' : editing ? 'Update permission' : 'Add permission'}</Button>
        {editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setOwnerId(''); setReason(''); }}>Cancel edit</Button>}</div>
    </form>
    {message && <p role="status" className="text-sm">{message}</p>}
    {!rules.length ? <p className="text-sm text-gray-600">No permission rules yet.</p> : <ul className="grid gap-2 md:grid-cols-2">{rules.map(rule => <li key={rule.id} className="rounded-xl border bg-white p-3 text-sm break-words">
      <p className="font-medium">{rule.featureKey}</p><p>{employees.find(e => e.id === rule.ownerId)?.name || rule.ownerId}</p>
      <p>{rule.isEnabled ? 'Enabled' : 'Disabled'} · {rule.requiresApproval ? 'Approval required' : 'No approval gate'} · Limit {rule.limitValue}</p>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { setEditing(rule); setOwnerId(rule.ownerId); setFeatureKey(rule.featureKey); setEnabled(rule.isEnabled); setApproval(rule.requiresApproval); setLimit(rule.limitValue); setReason(''); setMessage(''); }}>Edit permission</Button>
    </li>)}</ul>}
  </section>;
}
