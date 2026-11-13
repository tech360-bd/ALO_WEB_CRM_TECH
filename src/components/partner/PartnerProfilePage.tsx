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
  Building2, MapPin, Phone, Mail, Briefcase, Pencil, Save, X,
  ShieldCheck, User, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react';

/**
 * Only fields that actually exist on `PartnerProfile` (plus the portal user's
 * own contact details, which the API persists onto `PortalUser`) are modelled
 * here. Nothing is invented as a placeholder: when no profile row exists the
 * page renders an explicit empty state instead of sample data.
 */
interface ProfileData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  city: string;
  address: string;
  partnerId: string;
  approvalStatus: string;
  totalLeads: number;
  activeStudents: number;
  applicationCount: number | null;
}

const EMPTY_PROFILE: ProfileData = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  businessType: '',
  city: '',
  address: '',
  partnerId: '',
  approvalStatus: '',
  totalLeads: 0,
  activeStudents: 0,
  applicationCount: null,
};

export default function PartnerProfilePage() {
  const setView = usePortalStore((state) => state.setView);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [noProfile, setNoProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setNoProfile(false);
    try {
      const res = await fetch('/api/partner/profile', { credentials: 'include', cache: 'no-store' });
      const data = await res.json().catch(() => null);

      if (res.status === 404) {
        // A genuine "no profile row yet" state — never filled with sample data.
        setNoProfile(true);
        setProfile(null);
        return;
      }
      if (!res.ok || !data?.success || !data.profile) {
        throw new Error(data?.error || 'Partner profile could not be loaded.');
      }

      const p = data.profile;
      const loaded: ProfileData = {
        companyName: p.companyName || '',
        contactPerson: p.contactPerson || '',
        email: data.user?.email || '',
        phone: data.user?.phone || '',
        businessType: p.businessType || '',
        city: p.city || '',
        address: p.address || '',
        partnerId: p.partnerId || '',
        approvalStatus: p.approvalStatus || '',
        totalLeads: p.totalLeads ?? 0,
        activeStudents: p.activeStudents ?? 0,
        applicationCount: typeof p.applicationCount === 'number' ? p.applicationCount : null,
      };
      setProfile(loaded);
      setForm(loaded);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Partner profile could not be loaded.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

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
      const res = await fetch('/api/partner/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          contactPerson: form.contactPerson.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          businessType: form.businessType,
          city: form.city.trim(),
          address: form.address.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error(data?.error || 'Failed to update profile');
        return;
      }
      setProfile((prev) => (prev ? { ...prev, ...form } : form));
      setEditing(false);
      setSaved(true);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCancel = () => { if (profile) setForm(profile); setEditing(false); };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[420px] w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-1">
        <Card className="bg-white rounded-xl border border-destructive/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-alo-text">Profile could not be loaded</p>
                <p className="text-sm text-alo-text-secondary mt-1">{loadError}</p>
                <Button variant="outline" className="mt-3" onClick={() => void fetchProfile()}>Try again</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (noProfile || !profile) {
    return (
      <div className="p-1">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-8 text-center">
            <Building2 className="w-8 h-8 mx-auto text-alo-text-muted" />
            <p className="text-sm font-semibold text-alo-text mt-3">No partner profile is linked to this account</p>
            <p className="text-sm text-alo-text-secondary mt-1 max-w-md mx-auto">
              A partner record has not been created for your account yet. Contact your ALO Education account manager to have
              one set up, then reload this page.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void fetchProfile()}>Reload</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusActive = profile.approvalStatus === 'active';

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="muted" className="text-[11px] font-mono">{profile.partnerId || '—'}</Badge>
            {profile.approvalStatus && (
              <Badge variant={statusActive ? 'success' : 'warning'} className="text-[11px]">
                <ShieldCheck className="w-3 h-3 mr-1" />{statusActive ? 'Active' : 'Pending'}
              </Badge>
            )}
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
                    <Label htmlFor="companyName">Company Name <span className="text-crm-danger-text">*</span></Label>
                    <Input id="companyName" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Enter company name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person <span className="text-crm-danger-text">*</span></Label>
                    <Input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Enter contact person" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Sign-in email</Label>
                    <Input id="email" type="email" value={form.email} readOnly aria-readonly="true" />
                    <Button type="button" variant="link" className="h-auto p-0 " onClick={() => setView('partner-settings')}>Change email with verification in Settings</Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={form.businessType || undefined} onValueChange={(v) => setForm({ ...form, businessType: v })}>
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
                </div>
              )}
            </CardContent>
          </Card>

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
              <StatItem label="Partner ID" value={profile.partnerId || '—'} mono />
              <Separator />
              <StatItem label="Total Leads" value={String(profile.totalLeads)} />
              <Separator />
              <StatItem label="Student Profiles" value={String(profile.activeStudents)} />
              {profile.applicationCount !== null && (
                <>
                  <Separator />
                  <StatItem label="Applications" value={String(profile.applicationCount)} />
                </>
              )}
              {profile.approvalStatus && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-alo-text-secondary">Status</span>
                    <Badge variant={statusActive ? 'success' : 'warning'} className="text-xs">
                      {statusActive ? 'Approved & Active' : 'Pending Review'}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-alo-text">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatItem label="Account Email" value={profile.email || '—'} />
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
