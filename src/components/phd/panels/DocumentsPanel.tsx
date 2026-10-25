'use client';

import * as React from 'react';
import { Button, Card, Empty, ErrorBox, Field, Loading, Pill, formatDate, inputClass, useApi, useProjectId } from '../ui';

interface DocumentRow {
  id: string;
  name: string;
  documentType: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  status: string;
  createdAt: string;
  retentionUntil: string | null;
  applicationId: string | null;
  requirementId: string | null;
}

const DOCUMENT_TYPES = [
  'ACADEMIC_CV',
  'RESEARCH_PROPOSAL',
  'PERSONAL_STATEMENT',
  'DEGREE_CERTIFICATE',
  'ACADEMIC_TRANSCRIPT',
  'ENGLISH_EVIDENCE',
  'ACADEMIC_REFERENCE',
  'PROFESSIONAL_REFERENCE',
  'PASSPORT_ID',
  'WRITING_SAMPLE',
  'PORTFOLIO',
  'ETHICS_DATA_ACCESS',
  'FUNDING_DOCUMENT',
  'PROGRAMME_SPECIFIC',
  'OTHER',
];

const MAX_BYTES = 15 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPanel() {
  const { projectId, error: projectError, loading: projectLoading } = useProjectId();
  const { data, error, loading, reload } = useApi<{ documents: DocumentRow[] }>(
    projectId ? `/api/phd/projects/${projectId}/documents` : null,
  );
  const [file, setFile] = React.useState<File | null>(null);
  const [documentType, setDocumentType] = React.useState('ACADEMIC_CV');
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!projectId || !file) return;
    if (file.size > MAX_BYTES) {
      setActionError('The file exceeds the 15 MB limit.');
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('documentType', documentType);
      const response = await fetch(`/api/phd/projects/${projectId}/documents`, {
        method: 'POST',
        body,
        credentials: 'same-origin',
      });
      const json: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((json as { error?: string }).error || `The upload failed (${response.status}).`);
      }
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(documentId: string) {
    setActionError(null);
    try {
      const response = await fetch(`/api/phd/documents/${documentId}`, { method: 'DELETE', credentials: 'same-origin' });
      const json: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((json as { error?: string }).error || `The request failed (${response.status}).`);
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The document could not be removed.');
    }
  }

  if (projectLoading) return <Loading label="Preparing your project…" />;
  if (projectError) return <ErrorBox message={projectError} />;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card
        title="Upload a document"
        description="Files are private to your account. Downloads are checked for ownership and audit-logged; there is no public link."
      >
        <form onSubmit={upload} className="space-y-3">
          <Field label="Document type">
            <select className={inputClass} value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="File" hint="PDF, DOCX, XLSX, TXT, CSV, PNG or JPG — up to 15 MB.">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full text-xs"
            />
          </Field>
          <Button type="submit" disabled={busy || !file || !projectId}>
            {busy ? 'Uploading…' : 'Upload document'}
          </Button>
          {actionError && <p className="text-xs text-red-700">{actionError}</p>}
          <p className="text-[11px] text-[var(--alo-text-muted)]">
            Removing a document is a soft delete with a retention window; the audit trail is kept.
          </p>
        </form>
      </Card>

      <Card title="My documents" className="lg:col-span-2">
        {loading ? (
          <Loading label="Loading documents…" />
        ) : error ? (
          <ErrorBox message={error} />
        ) : !data || data.documents.length === 0 ? (
          <Empty title="No documents yet" hint="Upload your CV, transcripts and certificates so each application checklist can track them." />
        ) : (
          <ul className="divide-y divide-[var(--alo-border)]/60 text-xs">
            {data.documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-semibold text-[var(--alo-text)]">{document.name}</p>
                  <p className="text-[var(--alo-text-muted)]">
                    {document.documentType.replace(/_/g, ' ').toLowerCase()} · v{document.version} ·{' '}
                    {formatSize(document.sizeBytes)} · uploaded {formatDate(document.createdAt)}
                    {document.retentionUntil ? ` · retained until ${formatDate(document.retentionUntil)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={document.status === 'VERIFIED' ? 'ok' : document.status === 'REJECTED' ? 'bad' : 'default'}>
                    {document.status.toLowerCase()}
                  </Pill>
                  <a href={`/api/phd/documents/${document.id}`} className="font-semibold text-[var(--alo-brand)] underline">
                    Download
                  </a>
                  <button type="button" onClick={() => remove(document.id)} className="text-[11px] font-semibold text-red-700 underline">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
