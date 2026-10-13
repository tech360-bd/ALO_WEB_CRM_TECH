"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorState, EmptyState } from "@/components/admin/page-primitives";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";
import { Check, CheckCheck } from "lucide-react";

type Notification = {
  id: string; type: string; title: string; message: string;
  read: boolean; link: string | null; createdAt: string;
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const env = await adminFetch<Notification[]>("/api/v1/admin/notifications");
      setItems(env.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleRead(n: Notification) {
    try {
      await adminFetch(`/api/v1/admin/notifications/${n.id}`, {
        method: "PUT",
        body: JSON.stringify({ read: !n.read }),
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function markAllRead() {
    try {
      await adminFetch("/api/v1/admin/notifications", {
        method: "POST",
        body: JSON.stringify({ action: "markAllRead" }),
      });
      toast.success("All notifications marked as read.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    }
  }

  async function destroy(n: Notification) {
    try {
      await adminFetch(`/api/v1/admin/notifications/${n.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  if (loading) return <div><PageHeader title="Notifications" /><Skeleton className="h-64" /></div>;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="System and personal notifications"
        actions={<Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-1" /> Mark all read</Button>}
      />
      {items.length === 0 ? (
        <EmptyState message="No notifications." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-70" : ""}>
              <CardContent className="p-4 flex items-start gap-3">
                <Badge variant="outline" className="text-xs">{n.type}</Badge>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {!n.read && <Badge variant="default" className="text-[10px]">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{fmtDate(n.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => toggleRead(n)} title={n.read ? "Mark unread" : "Mark read"}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => destroy(n)}>×</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
