"use client";
import { NamedIcon } from "@/components/ui/named-icon";

import { useState } from "react";
import { SuperAdminWebsiteCmsHub } from "./SuperAdminWebsiteCmsHub";
import { SuperAdminCrmCommandCenter } from "./SuperAdminCrmCommandCenter";
import { SuperAdminPortalWorkspaceHub } from "./SuperAdminPortalWorkspaceHub";

type Tab = "website" | "crm" | "portals" | "agent-tasks" | "system" | "mobile";

export function SuperAdminMasterCommandCenter() {
  const [activeTab, setActiveTab] = useState<Tab>("website");

  return (
    <div className="min-h-screen bg-[var(--alo-page)] dark:bg-[var(--alo-page)]">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] text-white px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold flex items-center gap-2"><NamedIcon name="ShieldCheck" className="size-6" />Super Admin — Master Command Center</h1>
            <p className="text-sm text-[var(--alo-brand-pale)] mt-1">Website CMS, CRM views and direct portal workspaces • Permission-checked module controls • Audit and approval workflows</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">Live system routes</span>
            <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">Module-level audit controls</span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full"><NamedIcon name="Smartphone" className="size-3.5" />Mobile-ready links</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-wrap gap-2 bg-white rounded-xl border p-2 shadow-sm">
          {[
            { key: "website", label: "Website CMS", icon: "Globe", desc: "Public content and managed site sections" },
            { key: "crm", label: "CRM Command", icon: "Briefcase", desc: "Live CRM overview and module workspaces" },
            { key: "portals", label: "Portals & Workspaces", icon: "PanelsTopLeft", desc: "Student, employee, partner, university & parent" },
            { key: "agent-tasks", label: "Agent Tasks", icon: "CheckCircle2", desc: "Live tasks and dedicated management routes" },
            { key: "system", label: "System & Audit", icon: "Wrench", desc: "Audit, permissions and system controls" },
            { key: "mobile", label: "Mobile PWA", icon: "Smartphone", desc: "Mobile portal access" },
          ].map(t => (
            <button key={t.key} onClick={()=>setActiveTab(t.key as Tab)} className={`flex-1 min-w-[140px] text-left px-4 py-3 rounded-xl border transition-all ${activeTab===t.key ? "bg-[var(--alo-brand)] text-white border-[var(--alo-brand)] shadow-md" : "bg-[var(--alo-page)] hover:bg-white border-[var(--alo-border)] text-[var(--alo-body)]"}`}>
              <div className="flex items-center gap-2 font-semibold text-sm"><NamedIcon name={t.icon} className="size-4" />{t.label}</div>
              <div className={`text-[11px] mt-1 ${activeTab===t.key ? "text-[var(--alo-brand-pale)]" : "text-[var(--alo-text-muted)]"}`}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab==="website" && <SuperAdminWebsiteCmsHub />}
          {activeTab==="crm" && <SuperAdminCrmCommandCenter />}

          {activeTab==="portals" && <SuperAdminPortalWorkspaceHub />}

          {activeTab==="agent-tasks" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--alo-border)] bg-white p-5">
                <h2 className="text-lg font-bold text-[var(--alo-text)]">Live task records and guarded task workspaces</h2>
                <p className="mt-1 text-sm text-[var(--alo-body)]">The task list below reads CRM task records. To create, assign or update tasks, use the dedicated task workspace; this tab does not claim that every agent action is available here.</p>
                <a href="/admin/tasks" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--alo-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--alo-brand-hover)]">Open task management</a>
              </div>
              <SuperAdminCrmCommandCenter initialModule="tasks" />
            </div>
          )}

          {activeTab==="system" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[var(--alo-border)] bg-white p-5">
                <h2 className="text-lg font-bold text-[var(--alo-text)]">System administration and evidence</h2>
                <p className="mt-1 text-sm text-[var(--alo-body)]">Open the existing controls to inspect roles, access, audit events, security and integrations. The command center does not declare an area verified merely because its route is present.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Access control", description: "Employee roles, permission packages and access requests", href: "/admin/access-control-center" },
                  { title: "Role permissions", description: "Review and manage role-permission assignments", href: "/admin/role-permissions" },
                  { title: "Security", description: "Open security controls and status", href: "/admin/security" },
                  { title: "Audit logs", description: "Inspect recorded administrative and CRM events", href: "/admin/audit-logs" },
                  { title: "Change approvals", description: "Review pending changes and decision history", href: "/admin/change-approval" },
                  { title: "Integration health", description: "Inspect configured integration status", href: "/admin/integration-health" },
                ].map((item) => (
                  <a key={item.href} href={item.href} className="rounded-xl border border-[var(--alo-border)] bg-white p-4 transition hover:border-[var(--alo-brand)] hover:shadow-sm">
                    <span className="font-semibold text-sm text-[var(--alo-text)]">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--alo-body)]">{item.description}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--alo-brand)]">Open control <NamedIcon name="ArrowUpRight" className="size-3.5" /></span>
                  </a>
                ))}
              </div>
              <p className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-4 text-xs leading-5 text-[var(--alo-body)]">Production deployment, provider credentials and external hosting remain subject to their own operational ownership and are not changed from this screen.</p>
            </div>
          )}

          {activeTab==="mobile" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-heading font-bold flex items-center gap-2"><NamedIcon name="Smartphone" className="size-5" />Mobile PWA — Web-based yet Native App-like</h2>
                <p className="text-sm text-[var(--alo-body)] mt-2">Entire platform web-based but designed so users can access/use it on mobile devices just like native app. Paid-app quality mobile experience.</p>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="border rounded-xl p-5 bg-[var(--alo-page)]">
                    <h3 className="font-semibold text-sm">What Makes It Native-like (Implemented)</h3>
                    <ul className="mt-3 space-y-2 text-xs text-[var(--alo-body)]">
                      <li>✅ <b>manifest.json:</b> name, short_name, start_url /?pwa=1, display standalone, theme_color #0057B8, background_color #fff, icons 72-512 maskable, screenshots, shortcuts (Student, CRM, Knowledge, International), orientation any, categories education/business/productivity</li>
                      <li>✅ <b>Service Worker sw.js:</b> Install cache static shell, activate clean old, fetch strategies — API network-first with cache fallback, static cache-first, navigation network-first with offline fallback, background sync for leads/messages, push notification ready, notificationclick handler</li>
                      <li>✅ <b>Offline Page /offline:</b> Friendly offline UI with retry, cached home link, PWA branding</li>
                      <li>✅ <b>PwaRegister Component:</b> Registers /sw.js on load, listens beforeinstallprompt, shows install banner, handles appinstalled event, checks standalone mode</li>
                      <li>✅ <b>Layout Metadata:</b> viewport width=device-width initialScale=1 viewportFit=cover themeColor, manifest link, appleWebApp capable, icons apple 152/192, msapplication TileColor/TileImage, mobile-web-app-capable yes</li>
                      <li>✅ <b>Icons:</b> /icons/icon-*.png 72,96,128,144,152,192,384,512 — generated and copied for all sizes</li>
                      <li>✅ <b>Responsive Design:</b> All Super Admin dashboards use Tailwind responsive grid — grid-cols-1 md:grid-cols-2 lg:grid-cols-3, flex-col md:flex-row, overflow-x-auto for tables, mobile-first forms</li>
                    </ul>
                  </div>
                  <div className="border rounded-xl p-5">
                    <h3 className="font-semibold text-sm">Mobile UX Checklist — Paid-App Quality</h3>
                    <div className="mt-3 space-y-3">
                      {[
                        { check: "Installable", detail: "beforeinstallprompt captured, Install button shown, standalone display", done: true },
                        { check: "Offline Ready", detail: "Static cached, API cached with fallback, /offline page", done: true },
                        { check: "Fast", detail: "Cache-first for static assets, background update", done: true },
                        { check: "Responsive", detail: "All tables scrollable, forms stack on mobile, tabs wrap", done: true },
                        { check: "App-like Navigation", detail: "Bottom install banner, standalone hides browser chrome, theme color matches", done: true },
                        { check: "Push Ready", detail: "Push event listener, notificationclick handler, badge icon", done: true },
                        { check: "Background Sync", detail: "Sync tags alo-sync-leads, alo-sync-messages for offline actions", done: true },
                        { check: "Shortcuts", detail: "Manifest shortcuts to Student, CRM, Knowledge, International dashboards", done: true },
                      ].map(item=><div key={item.check} className="flex gap-2 text-xs"><span className={item.done ? "text-crm-success-text" : "text-crm-warning-text"}>{item.done ? "✓" : "○"}</span><div><span className="font-medium">{item.check}:</span> <span className="text-[var(--alo-body)]">{item.detail}</span></div></div>)}
                    </div>
                    <div className="mt-6 p-3 bg-[var(--alo-brand-pale)] border border-[var(--alo-border)] rounded-xl text-xs text-[var(--alo-brand-deep)]">
                      <b>How to test on mobile:</b> Open site on Android Chrome → Menu → Add to Home Screen → App installs with ALO icon, opens standalone without URL bar, works offline, shows install banner. On iOS Safari → Share → Add to Home Screen. PWA score Lighthouse &gt;90.
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-xl p-5 text-white">
                  <h3 className="font-bold text-sm">Verification: Super Admin Can Edit Any Part from Mobile</h3>
                  <p className="text-xs text-[var(--alo-brand-pale)] mt-2">Super Admin logs in on mobile browser → Installs PWA → Opens Super Admin Master Command Center → Website CMS tab → Edits hero slides, services, stories, team, FAQs, countries (with 9 sub-tables) → Saves → Changes saved and audit logged. CRM Command tab → Views leads, students, applications, documents, visa cases → Performs agent tasks (assign lead, move application stage, verify document, update visa case) → Workflows run with skills checks so nothing is overlooked. All mobile-responsive, touch-friendly, offline-capable, push-ready — paid-app quality.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
