import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * ALO Education Badge
 *
 * Variants:
 *   default     → primary blue
 *   secondary   → muted surface
 *   destructive  → danger red
 *   outline      → bordered
 *   success / warning / info / danger → semantic statuses
 *   blue / orange → brand colors
 *   neutral      → neutral slate
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--alo-blue)] text-white [a&]:hover:bg-[var(--alo-blue-hover)]",
        secondary:
          "border-transparent bg-[var(--alo-surface-muted)] text-[var(--alo-text)] [a&]:hover:bg-[var(--alo-border)]",
        destructive:
          "border-transparent bg-[var(--alo-danger)] text-white [a&]:hover:bg-[var(--alo-danger-strong)]",
        outline:
          "text-[var(--alo-text)] border-[var(--alo-border)] [a&]:hover:bg-[var(--alo-surface-muted)]",
        success:
          "border-[var(--alo-success)] bg-[var(--alo-success-soft)] text-[var(--alo-success-strong)]",
        warning:
          "border-[var(--alo-warning)] bg-[var(--alo-warning-soft)] text-[var(--alo-warning-strong)]",
        info:
          "border-[var(--alo-info)] bg-[var(--alo-info-soft)] text-[var(--alo-info-strong)]",
        danger:
          "border-[var(--alo-danger)] bg-[var(--alo-danger-soft)] text-[var(--alo-danger-strong)]",
        blue:
          "border-[var(--alo-blue)] bg-[var(--alo-blue-soft)] text-[var(--alo-blue-strong)]",
        orange:
          "border-[var(--alo-orange)] bg-[var(--alo-orange-soft)] text-[var(--alo-orange-strong)]",
        neutral:
          "border-[var(--alo-border)] bg-[var(--alo-surface-muted)] text-[var(--alo-text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
