'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Plane, AlertTriangle, Save, Upload, FileText, ShieldCheck } from 'lucide-react'

export default function StudentPassport() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studentId, setStudentId] = useState<string>('')
  const [form, setForm] = useState({
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    passportCountry: '',
    nidNumber: '',
  })
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [nidFile, setNidFile] = useState<File | null>(null)

  const isExpiringSoon = form.passportExpiryDate && 
    new Date(form.passportExpiryDate) < new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        if (!currentUser?.email) { setLoading(false); return }
        const res = await fetch(`/api/students?limit=1&search=${currentUser.email}`)
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        if (json.students?.length > 0) {
          const s = json.students[0]
          setStudentId(s.id)
          setForm({
            passportNumber: s.passportNumber || '',
            passportIssueDate: '',
            passportExpiryDate: s.passportExpiry ? new Date(s.passportExpiry).toISOString().split('T')[0] : '',
            passportCountry: s.nationality || s.country || '',
            nidNumber: s.nidNumber || '',
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentUser])

  async function handleSave() {
    if (!studentId) { toast.error('Student record not found'); return }
    try {
      setSaving(true)
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: studentId,
          passportNumber: form.passportNumber,
          passportExpiry: form.passportExpiryDate || null,
          nidNumber: form.nidNumber,
          nationality: form.passportCountry,
        }),
      })
      if (!res.ok) throw new Error('Failed')

      // Upload passport scan if selected
      if (passportFile) {
        const formData = new FormData()
        formData.append('file', passportFile)
        formData.append('studentId', studentId)
        formData.append('documentType', 'passport')
        formData.append('documentName', `Passport - ${form.passportNumber}`)
        await fetch('/api/documents', { method: 'POST', body: formData })
      }

      // Upload NID scan if selected
      if (nidFile) {
        const formData = new FormData()
        formData.append('file', nidFile)
        formData.append('studentId', studentId)
        formData.append('documentType', 'nid')
        formData.append('documentName', `NID - ${form.nidNumber}`)
        await fetch('/api/documents', { method: 'POST', body: formData })
      }

      toast.success('Passport & NID information saved successfully')
    } catch (err) {
      toast.error('Failed to save passport information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>Passport & NID</h1>
          <p className="text-gray-500 text-sm">Manage your passport and national ID details</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: '#F37021' }}>
          <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Expiry Alert */}
      {isExpiringSoon && (
        <Card className="border-2 border-red-200" style={{ backgroundColor: '#FEF2F2' }}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Passport Expiring Soon!</p>
              <p className="text-sm text-red-600">
                Your passport expires on {form.passportExpiryDate}. Most countries require at least 6 months validity. 
                Please renew your passport before applying for a visa.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passport Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5" style={{ color: '#0066CC' }} />
            <CardTitle style={{ color: '#1A2332' }}>Passport Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Passport Number</Label>
              <Input
                value={form.passportNumber}
                onChange={(e) => setForm(p => ({ ...p, passportNumber: e.target.value.toUpperCase() }))}
                placeholder="e.g. AB1234567"
              />
            </div>
            <div>
              <Label>Passport Country</Label>
              <Select value={form.passportCountry} onValueChange={(v) => setForm(p => ({ ...p, passportCountry: v }))}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="Pakistan">Pakistan</SelectItem>
                  <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                  <SelectItem value="Nepal">Nepal</SelectItem>
                  <SelectItem value="Nigeria">Nigeria</SelectItem>
                  <SelectItem value="Ghana">Ghana</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={form.passportIssueDate}
                onChange={(e) => setForm(p => ({ ...p, passportIssueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.passportExpiryDate}
                onChange={(e) => setForm(p => ({ ...p, passportExpiryDate: e.target.value }))}
                className={isExpiringSoon ? 'border-red-400' : ''}
              />
              {isExpiringSoon && (
                <p className="text-xs text-red-500 mt-1">Passport expires within 6 months</p>
              )}
            </div>
          </div>

          <div>
            <Label>Upload Passport Scan</Label>
            <div className="mt-1 flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer hover:bg-gray-50" style={{ borderColor: '#0066CC' }}>
                <Upload className="w-4 h-4" style={{ color: '#0066CC' }} />
                <span className="text-sm">{passportFile ? passportFile.name : 'Choose file'}</span>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setPassportFile(e.target.files?.[0] || null)} />
              </label>
              {passportFile && <Badge variant="outline" style={{ borderColor: '#22C55E', color: '#22C55E' }}>Ready to upload</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NID Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: '#F37021' }} />
            <CardTitle style={{ color: '#1A2332' }}>National ID (NID)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>NID Number</Label>
              <Input
                value={form.nidNumber}
                onChange={(e) => setForm(p => ({ ...p, nidNumber: e.target.value }))}
                placeholder="National ID number"
              />
            </div>
          </div>

          <div>
            <Label>Upload NID Scan</Label>
            <div className="mt-1 flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer hover:bg-gray-50" style={{ borderColor: '#F37021' }}>
                <Upload className="w-4 h-4" style={{ color: '#F37021' }} />
                <span className="text-sm">{nidFile ? nidFile.name : 'Choose file'}</span>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setNidFile(e.target.files?.[0] || null)} />
              </label>
              {nidFile && <Badge variant="outline" style={{ borderColor: '#22C55E', color: '#22C55E' }}>Ready to upload</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
