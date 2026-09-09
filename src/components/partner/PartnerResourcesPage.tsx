'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Search, Download, FileText, Image as ImageIcon, Video, FileSpreadsheet,
  BookOpen, GraduationCap, Plane, Award, Palette, FileCheck,
  Filter, Loader2, FolderOpen, Eye, CalendarDays, HardDrive,
} from 'lucide-react';

type ResourceType = 'PDF' | 'Image' | 'Video' | 'Doc';
type ResourceCategory = 'Marketing Materials' | 'University Guides' | 'Application Forms' | 'Visa Information' | 'Scholarship Lists' | 'Brand Guidelines';

interface Resource {
  id: string; title: string; category: ResourceCategory; type: ResourceType;
  size: string; downloadCount: number; date: string; description: string;
}

const mockResources: Resource[] = [
  { id: 'R-001', title: 'ALO Education 2025 Brochure', category: 'Marketing Materials', type: 'PDF', size: '4.2 MB', downloadCount: 342, date: '2025-01-15', description: 'Complete ALO Education program brochure for 2025 intake' },
  { id: 'R-002', title: 'UK University Comparison Chart', category: 'University Guides', type: 'PDF', size: '1.8 MB', downloadCount: 218, date: '2025-01-12', description: 'Side-by-side comparison of top 20 UK partner universities' },
  { id: 'R-003', title: 'Application Form - Masters', category: 'Application Forms', type: 'Doc', size: '245 KB', downloadCount: 567, date: '2025-01-10', description: 'Standard application form for masters programs' },
  { id: 'R-004', title: 'UK Student Visa Guide 2025', category: 'Visa Information', type: 'PDF', size: '3.1 MB', downloadCount: 189, date: '2025-01-08', description: 'Comprehensive guide for UK Tier 4 student visa application' },
  { id: 'R-005', title: 'Scholarship Database - Spring 2025', category: 'Scholarship Lists', type: 'PDF', size: '892 KB', downloadCount: 423, date: '2025-01-05', description: 'List of available scholarships for Spring 2025 intake' },
  { id: 'R-006', title: 'ALO Brand Guidelines v3', category: 'Brand Guidelines', type: 'PDF', size: '12.5 MB', downloadCount: 87, date: '2024-12-20', description: 'Official brand identity guidelines for partner use' },
  { id: 'R-007', title: 'Social Media Post Templates', category: 'Marketing Materials', type: 'Image', size: '8.7 MB', downloadCount: 156, date: '2025-01-14', description: 'Ready-to-use social media templates for Facebook and Instagram' },
  { id: 'R-008', title: 'University of Manchester Guide', category: 'University Guides', type: 'PDF', size: '2.3 MB', downloadCount: 195, date: '2025-01-11', description: 'Detailed guide for University of Manchester programs and admissions' },
  { id: 'R-009', title: 'Application Checklist - Undergraduate', category: 'Application Forms', type: 'Doc', size: '180 KB', downloadCount: 445, date: '2025-01-09', description: 'Complete checklist for undergraduate applications' },
  { id: 'R-010', title: 'Canada Study Permit Process', category: 'Visa Information', type: 'PDF', size: '2.7 MB', downloadCount: 134, date: '2025-01-06', description: 'Step-by-step guide for Canadian study permit applications' },
  { id: 'R-011', title: 'Merit-Based Scholarships List', category: 'Scholarship Lists', type: 'Doc', size: '567 KB', downloadCount: 312, date: '2025-01-03', description: 'Scholarships based on academic merit across partner universities' },
  { id: 'R-012', title: 'ALO Logo Pack (PNG & SVG)', category: 'Brand Guidelines', type: 'Image', size: '5.4 MB', downloadCount: 76, date: '2024-12-18', description: 'Official ALO Education logos in multiple formats' },
  { id: 'R-013', title: 'Student Testimonial Videos', category: 'Marketing Materials', type: 'Video', size: '156 MB', downloadCount: 98, date: '2025-01-13', description: 'Video testimonials from successful ALO students' },
  { id: 'R-014', title: 'Monash University Programs', category: 'University Guides', type: 'PDF', size: '1.9 MB', downloadCount: 167, date: '2025-01-07', description: 'Complete program listing for Monash University, Australia' },
  { id: 'R-015', title: 'USA F-1 Visa Guide', category: 'Visa Information', type: 'PDF', size: '3.8 MB', downloadCount: 201, date: '2025-01-04', description: 'Detailed guide for US F-1 student visa process and interview tips' },
];

const categories: ResourceCategory[] = ['Marketing Materials', 'University Guides', 'Application Forms', 'Visa Information', 'Scholarship Lists', 'Brand Guidelines'];

function typeConfig(t: ResourceType) {
  const map: Record<ResourceType, { icon: React.ReactNode; variant: 'brand' | 'success' | 'warning' | 'secondary' }> = {
    PDF: { icon: <FileText className="w-4 h-4" />, variant: 'brand' },
    Image: { icon: <ImageIcon className="w-4 h-4" />, variant: 'success' },
    Video: { icon: <Video className="w-4 h-4" />, variant: 'warning' },
    Doc: { icon: <FileSpreadsheet className="w-4 h-4" />, variant: 'secondary' },
  };
  return map[t];
}

function categoryIcon(cat: ResourceCategory) {
  const map: Record<ResourceCategory, React.ReactNode> = {
    'Marketing Materials': <Palette className="w-4 h-4" />,
    'University Guides': <GraduationCap className="w-4 h-4" />,
    'Application Forms': <FileCheck className="w-4 h-4" />,
    'Visa Information': <Plane className="w-4 h-4" />,
    'Scholarship Lists': <Award className="w-4 h-4" />,
    'Brand Guidelines': <BookOpen className="w-4 h-4" />,
  };
  return map[cat];
}

function typeColor(t: ResourceType) {
  const map: Record<ResourceType, string> = { PDF: 'bg-red-50 text-red-600', Image: 'bg-emerald-50 text-emerald-600', Video: 'bg-amber-50 text-amber-600', Doc: 'bg-blue-50 text-blue-600' };
  return map[t];
}

function formatDate(d: string) { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } }

export default function PartnerResourcesPage() {
  const { user } = usePortalStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setResources(mockResources); setLoading(false); }, 500);
    return () => clearTimeout(t);
  }, []);

  const handleDownload = async (r: Resource) => {
    setDownloading(r.id);
    try { await fetch('/api/partner/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerId: user?.id, resourceId: r.id, action: 'download' }) }); } catch { /* fallback */ } finally {
      setResources((p) => p.map((x) => x.id === r.id ? { ...x, downloadCount: x.downloadCount + 1 } : x));
      setDownloading(null);
      toast.success('Downloaded: ' + r.title);
    }
  };

  const filtered = resources.filter((r) => {
    if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
    if (search) { const q = search.toLowerCase(); return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q); }
    return true;
  });

  if (loading) {
    return (<div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-40 w-full rounded-xl" />))}</div></div>);
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-alo-text">Resource Library</h1><p className="text-sm text-alo-text-muted mt-0.5">Download marketing materials, guides, and forms</p></div>
        <Badge variant="outline" className="w-fit"><FolderOpen className="w-3 h-3" /> {resources.length} resources</Badge>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search resources by title, description, or category..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="flex items-center gap-2 overflow-x-auto"><Filter className="w-4 h-4 text-alo-text-muted hidden sm:block flex-shrink-0" />
            <div className="flex items-center gap-1">{['All', ...categories].map((cat) => (<button key={cat} onClick={() => setCategoryFilter(cat)} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap', categoryFilter === cat ? 'bg-alo-brand text-white' : 'text-alo-text-secondary hover:bg-muted')}>{cat}</button>))}</div>
          </div>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">{categories.map((cat) => {
        const count = resources.filter((r) => r.category === cat).length;
        return (<Card key={cat} className={cn('bg-white rounded-xl border cursor-pointer transition-colors hover:shadow-sm', categoryFilter === cat ? 'border-alo-brand bg-alo-brand-light/20' : 'border-alo-border')} onClick={() => setCategoryFilter(categoryFilter === cat ? 'All' : cat)}><CardContent className="p-3 flex flex-col items-center gap-1.5 text-center"><div className="text-alo-text-secondary">{categoryIcon(cat)}</div><p className="text-[11px] font-medium text-alo-text leading-tight line-clamp-2">{cat}</p><p className="text-lg font-bold text-alo-brand">{count}</p></CardContent></Card>);
      })}</div>

      {filtered.length === 0 ? (<Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-12 text-center"><FolderOpen className="w-12 h-12 text-alo-text-muted/40 mx-auto mb-3" /><p className="text-sm text-alo-text-muted">No resources found. Try adjusting your search or filter.</p></CardContent></Card>) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map((resource) => { const tc = typeConfig(resource.type); return (
          <Card key={resource.id} className="bg-white rounded-xl border border-alo-border hover:shadow-md transition-shadow group">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3"><div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', typeColor(resource.type))}>{tc.icon}</div><div className="min-w-0"><p className="text-sm font-semibold text-alo-text truncate">{resource.title}</p><p className="text-xs text-alo-text-muted flex items-center gap-1 mt-0.5">{categoryIcon(resource.category)} {resource.category}</p></div></div>
              <p className="text-xs text-alo-text-secondary line-clamp-2 mb-3">{resource.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-alo-text-muted mb-3 flex-wrap"><Badge variant={tc.variant} className="text-[10px] gap-1">{tc.icon} {resource.type}</Badge><span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{resource.size}</span><span className="flex items-center gap-1"><Eye className="w-3 h-3" />{resource.downloadCount}</span><span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatDate(resource.date)}</span></div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownload(resource)} disabled={downloading === resource.id}>{downloading === resource.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading...</> : <><Download className="w-3.5 h-3.5" /> Download</>}</Button>
            </CardContent>
          </Card>);
        })}</div>
      )}
      <p className="text-xs text-alo-text-muted text-center">Showing {filtered.length} of {resources.length} resources</p>
    </div>
  );
}
