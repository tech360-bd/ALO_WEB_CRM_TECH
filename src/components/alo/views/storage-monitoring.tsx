"use client";
import { TriangleAlert } from 'lucide-react';

import * as React from "react";
import { Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader, MiniBar } from "@/components/alo/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { timeAgo, fmtDate } from "@/lib/alo-types";

const POOL_COLORS: Record<string, { border: string; bg: string; text: string; bar: string }> = {
  STUDENT_PARTNER: { border: "border-[var(--alo-border)]", bg: "bg-[var(--alo-brand-pale)]/50", text: "text-[var(--alo-brand)]", bar: "#0057B8" },
  OFFICIAL: { border: "border-[var(--alo-cta)]/25", bg: "bg-[var(--alo-cta-soft)]/50", text: "text-[var(--alo-cta-active)]", bar: "#E8501A" },
  OPERATIONAL: { border: "border-[var(--alo-border)]", bg: "bg-[var(--alo-brand-pale)]/50", text: "text-[var(--alo-brand)]", bar: "#0284C7" },
};

const STATUS_COLORS: Record<string, string> = {
  HEALTHY: "bg-crm-success-bg text-crm-success-text",
  WARNING: "bg-crm-warning-bg text-crm-warning-text",
  HIGH: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]",
  CRITICAL: "bg-crm-warning-bg text-crm-warning-text",
  OFFLINE: "bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]",
};

const EVENT_COLORS: Record<string, string> = {
  UPLOAD: "text-crm-success-text",
  DOWNLOAD: "text-[var(--alo-brand)]",
  DELETE: "text-crm-warning-text",
  VIEW: "text-[var(--alo-body)]",
  FAILED_UPLOAD: "text-crm-warning-text",
  QUARANTINE: "text-[var(--alo-cta-active)]",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function StorageMonitoring({ onNavigate }: { onNavigate: (v: any, slug?: string) => void }) {
  const { toast } = useToast();
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("overview");

  const fetchHealth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/storage/health");
      if (!res.ok) throw new Error("Failed to load storage health");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { fetchHealth(); }, [fetchHealth]);

  if (loading || !data) return <LoadingGrid count={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Server-Side Storage Control Center"
        subtitle="Three storage pools · UUID-based storage · SHA-256 checksums · Access-controlled downloads · Full audit trail. No file exists only in the browser — every upload is physically stored and verified on the ALO Education server."
        icon="HardDrive"
        action={
          <Button variant="outline" onClick={fetchHealth} className="">
            <Icon name="RefreshCw" className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
      />

      {/* Overall Status Banner */}
      <Card className={`rounded-2xl border-2 p-5 ${
        data.overallStatus === "HEALTHY" ? "border-crm-success-border bg-crm-success-bg/50" :
        data.overallStatus === "WARNING" ? "border-crm-warning-border bg-crm-warning-bg/50" :
        data.overallStatus === "HIGH" ? "border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)]/50" :
        "border-crm-warning-border bg-crm-warning-bg/50"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${data.overallStatus === "HEALTHY" ? "bg-[var(--alo-success)]" : data.overallStatus === "WARNING" ? "bg-[var(--alo-warning)]" : data.overallStatus === "HIGH" ? "bg-[var(--alo-cta)]" : "bg-crm-warning-bg0"}`} />
            <div>
              <div className="text-sm font-semibold text-[var(--alo-text)]">Overall Storage Status: {data.overallStatus}</div>
              <div className="text-xs text-[var(--alo-body)]">
                {formatBytes(data.summary.totalUsed)} used of {formatBytes(data.summary.totalCapacity)} across {data.pools.length} pools · {data.summary.totalFiles} files on disk
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="text-center">
              <div className="font-bold text-[var(--alo-text)]">{data.summary.totalFileRecords}</div>
              <div className="text-[var(--alo-text-muted)]">Active Files</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-crm-warning-text">{data.summary.deletedFiles}</div>
              <div className="text-[var(--alo-text-muted)]">Soft-deleted</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-[var(--alo-cta-active)]">{data.summary.quarantinedFiles}</div>
              <div className="text-[var(--alo-text-muted)]">Quarantined</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Pool Cards */}
      <div className="grid gap-4">
        {data.pools.map((pool: any) => {
          const colors = POOL_COLORS[pool.poolKey] || POOL_COLORS.OPERATIONAL;
          const percentage = pool.percentage;
          return (
            <Card key={pool.poolKey} className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="Database" className={`h-5 w-5 ${colors.text}`} />
                    <h3 className="text-base font-bold text-[var(--alo-text)]">{pool.name}</h3>
                    <Badge className={STATUS_COLORS[pool.status]}>{pool.status}</Badge>
                  </div>
                  <p className="text-xs text-[var(--alo-body)]">{pool.description}</p>
                  <p className="text-xs text-[var(--alo-text-muted)] mt-1 font-mono">{pool.mountPath}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--alo-text)]">{percentage.toFixed(1)}%</div>
                  <div className="text-xs text-[var(--alo-text-muted)]">{formatBytes(pool.usedBytes)} / {formatBytes(pool.capacityBytes)}</div>
                  <div className="text-xs text-[var(--alo-text-muted)] mt-0.5">{pool.fileCount} files · {formatBytes(pool.freeBytes)} free</div>
                </div>
              </div>
              {/* Usage bar */}
              <div className="h-3 rounded-full bg-white overflow-hidden border border-[var(--alo-border)]">
                <div
                  className={`h-full transition-all ${percentage >= pool.criticalThreshold ? "bg-crm-warning-bg0" : percentage >= pool.highThreshold ? "bg-[var(--alo-cta)]" : percentage >= pool.warningThreshold ? "bg-[var(--alo-warning)]" : "bg-[var(--alo-success)]"}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-[var(--alo-text-muted)]">
                <span className="inline-flex items-center gap-1"><TriangleAlert className="size-3.5 text-[var(--alo-warning)]" />{pool.warningThreshold}%</span>
                <span className="inline-flex items-center gap-1"><TriangleAlert className="size-3.5 text-[var(--alo-cta)]" />{pool.highThreshold}%</span>
                <span className="inline-flex items-center gap-1"><TriangleAlert className="size-3.5 text-[var(--alo-error)]" />{pool.criticalThreshold}%</span>
              </div>
              {pool.lastHealthCheck && (
                <div className="mt-2 text-xs text-[var(--alo-text-muted)]">Last health check: {timeAgo(pool.lastHealthCheck)}</div>
              )}
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border-2 border-[var(--alo-border)] bg-white p-1.5">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="files" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">File Browser</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">Audit Trail</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <SectionCard title="Files by Entity Type" icon="FolderTree">
              <div className="space-y-2">
                {data.byEntityType.length > 0 ? (
                  data.byEntityType.map((e: any) => (
                    <div key={e.type} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--alo-body)]">{e.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--alo-text-muted)]">{formatBytes(e.sizeBytes)}</span>
                        <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">{e.count}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState icon="FolderTree" title="No files yet" description="Upload files via the Document Hub or any upload form." />
                )}
              </div>
            </SectionCard>

            <SectionCard title="Files by Type (MIME)" icon="FileType">
              <div className="space-y-2 max-h-64 overflow-y-auto alo-scroll">
                {data.byMimeType.length > 0 ? (
                  data.byMimeType.map((m: any) => (
                    <div key={m.mimeType} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--alo-body)] truncate">{m.mimeType}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--alo-text-muted)]">{formatBytes(m.sizeBytes)}</span>
                        <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">{m.count}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState icon="FileType" title="No files yet" />
                )}
              </div>
            </SectionCard>
          </div>

          {/* Storage Rules */}
          <SectionCard title="Storage Architecture — Non-Negotiable Rules" icon="ShieldCheck">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border-2 border-crm-success-border bg-crm-success-bg/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-crm-success-text">
                  <Icon name="Check" className="h-4 w-4" /> Every Upload MUST
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--alo-body)]">
                  <li>• Be physically stored on the ALO Education server</li>
                  <li>• Receive a UUID-based storage name (never client filename)</li>
                  <li>• Have a SHA-256 checksum calculated and verified</li>
                  <li>• Be validated by magic bytes (never trust client MIME)</li>
                  <li>• Have a FileMetadata record with access policy</li>
                  <li>• Be routed to the correct storage pool</li>
                  <li>• Be audited (UPLOAD event logged)</li>
                  <li>• Have the physical file verified after write</li>
                </ul>
              </div>
              <div className="rounded-xl border-2 border-crm-warning-border bg-crm-warning-bg/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-crm-warning-text">
                  <Icon name="X" className="h-4 w-4" /> NEVER
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--alo-body)]">
                  <li>• Store files only in the browser (localStorage)</li>
                  <li>• Trust client-provided MIME type</li>
                  <li>• Allow path traversal in filenames</li>
                  <li>• Accept dangerous extensions (.exe, .sh, .php)</li>
                  <li>• Expose /storage/ paths publicly</li>
                  <li>• Hard-delete files (always soft-delete for audit)</li>
                  <li>• Silently overwrite (always version)</li>
                  <li>• Allow student A to download student B's files</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* FILE BROWSER TAB */}
        <TabsContent value="files" className="mt-6">
          <FileBrowser />
        </TabsContent>

        {/* AUDIT TRAIL TAB */}
        <TabsContent value="audit" className="mt-6">
          <SectionCard title="Recent File Events — Audit Trail" icon="History">
            <Card className="rounded-2xl border-2 border-[var(--alo-border)] overflow-hidden">
              <div className="max-h-[600px] overflow-auto alo-scroll">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">File</TableHead>
                      <TableHead className="text-xs">Pool</TableHead>
                      <TableHead className="text-xs">By</TableHead>
                      <TableHead className="text-xs">Result</TableHead>
                      <TableHead className="text-xs">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-[var(--alo-text-muted)] py-8">No file events yet</TableCell>
                      </TableRow>
                    ) : (
                      data.recentEvents.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs">
                            <span className={`font-semibold ${EVENT_COLORS[e.action] || "text-[var(--alo-body)]"}`}>{e.action}</span>
                          </TableCell>
                          <TableCell className="text-xs text-[var(--alo-body)] truncate max-w-xs">{e.fileName || "—"}</TableCell>
                          <TableCell className="text-xs"><Badge className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)]">{e.pool || "—"}</Badge></TableCell>
                          <TableCell className="text-xs text-[var(--alo-text-muted)]">{e.performedBy || "system"}</TableCell>
                          <TableCell className="text-xs">
                            <Badge className={e.result === "SUCCESS" ? "bg-crm-success-bg text-crm-success-text" : e.result === "DENIED" ? "bg-crm-warning-bg text-crm-warning-text" : "bg-crm-warning-bg text-crm-warning-text"}>{e.result}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-[var(--alo-text-muted)]">{timeAgo(e.performedAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Inline file browser component
function FileBrowser() {
  const { toast } = useToast();
  const [files, setFiles] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [pool, setPool] = React.useState("ALL");

  const fetchFiles = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (pool !== "ALL") params.set("pool", pool);
      const res = await fetch(`/api/storage/list?${params}`);
      if (!res.ok) throw new Error("Failed to load files");
      const json = await res.json();
      setFiles(json.files);
      setTotal(json.total);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [pool, toast]);

  React.useEffect(() => { fetchFiles(); }, [fetchFiles]);

  return (
    <SectionCard title={`File Browser — ${total} files`} icon="FolderOpen" action={
      <Select value={pool} onValueChange={setPool}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Pools</SelectItem>
          <SelectItem value="STUDENT_PARTNER">Student/Partner</SelectItem>
          <SelectItem value="OFFICIAL">Official</SelectItem>
          <SelectItem value="OPERATIONAL">Operational</SelectItem>
        </SelectContent>
      </Select>
    }>
      {loading ? (
        <LoadingGrid count={3} />
      ) : files.length === 0 ? (
        <EmptyState icon="FolderOpen" title="No files yet" description="Upload files via any form or the Document Hub." />
      ) : (
        <Card className="rounded-2xl border-2 border-[var(--alo-border)] overflow-hidden">
          <div className="max-h-[600px] overflow-auto alo-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="text-xs">File</TableHead>
                  <TableHead className="text-xs">Pool</TableHead>
                  <TableHead className="text-xs">Entity</TableHead>
                  <TableHead className="text-xs">Size</TableHead>
                  <TableHead className="text-xs">Visibility</TableHead>
                  <TableHead className="text-xs">Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="align-top">
                      <div className="text-sm font-medium text-[var(--alo-text)]">{f.originalName}</div>
                      <div className="text-xs text-[var(--alo-text-muted)] font-mono">{f.uuid.slice(0, 16)}...</div>
                    </TableCell>
                    <TableCell className="align-top"><Badge className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)] text-xs">{f.storagePool}</Badge></TableCell>
                    <TableCell className="align-top text-xs">
                      <div>{f.entityType}</div>
                      <div className="text-[var(--alo-text-muted)]">{f.entityId || "—"}</div>
                    </TableCell>
                    <TableCell className="align-top text-xs text-[var(--alo-body)]">{formatBytes(f.sizeBytes)}</TableCell>
                    <TableCell className="align-top"><Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] text-xs">{f.visibility}</Badge></TableCell>
                    <TableCell className="align-top text-xs text-[var(--alo-text-muted)]">{timeAgo(f.uploadedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </SectionCard>
  );
}
export default StorageMonitoring;
