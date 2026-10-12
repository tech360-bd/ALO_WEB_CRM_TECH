"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  PageHeader,
  EmptyState,
  LoadingGrid,
  SectionCard,
} from "@/components/alo/shared";
import { DOC_STATUS_COLORS, fmtDate, timeAgo } from "@/lib/alo-types";

interface DocRow {
  id: string;
  studentId: string;
  category: string;
  name: string;
  required: boolean;
  status: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  storagePath?: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  uploadedAt: string | null;
  reviewedById: string | null;
  student?: { studentId: string; fullName: string } | null;
}

interface StudentOption {
  id: string;
  studentId: string;
  fullName: string;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "UPLOADED", label: "Uploaded" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UPLOADED: "Uploaded",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const CATEGORIES = [
  { value: "PASSPORT", label: "Passport" },
  { value: "NID", label: "National ID / Birth Certificate" },
  { value: "ACADEMIC_CERT", label: "Academic Certificates" },
  { value: "TRANSCRIPT", label: "Academic Transcripts" },
  { value: "CV", label: "Curriculum Vitae" },
  { value: "SOP", label: "Statement of Purpose" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
  { value: "SPONSOR_DOC", label: "Sponsor Documents" },
  { value: "IELTS_CERT", label: "English Test Certificate" },
  { value: "VISA_DOC", label: "Visa Application Documents" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

export function DocumentHub() {
  const { toast } = useToast();
  const [docs, setDocs] = React.useState<DocRow[]>([]);
  const [students, setStudents] = React.useState<StudentOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [search, setSearch] = React.useState("");

  // Review dialog
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewTarget, setReviewTarget] = React.useState<DocRow | null>(null);
  const [reviewStatus, setReviewStatus] = React.useState("");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [reviewSaving, setReviewSaving] = React.useState(false);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadForm, setUploadForm] = React.useState({
    studentId: "",
    category: "",
    name: "",
    fileName: "",
    required: true,
  });
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadSaving, setUploadSaving] = React.useState(false);

  const fetchDocs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocs(Array.isArray(data.documents) ? data.documents : []);
    } catch {
      toast({
        title: "Failed to load documents",
        description: "Please check your connection and try again.",
      });
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchStudents = React.useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(
        Array.isArray(data.students)
          ? data.students.map((s: any) => ({
              id: s.id,
              studentId: s.studentId,
              fullName: s.fullName,
            }))
          : []
      );
    } catch {
      setStudents([]);
    }
  }, []);

  React.useEffect(() => {
    fetchDocs();
    fetchStudents();
  }, [fetchDocs, fetchStudents]);

  const stats = React.useMemo(() => {
    const total = docs.length;
    const pending = docs.filter((d) => ["PENDING", "UPLOADED", "UNDER_REVIEW"].includes(d.status)).length;
    const approved = docs.filter((d) => d.status === "APPROVED").length;
    const rejected = docs.filter((d) => d.status === "REJECTED").length;
    return { total, pending, approved, rejected };
  }, [docs]);

  const filtered = React.useMemo(() => {
    return docs.filter((d) => {
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && d.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${d.name} ${d.category} ${d.studentId} ${d.student?.fullName ?? ""} ${d.fileName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [docs, statusFilter, categoryFilter, search]);

  const openReview = (doc: DocRow) => {
    setReviewTarget(doc);
    setReviewStatus(doc.status === "PENDING" || doc.status === "UPLOADED" ? "UNDER_REVIEW" : doc.status);
    setRejectionReason(doc.rejectionReason || "");
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    if (reviewStatus === "REJECTED" && !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason before rejecting the document.",
      });
      return;
    }
    setReviewSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewTarget.id,
          status: reviewStatus,
          rejectionReason: reviewStatus === "REJECTED" ? rejectionReason.trim() : null,
          reviewedById: "demo-user",
        }),
      });
      if (!res.ok) throw new Error("patch failed");
      const data = await res.json();
      setDocs((prev) => prev.map((d) => (d.id === reviewTarget.id ? { ...d, ...(data.document || {}) } : d)));
      toast({
        title: reviewStatus === "APPROVED" ? "Document approved" : reviewStatus === "REJECTED" ? "Document rejected" : "Status updated",
        description: `${reviewTarget.name} marked as ${reviewStatus.replace(/_/g, " ").toLowerCase()}.`,
      });
      setReviewOpen(false);
      setReviewTarget(null);
    } catch {
      toast({
        title: "Update failed",
        description: "Could not update document status. Try again.",
      });
    } finally {
      setReviewSaving(false);
    }
  };

  const submitUpload = async () => {
    if (!uploadForm.studentId || !uploadForm.category) {
      toast({
        title: "Missing fields",
        description: "Please select a student and a document category.",
      });
      return;
    }
    if (!uploadFile) {
      toast({
        title: "No file selected",
        description: "Please choose a file to upload.",
      });
      return;
    }
    setUploadSaving(true);
    try {
      const categoryLabel = CATEGORY_LABELS[uploadForm.category] || uploadForm.category;
      // Step 1: Upload the real file to private storage via the storage service
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("pool", "STUDENT_PARTNER");
      fd.append("entityType", "STUDENT");
      fd.append("studentId", uploadForm.studentId);
      fd.append("uploadedBy", "demo-user");
      fd.append("visibility", "PRIVATE");
      fd.append("accessPolicy", "OWNER_AND_STAFF");
      fd.append("source", "PORTAL");
      fd.append("category", uploadForm.category);
      fd.append("tags", uploadForm.category.toLowerCase());

      const upRes = await fetch("/api/storage/upload", { method: "POST", body: fd });
      if (!upRes.ok) {
        const err = await upRes.json().catch(() => ({}));
        throw new Error(err.error || "File upload failed");
      }
      const upData = await upRes.json();
      const fileId = upData.file?.id;

      // Step 2: Create the Document requirement record, linked to the real file
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: uploadForm.studentId,
          category: uploadForm.category,
          name: uploadForm.name.trim() || categoryLabel,
          fileName: uploadFile.name,
          fileType: uploadFile.type,
          fileSize: uploadFile.size,
          required: uploadForm.required,
          reviewedById: "demo-user",
          fileId, // link to the real stored file
        }),
      });
      if (!res.ok) throw new Error("document record failed");
      const data = await res.json();
      if (data.document) {
        setDocs((prev) => [data.document, ...prev]);
      }
      toast({
        title: "Document uploaded",
        description: `${uploadFile.name} (${(uploadFile.size / 1024).toFixed(1)} KB) stored securely and queued for review.`,
      });
      setUploadOpen(false);
      setUploadForm({ studentId: "", category: "", name: "", fileName: "", required: true });
      setUploadFile(null);
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message || "Could not upload the document. Try again.",
      });
    } finally {
      setUploadSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Secure Document Hub"
        subtitle="Private, audit-logged document management. No public URLs."
        icon="FolderLock"
        action={
          <Button
            onClick={() => setUploadOpen(true)}
            className="h-12 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
          >
            <Icon name="Upload" className="size-4" />
            Upload Document
          </Button>
        }
      />

      {/* Stats */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Documents" value={stats.total} icon="Files" accent="blue" hint="Across all students" />
          <StatCard label="Pending Review" value={stats.pending} icon="Clock" accent="orange" hint="Uploaded, under review" />
          <StatCard label="Approved" value={stats.approved} icon="CheckCircle2" accent="emerald" hint="Verified by team" />
          <StatCard label="Rejected" value={stats.rejected} icon="XCircle" accent="rose" hint="Needs resubmission" />
        </div>
      )}

      {/* Security notice */}
      <Card className="rounded-2xl border-2 border-[#0057B8]/20 bg-[#e8f0fb]/40">
        <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0057B8] text-white">
            <Icon name="ShieldCheck" className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#0057B8]">Private &amp; audit-logged storage</p>
            <p className="text-xs text-muted-foreground">
              Documents are stored privately. Downloads require permission checks. All uploads
              &amp; approvals are audit-logged for compliance.
            </p>
          </div>
          <Badge className="border-[#0057B8]/20 bg-white text-[#0057B8]">RBAC Protected</Badge>
        </CardContent>
      </Card>

      {/* Filters */}
      <SectionCard
        title="Filter Documents"
        icon="Filter"
        description="Narrow down by status, category, or student."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Search</Label>
            <div className="relative">
              <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Student, doc name, file..."
                className="h-10 pl-9 border-[#0057B8]/20"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Document table */}
      <SectionCard
        title="Documents"
        icon="FileText"
        description={`${filtered.length} of ${docs.length} documents shown`}
      >
        {loading ? (
          <LoadingGrid count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="FolderOpen"
            title="No documents found"
            description={
              docs.length === 0
                ? "Upload the first document to get started."
                : "Try adjusting your filters to see more results."
            }
            action={
              <Button
                onClick={() => setUploadOpen(true)}
                className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
              >
                <Icon name="Upload" className="size-4" />
                Upload Document
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#0057B8]/15">
                  <TableHead className="min-w-[180px]">Student</TableHead>
                  <TableHead className="min-w-[220px]">Document</TableHead>
                  <TableHead className="text-center">Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-[120px]">Last Updated</TableHead>
                  <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className="border-[#0057B8]/10 align-top">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {d.student?.fullName || "—"}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{d.studentId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Icon name="FileText" className="size-4 shrink-0 text-[#0057B8]" />
                          <span className="text-sm font-medium text-foreground">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <Badge variant="outline" className="border-[#0057B8]/20 px-2 py-0 text-[10px] font-semibold text-[#0057B8]">
                            {CATEGORY_LABELS[d.category] || d.category}
                          </Badge>
                          {d.fileName && (
                            <span className="font-mono text-[10px] text-muted-foreground">{d.fileName}</span>
                          )}
                        </div>
                        {d.status === "REJECTED" && d.rejectionReason && (
                          <p className="mt-1 flex items-start gap-1 pl-6 text-xs text-red-600">
                            <Icon name="AlertTriangle" className="mt-0.5 size-3 shrink-0" />
                            <span>{d.rejectionReason}</span>
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {d.required ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#E8501A]/10 text-[#E8501A]">
                          <Icon name="Asterisk" className="size-3.5" />
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Optional</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={d.status}
                        colorMap={DOC_STATUS_COLORS}
                        labels={DOC_STATUS_LABELS}
                      />
                      {d.reviewedAt && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {timeAgo(d.reviewedAt)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(d.reviewedAt || d.uploadedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReview(d)}
                          className="h-8 border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb]"
                        >
                          <Icon name="CheckSquare" className="size-3.5" />
                          Review
                        </Button>
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0} className="inline-flex">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={!d.storagePath?.startsWith("storage://")}
                                  onClick={async () => {
                                    const m = d.storagePath?.match(/^storage:\/\/files\/(.+)$/);
                                    if (!m) {
                                      toast({
                                        title: "Download unavailable",
                                        description: "This document has no stored file (requirement only).",
                                      });
                                      return;
                                    }
                                    try {
                                      const r = await fetch(`/api/storage/download/${m[1]}?userId=demo-user&userRole=SUPER_ADMIN`);
                                      if (!r.ok) {
                                        const e = await r.json().catch(() => ({}));
                                        throw new Error(e.error || "Download failed");
                                      }
                                      const blob = await r.blob();
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = d.fileName || d.name || "document";
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                      toast({ title: "Download started", description: d.fileName || d.name });
                                    } catch (e: any) {
                                      toast({ title: "Download failed", description: e?.message || "Could not download file." });
                                    }
                                  }}
                                  className="size-8 text-[#0057B8] hover:bg-[#e8f0fb]"
                                  aria-label="Download document"
                                >
                                  <Icon name="Download" className="size-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <span className="text-xs">
                                {d.storagePath?.startsWith("storage://")
                                  ? "Download securely"
                                  : "No file stored (requirement only)"}
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* ===== Review Dialog ===== */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0057B8]">Review document</DialogTitle>
            <DialogDescription>
              {reviewTarget?.name} —{" "}
              <span className="font-mono">{reviewTarget?.studentId}</span>
            </DialogDescription>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0057B8]">Student</span>
                  <span>{reviewTarget.student?.fullName || "—"}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-semibold text-[#0057B8]">File</span>
                  <span className="font-mono">{reviewTarget.fileName || "—"}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-semibold text-[#0057B8]">Uploaded</span>
                  <span>{fmtDate(reviewTarget.uploadedAt)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#0057B8]">Decision</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNDER_REVIEW">Mark Under Review</SelectItem>
                    <SelectItem value="APPROVED">Approve</SelectItem>
                    <SelectItem value="REJECTED">Reject</SelectItem>
                    <SelectItem value="PENDING">Reset to Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reviewStatus === "REJECTED" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#E8501A]">
                    Rejection reason <span className="text-[#E8501A]">*</span>
                  </Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain what needs to be corrected or resubmitted..."
                    className="min-h-[90px] border-[#0057B8]/20"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <Icon name="History" className="size-3.5 shrink-0" />
                This action will be recorded in the audit log.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setReviewOpen(false)}
              className="h-10"
              disabled={reviewSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewSaving}
              className="h-10 bg-[#0057B8] text-white hover:bg-[#0057B8]/90"
            >
              {reviewSaving ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="Save" className="size-4" />
                  Save decision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Upload Dialog ===== */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0057B8]">Upload document</DialogTitle>
            <DialogDescription>
              Files are stored privately. A timeline event and audit log entry will be created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#0057B8]">Student</Label>
              <Select
                value={uploadForm.studentId}
                onValueChange={(v) => setUploadForm((f) => ({ ...f, studentId: v }))}
              >
                <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No students available
                    </SelectItem>
                  ) : (
                    students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName} ({s.studentId})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#0057B8]">Category</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(v) => setUploadForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-name" className="text-sm font-semibold text-[#0057B8]">
                Document name
              </Label>
              <Input
                id="doc-name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Passport — Tanvir Ahmed"
                className="h-10 border-[#0057B8]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-file" className="text-sm font-semibold text-[#0057B8]">
                File <span className="text-red-500">*</span>
              </Label>
              <label
                htmlFor="doc-file"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#0057B8]/25 bg-[#e8f0fb]/20 px-4 py-6 text-center transition-colors hover:border-[#0057B8] hover:bg-[#e8f0fb]/40"
              >
                <Icon name={uploadFile ? "FileCheck2" : "Upload"} className="size-6 text-[#0057B8]" />
                {uploadFile ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{uploadFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(uploadFile.size / 1024).toFixed(1)} KB · {uploadFile.type || "unknown type"}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Click to choose a file</span>
                    <span className="text-xs text-muted-foreground">
                      PDF, JPG, PNG, DOCX, XLSX up to 100MB
                    </span>
                  </div>
                )}
                <input
                  id="doc-file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      setUploadForm((prev) => ({
                        ...prev,
                        fileName: f.name,
                        name: prev.name || f.name.replace(/\.[^.]+$/, ""),
                      }));
                    }
                  }}
                />
              </label>
              {uploadFile && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadFile(null);
                    setUploadForm((f) => ({ ...f, fileName: "" }));
                  }}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove file
                </button>
              )}
              <p className="text-[11px] text-muted-foreground">
                Files are stored in encrypted private storage with SHA-256 checksum integrity. A timeline event and audit log entry are created automatically.
              </p>
            </div>

            <label
              htmlFor="doc-required"
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2.5"
            >
              <Checkbox
                id="doc-required"
                checked={uploadForm.required}
                onCheckedChange={(v) => setUploadForm((f) => ({ ...f, required: v === true }))}
                className="border-[#0057B8]/40 data-[state=checked]:bg-[#0057B8] data-[state=checked]:border-[#0057B8]"
              />
              <span className="text-sm text-foreground">
                <span className="font-semibold">Required document</span>
                <span className="block text-xs text-muted-foreground">
                  Mark as mandatory for this student&apos;s application checklist.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setUploadOpen(false)}
              className="h-10"
              disabled={uploadSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={submitUpload}
              disabled={uploadSaving}
              className="h-10 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
            >
              {uploadSaving ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Icon name="Upload" className="size-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
