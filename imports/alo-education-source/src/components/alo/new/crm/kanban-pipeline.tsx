'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone, Mail, MessageCircle, Eye, Plus, Filter, SortAsc, Search,
  GripVertical, AlertTriangle, Clock, Calendar, Users
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type LeadScore = 'HOT' | 'WARM' | 'COLD';
type StageKey = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'APPLICATION' | 'OFFERED' | 'ENROLLED' | 'LOST';

interface Lead {
  id: string;
  studentName: string;
  nationality: string;
  nationalityFlag: string;
  targetCountry: string;
  university: string;
  course: string;
  score: LeadScore;
  counselor: string;
  counselorAvatar?: string;
  daysInStage: number;
  nextFollowUp: string;
  stage: StageKey;
  value: number;
}

interface ColumnConfig {
  key: StageKey;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  wipLimit: number;
}

// ── ALO Brand Colors & Column Definitions ───────────────────────────────
const ALO_BLUE = '#0052B8';
const ALO_ORANGE = '#E8501A';

/* Column Definitions - ALO branded stage colors (Frappe CRM pattern) */
const COLUMNS: ColumnConfig[] = [
  { key: 'NEW', label: 'New', color: ALO_BLUE, bgColor: '#eff6ff', borderColor: '#bfdbfe', wipLimit: 30 },
  { key: 'CONTACTED', label: 'Contacted', color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', wipLimit: 25 },
  { key: 'QUALIFIED', label: 'Qualified', color: ALO_ORANGE, bgColor: '#fff7ed', borderColor: '#fed7aa', wipLimit: 20 },
  { key: 'APPLICATION', label: 'Application', color: '#0ea5e9', bgColor: '#f0f9ff', borderColor: '#bae6fd', wipLimit: 15 },
  { key: 'OFFERED', label: 'Offered', color: '#14b8a6', bgColor: '#f0fdfa', borderColor: '#99f6e4', wipLimit: 10 },
  { key: 'ENROLLED', label: 'Enrolled', color: '#22c55e', bgColor: '#f0fdf4', borderColor: '#bbf7d0', wipLimit: 50 },
  { key: 'LOST', label: 'Lost', color: '#ef4444', bgColor: '#fef2f2', borderColor: '#fecaca', wipLimit: 30 },
];

const SCORE_COLORS: Record<LeadScore, { bg: string; text: string }> = {
  HOT: { bg: '#fef2f2', text: '#dc2626' },
  WARM: { bg: '#fffbeb', text: '#d97706' },
  COLD: { bg: '#f0f9ff', text: '#0369a1' },
};

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  { id: 'L001', studentName: 'Ahmed Al-Rashid', nationality: 'UAE', nationalityFlag: '🇦🇪', targetCountry: 'UK', university: 'University of Manchester', course: 'MSc Computer Science', score: 'HOT', counselor: 'Sarah K.', daysInStage: 1, nextFollowUp: '2025-03-15', stage: 'NEW', value: 25000 },
  { id: 'L002', studentName: 'Priya Sharma', nationality: 'India', nationalityFlag: '🇮🇳', targetCountry: 'Canada', university: 'University of Toronto', course: 'MBA', score: 'HOT', counselor: 'Mike R.', daysInStage: 3, nextFollowUp: '2025-03-14', stage: 'NEW', value: 45000 },
  { id: 'L003', studentName: 'Wei Zhang', nationality: 'China', nationalityFlag: '🇨🇳', targetCountry: 'Australia', university: 'Uni of Melbourne', course: 'BSc Engineering', score: 'WARM', counselor: 'Sarah K.', daysInStage: 2, nextFollowUp: '2025-03-16', stage: 'CONTACTED', value: 32000 },
  { id: 'L004', studentName: 'Fatima Hassan', nationality: 'Egypt', nationalityFlag: '🇪🇬', targetCountry: 'UK', university: 'UCL', course: 'MA Education', score: 'HOT', counselor: 'Lina A.', daysInStage: 5, nextFollowUp: '2025-03-13', stage: 'CONTACTED', value: 28000 },
  { id: 'L005', studentName: 'Carlos Mendoza', nationality: 'Mexico', nationalityFlag: '🇲🇽', targetCountry: 'Germany', university: 'TU Munich', course: 'MSc Robotics', score: 'WARM', counselor: 'Mike R.', daysInStage: 7, nextFollowUp: '2025-03-17', stage: 'QUALIFIED', value: 20000 },
  { id: 'L006', studentName: 'Yuki Tanaka', nationality: 'Japan', nationalityFlag: '🇯🇵', targetCountry: 'UK', university: 'Imperial College', course: 'PhD Physics', score: 'COLD', counselor: 'Sarah K.', daysInStage: 4, nextFollowUp: '2025-03-18', stage: 'QUALIFIED', value: 35000 },
  { id: 'L007', studentName: 'Olga Petrova', nationality: 'Russia', nationalityFlag: '🇷🇺', targetCountry: 'Netherlands', university: 'TU Delft', course: 'MSc Data Science', score: 'HOT', counselor: 'Lina A.', daysInStage: 10, nextFollowUp: '2025-03-12', stage: 'APPLICATION', value: 22000 },
  { id: 'L008', studentName: 'Amara Okafor', nationality: 'Nigeria', nationalityFlag: '🇳🇬', targetCountry: 'UK', university: 'King\'s College', course: 'MSc Nursing', score: 'WARM', counselor: 'Mike R.', daysInStage: 3, nextFollowUp: '2025-03-15', stage: 'APPLICATION', value: 27000 },
  { id: 'L009', studentName: 'Minh Nguyen', nationality: 'Vietnam', nationalityFlag: '🇻🇳', targetCountry: 'Australia', university: 'ANU', course: 'BSc Finance', score: 'HOT', counselor: 'Sarah K.', daysInStage: 2, nextFollowUp: '2025-03-14', stage: 'OFFERED', value: 38000 },
  { id: 'L010', studentName: 'Leila Khalil', nationality: 'Lebanon', nationalityFlag: '🇱🇧', targetCountry: 'Canada', university: 'McGill University', course: 'MA Political Science', score: 'WARM', counselor: 'Lina A.', daysInStage: 1, nextFollowUp: '2025-03-20', stage: 'OFFERED', value: 30000 },
  { id: 'L011', studentName: 'Raj Patel', nationality: 'India', nationalityFlag: '🇮🇳', targetCountry: 'UK', university: 'University of Bristol', course: 'MSc Marketing', score: 'HOT', counselor: 'Mike R.', daysInStage: 0, nextFollowUp: '2025-04-01', stage: 'ENROLLED', value: 24000 },
  { id: 'L012', studentName: 'Sofia Garcia', nationality: 'Colombia', nationalityFlag: '🇨🇴', targetCountry: 'Spain', university: 'Uni of Barcelona', course: 'MA Architecture', score: 'COLD', counselor: 'Sarah K.', daysInStage: 15, nextFollowUp: '2025-03-10', stage: 'LOST', value: 18000 },
  { id: 'L013', studentName: 'Chen Wei', nationality: 'China', nationalityFlag: '🇨🇳', targetCountry: 'UK', university: 'University of Edinburgh', course: 'MSc AI', score: 'HOT', counselor: 'Lina A.', daysInStage: 0, nextFollowUp: '2025-03-19', stage: 'NEW', value: 33000 },
  { id: 'L014', studentName: 'Kofi Asante', nationality: 'Ghana', nationalityFlag: '🇬🇭', targetCountry: 'Germany', university: 'LMU Munich', course: 'BSc Biology', score: 'WARM', counselor: 'Mike R.', daysInStage: 6, nextFollowUp: '2025-03-16', stage: 'CONTACTED', value: 19000 },
];

const COUNSELORS = ['All', 'Sarah K.', 'Mike R.', 'Lina A.'];
const SORT_OPTIONS = [
  { value: 'score', label: 'Lead Score' },
  { value: 'date', label: 'Days in Stage' },
  { value: 'name', label: 'Student Name' },
  { value: 'value', label: 'Deal Value' },
];

// ── Score Sort Weight ──────────────────────────────────────────────────────
const SCORE_WEIGHT: Record<LeadScore, number> = { HOT: 3, WARM: 2, COLD: 1 };

// ── Lead Card Component ────────────────────────────────────────────────────
function LeadCard({ lead, onDragStart }: { lead: Lead; onDragStart: (e: React.DragEvent, leadId: string) => void }) {
  const scoreStyle = SCORE_COLORS[lead.score];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="bg-white border border-slate-200 rounded-[8px] p-3 cursor-grab active:cursor-grabbing
                 hover:border-[#E8501A]/40 hover:shadow-sm transition-all group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base shrink-0" title={lead.nationality}>{lead.nationalityFlag}</span>
          <span className="font-semibold text-[#2d3142] text-sm truncate">{lead.studentName}</span>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] font-bold px-1.5 py-0 shrink-0"
          style={{ backgroundColor: scoreStyle.bg, color: scoreStyle.text, borderRadius: '4px' }}
        >
          {lead.score}
        </Badge>
      </div>

      {/* Target info */}
      <div className="text-xs text-[#6b7280] space-y-0.5 mb-2">
        <div className="truncate">{lead.targetCountry} · {lead.university}</div>
        <div className="truncate text-[#9ca3af]">{lead.course}</div>
      </div>

      {/* Counselor + Days */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarImage src={lead.counselorAvatar} />
            <AvatarFallback className="text-[9px] bg-[#f5f5f5] text-[#6b7280]" style={{ borderRadius: '4px' }}>
              {lead.counselor.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-[#6b7280]">{lead.counselor}</span>
        </div>
        <span className="text-[11px] text-[#9ca3af] flex items-center gap-0.5">
          <Clock className="h-3 w-3" /> {lead.daysInStage}d
        </span>
      </div>

      {/* Follow-up date */}
      <div className="text-[11px] text-[#9ca3af] flex items-center gap-1 mb-2">
        <Calendar className="h-3 w-3" />
        Next: {lead.nextFollowUp}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-[#f5f5f5] text-[#6b7280] hover:text-[#2d3142] transition-colors" title="Call">
          <Phone className="h-3.5 w-3.5" />
        </button>
        <button className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-[#f5f5f5] text-[#6b7280] hover:text-[#2d3142] transition-colors" title="Email">
          <Mail className="h-3.5 w-3.5" />
        </button>
        <button className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-[#f5f5f5] text-[#6b7280] hover:text-[#2d3142] transition-colors" title="WhatsApp">
          <MessageCircle className="h-3.5 w-3.5" />
        </button>
        <button className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-[#f5f5f5] text-[#6b7280] hover:text-[#2d3142] transition-colors" title="View Details">
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Add Lead Form ──────────────────────────────────────────────────────────
function AddLeadForm({ onAdd }: { onAdd: (lead: Lead) => void }) {
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [country, setCountry] = useState('UK');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newLead: Lead = {
      id: `L${Date.now()}`,
      studentName: name,
      nationality: 'New',
      nationalityFlag: '🌍',
      targetCountry: country,
      university: university || 'TBD',
      course: course || 'TBD',
      score: 'WARM',
      counselor: 'Sarah K.',
      daysInStage: 0,
      nextFollowUp: new Date().toISOString().split('T')[0],
      stage: 'NEW',
      value: 0,
    };
    onAdd(newLead);
    setName('');
    setUniversity('');
    setCourse('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input placeholder="Student name" value={name} onChange={e => setName(e.target.value)} className="bg-white" />
      <Input placeholder="University" value={university} onChange={e => setUniversity(e.target.value)} className="bg-white" />
      <Input placeholder="Course" value={course} onChange={e => setCourse(e.target.value)} className="bg-white" />
      <Select value={country} onValueChange={setCountry}>
        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="UK">UK</SelectItem>
          <SelectItem value="Canada">Canada</SelectItem>
          <SelectItem value="Australia">Australia</SelectItem>
          <SelectItem value="Germany">Germany</SelectItem>
          <SelectItem value="Netherlands">Netherlands</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" className="w-full bg-[#bf4520] hover:bg-[#a33a1a] text-white" style={{ borderRadius: '8px' }}>
        Add Lead
      </Button>
    </form>
  );
}

// ── Main Kanban Pipeline Component ─────────────────────────────────────────
export function KanbanPipeline() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [filterCounselor, setFilterCounselor] = useState('All');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [sortBy, setSortBy] = useState('score');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStage: StageKey) => {
    e.preventDefault();
    if (!draggedLeadId) return;
    setLeads(prev => prev.map(lead =>
      lead.id === draggedLeadId ? { ...lead, stage: targetStage, daysInStage: 0 } : lead
    ));
    setDraggedLeadId(null);
  }, [draggedLeadId]);

  const handleDragEnd = useCallback(() => {
    setDraggedLeadId(null);
  }, []);

  const handleAddLead = useCallback((lead: Lead) => {
    setLeads(prev => [...prev, lead]);
  }, []);

  // Filter and sort
  const filteredLeads = useMemo(() => {
    let result = leads;

    if (filterCounselor !== 'All') {
      result = result.filter(l => l.counselor === filterCounselor);
    }
    if (filterScore !== 'all') {
      result = result.filter(l => l.score === filterScore);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.studentName.toLowerCase().includes(q) ||
        l.university.toLowerCase().includes(q) ||
        l.course.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'score': return SCORE_WEIGHT[b.score] - SCORE_WEIGHT[a.score];
        case 'date': return a.daysInStage - b.daysInStage;
        case 'name': return a.studentName.localeCompare(b.studentName);
        case 'value': return b.value - a.value;
        default: return 0;
      }
    });

    return result;
  }, [leads, filterCounselor, filterScore, searchQuery, sortBy]);

  // Group by stage
  const grouped = useMemo(() => {
    const map: Record<StageKey, Lead[]> = {
      NEW: [], CONTACTED: [], QUALIFIED: [], APPLICATION: [], OFFERED: [], ENROLLED: [], LOST: [],
    };
    filteredLeads.forEach(l => map[l.stage].push(l));
    return map;
  }, [filteredLeads]);

  // Total value
  const totalValue = useMemo(() => filteredLeads.reduce((sum, l) => sum + l.value, 0), [filteredLeads]);

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#2d3142]">Lead Pipeline</h2>
            <Badge variant="secondary" className="text-xs bg-[#f5f5f5] text-[#6b7280]" style={{ borderRadius: '6px' }}>
              {filteredLeads.length} leads · ${(totalValue / 1000).toFixed(0)}K total
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs w-40 bg-[#f5f5f5] border-slate-200"
                style={{ borderRadius: '6px' }}
              />
            </div>
            {/* Filter by counselor */}
            <Select value={filterCounselor} onValueChange={setFilterCounselor}>
              <SelectTrigger className="h-8 text-xs w-32 bg-[#f5f5f5] border-slate-200" style={{ borderRadius: '6px' }}>
                <Users className="h-3.5 w-3.5 mr-1 text-[#9ca3af]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNSELORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Filter by score */}
            <Select value={filterScore} onValueChange={setFilterScore}>
              <SelectTrigger className="h-8 text-xs w-24 bg-[#f5f5f5] border-slate-200" style={{ borderRadius: '6px' }}>
                <Filter className="h-3.5 w-3.5 mr-1 text-[#9ca3af]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="HOT">HOT</SelectItem>
                <SelectItem value="WARM">WARM</SelectItem>
                <SelectItem value="COLD">COLD</SelectItem>
              </SelectContent>
            </Select>
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs w-28 bg-[#f5f5f5] border-slate-200" style={{ borderRadius: '6px' }}>
                <SortAsc className="h-3.5 w-3.5 mr-1 text-[#9ca3af]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Add Lead */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="h-8 text-xs bg-[#bf4520] hover:bg-[#a33a1a] text-white"
                  style={{ borderRadius: '6px' }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white" style={{ borderRadius: '10px' }}>
                <DialogHeader>
                  <DialogTitle className="text-[#2d3142]">Add New Lead</DialogTitle>
                </DialogHeader>
                <AddLeadForm onAdd={handleAddLead} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 min-h-0" style={{ minWidth: `${COLUMNS.length * 260}px` }}>
          {COLUMNS.map(col => {
            const colLeads = grouped[col.key];
            const isOverWip = colLeads.length > col.wipLimit;
            const colValue = colLeads.reduce((s, l) => s + l.value, 0);

            return (
              <div
                key={col.key}
                className="flex-1 min-w-[240px] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, col.key)}
              >
                {/* Column Header */}
                <div
                  className="flex items-center justify-between px-3 py-2 mb-2 rounded-t-[8px]"
                  style={{ backgroundColor: col.bgColor, borderBottom: `2px solid ${col.borderColor}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="font-semibold text-sm text-[#2d3142]">{col.label}</span>
                    <span className="text-xs text-[#6b7280] bg-white px-1.5 py-0.5 rounded-[4px]">
                      {colLeads.length}
                    </span>
                    {isOverWip && (
                      <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444]" />
                    )}
                  </div>
                  <div className="text-[10px] text-[#9ca3af]">
                    ${(colValue / 1000).toFixed(0)}K
                  </div>
                </div>

                {/* WIP Limit Warning */}
                {isOverWip && (
                  <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-[11px] px-3 py-1.5 mb-2 rounded-[6px] flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Over WIP limit ({col.wipLimit})
                  </div>
                )}

                {/* Cards */}
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pb-4">
                    {colLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={handleDragStart}
                      />
                    ))}
                    {colLeads.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-[8px] p-6 text-center text-xs text-[#9ca3af]">
                        Drop leads here
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag end handler (invisible) */}
      <div onDragEnd={handleDragEnd} className="hidden" />
    </div>
  );
}
