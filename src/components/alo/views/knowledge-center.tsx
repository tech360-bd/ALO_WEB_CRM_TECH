"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
  Progress,
} from "@/components/alo/shared";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// =============================================================================
// Types — match /api/knowledge-center/* response shapes
// =============================================================================

interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder?: number;
  status?: string;
}

interface KnowledgeDocument {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  fileType: string;
  filePath?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  tags?: string | null;
  authorId?: string | null;
  version?: number;
  uploadDate?: string;
  visibility?: string;
  approvalStatus?: string;
  downloadCount?: number;
  isFeatured?: boolean;
  isPinned?: boolean;
  aiSummary?: string | null;
  aiTags?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface KnowledgeNews {
  id: string;
  title: string;
  content: string;
  category: string;
  country?: string | null;
  isPinned?: boolean;
  isFeatured?: boolean;
  authorId?: string | null;
  attachments?: string | null;
  tags?: string | null;
  status?: string;
  publishedAt?: string;
  createdAt?: string;
}

interface TrainingMaterial {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  videoUrl?: string | null;
  documentPath?: string | null;
  duration?: number | null;
  trainerId?: string | null;
  passScore?: number | null;
  certificateEnabled?: boolean;
  enrolledCount?: number;
  completedCount?: number;
  tags?: string | null;
  status?: string;
  createdAt?: string;
}

interface DocumentsResponse {
  documents: KnowledgeDocument[];
  categories: KnowledgeCategory[];
  stats: { total: number; featured: number; pinned: number };
}

interface NewsResponse {
  news: KnowledgeNews[];
}

interface TrainingResponse {
  trainings: TrainingMaterial[];
}

interface AiSearchResponse {
  answer: string;
  documents: { id: string; title: string; fileType: string; summary?: string | null }[];
  news: { id: string; title: string }[];
  totalResults: number;
}

interface EnterpriseSearchResponse {
  query: string;
  results: { documents: number; news: number; trainings: number; total: number };
  documents: KnowledgeDocument[];
  news: KnowledgeNews[];
  trainings: TrainingMaterial[];
}

// =============================================================================
// Constants
// =============================================================================

const FILE_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  PDF: { label: "PDF", icon: "FileText", color: "bg-rose-100 text-rose-700 border-rose-200" },
  DOCX: { label: "DOCX", icon: "FileType", color: "bg-blue-100 text-blue-700 border-blue-200" },
  DOC: { label: "DOC", icon: "FileType", color: "bg-blue-100 text-blue-700 border-blue-200" },
  PPT: { label: "PPT", icon: "Presentation", color: "bg-orange-100 text-orange-700 border-orange-200" },
  PPTX: { label: "PPTX", icon: "Presentation", color: "bg-orange-100 text-orange-700 border-orange-200" },
  XLSX: { label: "XLSX", icon: "Sheet", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  XLS: { label: "XLS", icon: "Sheet", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  IMAGE: { label: "IMG", icon: "Image", color: "bg-violet-100 text-violet-700 border-violet-200" },
  ZIP: { label: "ZIP", icon: "FileArchive", color: "bg-amber-100 text-amber-700 border-amber-200" },
  VIDEO: { label: "VIDEO", icon: "PlayCircle", color: "bg-purple-100 text-purple-700 border-purple-200" },
  AUDIO: { label: "AUDIO", icon: "Music", color: "bg-pink-100 text-pink-700 border-pink-200" },
  LINK: { label: "LINK", icon: "Link2", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
};

const NEWS_CATEGORIES = [
  "OFFICE_ANNOUNCEMENT",
  "UNIVERSITY_UPDATE",
  "SCHOLARSHIP_UPDATE",
  "COUNTRY_UPDATE",
  "IMMIGRATION_UPDATE",
  "TRAINING_NEWS",
  "MEETING_NOTES",
  "POLICY_UPDATE",
  "HR_NOTICE",
  "MARKETING_NOTICE",
  "SALES_NOTICE",
  "VISA_NOTICE",
];

const NEWS_CATEGORY_LABEL: Record<string, string> = {
  OFFICE_ANNOUNCEMENT: "Office Announcement",
  UNIVERSITY_UPDATE: "University Update",
  SCHOLARSHIP_UPDATE: "Scholarship Update",
  COUNTRY_UPDATE: "Country Update",
  IMMIGRATION_UPDATE: "Immigration Update",
  TRAINING_NEWS: "Training News",
  MEETING_NOTES: "Meeting Notes",
  POLICY_UPDATE: "Policy Update",
  HR_NOTICE: "HR Notice",
  MARKETING_NOTICE: "Marketing Notice",
  SALES_NOTICE: "Sales Notice",
  VISA_NOTICE: "Visa Notice",
};

const NEWS_CATEGORY_COLORS: Record<string, string> = {
  OFFICE_ANNOUNCEMENT: "bg-blue-100 text-blue-700 border-blue-200",
  UNIVERSITY_UPDATE: "bg-violet-100 text-violet-700 border-violet-200",
  SCHOLARSHIP_UPDATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COUNTRY_UPDATE: "bg-cyan-100 text-cyan-700 border-cyan-200",
  IMMIGRATION_UPDATE: "bg-orange-100 text-orange-700 border-orange-200",
  TRAINING_NEWS: "bg-amber-100 text-amber-700 border-amber-200",
  MEETING_NOTES: "bg-slate-100 text-slate-700 border-slate-200",
  POLICY_UPDATE: "bg-rose-100 text-rose-700 border-rose-200",
  HR_NOTICE: "bg-pink-100 text-pink-700 border-pink-200",
  MARKETING_NOTICE: "bg-purple-100 text-purple-700 border-purple-200",
  SALES_NOTICE: "bg-teal-100 text-teal-700 border-teal-200",
  VISA_NOTICE: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const TRAINING_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  RECORDED_TRAINING: { label: "Recorded Training", icon: "Video", color: "bg-blue-100 text-blue-700 border-blue-200" },
  LIVE_TRAINING: { label: "Live Training", icon: "Radio", color: "bg-rose-100 text-rose-700 border-rose-200" },
  QUIZ: { label: "Quiz", icon: "HelpCircle", color: "bg-amber-100 text-amber-700 border-amber-200" },
  CERTIFICATE: { label: "Certificate", icon: "Award", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  HANDBOOK: { label: "Handbook", icon: "BookOpen", color: "bg-violet-100 text-violet-700 border-violet-200" },
  SALES_TRAINING: { label: "Sales Training", icon: "TrendingUp", color: "bg-teal-100 text-teal-700 border-teal-200" },
  COUNSELING_TRAINING: { label: "Counseling Training", icon: "Users", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  VISA_TRAINING: { label: "Visa Training", icon: "Plane", color: "bg-orange-100 text-orange-700 border-orange-200" },
  CRM_TRAINING: { label: "CRM Training", icon: "LayoutDashboard", color: "bg-purple-100 text-purple-700 border-purple-200" },
  AI_TRAINING: { label: "AI Training", icon: "BrainCircuit", color: "bg-pink-100 text-pink-700 border-pink-200" },
};

const VISIBILITY_OPTIONS = [
  "EMPLOYEE",
  "MANAGER",
  "COUNSELOR",
  "MARKETING",
  "VISA",
  "FINANCE",
  "HR",
  "SUPER_ADMIN",
];

const EXAMPLE_QUESTIONS = [
  "UK visa documents",
  "Canada SDS requirements",
  "SOP template",
  "Bank statement guide",
  "Scholarship deadlines",
  "Australia GTE requirement",
];

// =============================================================================
// Helpers
// =============================================================================

function safeParseTags(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
    return [];
  } catch {
    // Fallback: comma-separated
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function fileTypeMeta(ft: string) {
  return FILE_TYPE_META[ft?.toUpperCase()] || { label: ft || "FILE", icon: "File", color: "bg-slate-100 text-slate-700 border-slate-200" };
}

function newsCategoryColor(cat: string) {
  return NEWS_CATEGORY_COLORS[cat] || "bg-slate-100 text-slate-700 border-slate-200";
}

function newsCategoryLabel(cat: string) {
  return NEWS_CATEGORY_LABEL[cat] || cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function trainingTypeMeta(t: string) {
  return TRAINING_TYPE_META[t] || { label: t.replace(/_/g, " "), icon: "GraduationCap", color: "bg-slate-100 text-slate-700 border-slate-200" };
}

function fmtBytes(n?: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function truncate(s: string, n = 180): string {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n).trim()}…` : s;
}

// =============================================================================
// Sub-components
// =============================================================================

function FileTypeBadge({ ft }: { ft: string }) {
  const m = fileTypeMeta(ft);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold", m.color)}>
      <Icon name={m.icon} className="size-3" />
      {m.label}
    </span>
  );
}

function CountryBadge({ country }: { country?: string | null }) {
  if (!country) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">
      <Icon name="Globe" className="size-3" />
      {country}
    </span>
  );
}

function TagPills({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.slice(0, 5).map((t, i) => (
        <span key={`${t}-${i}`} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          #{t}
        </span>
      ))}
      {tags.length > 5 && (
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          +{tags.length - 5}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================

export function KnowledgeCenter() {
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [documents, setDocuments] = React.useState<KnowledgeDocument[]>([]);
  const [categories, setCategories] = React.useState<KnowledgeCategory[]>([]);
  const [docStats, setDocStats] = React.useState<{ total: number; featured: number; pinned: number }>({ total: 0, featured: 0, pinned: 0 });
  const [news, setNews] = React.useState<KnowledgeNews[]>([]);
  const [trainings, setTrainings] = React.useState<TrainingMaterial[]>([]);

  // Document tab filters
  const [docCategoryFilter, setDocCategoryFilter] = React.useState<string>("all");
  const [docSearch, setDocSearch] = React.useState("");
  const [docFileTypeFilter, setDocFileTypeFilter] = React.useState<string>("all");

  // News tab filter
  const [newsCategoryFilter, setNewsCategoryFilter] = React.useState<string>("all");

  // Upload dialog
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadForm, setUploadForm] = React.useState({
    title: "",
    categoryId: "",
    fileType: "PDF",
    visibility: "EMPLOYEE",
    tags: "",
    description: "",
    filePath: "",
  });

  // AI Search tab
  const [aiQuestion, setAiQuestion] = React.useState("");
  const [aiAnswer, setAiAnswer] = React.useState<AiSearchResponse | null>(null);
  const [aiSearching, setAiSearching] = React.useState(false);

  // Enterprise search (also on AI Search tab)
  const [esQuery, setEsQuery] = React.useState("");
  const [esResults, setEsResults] = React.useState<EnterpriseSearchResponse | null>(null);
  const [esSearching, setEsSearching] = React.useState(false);

  // ---------------------------------------------------------------------------
  // Initial data fetch
  // ---------------------------------------------------------------------------

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, newsRes, trainRes] = await Promise.all([
        fetch("/api/knowledge-center/documents", { cache: "no-store" }),
        fetch("/api/knowledge-center/news", { cache: "no-store" }),
        fetch("/api/knowledge-center/training", { cache: "no-store" }),
      ]);
      if (!docsRes.ok) throw new Error(`Documents HTTP ${docsRes.status}`);
      const docsJson = (await docsRes.json()) as DocumentsResponse;
      const newsJson = newsRes.ok ? ((await newsRes.json()) as NewsResponse) : { news: [] };
      const trainJson = trainRes.ok ? ((await trainRes.json()) as TrainingResponse) : { trainings: [] };
      setDocuments(docsJson.documents || []);
      setCategories(docsJson.categories || []);
      setDocStats(docsJson.stats || { total: 0, featured: 0, pinned: 0 });
      setNews(newsJson.news || []);
      setTrainings(trainJson.trainings || []);
    } catch (err) {
      toast({
        title: "Failed to load Knowledge Center",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------------------------------------------------------------------------
  // Document upload
  // ---------------------------------------------------------------------------

  async function handleUpload() {
    if (!uploadForm.title.trim() || !uploadForm.categoryId) {
      toast({
        title: "Missing fields",
        description: "Title and category are required.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const tags = uploadForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/knowledge-center/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadForm.title.trim(),
          categoryId: uploadForm.categoryId,
          fileType: uploadForm.fileType,
          visibility: uploadForm.visibility,
          tags,
          description: uploadForm.description.trim() || undefined,
          filePath: uploadForm.filePath.trim() || undefined,
          authorId: "kc-employee",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Document uploaded",
        description: `${uploadForm.title.trim()} added to Knowledge Center. AI will categorize, tag, summarize, and index it shortly.`,
      });
      setUploadOpen(false);
      setUploadForm({ title: "", categoryId: "", fileType: "PDF", visibility: "EMPLOYEE", tags: "", description: "", filePath: "" });
      await fetchAll();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Document download
  // ---------------------------------------------------------------------------

  function handleDownload(doc: KnowledgeDocument) {
    toast({
      title: "Download started",
      description: `${doc.title} (${fileTypeMeta(doc.fileType).label}) — access logged to your employee audit trail.`,
    });
  }

  // ---------------------------------------------------------------------------
  // AI Search (POST)
  // ---------------------------------------------------------------------------

  async function handleAskAi(questionOverride?: string) {
    const q = (questionOverride ?? aiQuestion).trim();
    if (!q) {
      toast({
        title: "Enter a question",
        description: "Ask anything about documents, news, or training in the Knowledge Center.",
        variant: "destructive",
      });
      return;
    }
    setAiQuestion(q);
    setAiSearching(true);
    setAiAnswer(null);
    try {
      const res = await fetch("/api/knowledge-center/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AiSearchResponse;
      setAiAnswer(json);
      toast({
        title: "AI answered",
        description: `${json.totalResults} matching resources found.`,
      });
    } catch (err) {
      toast({
        title: "AI search failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAiSearching(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Enterprise Search (GET)
  // ---------------------------------------------------------------------------

  async function handleEnterpriseSearch(qOverride?: string) {
    const q = (qOverride ?? esQuery).trim();
    if (!q) {
      toast({
        title: "Enter a search term",
        description: "Search documents, news, and training across the Knowledge Center.",
        variant: "destructive",
      });
      return;
    }
    setEsQuery(q);
    setEsSearching(true);
    setEsResults(null);
    try {
      const res = await fetch(`/api/knowledge-center/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as EnterpriseSearchResponse;
      setEsResults(json);
    } catch (err) {
      toast({
        title: "Search failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setEsSearching(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const filteredDocuments = React.useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return documents.filter((d) => {
      if (docCategoryFilter !== "all" && d.categoryId !== docCategoryFilter) return false;
      if (docFileTypeFilter !== "all" && d.fileType.toUpperCase() !== docFileTypeFilter) return false;
      if (q && !d.title.toLowerCase().includes(q) && !(d.description || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documents, docCategoryFilter, docFileTypeFilter, docSearch]);

  const filteredNews = React.useMemo(() => {
    if (newsCategoryFilter === "all") return news;
    return news.filter((n) => n.category === newsCategoryFilter);
  }, [news, newsCategoryFilter]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Employee Knowledge Center"
          subtitle="Internal resources, training materials, and knowledge base for ALO Education staff only."
          icon="BookMarked"
        />
        <LoadingGrid count={4} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border border-[#E2E8F0] bg-white">
              <CardContent className="space-y-3 pt-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Knowledge Center"
        subtitle="Internal resources, training materials, and knowledge base for ALO Education staff only."
        icon="BookMarked"
        action={
          <Button variant="outline" onClick={() => fetchAll()} className="h-10">
            <Icon name="RefreshCw" className="size-4" />
            Refresh
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Documents" value={docStats.total} icon="Files" accent="blue" hint={`${docStats.pinned} pinned`} />
        <StatCard label="Featured Documents" value={docStats.featured} icon="Star" accent="orange" hint="Highlighted by editors" />
        <StatCard label="Latest News" value={news.length} icon="Newspaper" accent="violet" hint={`${news.filter((n) => n.isPinned).length} pinned`} />
        <StatCard label="Training Materials" value={trainings.length} icon="GraduationCap" accent="emerald" hint="Active courses" />
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="flex h-auto w-full max-w-full flex-wrap gap-1 rounded-2xl border border-[#E2E8F0] bg-white p-1 sm:inline-flex sm:w-auto">
          <TabsTrigger value="documents" className="rounded-xl">
            <Icon name="Files" className="size-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="news" className="rounded-xl">
            <Icon name="Newspaper" className="size-4" />
            News &amp; Updates
          </TabsTrigger>
          <TabsTrigger value="training" className="rounded-xl">
            <Icon name="GraduationCap" className="size-4" />
            Training Center
          </TabsTrigger>
          <TabsTrigger value="ai-search" className="rounded-xl">
            <Icon name="Sparkles" className="size-4" />
            AI Search
          </TabsTrigger>
        </TabsList>

        {/* ───────────────────────── Documents tab ───────────────────────── */}
        <TabsContent value="documents" className="space-y-4">
          <SectionCard
            title="Document Library"
            description="Browse internal SOPs, templates, country guides, and policy documents."
            icon="FolderOpen"
            action={
              <Button onClick={() => setUploadOpen(true)} className="h-10 bg-[#C2410C] text-white hover:bg-[#9A3412]">
                <Icon name="Upload" className="size-4" />
                Upload Document
              </Button>
            }
          >
            {/* Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                  placeholder="Search document title or description…"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="h-10 rounded-xl border-[#E2E8F0] pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-text text-[#64748B]">Category:</span>
                <button
                  onClick={() => setDocCategoryFilter("all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    docCategoryFilter === "all"
                      ? "bg-[#0B5ED7] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setDocCategoryFilter(c.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      docCategoryFilter === c.id
                        ? "bg-[#0B5ED7] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {c.icon && <Icon name={c.icon} className="size-3" />}
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-text text-[#64748B]">File type:</span>
                <button
                  onClick={() => setDocFileTypeFilter("all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    docFileTypeFilter === "all"
                      ? "bg-[#2563EB] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  All
                </button>
                {Object.keys(FILE_TYPE_META).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setDocFileTypeFilter(ft)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      docFileTypeFilter === ft
                        ? "bg-[#2563EB] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {ft}
                  </button>
                ))}
              </div>

              <div className="body-text text-[#64748B]">
                Showing <span className="font-semibold text-[#0F172A]">{filteredDocuments.length}</span> of {documents.length} documents
              </div>
            </div>

            {/* Document grid */}
            {filteredDocuments.length === 0 ? (
              <EmptyState
                icon="FolderX"
                title="No documents found"
                description="Try a different filter or upload a new document."
              />
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc) => {
                  const tags = safeParseTags(doc.tags);
                  const aiTags = safeParseTags(doc.aiTags);
                  const allTags = Array.from(new Set([...tags, ...aiTags]));
                  const cat = categories.find((c) => c.id === doc.categoryId);
                  return (
                    <Card
                      key={doc.id}
                      className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white alo-shadow transition-all hover:alo-shadow-lg"
                    >
                      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
                        <div className="flex items-start justify-between gap-2">
                          <FileTypeBadge ft={doc.fileType} />
                          <div className="flex flex-wrap gap-1">
                            {doc.isFeatured && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                                <Icon name="Star" className="size-3" />
                                Featured
                              </span>
                            )}
                            {doc.isPinned && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                <Icon name="Pin" className="size-3" />
                                Pinned
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="card-title line-clamp-2 text-[#0F172A]">{doc.title}</p>
                          {cat && (
                            <p className="mt-0.5 inline-flex items-center gap-1 body-text text-[#64748B]">
                              <Icon name="Folder" className="size-3.5" />
                              {cat.name}
                            </p>
                          )}
                        </div>

                        {doc.aiSummary && (
                          <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-2">
                            <p className="badge-text flex items-center gap-1 text-violet-700">
                              <Icon name="Sparkles" className="size-3" />
                              AI Summary
                            </p>
                            <p className="mt-1 line-clamp-2 body-text text-[#475569]">{doc.aiSummary}</p>
                          </div>
                        )}

                        {!doc.aiSummary && doc.description && (
                          <p className="line-clamp-2 body-text text-[#64748B]">{doc.description}</p>
                        )}

                        <TagPills tags={allTags} />

                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3">
                          <div className="flex items-center gap-3 body-text text-[#64748B]">
                            <span className="inline-flex items-center gap-1">
                              <Icon name="Download" className="size-3.5" />
                              {doc.downloadCount ?? 0}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Icon name="Clock" className="size-3.5" />
                              {doc.uploadDate ? fmtDate(doc.uploadDate) : "—"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Icon name="Eye" className="size-3.5" />
                              {doc.visibility || "EMPLOYEE"}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            className="h-8 bg-[#0B5ED7] text-white hover:bg-[#004494]"
                          >
                            <Icon name="Download" className="size-3.5" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ───────────────────────── News tab ───────────────────────── */}
        <TabsContent value="news" className="space-y-4">
          <SectionCard
            title="News & Updates"
            description="Office announcements, university updates, scholarships, immigration & visa news."
            icon="Newspaper"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-text text-[#64748B]">Category:</span>
              <button
                onClick={() => setNewsCategoryFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  newsCategoryFilter === "all"
                    ? "bg-[#0B5ED7] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All
              </button>
              {NEWS_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewsCategoryFilter(c)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    newsCategoryFilter === c
                      ? "bg-[#0B5ED7] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {newsCategoryLabel(c)}
                </button>
              ))}
            </div>

            <div className="mt-3 body-text text-[#64748B]">
              Showing <span className="font-semibold text-[#0F172A]">{filteredNews.length}</span> of {news.length} news items
            </div>

            {filteredNews.length === 0 ? (
              <EmptyState icon="Newspaper" title="No news found" description="Try a different category filter." />
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredNews.map((n) => {
                  const tags = safeParseTags(n.tags);
                  return (
                    <Card key={n.id} className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white alo-shadow transition-all hover:alo-shadow-lg">
                      <CardContent className="flex flex-1 flex-col gap-2 pt-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold", newsCategoryColor(n.category))}>
                            <Icon name="Tag" className="size-3" />
                            {newsCategoryLabel(n.category)}
                          </span>
                          <CountryBadge country={n.country} />
                          {n.isPinned && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                              <Icon name="Pin" className="size-3" />
                              Pinned
                            </span>
                          )}
                          {n.isFeatured && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                              <Icon name="Star" className="size-3" />
                              Featured
                            </span>
                          )}
                        </div>

                        <p className="card-title text-[#0F172A]">{n.title}</p>
                        <p className="line-clamp-3 body-text text-[#475569]">{n.content}</p>

                        <TagPills tags={tags} />

                        <div className="mt-auto flex items-center gap-1.5 border-t border-[#E2E8F0] pt-3 body-text text-[#64748B]">
                          <Icon name="Calendar" className="size-3.5" />
                          {n.publishedAt ? fmtDate(n.publishedAt) : "—"}
                          <span className="mx-1">·</span>
                          <Icon name="Clock" className="size-3.5" />
                          {n.publishedAt ? timeAgo(n.publishedAt) : "—"}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ───────────────────────── Training tab ───────────────────────── */}
        <TabsContent value="training" className="space-y-4">
          <SectionCard
            title="Training Center"
            description="Recorded sessions, live trainings, quizzes, handbooks, and certificate courses."
            icon="GraduationCap"
          >
            {trainings.length === 0 ? (
              <EmptyState icon="GraduationCap" title="No training materials" description="Training materials will appear here once published." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trainings.map((t) => {
                  const m = trainingTypeMeta(t.type);
                  const tags = safeParseTags(t.tags);
                  const completionPct = t.enrolledCount && t.enrolledCount > 0
                    ? Math.round(((t.completedCount ?? 0) / t.enrolledCount) * 100)
                    : 0;
                  return (
                    <Card key={t.id} className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white alo-shadow transition-all hover:alo-shadow-lg">
                      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold", m.color)}>
                            <Icon name={m.icon} className="size-3" />
                            {m.label}
                          </span>
                          {t.certificateEnabled && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Icon name="Award" className="size-3" />
                              Certificate
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="card-title line-clamp-2 text-[#0F172A]">{t.title}</p>
                          {t.description && <p className="mt-1 line-clamp-2 body-text text-[#64748B]">{t.description}</p>}
                        </div>

                        <TagPills tags={tags} />

                        {/* Enrollment progress */}
                        <div className="rounded-lg border border-[#E2E8F0] bg-slate-50/60 p-2.5">
                          <div className="flex items-center justify-between body-text">
                            <span className="text-[#64748B]">Enrollment</span>
                            <span className="font-semibold text-[#0F172A]">
                              {t.completedCount ?? 0} / {t.enrolledCount ?? 0}
                            </span>
                          </div>
                          <Progress value={completionPct} className="mt-1.5 h-1.5" indicatorColor="#0B5ED7" />
                          <div className="mt-1 flex items-center justify-between badge-text text-[#64748B]">
                            <span>{completionPct}% completed</span>
                            {t.passScore != null && <span>Pass score: {t.passScore}%</span>}
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3">
                          <div className="flex items-center gap-3 body-text text-[#64748B]">
                            {t.duration != null && (
                              <span className="inline-flex items-center gap-1">
                                <Icon name="Clock" className="size-3.5" />
                                {t.duration} min
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Icon name="Users" className="size-3.5" />
                              {t.enrolledCount ?? 0}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              toast({
                                title: "Training started",
                                description: `${t.title} — your progress will be tracked in your employee profile.`,
                              })
                            }
                            className="h-8 bg-[#C2410C] text-white hover:bg-[#9A3412]"
                          >
                            <Icon name="PlayCircle" className="size-3.5" />
                            Start Training
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ───────────────────────── AI Search tab ───────────────────────── */}
        <TabsContent value="ai-search" className="space-y-4">
          {/* AI Ask */}
          <SectionCard
            title="Ask AI — Knowledge Assistant"
            description="Ask any question in natural language. The AI agent searches documents, news, and training, then returns an answer with sources."
            icon="Sparkles"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Icon name="MessageCircleQuestion" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                  placeholder="e.g. What documents are required for UK student visa?"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAskAi();
                  }}
                  className="h-11 rounded-xl border-[#E2E8F0] pl-9"
                />
              </div>
              <Button
                onClick={() => handleAskAi()}
                disabled={aiSearching}
                className="h-11 bg-[#0B5ED7] text-white hover:bg-[#004494]"
              >
                {aiSearching ? (
                  <Icon name="Loader2" className="size-4 animate-spin" />
                ) : (
                  <Icon name="Sparkles" className="size-4" />
                )}
                Ask AI
              </Button>
            </div>

            {/* Example chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="badge-text text-[#64748B]">Try:</span>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAskAi(q)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#0B5ED7] transition-colors hover:bg-[#EFF6FF]"
                >
                  <Icon name="Lightbulb" className="size-3" />
                  {q}
                </button>
              ))}
            </div>

            {/* AI answer */}
            {aiSearching && (
              <div className="mt-4 space-y-3 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <div className="flex items-center gap-2">
                  <Icon name="Loader2" className="size-4 animate-spin text-violet-600" />
                  <span className="card-title text-[#0F172A]">AI is searching the knowledge base…</span>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            )}

            {!aiSearching && aiAnswer && (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/60 to-white p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                      <Icon name="Sparkles" className="size-4" />
                    </div>
                    <div>
                      <p className="card-title text-[#0F172A]">AI Answer</p>
                      <p className="badge-text text-[#64748B]">{aiAnswer.totalResults} sources referenced</p>
                    </div>
                  </div>
                  <div className="mt-3 whitespace-pre-wrap body-text leading-relaxed text-[#1E293B]">
                    {aiAnswer.answer}
                  </div>
                </div>

                {aiAnswer.documents.length > 0 && (
                  <div>
                    <p className="card-title flex items-center gap-1.5 text-[#0F172A]">
                      <Icon name="Files" className="size-4 text-[#0B5ED7]" />
                      Matching Documents
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {aiAnswer.documents.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <FileTypeBadge ft={d.fileType} />
                              <p className="card-title truncate text-[#0F172A]">{d.title}</p>
                            </div>
                            {d.summary && (
                              <p className="mt-1 line-clamp-2 body-text text-[#64748B]">{d.summary}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toast({
                                title: "Download started",
                                description: `${d.title} — access logged to your employee audit trail.`,
                              })
                            }
                            className="h-8 shrink-0"
                          >
                            <Icon name="Download" className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnswer.news.length > 0 && (
                  <div>
                    <p className="card-title flex items-center gap-1.5 text-[#0F172A]">
                      <Icon name="Newspaper" className="size-4 text-violet-600" />
                      Matching News
                    </p>
                    <div className="mt-2 space-y-2">
                      {aiAnswer.news.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3"
                        >
                          <Icon name="ChevronRight" className="size-4 shrink-0 text-[#64748B]" />
                          <p className="body-text font-medium text-[#0F172A]">{n.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Enterprise keyword search */}
          <SectionCard
            title="Enterprise Search"
            description="Keyword search across the entire Knowledge Center — documents, news, and training materials."
            icon="Search"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Icon name="Search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                  placeholder="Search keywords, e.g. SOP, visa, scholarship…"
                  value={esQuery}
                  onChange={(e) => setEsQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEnterpriseSearch();
                  }}
                  className="h-11 rounded-xl border-[#E2E8F0] pl-9"
                />
              </div>
              <Button
                onClick={() => handleEnterpriseSearch()}
                disabled={esSearching}
                variant="outline"
                className="h-11 border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF]"
              >
                {esSearching ? <Icon name="Loader2" className="size-4 animate-spin" /> : <Icon name="Search" className="size-4" />}
                Search
              </Button>
            </div>

            {esSearching && (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}

            {!esSearching && esResults && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <p className="badge-text text-[#64748B]">Total</p>
                    <p className="text-xl font-bold text-[#0F172A]">{esResults.results.total}</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <p className="badge-text text-[#64748B]">Documents</p>
                    <p className="text-xl font-bold text-[#0B5ED7]">{esResults.results.documents}</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <p className="badge-text text-[#64748B]">News</p>
                    <p className="text-xl font-bold text-violet-600">{esResults.results.news}</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <p className="badge-text text-[#64748B]">Training</p>
                    <p className="text-xl font-bold text-emerald-600">{esResults.results.trainings}</p>
                  </div>
                </div>

                {esResults.documents.length > 0 && (
                  <div>
                    <p className="card-title text-[#0F172A]">Documents</p>
                    <div className="mt-2 space-y-2">
                      {esResults.documents.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <FileTypeBadge ft={d.fileType} />
                            <p className="body-text font-medium text-[#0F172A] truncate">{d.title}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(d)}
                            className="h-8 shrink-0 text-[#0B5ED7]"
                          >
                            <Icon name="Download" className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {esResults.news.length > 0 && (
                  <div>
                    <p className="card-title text-[#0F172A]">News</p>
                    <div className="mt-2 space-y-2">
                      {esResults.news.map((n) => (
                        <div key={n.id} className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold", newsCategoryColor(n.category))}>
                              {newsCategoryLabel(n.category)}
                            </span>
                            <CountryBadge country={n.country} />
                          </div>
                          <p className="mt-1 body-text font-medium text-[#0F172A]">{n.title}</p>
                          <p className="line-clamp-2 body-text text-[#64748B]">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {esResults.trainings.length > 0 && (
                  <div>
                    <p className="card-title text-[#0F172A]">Training Materials</p>
                    <div className="mt-2 space-y-2">
                      {esResults.trainings.map((t) => {
                        const m = trainingTypeMeta(t.type);
                        return (
                          <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold", m.color)}>
                                {m.label}
                              </span>
                              <p className="body-text font-medium text-[#0F172A] truncate">{t.title}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                toast({
                                  title: "Training started",
                                  description: `${t.title} — your progress will be tracked.`,
                                })
                              }
                              className="h-8 shrink-0 text-[#C2410C]"
                            >
                              <Icon name="PlayCircle" className="size-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {esResults.results.total === 0 && (
                  <EmptyState
                    icon="SearchX"
                    title="No results found"
                    description={`Nothing matched "${esResults.query}". Try different keywords or ask AI above.`}
                  />
                )}
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* RBAC + AI notes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Access Control" icon="ShieldCheck">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <div className="flex items-start gap-2.5">
              <Icon name="ShieldAlert" className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div>
                <p className="card-title text-[#0F172A]">Employees Only</p>
                <p className="mt-1 body-text text-[#475569]">
                  This Knowledge Center is only for ALO Education employees. Students, partners, and public users cannot access it.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {VISIBILITY_OPTIONS.map((v) => (
                    <span key={v} className="rounded-md border border-[#E2E8F0] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#64748B]">
                      {v.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="AI Auto-Processing" icon="BrainCircuit">
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
            <div className="flex items-start gap-2.5">
              <Icon name="Sparkles" className="mt-0.5 size-5 shrink-0 text-violet-600" />
              <div>
                <p className="card-title text-[#0F172A]">AI Indexing Pipeline</p>
                <p className="mt-1 body-text text-[#475569]">
                  When new documents, news, or updates are added, AI automatically categorizes, tags, summarizes, and indexes them for search.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {[
                    { icon: "FolderTree", label: "Categorize" },
                    { icon: "Tags", label: "Tag" },
                    { icon: "FileText", label: "Summarize" },
                    { icon: "Search", label: "Index" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 rounded-md border border-violet-100 bg-white px-2 py-1">
                      <Icon name={s.icon} className="size-3.5 text-violet-600" />
                      <span className="badge-text text-[#475569]">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Upload" className="size-5 text-[#0B5ED7]" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Add a new document to the Knowledge Center. AI will automatically categorize, tag, summarize, and index it after upload.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="kc-title">Title *</Label>
              <Input
                id="kc-title"
                placeholder="e.g. UK Student Visa — Document Checklist 2025"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((s) => ({ ...s, title: e.target.value }))}
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select value={uploadForm.categoryId} onValueChange={(v) => setUploadForm((s) => ({ ...s, categoryId: v }))}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>File Type</Label>
                <Select value={uploadForm.fileType} onValueChange={(v) => setUploadForm((s) => ({ ...s, fileType: v }))}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(FILE_TYPE_META).map((ft) => (
                      <SelectItem key={ft} value={ft}>
                        {ft}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Visibility</Label>
                <Select value={uploadForm.visibility} onValueChange={(v) => setUploadForm((s) => ({ ...s, visibility: v }))}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="kc-filepath">File Path / URL</Label>
                <Input
                  id="kc-filepath"
                  placeholder="/private/docs/… or https://…"
                  value={uploadForm.filePath}
                  onChange={(e) => setUploadForm((s) => ({ ...s, filePath: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kc-tags">Tags (comma-separated)</Label>
              <Input
                id="kc-tags"
                placeholder="UK, visa, checklist, 2025"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm((s) => ({ ...s, tags: e.target.value }))}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kc-desc">Description</Label>
              <Textarea
                id="kc-desc"
                placeholder="Brief description of what this document contains…"
                value={uploadForm.description}
                onChange={(e) => setUploadForm((s) => ({ ...s, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading} className="h-10">
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading} className="h-10 bg-[#0B5ED7] text-white hover:bg-[#004494]">
              {uploading ? <Icon name="Loader2" className="size-4 animate-spin" /> : <Icon name="Upload" className="size-4" />}
              {uploading ? "Uploading…" : "Upload & AI-process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default KnowledgeCenter;
