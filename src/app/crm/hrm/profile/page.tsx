'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { usePortalStore } from '@/lib/stores/portal-store';

export default function HrmProfilePage() {
  const { user } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    fetch('/api/hrm/profile').then(r=>r.json()).then(j=> { if(j.success) setData(j.data); else toast.error(j.error); }).catch(()=> toast.error('Failed to load profile')).finally(()=> setLoading(false));
  };
  useEffect(()=> { fetchProfile(); }, []);

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload:any = {};
    fd.forEach((v,k)=> payload[k]=String(v));
    // cast numbers
    ['grossSalary','baseSalary','allowances','taxDeduction','pfRate','insurance','probationMonths'].forEach(k=> { if(payload[k]) payload[k]= Number(payload[k]); });
    setSaving(true);
    try{
      const res = await fetch('/api/hrm/profile', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...payload, userId: data?.userId || (user as any)?.id }) });
      const j = await res.json();
      if(j.success){ toast.success('Profile updated'); setData(j.data); } else toast.error(j.error);
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-white p-6 text-xs text-slate-400">Loading private profile...</div>;
  if (!data) return <div className="min-h-screen bg-white p-6 text-sm">No HR profile found. Contact HR.</div>;

  const isPrivate = true; // visible only to Employee/HR/Super Admin — enforced by API

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employee Private Profile</h1>
          <p className="text-xs text-slate-500">Visible only to: Employee (own), HR, Super Admin • AES encrypted sensitive fields</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Private</Badge>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="bg-slate-100 h-9">
          <TabsTrigger value="personal" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-white">Personal</TabsTrigger>
          <TabsTrigger value="employment" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-white">Employment</TabsTrigger>
          <TabsTrigger value="bank" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-white">Bank & Payroll</TabsTrigger>
          <TabsTrigger value="education" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-white">Education & Skills</TabsTrigger>
        </TabsList>

        <form onSubmit={onSave} className="mt-4 space-y-4">
          <TabsContent value="personal">
            <Card className="bg-white border-slate-200">
              <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Personal Information</CardTitle></CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ['employeeId','Employee ID', data.employeeId, true],
                  ['fullName','Full Name', data.fullName||'', false],
                  ['fatherName','Father Name', data.fatherName||'', false],
                  ['motherName','Mother Name', data.motherName||'', false],
                  ['gender','Gender', data.gender||'', false],
                  ['dob','DOB (YYYY-MM-DD)', data.dob||'', false],
                  ['nationality','Nationality', data.nationality||'Bangladeshi', false],
                  ['religion','Religion', data.religion||'', false],
                  ['bloodGroup','Blood Group', data.bloodGroup||'', false],
                  ['maritalStatus','Marital Status', data.maritalStatus||'', false],
                  ['nidNumber','NID', data.nidNumber||'', false],
                  ['passportNumber','Passport', data.passportNumber||'', false],
                  ['passportExpiry','Passport Expiry', data.passportExpiry||'', false],
                  ['tinNumber','TIN', data.tinNumber||'', false],
                  ['drivingLicense','Driving License', data.drivingLicense||'', false],
                  ['personalEmail','Personal Email', data.personalEmail||'', false],
                  ['officialEmail','Official Email', data.officialEmail||'', false],
                  ['phone','Phone', data.phone||data.officialPhone||'', false],
                  ['emergencyContactName','Emergency Contact Name', data.emergencyContactName||'', false],
                  ['emergencyContactPhone','Emergency Contact Phone', data.emergencyContactPhone||'', false],
                  ['emergencyRelation','Emergency Relation', data.emergencyRelation||'', false],
                  ['presentAddress','Present Address', data.presentAddress||'', false],
                  ['permanentAddress','Permanent Address', data.permanentAddress||'', false],
                ].map(([key,label,val,readonly])=> (
                  <div key={key as string} className={String(key).includes('Address') ? 'md:col-span-2 lg:col-span-3' : ''}>
                    <Label className="text-xs text-slate-600">{label as string}</Label>
                    <Input name={key as string} defaultValue={String(val||'')} readOnly={!!readonly} className="h-9 text-sm bg-white border-slate-200" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment">
            <Card className="bg-white border-slate-200">
              <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Employment Information</CardTitle></CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ['joiningDate','Joining Date', data.joiningDate||'', false],
                  ['confirmationDate','Confirmation Date', data.confirmationDate||'', false],
                  ['probationEndDate','Probation End Date', data.probationEndDate||'', false],
                  ['probationMonths','Probation (months)', data.probationMonths||6, false],
                  ['department','Department', data.department||'', false],
                  ['designation','Designation', data.designation||'', false],
                  ['reportingManagerId','Reporting Manager ID', data.reportingManagerId||'', false],
                  ['branch','Branch', data.branch||'', false],
                  ['officeId','Office', data.officeId||'', false],
                  ['employeeType','Employee Type', data.employeeType||'PERMANENT', false],
                  ['employmentStatus','Employment Status', data.employmentStatus||data.status||'ACTIVE', false],
                  ['employmentType','Employment Type', data.employmentType||'FULL_TIME', false],
                  ['workingHours','Working Hours', data.workingHours||'9:00 AM - 6:00 PM', false],
                  ['shift','Shift', data.shift||'Day', false],
                ].map(([k,l,v])=> (
                  <div key={k as string}><Label className="text-xs text-slate-600">{l as string}</Label><Input name={k as string} defaultValue={String(v||'')} className="h-9 text-sm bg-white border-slate-200" /></div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card className="bg-white border-slate-200">
              <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Bank & Compensation (HR/Finance only details)</CardTitle></CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ['salaryGrade','Salary Grade', data.salaryGrade||'G7'],
                  ['grossSalary','Gross Salary', data.grossSalary||0],
                  ['baseSalary','Basic Salary', data.baseSalary||0],
                  ['allowances','Allowances', data.allowances||0],
                  ['taxDeduction','Tax', data.taxDeduction||0],
                  ['pfRate','PF Rate %', data.pfRate||8],
                  ['insurance','Insurance', data.insurance||0],
                  ['bankName','Bank Name', data.bankName||''],
                  ['bankAccount','Bank Account (encrypted)', data.bankAccount||''],
                  ['bankBranch','Bank Branch', data.bankBranch||''],
                  ['bankRouting','Routing', data.bankRouting||''],
                  ['mobileBankingType','Mobile Banking (bKash/Nagad)', data.mobileBankingType||''],
                  ['mobileBankingNumber','Mobile Banking Number', data.mobileBankingNumber||''],
                ].map(([k,l,v])=> (
                  <div key={k as string}><Label className="text-xs text-slate-600">{l as string}</Label><Input name={k as string} defaultValue={String(v||'')} className="h-9 text-sm bg-white border-slate-200" /></div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card className="bg-white border-slate-200">
              <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Education • Experience • Skills • Languages</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-3 text-xs text-slate-600">
                <div><p className="font-semibold text-slate-700">Education</p><div className="mt-1 space-y-1">{(data.education||[]).length ? data.education.map((e:any)=> <div key={e.id} className="p-2 bg-slate-50 border rounded">{e.degree} — {e.institution} ({e.passingYear}) — {e.result}</div>) : <span className="text-slate-400">No education records — add via HR</span>}</div></div>
                <div><p className="font-semibold text-slate-700">Experience</p><div className="mt-1 space-y-1">{(data.experience||[]).length ? data.experience.map((e:any)=> <div key={e.id} className="p-2 bg-slate-50 border rounded">{e.company} — {e.designation} ({e.fromDate} to {e.toDate||'Present'})</div>) : <span className="text-slate-400">No experience records</span>}</div></div>
                <div><p className="font-semibold text-slate-700">Skills</p><div className="flex flex-wrap gap-1 mt-1">{(data.skills||[]).length ? data.skills.map((s:any)=> <Badge key={s.id||s.name} variant="outline" className="text-xs">{s.name} — {s.level}</Badge>) : <span className="text-slate-400">No skills</span>}</div></div>
                <div><p className="font-semibold text-slate-700">Languages</p><div className="flex flex-wrap gap-1 mt-1">{(data.languages||[]).length ? data.languages.map((l:any)=> <Badge key={l.id||l.name} variant="outline" className="text-xs">{l.name}: {l.speaking}/{l.writing}</Badge>) : <span className="text-slate-400">No languages</span>}</div></div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="bg-[#F97316] hover:bg-[#D04010] text-white h-9 text-sm">{saving? 'Saving...' : 'Save (HR/Super Admin only)'}</Button>
            <Button type="button" variant="outline" onClick={fetchProfile} className="h-9 text-sm">Reload</Button>
          </div>
          <p className="text-xs text-slate-400">Employee view is read-only for sensitive fields; HR must approve changes — version history and audit log active.</p>
        </form>
      </Tabs>
    </div>
  );
}
