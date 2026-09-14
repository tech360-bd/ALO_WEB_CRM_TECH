"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard } from "@/components/alo/shared";

export function CrmFollowups() {
  const [leads, setLeads] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"OVERDUE" | "TODAY" | "UPCOMING" | "ALL">("TODAY");

  React.useEffect(() => {
    fetch("/api/leads?status=CONTACTED")
      .then((r) => r.json())
      .then((d) => {
        setLeads(d.leads || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + 86400000);

  const bucketed = React.useMemo(() => {
    const overdue: any[] = [];
    const todays: any[] = [];
    const upcoming: any[] = [];
    for (const l of leads) {
      const followupDate = l.followUpDate ? startOfDay(new Date(l.followUpDate)) : null;
      if (!followupDate) continue;
      if (followupDate < today) overdue.push(l);
      else if (followupDate.getTime() === today.getTime()) todays.push(l);
      else if (followupDate >= tomorrow) upcoming.push(l);
    }
    return { overdue, todays, upcoming };
  }, [leads, today, tomorrow]);

  const visible =
    filter === "ALL"
      ? [...bucketed.overdue, ...bucketed.todays, ...bucketed.upcoming]
      : filter === "OVERDUE"
      ? bucketed.overdue
      : filter === "TODAY"
      ? bucketed.todays
      : bucketed.upcoming;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Follow-up Tracking"
        subtitle="Leads requiring follow-up — sorted by overdue, today, and upcoming"
        icon="CalendarClock"
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Overdue"
              value={bucketed.overdue.length}
              icon="AlertTriangle"
              accent="rose"
              hint="Action needed now"
            />
            <StatCard
              label="Due Today"
              value={bucketed.todays.length}
              icon="Clock"
              accent="orange"
            />
            <StatCard
              label="Upcoming"
              value={bucketed.upcoming.length}
              icon="Calendar"
              accent="blue"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { k: "OVERDUE", count: bucketed.overdue.length },
                { k: "TODAY", count: bucketed.todays.length },
                { k: "UPCOMING", count: bucketed.upcoming.length },
                { k: "ALL", count: leads.length },
              ] as const
            ).map((f) => (
              <Button
                key={f.k}
                size="sm"
                variant={filter === f.k ? "default" : "outline"}
                className={
                  filter === f.k
                    ? f.k === "OVERDUE"
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-[#0066CC] text-white"
                    : "border-[#DCE8F5] text-[#5A7299]"
                }
                onClick={() => setFilter(f.k)}
              >
                {f.k === "TODAY" ? "Today" : f.k.charAt(0) + f.k.slice(1).toLowerCase()}
                <Badge className="ml-2 bg-white/20 text-white">{f.count}</Badge>
              </Button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon="CalendarCheck"
              title="No follow-ups in this category"
              description="You're all caught up! Switch to another view to see more leads."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((l) => {
                const followupDate = l.followUpDate ? new Date(l.followUpDate) : null;
                const isOverdue = followupDate && followupDate < today;
                return (
                  <Card
                    key={l.id}
                    className={`rounded-2xl border bg-white ${
                      isOverdue ? "border-rose-200" : "border-[#DCE8F5]"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-[#0B2447]">{l.fullName}</h3>
                          <p className="text-xs text-[#5A7299]">{l.leadId}</p>
                        </div>
                        <Badge
                          className={
                            isOverdue
                              ? "bg-rose-100 text-rose-700"
                              : "bg-[#EAF3FF] text-[#0066CC]"
                          }
                        >
                          <Icon name="CalendarClock" className="mr-1 size-3" />
                          {followupDate
                            ? followupDate.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })
                            : "—"}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-1 text-sm">
                        {l.phone && (
                          <p className="text-[#5A7299]">
                            <Icon name="Phone" className="mr-1 inline size-3.5" />
                            {l.phone}
                          </p>
                        )}
                        {l.preferredCountry && (
                          <p className="text-[#5A7299]">
                            <Icon name="Globe" className="mr-1 inline size-3.5" />
                            {l.preferredCountry}
                          </p>
                        )}
                        {l.counselor && (
                          <p className="text-[#5A7299]">
                            <Icon name="UserCog" className="mr-1 inline size-3.5" />
                            {l.counselor.name || "Counselor"}
                          </p>
                        )}
                      </div>

                      {l.notes && (
                        <div className="mt-3 rounded-lg bg-[#F7FAFE] p-2 text-xs text-[#5A7299]">
                          {l.notes.slice(0, 120)}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
                        >
                          <Icon name="PhoneCall" className="mr-1 size-3.5" /> Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#F37021] text-[#F37021] hover:bg-[#FFF3EA]"
                        >
                          <Icon name="MessageSquare" className="mr-1 size-3.5" /> Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default CrmFollowups;
