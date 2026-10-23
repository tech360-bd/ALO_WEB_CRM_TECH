/**
 * Canonical Student Identity Service
 *
 * Provides:
 *   - isCanonicalStudentCode(value): validates AE-YYYYXXXXXX format
 *   - generateCanonicalStudentCode(): year-prefixed sequential code (AE-2025XXXXXX)
 *   - createCanonicalStudent(params): idempotent create / link by email
 *   - registerStudentAtomically(params): atomic User + Student creation in a transaction
 *
 * Notes:
 *   - Uses the existing Student model's `studentId` (String @unique) field to store the
 *     canonical code. Legacy "ALO-S-XXXXX" codes remain valid for older records.
 *   - Passwords are hashed with bcrypt (cost=12) — NEVER stored in plaintext.
 *   - P2002 unique constraint collisions on studentId are retried up to 5 times by
 *     re-generating the next sequential code.
 */

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createRegistrationLead, type RegistrationAttributionInput } from "@/lib/crm/registration-lead";
import { allocateIdentifier, allocateIdentifierCommitted } from "@/lib/identity/student-id";
import { Prisma } from "@prisma/client";

const CANONICAL_STUDENT_REGEX = /^AE-(\d{4})(\d{6})$/;
export const CONSENT_VERSION = "1.0";
const MAX_CODE_RETRIES = 5;

export function isCanonicalStudentCode(value: string): boolean {
  if (typeof value !== "string") return false;
  return CANONICAL_STUDENT_REGEX.test(value);
}

/**
 * Allocate a unique, year-scoped AE student code through the shared transactional identifier service.
 */
export async function generateCanonicalStudentCode(): Promise<string> {
  return allocateIdentifierCommitted('AE');
}

async function generateCanonicalStudentCodeTx(tx: Prisma.TransactionClient): Promise<string> {
  return allocateIdentifier(tx, 'AE');
}

export interface CreateCanonicalStudentParams {
  name: string;
  email: string;
  phone?: string;
  userId?: string;
  leadId?: string;
}

export type CreateCanonicalStudentResult =
  | { success: true; studentId: string; studentDbId: string; mode: "CREATED" | "LINKED" }
  | { success: false; error: string; errorCode: string };

/**
 * Create a canonical student record by email — idempotent.
 *
 * Behavior:
 *   - If no student exists with this email → generate canonical code + create.
 *   - If a student exists with this email but no userId → link it to the provided userId.
 *   - If a student exists with this email AND a different userId → return conflict.
 *   - If a student exists with this email AND the same userId → idempotent LINKED return.
 */
export async function createCanonicalStudent(
  params: CreateCanonicalStudentParams
): Promise<CreateCanonicalStudentResult> {
  const email = params.email.toLowerCase().trim();
  const fullName = params.name.trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(" ") || "";

  const existing = await db.student.findFirst({ where: { email } });

  if (existing) {
    if (params.userId && !existing.userId) {
      const updated = await db.student.update({
        where: { id: existing.id },
        data: { userId: params.userId },
      });
      return { success: true, studentId: updated.studentId, studentDbId: updated.id, mode: "LINKED" };
    }
    if (params.userId && existing.userId && existing.userId !== params.userId) {
      return {
        success: false,
        error: "Student record exists with a different owner",
        errorCode: "STUDENT_EXISTS_DIFFERENT_OWNER",
      };
    }
    return { success: true, studentId: existing.studentId, studentDbId: existing.id, mode: "LINKED" };
  }

  // Create with P2002 retry (max 5)
  for (let attempt = 1; attempt <= MAX_CODE_RETRIES; attempt++) {
    const studentCode = await generateCanonicalStudentCode();
    try {
      const created = await db.student.create({
        data: {
          studentId: studentCode,
          userId: params.userId,
          leadId: params.leadId,
          name: fullName,
          email,
          phone: params.phone || "",
        },
      });
      return { success: true, studentId: created.studentId, studentDbId: created.id, mode: "CREATED" };
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "P2002" && attempt < MAX_CODE_RETRIES) {
        // Unique collision on studentId — retry with next sequence
        continue;
      }
      throw err;
    }
  }

  return {
    success: false,
    error: "Could not allocate unique canonical student code after retries",
    errorCode: "INTERNAL_ERROR",
  };
}

export interface RegisterStudentParams {
  name: string;
  email: string;
  phone?: string;
  password: string;
  pendingVerification?: boolean;
  /**
   * Acquisition attribution captured on the public site, forwarded to the lead
   * created alongside the account (Google Free Stack).
   */
  attribution?: RegistrationAttributionInput | null;
}

export interface RegisterStudentResult {
  success: boolean;
  userId?: string;
  studentId?: string;
  studentDbId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Atomically register a Student user.
 *
 * Inside a single db.$transaction:
 *   1. Pre-check existing User by email (EMAIL_EXISTS).
 *   2. Pre-check existing Student by email — if userId is already set on it
 *      AND differs, return STUDENT_EXISTS_DIFFERENT_OWNER.
 *   3. bcrypt.hash(password, 12).
 *   4. Create User (role=STUDENT, status=ACTIVE).
 *   5. Generate a canonical student code with P2002 retry (max 5) only when
 *      no matching CRM Student record exists.
 *   6. Link User.id to an existing unowned Student row without discarding its
 *      business id or history; otherwise create a new Student row.
 *   7. On any error → transaction rolls back.
 *
 * Returns { success, userId, studentId, studentDbId } or
 *         { success: false, error, errorCode }.
 */
export async function registerStudentAtomically(
  params: RegisterStudentParams
): Promise<RegisterStudentResult> {
  const email = params.email.toLowerCase().trim();
  const fullName = params.name.trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(" ") || "";

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. User email uniqueness pre-check
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        throw Object.assign(new Error("Email already registered"), { code: "EMAIL_EXISTS" });
      }

      // 2. Existing Student record pre-check
      const existingStudent = await tx.student.findFirst({ where: { email } });
      if (existingStudent && (existingStudent.userId || params.pendingVerification)) {
        throw Object.assign(new Error("Student exists with a different owner"), {
          code: "STUDENT_EXISTS_DIFFERENT_OWNER",
        });
      }

      // 3. Hash password (cost=12)
      const passwordHash = await bcrypt.hash(params.password, 12);

      // 4. Create the unverified account in a non-authenticating state when
      // this transaction backs public self-registration.
      const pendingVerification = params.pendingVerification === true;
      const user = await tx.user.create({
        data: {
          email,
          name: fullName,
          phone: params.phone,
          passwordHash,
          role: "STUDENT",
          status: pendingVerification ? "PENDING" : "ACTIVE",
          emailVerified: !pendingVerification,
          mustChangePwd: false,
          permissions: JSON.stringify(["students.view_own"]),
        },
      });

      // 5 + 6. Keep one Student row per person. If a legacy CRM record exists,
      // attach the verified portal identity to it rather than creating a second
      // profile and deleting the old row (which would orphan its documents,
      // applications, payments, and timeline references).
      let studentRec: { id: string; studentId: string } | null = null;
      if (existingStudent) {
        studentRec = await tx.student.update({
          where: { id: existingStudent.id },
          data: {
            userId: user.id,
            status: pendingVerification ? "pending_verification" : "active",
          },
          select: { id: true, studentId: true },
        });
      } else {
        for (let attempt = 1; attempt <= MAX_CODE_RETRIES; attempt++) {
          const code = await generateCanonicalStudentCodeTx(tx);
          try {
            studentRec = await tx.student.create({
              data: {
                studentId: code,
                userId: user.id,
                name: fullName,
                email,
                phone: params.phone || "",
                status: pendingVerification ? "pending_verification" : "active",
              },
              select: { id: true, studentId: true },
            });
            break;
          } catch (err: unknown) {
            const e = err as { code?: string };
            if (e?.code === "P2002" && attempt < MAX_CODE_RETRIES) continue;
            throw err;
          }
        }
      }

      if (!studentRec) {
        throw Object.assign(new Error("Could not allocate canonical student code"), {
          code: "INTERNAL_ERROR",
        });
      }

      // Preserve legacy internal callers; public pending registration always
      // commits the acquisition record with its account, never best-effort.
      if (params.pendingVerification) {
        const crm = await createRegistrationLead(tx, { domain: 'user', userId: user.id,
          studentId: studentRec.studentId, name: fullName, email, phone: params.phone || '',
          attribution: params.attribution ?? null });
        await tx.student.update({ where: { id: studentRec.id }, data: {
          leadId: crm.leadId, counselorId: crm.counselorId,
          journeyStage: crm.counselorId ? 'assigned' : 'lead_created',
        } });
        await tx.studentNotification.create({ data: { studentId: studentRec.id, type: 'SYSTEM',
          title: 'Registration received', message: 'Verify your email before signing in. Your enquiry is recorded for counseling.', relatedId: crm.leadId } });
      }
      return { userId: user.id, studentId: studentRec.studentId, studentDbId: studentRec.id };
    });

    return { success: true, ...result };
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    const code = e?.code || "INTERNAL_ERROR";
    if (code === "EMAIL_EXISTS") {
      return { success: false, error: "Email already registered", errorCode: "EMAIL_EXISTS" };
    }
    if (code === "STUDENT_EXISTS_DIFFERENT_OWNER") {
      return {
        success: false,
        error: "Student exists with a different owner",
        errorCode: "STUDENT_EXISTS_DIFFERENT_OWNER",
      };
    }
    return {
      success: false,
      error: "Registration could not be completed",
      errorCode: "INTERNAL_ERROR",
    };
  }
}
