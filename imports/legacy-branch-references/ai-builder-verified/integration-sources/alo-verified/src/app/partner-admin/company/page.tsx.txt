'use client'

import { useEffect, useState } from 'react'
import {
  Building2, Save, Mail, Phone, MapPin, Globe,
  Wallet, FileText, CheckCircle2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'

interface CompanyData {
  partner: {
    id: string
    partnerId: string
    companyName: string
    contactPerson: string
    email: string
    phone: string | null
    whatsappNumber: string | null
    address: string | null
    city: string | null
    country: string
    website: string | null
    businessType: string | null
    panNumber: string | null
    gstNumber: string | null
    bankName: string | null
    bankAccount: string | null
    bankBranch: string | null
    ifscCode: string | null
    swiftCode: string | null
    status: string
    commissionRate: number
  }
}

export default function PartnerAdminCompanyPage() {
  const [data, setData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    const session = getSession()
    if (!session) return
    fetch('/api/partner-admin/company', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.error || `Request failed: ${r.status}`)
        }
        return r.json()
      })
      .then((d) => {
        setData(d)
        const p = d.partner
        setForm({
          companyName: p.companyName || '',
          contactPerson: p.contactPerson || '',
          phone: p.phone || '',
          whatsappNumber: p.whatsappNumber || '',
          address: p.address || '',
          city: p.city || '',
          country: p.country || '',
          website: p.website || '',
          businessType: p.businessType || '',
          panNumber: p.panNumber || '',
          gstNumber: p.gstNumber || '',
          bankName: p.bankName || '',
          bankAccount: p.bankAccount || '',
          bankBranch: p.bankBranch || '',
          ifscCode: p.ifscCode || '',
          swiftCode: p.swiftCode || '',
        })
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    const session = getSession()
    if (!session) return
    setSaving(true)
    try {
      const res = await fetch('/api/partner-admin/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setData({ partner: json.partner })
      toast.success('Company profile updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Company Profile" description="Loading..." />
        <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    )
  }

  const p = data?.partner

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Profile"
        description="Maintain your organization's contact, banking, and tax details. Changes are audited."
        action={
          <Button onClick={handleSave} disabled={saving} className="h-12 bg-[#0057B8] hover:bg-[#004a9c] text-white">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Identity summary */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Identity</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Partner ID</p>
              <p className="font-semibold text-slate-900">{p?.partnerId || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <Badge className="capitalize border-0 bg-green-50 text-green-600">{p?.status || 'active'}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500">Commission Rate</p>
              <p className="font-semibold text-slate-900">{p?.commissionRate ?? 0}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email (login)</p>
              <p className="font-semibold text-slate-900 truncate">{p?.email || '—'}</p>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-6 border-0 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" value={form.companyName || ''} onChange={(e) => update('companyName', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input id="contactPerson" value={form.contactPerson || ''} onChange={(e) => update('contactPerson', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="phone"><Phone className="h-3 w-3 inline mr-1" />Phone</Label>
              <Input id="phone" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="whatsappNumber"><Mail className="h-3 w-3 inline mr-1" />WhatsApp</Label>
              <Input id="whatsappNumber" value={form.whatsappNumber || ''} onChange={(e) => update('whatsappNumber', e.target.value)} className="h-12 mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address"><MapPin className="h-3 w-3 inline mr-1" />Address</Label>
              <Input id="address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city || ''} onChange={(e) => update('city', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country || ''} onChange={(e) => update('country', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="website"><Globe className="h-3 w-3 inline mr-1" />Website</Label>
              <Input id="website" value={form.website || ''} onChange={(e) => update('website', e.target.value)} className="h-12 mt-1" placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <select
                id="businessType"
                value={form.businessType || ''}
                onChange={(e) => update('businessType', e.target.value)}
                className="h-12 w-full mt-1 px-3 rounded-md border border-slate-200 text-sm bg-white"
              >
                <option value="">Select...</option>
                <option value="agency">Agency</option>
                <option value="consultant">Consultant</option>
                <option value="individual">Individual</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Tax & Banking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#E8501A]" />
            <h3 className="font-bold text-slate-900">Tax Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input id="panNumber" value={form.panNumber || ''} onChange={(e) => update('panNumber', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input id="gstNumber" value={form.gstNumber || ''} onChange={(e) => update('gstNumber', e.target.value)} className="h-12 mt-1" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-slate-900">Bank Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" value={form.bankName || ''} onChange={(e) => update('bankName', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="bankAccount">Account Number</Label>
              <Input id="bankAccount" value={form.bankAccount || ''} onChange={(e) => update('bankAccount', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="bankBranch">Branch</Label>
              <Input id="bankBranch" value={form.bankBranch || ''} onChange={(e) => update('bankBranch', e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input id="ifscCode" value={form.ifscCode || ''} onChange={(e) => update('ifscCode', e.target.value)} className="h-12 mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="swiftCode">SWIFT Code</Label>
              <Input id="swiftCode" value={form.swiftCode || ''} onChange={(e) => update('swiftCode', e.target.value)} className="h-12 mt-1" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-0 shadow-sm bg-green-50">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Audit trail active</p>
            <p className="text-xs text-slate-600 mt-1">
              All updates to your company profile are recorded in the immutable audit log with old and new values,
              timestamp, and acting user. Bank and tax fields are encrypted at rest in production.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
