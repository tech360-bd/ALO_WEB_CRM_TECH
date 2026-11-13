'use client';

import SeoEvidencePanel from '@/components/crm/seo/SeoEvidencePanel';
import Link from 'next/link';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ShieldCheck } from 'lucide-react';

interface AuditCheckRow {
  id: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  measured: string;
  detail: string;
}

interface AuditReport {
  verification: string;
  auditedAt: string;
  summary: { passed: number; warnings: number; failed: number; totalChecks: number };
  checks: AuditCheckRow[];
  jsonLd: {
    totalBlocks: number;
    validBlocks: number;
    detectedTypes: string[];
    errors: string[];
    advisories: string[];
  };
}

export default function SEOBlogManagerView() {
  const [title, setTitle] = useState('Study in the UK from Bangladesh — Entry & Scholarships | ALO');
  const [metaDescription, setMetaDescription] = useState(
    'Compare verified UK universities, entry criteria, tuition fees, and scholarships for Bangladeshi students with ALO Education counseling.',
  );
  const [canonicalUrl, setCanonicalUrl] = useState('https://aloeducation.com/destinations/uk');
  const [markdown, setMarkdown] = useState(
    '# Study in the UK from Bangladesh\n\nExplore verified programs via [Course Finder](/course-finder) and compare [UK Scholarships](/scholarships).\n\n## Entry Requirements\n\nCheck university-specific academic and English criteria before applying.',
  );
  const [attachSchemas, setAttachSchemas] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [report, setReport] = useState<AuditReport | null>(null);

  const runAudit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuditing(true);
    setAuditError('');
    try {
      const response = await fetch('/api/seo/audit', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          metaDescription,
          canonicalUrl,
          markdown,
          attachDefaultAloSchemas: attachSchemas,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.report) {
        setAuditError(json.error || `SEO audit failed (${response.status}).`);
        return;
      }
      setReport(json.report as AuditReport);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : 'Network error running SEO audit.');
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <SeoEvidencePanel mode="keywords" />
      <SeoEvidencePanel mode="technical" />

      <Card className="border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--alo-brand)]" />
            Deterministic On-Page Technical SEO &amp; Schema.org JSON-LD Auditor
          </CardTitle>
          <p className="text-xs text-[var(--alo-text-muted)]">
            Evaluates supplied page metadata, heading hierarchy, internal links, JSON-LD structured data, and ALO visa/admission compliance rules. Never fabricates live SERP ranks or Search Console indexation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={runAudit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1 block">
                <span className="font-semibold">Page Title (30–60 chars target)</span>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
              </label>
              <label className="space-y-1 block">
                <span className="font-semibold">Canonical HTTPS URL</span>
                <Input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} maxLength={2048} />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="font-semibold">Meta Description (70–160 chars target)</span>
              <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={500} />
            </label>
            <label className="space-y-1 block">
              <span className="font-semibold">Draft Markdown or HTML Body</span>
              <Textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} rows={5} className="font-mono text-xs" />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={attachSchemas}
                  onChange={(e) => setAttachSchemas(e.target.checked)}
                />
                Include ALO EducationalOrganization JSON-LD schema during validation
              </label>
              <Button type="submit" disabled={auditing} className="bg-[var(--alo-cta)] text-white">
                {auditing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                Run Deterministic Audit
              </Button>
            </div>
          </form>

          {auditError ? (
            <p role="alert" className="rounded-lg border border-crm-danger-border bg-crm-danger-bg p-2 text-xs text-crm-danger-text">
              {auditError}
            </p>
          ) : null}

          {report ? (
            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-crm-success-bg text-crm-success-text border-crm-success-border">
                  {report.summary.passed} PASS
                </Badge>
                <Badge className="bg-crm-warning-bg text-crm-warning-text border-crm-warning-border">
                  {report.summary.warnings} WARN
                </Badge>
                <Badge className="bg-crm-danger-bg text-crm-danger-text border-crm-danger-border">
                  {report.summary.failed} FAIL
                </Badge>
                <span className="text-[11px] text-[var(--alo-text-muted)]">
                  Mode: {report.verification}
                </span>
              </div>

              <div className="divide-y rounded-xl border">
                {report.checks.map((c) => (
                  <div key={c.id} className="p-3 text-xs flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-semibold flex items-center gap-1.5">
                        {c.status === 'PASS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : c.status === 'WARN' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                        )}
                        {c.label}
                      </p>
                      <p className="text-[var(--alo-text-muted)]">{c.detail}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                      {c.measured}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Link href="/crm/seo-manager" className="inline-block rounded border p-3 text-[var(--alo-brand)]">
        Open existing SEO draft and approval workbench
      </Link>
      <p className="text-sm">
        AI generation requires a configured provider and human factual review. No provider test has been performed.
      </p>
    </div>
  );
}
