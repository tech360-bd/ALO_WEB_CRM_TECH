/** One document requirement policy for Form B and the Apply Now server gate. */
export function requiredFormBDocumentCategories(values: Record<string, unknown>): string[] {
  const categories = ['NID', 'ACADEMIC_CERT', 'TRANSCRIPT', 'BANK_STATEMENT', 'SOP'];
  const yes = (value: unknown) => typeof value === 'string' && value.toLowerCase() === 'yes';
  if (yes(values.hasPassport)) categories.push('PASSPORT');
  const tests = Array.isArray(values.englishTests) ? values.englishTests as Record<string, unknown>[] : [];
  if (yes(values.testStatus ?? values.englishTestStatus) || tests.some((test) => yes(test.testStatus ?? test.englishTestStatus))) categories.push('IELTS_CERT');
  if (yes(values.hasVisaRefusal)) categories.push('REFUSAL_LETTER');
  if (yes(values.hasWorkExp)) categories.push('CV');
  const sponsor = String(values.sponsor ?? values.sponsorType ?? '').toLowerCase();
  if (sponsor && sponsor !== 'applicant') categories.push('SPONSOR_DOC');
  return categories;
}

export function formBDocumentsComplete(
  values: Record<string, unknown>,
  documents: Array<{ category: string; status: string; version?: number; fileName?: string; storagePath?: string | null }>,
): boolean {
  return requiredFormBDocumentCategories(values).every((category) => {
    const latest = documents.filter((doc) => doc.category.toUpperCase() === category)
      .sort((a, b) => (b.version || 0) - (a.version || 0))[0];
    return Boolean(latest?.fileName && latest?.storagePath && ['pending', 'uploaded', 'under_review', 'pending_review', 'verified', 'approved'].includes(latest.status.toLowerCase()));
  });
}
