'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function OTPVerificationModal({ open, onOpenChange, phone, onVerified }: { open: boolean; onOpenChange: (v:boolean)=>void; phone: string; onVerified: ()=>void }) {
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    const res = await fetch('/api/crm/communications/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', phone }) });
    const j = await res.json();
    if (j.success) { toast.success('OTP sent to ' + phone + (j.devOtp ? ` (dev: ${j.devOtp})` : '')); setSent(true); }
    else toast.error(j.error);
    setLoading(false);
  };
  const verify = async () => {
    setLoading(true);
    const res = await fetch('/api/crm/communications/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', phone, otp }) });
    const j = await res.json();
    if (j.success) { toast.success('Verified — private data now visible'); onVerified(); onOpenChange(false); }
    else toast.error(j.error);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#2563EB]" /> OTP Verification — Before Private Data</DialogTitle>
          <DialogDescription className="text-xs">Send OTP to {phone}, verify, then allow safe info. Log attempt, block after 5 failures. Do not share private data without OTP. Do not give visa guarantee.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!sent ? <Button size="sm" className="w-full bg-[#2563EB]" onClick={send} disabled={loading}>{loading?'Sending...':'Send OTP'}</Button> : (
            <>
              <Input placeholder="Enter 6-digit OTP" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} className="font-mono tracking-widest text-center" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={send} disabled={loading}>Resend</Button>
                <Button size="sm" className="flex-1 bg-[#2563EB]" onClick={verify} disabled={loading || otp.length!==6}>{loading?'Verifying...':'Verify'}</Button>
              </div>
            </>
          )}
          <p className="text-[11px] text-gray-500">Rules: Verify phone/OTP before private data, log OTP attempt, block after too many failures, create follow-up task for next working hour after-hours.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
