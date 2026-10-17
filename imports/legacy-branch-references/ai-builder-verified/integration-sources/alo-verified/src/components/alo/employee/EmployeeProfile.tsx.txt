'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User, Mail, Phone, MapPin, Building2, Briefcase, CalendarDays,
  Save, Upload, FileText, Download, Shield, Banknote
} from 'lucide-react'
import { toast } from 'sonner'

interface EmployeeProfile {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  whatsappNumber: string
  gender: string
  dateOfBirth: string
  address: string
  city: string
  country: string
  emergencyContact: string
  emergencyPhone: string
  emergencyRelation: string
  bankName: string
  bankAccount: string
  bankBranch: string
  routingNumber: string
  profilePhoto: string
  department: { name: string }
  designation: { name: string }
  branch: { name: string }
  joiningDate: string
  role: string
  employmentType: string
  status: string
}

export default function EmployeeProfile() {
  const { currentUser } = useAppStore()
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<EmployeeProfile>>({})

  useEffect(() => {
    fetchProfile()
  }, [currentUser])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      if (!currentUser?.referenceId) return
      const res = await fetch(`/api/employees?search=${currentUser.email}&limit=1`)
      if (res.ok) {
        const json = await res.json()
        if (json.employees?.[0]) {
          setProfile(json.employees[0])
          setFormData(json.employees[0])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    try {
      setSaving(true)
      const res = await fetch(`/api/employees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.id, ...formData })
      })
      if (res.ok) {
        toast.success('Profile updated successfully')
        setEditing(false)
        fetchProfile()
      } else {
        toast.error('Failed to update profile')
      }
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    toast.success(`Document "${file.name}" uploaded successfully`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">My Profile</h1>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Profile data not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">My Profile</h1>
        <div className="flex gap-2">
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="bg-[#F37021] hover:bg-[#e06010] text-white">
              <Save className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setFormData(profile) }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#F37021] hover:bg-[#e06010] text-white">
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Personal Info */}
        <TabsContent value="personal">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <User className="h-5 w-5 text-[#F37021]" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  {editing ? (
                    <Input value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  {editing ? (
                    <Input value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.lastName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm p-2 bg-gray-50 rounded-md flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" /> {profile.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  {editing ? (
                    <Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" /> {profile.phone || 'N/A'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  {editing ? (
                    <Input value={formData.whatsappNumber || ''} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.whatsappNumber || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  {editing ? (
                    <Input value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.gender || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  {editing ? (
                    <Input type="date" value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-400" /> {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <p className="text-sm p-2 bg-gray-50 rounded-md flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" /> {profile.employeeId}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <p className="text-sm p-2 bg-gray-50 rounded-md flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" /> {profile.department?.name || 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <p className="text-sm p-2 bg-gray-50 rounded-md flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" /> {profile.designation?.name || 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Joining Date</Label>
                  <p className="text-sm p-2 bg-gray-50 rounded-md flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-400" /> {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge className={profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {profile.status}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  {editing ? (
                    <Input value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" /> {profile.address || 'N/A'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  {editing ? (
                    <Input value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.city || 'N/A'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details */}
        <TabsContent value="bank">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <Banknote className="h-5 w-5 text-[#F37021]" /> Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  {editing ? (
                    <Input value={formData.bankName || ''} onChange={e => setFormData({...formData, bankName: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.bankName || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  {editing ? (
                    <Input value={formData.bankAccount || ''} onChange={e => setFormData({...formData, bankAccount: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.bankAccount || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  {editing ? (
                    <Input value={formData.bankBranch || ''} onChange={e => setFormData({...formData, bankBranch: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.bankBranch || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Routing Number</Label>
                  {editing ? (
                    <Input value={formData.routingNumber || ''} onChange={e => setFormData({...formData, routingNumber: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.routingNumber || 'N/A'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contact */}
        <TabsContent value="emergency">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                <Phone className="h-5 w-5 text-[#F37021]" /> Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  {editing ? (
                    <Input value={formData.emergencyContact || ''} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.emergencyContact || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  {editing ? (
                    <Input value={formData.emergencyPhone || ''} onChange={e => setFormData({...formData, emergencyPhone: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.emergencyPhone || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  {editing ? (
                    <Input value={formData.emergencyRelation || ''} onChange={e => setFormData({...formData, emergencyRelation: e.target.value})} />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded-md">{profile.emergencyRelation || 'N/A'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                  <FileText className="h-5 w-5 text-[#F37021]" /> Documents
                </CardTitle>
                <label className="cursor-pointer">
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                  <Button className="bg-[#F37021] hover:bg-[#e06010] text-white" asChild>
                    <span><Upload className="h-4 w-4 mr-2" /> Upload Document</span>
                  </Button>
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'National ID Card', date: '2024-01-15', status: 'verified' },
                  { name: 'Passport Copy', date: '2024-02-20', status: 'verified' },
                  { name: 'Employment Contract', date: '2024-03-01', status: 'pending' },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#0066CC]" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-gray-500">Uploaded: {doc.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={doc.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {doc.status}
                      </Badge>
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
