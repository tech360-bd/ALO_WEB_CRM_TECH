'use client'

import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon, Bell, Palette, Save, Mail, MessageSquare,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'

interface SettingsData {
  partner: {
    id: string
    companyName: string
    partnerId: string
    status: string
    commissionRate: number
  }
  notificationPreferences: {
    emailOnApplicationUpdate: boolean
    emailOnCommissionStatus: boolean
    weeklyDigest: boolean
    smsAlerts: boolean
  }
  branding: {
    primaryColor: string
    accentColor: string
    logoUrl: string | null
  }
}

export default function PartnerAdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean>>({})
  const [branding, setBranding] = useState({ primaryColor: '#0057B8', accentColor: '#E8501A', logoUrl: '' })

  useEffect(() => {
    const session = getSession()
    if (!session) return
    fetch('/api/partner-admin/company', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.error || `Request failed: ${r.status}`)
        }
        return r.json()
      })
      .then((d) => {
        setData(d)
        setPrefs({
          emailOnApplicationUpdate: d.notificationPreferences?.emailOnApplicationUpdate ?? true,
          emailOnCommissionStatus: d.notificationPreferences?.emailOnCommissionStatus ?? true,
          weeklyDigest: d.notificationPreferences?.weeklyDigest ?? true,
          smsAlerts: d.notificationPreferences?.smsAlerts ?? false,
        })
        if (d.branding) {
          setBranding({
            primaryColor: d.branding.primaryColor || '#0057B8',
            accentColor: d.branding.accentColor || '#E8501A',
            logoUrl: d.branding.logoUrl || '',
          })
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    const session = getSession()
    if (!session) return
    setSaving(true)
    try {
      const res = await fetch('/api/partner-admin/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ notificationPreferences: prefs, branding }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      toast.success('Settings saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Settings" description="Loading..." />
        <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Settings"
        description="Manage notification preferences and white-label branding for your portal."
        action={
          <Button onClick={handleSave} disabled={saving} className="h-12 bg-[#0057B8] hover:bg-[#004a9c] text-white">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      {/* Account summary */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#0073E6] flex items-center justify-center text-white font-bold">
            {data?.partner?.companyName?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'ALO'}
          </div>
          <div>
            <p className="font-bold text-slate-900">{data?.partner?.companyName}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{data?.partner?.partnerId}</Badge>
              <Badge className="bg-green-50 text-green-600 border-0 capitalize">{data?.partner?.status}</Badge>
              <Badge variant="outline" className="text-xs">{data?.partner?.commissionRate}% commission</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notification preferences */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Notification Preferences</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Application updates</p>
                  <p className="text-xs text-slate-500">Email when an application status changes</p>
                </div>
              </div>
              <Switch checked={!!prefs.emailOnApplicationUpdate} onCheckedChange={(v) => setPrefs({ ...prefs, emailOnApplicationUpdate: v })} />
            </label>
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Commission status</p>
                  <p className="text-xs text-slate-500">Email when commission is approved or paid</p>
                </div>
              </div>
              <Switch checked={!!prefs.emailOnCommissionStatus} onCheckedChange={(v) => setPrefs({ ...prefs, emailOnCommissionStatus: v })} />
            </label>
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Weekly digest</p>
                  <p className="text-xs text-slate-500">Summary email every Monday morning</p>
                </div>
              </div>
              <Switch checked={!!prefs.weeklyDigest} onCheckedChange={(v) => setPrefs({ ...prefs, weeklyDigest: v })} />
            </label>
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-slate-900">SMS alerts</p>
                  <p className="text-xs text-slate-500">Text alerts for urgent application changes (carrier fees apply)</p>
                </div>
              </div>
              <Switch checked={!!prefs.smsAlerts} onCheckedChange={(v) => setPrefs({ ...prefs, smsAlerts: v })} />
            </label>
          </div>
        </Card>

        {/* Branding */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-[#E8501A]" />
            <h3 className="font-bold text-slate-900">White-label Branding</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  id="primaryColor"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-12 w-16 rounded-md border border-slate-200 cursor-pointer"
                />
                <Input value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="h-12" />
              </div>
            </div>
            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  id="accentColor"
                  value={branding.accentColor}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="h-12 w-16 rounded-md border border-slate-200 cursor-pointer"
                />
                <Input value={branding.accentColor} onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })} className="h-12" />
              </div>
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={branding.logoUrl}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                className="h-12 mt-1"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-slate-500 mt-1">PNG/SVG recommended. Max 200×40px.</p>
            </div>

            {/* Preview */}
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-2">Live preview</p>
              <div className="flex items-center gap-2">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: branding.primaryColor }}
                >
                  ALO
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{data?.partner?.companyName}</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: branding.primaryColor }}>
                    Partner Portal
                  </p>
                </div>
                <Button
                  size="sm"
                  className="ml-auto h-9 text-white border-0"
                  style={{ background: branding.accentColor }}
                >
                  Action
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-0 shadow-sm bg-slate-50">
        <div className="flex items-start gap-3">
          <SettingsIcon className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">About your portal</p>
            <p className="text-xs text-slate-600 mt-1">
              The Partner Admin Portal supports up to 3 staff seats. Need more seats, custom integrations,
              or branded student-facing pages? Contact your ALO account manager to upgrade.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
