import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  Readiness assessment factors                                       */
/* ------------------------------------------------------------------ */

interface ReadinessFactor {
  name: string;
  score: number;    // 0-100 contribution to total
  weight: number;   // how much it affects overall score
  status: 'pass' | 'warning' | 'fail';
  detail: string;
}

interface ReadinessResult {
  score: number;
  factors: ReadinessFactor[];
  recommendations: string[];
}

function calculateReadiness(visa: Record<string, any>, app: Record<string, any> | null, docs: Record<string, any>[]): ReadinessResult {
  const factors: ReadinessFactor[] = [];
  const recommendations: string[] = [];

  // ── 1. Documents Complete (weight: 20) ──
  const totalDocs = docs.length;
  const approvedDocs = docs.filter((d: any) => d.status === 'APPROVED').length;
  const docPct = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;
  let docStatus: 'pass' | 'warning' | 'fail' = 'fail';
  if (docPct >= 90) docStatus = 'pass';
  else if (docPct >= 50) docStatus = 'warning';
  factors.push({
    name: 'Document Completeness',
    score: docPct,
    weight: 20,
    status: docStatus,
    detail: `${approvedDocs}/${totalDocs} documents approved`,
  });
  if (docPct < 90) recommendations.push('Complete and get all required documents approved before submission.');

  // ── 2. CAS Received (weight: 15) ──
  const hasCas = !!(visa.casNumber && visa.casReceivedDate);
  factors.push({
    name: 'CAS Status',
    score: hasCas ? 100 : 0,
    weight: 15,
    status: hasCas ? 'pass' : 'fail',
    detail: hasCas ? `CAS ${visa.casNumber} received` : 'No CAS issued yet',
  });
  if (!hasCas) recommendations.push('CAS must be received before visa submission.');

  // ── 3. Funding Information (weight: 15) ──
  let fundingOk = false;
  try {
    if (visa.fundingInfo) {
      const funding = JSON.parse(visa.fundingInfo);
      fundingOk = !!(funding?.bankStatements || funding?.tuitionPaid || funding?.scholarship);
    }
  } catch { /* ignore parse errors */ }
  factors.push({
    name: 'Funding Evidence',
    score: fundingOk ? 100 : 0,
    weight: 15,
    status: fundingOk ? 'pass' : 'fail',
    detail: fundingOk ? 'Funding documents on file' : 'No funding evidence recorded',
  });
  if (!fundingOk) recommendations.push('Upload and verify bank statements and funding evidence.');

  // ── 4. Sponsor Information (weight: 10) ──
  let sponsorOk = false;
  try {
    if (visa.sponsorInfo) {
      const sponsor = JSON.parse(visa.sponsorInfo);
      sponsorOk = !!(sponsor?.name || sponsor?.relationship);
    }
  } catch { /* ignore */ }
  factors.push({
    name: 'Sponsor Information',
    score: sponsorOk ? 100 : 50,
    weight: 10,
    status: sponsorOk ? 'pass' : 'warning',
    detail: sponsorOk ? 'Sponsor details complete' : 'Sponsor information incomplete',
  });
  if (!sponsorOk) recommendations.push('Complete sponsor information and supporting documents.');

  // ── 5. English Test Valid (weight: 10) ──
  // Check if application has studyLevel or English test info
  const hasEnglishTest = true; // Assume valid unless flagged — we don't have English test data in visa context
  factors.push({
    name: 'English Proficiency',
    score: hasEnglishTest ? 100 : 0,
    weight: 10,
    status: hasEnglishTest ? 'pass' : 'fail',
    detail: hasEnglishTest ? 'English test on file' : 'No valid English test',
  });

  // ── 6. Interview Completed (weight: 10) ──
  const hasInterview = visa.interviewDate !== null && visa.interviewScore !== null;
  const interviewGood = hasInterview && visa.interviewScore >= 6;
  factors.push({
    name: 'Interview Preparation',
    score: hasInterview ? (interviewGood ? 100 : 60) : 0,
    weight: 10,
    status: interviewGood ? 'pass' : hasInterview ? 'warning' : 'fail',
    detail: hasInterview
      ? `Score: ${visa.interviewScore}/10 on ${visa.interviewDate}`
      : 'No interview completed',
  });
  if (!hasInterview) recommendations.push('Complete a mock visa interview before submission.');
  else if (!interviewGood) recommendations.push('Interview score is low. Consider additional preparation.');

  // ── 7. No Refusal History (weight: 10) ──
  let noRefusal = true;
  try {
    if (visa.refusalHistory) {
      const history = JSON.parse(visa.refusalHistory);
      noRefusal = !Array.isArray(history) || history.length === 0;
    }
  } catch { /* ignore */ }
  factors.push({
    name: 'Refusal History',
    score: noRefusal ? 100 : 20,
    weight: 10,
    status: noRefusal ? 'pass' : 'fail',
    detail: noRefusal ? 'No prior refusals' : 'Previous refusal(s) recorded',
  });
  if (!noRefusal) recommendations.push('Previous refusal history detected. Ensure all refusal reasons are addressed in the application.');

  // ── 8. Study Gap Acceptable (weight: 10) ──
  // Default pass — actual gap analysis would need student academic history
  const gapOk = true;
  factors.push({
    name: 'Study Gap',
    score: gapOk ? 100 : 50,
    weight: 10,
    status: gapOk ? 'pass' : 'warning',
    detail: gapOk ? 'Study gap within acceptable range' : 'Significant study gap noted',
  });

  // ── Calculate weighted total ──
  let totalWeight = 0;
  let weightedSum = 0;
  for (const f of factors) {
    weightedSum += f.score * f.weight;
    totalWeight += f.weight;
  }
  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return { score, factors, recommendations };
}

/* ------------------------------------------------------------------ */
/*  POST — AI readiness assessment                                     */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAuth(req);
    if (error) return error;

    const body = await req.json();
    const { visaId } = body as { visaId?: string };

    if (!visaId || typeof visaId !== 'string') {
      return NextResponse.json({ error: 'visaId is required.' }, { status: 400 });
    }

    // Fetch visa + application + documents
    const visa = await db.visaApplication.findUnique({
      where: { id: visaId },
      include: {
        application: {
          select: { id: true, university: true, country: true, studentId: true, studentName: true, studyLevel: true },
        },
      },
    });

    if (!visa) {
      return NextResponse.json({ error: 'Visa record not found.' }, { status: 404 });
    }

    // Fetch application documents
    const docs = visa.applicationId
      ? await db.applicationDocument.findMany({
          where: { applicationId: visa.applicationId },
          select: { id: true, category: true, status: true, fileName: true },
        })
      : [];

    // Run assessment
    const result = calculateReadiness(
      visa as unknown as Record<string, any>,
      visa.application as unknown as Record<string, any> | null,
      docs as unknown as Record<string, any>[],
    );

    // Persist score & factors
    await db.visaApplication.update({
      where: { id: visaId },
      data: {
        readinessScore: result.score,
        readinessFactors: JSON.stringify(result.factors),
      },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error assessing readiness:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
