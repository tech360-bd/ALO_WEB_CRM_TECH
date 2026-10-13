import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canViewEmployeePrivateProfile, logSensitiveAccess } from "@/lib/access-control";

// GET — single employee with full profile (privacy-checked)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewerId = req.nextUrl.searchParams.get("viewerId");

  const employee = await db.employeeHR.findUnique({
    where: { id },
    include: {
      department: true,
      office: true,
      profile: true,
      education: true,
      emergencyContacts: true,
      salary: true,
      documents: true,
    },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Privacy check: can viewer see private profile?
  const canViewPrivate = viewerId ? await canViewEmployeePrivateProfile(viewerId, id) : false;

  // Log sensitive access if viewing private data
  if (canViewPrivate && viewerId) {
    await logSensitiveAccess(viewerId, "SALARY_ACCESS", "Employee", id);
  }

  // Strip private data if not authorized
  const sanitized = canViewPrivate ? employee : {
    ...employee,
    salary: null,
    emergencyContacts: [],
    documents: employee.documents?.map((d) => ({ ...d, filePath: null })) || [],
    profile: employee.profile ? {
      ...employee.profile,
      presentAddress: null,
      permanentAddress: null,
    } : null,
  };

  return NextResponse.json({
    employee: sanitized,
    canViewPrivate,
    privacyNote: canViewPrivate
      ? "You have full access to this employee's private profile. This access is audit-logged."
      : "Private profile data (salary, emergency contacts, documents, address) is hidden. Only the employee themselves, Super Admin, Chairman, and HR Manager with permission can view.",
  });
}

// PATCH — update employee (profile status, designation, status, etc.)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { profileStatus, status, designation, departmentId, officeId, role, updatedById } = body;

  const employee = await db.employeeHR.update({
    where: { id },
    data: {
      ...(profileStatus && { profileStatus }),
      ...(status && { status }),
      ...(designation && { designation }),
      ...(departmentId && { departmentId }),
      ...(officeId && { officeId }),
      ...(role && { role }),
    },
  });

  await db.auditLog.create({
    data: {
      userId: updatedById,
      action: "ROLE_CHANGE",
      resource: "Employee",
      resourceId: id,
      details: JSON.stringify({ profileStatus, status, designation }),
    },
  });

  return NextResponse.json({ employee });
}
