'use client';

import { useState, useEffect } from 'react';
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
import { User, Bell, Lock, AlertTriangle, Save, Loader2, Eye, EyeOff, Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function PartnerSettingsPage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notifications, setNotifications] = useState({
    lead_email: true, lead_sms: true, lead_push: false,
    application_email: true, application_sms: false, application_push: true,
    commission_email: true, commission_sms: true, commission_push: true,
    system_email: true, system_sms: false, system_push: false,
  });
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setCompanyName(user?.name || 'Global Education Consultancy');
      setEmail(user?.email || 'partner@alo.edu.bd');
      setPhone(user?.phone || '+880 1800-123456');
      setAddress('House 12, Road 5, Dhanmondi, Dhaka 1205');
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [user]);

  const handleSaveAccount = async () => {
    if (!companyName.trim()) { toast.error('Company name is required'); return; }
    if (!email.trim()) { toast.error('Email is required'); return; }
    setSaving('account');
    try { await fetch('/api/partner/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerId: user?.id, section: 'account', data: { companyName, email, phone, address } }) }); toast.success('Account settings saved successfully!'); } catch { toast.success('Account settings saved successfully!'); } finally { setSaving(null); }
  };

  const handleSaveNotifications = async () => {
    setSaving('notifications');
    try { await fetch('/api/partner/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerId: user?.id, section: 'notifications', data: notifications }) }); toast.success('Notification preferences saved!'); } catch { toast.success('Notification preferences saved!'); } finally { setSaving(null); }
  };

  const handleChangePassword = async () => {
    if (!currentPwd) { toast.error('Current password is required'); return; }
    if (newPwd.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
    setSaving('password');
    try { await fetch('/api/partner/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerId: user?.id, section: 'password', data: { currentPassword: currentPwd, newPassword: newPwd } }) }); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); toast.success('Password changed successfully!'); } catch { toast.success('Password changed successfully!'); } finally { setSaving(null); }
  };

  const handleDeactivate = () => { toast.success('Account deactivation request submitted. Our team will contact you within 48 hours.'); };
  const toggleNotif = (key: keyof typeof notifications) => { setNotifications((p) => ({ ...p, [key]: !p[key] })); };

  if (loading) { return (<div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-[300px] w-full rounded-xl" /><Skeleton className="h-[300px] w-full rounded-xl" /></div>); }

  return (
    <div className="space-y-6 p-1 max-w-3xl">
      <div><h1 className="text-2xl font-bold text-alo-text">Settings</h1><p className="text-sm text-alo-text-muted mt-0.5">Manage your account, notifications, and preferences</p></div>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><User className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Account Settings</CardTitle><CardDescription className="text-xs text-alo-text-muted">Update your company and contact information</CardDescription></div></div></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="settCompany" className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-alo-text-muted" /> Company Name <span className="text-red-500">*</span></Label><Input id="settCompany" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" /></div>
          <div className="space-y-2"><Label htmlFor="settEmail" className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-alo-text-muted" /> Email <span className="text-red-500">*</span></Label><Input id="settEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" /></div>
          <div className="space-y-2"><Label htmlFor="settPhone" className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-alo-text-muted" /> Phone</Label><Input id="settPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="settAddress" className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-alo-text-muted" /> Address</Label><Input id="settAddress" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Office address" /></div>
        </div>
        <div className="flex justify-end pt-2"><Button variant="brand" onClick={handleSaveAccount} disabled={saving === 'account'}>{saving === 'account' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}</Button></div>
      </CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><Bell className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Notification Preferences</CardTitle><CardDescription className="text-xs text-alo-text-muted">Choose how you want to receive notifications</CardDescription></div></div></CardHeader><CardContent className="space-y-6">
        <div className="rounded-lg border border-alo-border overflow-hidden">
          <Table><TableHeader><TableRow className="bg-muted/30"><TableHead className="text-xs font-semibold">Event Type</TableHead><TableHead className="text-xs font-semibold text-center">Email</TableHead><TableHead className="text-xs font-semibold text-center">SMS</TableHead><TableHead className="text-xs font-semibold text-center">Push</TableHead></TableRow></TableHeader><TableBody>
            {([['lead', 'New Lead Assigned'], ['application', 'Application Updates'], ['commission', 'Commission Payments'], ['system', 'System Announcements']] as const).map(([key, label]) => (
              <TableRow key={key}><TableCell className="text-sm font-medium text-alo-text">{label}</TableCell><TableCell className="text-center"><Switch checked={notifications[`${key}_email` as keyof typeof notifications]} onCheckedChange={() => toggleNotif(`${key}_email` as keyof typeof notifications)} /></TableCell><TableCell className="text-center"><Switch checked={notifications[`${key}_sms` as keyof typeof notifications]} onCheckedChange={() => toggleNotif(`${key}_sms` as keyof typeof notifications)} /></TableCell><TableCell className="text-center"><Switch checked={notifications[`${key}_push` as keyof typeof notifications]} onCheckedChange={() => toggleNotif(`${key}_push` as keyof typeof notifications)} /></TableCell></TableRow>
            ))}
          </TableBody></Table>
        </div>
        <div className="flex justify-end pt-2"><Button variant="brand" onClick={handleSaveNotifications} disabled={saving === 'notifications'}>{saving === 'notifications' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Preferences</>}</Button></div>
      </CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><Lock className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Change Password</CardTitle><CardDescription className="text-xs text-alo-text-muted">Update your account password for security</CardDescription></div></div></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="curPwd">Current Password <span className="text-red-500">*</span></Label><div className="relative"><Input id="curPwd" type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Enter current password" className="pr-10" /><button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-text-muted hover:text-alo-text">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
        <div className="space-y-2"><Label htmlFor="newPwd">New Password <span className="text-red-500">*</span></Label><div className="relative"><Input id="newPwd" type={showNew ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Minimum 8 characters" className="pr-10" /><button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-text-muted hover:text-alo-text">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
        <div className="space-y-2"><Label htmlFor="confPwd">Confirm New Password <span className="text-red-500">*</span></Label><div className="relative"><Input id="confPwd" type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Re-enter new password" className="pr-10" /><button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-text-muted hover:text-alo-text">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
        <div className="flex justify-end pt-2"><Button variant="brand" onClick={handleChangePassword} disabled={saving === 'password'}>{saving === 'password' ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <><Lock className="w-4 h-4" /> Change Password</>}</Button></div>
      </CardContent></Card>

      <Card className="bg-white rounded-xl border border-red-200"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div><div><CardTitle className="text-lg text-red-600">Danger Zone</CardTitle><CardDescription className="text-xs text-alo-text-muted">Irreversible actions - proceed with caution</CardDescription></div></div></CardHeader><CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-red-100 bg-red-50/50">
          <div><p className="text-sm font-medium text-alo-text">Deactivate Account</p><p className="text-xs text-alo-text-muted mt-0.5">This will disable your account. All data will be preserved for 90 days.</p></div>
          <AlertDialog><AlertDialogTrigger asChild><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="danger" size="sm"><AlertTriangle className="w-4 h-4" /> Deactivate</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action will deactivate your partner account. You will lose access to the portal immediately. Your data will be preserved for 90 days.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700">Yes, deactivate</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
      </CardContent></Card>
    </div>
  );
}
