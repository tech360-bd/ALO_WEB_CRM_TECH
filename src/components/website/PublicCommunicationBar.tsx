'use client';

import React, { useState } from 'react';
import { Bot, MessageSquare, Facebook, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function PublicCommunicationBar() {
  const [chatOpen, setChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am ALO Education AI Agent. Do you have an ALO Student ID?' },
  ]);

  const handleSendChat = () => {
    if (!userQuery.trim()) return;
    const msg = userQuery.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setUserQuery('');

    // AI response simulation
    setTimeout(() => {
      if (msg.toLowerCase().includes('yes') || msg.toLowerCase().includes('id') || msg.toLowerCase().includes('ae-')) {
        setChatMessages(prev => [
          ...prev,
          { sender: 'ai', text: 'Please enter your ALO Student ID (e.g. AE-2025000001) for verification via OTP.' }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: 'Welcome to ALO Education! You can use our Course Finder to explore universities, or chat directly with our Senior Counselor Al Aminn on WhatsApp at 01805020101.'
          }
        ]);
      }
    }, 600);
  };

  return (
    <>
      {/* FLOATING ACTION BUTTONS BAR */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">
        {/* 1. AI AGENT BUTTON */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#E8501A] hover:bg-[#d44312] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-xs font-bold group"
          title="Chat with AI Agent"
        >
          <Bot className="w-4 h-4 text-white animate-pulse" />
          <span className="hidden sm:inline">Chat with AI Agent</span>
        </button>

        {/* 2. WHATSAPP AI AGENT BUTTON (01805020100) */}
        <a
          href="https://wa.me/8801805020100?text=Hi%20ALO%20AI%20Agent"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-xs font-bold"
          title="WhatsApp AI Agent (01805020100)"
        >
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">WhatsApp AI Agent</span>
        </a>

        {/* 3. FACEBOOK BUTTON */}
        <a
          href="https://facebook.com/aloeducationbd"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1877F2] hover:bg-[#1565cf] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-xs font-bold"
          title="Message us on Facebook"
        >
          <Facebook className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">Facebook</span>
        </a>
      </div>

      {/* AI AGENT SITE CHAT MODAL */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[450px]">
          {/* Modal Header */}
          <div className="bg-[#E8501A] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <div>
                <h3 className="text-xs font-bold">ALO Education AI Agent</h3>
                <p className="text-[10px] text-orange-100">24/7 Super-Fast Student Guidance</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white hover:text-orange-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs bg-slate-50">
            {chatMessages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-2.5 rounded-xl ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-2.5 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask AI Agent a question..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-600"
            />
            <Button size="icon" className="h-8 w-8 bg-[#E8501A] hover:bg-[#d44312] text-white" onClick={handleSendChat}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
