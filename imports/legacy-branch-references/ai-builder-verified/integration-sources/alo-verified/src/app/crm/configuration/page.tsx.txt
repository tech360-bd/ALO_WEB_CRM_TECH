'use client'

import { useState } from 'react'
import {
  Clock,
  Bell,
  Workflow,
  ListPlus,
  Plus,
  Pencil,
  Trash2,
  Save,
  Settings as SettingsIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SlaRule {
  id: string
  module: string
  responseTime: string
  resolutionTime: string
  escalation: string
}

interface NotificationRule {
  id: string
  trigger: string
  channel: string
  template: string
  recipients: string
  enabled: boolean
}

interface CustomField {
  id: string
  entity: string
  fieldName: string
  fieldType: string
  required: boolean
}

const initialSla: SlaRule[] = [
  { id: '1', module: 'Lead — New', responseTime: '15 minutes', resolutionTime: '24 hours', escalation: 'Counselor → Manager' },
  { id: '2', module: 'Lead — Hot', responseTime: '10 minutes', resolutionTime: '12 hours', escalation: 'Counselor → Manager' },
  { id: '3', module: 'Application — Submit', responseTime: '2 hours', resolutionTime: '5 days', escalation: 'Counselor → Operations' },
  { id: '4', module: 'Application — Under Review', responseTime: '24 hours', resolutionTime: '30 days', escalation: 'Operations → Director' },
  { id: '5', module: 'Visa — Document Submission', responseTime: '4 hours', resolutionTime: '7 days', escalation: 'Visa Officer → Manager' },
  { id: '6', module: 'Commission Claim', responseTime: '1 day', resolutionTime: '14 days', escalation: 'Finance → Director' },
  { id: '7', module: 'WhatsApp — Inbound', responseTime: '5 minutes', resolutionTime: '4 hours', escalation: 'Agent → Supervisor' },
  { id: '8', module: 'Support Ticket — High Priority', responseTime: '30 minutes', resolutionTime: '48 hours', escalation: 'Support → Manager' },
]

const initialNotifications: NotificationRule[] = [
  { id: '1', trigger: 'New Lead Created', channel: 'Email + WhatsApp', template: 'lead-welcome', recipients: 'Counselor, Manager', enabled: true },
  { id: '2', trigger: 'Application Status Changed', channel: 'Email', template: 'app-status-update', recipients: 'Student, Counselor, Partner', enabled: true },
  { id: '3', trigger: 'Offer Letter Received', channel: 'Email + SMS', template: 'offer-received', recipients: 'Student, Counselor', enabled: true },
  { id: '4', trigger: 'Visa Decision', channel: 'Email + WhatsApp + SMS', template: 'visa-decision', recipients: 'Student, Counselor, Partner', enabled: true },
  { id: '5', trigger: 'Commission Approved', channel: 'Email', template: 'commission-approved', recipients: 'Partner, Finance', enabled: true },
  { id: '6', trigger: 'Document Uploaded', channel: 'In-app', template: 'doc-uploaded', recipients: 'Counselor', enabled: true },
  { id: '7', trigger: 'Payment Received', channel: 'Email + WhatsApp', template: 'payment-receipt', recipients: 'Student, Finance', enabled: true },
  { id: '8', trigger: 'Task Due in 24h', channel: 'In-app + Email', template: 'task-due-soon', recipients: 'Assignee', enabled: false },
  { id: '9', trigger: 'SLA Breach', channel: 'Email', template: 'sla-breach', recipients: 'Manager, Director', enabled: true },
  { id: '10', trigger: 'Birthday', channel: 'Email + WhatsApp', template: 'birthday-wish', recipients: 'Student', enabled: false },
]

const initialCustomFields: CustomField[] = [
  { id: '1', entity: 'Student', fieldName: 'guardian_occupation', fieldType: 'text', required: false },
  { id: '2', entity: 'Student', fieldName: 'family_income', fieldType: 'number', required: false },
  { id: '3', entity: 'Lead', fieldName: 'marketing_channel', fieldType: 'select', required: true },
  { id: '4', entity: 'Application', fieldName: 'scholarship_applied', fieldType: 'boolean', required: false },
  { id: '5', entity: 'Partner', fieldName: 'tax_id', fieldType: 'text', required: true },
]

export default function ConfigurationPage() {
  const [sla, setSla] = useState(initialSla)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [customFields, setCustomFields] = useState(initialCustomFields)
  const [workflow, setWorkflow] = useState({
    autoAssignLeads: true,
    requireDocReview: true,
    autoNotifyPartner: true,
    escalateOverdue: true,
    autoCreateStudentFromLead: false,
    approvalMatrix: true,
  })
  const [addSlaOpen, setAddSlaOpen] = useState(false)
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [newSla, setNewSla] = useState({ module: '', responseTime: '', resolutionTime: '', escalation: '' })
  const [newField, setNewField] = useState({ entity: 'Student', fieldName: '', fieldType: 'text', required: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration"
        description="SLA rules, notification templates, workflow settings, and custom fields — all in one place."
        action={
          <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => toast.success('All configuration saved')}>
            <Save className="h-4 w-4 mr-2" /> Save All
          </Button>
        }
      />

      <Tabs defaultValue="sla">
        <div className="overflow-x-auto">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto flex flex-nowrap">
            <TabsTrigger value="sla" className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs">
              <Clock className="h-3.5 w-3.5 mr-1.5" /> SLA Configuration
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs">
              <Bell className="h-3.5 w-3.5 mr-1.5" /> Notification Rules
            </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs">
              <Workflow className="h-3.5 w-3.5 mr-1.5" /> Workflow Settings
            </TabsTrigger>
            <TabsTrigger value="fields" className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs">
              <ListPlus className="h-3.5 w-3.5 mr-1.5" /> Custom Fields
            </TabsTrigger>
          </TabsList>
        </div>

        {/* SLA */}
        <TabsContent value="sla">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0057B8]" />
                <h3 className="font-bold text-slate-900">SLA Rules</h3>
                <Badge className="bg-slate-100 text-slate-600 border-0">{sla.length} rules</Badge>
              </div>
              <Dialog open={addSlaOpen} onOpenChange={setAddSlaOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add SLA Rule</DialogTitle></DialogHeader>
                  <div className="space-y-3 py-2">
                    <div><Label className="text-xs">Module *</Label><Input value={newSla.module} onChange={(e) => setNewSla({ ...newSla, module: e.target.value })} placeholder="e.g. Lead — New" /></div>
                    <div><Label className="text-xs">Response Time</Label><Input value={newSla.responseTime} onChange={(e) => setNewSla({ ...newSla, responseTime: e.target.value })} placeholder="e.g. 15 minutes" /></div>
                    <div><Label className="text-xs">Resolution Time</Label><Input value={newSla.resolutionTime} onChange={(e) => setNewSla({ ...newSla, resolutionTime: e.target.value })} placeholder="e.g. 24 hours" /></div>
                    <div><Label className="text-xs">Escalation Path</Label><Input value={newSla.escalation} onChange={(e) => setNewSla({ ...newSla, escalation: e.target.value })} placeholder="e.g. Counselor → Manager" /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddSlaOpen(false)}>Cancel</Button>
                    <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => {
                      if (!newSla.module) { toast.error('Module required'); return }
                      setSla([...sla, { ...newSla, id: String(Date.now()) }]); setNewSla({ module: '', responseTime: '', resolutionTime: '', escalation: '' }); setAddSlaOpen(false); toast.success('SLA rule added')
                    }}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Module</th>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Response Time</th>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Resolution Time</th>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Escalation</th>
                    <th className="p-3 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sla.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3 font-medium text-slate-900">{r.module}</td>
                      <td className="p-3 text-xs text-slate-700"><Badge className="bg-blue-50 text-[#0057B8] border-0">{r.responseTime}</Badge></td>
                      <td className="p-3 text-xs text-slate-700"><Badge className="bg-amber-50 text-amber-600 border-0">{r.resolutionTime}</Badge></td>
                      <td className="p-3 text-xs text-slate-600">{r.escalation}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.info('Edit SLA rule')}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => setSla(sla.filter((s) => s.id !== r.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Notification Rules</h3>
              <Badge className="bg-slate-100 text-slate-600 border-0">{notifications.filter((n) => n.enabled).length} of {notifications.length} active</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Trigger</th>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Channel</th>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Template</th>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Recipients</th>
                    <th className="p-3 text-center font-semibold text-slate-600">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3 font-medium text-slate-900">{n.trigger}</td>
                      <td className="p-3"><Badge className="bg-slate-100 text-slate-700 border-0 text-xs">{n.channel}</Badge></td>
                      <td className="p-3 text-xs font-mono text-[#0057B8]">{n.template}</td>
                      <td className="p-3 text-xs text-slate-600">{n.recipients}</td>
                      <td className="p-3 text-center">
                        <Switch checked={n.enabled} onCheckedChange={(checked) => setNotifications(notifications.map((x) => x.id === n.id ? { ...x, enabled: checked } : x))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Workflow */}
        <TabsContent value="workflow">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Workflow className="h-4 w-4 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Workflow Settings</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'autoAssignLeads', label: 'Auto-assign new leads', desc: 'Round-robin assignment of new leads to available counselors' },
                { key: 'requireDocReview', label: 'Require document review', desc: 'Documents must be reviewed before application submission' },
                { key: 'autoNotifyPartner', label: 'Auto-notify partners', desc: 'Send automatic updates to partners on application status changes' },
                { key: 'escalateOverdue', label: 'Escalate overdue items', desc: 'Automatically escalate SLA-breaching items to managers' },
                { key: 'autoCreateStudentFromLead', label: 'Auto-create student from lead', desc: 'Automatically create student record when lead status changes to converted' },
                { key: 'approvalMatrix', label: 'Approval matrix', desc: 'Require multi-level approval for high-value commissions and refunds' },
              ].map((w) => (
                <div key={w.key} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50/60">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{w.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{w.desc}</p>
                  </div>
                  <Switch
                    checked={workflow[w.key as keyof typeof workflow]}
                    onCheckedChange={(v) => setWorkflow({ ...workflow, [w.key]: v })}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Custom Fields */}
        <TabsContent value="fields">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListPlus className="h-4 w-4 text-[#0057B8]" />
                <h3 className="font-bold text-slate-900">Custom Fields</h3>
                <Badge className="bg-slate-100 text-slate-600 border-0">{customFields.length} fields</Badge>
              </div>
              <Dialog open={addFieldOpen} onOpenChange={setAddFieldOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Field</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Custom Field</DialogTitle></DialogHeader>
                  <div className="space-y-3 py-2">
                    <div>
                      <Label className="text-xs">Entity</Label>
                      <Select value={newField.entity} onValueChange={(v) => setNewField({ ...newField, entity: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Lead">Lead</SelectItem>
                          <SelectItem value="Application">Application</SelectItem>
                          <SelectItem value="Partner">Partner</SelectItem>
                          <SelectItem value="University">University</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Field Name</Label><Input value={newField.fieldName} onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })} placeholder="e.g. family_income" /></div>
                    <div>
                      <Label className="text-xs">Field Type</Label>
                      <Select value={newField.fieldType} onValueChange={(v) => setNewField({ ...newField, fieldType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={newField.required} onCheckedChange={(v) => setNewField({ ...newField, required: v })} />
                      <Label className="text-xs">Required</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddFieldOpen(false)}>Cancel</Button>
                    <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => {
                      if (!newField.fieldName) { toast.error('Field name required'); return }
                      setCustomFields([...customFields, { ...newField, id: String(Date.now()) }]); setNewField({ entity: 'Student', fieldName: '', fieldType: 'text', required: false }); setAddFieldOpen(false); toast.success('Custom field added')
                    }}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Entity</th>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Field Name</th>
                    <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Type</th>
                    <th className="p-3 text-center font-semibold text-slate-600">Required</th>
                    <th className="p-3 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customFields.map((f) => (
                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3"><Badge className="bg-blue-50 text-[#0057B8] border-0 text-xs">{f.entity}</Badge></td>
                      <td className="p-3 text-xs font-mono text-slate-900">{f.fieldName}</td>
                      <td className="p-3 text-xs text-slate-700 capitalize">{f.fieldType}</td>
                      <td className="p-3 text-center">{f.required ? <Badge className="bg-orange-50 text-[#E8501A] border-0 text-xs">Yes</Badge> : <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">No</Badge>}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.info('Edit field')}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => setCustomFields(customFields.filter((x) => x.id !== f.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
