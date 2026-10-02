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
import { fmtDate } from "@/lib/alo-types";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Types — matches /api/csv-import response
// ---------------------------------------------------------------------------

type SupportedType = {
  type: string;
  columns: string;
};

type ImportBatch = {
  id: string;
  type: string;
  fileName: string;
  uploadedBy?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalRows: number;
  successRows: number;
  errorRows: number;
  _count?: { errors: number };
  createdAt: string;
};

type PreviewRow = Record<string, string>;

type ImportErrorView = {
  rowNumber: number;
  fieldName: string;
  errorMessage: string;
  rawData?: string | null;
};

type ImportResult = {
  batch: ImportBatch;
  message: string;
  preview: PreviewRow[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_STATUS_META: Record<
  ImportBatch["status"],
  { label: string; bg: string; text: string; icon: string }
> = {
  PENDING: { label: "Pending", bg: "bg-amber-100", text: "text-amber-700", icon: "Clock" },
  PROCESSING: { label: "Processing", bg: "bg-sky-100", text: "text-sky-700", icon: "Loader2" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-100", text: "text-emerald-700", icon: "CheckCircle" },
  FAILED: { label: "Failed", bg: "bg-rose-100", text: "text-rose-700", icon: "XCircle" },
};

const TYPE_META: Record<
  string,
  { label: string; icon: string; accent: "blue" | "emerald" | "amber" | "violet" }
> = {
  courses: { label: "Courses", icon: "BookOpen", accent: "blue" },
  universities: { label: "Universities", icon: "Building2", accent: "emerald" },
  scholarships: { label: "Scholarships", icon: "Award", accent: "amber" },
  commissions: { label: "Commissions", icon: "DollarSign", accent: "violet" },
};

const SAMPLE_CSVS: Record<string, string> = {
  courses: `course_code,university_code,name,slug,description,duration_months,tuition_fee,currency,study_level,subject,intake,deadline,status
CS001,uni-bristol,MSc Computer Science,msc-computer-science-bristol,Advanced CS programme,12,28500,USD,Masters,Computer Science,September,June 2025,PUBLISHED
MBA001,uni-manchaster,MBA,Mba-manchaster,Global MBA programme,24,45000,USD,MBA,Business,September,May 2025,PUBLISHED
DS001,uni-toronto,MSc Data Science,msc-data-science-toronto,Applied data science,16,32000,USD,Masters,Data Science,January,October 2025,PUBLISHED`,
  universities: `university_code,country_code,name,slug,city,state,website,ranking,overview,status
uni-bristol,uk,University of Bristol,university-of-bristol,Bristol,England,https://bristol.ac.uk,55,Research-intensive Russell Group university,PUBLISHED
uni-toronto,canada,University of Toronto,university-of-toronto,Toronto,Ontario,https://utoronto.ca,21,Canada's leading research university,PUBLISHED
uni-auckland,new-zealand,University of Auckland,university-of-auckland,Auckland,North Island,https://auckland.ac.nz,68,New Zealand's top-ranked university,PUBLISHED`,
  scholarships: `scholarship_code,country_code,university_code,name,amount,currency,eligibility,deadline,status
SCH001,uk,uni-bristol,Global Excellence Scholarship,5000,GBP,International students with 1st class degree,June 2025,PUBLISHED
SCH002,canada,uni-toronto,Lester B Pearson Scholarship,80000,CAD,Exceptional international students,January 2025,PUBLISHED
SCH003,australia,uni-melbourne,Graduate Research Scholarship,30000,AUD,Academic merit for Masters by research,October 2025,PUBLISHED`,
  commissions: `commission_code,partner_id,country_code,university_code,commission_amount,commission_type,currency,claim_stage,visibility,status
COM001,PARTNER001,uk,uni-bristol,1500,PERCENTAGE,USD,CAS_ISSUED,PARTNER_ONLY,ACTIVE
COM002,PARTNER001,canada,uni-toronto,2000,FIXED,USD,ENROLLED,PARTNER_ONLY,ACTIVE
COM003,PARTNER002,australia,uni-melbourne,1800,PERCENTAGE,USD,DEPOSIT_PAID,PARTNER_ONLY,ACTIVE`,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CsvImportCenter() {
  const { toast } = useToast();

  const [supportedTypes, setSupportedTypes] = React.useState<SupportedType[]>([]);
  const [batches, setBatches] = React.useState<ImportBatch[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Import New form
  const [importType, setImportType] = React.useState("courses");
  const [fileName, setFileName] = React.useState("");
  const [csvData, setCsvData] = React.useState("");
  const [uploadedBy, setUploadedBy] = React.useState("Super Admin");
  const [parsing, setParsing] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [parsedErrors, setParsedErrors] = React.useState<ImportErrorView[]>([]);
  const [showSample, setShowSample] = React.useState(false);

  // Errors dialog (history tab)
  const [errorsBatch, setErrorsBatch] = React.useState<ImportBatch | null>(null);

  // ---- Initial load ----
  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/csv-import", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSupportedTypes(Array.isArray(data.supportedTypes) ? data.supportedTypes : []);
      setBatches(Array.isArray(data.batches) ? data.batches : []);
    } catch (e: any) {
      toast({
        title: "Couldn't load import data",
        description: e?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---- Parse & Preview ----
  const parseAndPreview = async () => {
    if (!importType) {
      toast({ title: "Select an import type first", variant: "destructive" });
      return;
    }
    if (!csvData.trim()) {
      toast({ title: "CSV data is empty", variant: "destructive" });
      return;
    }
    if (!fileName.trim()) {
      setFileName(`${importType}-import-${new Date().toISOString().slice(0, 10)}.csv`);
    }
    setParsing(true);
    setResult(null);
    setParsedErrors([]);
    try {
      const res = await fetch("/api/csv-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: importType,
          fileName: fileName.trim() || `${importType}-import-${Date.now()}.csv`,
          csvData,
          uploadedBy: uploadedBy.trim() || "Super Admin",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const batch: ImportBatch = data.batch;
      const preview: PreviewRow[] = data.preview || [];
      setResult({ batch, message: data.message, preview });

      // Build a parsed error view from the CSV ourselves (the API only returns counts)
      // so the user has actionable feedback. We parse client-side for preview purposes.
      const lines = csvData.split("\n").filter((l) => l.trim());
      const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
      const dataRows = lines.slice(1);
      const errs: ImportErrorView[] = [];
      dataRows.forEach((line, i) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, j) => {
          row[h] = values[j];
        });
        const rowErrors: string[] = [];
        if (importType === "courses") {
          if (!row.name) rowErrors.push("Missing course name");
          if (!row.slug) rowErrors.push("Missing slug");
          if (!row.university_code) rowErrors.push("Missing university code");
          if (row.tuition_fee && isNaN(parseFloat(row.tuition_fee)))
            rowErrors.push("Tuition fee must be numeric");
        }
        if (importType === "universities") {
          if (!row.name) rowErrors.push("Missing university name");
          if (!row.slug) rowErrors.push("Missing slug");
        }
        if (rowErrors.length > 0) {
          errs.push({
            rowNumber: i + 2,
            fieldName: rowErrors[0].split(" ")[1] || "unknown",
            errorMessage: rowErrors.join("; "),
            rawData: JSON.stringify(row),
          });
        }
      });
      setParsedErrors(errs);

      toast({
        title: "Import completed",
        description: data.message,
        variant: batch.errorRows > 0 ? "destructive" : "default",
      });
      fetchAll();
    } catch (e: any) {
      toast({
        title: "Import failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  const resetImportForm = () => {
    setCsvData("");
    setFileName("");
    setResult(null);
    setParsedErrors([]);
  };

  const loadSampleCsv = (type?: string) => {
    const t = type || importType;
    setCsvData(SAMPLE_CSVS[t] || "");
    setFileName(`${t}-sample.csv`);
    toast({
      title: "Sample CSV loaded",
      description: `Loaded sample data for ${TYPE_META[t]?.label || t}.`,
    });
  };

  const totalErrors = result?.batch.errorRows ?? 0;
  const totalSuccess = result?.batch.successRows ?? 0;
  const totalRows = result?.batch.totalRows ?? 0;

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 bg-[#f7f9fc]">
      <PageHeader
        title="CSV Import Center"
        subtitle="Bulk import courses, universities, scholarships, and commissions via CSV."
        icon="FileSpreadsheet"
      />

      {/* Supported file types */}
      <SectionCard
        title="Supported import types"
        description="Each type expects a specific column header order. Download a template or copy the sample format below."
        icon="Layers"
      >
        {loading && supportedTypes.length === 0 ? (
          <LoadingGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {supportedTypes.length === 0 && (
              <p className="col-span-2 text-sm text-muted-foreground">
                No supported types returned from the API.
              </p>
            )}
            {supportedTypes.map((t) => {
              const meta = TYPE_META[t.type] || {
                label: t.type,
                icon: "File",
                accent: "blue" as const,
              };
              const accentMap: Record<string, string> = {
                blue: "bg-[#e8f0fb] text-[#0B5ED7]",
                emerald: "bg-emerald-50 text-emerald-600",
                amber: "bg-amber-50 text-amber-600",
                violet: "bg-violet-50 text-violet-600",
              };
              const cols = t.columns.split(",").map((c) => c.trim());
              return (
                <Card
                  key={t.type}
                  className="rounded-2xl border-2 border-[#0B5ED7]/15 transition-colors hover:border-[#0B5ED7]/40"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          accentMap[meta.accent],
                        )}
                      >
                        <Icon name={meta.icon} className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold capitalize text-foreground">{meta.label}</p>
                          <Badge variant="outline" className="border-[#0B5ED7]/30 text-[#0B5ED7]">
                            {cols.length} columns
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {cols.map((c) => (
                            <span
                              key={c}
                              className="rounded bg-[#f7f9fc] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                        <Button
                          onClick={() => {
                            setImportType(t.type);
                            loadSampleCsv(t.type);
                          }}
                          variant="ghost"
                          size="sm"
                          className="mt-3 h-8 px-2 text-xs text-[#0B5ED7] hover:bg-[#e8f0fb]"
                        >
                          <Icon name="FileDown" className="size-3.5" />
                          Load sample
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Tabs */}
      <Tabs defaultValue="new" className="space-y-4">
        <TabsList className="bg-[#e8f0fb]">
          <TabsTrigger value="new" className="data-[state=active]:bg-white">
            <Icon name="Upload" className="mr-1.5 size-3.5" />
            Import New
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white">
            <Icon name="History" className="mr-1.5 size-3.5" />
            Import History
          </TabsTrigger>
        </TabsList>

        {/* Import New tab */}
        <TabsContent value="new" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              <SectionCard
                title="Upload CSV"
                description="Paste CSV content below. Headers must match the expected columns for the chosen type."
                icon="FileUp"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Import type *
                      </Label>
                      <Select value={importType} onValueChange={setImportType}>
                        <SelectTrigger className="mt-1 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedTypes.map((t) => (
                            <SelectItem key={t.type} value={t.type}>
                              {TYPE_META[t.type]?.label || t.type}
                            </SelectItem>
                          ))}
                          {supportedTypes.length === 0 && (
                            <>
                              <SelectItem value="courses">Courses</SelectItem>
                              <SelectItem value="universities">Universities</SelectItem>
                              <SelectItem value="scholarships">Scholarships</SelectItem>
                              <SelectItem value="commissions">Commissions</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        File name *
                      </Label>
                      <Input
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="courses-import-2025-01.csv"
                        className="mt-1 h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Uploaded by
                    </Label>
                    <Input
                      value={uploadedBy}
                      onChange={(e) => setUploadedBy(e.target.value)}
                      placeholder="Super Admin"
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        CSV data *
                      </Label>
                      <button
                        onClick={() => loadSampleCsv()}
                        className="text-xs font-medium text-[#0B5ED7] hover:underline"
                      >
                        Load sample CSV
                      </button>
                    </div>
                    <Textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      placeholder={
                        SAMPLE_CSVS[importType]
                          ? "Click 'Load sample CSV' to see the expected format..."
                          : "Paste your CSV content here. First row should be the header row."
                      }
                      rows={10}
                      className="font-mono text-xs"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {csvData.trim().split("\n").filter((l) => l.trim()).length} line(s) detected
                      · {csvData.trim() ? csvData.trim().split("\n").length - 1 : 0} data rows
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={parseAndPreview}
                      disabled={parsing}
                      className="h-12 flex-1 bg-[#F97316] text-white hover:bg-[#F97316]/90"
                    >
                      {parsing ? (
                        <>
                          <Icon name="Loader2" className="size-4 animate-spin" />
                          Parsing & validating...
                        </>
                      ) : (
                        <>
                          <Icon name="Play" className="size-4" />
                          Parse &amp; Preview
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetImportForm}
                      variant="outline"
                      className="h-12 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                    >
                      <Icon name="RotateCcw" className="size-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Validation rules + sample CSV */}
            <div className="space-y-6">
              <SectionCard
                title="Validation rules"
                description="What we check before importing"
                icon="ShieldCheck"
              >
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <span>Validates required columns are present</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <span>Checks foreign keys (country_code, university_code, course_code exist)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <span>Validates numeric fields (tuition, fees, amounts)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <span>Validates dates and intake formats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <span>Checks for duplicate slugs / codes</span>
                  </li>
                </ul>
                <div className="mt-3 rounded-lg bg-[#e8f0fb]/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0B5ED7]">
                    Import flow
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Upload → Parse → Validate → Preview → Confirm → Import → Log errors
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Sample CSV" icon="FileText">
                <Collapsible open={showSample} onOpenChange={setShowSample}>
                  <CollapsibleTrigger asChild>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                      variant="outline"
                      className="h-9 w-full border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                    >
                      <Icon name={showSample ? "ChevronUp" : "ChevronDown"} className="size-4" />
                      {showSample ? "Hide sample" : "Show sample CSV"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <pre className="max-h-64 overflow-auto rounded-lg bg-[#0f172a] p-3 font-mono text-[10px] leading-relaxed text-slate-100">
                      {SAMPLE_CSVS[importType] || "Select an import type first."}
                    </pre>
                    <Button
                      onClick={() => {
                        navigator.clipboard?.writeText(SAMPLE_CSVS[importType] || "");
                        toast({ title: "Copied to clipboard" });
                      }}
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 text-xs text-[#0B5ED7] hover:bg-[#e8f0fb]"
                    >
                      <Icon name="Copy" className="size-3.5" />
                      Copy sample
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </SectionCard>
            </div>
          </div>

          {/* Results */}
          {result && (
            <SectionCard
              title="Import results"
              description={result.message}
              icon="ClipboardCheck"
              action={
                <Badge
                  className={cn(
                    "h-7",
                    totalErrors > 0
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                  )}
                >
                  <Icon
                    name={totalErrors > 0 ? "AlertTriangle" : "CheckCircle"}
                    className="mr-1 size-3.5"
                  />
                  {totalErrors > 0 ? `${totalErrors} error(s)` : "All rows valid"}
                </Badge>
              }
            >
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="Total rows"
                  value={totalRows}
                  icon="List"
                  accent="blue"
                />
                <StatCard
                  label="Successful"
                  value={totalSuccess}
                  icon="CheckCircle"
                  accent="emerald"
                />
                <StatCard
                  label="Errors"
                  value={totalErrors}
                  icon="AlertCircle"
                  accent="rose"
                />
              </div>

              {/* Error table */}
              {parsedErrors.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
                    <Icon name="AlertTriangle" className="size-4" />
                    Validation errors ({parsedErrors.length})
                  </h4>
                  <ScrollArea className="max-h-72 rounded-lg border border-rose-200">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow className="border-b border-rose-200">
                          <TableHead className="w-16 text-xs font-bold uppercase text-rose-700">
                            Row
                          </TableHead>
                          <TableHead className="w-40 text-xs font-bold uppercase text-rose-700">
                            Field
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase text-rose-700">
                            Error
                          </TableHead>
                          <TableHead className="w-64 text-xs font-bold uppercase text-rose-700">
                            Raw data
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedErrors.map((err, i) => (
                          <TableRow key={i} className="border-b border-rose-100">
                            <TableCell className="font-mono text-xs font-semibold text-rose-700">
                              {err.rowNumber}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-rose-700">
                              {err.fieldName}
                            </TableCell>
                            <TableCell className="text-xs text-foreground/80">
                              {err.errorMessage}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                              <span className="line-clamp-2">{err.rawData}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Preview table */}
              {result.preview.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#0B5ED7]">
                    <Icon name="Eye" className="size-4" />
                    Preview — first {result.preview.length} parsed rows
                  </h4>
                  <ScrollArea className="max-h-72 rounded-lg border border-[#0B5ED7]/15">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow className="border-b border-[#0B5ED7]/15">
                          <TableHead className="w-12 text-xs font-bold uppercase text-[#0B5ED7]">
                            #
                          </TableHead>
                          {Object.keys(result.preview[0] || {}).map((h) => (
                            <TableHead
                              key={h}
                              className="text-xs font-bold uppercase text-[#0B5ED7]"
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.preview.map((row, i) => (
                          <TableRow key={i} className="border-b border-[#0B5ED7]/8">
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {i + 1}
                            </TableCell>
                            {Object.keys(result.preview[0] || {}).map((h) => (
                              <TableCell key={h} className="text-xs text-foreground/80">
                                {row[h] || "—"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#e8f0fb]/60 p-3 text-xs text-muted-foreground">
                <Icon name="Info" className="mt-0.5 size-4 shrink-0 text-[#0B5ED7]" />
                <p>
                  Imported data goes through validation. Errors are saved in the{" "}
                  <span className="font-mono">import_errors</span> table. All imports are
                  audit-logged with actor, timestamp, and file name. Use the{" "}
                  <span className="font-medium">Import History</span> tab to review past batches.
                </p>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* Import History tab */}
        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <LoadingGrid count={4} />
          ) : batches.length === 0 ? (
            <EmptyState
              icon="Inbox"
              title="No imports yet"
              description="Your import history will appear here. Run an import from the 'Import New' tab to get started."
            />
          ) : (
            <SectionCard
              title="Import history"
              description={`${batches.length} most recent batch(es)`}
              icon="History"
            >
              <ScrollArea className="max-h-[60vh]">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow className="border-b border-[#0B5ED7]/15">
                      <TableHead className="min-w-[180px] text-xs font-bold uppercase text-[#0B5ED7]">
                        File name
                      </TableHead>
                      <TableHead className="min-w-[120px] text-xs font-bold uppercase text-[#0B5ED7]">
                        Type
                      </TableHead>
                      <TableHead className="min-w-[120px] text-xs font-bold uppercase text-[#0B5ED7]">
                        Status
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase text-[#0B5ED7]">
                        Total
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase text-[#0B5ED7]">
                        Success
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase text-[#0B5ED7]">
                        Errors
                      </TableHead>
                      <TableHead className="min-w-[140px] text-xs font-bold uppercase text-[#0B5ED7]">
                        Date
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase text-[#0B5ED7]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((b) => {
                      const meta = BATCH_STATUS_META[b.status] || BATCH_STATUS_META.PENDING;
                      const typeMeta = TYPE_META[b.type] || { label: b.type, icon: "File" };
                      return (
                        <TableRow
                          key={b.id}
                          className="border-b border-[#0B5ED7]/8 hover:bg-[#f7f9fc]"
                        >
                          <TableCell className="align-top">
                            <p className="font-medium text-foreground">{b.fileName}</p>
                            {b.uploadedBy && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                by {b.uploadedBy}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge
                              variant="outline"
                              className="border-[#0B5ED7]/30 text-[#0B5ED7]"
                            >
                              <Icon name={typeMeta.icon} className="mr-1 size-3" />
                              {typeMeta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                meta.bg,
                                meta.text,
                              )}
                            >
                              <Icon
                                name={meta.icon}
                                className={cn(
                                  "size-3",
                                  b.status === "PROCESSING" && "animate-spin",
                                )}
                              />
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right align-top font-semibold tabular-nums text-foreground">
                            {b.totalRows}
                          </TableCell>
                          <TableCell className="text-right align-top font-semibold tabular-nums text-emerald-700">
                            {b.successRows}
                          </TableCell>
                          <TableCell className="text-right align-top font-semibold tabular-nums text-rose-600">
                            {b.errorRows || b._count?.errors || 0}
                          </TableCell>
                          <TableCell className="align-top text-xs text-muted-foreground">
                            {fmtDate(b.createdAt)}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <Button
                              onClick={() => setErrorsBatch(b)}
                              variant="outline"
                              size="sm"
                              className="h-8 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                              disabled={b.errorRows === 0 && (b._count?.errors ?? 0) === 0}
                            >
                              <Icon name="Eye" className="size-3.5" />
                              View Errors
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </SectionCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Errors dialog (history tab) */}
      <Dialog open={!!errorsBatch} onOpenChange={(o) => !o && setErrorsBatch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0B5ED7]">
              <Icon name="AlertTriangle" className="size-5" />
              Batch error summary
            </DialogTitle>
            <DialogDescription className="text-xs">
              {errorsBatch?.fileName} · {errorsBatch?.type}
            </DialogDescription>
          </DialogHeader>
          {errorsBatch && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-[#e8f0fb]/60 p-3 text-center">
                  <p className="text-2xl font-black tabular-nums text-[#0B5ED7]">
                    {errorsBatch.totalRows}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Total rows
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-black tabular-nums text-emerald-700">
                    {errorsBatch.successRows}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Successful
                  </p>
                </div>
                <div className="rounded-lg bg-rose-50 p-3 text-center">
                  <p className="text-2xl font-black tabular-nums text-rose-700">
                    {errorsBatch.errorRows || errorsBatch._count?.errors || 0}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Errors
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-[#0B5ED7]/15 bg-[#f7f9fc] p-3">
                <p className="text-xs text-muted-foreground">
                  <Icon name="Info" className="mr-1 inline size-3.5 text-[#0B5ED7]" />
                  Detailed error rows for this batch are stored in the{" "}
                  <span className="font-mono">ImportError</span> table. Each error captures the row
                  number, field name, error message, and raw data so it can be re-imported after
                  correction.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-semibold">Next steps</p>
                <ul className="mt-1 space-y-1 text-amber-700">
                  <li>1. Download the original CSV file</li>
                  <li>2. Fix the rows highlighted in the error report</li>
                  <li>3. Re-upload the corrected CSV via the Import New tab</li>
                  <li>4. All corrections are audit-logged automatically</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default CsvImportCenter;
