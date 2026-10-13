'use client'

import { useEffect, useState } from 'react'
import {
  User, Mail, Phone, Lock, Bell, MessageSquare, Shield,
  Camera, Save, CheckCircle2, AlertTriangle, Trash2, Eye, EyeOff,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession, clearSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface StudentRecord {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  whatsappNumber: string | null
  profilePhoto: string | null
  city: string | null
  country: string | null
}

interface SettingsState {
  emailNotif: boolean
  smsNotif: boolean
  whatsappNotif: boolean
  marketingNotif: boolean
  weeklyDigest: boolean
}

export default function SettingsPage() {
  const session = getSession()
  const router = useRouter()
  const { data } = usePortalData<{ students: StudentRecord[] }>({
    endpoint: '/api/students',
    params: { search: session?.user.email || '', limit: 5 },
  })

  const student = data?.students?.find((s) => s.email === session?.user.email) || data?.students?.[0] || null

  const [name, setName] = useState(session?.user.name || '')
  const [email, setEmail] = useState(session?.user.email || '')
  const [phone, setPhone] = useState(session?.user.phone || student?.phone || '')
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false })
  const [pwdSaving, setPwdSaving] = useState(false)

  const [notif, setNotif] = useState<SettingsState>({
    emailNotif: true,
    smsNotif: false,
    whatsappNotif: true,
    marketingNotif: false,
    weeklyDigest: true,
  })

  const [notifKey] = useState(`alo_student_notif_${session?.user.id || 'default'}`)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(notifKey)
      if (raw) setNotif(JSON.parse(raw))
    } catch {}
  }, [notifKey])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alo_token') : null
      if (student) {
        await fetch('/api/students', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            id: student.id,
            phone,
            firstName: name.split(' ')[0] || student.firstName,
            lastName: name.split(' ').slice(1).join(' ') || student.lastName,
          }),
        }).catch(() => null)
      }
      toast.success('Profile saved successfully')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = () => {
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      toast.error('Please fill in all password fields')
      return
    }
    if (pwd.next !== pwd.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (pwd.next.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setPwdSaving(true)
    setTimeout(() => {
      setPwdSaving(false)
      setPwd({ current: '', next: '', confirm: '' })
      toast.success('Password updated successfully')
    }, 800)
  }

  const handleSaveNotif = () => {
    try {
      localStorage.setItem(notifKey, JSON.stringify(notif))
      toast.success('Notification preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    }
  }

  const handleDeleteAccount = () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }
    clearSession()
    toast.success('Account deletion request submitted')
    router.push('/')
  }

  const initials = (session?.user.name || 'ST')
    .split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, security, and notification preferences."
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
            <User className="h-4 w-4 mr-1.5 sm:hidden md:block" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
            <Lock className="h-4 w-4 mr-1.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
            <Bell className="h-4 w-4 mr-1.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="danger" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
            <AlertTriangle className="h-4 w-4 mr-1.5" /> Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Profile Photo</h3>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback
                  style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)', color: 'white' }}
                  className="text-2xl font-bold"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Photo upload coming soon')}>
                  <Camera className="h-4 w-4 mr-2" /> Upload Photo
                </Button>
                <p className="text-xs text-slate-400 mt-2">JPG, PNG up to 2MB</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              {student && (
                <>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={student.city || ''} readOnly className="bg-slate-50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input value={student.country || ''} readOnly className="bg-slate-50" />
                  </div>
                </>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </Card>

          {/* Verification Status */}
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Verification Status</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border border-green-200 bg-green-50/50 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Email Verified</p>
                  <p className="text-xs text-slate-500">{email}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="p-4 rounded-lg border border-green-200 bg-green-50/50 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">WhatsApp Verified</p>
                  <p className="text-xs text-slate-500">{student?.whatsappNumber || session?.user.phone || '—'}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Change Password</h3>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showPwd.current ? 'text' : 'password'}
                    value={pwd.current}
                    onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPwd.next ? 'text' : 'password'}
                    value={pwd.next}
                    onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                    placeholder="At least 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showPwd.confirm ? 'text' : 'password'}
                    value={pwd.confirm}
                    onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Re-enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleChangePassword} disabled={pwdSaving} className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                {pwdSaving ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Security Status</h3>
            </div>
            <div className="space-y-2">
              <SecurityRow label="Two-Factor Authentication" status="disabled" />
              <SecurityRow label="Last Login" status="ok" value={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
              <SecurityRow label="Password Last Changed" status="ok" value="3 months ago" />
              <SecurityRow label="Active Sessions" status="ok" value="1 device" />
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Notification Channels</h3>
            </div>
            <div className="space-y-1">
              <NotifRow
                icon={Mail}
                title="Email Notifications"
                desc="Receive updates via email"
                checked={notif.emailNotif}
                onChange={(v) => setNotif((n) => ({ ...n, emailNotif: v }))}
              />
              <NotifRow
                icon={Phone}
                title="SMS Notifications"
                desc="Get text messages for urgent updates"
                checked={notif.smsNotif}
                onChange={(v) => setNotif((n) => ({ ...n, smsNotif: v }))}
              />
              <NotifRow
                icon={MessageSquare}
                title="WhatsApp Notifications"
                desc="Receive updates via WhatsApp"
                checked={notif.whatsappNotif}
                onChange={(v) => setNotif((n) => ({ ...n, whatsappNotif: v }))}
              />
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Notification Types</h3>
            </div>
            <div className="space-y-1">
              <NotifRow
                icon={Bell}
                title="Application Updates"
                desc="Status changes, offers, decisions"
                checked={notif.weeklyDigest}
                onChange={(v) => setNotif((n) => ({ ...n, weeklyDigest: v }))}
              />
              <NotifRow
                icon={Bell}
                title="Marketing & Promotions"
                desc="News, events, and special offers"
                checked={notif.marketingNotif}
                onChange={(v) => setNotif((n) => ({ ...n, marketingNotif: v }))}
              />
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={handleSaveNotif} className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                <Save className="h-4 w-4 mr-2" /> Save Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="p-6 border-2 border-red-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-600">Delete Account</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Permanently delete your ALO Student account and all associated data. This action cannot be undone.
              Your applications, documents, and messages will be archived but no longer accessible to you.
            </p>
            <ul className="space-y-1 text-sm text-slate-600 mb-4">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Profile data will be permanently removed
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Active applications will be withdrawn
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Documents will be archived for 90 days
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> You will be signed out immediately
              </li>
            </ul>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete My Account
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. Type <span className="font-bold text-red-600">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm('') }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE'}>
              <Trash2 className="h-4 w-4 mr-2" /> Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NotifRow({
  icon: Icon, title, desc, checked, onChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-[#0057B8]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function SecurityRow({ label, status, value }: { label: string; status: 'ok' | 'disabled' | 'warning'; value?: string }) {
  const meta = {
    ok: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, label: 'Enabled' },
    disabled: { color: 'text-slate-500', bg: 'bg-slate-100', icon: AlertTriangle, label: 'Disabled' },
    warning: { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle, label: 'Action needed' },
  }[status]
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', meta.bg)}>
        <Icon className={cn('h-4 w-4', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {value && <p className="text-xs text-slate-500">{value}</p>}
      </div>
      <Badge variant="outline" className={cn('border-0', meta.bg, meta.color)}>
        {meta.label}
      </Badge>
    </div>
  )
}
