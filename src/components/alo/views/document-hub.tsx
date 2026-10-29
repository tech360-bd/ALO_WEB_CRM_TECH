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
  rejectionReason: string | null;
  reviewedAt: string | null;
  uploadedAt: string | null;
  reviewedById: string | null;
  downloadUrl?: string;
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
    if (!uploadForm.studentId || !uploadForm.category || !uploadFile) {
      toast({ title: "Missing fields", description: "Select a student, category, and actual file to upload." });
      return;
    }
    setUploadSaving(true);
    try {
      const categoryLabel = CATEGORY_LABELS[uploadForm.category] || uploadForm.category;
      const form = new FormData();
      form.append("studentId", uploadForm.studentId);
      form.append("category", uploadForm.category);
      form.append("name", uploadForm.name.trim() || categoryLabel);
      form.append("file", uploadFile);
      form.append("required", String(uploadForm.required));
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.document) throw new Error(data?.error || "The document was not saved.");
      await fetchDocs();
      toast({ title: "Document uploaded", description: data.message || `${categoryLabel} was stored privately and queued for review.` });
      setUploadOpen(false);
      setUploadForm({ studentId: "", category: "", name: "", required: true });
      setUploadFile(null);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload the document. No success was recorded.",
        variant: "destructive",
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
            className="h-12 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
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
      <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)]/40">
        <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-brand)] text-white">
            <Icon name="ShieldCheck" className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--alo-brand)]">Private &amp; audit-logged storage</p>
            <p className="text-xs text-muted-foreground">
              Documents are stored privately. Downloads require permission checks. All uploads
              &amp; approvals are audit-logged for compliance.
            </p>
          </div>
          <Badge className="border-[var(--alo-brand)]/20 bg-white text-[var(--alo-brand)]">RBAC Protected</Badge>
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
              <SelectTrigger className="h-10 w-full border-[var(--alo-brand)]/20">
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
              <SelectTrigger className="h-10 w-full border-[var(--alo-brand)]/20">
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
                className="h-10 pl-9 border-[var(--alo-brand)]/20"
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
                className="h-11 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
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
                <TableRow className="border-[var(--alo-brand)]/15">
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
                  <TableRow key={d.id} className="border-[var(--alo-brand)]/10 align-top">
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
                          <Icon name="FileText" className="size-4 shrink-0 text-[var(--alo-brand)]" />
                          <span className="text-sm font-medium text-foreground">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <Badge variant="outline" className="border-[var(--alo-brand)]/20 px-2 py-0 text-[11px] font-semibold text-[var(--alo-brand)]">
                            {CATEGORY_LABELS[d.category] || d.category}
                          </Badge>
                          {d.fileName && (
                            <span className="font-mono text-[11px] text-muted-foreground">{d.fileName}</span>
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
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--alo-cta)]/10 text-[var(--alo-cta)]">
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
                        <p className="mt-1 text-[11px] text-muted-foreground">
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
                          className="h-8 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
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
                                  disabled={!d.downloadUrl}
                                  onClick={() => d.downloadUrl && window.location.assign(d.downloadUrl)}
                                  className="size-8 text-muted-foreground"
                                  aria-label="Download document"
                                >
                                  <Icon name="Download" className="size-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <span className="text-xs">Download from private storage with access checks</span>
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
            <DialogTitle className="text-[var(--alo-brand)]">Review document</DialogTitle>
            <DialogDescription>
              {reviewTarget?.name} —{" "}
              <span className="font-mono">{reviewTarget?.studentId}</span>
            </DialogDescription>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--alo-brand)]">Student</span>
                  <span>{reviewTarget.student?.fullName || "—"}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-semibold text-[var(--alo-brand)]">File</span>
                  <span className="font-mono">{reviewTarget.fileName || "—"}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-semibold text-[var(--alo-brand)]">Uploaded</span>
                  <span>{fmtDate(reviewTarget.uploadedAt)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[var(--alo-brand)]">Decision</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger className="h-10 w-full border-[var(--alo-brand)]/20">
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
                  <Label className="text-sm font-semibold text-[var(--alo-cta)]">
                    Rejection reason <span className="text-[var(--alo-cta)]">*</span>
                  </Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain what needs to be corrected or resubmitted..."
                    className="min-h-[90px] border-[var(--alo-brand)]/20"
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
 className=" bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
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
            <DialogTitle className="text-[var(--alo-brand)]">Upload document</DialogTitle>
            <DialogDescription>
              Files are stored privately. A timeline event and audit log entry will be created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[var(--alo-brand)]">Student</Label>
              <Select
                value={uploadForm.studentId}
                onValueChange={(v) => setUploadForm((f) => ({ ...f, studentId: v }))}
              >
                <SelectTrigger className="h-10 w-full border-[var(--alo-brand)]/20">
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
              <Label className="text-sm font-semibold text-[var(--alo-brand)]">Category</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(v) => setUploadForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger className="h-10 w-full border-[var(--alo-brand)]/20">
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
              <Label htmlFor="doc-name" className="text-sm font-semibold text-[var(--alo-brand)]">
                Document name
              </Label>
              <Input
                id="doc-name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Passport — Tanvir Ahmed"
                className="h-10 border-[var(--alo-brand)]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-file" className="text-sm font-semibold text-[var(--alo-brand)]">
                Document file
              </Label>
              <Input
                id="doc-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="border-[var(--alo-brand)]/20"
              />
              <p className="text-[11px] text-muted-foreground">
                {uploadFile ? `${uploadFile.name} · ${(uploadFile.size / 1024).toFixed(0)} KB` : "PDF or image, maximum 20 MB. File bytes are uploaded to private storage."}
              </p>
            </div>

            <label
              htmlFor="doc-required"
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/40 px-3 py-2.5"
            >
              <Checkbox
                id="doc-required"
                checked={uploadForm.required}
                onCheckedChange={(v) => setUploadForm((f) => ({ ...f, required: v === true }))}
                className="border-[var(--alo-brand)]/40 data-[state=checked]:bg-[var(--alo-brand)] data-[state=checked]:border-[var(--alo-brand)]"
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
 className=" bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
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
export default DocumentHub;
