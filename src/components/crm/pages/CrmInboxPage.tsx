'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Search, Mail, Star, Send, Trash2, Archive,
  MailOpen, Clock, Reply, ArrowLeft, Paperclip, Inbox,
  Plus, ChevronDown, MoreVertical, Flag, Filter,
} from 'lucide-react';

type MessageFolder = 'all' | 'unread' | 'flagged' | 'sent';

interface InboxMessage {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
  flagged: boolean;
  folder: MessageFolder;
  hasAttachment: boolean;
  category: string;
}

const STORAGE_KEY = 'crm-inbox-messages';

const defaultMessages: InboxMessage[] = [
  {
    id: 'MSG-001', from: 'Arif Rahman', fromEmail: 'arif.rahman@gmail.com',
    subject: 'Inquiry about MSc Computer Science at University of Manchester',
    preview: 'I am interested in applying for the MSc Computer Science program for September 2025 intake...',
    body: 'Dear ALO Education Team,\n\nI am writing to express my interest in applying for the MSc Computer Science program at the University of Manchester for the September 2025 intake.\n\nI completed my BSc in Computer Science from BUET in 2023 with a CGPA of 3.7/4.0. I have been working as a Software Engineer at a tech company for the past two years.\n\nCould you please provide me with information about:\n1. The entry requirements and IELTS score needed\n2. Available scholarships for international students\n3. The application timeline and process\n4. Tuition fees and living costs in Manchester\n\nI would appreciate a counselling session at your earliest convenience.\n\nBest regards,\nArif Rahman',
    timestamp: '2025-06-28T09:15:00', read: false, flagged: true, folder: 'all', hasAttachment: true, category: 'Admission',
  },
  {
    id: 'MSG-002', from: 'Fatima Begum', fromEmail: 'fatima.b@yahoo.com',
    subject: 'UK Student Visa - Biometric Appointment Query',
    preview: 'I have received my CAS letter but I am confused about the biometric appointment booking process...',
    body: 'Dear Sir/Madam,\n\nI have recently received my CAS letter from the University of Birmingham. However, I am a bit confused about the biometric appointment booking process.\n\nCould you please clarify:\n- How do I book my biometric appointment?\n- What documents do I need to carry?\n- How long does the visa processing usually take?\n- Can I expedite the process if my course starts in September?\n\nMy passport details have been shared with your office previously.\n\nThank you for your help.\n\nFatima Begum',
    timestamp: '2025-06-28T08:45:00', read: false, flagged: false, folder: 'all', hasAttachment: false, category: 'Visa',
  },
  {
    id: 'MSG-003', from: 'Sakib Hossain', fromEmail: 'sakib.h@outlook.com',
    subject: 'Document Verification - Transcript from Dhaka University',
    preview: 'I have uploaded my academic transcripts from Dhaka University for verification...',
    body: 'Hello,\n\nI have uploaded my academic transcripts from the University of Dhaka for your verification process. I am applying to the MSc Data Science program at the University of Edinburgh.\n\nPlease find the following documents attached:\n- BSc Transcripts (All 4 years)\n- Degree Certificate\n- IELTS Score Report (Overall 7.5)\n- Statement of Purpose Draft\n\nKindly review and let me know if any additional documents are required.\n\nRegards,\nSakib Hossain',
    timestamp: '2025-06-27T16:30:00', read: true, flagged: false, folder: 'all', hasAttachment: true, category: 'Documents',
  },
  {
    id: 'MSG-004', from: 'Nusrat Jahan', fromEmail: 'nusrat.j@gmail.com',
    subject: 'Scholarship Application Deadline - University of Leeds',
    preview: 'Could you help me check if I am eligible for the International Excellence Scholarship...',
    body: 'Dear ALO Education,\n\nI recently received an unconditional offer from the University of Leeds for the MA International Business program. Could you please help me check if I am eligible for the International Excellence Scholarship?\n\nMy academic profile:\n- BBA from North South University (CGPA: 3.85/4.0)\n- IELTS: 7.0 overall\n- 2 years work experience at a multinational company\n\nThe scholarship deadline is approaching soon, so I would appreciate your urgent guidance on the application process.\n\nThank you,\nNusrat Jahan',
    timestamp: '2025-06-27T14:20:00', read: false, flagged: true, folder: 'all', hasAttachment: false, category: 'Scholarship',
  },
  {
    id: 'MSG-005', from: 'Tanvir Ahmed', fromEmail: 'tanvir.a@gmail.com',
    subject: 'University of Warwick - Offer Condition Clarification',
    preview: 'I received a conditional offer from Warwick and need help understanding the requirements...',
    body: 'Dear Team,\n\nI have received a conditional offer from the University of Warwick for the MSc Engineering Management program. The conditions mention:\n\n1. Achieve a minimum 2:1 equivalent in my final degree\n2. Submit IELTS with minimum 6.5 in each band\n3. Provide a professional reference\n\nI am currently waiting for my final semester results. Could you advise on what to do if my result is slightly below the required threshold? Is there any possibility of appealing?\n\nLooking forward to your response.\n\nTanvir Ahmed',
    timestamp: '2025-06-27T11:00:00', read: true, flagged: false, folder: 'all', hasAttachment: true, category: 'Admission',
  },
  {
    id: 'MSG-006', from: 'Mitu Sarkar', fromEmail: 'mitu.s@gmail.com',
    subject: 'Change of Course - Switching from LLM to MBA',
    preview: 'I would like to change my application from LLM at University of Bristol to MBA...',
    body: 'Hello,\n\nI initially applied for the LLM program at the University of Bristol, but after further consideration, I would like to switch my application to the MBA program instead.\n\nIs it possible to change my course application at this stage? My original UCAS/application ID is UK2025-00934.\n\nI have already paid the application fee. Will there be any additional charges for this change?\n\nPlease advise at the earliest.\n\nMitu Sarkar',
    timestamp: '2025-06-26T17:45:00', read: true, flagged: false, folder: 'all', hasAttachment: false, category: 'Admission',
  },
  {
    id: 'MSG-007', from: 'Imran Khan', fromEmail: 'imran.k@yahoo.com',
    subject: 'Accommodation Arrangement - University of Glasgow',
    preview: 'I need help finding student accommodation near the University of Glasgow campus...',
    body: 'Dear ALO Education Team,\n\nI have accepted my offer at the University of Glasgow and now need assistance with finding suitable student accommodation near the campus.\n\nMy preferences:\n- En-suite room\n- Within walking distance or short bus ride to campus\n- Budget: £150-200 per week\n- Available from September 1, 2025\n\nDo you have any recommended accommodation providers or can you assist with the university accommodation booking?\n\nThanks,\nImran Khan',
    timestamp: '2025-06-26T13:10:00', read: false, flagged: false, folder: 'all', hasAttachment: false, category: 'General',
  },
  {
    id: 'MSG-008', from: 'Sharmin Akter', fromEmail: 'sharmin.a@gmail.com',
    subject: 'ATAS Certificate Requirement - University of Sheffield',
    preview: 'Do I need an ATAS certificate for my MSc Aerospace Engineering at Sheffield?',
    body: 'Dear Counselor,\n\nI have been offered a place on the MSc Aerospace Engineering program at the University of Sheffield. I have read online that some engineering programs require an ATAS certificate.\n\nCould you confirm:\n1. Do I need an ATAS certificate for this specific program?\n2. If yes, what is the application process?\n3. How long does it take to get an ATAS certificate?\n4. Can I apply for my visa without the ATAS certificate?\n\nYour guidance would be greatly appreciated.\n\nSharmin Akter',
    timestamp: '2025-06-26T10:30:00', read: true, flagged: true, folder: 'all', hasAttachment: false, category: 'Visa',
  },
  {
    id: 'MSG-009', from: 'Rakib Islam', fromEmail: 'rakib.i@outlook.com',
    subject: 'IELTS Preparation Tips and Test Date Availability',
    preview: 'Can you recommend any IELTS preparation resources and help me find an available test date?',
    body: 'Hi there,\n\nI need to take the IELTS Academic test as part of my application requirements. I am aiming for a score of 7.0 overall.\n\nCould you please:\n1. Recommend any good IELTS preparation courses or resources?\n2. Help me find available test dates in Dhaka for July or August 2025?\n3. Let me know about the British Council vs IDP test centers\n\nMy target universities require a minimum IELTS score of 6.5-7.0.\n\nBest,\nRakib Islam',
    timestamp: '2025-06-25T15:00:00', read: true, flagged: false, folder: 'all', hasAttachment: false, category: 'General',
  },
  {
    id: 'MSG-010', from: 'Priya Das', fromEmail: 'priya.d@gmail.com',
    subject: 'Tuition Fee Payment Plan - University of Nottingham',
    preview: 'I would like to know about available tuition fee payment plans for my MSc program...',
    body: 'Dear ALO Education,\n\nI have confirmed my place at the University of Nottingham for the MSc Finance and Accounting program. The tuition fee is £28,000.\n\nI would like to inquire about:\n1. Available payment plans (installment options)\n2. Early payment discounts if any\n3. Deposit amount required to secure the offer\n4. Accepted payment methods for international students\n\nCould you also help me understand the cost of living in Nottingham?\n\nThank you,\nPriya Das',
    timestamp: '2025-06-25T12:15:00', read: false, flagged: false, folder: 'all', hasAttachment: false, category: 'Finance',
  },
];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getCategoryColor(cat: string): string {
  const colors: Record<string, string> = {
    Admission: 'bg-blue-100 text-blue-700',
    Visa: 'bg-purple-100 text-purple-700',
    Documents: 'bg-amber-100 text-amber-700',
    Scholarship: 'bg-emerald-100 text-emerald-700',
    Finance: 'bg-orange-100 text-orange-700',
    General: 'bg-gray-100 text-gray-600',
  };
  return colors[cat] || colors.General;
}

export default function CrmInboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch { /* ignore */ }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMessages));
    }
    return defaultMessages;
  });
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [activeTab, setActiveTab] = useState<MessageFolder>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const saveMessages = (updated: InboxMessage[]) => {
    setMessages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filteredMessages = messages.filter(msg => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!msg.from.toLowerCase().includes(q) && !msg.subject.toLowerCase().includes(q) && !msg.preview.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (activeTab === 'unread') return !msg.read;
    if (activeTab === 'flagged') return msg.flagged;
    if (activeTab === 'sent') return msg.folder === 'sent';
    return true;
  });

  const unreadCount = messages.filter(m => !m.read).length;
  const flaggedCount = messages.filter(m => m.flagged).length;
  const sentCount = messages.filter(m => m.folder === 'sent').length;

  const handleSelectMessage = (msg: InboxMessage) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      const updated = messages.map(m => m.id === msg.id ? { ...m, read: true } : m);
      saveMessages(updated);
    }
  };

  const handleToggleFlag = (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    const updated = messages.map(m => m.id === msgId ? { ...m, flagged: !m.flagged } : m);
    saveMessages(updated);
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(prev => prev ? { ...prev, flagged: !prev.flagged } : null);
    }
  };

  const handleMarkAllRead = () => {
    saveMessages(messages.map(m => ({ ...m, read: true })));
  };

  const handleDelete = (msgId: string) => {
    const updated = messages.filter(m => m.id !== msgId);
    saveMessages(updated);
    if (selectedMessage?.id === msgId) setSelectedMessage(null);
  };

  const handleSendCompose = () => {
    if (!composeTo.trim() || !composeSubject.trim()) return;
    const newMsg: InboxMessage = {
      id: `MSG-${String(Date.now()).slice(-6)}`,
      from: 'You (ALO Education)',
      fromEmail: 'info@aloeducation.com',
      subject: composeSubject,
      preview: composeBody.slice(0, 100),
      body: composeBody,
      timestamp: new Date().toISOString(),
      read: true,
      flagged: false,
      folder: 'sent',
      hasAttachment: false,
      category: 'General',
    };
    const updated = [newMsg, ...messages];
    saveMessages(updated);
    setShowCompose(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setComposeTo(selectedMessage.fromEmail);
    setComposeSubject(`Re: ${selectedMessage.subject}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${selectedMessage.from} <${selectedMessage.fromEmail}>\nDate: ${selectedMessage.timestamp}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.body}`);
    setShowCompose(true);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Inbox className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
            <p className="text-sm text-gray-500">ALO Education Messaging</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <MailOpen className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
          <Button size="sm" onClick={() => setShowCompose(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            Compose
          </Button>
        </div>
      </div>

      {/* Compose Overlay */}
      {showCompose && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Message</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 w-16">To:</label>
              <Input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="recipient@email.com" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 w-16">Subject:</label>
              <Input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Message subject" />
            </div>
            <Textarea
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              placeholder="Write your message..."
              rows={6}
              className="resize-y"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
              <Button onClick={handleSendCompose} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left Panel - Message List */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-lg border shadow-sm">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Folder Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'unread' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Unread
              {unreadCount > 0 && <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 min-w-[20px] text-center">{unreadCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('flagged')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'flagged' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Flagged
              {flaggedCount > 0 && <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 min-w-[20px] text-center">{flaggedCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'sent' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sent
              {sentCount > 0 && <span className="bg-gray-400 text-white text-xs rounded-full px-1.5 min-w-[20px] text-center">{sentCount}</span>}
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Mail className="h-8 w-8 mb-2" />
                <p className="text-sm">No messages found</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-blue-50/50 ${selectedMessage?.id === msg.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''} ${!msg.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${!msg.read ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {getInitials(msg.from)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${!msg.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{msg.from}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {msg.hasAttachment && <Paperclip className="h-3 w-3 text-gray-400" />}
                          <span className="text-xs text-gray-400">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-sm truncate ${!msg.read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{msg.subject}</span>
                        {!msg.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 truncate flex-1">{msg.preview}</span>
                        <span onClick={(e) => handleToggleFlag(e, msg.id)} className="shrink-0">
                          {msg.flagged ? <Flag className="h-3 w-3 text-orange-500 fill-orange-500" /> : <Flag className="h-3 w-3 text-gray-300" />}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Message Detail */}
        <div className="flex-1 bg-white rounded-lg border shadow-sm flex flex-col">
          {selectedMessage ? (
            <>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedMessage(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(selectedMessage.from)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedMessage.from}</p>
                        <p className="text-sm text-gray-500">{selectedMessage.fromEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={getCategoryColor(selectedMessage.category)}>
                      {selectedMessage.category}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleFlag(({} as React.MouseEvent), selectedMessage.id)}>
                      {selectedMessage.flagged ? <Flag className="h-4 w-4 text-orange-500 fill-orange-500" /> : <Flag className="h-4 w-4 text-gray-300" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleReply}>
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedMessage.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{selectedMessage.subject}</h2>
                </div>
                <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  {new Date(selectedMessage.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  {selectedMessage.hasAttachment && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Paperclip className="h-3 w-3" />
                      Attachment
                    </Badge>
                  )}
                </div>
                <Separator className="mb-4" />
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {selectedMessage.body}
                </div>
              </div>
              <div className="border-t p-4 flex gap-2">
                <Button onClick={handleReply} className="bg-blue-600 hover:bg-blue-700">
                  <Reply className="h-4 w-4 mr-1" />
                  Reply
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline">
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium text-gray-500">Select a message</p>
              <p className="text-sm">Choose a message from the inbox to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
