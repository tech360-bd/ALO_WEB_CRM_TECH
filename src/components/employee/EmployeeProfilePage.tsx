'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Building2, Calendar, Briefcase, Shield, Pencil, Save, X, Heart, UserCircle, Loader2 } from 'lucide-react';

interface ProfileData {
  name: string;
  employeeId: string;
  position: string;
  department: string;
  branch: string;
  joinDate: string;
  status: string;
  phone: string;
  email: string;
  emergencyContact: string;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not recorded';
}

export default function EmployeeProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [savedProfile, setSavedProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/employee/profile', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.data) throw new Error(payload?.error || `Profile unavailable (HTTP ${response.status}).`);
      const value = payload.data;
      const employee = value.employee || {};
      const user = value.user || {};
      const result: ProfileData = {
        name: user.name || employee.name || '',
        employeeId: employee.employeeId || value.employeeId || '',
        position: employee.designation || value.designation || '',
        department: employee.department || value.department || '',
        branch: employee.branch || value.branch || '',
        joinDate: value.joinDate || employee.joinedAt || '',
        status: employee.status || user.status || 'unknown',
        phone: user.phone || employee.phone || '',
        email: user.email || employee.email || '',
        emergencyContact: value.emergencyContact || '',
      };
      setProfile(result);
      setSavedProfile(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Profile could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const response = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, emergencyContact: profile.emergencyContact }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Profile could not be saved (HTTP ${response.status}).`);
      await loadProfile();
      setEditMode(false);
      toast.success('Profile changes saved.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Profile could not be saved.');
    } finally {
      setSaving(false);
    }
  }, [loadProfile, profile]);

  const handleCancel = () => {
    setProfile(savedProfile);
    setEditMode(false);
  };

  if (loading) {
    return <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Skeleton className="h-72 rounded-xl" /><div className="lg:col-span-2 space-y-6"><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div></div></div>;
  }

  if (!profile) {
    return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error || 'Your employee profile is unavailable.'}</div>;
  }

  const displayInitials = profile.name.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'E';
  const setField = (field: keyof ProfileData, value: string) => setProfile((current) => current ? { ...current, [field]: value } : current);

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-alo-text">My Profile</h1><p className="text-sm text-alo-text-muted mt-1">Personal information and employment details</p></div>
        {!editMode ? <Button variant="brand" size="sm" onClick={() => setEditMode(true)}><Pencil className="w-4 h-4" /> Edit personal details</Button> : <div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleCancel}><X className="w-4 h-4" /> Cancel</Button><Button variant="brand" size="sm" onClick={() => void handleSave()} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? 'Saving…' : 'Save Changes'}</Button></div>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4"><AvatarFallback className="bg-alo-brand-light text-alo-brand text-2xl font-bold">{displayInitials}</AvatarFallback></Avatar>
            <h2 className="text-lg font-semibold text-alo-text">{profile.name || 'Employee'}</h2>
            <p className="text-sm text-alo-text-secondary mt-0.5">{profile.position || 'Position not assigned'}</p>
            <Badge variant="brand" className="mt-2">{profile.department || 'Department not assigned'}</Badge>
            <Separator className="my-4" />
            <div className="w-full space-y-3 text-left">
              <InfoRow icon={Building2} label="Branch" value={profile.branch || 'Not assigned'} />
              <InfoRow icon={Calendar} label="Join date" value={formatDate(profile.joinDate)} />
              <InfoRow icon={Shield} label="Status" value={profile.status} />
            </div>
          </CardContent></Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border"><CardHeader><CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2"><UserCircle className="w-5 h-5 text-alo-brand" /> Personal Information</CardTitle></CardHeader>
            <CardContent>{editMode ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name" value={profile.name} onChange={(value) => setField('name', value)} />
              <FormField label="Phone Number" value={profile.phone} onChange={(value) => setField('phone', value)} />
              <FormField label="Email Address" value={profile.email} disabled />
              <FormField label="Employee ID" value={profile.employeeId} disabled />
              <FormField label="Position" value={profile.position} disabled />
              <FormField label="Department" value={profile.department} disabled />
              <FormField label="Branch" value={profile.branch} disabled />
              <FormField label="Join Date" value={formatDate(profile.joinDate)} disabled />
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <InfoRow icon={User} label="Full Name" value={profile.name || 'Not recorded'} />
              <InfoRow icon={Briefcase} label="Employee ID" value={profile.employeeId || 'Not assigned'} mono />
              <InfoRow icon={UserCircle} label="Position" value={profile.position || 'Not assigned'} />
              <InfoRow icon={Building2} label="Department" value={profile.department || 'Not assigned'} />
              <InfoRow icon={MapPin} label="Branch" value={profile.branch || 'Not assigned'} />
              <InfoRow icon={Calendar} label="Join Date" value={formatDate(profile.joinDate)} />
              <InfoRow icon={Phone} label="Phone" value={profile.phone || 'Not recorded'} />
              <InfoRow icon={Mail} label="Email" value={profile.email || 'Not recorded'} />
            </div>}</CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-alo-border"><CardHeader><CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Emergency Contact</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-alo-text-muted mb-4">Visible only in your authenticated profile. HR access is managed through the authorized HR workflow.</p>
              {editMode ? <FormField label="Emergency contact details" value={profile.emergencyContact} onChange={(value) => setField('emergencyContact', value)} /> : <InfoRow icon={Heart} label="Emergency Contact" value={profile.emergencyContact || 'Not recorded'} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-alo-page flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-alo-text-muted" /></div><div className="min-w-0"><p className="text-xs text-alo-text-muted">{label}</p><p className={cn('text-sm text-alo-text font-medium truncate', mono && 'font-mono')}>{value}</p></div></div>;
}

function FormField({ label, value, disabled, onChange }: { label: string; value: string; disabled?: boolean; onChange?: (value: string) => void }) {
  return <div className="space-y-2"><Label className="text-sm text-alo-text-secondary">{label}</Label><Input value={value} disabled={disabled} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className={cn(disabled ? 'bg-muted border-alo-border text-alo-text-muted' : 'bg-alo-page border-alo-border')} /></div>;
}
