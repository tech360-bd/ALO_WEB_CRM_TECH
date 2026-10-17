"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Phone, Mail, Send, User } from "lucide-react";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/ucc/conversations");
      const json = await res.json();
      if (json.success) {
        setConversations(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/crm/ucc/conversations/${threadId}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
    }
  }, [activeThreadId]);

  const handleSend = async () => {
    if (!input.trim() || !activeThreadId) return;
    const activeThread = conversations.find(c => c.id === activeThreadId);
    if (!activeThread) return;

    try {
      const res = await fetch(`/api/crm/ucc/conversations/${activeThreadId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: input, messageType: 'text' })
      });
      const json = await res.json();
      if (json.success) {
        setInput("");
        fetchMessages(activeThreadId);
      }
    } catch (error) {
      console.error("Send failed", error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 border-t border-gray-200">
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0057B8]" />
            Unified Inbox
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-500 text-center">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No active conversations.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveThreadId(c.id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${activeThreadId === c.id ? 'bg-blue-50/50 border-l-4 border-[#0057B8]' : 'border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                      {c.channel === 'whatsapp' ? <Phone className="w-4 h-4 text-green-500" /> : <Mail className="w-4 h-4 text-gray-500" />}
                      {c.channel} Message
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{c.lastMessagePreview || 'No preview available'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col bg-gray-50/50">
        {activeThreadId ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {conversations.find(c => c.id === activeThreadId)?.channel === 'whatsapp' ? 'WhatsApp Contact' : 'Contact'}
                  </h3>
                  <p className="text-xs text-gray-500">Thread ID: {activeThreadId.substring(0, 8)}...</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${m.direction === 'outbound' ? 'bg-[#0057B8] text-white rounded-tr-none shadow-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    <div className={`text-xs mt-1 text-right ${m.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/50 focus:border-[#0057B8] transition-all"
                />
                <button
                  onClick={handleSend}
                  className="bg-[#0057B8] hover:bg-[#003F87] text-white p-3 rounded-xl transition-colors flex items-center justify-center shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
