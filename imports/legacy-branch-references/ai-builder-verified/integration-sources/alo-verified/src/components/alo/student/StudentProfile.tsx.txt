'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  User, GraduationCap, Globe, Phone, Mail, MapPin, Calendar,
  BookOpen, Save, AlertCircle, CheckCircle2
} from 'lucide-react'

interface ProfileData {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  whatsappNumber: string
  dateOfBirth: string
  gender: string
  nationality: string
  passportNumber: string
  address: string
  city: string
  country: string
  highestEducation: string
  gpa: string
  institution: string
  englishTestType: string
  englishTestScore: string
  englishTestDate: string
  preferredCountry: string
  preferredCourse: string
  preferredIntake: string
  emergencyContact: string
  emergencyPhone: string
  emergencyRelation: string
  guardian: {
    name: string
    relationship: string
    phone: string
    email: string
    occupation: string
  } | null
}

export default function StudentProfile() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [activeTab, setActiveTab] = useState('personal')

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const refId = currentUser?.referenceId
        if (!refId) {
          setLoading(false)
          return
        }
        const res = await fetch(`/api/students?limit=1&search=${currentUser?.email || ''}`)
        if (!res.ok) throw new Error('Failed to load profile')
        const json = await res.json()
        if (json.students && json.students.length > 0) {
          const s = json.students[0]
          setProfile({
            id: s.id,
            studentId: s.studentId,
            firstName: s.firstName || '',
            lastName: s.lastName || '',
            email: s.email || '',
            phone: s.phone || '',
            whatsappNumber: s.whatsappNumber || '',
            dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
            gender: s.gender || '',
            nationality: s.nationality || '',
            passportNumber: s.passportNumber || '',
            address: s.address || '',
            city: s.city || '',
            country: s.country || '',
            highestEducation: s.highestEducation || '',
            gpa: s.gpa || '',
            institution: '',
            englishTestType: s.englishTestType || '',
            englishTestScore: s.englishTestScore || '',
            englishTestDate: s.englishTestDate ? new Date(s.englishTestDate).toISOString().split('T')[0] : '',
            preferredCountry: s.preferredCountry || '',
            preferredCourse: s.preferredCourse || '',
            preferredIntake: s.preferredIntake || '',
            emergencyContact: s.emergencyContact || '',
            emergencyPhone: s.emergencyPhone || '',
            emergencyRelation: s.emergencyRelation || '',
            guardian: null,
          })
        }
      } catch {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [currentUser?.referenceId, currentUser?.email])

  const handleSave = async () => {
    if (!profile) return
    try {
      setSaving(true)
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.id, ...profile }),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-alo-blue border-alo-blue/30">
            {profile?.studentId || 'N/A'}
          </Badge>
          <Button onClick={handleSave} disabled={saving} className="bg-alo-orange hover:bg-alo-orange/90 text-white">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Profile Completion */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-alo-orange/5 to-alo-blue/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-alo-orange shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-alo-navy">Complete your profile for better university matching</p>
            <p className="text-xs text-gray-500 mt-0.5">Fill in all sections to improve your chances of getting offers</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <User className="h-3.5 w-3.5 mr-1.5" /> Personal
          </TabsTrigger>
          <TabsTrigger value="academic" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Academic
          </TabsTrigger>
          <TabsTrigger value="english" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <Globe className="h-3.5 w-3.5 mr-1.5" /> English Test
          </TabsTrigger>
          <TabsTrigger value="guardian" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <Phone className="h-3.5 w-3.5 mr-1.5" /> Guardian
          </TabsTrigger>
          <TabsTrigger value="emergency" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Emergency
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
                <User className="h-4 w-4 text-alo-orange" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">First Name</Label>
                  <Input value={profile?.firstName || ''} onChange={(e) => updateField('firstName', e.target.value)}
                    className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Last Name</Label>
                  <Input value={profile?.lastName || ''} onChange={(e) => updateField('lastName', e.target.value)}
                    className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input value={profile?.email || ''} readOnly className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <Input value={profile?.phone || ''} onChange={(e) => updateField('phone', e.target.value)}
                    className="mt-1" placeholder="+880" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">WhatsApp Number</Label>
                  <Input value={profile?.whatsappNumber || ''} onChange={(e) => updateField('whatsappNumber', e.target.value)}
                    className="mt-1" placeholder="+880" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date of Birth</Label>
                  <Input type="date" value={profile?.dateOfBirth || ''} onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Gender</Label>
                  <Select value={profile?.gender || ''} onValueChange={(v) => updateField('gender', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Nationality</Label>
                  <Input value={profile?.nationality || ''} onChange={(e) => updateField('nationality', e.target.value)}
                    className="mt-1" placeholder="e.g. Bangladeshi" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Passport Number</Label>
                  <Input value={profile?.passportNumber || ''} onChange={(e) => updateField('passportNumber', e.target.value)}
                    className="mt-1" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label className="text-xs text-gray-500">Address</Label>
                  <Input value={profile?.address || ''} onChange={(e) => updateField('address', e.target.value)}
                    className="mt-1" placeholder="Street address" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">City</Label>
                  <Input value={profile?.city || ''} onChange={(e) => updateField('city', e.target.value)}
                    className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Country</Label>
                  <Input value={profile?.country || ''} onChange={(e) => updateField('country', e.target.value)}
                    className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-alo-blue" /> Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Highest Education</Label>
                  <Select value={profile?.highestEducation || ''} onValueChange={(v) => updateField('highestEducation', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ssc">SSC / O-Level</SelectItem>
                      <SelectItem value="hsc">HSC / A-Level</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                      <SelectItem value="master">Master&apos;s Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">GPA / Grade</Label>
                  <Input value={profile?.gpa || ''} onChange={(e) => updateField('gpa', e.target.value)}
                    className="mt-1" placeholder="e.g. 3.5 / 4.0" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Institution</Label>
                  <Input value={profile?.institution || ''} onChange={(e) => updateField('institution', e.target.value)}
                    className="mt-1" placeholder="University/College name" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Preferred Country</Label>
                  <Select value={profile?.preferredCountry || ''} onValueChange={(v) => updateField('preferredCountry', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Malaysia">Malaysia</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Preferred Course</Label>
                  <Input value={profile?.preferredCourse || ''} onChange={(e) => updateField('preferredCourse', e.target.value)}
                    className="mt-1" placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Preferred Intake</Label>
                  <Select value={profile?.preferredIntake || ''} onValueChange={(v) => updateField('preferredIntake', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select intake" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sep-2025">September 2025</SelectItem>
                      <SelectItem value="Jan-2026">January 2026</SelectItem>
                      <SelectItem value="Sep-2026">September 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* English Test Tab */}
        <TabsContent value="english" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-600" /> English Test Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Test Type</Label>
                  <Select value={profile?.englishTestType || ''} onValueChange={(v) => updateField('englishTestType', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select test" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IELTS">IELTS</SelectItem>
                      <SelectItem value="TOEFL">TOEFL</SelectItem>
                      <SelectItem value="PTE">PTE Academic</SelectItem>
                      <SelectItem value="Duolingo">Duolingo English Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Overall Score</Label>
                  <Input value={profile?.englishTestScore || ''} onChange={(e) => updateField('englishTestScore', e.target.value)}
                    className="mt-1" placeholder="e.g. 7.0" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Test Date</Label>
                  <Input type="date" value={profile?.englishTestDate || ''} onChange={(e) => updateField('englishTestDate', e.target.value)}
                    className="mt-1" />
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  Please ensure your English test scores are valid (within the last 2 years). Upload your test certificate in the Documents section.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guardian Tab */}
        <TabsContent value="guardian" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-600" /> Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Guardian Name</Label>
                  <Input value={profile?.guardian?.name || ''} className="mt-1" placeholder="Full name" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Relationship</Label>
                  <Select value={profile?.guardian?.relationship || ''}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="brother">Brother</SelectItem>
                      <SelectItem value="sister">Sister</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <Input value={profile?.guardian?.phone || ''} className="mt-1" placeholder="+880" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input value={profile?.guardian?.email || ''} className="mt-1" placeholder="guardian@email.com" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Occupation</Label>
                  <Input value={profile?.guardian?.occupation || ''} className="mt-1" placeholder="Occupation" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contact Tab */}
        <TabsContent value="emergency" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-navy flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" /> Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Contact Name</Label>
                  <Input value={profile?.emergencyContact || ''} onChange={(e) => updateField('emergencyContact', e.target.value)}
                    className="mt-1" placeholder="Full name" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <Input value={profile?.emergencyPhone || ''} onChange={(e) => updateField('emergencyPhone', e.target.value)}
                    className="mt-1" placeholder="+880" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Relationship</Label>
                  <Input value={profile?.emergencyRelation || ''} onChange={(e) => updateField('emergencyRelation', e.target.value)}
                    className="mt-1" placeholder="e.g. Father, Mother" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
