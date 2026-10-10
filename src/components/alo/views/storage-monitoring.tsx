"use client";

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
  STUDENT_PARTNER: { border: "border-blue-200", bg: "bg-blue-50/50", text: "text-blue-700", bar: "#2563EB" },
  OFFICIAL: { border: "border-orange-200", bg: "bg-orange-50/50", text: "text-orange-700", bar: "#F97316" },
  OPERATIONAL: { border: "border-violet-200", bg: "bg-violet-50/50", text: "text-violet-700", bar: "#7c3aed" },
};

const STATUS_COLORS: Record<string, string> = {
  HEALTHY: "bg-emerald-100 text-emerald-700",
  WARNING: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-rose-100 text-rose-700",
  OFFLINE: "bg-slate-100 text-slate-500",
};

const EVENT_COLORS: Record<string, string> = {
  UPLOAD: "text-emerald-600",
  DOWNLOAD: "text-blue-600",
  DELETE: "text-rose-600",
  VIEW: "text-slate-600",
  FAILED_UPLOAD: "text-rose-600",
  QUARANTINE: "text-orange-600",
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
          <Button variant="outline" onClick={fetchHealth} className="h-10">
            <Icon name="RefreshCw" className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
      />

      {/* Overall Status Banner */}
      <Card className={`rounded-2xl border-2 p-5 ${
        data.overallStatus === "HEALTHY" ? "border-emerald-200 bg-emerald-50/50" :
        data.overallStatus === "WARNING" ? "border-amber-200 bg-amber-50/50" :
        data.overallStatus === "HIGH" ? "border-orange-200 bg-orange-50/50" :
        "border-rose-200 bg-rose-50/50"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${data.overallStatus === "HEALTHY" ? "bg-emerald-500" : data.overallStatus === "WARNING" ? "bg-amber-500" : data.overallStatus === "HIGH" ? "bg-orange-500" : "bg-rose-500"}`} />
            <div>
              <div className="text-sm font-semibold text-slate-900">Overall Storage Status: {data.overallStatus}</div>
              <div className="text-xs text-slate-600">
                {formatBytes(data.summary.totalUsed)} used of {formatBytes(data.summary.totalCapacity)} across {data.pools.length} pools · {data.summary.totalFiles} files on disk
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="text-center">
              <div className="font-bold text-slate-900">{data.summary.totalFileRecords}</div>
              <div className="text-slate-500">Active Files</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-rose-600">{data.summary.deletedFiles}</div>
              <div className="text-slate-500">Soft-deleted</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">{data.summary.quarantinedFiles}</div>
              <div className="text-slate-500">Quarantined</div>
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
                    <h3 className="text-base font-bold text-slate-900">{pool.name}</h3>
                    <Badge className={STATUS_COLORS[pool.status]}>{pool.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{pool.description}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{pool.mountPath}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{percentage.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">{formatBytes(pool.usedBytes)} / {formatBytes(pool.capacityBytes)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{pool.fileCount} files · {formatBytes(pool.freeBytes)} free</div>
                </div>
              </div>
              {/* Usage bar */}
              <div className="h-3 rounded-full bg-white overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all ${percentage >= pool.criticalThreshold ? "bg-rose-500" : percentage >= pool.highThreshold ? "bg-orange-500" : percentage >= pool.warningThreshold ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>⚠️ {pool.warningThreshold}%</span>
                <span>🟠 {pool.highThreshold}%</span>
                <span>🔴 {pool.criticalThreshold}%</span>
              </div>
              {pool.lastHealthCheck && (
                <div className="mt-2 text-xs text-slate-400">Last health check: {timeAgo(pool.lastHealthCheck)}</div>
              )}
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border-2 border-[#E2E8F0] bg-white p-1.5">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="files" className="rounded-xl data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">File Browser</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-xl data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">Audit Trail</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <SectionCard title="Files by Entity Type" icon="FolderTree">
              <div className="space-y-2">
                {data.byEntityType.length > 0 ? (
                  data.byEntityType.map((e: any) => (
                    <div key={e.type} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{e.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{formatBytes(e.sizeBytes)}</span>
                        <Badge className="bg-blue-50 text-blue-700">{e.count}</Badge>
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
                      <span className="text-slate-700 truncate">{m.mimeType}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{formatBytes(m.sizeBytes)}</span>
                        <Badge className="bg-violet-50 text-violet-700">{m.count}</Badge>
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
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <Icon name="Check" className="h-4 w-4" /> Every Upload MUST
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
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
              <div className="rounded-xl border-2 border-rose-200 bg-rose-50/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
                  <Icon name="X" className="h-4 w-4" /> NEVER
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
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
            <Card className="rounded-2xl border-2 border-[#E2E8F0] overflow-hidden">
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
                        <TableCell colSpan={6} className="text-center text-slate-400 py-8">No file events yet</TableCell>
                      </TableRow>
                    ) : (
                      data.recentEvents.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs">
                            <span className={`font-semibold ${EVENT_COLORS[e.action] || "text-slate-600"}`}>{e.action}</span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 truncate max-w-xs">{e.fileName || "—"}</TableCell>
                          <TableCell className="text-xs"><Badge className="bg-slate-100 text-slate-600">{e.pool || "—"}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{e.performedBy || "system"}</TableCell>
                          <TableCell className="text-xs">
                            <Badge className={e.result === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : e.result === "DENIED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}>{e.result}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{timeAgo(e.performedAt)}</TableCell>
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
        <Card className="rounded-2xl border-2 border-[#E2E8F0] overflow-hidden">
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
                      <div className="text-sm font-medium text-slate-900">{f.originalName}</div>
                      <div className="text-xs text-slate-400 font-mono">{f.uuid.slice(0, 16)}...</div>
                    </TableCell>
                    <TableCell className="align-top"><Badge className="bg-slate-100 text-slate-600 text-xs">{f.storagePool}</Badge></TableCell>
                    <TableCell className="align-top text-xs">
                      <div>{f.entityType}</div>
                      <div className="text-slate-400">{f.entityId || "—"}</div>
                    </TableCell>
                    <TableCell className="align-top text-xs text-slate-600">{formatBytes(f.sizeBytes)}</TableCell>
                    <TableCell className="align-top"><Badge className="bg-blue-50 text-blue-700 text-xs">{f.visibility}</Badge></TableCell>
                    <TableCell className="align-top text-xs text-slate-500">{timeAgo(f.uploadedAt)}</TableCell>
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
