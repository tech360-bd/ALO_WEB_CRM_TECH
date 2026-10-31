'use client';

import { useRef, useState } from 'react';
import { ApplicationProcessDiagram, StudentJourneyMapDiagram, EligibilityFlowDiagram, MarketingFunnelDiagram, IntakeTimelineDiagram } from './alo-diagrams';
import { Button } from '@/components/ui/button';
import EditableDiagram from './EditableDiagram';
import { EDITABLE_DIAGRAM_TYPES, parseDiagramRows, DiagramDraftSchema, type DiagramDraft } from '@/lib/diagrams/editable';

const TYPES = ['process', 'journey', 'flow', 'funnel', 'timeline', ...EDITABLE_DIAGRAM_TYPES] as const;
type DiagramType = typeof TYPES[number];

/** Reuses the five existing diagram renderers. No invented business metrics. */
export default function DiagramStudio() {
  const [type, setType] = useState<DiagramType>('process');
  const [counts, setCounts] = useState('');
  const [title, setTitle] = useState(''); const [rows, setRows] = useState('');
  const [saved, setSaved] = useState<{ id: string; name: string; content: string; updatedAt: string }[]>([]);
  const [revision, setRevision] = useState<{ id: string; updatedAt: string } | null>(null);
  const editable = EDITABLE_DIAGRAM_TYPES.includes(type as DiagramDraft['type']);
  const parsed = editable ? parseDiagramRows(type as DiagramDraft['type'], title, rows) : null;
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
  async function savedDiagrams(save = false) {
    setBusy(true); setFeedback('');
    try {
      if (save && !parsed?.success) throw new Error('Enter a title and valid diagram rows first.');
      const response = await fetch('/api/employee/diagram-drafts', save ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...(revision ? { id: revision.id, expectedUpdatedAt: revision.updatedAt } : {}), draft: parsed?.data }) } : { cache: 'no-store' });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Diagram request failed.');
      if (save) { setRevision({ id: data.data.id, updatedAt: data.data.updatedAt }); setFeedback('Draft saved and audited.'); }
      else { setSaved(data.drafts); setFeedback(data.drafts.length ? 'Your latest 20 saved diagrams loaded.' : 'No saved diagrams yet.'); }
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Diagram request failed.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 p-4" aria-label="Diagram Studio">
    <h1 className="text-2xl font-bold">Diagram Studio</h1>
    <p className="text-sm text-[var(--alo-body)]">Twelve ALO diagram types, including seven editable layouts. Process and timeline content is illustrative guidance, not a live application status or guaranteed deadline. Funnel figures are supplied by you, not fetched business metrics.</p>
    <label className="block font-medium">Diagram type <select aria-label="Diagram type" value={type} onChange={e => { setType(e.target.value as DiagramType); setFeedback(''); setRevision(null); }} className="ml-3 rounded border p-2">{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
    {type === 'funnel' && <label className="block text-sm">Your funnel data — one label,count per line (2–12 rows)
      <textarea aria-label="Funnel data" className="mt-2 block w-full rounded border p-2" value={counts} onChange={e => setCounts(e.target.value)} rows={4} maxLength={1500} />
      {!validFunnel && <span role="alert">Enter 2–12 labels with non-negative numeric counts. No demo metrics are prefilled.</span>}
    </label>}
    {editable && <div className="space-y-3 rounded-xl border bg-[var(--alo-page)] p-4">
      <label className="block text-sm font-medium">Diagram title<input className="mt-1 block w-full rounded border bg-white p-2" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="block text-sm font-medium">Diagram rows<textarea className="mt-1 block w-full rounded border bg-white p-2 font-mono" rows={6} maxLength={8000} value={rows} onChange={e => setRows(e.target.value)} /></label>
      <p className="text-xs">One row per line: label | group | value | end. Bar: label and value. Gantt: value is start and end uses the same units. Matrix: group is column, value is 1 for allowed or 0 for denied. Org chart: group is the parent label; use a root group for the top item. Kanban and swimlane: group is lane. Sequence: each message goes from its group to the next row’s group; the final message goes to the next participant.</p>
      {parsed && !parsed.success && <p role="alert" className="text-sm">{parsed.error.issues[0]?.message}</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={busy || !parsed?.success} onClick={() => void savedDiagrams(true)}>Save diagram draft</Button><Button variant="outline" disabled={busy} onClick={() => void savedDiagrams()}>Load my diagrams</Button>{revision && <Button variant="outline" onClick={() => setRevision(null)}>Save next change as new draft</Button>}</div>
      {saved.map(item => <Button key={item.id} variant="outline" onClick={() => { try { const result = DiagramDraftSchema.parse(JSON.parse(item.content)); setType(result.type); setTitle(result.title); setRows(result.rows.map(row => `${row.label} | ${row.group} | ${row.value} | ${row.end}`).join('\n')); setRevision({ id: item.id, updatedAt: item.updatedAt }); } catch { setFeedback('This saved draft is invalid and cannot be opened.'); } }}>{item.name}</Button>)}
    </div>}
    <div className="flex flex-wrap gap-2">{(['svg','png','copy'] as const).map(kind => <Button key={kind} onClick={() => void exportDiagram(kind)} disabled={busy || (type === 'funnel' && !validFunnel) || (editable && !parsed?.success)}>{kind === 'copy' ? 'Copy SVG' : `Download ${kind.toUpperCase()}`}</Button>)}</div>
    <p role="status" aria-live="polite">{feedback}</p>
    <div ref={root} className="overflow-x-auto rounded border bg-white p-2">
      {editable && parsed?.success && <EditableDiagram draft={parsed.data} />}
      {type === 'process' && <ApplicationProcessDiagram />}
      {type === 'journey' && <StudentJourneyMapDiagram />}
      {type === 'flow' && <EligibilityFlowDiagram />}
      {type === 'timeline' && <IntakeTimelineDiagram />}
      {type === 'funnel' && validFunnel && <MarketingFunnelDiagram stages={stages} />}
    </div>
  </section>;
}
