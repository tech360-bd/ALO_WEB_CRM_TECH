"use client";
import { useStudentId } from "@/hooks/use-student-id";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard } from "@/components/alo/shared";

const TYPE_LABELS: Record<string, string> = {
  CONSULTATION: "Consultation",
  FOLLOW_UP: "Follow-up",
  VISA_PREP: "Visa Prep",
  INTERVIEW_PRACTICE: "Interview Practice",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-[#EAF3FF] text-[#0066CC]",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  NO_SHOW: "bg-amber-100 text-amber-700",
};

export function CrmAppointments() {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/student/appointments?studentId=")
      .then((r) => r.json())
      .then((d) => {
        setAppointments(d.appointments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.scheduledAt) >= now && a.status === "SCHEDULED"
  );
  const past = appointments.filter((a) => new Date(a.scheduledAt) < now);
  const todayCount = appointments.filter(
    (a) =>
      new Date(a.scheduledAt).toDateString() === now.toDateString() &&
      a.status === "SCHEDULED"
  ).length;

  // Group upcoming by date
  const byDate: Record<string, any[]> = {};
  for (const a of upcoming) {
    const key = new Date(a.scheduledAt).toDateString();
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(a);
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Appointment Calendar"
        subtitle="View upcoming and past appointments with students and counselors"
        icon="CalendarDays"
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="CalendarDays"
          title="No appointments"
          description="Appointments scheduled by counselors will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard
              label="Today"
              value={todayCount}
              icon="CalendarClock"
              accent="orange"
            />
            <StatCard
              label="Upcoming"
              value={upcoming.length}
              icon="CalendarPlus"
              accent="blue"
            />
            <StatCard
              label="Completed"
              value={past.filter((a) => a.status === "COMPLETED").length}
              icon="CheckCircle2"
              accent="emerald"
            />
            <StatCard
              label="Cancelled / No-show"
              value={past.filter((a) => ["CANCELLED", "NO_SHOW"].includes(a.status)).length}
              icon="XCircle"
              accent="rose"
            />
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-bold text-[#0B2447]">
                Upcoming Appointments
              </h3>
              <div className="space-y-4">
                {Object.entries(byDate).map(([dateKey, list]) => {
                  const d = new Date(dateKey);
                  const isToday = d.toDateString() === now.toDateString();
                  return (
                    <div key={dateKey}>
                      <div className="mb-2 flex items-center gap-2">
                        <div
                          className={`flex size-9 items-center justify-center rounded-lg text-sm font-bold ${
                            isToday
                              ? "bg-[#F37021] text-white"
                              : "bg-[#EAF3FF] text-[#0066CC]"
                          }`}
                        >
                          {d.getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0B2447]">
                            {d.toLocaleDateString("en-GB", {
                              weekday: "long",
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          {isToday && (
                            <p className="text-xs font-medium text-[#F37021]">Today</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {list.map((a) => (
                          <Card
                            key={a.id}
                            className="rounded-2xl border border-[#DCE8F5] bg-white"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-[#0B2447]">{a.title}</p>
                                  <p className="text-xs text-[#5A7299]">
                                    {new Date(a.scheduledAt).toLocaleTimeString("en-GB", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    • {a.durationMinutes} min
                                  </p>
                                </div>
                                <Badge className={STATUS_COLORS[a.status]}>
                                  {a.status}
                                </Badge>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-[#0066CC]">
                                  {TYPE_LABELS[a.type] || a.type}
                                </Badge>
                                {a.location && (
                                  <span className="text-[#5A7299]">
                                    <Icon
                                      name={a.location === "online" ? "Video" : "MapPin"}
                                      className="mr-1 inline size-3"
                                    />
                                    {a.location}
                                  </span>
                                )}
                              </div>
                              {a.notes && (
                                <p className="mt-2 line-clamp-2 text-xs text-[#5A7299]">
                                  {a.notes}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-bold text-[#0B2447]">Past Appointments</h3>
              <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F7FAFE] text-left text-[#5A7299]">
                        <tr>
                          <th className="px-5 py-3 font-medium">Title</th>
                          <th className="px-5 py-3 font-medium">Type</th>
                          <th className="px-5 py-3 font-medium">Date</th>
                          <th className="px-5 py-3 font-medium">Location</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE8F5]">
                        {past.slice(0, 15).map((a) => (
                          <tr key={a.id} className="hover:bg-[#F7FAFE]">
                            <td className="px-5 py-3 font-medium text-[#0B2447]">{a.title}</td>
                            <td className="px-5 py-3 text-[#5A7299]">
                              {TYPE_LABELS[a.type] || a.type}
                            </td>
                            <td className="px-5 py-3 text-[#5A7299]">
                              {new Date(a.scheduledAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-5 py-3 text-[#5A7299]">{a.location || "—"}</td>
                            <td className="px-5 py-3">
                              <Badge className={STATUS_COLORS[a.status] || "bg-slate-100"}>
                                {a.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
