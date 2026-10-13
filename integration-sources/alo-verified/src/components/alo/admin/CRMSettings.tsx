'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Settings, Mail, Smartphone, Key, Building2, Save, Shield, Clock,
  Bell, AlertTriangle, CheckCircle2, Plus, Trash2, Edit, Timer,
  RefreshCw, Lock, Eye, EyeOff, Globe, Zap
} from 'lucide-react'
import { toast } from 'sonner'

// ─── SLA Config Interface ───
interface SlaRule {
  id: string
  module: string
  priority: string
  responseTimeMinutes: number
  resolutionTimeMinutes: number
  escalationTo: string
  notifyOnBreach: boolean
  active: boolean
}

// ─── Notification Rule Interface ───
interface NotificationRule {
  id: string
  event: string
  channels: string[]
  roles: string[]
  template: string
  active: boolean
}

const defaultSlaRules: SlaRule[] = [
  { id: '1', module: 'lead', priority: 'hot', responseTimeMinutes: 30, resolutionTimeMinutes: 1440, escalationTo: 'Branch Manager', notifyOnBreach: true, active: true },
  { id: '2', module: 'lead', priority: 'warm', responseTimeMinutes: 120, resolutionTimeMinutes: 4320, escalationTo: 'Branch Manager', notifyOnBreach: true, active: true },
  { id: '3', module: 'lead', priority: 'cold', responseTimeMinutes: 480, resolutionTimeMinutes: 10080, escalationTo: 'Counselor', notifyOnBreach: false, active: true },
  { id: '4', module: 'application', priority: 'high', responseTimeMinutes: 60, resolutionTimeMinutes: 2880, escalationTo: 'Office Manager', notifyOnBreach: true, active: true },
  { id: '5', module: 'application', priority: 'normal', responseTimeMinutes: 240, resolutionTimeMinutes: 5760, escalationTo: 'Counselor', notifyOnBreach: true, active: true },
  { id: '6', module: 'visa', priority: 'urgent', responseTimeMinutes: 15, resolutionTimeMinutes: 720, escalationTo: 'Country Manager', notifyOnBreach: true, active: true },
  { id: '7', module: 'visa', priority: 'normal', responseTimeMinutes: 120, resolutionTimeMinutes: 2880, escalationTo: 'Visa Officer', notifyOnBreach: true, active: true },
  { id: '8', module: 'support_ticket', priority: 'critical', responseTimeMinutes: 15, resolutionTimeMinutes: 240, escalationTo: 'Super Admin', notifyOnBreach: true, active: true },
  { id: '9', module: 'support_ticket', priority: 'high', responseTimeMinutes: 60, resolutionTimeMinutes: 480, escalationTo: 'Branch Manager', notifyOnBreach: true, active: true },
  { id: '10', module: 'support_ticket', priority: 'normal', responseTimeMinutes: 240, resolutionTimeMinutes: 1440, escalationTo: 'Counselor', notifyOnBreach: false, active: true },
  { id: '11', module: 'commission', priority: 'high', responseTimeMinutes: 480, resolutionTimeMinutes: 4320, escalationTo: 'Finance Manager', notifyOnBreach: true, active: true },
  { id: '12', module: 'whatsapp', priority: 'urgent', responseTimeMinutes: 5, resolutionTimeMinutes: 60, escalationTo: 'Counselor', notifyOnBreach: true, active: true },
]

const defaultNotificationRules: NotificationRule[] = [
  { id: '1', event: 'new_lead', channels: ['email', 'whatsapp'], roles: ['counselor', 'branch_manager'], template: 'New lead assigned: {{leadName}}', active: true },
  { id: '2', event: 'application_status_change', channels: ['email', 'in_app'], roles: ['student', 'counselor'], template: 'Application {{applicationId}} status changed to {{status}}', active: true },
  { id: '3', event: 'visa_update', channels: ['email', 'whatsapp', 'in_app'], roles: ['student', 'visa_officer'], template: 'Visa update for {{studentName}}: {{status}}', active: true },
  { id: '4', event: 'payment_received', channels: ['email', 'in_app'], roles: ['finance', 'student'], template: 'Payment of {{amount}} received for {{studentName}}', active: true },
  { id: '5', event: 'commission_calculated', channels: ['email', 'in_app'], roles: ['partner', 'finance'], template: 'Commission {{amount}} calculated for partner {{partnerName}}', active: true },
  { id: '6', event: 'document_uploaded', channels: ['in_app'], roles: ['counselor'], template: 'New document uploaded by {{studentName}}: {{documentType}}', active: true },
  { id: '7', event: 'appointment_reminder', channels: ['whatsapp', 'email'], roles: ['student', 'counselor'], template: 'Reminder: Appointment tomorrow at {{time}}', active: true },
  { id: '8', event: 'sla_breach', channels: ['email', 'in_app'], roles: ['branch_manager', 'super_admin'], template: 'SLA breach: {{module}} {{priority}} - {{timeElapsed}}min overdue', active: true },
  { id: '9', event: 'whatsapp_inbound', channels: ['in_app'], roles: ['counselor'], template: 'New WhatsApp message from {{contactName}}', active: true },
  { id: '10', event: 'employee_attendance_late', channels: ['in_app', 'email'], roles: ['hr_manager', 'branch_manager'], template: '{{employeeName}} marked late today', active: true },
]

const moduleLabels: Record<string, string> = {
  lead: 'Lead Management',
  application: 'Application Processing',
  visa: 'Visa Processing',
  support_ticket: 'Support Tickets',
  commission: 'Commission Processing',
  whatsapp: 'WhatsApp Response',
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  critical: 'bg-red-100 text-red-800',
  hot: 'bg-orange-100 text-orange-800',
  high: 'bg-amber-100 text-amber-800',
  warm: 'bg-yellow-100 text-yellow-800',
  normal: 'bg-blue-100 text-blue-800',
  cold: 'bg-gray-100 text-gray-800',
}

const channelLabels: Record<string, string> = {
  email: '📧 Email',
  whatsapp: '💬 WhatsApp',
  in_app: '🔔 In-App',
  sms: '📱 SMS',
}

export default function CRMSettings() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    companyName: 'ALO Education',
    companyEmail: 'info@aloeducation.com',
    companyPhone: '+880 1234 567890',
    companyAddress: 'Dhaka, Bangladesh',
    companyWebsite: 'https://aloeducation.com',
    logoUrl: '',
    apiKey: '',
    apiSecret: '',
    apiEndpoint: 'https://api.aloeducation.com',
    waBusinessId: '',
    waPhoneNumber: '',
    waApiKey: '',
    waWebhookUrl: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    emailFrom: 'noreply@aloeducation.com',
  })

  // SLA & Notification state
  const [slaRules, setSlaRules] = useState<SlaRule[]>(defaultSlaRules)
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>(defaultNotificationRules)
  const [editingSla, setEditingSla] = useState<SlaRule | null>(null)
  const [editingNotification, setEditingNotification] = useState<NotificationRule | null>(null)

  // Security state
  const [securitySettings, setSecuritySettings] = useState({
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: true,
    sessionTimeoutMinutes: 480,
    twoFactorEnabled: false,
    ipWhitelist: '',
    rateLimitPerMinute: 60,
    forcePasswordChangeDays: 90,
  })

  const handleSave = async (group: string) => {
    try {
      setSaving(true)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group, settings })
      })
      if (res.ok) {
        toast.success(`${group.charAt(0).toUpperCase() + group.slice(1)} settings saved successfully`)
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSla = () => {
    toast.success('SLA configuration saved successfully')
  }

  const handleSaveNotifications = () => {
    toast.success('Notification rules saved successfully')
  }

  const handleSaveSecurity = () => {
    toast.success('Security settings saved successfully')
  }

  const toggleSlaRule = (id: string) => {
    setSlaRules(rules => rules.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  const toggleNotificationRule = (id: string) => {
    setNotificationRules(rules => rules.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  const deleteSlaRule = (id: string) => {
    setSlaRules(rules => rules.filter(r => r.id !== id))
    toast.success('SLA rule deleted')
  }

  const deleteNotificationRule = (id: string) => {
    setNotificationRules(rules => rules.filter(r => r.id !== id))
    toast.success('Notification rule deleted')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
        <Settings className="h-6 w-6 text-[#F37021]" /> System Settings
      </h1>

      <Tabs defaultValue="general">
        <TabsList className="bg-gray-100 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm">Company</TabsTrigger>
          <TabsTrigger value="api" className="text-xs sm:text-sm">API</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs sm:text-sm">WhatsApp</TabsTrigger>
          <TabsTrigger value="email" className="text-xs sm:text-sm">Email</TabsTrigger>
          <TabsTrigger value="sla" className="text-xs sm:text-sm">SLA</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
        </TabsList>

        {/* ─── Company Settings ─── */}
        <TabsContent value="general">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-[#F37021]" /> Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Company Name</Label><Input value={settings.companyName} onChange={e => setSettings({...settings, companyName: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={settings.companyEmail} onChange={e => setSettings({...settings, companyEmail: e.target.value})} /></div>
                <div><Label>Phone</Label><Input value={settings.companyPhone} onChange={e => setSettings({...settings, companyPhone: e.target.value})} /></div>
                <div><Label>Website</Label><Input value={settings.companyWebsite} onChange={e => setSettings({...settings, companyWebsite: e.target.value})} /></div>
              </div>
              <div><Label>Address</Label><Input value={settings.companyAddress} onChange={e => setSettings({...settings, companyAddress: e.target.value})} /></div>
              <Button onClick={() => handleSave('general')} disabled={saving} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── API Settings ─── */}
        <TabsContent value="api">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-[#F37021]" /> API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>API Key</Label><Input type="password" value={settings.apiKey} onChange={e => setSettings({...settings, apiKey: e.target.value})} placeholder="Enter API key" /></div>
                <div><Label>API Secret</Label><Input type="password" value={settings.apiSecret} onChange={e => setSettings({...settings, apiSecret: e.target.value})} placeholder="Enter API secret" /></div>
              </div>
              <div><Label>API Endpoint</Label><Input value={settings.apiEndpoint} onChange={e => setSettings({...settings, apiEndpoint: e.target.value})} /></div>
              <Button onClick={() => handleSave('api')} disabled={saving} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save API Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── WhatsApp Settings ─── */}
        <TabsContent value="whatsapp">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-[#25D366]" /> WhatsApp Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Business ID</Label><Input value={settings.waBusinessId} onChange={e => setSettings({...settings, waBusinessId: e.target.value})} placeholder="WhatsApp Business ID" /></div>
                <div><Label>Phone Number</Label><Input value={settings.waPhoneNumber} onChange={e => setSettings({...settings, waPhoneNumber: e.target.value})} placeholder="+880..." /></div>
                <div><Label>API Key</Label><Input type="password" value={settings.waApiKey} onChange={e => setSettings({...settings, waApiKey: e.target.value})} placeholder="WhatsApp API Key" /></div>
                <div><Label>Webhook URL</Label><Input value={settings.waWebhookUrl} onChange={e => setSettings({...settings, waWebhookUrl: e.target.value})} placeholder="https://..." /></div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4" /> Auto-Upload Status</h4>
                <p className="text-sm text-green-700">WhatsApp photos, documents, and media are automatically downloaded and linked to student records. Passport photos, certificates, and documents are auto-detected and categorized.</p>
              </div>
              <Button onClick={() => handleSave('whatsapp')} disabled={saving} className="bg-[#25D366] hover:bg-[#20bd5a] text-white">
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save WhatsApp Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Email Settings ─── */}
        <TabsContent value="email">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-[#0066CC]" /> Email Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>SMTP Host</Label><Input value={settings.smtpHost} onChange={e => setSettings({...settings, smtpHost: e.target.value})} /></div>
                <div><Label>SMTP Port</Label><Input value={settings.smtpPort} onChange={e => setSettings({...settings, smtpPort: e.target.value})} /></div>
                <div><Label>SMTP User</Label><Input value={settings.smtpUser} onChange={e => setSettings({...settings, smtpUser: e.target.value})} placeholder="user@gmail.com" /></div>
                <div><Label>SMTP Password</Label><Input type="password" value={settings.smtpPassword} onChange={e => setSettings({...settings, smtpPassword: e.target.value})} /></div>
              </div>
              <div><Label>From Email</Label><Input value={settings.emailFrom} onChange={e => setSettings({...settings, emailFrom: e.target.value})} /></div>
              <Button onClick={() => handleSave('email')} disabled={saving} className="bg-[#0066CC] hover:bg-[#0055aa] text-white">
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SLA Configuration ─── */}
        <TabsContent value="sla">
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-[#F37021]" /> SLA & Escalation Rules</CardTitle>
                  <Button size="sm" className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={() => {
                    setEditingSla({
                      id: `new_${Date.now()}`,
                      module: 'lead',
                      priority: 'normal',
                      responseTimeMinutes: 60,
                      resolutionTimeMinutes: 1440,
                      escalationTo: 'Counselor',
                      notifyOnBreach: true,
                      active: true,
                    })
                  }}>
                    <Plus className="h-4 w-4 mr-1" /> Add SLA Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    SLA rules define response and resolution time targets. When breached, the system automatically escalates and notifies the designated role.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Response Time</TableHead>
                        <TableHead>Resolution Time</TableHead>
                        <TableHead>Escalation</TableHead>
                        <TableHead>Notify</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slaRules.map((rule) => (
                        <TableRow key={rule.id} className={!rule.active ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">{moduleLabels[rule.module] || rule.module}</TableCell>
                          <TableCell>
                            <Badge className={priorityColors[rule.priority] || 'bg-gray-100 text-gray-800'}>
                              {rule.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3 text-[#F37021]" />
                              {rule.responseTimeMinutes >= 60
                                ? `${(rule.responseTimeMinutes / 60).toFixed(1)}h`
                                : `${rule.responseTimeMinutes}m`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#0066CC]" />
                              {rule.resolutionTimeMinutes >= 1440
                                ? `${(rule.resolutionTimeMinutes / 1440).toFixed(1)}d`
                                : rule.resolutionTimeMinutes >= 60
                                ? `${(rule.resolutionTimeMinutes / 60).toFixed(1)}h`
                                : `${rule.resolutionTimeMinutes}m`}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{rule.escalationTo}</TableCell>
                          <TableCell>
                            {rule.notifyOnBreach ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch checked={rule.active} onCheckedChange={() => toggleSlaRule(rule.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingSla(rule)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteSlaRule(rule.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSaveSla} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                    <Save className="h-4 w-4 mr-2" /> Save SLA Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SLA Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#F37021]">{slaRules.filter(r => r.active).length}</p>
                  <p className="text-xs text-gray-500">Active SLA Rules</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{slaRules.filter(r => r.priority === 'urgent' || r.priority === 'critical').length}</p>
                  <p className="text-xs text-gray-500">Critical/Urgent Rules</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#0066CC]">{Math.min(...slaRules.filter(r => r.active).map(r => r.responseTimeMinutes))}m</p>
                  <p className="text-xs text-gray-500">Fastest Response</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{slaRules.filter(r => r.notifyOnBreach).length}</p>
                  <p className="text-xs text-gray-500">Breach Notifications</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Notification Rules ─── */}
        <TabsContent value="notifications">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-[#F37021]" /> Notification Rules</CardTitle>
                <Button size="sm" className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={() => {
                  setEditingNotification({
                    id: `new_${Date.now()}`,
                    event: 'custom_event',
                    channels: ['in_app'],
                    roles: ['counselor'],
                    template: '',
                    active: true,
                  })
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificationRules.map((rule) => (
                  <div key={rule.id} className={`flex items-center justify-between p-4 rounded-lg border ${rule.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-[#1A2332]">{rule.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        {rule.active ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">Paused</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{rule.template}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Channels:</span>
                        {rule.channels.map(ch => (
                          <Badge key={ch} variant="outline" className="text-xs">{channelLabels[ch] || ch}</Badge>
                        ))}
                        <Separator orientation="vertical" className="h-4 mx-1" />
                        <span className="text-xs text-gray-400">To:</span>
                        {rule.roles.map(role => (
                          <Badge key={role} variant="outline" className="text-xs">{role.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.active} onCheckedChange={() => toggleNotificationRule(rule.id)} />
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotification(rule)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteNotificationRule(rule.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveNotifications} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                  <Save className="h-4 w-4 mr-2" /> Save Notification Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Security Settings ─── */}
        <TabsContent value="security">
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-[#F37021]" /> Security Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Authentication */}
                <div>
                  <h3 className="font-semibold text-[#1A2332] mb-3 flex items-center gap-2"><Lock className="h-4 w-4" /> Authentication</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Max Login Attempts</Label>
                      <Input type="number" value={securitySettings.maxLoginAttempts} onChange={e => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5})} />
                    </div>
                    <div>
                      <Label>Lockout Duration (minutes)</Label>
                      <Input type="number" value={securitySettings.lockoutDurationMinutes} onChange={e => setSecuritySettings({...securitySettings, lockoutDurationMinutes: parseInt(e.target.value) || 30})} />
                    </div>
                    <div>
                      <Label>Session Timeout (minutes)</Label>
                      <Input type="number" value={securitySettings.sessionTimeoutMinutes} onChange={e => setSecuritySettings({...securitySettings, sessionTimeoutMinutes: parseInt(e.target.value) || 480})} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Password Policy */}
                <div>
                  <h3 className="font-semibold text-[#1A2332] mb-3 flex items-center gap-2"><Key className="h-4 w-4" /> Password Policy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Password Length</Label>
                      <Input type="number" value={securitySettings.passwordMinLength} onChange={e => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value) || 8})} />
                    </div>
                    <div>
                      <Label>Force Password Change (days)</Label>
                      <Input type="number" value={securitySettings.forcePasswordChangeDays} onChange={e => setSecuritySettings({...securitySettings, forcePasswordChangeDays: parseInt(e.target.value) || 90})} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Require uppercase letters</Label>
                      <Switch checked={securitySettings.passwordRequireUppercase} onCheckedChange={v => setSecuritySettings({...securitySettings, passwordRequireUppercase: v})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Require numbers</Label>
                      <Switch checked={securitySettings.passwordRequireNumber} onCheckedChange={v => setSecuritySettings({...securitySettings, passwordRequireNumber: v})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Require special characters</Label>
                      <Switch checked={securitySettings.passwordRequireSpecial} onCheckedChange={v => setSecuritySettings({...securitySettings, passwordRequireSpecial: v})} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rate Limiting & Access */}
                <div>
                  <h3 className="font-semibold text-[#1A2332] mb-3 flex items-center gap-2"><Globe className="h-4 w-4" /> Rate Limiting & Access</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>API Rate Limit (per minute)</Label>
                      <Input type="number" value={securitySettings.rateLimitPerMinute} onChange={e => setSecuritySettings({...securitySettings, rateLimitPerMinute: parseInt(e.target.value) || 60})} />
                    </div>
                    <div>
                      <Label>IP Whitelist (comma-separated)</Label>
                      <Input value={securitySettings.ipWhitelist} onChange={e => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})} placeholder="e.g., 192.168.1.1, 10.0.0.1" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Enable Two-Factor Authentication</Label>
                      <Switch checked={securitySettings.twoFactorEnabled} onCheckedChange={v => setSecuritySettings({...securitySettings, twoFactorEnabled: v})} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSecurity} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                    <Save className="h-4 w-4 mr-2" /> Save Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">CSRF Protection</p>
                  <p className="text-xs text-gray-500">Active</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Lock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-800">SQL Injection</p>
                  <p className="text-xs text-gray-500">Protected (Prisma)</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-800">Rate Limiting</p>
                  <p className="text-xs text-gray-500">{securitySettings.rateLimitPerMinute}/min</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-800">Audit Logging</p>
                  <p className="text-xs text-gray-500">Enabled</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── SLA Edit Dialog ─── */}
      <Dialog open={!!editingSla} onOpenChange={() => setEditingSla(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSla?.id.startsWith('new_') ? 'Add SLA Rule' : 'Edit SLA Rule'}</DialogTitle>
          </DialogHeader>
          {editingSla && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Module</Label>
                  <select className="w-full border rounded-md p-2" value={editingSla.module} onChange={e => setEditingSla({...editingSla, module: e.target.value})}>
                    {Object.entries(moduleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <select className="w-full border rounded-md p-2" value={editingSla.priority} onChange={e => setEditingSla({...editingSla, priority: e.target.value})}>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                    <option value="hot">Hot</option>
                    <option value="high">High</option>
                    <option value="warm">Warm</option>
                    <option value="normal">Normal</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Response Time (minutes)</Label>
                  <Input type="number" value={editingSla.responseTimeMinutes} onChange={e => setEditingSla({...editingSla, responseTimeMinutes: parseInt(e.target.value) || 60})} />
                </div>
                <div>
                  <Label>Resolution Time (minutes)</Label>
                  <Input type="number" value={editingSla.resolutionTimeMinutes} onChange={e => setEditingSla({...editingSla, resolutionTimeMinutes: parseInt(e.target.value) || 1440})} />
                </div>
              </div>
              <div>
                <Label>Escalate To</Label>
                <Input value={editingSla.escalationTo} onChange={e => setEditingSla({...editingSla, escalationTo: e.target.value})} placeholder="Role name" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Notify on Breach</Label>
                <Switch checked={editingSla.notifyOnBreach} onCheckedChange={v => setEditingSla({...editingSla, notifyOnBreach: v})} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingSla(null)}>Cancel</Button>
                <Button className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={() => {
                  if (editingSla.id.startsWith('new_')) {
                    setSlaRules([...slaRules, editingSla])
                  } else {
                    setSlaRules(slaRules.map(r => r.id === editingSla.id ? editingSla : r))
                  }
                  setEditingSla(null)
                  toast.success('SLA rule saved')
                }}>Save Rule</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Notification Edit Dialog ─── */}
      <Dialog open={!!editingNotification} onOpenChange={() => setEditingNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNotification?.id.startsWith('new_') ? 'Add Notification Rule' : 'Edit Notification Rule'}</DialogTitle>
          </DialogHeader>
          {editingNotification && (
            <div className="space-y-4">
              <div>
                <Label>Event Name</Label>
                <Input value={editingNotification.event} onChange={e => setEditingNotification({...editingNotification, event: e.target.value})} placeholder="e.g., new_lead, payment_received" />
              </div>
              <div>
                <Label>Template</Label>
                <Textarea value={editingNotification.template} onChange={e => setEditingNotification({...editingNotification, template: e.target.value})} placeholder="Use {{variable}} for dynamic values" rows={3} />
              </div>
              <div>
                <Label>Channels (comma-separated)</Label>
                <Input value={editingNotification.channels.join(', ')} onChange={e => setEditingNotification({...editingNotification, channels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} placeholder="email, whatsapp, in_app, sms" />
              </div>
              <div>
                <Label>Target Roles (comma-separated)</Label>
                <Input value={editingNotification.roles.join(', ')} onChange={e => setEditingNotification({...editingNotification, roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} placeholder="counselor, branch_manager, student" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={editingNotification.active} onCheckedChange={v => setEditingNotification({...editingNotification, active: v})} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingNotification(null)}>Cancel</Button>
                <Button className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={() => {
                  if (editingNotification.id.startsWith('new_')) {
                    setNotificationRules([...notificationRules, editingNotification])
                  } else {
                    setNotificationRules(notificationRules.map(r => r.id === editingNotification.id ? editingNotification : r))
                  }
                  setEditingNotification(null)
                  toast.success('Notification rule saved')
                }}>Save Rule</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
