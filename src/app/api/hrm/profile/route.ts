import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { canViewEmployeeProfile, isHR, isSuperAdmin } from "@/lib/hrms/rbac";
import { decryptSensitive, encryptSensitive } from "@/lib/hrms/encryption";
import { logHrmAudit } from "@/lib/hrms/audit";

// GET: own profile (employee) or any profile if HR/Super Admin. ?userId=&employeeId=
export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("userId") || auth.userId;
    const employeeId = url.searchParams.get("employeeId") || "";
    // student dashboard must never reach here — block student role
    if (auth.roles.includes("student") || auth.userType === "STUDENT") {
      return NextResponse.json({ success:false, error:"HR module not available for Student portal" }, { status:403 });
    }
    const canView = canViewEmployeeProfile(auth, targetUserId, employeeId);
    if (!canView) return NextResponse.json({ success:false, error:"Access denied to employee profile" }, { status:403 });

    let hr = null as any;
    if (employeeId) hr = await (db as any).employeeHR.findUnique({ where:{ employeeId } }).catch(()=>null);
    if (!hr) hr = await (db as any).employeeHR.findUnique({ where:{ userId: targetUserId } }).catch(()=>null);
    if (!hr) hr = await (db as any).employeeHR.findFirst({ where:{ userId: targetUserId } }).catch(()=>null);

    // fallback to Employee + EmployeeProfile if no HR record
    if (!hr) {
      const emp = await (db as any).employee.findUnique({ where:{ userId: targetUserId } }).catch(()=>null);
      const profile = await (db as any).employeeProfile.findUnique({ where:{ userId: targetUserId } }).catch(()=>null);
      return NextResponse.json({ success:true, data:{ hr, employee: emp, profile, decrypted:false }, canEdit: isHR(auth)||isSuperAdmin(auth) });
    }

    // Decrypt sensitive only for authorized (HR/Finance/SuperAdmin or owner with limited? — per spec only HR/SuperAdmin see full, employee sees own decrypted)
    const isOwner = auth.userId === targetUserId;
    const canSeeSensitive = isHR(auth) || isSuperAdmin(auth) || isOwner;
    let decrypted: any = hr;
    if (canSeeSensitive) decrypted = decryptSensitive(hr);

    // also fetch education, experience, skills, languages
    const [education, emergency, experience, skills, languages] = await Promise.all([
      (db as any).employeeEducation.findMany({ where:{ employeeId: hr.employeeId } }).catch(()=>[]),
      (db as any).employeeEmergencyContact.findMany({ where:{ employeeId: hr.employeeId } }).catch(()=>[]),
      (db as any).hrmEmployeeExperience.findMany({ where:{ employeeId: hr.employeeId } }).catch(()=>[]),
      (db as any).hrmEmployeeSkill.findMany({ where:{ employeeId: hr.employeeId } }).catch(()=>[]),
      (db as any).hrmEmployeeLanguage.findMany({ where:{ employeeId: hr.employeeId } }).catch(()=>[]),
    ]);

    await logHrmAudit({ actor: auth, action:'VIEW_PROFILE', entityType:'EmployeeHR', entityId: hr.id, employeeId: hr.employeeId, ip: request.headers.get('x-forwarded-for')||'' });

    return NextResponse.json({ success:true, data: { ...decrypted, education, emergencyContacts: emergency, experience, skills, languages }, canEdit: isHR(auth)||isSuperAdmin(auth), isOwner });
  })(req);
}

// PATCH: HR / Super Admin only can update private profile; employee cannot edit sensitive fields via this route
export async function PATCH(req: Request) {
  return withAuth(async (request, auth) => {
    if (auth.roles.includes("student")) return NextResponse.json({ success:false, error:"Forbidden" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const targetUserId = body.userId || auth.userId;
    const isOwner = auth.userId === targetUserId;
    // Only HR and Super Admin can edit
    if (!isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Only HR and Super Admin can update employee profile" }, { status:403 });

    let existing = await (db as any).employeeHR.findUnique({ where:{ userId: targetUserId } }).catch(()=>null);
    if (!existing && body.employeeId) existing = await (db as any).employeeHR.findUnique({ where:{ employeeId: body.employeeId } }).catch(()=>null);
    if (!existing) return NextResponse.json({ success:false, error:"Employee HR profile not found" }, { status:404 });

    const before = { ...existing };
    // Encrypt sensitive before save
    const toSave = encryptSensitive({
      fullName: body.fullName ?? existing.fullName,
      fatherName: body.fatherName ?? existing.fatherName,
      motherName: body.motherName ?? existing.motherName,
      gender: body.gender ?? existing.gender,
      dob: body.dob ?? existing.dob,
      nationality: body.nationality ?? existing.nationality,
      religion: body.religion ?? existing.religion,
      bloodGroup: body.bloodGroup ?? existing.bloodGroup,
      maritalStatus: body.maritalStatus ?? existing.maritalStatus,
      nidNumber: body.nidNumber ?? existing.nidNumber,
      passportNumber: body.passportNumber ?? existing.passportNumber,
      passportExpiry: body.passportExpiry ?? existing.passportExpiry,
      tinNumber: body.tinNumber ?? existing.tinNumber,
      drivingLicense: body.drivingLicense ?? existing.drivingLicense,
      personalEmail: body.personalEmail ?? existing.personalEmail,
      phone: body.phone ?? existing.phone,
      presentAddress: body.presentAddress ?? existing.presentAddress,
      permanentAddress: body.permanentAddress ?? existing.permanentAddress,
      emergencyContactName: body.emergencyContactName ?? existing.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone ?? existing.emergencyContactPhone,
      emergencyRelation: body.emergencyRelation ?? existing.emergencyRelation,
      bankName: body.bankName ?? existing.bankName,
      bankAccount: body.bankAccount ?? existing.bankAccount,
      bankBranch: body.bankBranch ?? existing.bankBranch,
      bankRouting: body.bankRouting ?? existing.bankRouting,
      mobileBankingType: body.mobileBankingType ?? existing.mobileBankingType,
      mobileBankingNumber: body.mobileBankingNumber ?? existing.mobileBankingNumber,
      branch: body.branch ?? existing.branch,
      officeId: body.officeId ?? existing.officeId,
      department: body.department ?? existing.department,
      designation: body.designation ?? existing.designation,
      employmentType: body.employmentType ?? existing.employmentType,
      employeeType: body.employeeType ?? existing.employeeType,
      employmentStatus: body.employmentStatus ?? existing.employmentStatus,
      status: body.status ?? existing.status,
      joiningDate: body.joiningDate ?? existing.joiningDate,
      confirmationDate: body.confirmationDate ?? existing.confirmationDate,
      probationEndDate: body.probationEndDate ?? existing.probationEndDate,
      salaryGrade: body.salaryGrade ?? existing.salaryGrade,
      grossSalary: body.grossSalary ?? existing.grossSalary,
      baseSalary: body.baseSalary ?? existing.baseSalary,
      allowances: body.allowances ?? existing.allowances,
      taxDeduction: body.taxDeduction ?? existing.taxDeduction,
      pfRate: body.pfRate ?? existing.pfRate,
      insurance: body.insurance ?? existing.insurance,
      workingHours: body.workingHours ?? existing.workingHours,
      shift: body.shift ?? existing.shift,
      reportingManagerId: body.reportingManagerId ?? existing.reportingManagerId,
    });

    const updated = await (db as any).employeeHR.update({ where:{ id: existing.id }, data: { ...toSave, version: { increment:1 } } }).catch((e:any)=> { throw e; });

    await logHrmAudit({ actor: auth, action:'UPDATE_PROFILE', entityType:'EmployeeHR', entityId: updated.id, employeeId: updated.employeeId, oldValue: before, newValue: toSave });

    return NextResponse.json({ success:true, data: decryptSensitive(updated) });
  })(req);
}
