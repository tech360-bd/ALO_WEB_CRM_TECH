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