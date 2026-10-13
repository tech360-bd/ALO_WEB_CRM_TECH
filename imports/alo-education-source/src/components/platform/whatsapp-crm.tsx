"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Send, Phone, Clock, CheckCircle2, Check,
  Bot, User, Search, MoreVertical, Paperclip, Smile,
  ChevronLeft, ChevronRight, AlertCircle, Loader2,
  Calendar, Tag, Star, Archive, Trash2, Copy,
  MessageSquare, Mic, Image, FileText, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

/* ─── Brand Colors ─── */
const ALO_BLUE = "#0052B8";
const ALO_ORANGE = "#E8501A";
const WHATSAPP_GREEN = "#25D366";

/* ─── Types ─── */
interface WhatsAppMessage {
  id: string;
  contactId: string;
  text: string;
  timestamp: string;
  fromMe: boolean;
  status: "sent" | "delivered" | "read" | "failed";
  templateId?: string;
}

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  leadId?: string;
  leadScore?: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: "active" | "archived" | "blocked";
  tags: string[];
  avatar?: string;
}

interface TemplateMessage {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
}

/* ─── Template Messages (wacrm pattern) ─── */
const TEMPLATES: TemplateMessage[] = [
  {
    id: "t1", name: "Welcome", category: "Onboarding",
    content: "Hi {{name}}! 👋 Welcome to ALO Education. We're excited to help you with your study abroad journey. Would you like to schedule a free consultation?",
    variables: ["name"],
  },
  {
    id: "t2", name: "Follow-up", category: "Follow-up",
    content: "Hi {{name}}, just checking in! Have you had a chance to review the {{country}} university options we shared? Happy to answer any questions! 🎓",
    variables: ["name", "country"],
  },
  {
    id: "t3", name: "Doc Reminder", category: "Documents",
    content: "Hi {{name}}, friendly reminder to submit your {{document}} by {{deadline}}. Let us know if you need any help! 📄",
    variables: ["name", "document", "deadline"],
  },
  {
    id: "t4", name: "Offer Letter", category: "Milestone",
    content: "🎉 Great news {{name}}! Your offer letter from {{university}} has arrived! Let's schedule a call to discuss next steps.",
    variables: ["name", "university"],
  },
  {
    id: "t5", name: "Visa Update", category: "Milestone",
    content: "Hi {{name}}, your visa application status has been updated. Current status: {{status}}. We'll keep you posted! 🛂",
    variables: ["name", "status"],
  },
  {
    id: "t6", name: "IELTS Reminder", category: "Exams",
    content: "Hi {{name}}! Your IELTS exam is on {{date}}. Here are some last-minute tips: 1) Read questions carefully 2) Manage time wisely 3) Stay calm! Good luck! 🍀",
    variables: ["name", "date"],
  },
];

/* ─── Demo Contacts ─── */
const DEMO_CONTACTS: WhatsAppContact[] = [
  { id: "c1", name: "Rahim Ahmed", phone: "+880171234567", leadId: "LD-001", leadScore: 80, lastMessage: "Yes, I'm interested in UK universities", lastMessageTime: "2 min ago", unreadCount: 2, status: "active", tags: ["HOT", "UK"] },
  { id: "c2", name: "Fatima Begum", phone: "+880189876543", leadId: "LD-002", leadScore: 70, lastMessage: "When is the next intake?", lastMessageTime: "15 min ago", unreadCount: 1, status: "active", tags: ["WARM", "Canada"] },
  { id: "c3", name: "Karim Hossain", phone: "+880155544433", leadId: "LD-003", leadScore: 90, lastMessage: "Thanks for the document list!", lastMessageTime: "1 hr ago", unreadCount: 0, status: "active", tags: ["HOT", "Australia"] },
  { id: "c4", name: "Sadia Islam", phone: "+880161234567", leadId: "LD-006", leadScore: 60, lastMessage: "Can I get scholarship info?", lastMessageTime: "3 hrs ago", unreadCount: 0, status: "active", tags: ["WARM", "UK"] },
  { id: "c5", name: "Imran Khan", phone: "+880189876111", leadId: "LD-007", leadScore: 65, lastMessage: "I'll call you tomorrow", lastMessageTime: "5 hrs ago", unreadCount: 0, status: "active", tags: ["WARM", "Canada"] },
  { id: "c6", name: "Tanvir Alam", phone: "+880199911122", leadId: "LD-005", leadScore: 30, lastMessage: "Not interested right now", lastMessageTime: "2 days ago", unreadCount: 0, status: "archived", tags: ["COLD", "Germany"] },
];

/* ─── Demo Messages ─── */
const DEMO_MESSAGES: Record<string, WhatsAppMessage[]> = {
  c1: [
    { id: "m1", contactId: "c1", text: "Hi, I saw your ad about studying in the UK", timestamp: "10:30 AM", fromMe: false, status: "read" },
    { id: "m2", contactId: "c1", text: "Hi Rahim! 👋 Welcome to ALO Education. We'd love to help you explore UK universities. What course are you interested in?", timestamp: "10:31 AM", fromMe: true, status: "read", templateId: "t1" },
    { id: "m3", contactId: "c1", text: "I'm thinking about MBA programs", timestamp: "10:33 AM", fromMe: false, status: "read" },
    { id: "m4", contactId: "c1", text: "Great choice! We have partnerships with top UK business schools. Would you like to schedule a free consultation?", timestamp: "10:34 AM", fromMe: true, status: "delivered" },
    { id: "m5", contactId: "c1", text: "Yes, I'm interested in UK universities", timestamp: "10:35 AM", fromMe: false, status: "read" },
  ],
  c2: [
    { id: "m6", contactId: "c2", text: "Hello, I want to study in Canada", timestamp: "9:15 AM", fromMe: false, status: "read" },
    { id: "m7", contactId: "c2", text: "Hi Fatima! 🇨🇦 Canada is a fantastic choice! We can help with universities, visas, and scholarships.", timestamp: "9:16 AM", fromMe: true, status: "read" },
    { id: "m8", contactId: "c2", text: "When is the next intake?", timestamp: "9:20 AM", fromMe: false, status: "read" },
  ],
};

/* ─── Quick Replies (wacrm pattern) ─── */
const QUICK_REPLIES = [
  "Yes, let's schedule a consultation",
  "I'll send you the document list",
  "The next intake is September 2025",
  "Let me check and get back to you",
  "Would you like to speak with a counselor?",
];

/* ─── Message Status Icon ─── */
function MessageStatus({ status }: { status: WhatsAppMessage["status"] }) {
  switch (status) {
    case "sent": return <Check className="w-3.5 h-3.5 text-slate-300" />;
    case "delivered": return <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />;
    case "read": return <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />;
    case "failed": return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  }
}

/* ─── Main Component ─── */
export default function WhatsAppCrm() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>(DEMO_CONTACTS);
  const [messages, setMessages] = useState<Record<string, WhatsAppMessage[]>>(DEMO_MESSAGES);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(DEMO_CONTACTS[0]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMessage | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const currentMessages = selectedContact ? (messages[selectedContact.id] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    setSending(true);

    const msg: WhatsAppMessage = {
      id: `m${Date.now()}`,
      contactId: selectedContact.id,
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      fromMe: true,
      status: "sent",
    };

    setMessages(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), msg],
    }));

    setContacts(prev => prev.map(c =>
      c.id === selectedContact.id
        ? { ...c, lastMessage: newMessage.trim(), lastMessageTime: "Just now" }
        : c
    ));

    setNewMessage("");
    setSending(false);

    // Simulate delivery status update
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedContact.id]: (prev[selectedContact.id] || []).map(m =>
          m.id === msg.id ? { ...m, status: "delivered" } : m
        ),
      }));
    }, 2000);

    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedContact.id]: (prev[selectedContact.id] || []).map(m =>
          m.id === msg.id ? { ...m, status: "read" } : m
        ),
      }));
    }, 4000);
  };

  const handleTemplateSelect = (template: TemplateMessage) => {
    setSelectedTemplate(template);
    const vars: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v === "name" && selectedContact) vars[v] = selectedContact.name;
      else vars[v] = "";
    });
    setTemplateVars(vars);
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;
    let text = selectedTemplate.content;
    selectedTemplate.variables.forEach(v => {
      text = text.replace(`{{${v}}}`, templateVars[v] || v);
    });
    setNewMessage(text);
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply);
  };

  const scoreColor = (score?: number) => {
    if (!score) return "text-slate-400";
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-amber-600";
    return "text-sky-600";
  };

  return (
    <div className="h-[600px] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200" style={{ backgroundColor: `${WHATSAPP_GREEN}10` }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" style={{ color: WHATSAPP_GREEN }} />
          <h2 className="font-semibold text-slate-900">WhatsApp CRM</h2>
          <Badge className="text-[10px] text-white" style={{ backgroundColor: WHATSAPP_GREEN }}>
            {contacts.filter(c => c.status === "active").length} contacts
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Message Templates</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {TEMPLATES.map(t => (
                  <div key={t.id} className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer" onClick={() => handleTemplateSelect(t)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{t.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{t.content}</p>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content: Sidebar + Chat */}
      <div className="flex-1 flex min-h-0">
        {/* Contact Sidebar */}
        <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-0.5 px-1">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
                    selectedContact?.id === contact.id ? "bg-white shadow-sm" : "hover:bg-white/60"
                  }`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                      {contact.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900 truncate">{contact.name}</span>
                      {contact.unreadCount > 0 && (
                        <span className="ml-1 w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center" style={{ backgroundColor: WHATSAPP_GREEN }}>
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{contact.lastMessage}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-slate-400">{contact.lastMessageTime}</span>
                      {contact.leadScore && (
                        <span className={`text-[10px] font-bold ${scoreColor(contact.leadScore)}`}>
                          {contact.leadScore >= 70 ? "HOT" : contact.leadScore >= 40 ? "WARM" : "COLD"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedContact ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs" style={{ backgroundColor: `${WHATSAPP_GREEN}15`, color: WHATSAPP_GREEN }}>
                    {selectedContact.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">{selectedContact.name}</p>
                  <p className="text-[11px] text-slate-400">{selectedContact.phone}</p>
                </div>
                {selectedContact.leadId && (
                  <Badge variant="outline" className="text-[10px] ml-2" style={{ borderColor: ALO_BLUE, color: ALO_BLUE }}>
                    {selectedContact.leadId}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {selectedContact.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {currentMessages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${msg.fromMe ? "order-2" : "order-1"}`}>
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          msg.fromMe
                            ? "bg-slate-100 text-slate-800 rounded-br-sm"
                            : "text-white rounded-bl-sm"
                        }`}
                        style={!msg.fromMe ? { backgroundColor: WHATSAPP_GREEN } : undefined}
                      >
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        {msg.fromMe && <MessageStatus status={msg.status} />}
                        {msg.templateId && (
                          <Badge variant="secondary" className="text-[9px] h-3.5 px-1">Template</Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Template Variable Input */}
            {selectedTemplate && (
              <div className="px-4 py-2 border-t border-slate-200 bg-amber-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-800">Fill template: {selectedTemplate.name}</span>
                  <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={() => setSelectedTemplate(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedTemplate.variables.map(v => (
                    <Input
                      key={v}
                      placeholder={v}
                      value={templateVars[v] || ""}
                      onChange={e => setTemplateVars(prev => ({ ...prev, [v]: e.target.value }))}
                      className="h-7 text-xs w-32"
                    />
                  ))}
                  <Button size="sm" className="h-7 text-xs" style={{ backgroundColor: WHATSAPP_GREEN, color: "white" }} onClick={applyTemplate}>
                    Apply
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            <div className="px-4 py-1.5 border-t border-slate-100 flex gap-1.5 overflow-x-auto">
              {QUICK_REPLIES.map(reply => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="shrink-0 px-2.5 py-1 rounded-full text-[11px] border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Message Input */}
            <div className="px-4 py-2.5 border-t border-slate-200 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <FileText className="w-4 h-4 text-slate-400" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="sm"
                className="h-9 w-9 p-0"
                style={{ backgroundColor: newMessage.trim() ? WHATSAPP_GREEN : "#e2e8f0", color: newMessage.trim() ? "white" : "#94a3b8" }}
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="text-sm">Select a contact to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
