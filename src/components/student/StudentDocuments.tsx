'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  FileText,
  FileCheck,
  FileX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FolderOpen,
  ImageIcon,
  BadgeCheck,
  Archive,
  Folder,
  File,
  GraduationCap,
  Globe,
  CreditCard,
  Plane,
  Stamp,
  Briefcase,
  HelpCircle,
  X,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

type DocumentCategory = 'Identity' | 'Academic' | 'English Test' | 'Application' | 'Financial' | 'Visa';
type DocumentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired' | 'Needs Review';

interface StudentDocument {
  id: string;
  name: string;
  type: string;
  category: DocumentCategory;
  status: DocumentStatus;
  fileSize: string;
  uploadedDate: string;
  reviewedBy: string | null;
  reviewedDate: string | null;
  rejectionReason: string | null;
  usedInApplications: string[];
  fileType: string;
}

const DOCUMENT_TYPES = [
  'Passport',
  'Photo',
  'NID/Birth Certificate',
  'SSC Certificate',
  'SSC Transcript',
  'HSC Certificate',
  'HSC Transcript',
  'Bachelor Transcript',
  'Bachelor Certificate',
  'Master Transcript',
  'Master Certificate',
  'IELTS/PTE/TOEFL/DET Certificate',
  'CV',
  'SOP',
  'Recommendation Letter',
  'Bank Statement',
  'Sponsor Document',
  'Work Experience Letter',
  'Visa Document',
  'Offer Letter',
  'CAS/I-20/COE',
  'Payment Receipt',
  'Other',
] as const;

const CATEGORY_DOCUMENTS: Record<DocumentCategory, string[]> = {
  Identity: ['Passport', 'Photo', 'NID/Birth Certificate'],
  Academic: ['SSC Certificate', 'SSC Transcript', 'HSC Certificate', 'HSC Transcript', 'Bachelor Transcript', 'Bachelor Certificate', 'Master Transcript', 'Master Certificate'],
  'English Test': ['IELTS/PTE/TOEFL/DET Certificate'],
  Application: ['CV', 'SOP', 'Recommendation Letter'],
  Financial: ['Bank Statement', 'Sponsor Document'],
  Visa: ['Visa Document', 'Offer Letter', 'CAS/I-20/COE', 'Payment Receipt'],
};

const CATEGORY_ICONS: Record<DocumentCategory, React.ElementType> = {
  Identity: ShieldCheck,
  Academic: GraduationCap,
  'English Test': Globe,
  Application: FileText,
  Financial: CreditCard,
  Visa: Plane,
};

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */

const MOCK_DOCUMENTS: StudentDocument[] = [
  {
    id: 'doc-001',
    name: 'Passport (Rahim Uddin)',
    type: 'Passport',
    category: 'Identity',
    status: 'Approved',
    fileSize: '1.2 MB',
    uploadedDate: 'Jun 15, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 16, 2025',
    rejectionReason: null,
    usedInApplications: ['University of Aberdeen — MSc IB', 'University of Leeds — MSc DS', 'University of Glasgow — MSc CS'],
    fileType: 'PDF',
  },
  {
    id: 'doc-002',
    name: 'Passport Photo',
    type: 'Photo',
    category: 'Identity',
    status: 'Approved',
    fileSize: '245 KB',
    uploadedDate: 'Jun 15, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 16, 2025',
    rejectionReason: null,
    usedInApplications: ['University of Aberdeen — MSc IB', 'University of Leeds — MSc DS'],
    fileType: 'JPG',
  },
  {
    id: 'doc-003',
    name: 'National ID Card',
    type: 'NID/Birth Certificate',
    category: 'Identity',
    status: 'Approved',
    fileSize: '890 KB',
    uploadedDate: 'Jun 15, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 16, 2025',
    rejectionReason: null,
    usedInApplications: [],
    fileType: 'PDF',
  },
  {
    id: 'doc-004',
    name: 'SSC Certificate',
    type: 'SSC Certificate',
    category: 'Academic',
    status: 'Approved',
    fileSize: '1.5 MB',
    uploadedDate: 'Jun 16, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 17, 2025',
    rejectionReason: null,
    usedInApplications: ['University of Glasgow — MSc CS'],
    fileType: 'PDF',
  },
  {
    id: 'doc-005',
    name: 'SSC Transcript',
    type: 'SSC Transcript',
    category: 'Academic',
    status: 'Approved',
    fileSize: '780 KB',
    uploadedDate: 'Jun 16, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 17, 2025',
    rejectionReason: null,
    usedInApplications: ['University of Glasgow — MSc CS'],
    fileType: 'PDF',
  },
  {
    id: 'doc-006',
    name: 'HSC Certificate',
    type: 'HSC Certificate',
    category: 'Academic',
    status: 'Rejected',
    fileSize: '2.1 MB',
    uploadedDate: 'Jun 17, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 18, 2025',
    rejectionReason: 'Image is blurry. Please upload a clear scan of the original certificate.',
    usedInApplications: [],
    fileType: 'JPG',
  },
  {
    id: 'doc-007',
    name: 'HSC Transcript',
    type: 'HSC Transcript',
    category: 'Academic',
    status: 'Approved',
    fileSize: '920 KB',
    uploadedDate: 'Jun 17, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 18, 2025',
    rejectionReason: null,
    usedInApplications: ['University of Glasgow — MSc CS'],
    fileType: 'PDF',
  },
  {
    id: 'doc-008',
    name: 'Bachelor Transcript — BSc CSE',
    type: 'Bachelor Transcript',
    category: 'Academic',
    status: 'Approved',
    fileSize: '1.8 MB',
    uploadedDate: 'Jun 18, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 19, 2025',
    rejectionReason: null,
    usedInApplications: ['University of Aberdeen — MSc IB', 'University of Leeds — MSc DS', 'University of Glasgow — MSc CS'],
    fileType: 'PDF',
  },
  {
    id: 'doc-009',
    name: 'IELTS Academic Certificate',
    type: 'IELTS/PTE/TOEFL/DET Certificate',
    category: 'English Test',
    status: 'Approved',
    fileSize: '560 KB',
    uploadedDate: 'Jun 19, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 19, 2025',
    rejectionReason: null,
    usedInApplications: ['University of Aberdeen — MSc IB', 'University of Glasgow — MSc CS'],
    fileType: 'PDF',
  },
  {
    id: 'doc-010',
    name: 'Statement of Purpose — MSc IB',
    type: 'SOP',
    category: 'Application',
    status: 'Approved',
    fileSize: '340 KB',
    uploadedDate: 'Jun 20, 2025',
    reviewedBy: 'Sarah Mitchell',
    reviewedDate: 'Jun 21, 2025',
    rejectionReason: null,
    usedInApplications: ['University of Aberdeen — MSc IB'],
    fileType: 'PDF',
  },
];

const TOTAL_REQUIRED = 18;

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

function getDocStatusConfig(status: DocumentStatus) {
  switch (status) {
    case 'Approved':
      return {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        iconColor: 'text-emerald-500',
      };
    case 'Pending':
      return {
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: Clock,
        iconColor: 'text-gray-400',
      };
    case 'Rejected':
      return {
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
        iconColor: 'text-red-500',
      };
    case 'Expired':
      return {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
      };
    case 'Needs Review':
      return {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: AlertTriangle,
        iconColor: 'text-blue-500',
      };
  }
}

/* ================================================================== */
/*  COMPONENT: Upload Dialog                                           */
/* ================================================================== */

function UploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [docType, setDocType] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const handleSubmit = async () => {
    const token = usePortalStore.getState().token;
    if (token && docType && uploadedFile) {
      try {
        await fetch('/api/student-portal/documents', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: docType, fileName: uploadedFile }),
        });
      } catch { /* silent fail – dialog still closes */ }
    }
    setDocType('');
    setUploadedFile(null);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setDocType('');
      setUploadedFile(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#0F172A]">Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to your vault. It can be reused across multiple applications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0F172A]">Document Type</label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0F172A]">File</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileClick}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
                isDragging
                  ? 'border-[#C2410C] bg-orange-50/50'
                  : uploadedFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-[#0F172A]/15 bg-[#0F172A]/[0.01] hover:border-[#0F172A]/30 hover:bg-[#0F172A]/[0.02]'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {uploadedFile ? (
                <>
                  <CheckCircle2 className="size-10 text-emerald-500" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-700">{uploadedFile}</p>
                    <p className="text-xs text-emerald-600/70 mt-0.5">Click or drag to replace</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className={cn('size-10', isDragging ? 'text-[#C2410C]' : 'text-[#0F172A]/25')} />
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#0F172A]/70">
                      {isDragging ? 'Drop your file here' : 'Drag files here or click to browse'}
                    </p>
                    <p className="text-xs text-[#0F172A]/40 mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File type validation note */}
          <div className="flex items-start gap-2 rounded-lg bg-blue-50/50 border border-blue-100 px-3 py-2.5">
            <AlertTriangle className="size-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">File requirements: </span>
              Accepted formats are PDF, JPG, and PNG. Maximum file size is 10MB. Ensure all text is clearly readable.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            variant="cta"
            onClick={handleSubmit}
            disabled={!docType || !uploadedFile}
          >
            <Upload className="size-4" />
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  COMPONENT: Document Status Badge                                   */
/* ================================================================== */

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const config = getDocStatusConfig(status);
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
        config.color
      )}
    >
      <Icon className="size-3" />
      {status}
    </span>
  );
}

/* ================================================================== */
/*  COMPONENT: Document Card                                           */
/* ================================================================== */

function DocumentCard({ doc }: { doc: StudentDocument }) {
  const [showRejection, setShowRejection] = useState(false);
  const config = getDocStatusConfig(doc.status);
  const CategoryIcon = CATEGORY_ICONS[doc.category];

  const FileTypeIcon = doc.fileType === 'PDF' ? FileText : ImageIcon;

  return (
    <Card className="border-border/60 hover:border-border hover:shadow-md transition-all duration-200 py-0 gap-0">
      <CardContent className="p-4 gap-3">
        {/* Top: icon + name + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex items-center justify-center size-10 rounded-lg bg-[#0F172A]/5 border border-[#0F172A]/10 shrink-0">
              <FileTypeIcon className="size-5 text-[#0F172A]/40" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#0F172A] leading-tight truncate">{doc.name}</h3>
              <p className="text-xs text-[#0F172A]/50 mt-0.5">{doc.type}</p>
            </div>
          </div>
          <DocStatusBadge status={doc.status} />
        </div>

        {/* Category + meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[11px] font-normal gap-1 py-0">
            <CategoryIcon className="size-3" />
            {doc.category}
          </Badge>
          <span className="text-[11px] text-[#0F172A]/40">{doc.fileSize}</span>
          <span className="text-[11px] text-[#0F172A]/20">•</span>
          <span className="text-[11px] text-[#0F172A]/40">{doc.uploadedDate}</span>
        </div>

        {/* Reviewed by */}
        {doc.reviewedBy && (
          <div className="flex items-center gap-1.5 text-xs text-[#0F172A]/50">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>Reviewed by {doc.reviewedBy} • {doc.reviewedDate}</span>
          </div>
        )}

        {/* Rejection Reason */}
        {doc.rejectionReason && (
          <Collapsible open={showRejection} onOpenChange={setShowRejection}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition-colors">
              {showRejection ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {showRejection ? 'Hide' : 'Show'} rejection reason
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">{doc.rejectionReason}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Used in applications */}
        {doc.usedInApplications.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-[#0F172A]/50">
            <FolderOpen className="size-3.5 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {doc.usedInApplications.map((app, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                  {app}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/40 mt-1">
          <Button variant="ghost" size="sm" className="gap-1.5 text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-[#0F172A]/5 text-xs h-8">
            <Eye className="size-3.5" />
            View
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-[#0F172A]/5 text-xs h-8">
            <Download className="size-3.5" />
            Download
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-[#C2410C] hover:text-[#C2410C] hover:bg-orange-50 text-xs h-8">
            <RefreshCw className="size-3.5" />
            Replace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function StudentDocuments() {
  const { token } = usePortalStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiDocs, setApiDocs] = useState<StudentDocument[] | null>(null);

  useEffect(() => {
    async function loadDocs() {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch('/api/student-portal/documents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          const mapped = json.data.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            name: (d.name as string) || 'Document',
            type: (d.category as string) || 'Other',
            category: (['Identity','Academic','English Test','Application','Financial','Visa'].includes(d.category as string) ? d.category : 'Application') as DocumentCategory,
            status: (d.status === 'approved' ? 'Approved' : d.status === 'rejected' ? 'Rejected' : d.status === 'pending_review' ? 'Needs Review' : 'Pending') as DocumentStatus,
            fileSize: d.fileSize ? `${(Number(d.fileSize) / 1024).toFixed(0)} KB` : '—',
            uploadedDate: d.uploadedAt ? new Date(d.uploadedAt as string).toLocaleDateString() : '—',
            reviewedBy: null,
            reviewedDate: null,
            rejectionReason: (d.rejectionReason as string) || null,
            usedInApplications: [] as string[],
            fileType: d.fileName ? ((d.fileName as string).split('.').pop() || 'PDF').toUpperCase() : 'PDF',
          }));
          setApiDocs(mapped);
        }
      } catch { /* fallback to mock */ }
      setLoading(false);
    }
    loadDocs();
  }, [token]);

  const documents = (apiDocs && apiDocs.length > 0) ? apiDocs : MOCK_DOCUMENTS;

  // Stats
  const uploadedCount = documents.length;
  const pendingCount = documents.filter((d) => d.status === 'Pending').length;
  const rejectedCount = documents.filter((d) => d.status === 'Rejected').length;
  const needsReviewCount = documents.filter((d) => d.status === 'Needs Review').length;
  const missingCount = Math.max(0, TOTAL_REQUIRED - uploadedCount);
  const progressPercent = Math.round((uploadedCount / TOTAL_REQUIRED) * 100);

  // Filtered documents
  const filtered = useMemo(() => {
    let result = [...documents];
    if (categoryFilter !== 'all') {
      result = result.filter((d) => d.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [categoryFilter, statusFilter, searchQuery]);

  // Category tab counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    for (const doc of documents) {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    }
    return counts;
  }, [documents]);

  const categories: Array<DocumentCategory | 'all'> = [
    'all',
    'Identity',
    'Academic',
    'English Test',
    'Application',
    'Financial',
    'Visa',
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-14 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0F172A]">My Documents</h1>
          <Badge className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90 text-sm px-2.5">
            {uploadedCount}
          </Badge>
        </div>
        <Button variant="cta" size="default" onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="size-4" />
          Upload Document
        </Button>
      </div>

      {/* Progress Summary */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Progress Circle / Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#0F172A]">
                  {uploadedCount} of {TOTAL_REQUIRED} required documents uploaded
                </span>
                <span className="text-sm font-bold text-[#0F172A]">{progressPercent}%</span>
              </div>
              <Progress
                value={progressPercent}
                className="h-3 [&>div]:bg-[#C2410C]"
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]/50">
                  <Clock className="size-3 text-gray-400" />
                  <span className="font-medium text-[#0F172A]">{pendingCount} pending review</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]/50">
                  <XCircle className="size-3 text-red-400" />
                  <span className="font-medium text-red-600">{rejectedCount} rejected</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]/50">
                  <AlertTriangle className="size-3 text-amber-400" />
                  <span className="font-medium text-amber-600">{needsReviewCount} needs review</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]/50">
                  <HelpCircle className="size-3 text-[#0F172A]/30" />
                  <span className="font-medium text-[#0F172A]/70">{missingCount} missing</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs + Filters */}
      <div className="space-y-3">
        {/* Category filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat) => {
            const CatIcon = cat === 'all' ? FolderOpen : CATEGORY_ICONS[cat as DocumentCategory];
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                  isActive
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#0F172A]/60 border-[#0F172A]/10 hover:border-[#0F172A]/25 hover:text-[#0F172A]'
                )}
              >
                <CatIcon className="size-3.5" />
                {cat === 'all' ? 'All Documents' : cat}
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-[#0F172A]/5 text-[#0F172A]/40'
                  )}
                >
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Status filter + View toggle */}
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#0F172A]/30" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DocumentStatus | 'all')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Needs Review">Needs Review</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border border-[#0F172A]/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    'flex items-center justify-center rounded-md p-1.5 transition-colors',
                    viewMode === 'card' ? 'bg-[#0F172A] text-white' : 'text-[#0F172A]/40 hover:text-[#0F172A]/70'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'flex items-center justify-center rounded-md p-1.5 transition-colors',
                    viewMode === 'table' ? 'bg-[#0F172A] text-white' : 'text-[#0F172A]/40 hover:text-[#0F172A]/70'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-[#0F172A]/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="size-8 text-[#0F172A]/20 mb-3" />
            <h3 className="text-base font-semibold text-[#0F172A] mb-1">No documents found</h3>
            <p className="text-sm text-[#0F172A]/50 mb-4">
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {documents.length === 0 && (
              <Button variant="cta" size="sm" onClick={() => setUploadOpen(true)} className="gap-2">
                <Upload className="size-4" />
                Upload Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <Card className="py-0 gap-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Size</TableHead>
                <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
                <TableHead className="hidden lg:table-cell">Reviewed By</TableHead>
                <TableHead className="hidden xl:table-cell">Used In</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => {
                const CategoryIcon = CATEGORY_ICONS[doc.category];
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center size-8 rounded-md bg-[#0F172A]/5 border border-[#0F172A]/10 shrink-0">
                          {doc.fileType === 'PDF' ? (
                            <FileText className="size-4 text-[#0F172A]/40" />
                          ) : (
                            <ImageIcon className="size-4 text-[#0F172A]/40" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0F172A]">{doc.name}</p>
                          <p className="text-xs text-[#0F172A]/40">{doc.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs font-normal gap-1">
                        <CategoryIcon className="size-3" />
                        {doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DocStatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-[#0F172A]/50">{doc.fileSize}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-[#0F172A]/50">{doc.uploadedDate}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-[#0F172A]/50">
                        {doc.reviewedBy ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            {doc.reviewedBy}
                          </span>
                        ) : (
                          <span className="text-[#0F172A]/30">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {doc.usedInApplications.length > 0 ? (
                          doc.usedInApplications.map((app, idx) => (
                            <span key={idx} className="text-[11px] text-[#0F172A]/50 truncate max-w-[180px]">
                              {app}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#0F172A]/30">Not used yet</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon-sm" className="text-[#0F172A]/40 hover:text-[#0F172A]">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-[#0F172A]/40 hover:text-[#0F172A]">
                          <Download className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-[#C2410C]/60 hover:text-[#C2410C]">
                          <RefreshCw className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}