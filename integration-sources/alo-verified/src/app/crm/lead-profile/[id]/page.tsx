'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Send,
  FileText,
  Bell,
  Globe,
  GraduationCap,
  User,
  MapPin,
  Award,
  Clock,
  Briefcase,
  BookOpen,
  FileCheck,
  Plane,
  Users as UsersIcon,
  ClipboardList,
  StickyNote,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LeadNote {
  id: string
  note: string
  noteType: string
  createdAt: string
}

interface Counselor {
  id: string
  firstName: string
  lastName: string
  employeeId?: string
}

interface Lead {
  id: string
  leadId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  whatsappNumber: string | null
  source: string
  status: string
  temperature: string
  preferredCountry: string | null
  preferredCourse: string | null
  preferredIntake: string | null
  englishTestType: string | null
  englishTestScore: string | null
  highestEducation: string | null
  notes: string | null
  assignedTo: string | null
  nextFollowUp: string | null
  lastContactedAt: string | null
  createdAt: string
  updatedAt: string
  counselor?: Counselor | null
  notes_relation?: LeadNote[]
}

interface LeadsResponse {
  leads: Lead[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-50 text-[#0057B8] border-blue-100',
  contacted: 'bg-amber-50 text-amber-600 border-amber-100',
  qualified: 'bg-purple-50 text-purple-600 border-purple-100',
  converted: 'bg-green-50 text-green-600 border-green-100',
  lost: 'bg-red-50 text-red-600 border-red-100',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm text-slate-900">{value || <span className="text-slate-300">—</span>}</p>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#0057B8]" />
        </div>
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </Card>
  )
}

export default function LeadProfilePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const session = getSession()
  const [activeTab, setActiveTab] = useState('personal')

  // Fetch all leads and find by id (since /api/leads returns paginated list, we fetch with high limit)
  const { data, loading } = usePortalData<LeadsResponse>({
    endpoint: '/api/leads',
    params: { limit: 200, page: 1 },
  })

  const lead = useMemoLead(data, id)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 rounded bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline">
          <Link href="/crm/leads"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads</Link>
        </Button>
        <Card className="p-12 border-0 shadow-sm text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lead not found</h2>
          <p className="text-sm text-slate-500 mb-4">This lead may have been deleted or moved.</p>
          <Button asChild className="bg-[#0057B8] hover:bg-[#00449a] text-white">
            <Link href="/crm/leads">View all leads</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const fullName = `${lead.firstName} ${lead.lastName}`
  const initials = `${lead.firstName[0] ?? ''}${lead.lastName[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm" className="h-9">
        <Link href="/crm/leads"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads</Link>
      </Button>

      {/* Header / Summary box */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0057B8] to-[#00449a] p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-[#0057B8] text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{fullName}</h1>
                <Badge className="bg-white/20 text-white border-0 capitalize">{lead.status.replace(/_/g, ' ')}</Badge>
                <Badge className="bg-[#E8501A] text-white border-0 capitalize">{lead.temperature}</Badge>
              </div>
              <p className="text-white/80 text-sm">{lead.leadId} • Lead</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/90">
                {lead.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {lead.email}</span>}
                {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {lead.phone}</span>}
                {lead.preferredCountry && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {lead.preferredCountry}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created {new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => toast.info('New reminder dialog')}>
                <Bell className="h-4 w-4 mr-2" /> New Reminder
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.info('Email template picker')}>
                <Mail className="h-4 w-4 mr-2" /> Email Template
              </Button>
              <Button size="sm" className="bg-[#E8501A] hover:bg-[#c44318] text-white" onClick={() => toast.success('Lead moved to application')}>
                <Send className="h-4 w-4 mr-2" /> Move to Application
              </Button>
            </div>
          </div>
        </div>
        {/* Quick summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-slate-50">
          <Field label="Counselor" value={lead.counselor ? `${lead.counselor.firstName} ${lead.counselor.lastName}` : 'Unassigned'} />
          <Field label="Source" value={<span className="capitalize">{lead.source.replace(/_/g, ' ')}</span>} />
          <Field label="Nationality" value="Bangladeshi" />
          <Field label="Funding" value="Self" />
          <Field label="Membership" value="৳0" />
          <Field label="Office Visited" value="Dhaka HQ" />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto flex flex-nowrap">
            {[
              { value: 'personal', label: 'Personal', icon: User },
              { value: 'contact', label: 'Contact', icon: Phone },
              { value: 'education', label: 'Education', icon: GraduationCap },
              { value: 'previous', label: 'Previous Study', icon: BookOpen },
              { value: 'passport', label: 'Passport', icon: FileCheck },
              { value: 'test', label: 'Test Score', icon: Award },
              { value: 'visa', label: 'Visa History', icon: Plane },
              { value: 'reference', label: 'Reference & Work', icon: Briefcase },
              { value: 'admission', label: 'Admission', icon: Globe },
              { value: 'applications', label: 'Applications', icon: Send },
              { value: 'remarks', label: 'Remarks', icon: StickyNote },
              { value: 'communications', label: 'Communications', icon: MessageSquare },
              { value: 'tasks', label: 'Tasks', icon: ClipboardList },
              { value: 'profile', label: 'Profile', icon: User },
              { value: 'documents', label: 'Documents', icon: FileText },
              { value: 'action', label: 'Action Required', icon: AlertCircle },
            ].map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-[#0057B8] data-[state=active]:text-white whitespace-nowrap text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="personal">
          <SectionCard title="Personal Information" icon={User}>
            <Field label="First Name" value={lead.firstName} />
            <Field label="Last Name" value={lead.lastName} />
            <Field label="Gender" value="—" />
            <Field label="Date of Birth" value="—" />
            <Field label="Nationality" value="Bangladeshi" />
            <Field label="Highest Education" value={lead.highestEducation} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="contact">
          <SectionCard title="Contact Information" icon={Phone}>
            <Field label="Email" value={lead.email} />
            <Field label="Phone" value={lead.phone} />
            <Field label="WhatsApp" value={lead.whatsappNumber || lead.phone} />
            <Field label="Address" value="—" />
            <Field label="City" value="—" />
            <Field label="Country" value="Bangladesh" />
          </SectionCard>
        </TabsContent>

        <TabsContent value="education">
          <SectionCard title="Education History" icon={GraduationCap}>
            <Field label="Highest Education" value={lead.highestEducation} />
            <Field label="Institution" value="—" />
            <Field label="GPA" value="—" />
            <Field label="Graduation Year" value="—" />
          </SectionCard>
        </TabsContent>

        <TabsContent value="previous">
          <SectionCard title="Previous Study Abroad" icon={BookOpen}>
            <Field label="Previous Country" value="—" />
            <Field label="Previous Institution" value="—" />
            <Field label="Visa Refusal History" value="—" />
          </SectionCard>
        </TabsContent>

        <TabsContent value="passport">
          <SectionCard title="Passport Details" icon={FileCheck}>
            <Field label="Passport Number" value="—" />
            <Field label="Issue Date" value="—" />
            <Field label="Expiry Date" value="—" />
            <Field label="Place of Issue" value="—" />
          </SectionCard>
        </TabsContent>

        <TabsContent value="test">
          <SectionCard title="Test Score" icon={Award}>
            <Field label="English Test" value={lead.englishTestType} />
            <Field label="Score" value={lead.englishTestScore} />
            <Field label="Test Date" value="—" />
            <Field label="Validity" value="—" />
            <Field label="GRE/GMAT" value="—" />
            <Field label="SAT" value="—" />
          </SectionCard>
        </TabsContent>

        <TabsContent value="visa">
          <SectionCard title="Visa History & Refusal" icon={Plane}>
            <Field label="Previous Visa Applications" value="0" />
            <Field label="Refusal Count" value="0" />
            <Field label="Refusal Country" value="—" />
            <Field label="Refusal Reason" value="—" />
          </SectionCard>
        </TabsContent>

        <TabsContent value="reference">
          <SectionCard title="Reference & Work" icon={Briefcase}>
            <Field label="Occupation" value="—" />
            <Field label="Company" value="—" />
            <Field label="Years of Experience" value="—" />
            <Field label="Reference Name" value="—" />
            <Field label="Reference Contact" value="—" />
            <Field label="Relationship" value="—" />
          </SectionCard>
        </TabsContent>

        <TabsContent value="admission">
          <SectionCard title="Admission Preference" icon={Globe}>
            <Field label="Preferred Country" value={lead.preferredCountry} />
            <Field label="Preferred Course" value={lead.preferredCourse} />
            <Field label="Preferred Intake" value={lead.preferredIntake} />
            <Field label="University Tier" value="—" />
            <Field label="Tuition Budget" value="—" />
            <Field label="Specialization" value="—" />
          </SectionCard>
        </TabsContent>

        <TabsContent value="applications">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <Send className="h-4 w-4 text-[#0057B8]" />
              </div>
              <h3 className="font-bold text-slate-900">Applications</h3>
            </div>
            {lead.status === 'converted' ? (
              <p className="text-sm text-slate-600">This lead has been converted to a student. View applications in the Students section.</p>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-3">No applications yet. Convert this lead to start an application.</p>
                <Button className="bg-[#E8501A] hover:bg-[#c44318] text-white" onClick={() => toast.success('Lead moved to application')}>
                  <Send className="h-4 w-4 mr-2" /> Move to Application
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="remarks">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <StickyNote className="h-4 w-4 text-[#0057B8]" />
              </div>
              <h3 className="font-bold text-slate-900">Remarks & Notes</h3>
            </div>
            {lead.notes && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mb-4">
                <p className="text-sm text-slate-700">{lead.notes}</p>
              </div>
            )}
            {lead.notes_relation && lead.notes_relation.length > 0 ? (
              <div className="space-y-2">
                {lead.notes_relation.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="capitalize text-xs bg-slate-100 text-slate-600 border-0">{n.noteType}</Badge>
                      <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700">{n.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No remarks yet.</p>
            )}
            <Button variant="outline" className="mt-4" onClick={() => toast.info('Add remark dialog')}>
              <StickyNote className="h-4 w-4 mr-2" /> Add Remark
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-[#0057B8]" />
              </div>
              <h3 className="font-bold text-slate-900">Communications</h3>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-[#0057B8]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Welcome email sent</p>
                  <p className="text-xs text-slate-500">Source: {lead.source.replace(/_/g, ' ')} • {new Date(lead.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {lead.lastContactedAt && (
                <div className="p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Last contact</p>
                    <p className="text-xs text-slate-500">{new Date(lead.lastContactedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" className="mt-4" onClick={() => toast.info('Compose communication')}>
              <Mail className="h-4 w-4 mr-2" /> Compose
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-[#0057B8]" />
              </div>
              <h3 className="font-bold text-slate-900">Tasks</h3>
            </div>
            {lead.nextFollowUp ? (
              <div className="p-3 rounded-lg border border-amber-100 bg-amber-50 flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Follow-up reminder</p>
                  <p className="text-xs text-slate-600">Due {new Date(lead.nextFollowUp).toLocaleString()}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-0">Pending</Badge>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No outstanding tasks.</p>
            )}
            <Button variant="outline" className="mt-4" onClick={() => toast.info('New task dialog')}>
              <Bell className="h-4 w-4 mr-2" /> New Task
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <SectionCard title="Profile" icon={User}>
            <Field label="Lead Ref" value={lead.leadId} />
            <Field label="Status" value={<span className="capitalize">{lead.status.replace(/_/g, ' ')}</span>} />
            <Field label="Temperature" value={<span className="capitalize">{lead.temperature}</span>} />
            <Field label="Source" value={<span className="capitalize">{lead.source.replace(/_/g, ' ')}</span>} />
            <Field label="Counselor" value={lead.counselor ? `${lead.counselor.firstName} ${lead.counselor.lastName}` : '—'} />
            <Field label="Created" value={new Date(lead.createdAt).toLocaleString()} />
            <Field label="Last Contacted" value={lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleString() : '—'} />
            <Field label="Next Follow-up" value={lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleString() : '—'} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#0057B8]" />
              </div>
              <h3 className="font-bold text-slate-900">Documents</h3>
            </div>
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-3">No documents uploaded yet for this lead.</p>
              <Button variant="outline" onClick={() => toast.info('Upload document')}>
                <FileText className="h-4 w-4 mr-2" /> Upload Document
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="action">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-[#E8501A]" />
              </div>
              <h3 className="font-bold text-slate-900">Action Required</h3>
            </div>
            <div className="space-y-2">
              {lead.status === 'new' && (
                <div className="p-3 rounded-lg border border-blue-100 bg-blue-50 flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#0057B8]" />
                  <p className="text-sm text-slate-700">New lead — contact within 24 hours</p>
                </div>
              )}
              {lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date() && (
                <div className="p-3 rounded-lg border border-orange-100 bg-orange-50 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#E8501A]" />
                  <p className="text-sm text-slate-700">Follow-up overdue — due {new Date(lead.nextFollowUp).toLocaleDateString()}</p>
                </div>
              )}
              {!lead.assignedTo && (
                <div className="p-3 rounded-lg border border-amber-100 bg-amber-50 flex items-center gap-3">
                  <UsersIcon className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-slate-700">Lead is unassigned — assign a counselor</p>
                </div>
              )}
              {!lead.email && (
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <p className="text-sm text-slate-700">No email on file — request contact info</p>
                </div>
              )}
              {lead.status === 'qualified' && (
                <div className="p-3 rounded-lg border border-green-100 bg-green-50 flex items-center gap-3">
                  <Send className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-slate-700">Lead is qualified — move to application</p>
                </div>
              )}
              {lead.status === 'new' || lead.status === 'contacted' || lead.status === 'qualified' ? null : (
                <p className="text-sm text-slate-500 text-center py-6">No outstanding actions.</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper hook to find lead by id
function useMemoLead(data: LeadsResponse | null, id: string | string[] | undefined) {
  const [lead, setLead] = useState<Lead | null>(null)
  useEffect(() => {
    if (data?.leads) {
      const found = data.leads.find((l) => l.id === id || l.leadId === id)
      setLead(found || null)
    } else {
      setLead(null)
    }
  }, [data, id])
  return lead
}
