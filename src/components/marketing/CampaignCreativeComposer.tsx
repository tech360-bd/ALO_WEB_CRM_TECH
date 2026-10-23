'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MarketingKit } from '@/lib/marketing-kit';
import { buildCreativeBrief, buildCreativeSvg, CREATIVE_FORMATS, creativeFromKit, validateCreative, type CreativeFormat } from '@/lib/marketing-kit/creative';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function pngFromSvg(svg: string, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Preview image could not be loaded.')); image.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser does not support image export.');
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed.')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

/** Local draft composer; no provider calls, persistence or publication side effects. */
export default function CampaignCreativeComposer({ kit }: { kit: MarketingKit }) {
  const id = useId();
  const [content, setContent] = useState(() => creativeFromKit(kit));
  const [format, setFormat] = useState<CreativeFormat>('square');
  const [feedback, setFeedback] = useState('');
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const errors = validateCreative(content);
  const svg = useMemo(() => validateCreative(content).length ? '' : buildCreativeSvg(content, format), [content, format]);
  useEffect(() => {
    if (!svg) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [svg]);
  const save = async (kind: 'svg' | 'png' | 'md') => {
    if (!svg) return;
    setExporting(true); setFeedback('');
    try {
      const size = CREATIVE_FORMATS[format];
      const blob = kind === 'png' ? await pngFromSvg(svg, size.width, size.height)
        : new Blob([kind === 'svg' ? svg : buildCreativeBrief(content, format)], { type: kind === 'svg' ? 'image/svg+xml' : 'text/markdown;charset=utf-8' });
      download(blob, `alo-${kit.id.replace(/[^a-z0-9_-]/gi, '-')}-${format}-draft.${kind}`);
      setFeedback(`${kind.toUpperCase()} draft download started. Nothing was published.`);
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Download failed.'); }
    finally { setExporting(false); }
  };
  return <section className="mt-5 rounded-2xl border border-[var(--alo-border)] bg-white p-4" aria-labelledby={`${id}-title`}>
    <h4 id={`${id}-title`} className="text-sm font-bold text-[var(--alo-text)]">Visual campaign composer</h4>
    <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Original ALO layouts. Edit a draft, preview a format, then download SVG, PNG or the copy brief. Changes stay on this page and reset when you switch kits. Exports retain the draft label.</p>
    <div className="mt-4 grid gap-5 md:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-xs font-semibold" htmlFor={`${id}-format`}>Format
          <select id={`${id}-format`} value={format} onChange={(e) => setFormat(e.target.value as CreativeFormat)} className="mt-1 w-full rounded-lg border bg-white p-2 focus-visible:outline-2 focus-visible:outline-blue-600">
            {Object.entries(CREATIVE_FORMATS).map(([value, size]) => <option key={value} value={value}>{size.label}</option>)}
          </select>
        </label>
        {([['headline', 'Headline', 110], ['body', 'Body copy', 320], ['cta', 'CTA text', 42], ['destination', 'Verified destination URL (optional for draft)', 80]] as const).map(([field, label, max]) => <label key={field} htmlFor={`${id}-${field}`} className="block text-xs font-semibold">
          {label}
          <textarea id={`${id}-${field}`} value={content[field]} maxLength={max} rows={field === 'body' ? 4 : 2} onChange={(e) => setContent({ ...content, [field]: e.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal focus-visible:outline-2 focus-visible:outline-blue-600" />
          <span aria-hidden="true" className="font-normal text-[var(--alo-text-muted)]">{content[field].length}/{max}</span>
        </label>)}
        {errors.length > 0 && <ul role="alert" className="text-xs text-red-700">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
        <div className="flex flex-wrap gap-2" aria-busy={exporting}>
          {(['svg', 'png', 'md'] as const).map((kind) => <Button key={kind} type="button" size="sm" variant="outline" disabled={!svg || exporting} onClick={() => void save(kind)}><Download aria-hidden="true" className="h-4 w-4" />{kind === 'md' ? 'Copy brief' : kind.toUpperCase()}</Button>)}
          <Button type="button" size="sm" variant="ghost" disabled={exporting} onClick={() => { setContent(creativeFromKit(kit)); setFeedback('Draft reset to the selected kit.'); }}>Reset draft</Button>
        </div>
      </div>
      <figure className="flex flex-col items-center rounded-xl bg-[var(--alo-surface-muted)] p-3">
        {previewUrl ? <img src={previewUrl} alt={`Draft ${kit.name} creative: ${content.headline}`} className="max-h-[580px] w-full object-contain" /> : <p className="p-6 text-sm text-[var(--alo-text-muted)]">Complete the fields to preview your draft.</p>}
        <figcaption className="mt-2 text-xs text-[var(--alo-text-muted)]">{CREATIVE_FORMATS[format].label} · Not approved</figcaption>
      </figure>
    </div>
    <p role="status" aria-live="polite" className="mt-3 text-xs text-[var(--alo-body)]">{feedback}</p>
  </section>;
}
