"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
} from "@/components/alo/shared";
import { fmtDate, type ViewKey } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types — matches /api/course-finder/admin response
// ---------------------------------------------------------------------------

type Course = {
  id: string;
  slug: string;
  name: string;
  universitySlug: string;
  countrySlug: string;
  city: string;
  level: string;
  subject: string;
  duration: string;
  intake: string;
  tuition: string;
  scholarship?: string | null;
  englishRequirement: string;
  academicRequirement: string;
  overview?: string;
  modules?: string;
  careerOutcomes?: string;
  deadline?: string | null;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  verificationStatus: string;
  approvalStatus: string;
  updatedAt?: string;
  university: { name: string; slug: string; city?: string };
  country: { name: string; shortName: string; flag: string; slug: string } | null;
};

type AdminSummary = {
  total: number;
  published: number;
  draft: number;
  pendingReview: number;
};

type University = {
  slug: string;
  name: string;
  countrySlug: string;
  country: { name: string; shortName: string; flag: string } | null;
};

type Country = {
  slug: string;
  name: string;
  shortName: string;
  flag: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APPROVAL_COLORS: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  NEEDS_REVIEW: "bg-amber-100 text-amber-700",
  UNVERIFIED: "bg-slate-100 text-slate-700",
};

const LEVEL_OPTIONS = [
  "Foundation",
  "Bachelor",
  "Masters",
  "MBA",
  "PhD",
  "Postgraduate Diploma",
  "Pre-Masters",
  "Top-up",
];

const SUBJECT_OPTIONS = [
  "Computer Science",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Software Engineering",
  "Business",
  "Management",
  "Finance",
  "Marketing",
  "Accounting",
  "Economics",
  "Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Law",
  "Medicine",
  "Nursing",
  "Public Health",
  "Pharmacy",
  "Education",
  "Psychology",
  "Sociology",
  "Hospitality",
  "Tourism",
  "Architecture",
  "Design",
  "Media",
  "Journalism",
  "Environmental Science",
  "Biotechnology",
  "Renewable Energy",
];

const DELIVERY_MODES = ["On-campus", "Online", "Hybrid", "Blended"];

// ---------------------------------------------------------------------------
// Empty form
// ---------------------------------------------------------------------------

type CourseForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  level: string;
  subject: string;
  duration: string;
  deliveryMode: string;
  intake: string;
  universitySlug: string;
  countrySlug: string;
  city: string;
  tuition: string;
  currency: string;
  applicationFee: string;
  deposit: string;
  scholarship: string;
  englishRequirement: string;
  academicRequirement: string;
  deadline: string;
  overview: string;
  modulesTextarea: string;
  careerOutcomesTextarea: string;
  sourceUrl: string;
  approvalStatus: string;
  verificationStatus: string;
};

const EMPTY_FORM: CourseForm = {
  name: "",
  slug: "",
  description: "",
  level: "Masters",
  subject: "Computer Science",
  duration: "",
  deliveryMode: "On-campus",
  intake: "September",
  universitySlug: "",
  countrySlug: "",
  city: "",
  tuition: "",
  currency: "USD",
  applicationFee: "",
  deposit: "",
  scholarship: "",
  englishRequirement: "",
  academicRequirement: "",
  deadline: "",
  overview: "",
  modulesTextarea: "",
  careerOutcomesTextarea: "",
  sourceUrl: "",
  approvalStatus: "DRAFT",
  verificationStatus: "VERIFIED",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLinesToArray(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function courseToForm(course: Course): CourseForm {
  let modules: string[] = [];
  let careerOutcomes: string[] = [];
  try {
    modules = course.modules ? JSON.parse(course.modules) : [];
  } catch {
    modules = [];
  }
  try {
    careerOutcomes = course.careerOutcomes ? JSON.parse(course.careerOutcomes) : [];
  } catch {
    careerOutcomes = [];
  }
  return {
    id: course.id,
    name: course.name,
    slug: course.slug,
    description: "",
    level: course.level,
    subject: course.subject,
    duration: course.duration,
    deliveryMode: "On-campus",
    intake: course.intake,
    universitySlug: course.universitySlug,
    countrySlug: course.countrySlug,
    city: course.city,
    tuition: course.tuition,
    currency: "USD",
    applicationFee: "",
    deposit: "",
    scholarship: course.scholarship || "",
    englishRequirement: course.englishRequirement,
    academicRequirement: course.academicRequirement,
    deadline: course.deadline || "",
    overview: course.overview || "",
    modulesTextarea: modules.join("\n"),
    careerOutcomesTextarea: careerOutcomes.join("\n"),
    sourceUrl: course.sourceUrl || "",
    approvalStatus: course.approvalStatus,
    verificationStatus: course.verificationStatus,
  };
}

function buildCreatePayload(form: CourseForm) {
  const modules = parseLinesToArray(form.modulesTextarea);
  const careerOutcomes = parseLinesToArray(form.careerOutcomesTextarea);
  const overview = form.overview || form.description;
  const tuition = form.currency ? `${form.currency} ${form.tuition}`.trim() : form.tuition;
  return {
    name: form.name,
    slug: form.slug,
    universitySlug: form.universitySlug,
    countrySlug: form.countrySlug,
    city: form.city,
    level: form.level,
    subject: form.subject,
    duration: form.duration,
    intake: form.intake,
    tuition,
    scholarship: form.scholarship || null,
    englishRequirement: form.englishRequirement,
    academicRequirement: form.academicRequirement,
    overview,
    modules,
    careerOutcomes,
    deadline: form.deadline || null,
    sourceUrl: form.sourceUrl || null,
    approvalStatus: form.approvalStatus,
  };
}

function buildPatchPayload(form: CourseForm) {
  const modules = parseLinesToArray(form.modulesTextarea);
  const careerOutcomes = parseLinesToArray(form.careerOutcomesTextarea);
  const overview = form.overview || form.description;
  const tuition = form.currency ? `${form.currency} ${form.tuition}`.trim() : form.tuition;
  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    universitySlug: form.universitySlug,
    countrySlug: form.countrySlug,
    city: form.city,
    level: form.level,
    subject: form.subject,
    duration: form.duration,
    intake: form.intake,
    tuition,
    scholarship: form.scholarship || null,
    englishRequirement: form.englishRequirement,
    academicRequirement: form.academicRequirement,
    overview,
    modules: JSON.stringify(modules),
    careerOutcomes: JSON.stringify(careerOutcomes),
    deadline: form.deadline || null,
    sourceUrl: form.sourceUrl || null,
    approvalStatus: form.approvalStatus,
    verificationStatus: form.verificationStatus,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminCourseManagement() {
  const { toast } = useToast();

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [summary, setSummary] = React.useState<AdminSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [universities, setUniversities] = React.useState<University[]>([]);
  const [countries, setCountries] = React.useState<Country[]>([]);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("__all__");
  const [sortBy, setSortBy] = React.useState<"updatedAt" | "name" | "tuition">("updatedAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingForm, setEditingForm] = React.useState<CourseForm>(EMPTY_FORM);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("basic");

  const [deleteTarget, setDeleteTarget] = React.useState<Course | null>(null);
  const [deleteReason, setDeleteReason] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  // ---- Fetch universities + countries (one-time) ----
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [uRes, cRes] = await Promise.all([
          fetch("/api/universities", { cache: "no-store" }),
          fetch("/api/countries", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (uRes.ok) {
          const ud = await uRes.json();
          const list: University[] = (ud.universities || []).map((u: any) => ({
            slug: u.slug,
            name: u.name,
            countrySlug: u.countrySlug,
            country: u.country
              ? { name: u.country.name, shortName: u.country.shortName, flag: u.country.flag }
              : null,
          }));
          setUniversities(list);
        }
        if (cRes.ok) {
          const cd = await cRes.json();
          const list: Country[] = (cd.countries || []).map((c: any) => ({
            slug: c.slug,
            name: c.name,
            shortName: c.shortName,
            flag: c.flag,
          }));
          setCountries(list);
        }
      } catch {
        // Non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Fetch courses (re-fetch on search/status change, debounced) ----
  const fetchCourses = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "__all__") params.set("status", statusFilter);
      const url = `/api/course-finder/admin${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCourses(Array.isArray(data.courses) ? data.courses : []);
      setSummary(data.summary || null);
    } catch (e: any) {
      toast({
        title: "Couldn't load courses",
        description: e?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      fetchCourses();
    }, 250);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  // ---- Derived: sorted courses ----
  const sortedCourses = React.useMemo(() => {
    const arr = [...courses];
    if (sortBy === "name") {
      arr.sort((a, b) =>
        sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
      );
    } else if (sortBy === "tuition") {
      const num = (t: string) => {
        const m = t.replace(/[, ]/g, "").match(/\d+(\.\d+)?/);
        return m ? parseFloat(m[0]) : 0;
      };
      arr.sort((a, b) =>
        sortDir === "asc" ? num(a.tuition) - num(b.tuition) : num(b.tuition) - num(a.tuition),
      );
    } else {
      arr.sort((a, b) => {
        const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return sortDir === "asc" ? da - db : db - da;
      });
    }
    return arr;
  }, [courses, sortBy, sortDir]);

  const toggleSort = (col: "updatedAt" | "name" | "tuition") => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  // ---- Open Add dialog ----
  const openAddDialog = () => {
    setEditingForm({ ...EMPTY_FORM });
    setIsEditMode(false);
    setActiveTab("basic");
    setDialogOpen(true);
  };

  // ---- Open Edit dialog ----
  const openEditDialog = (course: Course) => {
    setEditingForm(courseToForm(course));
    setIsEditMode(true);
    setActiveTab("basic");
    setDialogOpen(true);
  };

  // ---- Submit form (create or update) ----
  const submitForm = async () => {
    const f = editingForm;
    if (!f.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      setActiveTab("basic");
      return;
    }
    if (!f.slug.trim()) {
      toast({ title: "Slug is required", variant: "destructive" });
      setActiveTab("basic");
      return;
    }
    if (!f.universitySlug) {
      toast({ title: "University is required", variant: "destructive" });
      setActiveTab("location");
      return;
    }
    if (!f.countrySlug) {
      toast({ title: "Country is required", variant: "destructive" });
      setActiveTab("location");
      return;
    }
    setSaving(true);
    try {
      if (isEditMode && f.id) {
        const res = await fetch("/api/course-finder/admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPatchPayload(f)),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        toast({
          title: "Course updated",
          description: data.message || `${f.name} saved successfully.`,
        });
      } else {
        const res = await fetch("/api/course-finder/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildCreatePayload(f)),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        toast({
          title: "Course created",
          description: data.message || `${f.name} added successfully.`,
        });
      }
      setDialogOpen(false);
      fetchCourses();
    } catch (e: any) {
      toast({
        title: isEditMode ? "Update failed" : "Create failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ---- Toggle publish / unpublish ----
  const togglePublish = async (course: Course) => {
    const next = course.approvalStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch("/api/course-finder/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: course.id, approvalStatus: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: next === "PUBLISHED" ? "Course published" : "Course unpublished",
        description: `${course.name} is now ${next === "PUBLISHED" ? "live" : "in draft"}.`,
      });
      fetchCourses();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ---- Delete ----
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/course-finder/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Course deleted",
        description: `${deleteTarget.name} has been permanently removed.`,
        variant: "destructive",
      });
      setDeleteTarget(null);
      setDeleteReason("");
      fetchCourses();
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // ---- Navigate to CSV Import Center ----
  const navigateToCsv = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("alo-navigate", { detail: { view: "csv-import-center" as ViewKey } }),
      );
    }
  };

  const sortedUniversities = React.useMemo(() => {
    const filtered = editingForm.countrySlug
      ? universities.filter((u) => u.countrySlug === editingForm.countrySlug)
      : universities;
    return filtered.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [universities, editingForm.countrySlug]);

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 bg-[#f7f9fc]">
      <PageHeader
        title="Course Management"
        subtitle="Add, edit, manage, and publish courses. Full CRUD with audit logging."
        icon="BookOpen"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={navigateToCsv}
              variant="outline"
              className="h-12 border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb]"
            >
              <Icon name="FileSpreadsheet" className="size-4" />
              Import CSV
            </Button>
            <Button
              onClick={openAddDialog}
              className="h-12 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
            >
              <Icon name="Plus" className="size-4" />
              Add Course
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      {summary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Courses" value={summary.total} icon="BookOpen" accent="blue" />
          <StatCard
            label="Published"
            value={summary.published}
            icon="CheckCircle"
            accent="emerald"
            hint="Live on the public site"
          />
          <StatCard
            label="Draft"
            value={summary.draft}
            icon="FileEdit"
            accent="amber"
            hint="Hidden from public"
          />
          <StatCard
            label="Pending Review"
            value={summary.pendingReview}
            icon="ClipboardCheck"
            accent="violet"
            hint="Awaiting approval"
          />
        </div>
      ) : null}

      {/* Toolbar */}
      <SectionCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Icon
                name="Search"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, slug, or subject..."
                className="h-10 pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <Icon name="X" className="size-3.5" />
                </button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 sm:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{sortedCourses.length}</span> of{" "}
            <span className="font-semibold text-foreground">{summary?.total ?? 0}</span> courses
          </p>
        </div>
      </SectionCard>

      {/* Course table */}
      {loading ? (
        <LoadingGrid count={6} />
      ) : sortedCourses.length === 0 ? (
        <EmptyState
          icon="BookX"
          title="No courses found"
          description={
            search || statusFilter !== "__all__"
              ? "Try adjusting your filters or search."
              : "Add your first course to populate the catalog."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={openAddDialog}
                className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
              >
                <Icon name="Plus" className="size-4" />
                Add Course
              </Button>
              {(search || statusFilter !== "__all__") && (
                <Button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("__all__");
                  }}
                  variant="outline"
                  className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb]"
                >
                  <Icon name="RotateCcw" className="size-4" />
                  Clear filters
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <SectionCard>
          <ScrollArea className="max-h-[70vh]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow className="border-b border-[#0057B8]/15">
                  <TableHead className="min-w-[260px]">
                    <SortButton
                      label="Course"
                      active={sortBy === "name"}
                      dir={sortDir}
                      onClick={() => toggleSort("name")}
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px]">University</TableHead>
                  <TableHead className="min-w-[160px]">Level / Subject</TableHead>
                  <TableHead className="min-w-[140px]">
                    <SortButton
                      label="Tuition"
                      active={sortBy === "tuition"}
                      dir={sortDir}
                      onClick={() => toggleSort("tuition")}
                    />
                  </TableHead>
                  <TableHead className="min-w-[140px]">Deadline</TableHead>
                  <TableHead className="min-w-[120px]">Approval</TableHead>
                  <TableHead className="min-w-[120px]">Verification</TableHead>
                  <TableHead className="min-w-[200px] text-right">
                    <SortButton
                      label="Updated"
                      active={sortBy === "updatedAt"}
                      dir={sortDir}
                      onClick={() => toggleSort("updatedAt")}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="min-w-[220px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCourses.map((course) => (
                  <TableRow key={course.id} className="border-b border-[#0057B8]/8 hover:bg-[#f7f9fc]">
                    <TableCell className="align-top">
                      <p className="font-semibold text-foreground">{course.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {course.slug}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="text-sm font-medium text-foreground">{course.university?.name || "—"}</p>
                      {course.country && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {course.country.flag} {course.country.name}
                          {course.city ? ` · ${course.city}` : ""}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1">
                        <Badge className="bg-[#e8f0fb] text-[#0057B8] hover:bg-[#e8f0fb]">
                          {course.level}
                        </Badge>
                        <Badge variant="outline" className="border-[#0057B8]/30 text-[#0057B8]">
                          {course.subject}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm font-semibold text-[#0057B8]">
                      {course.tuition || "—"}
                    </TableCell>
                    <TableCell className="align-top text-xs text-muted-foreground">
                      {course.deadline ? fmtDate(course.deadline) : "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          APPROVAL_COLORS[course.approvalStatus] || "bg-slate-100 text-slate-700",
                        )}
                      >
                        {course.approvalStatus.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          VERIFICATION_COLORS[course.verificationStatus] || "bg-slate-100 text-slate-700",
                        )}
                      >
                        {course.verificationStatus.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="align-top text-right text-xs text-muted-foreground">
                      {course.updatedAt ? fmtDate(course.updatedAt) : "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          onClick={() => openEditDialog(course)}
                          variant="outline"
                          size="sm"
                          className="h-8 border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb]"
                        >
                          <Icon name="Pencil" className="size-3.5" />
                          Edit
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => togglePublish(course)}
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8",
                                  course.approvalStatus === "PUBLISHED"
                                    ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                                )}
                              >
                                <Icon
                                  name={course.approvalStatus === "PUBLISHED" ? "EyeOff" : "Eye"}
                                  className="size-3.5"
                                />
                                {course.approvalStatus === "PUBLISHED" ? "Unpublish" : "Publish"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {course.approvalStatus === "PUBLISHED"
                                ? "Move to draft (hide from public)"
                                : "Publish this course immediately"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          onClick={() => {
                            setDeleteTarget(course);
                            setDeleteReason("");
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          <Icon name="Trash2" className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </SectionCard>
      )}

      {/* Audit note */}
      <Card className="rounded-2xl border-2 border-[#0057B8]/15 bg-[#e8f0fb]/40">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
            <Icon name="ShieldCheck" className="size-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-foreground">All changes are audit-logged.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every create, update, publish/unpublish, and delete action is recorded in the{" "}
              <span className="font-medium">AuditLog</span> table with actor, timestamp, and
              affected resource. Verification status updates re-stamp the{" "}
              <span className="font-mono">lastVerifiedAt</span> timestamp automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-0">
          <DialogHeader className="border-b border-[#0057B8]/10 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
              <Icon name={isEditMode ? "Pencil" : "PlusCircle"} className="size-5" />
              {isEditMode ? "Edit Course" : "Add New Course"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEditMode
                ? "Update course information. All changes are audit-logged."
                : "Create a new course entry. Slug must be unique. Defaults to DRAFT status."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
              <div className="border-b border-[#0057B8]/10 bg-[#f7f9fc] px-3">
                <ScrollArea className="w-full">
                  <TabsList className="h-auto justify-start bg-transparent p-2">
                    <TabsTrigger value="basic" className="data-[state=active]:bg-white">
                      <Icon name="Info" className="mr-1.5 size-3.5" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="location" className="data-[state=active]:bg-white">
                      <Icon name="MapPin" className="mr-1.5 size-3.5" />
                      University & Location
                    </TabsTrigger>
                    <TabsTrigger value="fees" className="data-[state=active]:bg-white">
                      <Icon name="CreditCard" className="mr-1.5 size-3.5" />
                      Tuition & Fees
                    </TabsTrigger>
                    <TabsTrigger value="requirements" className="data-[state=active]:bg-white">
                      <Icon name="ClipboardCheck" className="mr-1.5 size-3.5" />
                      Requirements
                    </TabsTrigger>
                    <TabsTrigger value="content" className="data-[state=active]:bg-white">
                      <Icon name="FileText" className="mr-1.5 size-3.5" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="data-[state=active]:bg-white">
                      <Icon name="Globe" className="mr-1.5 size-3.5" />
                      SEO & Visibility
                    </TabsTrigger>
                  </TabsList>
                </ScrollArea>
              </div>

              <ScrollArea className="max-h-[55vh]">
                <div className="p-5">
                  <TabsContent value="basic" className="mt-0 space-y-4">
                    <FormField
                      label="Course name *"
                      value={editingForm.name}
                      onChange={(v) =>
                        setEditingForm((prev) => ({
                          ...prev,
                          name: v,
                          slug: prev.slug || slugify(v),
                        }))
                      }
                      placeholder="e.g. MSc Computer Science"
                    />
                    <FormField
                      label="Slug *"
                      value={editingForm.slug}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, slug: slugify(v) }))}
                      placeholder="msc-computer-science"
                      mono
                      hint="Lowercase, kebab-case. Used in the URL: /courses/{slug}"
                    />
                    <FormTextarea
                      label="Short description"
                      value={editingForm.description}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, description: v }))}
                      placeholder="One-sentence summary used in cards and search results."
                      rows={2}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormSelectField
                        label="Study level *"
                        value={editingForm.level}
                        onValueChange={(v) => setEditingForm((prev) => ({ ...prev, level: v }))}
                        options={LEVEL_OPTIONS}
                      />
                      <FormSelectField
                        label="Subject *"
                        value={editingForm.subject}
                        onValueChange={(v) => setEditingForm((prev) => ({ ...prev, subject: v }))}
                        options={SUBJECT_OPTIONS}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        label="Duration"
                        value={editingForm.duration}
                        onChange={(v) => setEditingForm((prev) => ({ ...prev, duration: v }))}
                        placeholder="e.g. 1 year full-time"
                      />
                      <FormSelectField
                        label="Delivery mode"
                        value={editingForm.deliveryMode}
                        onValueChange={(v) => setEditingForm((prev) => ({ ...prev, deliveryMode: v }))}
                        options={DELIVERY_MODES}
                      />
                    </div>
                    <FormField
                      label="Intake"
                      value={editingForm.intake}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, intake: v }))}
                      placeholder="e.g. September, January"
                    />
                  </TabsContent>

                  <TabsContent value="location" className="mt-0 space-y-4">
                    <FormSelectField
                      label="Country *"
                      value={editingForm.countrySlug}
                      onValueChange={(v) =>
                        setEditingForm((prev) => ({
                          ...prev,
                          countrySlug: v,
                          universitySlug: "",
                          city: "",
                        }))
                      }
                      placeholder="Select a country"
                      options={countries.map((c) => ({
                        value: c.slug,
                        label: `${c.flag} ${c.name}`.trim(),
                      }))}
                    />
                    <FormSelectField
                      label="University *"
                      value={editingForm.universitySlug}
                      onValueChange={(v) => {
                        const u = universities.find((x) => x.slug === v);
                        setEditingForm((prev) => ({
                          ...prev,
                          universitySlug: v,
                          city: u && !prev.city ? "" : prev.city,
                        }));
                      }}
                      placeholder={
                        editingForm.countrySlug
                          ? "Select a university"
                          : "Select a country first"
                      }
                      options={sortedUniversities.map((u) => ({
                        value: u.slug,
                        label: u.country ? `${u.name} (${u.country.shortName})` : u.name,
                      }))}
                      disabled={sortedUniversities.length === 0}
                    />
                    {editingForm.countrySlug && sortedUniversities.length === 0 && (
                      <p className="text-xs text-amber-600">
                        <Icon name="Info" className="mr-1 inline size-3" />
                        No published universities for this country. Add universities first via CSV
                        import.
                      </p>
                    )}
                    <FormField
                      label="City *"
                      value={editingForm.city}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, city: v }))}
                      placeholder="e.g. Manchester"
                    />
                  </TabsContent>

                  <TabsContent value="fees" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <FormField
                          label="Tuition fee *"
                          value={editingForm.tuition}
                          onChange={(v) => setEditingForm((prev) => ({ ...prev, tuition: v }))}
                          placeholder="e.g. 28,500"
                          hint="Numeric amount only. Currency is prefixed automatically."
                        />
                      </div>
                      <FormField
                        label="Currency"
                        value={editingForm.currency}
                        onChange={(v) => setEditingForm((prev) => ({ ...prev, currency: v }))}
                        placeholder="USD"
                        hint="ISO 4217 code"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        label="Application fee"
                        value={editingForm.applicationFee}
                        onChange={(v) => setEditingForm((prev) => ({ ...prev, applicationFee: v }))}
                        placeholder="e.g. 50 USD"
                        hint="Optional — for display only"
                      />
                      <FormField
                        label="Deposit"
                        value={editingForm.deposit}
                        onChange={(v) => setEditingForm((prev) => ({ ...prev, deposit: v }))}
                        placeholder="e.g. 2,000 USD"
                        hint="Optional — for display only"
                      />
                    </div>
                    <FormTextarea
                      label="Scholarship"
                      value={editingForm.scholarship}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, scholarship: v }))}
                      placeholder="e.g. Up to 25% merit scholarship available for international students"
                      rows={2}
                    />
                  </TabsContent>

                  <TabsContent value="requirements" className="mt-0 space-y-4">
                    <FormTextarea
                      label="English requirement"
                      value={editingForm.englishRequirement}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, englishRequirement: v }))}
                      placeholder="e.g. IELTS 6.5 overall (no band below 6.0) or equivalent PTE / TOEFL score"
                      rows={2}
                    />
                    <FormTextarea
                      label="Academic requirement"
                      value={editingForm.academicRequirement}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, academicRequirement: v }))}
                      placeholder="e.g. A recognised Bachelor's degree with a minimum 2:1 (GPA 3.0/4.0) in a related discipline"
                      rows={3}
                    />
                    <FormField
                      label="Application deadline"
                      value={editingForm.deadline}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, deadline: v }))}
                      placeholder="e.g. June 2025 (September intake)"
                      hint="Free-text format. Include the month/year and intake reference."
                    />
                  </TabsContent>

                  <TabsContent value="content" className="mt-0 space-y-4">
                    <FormTextarea
                      label="Overview"
                      value={editingForm.overview}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, overview: v }))}
                      placeholder="Full ALO-original course description — what students will study, who teaches it, what makes this programme distinctive."
                      rows={5}
                    />
                    <FormTextarea
                      label="Modules (one per line)"
                      value={editingForm.modulesTextarea}
                      onChange={(v) =>
                        setEditingForm((prev) => ({ ...prev, modulesTextarea: v }))
                      }
                      placeholder={"e.g.\nSoftware Engineering Principles\nMachine Learning Foundations\nDistributed Systems\nResearch Methods"}
                      rows={6}
                      hint="Each line becomes one module entry. Empty lines are ignored."
                    />
                    <FormTextarea
                      label="Career outcomes (one per line)"
                      value={editingForm.careerOutcomesTextarea}
                      onChange={(v) =>
                        setEditingForm((prev) => ({ ...prev, careerOutcomesTextarea: v }))
                      }
                      placeholder={"e.g.\nSoftware Engineer\nData Scientist\nTechnical Lead\nProduct Manager"}
                      rows={5}
                      hint="Each line becomes one career outcome entry."
                    />
                  </TabsContent>

                  <TabsContent value="seo" className="mt-0 space-y-4">
                    <FormField
                      label="Source URL"
                      value={editingForm.sourceUrl}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, sourceUrl: v }))}
                      placeholder="https://www.university.edu/programme/msc-computer-science"
                      hint="Official programme page URL. Used for verification and citation."
                      mono
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormSelectField
                        label="Approval status"
                        value={editingForm.approvalStatus}
                        onValueChange={(v) =>
                          setEditingForm((prev) => ({ ...prev, approvalStatus: v }))
                        }
                        options={[
                          { value: "DRAFT", label: "Draft (hidden)" },
                          { value: "PENDING_REVIEW", label: "Pending Review" },
                          { value: "PUBLISHED", label: "Published (live)" },
                        ]}
                      />
                      <FormSelectField
                        label="Verification status"
                        value={editingForm.verificationStatus}
                        onValueChange={(v) =>
                          setEditingForm((prev) => ({ ...prev, verificationStatus: v }))
                        }
                        options={[
                          { value: "VERIFIED", label: "Verified" },
                          { value: "NEEDS_REVIEW", label: "Needs Review" },
                          { value: "UNVERIFIED", label: "Unverified" },
                        ]}
                      />
                    </div>
                    <Card className="rounded-xl border border-[#0057B8]/15 bg-[#e8f0fb]/40">
                      <CardContent className="p-3">
                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
                          <span>
                            On save, <span className="font-mono">lastVerifiedAt</span> is
                            re-stamped automatically. Approval changes are audit-logged with actor
                            and timestamp.
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>

          <DialogFooter className="border-t border-[#0057B8]/10 bg-[#f7f9fc] px-5 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {isEditMode ? "Editing" : "Creating"}:{" "}
                <span className="font-mono text-foreground">{editingForm.slug || "—"}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setDialogOpen(false)}
                  variant="ghost"
                  className="h-10"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitForm}
                  className="h-10 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Icon name="Loader2" className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="Save" className="size-4" />
                      {isEditMode ? "Save changes" : "Create course"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null);
            setDeleteReason("");
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <Icon name="AlertTriangle" className="size-5" />
              Delete course?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone. The course{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span> and all
              its content will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              Reason for deletion (audit log)
            </Label>
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Duplicate course, replaced by newer version, incorrect data..."
              rows={3}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="h-10 bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleting ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Icon name="Trash2" className="size-4" />
                  Delete permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable column header button
// ---------------------------------------------------------------------------

function SortButton({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-colors hover:text-[#0057B8]",
        align === "right" ? "ml-auto" : "",
        active ? "text-[#0057B8]" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon
        name={active ? (dir === "asc" ? "ChevronUp" : "ChevronDown") : "ChevronsUpDown"}
        className="size-3"
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Form field helpers
// ---------------------------------------------------------------------------

function FormField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("mt-1 h-10", mono && "font-mono")}
      />
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1"
      />
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FormSelectField({
  label,
  value,
  onValueChange,
  placeholder = "Select...",
  options,
  disabled,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  options: string[] | { value: string; label: string }[];
  disabled?: boolean;
}) {
  const normalized: { value: string; label: string }[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onValueChange(v === "__none__" ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger className="mt-1 h-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{placeholder}</SelectItem>
          {normalized.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
