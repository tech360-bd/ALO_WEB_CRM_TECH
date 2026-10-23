import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-6 items-center justify-center rounded-pill px-2.5 text-badge whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-border",
        destructive:
          "bg-crm-danger-bg text-crm-danger-text border border-crm-danger-border",
        outline:
          "text-foreground border border-border bg-transparent",
        /* CRM Semantic Variants */
        success:
          "bg-crm-success-bg text-crm-success-text border border-crm-success-border",
        warning:
          "bg-crm-warning-bg text-crm-warning-text border border-crm-warning-border",
        danger:
          "bg-crm-danger-bg text-crm-danger-text border border-crm-danger-border",
        /* Brand Variants */
        brand:
          "bg-alo-brand-light text-alo-brand border border-alo-brand/20 dark:bg-alo-brand/10 dark:text-alo-brand dark:border-alo-brand/30",
        cta:
          "bg-alo-cta/10 text-alo-cta border border-alo-cta/20",
        /* AI / automation only */
        ai:
          "bg-alo-ai-soft text-alo-ai border border-alo-ai/20",
        /* Subtle */
        muted:
          "bg-muted text-muted-foreground border border-transparent",
        /* Compatibility aliases used by legacy CRM views. */
        /* Information: pale-blue background, deep brand-blue text, light-blue border. */
        info:
          "bg-alo-info-bg text-alo-info-text border border-alo-info-border",
        blue:
          "bg-alo-info-bg text-alo-info-text border border-alo-info-border",
        orange:
          "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] border border-[var(--alo-cta)]/25 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
        /* Neutral (Master §13): #F1F5F9 bg · #475569 text · #E2E8F0 border */
        neutral:
          "bg-crm-neutral-bg text-crm-neutral-text border border-crm-neutral-border",
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