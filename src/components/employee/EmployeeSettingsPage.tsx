'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Bell, Lock, Save, Eye, EyeOff } from 'lucide-react';

const eventTypes = [
  { id: 'task_assigned', label: 'Task Assigned', description: 'When a new task is assigned to you' },
  { id: 'student_update', label: 'Student Update', description: 'Changes to assigned student profiles' },
  { id: 'application_update', label: 'Application Update', description: 'Application status changes' },
  { id: 'document_review', label: 'Document Review', description: 'Documents awaiting your review' },
  { id: 'payment_received', label: 'Payment Received', description: 'New student payments or refunds' },
  { id: 'message_received', label: 'Message Received', description: 'New internal messages or mentions' },
];

export default function EmployeeSettingsPage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', department: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [notifPrefs, setNotifPrefs] = useState<Record<string, { email: boolean; sms: boolean; inApp: boolean }>>({});

  useEffect(() => {
    const t = setTimeout(() => {
      setProfile({ name: user?.name || 'Sarah Khan', email: user?.email || 'sarah@alo.edu.bd', phone: '+880 1712-345678', department: 'Student Services' });
      const prefs: Record<string, { email: boolean; sms: boolean; inApp: boolean }> = {};
      eventTypes.forEach(e => { prefs[e.id] = { email: true, sms: false, inApp: true }; });
      setNotifPrefs(prefs);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [user]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/employee/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
      toast.success('Profile updated successfully');
    } catch { toast.error('Failed to update profile'); }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) { toast.error('Please fill all password fields'); return; }
    if (passwords.newPass !== passwords.confirm) { toast.error('New passwords do not match'); return; }
    if (passwords.newPass.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await fetch('/api/employee/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(passwords) });
      toast.success('Password changed successfully');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch { toast.error('Failed to change password'); }
    setSaving(false);
  };

  const togglePref = (eventId: string, channel: 'email' | 'sms' | 'inApp') => {
    setNotifPrefs(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], [channel]: !prev[eventId]?.[channel] },
    }));
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-alo-text">Settings</h1>
        <p className="text-sm text-alo-text-muted">Manage your account preferences</p>
      </div>

      {/* Account Settings */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-alo-brand" />
            <CardTitle className="text-base font-semibold text-alo-text">Account Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Department</Label><Input value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} className="mt-1" /></div>
          </div>
          <Button variant="brand" className="mt-4" onClick={handleProfileSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-alo-brand" />
            <CardTitle className="text-base font-semibold text-alo-text">Notification Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-alo-border">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Event</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-alo-text-muted">Email</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-alo-text-muted">SMS</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-alo-text-muted">In-App</th>
              </tr></thead>
              <tbody>
                {eventTypes.map(e => (
                  <tr key={e.id} className="border-b border-alo-border/50">
                    <td className="py-2.5 px-3">
                      <p className="text-sm font-medium text-alo-text">{e.label}</p>
                      <p className="text-[11px] text-alo-text-muted">{e.description}</p>
                    </td>
                    <td className="py-2.5 px-3 text-center"><Switch checked={notifPrefs[e.id]?.email || false} onCheckedChange={() => togglePref(e.id, 'email')} /></td>
                    <td className="py-2.5 px-3 text-center"><Switch checked={notifPrefs[e.id]?.sms || false} onCheckedChange={() => togglePref(e.id, 'sms')} /></td>
                    <td className="py-2.5 px-3 text-center"><Switch checked={notifPrefs[e.id]?.inApp || false} onCheckedChange={() => togglePref(e.id, 'inApp')} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-alo-brand" />
            <CardTitle className="text-base font-semibold text-alo-text">Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div>
            <Label>Current Password</Label>
            <div className="relative mt-1">
              <Input type={showCurrent ? 'text' : 'password'} value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} placeholder="Enter current password" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-text-muted" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>New Password</Label>
              <div className="relative mt-1">
                <Input type={showNew ? 'text' : 'password'} value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} placeholder="Min 8 characters" />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-text-muted" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Re-enter new password" className="mt-1" />
            </div>
          </div>
          <Button variant="brand" onClick={handlePasswordChange} disabled={saving}>
            <Lock className="w-4 h-4 mr-2" /> {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
