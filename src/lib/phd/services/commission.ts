import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { PhdAccessError, canVerify, type PhdActor } from '../auth';
import { extractPdfPages } from '../pdf/extract';
import { calculateCommission, formatMinorUnits, validateQuoteAgainstPage } from '../commission/calculation';
import { savePhdFile, readPhdFile } from '../storage';
import { recordPhdAudit } from '../audit';
import type { z } from 'zod';
import type { commissionRecordSchema, commissionAgreementSchema } from '../validation';
import { REGENT_UNIVERSITY_LONDON } from '../constants';

const REGENT_PATTERN = /regent'?s?\s+university\s+london/i;

export function isRegentsUniversity(name: string): boolean {
  return REGENT_PATTERN.test(name);
}

export async function uploadCommissionDocument(actor: PhdActor, input: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  title?: string;
  versionLabel?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  sourceNote?: string;
}) {
  if (!canVerify(actor)) throw new PhdAccessError('Only a data verifier or administrator can upload the commission structure.', 403);
  if (input.mimeType !== 'application/pdf') throw new PhdAccessError('The commission structure must be uploaded as a PDF.', 415);

  const sha256 = createHash('sha256').update(input.buffer).digest('hex');
  const duplicate = await db.phdCommissionDocument.findUnique({ where: { sha256 } });
  if (duplicate) {
    return { document: duplicate, duplicate: true, extraction: null };
  }

  const stored = await savePhdFile({
    scope: 'commission',
    ownerSegment: 'documents',
    filename: input.filename,
    mimeType: input.mimeType,
    buffer: input.buffer,
  });

  const extraction = extractPdfPages(input.buffer);
  const document = await db.phdCommissionDocument.create({
    data: {
      filename: stored.originalName,
      title: (input.title ?? '').slice(0, 300),
      versionLabel: (input.versionLabel ?? '').slice(0, 120),
      sha256,
      storageKey: stored.storageKey,
      pageCount: extraction.pageCount,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
      sourceNote: (input.sourceNote ?? '').slice(0, 2000),
      extractionStatus: extraction.extractable ? 'EXTRACTED' : 'MANUAL_REQUIRED',
      uploadedById: actor.userId,
      pages: {
        create: extraction.pages.map((page) => ({
          pageNumber: page.pageNumber,
          text: page.text,
          extractStatus: page.text ? 'EXTRACTED' : 'EMPTY',
        })),
      },
    },
    include: { pages: { orderBy: { pageNumber: 'asc' } } },
  });

  await recordPhdAudit({
    actor,
    action: 'COMMISSION_DOCUMENT_UPLOADED',
    entityType: 'PhdCommissionDocument',
    entityId: document.id,
    details: { pages: extraction.pageCount, sha256: sha256.slice(0, 16), extractable: extraction.extractable },
  });

  return { document, duplicate: false, extraction };
}

export async function listCommissionDocuments() {
  return db.phdCommissionDocument.findMany({
    include: { _count: { select: { pages: true, records: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCommissionDocument(documentId: string) {
  const document = await db.phdCommissionDocument.findUnique({
    where: { id: documentId },
    include: {
      pages: { orderBy: { pageNumber: 'asc' } },
      records: { include: { conditions: true, university: { select: { name: true } } }, orderBy: { pageNumber: 'asc' } },
    },
  });
  if (!document) throw new PhdAccessError('Commission document not found.', 404);
  return document;
}

export async function readCommissionDocumentFile(actor: PhdActor, documentId: string) {
  if (!canVerify(actor)) throw new PhdAccessError('Only a data verifier or administrator can inspect the source PDF.', 403);
  const document = await db.phdCommissionDocument.findUnique({ where: { id: documentId } });
  if (!document) throw new PhdAccessError('Commission document not found.', 404);
  const buffer = await readPhdFile(document.storageKey);
  await recordPhdAudit({ actor, action: 'COMMISSION_SOURCE_VIEWED', entityType: 'PhdCommissionDocument', entityId: documentId });
  return { buffer, filename: document.filename };
}

export async function createCommissionRecord(actor: PhdActor, input: z.infer<typeof commissionRecordSchema>) {
  if (!canVerify(actor)) throw new PhdAccessError('Only a data verifier or administrator can record commission terms.', 403);

  let universityId = input.universityId ?? null;
  let pageValidation: { matches: boolean; coverage: number; reason: string } | null = null;

  if (!universityId && input.universityNameRaw) {
    const matched = await db.phdUniversity.findFirst({
      where: { name: { equals: input.universityNameRaw.trim() } },
      select: { id: true },
    });
    universityId = matched?.id ?? null;
  }

  if (isRegentsUniversity(input.universityNameRaw) && !REGENT_PATTERN.test(input.exclusions ?? '')) {
    // Still allowed to record the row, but it must not become eligible by accident.
    input.exclusions = `${input.exclusions ?? ''}\nSupplied Spring 2027 structure identifies Regent's University London as not commissionable for PhD. Page citation required.`.trim();
  }

  if (input.documentId) {
    const document = await db.phdCommissionDocument.findUnique({ where: { id: input.documentId } });
    if (!document) throw new PhdAccessError('Commission document not found.', 404);
    if (!input.pageNumber) throw new PhdAccessError('A cited page number is required when linking a commission document.', 422);
    const page = await db.phdCommissionPage.findUnique({
      where: { documentId_pageNumber: { documentId: input.documentId, pageNumber: input.pageNumber } },
    });
    if (!page) throw new PhdAccessError(`Page ${input.pageNumber} does not exist in this document (${document.pageCount} pages).`, 422);
    pageValidation = validateQuoteAgainstPage(input.exactWording, page.text);
    if (!pageValidation.matches && pageValidation.coverage < 0.9) {
      throw new PhdAccessError(`The quoted wording could not be found on page ${input.pageNumber}. ${pageValidation.reason}`, 422);
    }
  }

  const record = await db.phdCommissionRecord.create({
    data: {
      documentId: input.documentId ?? null,
      universityId,
      universityNameRaw: input.universityNameRaw.trim().slice(0, 300),
      pageNumber: input.pageNumber ?? null,
      exactWording: input.exactWording,
      commissionType: input.commissionType,
      amountMinor: input.amountMinor ?? null,
      percentageBasisPoints: input.percentageBasisPoints ?? null,
      basisGrossNet: input.basisGrossNet,
      eligibleCategory: input.eligibleCategory ?? '',
      exclusions: input.exclusions ?? '',
      paymentMilestone: input.paymentMilestone ?? '',
      effectivePeriod: input.effectivePeriod ?? '',
      clawbackTerms: input.clawbackTerms ?? '',
      extractionStatus: input.documentId ? (pageValidation?.matches ? 'EXTRACTED' : 'PARTIAL') : 'UNVERIFIED',
      verificationStatus: 'CONFIRMED_UNVERIFIED',
      notes: pageValidation ? pageValidation.reason : 'Entered manually without a linked source page.',
      createdById: actor.userId,
      conditions: {
        create: (input.conditions ?? []).map((condition) => ({
          category: condition.category,
          condition: condition.condition,
          pageNumber: condition.pageNumber ?? input.pageNumber ?? null,
        })),
      },
    },
    include: { conditions: true },
  });

  await recordPhdAudit({
    actor,
    action: 'COMMISSION_RECORD_CREATED',
    entityType: 'PhdCommissionRecord',
    entityId: record.id,
    details: { university: record.universityNameRaw, page: record.pageNumber ?? 0, type: record.commissionType },
  });

  return { record, pageValidation };
}

export async function reviewCommissionRecord(actor: PhdActor, recordId: string, input: {
  verificationStatus: 'CONFIRMED_UNVERIFIED' | 'VERIFIED_OFFICIAL' | 'CONFLICT' | 'REJECTED';
  notes?: string | null;
}) {
  if (!canVerify(actor)) throw new PhdAccessError('Only a data verifier or administrator can verify commission terms.', 403);
  const record = await db.phdCommissionRecord.findUnique({ where: { id: recordId } });
  if (!record) throw new PhdAccessError('Commission record not found.', 404);
  if (input.verificationStatus === 'VERIFIED_OFFICIAL') {
    if (!record.documentId || !record.pageNumber) {
      throw new PhdAccessError('A record cannot be verified without a source document and page number.', 422);
    }
    if (record.extractionStatus !== 'EXTRACTED') {
      throw new PhdAccessError('The quoted wording was not matched exactly to the cited page. Correct the quote before verifying.', 422);
    }
  }
  const updated = await db.phdCommissionRecord.update({
    where: { id: recordId },
    data: {
      verificationStatus: input.verificationStatus,
      lastReviewedAt: new Date(),
      reviewedById: actor.userId,
      notes: input.notes ? `${record.notes}\n${input.notes}`.slice(0, 4000) : record.notes,
    },
  });
  await recordPhdAudit({ actor, action: 'COMMISSION_RECORD_REVIEWED', entityType: 'PhdCommissionRecord', entityId: recordId, details: { status: input.verificationStatus } });
  return updated;
}

export async function upsertCommissionAgreement(actor: PhdActor, input: z.infer<typeof commissionAgreementSchema>) {
  if (!canVerify(actor)) throw new PhdAccessError('Only a data verifier or administrator can change commission eligibility.', 403);
  const excluded = isRegentsUniversity(input.universityNameRaw);
  if (excluded && input.phdCommissionStatus === 'ELIGIBLE_CONFIRMED') {
    throw new PhdAccessError(
      'Regent’s University London is excluded from the commission-eligible PhD list for the supplied Spring 2027 structure and cannot be marked eligible without an authorised, documented variation.',
      422,
    );
  }
  const confirmed = input.phdCommissionStatus === 'ELIGIBLE_CONFIRMED' || input.phdCommissionStatus === 'NOT_ELIGIBLE_CONFIRMED';
  if (confirmed && (!input.sourcePage || !input.exactWording || !input.documentId)) {
    throw new PhdAccessError('A confirmed eligibility decision requires the source document, page number and exact wording.', 422);
  }
  const universityId = input.universityId
    ?? (await db.phdUniversity.findFirst({ where: { name: { equals: input.universityNameRaw.trim() } }, select: { id: true } }))?.id
    ?? null;

  const agreement = await db.phdCommissionAgreement.upsert({
    where: { universityNameRaw: input.universityNameRaw.trim() },
    create: {
      universityId,
      universityNameRaw: input.universityNameRaw.trim(),
      phdCommissionStatus: exhaustedStatus(input, excluded),
      sourcePage: input.sourcePage ?? null,
      exactWording: input.exactWording ?? '',
      reason: input.reason ?? '',
      documentId: input.documentId ?? null,
      recordId: input.recordId ?? null,
      reviewRequired: input.phdCommissionStatus !== 'ELIGIBLE_CONFIRMED' && input.phdCommissionStatus !== 'NOT_ELIGIBLE_CONFIRMED',
      reviewedById: actor.userId,
      reviewedAt: new Date(),
    },
    update: {
      universityId,
      phdCommissionStatus: exhaustedStatus(input, excluded),
      sourcePage: input.sourcePage ?? null,
      exactWording: input.exactWording ?? '',
      reason: input.reason ?? '',
      documentId: input.documentId ?? null,
      recordId: input.recordId ?? null,
      reviewRequired: input.phdCommissionStatus !== 'ELIGIBLE_CONFIRMED' && input.phdCommissionStatus !== 'NOT_ELIGIBLE_CONFIRMED',
      reviewedById: actor.userId,
      reviewedAt: new Date(),
    },
  });
  await recordPhdAudit({ actor, action: 'COMMISSION_AGREEMENT_UPDATED', entityType: 'PhdCommissionAgreement', entityId: agreement.id, details: { status: agreement.phdCommissionStatus } });
  return agreement;
}

function exhaustedStatus(
  input: { phdCommissionStatus: string },
  excluded: boolean,
): 'ELIGIBLE_CONFIRMED' | 'NOT_ELIGIBLE_CONFIRMED' | 'EXCLUDED_BY_SUPPLIED_STRUCTURE' | 'UNCONFIRMED' {
  if (excluded) return 'EXCLUDED_BY_SUPPLIED_STRUCTURE';
  return input.phdCommissionStatus as 'ELIGIBLE_CONFIRMED' | 'NOT_ELIGIBLE_CONFIRMED' | 'EXCLUDED_BY_SUPPLIED_STRUCTURE' | 'UNCONFIRMED';
}

export async function listCommissionAgreements() {
  return db.phdCommissionAgreement.findMany({
    include: { university: { select: { name: true, slug: true } } },
    orderBy: { universityNameRaw: 'asc' },
  });
}

export async function calculateCommissionForRecord(actor: PhdActor, recordId: string, input: {
  feeId?: string | null;
  netFeeMinor?: number | null;
} = {}) {
  if (!canVerify(actor)) throw new PhdAccessError('Only a data verifier or administrator can calculate commission.', 403);
  const record = await db.phdCommissionRecord.findUnique({ where: { id: recordId }, include: { university: true } });
  if (!record) throw new PhdAccessError('Commission record not found.', 404);
  const agreement = await db.phdCommissionAgreement.findFirst({
    where: {
      OR: [
        ...(record.universityId ? [{ universityId: record.universityId }] : []),
        { universityNameRaw: record.universityNameRaw },
      ],
    },
  });
  const fee = input.feeId
    ? await db.phdTuitionFee.findUnique({ where: { id: input.feeId } })
    : record.universityId
      ? await db.phdTuitionFee.findFirst({
          where: { universityId: record.universityId, verificationStatus: 'VERIFIED_OFFICIAL' },
          orderBy: { academicYear: 'desc' },
        })
      : null;

  const calculation = calculateCommission({
    record: {
      commissionType: record.commissionType,
      amountMinor: record.amountMinor,
      percentageBasisPoints: record.percentageBasisPoints,
      basisGrossNet: record.basisGrossNet,
      exclusions: record.exclusions,
      eligibleCategory: record.eligibleCategory,
      verificationStatus: record.verificationStatus,
      extractionStatus: record.extractionStatus,
      exactWording: record.exactWording,
      pageNumber: record.pageNumber,
      reviewRequired: record.verificationStatus !== 'VERIFIED_OFFICIAL',
      agreementStatus: agreement?.phdCommissionStatus ?? 'UNCONFIRMED',
    },
    fee: fee
      ? {
          amountMinor: fee.amountMinor,
          currency: fee.currency,
          academicYear: fee.academicYear,
          studentStatus: fee.studentStatus,
          sourceUrl: fee.sourceUrl,
          verificationStatus: fee.verificationStatus,
        }
      : null,
    netFeeMinor: input.netFeeMinor ?? null,
  });

  return {
    calculation,
    displayAmount: formatMinorUnits(calculation.amountMinor, calculation.currency ?? 'GBP'),
    agreement: agreement
      ? { status: agreement.phdCommissionStatus, reviewedAt: agreement.reviewedAt, sourcePage: agreement.sourcePage, exactWording: agreement.exactWording }
      : null,
    fee: fee
      ? { id: fee.id, amountMinor: fee.amountMinor, currency: fee.currency, academicYear: fee.academicYear, studentStatus: fee.studentStatus, verificationStatus: fee.verificationStatus }
      : null,
    disclaimer: 'Commission eligibility is a business-operations matter. It is not academic eligibility, an admissions decision or a guarantee of payment.',
  };
}

export async function commissionSummary() {
  const [documents, records, agreements, excluded, pendingReview] = await Promise.all([
    db.phdCommissionDocument.count(),
    db.phdCommissionRecord.count(),
    db.phdCommissionAgreement.count(),
    db.phdCommissionAgreement.count({ where: { phdCommissionStatus: 'EXCLUDED_BY_SUPPLIED_STRUCTURE' } }),
    db.phdCommissionRecord.count({ where: { verificationStatus: { in: ['CONFIRMED_UNVERIFIED', 'UNVERIFIED'] } } }),
  ]);
  return {
    documents,
    records,
    agreements,
    excluded,
    pendingReview,
    sourceDocumentPresent: documents > 0,
    note: documents > 0
      ? null
      : 'The Spring 2027 commission PDF is not present in this environment. Upload it in the Commission Tracker; no commission rate has been invented in its absence.',
    regentsExclusion: REGENT_UNIVERSITY_LONDON,
  };
}
