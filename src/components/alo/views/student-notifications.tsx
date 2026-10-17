"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { fmtDate } from "@/lib/alo-types";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: string;
  title: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
  type?: string;
};

export function StudentNotifications() {
  const { toast } = useToast();
  const { studentId } = useStudentId();

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [marking, setMarking] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/student/notifications?studentId=${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setNotifications(d.notifications || []);
        setUnread(d.unread || 0);
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

  const markRead = async (id: string) => {
    setMarking(id);
    try {
      await fetch("/api/student/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
      toast({ title: "Marked as read" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setMarking(null);
    }
  };

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader title="Notifications" subtitle="Stay up to date with your application" icon="Bell" />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to see your notifications."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        icon="Bell"
      />
      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : notifications.length === 0 ? (
        <EmptyState icon="Bell" title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="max-h-[36rem] space-y-3 overflow-y-auto pr-1">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "rounded-2xl border bg-white transition-colors",
                n.isRead ? "border-[#DCE8F5]" : "border-[#0057B8]/30 bg-[#EAF3FF]/30"
              )}
            >
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      n.isRead ? "bg-slate-100 text-slate-500" : "bg-[#EAF3FF] text-[#0057B8]"
                    )}
                  >
                    <Icon name="Bell" className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B2447]">{n.title}</p>
                    {n.message && (
                      <p className="text-sm text-[#5A7299]">{n.message}</p>
                    )}
                    <p className="mt-1 text-xs text-[#5A7299]">
                      {n.createdAt ? fmtDate(n.createdAt) : ""}
                    </p>
                  </div>
                </div>
                {!n.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={marking === n.id}
                    onClick={() => markRead(n.id)}
                  >
                    {marking === n.id ? "..." : "Mark Read"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentNotifications;
