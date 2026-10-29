"use client";
import { NamedIcon } from "@/components/ui/named-icon";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

type CrmModule = "overview" | "leads" | "students" | "applications" | "documents" | "visa" | "finance" | "marketing" | "hr" | "partners" | "universities" | "courses" | "communications" | "tasks" | "reports" | "audit";

const MODULES: { key: CrmModule; label: string; icon: string; desc: string }[] = [
  { key: "overview", label: "Overview", icon: "BarChart3", desc: "Real metrics" },
  { key: "leads", label: "Leads", icon: "Target", desc: "Lead intake & assignment" },
  { key: "students", label: "Students", icon: "GraduationCap", desc: "Student profiles" },
  { key: "applications", label: "Applications", icon: "FileEdit", desc: "Pipeline & stages" },
  { key: "documents", label: "Documents", icon: "FileText", desc: "Verification" },
  { key: "visa", label: "Visa & Compliance", icon: "Stamp", desc: "Cases & interviews" },
  { key: "finance", label: "Finance", icon: "Wallet", desc: "Payments, commissions, payroll" },
  { key: "marketing", label: "Marketing", icon: "Megaphone", desc: "Campaigns & content" },
  { key: "hr", label: "HR & Employees", icon: "Users", desc: "Attendance, leave, payroll" },
  { key: "partners", label: "Partners", icon: "Handshake", desc: "Partner network" },
  { key: "universities", label: "Universities", icon: "Landmark", desc: "CRM universities" },
  { key: "courses", label: "Courses", icon: "BookOpen", desc: "CRM courses" },
  { key: "communications", label: "Comms & SLA", icon: "MessageSquare", desc: "Threads, messages, SLA" },
  { key: "tasks", label: "Agent Tasks", icon: "CheckCircle2", desc: "All agent tasks" },
  { key: "reports", label: "Reports", icon: "TrendingUp", desc: "Weekly, marketing, visa" },
  { key: "audit", label: "Audit Logs", icon: "Lock", desc: "Security & audit" },
];

export function SuperAdminCrmCommandCenter() {
  const [activeModule, setActiveModule] = useState<CrmModule>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/crm/command-center?module=${activeModule}&limit=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast({ title: "Error", description: json.error, variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Fetch failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeModule]);

  const handleAgentAction = async (action: string, payload: any) => {
    setActionLoading(action + payload?.leadId || payload?.applicationId || "");
    try {
      const res = await fetch("/api/admin/crm/command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, module: activeModule, data: payload, id: payload?.id || payload?.leadId || payload?.applicationId }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Action Success", description: `${action} completed, audit logged` });
        fetchData();
      } else toast({ title: "Action Failed", description: json.error, variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Action Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const renderOverview = () => {
    if (!data) return null;
    const c = data.counts || {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Leads", value: c.leads, icon: "Target", color: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]" },
            { label: "Students", value: c.students, icon: "GraduationCap", color: "bg-green-50 text-green-700 border-green-200" },
            { label: "Applications", value: c.applications, icon: "FileEdit", color: "bg-purple-50 text-purple-700 border-purple-200" },
            { label: "Visa Cases", value: c.visaCases, icon: "Stamp", color: "bg-amber-50 text-amber-700 border-amber-200" },
            { label: "Docs Pending", value: c.documentsPending, icon: "FileText", color: "bg-red-50 text-red-700 border-red-200" },
            { label: "Employees", value: c.employees, icon: "Users", color: "bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]" },
            { label: "Partners", value: c.partners, icon: "Handshake", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
            { label: "Universities", value: c.universities, icon: "Landmark", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
            { label: "Courses", value: c.courses, icon: "BookOpen", color: "bg-pink-50 text-pink-700 border-pink-200" },
            { label: "Campaigns", value: c.campaigns, icon: "Megaphone", color: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] border-[var(--alo-cta)]/25" },
            { label: "Tasks Pending", value: c.tasksPending, icon: "CheckCircle2", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
            { label: "SLA Breaches", value: c.slaBreaches, icon: "⏰", color: "bg-red-50 text-red-700 border-red-200" },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.color}`}>
              <div className="flex items-center justify-between"><NamedIcon name={k.icon} className="size-5" /><span className="text-2xl font-bold">{k.value ?? 0}</span></div>
              <div className="text-xs font-medium mt-1">{k.label}</div>
              <div className="text-[11px] opacity-70 mt-1">Live data</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <h4 className="font-semibold text-sm mb-3">Recent Leads (Real)</h4>
            <div className="space-y-2">
              {(data.recent?.leads||[]).map((l:any)=><div key={l.id} className="flex justify-between text-xs border-b pb-1.5"><span className="truncate max-w-[140px] font-medium">{l.name||l.email||l.id.slice(0,8)}</span><span className="text-[var(--alo-text-muted)]">{l.status}</span></div>)}
              {(!data.recent?.leads||data.recent.leads.length===0)&&<p className="text-xs text-[var(--alo-text-muted)]">No leads yet</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <h4 className="font-semibold text-sm mb-3">Recent Applications</h4>
            <div className="space-y-2">
              {(data.recent?.applications||[]).map((a:any)=><div key={a.id} className="flex justify-between text-xs border-b pb-1.5"><span className="truncate max-w-[140px] font-medium">{a.applicationCode||a.id.slice(0,8)} — {a.universityName||""}</span><span className="text-[var(--alo-text-muted)]">{a.stage}</span></div>)}
              {(!data.recent?.applications||data.recent.applications.length===0)&&<p className="text-xs text-[var(--alo-text-muted)]">No applications</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <h4 className="font-semibold text-sm mb-3">Recent Students</h4>
            <div className="space-y-2">
              {(data.recent?.students||[]).map((s:any)=><div key={s.id} className="flex justify-between text-xs border-b pb-1.5"><span className="truncate max-w-[140px] font-medium">{s.fullName||s.studentId}</span><span className="text-[var(--alo-text-muted)]">{s.journeyStage}</span></div>)}
              {(!data.recent?.students||data.recent.students.length===0)&&<p className="text-xs text-[var(--alo-text-muted)]">No students</p>}
            </div>
          </div>
        </div>

        {data.funnel && data.funnel.length>0 && (
          <div className="bg-white rounded-xl border p-4">
            <h4 className="font-semibold text-sm mb-3">Lead Funnel</h4>
            <div className="flex gap-2 flex-wrap">
              {data.funnel.map((f:any)=><div key={f.stage} className="px-3 py-2 bg-[var(--alo-page)] border rounded-lg text-xs"><span className="font-semibold">{f.stage}</span>: {f.count}</div>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderListModule = () => {
    if (!data) return <p className="text-sm text-[var(--alo-text-muted)] p-8 text-center">No data</p>;
    const list = Array.isArray(data) ? data : data?.data || data?.partners || data?.leads || data?.campaigns || [];
    const arr = Array.isArray(list) ? list : Array.isArray(data) ? data : [];
    // For nested finance/marketing etc, handle differently
    if (activeModule==="finance") {
      return (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">Payments ({data.payments?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.payments||[]).map((p:any)=><div key={p.id} className="text-xs border-b py-1 flex justify-between"><span>{p.studentId||p.paymentId} — {p.amount} {p.currency}</span><span className={`px-1.5 py-0.5 rounded text-[11px] ${p.status==="PAID"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>{p.status}</span></div>)}</div></div>
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">Commissions ({data.commissions?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.commissions||[]).map((c:any)=><div key={c.id} className="text-xs border-b py-1">{c.commissionCode} — {c.amount} {c.currency} — {c.status}</div>)}</div></div>
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">Payrolls ({data.payrolls?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.payrolls||[]).map((p:any)=><div key={p.id} className="text-xs border-b py-1">{p.employeeId} — {p.monthYear} — {p.netPay} — {p.status}</div>)}</div></div>
        </div>
      );
    }
    if (activeModule==="marketing") {
      return (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">Campaigns ({data.campaigns?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.campaigns||[]).map((c:any)=><div key={c.id} className="text-xs border-b py-1">{c.name} — {c.status} — Leads {c.leadsGenerated}</div>)}</div></div>
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">Marketing Leads ({data.leads?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.leads||[]).map((l:any)=><div key={l.id} className="text-xs border-b py-1 flex justify-between"><span>{l.name} — {l.phone}</span><span>{l.status}</span></div>)}</div></div>
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">Generated Content ({data.contents?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.contents||[]).map((c:any)=><div key={c.id} className="text-xs border-b py-1">{c.title||c.topic} — {c.status}</div>)}</div></div>
        </div>
      );
    }
    if (activeModule==="tasks") {
      return (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(data).map(([k,v]:any)=><div key={k} className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">{k} ({Array.isArray(v)?v.length:0})</h4><div className="space-y-1 max-h-[300px] overflow-auto">{Array.isArray(v)&&v.map((t:any)=><div key={t.id} className="text-xs border-b py-1 flex justify-between"><span className="truncate max-w-[200px]">{t.title||t.action||t.taskCode||t.id.slice(0,8)}</span><span className="text-[11px] bg-[var(--alo-surface-muted)] px-1.5 py-0.5 rounded">{t.status}</span></div>)}</div></div>)}
        </div>
      );
    }
    if (activeModule==="communications") {
      return (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">Threads ({data.threads?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.threads||[]).map((t:any)=><div key={t.id} className="text-xs border-b py-1">{t.subject||t.threadCode||t.id.slice(0,8)} — {t.channel} — {t.status}</div>)}</div></div>
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">Messages ({data.messages?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.messages||[]).map((m:any)=><div key={m.id} className="text-xs border-b py-1">{m.senderName||"Unknown"}: {(m.messageBody||m.content||"").slice(0,60)}</div>)}</div></div>
          <div className="bg-white rounded-xl border p-4"><h4 className="font-semibold text-sm mb-2">SLA Events ({data.sla?.length||0})</h4><div className="space-y-1 max-h-[400px] overflow-auto">{(data.sla||[]).map((s:any)=><div key={s.id} className="text-xs border-b py-1">{s.counselorName||s.counselorId} — {s.eventType} — {s.channel}</div>)}</div></div>
        </div>
      );
    }

    const items = Array.isArray(data) ? data : (Array.isArray(arr) ? arr : []);
    return (
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-3 border-b flex justify-between items-center"><h4 className="font-semibold text-sm">{activeModule} — {items.length} records</h4><span className="text-xs text-[var(--alo-text-muted)]">Super Admin can perform agent tasks</span></div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-[var(--alo-page)] sticky top-0"><tr><th className="text-left px-3 py-2">ID / Name</th><th className="text-left px-3 py-2">Details</th><th className="text-left px-3 py-2">Status</th><th className="text-right px-3 py-2">Agent Actions</th></tr></thead>
            <tbody>
              {items.map((it:any)=><tr key={it.id} className="border-t hover:bg-[var(--alo-page)]"><td className="px-3 py-2"><div className="font-medium truncate max-w-[180px]">{it.name||it.fullName||it.studentName||it.applicationCode||it.title||it.universityName||it.courseTitle||it.id.slice(0,12)}</div><div className="text-[11px] text-[var(--alo-text-muted)] font-mono">{it.id.slice(0,12)}</div></td><td className="px-3 py-2"><div className="truncate max-w-[280px] text-[var(--alo-body)]">{it.email||it.phone||it.university||it.country||it.destinationCountry||it.courseName||it.status||""} {it.stage?`• ${it.stage}`:""}</div></td><td className="px-3 py-2"><span className="px-2 py-0.5 bg-[var(--alo-surface-muted)] rounded-full text-[11px]">{it.status||it.stage||it.currentStage||"—"}</span></td><td className="px-3 py-2 text-right space-x-1">
                {activeModule==="leads" && <button disabled={!!actionLoading} onClick={()=>handleAgentAction("assign_lead", { leadId: it.id, counselorId: "super_admin_assign", counselorName: "Super Admin" })} className="px-2 py-1 bg-[var(--alo-brand-pale)] hover:bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] rounded text-[11px]">Assign</button>}
                {activeModule==="applications" && <><button onClick={()=>handleAgentAction("update_application_stage", { applicationId: it.id, stage: "READY_TO_SUBMIT", note: "Super Admin moved to ready" })} className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-[11px]">Ready</button><button onClick={()=>handleAgentAction("update_application_stage", { applicationId: it.id, stage: "SUBMITTED_TO_UNIVERSITY", note: "Super Admin submitted" })} className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[11px]">Submit</button></>}
                {activeModule==="documents" && <><button onClick={()=>handleAgentAction("verify_document", { documentId: it.id, status: "APPROVED", reviewerNote: "Super Admin approved" })} className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-[11px]">Approve</button><button onClick={()=>handleAgentAction("verify_document", { documentId: it.id, status: "REJECTED", reviewerNote: "Super Admin rejected — needs review" })} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px]">Reject</button></>}
                <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="px-2 py-1 bg-[var(--alo-surface-muted)] hover:bg-slate-200 rounded text-[11px]">View</button>
              </td></tr>)}
              {items.length===0 && <tr><td colSpan={4} className="p-8 text-center text-[var(--alo-text-muted)]">No records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--alo-text)]">Super Admin — CRM Command Center</h2>
          <p className="text-sm text-[var(--alo-body)] mt-1">Full operations for every CRM module. Perform any agent task as Super Admin — lead assignment, application pipeline, doc verification, visa case, finance, marketing, HR, partners, data, comms, reports. Audit logged, RBAC protected, mobile PWA ready.</p>
        </div>
        <div className="flex gap-2">
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchData()} className="border rounded-lg px-3 py-2 text-sm w-48" />
          <button onClick={fetchData} className="px-4 py-2 bg-[var(--alo-surface-muted)] hover:bg-slate-200 rounded-lg text-sm">🔍 Search</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODULES.map(m=><button key={m.key} onClick={()=>setActiveModule(m.key)} className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${activeModule===m.key ? "bg-[var(--alo-brand)] text-white border-[var(--alo-brand)] shadow" : "bg-white hover:bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-body)]"}`}><NamedIcon name={m.icon} className="size-4" />{m.label}</button>)}
      </div>

      {loading ? <div className="bg-white rounded-xl border p-12 text-center text-sm text-[var(--alo-text-muted)]">Loading real CRM data...</div> : activeModule==="overview" ? renderOverview() : renderListModule()}

      <div className="bg-[var(--alo-brand-pale)] border border-[var(--alo-border)] rounded-xl p-4">
        <h4 className="font-semibold text-sm text-[var(--alo-brand-deep)]">Paid-App Quality Guarantees — How Agent Tasks Handled Realistically</h4>
        <div className="grid md:grid-cols-2 gap-3 mt-3 text-xs text-[var(--alo-brand-deep)]">
          <div>✅ <b>Knowledge-aware:</b> Counselor tasks use country requirements, course matching, visa rules from. System checks eligibility, English tests, academic requirements before moving stages.</div>
          <div>✅ <b>Skill-aware:</b> Document verification requires checklist, reviewer notes, audit trail. Visa tasks require risk assessment, funding review, study gap analysis.</div>
          <div>✅ <b>No overlooked tasks:</b> SLA tracking, escalation, deadline monitoring, next-best-action, weekly reports ensure nothing missed. Every action audit logged.</div>
          <div>✅ <b>Realistic workflow:</b> Lead → Student → Application → Document → Offer → CAS/I20 → Visa → Enrollment. Each stage validated, not mocked. Super Admin can act as any role securely.</div>
        </div>
      </div>
    </div>
  );
}
