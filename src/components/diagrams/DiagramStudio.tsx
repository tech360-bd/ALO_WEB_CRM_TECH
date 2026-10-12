'use client';

import { useRef, useState } from 'react';
import { ApplicationProcessDiagram, StudentJourneyMapDiagram, EligibilityFlowDiagram, MarketingFunnelDiagram, IntakeTimelineDiagram } from './alo-diagrams';
import { Button } from '@/components/ui/button';

const TYPES = ['process', 'journey', 'flow', 'funnel', 'timeline'] as const;
type DiagramType = typeof TYPES[number];

/** Reuses the five existing diagram renderers. No invented business metrics. */
export default function DiagramStudio() {
  const [type, setType] = useState<DiagramType>('process');
  const [counts, setCounts] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const stages = counts.split('\n').filter(line => line.trim()).map(line => {
    const at = line.lastIndexOf(',');
    return { label: at >= 0 ? line.slice(0, at).trim() : '', value: Number(at >= 0 && line.slice(at + 1).trim() ? line.slice(at + 1).trim() : NaN) };
  });
  const validFunnel = stages.length >= 2 && stages.length <= 12 && stages.every(s => s.label.length > 0 && s.label.length <= 60 && Number.isFinite(s.value) && s.value >= 0);

  function serialize() {
    const original = root.current?.querySelector('svg');
    if (!original) throw new Error('Choose a diagram with valid data first.');
    const copy = original.cloneNode(true) as SVGSVGElement;
    const originals = [original, ...original.querySelectorAll('*')];
    const copies = [copy, ...copy.querySelectorAll('*')];
    // Inline browser-computed typography so external SVGs retain their styling.
    originals.forEach((node, i) => {
      const style = getComputedStyle(node);
      for (const key of ['font-family','font-size','font-weight','letter-spacing','text-transform','fill','stroke','stroke-width']) {
        (copies[i] as SVGElement).style.setProperty(key, style.getPropertyValue(key));
      }
    });
    const view = original.viewBox.baseVal;
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copy.setAttribute('width', String(view.width)); copy.setAttribute('height', String(view.height));
    return { svg: new XMLSerializer().serializeToString(copy), width: view.width, height: view.height };
  }
  async function exportDiagram(kind: 'svg' | 'png' | 'copy') {
    setBusy(true); setFeedback('');
    try {
      const { svg, width, height } = serialize();
      if (kind === 'copy') {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable. Download SVG instead.');
        await navigator.clipboard.writeText(svg); setFeedback('SVG markup copied.'); return;
      }
      let blob = new Blob([svg], { type: 'image/svg+xml' });
      if (kind === 'png') {
        const url = URL.createObjectURL(blob);
        try {
          const image = new Image(); image.src = url; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = width * 2; canvas.height = height * 2;
          const context = canvas.getContext('2d'); if (!context) throw new Error('PNG canvas unavailable.');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'));
        } finally { URL.revokeObjectURL(url); }
      }
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `alo-${type}-diagram.${kind}`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setFeedback(`${kind.toUpperCase()} download started.`);
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Export failed.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 p-4" aria-label="Diagram Studio">
    <h1 className="text-2xl font-bold">Diagram Studio</h1>
    <p className="text-sm text-slate-600">Five existing ALO diagram types. Process and timeline content is illustrative guidance, not a live application status or guaranteed deadline. Funnel figures are supplied by you, not fetched business metrics.</p>
    <label className="block font-medium">Diagram type <select aria-label="Diagram type" value={type} onChange={e => { setType(e.target.value as DiagramType); setFeedback(''); }} className="ml-3 rounded border p-2">{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
    {type === 'funnel' && <label className="block text-sm">Your funnel data — one label,count per line (2–12 rows)
      <textarea aria-label="Funnel data" className="mt-2 block w-full rounded border p-2" value={counts} onChange={e => setCounts(e.target.value)} rows={4} maxLength={1500} />
      {!validFunnel && <span role="alert">Enter 2–12 labels with non-negative numeric counts. No demo metrics are prefilled.</span>}
    </label>}
    <div className="flex flex-wrap gap-2">{(['svg','png','copy'] as const).map(kind => <Button key={kind} onClick={() => void exportDiagram(kind)} disabled={busy || (type === 'funnel' && !validFunnel)}>{kind === 'copy' ? 'Copy SVG' : `Download ${kind.toUpperCase()}`}</Button>)}</div>
    <p role="status" aria-live="polite">{feedback}</p>
    <div ref={root} className="overflow-x-auto rounded border bg-white p-2">
      {type === 'process' && <ApplicationProcessDiagram />}
      {type === 'journey' && <StudentJourneyMapDiagram />}
      {type === 'flow' && <EligibilityFlowDiagram />}
      {type === 'timeline' && <IntakeTimelineDiagram />}
      {type === 'funnel' && validFunnel && <MarketingFunnelDiagram stages={stages} />}
    </div>
  </section>;
}
