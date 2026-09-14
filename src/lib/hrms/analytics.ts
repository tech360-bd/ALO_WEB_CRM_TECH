// ALO HRMS — Analytics calculations (headcount, rates, costs, etc.)
import { db } from '@/lib/db';

export type HrAnalytics = {
  headcount: number;
  activeEmployees: number;
  attendanceRate: number;
  latePercent: number;
  absentPercent: number;
  leavePercent: number;
  payrollCost: number;
  departmentCost: Record<string, number>;
  newJoiners: number;
  resignedEmployees: number;
  probationEmployees: number;
  upcomingConfirmation: number;
  upcomingBirthday: { employeeId:string; fullName:string; dob:string; daysLeft:number }[];
  upcomingWorkAnniversary: { employeeId:string; fullName:string; joiningDate:string; years:number }[];
  branchBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
};

export async function computeHrAnalytics(): Promise<HrAnalytics> {
  const employees = await (db as any).employeeHR.findMany({ where: { isDeleted: false } }).catch(()=>[]);
  const today = new Date().toISOString().slice(0,10);
  const todayAttend = await (db as any).employeeAttendance.findMany({ where: { date: today } }).catch(()=>[]);
  const payrolls = await (db as any).payroll.findMany({ orderBy:{ monthYear:'desc'}, take: 200 }).catch(()=>[]);
  const hrmPayrolls = await (db as any).hrmPayrollRun.findMany({ orderBy:{ monthYear:'desc'}, take:12 }).catch(()=>[]);

  const headcount = employees.length;
  const active = employees.filter((e:any)=> (e.status||'').toUpperCase()==='ACTIVE' && (e.employmentStatus||'ACTIVE').toUpperCase()!=='TERMINATED').length;

  const present = todayAttend.filter((a:any)=> ['present','late'].includes((a.status||'').toLowerCase())).length;
  const late = todayAttend.filter((a:any)=> (a.status||'').toLowerCase()==='late').length;
  const absent = todayAttend.filter((a:any)=> (a.status||'').toLowerCase()==='absent').length;
  const onLeave = todayAttend.filter((a:any)=> (a.status||'').toLowerCase()==='leave').length;

  const totalTracked = todayAttend.length || headcount || 1;
  const attendanceRate = Math.round(present/totalTracked*100);
  const latePercent = Math.round(late/totalTracked*100);
  const absentPercent = Math.round(absent/totalTracked*100);
  const leavePercent = Math.round(onLeave/totalTracked*100);

  // payroll cost current month
  const thisMonth = today.slice(0,7);
  const monthPayrolls = [...payrolls, ...hrmPayrolls].filter((p:any)=> (p.monthYear||p.monthYear)===thisMonth);
  const payrollCost = monthPayrolls.reduce((s:number,p:any)=> s+ Number(p.netPay||p.totalNet||p.netSalary||0),0) || payrolls.filter((p:any)=> p.status==='PAID').slice(0,20).reduce((s:number,p:any)=> s+ Number(p.netPay||0),0);

  const departmentCost: Record<string, number> = {};
  for (const e of employees as any[]) {
    const dept = e.department||'Unknown';
    departmentCost[dept] = (departmentCost[dept]||0) + Number(e.baseSalary||e.grossSalary||0);
  }

  const monthAgo = new Date(Date.now()-30*86400000);
  const newJoiners = employees.filter((e:any)=> {
    const jd = new Date(e.joiningDate||e.createdAt);
    return !isNaN(jd.getTime()) && jd > monthAgo;
  }).length;

  const resigned = employees.filter((e:any)=> ['RESIGNED','TERMINATED'].includes((e.status||'').toUpperCase())).length;
  const probation = employees.filter((e:any)=> (e.employmentStatus||'').toUpperCase()==='PROBATION' || (e.employmentType||'').toUpperCase()==='PROBATION').length;

  const now = new Date();
  const upcomingConfirmation = employees.filter((e:any)=> {
    if (!e.probationEndDate) return false;
    const d = new Date(e.probationEndDate);
    if (isNaN(d.getTime())) return false;
    const diff = Math.ceil((d.getTime()-now.getTime())/86400000);
    return diff>=0 && diff<=30;
  }).length;

  const upcomingBirthday: HrAnalytics['upcomingBirthday'] = [];
  const upcomingWorkAnniversary: HrAnalytics['upcomingWorkAnniversary'] = [];
  for (const e of employees as any[]) {
    if (e.dob) {
      const dob = new Date(e.dob);
      if (!isNaN(dob.getTime())) {
        const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        const diff = Math.ceil((thisYear.getTime()-now.getTime())/86400000);
        if (diff>=0 && diff<=30) upcomingBirthday.push({ employeeId:e.employeeId, fullName:e.fullName||e.employeeId, dob:e.dob, daysLeft: diff });
      }
    }
    if (e.joiningDate) {
      const jd = new Date(e.joiningDate);
      if (!isNaN(jd.getTime())) {
        const anniv = new Date(now.getFullYear(), jd.getMonth(), jd.getDate());
        const diff = Math.ceil((anniv.getTime()-now.getTime())/86400000);
        if (diff>=0 && diff<=30) {
          const years = now.getFullYear() - jd.getFullYear();
          upcomingWorkAnniversary.push({ employeeId:e.employeeId, fullName:e.fullName||e.employeeId, joiningDate:e.joiningDate, years });
        }
      }
    }
  }
  upcomingBirthday.sort((a,b)=> a.daysLeft-b.daysLeft);
  upcomingWorkAnniversary.sort((a,b)=> a.years-b.years);

  const branchBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  for (const e of employees as any[]) {
    const b = e.branch||'Unknown'; branchBreakdown[b]=(branchBreakdown[b]||0)+1;
    const st = (e.status||'ACTIVE'); statusBreakdown[st]=(statusBreakdown[st]||0)+1;
  }

  return {
    headcount, activeEmployees: active, attendanceRate, latePercent, absentPercent, leavePercent,
    payrollCost, departmentCost, newJoiners, resignedEmployees: resigned, probationEmployees: probation,
    upcomingConfirmation, upcomingBirthday: upcomingBirthday.slice(0,10), upcomingWorkAnniversary: upcomingWorkAnniversary.slice(0,10),
    branchBreakdown, statusBreakdown
  };
}
