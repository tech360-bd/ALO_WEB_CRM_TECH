"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

/**
 * ScheduleButton — client component that dispatches the schedule-meeting
 * modal event. Must be a client component because it uses onClick.
 */
export function ScheduleButton({ className }: { className?: string }) {
  return (
    <Button
      className={className}
      onClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("alaminn:open-schedule-meeting"));
        }
      }}
    >
      <Calendar className="h-4 w-4 mr-1" /> Open Scheduler
    </Button>
  );
}
