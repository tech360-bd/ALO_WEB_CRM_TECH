'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const EDITABLE_FIELDS = new Set(['fullName','fatherName','motherName','gender','dob','nationality','religion','bloodGroup','maritalStatus','personalEmail','phone','presentAddress','permanentAddress','emergencyContactName','emergencyContactPhone','emergencyRelation','photo']);
const PERSONAL_FIELDS: Array<[string, string, boolean?]> = [
  ['fullName','Full Name'], ['fatherName','Father Name'], ['motherName','Mother Name'], ['gender','Gender'], ['dob','DOB (YYYY-MM-DD)'],
  ['nationality','Nationality'], ['religion','Religion'], ['bloodGroup','Blood Group'], ['maritalStatus','Marital Status'],
  ['nidNumber','NID'], ['passportNumber','Passport'], ['passportExpiry','Passport Expiry'], ['tinNumber','TIN'], ['drivingLicense','Driving License'],
  ['personalEmail','Personal Email'], ['officialEmail','Official Email', true], ['phone','Phone'],
  ['emergencyContactName','Emergency Contact Name'], ['emergencyContactPhone','Emergency Contact Phone'], ['emergencyRelation','Emergency Relation'],
  ['presentAddress','Present Address'], ['permanentAddress','Permanent Address'],
];
const EMPLOYMENT_FIELDS: Array<[string, string]> = [
  ['joiningDate','Joining Date'], ['confirmationDate','Confirmation Date'], ['probationEndDate','Probation End Date'], ['probationMonths','Probation (months)'],
  ['department','Department'], ['designation','Designation'], ['reportingManagerId','Reporting Manager ID'], ['branch','Branch'], ['officeId','Office'],
  ['employeeType','Employee Type'], ['employmentStatus','Employment Status'], ['employmentType','Employment Type'], ['workingHours','Working Hours'], ['shift','Shift'],
];
const PAYROLL_FIELDS: Array<[string, string]> = [
  ['salaryGrade','Salary Grade'], ['grossSalary','Gross Salary'], ['baseSalary','Basic Salary'], ['allowances','Allowances'], ['taxDeduction','Tax'],
  ['pfRate','PF Rate %'], ['insurance','Insurance'], ['bankName','Bank Name'], ['bankAccount','Bank Account'], ['bankBranch','Bank Branch'],
  ['bankRouting','Routing'], ['mobileBankingType','Mobile Banking'], ['mobileBankingNumber','Mobile Banking Number'],
];

export default function HrmProfilePage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    const userId = searchParams.get('userId');
    const employeeId = searchParams.get('employeeId');
    if (userId) params.set('userId', userId);
    if (employeeId) params.set('employeeId', employeeId);
    try {
      const response = await fetch(`/api/hrm/profile${params.size ? `?${params}` : ''}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load private profile.');
      setData({ ...result.data, canEdit: Boolean(result.canEdit), isOwner: Boolean(result.isOwner), fieldAccess: result.fieldAccess || {} });
    } catch (error) {
      setData(null);
      toast.error(error instanceof Error ? error.message : 'Failed to load private profile.');
    } finally { setLoading(false); }
  }, [searchParams]);
  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data?.canEdit || !data.userId) return;
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = { userId: data.userId };
    form.forEach((value, key) => { if (EDITABLE_FIELDS.has(key)) payload[key] = String(value); });
    setSaving(true);
    try {
      const response = await fetch('/api/hrm/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Profile update failed.');
      toast.success('Authorized personal-profile fields updated and audited.');
      await fetchProfile();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Profile update failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-white p-6 text-xs text-[var(--alo-text-muted)]">Loading private profile…</div>;
  if (!data) return <div className="min-h-screen bg-white p-6 text-sm">No accessible HR profile found. Contact HR.</div>;

  const safeValue = (value: unknown) => value === null || value === undefined ? '' : String(value);
  const renderInputs = (fields: Array<[string, string, boolean?]>, editable: boolean) => fields.map(([key, label]) => (
    <div key={key} className={key.toLowerCase().includes('address') ? 'md:col-span-2 lg:col-span-3' : ''}>
      <Label htmlFor={key} className="text-xs text-[var(--alo-body)]">{label}</Label>
      <Input id={key} name={key} defaultValue={safeValue(data[key])} readOnly={!editable || !EDITABLE_FIELDS.has(key)} className="h-9 text-sm bg-white border-[var(--alo-border)] read-only:bg-[var(--alo-page)]" />
    </div>
  ));

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-[var(--alo-text)]">Employee Private Profile</h1><p className="text-xs text-[var(--alo-text-muted)]">Access and fields are enforced by server-side HR permissions. Reads and changes are audited.</p></div>
        <Badge className="bg-crm-success-bg text-crm-success-text border-crm-success-border text-xs">Private</Badge>
      </div>
      <Tabs defaultValue="personal">
        <TabsList className="bg-[var(--alo-surface-muted)] h-9 flex-wrap">
          <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger><TabsTrigger value="employment" className="text-xs">Employment</TabsTrigger>
          <TabsTrigger value="bank" className="text-xs">Bank & Payroll</TabsTrigger><TabsTrigger value="education" className="text-xs">Education & Skills</TabsTrigger>
        </TabsList>
        <form onSubmit={onSave} className="mt-4 space-y-4">
          <TabsContent value="personal"><Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Personal Information</CardTitle></CardHeader><CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><Label className="text-xs text-[var(--alo-body)]">Employee ID</Label><Input value={safeValue(data.employeeId)} readOnly className="h-9 text-sm bg-[var(--alo-page)]" /></div>
            {renderInputs(PERSONAL_FIELDS.filter(([key]) => key !== 'officialEmail'), Boolean(data.canEdit))}
            {data.officialEmail !== undefined && <div><Label className="text-xs text-[var(--alo-body)]">Official Email</Label><Input value={safeValue(data.officialEmail)} readOnly className="h-9 text-sm bg-[var(--alo-page)]" /></div>}
          </CardContent></Card></TabsContent>
          <TabsContent value="employment"><Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Employment Information</CardTitle></CardHeader><CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{renderInputs(EMPLOYMENT_FIELDS, false)}</CardContent></Card></TabsContent>
          <TabsContent value="bank"><Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Bank & Compensation</CardTitle></CardHeader><CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.fieldAccess?.payroll ? renderInputs(PAYROLL_FIELDS, false) : <p className="text-sm text-[var(--alo-text-muted)] md:col-span-3">Payroll calculation details are not available to this account.</p>}
            {!data.fieldAccess?.bank && <p className="text-sm text-[var(--alo-text-muted)] md:col-span-3">Bank details are not available to this account.</p>}
          </CardContent></Card></TabsContent>
          <TabsContent value="education"><Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Education • Experience • Skills • Languages</CardTitle></CardHeader><CardContent className="p-4 space-y-4 text-xs text-[var(--alo-body)]">
            <section><p className="font-semibold text-[var(--alo-body)]">Education</p>{data.education?.length ? data.education.map((item: any) => <div key={item.id} className="mt-1 p-2 bg-[var(--alo-page)] border rounded">{item.degree} — {item.institution} ({item.passingYear}) — {item.result}</div>) : <p className="text-[var(--alo-text-muted)]">No education records.</p>}</section>
            <section><p className="font-semibold text-[var(--alo-body)]">Experience</p>{data.experience?.length ? data.experience.map((item: any) => <div key={item.id} className="mt-1 p-2 bg-[var(--alo-page)] border rounded">{item.company} — {item.designation} ({item.fromDate} to {item.toDate || 'Present'})</div>) : <p className="text-[var(--alo-text-muted)]">No experience records.</p>}</section>
            <section><p className="font-semibold text-[var(--alo-body)]">Skills</p><div className="mt-1 flex flex-wrap gap-1">{data.skills?.length ? data.skills.map((item: any) => <Badge key={item.id} variant="outline">{item.name} — {item.level}</Badge>) : <span className="text-[var(--alo-text-muted)]">No skills.</span>}</div></section>
            <section><p className="font-semibold text-[var(--alo-body)]">Languages</p><div className="mt-1 flex flex-wrap gap-1">{data.languages?.length ? data.languages.map((item: any) => <Badge key={item.id} variant="outline">{item.name}: {item.speaking}/{item.writing}</Badge>) : <span className="text-[var(--alo-text-muted)]">No languages.</span>}</div></section>
          </CardContent></Card></TabsContent>
          <div className="flex gap-2">
            {data.canEdit && <Button type="submit" disabled={saving} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white text-sm">{saving ? 'Saving…' : 'Save personal-profile fields'}</Button>}
            <Button type="button" variant="outline" onClick={() => void fetchProfile()} className="h-9 text-sm">Reload</Button>
          </div>
          <p className="text-xs text-[var(--alo-text-muted)]">Employment, role, branch, access, lifecycle, salary and bank changes must use their dedicated reviewed workflows; they cannot be changed here.</p>
        </form>
      </Tabs>
    </div>
  );
}
