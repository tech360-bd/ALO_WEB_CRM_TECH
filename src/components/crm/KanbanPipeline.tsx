'use client';
// ALO — Kanban Pipeline + Saved Views (extra function from frappe/crm)
// Adds kanban drag-drop + saved/pinned/public views to existing CRM pipeline
// Reuses existing models: AloApplication / Lead (stage/status) — no new DB table
// Stack: @dnd-kit (already in package.json) + shadcn/ui + lucide
// See docs/final-master/CRM_COMPARISON_EXTRA_FUNCTIONS.md §frappe/crm

import * as React from 'react';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pin, Eye, Lock, Users, GraduationCap, Calendar, GripVertical, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

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

function SortableCard({ item, onOpen }: { item: KanbanItem; onOpen?: (id:string)=>void }){
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging?0.6:1 };
  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-1 text-slate-400 hover:text-slate-600"><GripVertical className="w-3.5 h-3.5"/></button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={()=> onOpen?.(item.id)}>
          <p className="text-sm font-semibold truncate">{item.title}</p>
          {item.subtitle && <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>}
          <div className="flex gap-1 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{item.stage}</Badge>
            {item.meta?.counselor && <Badge className="bg-slate-100 text-slate-700 text-[10px]"><Users className="w-3 h-3 mr-1"/>{item.meta.counselor}</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KanbanPipeline({ items: initial, onStageChange, onOpen }: { items: KanbanItem[]; onStageChange?: (id:string, newStage:string)=>Promise<void>|void; onOpen?: (id:string)=>void }){
  const [items, setItems] = React.useState(initial);
  const [q, setQ] = React.useState('');
  const [stageFilter, setStageFilter] = React.useState<string>('all');
  const [views, setViews] = React.useState<SavedView[]>(() => {
    try { return JSON.parse(localStorage.getItem('alo_kanban_views')||'[]'); } catch { return []; }
  });
  const [activeView, setActiveView] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 }}));
  React.useEffect(()=> setItems(initial), [initial]);
  React.useEffect(()=> { localStorage.setItem('alo_kanban_views', JSON.stringify(views)); }, [views]);

  const filtered = React.useMemo(()=> items.filter(i=>{
    if(stageFilter!=='all' && i.stage!==stageFilter) return false;
    if(q && !`${i.title} ${i.subtitle} ${i.stage}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [items, q, stageFilter]);

  const byStage = React.useMemo(()=>{
    const m = new Map<string, KanbanItem[]>();
    STAGES.forEach(s=> m.set(s, []));
    filtered.forEach(i=> m.get(i.stage as any)?.push(i) ?? m.set(i.stage, [i]));
    return m;
  }, [filtered]);

  const handleDragEnd = async (e: DragEndEvent)=>{
    const { active, over } = e;
    if(!over) return;
    const activeId = String(active.id);
    const overStage = String(over.id);
    // if over is a stage column id
    if((STAGES as readonly string[]).includes(overStage)){
      const prev = items.find(i=> i.id===activeId);
      if(prev && prev.stage!==overStage){
        // optimistic + server auth/validation still required
        setItems(prevItems=> prevItems.map(i=> i.id===activeId? {...i, stage: overStage}: i));
        try { await onStageChange?.(activeId, overStage); toast.success(`Moved to ${overStage}`);} catch(err:any){ toast.error(err?.message||'Stage change not allowed'); setItems(prevItems=> prevItems.map(i=> i.id===activeId? {...i, stage: prev!.stage}: i)); }
      }
    }
  };

  const saveView = ()=>{
    const name = prompt('View name');
    if(!name) return;
    const v: SavedView = { id: `v_${Date.now()}`, name, filters:{ stage: stageFilter!=='all'?stageFilter:undefined, search: q||undefined }, sort:'createdAt', columns:[...STAGES], pinned:false, isPublic:false };
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
          <Eye className="w-4 h-4 text-slate-400"/>
          <span className="text-xs font-bold">Views</span>
          {views.filter(v=> v.pinned).map(v=> <Button key={v.id} size="sm" variant={activeView===v.id?'default':'outline'} className="h-7 text-xs" onClick={()=> applyView(v.id)}><Pin className="w-3 h-3 mr-1"/>{v.name}</Button>)}
          <Select value={activeView||''} onValueChange={applyView}><SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue placeholder="Saved views"/></SelectTrigger><SelectContent>{views.map(v=> <SelectItem key={v.id} value={v.id}>{v.name}{v.isPublic?' (public)':''}</SelectItem>)}</SelectContent></Select>
          <Button size="sm" variant="outline" className="h-7" onClick={saveView}><Plus className="w-3 h-3 mr-1"/>Save view</Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative"><Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400"/><Input value={q} onChange={e=> setQ(e.target.value)} placeholder="Search applications" className="pl-7 h-7 w-48"/></div>
          <Select value={stageFilter} onValueChange={setStageFilter}><SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem>{STAGES.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9 gap-3 overflow-x-auto">
          {STAGES.map(stage=> (
            <div key={stage} id={stage as any} className="min-w-[220px] bg-slate-50 rounded-xl border p-2">
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="text-xs font-bold uppercase tracking-wide">{stage.replace(/_/g,' ')}</span>
                <Badge variant="secondary" className="text-[10px]">{byStage.get(stage)?.length||0}</Badge>
              </div>
              <SortableContext id={stage} items={(byStage.get(stage)||[]).map(i=> i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[120px]">
                  {(byStage.get(stage)||[]).map(i=> <SortableCard key={i.id} item={i} onOpen={onOpen} />)}
                  {(byStage.get(stage)||[]).length===0 && <p className="text-xs text-slate-400 p-3 border border-dashed rounded-lg text-center">Drop here</p>}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
      <p className="text-[11px] text-slate-500">Drag card to column to change stage — server validates transition + audit (frappe sales-hierarchy SLA pattern). Unauthorized change returns safe error, no DB mutation.</p>
    </div>
  );
}
