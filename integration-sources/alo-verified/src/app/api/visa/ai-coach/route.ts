import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeVisaReadiness } from '@/lib/visa-readiness';
import { verifyAuth } from '@/lib/auth';

/**
 * AI Visa Coach - placeholder AI engine.
 * The AI can: summarize file, detect missing/expired docs, suggest next action,
 * create interview questions, draft SOP/GTE, highlight financial risk, highlight refusal risk,
 * generate counselor summary, generate visa officer checklist.
 *
 * The AI CANNOT: guarantee visa, submit application, approve documents/payments,
 * send private data without OTP, delete records, change commission, bypass staff approval.
 */
export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { studentId, action, otpVerified } = body;
    if (!studentId || !action) {
      return NextResponse.json({ error: 'studentId and action are required' }, { status: 400 });
    }

    // Actions that require OTP for private data
    const privateActions = ['summarize_file', 'draft_sop', 'generate_visa_officer_checklist'];
    if (privateActions.includes(action) && !otpVerified) {
      return NextResponse.json({
        error: 'OTP_REQUIRED',
        message: 'This action accesses private student data. Please verify OTP first.',
      }, { status: 403 });
    }

    const readiness = await computeVisaReadiness(studentId);
    const documents = await db.document.findMany({ where: { studentId } });
    const visaFile = await db.visaFile.findFirst({ where: { studentId, status: 'active' } });
    const applications = await db.application.findMany({ where: { studentId } });
    const financialProof = await db.financialProofReview.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    const riskFlags = await db.riskFlag.findMany({ where: { studentId, status: 'open' } });
    const interviews = await db.interviewSession.findMany({ where: { studentId } });

    const now = new Date();
    const expiredDocuments = documents.filter(d => d.expiryDate && new Date(d.expiryDate) < now);
    const missingItems = readiness.items.filter(i => i.status === 'pending');
    const rejectedItems = readiness.items.filter(i => i.status === 'rejected' || i.status === 'needs_correction');

    let result: Record<string, unknown> = { action };

    switch (action) {
      case 'summarize_file': {
        result.summary = {
          studentId,
          readinessScore: readiness.score,
          totalApplications: applications.length,
          activeVisaFile: !!visaFile,
          visaStage: visaFile?.stage || 'not_started',
          documentsTotal: documents.length,
          documentsApproved: documents.filter(d => d.status === 'approved').length,
          documentsRejected: documents.filter(d => d.status === 'rejected').length,
          interviewsCompleted: interviews.filter(i => i.status === 'completed').length,
          openRiskFlags: riskFlags.length,
          financialRisk: financialProof?.riskFlag || 'unknown',
        };
        break;
      }
      case 'detect_missing_documents': {
        result.missing = missingItems.map(i => i.label);
        result.expired = expiredDocuments.map(d => ({ documentType: d.documentType, fileName: d.fileName, expiryDate: d.expiryDate }));
        break;
      }
      case 'suggest_next_action': {
        const actions: string[] = [];
        if (readiness.items.find(i => i.key === 'profile')?.status !== 'completed') {
          actions.push('Complete your student profile (nationality, target country, contact info).');
        }
        if (readiness.items.find(i => i.key === 'academic_documents')?.status === 'pending') {
          actions.push('Upload academic transcripts and certificates for verification.');
        }
        if (readiness.items.find(i => i.key === 'english_test')?.status === 'pending') {
          actions.push('Book an English proficiency test (IELTS / PTE / Duolingo).');
        }
        if (readiness.items.find(i => i.key === 'offer_letter')?.status === 'pending' && applications.length === 0) {
          actions.push('Use Course Finder to shortlist and apply to programs.');
        }
        if (readiness.items.find(i => i.key === 'deposit_receipt')?.status === 'pending' && applications.some(a => a.status === 'unconditional_offer' || a.status === 'conditional_offer')) {
          actions.push('Pay the tuition deposit and upload the receipt.');
        }
        if (readiness.items.find(i => i.key === 'cas_document')?.status === 'pending' && applications.some(a => a.status === 'unconditional_offer')) {
          actions.push('Request CAS / I-20 / COE from the institution.');
        }
        if (readiness.items.find(i => i.key === 'financial_proof')?.status === 'pending') {
          actions.push('Prepare bank statement, sponsor letter, affidavit, and tax documents.');
        }
        if (readiness.items.find(i => i.key === 'interview_practice')?.status === 'pending') {
          actions.push('Complete at least 2 mock interview sessions.');
        }
        if (readiness.score >= 85 && visaFile?.stage === 'not_started') {
          actions.push('Your visa readiness is high. Request visa file preparation from your counselor.');
        }
        result.nextActions = actions.length > 0 ? actions : ['No immediate action needed. Continue monitoring your application.'];
        break;
      }
      case 'create_interview_questions': {
        result.questions = [
          { category: 'why_country', question: 'Why did you choose this country for your studies?' },
          { category: 'why_university', question: 'Why this specific university over others?' },
          { category: 'why_course', question: 'How does this course align with your career goals?' },
          { category: 'sponsor', question: 'Who is your sponsor and what is their income source?' },
          { category: 'future_plan', question: 'What will you do after graduation?' },
          { category: 'academic_gap', question: 'Explain any gap in your education.' },
          { category: 'tuition_fee', question: 'What is your total tuition fee and how will you pay it?' },
          { category: 'accommodation', question: 'Where will you stay during your studies?' },
        ];
        break;
      }
      case 'draft_sop': {
        const student = await db.student.findUnique({ where: { id: studentId } });
        const targetCourse = applications[0]?.courseName || student?.preferredCourse || 'your chosen course';
        const targetCountry = student?.preferredCountry || 'your chosen country';
        result.draftSop = `Statement of Purpose\n\nI am ${student?.firstName || ''} ${student?.lastName || ''}, a citizen of ${student?.nationality || 'Bangladesh'}, applying to study ${targetCourse} in ${targetCountry}. My academic background and career aspirations strongly align with this program. [Please personalize this section with your academic history, motivation, and future plans.]\n\nThe ${targetCourse} program will equip me with the skills needed to contribute to my home country's development upon graduation. I have arranged my funding through ${financialProof?.riskFlag === 'low' ? 'verified sponsor documentation' : 'sponsor support that requires additional verification'}.\n\nI respectfully request the visa officer to consider my application favorably.`;
        result.note = 'This is an AI draft. Personalize and review with your counselor before submission.';
        break;
      }
      case 'highlight_financial_risk': {
        result.financialRisk = {
          riskFlag: financialProof?.riskFlag || 'unknown',
          missingItems: financialProof ? [
            financialProof.bankStatementStatus !== 'approved' && 'Bank statement',
            financialProof.bankSolvencyStatus !== 'approved' && 'Bank solvency',
            financialProof.sponsorLetterStatus !== 'approved' && 'Sponsor letter',
            financialProof.affidavitStatus !== 'approved' && 'Affidavit',
            financialProof.taxDocumentStatus !== 'approved' && 'Tax document',
            financialProof.incomeSourceStatus !== 'approved' && 'Income source proof',
            financialProof.depositReceiptStatus !== 'approved' && 'Tuition deposit receipt',
          ].filter(Boolean) : ['All financial documents pending'],
          recommendation: financialProof?.riskFlag === 'high'
            ? 'High risk detected. Schedule a finance review with the ALO finance team before visa submission.'
            : financialProof?.riskFlag === 'medium'
            ? 'Medium risk. Ensure all financial documents are uploaded and reviewed.'
            : 'Financial profile looks acceptable. Continue monitoring.',
        };
        break;
      }
      case 'highlight_refusal_risk': {
        const risks: string[] = [];
        if (readiness.score < 60) risks.push(`Low visa readiness score (${readiness.score}%). Multiple items pending.`);
        if (riskFlags.length > 0) risks.push(`${riskFlags.length} open risk flag(s): ${riskFlags.map(r => r.riskType).join(', ')}`);
        if (expiredDocuments.length > 0) risks.push(`${expiredDocuments.length} expired document(s) detected.`);
        if (rejectedItems.length > 0) risks.push(`${rejectedItems.length} readiness item(s) rejected or need correction.`);
        if (interviews.filter(i => i.status === 'completed').length < 1) risks.push('No completed interview practice. Strongly recommend mock interviews.');
        result.refusalRisk = {
          level: risks.length >= 3 ? 'high' : risks.length === 2 ? 'medium' : risks.length === 1 ? 'low' : 'minimal',
          factors: risks,
          recommendation: risks.length === 0
            ? 'No major refusal risk factors detected. Continue with visa preparation.'
            : 'Address the listed risk factors before submitting your visa application.',
        };
        break;
      }
      case 'generate_counselor_summary': {
        result.counselorSummary = `Student readiness: ${readiness.score}%. Applications: ${applications.length}. Visa stage: ${visaFile?.stage || 'not_started'}. Open risks: ${riskFlags.length}. Missing items: ${missingItems.length}. Completed interviews: ${interviews.filter(i => i.status === 'completed').length}.`;
        break;
      }
      case 'generate_visa_officer_checklist': {
        result.visaOfficerChecklist = readiness.items.map(i => ({
          item: i.label,
          weight: i.weight,
          status: i.status,
          action: i.status === 'completed' ? 'VERIFIED' : i.status === 'under_review' ? 'REVIEW IN PROGRESS' : 'AWAITING STUDENT',
        }));
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Log AI action
    await db.aiLog.create({
      data: {
        command: `visa_coach_${action}`,
        inputText: `studentId=${studentId}`,
        outputText: JSON.stringify(result).substring(0, 500),
        status: 'completed',
      },
    }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Visa Coach error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
