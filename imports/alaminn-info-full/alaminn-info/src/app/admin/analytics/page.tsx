"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorState, EmptyState } from "@/components/admin/page-primitives";
import { adminFetch } from "@/components/admin/lib";
import { BarChart3 } from "lucide-react";

type Analytics = {
  windowDays: number;
  totalEvents: number;
  topPages: { page: string | null; count: number }[];
  topSources: { source: string | null; count: number }[];
  topEvents: { event: string; count: number }[];
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const env = await adminFetch<Analytics>("/api/v1/admin/analytics?days=30");
        setData(env.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div><PageHeader title="Analytics" /><Skeleton className="h-96" /></div>;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState message="No analytics data." />;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={`Privacy-friendly, first-party analytics · last ${data.windowDays} days`}
      />

      <Card className="mb-6">
        <CardContent className="p-6 flex items-center gap-4">
          <BarChart3 className="h-10 w-10 text-primary" />
          <div>
            <p className="text-3xl font-bold">{data.totalEvents.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">total events in the last {data.windowDays} days</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? <EmptyState message="No page views yet." /> : (
              <ul className="space-y-2">
                {data.topPages.map((p, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="font-mono text-xs truncate">{p.page || "/"}</span>
                    <span className="font-semibold ml-2">{p.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            {data.topSources.length === 0 ? <EmptyState message="No UTMs recorded." /> : (
              <ul className="space-y-2">
                {data.topSources.map((s, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-xs">{s.source || "(direct)"}</span>
                    <span className="font-semibold">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Event Types</CardTitle></CardHeader>
          <CardContent>
            {data.topEvents.length === 0 ? <EmptyState message="No events yet." /> : (
              <ul className="space-y-2">
                {data.topEvents.map((e, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="font-mono text-xs">{e.event}</span>
                    <span className="font-semibold">{e.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
