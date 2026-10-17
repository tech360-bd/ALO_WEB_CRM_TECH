import { db } from '@/lib/db'

/**
 * Visa Readiness scoring weights (must total 100%):
 * Profile 10%, Academic Documents 15%, English Test 10%, Offer Letter 10%,
 * Deposit Receipt 10%, CAS/I-20/COE 15%, Financial Proof 15%,
 * Visa SOP/GTE/Statement 5%, Interview Practice 5%, Final Review 5%
 */
export const VISA_READINESS_WEIGHTS = [
  { key: 'profile', label: 'Profile', weight: 10 },
  { key: 'academic_documents', label: 'Academic Documents', weight: 15 },
  { key: 'english_test', label: 'English Test', weight: 10 },
  { key: 'offer_letter', label: 'Offer Letter', weight: 10 },
  { key: 'deposit_receipt', label: 'Deposit Receipt', weight: 10 },
  { key: 'cas_document', label: 'CAS / I-20 / COE', weight: 15 },
  { key: 'financial_proof', label: 'Financial Proof', weight: 15 },
  { key: 'visa_sop', label: 'Visa SOP / GTE / Statement', weight: 5 },
  { key: 'interview_practice', label: 'Interview Practice', weight: 5 },
  { key: 'final_review', label: 'Final Review', weight: 5 },
] as const

export type VisaReadinessItemStatus =
  | 'completed'
  | 'pending'
  | 'under_review'
  | 'rejected'
  | 'needs_correction'

export interface VisaReadinessItem {
  key: string
  label: string
  weight: number
  status: VisaReadinessItemStatus
  note?: string
}

/**
 * Compute the visa readiness score for a student.
 * Uses documents, applications, visa file, financial proof, interview sessions.
 */
export async function computeVisaReadiness(studentId: string): Promise<{
  items: VisaReadinessItem[]
  score: number
  completedWeight: number
}> {
  const [student, documents, applications, visaFile, financialProof, interviews] = await Promise.all([
    db.student.findUnique({ where: { id: studentId } }),
    db.document.findMany({ where: { studentId } }),
    db.application.findMany({ where: { studentId } }),
    db.visaFile.findFirst({ where: { studentId, status: 'active' } }),
    db.financialProofReview.findFirst({ where: { studentId }, orderBy: { createdAt: 'desc' } }),
    db.interviewSession.findMany({ where: { studentId } }),
  ])

  const profileComplete =
    !!student &&
    !!student.firstName &&
    !!student.lastName &&
    !!student.phone &&
    !!student.email &&
    !!student.nationality &&
    !!student.preferredCountry

  const academicDocTypes = [
    'ssc_certificate', 'ssc_transcript', 'hsc_certificate', 'hsc_transcript',
    'bachelor_certificate', 'bachelor_transcript', 'master_certificate', 'master_transcript',
  ]
  const academicApproved = documents.filter(d => academicDocTypes.includes(d.documentType) && d.status === 'approved')
  const academicUploaded = documents.filter(d => academicDocTypes.includes(d.documentType) && ['uploaded', 'under_review', 'approved'].includes(d.status))
  const academicStatus: VisaReadinessItemStatus = academicApproved.length >= 2
    ? 'completed'
    : academicUploaded.length >= 2
    ? 'under_review'
    : 'pending'

  const englishDocTypes = ['ielts', 'ielts_ukvi', 'pte', 'toefl', 'duolingo', 'oietc', 'oxford_ellt', 'moi', 'university_english_test']
  const englishApproved = documents.find(d => englishDocTypes.includes(d.documentType) && d.status === 'approved')
  const englishUploaded = documents.find(d => englishDocTypes.includes(d.documentType) && ['uploaded', 'under_review'].includes(d.status))
  const englishStatus: VisaReadinessItemStatus = englishApproved
    ? 'completed'
    : englishUploaded
    ? 'under_review'
    : 'pending'

  const hasUnconditionalOffer = applications.some(a => a.status === 'unconditional_offer')
  const hasConditionalOffer = applications.some(a => a.status === 'conditional_offer')
  const offerStatus: VisaReadinessItemStatus = hasUnconditionalOffer
    ? 'completed'
    : hasConditionalOffer
    ? 'under_review'
    : 'pending'

  const depositApproved = documents.find(d => d.documentType === 'tuition_deposit_receipt' && d.status === 'approved')
  const depositUploaded = documents.find(d => d.documentType === 'tuition_deposit_receipt' && ['uploaded', 'under_review'].includes(d.status))
  const depositStatus: VisaReadinessItemStatus = depositApproved
    ? 'completed'
    : depositUploaded
    ? 'under_review'
    : 'pending'

  const casTypes = ['cas', 'i20', 'coe']
  const casApproved = documents.find(d => casTypes.includes(d.documentType) && d.status === 'approved')
  const casUploaded = documents.find(d => casTypes.includes(d.documentType) && ['uploaded', 'under_review'].includes(d.status))
  const casStatus: VisaReadinessItemStatus = casApproved
    ? 'completed'
    : casUploaded
    ? 'under_review'
    : visaFile?.stage && ['cas_received', 'visa_file_preparing', 'visa_submitted'].includes(visaFile.stage)
    ? 'under_review'
    : 'pending'

  let financialStatus: VisaReadinessItemStatus = 'pending'
  if (financialProof) {
    const items = [
      financialProof.bankStatementStatus,
      financialProof.bankSolvencyStatus,
      financialProof.sponsorLetterStatus,
      financialProof.affidavitStatus,
      financialProof.taxDocumentStatus,
      financialProof.incomeSourceStatus,
      financialProof.depositReceiptStatus,
    ]
    const approvedCount = items.filter(s => s === 'approved').length
    const rejected = items.some(s => s === 'rejected')
    if (approvedCount >= 5 && !rejected) financialStatus = 'completed'
    else if (rejected) financialStatus = 'needs_correction'
    else if (items.some(s => s === 'under_review')) financialStatus = 'under_review'
    else if (approvedCount > 0) financialStatus = 'under_review'
  }

  const sopApproved = documents.find(d => d.documentType === 'sop' && d.status === 'approved')
  const sopUploaded = documents.find(d => d.documentType === 'sop' && ['uploaded', 'under_review'].includes(d.status))
  const sopStatus: VisaReadinessItemStatus = sopApproved ? 'completed' : sopUploaded ? 'under_review' : 'pending'

  const completedInterviews = interviews.filter(i => i.status === 'completed')
  const interviewStatus: VisaReadinessItemStatus = completedInterviews.length >= 2
    ? 'completed'
    : completedInterviews.length === 1
    ? 'under_review'
    : 'pending'

  const finalReviewStatus: VisaReadinessItemStatus =
    visaFile?.stage === 'visa_file_ready' || visaFile?.stage === 'visa_submitted'
      ? 'completed'
      : visaFile?.stage && ['document_review', 'cas_received', 'visa_file_preparing'].includes(visaFile.stage)
      ? 'under_review'
      : 'pending'

  const items: VisaReadinessItem[] = [
    { key: 'profile', label: 'Profile', weight: 10, status: profileComplete ? 'completed' : 'pending' },
    { key: 'academic_documents', label: 'Academic Documents', weight: 15, status: academicStatus },
    { key: 'english_test', label: 'English Test', weight: 10, status: englishStatus },
    { key: 'offer_letter', label: 'Offer Letter', weight: 10, status: offerStatus },
    { key: 'deposit_receipt', label: 'Deposit Receipt', weight: 10, status: depositStatus },
    { key: 'cas_document', label: 'CAS / I-20 / COE', weight: 15, status: casStatus },
    { key: 'financial_proof', label: 'Financial Proof', weight: 15, status: financialStatus },
    { key: 'visa_sop', label: 'Visa SOP / GTE / Statement', weight: 5, status: sopStatus },
    { key: 'interview_practice', label: 'Interview Practice', weight: 5, status: interviewStatus },
    { key: 'final_review', label: 'Final Review', weight: 5, status: finalReviewStatus },
  ]

  const completedWeight = items
    .filter(i => i.status === 'completed')
    .reduce((sum, i) => sum + i.weight, 0)

  return { items, score: completedWeight, completedWeight }
}

/**
 * Append an entry to the student timeline.
 */
export async function appendTimeline(opts: {
  studentId: string
  eventType: string
  title: string
  description?: string
  actorType?: 'system' | 'student' | 'partner' | 'employee' | 'ai'
  actorId?: string
  leadId?: string
  applicationId?: string
  visaFileId?: string
  documentId?: string
  messageId?: string
  metadata?: Record<string, unknown>
  isPublic?: boolean
}) {
  return db.studentTimeline.create({
    data: {
      studentId: opts.studentId,
      eventType: opts.eventType,
      title: opts.title,
      description: opts.description || null,
      actorType: opts.actorType || 'system',
      actorId: opts.actorId || null,
      leadId: opts.leadId || null,
      applicationId: opts.applicationId || null,
      visaFileId: opts.visaFileId || null,
      documentId: opts.documentId || null,
      messageId: opts.messageId || null,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      isPublic: opts.isPublic ?? true,
    },
  })
}
