import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-badge whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-border",
        destructive:
          "bg-crm-danger-bg text-crm-danger-text border border-crm-danger/20",
        outline:
          "text-foreground border border-border bg-transparent",
        /* CRM Semantic Variants */
        success:
          "bg-crm-success-bg text-crm-success-text border border-crm-success/20",
        warning:
          "bg-crm-warning-bg text-crm-warning-text border border-crm-warning/30",
        danger:
          "bg-crm-danger-bg text-crm-danger-text border border-crm-danger/20",
        /* Brand Variants */
        brand:
          "bg-alo-brand-light text-alo-brand border border-alo-brand/20 dark:bg-alo-brand/10 dark:text-alo-brand dark:border-alo-brand/30",
        cta:
          "bg-alo-cta/10 text-alo-cta border border-alo-cta/20",
        /* Subtle */
        muted:
          "bg-muted text-muted-foreground border border-transparent",
        /* Compatibility aliases used by legacy CRM views. */
        info:
          "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
        blue:
          "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
        orange:
          "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
        neutral:
          "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        alo:
          "bg-alo-brand-light text-alo-brand border border-alo-brand/20 dark:bg-alo-brand/10 dark:text-alo-brand dark:border-alo-brand/30",
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