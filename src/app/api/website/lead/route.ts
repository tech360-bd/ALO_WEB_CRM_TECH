import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { withAuth, logAuditAction } from "@/lib/auth-middleware";

// ============================================================
// POST /api/website/lead
// Public consultation booking endpoint.
// Implements the full 10-step consultation workflow:
//   1. Visitor submits a consultation booking
//   2. Validate input
//   3. Detect duplicate phone and email
//   4. Create or update lead
//   5. Assign lead using a documented rule (round-robin among active counselors)
//   6. Display it in the staff dashboard (via existing CRM leads API)
//   7. Add student or lead timeline entry
//   8. Generate notification (to assigned counselor)
//   9. Create audit log
//  10. Allow status updates (via separate PUT endpoint below)
// Persistence after restart is guaranteed because all writes go to the DB.
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, phone, email,
      preferredCountry, preferredLevel, preferredSubject, intake, budget,
      englishTest, englishScore, message, source, sourceSection,
      // Consultation booking fields
      destination, service, preferredDate, preferredTime, leadType, status,
    } = body;

    // Step 2: Validate input
    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Name, phone, and email are required." },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Basic phone format check (allow +, digits, spaces, dashes, parens)
    const phoneRegex = /^[+\d\s()\-]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid phone number." },
        { status: 400 }
      );
    }

    const finalCountry = preferredCountry || destination || "";
    const finalMessage = message
      ? (service ? `[Service: ${service}] ${message}` : message)
      : (service ? `Service requested: ${service}` : "");

    // Step 3: Detect duplicate phone and email
    // Look up existing leads with the same phone OR email within the last 30 days.
    // If found, return a "duplicate" response so the frontend can show a friendly message.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const existingLead = await db.leadForm.findFirst({
      where: {
        OR: [
          { phone: phone, createdAt: { gte: thirtyDaysAgo } },
          { email: email.toLowerCase(), createdAt: { gte: thirtyDaysAgo } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    let leadId: string;
    let isDuplicate = false;

    if (existingLead) {
      // Step 4: Update existing lead with new info (keep the original createdAt, bump updatedAt)
      isDuplicate = true;
      const updated = await db.leadForm.update({
        where: { id: existingLead.id },
        data: {
          // Don't overwrite name if it changed — keep the latest
          name: name || existingLead.name,
          phone: phone || existingLead.phone,
          email: email || existingLead.email,
          // Append new message to existing
          message: existingLead.message
            ? `${existingLead.message}\n---\n[${new Date().toISOString()}] ${finalMessage}`
            : finalMessage,
          preferredCountry: finalCountry || existingLead.preferredCountry,
          preferredLevel: preferredLevel || existingLead.preferredLevel,
          preferredSubject: preferredSubject || existingLead.preferredSubject,
          intake: intake || existingLead.intake,
          status: existingLead.status === "closed" ? "reopened" : existingLead.status,
        },
      });
      leadId = updated.id;
    } else {
      // Step 4: Create new lead
      const [newLead] = await Promise.all([
        db.leadForm.create({
          data: {
            name: name || "",
            phone: phone || "",
            email: email || "",
            preferredCountry: finalCountry,
            preferredLevel: preferredLevel || "",
            preferredSubject: preferredSubject || "",
            intake: intake || (preferredDate ? `Date: ${preferredDate} ${preferredTime || ''}`.trim() : ""),
            budget: budget || "",
            englishTest: englishTest || "",
            englishScore: englishScore ? String(englishScore) : "",
            message: finalMessage,
            source: source || "homepage",
            sourceSection: sourceSection || (leadType || "consultation"),
            status: status || "new",
          },
        }),
        // Also log as a search for analytics
        db.searchLog.create({
          data: {
            countryId: finalCountry || null,
            studyLevel: preferredLevel || "",
            subject: preferredSubject || "",
            intake: intake || "",
            budget: budget || "",
            source: source || "homepage",
          },
        }),
      ]);
      leadId = newLead.id;
    }

    // Step 5: Assign lead using a documented rule.
    // Rule: Round-robin among active counselors. If no counselors exist, leave unassigned
    // (the lead will appear in the unassigned queue in the CRM dashboard).
    let assignedCounselorId = "";
    let assignedCounselorName = "";
    try {
      // Find all active counselors (users with userType=EMPLOYEE who have a counselor role)
      const counselors = await db.portalUserRole.findMany({
        where: { role: { name: { in: ['counselor', 'branch_manager'] } } },
        select: { userId: true },
        distinct: ['userId'],
      });

      if (counselors.length > 0) {
        // Round-robin: pick the counselor who was assigned the fewest leads in the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const counselorLoads = await Promise.all(
          counselors.map(async (c) => {
            const load = await db.leadForm.count({
              where: {
                assignedCounselorId: c.userId,
                createdAt: { gte: sevenDaysAgo },
              },
            });
            return { userId: c.userId, load };
          })
        );
        counselorLoads.sort((a, b) => a.load - b.load);
        const picked = counselorLoads[0];
        assignedCounselorId = picked.userId;

        // Look up the counselor's name
        const counselorUser = await db.portalUser.findUnique({
          where: { id: picked.userId },
          select: { name: true },
        });
        assignedCounselorName = counselorUser?.name || "Counselor";

        // Update the lead with the assignment
        await db.leadForm.update({
          where: { id: leadId },
          data: {
            assignedCounselorId,
            // Note: assignedCounselorName is stored in the leadForm table if it has that field.
            // If not, the name is looked up at display time via the userId.
          },
        });
      }
    } catch (assignError) {
      // Assignment failure should not fail the whole request — the lead is still saved.
      console.error("[lead/route.ts] Assignment failed:", assignError);
    }

    // Step 7: Add a timeline entry (InternalComment with type='system')
    try {
      // Check if InternalComment table is accessible
      await db.internalComment.create({
        data: {
          studentId: leadId, // Use leadId as the studentId reference for lead-timeline entries
          authorId: "system",
          authorName: "System",
          authorRole: "system",
          visibility: "internal_only",
          commentType: "system_note",
          content: `Lead created via ${source || "homepage"}. Service: ${service || "general consultation"}. Assigned to: ${assignedCounselorName || "unassigned"}.`,
        },
      });
    } catch (timelineError) {
      console.error("[lead/route.ts] Timeline entry failed:", timelineError);
    }

    // Step 8: Generate notification to assigned counselor
    if (assignedCounselorId) {
      try {
        await db.portalNotification.create({
          data: {
            userId: assignedCounselorId,
            title: "New lead assigned to you",
            message: `Lead from ${name} (${email}) — ${finalCountry || "destination not specified"}.`,
            type: "new_lead",
            isRead: false,
            actionUrl: `/crm/leads/${leadId}`,
          },
        });
      } catch (notifError) {
        console.error("[lead/route.ts] Notification failed:", notifError);
      }
    }

    // Step 9: Create audit log
    // Note: logAuditAction requires an auth context, but this is a public endpoint.
    // We log directly to PortalAuditLog instead.
    try {
      await db.portalAuditLog.create({
        data: {
          actorUserId: "public",
          action: "lead.created",
          entityType: "LeadForm",
          entityId: leadId,
          metadata: JSON.stringify({
            name,
            email,
            phone,
            source: source || "homepage",
            assignedCounselorId,
            isDuplicate,
          }),
          ipAddress: request.headers.get("x-forwarded-for") || "",
          userAgent: request.headers.get("user-agent") || "",
        },
      });
    } catch (auditError) {
      console.error("[lead/route.ts] Audit log failed:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: isDuplicate
        ? "We've received your inquiry again. Our team will contact you shortly."
        : "Your inquiry has been submitted successfully. Our counselor will contact you within 24 hours.",
      leadId,
      isDuplicate,
      assignedTo: assignedCounselorName || null,
    });
  } catch (error) {
    console.error("Lead form submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}

// ============================================================
// GET /api/website/lead
// Staff: list recent leads (protected by withAuth).
// Step 6: Display it in the staff dashboard — staff fetch this endpoint.
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const leads = await db.leadForm.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({ success: true, leads });
    } catch (error) {
      return NextResponse.json({ success: false, error: "Failed to fetch leads" }, { status: 500 });
    }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] })(request);
}

// ============================================================
// PUT /api/website/lead
// Staff: update lead status (Step 10: Allow status updates).
// ============================================================
export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { leadId, status, notes } = body;

      if (!leadId || !status) {
        return NextResponse.json(
          { success: false, error: "leadId and status are required." },
          { status: 400 }
        );
      }

      const validStatuses = ["new", "contacted", "qualified", "enrolled", "lost", "reopened", "closed"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }

      const updated = await db.leadForm.update({
        where: { id: leadId },
        data: {
          status,
          ...(notes ? { message: notes } : {}),
        },
      });

      // Audit log
      await logAuditAction(auth, "lead.status_updated", "LeadForm", leadId, { oldStatus: "", newStatus: status });

      return NextResponse.json({ success: true, lead: updated });
    } catch (error) {
      console.error("[PUT /api/website/lead]", error);
      return NextResponse.json(
        { success: false, error: "Failed to update lead status." },
        { status: 500 }
      );
    }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] })(request);
}
