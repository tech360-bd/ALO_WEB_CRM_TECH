import { useId } from 'react';
import type { DiagramDraft } from '@/lib/diagrams/editable';
import { diagramTokens as t } from './tokens';
/** Original ALO SVG layouts. All labels and values come from the user's draft. */
export default function EditableDiagram({ draft }: { draft: DiagramDraft }) {
  const uid = useId().replace(/:/g, '');
  const groups = [...new Set(draft.rows.map(row => row.group))];
  const width = Math.max(720, groups.length * 170 + 80);
  const height = Math.max(300, draft.rows.length * 56 + 130);
  const max = Math.max(1, ...draft.rows.map(row => draft.type === 'gantt' ? row.end : row.value));
  const text = (label: string, x: number, y: number, anchor: 'start' | 'middle' = 'start', maxChars = 22) => <text key={`${x}:${y}:${label}`} x={x} y={y} textAnchor={anchor} fontSize={12} fill={t.ink}><title>{label}</title>{label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label}</text>;
  return <svg role="img" aria-labelledby={`${uid}-title`} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" className="h-auto min-w-[640px] w-full">
    <title id={`${uid}-title`}>{draft.title} — {draft.type}</title>
    <defs><marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill={t.link}/></marker></defs>
    <rect width={width} height={height} rx={12} fill={t.paper}/><text x={24} y={32} fontSize={18} fontWeight={600} fill={t.ink}>{draft.title}</text>
    {draft.type === 'sequence' && <>
      {groups.map((group, i) => <g key={group}><rect x={40 + i * 170} y={55} width={150} height={32} rx={6} fill={t.paper2}/>{text(group, 115 + i * 170, 76, 'middle')}<path d={`M${115 + i * 170} 88V${height - 28}`} stroke={t.ruleSolid} strokeDasharray="4 4"/></g>)}
      {draft.rows.map((row, i) => { const from = groups.indexOf(row.group), to = groups.indexOf(draft.rows[i + 1]?.group || groups[(from + 1) % groups.length]); const x = 115 + from * 170, end = 115 + to * 170, y = 120 + i * 56; return <g key={i}><path d={from === to ? `M${x} ${y}h60v22h-60` : `M${x} ${y}H${end}`} fill="none" stroke={t.link} markerEnd={`url(#${uid}-arrow)`}/>{text(row.label, (x + end) / 2, y - 10, 'middle')}</g>; })}
    </>}
    {['swimlane','kanban'].includes(draft.type) && <>
      {groups.map((group, i) => <g key={group}><rect x={30 + i * 170} y={55} width={160} height={height - 80} rx={8} fill={t.paper2} stroke={t.rule}/>{text(group, 110 + i * 170, 80, 'middle')}{draft.rows.filter(row => row.group === group).map((row, j) => <g key={j}><rect x={40 + i * 170} y={100 + j * 56} width={140} height={44} rx={6} fill={t.paper} stroke={j === 0 ? t.accent : t.ruleSolid}/>{text(row.label, 110 + i * 170, 126 + j * 56, 'middle')}</g>)}</g>)}
    </>}
    {draft.type === 'org-chart' && draft.rows.map((row, i) => {
      const parent = draft.rows.findIndex(candidate => candidate.label === row.group);
      const y = 75 + i * 56, x = parent >= 0 ? 240 : 40;
      return <g key={i}>{parent >= 0 && <path d={`M220 ${97 + parent * 56}H230V${y + 22}H240`} fill="none" stroke={t.link}/>}<rect x={x} y={y} width={180} height={42} rx={7} fill={t.paper2} stroke={t.ruleSolid}/>{text(row.label, x + 12, y + 26)}{text(row.group, x + 200, y + 26)}</g>;
    })}
    {['bar','gantt'].includes(draft.type) && <>
      {draft.rows.map((row, i) => { const y = 75 + i * 56; const start = draft.type === 'gantt' ? row.value / max * (width - 300) : 0; const size = (draft.type === 'gantt' ? row.end - row.value : row.value) / max * (width - 300); return <g key={i}>{text(row.label, 24, y + 24)}<rect x={220 + start} y={y + 4} width={size} height={30} rx={4} fill={i === 0 ? t.accent : t.link}/>{text(draft.type === 'gantt' ? `${row.value}–${row.end}` : String(row.value), 228 + start + size, y + 24)}</g>; })}
      {text(draft.type === 'gantt' ? 'Positions use the units entered by the author.' : 'Values entered by the author; not live CRM metrics.', 24, height - 24, 'start', 120)}
    </>}
    {draft.type === 'security-matrix' && <>
      {groups.map((group, i) => text(group, 275 + i * 170, 80, 'middle'))}
      {[...new Set(draft.rows.map(row => row.label))].map((label, i) => <g key={label}>{text(label, 24, 120 + i * 44)}{groups.map((group, j) => { const row = draft.rows.find(value => value.label === label && value.group === group); return <g key={group}><rect x={220 + j * 170} y={98 + i * 44} width={110} height={32} rx={4} fill={row?.value === 1 ? t.accentTint : t.paper2} stroke={t.ruleSolid}/>{text(!row ? 'Unspecified' : row.value === 1 ? 'Allowed' : 'Denied', 275 + j * 170, 120 + i * 44, 'middle')}</g>; })}</g>)}
      {text('Design documentation only. This diagram does not grant application permissions.', 24, height - 24, 'start', 120)}
    </>}
  </svg>;
}
