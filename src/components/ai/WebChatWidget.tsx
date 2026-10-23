'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send, X } from 'lucide-react';

export default function WebChatWidget({ channel = 'webchat' }: { senderId?: string; channel?: 'website' | 'webchat' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'স্বাগতম ALO Education-এ! সাধারণ তথ্যের জন্য আপনার পছন্দের দেশ ও পড়াশোনার স্তর জানাতে পারেন। Welcome! Share only your preferred destination and study level for general guidance. Do not send a Student ID, password, OTP, bank/card details, passport, or private document here.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const body = input.trim();
    if (!body || busy) return;
    setMessages((current) => [...current, { role: 'user', text: body }]);
    setInput('');
    setBusy(true);
    try {
      const response = await fetch('/api/ai/student-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, text: body }),
      });
      const result = await response.json().catch(() => null);
      const reply = response.ok && result?.success
        ? result.reply
        : result?.error || 'Secure intake is temporarily unavailable. Please try again later or use the Student Portal.';
      setMessages((current) => [...current, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: 'Connection problem. Please try again or use the secure Student Portal.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && <Button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-[var(--alo-brand)] text-white shadow-xl"><MessageSquare className="h-5 w-5" /></Button>}
      {open && (
        <Card className="fixed bottom-4 right-4 z-50 flex h-[480px] w-[360px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border-[var(--alo-border)] bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-[var(--alo-text)] px-3 py-2 text-white">
            <p className="text-xs font-bold">ALO Education — General Guidance</p>
            <button onClick={() => setOpen(false)} className="p-1" aria-label="Close chat"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-2 overflow-auto bg-[var(--alo-page)] p-3" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user'
                ? 'ml-auto max-w-[78%] rounded-2xl rounded-br-sm bg-[var(--alo-brand)] px-3 py-2 text-xs text-white'
                : 'mr-auto max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-[var(--alo-border)] bg-white px-3 py-2 text-xs'}>{message.text}</div>
            ))}
            {busy && <div className="mr-auto rounded-2xl border border-[var(--alo-border)] bg-white px-3 py-2 text-xs text-[var(--alo-text-muted)]">Preparing a safe response…</div>}
          </div>
          <p className="px-3 pb-2 text-[11px] text-amber-800">General guidance only, not current admission/visa requirements. Do not share personal identifiers or documents. <Link className="underline" href="/student/login">Student Portal</Link></p>
          <div className="flex items-center gap-2 border-t border-[var(--alo-border)] p-2">
            <Input value={input} maxLength={5000} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Write a general question…" aria-label="Message" className="h-9 flex-1 text-xs" />
            <Button disabled={busy || !input.trim()} onClick={() => void send()} className="h-9 bg-[var(--alo-cta)] text-white" aria-label="Send message"><Send className="h-4 w-4" /></Button>
          </div>
          <div className="px-2 pb-1 text-center text-[11px] text-[var(--alo-text-muted)]">Rule-based replies · Bangla / English · secure session · no document uploads</div>
        </Card>
      )}
    </>
  );
}
