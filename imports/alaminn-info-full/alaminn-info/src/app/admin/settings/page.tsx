"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorState } from "@/components/admin/page-primitives";
import { adminFetch } from "@/components/admin/lib";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

type Settings = Record<string, string>;

const FIELDS = [
  { key: "site.url", label: "Site URL" },
  { key: "site.name", label: "Site Name" },
  { key: "site.tagline", label: "Tagline" },
  { key: "email.from", label: "From Email" },
  { key: "email.replyTo", label: "Reply-To" },
  { key: "smtp.host", label: "SMTP Host" },
  { key: "smtp.port", label: "SMTP Port" },
  { key: "smtp.user", label: "SMTP User" },
  { key: "smtp.pass", label: "SMTP Password" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const env = await adminFetch<Settings>("/api/v1/admin/settings");
        setSettings(env.data);
        setMaintenanceMode(env.data["maintenance.enabled"] === "true");
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
      const payload = { ...settings, "maintenance.enabled": maintenanceMode ? "true" : "false" };
      await adminFetch("/api/v1/admin/settings", { method: "PUT", body: JSON.stringify(payload) });
      toast.success("Settings saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function testEmail() {
    setTestingEmail(true);
    try {
      const res = await fetch("/api/v1/admin/settings/test-email", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as {
        success: boolean;
        message: string;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.message || `HTTP ${res.status}`);
      }
      // The endpoint returns a friendly message whether or not a transport
      // is configured — surface it verbatim so the admin sees the
      // "Set SMTP_* env vars" hint when applicable.
      toast.success(json.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test email failed.");
    } finally {
      setTestingEmail(false);
    }
  }

  if (loading) return <div><PageHeader title="Settings" /><Skeleton className="h-96" /></div>;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title="Site Settings"
        subtitle="Global configuration, email setup and maintenance mode"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Site</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {FIELDS.filter(f => f.key.startsWith("site.")).map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input id={f.key} value={settings[f.key] || ""} onChange={(e) => setSettings((s) => ({ ...s, [f.key]: e.target.value }))} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Email (SMTP)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {FIELDS.filter(f => f.key.startsWith("email.") || f.key.startsWith("smtp.")).map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type={f.key.includes("pass") ? "password" : "text"}
                  value={settings[f.key] || ""}
                  onChange={(e) => setSettings((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={testEmail} disabled={testingEmail}>
              {testingEmail ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Send Test Email
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Maintenance Mode</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance mode</p>
              <p className="text-sm text-muted-foreground">When enabled, public visitors see a maintenance page. Admins can still log in.</p>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
