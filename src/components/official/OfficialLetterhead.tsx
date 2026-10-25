'use client';

/**
 * Official ALO Education letterhead for on-screen / print document previews.
 *
 * Visually reproduces the supplied company pad (logo lockup, blue tagline
 * strip with orange segment, orange address footer) using the current
 * official contact details from src/lib/alo-site-info.ts. Server-generated
 * downloads use the equivalent renderer
 * (`buildOfficialDocumentHtml` in src/lib/documents/official-documents.ts),
 * which always renders on the supplied letterhead artwork.
 *
 * Seal rule: pass `sealed` only when the issuing actor is a Super Admin.
 * That is a UI hint, not the security boundary — the seal image is loaded
 * from /api/official-documents/seal, which independently re-checks the
 * Super-Admin-only policy (`isSealAuthorized`) and audits every access.
 * For anyone else the request returns 403 and this component hides the
 * broken image, leaving an unsealed letterhead document.
 */

import React from 'react';
import { Globe, GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import { ALO_CONTACT, ALO_TAGLINE } from '@/lib/alo-site-info';
import { ALO_BRAND_ASSETS, type SealDocumentKind } from '@/lib/brand/brand-assets';

export interface OfficialLetterheadProps {
  children: React.ReactNode;
  /** Show the official seal (Super Admin issuers only; API re-checks). */
  sealed?: boolean;
  documentType?: SealDocumentKind;
  issuedByName?: string;
  documentReference?: string;
  note?: string;
  className?: string;
}

export default function OfficialLetterhead({
  children,
  sealed = false,
  documentType = 'employment-contract',
  issuedByName,
  documentReference,
  note,
  className = '',
}: OfficialLetterheadProps) {
  const [sealVisible, setSealVisible] = React.useState(sealed);
  React.useEffect(() => setSealVisible(sealed), [sealed]);

  return (
    <article
      data-testid="alo-official-letterhead"
      className={`mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white text-black shadow-md print:shadow-none ${className}`}
    >
      {/* ── Pad header ─────────────────────────────────────────────── */}
      <header className="px-[10mm] pt-[10mm]">
        <div className="flex items-end gap-3">
          <span aria-hidden="true" className="mb-[5mm] hidden h-[5mm] w-[12mm] shrink-0 bg-alo-brand sm:block" />
          <img
            src={ALO_BRAND_ASSETS.logo}
            alt="ALO Education logo"
            className="h-[20mm] w-auto object-contain"
            width={160}
            height={80}
          />
          <span className="leading-[0.95]">
            <span className="block font-heading text-[32pt] font-extrabold text-alo-cta">ALO</span>
            <span className="block font-heading text-[23pt] font-extrabold text-alo-brand">Education</span>
          </span>
        </div>
        <div className="mt-[2mm] flex">
          <span className="flex-1 overflow-hidden whitespace-nowrap bg-alo-brand px-4 py-1.5 text-[10pt] italic tracking-[0.28em] text-white">
            {ALO_TAGLINE.toLowerCase().replace('–', '-')}
          </span>
          <span aria-hidden="true" className="ml-2 w-[24mm] bg-alo-cta" />
        </div>
      </header>

      {/* ── Document body ──────────────────────────────────────────── */}
      <div className="flex-1 px-[10mm] py-[10mm] text-[11pt] leading-relaxed text-neutral-800">
        {children}
      </div>

      {sealVisible && (
        <div className="mb-[6mm] ml-auto mr-[10mm] w-[42mm] text-center" data-testid="alo-official-seal-block">
          <img
            src={`/api/official-documents/seal?documentType=${encodeURIComponent(documentType)}`}
            alt="ALO Education official seal"
            className="mx-auto w-[34mm]"
            width={136}
            height={124}
            onError={() => setSealVisible(false)}
          />
          <p className="mt-1 text-[8pt] text-neutral-500">
            {issuedByName ? `Issued by ${issuedByName}` : 'Officially sealed'}
          </p>
        </div>
      )}

      {(note || documentReference) && (
        <div className="space-y-1 px-[10mm] pb-[4mm] text-[8.5pt] text-neutral-500">
          {note && <p>{note}</p>}
          {documentReference && <p>Reference: {documentReference}</p>}
        </div>
      )}

      {/* ── Pad footer ─────────────────────────────────────────────── */}
      {/* Printed document footer strip — a plain div, not a page footer
          landmark: only PublicFooter/PortalFooter own page footers. */}
      <div className="mt-auto">
        <div className="flex flex-wrap gap-x-8 gap-y-1 px-[10mm] pb-2 pt-4 text-[9.5pt] font-semibold text-alo-brand">
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {ALO_CONTACT.mobileDisplay}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {ALO_CONTACT.email}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" aria-hidden="true" /> www.aloeducation.com
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 bg-alo-cta px-[10mm] py-2.5 text-[10pt] text-white">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {ALO_CONTACT.address}
          </span>
          <GraduationCap className="h-5 w-5 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
