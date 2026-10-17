'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileText, Info, Loader2, RefreshCw, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * FORM B — section E) Documents Upload.
 *
 * Spec: "Upload documents per section + status (Pending default / Verified /
 * Rejected) + counsellor comment box; only the counsellor changes the status and
 * the comment; the student can read the comment."
 *
 * Enforcement lives on the server: students may only upload
 * (POST /api/student/documents) and read (/api/student/documents GET, which
 * returns status + reviewer note). Review actions are staff-only
 * (PATCH /api/documents requires portal staff auth), so this screen deliberately
 * offers no way to set or clear a status.
 *
 * The upload API stores one row per document type (category); a newer file
 * becomes the next version of the same type, which is exactly how the portal
 * keeps "current" and "earlier version" honest.
 */

interface StudentDocument {
  id: string;
  category: string;
  fileName: string;
  fileSize: number;
  status: string;
  version: number;
  reviewerNote: string;
  rejectionReason: string;
  reviewedBy: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
}

interface RequiredDocument {
  category: string;
  label: string;
  hint?: string;
  /** Only required when the linked Form B answer says so. */
  conditional?: 'visaRefusal' | 'workExperience';
}

interface DocumentGroup {
  section: string;
  sectionLabel: string;
  documents: RequiredDocument[];
}

/**
 * Which Form B section each document belongs to. The categories match the
 * vocabulary already used by the portal and the CRM reviewer queue.
 */
const REQUIRED_DOCUMENTS: DocumentGroup[] = [
  {
    section: 'personal',
    sectionLabel: 'A) Personal Information',
    documents: [
      { category: 'NID', label: 'National ID / Birth certificate' },
      { category: 'PHOTO', label: 'Passport-size photograph (optional)', hint: 'Optional — speeds up university forms.' },
    ],
  },
  {
    section: 'passport',
    sectionLabel: 'Passport Details',
    documents: [{ category: 'PASSPORT', label: 'Passport (bio-data page)' }],
  },
  {
    section: 'education',
    sectionLabel: 'B) Educational Background',
    documents: [
      { category: 'ACADEMIC_CERT', label: 'Academic certificates (SSC/HSC/degree)' },
      { category: 'TRANSCRIPT', label: 'Academic transcripts / marksheets' },
    ],
  },
  {
    section: 'english',
    sectionLabel: 'D) English Proficiency',
    documents: [
      { category: 'IELTS_CERT', label: 'English test certificate (IELTS/PTE/TOEFL/Duolingo)', hint: 'Upload the score report when your section D test is recorded.' },
    ],
  },
  {
    section: 'background',
    sectionLabel: 'Background & Visa History',
    documents: [
      { category: 'REFUSAL_LETTER', label: 'Visa refusal letter / decision notice', conditional: 'visaRefusal' },
      { category: 'VISA_DOC', label: 'Any current or previous visa (optional)', hint: 'Optional.' },
    ],
  },
  {
    section: 'work',
    sectionLabel: 'C) Work Experience',
    documents: [{ category: 'CV', label: 'CV / résumé', conditional: 'workExperience' }],
  },
  {
    section: 'reference',
    sectionLabel: 'Reference / LOR',
    documents: [{ category: 'LOR', label: 'Letter of recommendation (optional)', hint: 'Optional — some universities ask for two.' }],
  },
  {
    section: 'funding',
    sectionLabel: 'Funding Information',
    documents: [
      { category: 'BANK_STATEMENT', label: 'Bank statement / proof of funds' },
      { category: 'SPONSOR_DOC', label: 'Sponsor affidavit or income proof', hint: 'Required when a sponsor funds the studies.' },
    ],
  },
  {
    section: 'admission',
    sectionLabel: 'Admission Preference',
    documents: [{ category: 'SOP', label: 'Statement of purpose (draft accepted)', hint: 'Your counselor reviews and returns comments here.' }],
  },
];

type ChipTone = 'pending' | 'verified' | 'rejected' | 'missing';

function chipFor(status?: string): { tone: ChipTone; label: string } {
  const value = (status || '').toLowerCase();
  if (!value || value === 'not_uploaded') return { tone: 'missing', label: 'Not uploaded' };
  if (['verified', 'approved'].includes(value)) return { tone: 'verified', label: 'Verified' };
  if (['rejected', 'needs_update', 'needs-update'].includes(value)) return { tone: 'rejected', label: 'Rejected' };
  return { tone: 'pending', label: 'Pending review' };
}

function chipClass(tone: ChipTone) {
  if (tone === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (tone === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
  if (tone === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function humanSize(bytes: number) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function FormBDocumentsSection({
  token,
  onSummaryChange,
}: {
  token?: string | null;
  onSummaryChange?: (summary: { loaded: boolean; complete: boolean; pending: number; missing: number; rejected: number }) => void;
}) {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{ category: string; message: string } | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const authHeaders = useMemo<Record<string, string>>(
    () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/documents', { headers: authHeaders, credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Documents could not be loaded.');
      setDocuments(Array.isArray(json.data) ? json.data : []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Documents could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const latestByCategory = useMemo(() => {
    const map = new Map<string, StudentDocument>();
    for (const document of documents) {
      const key = document.category || '';
      const current = map.get(key);
      if (!current || (document.version || 0) > (current.version || 0)) map.set(key, document);
    }
    return map;
  }, [documents]);

  const summary = useMemo(() => {
    const counts = { pending: 0, missing: 0, rejected: 0, verified: 0 };
    for (const group of REQUIRED_DOCUMENTS) {
      for (const required of group.documents) {
        if (required.hint?.startsWith('Optional')) continue;
        const document = latestByCategory.get(required.category);
        const tone = chipFor(document?.status).tone;
        if (tone === 'verified') counts.verified += 1;
        else if (tone === 'pending') counts.pending += 1;
        else if (tone === 'rejected') counts.rejected += 1;
        else counts.missing += 1;
      }
    }
    return counts;
  }, [latestByCategory]);

  useEffect(() => {
    onSummaryChange?.({
      loaded: !loading && !error,
      complete: summary.missing === 0 && summary.rejected === 0,
      pending: summary.pending,
      missing: summary.missing,
      rejected: summary.rejected,
    });
  }, [loading, error, summary, onSummaryChange]);

  const upload = async (category: string) => {
    const input = fileInputs.current[category];
    const file = input?.files?.[0];
    if (!file) {
      setUploadError({ category, message: 'Choose a PDF or image file first.' });
      return;
    }
    setUploading(category);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append('documentType', category);
      body.append('file', file);
      const res = await fetch('/api/student/documents', { method: 'POST', headers: authHeaders, credentials: 'include', body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed.');
      if (input) input.value = '';
      await load();
    } catch (uploadFailure) {
      setUploadError({ category, message: uploadFailure instanceof Error ? uploadFailure.message : 'Upload failed.' });
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" /> Loading your documents…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">E) Documents Upload &amp; Verification</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload what you have — every file starts as <strong>Pending review</strong>. Only your counselor can mark a
            document <strong>Verified</strong> or <strong>Rejected</strong>, and any comment they leave appears here.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} className="h-9 gap-2 border-slate-200 text-xs">
          <RefreshCw className="size-3.5" /> Refresh status
        </Button>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="size-4" /> {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] font-semibold uppercase text-emerald-700">Verified</p>
          <p className="text-xl font-bold text-emerald-800">{summary.verified}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] font-semibold uppercase text-amber-700">Pending</p>
          <p className="text-xl font-bold text-amber-800">{summary.pending}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-[11px] font-semibold uppercase text-red-700">Rejected</p>
          <p className="text-xl font-bold text-red-800">{summary.rejected}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase text-slate-600">Not uploaded</p>
          <p className="text-xl font-bold text-slate-800">{summary.missing}</p>
        </div>
      </div>

      {REQUIRED_DOCUMENTS.map((group) => (
        <Card key={group.section} className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-[#0F172A]">{group.sectionLabel}</h3>
          <div className="mt-3 space-y-3">
            {group.documents.map((required) => {
              const document = latestByCategory.get(required.category);
              const chip = chipFor(document?.status);
              const comment = document?.reviewerNote || document?.rejectionReason || '';
              const busy = uploading === required.category;
              return (
                <div key={required.category} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#0F172A]">
                        <FileText className="size-4 text-[#0057B8]" />
                        {required.label}
                        {required.conditional === 'visaRefusal' && (
                          <span className="text-[11px] font-normal text-slate-500">(if you answered Yes to visa refusal)</span>
                        )}
                        {required.conditional === 'workExperience' && (
                          <span className="text-[11px] font-normal text-slate-500">(if you recorded work experience)</span>
                        )}
                      </p>
                      {required.hint && <p className="mt-0.5 text-[11px] text-slate-500">{required.hint}</p>}
                      {document && (
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="truncate">{document.fileName}{document.fileSize ? ` · ${humanSize(document.fileSize)}` : ''}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5">v{document.version}</span>
                          {document.reviewedAt && <span>reviewed {new Date(document.reviewedAt).toLocaleDateString()}{document.reviewedBy ? ` by ${document.reviewedBy}` : ''}</span>}
                        </p>
                      )}
                    </div>
                    <Badge className={`${chipClass(chip.tone)} whitespace-nowrap border text-[11px]`}>
                      {chip.tone === 'verified' && <CheckCircle2 className="mr-1 inline size-3" />}
                      {chip.tone === 'pending' && <Clock className="mr-1 inline size-3" />}
                      {chip.tone === 'rejected' && <XCircle className="mr-1 inline size-3" />}
                      {chip.label}
                    </Badge>
                  </div>

                  {comment && (
                    <p className={`mt-2 rounded-lg border px-3 py-2 text-xs ${chip.tone === 'rejected' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
                      <strong>Counselor comment:</strong> {comment}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      ref={(element) => {
                        fileInputs.current[required.category] = element;
                      }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                      className="max-w-full text-xs text-slate-600"
                    />
                    <Button
                      type="button"
                      onClick={() => void upload(required.category)}
                      disabled={busy}
                      className="h-9 gap-2 bg-[#0057B8] text-xs font-semibold text-white"
                    >
                      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      {document ? 'Upload new version' : 'Upload'}
                    </Button>
                    {document && (
                      <a href={document.downloadUrl} className="text-xs font-semibold text-[#0057B8] underline" target="_blank" rel="noopener noreferrer">
                        Download current file
                      </a>
                    )}
                  </div>
                  {uploadError?.category === required.category && (
                    <p className="mt-2 text-xs text-red-700">{uploadError.message}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        PDF, JPG, PNG, WEBP or GIF up to 20 MB. Files are stored privately — the download link is only valid for your own
        signed-in session, and your counselor sees the same version history. A newer upload never deletes an older
        version; it becomes v2, v3 … so nothing you submitted is lost.
      </p>
    </div>
  );
}
