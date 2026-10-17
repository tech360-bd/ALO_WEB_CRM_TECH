'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Users, Phone, Mail, Briefcase, Save, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'

interface GuardianData {
  id?: string
  fatherName: string
  fatherPhone: string
  fatherEmail: string
  fatherOccupation: string
  motherName: string
  motherPhone: string
  motherEmail: string
  motherOccupation: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  guardianRelation: string
  guardianAddress: string
}

const emptyGuardian: GuardianData = {
  fatherName: '', fatherPhone: '', fatherEmail: '', fatherOccupation: '',
  motherName: '', motherPhone: '', motherEmail: '', motherOccupation: '',
  guardianName: '', guardianPhone: '', guardianEmail: '', guardianRelation: '', guardianAddress: '',
}

export default function StudentGuardian() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guardian, setGuardian] = useState<GuardianData>(emptyGuardian)
  const [studentId, setStudentId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('father')

  useEffect(() => {
    async function fetchGuardian() {
      try {
        setLoading(true)
        if (!currentUser?.referenceId && !currentUser?.email) {
          setLoading(false)
          return
        }
        const res = await fetch(`/api/students?limit=1&search=${currentUser?.email || ''}`)
        if (!res.ok) throw new Error('Failed to load')
        const json = await res.json()
        if (json.students && json.students.length > 0) {
          const s = json.students[0]
          setStudentId(s.id)
          if (s.guardian) {
            setGuardian({
              id: s.guardian.id,
              fatherName: s.guardian.fatherName || '',
              fatherPhone: s.guardian.fatherPhone || '',
              fatherEmail: s.guardian.fatherEmail || '',
              fatherOccupation: s.guardian.fatherOccupation || '',
              motherName: s.guardian.motherName || '',
              motherPhone: s.guardian.motherPhone || '',
              motherEmail: s.guardian.motherEmail || '',
              motherOccupation: s.guardian.motherOccupation || '',
              guardianName: s.guardian.guardianName || '',
              guardianPhone: s.guardian.guardianPhone || '',
              guardianEmail: s.guardian.guardianEmail || '',
              guardianRelation: s.guardian.guardianRelation || '',
              guardianAddress: s.guardian.guardianAddress || '',
            })
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchGuardian()
  }, [currentUser])

  async function handleSave() {
    if (!studentId) {
      toast.error('Student record not found')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: studentId, guardian }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Guardian information saved successfully')
    } catch (err) {
      toast.error('Failed to save guardian information')
    } finally {
      setSaving(false)
    }
  }

  function updateField(field: keyof GuardianData, value: string) {
    setGuardian(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>Guardian Information</h1>
          <p className="text-gray-500 text-sm">Manage your guardian and emergency contact details</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="text-white"
          style={{ backgroundColor: '#F37021' }}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="father">Father</TabsTrigger>
          <TabsTrigger value="mother">Mother</TabsTrigger>
          <TabsTrigger value="other">Other Guardian</TabsTrigger>
        </TabsList>

        {/* Father's Details */}
        <TabsContent value="father">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: '#0066CC' }} />
                <CardTitle style={{ color: '#1A2332' }}>Father&apos;s Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={guardian.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} placeholder="Father's full name" />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={guardian.fatherPhone} onChange={(e) => updateField('fatherPhone', e.target.value)} placeholder="+880..." />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={guardian.fatherEmail} onChange={(e) => updateField('fatherEmail', e.target.value)} placeholder="father@email.com" type="email" />
                </div>
                <div>
                  <Label>Occupation</Label>
                  <Input value={guardian.fatherOccupation} onChange={(e) => updateField('fatherOccupation', e.target.value)} placeholder="Occupation" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mother's Details */}
        <TabsContent value="mother">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: '#F37021' }} />
                <CardTitle style={{ color: '#1A2332' }}>Mother&apos;s Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={guardian.motherName} onChange={(e) => updateField('motherName', e.target.value)} placeholder="Mother's full name" />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={guardian.motherPhone} onChange={(e) => updateField('motherPhone', e.target.value)} placeholder="+880..." />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={guardian.motherEmail} onChange={(e) => updateField('motherEmail', e.target.value)} placeholder="mother@email.com" type="email" />
                </div>
                <div>
                  <Label>Occupation</Label>
                  <Input value={guardian.motherOccupation} onChange={(e) => updateField('motherOccupation', e.target.value)} placeholder="Occupation" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Guardian */}
        <TabsContent value="other">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: '#FFB347' }} />
                <CardTitle style={{ color: '#1A2332' }}>Other Guardian / Emergency Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Guardian Name</Label>
                  <Input value={guardian.guardianName} onChange={(e) => updateField('guardianName', e.target.value)} placeholder="Guardian's full name" />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Select value={guardian.guardianRelation} onValueChange={(v) => updateField('guardianRelation', v)}>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncle">Uncle</SelectItem>
                      <SelectItem value="aunt">Aunt</SelectItem>
                      <SelectItem value="brother">Brother</SelectItem>
                      <SelectItem value="sister">Sister</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={guardian.guardianPhone} onChange={(e) => updateField('guardianPhone', e.target.value)} placeholder="+880..." />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={guardian.guardianEmail} onChange={(e) => updateField('guardianEmail', e.target.value)} placeholder="guardian@email.com" type="email" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={guardian.guardianAddress} onChange={(e) => updateField('guardianAddress', e.target.value)} placeholder="Full address" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
