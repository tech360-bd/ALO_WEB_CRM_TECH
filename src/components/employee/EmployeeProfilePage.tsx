'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
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
import {
  User, Mail, Phone, MapPin, Building2, Calendar,
  Briefcase, Shield, Pencil, Save, X, AlertTriangle,
  Heart, UserCircle, Loader2,
} from 'lucide-react';

interface ProfileData {
  name: string; employeeId: string; position: string;
  department: string; branch: string; joinDate: string;
  phone: string; email: string; avatar: string;
}

interface EmergencyContact {
  name: string; relationship: string; phone: string; address: string;
}

const mockProfile: ProfileData = {
  name: 'Sarah Khan', employeeId: 'ALO-EMP-2025-0001', position: 'Counselor',
  department: 'Student Services', branch: 'Gulshan, Dhaka', joinDate: '2023-03-15',
  phone: '+880 1712-345678', email: 'sarah.khan@alo.edu.bd', avatar: '',
};

const mockEmergency: EmergencyContact = {
  name: 'Abdul Khan', relationship: 'Father',
  phone: '+880 1812-987654', address: 'House 12, Road 5, Dhanmondi, Dhaka 1205',
};

export default function EmployeeProfilePage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(mockProfile);
  const [emergency, setEmergency] = useState<EmergencyContact>(mockEmergency);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, emergency }),
      });
      if (res.ok) { toast.success('Profile updated successfully'); setEditMode(false); }
      else toast.error('Failed to update profile');
    } catch { toast.error('Network error. Please try again.'); }
    finally { setSaving(false); }
  }, [profile, emergency]);

  const handleCancel = () => { setProfile(mockProfile); setEmergency(mockEmergency); setEditMode(false); };

  const displayName = user?.name || profile.name;
  const displayInitials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2);

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">My Profile</h1>
          <p className="text-sm text-alo-text-muted mt-1">View and manage your personal information</p>
        </div>
        {!editMode ? (
          <Button variant="brand" size="sm" onClick={() => setEditMode(true)}><Pencil className="w-4 h-4" /> Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}><X className="w-4 h-4" /> Cancel</Button>
            <Button variant="brand" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-alo-brand-light text-alo-brand text-2xl font-bold">{displayInitials}</AvatarFallback>
                </Avatar>
                {editMode && (
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-alo-brand text-white rounded-full flex items-center justify-center shadow-md hover:bg-alo-brand/90 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <h2 className="text-lg font-semibold text-alo-text">{displayName}</h2>
              <p className="text-sm text-alo-text-secondary mt-0.5">{profile.position}</p>
              <Badge variant="brand" className="mt-2">{profile.department}</Badge>
              <Separator className="my-4" />
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3"><Building2 className="w-4 h-4 text-alo-text-muted shrink-0" /><span className="text-sm text-alo-text-secondary">{profile.branch}</span></div>
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-alo-text-muted shrink-0" /><span className="text-sm text-alo-text-secondary">Joined {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span></div>
                <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-alo-text-muted shrink-0" /><span className="text-sm text-alo-text-secondary">Status: <span className="text-emerald-600 font-medium">Active</span></span></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-alo-text">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                ['Active Students', '32'], ['Applications', '18'],
                ['Conversion Rate', '68%', true], ['Tasks Completed', '142'],
              ].map(([l, v, green], i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm text-alo-text-secondary">{l}</span>
                  <span className={cn('text-sm font-semibold', green ? 'text-emerald-600' : 'text-alo-text')}>{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader><CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2"><UserCircle className="w-5 h-5 text-alo-brand" /> Personal Information</CardTitle></CardHeader>
            <CardContent>
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Full Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
                  <FormField label="Employee ID" value={profile.employeeId} disabled />
                  <FormField label="Position" value={profile.position} disabled />
                  <FormField label="Department" value={profile.department} disabled />
                  <FormField label="Branch" value={profile.branch} disabled />
                  <FormField label="Join Date" value={profile.joinDate} disabled />
                  <FormField label="Phone Number" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
                  <FormField label="Email Address" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                  <InfoRow icon={User} label="Full Name" value={displayName} />
                  <InfoRow icon={Briefcase} label="Employee ID" value={profile.employeeId} mono />
                  <InfoRow icon={UserCircle} label="Position" value={profile.position} />
                  <InfoRow icon={Building2} label="Department" value={profile.department} />
                  <InfoRow icon={MapPin} label="Branch" value={profile.branch} />
                  <InfoRow icon={Calendar} label="Join Date" value={new Date(profile.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                  <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                  <InfoRow icon={Mail} label="Email" value={profile.email} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader><CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Emergency Contact</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">This information is used only in case of emergencies and is accessible to HR and management.</p>
              </div>
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Contact Name" value={emergency.name} onChange={(v) => setEmergency({ ...emergency, name: v })} />
                  <FormField label="Relationship" value={emergency.relationship} onChange={(v) => setEmergency({ ...emergency, relationship: v })} />
                  <FormField label="Phone Number" value={emergency.phone} onChange={(v) => setEmergency({ ...emergency, phone: v })} />
                  <FormField label="Address" value={emergency.address} onChange={(v) => setEmergency({ ...emergency, address: v })} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                  <InfoRow icon={User} label="Contact Name" value={emergency.name} />
                  <InfoRow icon={Heart} label="Relationship" value={emergency.relationship} />
                  <InfoRow icon={Phone} label="Phone" value={emergency.phone} />
                  <InfoRow icon={MapPin} label="Address" value={emergency.address} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-alo-page flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-alo-text-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-alo-text-muted">{label}</p>
        <p className={cn('text-sm text-alo-text font-medium truncate', mono && 'font-mono')}>{value}</p>
      </div>
    </div>
  );
}

function FormField({ label, value, disabled, onChange }: { label: string; value: string; disabled?: boolean; onChange?: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-alo-text-secondary">{label}</Label>
      <Input value={value} disabled={disabled} onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={cn(disabled ? 'bg-muted border-alo-border text-alo-text-muted' : 'bg-alo-page border-alo-border')} />
    </div>
  );
}
