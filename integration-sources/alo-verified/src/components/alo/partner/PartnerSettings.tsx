'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Building2, CreditCard, Bell, Shield, Users, Save, Plus,
  Trash2, Eye, EyeOff, Phone, Mail, Globe, MapPin, User,
  Lock, Smartphone, AlertCircle
} from 'lucide-react'

// Mock company profile
const initialProfile = {
  companyName: 'EduBridge Bangladesh',
  contactPerson: 'Ahmed Rahman',
  email: 'ahmed@edubridge.bd',
  phone: '+880 1712 345678',
  whatsapp: '+880 1712 345678',
  address: '45 Gulshan Avenue, Block C',
  city: 'Dhaka',
  country: 'Bangladesh',
  website: 'https://www.edubridge.bd',
  businessType: 'Education Consultancy',
  panNumber: 'PAN-BD-2024-5678',
  gstNumber: 'GST-BD-2024-9012',
}

// Mock bank details
const initialBank = {
  bankName: 'Standard Chartered Bank',
  accountNumber: '0123456789012',
  branch: 'Gulshan Branch, Dhaka',
  ifscSwift: 'SCBLBDDH',
}

// Mock notification preferences
const initialNotifications = {
  commissionUpdates: true,
  studentStatusChanges: true,
  paymentReceipts: true,
  newsletter: false,
}

// Mock staff
const initialStaff = [
  { id: 's1', name: 'Ahmed Rahman', email: 'ahmed@edubridge.bd', role: 'Branch Manager', phone: '+880 1712 345678', status: 'active' },
  { id: 's2', name: 'Sadia Islam', email: 'sadia@edubridge.bd', role: 'Senior Counselor', phone: '+880 1812 345679', status: 'active' },
  { id: 's3', name: 'Karim Shah', email: 'karim@edubridge.bd', role: 'Counselor', phone: '+880 1912 345680', status: 'active' },
  { id: 's4', name: 'Rima Das', email: 'rima@edubridge.bd', role: 'Admin Assistant', phone: '+880 1612 345681', status: 'inactive' },
]

export default function PartnerSettings() {
  const { currentUser } = useAppStore()

  // Company profile state
  const [profile, setProfile] = useState(initialProfile)
  const [savingProfile, setSavingProfile] = useState(false)

  // Bank details state
  const [bank, setBank] = useState(initialBank)
  const [savingBank, setSavingBank] = useState(false)

  // Notification preferences
  const [notifications, setNotifications] = useState(initialNotifications)
  const [savingNotifications, setSavingNotifications] = useState(false)

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Staff management
  const [staff, setStaff] = useState(initialStaff)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [addStaffName, setAddStaffName] = useState('')
  const [addStaffEmail, setAddStaffEmail] = useState('')
  const [addStaffRole, setAddStaffRole] = useState('')
  const [addStaffPhone, setAddStaffPhone] = useState('')
  const [addingStaff, setAddingStaff] = useState(false)

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    await new Promise(r => setTimeout(r, 800))
    setSavingProfile(false)
    toast.success('Company profile updated successfully')
  }

  const handleSaveBank = async () => {
    setSavingBank(true)
    await new Promise(r => setTimeout(r, 800))
    setSavingBank(false)
    toast.success('Bank details updated successfully')
  }

  const handleSaveNotifications = async () => {
    setSavingNotifications(true)
    await new Promise(r => setTimeout(r, 500))
    setSavingNotifications(false)
    toast.success('Notification preferences saved')
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    await new Promise(r => setTimeout(r, 800))
    setChangingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Password changed successfully')
  }

  const handleToggle2FA = (enabled: boolean) => {
    setTwoFactorEnabled(enabled)
    toast.success(enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled')
  }

  const handleAddStaff = async () => {
    if (!addStaffName || !addStaffEmail || !addStaffRole) {
      toast.error('Please fill in all required fields')
      return
    }
    setAddingStaff(true)
    await new Promise(r => setTimeout(r, 600))
    const newMember = {
      id: `s${Date.now()}`,
      name: addStaffName,
      email: addStaffEmail,
      role: addStaffRole,
      phone: addStaffPhone || 'N/A',
      status: 'active' as const,
    }
    setStaff(prev => [...prev, newMember])
    setAddStaffName('')
    setAddStaffEmail('')
    setAddStaffRole('')
    setAddStaffPhone('')
    setShowAddStaff(false)
    setAddingStaff(false)
    toast.success(`${newMember.name} added to staff`)
  }

  const handleRemoveStaff = (id: string) => {
    const member = staff.find(s => s.id === id)
    setStaff(prev => prev.filter(s => s.id !== id))
    toast.success(`${member?.name || 'Staff member'} removed`)
  }

  const handleToggleStaffStatus = (id: string) => {
    setStaff(prev => prev.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'active' ? 'inactive' : 'active'
        return { ...s, status: newStatus }
      }
      return s
    }))
    toast.success('Staff status updated')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, company profile, and preferences</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-gray-100 p-1 h-auto flex-wrap">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4 mr-2" /> Company Profile
          </TabsTrigger>
          <TabsTrigger value="bank" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <CreditCard className="h-4 w-4 mr-2" /> Bank Details
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <Bell className="h-4 w-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021] data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" /> Staff
          </TabsTrigger>
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#F37021]" /> Company Profile
                </CardTitle>
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Company Name</Label>
                    <Input
                      value={profile.companyName}
                      onChange={(e) => setProfile(p => ({ ...p, companyName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Contact Person</Label>
                    <Input
                      value={profile.contactPerson}
                      onChange={(e) => setProfile(p => ({ ...p, contactPerson: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">WhatsApp</Label>
                    <div className="relative mt-1">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={profile.whatsapp}
                        onChange={(e) => setProfile(p => ({ ...p, whatsapp: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Website</Label>
                    <div className="relative mt-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={profile.website}
                        onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#0066CC]" /> Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">Street Address</Label>
                    <Input
                      value={profile.address}
                      onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">City</Label>
                    <Input
                      value={profile.city}
                      onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Country</Label>
                    <Select
                      value={profile.country}
                      onValueChange={(v) => setProfile(p => ({ ...p, country: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="Pakistan">Pakistan</SelectItem>
                        <SelectItem value="Nepal">Nepal</SelectItem>
                        <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                        <SelectItem value="Nigeria">Nigeria</SelectItem>
                        <SelectItem value="Ghana">Ghana</SelectItem>
                        <SelectItem value="Kenya">Kenya</SelectItem>
                        <SelectItem value="UAE">UAE</SelectItem>
                        <SelectItem value="Malaysia">Malaysia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Business Details */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3">Business Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Business Type</Label>
                    <Select
                      value={profile.businessType}
                      onValueChange={(v) => setProfile(p => ({ ...p, businessType: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Education Consultancy">Education Consultancy</SelectItem>
                        <SelectItem value="Training Institute">Training Institute</SelectItem>
                        <SelectItem value="Immigration Services">Immigration Services</SelectItem>
                        <SelectItem value="Career Counseling">Career Counseling</SelectItem>
                        <SelectItem value="Language School">Language School</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">PAN Number</Label>
                    <Input
                      value={profile.panNumber}
                      onChange={(e) => setProfile(p => ({ ...p, panNumber: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">GST Number</Label>
                    <Input
                      value={profile.gstNumber}
                      onChange={(e) => setProfile(p => ({ ...p, gstNumber: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details Tab */}
        <TabsContent value="bank">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#F37021]" /> Bank Details
                </CardTitle>
                <Button
                  onClick={handleSaveBank}
                  disabled={savingBank}
                  className="bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingBank ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Important</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Bank details are used for commission payments. Please ensure all information is accurate.
                    Changes may require verification from ALO Education.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Bank Name</Label>
                  <Input
                    value={bank.bankName}
                    onChange={(e) => setBank(b => ({ ...b, bankName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Account Number</Label>
                  <Input
                    value={bank.accountNumber}
                    onChange={(e) => setBank(b => ({ ...b, accountNumber: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Branch</Label>
                  <Input
                    value={bank.branch}
                    onChange={(e) => setBank(b => ({ ...b, branch: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">IFSC / SWIFT Code</Label>
                  <Input
                    value={bank.ifscSwift}
                    onChange={(e) => setBank(b => ({ ...b, ifscSwift: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#F37021]" /> Notification Preferences
                </CardTitle>
                <Button
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications}
                  className="bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingNotifications ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  key: 'commissionUpdates' as const,
                  label: 'Commission Updates',
                  desc: 'Get notified when commissions are approved, processed, or paid out',
                  icon: <CreditCard className="h-5 w-5 text-green-600" />,
                },
                {
                  key: 'studentStatusChanges' as const,
                  label: 'Student Status Changes',
                  desc: 'Receive alerts when your referred students\' application status changes',
                  icon: <Users className="h-5 w-5 text-[#0066CC]" />,
                },
                {
                  key: 'paymentReceipts' as const,
                  label: 'Payment Receipts',
                  desc: 'Get confirmation when payment receipts are generated',
                  icon: <CreditCard className="h-5 w-5 text-[#F37021]" />,
                },
                {
                  key: 'newsletter' as const,
                  label: 'Newsletter',
                  desc: 'Receive ALO Education news, updates, and promotional offers',
                  icon: <Mail className="h-5 w-5 text-purple-600" />,
                },
              ].map((item, idx) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A2332]">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(checked) => {
                        setNotifications(n => ({ ...n, [item.key]: checked }))
                      }}
                    />
                  </div>
                  {idx < 3 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Change Password */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#F37021]" /> Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-1"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#0066CC]" /> Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      twoFactorEnabled ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      <Smartphone className={`h-5 w-5 ${twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {twoFactorEnabled
                          ? 'Your account is protected with 2FA'
                          : 'Add an extra layer of security to your account'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {twoFactorEnabled && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">Enabled</Badge>
                    )}
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={handleToggle2FA}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Management Tab */}
        <TabsContent value="staff">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#F37021]" /> Staff Management
                </CardTitle>
                <Button
                  onClick={() => setShowAddStaff(true)}
                  className="bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Staff
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-[#1A2332]">Name</TableHead>
                    <TableHead className="font-semibold text-[#1A2332] hidden sm:table-cell">Email</TableHead>
                    <TableHead className="font-semibold text-[#1A2332]">Role</TableHead>
                    <TableHead className="font-semibold text-[#1A2332] hidden md:table-cell">Phone</TableHead>
                    <TableHead className="font-semibold text-[#1A2332]">Status</TableHead>
                    <TableHead className="font-semibold text-[#1A2332] w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#1A2332] rounded-full flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-white">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-[#1A2332]">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-gray-600">{member.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-gray-600">{member.phone}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${
                          member.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {member.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleStaffStatus(member.id)}
                            title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {member.status === 'active' ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600"
                            onClick={() => handleRemoveStaff(member.id)}
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Staff Dialog */}
          <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500">Full Name *</Label>
                  <Input
                    value={addStaffName}
                    onChange={(e) => setAddStaffName(e.target.value)}
                    className="mt-1"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email *</Label>
                  <Input
                    type="email"
                    value={addStaffEmail}
                    onChange={(e) => setAddStaffEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Role *</Label>
                  <Select value={addStaffRole} onValueChange={setAddStaffRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                      <SelectItem value="Senior Counselor">Senior Counselor</SelectItem>
                      <SelectItem value="Counselor">Counselor</SelectItem>
                      <SelectItem value="Admin Assistant">Admin Assistant</SelectItem>
                      <SelectItem value="Marketing Executive">Marketing Executive</SelectItem>
                      <SelectItem value="Operations Staff">Operations Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <Input
                    value={addStaffPhone}
                    onChange={(e) => setAddStaffPhone(e.target.value)}
                    className="mt-1"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddStaff(false)}>Cancel</Button>
                  <Button
                    onClick={handleAddStaff}
                    disabled={addingStaff || !addStaffName || !addStaffEmail || !addStaffRole}
                    className="bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {addingStaff ? 'Adding...' : 'Add Staff'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
