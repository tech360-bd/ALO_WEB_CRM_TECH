'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Building2, MapPin, Phone, Mail, Globe, Briefcase,
  Pencil, Save, X, ShieldCheck, Calendar, User, Loader2, CheckCircle2
} from 'lucide-react';

interface ProfileData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  city: string;
  address: string;
  website: string;
  description: string;
  establishedYear: string;
  partnerId: string;
  approvalStatus: string;
  totalLeads: number;
  activeStudents: number;
}

const mockProfile: ProfileData = {
  companyName: 'Global Education Consultancy',
  contactPerson: 'Karim Uddin',
  email: 'partner@alo.edu.bd',
  phone: '+880 1712-345678',
  businessType: 'Education Consultancy',
  city: 'Dhaka',
  address: 'House 42, Road 11, Banani, Dhaka 1213',
  website: 'www.globaledu.com.bd',
  description: 'Leading education consultancy helping Bangladeshi students study abroad in top universities across the UK, USA, Canada, and Australia with a 95% visa success rate.',
  establishedYear: '2018',
  partnerId: 'AEP-2025-0042',
  approvalStatus: 'active',
  totalLeads: 24,
  activeStudents: 12,
};

export default function PartnerProfilePage() {
  const { user } = usePortalStore();
  const [profile, setProfile] = useState<ProfileData>(mockProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileData>(mockProfile);
  const [saved, setSaved] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch(`/api/partner/profile?partnerId=${user?.id || ''}`, { headers });
      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        const merged: ProfileData = {
          companyName: p.companyName || mockProfile.companyName,
          contactPerson: p.contactPerson || mockProfile.contactPerson,
          email: user?.email || mockProfile.email,
          phone: user?.phone || mockProfile.phone,
          businessType: p.businessType || mockProfile.businessType,
          city: p.city || mockProfile.city,
          address: p.address || mockProfile.address,
          website: p.website || mockProfile.website,
          description: p.description || mockProfile.description,
          establishedYear: p.establishedYear || mockProfile.establishedYear,
          partnerId: p.partnerId || mockProfile.partnerId,
          approvalStatus: p.approvalStatus || mockProfile.approvalStatus,
          totalLeads: p.totalLeads ?? mockProfile.totalLeads,
          activeStudents: p.activeStudents ?? mockProfile.activeStudents,
        };
        setProfile(merged);
        setForm(merged);
      }
    } catch {
      // fallback to mock data
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, user?.phone]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!form.contactPerson.trim()) {
      toast.error('Contact person is required');
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch('/api/partner/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          partnerId: user?.id || form.partnerId,
          companyName: form.companyName,
          contactPerson: form.contactPerson,
          email: form.email,
          phone: form.phone,
          businessType: form.businessType,
          city: form.city,
          address: form.address,
          website: form.website,
          description: form.description,
          establishedYear: form.establishedYear,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(form);
        setEditing(false);
        setSaved(true);
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCancel = () => { setForm(profile); setEditing(false); };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[480px] w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="muted" className="text-[11px] font-mono">{profile.partnerId}</Badge>
            <Badge variant={profile.approvalStatus === 'active' ? 'success' : 'warning'} className="text-[11px]">
              <ShieldCheck className="w-3 h-3 mr-1" />{profile.approvalStatus === 'active' ? 'Active' : 'Pending'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-alo-text">Company Profile</h1>
          <p className="text-sm text-alo-text-muted mt-0.5">Manage your partner organization details</p>
        </div>
        {!editing ? (
          <Button variant="brand" onClick={() => { setForm(profile); setEditing(true); }}>
            <Pencil className="w-4 h-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="brand" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving}><X className="w-4 h-4" /> Cancel</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-text">
                {editing ? 'Edit Company Information' : 'Company Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                    <Input id="companyName" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Enter company name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person <span className="text-red-500">*</span></Label>
                    <Input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Enter contact person" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="partner@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={form.businessType} onValueChange={(v) => setForm({ ...form, businessType: v })}>
                      <SelectTrigger id="businessType"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Education Consultancy">Education Consultancy</SelectItem>
                        <SelectItem value="Training Center">Training Center</SelectItem>
                        <SelectItem value="Language School">Language School</SelectItem>
                        <SelectItem value="Recruitment Agency">Recruitment Agency</SelectItem>
                        <SelectItem value="Immigration Services">Immigration Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Enter city" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Enter full address" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="www.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="establishedYear">Established Year</Label>
                    <Input id="establishedYear" value={form.establishedYear} onChange={(e) => setForm({ ...form, establishedYear: e.target.value })} placeholder="e.g. 2020" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of your organization" rows={3} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Building2} label="Company Name" value={profile.companyName} />
                  <InfoRow icon={User} label="Contact Person" value={profile.contactPerson} />
                  <InfoRow icon={Mail} label="Email" value={profile.email} />
                  <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                  <InfoRow icon={Briefcase} label="Business Type" value={profile.businessType} />
                  <InfoRow icon={MapPin} label="City" value={profile.city} />
                  <div className="sm:col-span-2">
                    <InfoRow icon={MapPin} label="Address" value={profile.address} />
                  </div>
                  <InfoRow icon={Globe} label="Website" value={profile.website} />
                  <InfoRow icon={Calendar} label="Established" value={profile.establishedYear} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Card (view mode only) */}
          {!editing && profile.description && (
            <Card className="bg-white rounded-xl border border-alo-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-alo-text">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-alo-text-secondary leading-relaxed">{profile.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Success Banner */}
          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-crm-success-bg border border-crm-success/20 text-crm-success-text text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile changes saved successfully.</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-text">Partner Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatItem label="Partner ID" value={profile.partnerId} mono />
              <Separator />
              <StatItem label="Total Leads" value={String(profile.totalLeads)} />
              <Separator />
              <StatItem label="Active Students" value={String(profile.activeStudents)} />
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-alo-text-secondary">Status</span>
                <Badge variant={profile.approvalStatus === 'active' ? 'success' : 'warning'} className="text-xs">
                  {profile.approvalStatus === 'active' ? 'Approved & Active' : 'Pending Review'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-text">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatItem label="Account Email" value={user?.email || profile.email} />
              <Separator />
              <StatItem label="User ID" value={user?.id || '—'} mono />
              <Separator />
              <StatItem label="Portal" value="Partner Portal" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────── */

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="w-8 h-8 rounded-lg bg-alo-brand-light/50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-alo-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-alo-text-muted">{label}</p>
        <p className="text-sm font-medium text-alo-text">{value || '—'}</p>
      </div>
    </div>
  );
}

function StatItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-alo-text-secondary">{label}</span>
      <span className={cn('text-sm font-semibold text-alo-text', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  );
}
