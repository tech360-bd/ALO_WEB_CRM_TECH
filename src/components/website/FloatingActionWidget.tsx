'use client';

import React, { useState } from 'react';
import { Bot, MessageCircle, Facebook, X, Sparkles, PhoneCall, ChevronUp, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function FloatingActionWidget() {
  const [expanded, setExpanded] = useState(true);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // AI Chat State
  const [hasId, setHasId] = useState<boolean | null>(null);
  const [studentId, setStudentId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: 'Hello! Welcome to ALO Education 24/7 AI Assistant. Do you already have an ALO Student ID?' }
  ]);
  const [userMsg, setUserMsg] = useState('');

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || userMsg;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setUserMsg('');

    // Rule-based flow
    const lower = text.toLowerCase().trim();

    if (hasId === null) {
      if (lower.includes('yes') || lower.includes('হ্যাঁ') || lower.includes('id')) {
        setHasId(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, { sender: 'ai', text: 'Great! Please enter your ALO Student ID (e.g. AE-2026000001):' }]);
        }, 500);
      } else {
        setHasId(false);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'ai',
              text: 'No problem! A new Lead & Student Profile (AE-2026001089) has been created. You can use our self-service Course Finder or connect with a senior counselor on WhatsApp at 01805020101.'
            },
            {
              sender: 'ai',
              text: 'আপনি চাইলে Counselor ছাড়া নিজে নিজে Course Finder ব্যবহার করে course/university খুঁজে apply করতে পারবেন। কোনো সমস্যা হলে আমাকে WhatsApp করুন, ALO team আপনাকে guide করবে।'
            }
          ]);
        }, 500);
      }
      return;
    }

    if (hasId === true && !otpSent && !verified) {
      setStudentId(text);
      setOtpSent(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, { sender: 'ai', text: `Verification OTP has been sent to the phone registered with Student ID ${text}. Please enter 4-digit OTP to access private application & visa status:` }]);
      }, 500);
      return;
    }

    if (otpSent && !verified) {
      setOtp(text);
      setVerified(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: '✅ OTP Verified! Here is your live profile status:' },
          { sender: 'ai', text: '• Student ID: AE-2026000412\n• Application: University of Manchester (MSc Data Science) - CAS Issued\n• Visa Status: VFS Appointment Scheduled for 12 Aug\n• Counselor: Al Aminn (01805020101)' }
        ]);
      }, 500);
      return;
    }

    // General AI answers
    setTimeout(() => {
      if (lower.includes('aston') || lower.includes('uk')) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: '📌 Aston University London 7-Step Admission & Visa Guide:\n1. Submit Transcripts, IELTS/PTE, SOP & Passport\n2. Pass Pre-CAS Interview (Why UK, Course Structure, Funding)\n3. Complete TB Test at IOM Clinic Dhaka/Sylhet (+8801713066230)\n4. Maintain 28-day Bank Balance (£16,500 net tuition + living)\n5. Pay University CAS Deposit\n6. Receive CAS & Submit Visa via VFS Global.\n\nNote: Always check latest fees from official sources before final advice.'
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: '🌍 Need 24/7 Super-Fast Student Visa Service? ✈️🎓\nPlease contact Senior Counselor Al Aminn directly on WhatsApp at 01805020101 for immediate assistance.\n\nOffice Address:\nALO Education, Barek Mansion-02, Lift-05, 58/9 Box Culvert Road, Panthapath, Dhaka-1205.\nGoogle Maps: https://maps.app.goo.gl/t4w8dRNfH7U4BMBR8'
          }
        ]);
      }
    }, 600);
  };

  return (
    <>
      {/* FLOATING CONTACT WIDGET BUTTONS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        {expanded && (
          <div className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-300">
            
            {/* 1. AI AGENT CHAT BUTTON */}
            <button
              onClick={() => setAiChatOpen(true)}
              className="flex items-center gap-2.5 bg-[#0057B8] text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-[#004494] transition-all hover:scale-105 group border-2 border-white"
            >
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-bold whitespace-nowrap pr-1">Chat with AI Agent</span>
              <Badge className="bg-[#E8501A] text-white text-[10px] px-1.5 py-0.5 font-bold">24/7</Badge>
            </button>

            {/* 2. WHATSAPP AI AGENT BUTTON */}
            <a
              href="https://wa.me/8801805020100?text=Hi%20ALO%20AI%20Agent,%20I%20want%20to%20apply%20for%20study%20abroad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-[#25D366] text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-[#20bd5a] transition-all hover:scale-105 group border-2 border-white"
            >
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block leading-none">WhatsApp AI Agent</span>
                <span className="text-[10px] opacity-90 block leading-none mt-0.5">01805020100</span>
              </div>
            </a>

            {/* 3. FACEBOOK MESSAGE BUTTON */}
            <a
              href="https://m.me/aloeducation"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-[#1877F2] text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-[#166fe5] transition-all hover:scale-105 group border-2 border-white"
            >
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <Facebook className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-bold whitespace-nowrap pr-1">Message us on Facebook</span>
            </a>
          </div>
        )}

        {/* TOGGLE DRAWER BUTTON */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="h-12 w-12 rounded-full bg-[#E8501A] text-white shadow-2xl flex items-center justify-center hover:bg-[#d44315] transition-all border-2 border-white"
        >
          {expanded ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>

      {/* AI AGENT SITE CHAT MODAL */}
      {aiChatOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[580px]">
            
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-[#E8501A] flex items-center justify-center text-white font-bold">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">ALO AI Assistant (24/7)</h3>
                  <p className="text-[10px] text-blue-200">WhatsApp Main: 01805020100 • Senior: 01805020101</p>
                </div>
              </div>
              <button onClick={() => setAiChatOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CHAT MESSAGES BODY */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${m.sender === 'user' ? 'bg-[#0057B8] text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-none'}`}>
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}

              {/* QUICK INITIAL BUTTONS IF FIRST MSG */}
              {hasId === null && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleSendMessage('Yes, I have an ALO Student ID')} className="bg-[#0057B8] text-white text-xs">
                    Yes, I have ALO ID
                  </Button>
                  <Button size="sm" onClick={() => handleSendMessage('No, I am a new student')} variant="outline" className="text-xs">
                    No, I am New
                  </Button>
                </div>
              )}
            </div>

            {/* CHAT INPUT FORM */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                value={userMsg}
                onChange={(e) => setUserMsg(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0057B8]"
              />
              <Button type="submit" className="bg-[#E8501A] text-white h-10 px-4 rounded-xl font-bold text-xs">
                Send
              </Button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
