"use client";

/**
 * TabsClient — client wrapper around shadcn Tabs that syncs the active
 * tab to the URL `?tab=` param. Used by Scholarships, PhD Research and
 * Compare pages to share a tabbed sub-navigation.
 */
import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabsClientItem {
  value: string;
  label: string;
  /** Optional count badge shown after the label. */
  count?: number;
  content: React.ReactNode;
}

export interface TabsClientProps {
  items: TabsClientItem[];
  defaultValue?: string;
  paramName?: string;
  className?: string;
  listClassName?: string;
}

/**
 * Render a Tabs control whose active state is synced to the URL.
 */
export function TabsClient({
  items,
  defaultValue,
  paramName = "tab",
  className,
  listClassName,
}: TabsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentValue =
    searchParams?.get(paramName) ??
    defaultValue ??
    items[0]?.value ??
    "";

  const onValueChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (!next || next === defaultValue || next === items[0]?.value) {
        params.delete(paramName);
      } else {
        params.set(paramName, next);
      }
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, paramName, defaultValue, items],
  );

  return (
    <Tabs
      value={currentValue}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsList
        className={cn(
          "h-auto flex-wrap bg-ink-100/60 p-1",
          listClassName,
        )}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-soft"
          >
            {item.label}
            {typeof item.count === "number" && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {item.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-5">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
