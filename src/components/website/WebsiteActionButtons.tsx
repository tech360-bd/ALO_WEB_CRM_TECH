'use client';

import React from 'react';
import { Bot, MessageCircle, Facebook, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const WHATSAPP_NUMBER = '01805020100';
const WHATSAPP_INTL = '8801805020100';
const FB_URL = 'https://www.facebook.com/aloeducation';
const FB_MESSENGER_URL = 'https://m.me/aloeducation';
const MAP_URL = 'https://maps.app.goo.gl/t4w8dRNfH7U4BMBR8';

function trackClick(channel: string, location: string) {
  // Analytics + audit log — best effort, no block
  try {
    fetch('/api/website/search-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: `website_button_${channel}`, source: location, timestamp: new Date().toISOString() }),
    }).catch(() => {});
    // Also log to audit if available
    fetch('/api/crm/ucc/analytics', { method: 'GET' }).catch(() => {});
  } catch {}
  // Safe fallback: console + gtag if present
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'click', { event_category: 'ALO Website CTA', event_label: `${channel} @ ${location}` });
  }
}

interface Props {
  variant?: 'header' | 'hero' | 'footer' | 'compact';
  onOpenAI?: () => void;
  className?: string;
}

export default function WebsiteActionButtons({ variant = 'header', onOpenAI, className = '' }: Props) {
  const handleAI = () => {
    trackClick('ai_agent', variant);
    if (onOpenAI) onOpenAI();
    else {
      // Dispatch event for FloatingActionWidget to listen
      window.dispatchEvent(new CustomEvent('alo:open-ai-chat'));
      // Fallback: scroll to chat if not handled
      const el = document.getElementById('alo-ai-chat-trigger');
      if (el) el.click();
    }
  };

  const handleWhatsApp = () => {
    trackClick('whatsapp_ai_agent', variant);
    window.open(`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('Hi ALO AI Agent, I want to apply for study abroad')}`, '_blank', 'noopener,noreferrer');
  };

  const handleFacebook = () => {
    trackClick('facebook', variant);
    window.open(FB_URL, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`} aria-label="ALO quick contact actions">
        <button
          onClick={handleAI}
          className="inline-flex items-center gap-1.5 bg-[#0057B8] text-white px-3.5 py-2 rounded-full text-xs font-bold hover:bg-[#004494] hover:scale-[1.02] transition-all shadow-sm border border-white"
          aria-label="Chat with AI Agent"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chat with AI Agent</span>
          <span className="bg-[#E8501A] text-white text-[9px] px-1 py-0 rounded font-bold">24/7</span>
        </button>
        <button
          onClick={handleWhatsApp}
          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3.5 py-2 rounded-full text-xs font-bold hover:bg-[#20bd5a] hover:scale-[1.02] transition-all shadow-sm border border-white"
          aria-label="WhatsApp AI Agent 01805020100"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp AI Agent</span>
          <span className="hidden xl:inline text-[10px] opacity-90 font-medium">01805020100</span>
        </button>
        <button
          onClick={handleFacebook}
          className="inline-flex items-center gap-1.5 bg-[#1877F2] text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-[#166fe5] hover:scale-[1.02] transition-all shadow-sm border border-white"
          aria-label="Message us on Facebook"
        >
          <Facebook className="w-3.5 h-3.5" />
          <span>Message us on Facebook</span>
        </button>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 ${className}`} aria-label="ALO high conversion actions">
        <button
          onClick={handleAI}
          className="group inline-flex items-center gap-2.5 bg-[#0057B8] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#004494] hover:shadow-lg hover:scale-[1.02] transition-all shadow-md border-2 border-white"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Bot className="w-4 h-4" />
          </div>
          <span>Chat with AI Agent</span>
          <Badge className="bg-[#E8501A] text-white text-[10px] px-1.5 ml-1">24/7</Badge>
        </button>
        <button
          onClick={handleWhatsApp}
          className="group inline-flex items-center gap-2.5 bg-[#25D366] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#20bd5a] hover:shadow-lg hover:scale-[1.02] transition-all shadow-md border-2 border-white"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="text-left leading-none">
            <span className="block">WhatsApp AI Agent</span>
            <span className="block text-[11px] opacity-90 font-medium">01805020100</span>
          </div>
        </button>
        <button
          onClick={handleFacebook}
          className="group inline-flex items-center gap-2.5 bg-[#1877F2] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#166fe5] hover:shadow-lg hover:scale-[1.02] transition-all shadow-md border-2 border-white"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Facebook className="w-4 h-4" />
          </div>
          <span>Message us on Facebook</span>
        </button>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="font-bold text-[#0057B8] text-sm uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E8501A]" />
          Get Instant Help
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          24/7 AI support + Senior Counselor <span className="font-bold text-[#0F172A]">Al Aminn • 01805020101</span> • Office: Barek Mansion-02, Lift-05, 58/9 Box Culvert Road, Panthapath, Dhaka-1205 (Opposite Bashundhara City)
          {' • '}
          <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="text-[#0057B8] hover:text-[#E8501A] underline font-medium">
            Google Maps
          </a>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAI}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0057B8] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#004494] hover:scale-[1.01] transition-all shadow-sm"
          >
            <Bot className="w-4 h-4" />
            Chat with AI Agent
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#20bd5a] hover:scale-[1.01] transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp AI Agent
          </button>
          <button
            onClick={handleFacebook}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1877F2] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#166fe5] hover:scale-[1.01] transition-all shadow-sm"
          >
            <Facebook className="w-4 h-4" />
            Facebook
          </button>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            AI replies after hours • Human handoff when needed
          </span>
        </div>
      </div>
    );
  }

  // compact (mobile)
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button onClick={handleAI} className="inline-flex items-center gap-1.5 bg-[#0057B8] text-white px-3 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-[#004494] transition-colors">
        <Bot className="w-3.5 h-3.5" /> AI Agent
      </button>
      <button onClick={handleWhatsApp} className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-[#20bd5a] transition-colors">
        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
      </button>
      <button onClick={handleFacebook} className="inline-flex items-center gap-1.5 bg-[#1877F2] text-white px-3 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-[#166fe5] transition-colors">
        <Facebook className="w-3.5 h-3.5" /> Facebook
      </button>
    </div>
  );
}

// Also export constants for testing
export { WHATSAPP_NUMBER, WHATSAPP_INTL, FB_URL, FB_MESSENGER_URL, MAP_URL };
