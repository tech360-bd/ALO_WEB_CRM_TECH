'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageSquare, Mic, Send, FileText, X } from 'lucide-react';

export default function WebChatWidget({ senderId, channel = 'webchat' as const }: { senderId?: string; channel?: 'website'|'webchat' }) {
  const [open, setOpen] = useState(false);
  const [sid] = useState(()=> senderId || `web-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);
  const [messages, setMessages] = useState<Array<{role:'user'|'assistant'; text:string}>>([{ role:'assistant', text: 'স্বাগতম ALO Education-এ! অনুগ্রহ করে আপনার স্টুডেন্ট আইডি (যেমন AE-2025000123) শেয়ার করুন। না থাকলে "নতুন" লিখুন। / Welcome! Please share your Student ID.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(text?: string, mediaType?: string | null, mediaInfo?: any) {
    const body = text ?? input;
    if (!body?.trim() && !mediaType) return;
    const userText = body?.trim() || `[${mediaType}]`;
    setMessages(m=> [...m, { role:'user', text: userText }]);
    setInput(''); setBusy(true);
    try {
      const res = await fetch('/api/ai/student-intake', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ channel, senderId: sid, text: body, mediaType, mediaInfo })
      });
      const j = await res.json();
      setMessages(m=> [...m, { role:'assistant', text: j.reply || j.error || '...' }]);
    } catch (e: any) {
      setMessages(m=> [...m, { role:'assistant', text: 'দুঃখিত, সংযোগে সমস্যা। Please try again.' }]);
    } finally { setBusy(false); }
  }

  return (
    <>
      {!open && <Button onClick={()=> setOpen(true)} className="fixed bottom-4 right-4 rounded-full h-12 w-12 bg-[#2563EB] text-white shadow-xl z-50"><MessageSquare className="w-5 h-5"/></Button>}
      {open && (
        <Card className="fixed bottom-4 right-4 w-[360px] max-w-[90vw] h-[480px] flex flex-col border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden z-50 bg-white">
          <div className="bg-[#0F172A] text-white px-3 py-2 flex items-center justify-between">
            <p className="text-xs font-bold">ALO AI — Bangla Intake (ID-first)</p>
            <button onClick={()=> setOpen(false)} className="p-1"><X className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2 bg-[#F8FAFC]">
            {messages.map((m,i)=> (
              <div key={i} className={m.role==='user' ? 'ml-auto bg-[#2563EB] text-white max-w-[78%] rounded-2xl rounded-br-sm px-3 py-2 text-xs' : 'mr-auto bg-white border border-[#E2E8F0] max-w-[80%] rounded-2xl rounded-bl-sm px-3 py-2 text-xs whitespace-pre-wrap'}>{m.text}</div>
            ))}
            {busy && <div className="mr-auto bg-white border border-[#E2E8F0] rounded-2xl px-3 py-2 text-xs text-gray-400">typing sequentially... (10:00-19:00 Dhaka human-like)</div>}
          </div>
          <div className="p-2 border-t border-[#E2E8F0] flex items-center gap-2">
            <input ref={fileRef} type="file" className="hidden" onChange={(e)=>{
              const f = e.target.files?.[0]; if (!f) return;
              // Also auto-upload via direct document route if student known — for now just announce to intake
              send(f.name, f.type.includes('image')?'image':'document', { fileName: f.name, mime: f.type });
              // Optional real upload: caller can POST /api/documents/auto-upload separately
            }}/>
            <Button size="sm" variant="outline" className="h-9 px-2 border-[#E2E8F0]" onClick={()=> fileRef.current?.click()}><FileText className="w-4 h-4"/></Button>
            <Button size="sm" variant="outline" className="h-9 px-2 border-[#E2E8F0]" onClick={()=>{
              // Web Speech API transcription fallback — sends as voice type
              const text = prompt('ভয়েস ট্রান্সক্রিপশন (অথবা মাইক ব্যবহার করুন):') || '';
              if (text) send(text, 'voice', { transcription: text });
            }}><Mic className="w-4 h-4"/></Button>
            <Input value={input} onChange={e=> setInput(e.target.value)} onKeyDown={e=> e.key==='Enter' && send()} placeholder="লিখুন / Type..." className="h-9 text-xs flex-1" />
            <Button disabled={busy} onClick={()=> send()} className="h-9 bg-[#F97316] text-white"><Send className="w-4 h-4"/></Button>
          </div>
          <div className="px-2 pb-1 text-[10px] text-gray-400">ID-first • BN/EN • doc/voice • memory • office 10-19 Dhaka — same brain on WhatsApp/Facebook</div>
        </Card>
      )}
    </>
  );
}
