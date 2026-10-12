"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { fmtDate } from "@/lib/alo-types";

type TimelineEvent = {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  createdAt?: string;
  meta?: string;
};

export function StudentTimeline() {
  const { studentId } = useStudentId();

  const [events, setEvents] = React.useState<TimelineEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/timeline?studentId=${studentId}&take=50`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setEvents(d.events || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader title="My Timeline" subtitle="Complete history of your journey" icon="Clock" />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to view your activity timeline."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="My Timeline"
        subtitle="Complete history of your journey"
        icon="Clock"
      />
      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : events.length === 0 ? (
        <EmptyState
          icon="Clock"
          title="No events yet"
          description="Your timeline will appear as you progress."
        />
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-0.5 bg-[#DCE8F5]" />
          <div className="max-h-[40rem] space-y-4 overflow-y-auto pr-1">
            {events.map((e, i) => (
              <div key={e.id || i} className="relative flex gap-6 pl-12">
                <div className="absolute left-0 flex size-8 items-center justify-center rounded-full bg-[#0066CC] text-white">
                  <Icon name="Check" className="size-4" />
                </div>
                <Card className="flex-1 rounded-2xl border border-[#DCE8F5] bg-white">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0B2447]">{e.title}</p>
                        {e.description && (
                          <p className="text-sm text-[#5A7299]">{e.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        {e.type && (
                          <Badge variant="secondary" className={cn("capitalize")}>
                            {e.type.toLowerCase()}
                          </Badge>
                        )}
                        <p className="mt-1 text-xs text-[#5A7299]">
                          {e.createdAt ? fmtDate(e.createdAt) : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentTimeline;
