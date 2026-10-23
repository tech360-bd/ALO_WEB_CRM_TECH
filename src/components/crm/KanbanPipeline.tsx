'use client';
// ALO — Kanban Pipeline + Saved Views (extra function from frappe/crm)
// Registered drop targets + keyboard/select moves; saved views are local only.
// Reuses existing models: AloApplication / Lead (stage/status) — no new DB table
// Stack: @dnd-kit (already in package.json) + shadcn/ui + lucide
// See docs/final-master/CRM_COMPARISON_EXTRA_FUNCTIONS.md §frappe/crm

import * as React from 'react';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pin, Eye, Users, GripVertical, Plus, Search } from 'lucide-react';

export type KanbanItem = {
  id: string;
  title: string; // University + Course
  subtitle?: string; // Student name / Application ID AE-...-01
  stage: string; // APPLICATION_DRAFT..SUCCESS
  meta?: Record<string, string>;
};

export type SavedView = {
  id: string;
  name: string;
  filters: { stage?: string; search?: string };
  sort: 'createdAt' | 'stage';
  columns: string[];
  pinned?: boolean;
  isPublic?: boolean;
};

const STAGES = ['APPLICATION_DRAFT','DOCUMENTS_PENDING','READY_TO_SUBMIT','SUBMITTED','UNDER_REVIEW','OFFER_RECEIVED','PAYMENT_PENDING','VISA_PREPARATION','SUCCESS'] as const;

function SortableCard({ item, onOpen, canMove, moving, onMove, stages }: { item: KanbanItem; onOpen?: (id:string)=>void; canMove: boolean; moving: boolean; onMove: (id:string, stage:string)=>void; stages: readonly string[] }){
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !canMove || moving, data: { stage: item.stage } });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging?0.6:1 };
  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-[var(--alo-border)] p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <button type="button" disabled={!canMove || moving} aria-label={`Move ${item.title}`} title={canMove ? "Drag to a column; keyboard users can use the stage selector" : "Stage editing is unavailable in this view"} {...attributes} {...listeners} className="mt-1 rounded text-[var(--alo-text-muted)] hover:text-[var(--alo-body)] focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"><GripVertical className="w-3.5 h-3.5"/></button>
        <div className="flex-1 min-w-0">
          <button type="button" disabled={!onOpen} onClick={()=> onOpen?.(item.id)} className="block max-w-full truncate text-left text-sm font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:text-[var(--alo-body)]">{item.title}</button>
          {item.subtitle && <p className="text-xs text-[var(--alo-text-muted)] truncate">{item.subtitle}</p>}
          <div className="flex gap-1 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[11px]">{item.stage}</Badge>
            {item.meta?.counselor && <Badge className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)] text-[11px]"><Users className="w-3 h-3 mr-1"/>{item.meta.counselor}</Badge>}
          </div>
          <label className="mt-2 block text-xs text-[var(--alo-text-muted)]">Move to stage
            <select aria-label={`Stage for ${item.title}`} value={item.stage} disabled={!canMove || moving} onChange={e => onMove(item.id, e.target.value)} className="mt-1 w-full rounded border bg-white p-1 text-xs">{!stages.includes(item.stage) && <option value={item.stage}>{item.stage}</option>}{stages.map(stage => <option key={stage} value={stage}>{stage.replace(/_/g, " ")}</option>)}</select>
          </label>
        </div>
      </div>
    </div>
  );
}

function StageColumn({ stage, children }: { stage: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { stage } });
  return <div ref={setNodeRef} className={`min-w-[220px] rounded-xl border p-2 ${isOver ? 'border-blue-500 bg-blue-50' : 'bg-[var(--alo-page)]'}`}>{children}</div>;
}

export default function KanbanPipeline({ items: initial, onStageChange, onOpen, stages = STAGES, moveTargets }: { moveTargets?: (item: KanbanItem) => readonly string[]; stages?: readonly string[]; items: KanbanItem[]; onStageChange?: (id:string, newStage:string)=>Promise<void>|void; onOpen?: (id:string)=>void }){
  const [items, setItems] = React.useState(initial);
  const [moving, setMoving] = React.useState(false);
  const movingRef = React.useRef(false);
  const [feedback, setFeedback] = React.useState('');
  const [storageReady, setStorageReady] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [stageFilter, setStageFilter] = React.useState<string>('all');
  const [views, setViews] = React.useState<SavedView[]>([]);
  const [activeView, setActiveView] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 }}));
  React.useEffect(()=> setItems(initial), [initial]);
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('alo_kanban_views') || '[]');
      if (Array.isArray(saved)) setViews(saved.filter(v => v && typeof v.id === 'string' && typeof v.name === 'string' && v.filters && !v.isPublic));
    } catch { setFeedback('Saved local views are unavailable.'); }
    setStorageReady(true);
  }, []);
  React.useEffect(() => { if (storageReady) try { localStorage.setItem('alo_kanban_views', JSON.stringify(views)); } catch { setFeedback('This browser cannot store local views.'); } }, [views, storageReady]);

  const filtered = React.useMemo(()=> items.filter(i=>{
    if(stageFilter!=='all' && i.stage!==stageFilter) return false;
    if(q && !`${i.title} ${i.subtitle} ${i.stage}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [items, q, stageFilter]);

  const byStage = React.useMemo(()=>{
    const m = new Map<string, KanbanItem[]>();
    stages.forEach(s=> m.set(s, []));
    filtered.forEach(item => { const group = m.get(item.stage); if (group) group.push(item); else m.set(item.stage, [item]); });
    return m;
  }, [filtered, stages]);

  const moveStage = async (activeId: string, stage: string) => {
    if (!onStageChange || movingRef.current || !stages.includes(stage)) return;
    const item = items.find(item => item.id === activeId);
    if (!item || item.stage === stage) return;
    if (moveTargets && !moveTargets(item).includes(stage)) { setFeedback('This transition requires a dedicated workflow or is not permitted.'); return; }
    movingRef.current = true; setMoving(true); setFeedback('Saving stage change…');
    try {
      await onStageChange(activeId, stage);
      setItems(previous => previous.map(item => item.id === activeId ? { ...item, stage } : item));
      setFeedback(`Stage saved: ${stage.replace(/_/g, ' ')}`);
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Stage change was not saved.'); }
    finally { movingRef.current = false; setMoving(false); }
  };
  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const stage = event.over.data.current?.stage || String(event.over.id);
    void moveStage(String(event.active.id), stage);
  };

  const saveView = ()=>{
    const name = prompt('Local view name (do not include private student information)');
    if(!name) return;
    const v: SavedView = { id: `v_${Date.now()}`, name, filters:{ stage: stageFilter!=='all'?stageFilter:undefined, search: q||undefined }, sort:'createdAt', columns:[...stages], pinned:false, isPublic:false };
    setViews([...views, v]); setActiveView(v.id);
  };
  const applyView = (id:string)=>{
    const v = views.find(x=> x.id===id); if(!v) return;
    setActiveView(id); setStageFilter(v.filters.stage||'all'); setQ(v.filters.search||'');
  };

  return (
    <div className="space-y-3">
      {/* Saved views bar — frappe pattern: pinned/public/saved */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border">
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4 text-[var(--alo-text-muted)]"/>
          <span className="text-xs font-bold">Views</span>
          {views.filter(v=> v.pinned).map(v=> <Button key={v.id} size="sm" variant={activeView===v.id?'default':'outline'} className="h-7 text-xs" onClick={()=> applyView(v.id)}><Pin className="w-3 h-3 mr-1"/>{v.name}</Button>)}
          <Select value={activeView||''} onValueChange={applyView}><SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue placeholder="Saved views"/></SelectTrigger><SelectContent>{views.map(v=> <SelectItem key={v.id} value={v.id}>{v.name}{v.isPublic?' (public)':''}</SelectItem>)}</SelectContent></Select>
          <Button size="sm" variant="outline" className="h-7" onClick={saveView}><Plus className="w-3 h-3 mr-1"/>Save view</Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative"><Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[var(--alo-text-muted)]"/><Input value={q} onChange={e=> setQ(e.target.value)} placeholder="Search applications" className="pl-7 h-7 w-48"/></div>
          <Select value={stageFilter} onValueChange={setStageFilter}><SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem>{stages.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...byStage.keys()].map(stage=> (
            <StageColumn key={stage} stage={stage}>
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="text-xs font-bold uppercase tracking-wide">{stage.replace(/_/g,' ')}</span>
                <Badge variant="secondary" className="text-[11px]">{byStage.get(stage)?.length||0}</Badge>
              </div>
              <SortableContext id={stage} items={(byStage.get(stage)||[]).map(i=> i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[120px]">
                  {(byStage.get(stage)||[]).map(i=> <SortableCard key={i.id} item={i} onOpen={onOpen} canMove={!!onStageChange && (moveTargets ? moveTargets(i).some(target => target !== i.stage) : true)} moving={moving} stages={moveTargets ? moveTargets(i) : stages} onMove={(id, stage) => void moveStage(id, stage)} />)}
                  {(byStage.get(stage)||[]).length===0 && <p className="text-xs text-[var(--alo-text-muted)] p-3 border border-dashed rounded-lg text-center">{onStageChange ? "Drop here" : "No records"}</p>}
                </div>
              </SortableContext>
            </StageColumn>
          ))}
        </div>
      </DndContext>
      <p role="status" aria-live="polite" className="text-xs text-[var(--alo-body)]">{feedback}</p>
      <p className="text-[11px] text-[var(--alo-text-muted)]">Drag or use the stage selector. Changes are shown only after the persistence callback succeeds; its authenticated server API must validate transitions and audit changes. Saved views are local to this browser, not public or shared.</p>
    </div>
  );
}
