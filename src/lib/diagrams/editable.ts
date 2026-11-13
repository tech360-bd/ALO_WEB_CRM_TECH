import { z } from 'zod';
export const EDITABLE_DIAGRAM_TYPES = ['sequence', 'org-chart', 'swimlane', 'kanban', 'bar', 'gantt', 'security-matrix'] as const;
export const DiagramDraftSchema = z.object({
  title: z.string().trim().min(1).max(100),
  type: z.enum(EDITABLE_DIAGRAM_TYPES),
  rows: z.array(z.object({ label: z.string().trim().min(1).max(60), group: z.string().trim().max(60).default(''), value: z.number().finite().min(0).max(1000000000).default(0), end: z.number().finite().min(0).max(1000000000).default(0) }).strict()).min(1).max(24),
}).strict().superRefine((draft, context) => {
  if (draft.type === 'org-chart') {
    const parents = new Map(draft.rows.map(row => [row.label, row.group]));
    if (parents.size !== draft.rows.length) context.addIssue({ code: 'custom', message: 'Org chart labels must be unique.' });
    for (const row of draft.rows) {
      const seen = new Set<string>(); let current: string | undefined = row.label;
      while (current && parents.has(current)) {
        if (seen.has(current)) { context.addIssue({ code: 'custom', message: 'Org chart cannot contain a reporting cycle.' }); break; }
        seen.add(current); current = parents.get(current);
      }
    }
  }
  if (draft.type === 'gantt' && draft.rows.some(row => row.end < row.value)) context.addIssue({ code: 'custom', message: 'Each end must be greater than or equal to its start.' });
  if (draft.type === 'security-matrix' && draft.rows.some(row => !row.group || ![0, 1].includes(row.value))) context.addIssue({ code: 'custom', message: 'Matrix requires a column and a value of 0 or 1.' });
  if (['sequence','org-chart','swimlane','kanban'].includes(draft.type) && draft.rows.some(row => !row.group)) context.addIssue({ code: 'custom', message: 'Each row requires its participant, parent or lane.' });
});
export type DiagramDraft = z.infer<typeof DiagramDraftSchema>;
export function parseDiagramRows(type: DiagramDraft['type'], title: string, source: string) {
  const rows = source.split('\n').filter(line => line.trim()).map(line => {
    const [label = '', group = '', rawValue = '', rawEnd = ''] = line.split('|').map(value => value.trim());
    return { label, group, value: rawValue ? Number(rawValue) : 0, end: rawEnd ? Number(rawEnd) : 0 };
  });
  return DiagramDraftSchema.safeParse({ type, title, rows });
}
