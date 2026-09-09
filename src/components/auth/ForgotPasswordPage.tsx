'use client';

import { useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { setView } = usePortalStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/portal-auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to send reset code');
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
              <Mail className="w-7 h-7 text-alo-brand" />
            </div>
            <CardTitle className="text-xl font-bold text-alo-text">Forgot Password</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-alo-text-secondary">
                  A verification code has been sent to <strong>{email}</strong>.
                  Please check your email and enter the code to reset your password.
                </p>
                <Button variant="brand" onClick={() => setView('reset-password')} className="w-full">
                  Enter Reset Code
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
                <Button type="submit" variant="brand" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Reset Code
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
