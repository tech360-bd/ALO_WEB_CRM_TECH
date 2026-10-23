'use client';
import * as React from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTableFrame, FilterBar, QuickActions, BulkToolbar } from '@/components/shared/PortalDashboardprimitives';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, ArrowRight, Plus, FileText, Users, Clock, AlertTriangle, TrendingUp, DollarSign, FileCheck, Plane, GraduationCap, Building2, BookOpen, Target, Megaphone, Handshake, Database, CreditCard, Receipt, Settings } from 'lucide-react';

// Shared range control
function RangeFilter({ value, onChange }: { value: string; onChange: (v:string)=>void }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger><SelectContent>{['Today','This Week','This Month','This Quarter','This Year'].map(o=> <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>;
}

// Skeleton for loading states (required)
function SkeletonCards() { return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><div className="h-24 bg-[var(--alo-surface-muted)] rounded-xl animate-pulse"/><div className="h-24 bg-[var(--alo-surface-muted)] rounded-xl animate-pulse"/><div className="h-24 bg-[var(--alo-surface-muted)] rounded-xl animate-pulse"/><div className="h-24 bg-[var(--alo-surface-muted)] rounded-xl animate-pulse"/></div>; }

// Generic empty
function EmptyState({ title, desc, actionLabel, onAction }: any) { return <div className="py-12 text-center space-y-3"><p className="text-sm font-bold text-[var(--alo-text)]">{title}</p><p className="text-sm text-[var(--alo-text-muted)]">{desc}</p>{onAction && <Button size="sm" onClick={onAction}>{actionLabel}</Button>}</div>; }

// ===== Student Dashboard (unchanged feature set, format only) =====
export function StudentDashboard({ stats, onAction }: any) {
  const { setView } = usePortalStore() as any;
  const [range,setRange]=React.useState('This Month');
  return (
    <div className="space-y-6">
      <PageHeader title="Welcome back" subtitle="Your study abroad journey at a glance" dateFilter={<RangeFilter value={range} onChange={setRange} />} actions={<Button className="bg-[var(--alo-cta)]" onClick={()=> setView('student-course-finder')}><Plus className="w-4 h-4 mr-1"/> Find Courses</Button>} />
      <KpiGrid>
        <KpiCard title="Applications" value={stats?.applications ?? 3} subtitle="2 in review" icon={FileText} drillDown={()=> setView('student-applications')} />
        <KpiCard title="Shortlisted" value={stats?.shortlisted ?? 5} subtitle="Courses saved" icon={BookOpen} drillDown={()=> setView('student-favorites')} />
        <KpiCard title="Tasks Due" value={stats?.tasksDue ?? 2} subtitle="Next: Document upload" icon={Clock} trend="up" drillDown={()=> setView('student-onboarding')} />
        <KpiCard title="Next Appointment" value="Sep 18" subtitle="Counselor: ALO Dhaka" icon={Calendar} />
      </KpiGrid>
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Progress Timeline" description="Enrollment funnel" action={<Button variant="ghost" size="sm" onClick={()=> setView('student-journey')}>View <ArrowRight className="w-3 h-3 ml-1"/></Button>}>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Profile</span><Badge>Done</Badge></div><div className="flex justify-between"><span>Documents</span><Badge variant="secondary">2 pending</Badge></div><div className="flex justify-between"><span>Application</span><Badge variant="outline">In progress</Badge></div></div>
        </SectionCard>
        <SectionCard title="Deadlines" description="Intake Jan 2027"><Table><TableHeader><TableRow><TableHead>University</TableHead><TableHead>Deadline</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>UAL — MA Fashion</TableCell><TableCell>Oct 31</TableCell></TableRow></TableBody></Table></SectionCard>
        <QuickActions items={[{label:'Upload Document', icon: FileText, onClick:()=> setView('student-documents')},{label:'Book Appointment', icon: Calendar, onClick:()=> setView('student-appointments')},{label:'Ask AI Advisor', icon: TrendingUp, onClick:()=> setView('student-ai-advisor')},{label:'Messages', icon: Users, onClick:()=> setView('student-messages')}]} />
      </div>
    </div>
  );
}

// ===== Counselor Dashboard =====
export function CounselorDashboard({ stats, leads, onSearch }: any) {
  const { setView } = usePortalStore() as any;
  const [range,setRange]=React.useState('This Week');
  const [selected,setSelected]=React.useState<Set<string>>(new Set());
  if (!stats) return <SkeletonCards />;
  return (
    <div className="space-y-6">
      <PageHeader title="Counselor Workspace" subtitle="Leads, follow-ups, applications assigned to you" dateFilter={<RangeFilter value={range} onChange={setRange} />} actions={<Button className="bg-[var(--alo-cta)]" onClick={()=> setView('employee-leads')}><Plus className="w-4 h-4 mr-1"/> New Lead</Button>} />
      <KpiGrid>
        <KpiCard title="Assigned Leads" value={stats.leadsAssigned ?? 18} icon={Target} drillDown={()=> setView('employee-leads')} />
        <KpiCard title="Follow-ups Today" value={stats.followupsDue ?? 7} trend="up" icon={Clock} drillDown={()=> setView('employee-tasks')} />
        <KpiCard title="Applications" value={stats.appsInProgress ?? 12} icon={FileText} drillDown={()=> setView('employee-applications')} />
        <KpiCard title="Conversion" value={`${stats.conversion ?? 22}%`} icon={TrendingUp} />
      </KpiGrid>
      <FilterBar onSearch={onSearch} onExport={()=> window.print()} filters={<><Select><SelectTrigger className="w-[140px] h-8"><SelectValue placeholder="Stage" /></SelectTrigger><SelectContent><SelectItem value="all">All Stages</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem></SelectContent></Select><Select><SelectTrigger className="w-[140px] h-8"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="all">Any Priority</SelectItem></SelectContent></Select></>} />
      <BulkToolbar count={selected.size} onExport={()=> {}} onAction={()=> {}} />
      <SectionCard title="Today's Follow-ups" description="Asia/Dhaka • Source: Task where assignedTo=currentUser" action={<Button variant="ghost" size="sm" onClick={()=> setView('employee-tasks')}>View all</Button>}>
        <DataTableFrame><Table><TableHeader><TableRow><TableHead className="w-8"><Checkbox checked={selected.size=== (leads?.length||0) && selected.size>0} onCheckedChange={c=> {
          if (c) {
            setSelected(new Set(leads?.map((l:any)=> l.id)));
          } else {
            setSelected(new Set());
          }
        }} /></TableHead><TableHead>Lead</TableHead><TableHead>Stage</TableHead><TableHead>Due</TableHead></TableRow></TableHeader><TableBody>{(leads||[{id:'1', name:'Rahim Ahmed', stage:'New', due:'Today 4pm'}]).map((l:any)=> <TableRow key={l.id}><TableCell><Checkbox checked={selected.has(l.id)} onCheckedChange={c=>{
          const n=new Set(selected);
          if (c) {
            n.add(l.id);
          } else {
            n.delete(l.id);
          }
          setSelected(n);
        }}/></TableCell><TableCell>{l.name}</TableCell><TableCell><Badge>{l.stage}</Badge></TableCell><TableCell>{l.due}</TableCell></TableRow>)}</TableBody></Table></DataTableFrame>
      </SectionCard>
    </div>
  );
}

// ===== Admissions / Document / Visa / FrontDesk / Marketing / Partner / Data / Finance / HR / DeptHead / COO / SuperAdmin =====
export function AdmissionsDashboard({ stats }: any) {
  const { setView } = usePortalStore() as any;
  const [range,setRange]=React.useState('This Month');
  return (
    <div className="space-y-6">
      <PageHeader title="Admissions Overview" subtitle="Application pipeline to university decisions" dateFilter={<RangeFilter value={range} onChange={setRange} />} />
      <KpiGrid>
        <KpiCard title="Ready for Review" value={stats?.ready ?? 23} icon={FileCheck} drillDown={()=> setView('crm-applications')} />
        <KpiCard title="Submitted" value={stats?.submitted ?? 87} icon={FileText} />
        <KpiCard title="Offers" value={stats?.offers ?? 14} icon={GraduationCap} />
        <KpiCard title="Rejected/Correction" value={stats?.rejected ?? 6} trend="down" icon={AlertTriangle} />
      </KpiGrid>
      <SectionCard title="SLA Breaches" description="Applications past deadline"><DataTableFrame><Table><TableHeader><TableRow><TableHead>Application</TableHead><TableHead>Days Open</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>APP-821 • UAL</TableCell><TableCell>5 days</TableCell><TableCell><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline">Open</Button></TableCell></TableRow></TableBody></Table></DataTableFrame></SectionCard>
    </div>
  );
}

export function DocumentVerificationDashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <PageHeader title="Document Review" subtitle="Evidence-based verification queue" />
      <KpiGrid>
        <KpiCard title="Pending Review" value={stats?.pending ?? 31} icon={FileText} />
        <KpiCard title="In Review" value={stats?.inReview ?? 8} icon={Clock} />
        <KpiCard title="Correction Requested" value={stats?.correction ?? 11} icon={AlertTriangle} />
        <KpiCard title="Approved Today" value={stats?.approved ?? 17} trend="up" icon={FileCheck} />
      </KpiGrid>
      <SectionCard title="Queue"><DataTableFrame><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Document</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>SA-214</TableCell><TableCell>Passport</TableCell><TableCell><Badge>Pending</Badge></TableCell></TableRow></TableBody></Table></DataTableFrame></SectionCard>
    </div>
  );
}

export function VisaDashboard({ stats }: any) {
  const { setView } = usePortalStore() as any;
  return (
    <div className="space-y-6">
      <PageHeader title="Visa & Compliance" subtitle="CAS/I-20/CoE, checklists, interview readiness" actions={<Button className="bg-[var(--alo-cta)]" onClick={()=> setView('crm-visa-cases')}><Plus className="w-4 h-4 mr-1"/> New Case</Button>} />
      <KpiGrid>
        <KpiCard title="Active Cases" value={stats?.active ?? 19} icon={Plane} />
        <KpiCard title="Checklists Overdue" value={stats?.overdue ?? 5} trend="up" icon={AlertTriangle} />
        <KpiCard title="Interviews This Week" value={stats?.interviews ?? 9} icon={Calendar} />
        <KpiCard title="Ready to Submit" value={stats?.ready ?? 7} icon={FileCheck} />
      </KpiGrid>
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Case Aging"><div className="h-32 flex items-center justify-center text-sm text-[var(--alo-text-muted)]">Chart: days since assigned (recharts)</div></SectionCard>
        <SectionCard title="Deadline Alerts"><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Issue</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>SA-301</TableCell><TableCell>Bank statement expires</TableCell></TableRow></TableBody></Table></SectionCard>
      </div>
    </div>
  );
}

export function FrontDeskDashboard({ stats }: any) {
  const { setView } = usePortalStore() as any;
  return (
    <div className="space-y-6">
      <PageHeader title="Front Desk" subtitle="Queue, appointments, handover" actions={<Button className="bg-[var(--alo-cta)]" onClick={()=> setView('crm-leads')}><Plus className="w-4 h-4 mr-1"/> New Enquiry</Button>} />
      <KpiGrid>
        <KpiCard title="Walk-ins Today" value={stats?.walkins ?? 14} icon={Users} />
        <KpiCard title="Upcoming Appointments" value={stats?.appts ?? 9} icon={Calendar} />
        <KpiCard title="Wait Time Avg" value="12m" icon={Clock} />
        <KpiCard title="Handovers Pending" value={stats?.handovers ?? 4} icon={AlertTriangle} />
      </KpiGrid>
      <SectionCard title="Today's Queue"><DataTableFrame><Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Visitor</TableHead><TableHead>Assigned To</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>10:30</TableCell><TableCell>Riya • UK Masters</TableCell><TableCell>Counselor A</TableCell></TableRow></TableBody></Table></DataTableFrame></SectionCard>
    </div>
  );
}

export function MarketingDashboard({ stats }: any) {
  const { setView } = usePortalStore() as any;
  return (
    <div className="space-y-6">
      <PageHeader title="Marketing Overview" subtitle="Campaigns, content, attribution" actions={<Button className="bg-[var(--alo-cta)]" onClick={()=> setView('marketing-campaigns')}><Megaphone className="w-4 h-4 mr-1"/> New Campaign</Button>} />
      <KpiGrid>
        <KpiCard title="Active Campaigns" value={stats?.active ?? 6} icon={Megaphone} />
        <KpiCard title="Leads (Attribution)" value={stats?.leads ?? 143} trend="up" icon={Target} />
        <KpiCard title="Content Due" value={stats?.contentDue ?? 8} icon={FileText} />
        <KpiCard title="Conversion (Campaign)" value="18%" icon={TrendingUp} />
      </KpiGrid>
      <SectionCard title="Performance Report by Campaign/Channel"><DataTableFrame><Table><TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Leads</TableHead><TableHead>Cost/Lead</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>UK Jan 2027 Webinar</TableCell><TableCell>42</TableCell><TableCell>BDT 380</TableCell></TableRow></TableBody></Table></DataTableFrame></SectionCard>
      <SectionCard title="Content Workflow"><Table><TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Stage</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>UAL Scholarship Blog</TableCell><TableCell><Badge>Needs Approval</Badge></TableCell></TableRow></TableBody></Table></SectionCard>
    </div>
  );
}

export function PartnerDashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <PageHeader title="Partner Overview" subtitle="Referrals, documents, commission" />
      <KpiGrid>
        <KpiCard title="Referrals" value={stats?.referrals ?? 11} icon={Handshake} />
        <KpiCard title="In Review" value={stats?.inReview ?? 4} icon={Clock} />
        <KpiCard title="Enrolled" value={stats?.enrolled ?? 6} icon={GraduationCap} />
        <KpiCard title="Commission Due" value={`BDT ${(stats?.commission ?? 125000).toLocaleString()}`} icon={DollarSign} />
      </KpiGrid>
      <SectionCard title="Referral Status"><DataTableFrame><Table><TableHeader><TableRow><TableHead>Referred</TableHead><TableHead>Status</TableHead><TableHead>Settlement</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Tanvir • Birmingham</TableCell><TableCell><Badge>Enrolled</Badge></TableCell><TableCell>Pending</TableCell></TableRow></TableBody></Table></DataTableFrame></SectionCard>
    </div>
  );
}

export function DataDashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <PageHeader title="University Data Management" subtitle="Coverage, freshness, validation" actions={<Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[var(--alo-cta)]"><Plus className="w-4 h-4 mr-1"/> Add University</Button>} />
      <KpiGrid>
        <KpiCard title="Universities" value={stats?.unis ?? 0} icon={Building2} />
        <KpiCard title="Courses" value={stats?.courses ?? 0} icon={BookOpen} />
        <KpiCard title="Stale Records" value={stats?.stale ?? 0} trend="down" icon={AlertTriangle} />
        <KpiCard title="In Validation Queue" value={stats?.queue ?? 0} icon={Database} />
      </KpiGrid>
      <SectionCard title="Validation Metrics">
        <DataTableFrame>
          <Table>
            <TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Verified</TableHead><TableHead>Conflict</TableHead></TableRow></TableHeader>
            <TableBody>
              {Array.isArray(stats?.validationSources) && stats.validationSources.length > 0 ? (
                stats.validationSources.map((row: any) => (
                  <TableRow key={row.source}>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.verified ?? '—'}</TableCell>
                    <TableCell>{row.conflict ?? '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No source verification metrics have been recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DataTableFrame>
      </SectionCard>
    </div>
  );
}

export function FinanceDashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <PageHeader title="Finance Overview" subtitle="Invoices, receipts, reconciliation" />
      <KpiGrid>
        <KpiCard title="Open Invoices" value={stats?.invoices ?? 23} icon={Receipt} />
        <KpiCard title="Collected (MTD)" value={`BDT ${(stats?.collected ?? 2450000).toLocaleString()}`} icon={CreditCard} trend="up" />
        <KpiCard title="Refunds Pending" value={stats?.refunds ?? 4} icon={AlertTriangle} />
        <KpiCard title="Reconciled" value="96%" icon={FileCheck} />
      </KpiGrid>
      <SectionCard title="Reconciliation Discrepancies"><DataTableFrame><Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Difference</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>INV-9012</TableCell><TableCell>BDT -2,400</TableCell></TableRow></TableBody></Table></DataTableFrame></SectionCard>
    </div>
  );
}

export function HRDashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <PageHeader title="HR Management" subtitle="Employees, attendance, leave, payroll" />
      <KpiGrid>
        <KpiCard title="Employees" value={stats?.headcount ?? 64} icon={Users} />
        <KpiCard title="Attendance Today" value="58/64" icon={Clock} />
        <KpiCard title="Leave Pending" value={stats?.leave ?? 7} icon={Calendar} />
        <KpiCard title="Payroll Pending Approval" value={stats?.payroll ?? 2} icon={DollarSign} />
      </KpiGrid>
      <SectionCard title="Role Widgets"><div className="text-sm text-[var(--alo-text-muted)]">HrWidgets injected for non-student portals (see EnterpriseHRMS)</div></SectionCard>
    </div>
  );
}

export function DepartmentHeadDashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <PageHeader title="Department Head" subtitle="Team workload, SLA, escalations" />
      <KpiGrid>
        <KpiCard title="Team Workload (Open)" value={stats?.open ?? 142} icon={Users} />
        <KpiCard title="SLA At Risk" value={stats?.atRisk ?? 9} trend="up" icon={AlertTriangle} />
        <KpiCard title="Escalations" value={stats?.escalations ?? 3} icon={AlertTriangle} />
        <KpiCard title="Avg Handle Time" value="2.3d" icon={Clock} />
      </KpiGrid>
      <SectionCard title="By Assignee"><DataTableFrame><Table><TableHeader><TableRow><TableHead>Counselor</TableHead><TableHead>Open</TableHead><TableHead>Overdue</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Amina</TableCell><TableCell>21</TableCell><TableCell>2</TableCell></TableRow></TableBody></Table></DataTableFrame></SectionCard>
    </div>
  );
}

export function COODashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <PageHeader title="Operations Overview" subtitle="Cross-department funnel, capacity, exceptions" />
      <KpiGrid>
        <KpiCard title="Lead → Enrolled (MTD)" value="4.8%" icon={TrendingUp} trend="up" />
        <KpiCard title="Capacity Utilization" value="81%" icon={Users} />
        <KpiCard title="Critical Exceptions" value={stats?.exceptions ?? 5} icon={AlertTriangle} />
        <KpiCard title="Integrations Health" value="99.2%" icon={Settings} />
      </KpiGrid>
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Department Comparison"><div className="h-36 flex items-center justify-center text-sm text-[var(--alo-text-muted)]">Bar chart: Counselor / Admissions / Visa throughput</div></SectionCard>
        <SectionCard title="AI Activity (24h)"><div className="text-sm text-[var(--alo-body)]">AI payroll calc: 64 payslips • AI visa checklist: 18 suggestions • Avg approval time 1.2h</div></SectionCard>
      </div>
    </div>
  );
}

export function SuperAdminDashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <PageHeader title="System Overview" subtitle="Users, branches, workflows, health" actions={<Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline"><Settings className="w-4 h-4 mr-1"/> Settings</Button>} />
      <KpiGrid>
        <KpiCard title="Active Users" value={stats?.users ?? 87} icon={Users} />
        <KpiCard title="Branches" value={stats?.branches ?? 4} icon={Building2} />
        <KpiCard title="Failed Jobs (24h)" value={stats?.failedJobs ?? 2} icon={AlertTriangle} />
        <KpiCard title="System Health" value="Healthy" icon={FileCheck} />
      </KpiGrid>
      <SectionCard title="Audit & Security"><DataTableFrame><Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Actor</TableHead><TableHead>When (Asia/Dhaka)</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Role change</TableCell><TableCell>admin@alo</TableCell><TableCell>2026-09-15 11:42</TableCell></TableRow></TableBody></Table></DataTableFrame></SectionCard>
    </div>
  );
}
