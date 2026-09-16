'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, MessageCircle, Facebook, X, Sparkles, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortalStore } from '@/lib/stores/portal-store';

// Single global floating contact widget.
// - Mounted once from src/app/layout.tsx (the old PublicCommunicationBar mount was a
//   duplicate stack of floating buttons with its own fake chat — no longer mounted).
// - Hidden while a portal session is active (portal shells have their own navigation).
// - Collapsed by default; expands into AI assistant / WhatsApp / Facebook actions.
// - Listens for the `alo:open-ai-chat` CustomEvent dispatched by WebsiteActionButtons
//   ("Chat with AI Agent" header button) and exposes #alo-ai-chat-trigger as its
//   documented fallback target.
// - The assistant is an honest guided flow: it never claims to verify identity,
//   send OTPs, or look up student records — those live in the Student Portal.

const WHATSAPP_URL = 'https://wa.me/8801805020100?text=Hi%20ALO%20Education%2C%20I%20want%20to%20apply%20for%20study%20abroad';
const FACEBOOK_URL = 'https://m.me/aloeducation';
const MAP_URL = 'https://maps.app.goo.gl/t4w8dRNfH7U4BMBR8';
const OFFICE_ADDRESS = 'ALO Education, Barek Mansion-02, Lift-05, 58/9 Box Culvert Road, Panthapath, Dhaka-1205.';

type ChatMsg = { sender: 'ai' | 'user'; text: string };

const GREETING: ChatMsg[] = [
  {
    sender: 'ai',
    text:
      'Hello! I am the ALO Education guided assistant.\n\nI can help you in three honest ways:\n• Find courses — browse verified universities & courses in the Course Finder\n• Talk to a counselor — WhatsApp our senior counselor (01805020100)\n• Already an ALO student? — sign in to the Student Portal for your real application & visa status\n\nকোনো তথ্য জাল বা অনুমান নয় — শুধু যাচাই করা ডেটা এবং সত্যিকারের পরামর্শ।',
  },
];

export default function FloatingActionWidget() {
  const [expanded, setExpanded] = useState(false); // collapsed by default
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(GREETING);
  const [userMsg, setUserMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isAuthenticated = usePortalStore((s) => s.isAuthenticated);

  const openChat = useCallback(() => {
    setAiChatOpen(true);
  }, []);

  // Primary integration point for the header "Chat with AI Agent" button.
  useEffect(() => {
    const handler = () => openChat();
    window.addEventListener('alo:open-ai-chat', handler);
    return () => window.removeEventListener('alo:open-ai-chat', handler);
  }, [openChat]);

  // Escape closes the chat dialog; focus the input when it opens.
  useEffect(() => {
    if (!aiChatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAiChatOpen(false);
    };
    window.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [aiChatOpen]);

  const reply = (text: string) => setMessages((prev) => [...prev, { sender: 'ai', text }]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || userMsg).trim();
    if (!text) return;
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setUserMsg('');

    const lower = text.toLowerCase();

    if (lower.includes('course') || lower.includes('university') || lower.includes('কোর্স')) {
      reply(
        'Use the Course Finder to search verified courses and universities:\n/course-finder\n\nEvery listing shows its verification status. If a course you need is not listed yet, its official data has not been verified — message us on WhatsApp (01805020100) and a counselor will research it from official sources.'
      );
      return;
    }

    if (lower.includes('status') || lower.includes('visa') || lower.includes('application') || lower.includes('student id') || lower.includes('otp') || lower.includes('ae-')) {
      reply(
        'For your real application, document and visa status, sign in to the Student Portal:\n/portal/login\n\nThis chat cannot verify your identity or read student records — anyone claiming otherwise in a chat would be guessing. If you cannot sign in, WhatsApp 01805020100 and our team will help you recover access.'
      );
      return;
    }

    if (lower.includes('whatsapp') || lower.includes('counselor') || lower.includes('contact') || lower.includes('call') || lower.includes('phone')) {
      reply(
        `You can reach a real counselor right now:\n• WhatsApp: 01805020100 (${WHATSAPP_URL})\n• Office: ${OFFICE_ADDRESS}\n• Map: ${MAP_URL}`
      );
      return;
    }

    if (lower.includes('fee') || lower.includes('cost') || lower.includes('tuition') || lower.includes('scholarship')) {
      reply(
        'Fees and scholarships change every intake, so we only publish figures taken from official university sources — each course page shows its fee verification status and source link.\n\nOpen the Course Finder (/course-finder), pick a course, and check the Tuition & Scholarships section. If it shows “needs official source”, the verified figure is not available yet — ask a counselor on WhatsApp (01805020100) and we will confirm it with the university for you.'
      );
      return;
    }

    reply(
      `I am a guided assistant, so I will not guess an answer.\n\n• Courses & universities: /course-finder\n• Your application/visa status: Student Portal (/portal/login)\n• Anything else: WhatsApp 01805020100 or visit ${OFFICE_ADDRESS} (${MAP_URL})`
    );
  };

  // Portal sessions have their own navigation — keep the public widget off-screen.
  if (isAuthenticated) return null;

  return (
    <>
      {/* FLOATING CONTACT WIDGET BUTTONS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        {expanded && (
          <div className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* 1. AI ASSISTANT BUTTON — id kept for WebsiteActionButtons fallback */}
            <button
              id="alo-ai-chat-trigger"
              onClick={openChat}
              aria-label="Open the ALO Education guided assistant chat"
              className="flex items-center gap-2.5 bg-[#0057B8] text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-[#004494] transition-all hover:scale-105 group border-2 border-white"
            >
              <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </span>
              <span className="text-xs font-bold whitespace-nowrap pr-1">Chat with AI Agent</span>
              <Badge className="bg-[#E8501A] text-white text-[10px] px-1.5 py-0.5 font-bold">24/7</Badge>
            </button>

            {/* 2. WHATSAPP BUTTON */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message ALO Education on WhatsApp (opens in a new tab)"
              className="flex items-center gap-2.5 bg-[#25D366] text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-[#20bd5a] transition-all hover:scale-105 group border-2 border-white"
            >
              <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </span>
              <span className="text-left">
                <span className="text-xs font-bold block leading-none">WhatsApp Counselor</span>
                <span className="text-[10px] opacity-90 block leading-none mt-0.5">01805020100</span>
              </span>
            </a>

            {/* 3. FACEBOOK MESSENGER BUTTON */}
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message ALO Education on Facebook Messenger (opens in a new tab)"
              className="flex items-center gap-2.5 bg-[#1877F2] text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-[#166fe5] transition-all hover:scale-105 group border-2 border-white"
            >
              <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <Facebook className="h-4 w-4 text-white" />
              </span>
              <span className="text-xs font-bold whitespace-nowrap pr-1">Message us on Facebook</span>
            </a>
          </div>
        )}

        {/* TOGGLE DRAWER BUTTON */}
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Close contact options' : 'Open contact options'}
          className="h-12 w-12 rounded-full bg-[#E8501A] text-white shadow-2xl flex items-center justify-center hover:bg-[#d44315] transition-all border-2 border-white"
        >
          {expanded ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>

      {/* ASSISTANT CHAT DIALOG */}
      {aiChatOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAiChatOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="ALO Education guided assistant"
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[580px]"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-full bg-[#E8501A] flex items-center justify-center text-white font-bold">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm leading-tight">ALO Guided Assistant (24/7)</h3>
                  <p className="text-[10px] text-blue-200">WhatsApp: 01805020100 • Honest answers only</p>
                </div>
              </div>
              <button
                onClick={() => setAiChatOpen(false)}
                aria-label="Close assistant chat"
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      m.sender === 'user'
                        ? 'bg-[#0057B8] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}

              {/* QUICK ACTIONS */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  href="/course-finder"
                  className="inline-flex items-center rounded-full border border-[#0057B8] px-3 py-1.5 text-[11px] font-semibold text-[#0057B8] hover:bg-blue-50"
                >
                  Find a course
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-[#25D366] px-3 py-1.5 text-[11px] font-semibold text-[#128C4A] hover:bg-green-50"
                >
                  Talk to a counselor
                </a>
                <Link
                  href="/portal/login"
                  className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Student Portal sign-in
                </Link>
              </div>
            </div>

            {/* INPUT */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2"
            >
              <label htmlFor="alo-widget-chat-input" className="sr-only">
                Message the ALO Education assistant
              </label>
              <input
                id="alo-widget-chat-input"
                ref={inputRef}
                value={userMsg}
                onChange={(e) => setUserMsg(e.target.value)}
                placeholder="Ask about courses, fees, or your application..."
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0057B8]"
              />
              <Button type="submit" aria-label="Send message" className="bg-[#E8501A] text-white h-10 px-4 rounded-xl font-bold text-xs">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
