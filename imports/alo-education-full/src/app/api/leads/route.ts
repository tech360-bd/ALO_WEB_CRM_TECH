import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  Generate a human-readable leadId                                    */
/* ------------------------------------------------------------------ */

function generateLeadId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ALO-L-${ts}-${rand}`;
}

/* ------------------------------------------------------------------ */
/*  Auto lead scoring (70% automation — weighted scoring)               */
/* ------------------------------------------------------------------ */

function computeLeadScore(data: {
  email?: string;
  preferredCountry?: string;
  preferredCourse?: string;
  englishTest?: string;
  englishScore?: string;
  currentQualification?: string;
  cgpa?: string;
  budget?: string;
  source?: string;
}): number {
  let score = 0;

  // +20 if preferredCountry filled
  if (data.preferredCountry?.trim()) score += 20;
  // +20 if preferredCourse filled
  if (data.preferredCourse?.trim()) score += 20;
  // +15 if englishTest + englishScore both filled
  if (data.englishTest?.trim() && data.englishScore?.trim()) score += 15;
  // +15 if currentQualification + cgpa both filled
  if (data.currentQualification?.trim() && data.cgpa?.trim()) score += 15;
  // +10 if email filled
  if (data.email?.trim()) score += 10;
  // +10 if budget filled
  if (data.budget?.trim()) score += 10;
  // +10 if source is COURSE_FINDER or EVENT (high intent)
  const src = data.source?.trim().toUpperCase();
  if (src === 'COURSE_FINDER' || src === 'EVENT') score += 10;

  return Math.min(100, score);
}

/* ------------------------------------------------------------------ */
/*  Auto tier assignment                                                */
/* ------------------------------------------------------------------ */

function computeTier(score: number): 'HOT' | 'WARM' | 'COLD' {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

/* ------------------------------------------------------------------ */
/*  Auto priority — URGENT if HOT + intake within 3 months              */
/* ------------------------------------------------------------------ */

function computePriority(
  tier: string,
  preferredIntake?: string,
): 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' {
  if (tier === 'HOT') {
    // Check if preferredIntake is within 3 months
    if (preferredIntake?.trim()) {
      const intakeDate = parseIntakeDate(preferredIntake.trim());
      if (intakeDate) {
        const now = new Date();
        const threeMonthsFromNow = new Date(now);
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        if (intakeDate <= threeMonthsFromNow) {
          return 'URGENT';
        }
      }
    }
    return 'HIGH';
  }
  if (tier === 'WARM') return 'NORMAL';
  return 'LOW';
}

/* ------------------------------------------------------------------ */
/*  Parse intake string like "September 2026" into a Date               */
/* ------------------------------------------------------------------ */

function parseIntakeDate(intake: string): Date | null {
  try {
    // Try formats like "September 2026", "Jan 2027", "2026-09", etc.
    const cleaned = intake.replace(/(\d{4})\s*[-/]\s*(\d{1,2})/, '$2-$1-01');
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;

    // Try "Month Year" format
    const parts = intake.trim().split(/\s+/);
    if (parts.length >= 2) {
      const monthStr = parts[0];
      const yearStr = parts[parts.length - 1];
      const monthIndex = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
      if (!isNaN(monthIndex)) {
        return new Date(parseInt(yearStr), monthIndex, 1);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Auto follow-up date                                                 */
/* ------------------------------------------------------------------ */

function computeFollowUpDate(tier: string): Date {
  const hours = tier === 'HOT' ? 24 : tier === 'WARM' ? 48 : 72;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/* ------------------------------------------------------------------ */
/*  Auto counselor assignment — find counselor with fewest active leads  */
/* ------------------------------------------------------------------ */

async function autoAssignCounselor(): Promise<{ counselorId: string; reason: string } | null> {
  try {
    // Get all active counselors
    const counselors = await db.user.findMany({
      where: {
        role: 'COUNSELOR',
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (counselors.length === 0) return null;

    // Count active leads per counselor (NEW, CONTACTED, QUALIFIED)
    const activeStatuses = ['NEW', 'CONTACTED', 'QUALIFIED'];
    const counts = await Promise.all(
      counselors.map(async (c) => {
        const count = await db.lead.count({
          where: {
            counselorId: c.id,
            status: { in: activeStatuses },
          },
        });
        return { counselorId: c.id, count };
      }),
    );

    // Pick counselor with fewest active leads
    counts.sort((a, b) => a.count - b.count);
    return {
      counselorId: counts[0].counselorId,
      reason: 'AUTO_ASSIGNED:FEWEST_LEADS',
    };
  } catch (error) {
    console.error('Auto counselor assignment failed:', error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create a lead (authenticated, e.g. from CRM)                 */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const {
      fullName, phone, email, preferredCountry, preferredCourse,
      notes, source, sourceDetail, preferredLevel, preferredIntake,
      budget, englishTest, englishScore, currentQualification, cgpa,
      branch, utmSource, utmMedium, utmCampaign,
    } = body;

    // Validate required fields
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name is required (at least 2 characters).' },
        { status: 400 },
      );
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required (at least 8 characters).' },
        { status: 400 },
      );
    }

    // ─── 70% Automation: Auto lead scoring ───
    const leadScore = computeLeadScore({
      email, preferredCountry, preferredCourse,
      englishTest, englishScore, currentQualification, cgpa,
      budget, source,
    });

    // ─── Auto tier assignment ───
    const leadTier = computeTier(leadScore);

    // ─── Auto priority ───
    const priority = computePriority(leadTier, preferredIntake);

    // ─── Auto follow-up date ───
    const followUpDate = computeFollowUpDate(leadTier);

    // ─── Auto counselor assignment ───
    const assignment = await autoAssignCounselor();

    // ─── Create lead in database ───
    const lead = await db.lead.create({
      data: {
        leadId: generateLeadId(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: typeof email === 'string' && email.trim() ? email.trim() : null,
        preferredCountry: typeof preferredCountry === 'string' && preferredCountry.trim() ? preferredCountry.trim() : null,
        preferredCourse: typeof preferredCourse === 'string' && preferredCourse.trim() ? preferredCourse.trim() : null,
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
        source: typeof source === 'string' && source.trim() ? source.trim() : 'MANUAL',
        sourceDetail: typeof sourceDetail === 'string' && sourceDetail.trim() ? sourceDetail.trim() : null,
        preferredLevel: typeof preferredLevel === 'string' && preferredLevel.trim() ? preferredLevel.trim() : null,
        preferredIntake: typeof preferredIntake === 'string' && preferredIntake.trim() ? preferredIntake.trim() : null,
        budget: typeof budget === 'string' && budget.trim() ? budget.trim() : null,
        englishTest: typeof englishTest === 'string' && englishTest.trim() ? englishTest.trim() : null,
        englishScore: typeof englishScore === 'string' && englishScore.trim() ? englishScore.trim() : null,
        currentQualification: typeof currentQualification === 'string' && currentQualification.trim() ? currentQualification.trim() : null,
        cgpa: typeof cgpa === 'string' && cgpa.trim() ? cgpa.trim() : null,
        branch: typeof branch === 'string' && branch.trim() ? branch.trim() : null,
        leadScore,
        leadTier,
        priority,
        followUpDate,
        counselorId: assignment?.counselorId || null,
        assignedReason: assignment?.reason || null,
        welcomeSent: false,
        utmSource: typeof utmSource === 'string' && utmSource.trim() ? utmSource.trim() : null,
        utmMedium: typeof utmMedium === 'string' && utmMedium.trim() ? utmMedium.trim() : null,
        utmCampaign: typeof utmCampaign === 'string' && utmCampaign.trim() ? utmCampaign.trim() : null,
      },
    });

    // ─── Timeline event: LEAD_CREATED_AUTO_SCORED ───
    await db.timelineEvent.create({
      data: {
        leadId: lead.id,
        userId: user!.id,
        type: 'LEAD_CREATED_AUTO_SCORED',
        title: 'Lead created & auto-scored',
        description: `Lead created for ${lead.fullName} from ${lead.source}. Score: ${leadScore}, Tier: ${leadTier}, Priority: ${priority}${assignment ? `, Assigned: ${assignment.reason}` : ''}`,
      },
    });

    return NextResponse.json({ success: true, id: lead.id, lead });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Update lead with auto-qualification check (70% automation)  */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required.' },
        { status: 400 },
      );
    }

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Lead not found.' },
        { status: 404 },
      );
    }

    // Build update data from allowed fields
    const allowedFields = [
      'fullName', 'phone', 'email', 'preferredCountry', 'preferredCourse',
      'notes', 'source', 'sourceDetail', 'preferredLevel', 'preferredIntake',
      'budget', 'englishTest', 'englishScore', 'currentQualification', 'cgpa',
      'branch', 'status', 'counselorId', 'assignedReason',
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    }

    // ─── Re-compute lead score if any scoring-relevant field changed ───
    const scoringFields = [
      'email', 'preferredCountry', 'preferredCourse',
      'englishTest', 'englishScore', 'currentQualification', 'cgpa',
      'budget', 'source',
    ];
    const scoringChanged = scoringFields.some((f) => updateFields[f] !== undefined);

    if (scoringChanged) {
      const merged = {
        email: (updateData.email as string) ?? existing.email,
        preferredCountry: (updateData.preferredCountry as string) ?? existing.preferredCountry,
        preferredCourse: (updateData.preferredCourse as string) ?? existing.preferredCourse,
        englishTest: (updateData.englishTest as string) ?? existing.englishTest,
        englishScore: (updateData.englishScore as string) ?? existing.englishScore,
        currentQualification: (updateData.currentQualification as string) ?? existing.currentQualification,
        cgpa: (updateData.cgpa as string) ?? existing.cgpa,
        budget: (updateData.budget as string) ?? existing.budget,
        source: (updateData.source as string) ?? existing.source,
      };

      const newScore = computeLeadScore(merged);
      const newTier = computeTier(newScore);
      const newIntake = (updateData.preferredIntake as string) ?? existing.preferredIntake;
      const newPriority = computePriority(newTier, newIntake ?? undefined);
      const newFollowUp = computeFollowUpDate(newTier);

      updateData.leadScore = newScore;
      updateData.leadTier = newTier;
      updateData.priority = newPriority;
      updateData.followUpDate = newFollowUp;
    }

    // ─── Auto-qualification check ───
    // If all core fields are filled → auto-qualify
    const finalCountry = (updateData.preferredCountry as string) ?? existing.preferredCountry;
    const finalCourse = (updateData.preferredCourse as string) ?? existing.preferredCourse;
    const finalEnglishTest = (updateData.englishTest as string) ?? existing.englishTest;
    const finalQualification = (updateData.currentQualification as string) ?? existing.currentQualification;

    const allCoreFieldsFilled = !!(finalCountry?.trim() && finalCourse?.trim() && finalEnglishTest?.trim() && finalQualification?.trim());
    const currentlyNotQualified = existing.status !== 'QUALIFIED' && existing.status !== 'CONVERTED';
    const statusNotManuallySet = updateData.status === undefined;

    if (allCoreFieldsFilled && currentlyNotQualified && statusNotManuallySet) {
      updateData.status = 'QUALIFIED';
    }

    // Perform the update
    const lead = await db.lead.update({
      where: { id },
      data: updateData,
    });

    // ─── Timeline events ───
    if (scoringChanged) {
      await db.timelineEvent.create({
        data: {
          leadId: lead.id,
          userId: user!.id,
          type: 'LEAD_AUTO_REScoreD',
          title: 'Lead re-scored automatically',
          description: `Score: ${lead.leadScore}, Tier: ${lead.leadTier}, Priority: ${lead.priority}`,
        },
      });
    }

    if (updateData.status === 'QUALIFIED' && existing.status !== 'QUALIFIED') {
      await db.timelineEvent.create({
        data: {
          leadId: lead.id,
          userId: user!.id,
          type: 'LEAD_AUTO_QUALIFIED',
          title: 'Lead auto-qualified',
          description: `All core fields filled — lead automatically qualified (country, course, english test, qualification)`,
        },
      });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET — List leads for CRM                                            */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const { error: authError } = await requireAuth(req);
  if (authError) return authError;

  try {
    const url = req.nextUrl.searchParams;
    const status = url.get('status');
    const source = url.get('source');
    const page = Math.max(1, parseInt(url.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (source) where.source = source;

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          leadId: true,
          fullName: true,
          phone: true,
          email: true,
          preferredCountry: true,
          preferredCourse: true,
          source: true,
          status: true,
          leadScore: true,
          leadTier: true,
          priority: true,
          counselorId: true,
          followUpDate: true,
          welcomeSent: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.lead.count({ where }),
    ]);

    return NextResponse.json({ success: true, leads, total, page, limit });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads.' },
      { status: 500 },
    );
  }
}
