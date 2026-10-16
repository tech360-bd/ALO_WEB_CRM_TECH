"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader } from "@/components/alo/shared";
import { usePortalStore } from "@/lib/stores/portal-store";

// Types
interface KnowledgePost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: string;
  tags: string;
  fileUrl?: string;
  fileType?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  visibility: string;
  status: string;
  verificationStatus: string;
  upvotes: number;
  views: number;
  isPinned: boolean;
  isFeatured: boolean;
  universitySlug?: string;
  countrySlug?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number; upvoteLogs: number };
}

const CATEGORIES = [
  { value: "general", label: "General", icon: "FileText", color: "bg-slate-100 text-slate-700" },
  { value: "university_update", label: "University Update", icon: "GraduationCap", color: "bg-violet-100 text-violet-700" },
  { value: "visa_update", label: "Visa Update", icon: "Plane", color: "bg-blue-100 text-blue-700" },
  { value: "scholarship", label: "Scholarship", icon: "Award", color: "bg-emerald-100 text-emerald-700" },
  { value: "country_guide", label: "Country Guide", icon: "Globe", color: "bg-cyan-100 text-cyan-700" },
  { value: "course_info", label: "Course Info", icon: "BookOpen", color: "bg-orange-100 text-orange-700" },
  { value: "partnership", label: "Partnership", icon: "Handshake", color: "bg-teal-100 text-teal-700" },
  { value: "business_strategy", label: "Business Strategy", icon: "MapPinned", color: "bg-amber-100 text-amber-700" },
  { value: "training", label: "Training", icon: "Users", color: "bg-pink-100 text-pink-700" },
  { value: "announcement", label: "Announcement", icon: "Megaphone", color: "bg-rose-100 text-rose-700" },
  { value: "research", label: "Research", icon: "FileSearch", color: "bg-indigo-100 text-indigo-700" },
];

const VISIBILITY = ["ALL", "EMPLOYEE", "STUDENT", "PARTNER", "COUNSELOR", "ADMIN", "INTERNATIONAL_OFFICER"];

function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v;
    return [];
  } catch {
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }
}

function categoryMeta(cat: string) {
  return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[0];
}

export function KnowledgeSharingHub() {
  const { toast } = useToast();
  const user = usePortalStore((s) => s.user);
  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<KnowledgePost[]>([]);
  const [total, setTotal] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("PUBLISHED");
  const [selectedPost, setSelectedPost] = React.useState<KnowledgePost | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    content: "",
    summary: "",
    category: "general",
    tags: "",
    visibility: "ALL",
    universitySlug: "",
    countrySlug: "",
    sourceUrl: "",
  });
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [upvoting, setUpvoting] = React.useState<string | null>(null);

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("limit", "30");
      const res = await fetch(`/api/knowledge-sharing?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setPosts(json.posts || []);
        setTotal(json.total || 0);
      }
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [q, categoryFilter, statusFilter, toast]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleCreate() {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Missing fields", description: "Title and content required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/knowledge-sharing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          summary: form.summary || form.content.slice(0, 300),
          category: form.category,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          visibility: form.visibility,
          universitySlug: form.universitySlug || undefined,
          countrySlug: form.countrySlug || undefined,
          sourceUrl: form.sourceUrl || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast({ title: "Knowledge shared!", description: json.message });
      setCreateOpen(false);
      setForm({ title: "", content: "", summary: "", category: "general", tags: "", visibility: "ALL", universitySlug: "", countrySlug: "", sourceUrl: "" });
      fetchPosts();
    } catch (e: any) {
      toast({ title: "Failed to share", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function openDetail(post: KnowledgePost) {
    setSelectedPost(post);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/knowledge-sharing/${post.id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedPost(json.post);
        // fetch comments
        const cRes = await fetch(`/api/knowledge-sharing/${post.id}/comment`);
        const cJson = await cRes.json();
        if (cJson.success) setComments(cJson.comments);
      }
    } catch {}
  }

  async function handleUpvote(postId: string) {
    setUpvoting(postId);
    try {
      const res = await fetch(`/api/knowledge-sharing/${postId}/upvote`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, upvotes: json.upvoted ? p.upvotes + 1 : Math.max(0, p.upvotes - 1) } : p)));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({ ...selectedPost, upvotes: json.upvoted ? selectedPost.upvotes + 1 : Math.max(0, selectedPost.upvotes - 1) });
        }
      }
    } catch {}
    finally { setUpvoting(null); }
  }

  async function handleComment() {
    if (!newComment.trim() || !selectedPost) return;
    try {
      const res = await fetch(`/api/knowledge-sharing/${selectedPost.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const json = await res.json();
      if (json.success) {
        setComments((prev) => [...prev, json.comment]);
        setNewComment("");
        toast({ title: "Comment added" });
      }
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  }

  const stats = React.useMemo(() => {
    const byCat: Record<string, number> = {};
    posts.forEach((p) => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
    return byCat;
  }, [posts]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Knowledge Sharing Hub" subtitle="Share information, updates, and insights — accessible from every dashboard. Anyone can upload, everyone can learn." icon="Share2" />
        <LoadingGrid count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Sharing Hub"
        subtitle={`Share information, updates, and insights — accessible from every dashboard. Anyone can upload, everyone can learn. ${total} posts shared.`}
        icon="Share2"
        action={
          <Button onClick={() => setCreateOpen(true)} className="h-10 bg-[#0057B8] text-white hover:bg-[#003F87]">
            <Icon name="Plus" className="size-4" />
            Share Knowledge
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Shared" value={total} icon="Share2" accent="blue" hint="Across all portals" />
        <StatCard label="Published" value={posts.filter((p) => p.status === "PUBLISHED").length} icon="CheckCircle" accent="emerald" hint="Live for everyone" />
        <StatCard label="Pending Review" value={posts.filter((p) => p.status === "PENDING").length} icon="Clock" accent="orange" hint="Awaiting approval" />
        <StatCard label="Your Contributions" value={posts.filter((p) => p.authorId === user?.id).length} icon="User" accent="violet" hint="By you" />
      </div>

      <SectionCard title="Browse & Share Knowledge" description="Search by category, visibility, or keyword. Click any card to view details, upvote, and comment. Everyone (student, partner, counselor, employee) can upload." icon="BookOpen">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
              <Input placeholder="Search knowledge — e.g. UK visa, scholarship, partnership strategy…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 rounded-xl pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setCategoryFilter("all")} className={cn("rounded-full px-3 py-1 text-xs font-medium", categoryFilter === "all" ? "bg-[#0057B8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>All</button>
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setCategoryFilter(c.value)} className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", categoryFilter === c.value ? "bg-[#0057B8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                <Icon name={c.icon} className="size-3" />{c.label} {stats[c.value] ? `(${stats[c.value]})` : ""}
              </button>
            ))}
          </div>
        </div>

        {posts.length === 0 ? (
          <EmptyState icon="Share2" title="No knowledge shared yet" description="Be the first to share useful information — university updates, visa tips, partnership insights, or business strategy." />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const meta = categoryMeta(post.category);
              const tags = parseTags(post.tags);
              return (
                <Card key={post.id} className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white hover:shadow-lg transition-all cursor-pointer" onClick={() => openDetail(post)}>
                  <CardContent className="flex flex-1 flex-col gap-3 pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold", meta.color)}>
                        <Icon name={meta.icon} className="size-3" />{meta.label}
                      </span>
                      <div className="flex gap-1">
                        {post.isPinned && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"><Icon name="Pin" className="size-3" />Pinned</Badge>}
                        {post.isFeatured && <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px]"><Icon name="Star" className="size-3" />Featured</Badge>}
                        {post.status === "PENDING" && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Pending</Badge>}
                      </div>
                    </div>
                    <div>
                      <p className="card-title line-clamp-2 text-[#0F172A]">{post.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[#64748B]">{post.summary || post.content.slice(0, 120)}</p>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 4).map((t, i) => (
                          <span key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">#{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between border-t border-[#E2E8F0] pt-3 text-xs text-[#64748B]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1"><Icon name="Eye" className="size-3.5" />{post.views}</span>
                        <span className="inline-flex items-center gap-1"><Icon name="ThumbsUp" className="size-3.5" />{post.upvotes}</span>
                        <span className="inline-flex items-center gap-1"><Icon name="MessageCircle" className="size-3.5" />{post._count?.comments ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-[#0057B8]" onClick={(e) => { e.stopPropagation(); handleUpvote(post.id); }} disabled={upvoting === post.id}>
                          <Icon name="ThumbsUp" className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>{post.authorName} • {post.authorRole}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon name={categoryMeta(selectedPost.category).icon} className="size-5 text-[#0057B8]" />
                  {selectedPost.title}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{selectedPost.category}</Badge>
                  <Badge variant="outline">{selectedPost.visibility}</Badge>
                  <Badge variant="outline">{selectedPost.status}</Badge>
                  <span className="text-xs text-slate-500">{selectedPost.authorName} • {selectedPost.authorRole} • {new Date(selectedPost.createdAt).toLocaleString()}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#1E293B]">{selectedPost.content}</div>
                {selectedPost.fileUrl && (
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <a href={selectedPost.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"><Icon name="Paperclip" className="size-4" />Attachment: {selectedPost.fileType || "file"}</a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleUpvote(selectedPost.id)} disabled={upvoting === selectedPost.id} className="h-8"><Icon name="ThumbsUp" className="size-4" />Upvote ({selectedPost.upvotes})</Button>
                  <span className="text-xs text-slate-500">{selectedPost.views} views</span>
                </div>
                <div className="border-t pt-4">
                  <p className="font-semibold text-sm mb-2">Comments ({comments.length})</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c.id} className="rounded-lg border p-2 bg-white">
                        <div className="flex justify-between text-xs text-slate-500"><span>{c.authorName} • {c.authorRole}</span><span>{new Date(c.createdAt).toLocaleString()}</span></div>
                        <p className="text-sm mt-1">{c.content}</p>
                      </div>
                    ))}
                    {comments.length === 0 && <p className="text-xs text-slate-400">No comments yet — be first to comment.</p>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input placeholder="Add a comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleComment()} className="h-9" />
                    <Button size="sm" onClick={handleComment} className="h-9">Post</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Icon name="Share2" className="size-5 text-[#0057B8]" />Share Knowledge</DialogTitle>
            <DialogDescription>Share information, updates, or insights that others can view and utilize. Anyone (student, partner, employee) can upload.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. University of Birmingham — New Scholarship 2025" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm((s) => ({ ...s, visibility: v }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{VISIBILITY.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>University Slug</Label><Input placeholder="e.g. university-of-birmingham" value={form.universitySlug} onChange={(e) => setForm((s) => ({ ...s, universitySlug: e.target.value }))} className="h-10" /></div>
              <div className="grid gap-2"><Label>Country Slug</Label><Input placeholder="e.g. uk, usa, canada" value={form.countrySlug} onChange={(e) => setForm((s) => ({ ...s, countrySlug: e.target.value }))} className="h-10" /></div>
            </div>
            <div className="grid gap-2"><Label>Summary</Label><Input placeholder="Brief summary (optional)" value={form.summary} onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))} className="h-10" /></div>
            <div className="grid gap-2"><Label>Content *</Label><Textarea placeholder="Share detailed information, updates, research findings, business strategy, etc." value={form.content} onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))} rows={6} /></div>
            <div className="grid gap-2"><Label>Tags (comma separated)</Label><Input placeholder="UK, scholarship, partnership, 2025" value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} className="h-10" /></div>
            <div className="grid gap-2"><Label>Source URL (optional)</Label><Input placeholder="https://..." value={form.sourceUrl} onChange={(e) => setForm((s) => ({ ...s, sourceUrl: e.target.value }))} className="h-10" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating} className="h-10">Cancel</Button>
            <Button onClick={handleCreate} disabled={creating} className="h-10 bg-[#0057B8] text-white hover:bg-[#003F87]">{creating ? <Icon name="Loader2" className="size-4 animate-spin" /> : <Icon name="Share2" className="size-4" />}{creating ? "Sharing…" : "Share Knowledge"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default KnowledgeSharingHub;
