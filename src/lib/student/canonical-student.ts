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
import { Prisma } from "@prisma/client";

const CANONICAL_STUDENT_REGEX = /^AE-(\d{4})(\d{6})$/;
export const CONSENT_VERSION = "1.0";
const MAX_CODE_RETRIES = 5;

export function isCanonicalStudentCode(value: string): boolean {
  if (typeof value !== "string") return false;
  return CANONICAL_STUDENT_REGEX.test(value);
}

/**
 * Find the highest existing AE-{year}XXXXXX code for the current year
 * and return the next sequential code.
 */
export async function generateCanonicalStudentCode(): Promise<string> {
  return generateCanonicalStudentCodeTx(db);
}

async function generateCanonicalStudentCodeTx(
  tx: Prisma.TransactionClient | PrismaClient
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AE-${year}`;

  const students = await tx.student.findMany({
    where: { studentId: { startsWith: prefix } },
    select: { studentId: true },
  });

  let maxSeq = 0;
  for (const s of students) {
    const m = s.studentId.match(CANONICAL_STUDENT_REGEX);
    if (m && parseInt(m[2], 10) > maxSeq) {
      maxSeq = parseInt(m[2], 10);
    }
  }

  return `${prefix}${String(maxSeq + 1).padStart(6, "0")}`;
}

// PrismaClient alias for typing (avoids importing PrismaClient type explicitly)
type PrismaClient = typeof db;

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
          firstName,
          lastName,
          fullName,
          email,
          mobile: params.phone || "",
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
 *   5. Generate canonical student code with P2002 retry (max 5).
 *   6. Create Student record linked to User.id; if a legacy Student row
 *      existed without userId, its leadId is migrated and the duplicate
 *      is removed.
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
      if (existingStudent && existingStudent.userId) {
        throw Object.assign(new Error("Student exists with a different owner"), {
          code: "STUDENT_EXISTS_DIFFERENT_OWNER",
        });
      }

      // 3. Hash password (cost=12)
      const passwordHash = await bcrypt.hash(params.password, 12);

      // 4. Create User (role=STUDENT, status=ACTIVE)
      const user = await tx.user.create({
        data: {
          email,
          name: fullName,
          phone: params.phone,
          passwordHash,
          role: "STUDENT",
          status: "ACTIVE",
          mustChangePwd: false,
          permissions: JSON.stringify(["students.view_own"]),
        },
      });

      // 5 + 6. Generate canonical student code with P2002 retry inside the transaction
      let studentRec: { id: string; studentId: string } | null = null;
      for (let attempt = 1; attempt <= MAX_CODE_RETRIES; attempt++) {
        const code = await generateCanonicalStudentCodeTx(tx);
        try {
          studentRec = await tx.student.create({
            data: {
              studentId: code,
              userId: user.id,
              leadId: existingStudent?.leadId ?? null,
              firstName,
              lastName,
              fullName,
              email,
              mobile: params.phone || "",
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

      if (!studentRec) {
        throw Object.assign(new Error("Could not allocate canonical student code"), {
          code: "INTERNAL_ERROR",
        });
      }

      // If a legacy Student row (no userId) existed, migrate is already done above
      // (we copied its leadId onto the new record). Now delete the orphaned legacy row.
      if (existingStudent) {
        await tx.student.delete({ where: { id: existingStudent.id } }).catch(() => {});
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
      error: e?.message || "Internal error",
      errorCode: "INTERNAL_ERROR",
    };
  }
}
