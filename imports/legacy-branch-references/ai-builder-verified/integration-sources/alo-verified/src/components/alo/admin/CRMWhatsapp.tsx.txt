'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  MessageSquare, Send, Phone, Search, Bot, FileText, Clock,
  MoreVertical, Plus, Tag, User, Calendar, CheckCheck,
  Smartphone, Zap, Filter, Paperclip, ArrowLeft, Star, StickyNote, Link2
} from 'lucide-react'
import { toast } from 'sonner'

// Types
type ConvStatus = 'open' | 'pending' | 'resolved'
type ContactType = 'student' | 'partner' | 'lead'
type MsgDir = 'in' | 'out'
type MsgType = 'text' | 'template' | 'ai'

interface Message {
  id: string; text: string; direction: MsgDir; type: MsgType; time: string; read: boolean
}
interface Conversation {
  id: string; name: string; phone: string; avatar: string; lastMsg: string;
  lastTime: string; unread: number; status: ConvStatus; assignedTo: string;
  contactType: ContactType; email: string; tags: string[]; leadStatus: string;
  messages: Message[]; poolNumber: string
}
interface Template {
  id: string; name: string; body: string; category: string; language: string; status: 'approved' | 'pending' | 'rejected'
}
interface AutoRule {
  id: string; name: string; trigger: string; action: string; active: boolean
}

// Mock Data
const POOL_NUMBERS = [
  { id: 'p1', number: '+880 1712-345678', label: 'Main Line', status: 'active' as const },
  { id: 'p2', number: '+880 1812-345678', label: 'Student Support', status: 'active' as const },
  { id: 'p3', number: '+880 1912-345678', label: 'Partner Line', status: 'cooling' as const },
  { id: 'p4', number: '+880 1612-345678', label: 'Marketing', status: 'overloaded' as const },
  { id: 'p5', number: '+880 1512-345678', label: 'Visa Updates', status: 'active' as const },
]

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'c1', name: 'Tanvir Ahmed', phone: '+880 1711-223344', avatar: 'TA', lastMsg: 'When is the next intake for UK universities?', lastTime: '2 min ago', unread: 3, status: 'open', assignedTo: 'Sarah K.', contactType: 'student', email: 'tanvir@email.com', tags: ['UK', 'Masters'], leadStatus: 'hot', poolNumber: '+880 1712-345678', messages: [
    { id: 'm1', text: 'Hi, I am interested in studying in the UK', direction: 'in', type: 'text', time: '10:00 AM', read: true },
    { id: 'm2', text: 'Welcome to ALO Education! We have excellent UK university partnerships. Which program interests you?', direction: 'out', type: 'template', time: '10:02 AM', read: true },
    { id: 'm3', text: 'I want to do Masters in Computer Science', direction: 'in', type: 'text', time: '10:05 AM', read: true },
    { id: 'm4', text: 'When is the next intake for UK universities?', direction: 'in', type: 'text', time: '10:06 AM', read: false },
  ]},
  { id: 'c2', name: 'Fatima Rahman', phone: '+880 1811-223344', avatar: 'FR', lastMsg: 'Thank you for the document checklist', lastTime: '15 min ago', unread: 0, status: 'resolved', assignedTo: 'Mike R.', contactType: 'student', email: 'fatima@email.com', tags: ['Canada', 'Visa'], leadStatus: 'warm', poolNumber: '+880 1812-345678', messages: [
    { id: 'm5', text: 'Can you send me the visa document checklist for Canada?', direction: 'in', type: 'text', time: '9:30 AM', read: true },
    { id: 'm6', text: 'Here is the complete document checklist for Canada student visa:\n1. Valid passport\n2. LOA from university\n3. Financial proof\n4. IELTS score\n5. Medical certificate', direction: 'out', type: 'template', time: '9:35 AM', read: true },
    { id: 'm7', text: 'Thank you for the document checklist', direction: 'in', type: 'text', time: '9:40 AM', read: true },
  ]},
  { id: 'c3', name: 'EduBridge BD', phone: '+880 1911-223344', avatar: 'EB', lastMsg: 'We have 5 new students for Australia intake', lastTime: '30 min ago', unread: 1, status: 'open', assignedTo: 'Sarah K.', contactType: 'partner', email: 'info@edubridge.bd', tags: ['Australia', 'Partner'], leadStatus: 'hot', poolNumber: '+880 1912-345678', messages: [
    { id: 'm8', text: 'Hi Sarah, we have 5 new students for Australia intake', direction: 'in', type: 'text', time: '9:00 AM', read: false },
  ]},
  { id: 'c4', name: 'Rafiq Hasan', phone: '+880 1611-223344', avatar: 'RH', lastMsg: 'Is the IELTS waiver available for German universities?', lastTime: '1 hr ago', unread: 2, status: 'pending', assignedTo: 'Unassigned', contactType: 'lead', email: 'rafiq@email.com', tags: ['Germany', 'IELTS'], leadStatus: 'new', poolNumber: '+880 1712-345678', messages: [
    { id: 'm9', text: 'Hello, I want to study in Germany', direction: 'in', type: 'text', time: '8:30 AM', read: true },
    { id: 'm10', text: 'Is the IELTS waiver available for German universities?', direction: 'in', type: 'text', time: '8:31 AM', read: false },
  ]},
  { id: 'c5', name: 'Nusrat Jahan', phone: '+880 1511-223344', avatar: 'NJ', lastMsg: 'My visa got approved! 🎉', lastTime: '2 hr ago', unread: 0, status: 'resolved', assignedTo: 'Mike R.', contactType: 'student', email: 'nusrat@email.com', tags: ['UK', 'Visa Approved'], leadStatus: 'converted', poolNumber: '+880 1812-345678', messages: [
    { id: 'm11', text: 'My visa got approved! 🎉', direction: 'in', type: 'text', time: '7:00 AM', read: true },
    { id: 'm12', text: 'Congratulations Nusrat! We are so happy for you! When are you planning to travel?', direction: 'out', type: 'text', time: '7:05 AM', read: true },
  ]},
  { id: 'c6', name: 'Arif Khan', phone: '+880 1711-556677', avatar: 'AK', lastMsg: 'What are the scholarship options for MBA?', lastTime: '3 hr ago', unread: 1, status: 'open', assignedTo: 'Sarah K.', contactType: 'lead', email: 'arif@email.com', tags: ['MBA', 'Scholarship'], leadStatus: 'warm', poolNumber: '+880 1612-345678', messages: [
    { id: 'm13', text: 'What are the scholarship options for MBA?', direction: 'in', type: 'text', time: '6:00 AM', read: false },
  ]},
  { id: 'c7', name: 'Global Study Corp', phone: '+880 1811-556677', avatar: 'GS', lastMsg: 'Commission payment for March is pending', lastTime: '4 hr ago', unread: 1, status: 'pending', assignedTo: 'Mike R.', contactType: 'partner', email: 'billing@globalstudy.com', tags: ['Commission', 'Payment'], leadStatus: 'warm', poolNumber: '+880 1912-345678', messages: [
    { id: 'm14', text: 'Commission payment for March is pending', direction: 'in', type: 'text', time: '5:00 AM', read: false },
  ]},
  { id: 'c8', name: 'Samira Begum', phone: '+880 1911-556677', avatar: 'SB', lastMsg: 'I uploaded my IELTS score to the portal', lastTime: '5 hr ago', unread: 0, status: 'open', assignedTo: 'Sarah K.', contactType: 'student', email: 'samira@email.com', tags: ['IELTS', 'Canada'], leadStatus: 'hot', poolNumber: '+880 1712-345678', messages: [
    { id: 'm15', text: 'I uploaded my IELTS score to the portal', direction: 'in', type: 'text', time: '4:00 AM', read: true },
    { id: 'm16', text: 'Great! We received your IELTS score of 7.5. Excellent result! We will proceed with your application.', direction: 'out', type: 'template', time: '4:10 AM', read: true },
  ]},
  { id: 'c9', name: 'Imran Hossain', phone: '+880 1611-556677', avatar: 'IH', lastMsg: 'Can I defer my admission to next semester?', lastTime: '6 hr ago', unread: 0, status: 'pending', assignedTo: 'Unassigned', contactType: 'student', email: 'imran@email.com', tags: ['UK', 'Deferral'], leadStatus: 'cold', poolNumber: '+880 1812-345678', messages: [
    { id: 'm17', text: 'Can I defer my admission to next semester?', direction: 'in', type: 'text', time: '3:00 AM', read: true },
  ]},
  { id: 'c10', name: 'Priya Sharma', phone: '+880 1511-556677', avatar: 'PS', lastMsg: 'Looking for nursing programs in Australia', lastTime: '8 hr ago', unread: 0, status: 'open', assignedTo: 'Mike R.', contactType: 'lead', email: 'priya@email.com', tags: ['Australia', 'Nursing'], leadStatus: 'new', poolNumber: '+880 1512-345678', messages: [
    { id: 'm18', text: 'Looking for nursing programs in Australia', direction: 'in', type: 'text', time: '1:00 AM', read: true },
  ]},
  { id: 'c11', name: 'Dream Education', phone: '+880 1711-889900', avatar: 'DE', lastMsg: 'We need to discuss the new commission structure', lastTime: '1 d ago', unread: 0, status: 'open', assignedTo: 'Sarah K.', contactType: 'partner', email: 'contact@dreamedu.com', tags: ['Commission', 'Partner'], leadStatus: 'warm', poolNumber: '+880 1912-345678', messages: [
    { id: 'm19', text: 'We need to discuss the new commission structure', direction: 'in', type: 'text', time: 'Yesterday', read: true },
  ]},
  { id: 'c12', name: 'Kamal Uddin', phone: '+880 1811-889900', avatar: 'KU', lastMsg: 'My application status shows processing since 2 weeks', lastTime: '1 d ago', unread: 0, status: 'pending', assignedTo: 'Mike R.', contactType: 'student', email: 'kamal@email.com', tags: ['Application', 'UK'], leadStatus: 'warm', poolNumber: '+880 1712-345678', messages: [
    { id: 'm20', text: 'My application status shows processing since 2 weeks', direction: 'in', type: 'text', time: 'Yesterday', read: true },
    { id: 'm21', text: 'I understand your concern. Let me check with the university and get back to you within 24 hours.', direction: 'out', type: 'text', time: 'Yesterday', read: true },
  ]},
  { id: 'c13', name: 'Ayesha Siddika', phone: '+880 1911-889900', avatar: 'AS', lastMsg: 'Do you help with accommodation in Canada?', lastTime: '2 d ago', unread: 0, status: 'resolved', assignedTo: 'Sarah K.', contactType: 'student', email: 'ayesha@email.com', tags: ['Canada', 'Accommodation'], leadStatus: 'converted', poolNumber: '+880 1812-345678', messages: [
    { id: 'm22', text: 'Do you help with accommodation in Canada?', direction: 'in', type: 'text', time: '2 days ago', read: true },
  ]},
  { id: 'c14', name: 'Omar Faruk', phone: '+880 1611-889900', avatar: 'OF', lastMsg: 'I want to apply for multiple countries', lastTime: '2 d ago', unread: 0, status: 'open', assignedTo: 'Unassigned', contactType: 'lead', email: 'omar@email.com', tags: ['Multi-country'], leadStatus: 'new', poolNumber: '+880 1512-345678', messages: [
    { id: 'm23', text: 'I want to apply for multiple countries', direction: 'in', type: 'text', time: '2 days ago', read: true },
  ]},
  { id: 'c15', name: 'Sumaiya Akter', phone: '+880 1511-889900', avatar: 'SA', lastMsg: 'Payment confirmation for application fee', lastTime: '3 d ago', unread: 0, status: 'resolved', assignedTo: 'Mike R.', contactType: 'student', email: 'sumaiya@email.com', tags: ['Payment', 'UK'], leadStatus: 'converted', poolNumber: '+880 1712-345678', messages: [
    { id: 'm24', text: 'Payment confirmation for application fee', direction: 'in', type: 'text', time: '3 days ago', read: true },
    { id: 'm25', text: 'Payment received! Thank you. Your application will be processed shortly.', direction: 'out', type: 'template', time: '3 days ago', read: true },
  ]},
  { id: 'c16', name: 'Pathway Consultancy', phone: '+880 1711-112233', avatar: 'PC', lastMsg: 'Our team visited your Dhaka office last week', lastTime: '4 d ago', unread: 0, status: 'open', assignedTo: 'Sarah K.', contactType: 'partner', email: 'info@pathway.com', tags: ['Partner', 'Visit'], leadStatus: 'warm', poolNumber: '+880 1912-345678', messages: [
    { id: 'm26', text: 'Our team visited your Dhaka office last week', direction: 'in', type: 'text', time: '4 days ago', read: true },
  ]},
]

const MOCK_TEMPLATES: Template[] = [
  { id: 't1', name: 'Welcome Greeting', body: 'Hello {{1}}! Welcome to ALO Education. We help students achieve their study abroad dreams. How can we assist you today?', category: 'greeting', language: 'English', status: 'approved' },
  { id: 't2', name: 'Document Request', body: 'Dear {{1}}, please submit the following documents: {{2}}. You can upload them at aloeducation.com/portal', category: 'document_request', language: 'English', status: 'approved' },
  { id: 't3', name: 'Appointment Confirmation', body: 'Your consultation with {{1}} is confirmed for {{2}} at {{3}}. Please join 5 minutes early. ALO Education', category: 'appointment', language: 'English', status: 'approved' },
  { id: 't4', name: 'Payment Reminder', body: 'Dear {{1}}, your payment of {{2}} is due on {{3}}. Please complete payment to proceed with your application.', category: 'payment', language: 'English', status: 'approved' },
  { id: 't5', name: 'Visa Update', body: 'Good news {{1}}! Your visa application status has been updated: {{2}}. Check your portal for details.', category: 'visa_update', language: 'English', status: 'approved' },
  { id: 't6', name: 'Follow Up', body: 'Hi {{1}}, following up on our conversation about {{2}}. Would you like to schedule a call?', category: 'follow_up', language: 'English', status: 'approved' },
  { id: 't7', name: 'Birthday Wish', body: 'Happy Birthday {{1}}! 🎂 Wishing you success in your study abroad journey. - ALO Education', category: 'promotion', language: 'English', status: 'pending' },
  { id: 't8', name: 'বাংলা স্বাগতম', body: 'স্বাগতম {{1}}! ALO Education-এ আপনাকে স্বাগত। আমরা বিদেশে পড়াশোনায় সাহায্য করি।', category: 'greeting', language: 'Bengali', status: 'approved' },
]

const MOCK_RULES: AutoRule[] = [
  { id: 'r1', name: 'Auto Greet New Leads', trigger: 'new_lead', action: 'send_template', active: true },
  { id: 'r2', name: 'Document Upload Notification', trigger: 'document_uploaded', action: 'notify_counselor', active: true },
  { id: 'r3', name: 'Payment Received Confirmation', trigger: 'payment_received', action: 'send_template', active: true },
  { id: 'r4', name: 'Visa Status Update Alert', trigger: 'visa_update', action: 'notify_counselor', active: false },
  { id: 'r5', name: 'Appointment Reminder (24h)', trigger: 'appointment_reminder', action: 'send_template', active: true },
  { id: 'r6', name: 'Birthday Greeting', trigger: 'birthday', action: 'send_template', active: false },
  { id: 'r7', name: 'New Lead Task Creation', trigger: 'new_lead', action: 'create_task', active: true },
  { id: 'r8', name: 'Payment Status Update', trigger: 'payment_received', action: 'update_status', active: true },
]

const QUICK_REPLIES = ["Yes, I'm interested", "Let me think about it", "Schedule a call"]

export default function CRMWhatsapp() {
  const [activeTab, setActiveTab] = useState('inbox')
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterTab, setFilterTab] = useState('all')
  const [search, setSearch] = useState('')
  const [msgInput, setMsgInput] = useState('')
  const [showRight, setShowRight] = useState(true)
  const [showNewConv, setShowNewConv] = useState(false)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [showNewRule, setShowNewRule] = useState(false)
  const [templates, setTemplates] = useState(MOCK_TEMPLATES)
  const [rules, setRules] = useState(MOCK_RULES)
  const [poolFilter, setPoolFilter] = useState('all')
  const [newTemplate, setNewTemplate] = useState({ name: '', body: '', category: 'greeting', language: 'English' })
  const [newRule, setNewRule] = useState({ name: '', trigger: 'new_lead', action: 'send_template' })

  const selected = conversations.find(c => c.id === selectedId) || null
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  const filtered = conversations.filter(c => {
    if (poolFilter !== 'all' && c.poolNumber !== poolFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search) && !c.lastMsg.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTab === 'unread') return c.unread > 0
    if (filterTab === 'my') return c.assignedTo !== 'Unassigned'
    if (filterTab === 'partner') return c.contactType === 'partner'
    return true
  })

  const sendMessage = () => {
    if (!msgInput.trim() || !selectedId) return
    setConversations(prev => prev.map(c => c.id === selectedId ? {
      ...c, messages: [...c.messages, { id: `m${Date.now()}`, text: msgInput, direction: 'out' as MsgDir, type: 'text' as MsgType, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), read: false }], lastMsg: msgInput, lastTime: 'Just now'
    } : c))
    setMsgInput('')
    toast.success('Message sent')
  }

  const applyAiSuggestion = (text: string) => { setMsgInput(text); toast.info('AI suggestion applied') }
  const applyTemplate = (body: string) => { setMsgInput(body); toast.info('Template loaded') }
  const markResolved = () => {
    if (!selectedId) return
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, status: 'resolved' as ConvStatus } : c))
    toast.success('Conversation marked as resolved')
  }
  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
    toast.success('Rule updated')
  }
  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.body) { toast.error('Fill all fields'); return }
    setTemplates(prev => [...prev, { ...newTemplate, id: `t${Date.now()}`, status: 'pending' as const }])
    setNewTemplate({ name: '', body: '', category: 'greeting', language: 'English' })
    setShowNewTemplate(false)
    toast.success('Template created')
  }
  const addRule = () => {
    if (!newRule.name) { toast.error('Enter rule name'); return }
    setRules(prev => [...prev, { ...newRule, id: `r${Date.now()}`, active: true }])
    setNewRule({ name: '', trigger: 'new_lead', action: 'send_template' })
    setShowNewRule(false)
    toast.success('Rule created')
  }

  const statusColor = (s: ConvStatus) => s === 'open' ? 'bg-green-100 text-green-700' : s === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
  const poolColor = (s: string) => s === 'active' ? 'bg-green-100 text-green-700' : s === 'cooling' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A2332]">WhatsApp Inbox & Automation</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="inbox" className="gap-1.5"><MessageSquare className="h-4 w-4" />Inbox</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><FileText className="h-4 w-4" />Templates</TabsTrigger>
          <TabsTrigger value="automation" className="gap-1.5"><Zap className="h-4 w-4" />Automation</TabsTrigger>
        </TabsList>

        {/* ─── INBOX TAB ─── */}
        <TabsContent value="inbox" className="space-y-4 mt-4">
          {/* Top Bar Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-0 shadow-sm"><CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-[#25D366]/10 rounded-lg"><MessageSquare className="h-4 w-4 text-[#25D366]" /></div>
              <div><p className="text-xs text-gray-500">Active Chats</p><p className="text-lg font-bold">{conversations.filter(c => c.status === 'open').length}</p></div>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-[#F37021]/10 rounded-lg"><Clock className="h-4 w-4 text-[#F37021]" /></div>
              <div><p className="text-xs text-gray-500">Unread</p><p className="text-lg font-bold">{totalUnread}</p></div>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><Clock className="h-4 w-4 text-blue-500" /></div>
              <div><p className="text-xs text-gray-500">Avg Response</p><p className="text-lg font-bold">4.2 min</p></div>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg"><FileText className="h-4 w-4 text-purple-500" /></div>
              <div><p className="text-xs text-gray-500">Templates Used</p><p className="text-lg font-bold">23</p></div>
            </CardContent></Card>
          </div>

          {/* Number Pool Status */}
          <Card className="border-0 shadow-sm"><CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2"><Smartphone className="h-4 w-4 text-[#F37021]" /><span className="text-sm font-semibold">Number Pool</span></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setPoolFilter('all')} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${poolFilter === 'all' ? 'bg-[#F37021] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
              {POOL_NUMBERS.map(p => (
                <button key={p.id} onClick={() => setPoolFilter(p.number)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${poolFilter === p.number ? 'bg-[#F37021] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-500' : p.status === 'cooling' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </CardContent></Card>

          {/* 3-Column Layout */}
          <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
            {/* Left Column: Conversation List */}
            <div className="w-80 border-r border-gray-200 flex flex-col shrink-0">
              <div className="p-3 border-b border-gray-100">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
                </div>
                <div className="flex gap-1">
                  {(['all', 'unread', 'my', 'partner'] as const).map(f => (
                    <button key={f} onClick={() => setFilterTab(f)} className={`px-2 py-1 rounded text-xs font-medium flex-1 transition-colors ${filterTab === f ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      {f === 'my' ? 'My Chats' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ScrollArea className="flex-1">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No conversations found</div>
                ) : filtered.map(c => (
                  <button key={c.id} onClick={() => setSelectedId(c.id)} className={`w-full text-left p-3 border-b border-gray-50 transition-colors ${selectedId === c.id ? 'bg-[#25D366]/5 border-l-3 border-l-[#25D366]' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-sm font-semibold text-[#25D366] shrink-0">{c.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{c.name}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">{c.lastTime}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={`text-[10px] px-1.5 py-0 ${statusColor(c.status)}`}>{c.status}</Badge>
                          {c.unread > 0 && <span className="bg-[#F37021] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{c.unread}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
              <div className="p-3 border-t border-gray-100">
                <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
                  <DialogTrigger asChild><Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white gap-1.5 h-8 text-sm"><Plus className="h-3.5 w-3.5" />New Conversation</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder="Contact Name" /><Input placeholder="Phone Number" />
                      <Select><SelectTrigger><SelectValue placeholder="Contact Type" /></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="partner">Partner</SelectItem><SelectItem value="lead">Lead</SelectItem></SelectContent></Select>
                      <Button onClick={() => { setShowNewConv(false); toast.success('Conversation created') }} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">Start Conversation</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Middle Column: Chat View */}
            <div className="flex-1 flex flex-col min-w-0">
              {selected ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <button className="md:hidden" onClick={() => setSelectedId(null)}><ArrowLeft className="h-5 w-5" /></button>
                      <div className="w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center text-sm font-semibold text-[#25D366]">{selected.avatar}</div>
                      <div>
                        <p className="font-semibold text-sm">{selected.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor(selected.status)}>{selected.status}</Badge>
                      <span className="text-xs text-gray-400">Assigned: {selected.assignedTo}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRight(!showRight)}><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3 max-w-2xl mx-auto">
                      {selected.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-xl px-3 py-2 ${msg.direction === 'out' ? 'bg-[#25D366]/10 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'}`}>
                            {msg.type === 'template' && <Badge className="text-[10px] px-1 py-0 mb-1 bg-blue-100 text-blue-700"><FileText className="h-2.5 w-2.5 mr-0.5" />Template</Badge>}
                            {msg.type === 'ai' && <Badge className="text-[10px] px-1 py-0 mb-1 bg-purple-100 text-purple-700"><Bot className="h-2.5 w-2.5 mr-0.5" />AI</Badge>}
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[10px] text-gray-400">{msg.time}</span>
                              {msg.direction === 'out' && <CheckCheck className={`h-3 w-3 ${msg.read ? 'text-blue-500' : 'text-gray-400'}`} />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Quick Replies */}
                  <div className="px-4 pb-1 flex gap-1.5 flex-wrap">
                    {QUICK_REPLIES.map(qr => (
                      <button key={qr} onClick={() => setMsgInput(qr)} className="text-xs px-2.5 py-1 rounded-full border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/5 transition-colors">{qr}</button>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><FileText className="h-4 w-4 text-gray-500" /></Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>Select Template</DialogTitle></DialogHeader>
                          <ScrollArea className="max-h-64">
                            <div className="space-y-2">{templates.filter(t => t.status === 'approved').map(t => (
                              <button key={t.id} onClick={() => { applyTemplate(t.body); }} className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#25D366]/30 transition-colors">
                                <p className="font-medium text-sm">{t.name}</p><p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.body}</p>
                              </button>
                            ))}</div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                        if (!selectedId) return
                        const suggestion = `Hi ${selected.name}, based on your inquiry about ${selected.tags[0] || 'studying abroad'}, I'd recommend scheduling a free consultation with our expert counselors. Would you like to book a slot?`
                        setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, messages: [...c.messages, { id: `ai${Date.now()}`, text: suggestion, direction: 'in' as MsgDir, type: 'ai' as MsgType, time: 'AI', read: false }] } : c))
                        toast.success('AI suggestion generated')
                      }}><Bot className="h-4 w-4 text-purple-500" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Paperclip className="h-4 w-4 text-gray-500" /></Button>
                      <Input placeholder="Type a message..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 h-8 text-sm" />
                      <Button onClick={sendMessage} className="bg-[#25D366] hover:bg-[#20bd5a] text-white h-8 w-8 shrink-0" size="icon"><Send className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center"><MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-20" /><p>Select a conversation to start chatting</p></div>
                </div>
              )}
            </div>

            {/* Right Column: Contact Panel */}
            {selected && showRight && (
              <div className="w-72 border-l border-gray-200 flex flex-col shrink-0 bg-gray-50/30">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* Contact Info */}
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center text-xl font-bold text-[#25D366] mx-auto">{selected.avatar}</div>
                      <p className="font-semibold mt-2">{selected.name}</p>
                      <p className="text-xs text-gray-500">{selected.phone}</p>
                      <p className="text-xs text-gray-400">{selected.email}</p>
                      <Badge className={`mt-1.5 ${selected.contactType === 'student' ? 'bg-blue-100 text-blue-700' : selected.contactType === 'partner' ? 'bg-[#F37021]/10 text-[#F37021]' : 'bg-green-100 text-green-700'}`}>{selected.contactType}</Badge>
                    </div>
                    <Separator />
                    {/* Related Record */}
                    <div className="flex items-center gap-2 text-sm text-[#F37021] cursor-pointer hover:underline">
                      <Link2 className="h-3.5 w-3.5" />
                      <span>View {selected.contactType === 'partner' ? 'Partner' : 'Student'} Record</span>
                    </div>
                    <Separator />
                    {/* Tags */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><Tag className="h-3 w-3" />Tags</p>
                      <div className="flex flex-wrap gap-1">{selected.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
                    </div>
                    {/* Lead Status */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><Star className="h-3 w-3" />Lead Status</p>
                      <Badge className={selected.leadStatus === 'hot' ? 'bg-red-100 text-red-700' : selected.leadStatus === 'warm' ? 'bg-yellow-100 text-yellow-700' : selected.leadStatus === 'cold' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>{selected.leadStatus}</Badge>
                    </div>
                    <Separator />
                    {/* Notes */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><StickyNote className="h-3 w-3" />Notes</p>
                      <Textarea placeholder="Add a note..." className="text-xs h-16 resize-none" />
                    </div>
                    <Separator />
                    {/* Quick Actions */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><Zap className="h-3 w-3" />Quick Actions</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={markResolved}><CheckCheck className="h-3 w-3 mr-1" />Resolve</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[11px]"><User className="h-3 w-3 mr-1" />Assign</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[11px]"><Plus className="h-3 w-3 mr-1" />Lead</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[11px]"><Calendar className="h-3 w-3 mr-1" />Follow-up</Button>
                      </div>
                    </div>
                    <Separator />
                    {/* History Summary */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Communication Summary</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>💬 {selected.messages.length} messages in this chat</p>
                        <p>📤 {selected.messages.filter(m => m.direction === 'out').length} sent, 📥 {selected.messages.filter(m => m.direction === 'in').length} received</p>
                        <p>📋 {selected.messages.filter(m => m.type === 'template').length} templates used</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── TEMPLATES TAB ─── */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{templates.length} templates · {templates.filter(t => t.status === 'approved').length} approved</p>
            <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
              <DialogTrigger asChild><Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-1.5 h-8 text-sm"><Plus className="h-3.5 w-3.5" />Create Template</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Template Name" value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))} />
                  <Textarea placeholder="Template body... Use {{1}}, {{2}} for variables" value={newTemplate.body} onChange={e => setNewTemplate(p => ({ ...p, body: e.target.value }))} rows={4} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={newTemplate.category} onValueChange={v => setNewTemplate(p => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['greeting', 'follow_up', 'document_request', 'appointment', 'payment', 'visa_update', 'promotion'].map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={newTemplate.language} onValueChange={v => setNewTemplate(p => ({ ...p, language: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="English">English</SelectItem><SelectItem value="Bengali">Bengali</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {newTemplate.body && <Card className="border-dashed"><CardContent className="p-3"><p className="text-xs text-gray-500 mb-1">Preview:</p><p className="text-sm">{newTemplate.body.replace(/\{\{\d\}\}/g, 'John')}</p></CardContent></Card>}
                  <Button onClick={addTemplate} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">Create Template</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map(t => (
              <Card key={t.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px]">{t.category.replace('_', ' ')}</Badge>
                        <Badge variant="outline" className="text-[10px]">{t.language}</Badge>
                      </div>
                    </div>
                    <Badge className={t.status === 'approved' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>{t.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50 p-2 rounded mt-2">{t.body.replace(/\{\{\d\}\}/g, '___')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── AUTOMATION TAB ─── */}
        <TabsContent value="automation" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{rules.length} rules · {rules.filter(r => r.active).length} active</p>
            <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
              <DialogTrigger asChild><Button className="bg-[#F37021] hover:bg-[#e0651d] text-white gap-1.5 h-8 text-sm"><Plus className="h-3.5 w-3.5" />Create Rule</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Create Automation Rule</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Rule Name" value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} />
                  <Select value={newRule.trigger} onValueChange={v => setNewRule(p => ({ ...p, trigger: v }))}>
                    <SelectTrigger><SelectValue placeholder="Trigger" /></SelectTrigger>
                    <SelectContent>{['new_lead', 'document_uploaded', 'payment_received', 'visa_update', 'appointment_reminder', 'birthday'].map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={newRule.action} onValueChange={v => setNewRule(p => ({ ...p, action: v }))}>
                    <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
                    <SelectContent>{['send_template', 'notify_counselor', 'create_task', 'update_status'].map(a => <SelectItem key={a} value={a}>{a.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={addRule} className="w-full bg-[#F37021] hover:bg-[#e0651d] text-white">Create Rule</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {rules.map(r => (
              <Card key={r.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${r.active ? 'bg-[#25D366]/10' : 'bg-gray-100'}`}><Zap className={`h-4 w-4 ${r.active ? 'text-[#25D366]' : 'text-gray-400'}`} /></div>
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{r.trigger.replace('_', ' ')}</Badge>
                        <span className="text-[10px] text-gray-400">→</span>
                        <Badge variant="outline" className="text-[10px]">{r.action.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={r.active} onCheckedChange={() => toggleRule(r.id)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
