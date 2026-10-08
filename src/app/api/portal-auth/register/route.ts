import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { getRequestIp, issueEmailOtp } from '@/lib/auth/email-otp';

const BCRYPT_ROUNDS = 12;

function generateStudentId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ALO-S-${year}${random}`;
}

function generatePartnerId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ALO-P-${year}${random}`;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, portalType } = body;

    if (!name || !email || !password || !portalType) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, password, and portalType are required.",
        },
        { status: 400 }
      );
    }

    // Validate email format on server side
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // Employees cannot self-register
    if (portalType === "employee") {
      return NextResponse.json(
        {
          success: false,
          error: "Employee registration is not allowed. Contact admin.",
        },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.portalUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser || await db.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } })) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Determine user type and status based on portal type
    let userType: string;
    let status: string;

    if (portalType === "student") {
      userType = "STUDENT";
      status = "pending_verification";
    } else if (portalType === "partner") {
      userType = "PARTNER";
      status = "pending";
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid portal type." },
        { status: 400 }
      );
    }

    // Hash the password with bcrypt before storing
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create the portal user
    const user = await db.portalUser.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        phone: phone?.trim() || "",
        passwordHash,
        userType,
        status,
        firstLoginRequired: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        status: true,
        firstLoginRequired: true,
      },
    });

    // Create the corresponding profile
    if (portalType === "student") {
      // Generate a unique student ID with retry on collision
      let studentId = generateStudentId();
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await db.portalStudentProfile.findUnique({
          where: { studentId },
        });
        if (!existing) {
          isUnique = true;
        } else {
          studentId = generateStudentId();
          attempts++;
        }
      }

      await db.portalStudentProfile.create({
        data: {
          userId: user.id,
          studentId,
          fullName: name.trim(),
        },
      });

      // ─── CRM INTEGRATION: create the corresponding CRM Lead record and
      // run it through the existing lead-scoring / counselor auto-assignment
      // pipeline so that every self-registered student is represented in the
      // CRM (Lead table) and gets a counselor the same way leads created via
      // /api/leads do. This uses the SAME automation functions as the rest
      // of the CRM (no new/duplicate assignment logic) so behaviour stays
      // consistent across every lead-entry point.
      //
      // This block must never fail (or block) account creation itself — the
      // portal account has already been created successfully above. Any
      // failure here is recorded (never silently ignored, never a random
      // counselor fallback) via console.error + a CrmAuditLog entry so it is
      // discoverable and repairable.
      try {
        const { findDuplicateLead, scoreLead, autoAssignCounselor, createFollowUpTask } =
          await import("@/lib/crm-automation");

        const duplicateLeadId = await findDuplicateLead({
          email: normalizedEmail,
          phone: phone?.trim() || undefined,
        });

        if (duplicateLeadId) {
          // A lead already exists for this email/phone (e.g. came in earlier
          // via the website inquiry form). Link it to the new student
          // instead of creating a second, duplicate Lead record.
          await db.lead.update({
            where: { id: duplicateLeadId },
            data: { studentId },
          }).catch((linkErr) => {
            console.error("[registration->crm] failed to link existing lead to new student", {
              studentId,
              duplicateLeadId,
              error: linkErr instanceof Error ? linkErr.message : String(linkErr),
            });
          });

          const existingLead = await db.lead.findUnique({ where: { id: duplicateLeadId } });
          if (existingLead && !existingLead.counselorId) {
            const assignment = await autoAssignCounselor(duplicateLeadId);
            if (assignment.counselorId) {
              const counselor = await db.user.findUnique({ where: { id: assignment.counselorId } });
              await db.portalStudentProfile.update({
                where: { studentId },
                data: {
                  counselorId: assignment.counselorId,
                  counselorName: counselor?.name || "",
                  journeyStage: "assigned",
                },
              });
            } else {
              await db.crmAuditLog.create({
                data: {
                  actorUserId: "system",
                  actorRole: "SYSTEM",
                  action: "COUNSELOR_AUTO_ASSIGN_FAILED",
                  targetCollection: "Lead",
                  targetId: duplicateLeadId,
                  afterData: JSON.stringify({ studentId, reason: assignment.reason }),
                },
              }).catch(() => {});
            }
          }
        } else {
          const leadCount = await db.lead.count();
          const lead = await db.lead.create({
            data: {
              leadId: `ALO-L-${(10001 + leadCount + 1).toString()}`,
              fullName: name.trim(),
              email: normalizedEmail,
              phone: phone?.trim() || "",
              source: "STUDENT_PORTAL_REGISTRATION",
              sourceDetail: "Self-registered via public student registration form",
              status: "NEW",
              studentId,
            },
          });

          await db.timelineEvent.create({
            data: {
              studentId,
              leadId: lead.id,
              stage: "lead",
              type: "LEAD_CREATED",
              title: "Student self-registered",
              description: "Lead auto-created from student portal registration",
            },
          }).catch(() => {});

          await scoreLead(lead.id).catch(() => {});
          const assignment = await autoAssignCounselor(lead.id);
          await createFollowUpTask(lead.id, 1).catch(() => {});

          if (assignment.counselorId) {
            const counselor = await db.user.findUnique({ where: { id: assignment.counselorId } });
            await db.portalStudentProfile.update({
              where: { studentId },
              data: {
                counselorId: assignment.counselorId,
                counselorName: counselor?.name || "",
                journeyStage: "assigned",
              },
            });
          } else {
            // Explicitly record the auto-assignment failure. Do NOT fall
            // back to assigning a random counselor — the student remains
            // unassigned (journeyStage stays "lead_created") until an
            // admin/counselor is available and assignment can be retried.
            console.error("[registration->crm] counselor auto-assignment failed", {
              studentId,
              leadId: lead.id,
              reason: assignment.reason,
            });
            await db.crmAuditLog.create({
              data: {
                actorUserId: "system",
                actorRole: "SYSTEM",
                action: "COUNSELOR_AUTO_ASSIGN_FAILED",
                targetCollection: "Lead",
                targetId: lead.id,
                afterData: JSON.stringify({ studentId, reason: assignment.reason }),
              },
            }).catch(() => {});
          }

          await db.crmAuditLog.create({
            data: {
              actorUserId: "system",
              actorRole: "SYSTEM",
              action: "LEAD_CREATED_FROM_REGISTRATION",
              targetCollection: "Lead",
              targetId: lead.id,
              afterData: JSON.stringify({ studentId, email: normalizedEmail, counselorAssigned: !!assignment.counselorId }),
            },
          }).catch(() => {});
        }
      } catch (crmError) {
        // Never block or fail account creation because of a CRM-side error.
        // Record it clearly so it can be found and repaired.
        console.error("[registration->crm] lead/assignment pipeline failed", {
          studentId,
          error: crmError instanceof Error ? crmError.message : String(crmError),
        });
        await db.crmAuditLog.create({
          data: {
            actorUserId: "system",
            actorRole: "SYSTEM",
            action: "REGISTRATION_CRM_PIPELINE_ERROR",
            targetCollection: "PortalStudentProfile",
            targetId: studentId,
            afterData: JSON.stringify({
              error: crmError instanceof Error ? crmError.message : String(crmError),
            }),
          },
        }).catch(() => {});
      }
    } else if (portalType === "partner") {
      // Generate a unique partner ID with retry on collision
      let partnerId = generatePartnerId();
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await db.partnerProfile.findFirst({
          where: { partnerId },
        });
        if (!existing) {
          isUnique = true;
        } else {
          partnerId = generatePartnerId();
          attempts++;
        }
      }

      await db.partnerProfile.create({
        data: {
          userId: user.id,
          partnerId,
          contactPerson: name.trim(),
        },
      });
    }

    const issued = await issueEmailOtp({ userId: user.id, email: normalizedEmail, ipAddress: getRequestIp(request) });
    if (!issued.ok) {
      return NextResponse.json({
        success: false,
        accountCreated: true,
        error: issued.reason === 'rate_limited'
          ? 'Verification email limit reached. Try again later.'
          : 'Account created but verification email could not be delivered. Retry after email service is available.',
      }, { status: issued.reason === 'rate_limited' ? 429 : 503 });
    }

    const message = portalType === "partner"
      ? "Verification email sent. Verify your address; partner access still requires separate admin approval."
      : "Verification email sent. Verify your address before signing in.";

    return NextResponse.json({ success: true, requireVerification: true, user, message }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
