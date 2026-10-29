'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import OfficialLetterhead from '@/components/official/OfficialLetterhead';
import { usePortalStore } from '@/lib/stores/portal-store';
import { hasSuperAdminAuthority } from '@/lib/brand/brand-assets';

export default function HrmAgreementsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('HR_POLICY');
  const [content, setContent] = useState('');
  const [showLetterheadPreview, setShowLetterheadPreview] = useState(false);
  const [applySeal, setApplySeal] = useState(false);
  const portalUser = usePortalStore((state) => state.user);
  const portalUserType = usePortalStore((state) => state.userType);
  // UI hint only — the seal API re-checks `isSealAuthorized` server-side.
  const canSealPreview = hasSuperAdminAuthority([
    portalUserType,
    ...(portalUser?.roles?.map((role) => role.name) || []),
  ]);

  const load = () => {
    setLoading(true);
    fetch('/api/hrm/agreements').then(r=>r.json()).then(j=> setData(j.data)).finally(()=> setLoading(false));
  };
  useEffect(()=> { load(); }, []);

  const create = async () => {
    if (!title) return toast.error('Title required');
    const res = await fetch('/api/hrm/agreements', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, category, content })});
    const j = await res.json();
    if (j.success) { toast.success('Created'); setTitle(''); setContent(''); load(); } else toast.error(j.error);
  };
  const accept = async (id:string) => {
    const res = await fetch('/api/hrm/agreements/accept', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ agreementId: id })});
    const j = await res.json();
    if (j.success) toast.success('Accepted — IP & signature logged'); else toast.error(j.error);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div><h1 className="text-xl font-bold text-[var(--alo-text)]">HR Agreement Center</h1><p className="text-xs text-[var(--alo-text-muted)]">Appointment Letter • HR/Company/Leave/Salary/Notice/PF/Gratuity/Security/Confidentiality • International/Bangladesh Employment • Digital Signature • Acceptance Date/IP • Version History</p></div>

      <Card className="bg-white border-[var(--alo-border)]">
        <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Create Policy / Agreement (HR only)</CardTitle></CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Title" value={title} onChange={e=> setTitle(e.target.value)} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <select value={category} onChange={e=> setCategory(e.target.value)} className="h-9 text-xs border border-[var(--alo-border)] rounded px-2 bg-white">
            <option>HR_POLICY</option><option>COMPANY_POLICY</option><option>LEAVE_POLICY</option><option>SALARY_POLICY</option><option>NOTICE_POLICY</option><option>PF_POLICY</option><option>GRATUITY_POLICY</option><option>SECURITY_POLICY</option><option>CONFIDENTIALITY_POLICY</option>
            <option>appointment_letter</option><option>international_agreement</option><option>bangladesh_agreement</option>
          </select>
          <Button onClick={create} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white ">Create</Button>
          <textarea placeholder="Content (versioned)" value={content} onChange={e=> setContent(e.target.value)} className="md:col-span-3 min-h-[80px] text-xs border border-[var(--alo-border)] rounded p-2 bg-white" />
        </CardContent>
      </Card>

      <Card className="bg-white border-[var(--alo-border)]">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-sm font-bold">Official letterhead preview</CardTitle>
          <p className="text-xs text-[var(--alo-text-muted)]">
            Appointment letters and agreements are previewed on the official ALO Education letterhead.
            The official seal can be applied only by a Super Admin; the seal API re-checks and audits that access.
          </p>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-[var(--alo-body)]">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={showLetterheadPreview}
                onChange={(event) => setShowLetterheadPreview(event.target.checked)}
              />
              Preview draft on letterhead
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={applySeal && canSealPreview}
                disabled={!canSealPreview}
                onChange={(event) => setApplySeal(event.target.checked)}
              />
              Apply official seal {canSealPreview ? '(Super Admin)' : '(Super Admin only)'}
            </label>
          </div>
          {showLetterheadPreview && (
            <div className="overflow-x-auto bg-[var(--alo-page)] p-3">
              <OfficialLetterhead
                sealed={applySeal && canSealPreview}
                documentType={category === 'appointment_letter' ? 'offer-letter' : 'employment-contract'}
                issuedByName={portalUser?.name || undefined}
                note="Preview only. Save the agreement above to persist the draft content."
              >
                <h1 className="font-heading text-[20pt] font-extrabold text-alo-brand">
                  {title || 'Untitled official document'}
                </h1>
                <p className="mt-2 text-sm text-neutral-500">Category: {category}</p>
                <div className="mt-6 space-y-4 whitespace-pre-wrap">
                  {content || 'Document content will appear here as you type.'}
                </div>
              </OfficialLetterhead>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? <p className="text-xs text-[var(--alo-text-muted)]">Loading...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white border-[var(--alo-border)]">
            <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Agreements ({data?.agreements?.length||0})</CardTitle></CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-auto divide-y divide-[var(--alo-border)]">
              {(data?.agreements||[]).length ? data.agreements.map((a:any)=> (
                <div key={a.id} className="p-3 flex items-center justify-between">
                  <div><p className="text-sm font-medium text-[var(--alo-text)]">{a.title}</p><p className="text-xs text-[var(--alo-text-muted)]">{a.type} • v{a.version} • {a.status}</p></div>
                  <Button size="sm" className="h-7 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white" onClick={()=> accept(a.id)}>Accept (Sign)</Button>
                </div>
              )) : <p className="p-4 text-xs text-[var(--alo-text-muted)]">No agreements</p>}
            </CardContent>
          </Card>
          <Card className="bg-white border-[var(--alo-border)]">
            <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">HR Policies ({data?.policies?.length||0})</CardTitle></CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-auto divide-y divide-[var(--alo-border)]">
              {(data?.policies||[]).length ? data.policies.map((p:any)=> (
                <div key={p.id} className="p-3 flex items-center justify-between">
                  <div><p className="text-sm font-medium text-[var(--alo-text)]">{p.title}</p><p className="text-xs text-[var(--alo-text-muted)]">{p.category} • v{p.version}</p></div>
                  <Button size="sm" variant="outline" className="h-7 " onClick={()=> accept(p.id)}>Accept</Button>
                </div>
              )) : <p className="p-4 text-xs text-[var(--alo-text-muted)]">No policies</p>}
            </CardContent>
          </Card>
        </div>
      )}
      <Card className="bg-[var(--alo-page)] border-[var(--alo-border)]"><CardContent className="p-3 text-xs text-[var(--alo-body)]">Digital Signature: checkbox acceptance logs acceptanceDate, IP, userAgent, version — audit-ready. Version history via EmployeeDocumentVersion.</CardContent></Card>
    </div>
  );
}
