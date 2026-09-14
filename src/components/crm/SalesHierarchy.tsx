'use client';
// Sales Hierarchy Tree — drag-drop (from frappe/crm #2120)
// Manages counseling team hierarchy for assignment + permissions
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GripVertical, Network, Plus, Trash2 } from 'lucide-react';

export type HierarchyNode = { id: string; name: string; role: string; children: HierarchyNode[] };

export default function SalesHierarchy({ initial, onChange }: { initial: HierarchyNode[]; onChange?: (tree: HierarchyNode[])=>void }){
  const [tree, setTree] = React.useState<HierarchyNode[]>(initial);
  const addNode = (parentId: string | null)=>{
    const n: HierarchyNode = { id: `u_${Date.now()}`, name: 'New Member', role: 'Counselor', children: [] };
    if(!parentId){ const nt=[...tree,n]; setTree(nt); onChange?.(nt); return; }
    const rec=(nodes: HierarchyNode[]): HierarchyNode[]=> nodes.map(x=> x.id===parentId? {...x, children:[...x.children,n]} : {...x, children: rec(x.children)});
    const nt=rec(tree); setTree(nt); onChange?.(nt);
  };
  const removeNode = (id:string)=>{
    const rec=(nodes: HierarchyNode[]): HierarchyNode[]=> nodes.filter(x=> x.id!==id).map(x=> ({...x, children: rec(x.children)}));
    const nt=rec(tree); setTree(nt); onChange?.(nt);
  };
  const NodeView = ({ node, depth=0 }: { node: HierarchyNode; depth?: number })=> (
    <div className="ml-4 border-l border-slate-200 pl-3 py-1">
      <div className="flex items-center gap-2 bg-white rounded-lg border p-2">
        <GripVertical className="w-3.5 h-3.5 text-slate-400"/>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{node.name}</p>
          <p className="text-xs text-slate-500">{node.role}</p>
        </div>
        <Badge variant="outline" className="text-[10px]">{node.children.length} reports</Badge>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=> addNode(node.id)}><Plus className="w-3.5 h-3.5"/></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=> removeNode(node.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
      </div>
      {node.children.map(c=> <NodeView key={c.id} node={c} depth={depth+1} />)}
    </div>
  );
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2"><Network className="w-4 h-4"/> Sales Hierarchy</h3>
        <Button size="sm" variant="outline" onClick={()=> addNode(null)}><Plus className="w-3.5 h-3.5 mr-1"/>Add Root</Button>
      </div>
      {tree.length===0? <p className="text-xs text-slate-500 p-3 border border-dashed rounded-lg text-center">No hierarchy — add Chairman → Managers → Counselors</p> : tree.map(n=> <NodeView key={n.id} node={n} />)}
      <p className="text-[11px] text-slate-500">Drag to reorder (frappe pattern) — permissions cascade to reports. Manager sees only their subtree.</p>
    </Card>
  );
}
