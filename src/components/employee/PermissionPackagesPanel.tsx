'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
type Package = { id: string; name: string; description: string; permissions: string };
type Assignment = { id: string; employeeId: string; packageId: string; status: string; isActive: boolean; expiresAt: string | null };
const ENDPOINT = '/api/employee-access/permission-packages';
export default function PermissionPackagesPanel() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(''); const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState('[]'); const [reason, setReason] = useState('');
  const [employeeId, setEmployeeId] = useState(''); const [packageId, setPackageId] = useState(''); const [expiresAt, setExpiresAt] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { const response = await fetch(ENDPOINT, { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Packages unavailable.'); setPackages(data.employeePackages); setAssignments(data.assignments); }
    catch (e) { setError(e instanceof Error ? e.message : 'Packages unavailable.'); } finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function mutate(method: 'POST' | 'PATCH', body: unknown) {
    setBusy(true); setError(''); setMessage('');
    try { const response = await fetch(ENDPOINT, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Change failed.'); setMessage('Change saved and audited.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Change failed.'); } finally { setBusy(false); }
  }
  const field = 'block w-full rounded-lg border bg-white p-2 text-sm';
  return <section aria-label="Employee permission packages" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Employee permission packages</h2><Button variant="outline" onClick={() => void load()} disabled={busy}>Refresh packages</Button></div>
    <p className="text-sm">Only a non-acting Super Admin can change packages. Every grant uses the central permission engine. Designations do not grant access.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}<p role="status">{busy ? 'Loading…' : message}</p>
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="space-y-3 rounded-xl border p-4" onSubmit={e => { e.preventDefault(); try { const parsed = JSON.parse(permissions); void mutate('POST', { ...(editing ? { id: editing } : {}), name, description, permissions: parsed, reason }); } catch { setError('Permissions must be a valid JSON array.'); } }}>
        <h3 className="font-semibold">{editing ? 'Edit package' : 'Create package'}</h3>
        <label className="block text-sm">Name<input className={field} required minLength={3} maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="block text-sm">Description<textarea className={field} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} /></label>
        <label className="block text-sm">Permission definitions<textarea aria-describedby="package-permission-help" className={`${field} font-mono`} rows={8} required maxLength={50000} value={permissions} onChange={e => setPermissions(e.target.value)} /></label>
        <p id="package-permission-help" className="text-xs">Each entry requires featureKey, lowercase action, scopeType and scopeId. Scopes: GLOBAL, COUNTRY, BRANCH, OFFICE, DEPARTMENT, TEAM, ASSIGNED, OWN, RECORD. Bounded scopes require their exact stored identifier; RECORD uses entity type:ID. Entries may set isEnabled or requiresApproval. Approval-gated entries do not authorize execution.</p>
        <Button type="submit" disabled={busy || reason.trim().length < 8}>Save package</Button>
        {editing && <Button type="button" variant="outline" onClick={() => { setEditing(''); setName(''); setDescription(''); setPermissions('[]'); }}>Create another package</Button>}
      </form>
      <form className="space-y-3 rounded-xl border p-4" onSubmit={e => { e.preventDefault(); void mutate('PATCH', { operation: 'assign', employeeId, packageId, startsAt: new Date().toISOString(), expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null, reason }); }}>
        <h3 className="font-semibold">Assign package</h3>
        <label className="block text-sm">Employee database ID<input required className={field} maxLength={191} value={employeeId} onChange={e => setEmployeeId(e.target.value)} /></label>
        <label className="block text-sm">Package<select required className={field} value={packageId} onChange={e => setPackageId(e.target.value)}><option value="">Select saved package</option>{packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}</select></label>
        <label className="block text-sm">Expiry (local time, optional)<input className={field} type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></label>
        <Button type="submit" disabled={busy || reason.trim().length < 8}>Assign to employee</Button>
      </form>
    </div>
    <label className="block text-sm font-medium">Reason for the next change<input className={field} required minLength={8} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label>
    <div className="grid gap-3 sm:grid-cols-2">{packages.map(pkg => <article key={pkg.id} className="rounded-xl border p-3"><h3 className="font-semibold">{pkg.name}</h3><p className="text-sm">{pkg.description}</p><Button variant="outline" disabled={busy} onClick={() => { setEditing(pkg.id); setName(pkg.name); setDescription(pkg.description); try { setPermissions(JSON.stringify(JSON.parse(pkg.permissions), null, 2)); } catch { setPermissions('[]'); } }}>Edit {pkg.name}</Button></article>)}</div>
    {!busy && !error && !packages.length && <p>No employee packages saved yet.</p>}
    <h3 className="font-semibold">Assignment history</h3>
    <div className="grid gap-3 sm:grid-cols-2">{assignments.map(item => <article key={item.id} className="space-y-2 rounded-xl border p-3 text-sm"><p>Employee: {item.employeeId}</p><p>Package: {packages.find(pkg => pkg.id === item.packageId)?.name || item.packageId}</p><p>Status: {item.status} · Expiry: {item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'No expiry'}</p>{item.isActive && <Button variant="outline" disabled={busy || reason.trim().length < 8} onClick={() => void mutate('PATCH', { operation: 'revoke', assignmentId: item.id, reason })}>Revoke assignment</Button>}</article>)}</div>
    {!busy && !error && !assignments.length && <p>No package assignments yet.</p>}
  </section>;
}
