'use client';

import Link from 'next/link';
import { ArrowUpRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { SUPER_ADMIN_PORTAL_WORKSPACES } from '@/lib/super-admin/workspaces';
import { NamedIcon } from '@/components/ui/named-icon';

export function SuperAdminPortalWorkspaceHub() {
  return (
    <section className="space-y-5" aria-labelledby="portal-workspace-heading">
      <header className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[var(--alo-brand-pale)] p-2.5 text-[var(--alo-brand)]"><ShieldCheck className="size-5" /></div>
          <div>
            <h2 id="portal-workspace-heading" className="text-lg font-bold text-[var(--alo-text)]">Portal systems &amp; control workspaces</h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--alo-body)]">Open the existing editor or control center for each ALO website, CRM and portal system. Changes use that module’s normal validation, authorization and audit trail—this hub does not bypass tenant boundaries or expose a raw database editor.</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs text-[var(--alo-body)]">
          Portal links open the actual portal route and use the current account’s normal permissions. To act as another user, use the dedicated audited Acting-As workflow; portal preview links do not impersonate users.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SUPER_ADMIN_PORTAL_WORKSPACES.map((workspace) => (
          <article key={workspace.key} className="flex flex-col rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[var(--alo-brand-pale)] p-2.5 text-[var(--alo-brand)]"><NamedIcon name={workspace.icon} className="size-5" /></div>
              <div className="min-w-0">
                <h3 className="font-bold text-[var(--alo-text)]">{workspace.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--alo-body)]">{workspace.description}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.controls.map((control) => (
                <Link key={control.href} href={control.href} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--alo-border)] px-3 py-2 text-xs font-semibold text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--alo-brand)]">
                  {control.label}<ArrowUpRight className="size-3.5" />
                </Link>
              ))}
            </div>

            <div className="mt-auto border-t border-[var(--alo-border)] pt-4 mt-5">
              <Link href={workspace.previewHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--alo-body)] hover:text-[var(--alo-brand)]">
                <ExternalLink className="size-3.5" />{workspace.previewLabel}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
