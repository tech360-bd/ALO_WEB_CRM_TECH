'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Bell, Lock, Save, Eye, EyeOff } from 'lucide-react';

interface SettingsProfile { name: string; email: string; phone: string; department: string }

export default function EmployeeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [profile, setProfile] = useState<SettingsProfile>({ name: '', email: '', phone: '', department: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [privacyModeOn, setPrivacyModeOn] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/employee/settings', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload.data?.user) throw new Error(payload?.error || `Settings unavailable (HTTP ${response.status}).`);
      setProfile({
        name: payload.data.user.name || '',
        email: payload.data.user.email || '',
        phone: payload.data.user.phone || '',
        department: payload.data.employee?.department || payload.data.profile?.department || '',
      });
      setPrivacyModeOn(typeof payload.data.privacyModeOn === 'boolean' ? payload.data.privacyModeOn : null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/employee/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Profile update failed (HTTP ${response.status}).`);
      toast.success('Personal settings saved.');
      await loadSettings();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not save settings.');
    } finally { setSaving(false); }
  };

  const handlePrivacyChange = async (value: boolean) => {
    setSaving(true);
    try {
      const response = await fetch('/api/employee/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ privacyModeOn: value }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Privacy setting failed (HTTP ${response.status}).`);
      setPrivacyModeOn(value);
      toast.success('Privacy setting updated.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Privacy setting could not be updated.');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) { toast.error('Complete all password fields.'); return; }
    if (passwords.newPass !== passwords.confirm) { toast.error('New passwords do not match.'); return; }
    if (passwords.newPass.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/employee/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Password update failed (HTTP ${response.status}).`);
      toast.success(payload.message || 'Password changed successfully.');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Password could not be changed.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (error) return <div role="alert" className="rounded-xl border border-crm-warning-border bg-crm-warning-bg p-5 text-sm text-crm-warning-text">{error}</div>;

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold text-alo-text">Settings</h1><p className="text-sm text-alo-text-muted">Manage personal account preferences</p></div>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-0"><div className="flex items-center gap-2"><User className="w-5 h-5 text-alo-brand" /><CardTitle className="text-base font-semibold text-alo-text">Account Information</CardTitle></div></CardHeader>
        <CardContent className="pt-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Full Name</Label><Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="mt-1" maxLength={120} /></div>
          <div><Label>Email</Label><Input type="email" value={profile.email} disabled className="mt-1" /></div>
          <div><Label>Phone</Label><Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className="mt-1" maxLength={32} /></div>
          <div><Label>Department (HR controlled)</Label><Input value={profile.department || 'Not assigned'} disabled className="mt-1" /></div>
        </div><Button variant="brand" className="mt-4" onClick={() => void handleProfileSave()} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving…' : 'Save Changes'}</Button></CardContent>
      </Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-0"><div className="flex items-center gap-2"><Bell className="w-5 h-5 text-alo-brand" /><CardTitle className="text-base font-semibold text-alo-text">Notifications & Privacy</CardTitle></div></CardHeader>
        <CardContent className="pt-4 space-y-4"><p className="text-sm text-[var(--alo-body)]">Employee notifications are delivered and stored in your account. Per-event email/SMS preference controls are not configured.</p>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-alo-border p-3"><div><p className="text-sm font-medium">Privacy mode</p><p className="text-xs text-[var(--alo-text-muted)]">Controls your employee presence visibility where supported.</p></div><Switch checked={privacyModeOn ?? false} disabled={privacyModeOn === null || saving} onCheckedChange={(value) => void handlePrivacyChange(value)} /></div>
          {privacyModeOn === null && <p className="text-xs text-[var(--alo-text-muted)]">Privacy status is unavailable until the employee account is provisioned.</p>}
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-0"><div className="flex items-center gap-2"><Lock className="w-5 h-5 text-alo-brand" /><CardTitle className="text-base font-semibold text-alo-text">Change Password</CardTitle></div></CardHeader>
        <CardContent className="pt-4 space-y-3"><div><Label>Current Password</Label><div className="relative mt-1"><Input type={showCurrent ? 'text' : 'password'} value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} autoComplete="current-password" /><button type="button" aria-label={showCurrent ? 'Hide current password' : 'Show current password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-text-muted" onClick={() => setShowCurrent(!showCurrent)}>{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><Label>New Password</Label><div className="relative mt-1"><Input type={showNew ? 'text' : 'password'} value={passwords.newPass} onChange={(event) => setPasswords({ ...passwords, newPass: event.target.value })} autoComplete="new-password" minLength={8} /><button type="button" aria-label={showNew ? 'Hide new password' : 'Show new password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-text-muted" onClick={() => setShowNew(!showNew)}>{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <div><Label>Confirm New Password</Label><Input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} autoComplete="new-password" minLength={8} className="mt-1" /></div></div>
          <Button variant="brand" onClick={() => void handlePasswordChange()} disabled={saving}><Lock className="w-4 h-4 mr-2" />{saving ? 'Changing…' : 'Change Password'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
