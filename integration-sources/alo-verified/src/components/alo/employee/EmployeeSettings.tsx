'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Settings, Bell, Shield, Palette, Save, User, Phone, MapPin,
  MessageSquare, Mail, Lock, Eye, EyeOff, Smartphone, Clock,
  Monitor, Globe, Sun, Moon, Layers, AlertTriangle, CheckCircle2,
  Chrome
} from 'lucide-react'
import { toast } from 'sonner'

// Mock personal info
const mockPersonalInfo = {
  firstName: 'Arif',
  lastName: 'Hossain',
  email: 'arif.hossain@aloeducation.com',
  phone: '+880 1712-345678',
  whatsappNumber: '+880 1712-345678',
  address: 'House 42, Road 11, Dhanmondi',
  city: 'Dhaka',
  country: 'Bangladesh',
  emergencyContact: 'Fatima Hossain',
  emergencyPhone: '+880 1812-345678',
  emergencyRelation: 'Spouse',
}

// Mock login history
const mockLoginHistory = [
  { date: '2025-03-03 09:15 AM', ip: '103.45.67.89', device: 'Chrome on Windows' },
  { date: '2025-03-02 08:45 AM', ip: '103.45.67.90', device: 'Safari on iPhone' },
  { date: '2025-03-01 10:30 AM', ip: '103.45.67.89', device: 'Chrome on Windows' },
  { date: '2025-02-28 09:00 AM', ip: '192.168.1.55', device: 'Firefox on MacOS' },
  { date: '2025-02-27 08:55 AM', ip: '103.45.67.89', device: 'Chrome on Windows' },
]

// Notification preferences state type
interface NotificationPreferences {
  emailLeaveApprovals: boolean
  emailPayrollAlerts: boolean
  emailTaskAssignments: boolean
  emailCompanyAnnouncements: boolean
  whatsappAttendanceReminders: boolean
  whatsappLeaveUpdates: boolean
  whatsappTaskReminders: boolean
  pushClockInReminders: boolean
  pushBreakReminders: boolean
  pushMeetingReminders: boolean
}

// Security state type
interface SecurityState {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  twoFactorEnabled: boolean
}

// App preferences state type
interface AppPreferences {
  theme: string
  language: string
  defaultView: string
  compactMode: boolean
}

export default function EmployeeSettings() {
  const [activeTab, setActiveTab] = useState('personal')

  // Personal info state
  const [personalInfo, setPersonalInfo] = useState(mockPersonalInfo)
  const [personalEditing, setPersonalEditing] = useState(false)
  const [personalSaving, setPersonalSaving] = useState(false)

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    emailLeaveApprovals: true,
    emailPayrollAlerts: true,
    emailTaskAssignments: true,
    emailCompanyAnnouncements: false,
    whatsappAttendanceReminders: true,
    whatsappLeaveUpdates: true,
    whatsappTaskReminders: false,
    pushClockInReminders: true,
    pushBreakReminders: false,
    pushMeetingReminders: true,
  })
  const [notifSaving, setNotifSaving] = useState(false)

  // Security state
  const [security, setSecurity] = useState<SecurityState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // App preferences state
  const [appPrefs, setAppPrefs] = useState<AppPreferences>({
    theme: 'system',
    language: 'en',
    defaultView: 'dashboard',
    compactMode: false,
  })
  const [prefsSaving, setPrefsSaving] = useState(false)

  // Handlers
  const handleSavePersonal = async () => {
    setPersonalSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setPersonalSaving(false)
    setPersonalEditing(false)
    toast.success('Personal information updated successfully')
  }

  const handleSaveNotifications = async () => {
    setNotifSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setNotifSaving(false)
    toast.success('Notification preferences saved')
  }

  const handleChangePassword = async () => {
    if (!security.currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    if (!security.newPassword) {
      toast.error('Please enter a new password')
      return
    }
    if (security.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setPasswordSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setPasswordSaving(false)
    setSecurity({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' })
    toast.success('Password changed successfully')
  }

  const handleToggle2FA = async (enabled: boolean) => {
    setSecurity({ ...security, twoFactorEnabled: enabled })
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success(enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled')
  }

  const handleSavePreferences = async () => {
    setPrefsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setPrefsSaving(false)
    toast.success('App preferences saved')
  }

  const updateNotifPref = (key: keyof NotificationPreferences, value: boolean) => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#F37021]" />
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account preferences and configurations</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100 h-auto flex flex-wrap gap-1 p-1">
          <TabsTrigger value="personal" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <User className="h-4 w-4" /> Personal Info
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <Palette className="h-4 w-4" /> Preferences
          </TabsTrigger>
        </TabsList>

        {/* ===================== PERSONAL INFORMATION TAB ===================== */}
        <TabsContent value="personal" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                    <User className="h-5 w-5 text-[#F37021]" /> Personal Information
                  </CardTitle>
                  <CardDescription className="mt-1">Update your personal details and contact information</CardDescription>
                </div>
                {!personalEditing ? (
                  <Button onClick={() => setPersonalEditing(true)} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                    <Settings className="h-4 w-4 mr-2" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setPersonalEditing(false); setPersonalInfo(mockPersonalInfo) }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePersonal} disabled={personalSaving} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                      <Save className="h-4 w-4 mr-2" /> {personalSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">First Name</Label>
                  {personalEditing ? (
                    <Input
                      value={personalInfo.firstName}
                      onChange={e => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                      className="border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                    />
                  ) : (
                    <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100">{personalInfo.firstName}</p>
                  )}
                </div>
                {/* Last Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                  {personalEditing ? (
                    <Input
                      value={personalInfo.lastName}
                      onChange={e => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                      className="border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                    />
                  ) : (
                    <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100">{personalInfo.lastName}</p>
                  )}
                </div>
                {/* Email (readonly) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" /> {personalInfo.email}
                  </p>
                </div>
                {/* Phone */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  {personalEditing ? (
                    <Input
                      value={personalInfo.phone}
                      onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      className="border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                    />
                  ) : (
                    <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" /> {personalInfo.phone}
                    </p>
                  )}
                </div>
                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">WhatsApp Number</Label>
                  {personalEditing ? (
                    <Input
                      value={personalInfo.whatsappNumber}
                      onChange={e => setPersonalInfo({ ...personalInfo, whatsappNumber: e.target.value })}
                      className="border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                    />
                  ) : (
                    <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" /> {personalInfo.whatsappNumber}
                    </p>
                  )}
                </div>
                {/* Address */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Address</Label>
                  {personalEditing ? (
                    <Input
                      value={personalInfo.address}
                      onChange={e => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                      className="border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                    />
                  ) : (
                    <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" /> {personalInfo.address}, {personalInfo.city}, {personalInfo.country}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Emergency Contact Section */}
              <div>
                <h3 className="text-sm font-semibold text-[#1A2332] flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4 text-[#F37021]" /> Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Contact Name</Label>
                    {personalEditing ? (
                      <Input
                        value={personalInfo.emergencyContact}
                        onChange={e => setPersonalInfo({ ...personalInfo, emergencyContact: e.target.value })}
                        className="border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      />
                    ) : (
                      <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100">{personalInfo.emergencyContact}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Contact Phone</Label>
                    {personalEditing ? (
                      <Input
                        value={personalInfo.emergencyPhone}
                        onChange={e => setPersonalInfo({ ...personalInfo, emergencyPhone: e.target.value })}
                        className="border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      />
                    ) : (
                      <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" /> {personalInfo.emergencyPhone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Relationship</Label>
                    {personalEditing ? (
                      <Input
                        value={personalInfo.emergencyRelation}
                        onChange={e => setPersonalInfo({ ...personalInfo, emergencyRelation: e.target.value })}
                        className="border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      />
                    ) : (
                      <p className="text-sm p-2.5 bg-gray-50 rounded-md border border-gray-100">{personalInfo.emergencyRelation}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== NOTIFICATION PREFERENCES TAB ===================== */}
        <TabsContent value="notifications" className="space-y-4">
          {/* Email Notifications */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <Mail className="h-5 w-5 text-[#0066CC]" /> Email Notifications
              </CardTitle>
              <CardDescription>Configure which email notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Leave Approvals</p>
                    <p className="text-xs text-gray-500">Get notified when your leave is approved or rejected</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.emailLeaveApprovals}
                  onCheckedChange={v => updateNotifPref('emailLeaveApprovals', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Payroll Alerts</p>
                    <p className="text-xs text-gray-500">Receive salary credit and payslip notifications</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.emailPayrollAlerts}
                  onCheckedChange={v => updateNotifPref('emailPayrollAlerts', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Task Assignments</p>
                    <p className="text-xs text-gray-500">Get notified when new tasks are assigned to you</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.emailTaskAssignments}
                  onCheckedChange={v => updateNotifPref('emailTaskAssignments', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Company Announcements</p>
                    <p className="text-xs text-gray-500">Stay updated with company-wide announcements</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.emailCompanyAnnouncements}
                  onCheckedChange={v => updateNotifPref('emailCompanyAnnouncements', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Notifications */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <MessageSquare className="h-5 w-5 text-green-600" /> WhatsApp Notifications
              </CardTitle>
              <CardDescription>Manage WhatsApp notification settings for quick updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Attendance Reminders</p>
                    <p className="text-xs text-gray-500">Daily reminder to clock in on time</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.whatsappAttendanceReminders}
                  onCheckedChange={v => updateNotifPref('whatsappAttendanceReminders', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Leave Updates</p>
                    <p className="text-xs text-gray-500">Instant updates on leave application status</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.whatsappLeaveUpdates}
                  onCheckedChange={v => updateNotifPref('whatsappLeaveUpdates', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Task Reminders</p>
                    <p className="text-xs text-gray-500">Reminders for upcoming task deadlines</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.whatsappTaskReminders}
                  onCheckedChange={v => updateNotifPref('whatsappTaskReminders', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <Smartphone className="h-5 w-5 text-[#F37021]" /> Push Notifications
              </CardTitle>
              <CardDescription>Control browser and mobile push notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-[#F37021]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Clock-in Reminders</p>
                    <p className="text-xs text-gray-500">Get pushed when it is time to clock in</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.pushClockInReminders}
                  onCheckedChange={v => updateNotifPref('pushClockInReminders', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Break Reminders</p>
                    <p className="text-xs text-gray-500">Reminders to take your scheduled breaks</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.pushBreakReminders}
                  onCheckedChange={v => updateNotifPref('pushBreakReminders', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Meeting Reminders</p>
                    <p className="text-xs text-gray-500">Get notified 10 minutes before meetings</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.pushMeetingReminders}
                  onCheckedChange={v => updateNotifPref('pushMeetingReminders', v)}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications} disabled={notifSaving} className="bg-[#F37021] hover:bg-[#e06010] text-white min-w-[140px]">
              <Save className="h-4 w-4 mr-2" /> {notifSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </TabsContent>

        {/* ===================== SECURITY TAB ===================== */}
        <TabsContent value="security" className="space-y-4">
          {/* Change Password */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <Lock className="h-5 w-5 text-[#F37021]" /> Change Password
              </CardTitle>
              <CardDescription>Update your account password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={security.currentPassword}
                      onChange={e => setSecurity({ ...security, currentPassword: e.target.value })}
                      className="pr-10 border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={security.newPassword}
                      onChange={e => setSecurity({ ...security, newPassword: e.target.value })}
                      className="pr-10 border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {security.newPassword && security.newPassword.length < 8 && (
                    <p className="text-xs text-red-500">Password must be at least 8 characters</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={security.confirmPassword}
                      onChange={e => setSecurity({ ...security, confirmPassword: e.target.value })}
                      className="pr-10 border-gray-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {security.confirmPassword && security.newPassword !== security.confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>
                <Button onClick={handleChangePassword} disabled={passwordSaving} className="bg-[#F37021] hover:bg-[#e06010] text-white mt-2">
                  <Lock className="h-4 w-4 mr-2" /> {passwordSaving ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <Shield className="h-5 w-5 text-[#0066CC]" /> Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${security.twoFactorEnabled ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <Shield className={`h-6 w-6 ${security.twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">
                      {security.twoFactorEnabled
                        ? 'Your account is protected with 2FA'
                        : 'Enable 2FA for enhanced account security'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={security.twoFactorEnabled ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-100'}>
                    {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Switch
                    checked={security.twoFactorEnabled}
                    onCheckedChange={handleToggle2FA}
                    className="data-[state=checked]:bg-[#F37021]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login History */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <Chrome className="h-5 w-5 text-[#1A2332]" /> Login History
              </CardTitle>
              <CardDescription>Recent login activity on your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date & Time</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">IP Address</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Device</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLoginHistory.map((login, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 text-[#1A2332]">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {login.date}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-600 font-mono text-xs">{login.ip}</td>
                        <td className="py-3 px-3 text-gray-600">{login.device}</td>
                        <td className="py-3 px-3">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Success</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== APP PREFERENCES TAB ===================== */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <Palette className="h-5 w-5 text-[#F37021]" /> App Preferences
              </CardTitle>
              <CardDescription>Customize your application experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#1A2332] flex items-center justify-center">
                    {appPrefs.theme === 'light' ? (
                      <Sun className="h-5 w-5 text-yellow-400" />
                    ) : appPrefs.theme === 'dark' ? (
                      <Moon className="h-5 w-5 text-blue-300" />
                    ) : (
                      <Monitor className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Theme</p>
                    <p className="text-xs text-gray-500">Choose your preferred appearance</p>
                  </div>
                </div>
                <Select value={appPrefs.theme} onValueChange={v => setAppPrefs({ ...appPrefs, theme: v })}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <span className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</span>
                    </SelectItem>
                    <SelectItem value="dark">
                      <span className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</span>
                    </SelectItem>
                    <SelectItem value="system">
                      <span className="flex items-center gap-2"><Monitor className="h-4 w-4" /> System</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0066CC] flex items-center justify-center">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Language</p>
                    <p className="text-xs text-gray-500">Select your preferred language</p>
                  </div>
                </div>
                <Select value={appPrefs.language} onValueChange={v => setAppPrefs({ ...appPrefs, language: v })}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">
                      <span className="flex items-center gap-2">🇬🇧 English</span>
                    </SelectItem>
                    <SelectItem value="bn">
                      <span className="flex items-center gap-2">🇧🇩 বাংলা</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default View on Login */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#F37021] flex items-center justify-center">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Default View on Login</p>
                    <p className="text-xs text-gray-500">Choose which page opens when you log in</p>
                  </div>
                </div>
                <Select value={appPrefs.defaultView} onValueChange={v => setAppPrefs({ ...appPrefs, defaultView: v })}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Compact Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-gray-200" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">Compact Mode</p>
                    <p className="text-xs text-gray-500">Reduce spacing and show more content on screen</p>
                  </div>
                </div>
                <Switch
                  checked={appPrefs.compactMode}
                  onCheckedChange={v => setAppPrefs({ ...appPrefs, compactMode: v })}
                  className="data-[state=checked]:bg-[#F37021]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={prefsSaving} className="bg-[#F37021] hover:bg-[#e06010] text-white min-w-[140px]">
              <Save className="h-4 w-4 mr-2" /> {prefsSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
