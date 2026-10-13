"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorState } from "@/components/admin/page-primitives";
import { adminFetch } from "@/components/admin/lib";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

type Settings = Record<string, string>;

const DEFAULT_KEYS = [
  { key: "seo.home.title", label: "Home — Meta Title", type: "text" },
  { key: "seo.home.description", label: "Home — Meta Description", type: "textarea" },
  { key: "seo.about.title", label: "About — Meta Title", type: "text" },
  { key: "seo.about.description", label: "About — Meta Description", type: "textarea" },
  { key: "seo.expertise.title", label: "Expertise — Meta Title", type: "text" },
  { key: "seo.projects.title", label: "Projects — Meta Title", type: "text" },
  { key: "seo.articles.title", label: "Articles — Meta Title", type: "text" },
  { key: "seo.contact.title", label: "Contact — Meta Title", type: "text" },
  { key: "robots.txt", label: "robots.txt content", type: "textarea" },
  { key: "sitemap.priority", label: "Sitemap default priority", type: "text" },
];

export default function AdminSeoPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const env = await adminFetch<Settings>("/api/v1/admin/seo");
        setSettings(env.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await adminFetch("/api/v1/admin/seo", { method: "PUT", body: JSON.stringify(settings) });
      toast.success("SEO settings saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div><PageHeader title="SEO" /><Skeleton className="h-96" /></div>;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title="SEO Management"
        subtitle="Per-page meta titles/descriptions, robots.txt and sitemap settings"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        }
      />
      <div className="grid gap-4">
        {DEFAULT_KEYS.map((k) => (
          <Card key={k.key}>
            <CardHeader><CardTitle className="text-sm">{k.label}</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor={k.key} className="sr-only">{k.label}</Label>
              {k.type === "textarea" ? (
                <Textarea
                  id={k.key}
                  rows={3}
                  value={settings[k.key] || ""}
                  onChange={(e) => setSettings((s) => ({ ...s, [k.key]: e.target.value }))}
                />
              ) : (
                <Input
                  id={k.key}
                  value={settings[k.key] || ""}
                  onChange={(e) => setSettings((s) => ({ ...s, [k.key]: e.target.value }))}
                />
              )}
              <div className="text-xs text-muted-foreground mt-1 font-mono">{k.key}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
