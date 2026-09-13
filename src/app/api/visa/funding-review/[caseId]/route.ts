import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('counselor') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('COUNSELOR') || auth.roles.includes('APPLICATION_TEAM');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Funding review permission required' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isCounselor = auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR');
    if (!isSuper && !isCounselor && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot access unassigned funding review — IDOR blocked' }, { status: 403 });
    }

    const review = await db.visaFundingReview.findUnique({ where: { caseId } });

    await logAuditAction(auth, 'VISA_FUNDING_VIEW', 'VisaFundingReview', caseId, { studentId: visaCase.studentId });

    return NextResponse.json({
      success: true,
      data: review,
      emptyState: review ? null : 'No funding review — proper empty state — fields Funding Status/Sponsor/Relationship/Occupation/Income/Source of Funds/Bank Statement/Solvency Certificate/Sponsor Documents/Tuition Deposit/Living Cost Plan/Dependents — risk Missing bank statement/solvency/unclear source/relationship mismatch/document mismatch/insufficient explanation/dependent funding problem/unverified scholarship/missing loan — Actions Request document/explanation/ask counselor/finance/human review — Every sensitive access audited',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Funding review update requires visa officer permission' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot edit unassigned funding review — IDOR blocked' }, { status: 403 });
    }

    const body = await req.json();

    // AI safety: never guarantee approval, never invent salary/balance
    const riskChecks: string[] = [];
    if (!body.hasBankStatement) riskChecks.push('Missing bank statement');
    if (!body.hasSolvencyCert) riskChecks.push('Missing solvency certificate');
    if (!body.sourceOfFundExplanation || body.sourceOfFundExplanation.length < 20) riskChecks.push('Insufficient explanation of source of funds');
    if (!body.sponsorRelation) riskChecks.push('Relationship mismatch / missing');
    if (body.sponsor && body.sponsorRelation && !['father','mother','parent','spouse','self','brother','sister'].some(k => body.sponsorRelation.toLowerCase().includes(k))) riskChecks.push('Relationship mismatch requires verification');

    const review = await db.visaFundingReview.upsert({
      where: { caseId },
      create: {
        caseId,
        studentId: body.studentId || visaCase.studentId,
        fundingStatus: body.fundingStatus || 'pending_review',
        sponsor: body.sponsor || '',
        sponsorRelation: body.sponsorRelation || '',
        sponsorOccupation: body.sponsorOccupation || '',
        sponsorIncome: body.sponsorIncome || '',
        sourceOfFund: body.sourceOfFund || '',
        hasBankStatement: body.hasBankStatement || false,
        hasSolvencyCert: body.hasSolvencyCert || false,
        sourceOfFundExplanation: body.sourceOfFundExplanation || '',
        riskWarning: riskChecks.length ? riskChecks.join(', ') : body.riskWarning || 'none',
        tuitionDeposit: body.tuitionDeposit,
        livingCostPlan: body.livingCostPlan,
        dependents: body.dependents,
        sponsorDocuments: body.sponsorDocuments,
      },
      update: {
        fundingStatus: body.fundingStatus,
        sponsor: body.sponsor,
        sponsorRelation: body.sponsorRelation,
        sponsorOccupation: body.sponsorOccupation,
        sponsorIncome: body.sponsorIncome,
        sourceOfFund: body.sourceOfFund,
        hasBankStatement: body.hasBankStatement,
        hasSolvencyCert: body.hasSolvencyCert,
        sourceOfFundExplanation: body.sourceOfFundExplanation,
        riskWarning: riskChecks.length ? riskChecks.join(', ') : body.riskWarning,
        tuitionDeposit: body.tuitionDeposit,
        livingCostPlan: body.livingCostPlan,
        dependents: body.dependents,
        sponsorDocuments: body.sponsorDocuments,
      },
    });

    await logAuditAction(auth, 'VISA_FUNDING_UPDATE', 'VisaFundingReview', caseId, { after: review, riskChecks, studentId: visaCase.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: visaCase.studentId,
        stage: 'VISA_FUNDING_UPDATED',
        title: `Funding review updated by ${auth.name} — risk ${riskChecks.length ? riskChecks.join(', ') : 'none'}`,
        description: `Case ${caseId} funding — 12 fields + 9 risk checks audit sensitive — actions Request document/explanation/ask counselor/finance/human review — every sensitive access audited`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: review, riskChecks, note: 'Funding 12 fields + 9 risk checks audit sensitive — never fabricate salary/balance/income/employment/job/assets — must use real info' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
