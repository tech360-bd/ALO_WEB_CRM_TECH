'use client';

import { useState, useEffect, useRef } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, Send, Phone, Mail, Paperclip, Smile,
  MessageCircle, MoreVertical, Check, CheckCheck,
  MapPin, Tag, UserCircle, Clock, ChevronDown, Zap, Users,
} from 'lucide-react';

type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';

interface WhatsAppMessage {
  id: string;
  text: string;
  sentAt: string;
  isMine: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  leadStatus: LeadStatus;
  destination: string;
  tags: string[];
  online: boolean;
  lastSeen: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: WhatsAppMessage[];
}

const quickReplies = [
  'Hi! Thank you for reaching out to ALO Education.',
  'Please share your academic documents so I can evaluate your profile.',
  'I have a few university options that match your profile. Can we schedule a call?',
  'Your application has been submitted successfully!',
  'Please let me know a convenient time for your counseling session.',
  'I will follow up with the university and get back to you shortly.',
];

const mockContacts: Contact[] = [
  {
    id: '1', name: 'Rahim Uddin', phone: '+880 1612-345678', email: 'rahim@email.com',
    leadStatus: 'Qualified', destination: 'UK', tags: ['IELTS', 'MSc CS'], online: true, lastSeen: 'Online',
    lastMessage: 'Thanks for the university list! I will review tonight.', lastTime: '10:30 AM', unread: 2,
    messages: [
      { id: 'm1', text: 'Salam Rahim! How is your IELTS preparation going?', sentAt: '10:00 AM', isMine: true, status: 'read' },
      { id: 'm2', text: 'Going well Alhamdulillah. I scored 7.5 in mock test!', sentAt: '10:05 AM', isMine: false },
      { id: 'm3', text: 'That\'s excellent! With that score, you\'re eligible for University of Manchester, Leeds, and Sheffield. Let me share the details.', sentAt: '10:10 AM', isMine: true, status: 'read' },
      { id: 'm4', text: 'I have shortlisted 3 programs for you. Please check the brochure I just shared.', sentAt: '10:15 AM', isMine: true, status: 'delivered' },
      { id: 'm5', text: 'Thanks for the university list! I will review tonight.', sentAt: '10:30 AM', isMine: false },
    ],
  },
  {
    id: '2', name: 'Fatima Akter', phone: '+880 1812-234567', email: 'fatima@email.com',
    leadStatus: 'Contacted', destination: 'Australia', tags: ['MBA', 'Feb 2025'], online: false, lastSeen: '2:15 PM',
    lastMessage: 'I will send the bank statement by tomorrow InshaAllah.', lastTime: '9:45 AM', unread: 1,
    messages: [
      { id: 'm6', text: 'Hi Fatima! Your University of Melbourne application is progressing well. We need the bank statement to proceed.', sentAt: '9:20 AM', isMine: true, status: 'read' },
      { id: 'm7', text: 'How much do we need to show?', sentAt: '9:30 AM', isMine: false },
      { id: 'm8', text: 'AUD 65,000 for one year\'s tuition + living expenses. I\'ll send the requirement document.', sentAt: '9:35 AM', isMine: true, status: 'read' },
      { id: 'm9', text: 'I will send the bank statement by tomorrow InshaAllah.', sentAt: '9:45 AM', isMine: false },
    ],
  },
  {
    id: '3', name: 'Tanvir Ahmed', phone: '+880 1712-987654', email: 'tanvir@email.com',
    leadStatus: 'Converted', destination: 'UK', tags: ['CAS', 'Visa'], online: true, lastSeen: 'Online',
    lastMessage: 'Alhamdulillah! My visa got approved! 🎉', lastTime: 'Yesterday', unread: 0,
    messages: [
      { id: 'm10', text: 'Great news Tanvir! Your CAS has been issued by University of Leeds.', sentAt: '3:00 PM', isMine: true, status: 'read' },
      { id: 'm11', text: 'JazakAllah Khair! When can we apply for the visa?', sentAt: '3:10 PM', isMine: false },
      { id: 'm12', text: 'We can submit the visa application this week. Please prepare your documents.', sentAt: '3:15 PM', isMine: true, status: 'read' },
      { id: 'm13', text: 'Alhamdulillah! My visa got approved! 🎉', sentAt: 'Yesterday', isMine: false },
      { id: 'm14', text: 'Mabrook Tanvir! Congratulations! 🎉 We\'ll help with pre-departure orientation.', sentAt: 'Yesterday', isMine: true, status: 'read' },
    ],
  },
  {
    id: '4', name: 'Nusrat Jahan', phone: '+880 1912-456789', email: 'nusrat@email.com',
    leadStatus: 'New', destination: 'USA', tags: ['GRE', 'MS Data Sci'], online: false, lastSeen: '5:00 PM',
    lastMessage: 'Hi, I am interested in studying Data Science in the USA.', lastTime: 'Yesterday', unread: 3,
    messages: [
      { id: 'm15', text: 'Hi, I am interested in studying Data Science in the USA.', sentAt: 'Yesterday', isMine: false },
      { id: 'm16', text: 'Can you share my GRE score? It\'s 320.', sentAt: 'Yesterday', isMine: false },
      { id: 'm17', text: 'I have a 3.8 GPA in CSE from BUET.', sentAt: 'Yesterday', isMine: false },
    ],
  },
  {
    id: '5', name: 'Imran Hossain', phone: '+880 1512-567890', email: 'imran@email.com',
    leadStatus: 'Qualified', destination: 'Canada', tags: ['Diploma', 'Seneca'], online: false, lastSeen: '11:30 AM',
    lastMessage: 'When does the Winter 2025 semester start?', lastTime: 'Monday', unread: 0,
    messages: [
      { id: 'm18', text: 'Hi Imran! Following up on your Seneca College application.', sentAt: '11:00 AM', isMine: true, status: 'read' },
      { id: 'm19', text: 'Yes! I got the offer letter last week.', sentAt: '11:10 AM', isMine: false },
      { id: 'm20', text: 'When does the Winter 2025 semester start?', sentAt: '11:30 AM', isMine: false },
      { id: 'm21', text: 'Winter intake starts January 6, 2025. We should start the visa process ASAP.', sentAt: '11:35 AM', isMine: true, status: 'read' },
    ],
  },
  {
    id: '6', name: 'Mim Akhter', phone: '+880 1612-666666', email: 'mim@email.com',
    leadStatus: 'New', destination: 'Germany', tags: ['MS AI', 'Tuition Free'], online: true, lastSeen: 'Online',
    lastMessage: 'Is it really tuition-free? 😊', lastTime: 'Monday', unread: 1,
    messages: [
      { id: 'm22', text: 'Hello Mim! I saw your inquiry about studying in Germany. How can I help?', sentAt: 'Monday', isMine: true, status: 'delivered' },
      { id: 'm23', text: 'Is it really tuition-free? 😊', sentAt: 'Monday', isMine: false },
    ],
  },
  {
    id: '7', name: 'Sajib Rahman', phone: '+880 1612-678901', email: 'sajib@email.com',
    leadStatus: 'Contacted', destination: 'UK', tags: ['MA Marketing', 'IELTS 7.0'], online: false, lastSeen: 'Sunday',
    lastMessage: 'I uploaded the SOP draft to the portal.', lastTime: 'Sunday', unread: 0,
    messages: [
      { id: 'm24', text: 'Hi Sajib, your SOP review is done. A few suggestions have been added.', sentAt: 'Sunday', isMine: true, status: 'read' },
      { id: 'm25', text: 'I uploaded the SOP draft to the portal.', sentAt: 'Sunday', isMine: false },
      { id: 'm26', text: 'Perfect! I\'ll review it today and get back to you by evening.', sentAt: 'Sunday', isMine: true, status: 'delivered' },
    ],
  },
  {
    id: '8', name: 'Arif Islam', phone: '+880 1712-890123', email: 'arif@email.com',
    leadStatus: 'Lost', destination: 'Germany', tags: ['Deferred'], online: false, lastSeen: 'Jan 8',
    lastMessage: 'I decided to defer to Summer 2025 due to personal reasons.', lastTime: 'Jan 8', unread: 0,
    messages: [
      { id: 'm27', text: 'Arif, I noticed you haven\'t been responding. Is everything okay?', sentAt: 'Jan 5', isMine: true, status: 'read' },
      { id: 'm28', text: 'I decided to defer to Summer 2025 due to personal reasons.', sentAt: 'Jan 8', isMine: false },
      { id: 'm29', text: 'No problem at all. I\'ll mark your file for Summer 2025. We\'ll reconnect in March.', sentAt: 'Jan 8', isMine: true, status: 'read' },
    ],
  },
];

const statusColors: Record<LeadStatus, string> = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-amber-100 text-amber-700',
  Qualified: 'bg-purple-100 text-purple-700',
  Converted: 'bg-emerald-100 text-emerald-700',
  Lost: 'bg-red-100 text-red-600',
};

export default function EmployeeWhatsAppPage() {
  const { setView } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || null;

  useEffect(() => {
    const t = setTimeout(() => {
      setContacts(mockContacts);
      setSelectedContactId('1');
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact?.messages.length]);

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const handleSend = () => {
    if (!messageInput.trim() || !selectedContactId) return;
    const newMsg: WhatsAppMessage = {
      id: `m-${Date.now()}`,
      text: messageInput.trim(),
      sentAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isMine: true,
      status: 'sent',
    };
    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContactId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, lastTime: 'Just now' }
          : c
      )
    );
    setMessageInput('');
    setShowQuickReplies(false);
    toast.success('Message sent');
  };

  const handleQuickReply = (text: string) => {
    setMessageInput(text);
    setShowQuickReplies(false);
  };

  if (loading) {
    return (
      <div className="flex gap-0 h-[calc(100vh-3.5rem)]">
        <div className="w-80 border-r border-alo-border bg-white p-4 space-y-3 hidden md:block">
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={cn('h-12 w-3/4 rounded-xl', i % 2 === 0 ? 'ml-auto w-2/3' : '')} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-3.5rem)]">
      {/* Left panel - Conversation list */}
      <div className="w-80 border-r border-alo-border bg-white flex flex-col shrink-0 hidden md:flex">
        <div className="p-3 border-b border-alo-border">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-alo-text">WhatsApp</h2>
            <Badge variant="secondary" className="ml-auto text-[11px] bg-green-100 text-green-700">
              {contacts.reduce((a, c) => a + c.unread, 0)} unread
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-alo-page border-alo-border text-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => {
                setSelectedContactId(contact.id);
                setContacts((prev) =>
                  prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c))
                );
              }}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-3 text-left transition-colors border-b border-alo-border/50',
                selectedContactId === contact.id
                  ? 'bg-green-50'
                  : 'hover:bg-alo-page/50'
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-green-100 text-green-700 text-xs font-semibold">
                    {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn('text-sm font-medium truncate', selectedContactId === contact.id ? 'text-green-800' : 'text-alo-text')}>
                    {contact.name}
                  </span>
                  <span className="text-[10px] text-alo-text-muted shrink-0 ml-2">{contact.lastTime}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-alo-text-secondary truncate flex-1">
                    {selectedContactId === contact.id && contact.messages.length > 0
                      ? (contact.messages[contact.messages.length - 1].isMine ? 'You: ' : '') + contact.lastMessage
                      : contact.lastMessage}
                  </p>
                  {contact.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filteredContacts.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-alo-text-secondary">No conversations found</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Center - Message thread */}
      <div className="flex-1 flex flex-col bg-alo-page min-w-0">
        {selectedContact ? (
          <>
            {/* Chat header */}
            <div className="h-14 bg-white border-b border-alo-border flex items-center px-4 gap-3 shrink-0">
              <div className="relative">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-green-100 text-green-700 text-xs font-semibold">
                    {selectedContact.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {selectedContact.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-alo-text">{selectedContact.name}</p>
                <p className="text-[11px] text-alo-text-muted">
                  {selectedContact.online ? (
                    <span className="text-green-600">Online</span>
                  ) : (
                    'Last seen ' + selectedContact.lastSeen
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  onClick={() => setShowContactInfo(true)}
                >
                  <MoreVertical className="w-4 h-4 text-alo-text-secondary" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowContactInfo(!showContactInfo)} className="hidden lg:flex">
                  <UserCircle className="w-4 h-4 text-alo-text-secondary" />
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-2xl mx-auto space-y-2">
                {selectedContact.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', msg.isMine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                        msg.isMine
                          ? 'bg-[#25D366] text-white rounded-br-sm'
                          : 'bg-white text-alo-text border border-alo-border rounded-bl-sm'
                      )}
                    >
                      <p>{msg.text}</p>
                      <div className={cn(
                        'flex items-center gap-1 mt-1 justify-end',
                        msg.isMine ? 'text-green-100' : 'text-alo-text-muted'
                      )}>
                        <span className="text-[10px]">{msg.sentAt}</span>
                        {msg.isMine && msg.status === 'read' && <CheckCheck className="w-3 h-3" />}
                        {msg.isMine && msg.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                        {msg.isMine && msg.status === 'sent' && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="bg-white border-t border-alo-border p-3 shrink-0">
              <div className="max-w-2xl mx-auto flex items-end gap-2">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className="text-alo-text-muted"
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                  {showQuickReplies && (
                    <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-lg border border-alo-border z-10 overflow-hidden">
                      <div className="px-3 py-2 bg-alo-page border-b border-alo-border">
                        <p className="text-xs font-semibold text-alo-text">Quick Replies</p>
                      </div>
                      <ScrollArea className="max-h-60">
                        {quickReplies.map((reply, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuickReply(reply)}
                            className="w-full text-left px-3 py-2 text-xs text-alo-text-secondary hover:bg-green-50 hover:text-green-700 transition-colors border-b border-alo-border/50 last:border-0"
                          >
                            {reply}
                          </button>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="pr-16 h-10 bg-alo-page border-alo-border text-sm"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" className="w-7 h-7 text-alo-text-muted">
                      <Paperclip className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="w-7 h-7 text-green-600"
                      onClick={handleSend}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-alo-text">WhatsApp Conversations</h3>
              <p className="text-sm text-alo-text-muted mt-1">Select a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel - Contact info sidebar */}
      {selectedContact && showContactInfo && (
        <div className="w-72 border-l border-alo-border bg-white p-4 space-y-4 shrink-0 hidden lg:block overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-alo-text">Contact Info</h3>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowContactInfo(false)}>
              <MoreVertical className="w-4 h-4 text-alo-text-muted" />
            </Button>
          </div>
          <div className="text-center">
            <Avatar className="w-16 h-16 mx-auto mb-2">
              <AvatarFallback className="bg-green-100 text-green-700 text-lg font-semibold">
                {selectedContact.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-alo-text">{selectedContact.name}</p>
            <p className={cn('text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1', statusColors[selectedContact.leadStatus])}>
              {selectedContact.leadStatus}
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-alo-text-muted" />
              <span className="text-alo-text-secondary">{selectedContact.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-alo-text-muted" />
              <span className="text-alo-text-secondary">{selectedContact.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-alo-text-muted" />
              <span className="text-alo-text-secondary">{selectedContact.destination}</span>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-alo-text mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedContact.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] bg-alo-page">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setView('employee-leads');
              toast.info('Opening lead details for ' + selectedContact.name);
            }}
          >
            <Users className="w-3.5 h-3.5" /> View Lead Details
          </Button>
        </div>
      )}
    </div>
  );
}
