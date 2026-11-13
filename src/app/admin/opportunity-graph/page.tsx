'use client';

// ============================================================
// ALO OPPORTUNITY GRAPH — explorer (spec s110, s16, s105, s93)
// ============================================================
// Renders a student's derived graph and the recommendations that follow from it.
//
// The point of this screen is explainability, so the UI leads with evidence:
//   * Every edge displays the real table, row id and field that produced it. An
//     edge with no evidence would be a claim with no basis, and the engine does
//     not produce them (s16).
//   * Every recommendation displays its `becauseOf` chain — the edges that
//     justify it — and its reason in plain English.
//   * Unverified data is labelled as such and shown at reduced weight rather than
//     being hidden or presented as equal (s105).
//   * A funding gap is reported as NOT_FOUND with "check the official source",
//     never as "no funding exists" (s93).
//   * NOT_CONFIGURED (flag off) and TENANT_MISMATCH render as distinct states.
// ============================================================

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Network,
  Search,
  RefreshCw,
  Database,
  Lightbulb,
  ShieldAlert,
  Info,
  Lock,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface GraphNode {
  type: string;
  id: string;
  label: string;
}

interface GraphEdge {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relation: string;
  weight: number;
  evidence: { table: string; id: string; field?: string };
  label?: string;
}

interface Graph {
  studentId: string;
  generatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: Record<string, number>;
}

interface Recommendation {
  kind: 'SCHOLARSHIP' | 'COUNTRY' | 'UNIVERSITY';
  id: string;
  label: string;
  reason: string;
  becauseOf: Array<{ relation: string; via: string }>;
  verificationStatus?: string;
}

type GraphState = 'idle' | 'loading' | 'ready' | 'not_configured' | 'denied' | 'empty' | 'error';

const NODE_STYLE: Record<string, string> = {
  STUDENT: 'bg-[var(--alo-brand)] text-white',
  UNIVERSITY: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
  COURSE: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
  COUNTRY: 'bg-crm-success-bg text-crm-success-text',
  SCHOLARSHIP: 'bg-crm-warning-bg text-crm-warning-text',
  APPLICATION: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)]',
  VISA: 'bg-[var(--alo-info-bg)] text-[var(--alo-info-text)]',
  PARTNER: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
  COUNSELOR: 'bg-[var(--alo-page)] text-[var(--alo-body)]',
  COMMISSION: 'bg-teal-100 text-teal-800',
};

function weightTone(weight: number): string {
  if (weight >= 0.9) return 'text-crm-success-text';
  if (weight >= 0.6) return 'text-[var(--alo-body)]';
  return 'text-crm-warning-text';
}

export default function OpportunityGraphPage() {
  const [studentId, setStudentId] = useState('');
  const [state, setState] = useState<GraphState>('idle');
  const [message, setMessage] = useState('');
  const [graph, setGraph] = useState<Graph | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [relationFilter, setRelationFilter] = useState('ALL');
  const [materialising, setMaterialising] = useState(false);

  const load = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      toast.error('Enter a student id first.');
      return;
    }
    setState('loading');
    setMessage('');
    try {
      const res = await fetch(
        `/api/intelligence/opportunity-graph/${encodeURIComponent(trimmed)}?recommend=true`,
        { cache: 'no-store' },
      );
      const json = await res.json().catch(() => null);

      if (json?.status === 'NOT_CONFIGURED' || res.status === 404) {
        setState('not_configured');
        setMessage(json?.error || 'The Opportunity Graph is not enabled.');
        return;
      }
      if (res.status === 403) {
        setState('denied');
        setMessage(json?.error || 'Access denied.');
        return;
      }
      if (!res.ok || !json?.success) {
        setState('error');
        setMessage(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      const loaded = json.graph as Graph;
      setGraph(loaded);
      setRecommendations(Array.isArray(json.recommendations) ? json.recommendations : []);
      setState(loaded.edges.length === 0 ? 'empty' : 'ready');
      if (loaded.edges.length === 0) {
        setMessage('This student has no recorded activity, so no relationship can be derived.');
      }
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Could not reach the graph service.');
    }
  }, []);

  async function materialise() {
    if (!graph) return;
    setMaterialising(true);
    try {
      const res = await fetch(
        `/api/intelligence/opportunity-graph/${encodeURIComponent(graph.studentId)}/materialise`,
        { method: 'POST' },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Materialise failed with status ${res.status}.`);
        return;
      }
      toast.success(
        `Stored ${json.created} new edge(s) and refreshed ${json.updated}. Re-running upserts rather than duplicating.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Materialise failed.');
    } finally {
      setMaterialising(false);
    }
  }

  const relations = graph
    ? Array.from(new Set(graph.edges.map((edge) => edge.relation))).sort()
    : [];
  const visibleEdges = graph
    ? relationFilter === 'ALL'
      ? graph.edges
      : graph.edges.filter((edge) => edge.relation === relationFilter)
    : [];

  const nodesByType = (graph?.nodes ?? []).reduce<Record<string, GraphNode[]>>((acc, node) => {
    (acc[node.type] ??= []).push(node);
    return acc;
  }, {});

  // ---- non-ready states ----
  if (state !== 'ready' && state !== 'empty') {
    const copy: Record<string, { title: string; detail: string; icon: typeof Info }> = {
      idle: {
        title: 'Explore a student’s opportunity',
        detail:
          'Enter a student id to derive their graph from live CRM rows — applications, universities, courses, countries, scholarships, visa cases, partners, counselors and commission.',
        icon: Network,
      },
      loading: { title: 'Deriving graph', detail: 'Reading live records…', icon: RefreshCw },
      not_configured: {
        title: 'Opportunity Graph not enabled',
        detail:
          'The graph is switched off on this platform. An administrator can enable the OPPORTUNITY_GRAPH feature flag.',
        icon: Info,
      },
      denied: {
        title: 'Access denied',
        detail:
          'This student is not linked to your tenant, or your role may not view the graph. Cross-tenant reads are refused rather than returning partial data.',
        icon: Lock,
      },
      error: { title: 'Graph unavailable', detail: 'The graph service did not respond as expected.', icon: ShieldAlert },
    };
    const shown = copy[state] ?? copy.error;
    const IconCmp = shown.icon;
    return (
      <div className="space-y-5 p-6">
        <Header />
        <Lookup studentId={studentId} setStudentId={setStudentId} load={load} busy={state === 'loading'} />
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="flex flex-col items-center gap-3 pt-12 pb-12 text-center">
            <IconCmp className={state === 'loading' ? 'size-9 animate-spin text-[var(--alo-text-muted)]' : 'size-9 text-[var(--alo-text-muted)]'} />
            <h2 className="text-base font-bold text-[var(--alo-text)]">{shown.title}</h2>
            <p className="max-w-lg text-sm text-[var(--alo-body)]">{message || shown.detail}</p>
            {message && state !== 'loading' && state !== 'idle' && (
              <p className="max-w-lg rounded-lg bg-[var(--alo-page)] px-3 py-2 font-mono text-[11px] text-[var(--alo-text-muted)]">
                reason: {message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!graph) return null;

  return (
    <div className="space-y-5 p-6">
      <Header generatedAt={graph.generatedAt} studentId={graph.studentId} />
      <Lookup studentId={studentId} setStudentId={setStudentId} load={load} busy={false} />

      {state === 'empty' && (
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="py-8 text-center text-sm text-[var(--alo-body)]">
            {message}
            <p className="mt-1 text-xs text-[var(--alo-text-muted)]">
              The student node exists; nothing is invented to fill the graph.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---------------- Summary ---------------- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="pt-5 pb-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">Nodes</p>
            <p className="text-2xl font-black text-[var(--alo-text)]">{graph.stats.TOTAL_NODES ?? graph.nodes.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="pt-5 pb-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">Edges</p>
            <p className="text-2xl font-black text-[var(--alo-text)]">{graph.stats.TOTAL_EDGES ?? graph.edges.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="pt-5 pb-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">Relations</p>
            <p className="text-2xl font-black text-[var(--alo-text)]">{relations.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="flex items-center justify-between pt-5 pb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">Recommendations</p>
              <p className="text-2xl font-black text-[var(--alo-text)]">{recommendations.length}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void materialise()} disabled={materialising}>
              <Save className="mr-1.5 size-3.5" />
              {materialising ? 'Saving…' : 'Store'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Nodes ---------------- */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Entities reached</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {Object.entries(nodesByType).map(([type, nodes]) => (
            <div key={type}>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">
                {type} ({nodes.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {nodes.map((node) => (
                  <span
                    key={`${node.type}:${node.id}`}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium ${NODE_STYLE[node.type] ?? 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}`}
                    title={node.id}
                  >
                    {node.label || node.id}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ---------------- Edges with evidence ---------------- */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
            <span className="flex items-center gap-2">
              <Database className="size-4 text-[var(--alo-brand)]" />
              Relationships ({visibleEdges.length})
            </span>
            <select
              value={relationFilter}
              onChange={(event) => setRelationFilter(event.target.value)}
              className="h-8 rounded-lg border border-[var(--alo-border)] bg-white px-2 text-xs font-normal"
              aria-label="Filter by relation"
            >
              <option value="ALL">All relations</option>
              {relations.map((relation) => (
                <option key={relation} value={relation}>{relation}</option>
              ))}
            </select>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleEdges.map((edge, index) => (
            <div key={`${edge.relation}-${edge.sourceId}-${edge.targetId}-${index}`} className="rounded-xl border border-[var(--alo-border)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[11px] text-[var(--alo-text)]">
                  <span className="font-semibold">{edge.sourceType}</span>
                  <span className="mx-1.5 rounded bg-[var(--alo-surface-muted)] px-1.5 py-0.5 text-[11px] text-[var(--alo-body)]">
                    {edge.relation}
                  </span>
                  <span className="font-semibold">{edge.targetType}</span>
                </p>
                <span className={`font-mono text-[11px] font-bold ${weightTone(edge.weight)}`}>
                  weight {edge.weight.toFixed(2)}
                </span>
              </div>

              {edge.label && <p className="mt-1 text-xs text-[var(--alo-body)]">{edge.label}</p>}

              {/* Evidence is the point: show the real row behind every claim. */}
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--alo-text-muted)]">
                <span className="font-semibold uppercase tracking-wide">evidence</span>
                <code className="rounded bg-[var(--alo-surface-muted)] px-1.5 py-0.5 font-mono">{edge.evidence.table}</code>
                <code className="rounded bg-[var(--alo-surface-muted)] px-1.5 py-0.5 font-mono">{edge.evidence.id}</code>
                {edge.evidence.field && (
                  <code className="rounded bg-[var(--alo-surface-muted)] px-1.5 py-0.5 font-mono">.{edge.evidence.field}</code>
                )}
              </p>

              {edge.label && /NEEDS_REVIEW|UNVERIFIED|NOT_VERIFIED/i.test(edge.label) && (
                <p className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-crm-warning-border bg-crm-warning-bg p-2 text-[11px] text-crm-warning-text">
                  <ShieldAlert className="mt-0.5 size-3 shrink-0" />
                  Unverified data — weighted at {edge.weight.toFixed(2)} rather than 1.00. Confirm against
                  the official source before advising the student.
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ---------------- Recommendations ---------------- */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Lightbulb className="size-4 text-[var(--alo-brand)]" />
            Recommendations ({recommendations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {recommendations.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--alo-text-muted)]">
              No opportunity follows from this student’s recorded activity. Nothing is suggested for its
              own sake.
            </p>
          ) : (
            recommendations.map((item) => {
              const unverified =
                item.verificationStatus &&
                !['VERIFIED', 'NOT_FOUND'].includes(item.verificationStatus.toUpperCase());
              return (
                <div key={`${item.kind}-${item.id}`} className="rounded-xl border border-[var(--alo-border)] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--alo-text)]">{item.label}</p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">
                        {item.kind}
                      </p>
                    </div>
                    {item.verificationStatus && (
                      <Badge
                        variant="outline"
                        className={
                          item.verificationStatus.toUpperCase() === 'VERIFIED'
                            ? 'border-crm-success-border bg-crm-success-bg text-[11px] text-crm-success-text'
                            : item.verificationStatus === 'NOT_FOUND'
                              ? 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[11px] text-[var(--alo-body)]'
                              : 'border-crm-warning-border bg-crm-warning-bg text-[11px] text-crm-warning-text'
                        }
                      >
                        {item.verificationStatus}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-[var(--alo-body)]">{item.reason}</p>

                  {/* The becauseOf chain is what makes this explainable (s16). */}
                  {item.becauseOf.length > 0 && (
                    <div className="mt-2 border-t border-[var(--alo-border)] pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">
                        because of
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {item.becauseOf.map((because, index) => (
                          <span key={index} className="rounded bg-[var(--alo-surface-muted)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--alo-body)]">
                            {because.relation} → {because.via}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {unverified && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-crm-warning-border bg-crm-warning-bg p-2 text-[11px] text-crm-warning-text">
                      <ShieldAlert className="mt-0.5 size-3 shrink-0" />
                      Not verified against an official source. Confirm before advising the student —
                      this is a lead to check, not a fact to quote.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <p className="flex items-start gap-1.5 rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-[11px] text-[var(--alo-body)]">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Every edge above is derived from a real database row named in its evidence field. Relationships
        are never inferred, guessed or marked “probably related”. Weights encode real progression — an
        unconditional offer outranks a draft, a granted visa outranks a pending one, settled commission
        outranks an expectation — and unverified data is deliberately weighted lower.
      </p>
    </div>
  );
}

function Header({ generatedAt, studentId }: { generatedAt?: string; studentId?: string }) {
  return (
    <div>
      <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--alo-text)]">
        <Network className="size-5 text-[var(--alo-brand)]" />
        ALO Opportunity Graph
      </h1>
      <p className="mt-1 text-sm text-[var(--alo-body)]">
        Student ↔ country ↔ university ↔ course ↔ scholarship ↔ visa ↔ partner ↔ counselor, derived from
        live records.
        {generatedAt && studentId && (
          <span className="text-[var(--alo-text-muted)]">
            {' '}
            · {studentId} · generated {new Date(generatedAt).toLocaleString()}
          </span>
        )}
      </p>
    </div>
  );
}

function Lookup({
  studentId,
  setStudentId,
  load,
  busy,
}: {
  studentId: string;
  setStudentId: (value: string) => void;
  load: (id: string) => void;
  busy: boolean;
}) {
  return (
    <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
      <CardContent className="flex flex-wrap items-end gap-2 pt-5 pb-5">
        <div className="min-w-[260px] flex-1 space-y-1.5">
          <Label htmlFor="og-student" className="text-xs font-semibold">Student id</Label>
          <Input
            id="og-student"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="stu_…"
            className="h-9 font-mono text-xs"
          />
        </div>
        <Button size="sm" onClick={() => load(studentId)} disabled={busy}>
          <Search className="mr-1.5 size-3.5" />
          {busy ? 'Deriving…' : 'Derive graph'}
        </Button>
      </CardContent>
    </Card>
  );
}
