import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
    const cleaned = intake.replace(/(\d{4})\s*[-/]\s*(\d{1,2})/, '$2-$1-01');
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;

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
    const counselors = await db.user.findMany({
      where: { role: 'COUNSELOR', status: 'ACTIVE' },
      select: { id: true },
    });

    if (counselors.length === 0) return null;

    const activeStatuses = ['NEW', 'CONTACTED', 'QUALIFIED'];
    const counts = await Promise.all(
      counselors.map(async (c) => {
        const count = await db.lead.count({
          where: { counselorId: c.id, status: { in: activeStatuses } },
        });
        return { counselorId: c.id, count };
      }),
    );

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
/*  Generate a unique leadId                                            */
/* ------------------------------------------------------------------ */

function generateLeadId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ALO-L-${ts}-${rand}`;
}

// GET: Return recent 5 leads from DB (public stats / demo)
export async function GET() {
  try {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        leadId: true,
        fullName: true,
        phone: true,
        email: true,
        source: true,
        preferredCountry: true,
        preferredCourse: true,
        preferredLevel: true,
        preferredIntake: true,
        status: true,
        leadScore: true,
        leadTier: true,
        priority: true,
        followUpDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Leads API GET error:', error);
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}

// POST: Create a new lead from public website form submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName, email, phone, preferredCountry, preferredCourse, notes,
      preferredLevel, preferredIntake, budget,
      englishTest, englishScore, currentQualification, cgpa,
      utmSource, utmMedium, utmCampaign, source,
    } = body;

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Determine source (WEBSITE default for public endpoint, but allow COURSE_FINDER)
    const leadSource = typeof source === 'string' && source.trim() ? source.trim() : 'WEBSITE';

    // ─── 70% Automation: Auto lead scoring ───
    const leadScore = computeLeadScore({
      email, preferredCountry, preferredCourse,
      englishTest, englishScore, currentQualification, cgpa,
      budget, source: leadSource,
    });

    // ─── Auto tier assignment ───
    const leadTier = computeTier(leadScore);

    // ─── Auto priority ───
    const priority = computePriority(leadTier, preferredIntake);

    // ─── Auto follow-up date ───
    const followUpDate = computeFollowUpDate(leadTier);

    // ─── Auto counselor assignment ───
    const assignment = await autoAssignCounselor();

    // Store raw submission for debugging
    const rawSubmission = JSON.stringify(body);

    // ─── Create lead ───
    const lead = await db.lead.create({
      data: {
        leadId: generateLeadId(),
        fullName: fullName.trim(),
        email: email?.trim() || null,
        phone: phone.trim(),
        source: leadSource,
        preferredCountry: preferredCountry?.trim() || null,
        preferredCourse: preferredCourse?.trim() || null,
        preferredLevel: preferredLevel?.trim() || null,
        preferredIntake: preferredIntake?.trim() || null,
        budget: budget?.trim() || null,
        englishTest: englishTest?.trim() || null,
        englishScore: englishScore?.trim() || null,
        currentQualification: currentQualification?.trim() || null,
        cgpa: cgpa?.trim() || null,
        notes: notes?.trim() || null,
        status: 'NEW',
        leadScore,
        leadTier,
        priority,
        followUpDate,
        counselorId: assignment?.counselorId || null,
        assignedReason: assignment?.reason || null,
        welcomeSent: false,
        utmSource: utmSource?.trim() || null,
        utmMedium: utmMedium?.trim() || null,
        utmCampaign: utmCampaign?.trim() || null,
        rawSubmission,
      },
    });

    // ─── Timeline event: LEAD_CREATED_AUTO_SCORED ───
    await db.timelineEvent.create({
      data: {
        leadId: lead.id,
        type: 'LEAD_CREATED_AUTO_SCORED',
        title: 'Lead created & auto-scored from website',
        description: `${lead.fullName} submitted a query from ${leadSource}. Score: ${leadScore}, Tier: ${leadTier}, Priority: ${priority}${assignment ? `, Assigned: ${assignment.reason}` : ''}`,
      },
    });

    return NextResponse.json({ lead, message: 'Lead created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Leads API POST error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
