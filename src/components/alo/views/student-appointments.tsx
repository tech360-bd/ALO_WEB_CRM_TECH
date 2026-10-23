"use client";
import { useStudentId } from "@/hooks/use-student-id";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";

export function StudentAppointments() {
  const { studentId } = useStudentId();
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!studentId) return;
    fetch(`/api/student/appointments?studentId=${studentId}`)
      .then(r => r.json())
      .then(d => { setAppointments(d.appointments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Appointments" subtitle="Your scheduled sessions" icon="Calendar" />
      {loading ? (
        <div className="text-center text-[var(--alo-text-muted)]">Loading...</div>
      ) : appointments.length === 0 ? (
        <EmptyState icon="Calendar" title="No appointments" description="Your counselor will schedule sessions as needed." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((a) => (
            <Card key={a.id} className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                    <Icon name="Calendar" className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--alo-text)]">{a.title}</p>
                    <Badge variant="secondary">{a.type}</Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-[var(--alo-text-muted)]">
                    <Icon name="Clock" className="mr-1 inline size-3.5" />{a.scheduledAt}
                  </p>
                  {a.location && (
                    <p className="text-[var(--alo-text-muted)]">
                      <Icon name="MapPin" className="mr-1 inline size-3.5" />{a.location}
                    </p>
                  )}
                  <p className="text-[var(--alo-text-muted)]">Duration: {a.durationMinutes} min</p>
                </div>
                <Badge className={cn(
                  "mt-3",
                  a.status === "SCHEDULED" && "bg-emerald-100 text-emerald-700",
                  a.status === "CANCELLED" && "bg-rose-100 text-rose-700",
                  a.status !== "SCHEDULED" && a.status !== "CANCELLED" && "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"
                )}>
                  {a.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default StudentAppointments;
