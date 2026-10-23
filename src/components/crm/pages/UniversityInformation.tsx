'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type RecordData = Record<string, unknown>;
const groups: [string, string[]][] = [
  ['University overview', ['universityId', 'universityCode', 'name', 'slug', 'type', 'founded', 'description', 'overview', 'publicDescription', 'partnerDescription', 'aliases', 'students', 'intlStudents']],
  ['Location & campuses', ['country', 'countryId', 'state', 'city', 'address', 'campusName', 'campuses']],
  ['Admissions & international support', ['ieltsMin', 'admissionNotes', 'contactEmail', 'internationalStudentSupportSummary', 'internationalStudentUrl', 'applicationUrl', 'officialInternationalAdmissionsUrl', 'officialCourseSearchUrl']],
  ['Fees, scholarships & rankings', ['tuitionRange', 'scholarships', 'scholarshipUrl', 'officialTuitionFeeUrl', 'officialScholarshipUrl', 'ranking', 'worldRanking', 'rankingProvider', 'rankingYear', 'rankingValue', 'rankingBand', 'rankingSourceUrl']],
  ['Official sources & verification', ['website', 'officialUrl', 'sourceUrl', 'sourceUrls', 'verificationStatus', 'publicationStatus', 'visibility', 'status', 'lastVerifiedAt', 'lastApprovedUpdateAt', 'createdAt', 'updatedAt']],
  ['Media & usage permissions', ['logo', 'logoSourceUrl', 'heroImageSourceUrl', 'mediaUsagePermissionStatus']],
];
const relations: [string, string, string[]][] = [
  ['courses', 'Courses & programmes', ['courseId', 'courseTitle', 'studyLevel', 'qualification', 'subjectArea', 'durationMonths', 'tuitionFee', 'currency', 'verificationStatus', 'sourceUrl', 'officialUrl']],
  ['campusRecords', 'Campus records', ['campusName', 'name', 'city', 'country', 'address', 'verificationStatus', 'sourceUrl', 'officialUrl']],
  ['rankingRecords', 'Ranking records', ['provider', 'rankingTitle', 'rankingYear', 'rank', 'rankBand', 'officialRankingSourceUrl', 'retrievedDate', 'verificationStatus']],
  ['scholarshipRecords', 'Scholarships', ['scholarshipName', 'provider', 'scholarshipAmount', 'scholarshipCurrency', 'awardPercentage', 'eligibleCountries', 'eligibleLevels', 'deadline', 'verificationStatus', 'officialScholarshipUrl']],
  ['requirements', 'Course requirements', ['courseId', 'academicReq', 'acceptedQualifications', 'gradingSystem', 'minScore', 'englishTest', 'componentScores', 'ieltsOverall', 'ieltsMinBand', 'pteOverall', 'pteMinBand', 'toeflOverall', 'detOverall', 'workExperience', 'moiAccepted', 'ownEnglishTest', 'portfolioRequired', 'interviewRequired', 'prerequisiteSubjects', 'countrySpecificRequirement', 'verificationStatus', 'officialRequirementUrl']],
  ['intakeFees', 'Intakes & fees', ['courseId', 'intakeMonth', 'intakeYear', 'applicationDeadline', 'yearlyTuition', 'tuitionCurrency', 'verificationStatus', 'sourceUrl']],
];
function label(key: string) { return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()); }
function Value({ value, field }: { value: unknown; field: string }) {
  if (value === null || value === undefined || value === '' || value === '[]' || value === 0) return <>Not recorded</>;
  if (typeof value === 'boolean') return <>{value ? 'Yes (recorded flag; check evidence)' : 'No (recorded flag; check evidence)'}</>;
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  let href: string | null = null;
  try { const url = new URL(text); if (url.protocol === 'https:' && !url.username && !url.password) href = url.href; } catch { /* Display invalid or unsafe links as text only. */ }
  if (href) return <a className="break-all text-[var(--alo-brand)] underline" href={href} target="_blank" rel="noopener noreferrer">{text}</a>;
  return <span className="whitespace-pre-wrap break-words">{field === 'worldRanking' || field === 'ranking' ? `${text} (provider/year must be checked)` : text}</span>;
}
export function UniversityInformationFields({ record, fields }: { record: RecordData; fields: string[] }) {
  return <dl className="grid gap-4 sm:grid-cols-2">{fields.map((key) => <div key={key} className="min-w-0"><dt className="text-xs font-medium text-[var(--alo-text-muted)]">{label(key)}</dt><dd className="mt-1 text-sm"><Value value={record[key]} field={key} /></dd></div>)}</dl>;
}
export default function UniversityInformation({ universityId, onBack }: { universityId: string; onBack: () => void }) {
  const [record, setRecord] = useState<RecordData | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setRecord(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/crm/universities?${new URLSearchParams({ universityId })}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
        const body = await response.json();
        if (!response.ok || !body.success || !body.university) throw new Error('Unavailable');
        if (!controller.signal.aborted) setRecord(body.university);
      } catch { if (!controller.signal.aborted) setError('University information could not be loaded. No conclusions about availability can be drawn from this error.'); }
    })();
    return () => controller.abort();
  }, [universityId, retry]);
  return <div className="space-y-5">
    <Button variant="outline" onClick={onBack}>Back to all universities</Button>
    {error ? <div role="alert" className="space-y-3"><p>{error}</p><Button onClick={() => setRetry((value) => value + 1)}>Retry</Button></div> : !record ? <p role="status">Loading university information…</p> : <>
      <header><h1 className="text-2xl font-bold">{String(record.name || 'University information')}</h1><p className="mt-2 text-sm text-[var(--alo-text-muted)]">All recorded university profile information. Stored records and verification labels do not prove complete university research. Unrecorded information is not inferred.</p></header>
      {groups.map(([title, fields]) => <Card key={title}><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent><UniversityInformationFields record={record} fields={fields} /></CardContent></Card>)}
      {relations.map(([key, title, fields]) => {
        const rows = Array.isArray(record[key]) ? record[key] as RecordData[] : [];
        const total = (record._count as RecordData | undefined)?.[key];
        return <Card key={key}><CardHeader><CardTitle className="text-lg">{title}</CardTitle><p className="text-sm text-[var(--alo-text-muted)]">Showing {rows.length} of {typeof total === 'number' ? total : 'unknown'} stored records. Related previews are limited to 50; this is not a completeness claim.</p></CardHeader><CardContent className="space-y-4">{rows.length ? rows.map((row, index) => <div className="rounded-lg border p-4" key={String(row.id || index)}><UniversityInformationFields record={row} fields={fields.filter((field) => row[field] !== undefined)} /></div>) : <p className="text-sm">No related records stored in this section.</p>}</CardContent></Card>;
      })}
    </>}
  </div>;
}
