'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Bell, Lock, AlertTriangle, Save, Loader2, Eye, EyeOff, Building2, Mail, Phone, MapPin, RefreshCw } from 'lucide-react';

interface NotificationPreferences {
  emailAllowed: boolean;
  smsAllowed: boolean;
  whatsappAllowed: boolean;
  phoneAllowed: boolean;
  marketingAllowed: boolean;
  transactionalAllowed: boolean;
}
const DEFAULT_PREFERENCES: NotificationPreferences = { emailAllowed: true, smsAllowed: true, whatsappAllowed: false, phoneAllowed: true, marketingAllowed: true, transactionalAllowed: true };
const PREFERENCE_ROWS: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
  { key: 'emailAllowed', label: 'Email', description: 'Email communication permission' },
  { key: 'smsAllowed', label: 'SMS', description: 'SMS communication permission' },
  { key: 'whatsappAllowed', label: 'WhatsApp', description: 'WhatsApp communication permission' },
  { key: 'phoneAllowed', label: 'Phone', description: 'Phone-call communication permission' },
  { key: 'marketingAllowed', label: 'Marketing', description: 'Marketing messages permission' },
  { key: 'transactionalAllowed', label: 'Transactional', description: 'Account and service messages permission' },
];

export default function PartnerSettingsPage() {
  const setView = usePortalStore((state) => state.setView);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerificationRequested, setEmailVerificationRequested] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/partner/settings', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.data?.profile) {
        throw new Error(payload.error || `Could not load settings (HTTP ${response.status})`);
      }
      const profile = payload.data.profile;
      const user = payload.data.user || {};
      setCompanyName(String(profile.companyName || ''));
      setContactPerson(String(profile.contactPerson || ''));
      setAddress(String(profile.address || ''));
      setEmail(String(user.email || ''));
      setSavedEmail(String(user.email || ''));
      setEmailOtp('');
      setEmailVerificationRequested(false);
      setPhone(String(user.phone || ''));
      setNotifications({ ...DEFAULT_PREFERENCES, ...(payload.data.preferences || {}) });
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : 'Could not load partner settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  const updateSection = async (section: string, data: Record<string, unknown>) => {
    const response = await fetch('/api/partner/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, data }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) throw new Error(payload.error || `Settings update failed (HTTP ${response.status})`);
    return payload;
  };

  const handleSaveAccount = async () => {
    if (!companyName.trim()) { toast.error('Company name is required.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error('Enter a valid email address.'); return; }
    setSaving('account');
    try {
      await updateSection('account', { companyName, contactPerson, email: savedEmail, phone, address });
      toast.success(email.trim().toLowerCase() !== savedEmail ? 'Profile details saved. Verify the new email below to change your sign-in address.' : 'Account settings saved.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Account settings could not be saved.');
    } finally {
      setSaving(null);
    }
  };

  const handleRequestEmailCode = async () => {
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) { toast.error('Enter a valid new email address.'); return; }
    if (nextEmail === savedEmail) { toast.error('Enter a different email address first.'); return; }
    setSaving('email');
    try {
      const response = await fetch('/api/partner/settings/email', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nextEmail }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Verification code could not be sent.');
      setEmailVerificationRequested(true);
      setEmailOtp('');
      toast.success(payload.message || 'Verification code sent to the new address.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Verification code could not be sent.');
    } finally { setSaving(null); }
  };

  const handleVerifyEmail = async () => {
    const nextEmail = email.trim().toLowerCase();
    if (!emailVerificationRequested) { toast.error('Request a verification code first.'); return; }
    if (!/^\d{6}$/.test(emailOtp.trim())) { toast.error('Enter the six-digit code sent to your new email.'); return; }
    setSaving('email');
    try {
      const response = await fetch('/api/partner/settings/email', {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nextEmail, otp: emailOtp.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Email could not be updated.');
      setEmail(nextEmail);
      setSavedEmail(nextEmail);
      setEmailOtp('');
      setEmailVerificationRequested(false);
      usePortalStore.setState((state) => ({ user: state.user ? { ...state.user, email: nextEmail } : null }));
      toast.success(payload.message || 'Email updated and verified.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Email could not be updated.');
    } finally { setSaving(null); }
  };

  const handleSaveNotifications = async () => {
    setSaving('notifications');
    try {
      await updateSection('notifications', notifications as unknown as Record<string, unknown>);
      toast.success('Communication preferences saved.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Communication preferences could not be saved.');
    } finally {
      setSaving(null);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd) { toast.error('Current password is required.'); return; }
    if (newPwd.length < 8 || !/\d/.test(newPwd)) { toast.error('New password must be at least 8 characters and include a number.'); return; }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match.'); return; }
    setSaving('password');
    try {
      await updateSection('password', { currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      toast.success('Password updated; other active sessions were revoked.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Password could not be changed.');
    } finally {
      setSaving(null);
    }
  };

  const handleDeactivationRequest = async () => {
    setSaving('deactivation');
    try {
      const response = await fetch('/api/partner/help', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Partner account deactivation request', category: 'Other', priority: 'Medium', description: `The signed-in partner account for ${companyName || 'this company'} requests deactivation. Please review and confirm the required next steps.` }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Deactivation request could not be saved.');
      toast.success('Deactivation request saved as a support ticket. The account has not been deactivated.');
      setView('partner-messages');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Deactivation request could not be saved.');
    } finally {
      setSaving(null);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => setNotifications((current) => ({ ...current, [key]: !current[key] }));

  if (loading) return <div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-[300px] w-full rounded-xl" /><Skeleton className="h-[300px] w-full rounded-xl" /></div>;

  return (
    <div className="space-y-6 p-1 max-w-3xl">
      <div><h1 className="text-2xl font-bold text-alo-text">Settings</h1><p className="text-sm text-alo-text-muted mt-0.5">Manage your partner contact details, communication permissions, and password.</p></div>
      {loadError && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-amber-900">{loadError}</p><Button variant="outline" size="sm" onClick={() => void fetchSettings()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></CardContent></Card>}

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><User className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Account Settings</CardTitle><CardDescription className="text-xs text-alo-text-muted">Changes are saved to the partner profile and signed-in user record.</CardDescription></div></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-2 sm:col-span-2"><Label htmlFor="settCompany" className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-alo-text-muted" />Company Name <span className="text-red-500">*</span></Label><Input id="settCompany" maxLength={200} value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Your company name" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="settContact">Contact Person</Label><Input id="settContact" maxLength={200} value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} placeholder="Contact person name" /></div><div className="space-y-2"><Label htmlFor="settEmail" className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-alo-text-muted" />Sign-in email <span className="text-red-500">*</span></Label><Input id="settEmail" type="email" maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setEmailVerificationRequested(false); setEmailOtp(''); }} placeholder="email@example.com" />{email.trim().toLowerCase() !== savedEmail && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs text-amber-900">A verification code must be confirmed before this email becomes your sign-in address.</p><Button type="button" variant="outline" size="sm" onClick={() => void handleRequestEmailCode()} disabled={saving === 'email' || Boolean(loadError)}>{saving === 'email' ? 'Sending…' : emailVerificationRequested ? 'Send another code' : 'Send verification code'}</Button>{emailVerificationRequested && <div className="flex gap-2"><Input aria-label="Six-digit email verification code" inputMode="numeric" maxLength={6} value={emailOtp} onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" /><Button type="button" onClick={() => void handleVerifyEmail()} disabled={saving === 'email' || emailOtp.length !== 6}>{saving === 'email' ? 'Verifying…' : 'Verify email'}</Button></div>}</div>}</div><div className="space-y-2"><Label htmlFor="settPhone" className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-alo-text-muted" />Phone</Label><Input id="settPhone" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="settAddress" className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-alo-text-muted" />Address</Label><Input id="settAddress" maxLength={1000} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Office address" /></div></div><div className="flex justify-end pt-2"><Button variant="brand" onClick={() => void handleSaveAccount()} disabled={saving === 'account' || Boolean(loadError)}>{saving === 'account' ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Changes</>}</Button></div></CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><Bell className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Communication Preferences</CardTitle><CardDescription className="text-xs text-alo-text-muted">Persisted permissions for partner communication channels.</CardDescription></div></div></CardHeader><CardContent className="space-y-4"><div className="rounded-lg border border-alo-border overflow-hidden"><Table><TableHeader><TableRow className="bg-muted/30"><TableHead>Channel or purpose</TableHead><TableHead className="text-right">Allow</TableHead></TableRow></TableHeader><TableBody>{PREFERENCE_ROWS.map((item) => <TableRow key={item.key}><TableCell><p className="text-sm font-medium text-alo-text">{item.label}</p><p className="text-xs text-alo-text-muted">{item.description}</p></TableCell><TableCell className="text-right"><Switch checked={notifications[item.key]} onCheckedChange={() => togglePreference(item.key)} aria-label={`Allow ${item.label} communications`} /></TableCell></TableRow>)}</TableBody></Table></div><div className="flex justify-end"><Button variant="brand" onClick={() => void handleSaveNotifications()} disabled={saving === 'notifications' || Boolean(loadError)}>{saving === 'notifications' ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Preferences</>}</Button></div></CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><Lock className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Change Password</CardTitle><CardDescription className="text-xs text-alo-text-muted">Requires your current password. Other active sessions are revoked after a successful change.</CardDescription></div></div></CardHeader><CardContent className="space-y-4"><PasswordInput id="curPwd" label="Current Password" value={currentPwd} onChange={setCurrentPwd} visible={showCurrent} setVisible={setShowCurrent} /><PasswordInput id="newPwd" label="New Password" value={newPwd} onChange={setNewPwd} visible={showNew} setVisible={setShowNew} hint="Minimum 8 characters and at least one number." /><PasswordInput id="confPwd" label="Confirm New Password" value={confirmPwd} onChange={setConfirmPwd} visible={showConfirm} setVisible={setShowConfirm} /><div className="flex justify-end"><Button variant="brand" onClick={() => void handleChangePassword()} disabled={saving === 'password' || Boolean(loadError)}>{saving === 'password' ? <><Loader2 className="w-4 h-4 animate-spin" />Updating…</> : <><Lock className="w-4 h-4" />Change Password</>}</Button></div></CardContent></Card>

      <Card className="bg-white rounded-xl border border-red-200"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div><div><CardTitle className="text-lg text-red-600">Account Deactivation</CardTitle><CardDescription className="text-xs text-alo-text-muted">Requests are reviewed by ALO; this does not deactivate your account immediately.</CardDescription></div></div></CardHeader><CardContent><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-red-100 bg-red-50/50"><div><p className="text-sm font-medium text-alo-text">Request account deactivation</p><p className="text-xs text-alo-text-muted mt-0.5">Creates a saved support ticket so the team can review the request.</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="danger" size="sm" disabled={Boolean(loadError) || saving === 'deactivation'}><AlertTriangle className="w-4 h-4" />Request Deactivation</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Submit a deactivation request?</AlertDialogTitle><AlertDialogDescription>This will create a support ticket for review. Your partner account will remain active until an authorized team member processes the request.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { void handleDeactivationRequest(); }}>Submit Request</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></CardContent></Card>
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, visible, setVisible, hint }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; setVisible: (visible: boolean) => void; hint?: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label} <span className="text-red-500">*</span></Label><div className="relative"><Input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} className="pr-10" autoComplete="off" /><button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-text-muted hover:text-alo-text" aria-label={visible ? `Hide ${label}` : `Show ${label}`}>{visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>{hint && <p className="text-xs text-alo-text-muted">{hint}</p>}</div>;
}
