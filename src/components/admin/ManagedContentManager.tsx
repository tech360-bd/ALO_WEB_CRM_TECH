"use client";

// ═══════════════════════════════════════════════════════════════
// ManagedContentManager — Virtual Editor §15 extension
// ═══════════════════════════════════════════════════════════════
// Manages site-wide & CRM content types that live in the generic
// CmsManagedContent store: navigation, footer, seo-meta,
// announcements, banners, crm-labels, crm-templates, crm-widgets.
//
// Lifecycle is draft-first: new items start as drafts and only
// become public on Publish. Every change is revision-snapshotted
// (draft → preview → publish → rollback) and audit-logged.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

const MANAGED_TYPES = [
  { key: "navigation", label: "Navigation", icon: "🧭", desc: "Navbar destinations menu (section 'destinations')" },
  { key: "footer", label: "Footer", icon: "🦶", desc: "Footer link columns (destinations / quickLinks / companyLinks)" },
  { key: "seo-meta", label: "SEO Defaults", icon: "🔍", desc: "Site-wide title/description/canonical/OG (key 'site-defaults')" },
  { key: "announcement", label: "Announcements", icon: "📣", desc: "Dismissible info bar above the navbar" },
  { key: "banner", label: "Banners", icon: "🏷️", desc: "Persistent strip below the page" },
  { key: "crm-label", label: "CRM Labels", icon: "🏷", desc: "CRM UI label overrides (e.g. crm.kpi.myLeads)" },
  { key: "crm-template", label: "CRM Templates", icon: "✉️", desc: "Canned message templates for counselors" },
  { key: "crm-widget", label: "CRM Widgets", icon: "🧩", desc: "Dashboard widget toggles & ordering" },
];

interface ManagedItem {
  id: string;
  contentType: string;
  key: string;
  section: string;
  label: string;
  data: Record<string, unknown>;
  status: string;
  sortOrder: number;
  publishedAt?: string | null;
  publishedBy?: string | null;
  updatedAt?: string;
}

export function ManagedContentManager() {
  const [activeType, setActiveType] = useState("navigation");
  const [items, setItems] = useState<ManagedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ManagedItem | null>(null);
  const [form, setForm] = useState<{ key: string; section: string; label: string; sortOrder: number; data: Record<string, unknown> }>({ key: "", section: "", label: "", sortOrder: 0, data: {} });
  const [busy, setBusy] = useState(false);
  const [historyFor, setHistoryFor] = useState<ManagedItem | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/website/cms-managed?type=${activeType}`);
      const j = await res.json();
      if (j.success) setItems(j.items || []);
      else toast({ title: "Error", description: j.error, variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Fetch failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [activeType]);

  const openCreate = () => {
    setEditing(null);
    const defaults: Record<string, Record<string, unknown>> = {
      navigation: { href: "/" },
      footer: { href: "/" },
      "seo-meta": { title: "", description: "" },
      announcement: { message: "", level: "info" },
      banner: { message: "" },
      "crm-label": {},
      "crm-template": { body: "", channel: "whatsapp" },
      "crm-widget": { widgetKey: "", enabled: true },
    };
    const keyDefault = activeType === "seo-meta" ? "site-defaults" : "";
    const sectionDefault = activeType === "footer" ? "quickLinks" : activeType === "navigation" ? "destinations" : "";
    setForm({ key: keyDefault, section: sectionDefault, label: "", sortOrder: items.length, data: { ...(defaults[activeType] || {}) } });
    setShowForm(true);
  };

  const openEdit = (item: ManagedItem) => {
    setEditing(item);
    setForm({ key: item.key, section: item.section, label: item.label, sortOrder: item.sortOrder, data: { ...(item.data || {}) } });
    setShowForm(true);
  };

  const post = async (body: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/website/cms-managed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j.success) {
        toast({ title: "Done", description: okMsg });
        fetchItems();
        return true;
      }
      toast({ title: "Error", description: j.error, variant: "destructive" });
      return false;
    } catch (e: any) {
      toast({ title: "Request failed", description: e.message, variant: "destructive" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    const ok = await post(
      editing
        ? { action: "update", id: editing.id, ...form }
        : { action: "create", contentType: activeType, ...form },
      editing ? "Updated (revision snapshot kept)" : "Created as draft — publish when ready"
    );
    if (ok) setShowForm(false);
  };

  const openHistory = async (item: ManagedItem) => {
    setHistoryFor(item);
    try {
      const res = await fetch(`/api/admin/website/cms-managed?action=revisions&id=${item.id}`);
      const j = await res.json();
      if (j.success) setRevisions(j.revisions || []);
    } catch { setRevisions([]); }
  };

  const rollback = async (revisionId: string) => {
    if (!confirm("Roll back to this revision? The current state is itself snapshotted first, so the rollback is reversible.")) return;
    const ok = await post({ action: "rollback", revisionId, id: historyFor?.id }, "Rolled back");
    if (ok) { openHistory(historyFor!); fetchItems(); }
  };

  // per-type data fields
  const dataFields = () => {
    const d = form.data || {};
    const set = (k: string, v: unknown) => setForm({ ...form, data: { ...d, [k]: v } });
    const inp = (k: string, label: string, ph = "") => (
      <div><label className="text-xs font-medium">{label}</label>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={String(d[k] ?? "")} placeholder={ph} onChange={(e) => set(k, e.target.value)} /></div>
    );
    const area = (k: string, label: string, rows = 3) => (
      <div className="md:col-span-2"><label className="text-xs font-medium">{label}</label>
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={rows} value={String(d[k] ?? "")} onChange={(e) => set(k, e.target.value)} /></div>
    );
    switch (activeType) {
      case "navigation":
      case "footer":
        return <>{inp("href", "Link URL (href)", "/destinations/uk or https://…")}{area("note", "Internal note (optional)", 2)}</>;
      case "seo-meta":
        return <>{inp("title", "Meta title")}{inp("description", "Meta description")}{inp("canonical", "Canonical URL", "https://aloeducation…")}{inp("ogTitle", "OG title")}{inp("ogDescription", "OG description")}{inp("ogImage", "OG image URL")}{inp("ogImageAlt", "OG image alt text")}</>;
      case "announcement":
        return <>{area("message", "Message")}{inp("level", "Level (info | warning | urgent)")}{inp("href", "Optional link")}</>;
      case "banner":
        return <>{area("message", "Banner text")}{inp("href", "Optional link")}</>;
      case "crm-label":
        return <>{area("note", "Notes (optional)", 2)}<div className="md:col-span-2 text-xs text-[var(--alo-text-muted)]">The item <b>Key</b> below is the lookup id used by the CRM UI (e.g. <code>crm.kpi.myLeads</code>); <b>Label</b> is the display text.</div></>;
      case "crm-template":
        return <>{area("body", "Template body (supports {firstName}, {university} variables)", 5)}{inp("channel", "Channel (whatsapp | email | sms")}</>;
      case "crm-widget":
        return <>{inp("widgetKey", "Widget key (e.g. counselor.kpiCards)")}{inp("enabled", "Enabled (true/false)")}{area("config", "Widget config JSON (optional)", 3)}</>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--alo-text)]">Site-Wide &amp; CRM Content</h2>
          <p className="text-sm text-[var(--alo-body)] mt-1">Navigation, footer, SEO, announcements, banners and CRM content — draft → publish → rollback, fully revision-tracked.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white rounded-lg text-sm font-semibold">+ New {activeType}</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {MANAGED_TYPES.map((t) => (
          <button key={t.key} onClick={() => setActiveType(t.key)}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${activeType === t.key ? "bg-[var(--alo-brand)] text-white border-[var(--alo-brand)]" : "bg-white hover:bg-[var(--alo-page)] border-[var(--alo-border)]"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--alo-text-muted)]">{MANAGED_TYPES.find((t) => t.key === activeType)?.desc}</p>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--alo-page)] text-[var(--alo-body)] text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Label / Key</th>
              <th className="text-left px-4 py-2">Section</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Published</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--alo-text-muted)]">Loading…</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--alo-text-muted)]">No {activeType} items yet — create one. Nothing renders publicly until it is published.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-[var(--alo-page)]">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-[var(--alo-text)] truncate max-w-[240px]">{item.label || "(no label)"}</div>
                  <div className="text-xs text-[var(--alo-text-muted)] font-mono">{item.key || item.id.slice(0, 10)}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-[var(--alo-body)]">{item.section || "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-1 rounded-full ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{item.status}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-[var(--alo-text-muted)]">
                  {item.publishedAt ? (
                    <>by {item.publishedBy?.slice(0, 14) || "—"}<br />{new Date(item.publishedAt).toLocaleString()}</>
                  ) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right space-x-1 whitespace-nowrap">
                  <button onClick={() => openEdit(item)} className="px-2.5 py-1 bg-[var(--alo-brand-pale)] hover:bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] rounded-lg text-xs font-medium">Edit</button>
                  {item.status === "published" ? (
                    <button onClick={() => post({ action: "unpublish", id: item.id }, "Unpublished (back to draft)")} disabled={busy} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">Unpublish</button>
                  ) : (
                    <button onClick={() => post({ action: "publish", id: item.id }, "Published — now live")} disabled={busy} className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold">Publish</button>
                  )}
                  <button onClick={() => openHistory(item)} className="px-2.5 py-1 bg-[var(--alo-page)] hover:bg-[var(--alo-surface-muted)] text-[var(--alo-body)] rounded-lg text-xs font-medium">🕘 History</button>
                  <button onClick={() => { if (confirm("Delete this item? A revision snapshot is retained, so it can be restored from History.")) post({ action: "delete", id: item.id }, "Deleted (snapshot retained)"); }} disabled={busy} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-[var(--alo-text)]">{editing ? "Edit" : "New"} {activeType} {editing ? "(a revision snapshot is taken before saving)" : "(starts as draft)"}</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]">✕</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium">Key (stable id, e.g. crm.kpi.myLeads / site-defaults)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm font-mono" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} /></div>
                <div><label className="text-xs font-medium">Section (footer: destinations | quickLinks | companyLinks; nav: destinations)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></div>
                <div><label className="text-xs font-medium">Label (display text)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
                <div><label className="text-xs font-medium">Sort order</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} /></div>
                {dataFields()}
              </div>
              <p className="text-xs text-[var(--alo-text-muted)]">Content is sanitized automatically — scripts, event handlers and javascript: URLs are stripped.</p>
            </div>
            <div className="p-4 border-t bg-[var(--alo-page)] flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white border rounded-xl text-sm">Cancel</button>
              <button onClick={handleSave} disabled={busy} className="px-5 py-2 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] disabled:opacity-50 text-white rounded-xl text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--alo-text)]">Revision History — {historyFor.label || historyFor.key}</h3>
                <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">Every edit keeps a snapshot; rollbacks snapshot the current state first (reversible).</p>
              </div>
              <button onClick={() => setHistoryFor(null)} className="text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]">✕</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {revisions.length === 0 && <p className="text-sm text-[var(--alo-text-muted)] text-center py-8">No revisions yet.</p>}
              {revisions.map((rev) => (
                <div key={rev.id} className="border rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${rev.kind === "PUBLISHED" ? "bg-green-100 text-green-700" : rev.kind === "ROLLBACK" ? "bg-purple-100 text-purple-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}`}>{rev.kind}</span>
                      <span className="text-sm text-[var(--alo-text)] truncate">{rev.label || "—"}</span>
                    </div>
                    <div className="text-xs text-[var(--alo-text-muted)] mt-1">{new Date(rev.createdAt).toLocaleString()} · by {rev.createdBy?.slice(0, 18)}</div>
                  </div>
                  <button onClick={() => rollback(rev.id)} disabled={busy} className="px-3 py-1.5 bg-[var(--alo-brand-pale)] hover:bg-[var(--alo-brand-pale)] disabled:opacity-50 text-[var(--alo-brand)] rounded-lg text-xs font-semibold whitespace-nowrap">Rollback here</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
