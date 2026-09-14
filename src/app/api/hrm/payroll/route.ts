import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";
import { canManagePayroll, canViewSalaryDetails, isHR, isSuperAdmin, isFinance } from "@/lib/hrms/rbac";
import { calculatePayroll } from "@/lib/hrms/payroll";
import { createHrmNotification } from "@/lib/hrms/notifications";

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const monthYear = url.searchParams.get("monthYear") || url.searchParams.get("period") || new Date().toISOString().slice(0,7);
    const employeeId = url.searchParams.get("employeeId") || "";
    const view = url.searchParams.get("view") || "list"; // list, slip, run

    // Resolve own eid
    const hrSelf = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
    const ownEid = hrSelf?.employeeId || "";

    if (view === 'slip') {
      // Employee can view own final approved slip only; HR/Finance can view any
      let eid = employeeId || ownEid;
      const isOwner = eid === ownEid;
      const canViewDetails = canViewSalaryDetails(auth);
      if (!isOwner && !canViewDetails) return NextResponse.json({ success:false, error:"Access denied to salary details" }, { status:403 });

      const payroll = await (db as any).payroll.findFirst({ where:{ employeeId: eid, monthYear }}).catch(async()=>{
        return await (db as any).employeePayroll.findFirst({ where:{ employeeId: eid, monthYear }}).catch(()=>null);
      });
      if (!payroll) return NextResponse.json({ success:false, error:"Payroll not found for period" }, { status:404 });

      // Employee only sees final approved salary (status PAID/APPROVED); hide breakdown if not authorized
      if (isOwner && !canViewDetails && !['APPROVED','PAID','approved','paid'].includes(String(payroll.status).toUpperCase())) {
        return NextResponse.json({ success:false, error:"Salary not yet approved" }, { status:403 });
      }

      const items = await (db as any).employeePayrollItem.findMany({ where:{ payrollId: payroll.id }}).catch(()=>[]);
      const response: any = { ...payroll, items };
      if (isOwner && !canViewDetails) {
        // strip calculation details, return only final net + slip path
        return NextResponse.json({ success:true, data:{ monthYear: payroll.monthYear, netPay: payroll.netPay || payroll.netSalary, gross: payroll.totalEarnings || payroll.grossSalary, status: payroll.status, salarySlipPath: payroll.salarySlipPath||"", note:"Detailed breakdown visible only to HR/Finance" }});
      }
      return NextResponse.json({ success:true, data: response });
    }

    if (view === 'run') {
      if (!canManagePayroll(auth)) return NextResponse.json({ success:false, error:"Only HR/Finance can view payroll runs" }, { status:403 });
      const runs = await (db as any).hrmPayrollRun.findMany({ orderBy:{ monthYear:'desc' }, take:12 }).catch(async()=>{
        return await (db as any).employeePayroll.groupBy({ by:['monthYear'], _count:{ monthYear:true }, _sum:{ netSalary:true }}).catch(()=>[]);
      });
      return NextResponse.json({ success:true, data: runs });
    }

    // list payrolls for month
    let where: any = { monthYear };
    if (employeeId) where.employeeId = employeeId;
    else if (!canManagePayroll(auth)) where.employeeId = ownEid;

    const payrolls = await (db as any).payroll.findMany({ where, orderBy:{ employeeId:'asc' } }).catch(async()=>{
      return await (db as any).employeePayroll.findMany({ where, orderBy:{ employeeId:'asc' } }).catch(()=>[]);
    });

    // For employee view, strip details
    const isOwnerOnly = !canViewSalaryDetails(auth);
    if (isOwnerOnly) {
      const mapped = payrolls.map((p:any)=> ({ monthYear: p.monthYear, netPay: p.netPay||p.netSalary, status: p.status, employeeId: p.employeeId }));
      return NextResponse.json({ success:true, data: mapped });
    }
    return NextResponse.json({ success:true, data: payrolls });
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    if (!canManagePayroll(auth)) return NextResponse.json({ success:false, error:"Only HR/Finance can generate payroll" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { monthYear, employeeIds, bonusMap, loanMap, taxPercent, overtimeMap } = body;
    const period = monthYear || new Date().toISOString().slice(0,7);
    if (!period.match(/^\d{4}-\d{2}$/)) return NextResponse.json({ success:false, error:"monthYear YYYY-MM required" }, { status:400 });

    // Get employees
    let employees: any[] = [];
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length) {
      employees = await (db as any).employeeHR.findMany({ where:{ employeeId:{ in: employeeIds }, isDeleted:false }}).catch(()=>[]);
    } else {
      employees = await (db as any).employeeHR.findMany({ where:{ isDeleted:false, status:'ACTIVE' }}).catch(()=>[]);
      if (!employees.length) employees = await (db as any).employee.findMany({}).catch(()=>[]);
    }

    let totalGross=0, totalNet=0, totalDed=0, created=0;
    const results: any[] = [];

    for (const emp of employees) {
      const eid = emp.employeeId || emp.id;
      // Fetch attendance + leave for month
      const attend = await (db as any).employeeAttendance.findMany({ where:{ employeeId: eid, date:{ startsWith: period } }}).catch(()=>[]);
      const leaves = await (db as any).leaveRequest.findMany({ where:{ employeeId: eid, status:'APPROVED', startDate:{ startsWith: period } }}).catch(()=>[]);
      const absentDays = attend.filter((a:any)=> (a.status||'').toLowerCase()==='absent').length;
      const lateDays = attend.filter((a:any)=> (a.status||'').toLowerCase()==='late').length;
      const lwp = await (db as any).employeeLeaveBalance.findUnique({ where:{ employeeId: eid }}).catch(()=>null);
      const lwpDays = 0; // could compute from leave without pay
      const bonus = (bonusMap && bonusMap[eid]) || 0;
      const overtimeHours = (overtimeMap && overtimeMap[eid]) || 0;
      const basic = Number(emp.baseSalary|| emp.baseSalary || 0) || Number(emp.grossSalary? emp.grossSalary*0.6 : 30000);
      const allowances = Number(emp.allowances||0) || Number(emp.grossSalary? emp.grossSalary*0.4 : 12000);
      const calc = calculatePayroll({
        basicSalary: basic,
        allowances,
        bonus,
        overtimeHours,
        overtimeRate: 500,
        loanDeduction: (loanMap && loanMap[eid]) || 0,
        taxPercent: taxPercent||0,
        pfRate: Number(emp.pfRate||8),
        absentDays, lateDays, leaveWithoutPayDays: lwpDays, workingDaysInMonth: 30
      });

      totalGross += calc.totalEarnings;
      totalNet += calc.netSalary;
      totalDed += calc.totalDeductions;

      // Upsert payroll record
      let payroll;
      const existing = await (db as any).payroll.findFirst({ where:{ employeeId: eid, monthYear: period }}).catch(()=>null);
      if (existing) {
        payroll = await (db as any).payroll.update({ where:{ id: existing.id }, data:{
          basicSalary: basic, allowances, bonus, overtime: overtimeHours*500, totalEarnings: calc.totalEarnings, totalDeductions: calc.totalDeductions, netPay: calc.netSalary, status:'DRAFT'
        }});
      } else {
        payroll = await (db as any).payroll.create({ data:{
          employeeId: eid, monthYear: period, basicSalary: basic, allowances, bonus, overtime: overtimeHours*500, totalEarnings: calc.totalEarnings, totalDeductions: calc.totalDeductions, netPay: calc.netSalary, status:'DRAFT', loanDeduction: (loanMap&&loanMap[eid])||0
        }}).catch(async()=>{
          return await (db as any).employeePayroll.create({ data:{ employeeId: eid, monthYear: period, period, basicSalary: basic, allowances, bonus, overtime: overtimeHours*500, grossSalary: calc.totalEarnings, netSalary: calc.netSalary, status:'draft', preparedBy: auth.userId }});
        });
      }

      // Create payroll items breakdown
      for (const br of calc.breakdown) {
        await (db as any).employeePayrollItem.create({ data:{ payrollId: payroll.id, itemType: br.type, label: br.label, amount: br.amount, employeeId: eid }}).catch(()=>{});
      }

      results.push({ employeeId: eid, netPay: calc.netSalary, status: payroll.status });
      created++;
    }

    // Create payroll run summary
    await (db as any).hrmPayrollRun.upsert({ where:{ monthYear: period }, update:{ totalEmployees: created, totalGross, totalNet, totalDeductions: totalDed, status:'draft', preparedBy: auth.userId }, create:{ monthYear: period, totalEmployees: created, totalGross, totalNet, totalDeductions: totalDed, status:'draft', preparedBy: auth.userId }}).catch(()=>{});

    await logHrmAudit({ actor: auth, action:'GENERATE_PAYROLL', entityType:'Payroll', entityId: period, newValue:{ period, totalGross, totalNet, count: created }});

    // Notify: payroll ready
    for (const r of results) {
      await createHrmNotification({ recipientId: r.employeeId, title:'Payroll generated', message:`Payroll for ${period} is ready (${r.status})`, category:'PAYROLL_READY', actionUrl:'/crm/hrm/payroll' }).catch(()=>{});
    }

    return NextResponse.json({ success:true, data:{ period, created, totalGross, totalNet, totalDeductions: totalDed, payrolls: results }});
  })(req);
}

export async function PATCH(req: Request) {
  return withAuth(async (request, auth) => {
    if (!canManagePayroll(auth)) return NextResponse.json({ success:false, error:"Forbidden" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { id, action } = body; // approve, pay, review
    if (!id || !action) return NextResponse.json({ success:false, error:"id and action required" }, { status:400 });
    const payroll = await (db as any).payroll.findUnique({ where:{ id }}).catch(async()=> await (db as any).employeePayroll.findUnique({ where:{ id }}).catch(()=>null));
    if (!payroll) return NextResponse.json({ success:false, error:"Not found" }, { status:404 });

    const map: Record<string,string> = { approve:'APPROVED', review:'REVIEWED', pay:'PAID', draft:'DRAFT' };
    const newStatus = map[String(action).toLowerCase()] || 'DRAFT';
    let updated;
    try {
      updated = await (db as any).payroll.update({ where:{ id }, data:{ status: newStatus, approvedBy: auth.userId, ...(newStatus==='PAID'? { paidAt: new Date() }: {}) }});
    } catch {
      updated = await (db as any).employeePayroll.update({ where:{ id }, data:{ status: newStatus.toLowerCase(), approvedBy: auth.userId, ...(newStatus==='PAID'? { paidAt: new Date() }: {}) }});
    }
    await logHrmAudit({ actor: auth, action:`PAYROLL_${newStatus}`, entityType:'Payroll', entityId: id, oldValue: payroll, newValue: updated });
    if (newStatus==='PAID') {
      await createHrmNotification({ recipientId: payroll.employeeId, title:'Salary paid', message:`Salary for ${payroll.monthYear} has been paid`, category:'SALARY_PAID', actionUrl:'/crm/hrm/payroll' });
    } else if (newStatus==='APPROVED') {
      await createHrmNotification({ recipientId: payroll.employeeId, title:'Salary approved', message:`Salary slip for ${payroll.monthYear} approved`, category:'PAYROLL_READY', actionUrl:'/crm/hrm/payroll' });
    }
    return NextResponse.json({ success:true, data: updated });
  })(req);
}
