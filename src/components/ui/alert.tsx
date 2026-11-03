import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Shared feedback surface (Master §13 / §14). Semantic variants use the exact
 * status tints from the token layer; the icon, title and description carry the
 * meaning so colour is never the only channel. Existing `default` and
 * `destructive` usages keep working unchanged.
 */
const alertVariants = cva(
  "relative w-full rounded-[14px] border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "bg-card text-alo-text border-border [&>svg]:text-alo-brand",
        destructive:
          "bg-crm-danger-bg text-crm-danger-text border-crm-danger-border *:data-[slot=alert-description]:text-crm-danger-text/90",
        success:
          "bg-crm-success-bg text-crm-success-text border-crm-success-border *:data-[slot=alert-description]:text-crm-success-text/90",
        warning:
          "bg-crm-warning-bg text-crm-warning-text border-crm-warning-border *:data-[slot=alert-description]:text-crm-warning-text/90",
        info:
          "bg-alo-info-bg text-alo-info-text border-alo-info-border *:data-[slot=alert-description]:text-alo-info-text/90",
        neutral:
          "bg-crm-neutral-bg text-crm-neutral-text border-crm-neutral-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
