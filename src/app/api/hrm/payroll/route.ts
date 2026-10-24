import { NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { writeHrmAudit } from "@/lib/transactional-audit";
import { canManagePayroll, isFinance, isHR, isSuperAdmin } from "@/lib/hrms/rbac";
import { createHrmNotification } from "@/lib/hrms/notifications";
import {
  assertMakerChecker,
  assertPayrollPeriod,
  assertPayrollTransition,
  buildPayrollItems,
  PayrollValidationError,
  validateSalaryRecord,
} from "@/lib/hrms/payroll-controls";

function canApproveOrPay(auth: AuthContext): boolean {
  return isSuperAdmin(auth) || isFinance(auth) || isHR(auth);
}

function errorResponse(error: unknown) {
  if (error instanceof PayrollValidationError) {
    const status = error.code === "DUPLICATE_RUN" ? 409 : error.code === "MAKER_CHECKER" ? 403 : 422;
    return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
  }
  return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Payroll operation failed" }, { status: 500 });
}

async function listPayroll(request: Request, auth: AuthContext) {
  const url = new URL(request.url);
  const period = assertPayrollPeriod(url.searchParams.get("monthYear") || url.searchParams.get("period") || new Date().toISOString().slice(0, 7));
  const employeeId = url.searchParams.get("employeeId");
  const view = url.searchParams.get("view") || "list";
  const canViewAll = isSuperAdmin(auth) || auth.permissions?.includes("employee.fields.salary.view_all") === true;

  if (view === "run") {
    if (!canManagePayroll(auth)) return NextResponse.json({ success: false, error: "Only HR/Finance can view payroll runs" }, { status: 403 });
    const run = await (db as any).hrmPayrollRun.findUnique({ where: { monthYear: period } });
    return NextResponse.json({ success: true, data: run ? [run] : [] });
  }

  if (employeeId && !canViewAll) {
    const employee = await (db as any).employee.findUnique({ where: { id: employeeId }, select: { userId: true } });
    if (!employee || employee.userId !== auth.userId) {
      return NextResponse.json({ success: false, error: "Access denied to salary details" }, { status: 403 });
    }
  }

  const where: Record<string, unknown> = { ...(!canViewAll ? { status: { in: ["approved", "paid"] } } : {}), period, ...(employeeId ? { employeeId } : {}) };
  if (!canViewAll && !employeeId) {
    const ownEmployee = await (db as any).employee.findFirst({ where: { userId: auth.userId }, select: { id: true } });
    if (!ownEmployee) return NextResponse.json({ success: true, data: [] });
    where.employeeId = ownEmployee.id;
  }

  const payrolls = await (db as any).employeePayroll.findMany({
    where,
    orderBy: { employeeId: "asc" },
    include: { items: true },
  });

  await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'SALARY_VIEWED', entityType: 'EmployeePayroll', entityId: employeeId || auth.userId,
    metadata: JSON.stringify({ effectiveUserId: auth.userId, period, actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole }) } });
  if (!canViewAll) {
    const visible = payrolls.map((payroll: any) => ({ id: payroll.id, period: payroll.period, employeeId: payroll.employeeId, netSalary: payroll.netSalary, status: payroll.status, paidAt: payroll.paidAt }));
    return NextResponse.json({ success: true, data: view === 'slip' ? visible[0] || null : visible });
  }
  return NextResponse.json({ success: true, data: payrolls });
}

async function generatePayroll(request: Request, auth: AuthContext) {
  if (!canManagePayroll(auth)) return NextResponse.json({ success: false, error: "Only HR/Finance can generate payroll" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const requestedIds = Array.isArray(body.employeeIds) ? body.employeeIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0) : [];

  try {
    const period = assertPayrollPeriod(body.monthYear || body.period || "");
    const result = await (db as any).$transaction(async (tx: any) => {
      // HrmPayrollRun has a unique monthYear. The preflight makes the error
      // explicit; the unique constraint remains the final concurrency guard.
      const existingRun = await tx.hrmPayrollRun.findUnique({ where: { monthYear: period } });
      if (existingRun) {
        throw new PayrollValidationError("DUPLICATE_RUN", `Payroll for ${period} already exists`);
      }

      const employees = await tx.employee.findMany({
        where: requestedIds.length ? { id: { in: requestedIds }, status: "active" } : { status: "active" },
        select: { id: true, employeeId: true, name: true },
      });
      const salaries = new Map<string, any>();
      for (const employee of employees) {
        const salary = await tx.employeeSalary.findFirst({ where: { employeeId: employee.id }, orderBy: { effectiveFrom: "desc" } });
        salaries.set(employee.id, validateSalaryRecord(salary, employee.id));
      }
      const built = buildPayrollItems(employees, salaries);

      const run = await tx.hrmPayrollRun.create({
        data: {
          monthYear: period,
          totalEmployees: built.items.length,
          totalGross: built.totalGross,
          totalDeductions: built.totalDeduction,
          totalNet: built.totalNet,
          status: "draft",
          preparedBy: auth.userId,
        },
      });

      for (const item of built.items) {
        const payroll = await tx.employeePayroll.create({
          data: {
            employeeId: item.employeeId,
            period,
            monthYear: period,
            basicSalary: item.basicSalary,
            allowances: item.allowances,
            taxDeduction: item.tax,
            grossSalary: item.netSalary + item.tax,
            netSalary: item.netSalary,
            status: "draft",
            preparedBy: auth.userId,
          },
        });
        await tx.employeePayrollItem.create({
          data: {
            payrollId: payroll.id,
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            itemType: "earning",
            label: `${item.employeeName} — ${period} salary`,
            amount: item.netSalary,
            basicSalary: item.basicSalary,
            allowances: item.allowances,
            tax: item.tax,
            netSalary: item.netSalary,
            status: "draft",
          },
        });
      }
      await writeHrmAudit(tx, auth, "GENERATE_PAYROLL", "HrmPayrollRun", run.id, run, request);
      return run;
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ success: true, data: { period, created: result.totalEmployees, totalGross: result.totalGross, totalNet: result.totalNet, totalDeductions: result.totalDeductions, run: result } });
  } catch (error) {
    return errorResponse(error);
  }
}

async function updatePayroll(request: Request, auth: AuthContext) {
  if (!canApproveOrPay(auth)) return NextResponse.json({ success: false, error: "HR/Finance approval required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const action = String(body.action || "").toLowerCase() as "review" | "approve" | "pay";
  if (!id || !["review", "approve", "pay"].includes(action)) {
    return NextResponse.json({ success: false, error: "id and action (review, approve, pay) required" }, { status: 400 });
  }

  try {
    const result = await (db as any).$transaction(async (tx: any) => {
      const item = await tx.employeePayroll.findUnique({ where: { id } });
      if (!item) throw new PayrollValidationError("DUPLICATE_RUN", "Payroll not found");
      const run = await tx.hrmPayrollRun.findUnique({ where: { monthYear: item.period } });
      if (!run) throw new PayrollValidationError("DUPLICATE_RUN", "Payroll run not found");
      const nextStatus = assertPayrollTransition(run.status, action);
      assertMakerChecker(auth.userId, run.preparedBy);

      const updatedRun = await tx.hrmPayrollRun.update({
        where: { id: run.id },
        data: {
          status: nextStatus,
          ...(action === "review" ? { reviewedBy: auth.userId } : {}),
          ...(action === "approve" ? { approvedBy: auth.userId } : {}),
          ...(action === "pay" ? { paidAt: new Date() } : {}),
        },
      });
      await tx.employeePayroll.updateMany({
        where: { period: item.period },
        data: {
          status: nextStatus,
          ...(action === "review" ? { reviewedBy: auth.userId } : {}),
          ...(action === "approve" ? { approvedBy: auth.userId } : {}),
          ...(action === "pay" ? { paidAt: new Date() } : {}),
        },
      });
      await writeHrmAudit(tx, auth, `PAYROLL_${action.toUpperCase()}`, "HrmPayrollRun", updatedRun.id, updatedRun, request);
      return updatedRun;
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try { return await listPayroll(req, auth); } catch (error) { return errorResponse(error); }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => generatePayroll(req, auth))(request);
}

export async function PATCH(request: Request) {
  return withAuth(async (req, auth) => updatePayroll(req, auth))(request);
}
