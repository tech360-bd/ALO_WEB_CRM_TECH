'use client';

import { useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const { setView } = usePortalStore();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim() || !newPassword) { toast.error('All fields are required'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/portal-auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        toast.success('Password reset successfully!');
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-alo-page">
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="sm" onClick={() => setView('login')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-md bg-white rounded-xl border border-alo-border shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-full bg-alo-brand-light flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-alo-brand" />
            </div>
            <CardTitle className="text-xl font-bold text-alo-text">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-alo-text-secondary">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button variant="brand" onClick={() => setView('login')} className="w-full">
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="Your registered email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" required />
                </div>
                <div>
                  <Label>Verification Code (OTP)</Label>
                  <Input type="text" placeholder="Enter 6-digit code" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="mt-1.5" required />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input type="password" placeholder="Min 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1.5" required />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1.5" required />
                </div>
                <Button type="submit" variant="brand" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
