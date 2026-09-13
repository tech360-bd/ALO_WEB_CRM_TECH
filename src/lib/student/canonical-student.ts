/**
 * Canonical Student Identity Service
 *
 * Single source of truth for student identity at ALO Education.
 *
 * Canonical format:
 *   Student.id        = CUID (database primary key)
 *   Student.studentId = AE-YYYYXXXXXX  (human-readable business code)
 *
 * All student workflows MUST use this canonical identity.
 * NEVER create independent student IDs outside this module.
 *
 * Atomicity: User + Student are created in a single db.$transaction.
 * Collisions: P2002 (unique constraint) is retried up to 5 times.
 */

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────

const CANONICAL_PREFIX = "AE";
const MAX_P2002_RETRIES = 5;

// ─── Validation ───────────────────────────────────────────────────

/**
 * Returns true iff `value` matches the canonical student code pattern
 * AE-YYYYXXXXXX where YYYY = 4-digit year and XXXXXX = 6-digit serial.
 */
export function isCanonicalStudentCode(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /^AE-\d{4}\d{6}$/.test(value.trim().toUpperCase());
}

// ─── Code Generation ──────────────────────────────────────────────

/**
 * Generate the next canonical student code in the AE-YYYYXXXXXX format.
 *
 * Strategy:
 *   1. Use the current 4-digit year.
 *   2. Count existing students whose studentId starts with `AE-{year}`.
 *   3. Serial = count + 1, zero-padded to 6 digits.
 *
 * This is best-effort; uniqueness MUST be enforced at the DB layer via
 * the @unique constraint on Student.studentId. Callers must handle P2002.
 */
export async function generateCanonicalStudentCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${CANONICAL_PREFIX}-${year}`;

  const existingCount = await db.student.count({
    where: { studentId: { startsWith: prefix } },
  });

  const serial = (existingCount + 1).toString().padStart(6, "0");
  return `${prefix}${serial}`;
}

// ─── Atomic Creation ──────────────────────────────────────────────

export interface CreateCanonicalStudentParams {
  /** Full legal name */
  fullName: string;
  /** Lowercased login email (unique) */
  email: string;
  /** Mobile phone (required for student record) */
  phone: string;
  /** Plaintext password — will be bcrypt-hashed, NEVER stored as plaintext */
  password: string;
  /** Optional first/last name split for the student record */
  firstName?: string;
  lastName?: string;
  /** Originating lead ID (if converted from a lead) */
  leadId?: string;
  /** Assigning counselor (if any) */
  counselorId?: string;
  /** Partner attribution (if registered via a partner) */
  partnerId?: string;
}

export interface CanonicalStudentResult {
  userId: string;
  studentId: string; // DB primary key (CUID)
  studentCode: string; // AE-YYYYXXXXXX
  email: string;
  fullName: string;
}

/**
 * Create the canonical User + Student pair atomically.
 *
 * Guarantees:
 *   - Single db.$transaction — User + Student succeed together or fail together.
 *   - Password hashed with bcrypt (12 rounds). NEVER plaintext.
 *   - Student.studentId = AE-YYYYXXXXXX canonical format.
 *   - P2002 (unique constraint collision) retried up to MAX_P2002_RETRIES times
 *     with a fresh serial each retry.
 *   - Existing legacy students are NOT touched.
 *
 * Throws on irrecoverable failure (e.g. email already exists, max retries exceeded).
 */
export async function createCanonicalStudent(
  params: CreateCanonicalStudentParams
): Promise<CanonicalStudentResult> {
  const {
    fullName,
    email,
    phone,
    password,
    firstName,
    lastName,
    leadId,
    counselorId,
    partnerId,
  } = params;

  if (!fullName || !email || !password) {
    throw new Error("createCanonicalStudent: fullName, email, password are required");
  }
  if (!phone) {
    throw new Error("createCanonicalStudent: phone is required for student record");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Pre-check: reject duplicate email early to give a clear error
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new Error("createCanonicalStudent: an account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Split name if not provided
  const fName = firstName?.trim() || fullName.split(" ")[0] || fullName;
  const lName = lastName?.trim() || fullName.split(" ").slice(1).join(" ") || "";

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_P2002_RETRIES) {
    attempt++;
    const studentCode = await generateCanonicalStudentCode();

    try {
      const result = await db.$transaction(async (tx) => {
        // 1. Create the auth User (STUDENT role, ACTIVE status)
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: fullName,
            phone,
            passwordHash,
            role: "STUDENT",
            status: "ACTIVE",
            mustChangePwd: false,
            permissions: JSON.stringify(["students.view_own"]),
            partnerId: partnerId || null,
          },
        });

        // 2. Create the canonical Student record linked to the User
        const student = await tx.student.create({
          data: {
            studentId: studentCode,
            userId: user.id,
            leadId: leadId || null,
            firstName: fName,
            lastName: lName,
            fullName,
            email: normalizedEmail,
            mobile: phone,
            counselorId: counselorId || null,
            partnerId: partnerId || null,
            status: "ACTIVE",
            profileCompletion: 10,
          },
        });

        return { user, student };
      });

      return {
        userId: result.user.id,
        studentId: result.student.id,
        studentCode: result.student.studentId,
        email: result.user.email,
        fullName: result.user.name,
      };
    } catch (err: unknown) {
      lastError = err;
      // Prisma unique-constraint violation code
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Could be either email collision (already rejected above — shouldn't happen)
        // or studentId serial collision. Retry with a fresh serial.
        continue;
      }
      // Any other error: abort immediately, do not retry
      throw err;
    }
  }

  throw new Error(
    `createCanonicalStudent: failed after ${MAX_P2002_RETRIES} attempts (P2002 collision). Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

// ─── Registration Entry-Point ─────────────────────────────────────

export interface RegisterStudentAtomicallyInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterStudentAtomicallyResult extends CanonicalStudentResult {
  otp?: string; // generated by caller (register route), not here
}

/**
 * High-level registration entry-point used by /api/auth/register for STUDENT role.
 *
 * Wraps createCanonicalStudent with sensible defaults (no lead, no counselor).
 * The route is responsible for OTP generation & audit logging — this function
 * only handles the atomic User+Student creation.
 */
export async function registerStudentAtomically(
  input: RegisterStudentAtomicallyInput
): Promise<RegisterStudentAtomicallyResult> {
  if (!input.name || !input.email || !input.password) {
    throw new Error("registerStudentAtomically: name, email, password are required");
  }
  if (input.password.length < 6) {
    throw new Error("registerStudentAtomically: password must be at least 6 characters");
  }

  const result = await createCanonicalStudent({
    fullName: input.name,
    email: input.email,
    phone: input.phone || "N/A",
    password: input.password,
  });

  return result;
}
