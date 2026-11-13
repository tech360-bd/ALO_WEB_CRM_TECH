import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Inbox,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared visual language for loading / empty / success / warning / error
 * states (Master §14 + §19). Rendered from one component so public pages,
 * CRM screens and portals never drift into different state treatments.
 *
 * Colour is never the only channel: every state carries an icon, a text
 * title and a description or action. No data is invented here.
 */
export type StateTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<
  StateTone,
  { Icon: React.ElementType; iconWrap: string; feedback: string }
> = {
  neutral: {
    Icon: Info,
    iconWrap: "bg-[var(--crm-neutral-bg)] text-[var(--crm-neutral-text)]",
    feedback: "alo-ds-feedback-info",
  },
  info: {
    Icon: Info,
    iconWrap: "bg-[var(--alo-info-bg)] text-[var(--alo-info-text)]",
    feedback: "alo-ds-feedback-info",
  },
  success: {
    Icon: CheckCircle2,
    iconWrap: "bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]",
    feedback: "alo-ds-feedback-success",
  },
  warning: {
    Icon: AlertTriangle,
    iconWrap: "bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]",
    feedback: "alo-ds-feedback-warning",
  },
  danger: {
    Icon: XCircle,
    iconWrap: "bg-[var(--crm-danger-bg)] text-[var(--crm-danger-text)]",
    feedback: "alo-ds-feedback-danger",
  },
};

export interface StatePanelProps extends React.ComponentProps<"div"> {
  title: string;
  description?: React.ReactNode;
  tone?: StateTone;
  /** Overrides the tone's default icon; pass `null` for no icon. */
  icon?: React.ReactNode | null;
  actions?: React.ReactNode;
  /** A spinner replaces the icon; the surrounding dimensions stay fixed. */
  loading?: boolean;
  /** Inline feedback row instead of the large centred panel. */
  inline?: boolean;
}

function StatePanel({
  title,
  description,
  tone = "neutral",
  icon,
  actions,
  loading = false,
  inline = false,
  className,
  children,
  ...props
}: StatePanelProps) {
  const { Icon, iconWrap, feedback } = TONES[tone];

  if (inline) {
    return (
      <div
        role={tone === "danger" ? "alert" : "status"}
        data-slot="state-feedback"
        className={cn("alo-ds-feedback", feedback, className)}
        {...props}
      >
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {description ? <p className="mt-0.5 font-normal">{description}</p> : null}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="state-panel"
      className={cn("alo-ds-state", className)}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="alo-ds-state-icon bg-[var(--alo-brand-light)]"
        >
          <span className="alo-ds-spinner" />
        </span>
      ) : icon === null ? null : (
        <span aria-hidden="true" className={cn("alo-ds-state-icon", iconWrap)}>
          {icon ?? <Icon className="size-7" />}
        </span>
      )}
      {loading ? (
        <h1 className="alo-ds-h3 mt-2">{title}</h1>
      ) : (
        <h1 className="alo-ds-page-h1 mt-2">{title}</h1>
      )}
      {description ? (
        <p className="alo-ds-body max-w-[52ch]">{description}</p>
      ) : null}
      {children}
      {actions ? <div className="mt-4 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}

/** Loading state — keeps a stable footprint and announces itself to AT. */
function LoadingState({ label = "Loading ALO Education…", className }: { label?: string; className?: string }) {
  return (
    <StatePanel
      tone="info"
      loading
      title={label}
      role="status"
      aria-live="polite"
      className={className}
    />
  );
}

/** Empty state — no invented metrics, no decorative badges. */
function EmptyState({
  title = "Nothing to show yet",
  description,
  actions,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <StatePanel
      tone="neutral"
      icon={<Inbox aria-hidden="true" className="size-7" />}
      title={title}
      description={description}
      actions={actions}
    />
  );
}

export { StatePanel, LoadingState, EmptyState };
