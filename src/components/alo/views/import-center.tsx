"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Icon,
  PageHeader,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ContentType = "country" | "university" | "course" | "exam" | "scholarship";
type ApprovalAction = "approve" | "reject" | "publish";

interface PendingItem {
  slug: string;
  name: string;
  approvalStatus: string; // DRAFT | PENDING_REVIEW | PUBLISHED
  verificationStatus: string; // VERIFIED | NEEDS_REVIEW | UNVERIFIED
  updatedAt: string;
}

interface ImportCenterResponse {
  pending: {
    countries: PendingItem[];
    universities: PendingItem[];
    courses: PendingItem[];
    exams: PendingItem[];
  };
  summary: {
    totalPending: number;
    published: {
      countries: number;
      universities: number;
      courses: number;
      exams: number;
    };
  };
}

interface PatchResponse {
  item: PendingItem;
  message: string;
}

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string | null; role: string } | null;
}

interface PublishedCountry {
  slug: string;
  name: string;
  shortName?: string | null;
  flag?: string | null;
  capital?: string | null;
  lastVerifiedAt: string | null;
  verificationStatus: string;
  sourceUrl?: string | null;
}

interface PublishedUniversity {
  slug: string;
  name: string;
  city?: string | null;
  country?: { name: string; shortName?: string | null; flag?: string | null } | null;
  lastVerifiedAt: string | null;
  verificationStatus: string;
}

interface PublishedCourse {
  slug: string;
  name: string;
  level?: string | null;
  subject?: string | null;
  university?: { name: string; city?: string | null } | null;
  country?: { name: string; flag?: string | null } | null;
  lastVerifiedAt: string | null;
  verificationStatus: string;
}

interface PublishedExam {
  slug: string;
  name: string;
  fullName?: string | null;
  lastVerifiedAt: string | null;
  verificationStatus: string;
}

// -----------------------------------------------------------------------------
// Constants — color maps, icons, labels
// -----------------------------------------------------------------------------

const APPROVAL_COLORS: Record<string, string> = {
  DRAFT: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
};

const APPROVAL_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  PUBLISHED: "Published",
};

const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  NEEDS_REVIEW: "bg-amber-100 text-amber-700",
  UNVERIFIED: "bg-rose-100 text-rose-700",
};

const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: "Verified",
  NEEDS_REVIEW: "Needs Review",
  UNVERIFIED: "Unverified",
};

const TYPE_BADGE: Record<string, string> = {
  country: "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]",
  university: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]",
  course: "bg-violet-100 text-violet-700",
  exam: "bg-emerald-100 text-emerald-700",
  scholarship: "bg-rose-100 text-rose-700",
};

const TYPE_LABEL: Record<string, string> = {
  country: "Country",
  university: "University",
  course: "Course",
  exam: "Exam",
  scholarship: "Scholarship",
};

const TYPE_ICON: Record<string, string> = {
  country: "Globe",
  university: "Building2",
  course: "BookOpen",
  exam: "GraduationCap",
  scholarship: "Award",
};

const DEMO_USER_ID = "admin-demo";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function parseAuditDetails(raw: string | null): { action?: string; status?: string } {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as { action?: string; status?: string };
  } catch {
    return {};
  }
}

// -----------------------------------------------------------------------------
// Pending item card
// -----------------------------------------------------------------------------

function PendingItemCard({
  item,
  type,
  onAction,
  acting,
}: {
  item: PendingItem;
  type: ContentType;
  onAction: (type: ContentType, slug: string, action: ApprovalAction) => void;
  acting: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-white p-4 transition-colors hover:border-[var(--alo-brand)]/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                TYPE_BADGE[type],
              )}
            >
              <Icon name={TYPE_ICON[type]} className="size-3" />
              {TYPE_LABEL[type]}
            </span>
            <h4 className="truncate text-sm font-semibold text-foreground">{item.name}</h4>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.slug}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">Approval:</span>
            <Badge
              variant="secondary"
              className={cn("rounded-full px-2 py-0 text-[11px] font-semibold", APPROVAL_COLORS[item.approvalStatus])}
            >
              {APPROVAL_LABELS[item.approvalStatus] || item.approvalStatus}
            </Badge>
            <span className="text-muted-foreground">Verification:</span>
            <Badge
              variant="secondary"
              className={cn("rounded-full px-2 py-0 text-[11px] font-semibold", VERIFICATION_COLORS[item.verificationStatus])}
            >
              {VERIFICATION_LABELS[item.verificationStatus] || item.verificationStatus}
            </Badge>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Last updated {fmtDate(item.updatedAt)} · {timeAgo(item.updatedAt)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
 size="sm"
 variant="outline"
 className=" border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 disabled={acting}
 onClick={() =>
            // informational only — surfaces a toast via parent's onAction with a custom action handled below.
            onAction(type, item.slug, "review" as ApprovalAction)
          }
        >
          <Icon name="Eye" className="size-4" />
          Review
        </Button>
        <Button
 size="sm"
 className=" bg-emerald-600 text-white hover:bg-emerald-700"
 disabled={acting}
 onClick={() => onAction(type, item.slug, "publish")}
        >
          <Icon name="CheckCircle2" className="size-4" />
          Approve &amp; Publish
        </Button>
        <Button
 size="sm"
 variant="outline"
 className=" border-rose-300 text-rose-600 hover:bg-rose-50"
 disabled={acting}
 onClick={() => onAction(type, item.slug, "reject")}
        >
          <Icon name="XCircle" className="size-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Published content table section (per type)
// -----------------------------------------------------------------------------

function PublishedSection({
  title,
  icon,
  count,
  accent = "blue",
  children,
}: {
  title: string;
  icon: string;
  count: number;
  accent?: "blue" | "orange" | "violet" | "emerald";
  children: React.ReactNode;
}) {
  const accentBg: Record<string, string> = {
    blue: "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]",
    orange: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]",
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <SectionCard
      title={title}
      icon={icon}
      action={
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", accentBg[accent])}>
          <Icon name="CheckCircle2" className="size-3" />
          {count} published
        </span>
      }
    >
      {children}
    </SectionCard>
  );
}

// -----------------------------------------------------------------------------
// Workflow stage card (for Approval Workflow tab)
// -----------------------------------------------------------------------------

function WorkflowStage({
  index,
  title,
  description,
  icon,
  accent,
}: {
  index: number;
  title: string;
  description: string;
  icon: string;
  accent: "slate" | "amber" | "emerald";
}) {
  const accentMap: Record<string, { ring: string; chip: string; num: string }> = {
    slate: { ring: "border-[var(--alo-border-strong)]", chip: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]", num: "bg-slate-200 text-[var(--alo-body)]" },
    amber: { ring: "border-amber-300", chip: "bg-amber-100 text-amber-700", num: "bg-amber-500 text-white" },
    emerald: { ring: "border-emerald-300", chip: "bg-emerald-100 text-emerald-700", num: "bg-emerald-600 text-white" },
  };
  const a = accentMap[accent];
  return (
    <div className={cn("flex-1 rounded-2xl border-2 bg-white p-5", a.ring)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-xl text-sm font-bold", a.num)}>{index}</div>
        <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", a.chip)}>
          <Icon name={icon} className="size-3.5" />
          {title}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function ImportCenter() {
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<ImportCenterResponse | null>(null);

  const [actingSlug, setActingSlug] = React.useState<string | null>(null);

  // published content (lazy)
  const [pubLoading, setPubLoading] = React.useState(false);
  const [pubFetched, setPubFetched] = React.useState(false);
  const [countries, setCountries] = React.useState<PublishedCountry[]>([]);
  const [universities, setUniversities] = React.useState<PublishedUniversity[]>([]);
  const [courses, setCourses] = React.useState<PublishedCourse[]>([]);
  const [exams, setExams] = React.useState<PublishedExam[]>([]);

  // audit logs (lazy)
  const [auditLoading, setAuditLoading] = React.useState(false);
  const [auditFetched, setAuditFetched] = React.useState(false);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);

  // import form
  const [importType, setImportType] = React.useState<ContentType>("course");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [dataFormat, setDataFormat] = React.useState("JSON");
  const [pasteData, setPasteData] = React.useState("");
  const [importing, setImporting] = React.useState(false);

  // --- fetchers -------------------------------------------------------------

  const fetchMain = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/import-center", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load import center data");
      const json = (await res.json()) as ImportCenterResponse;
      setData(json);
    } catch (err) {
      toast({
        title: "Failed to load import center",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPublished = React.useCallback(async () => {
    if (pubFetched) return;
    setPubLoading(true);
    try {
      const [c, u, co, e] = await Promise.all([
        fetch("/api/countries", { cache: "no-store" }).then((r) => r.json() as Promise<{ countries: PublishedCountry[] }>),
        fetch("/api/universities", { cache: "no-store" }).then((r) => r.json() as Promise<{ universities: PublishedUniversity[] }>),
        fetch("/api/courses", { cache: "no-store" }).then((r) => r.json() as Promise<{ courses: PublishedCourse[] }>),
        fetch("/api/exams", { cache: "no-store" }).then((r) => r.json() as Promise<{ exams: PublishedExam[] }>),
      ]);
      setCountries(Array.isArray(c?.countries) ? c.countries : []);
      setUniversities(Array.isArray(u?.universities) ? u.universities : []);
      setCourses(Array.isArray(co?.courses) ? co.courses : []);
      setExams(Array.isArray(e?.exams) ? e.exams : []);
      setPubFetched(true);
    } catch (err) {
      toast({
        title: "Failed to load published content",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setPubLoading(false);
    }
  }, [pubFetched, toast]);

  const fetchAudit = React.useCallback(async () => {
    if (auditFetched) return;
    setAuditLoading(true);
    try {
      const res = await fetch("/api/audit?take=200", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load audit trail");
      const json = (await res.json()) as { logs: AuditLog[] };
      const filtered = (Array.isArray(json?.logs) ? json.logs : []).filter(
        (l) => l.action === "PUBLIC_PUBLISH",
      );
      setAuditLogs(filtered);
      setAuditFetched(true);
    } catch (err) {
      toast({
        title: "Failed to load audit trail",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAuditLoading(false);
    }
  }, [auditFetched, toast]);

  React.useEffect(() => {
    fetchMain();
  }, [fetchMain]);

  // --- actions --------------------------------------------------------------

  const handlePendingAction = React.useCallback(
    async (type: ContentType, slug: string, action: ApprovalAction) => {
      // "review" is informational only — handled locally
      if (action === ("review" as ApprovalAction)) {
        toast({
          title: "Review opened",
          description: `${TYPE_LABEL[type]} "${slug}" — full source data preview available in the audit trail.`,
        });
        return;
      }
      setActingSlug(`${type}:${slug}`);
      try {
        const res = await fetch("/api/import-center", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, slug, action, userId: DEMO_USER_ID }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as PatchResponse;
        toast({
          title: action === "publish" ? "Published successfully" : "Sent back to draft",
          description: json.message,
          variant: action === "publish" ? "default" : "destructive",
        });
        await fetchMain();
      } catch (err) {
        toast({
          title: "Action failed",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setActingSlug(null);
      }
    },
    [fetchMain, toast],
  );

  const handleUnpublish = React.useCallback(
    async (type: ContentType, slug: string) => {
      setActingSlug(`${type}:${slug}`);
      try {
        const res = await fetch("/api/import-center", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, slug, action: "reject", userId: DEMO_USER_ID }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        toast({
          title: "Unpublished",
          description: `"${slug}" sent back to draft. No longer visible on public website.`,
          variant: "destructive",
        });
        await Promise.all([fetchMain(), fetchPublished()]);
      } catch (err) {
        toast({
          title: "Unpublish failed",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setActingSlug(null);
      }
    },
    [fetchMain, fetchPublished, toast],
  );

  const handleParsePreview = React.useCallback(() => {
    if (!pasteData.trim()) {
      toast({
        title: "Nothing to parse",
        description: "Paste JSON or CSV data first.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Parsing data…",
      description: `Preview of ${pasteData.split("\n").length} lines will appear below.`,
    });
  }, [pasteData, toast]);

  const handleImportDraft = React.useCallback(() => {
    if (!sourceUrl.trim()) {
      toast({
        title: "Source URL required",
        description: "Public data must include a verifiable source URL.",
        variant: "destructive",
      });
      return;
    }
    setImporting(true);
    // simulate async import
    window.setTimeout(() => {
      setImporting(false);
      toast({
        title: "Imported as DRAFT",
        description: `${TYPE_LABEL[importType]} from ${sourceUrl} is now awaiting review before publishing.`,
      });
      setPasteData("");
      setSourceUrl("");
    }, 700);
  }, [importType, sourceUrl, toast]);

  // --- derived --------------------------------------------------------------

  const pendingGroups: { type: ContentType; items: PendingItem[] }[] = React.useMemo(() => {
    if (!data) return [];
    return [
      { type: "country", items: data.pending.countries },
      { type: "university", items: data.pending.universities },
      { type: "course", items: data.pending.courses },
      { type: "exam", items: data.pending.exams },
    ].filter((g) => g.items.length > 0) as { type: ContentType; items: PendingItem[] }[];
  }, [data]);

  const totalPending = data?.summary.totalPending ?? 0;
  const published = data?.summary.published;

  // --- render ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Import Center & Public Data Approval"
          subtitle="Import courses, universities, and scholarships. Approve public data before publishing."
          icon="Download"
        />
        <LoadingGrid count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Center & Public Data Approval"
        subtitle="Import courses, universities, and scholarships. Approve public data before publishing."
        icon="Download"
        action={
          <Button
 variant="outline"
 className=" border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={fetchMain}
 >
            <Icon name="RefreshCw" className="size-4" />
            Refresh
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Published Countries"
          value={published?.countries ?? 0}
          icon="Globe"
          accent="blue"
          hint="Live on public website"
        />
        <StatCard
          label="Published Universities"
          value={published?.universities ?? 0}
          icon="Building2"
          accent="orange"
          hint="Live on public website"
        />
        <StatCard
          label="Published Courses"
          value={published?.courses ?? 0}
          icon="BookOpen"
          accent="violet"
          hint="Live on public website"
        />
        <StatCard
          label="Published Exams"
          value={published?.exams ?? 0}
          icon="GraduationCap"
          accent="emerald"
          hint="Live on public website"
        />
        <StatCard
          label="Pending Approvals"
          value={totalPending}
          icon="Clock"
          accent="amber"
          hint="Awaiting review"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-5" onValueChange={(v) => {
        if (v === "published") fetchPublished();
        if (v === "workflow") fetchAudit();
      }}>
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="flex w-max">
            <TabsTrigger value="pending" className="gap-1.5">
              <Icon name="Clock" className="size-4" />
              Pending Approvals
              {totalPending > 0 && (
                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">
                  {totalPending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-1.5">
              <Icon name="CheckCircle2" className="size-4" />
              Published Content
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-1.5">
              <Icon name="Upload" className="size-4" />
              Import New Data
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-1.5">
              <Icon name="GitBranch" className="size-4" />
              Approval Workflow
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* ---- Pending Approvals tab ---- */}
        <TabsContent value="pending" className="space-y-5">
          {pendingGroups.length === 0 ? (
            <EmptyState
              icon="CheckCircle2"
              title="No items pending approval"
              description="All content is published. New imports will appear here for review before going live."
            />
          ) : (
            pendingGroups.map((group) => (
              <SectionCard
                key={group.type}
                title={`${TYPE_LABEL[group.type]} — ${group.items.length} pending`}
                icon={TYPE_ICON[group.type]}
                description={`Awaiting approval before publishing to the public website.`}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {group.items.map((item) => (
                    <PendingItemCard
                      key={`${group.type}:${item.slug}`}
                      item={item}
                      type={group.type}
                      onAction={handlePendingAction}
                      acting={actingSlug === `${group.type}:${item.slug}`}
                    />
                  ))}
                </div>
              </SectionCard>
            ))
          )}
        </TabsContent>

        {/* ---- Published Content tab ---- */}
        <TabsContent value="published" className="space-y-5">
          {pubLoading ? (
            <LoadingGrid count={4} />
          ) : (
            <>
              <PublishedSection
                title="Published Countries"
                icon="Globe"
                count={countries.length}
                accent="blue"
              >
                {countries.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No published countries.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Capital</TableHead>
                          <TableHead>Verification</TableHead>
                          <TableHead>Last Verified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {countries.map((c) => (
                          <TableRow key={c.slug}>
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                {c.flag && <span>{c.flag}</span>}
                                {c.name}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                            <TableCell>{c.capital || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn("rounded-full text-[11px]", VERIFICATION_COLORS[c.verificationStatus])}
                              >
                                {VERIFICATION_LABELS[c.verificationStatus] || c.verificationStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDate(c.lastVerifiedAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
 size="sm"
 variant="ghost"
 className=" text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={() =>
                                    toast({
                                      title: "View public page",
                                      description: `Opening /destinations/${c.slug} in the public site…`,
                                    })
                                  }
                                >
                                  <Icon name="ExternalLink" className="size-3.5" />
                                  View Page
                                </Button>
                                <Button
 size="sm"
 variant="outline"
 className=" border-rose-300 text-rose-600 hover:bg-rose-50"
 disabled={actingSlug === `country:${c.slug}`}
 onClick={() => handleUnpublish("country", c.slug)}
                                >
                                  <Icon name="EyeOff" className="size-3.5" />
                                  Unpublish
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </PublishedSection>

              <PublishedSection
                title="Published Universities"
                icon="Building2"
                count={universities.length}
                accent="orange"
              >
                {universities.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No published universities.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Verification</TableHead>
                          <TableHead>Last Verified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {universities.map((u) => (
                          <TableRow key={u.slug}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1.5">
                                {u.country?.flag && <span>{u.country.flag}</span>}
                                {u.country?.name || "—"}
                              </span>
                            </TableCell>
                            <TableCell>{u.city || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn("rounded-full text-[11px]", VERIFICATION_COLORS[u.verificationStatus])}
                              >
                                {VERIFICATION_LABELS[u.verificationStatus] || u.verificationStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDate(u.lastVerifiedAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
 size="sm"
 variant="ghost"
 className=" text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={() =>
                                    toast({
                                      title: "View public page",
                                      description: `Opening /universities/${u.slug} in the public site…`,
                                    })
                                  }
                                >
                                  <Icon name="ExternalLink" className="size-3.5" />
                                  View Page
                                </Button>
                                <Button
 size="sm"
 variant="outline"
 className=" border-rose-300 text-rose-600 hover:bg-rose-50"
 disabled={actingSlug === `university:${u.slug}`}
 onClick={() => handleUnpublish("university", u.slug)}
                                >
                                  <Icon name="EyeOff" className="size-3.5" />
                                  Unpublish
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </PublishedSection>

              <PublishedSection
                title="Published Courses"
                icon="BookOpen"
                count={courses.length}
                accent="violet"
              >
                {courses.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No published courses.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>University</TableHead>
                          <TableHead>Verification</TableHead>
                          <TableHead>Last Verified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.slice(0, 50).map((c) => (
                          <TableRow key={c.slug}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>
                              {c.level && (
                                <Badge variant="secondary" className="rounded-full bg-violet-100 text-violet-700 text-[11px]">
                                  {c.level}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{c.university?.name || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn("rounded-full text-[11px]", VERIFICATION_COLORS[c.verificationStatus])}
                              >
                                {VERIFICATION_LABELS[c.verificationStatus] || c.verificationStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDate(c.lastVerifiedAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
 size="sm"
 variant="ghost"
 className=" text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={() =>
                                    toast({
                                      title: "View public page",
                                      description: `Opening /courses/${c.slug} in the public site…`,
                                    })
                                  }
                                >
                                  <Icon name="ExternalLink" className="size-3.5" />
                                  View Page
                                </Button>
                                <Button
 size="sm"
 variant="outline"
 className=" border-rose-300 text-rose-600 hover:bg-rose-50"
 disabled={actingSlug === `course:${c.slug}`}
 onClick={() => handleUnpublish("course", c.slug)}
                                >
                                  <Icon name="EyeOff" className="size-3.5" />
                                  Unpublish
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {courses.length > 50 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing first 50 of {courses.length} published courses.
                  </p>
                )}
              </PublishedSection>

              <PublishedSection
                title="Published Exams"
                icon="GraduationCap"
                count={exams.length}
                accent="emerald"
              >
                {exams.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No published exams.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Verification</TableHead>
                          <TableHead>Last Verified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exams.map((e) => (
                          <TableRow key={e.slug}>
                            <TableCell className="font-medium">{e.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{e.fullName || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn("rounded-full text-[11px]", VERIFICATION_COLORS[e.verificationStatus])}
                              >
                                {VERIFICATION_LABELS[e.verificationStatus] || e.verificationStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDate(e.lastVerifiedAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
 size="sm"
 variant="ghost"
 className=" text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={() =>
                                    toast({
                                      title: "View public page",
                                      description: `Opening /exams/${e.slug} in the public site…`,
                                    })
                                  }
                                >
                                  <Icon name="ExternalLink" className="size-3.5" />
                                  View Page
                                </Button>
                                <Button
 size="sm"
 variant="outline"
 className=" border-rose-300 text-rose-600 hover:bg-rose-50"
 disabled={actingSlug === `exam:${e.slug}`}
 onClick={() => handleUnpublish("exam", e.slug)}
                                >
                                  <Icon name="EyeOff" className="size-3.5" />
                                  Unpublish
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </PublishedSection>
            </>
          )}
        </TabsContent>

        {/* ---- Import New Data tab ---- */}
        <TabsContent value="import" className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionCard
                title="Import new data"
                icon="Upload"
                description="Pull course, university, exam or scholarship data from external sources."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data type</Label>
                      <Select value={importType} onValueChange={(v) => setImportType(v as ContentType)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="country">Country</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="course">Course</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="scholarship">Scholarship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data format</Label>
                      <Select value={dataFormat} onValueChange={setDataFormat}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JSON">JSON</SelectItem>
                          <SelectItem value="CSV">CSV</SelectItem>
                          <SelectItem value="Manual">Manual Entry</SelectItem>
                          <SelectItem value="API Sync">API Sync</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Source URL <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://www.gov.uk/government/publications/..."
                      className="h-11"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Required for public data. Must point to an authoritative source.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Paste data ({dataFormat})</Label>
                    <Textarea
                      value={pasteData}
                      onChange={(e) => setPasteData(e.target.value)}
                      placeholder={
                        dataFormat === "JSON"
                          ? '{\n  "name": "MSc Computer Science",\n  "tuitionFee": 25000,\n  "duration": "1 year"\n}'
                          : dataFormat === "CSV"
                            ? "name,tuitionFee,duration\nMSc Computer Science,25000,1 year"
                            : "Enter data manually — each line will be parsed as a field."
                      }
                      className="min-h-[180px] font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="h-12 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                      onClick={handleParsePreview}
                    >
                      <Icon name="FileSearch" className="size-4" />
                      Parse &amp; Preview
                    </Button>
                    <Button
                      className="h-12 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
                      disabled={importing}
                      onClick={handleImportDraft}
                    >
                      {importing ? (
                        <Icon name="Loader2" className="size-4 animate-spin" />
                      ) : (
                        <Icon name="Upload" className="size-4" />
                      )}
                      Import as Draft
                    </Button>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-4">
              <SectionCard title="Approval workflow" icon="GitBranch">
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Imported data goes through the approval workflow:
                  </p>
                  <ol className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-[var(--alo-body)]">1</span>
                      <span><span className="font-semibold text-foreground">Draft</span> — newly imported or edited data, not visible publicly.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">2</span>
                      <span><span className="font-semibold text-foreground">Pending Review</span> — submitted for admin review.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">3</span>
                      <span><span className="font-semibold text-foreground">Published</span> — approved and live on the public website.</span>
                    </li>
                  </ol>
                  <p className="text-[11px] text-muted-foreground">
                    All changes are audit-logged. Source URL and last verified date are required for public data.
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Data sources" icon="Database">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Data can be imported from:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                      <span>Official university websites</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                      <span>Government immigration sites</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                      <span>Partner APIs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                      <span>Manual entry</span>
                    </li>
                  </ul>
                  <p className="mt-2 text-[11px] text-amber-600">
                    All imported data must be verified before publishing.
                  </p>
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        {/* ---- Approval Workflow tab ---- */}
        <TabsContent value="workflow" className="space-y-5">
          {/* Workflow diagram */}
          <SectionCard
            title="Approval workflow"
            icon="GitBranch"
            description="Three-stage approval pipeline for all public-facing data."
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <WorkflowStage
                index={1}
                title="Draft"
                icon="FileEdit"
                accent="slate"
                description="Newly imported or edited data. Not visible publicly. Counselors and editors create drafts from external sources."
              />
              <div className="flex items-center justify-center lg:px-1">
                <Icon name="ArrowRight" className="size-6 text-[var(--alo-brand)]/40 lg:rotate-0 rotate-90" />
              </div>
              <WorkflowStage
                index={2}
                title="Pending Review"
                icon="Eye"
                accent="amber"
                description="Submitted for review by an admin or super admin. Source URL and verification status are checked before approval."
              />
              <div className="flex items-center justify-center lg:px-1">
                <Icon name="ArrowRight" className="size-6 text-[var(--alo-brand)]/40 lg:rotate-0 rotate-90" />
              </div>
              <WorkflowStage
                index={3}
                title="Published"
                icon="Globe"
                accent="emerald"
                description="Approved and visible on the public website. Last verified date and disclaimer are shown on every public page."
              />
            </div>
          </SectionCard>

          {/* Roles & permissions */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <SectionCard title="Counselor / Editor" icon="UserCog">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                  <span>Can create drafts from external sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                  <span>Can submit drafts for review</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="X" className="size-4 shrink-0 text-rose-500" />
                  <span>Cannot publish or unpublish</span>
                </li>
              </ul>
            </SectionCard>

            <SectionCard title="Admin" icon="ShieldCheck">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                  <span>Can review pending items</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                  <span>Can approve &amp; publish content</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                  <span>Can unpublish (send back to draft)</span>
                </li>
              </ul>
            </SectionCard>

            <SectionCard title="Super Admin" icon="Crown">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                  <span>Full control over all stages</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                  <span>Can override approvals &amp; reverts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="size-4 shrink-0 text-emerald-600" />
                  <span>Access to complete audit trail</span>
                </li>
              </ul>
            </SectionCard>
          </div>

          {/* Audit trail */}
          <SectionCard
            title="Audit trail"
            icon="History"
            description="Every approval, rejection, and publish action is audit-logged with user, timestamp, and change details."
            action={
              <Button
 variant="outline"
 size="sm"
 className=" border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={fetchAudit}
 disabled={auditLoading}
 >
                <Icon name="RefreshCw" className={cn("size-3.5", auditLoading && "animate-spin")} />
                Refresh
              </Button>
            }
          >
            {auditLoading ? (
              <div className="space-y-2 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyState
                icon="History"
                title="No public-publish audit events yet"
                description="Approve or reject pending items to populate the audit trail. All PUBLIC_PUBLISH actions are logged here."
              />
            ) : (
              <div className="max-h-96 overflow-y-auto alo-scroll">
                <ul className="space-y-2">
                  {auditLogs.slice(0, 12).map((log) => {
                    const details = parseAuditDetails(log.details);
                    const actor = log.user?.name || log.userId || "Unknown user";
                    return (
                      <li
                        key={log.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2.5"
                      >
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            details.action === "publish"
                              ? "bg-emerald-100 text-emerald-700"
                              : details.action === "reject"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700",
                          )}
                        >
                          <Icon
                            name={
                              details.action === "publish"
                                ? "CheckCircle2"
                                : details.action === "reject"
                                  ? "XCircle"
                                  : "Clock"
                            }
                            className="size-4"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">
                            <span className="font-semibold">{actor}</span>{" "}
                            <span className="text-muted-foreground">{details.action || log.action.toLowerCase()}</span>{" "}
                            <Badge
                              variant="secondary"
                              className="ml-1 rounded-full bg-[var(--alo-brand-light)] text-[11px] text-[var(--alo-brand)]"
                            >
                              {log.resource || "—"}
                            </Badge>
                            <span className="ml-1 font-mono text-[11px] text-muted-foreground">{log.resourceId}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {fmtDate(log.createdAt)} · {timeAgo(log.createdAt)}
                            {log.ipAddress && ` · IP ${log.ipAddress}`}
                          </p>
                        </div>
                        {details.status && (
                          <Badge
                            variant="secondary"
                            className={cn("rounded-full text-[11px]", APPROVAL_COLORS[details.status])}
                          >
                            {APPROVAL_LABELS[details.status] || details.status}
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Data verification rules card — always visible */}
      <SectionCard
        title="Data verification rules"
        icon="ShieldCheck"
        description="All public-facing data must meet these requirements before publishing."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/40 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--alo-brand)] text-white">
                <Icon name="ListChecks" className="size-4" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--alo-brand)]">Required fields</h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              All public data must include <code className="rounded bg-white px-1 font-mono text-[11px]">sourceUrl</code>,{" "}
              <code className="rounded bg-white px-1 font-mono text-[11px]">lastVerifiedAt</code>,{" "}
              <code className="rounded bg-white px-1 font-mono text-[11px]">verificationStatus</code>, and{" "}
              <code className="rounded bg-white px-1 font-mono text-[11px]">approvalStatus</code>.
            </p>
          </div>

          <div className="rounded-xl border-2 border-[var(--alo-cta)]/15 bg-[var(--alo-cta-soft)]/40 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--alo-cta)] text-white">
                <Icon name="CalendarClock" className="size-4" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--alo-cta)]">Time-sensitive data</h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Fees, visa rules, work rights, scholarships, and deadlines can change — always show{" "}
              <span className="font-medium text-foreground">"Last verified"</span> date and disclaimer on public pages.
            </p>
          </div>

          <div className="rounded-xl border-2 border-rose-200 bg-rose-50/50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-600 text-white">
                <Icon name="AlertTriangle" className="size-4" />
              </div>
              <h4 className="text-sm font-semibold text-rose-700">Never publish unverified</h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Never publish unverified data. Mark uncertain data as{" "}
              <Badge variant="secondary" className="mx-0.5 rounded-full bg-amber-100 px-1.5 py-0 text-[11px] text-amber-700">
                Needs verification
              </Badge>{" "}
              and route it back to the editor.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
export default ImportCenter;
