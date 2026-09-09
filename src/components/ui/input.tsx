import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-all duration-150 outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-card dark:border-border",
        "aria-invalid:border-crm-danger aria-invalid:ring-crm-danger/20 dark:aria-invalid:ring-crm-danger/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }