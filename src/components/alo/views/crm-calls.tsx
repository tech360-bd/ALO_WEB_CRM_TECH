"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard } from "@/components/alo/shared";

export function CrmCalls() {
  const [calls, setCalls] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/inbox/unified?channel=CALL")
      .then((r) => r.json())
      .then((d) => {
        // Treat PHONE_CALL channel and any CALL records as calls.
        const conversations = d.conversations || [];
        const flat: any[] = [];
        for (const c of conversations) {
          for (const m of c.messages || []) {
            flat.push({
              ...m,
              conversation: c,
              duration: Math.floor((m.body?.length || 0) / 8) || 0,
            });
          }
        }
        setCalls(flat.length ? flat : conversations);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalCalls = calls.length;
  const inbound = calls.filter(
    (c) => c.direction === "INBOUND"
  ).length;
  const outbound = calls.filter(
    (c) => c.direction === "OUTBOUND"
  ).length;
  const totalDuration = calls.reduce((s, c) => s + (c.duration || 0), 0);
  const avgDuration = totalCalls ? Math.round(totalDuration / totalCalls) : 0;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Call Logs"
        subtitle="Inbound and outbound call history with notes and recordings"
        icon="PhoneCall"
      />

      {loading ? (
        <div className="text-center text-[var(--alo-text-muted)]">Loading...</div>
      ) : totalCalls === 0 ? (
        <EmptyState
          icon="PhoneCall"
          title="No call logs"
          description="Inbound and outbound calls will be logged here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Calls"
              value={totalCalls}
              icon="PhoneCall"
              accent="blue"
            />
            <StatCard label="Inbound" value={inbound} icon="PhoneIncoming" accent="emerald" />
            <StatCard label="Outbound" value={outbound} icon="PhoneOutgoing" accent="orange" />
            <StatCard
              label="Avg Duration"
              value={formatDuration(avgDuration)}
              icon="Clock"
              accent="violet"
            />
          </div>

          <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
            <CardContent className="p-0">
              <div className="border-b border-[var(--alo-brand-border)] px-5 py-4">
                <h3 className="font-bold text-[var(--alo-text)]">Call History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--alo-page)] text-left text-[var(--alo-text-muted)]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Contact</th>
                      <th className="px-5 py-3 font-medium">Direction</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Duration</th>
                      <th className="px-5 py-3 font-medium">Notes</th>
                      <th className="px-5 py-3 font-medium">When</th>
                      <th className="px-5 py-3 font-medium">AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--alo-brand-border)]">
                    {calls.slice(0, 30).map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-[var(--alo-page)]">
                        <td className="px-5 py-3 font-medium text-[var(--alo-text)]">
                          {c.conversation?.studentName || c.fromName || "Unknown"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            className={
                              c.direction === "OUTBOUND"
                                ? "bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]"
                                : "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"
                            }
                          >
                            <Icon
                              name={
                                c.direction === "OUTBOUND" ? "PhoneOutgoing" : "PhoneIncoming"
                              }
                              className="mr-1 size-3"
                            />
                            {c.direction || "INBOUND"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-[var(--alo-text-muted)]">
                          {c.fromPhone || c.toPhone || "—"}
                        </td>
                        <td className="px-5 py-3 text-[var(--alo-text-muted)]">
                          {c.duration ? formatDuration(c.duration) : "—"}
                        </td>
                        <td className="px-5 py-3 text-[var(--alo-text-muted)]">
                          {c.body?.slice(0, 60) || "—"}
                        </td>
                        <td className="px-5 py-3 text-[var(--alo-text-muted)]">
                          {c.receivedAt
                            ? new Date(c.receivedAt).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          {c.aiAssisted ? (
                            <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">
                              <Icon name="Sparkles" className="mr-1 size-3" /> AI
                            </Badge>
                          ) : (
                            <span className="text-[var(--alo-text-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
export default CrmCalls;
