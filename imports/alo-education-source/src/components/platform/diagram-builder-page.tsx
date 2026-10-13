'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  GitBranch, Network, Building2, Waves, LayoutTemplate,
  Plus, Trash2, Move, Edit3, ZoomIn, ZoomOut, Maximize2,
  Download, Upload, Undo2, Redo2, ChevronRight, ChevronDown,
  Circle, Square, Diamond, ArrowRight, ArrowDown, ArrowUpRight,
  MousePointer, Hand, Link2, Type, Image, ColorPicker,
  Copy, RotateCw, Lock, Unlock, Eye, EyeOff, Settings,
  Play, Pause, CheckCircle2, Clock, AlertTriangle, Users,
  GraduationCap, Globe, FileText, Briefcase, MapPin,
  MessageSquare, Phone, Mail, Shield, Zap, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  StatCard, SectionCard, PageHeader, StatusBadge,
} from '@/components/alo/shared';

// ─── Types ───────────────────────────────────────────────────────────

interface DiagramBuilderPageProps {
  onBack?: () => void;
  onNavigate?: (view: string, slug?: string) => void;
}

interface DiagramToolbarProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

// ─── Toolbar (hoisted outside render) ──────────────────────────────

function DiagramToolbar({ zoom, setZoom }: DiagramToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Select"><MousePointer className="size-3.5" /></Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Pan"><Hand className="size-3.5" /></Button>
      <div className="mx-1 h-4 w-px bg-slate-200" />
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Add Node"><Plus className="size-3.5" /></Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Add Edge"><Link2 className="size-3.5" /></Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Text"><Type className="size-3.5" /></Button>
      <div className="mx-1 h-4 w-px bg-slate-200" />
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(2, z + 0.1))} title="Zoom In"><ZoomIn className="size-3.5" /></Button>
      <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} title="Zoom Out"><ZoomOut className="size-3.5" /></Button>
      <div className="mx-1 h-4 w-px bg-slate-200" />
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Undo"><Undo2 className="size-3.5" /></Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Redo"><Redo2 className="size-3.5" /></Button>
      <div className="mx-1 h-4 w-px bg-slate-200" />
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download"><Download className="size-3.5" /></Button>
    </div>
  );
}

// ─── SVG Diagram Primitives ──────────────────────────────────────────

const BRAND = {
  primary: '#0052B8',
  primaryLight: '#EFF6FF',
  orange: '#E8501A',
  orangeLight: '#FFF7ED',
  ink: '#0F172A',
  gray: '#64748B',
  grayLight: '#E2E8F0',
  grayGhost: '#F1F5F9',
  white: '#FFFFFF',
  emerald: '#15803D',
  emeraldLight: '#DCFCE7',
  amber: '#92400E',
  amberLight: '#FEF3C7',
  violet: '#7C3AED',
  violetLight: '#F5F3FF',
  rose: '#E11D48',
  roseLight: '#FFF1F2',
};

// ─── Flowchart Data ──────────────────────────────────────────────────

interface FlowNode {
  id: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  type: 'start' | 'process' | 'decision' | 'end';
  color?: string;
  bgColor?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  curved?: boolean;
}

const STUDENT_JOURNEY_NODES: FlowNode[] = [
  { id: 'start', label: 'Student Inquiry', x: 400, y: 40, type: 'start', color: BRAND.emerald, bgColor: BRAND.emeraldLight },
  { id: 'consult', label: 'Initial Consultation', description: '30-min assessment call', x: 400, y: 120, type: 'process' },
  { id: 'eligible', label: 'Eligible?', x: 400, y: 210, type: 'decision', color: BRAND.amber, bgColor: BRAND.amberLight },
  { id: 'register', label: 'Registration & Profile', description: 'Create student account', x: 400, y: 300, type: 'process' },
  { id: 'docs', label: 'Document Collection', description: 'Transcripts, SOP, CV', x: 400, y: 380, type: 'process' },
  { id: 'review', label: 'Document Review', description: 'Counselor verifies', x: 400, y: 460, type: 'process' },
  { id: 'apply', label: 'Submit Applications', description: '5-8 universities', x: 400, y: 540, type: 'process' },
  { id: 'offer', label: 'Receive Offers', x: 400, y: 620, type: 'decision', color: BRAND.violet, bgColor: BRAND.violetLight },
  { id: 'visa', label: 'Visa Application', description: 'CAS & financial docs', x: 400, y: 710, type: 'process' },
  { id: 'enrol', label: 'Enrolment Confirmed', x: 400, y: 790, type: 'end', color: BRAND.emerald, bgColor: BRAND.emeraldLight },
  { id: 'reject', label: 'Follow Up Later', x: 600, y: 210, type: 'end', color: BRAND.rose, bgColor: BRAND.roseLight },
  { id: 'reapply', label: 'Re-apply or Appeal', x: 600, y: 620, type: 'process' },
];

const STUDENT_JOURNEY_EDGES: FlowEdge[] = [
  { from: 'start', to: 'consult' },
  { from: 'consult', to: 'eligible' },
  { from: 'eligible', to: 'register', label: 'Yes' },
  { from: 'eligible', to: 'reject', label: 'No' },
  { from: 'register', to: 'docs' },
  { from: 'docs', to: 'review' },
  { from: 'review', to: 'apply' },
  { from: 'apply', to: 'offer' },
  { from: 'offer', to: 'visa', label: 'Accepted' },
  { from: 'offer', to: 'reapply', label: 'Rejected' },
  { from: 'visa', to: 'enrol' },
];

// ─── Mind Map Data ───────────────────────────────────────────────────

interface MindNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  children?: MindNode[];
}

const COURSE_MIND_MAP: MindNode = {
  id: 'root', label: 'Study Abroad', x: 450, y: 300, color: BRAND.primary,
  children: [
    { id: 'uk', label: '🇬🇧 UK', x: 150, y: 120, color: '#2563EB', children: [
      { id: 'uk1', label: 'Oxford', x: 40, y: 60, color: '#3B82F6' },
      { id: 'uk2', label: 'Cambridge', x: 40, y: 140, color: '#3B82F6' },
      { id: 'uk3', label: 'UCL', x: 40, y: 220, color: '#3B82F6' },
    ]},
    { id: 'us', label: '🇺🇸 USA', x: 750, y: 120, color: '#DC2626', children: [
      { id: 'us1', label: 'MIT', x: 860, y: 60, color: '#EF4444' },
      { id: 'us2', label: 'Stanford', x: 860, y: 140, color: '#EF4444' },
      { id: 'us3', label: 'Harvard', x: 860, y: 220, color: '#EF4444' },
    ]},
    { id: 'au', label: '🇦🇺 Australia', x: 150, y: 480, color: '#059669', children: [
      { id: 'au1', label: 'Melbourne', x: 40, y: 420, color: '#10B981' },
      { id: 'au2', label: 'Sydney', x: 40, y: 500, color: '#10B981' },
    ]},
    { id: 'ca', label: '🇨🇦 Canada', x: 750, y: 480, color: '#D97706', children: [
      { id: 'ca1', label: 'Toronto', x: 860, y: 420, color: '#F59E0B' },
      { id: 'ca2', label: 'UBC', x: 860, y: 500, color: '#F59E0B' },
    ]},
    { id: 'eu', label: '🇪🇺 Europe', x: 450, y: 530, color: '#7C3AED', children: [
      { id: 'eu1', label: 'TU Munich', x: 350, y: 600, color: '#8B5CF6' },
      { id: 'eu2', label: 'Sorbonne', x: 550, y: 600, color: '#8B5CF6' },
    ]},
  ],
};

// ─── Org Chart Data ──────────────────────────────────────────────────

interface OrgNode {
  id: string;
  label: string;
  title: string;
  x: number;
  y: number;
  avatar?: string;
  children?: OrgNode[];
}

const ALO_ORG: OrgNode = {
  id: 'ceo', label: 'Alex Morgan', title: 'CEO & Founder', x: 450, y: 40,
  children: [
    { id: 'coo', label: 'Sarah Chen', title: 'COO', x: 180, y: 140,
      children: [
        { id: 'ops1', label: 'Raj Patel', title: 'Operations Lead', x: 80, y: 250 },
        { id: 'ops2', label: 'Lisa Wang', title: 'Student Services', x: 280, y: 250 },
      ],
    },
    { id: 'cto', label: 'James Park', title: 'CTO', x: 450, y: 140,
      children: [
        { id: 'tech1', label: 'Amit Kumar', title: 'Senior Developer', x: 370, y: 250 },
        { id: 'tech2', label: 'Zoe Brown', title: 'AI/ML Engineer', x: 530, y: 250 },
      ],
    },
    { id: 'cmo', label: 'Emma Wilson', title: 'CMO', x: 720, y: 140,
      children: [
        { id: 'mkt1', label: 'Tom Lee', title: 'Digital Marketing', x: 620, y: 250 },
        { id: 'mkt2', label: 'Priya Das', title: 'Content Lead', x: 820, y: 250 },
      ],
    },
  ],
};

// ─── Swimlane Data ───────────────────────────────────────────────────

interface SwimActor { id: string; label: string; color: string; }
interface SwimStep { id: string; actorId: string; label: string; order: number; status: 'completed' | 'current' | 'upcoming'; }

const CRM_ACTORS: SwimActor[] = [
  { id: 'lead', label: 'Lead Capture', color: BRAND.primary },
  { id: 'counselor', label: 'Counselor', color: BRAND.orange },
  { id: 'system', label: 'CRM System', color: '#7C3AED' },
  { id: 'manager', label: 'Manager', color: '#15803D' },
];

const CRM_STEPS: SwimStep[] = [
  { id: 's1', actorId: 'lead', label: 'Web Form Submit', order: 1, status: 'completed' },
  { id: 's2', actorId: 'system', label: 'Auto-Score Lead', order: 2, status: 'completed' },
  { id: 's3', actorId: 'counselor', label: 'Review Score', order: 3, status: 'completed' },
  { id: 's4', actorId: 'counselor', label: 'Initial Call', order: 4, status: 'current' },
  { id: 's5', actorId: 'system', label: 'Log Activity', order: 5, status: 'upcoming' },
{ id: 's6', actorId: 'counselor', label: 'Send Proposal', order: 6, status: 'upcoming' },
  { id: 's7', actorId: 'manager', label: 'Approve Discount', order: 7, status: 'upcoming' },
  { id: 's8', actorId: 'system', label: 'Create Deal', order: 8, status: 'upcoming' },
  { id: 's9', actorId: 'counselor', label: 'Follow Up', order: 9, status: 'upcoming' },
];

// ─── Templates ───────────────────────────────────────────────────────

interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  nodes: number;
  edges: number;
}

const TEMPLATES: DiagramTemplate[] = [
  { id: 't1', name: 'Student Application Flow', description: 'Complete application journey from inquiry to enrolment', category: 'Education', icon: 'GraduationCap', nodes: 10, edges: 9 },
  { id: 't2', name: 'Visa Application Process', description: 'Step-by-step visa processing workflow', category: 'Visa', icon: 'Globe', nodes: 8, edges: 7 },
  { id: 't3', name: 'CRM Pipeline', description: 'Lead to conversion sales pipeline', category: 'CRM', icon: 'GitBranch', nodes: 7, edges: 6 },
  { id: 't4', name: 'Document Processing', description: 'Document upload, review, and approval flow', category: 'Operations', icon: 'FileText', nodes: 6, edges: 5 },
  { id: 't5', name: 'University Onboarding', description: 'Partner university setup and integration', category: 'Partners', icon: 'Building2', nodes: 9, edges: 8 },
  { id: 't6', name: 'Communication Flow', description: 'Multi-channel student communication process', category: 'Communication', icon: 'MessageSquare', nodes: 8, edges: 7 },
  { id: 't7', name: 'Scholarship Application', description: 'Scholarship eligibility and application flow', category: 'Education', icon: 'GraduationCap', nodes: 7, edges: 6 },
  { id: 't8', name: 'Orientation Week', description: 'Pre-departure and arrival orientation process', category: 'Student', icon: 'Users', nodes: 6, edges: 5 },
];

// ─── Component ───────────────────────────────────────────────────────

export function DiagramBuilderPage({ onBack, onNavigate }: DiagramBuilderPageProps) {
  const [activeTab, setActiveTab] = useState('flowchart');
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // ─── Flowchart SVG ───────────────────────────────────────────────

  const renderFlowchart = () => {
    const nodeW = 160;
    const nodeH = 48;
    const svgW = 750;
    const svgH = 870;

    const getNodePos = (id: string) => {
      const node = STUDENT_JOURNEY_NODES.find(n => n.id === id);
      return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
    };

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minHeight: 600 }}>
        {/* Defs */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={BRAND.grayLight} />
          </marker>
          <marker id="arrowhead-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={BRAND.emerald} />
          </marker>
        </defs>

        {/* Edges */}
        {STUDENT_JOURNEY_EDGES.map((edge, i) => {
          const from = getNodePos(edge.from);
          const to = getNodePos(edge.to);
          const isHorizontal = from.y === to.y;
          const fromNode = STUDENT_JOURNEY_NODES.find(n => n.id === edge.from);
          const toNode = STUDENT_JOURNEY_NODES.find(n => n.id === edge.to);

          let fromX = from.x, fromY = from.y + nodeH / 2;
          let toX = to.x, toY = to.y - nodeH / 2;

          if (isHorizontal) {
            fromX = from.x + nodeW / 2;
            fromY = from.y;
            toX = to.x - nodeW / 2;
            toY = to.y;
          }

          return (
            <g key={`e-${i}`}>
              {isHorizontal ? (
                <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={BRAND.grayLight} strokeWidth={1.5} markerEnd="url(#arrowhead)" />
              ) : (
                <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={BRAND.grayLight} strokeWidth={1.5} markerEnd="url(#arrowhead)" />
              )}
              {edge.label && (
                <text
                  x={(fromX + toX) / 2 + (isHorizontal ? 0 : 10)}
                  y={(fromY + toY) / 2 + (isHorizontal ? -8 : 0)}
                  textAnchor="middle"
                  fill={BRAND.gray}
                  fontSize={10}
                  fontWeight={500}
                  fontFamily="system-ui, sans-serif"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {STUDENT_JOURNEY_NODES.map(node => {
          const isSelected = selectedNode === node.id;
          const fillColor = node.bgColor || BRAND.white;
          const strokeColor = node.color || BRAND.grayLight;
          const textColor = node.color || BRAND.ink;

          if (node.type === 'decision') {
            const size = 50;
            return (
              <g key={node.id} onClick={() => setSelectedNode(node.id)} className="cursor-pointer">
                <polygon
                  points={`${node.x},${node.y - size} ${node.x + size},${node.y} ${node.x},${node.y + size} ${node.x - size},${node.y}`}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central" fill={textColor} fontSize={11} fontWeight={600} fontFamily="system-ui, sans-serif">
                  {node.label}
                </text>
              </g>
            );
          }

          const w = node.type === 'start' || node.type === 'end' ? 140 : nodeW;
          const rx = node.type === 'start' || node.type === 'end' ? nodeH / 2 : 8;

          return (
            <g key={node.id} onClick={() => setSelectedNode(node.id)} className="cursor-pointer">
              <rect
                x={node.x - w / 2}
                y={node.y - nodeH / 2}
                width={w}
                height={nodeH}
                rx={rx}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <text x={node.x} y={node.y - (node.description ? 4 : 0)} textAnchor="middle" dominantBaseline="central" fill={textColor} fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
                {node.label}
              </text>
              {node.description && (
                <text x={node.x} y={node.y + 10} textAnchor="middle" dominantBaseline="central" fill={BRAND.gray} fontSize={9} fontWeight={400} fontFamily="system-ui, sans-serif">
                  {node.description}
                </text>
              )}
              {isSelected && (
                <rect x={node.x - w / 2 - 3} y={node.y - nodeH / 2 - 3} width={w + 6} height={nodeH + 6} rx={rx + 2} fill="none" stroke={BRAND.primary} strokeWidth={1.5} strokeDasharray="4 2" />
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // ─── Mind Map SVG ────────────────────────────────────────────────

  const renderMindMap = () => {
    const renderNode = (node: MindNode, parent?: MindNode) => {
      const r = node.id === 'root' ? 40 : node.children ? 28 : 20;
      return (
        <g key={node.id}>
          {parent && (
            <line
              x1={parent.x} y1={parent.y} x2={node.x} y2={node.y}
              stroke={node.color} strokeWidth={node.children ? 2 : 1.5} opacity={0.4}
            />
          )}
          <circle cx={node.x} cy={node.y} r={r} fill={node.color} opacity={0.15} />
          <circle cx={node.x} cy={node.y} r={r} fill="none" stroke={node.color} strokeWidth={1.5} />
          <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central" fill={node.color} fontSize={node.id === 'root' ? 13 : node.children ? 11 : 10} fontWeight={node.id === 'root' ? 700 : 600} fontFamily="system-ui, sans-serif">
            {node.label}
          </text>
          {node.children?.map(child => renderNode(child, node))}
        </g>
      );
    };

    return (
      <svg viewBox="0 0 900 650" className="w-full" style={{ minHeight: 500 }}>
        {renderNode(COURSE_MIND_MAP)}
      </svg>
    );
  };

  // ─── Org Chart SVG ───────────────────────────────────────────────

  const renderOrgChart = () => {
    const cardW = 140;
    const cardH = 56;

    const renderOrgNode = (node: OrgNode, parent?: OrgNode) => (
      <g key={node.id}>
        {parent && (
          <>
            <line x1={parent.x} y1={parent.y + cardH / 2} x2={node.x} y2={node.y - cardH / 2} stroke={BRAND.grayLight} strokeWidth={1.5} />
          </>
        )}
        <rect x={node.x - cardW / 2} y={node.y - cardH / 2} width={cardW} height={cardH} rx={8} fill={BRAND.white} stroke={BRAND.grayLight} strokeWidth={1.5} />
        <text x={node.x} y={node.y - 6} textAnchor="middle" dominantBaseline="central" fill={BRAND.ink} fontSize={11} fontWeight={600} fontFamily="system-ui, sans-serif">
          {node.label}
        </text>
        <text x={node.x} y={node.y + 10} textAnchor="middle" dominantBaseline="central" fill={BRAND.gray} fontSize={9} fontWeight={400} fontFamily="system-ui, sans-serif">
          {node.title}
        </text>
        {node.children?.map(child => renderOrgNode(child, node))}
      </g>
    );

    return (
      <svg viewBox="0 0 900 320" className="w-full" style={{ minHeight: 350 }}>
        {renderOrgNode(ALO_ORG)}
      </svg>
    );
  };

  // ─── Swimlane SVG ────────────────────────────────────────────────

  const renderSwimlane = () => {
    const laneH = 70;
    const stepW = 110;
    const stepH = 38;
    const headerW = 100;
    const gapX = 14;
    const padding = 16;

    const maxOrder = Math.max(...CRM_STEPS.map(s => s.order));
    const svgW = padding * 2 + headerW + maxOrder * (stepW + gapX);
    const svgH = CRM_ACTORS.length * laneH + padding;

    const getStepPos = (step: SwimStep) => {
      const actorIndex = CRM_ACTORS.findIndex(a => a.id === step.actorId);
      return {
        x: padding + headerW + (step.order - 1) * (stepW + gapX) + stepW / 2,
        y: actorIndex * laneH + laneH / 2,
        actorIndex,
      };
    };

    const arrows = CRM_STEPS.slice(0, -1).map((step, i) => ({
      from: getStepPos(step),
      to: getStepPos(CRM_STEPS[i + 1]),
    }));

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[700px]" style={{ minHeight: 300 }}>
        {CRM_ACTORS.map((actor, i) => {
          const y = i * laneH;
          return (
            <g key={actor.id}>
              <rect x={0} y={y} width={svgW} height={laneH} fill={i % 2 === 0 ? BRAND.grayGhost : BRAND.white} />
              <line x1={0} y1={y} x2={svgW} y2={y} stroke={BRAND.grayLight} strokeWidth={1} />
              <rect x={padding} y={y + (laneH - 28) / 2} width={headerW - padding} height={28} rx={4} fill={actor.color} opacity={0.12} />
              <text x={padding + (headerW - padding) / 2} y={y + laneH / 2} textAnchor="middle" dominantBaseline="central" fill={actor.color} fontSize={10} fontWeight={700} fontFamily="system-ui, sans-serif">
                {actor.label}
              </text>
            </g>
          );
        })}

        {CRM_STEPS.map(step => {
          const { x, y, actorIndex } = getStepPos(step);
          const actor = CRM_ACTORS[actorIndex];
          const isCurrent = step.status === 'current';
          const isCompleted = step.status === 'completed';
          const fill = isCurrent ? BRAND.orange : isCompleted ? actor.color : BRAND.white;
          const stroke = isCurrent ? BRAND.orange : isCompleted ? actor.color : BRAND.grayLight;
          const text = (isCurrent || isCompleted) ? BRAND.white : BRAND.ink;

          return (
            <g key={step.id}>
              <rect x={x - stepW / 2} y={y - stepH / 2} width={stepW} height={stepH} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} opacity={isCompleted ? 0.85 : 1} />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={9} fontWeight={600} fontFamily="system-ui, sans-serif">
                {step.label.length > 14 ? step.label.slice(0, 13) + '…' : step.label}
              </text>
              {isCurrent && (
                <rect x={x - stepW / 2 - 2} y={y - stepH / 2 - 2} width={stepW + 4} height={stepH + 4} rx={8} fill="none" stroke={BRAND.orange} strokeWidth={1} opacity={0.4} />
              )}
            </g>
          );
        })}

        {arrows.map((arrow, i) => {
          const { from, to } = arrow;
          const isCross = from.actorIndex !== to.actorIndex;
          if (isCross) {
            const midX = (from.x + to.x) / 2;
            return <path key={`a-${i}`} d={`M${from.x + stepW / 2},${from.y} C${midX},${from.y} ${midX},${to.y} ${to.x - stepW / 2},${to.y}`} fill="none" stroke={BRAND.grayLight} strokeWidth={1.5} strokeDasharray="4 2" />;
          }
          return (
            <g key={`a-${i}`}>
              <line x1={from.x + stepW / 2} y1={from.y} x2={to.x - stepW / 2 - 4} y2={to.y} stroke={BRAND.grayLight} strokeWidth={1.5} />
              <polygon points={`${to.x - stepW / 2 - 4},${to.y - 3} ${to.x - stepW / 2 - 4},${to.y + 3} ${to.x - stepW / 2},${to.y}`} fill={BRAND.grayLight} />
            </g>
          );
        })}
      </svg>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <PageHeader
          title="Diagram Builder"
          subtitle="Create flowcharts, mind maps, org charts, and process diagrams"
          icon="GitBranch"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="size-3.5" />Import
              </Button>
              <Button size="sm" className="gap-1.5 bg-[#0052B8] hover:bg-[#0042A0]">
                <Plus className="size-3.5" />New Diagram
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Diagrams" value="12" icon="GitBranch" accent="blue" />
          <StatCard label="Templates" value="8" icon="LayoutTemplate" accent="violet" />
          <StatCard label="Shared" value="5" icon="Users" accent="emerald" />
          <StatCard label="Recent Edits" value="3" icon="Edit3" accent="orange" />
        </div>

        {/* Main Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
              <TabsTrigger value="flowchart" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <GitBranch className="size-3.5" />Flowchart
              </TabsTrigger>
              <TabsTrigger value="mindmap" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Network className="size-3.5" />Mind Map
              </TabsTrigger>
              <TabsTrigger value="orgchart" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Building2 className="size-3.5" />Org Chart
              </TabsTrigger>
              <TabsTrigger value="swimlane" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Waves className="size-3.5" />Process
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <LayoutTemplate className="size-3.5" />Templates
              </TabsTrigger>
            </TabsList>

            {/* Flowchart Tab */}
            <TabsContent value="flowchart" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <DiagramToolbar zoom={zoom} setZoom={setZoom} />
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">{STUDENT_JOURNEY_NODES.length} nodes</Badge>
                    <Badge variant="secondary" className="bg-violet-50 text-violet-700">{STUDENT_JOURNEY_EDGES.length} edges</Badge>
                  </div>
                </div>
                <Card className="rounded-xl border border-slate-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-white overflow-auto" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                      {renderFlowchart()}
                    </div>
                  </CardContent>
                </Card>
                {selectedNode && (
                  <Card className="rounded-xl border border-[#0052B8]/20 bg-blue-50/50">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Selected: {STUDENT_JOURNEY_NODES.find(n => n.id === selectedNode)?.label}</p>
                        <p className="text-xs text-slate-500">Click on nodes to select them</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Edit3 className="size-3" />Edit</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Copy className="size-3" />Duplicate</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => setSelectedNode(null)}><Trash2 className="size-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Mind Map Tab */}
            <TabsContent value="mindmap" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <DiagramToolbar zoom={zoom} setZoom={setZoom} />
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Course Exploration</Badge>
                </div>
                <Card className="rounded-xl border border-slate-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-white overflow-auto">
                      {renderMindMap()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Org Chart Tab */}
            <TabsContent value="orgchart" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <DiagramToolbar zoom={zoom} setZoom={setZoom} />
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700">ALO Team Structure</Badge>
                </div>
                <Card className="rounded-xl border border-slate-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-white overflow-auto">
                      {renderOrgChart()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Swimlane / Process Tab */}
            <TabsContent value="swimlane" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <DiagramToolbar zoom={zoom} setZoom={setZoom} />
                  <Badge variant="secondary" className="bg-violet-50 text-violet-700">CRM Workflow</Badge>
                </div>
                <Card className="rounded-xl border border-slate-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-white overflow-auto">
                      {renderSwimlane()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {TEMPLATES.map(tpl => (
                  <Card key={tpl.id} className="group rounded-xl border border-slate-200 bg-white transition-all hover:shadow-md hover:border-slate-300 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0052B8] mb-3">
                        <GitBranch className="size-5" />
                      </div>
                      <h3 className="font-semibold text-slate-900">{tpl.name}</h3>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{tpl.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{tpl.category}</Badge>
                        <span className="text-xs text-slate-400">{tpl.nodes} nodes · {tpl.edges} edges</span>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5 text-[#0052B8] border-[#0052B8]/30 hover:bg-[#EFF6FF]">
                        <Copy className="size-3" />Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
