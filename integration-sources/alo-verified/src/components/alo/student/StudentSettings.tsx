'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  User, Bell, Shield, Globe, Trash2, Save, Eye, EyeOff,
  Phone, MessageCircle, Mail, Lock, Smartphone, MapPin,
  AlertTriangle, CheckCircle2, Key, Languages
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
interface ProfileSettings {
  firstName: string
  lastName: string
  phone: string
  whatsapp: string
  address: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
}

interface NotificationPrefs {
  email: { applicationUpdates: boolean; paymentReminders: boolean; appointmentReminders: boolean; documentRequests: boolean; marketingEmails: boolean }
  whatsapp: { applicationUpdates: boolean; paymentReminders: boolean; appointmentReminders: boolean; documentRequests: boolean; marketingEmails: boolean }
  sms: { applicationUpdates: boolean; paymentReminders: boolean; appointmentReminders: boolean; documentRequests: boolean; marketingEmails: boolean }
}

interface SecuritySettings {
  twoFactorEnabled: boolean
}

interface LanguageRegion {
  preferredLanguage: string
  timezone: string
}

// ── Mock data ──────────────────────────────────────────────────────────
const defaultProfile: ProfileSettings = {
  firstName: 'Rakib',
  lastName: 'Hasan',
  phone: '+880 1712-345678',
  whatsapp: '+880 1712-345678',
  address: 'House 45, Road 12, Dhanmondi, Dhaka 1209',
  emergencyContactName: 'Karim Hasan',
  emergencyContactPhone: '+880 1812-345678',
  emergencyContactRelation: 'Father',
}

const defaultNotifications: NotificationPrefs = {
  email: { applicationUpdates: true, paymentReminders: true, appointmentReminders: true, documentRequests: true, marketingEmails: false },
  whatsapp: { applicationUpdates: true, paymentReminders: true, appointmentReminders: true, documentRequests: false, marketingEmails: false },
  sms: { applicationUpdates: false, paymentReminders: true, appointmentReminders: true, documentRequests: false, marketingEmails: false },
}

const defaultLanguageRegion: LanguageRegion = {
  preferredLanguage: 'en',
  timezone: 'Asia/Dhaka',
}

const notificationCategories = [
  { key: 'applicationUpdates', label: 'Application Updates', description: 'Status changes and offer letters' },
  { key: 'paymentReminders', label: 'Payment Reminders', description: 'Upcoming and overdue payments' },
  { key: 'appointmentReminders', label: 'Appointment Reminders', description: 'Upcoming consultations and meetings' },
  { key: 'documentRequests', label: 'Document Requests', description: 'New document requirements' },
  { key: 'marketingEmails', label: 'Marketing Emails', description: 'Promotions and newsletters' },
] as const

const languages = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'ur', label: 'اردو (Urdu)' },
  { value: 'ar', label: 'العربية (Arabic)' },
  { value: 'zh', label: '中文 (Chinese)' },
  { value: 'ms', label: 'Bahasa Melayu (Malay)' },
]

const timezones = [
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (GMT+5)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0/+1)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-5/-4)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10/+11)' },
]

// ── Component ──────────────────────────────────────────────────────────
export default function StudentSettings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile)
  const [notifications, setNotifications] = useState<NotificationPrefs>(defaultNotifications)
  const [security, setSecurity] = useState<SecuritySettings>({ twoFactorEnabled: false })
  const [languageRegion, setLanguageRegion] = useState<LanguageRegion>(defaultLanguageRegion)

  // Password form
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Delete account dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  // Profile update handler
  const handleProfileSave = () => {
    toast.success('Profile settings saved successfully!')
  }

  // Password change handler
  const handlePasswordChange = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Please fill in all password fields')
      return
    }
    if (passwords.new.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (passwords.current === passwords.new) {
      toast.error('New password must be different from current password')
      return
    }
    setPasswords({ current: '', new: '', confirm: '' })
    toast.success('Password changed successfully!')
  }

  // 2FA toggle handler
  const handle2FAToggle = () => {
    const newValue = !security.twoFactorEnabled
    setSecurity(prev => ({ ...prev, twoFactorEnabled: newValue }))
    toast.success(newValue ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled')
  }

  // Notification toggle handler
  const handleNotificationToggle = (channel: 'email' | 'whatsapp' | 'sms', key: keyof NotificationPrefs['email'], value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [channel]: { ...prev[channel], [key]: value }
    }))
    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} ${channel} notification ${value ? 'enabled' : 'disabled'}`)
  }

  // Delete account handler
  const handleDeleteAccount = () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }
    setDeleteDialogOpen(false)
    setDeleteConfirmation('')
    toast.success('Account deletion request submitted. You will receive a confirmation email.')
  }

  // Language / timezone save
  const handleLanguageRegionSave = () => {
    toast.success('Language and region settings saved!')
  }

  const updateProfile = (field: keyof ProfileSettings, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021]">
            <User className="h-3.5 w-3.5 mr-1.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021]">
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021]">
            <Shield className="h-3.5 w-3.5 mr-1.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="language" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021]">
            <Globe className="h-3.5 w-3.5 mr-1.5" /> Language & Region
          </TabsTrigger>
          <TabsTrigger value="danger" className="data-[state=active]:bg-white data-[state=active]:text-red-600">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ──────────────────────────────────────────────── */}
        <TabsContent value="profile" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <User className="h-4 w-4 text-[#F37021]" /> Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div>
                <h3 className="text-sm font-medium text-[#1A2332] mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">First Name</Label>
                    <Input value={profile.firstName} onChange={e => updateProfile('firstName', e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Last Name</Label>
                    <Input value={profile.lastName} onChange={e => updateProfile('lastName', e.target.value)} className="mt-1.5" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact */}
              <div>
                <h3 className="text-sm font-medium text-[#1A2332] mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number</Label>
                    <Input value={profile.phone} onChange={e => updateProfile('phone', e.target.value)} className="mt-1.5" placeholder="+880" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 flex items-center gap-1"><MessageCircle className="h-3 w-3" /> WhatsApp Number</Label>
                    <Input value={profile.whatsapp} onChange={e => updateProfile('whatsapp', e.target.value)} className="mt-1.5" placeholder="+880" />
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
                  <Input value={profile.address} onChange={e => updateProfile('address', e.target.value)} className="mt-1.5" placeholder="Street address" />
                </div>
              </div>

              <Separator />

              {/* Emergency Contact */}
              <div>
                <h3 className="text-sm font-medium text-[#1A2332] mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Contact Name</Label>
                    <Input value={profile.emergencyContactName} onChange={e => updateProfile('emergencyContactName', e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone Number</Label>
                    <Input value={profile.emergencyContactPhone} onChange={e => updateProfile('emergencyContactPhone', e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Relationship</Label>
                    <Select value={profile.emergencyContactRelation} onValueChange={v => updateProfile('emergencyContactRelation', v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Father">Father</SelectItem>
                        <SelectItem value="Mother">Mother</SelectItem>
                        <SelectItem value="Brother">Brother</SelectItem>
                        <SelectItem value="Sister">Sister</SelectItem>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleProfileSave} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ─────────────────────────────────────────── */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#F37021]" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Notification Type</th>
                      <th className="text-center text-xs font-medium text-gray-500 pb-3 px-3">
                        <div className="flex flex-col items-center gap-1">
                          <Mail className="h-4 w-4 text-[#0066CC]" />
                          <span>Email</span>
                        </div>
                      </th>
                      <th className="text-center text-xs font-medium text-gray-500 pb-3 px-3">
                        <div className="flex flex-col items-center gap-1">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          <span>WhatsApp</span>
                        </div>
                      </th>
                      <th className="text-center text-xs font-medium text-gray-500 pb-3 px-3">
                        <div className="flex flex-col items-center gap-1">
                          <Smartphone className="h-4 w-4 text-[#F37021]" />
                          <span>SMS</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificationCategories.map((cat, idx) => (
                      <tr key={cat.key} className={idx < notificationCategories.length - 1 ? 'border-b border-gray-50' : ''}>
                        <td className="py-4 pr-4">
                          <p className="text-sm font-medium text-[#1A2332]">{cat.label}</p>
                          <p className="text-xs text-gray-400">{cat.description}</p>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <Switch
                            checked={notifications.email[cat.key]}
                            onCheckedChange={v => handleNotificationToggle('email', cat.key, v)}
                          />
                        </td>
                        <td className="py-4 px-3 text-center">
                          <Switch
                            checked={notifications.whatsapp[cat.key]}
                            onCheckedChange={v => handleNotificationToggle('whatsapp', cat.key, v)}
                          />
                        </td>
                        <td className="py-4 px-3 text-center">
                          <Switch
                            checked={notifications.sms[cat.key]}
                            onCheckedChange={v => handleNotificationToggle('sms', cat.key, v)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ──────────────────────────────────────────────── */}
        <TabsContent value="security" className="mt-4 space-y-6">
          {/* Change Password */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Key className="h-4 w-4 text-[#F37021]" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Current Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    type="button"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">New Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    type="button"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwords.new && passwords.new.length < 8 && (
                  <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Confirm new password"
                  className="mt-1.5"
                />
                {passwords.confirm && passwords.new !== passwords.confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePasswordChange} className="bg-[#0066CC] hover:bg-[#0066CC]/90 text-white">
                  <Lock className="h-4 w-4 mr-2" /> Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Auth */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0066CC]" /> Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${security.twoFactorEnabled ? 'bg-green-50' : 'bg-gray-100'}`}>
                    <Shield className={`h-6 w-6 ${security.twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">
                      {security.twoFactorEnabled
                        ? 'Enabled — Extra security layer is active on your account'
                        : 'Disabled — Add an extra layer of security to your account'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={security.twoFactorEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {security.twoFactorEnabled ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch
                    checked={security.twoFactorEnabled}
                    onCheckedChange={handle2FAToggle}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Language & Region Tab ─────────────────────────────────────── */}
        <TabsContent value="language" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Languages className="h-4 w-4 text-[#F37021]" /> Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-[#1A2332]">Preferred Language</Label>
                  <p className="text-xs text-gray-400 mb-2">Choose the language for your portal interface</p>
                  <Select value={languageRegion.preferredLanguage} onValueChange={v => setLanguageRegion(p => ({ ...p, preferredLanguage: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                    <SelectContent>
                      {languages.map(l => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#1A2332]">Timezone</Label>
                  <p className="text-xs text-gray-400 mb-2">Used for appointment times and notifications</p>
                  <Select value={languageRegion.timezone} onValueChange={v => setLanguageRegion(p => ({ ...p, timezone: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-3 border border-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Language change takes effect immediately</p>
                  <p className="text-xs text-amber-600 mt-0.5">Some content may still appear in English as translations are being improved.</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleLanguageRegionSave} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                  <Save className="h-4 w-4 mr-2" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Danger Zone Tab ───────────────────────────────────────────── */}
        <TabsContent value="danger" className="mt-4">
          <Card className="border-0 shadow-sm border-t-4 border-t-red-500">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800">Delete Account</h3>
                    <p className="text-xs text-red-600 mt-1">
                      Permanently delete your account and all associated data. This action is irreversible.
                      All your applications, documents, messages, and payment history will be lost.
                    </p>
                    <ul className="mt-2 text-xs text-red-500 space-y-1">
                      <li className="flex items-center gap-1.5"><XIcon className="h-3 w-3" /> All application data will be deleted</li>
                      <li className="flex items-center gap-1.5"><XIcon className="h-3 w-3" /> Uploaded documents will be removed</li>
                      <li className="flex items-center gap-1.5"><XIcon className="h-3 w-3" /> Message history will be erased</li>
                      <li className="flex items-center gap-1.5"><XIcon className="h-3 w-3" /> Active appointments will be cancelled</li>
                    </ul>
                    <Button
                      onClick={() => setDeleteDialogOpen(true)}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete My Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Delete Account Confirmation Dialog ──────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirm Account Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-center">
              <Trash2 className="h-10 w-10 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-800">You are about to delete your account</p>
              <p className="text-xs text-red-500 mt-1">Type <strong>DELETE</strong> below to confirm</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Type DELETE to confirm</Label>
              <Input
                value={deleteConfirmation}
                onChange={e => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE here"
                className="mt-1.5 border-red-200 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmation('') }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Permanently Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Small X icon component for the danger list
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
