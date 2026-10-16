"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./shared";
import { fmtDate } from "@/lib/alo-types";

export function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.onClick ? (
            <button onClick={item.onClick} className="font-medium transition-colors hover:text-[#0057B8]">
              {item.label}
            </button>
          ) : (
            <span className={cn(i === items.length - 1 && "font-semibold text-[#0057B8]")}>{item.label}</span>
          )}
          {i < items.length - 1 && <Icon name="ChevronRight" className="size-3 shrink-0 text-muted-foreground/60" />}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function SourceVerification({ sourceUrl, lastVerifiedAt, verificationStatus }: { sourceUrl?: string | null; lastVerifiedAt?: string | Date | null; verificationStatus?: string }) {
  const statusColor: Record<string, string> = {
    VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NEEDS_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
    UNVERIFIED: "bg-slate-50 text-slate-600 border-slate-200",
  };
  const statusLabel: Record<string, string> = {
    VERIFIED: "Verified",
    NEEDS_REVIEW: "Needs review",
    UNVERIFIED: "Unverified",
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#0057B8]/10 bg-[#f7f9fc] px-4 py-3 text-xs">
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-semibold", statusColor[verificationStatus || "VERIFIED"])}>
        <Icon name="ShieldCheck" className="size-3" />
        {statusLabel[verificationStatus || "VERIFIED"]}
      </span>
      {lastVerifiedAt && (
        <span className="text-muted-foreground">
          Last verified: <span className="font-semibold text-foreground">{fmtDate(lastVerifiedAt)}</span>
        </span>
      )}
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 font-medium text-[#0057B8] hover:underline">
          <Icon name="ExternalLink" className="size-3" />
          Official source
        </a>
      )}
      <p className="w-full text-[11px] text-muted-foreground">
        Fees, visa rules, work rights, and deadlines can change. Always confirm with your ALO counselor before applying.
      </p>
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
      <Icon name="Info" className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}
