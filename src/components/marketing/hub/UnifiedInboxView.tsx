'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  MessageCircle,
  Send,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Zap,
  User,
  Clock,
  Tag,
  FileText,
  UserCheck,
  UserPlus,
  Sparkles,
  Filter,
  MoreVertical,
  Paperclip,
  Smile,
  ExternalLink,
  Shield,
  History,
  Bot,
  CheckCircle2,
  AlertCircle,
  Reply,
  Forward,
  Pin,
  Star,
} from 'lucide-react';

// ─── Type Definitions ───────────────────────────────────────────────────────

type ChannelType =
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'messenger'
  | 'email'
  | 'sms'
  | 'website_chat';

interface ChannelConfig {
  id: ChannelType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  studentId: string | null;
  email: string;
  phone: string;
  leadSource: string;
  leadScore: number;
  program: string;
  tags: string[];
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderType: 'contact' | 'agent' | 'ai';
  senderName: string;
  timestamp: string;
  channel: ChannelType;
  aiGenerated: boolean;
  messageId: string;
  crmSaved: boolean;
}

interface TimelineEvent {
  id: string;
  type: 'message' | 'call' | 'email' | 'form_submit' | 'visit' | 'note';
  description: string;
  timestamp: string;
  channel?: ChannelType;
}

interface CrmRecord {
  messageId: string;
  channel: ChannelType;
  leadId: string;
  studentId: string | null;
  employeeId: string;
  aiGenerated: boolean;
  timestamp: string;
  auditLog: string;
}

interface Conversation {
  id: string;
  contact: Contact;
  channel: ChannelType;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isAssigned: boolean;
  assignee: string | null;
  status: 'open' | 'pending' | 'closed';
  messages: Message[];
  timeline: TimelineEvent[];
  crmRecords: CrmRecord[];
  isPinned: boolean;
  isStarred: boolean;
}

// ─── Channel Configurations ─────────────────────────────────────────────────

const channels: ChannelConfig[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-l-green-500',
    icon: <Phone className="h-3.5 w-3.5" />,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-l-blue-500',
    icon: <Facebook className="h-3.5 w-3.5" />,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
    borderColor: 'border-l-pink-500',
    icon: <Instagram className="h-3.5 w-3.5" />,
  },
  {
    id: 'messenger',
    label: 'Messenger',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-l-purple-500',
    icon: <MessageCircle className="h-3.5 w-3.5" />,
  },
  {
    id: 'email',
    label: 'Email',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-l-gray-500',
    icon: <Mail className="h-3.5 w-3.5" />,
  },
  {
    id: 'sms',
    label: 'SMS',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-l-amber-500',
    icon: <Phone className="h-3.5 w-3.5" />,
  },
  {
    id: 'website_chat',
    label: 'Website Chat',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    borderColor: 'border-l-teal-500',
    icon: <Globe className="h-3.5 w-3.5" />,
  },
];

function getChannelConfig(channelId: ChannelType): ChannelConfig {
  return channels.find((c) => c.id === channelId) || channels[0];
}

// ─── Mock Conversations ─────────────────────────────────────────────────────

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    contact: {
      id: 'contact-1',
      name: 'Sarah Al-Rashid',
      avatar: 'SA',
      studentId: 'STU-2024-0891',
      email: 'sarah.r@email.com',
      phone: '+971-50-123-4567',
      leadSource: 'Facebook Ad',
      leadScore: 85,
      program: 'MBA Program',
      tags: ['hot-lead', 'returning-visitor', 'finance-inquiry'],
    },
    channel: 'whatsapp',
    lastMessage: 'Thank you for the scholarship details! When can I apply?',
    lastMessageTime: '2 min ago',
    unreadCount: 3,
    isAssigned: true,
    assignee: 'Ahmed K.',
    status: 'open',
    isPinned: true,
    isStarred: true,
    messages: [
      {
        id: 'msg-1-1',
        conversationId: 'conv-1',
        content: 'Hi, I am interested in the MBA program. Can you share the fee structure?',
        senderType: 'contact',
        senderName: 'Sarah Al-Rashid',
        timestamp: '10:15 AM',
        channel: 'whatsapp',
        aiGenerated: false,
        messageId: 'WA-001-7823',
        crmSaved: true,
      },
      {
        id: 'msg-1-2',
        conversationId: 'conv-1',
        content: 'Hello Sarah! Welcome to ALO Education. 🎓 Our MBA program is AED 120,000 for the full duration. We offer flexible payment plans and scholarships up to 30%.',
        senderType: 'ai',
        senderName: 'ALO AI Assistant',
        timestamp: '10:16 AM',
        channel: 'whatsapp',
        aiGenerated: true,
        messageId: 'WA-001-7824',
        crmSaved: true,
      },
      {
        id: 'msg-1-3',
        conversationId: 'conv-1',
        content: 'That sounds great! Are there any scholarships available for international students?',
        senderType: 'contact',
        senderName: 'Sarah Al-Rashid',
        timestamp: '10:20 AM',
        channel: 'whatsapp',
        aiGenerated: false,
        messageId: 'WA-001-7825',
        crmSaved: true,
      },
      {
        id: 'msg-1-4',
        conversationId: 'conv-1',
        content: 'Yes! We have the ALO Merit Scholarship for outstanding candidates, and the Global Diversity Scholarship specifically for international students. Both can cover up to 30% of tuition. I can connect you with our admissions counselor Ahmed for a detailed walkthrough.',
        senderType: 'agent',
        senderName: 'Fatima H.',
        timestamp: '10:22 AM',
        channel: 'whatsapp',
        aiGenerated: false,
        messageId: 'WA-001-7826',
        crmSaved: true,
      },
      {
        id: 'msg-1-5',
        conversationId: 'conv-1',
        content: 'Thank you for the scholarship details! When can I apply?',
        senderType: 'contact',
        senderName: 'Sarah Al-Rashid',
        timestamp: '10:25 AM',
        channel: 'whatsapp',
        aiGenerated: false,
        messageId: 'WA-001-7827',
        crmSaved: false,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'form_submit', description: 'Submitted inquiry form on website', timestamp: '2 days ago' },
      { id: 'tl-2', type: 'visit', description: 'Visited MBA program page', timestamp: '2 days ago' },
      { id: 'tl-3', type: 'message', description: 'First WhatsApp message received', timestamp: 'Today, 10:15 AM' },
      { id: 'tl-4', type: 'message', description: 'AI auto-replied with program info', timestamp: 'Today, 10:16 AM' },
    ],
    crmRecords: [
      {
        messageId: 'WA-001-7823',
        channel: 'whatsapp',
        leadId: 'LEAD-4012',
        studentId: 'STU-2024-0891',
        employeeId: 'EMP-005',
        aiGenerated: false,
        timestamp: '2024-01-15 10:15:00',
        auditLog: 'Inbound message captured and logged to CRM',
      },
      {
        messageId: 'WA-001-7824',
        channel: 'whatsapp',
        leadId: 'LEAD-4012',
        studentId: 'STU-2024-0891',
        employeeId: 'SYSTEM-AI',
        aiGenerated: true,
        timestamp: '2024-01-15 10:16:00',
        auditLog: 'AI auto-reply sent — program details template #MB-002',
      },
    ],
  },
  {
    id: 'conv-2',
    contact: {
      id: 'contact-2',
      name: 'Mohammed Hassan',
      avatar: 'MH',
      studentId: null,
      email: 'm.hassan@gmail.com',
      phone: '+971-55-987-6543',
      leadSource: 'Instagram Ad',
      leadScore: 62,
      program: 'BSc Computer Science',
      tags: ['new-lead', 'social-referral'],
    },
    channel: 'instagram',
    lastMessage: 'What are the entry requirements for CS?',
    lastMessageTime: '15 min ago',
    unreadCount: 1,
    isAssigned: false,
    assignee: null,
    status: 'open',
    isPinned: false,
    isStarred: false,
    messages: [
      {
        id: 'msg-2-1',
        conversationId: 'conv-2',
        content: 'Hey! I saw your post about the Computer Science program. What are the entry requirements?',
        senderType: 'contact',
        senderName: 'Mohammed Hassan',
        timestamp: '11:05 AM',
        channel: 'instagram',
        aiGenerated: false,
        messageId: 'IG-044-112',
        crmSaved: true,
      },
      {
        id: 'msg-2-2',
        conversationId: 'conv-2',
        content: 'Hi Mohammed! 👋 Great to hear from you. Our BSc CS program requires a minimum GPA of 3.0, IELTS 6.0, and foundational knowledge in math. Would you like to schedule a campus tour?',
        senderType: 'ai',
        senderName: 'ALO AI Assistant',
        timestamp: '11:06 AM',
        channel: 'instagram',
        aiGenerated: true,
        messageId: 'IG-044-113',
        crmSaved: true,
      },
      {
        id: 'msg-2-3',
        conversationId: 'conv-2',
        content: 'What are the entry requirements for CS?',
        senderType: 'contact',
        senderName: 'Mohammed Hassan',
        timestamp: '11:10 AM',
        channel: 'instagram',
        aiGenerated: false,
        messageId: 'IG-044-114',
        crmSaved: false,
      },
    ],
    timeline: [
      { id: 'tl-5', type: 'message', description: 'DM received from Instagram', timestamp: 'Today, 11:05 AM' },
      { id: 'tl-6', type: 'message', description: 'AI responded with requirements', timestamp: 'Today, 11:06 AM' },
    ],
    crmRecords: [
      {
        messageId: 'IG-044-112',
        channel: 'instagram',
        leadId: 'LEAD-4088',
        studentId: null,
        employeeId: 'SYSTEM-AI',
        aiGenerated: false,
        timestamp: '2024-01-15 11:05:00',
        auditLog: 'Instagram DM captured — new lead created',
      },
      {
        messageId: 'IG-044-113',
        channel: 'instagram',
        leadId: 'LEAD-4088',
        studentId: null,
        employeeId: 'SYSTEM-AI',
        aiGenerated: true,
        timestamp: '2024-01-15 11:06:00',
        auditLog: 'AI auto-reply sent — entry requirements template #CS-001',
      },
    ],
  },
  {
    id: 'conv-3',
    contact: {
      id: 'contact-3',
      name: 'Fatima Al-Maktoum',
      avatar: 'FA',
      studentId: 'STU-2024-0644',
      email: 'fatima.m@outlook.com',
      phone: '+971-52-456-7890',
      leadSource: 'Email Campaign',
      leadScore: 91,
      program: 'MSc Data Science',
      tags: ['vip-lead', 'alumni-referral', 'fast-track'],
    },
    channel: 'email',
    lastMessage: 'I would like to schedule a meeting with the program director.',
    lastMessageTime: '1 hr ago',
    unreadCount: 0,
    isAssigned: true,
    assignee: 'Noor S.',
    status: 'pending',
    isPinned: true,
    isStarred: true,
    messages: [
      {
        id: 'msg-3-1',
        conversationId: 'conv-3',
        content: 'Dear ALO Admissions,\n\nI have been referred by your alumnus Dr. Khalid who graduated in 2020. I hold a BSc in Mathematics from UAE University with a 3.8 GPA. I am very interested in the MSc Data Science program beginning this fall.\n\nCould you provide information about research opportunities and faculty profiles?\n\nBest regards,\nFatima Al-Maktoum',
        senderType: 'contact',
        senderName: 'Fatima Al-Maktoum',
        timestamp: '9:30 AM',
        channel: 'email',
        aiGenerated: false,
        messageId: 'EM-992-0056',
        crmSaved: true,
      },
      {
        id: 'msg-3-2',
        conversationId: 'conv-3',
        content: 'Dear Fatima,\n\nThank you for reaching out to ALO Education. We are delighted to hear about your interest and your connection to our alumnus Dr. Khalid.\n\nOur MSc Data Science program offers cutting-edge research opportunities in AI/ML, NLP, and Big Data Analytics. Our faculty includes internationally published researchers.\n\nI would be happy to arrange a meeting with our Program Director, Dr. Amira Chen. Please let me know your availability this week.\n\nWarm regards,\nNoor Sulaiman\nAdmissions Counselor',
        senderType: 'agent',
        senderName: 'Noor S.',
        timestamp: '10:00 AM',
        channel: 'email',
        aiGenerated: false,
        messageId: 'EM-992-0057',
        crmSaved: true,
      },
      {
        id: 'msg-3-3',
        conversationId: 'conv-3',
        content: 'I would like to schedule a meeting with the program director.',
        senderType: 'contact',
        senderName: 'Fatima Al-Maktoum',
        timestamp: '10:30 AM',
        channel: 'email',
        aiGenerated: false,
        messageId: 'EM-992-0058',
        crmSaved: true,
      },
    ],
    timeline: [
      { id: 'tl-7', type: 'email', description: 'Received detailed inquiry email', timestamp: 'Today, 9:30 AM' },
      { id: 'tl-8', type: 'note', description: 'VIP flag — alumni referral', timestamp: 'Today, 9:35 AM' },
      { id: 'tl-9', type: 'email', description: 'Agent replied with program details', timestamp: 'Today, 10:00 AM' },
    ],
    crmRecords: [
      {
        messageId: 'EM-992-0056',
        channel: 'email',
        leadId: 'LEAD-3890',
        studentId: 'STU-2024-0644',
        employeeId: 'EMP-008',
        aiGenerated: false,
        timestamp: '2024-01-15 09:30:00',
        auditLog: 'Email received — existing lead updated, VIP tag added',
      },
      {
        messageId: 'EM-992-0057',
        channel: 'email',
        leadId: 'LEAD-3890',
        studentId: 'STU-2024-0644',
        employeeId: 'EMP-008',
        aiGenerated: false,
        timestamp: '2024-01-15 10:00:00',
        auditLog: 'Agent response sent — program details + meeting offer',
      },
    ],
  },
  {
    id: 'conv-4',
    contact: {
      id: 'contact-4',
      name: 'Omar Khalil',
      avatar: 'OK',
      studentId: null,
      email: 'omar.k@yahoo.com',
      phone: '+971-54-111-2233',
      leadSource: 'Website Chat',
      leadScore: 45,
      program: 'BBA',
      tags: ['cold-lead', 'browsing'],
    },
    channel: 'website_chat',
    lastMessage: 'Are evening classes available?',
    lastMessageTime: '3 hrs ago',
    unreadCount: 0,
    isAssigned: true,
    assignee: 'Layla M.',
    status: 'open',
    isPinned: false,
    isStarred: false,
    messages: [
      {
        id: 'msg-4-1',
        conversationId: 'conv-4',
        content: 'Hi, I want to know about your business programs.',
        senderType: 'contact',
        senderName: 'Omar Khalil',
        timestamp: '8:00 AM',
        channel: 'website_chat',
        aiGenerated: false,
        messageId: 'WC-012-445',
        crmSaved: true,
      },
      {
        id: 'msg-4-2',
        conversationId: 'conv-4',
        content: 'Hello Omar! Welcome to ALO Education. We offer BBA, MBA, and specialized business diplomas. Which program interests you most?',
        senderType: 'ai',
        senderName: 'ALO AI Assistant',
        timestamp: '8:00 AM',
        channel: 'website_chat',
        aiGenerated: true,
        messageId: 'WC-012-446',
        crmSaved: true,
      },
      {
        id: 'msg-4-3',
        conversationId: 'conv-4',
        content: 'The BBA seems good. Are evening classes available?',
        senderType: 'contact',
        senderName: 'Omar Khalil',
        timestamp: '8:05 AM',
        channel: 'website_chat',
        aiGenerated: false,
        messageId: 'WC-012-447',
        crmSaved: true,
      },
      {
        id: 'msg-4-4',
        conversationId: 'conv-4',
        content: 'Yes! We offer evening and weekend tracks for our BBA program. Classes run from 6:00 PM to 9:00 PM, perfect for working professionals. Would you like the detailed schedule?',
        senderType: 'agent',
        senderName: 'Layla M.',
        timestamp: '8:10 AM',
        channel: 'website_chat',
        aiGenerated: false,
        messageId: 'WC-012-448',
        crmSaved: true,
      },
      {
        id: 'msg-4-5',
        conversationId: 'conv-4',
        content: 'Are evening classes available?',
        senderType: 'contact',
        senderName: 'Omar Khalil',
        timestamp: '8:12 AM',
        channel: 'website_chat',
        aiGenerated: false,
        messageId: 'WC-012-449',
        crmSaved: false,
      },
    ],
    timeline: [
      { id: 'tl-10', type: 'visit', description: 'Started website chat session', timestamp: 'Today, 8:00 AM' },
      { id: 'tl-11', type: 'message', description: 'AI greeted and offered options', timestamp: 'Today, 8:00 AM' },
      { id: 'tl-12', type: 'message', description: 'Agent Layla took over chat', timestamp: 'Today, 8:10 AM' },
    ],
    crmRecords: [
      {
        messageId: 'WC-012-445',
        channel: 'website_chat',
        leadId: 'LEAD-4150',
        studentId: null,
        employeeId: 'SYSTEM-AI',
        aiGenerated: false,
        timestamp: '2024-01-15 08:00:00',
        auditLog: 'Web chat initiated — new lead created from widget',
      },
      {
        messageId: 'WC-012-446',
        channel: 'website_chat',
        leadId: 'LEAD-4150',
        studentId: null,
        employeeId: 'SYSTEM-AI',
        aiGenerated: true,
        timestamp: '2024-01-15 08:00:00',
        auditLog: 'AI auto-reply — welcome + program list template',
      },
    ],
  },
  {
    id: 'conv-5',
    contact: {
      id: 'contact-5',
      name: 'Amira Jaber',
      avatar: 'AJ',
      studentId: 'STU-2024-1102',
      email: 'amira.j@proton.me',
      phone: '+971-56-789-0123',
      leadSource: 'Facebook Post',
      leadScore: 78,
      program: 'MA Education',
      tags: ['warm-lead', 'teacher', 'career-switch'],
    },
    channel: 'facebook',
    lastMessage: 'Do you offer online classes for the MA Education?',
    lastMessageTime: '5 hrs ago',
    unreadCount: 2,
    isAssigned: true,
    assignee: 'Rami T.',
    status: 'open',
    isPinned: false,
    isStarred: true,
    messages: [
      {
        id: 'msg-5-1',
        conversationId: 'conv-5',
        content: 'Hello! I commented on your Facebook post about the MA in Education. I am a high school teacher looking to upskill.',
        senderType: 'contact',
        senderName: 'Amira Jaber',
        timestamp: '6:30 AM',
        channel: 'facebook',
        aiGenerated: false,
        messageId: 'FB-220-789',
        crmSaved: true,
      },
      {
        id: 'msg-5-2',
        conversationId: 'conv-5',
        content: 'Hi Amira! 🌟 That is wonderful. Our MA Education program is designed for working educators like yourself. It includes specializations in Curriculum Design, EdTech Leadership, and Special Education.',
        senderType: 'ai',
        senderName: 'ALO AI Assistant',
        timestamp: '6:31 AM',
        channel: 'facebook',
        aiGenerated: true,
        messageId: 'FB-220-790',
        crmSaved: true,
      },
      {
        id: 'msg-5-3',
        conversationId: 'conv-5',
        content: 'Do you offer online classes for the MA Education?',
        senderType: 'contact',
        senderName: 'Amira Jaber',
        timestamp: '6:45 AM',
        channel: 'facebook',
        aiGenerated: false,
        messageId: 'FB-220-791',
        crmSaved: true,
      },
    ],
    timeline: [
      { id: 'tl-13', type: 'message', description: 'Facebook comment turned into conversation', timestamp: 'Today, 6:30 AM' },
      { id: 'tl-14', type: 'message', description: 'AI replied with program overview', timestamp: 'Today, 6:31 AM' },
    ],
    crmRecords: [
      {
        messageId: 'FB-220-789',
        channel: 'facebook',
        leadId: 'LEAD-3990',
        studentId: 'STU-2024-1102',
        employeeId: 'EMP-012',
        aiGenerated: false,
        timestamp: '2024-01-15 06:30:00',
        auditLog: 'Facebook message captured — matched to existing student',
      },
    ],
  },
  {
    id: 'conv-6',
    contact: {
      id: 'contact-6',
      name: 'Youssef Nader',
      avatar: 'YN',
      studentId: null,
      email: 'y.nader@icloud.com',
      phone: '+971-58-334-5566',
      leadSource: 'SMS Campaign',
      leadScore: 33,
      program: 'Diploma in Digital Marketing',
      tags: ['nurture', 'part-time-interest'],
    },
    channel: 'sms',
    lastMessage: 'Thanks, I will think about it.',
    lastMessageTime: '8 hrs ago',
    unreadCount: 0,
    isAssigned: false,
    assignee: null,
    status: 'closed',
    isPinned: false,
    isStarred: false,
    messages: [
      {
        id: 'msg-6-1',
        conversationId: 'conv-6',
        content: 'Hi Youssef! ALO Education has a new Diploma in Digital Marketing starting Feb 2024. Reply YES for details.',
        senderType: 'agent',
        senderName: 'ALO Campaign',
        timestamp: 'Yesterday, 2:00 PM',
        channel: 'sms',
        aiGenerated: false,
        messageId: 'SM-088-001',
        crmSaved: true,
      },
      {
        id: 'msg-6-2',
        conversationId: 'conv-6',
        content: 'What is the duration and cost?',
        senderType: 'contact',
        senderName: 'Youssef Nader',
        timestamp: 'Yesterday, 3:15 PM',
        channel: 'sms',
        aiGenerated: false,
        messageId: 'SM-088-002',
        crmSaved: true,
      },
      {
        id: 'msg-6-3',
        conversationId: 'conv-6',
        content: '6 months, AED 18,000 total. Installments available. Reply INFO for full brochure.',
        senderType: 'ai',
        senderName: 'ALO AI Assistant',
        timestamp: 'Yesterday, 3:16 PM',
        channel: 'sms',
        aiGenerated: true,
        messageId: 'SM-088-003',
        crmSaved: true,
      },
      {
        id: 'msg-6-4',
        conversationId: 'conv-6',
        content: 'Thanks, I will think about it.',
        senderType: 'contact',
        senderName: 'Youssef Nader',
        timestamp: 'Yesterday, 4:00 PM',
        channel: 'sms',
        aiGenerated: false,
        messageId: 'SM-088-004',
        crmSaved: true,
      },
    ],
    timeline: [
      { id: 'tl-15', type: 'message', description: 'SMS campaign blast sent', timestamp: 'Yesterday, 2:00 PM' },
      { id: 'tl-16', type: 'message', description: 'Lead responded with question', timestamp: 'Yesterday, 3:15 PM' },
      { id: 'tl-17', type: 'message', description: 'AI replied with details', timestamp: 'Yesterday, 3:16 PM' },
    ],
    crmRecords: [
      {
        messageId: 'SM-088-001',
        channel: 'sms',
        leadId: 'LEAD-4220',
        studentId: null,
        employeeId: 'SYSTEM',
        aiGenerated: false,
        timestamp: '2024-01-14 14:00:00',
        auditLog: 'Outbound SMS campaign — batch #SMB-044',
      },
      {
        messageId: 'SM-088-003',
        channel: 'sms',
        leadId: 'LEAD-4220',
        studentId: null,
        employeeId: 'SYSTEM-AI',
        aiGenerated: true,
        timestamp: '2024-01-14 15:16:00',
        auditLog: 'AI auto-reply — program brief template #DM-001',
      },
    ],
  },
  {
    id: 'conv-7',
    contact: {
      id: 'contact-7',
      name: 'Layla Karim',
      avatar: 'LK',
      studentId: null,
      email: 'layla.k@gmail.com',
      phone: '+971-59-667-8899',
      leadSource: 'Messenger Ad',
      leadScore: 55,
      program: 'BSc Psychology',
      tags: ['new-lead', 'summer-intake'],
    },
    channel: 'messenger',
    lastMessage: 'Can I start in the summer semester?',
    lastMessageTime: '12 hrs ago',
    unreadCount: 1,
    isAssigned: false,
    assignee: null,
    status: 'open',
    isPinned: false,
    isStarred: false,
    messages: [
      {
        id: 'msg-7-1',
        conversationId: 'conv-7',
        content: 'Hi there! I clicked your ad about Psychology programs. Is there a summer intake available?',
        senderType: 'contact',
        senderName: 'Layla Karim',
        timestamp: 'Yesterday, 10:00 PM',
        channel: 'messenger',
        aiGenerated: false,
        messageId: 'MS-156-334',
        crmSaved: true,
      },
      {
        id: 'msg-7-2',
        conversationId: 'conv-7',
        content: 'Hi Layla! 🎓 Yes, we have a summer intake for BSc Psychology starting July 2024. Applications close June 1st. Shall I help you get started?',
        senderType: 'ai',
        senderName: 'ALO AI Assistant',
        timestamp: 'Yesterday, 10:01 PM',
        channel: 'messenger',
        aiGenerated: true,
        messageId: 'MS-156-335',
        crmSaved: true,
      },
      {
        id: 'msg-7-3',
        conversationId: 'conv-7',
        content: 'Can I start in the summer semester?',
        senderType: 'contact',
        senderName: 'Layla Karim',
        timestamp: 'Yesterday, 10:15 PM',
        channel: 'messenger',
        aiGenerated: false,
        messageId: 'MS-156-336',
        crmSaved: false,
      },
    ],
    timeline: [
      { id: 'tl-18', type: 'message', description: 'Messenger conversation initiated via ad click', timestamp: 'Yesterday, 10:00 PM' },
    ],
    crmRecords: [
      {
        messageId: 'MS-156-334',
        channel: 'messenger',
        leadId: 'LEAD-4300',
        studentId: null,
        employeeId: 'SYSTEM-AI',
        aiGenerated: false,
        timestamp: '2024-01-14 22:00:00',
        auditLog: 'Messenger message captured — ad click lead',
      },
    ],
  },
  {
    id: 'conv-8',
    contact: {
      id: 'contact-8',
      name: 'Khalid Mansoor',
      avatar: 'KM',
      studentId: 'STU-2024-0755',
      email: 'k.mansoor@business.ae',
      phone: '+971-50-990-0112',
      leadSource: 'Referral',
      leadScore: 95,
      program: 'Executive MBA',
      tags: ['vip-lead', 'c-suite', 'corporate-partnership'],
    },
    channel: 'whatsapp',
    lastMessage: 'Please arrange a call with your dean tomorrow at 3 PM.',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    isAssigned: true,
    assignee: 'Ahmed K.',
    status: 'pending',
    isPinned: true,
    isStarred: true,
    messages: [
      {
        id: 'msg-8-1',
        conversationId: 'conv-8',
        content: 'Good morning. I am the VP of Operations at Emirates Group. I am looking at your Executive MBA for myself and 12 of my senior managers.',
        senderType: 'contact',
        senderName: 'Khalid Mansoor',
        timestamp: 'Yesterday, 9:00 AM',
        channel: 'whatsapp',
        aiGenerated: false,
        messageId: 'WA-022-4500',
        crmSaved: true,
      },
      {
        id: 'msg-8-2',
        conversationId: 'conv-8',
        content: 'Good morning Mr. Mansoor! This is Ahmed from ALO Education Admissions. We are honored by your interest. For corporate partnerships of this scale, I would like to arrange a personal meeting with our Dean, Prof. Al-Sayed, to discuss a tailored program and corporate pricing.',
        senderType: 'agent',
        senderName: 'Ahmed K.',
        timestamp: 'Yesterday, 9:05 AM',
        channel: 'whatsapp',
        aiGenerated: false,
        messageId: 'WA-022-4501',
        crmSaved: true,
      },
      {
        id: 'msg-8-3',
        conversationId: 'conv-8',
        content: 'Please arrange a call with your dean tomorrow at 3 PM.',
        senderType: 'contact',
        senderName: 'Khalid Mansoor',
        timestamp: 'Yesterday, 9:15 AM',
        channel: 'whatsapp',
        aiGenerated: false,
        messageId: 'WA-022-4502',
        crmSaved: true,
      },
    ],
    timeline: [
      { id: 'tl-19', type: 'message', description: 'Corporate inquiry via WhatsApp', timestamp: 'Yesterday, 9:00 AM' },
      { id: 'tl-20', type: 'note', description: 'VIP — Emirates Group VP, potential 13-seat corporate deal', timestamp: 'Yesterday, 9:02 AM' },
      { id: 'tl-21', type: 'call', description: 'Agent Ahmed escalated to Dean meeting', timestamp: 'Yesterday, 9:20 AM' },
    ],
    crmRecords: [
      {
        messageId: 'WA-022-4500',
        channel: 'whatsapp',
        leadId: 'LEAD-4055',
        studentId: 'STU-2024-0755',
        employeeId: 'EMP-005',
        aiGenerated: false,
        timestamp: '2024-01-14 09:00:00',
        auditLog: 'Inbound message — VIP corporate lead flagged immediately',
      },
      {
        messageId: 'WA-022-4501',
        channel: 'whatsapp',
        leadId: 'LEAD-4055',
        studentId: 'STU-2024-0755',
        employeeId: 'EMP-005',
        aiGenerated: false,
        timestamp: '2024-01-14 09:05:00',
        auditLog: 'Agent responded — escalated to corporate partnership team',
      },
      {
        messageId: 'WA-022-4502',
        channel: 'whatsapp',
        leadId: 'LEAD-4055',
        studentId: 'STU-2024-0755',
        employeeId: 'EMP-005',
        aiGenerated: false,
        timestamp: '2024-01-14 09:15:00',
        auditLog: 'Dean meeting requested — calendar invite pending',
      },
    ],
  },
];

// ─── Quick Reply Suggestions ──────────────────────────────────────────────────

const quickReplies = [
  'Thanks for reaching out! Let me check that for you.',
  'Would you like to schedule a campus tour?',
  'I can connect you with our admissions counselor.',
  'Please share your documents for evaluation.',
  'Our next intake starts in September 2024.',
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function UnifiedInboxView() {
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv-1');
  const [activeChannel, setActiveChannel] = useState<ChannelType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('context');

  const selectedConversation = mockConversations.find(
    (c) => c.id === selectedConversationId
  );

  const filteredConversations = useMemo(() => {
    return mockConversations
      .filter((conv) => {
        if (activeChannel !== 'all' && conv.channel !== activeChannel) return false;
        if (
          searchQuery &&
          !conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;
        if (assignmentFilter === 'assigned' && !conv.isAssigned) return false;
        if (assignmentFilter === 'unassigned' && conv.isAssigned) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [activeChannel, searchQuery, assignmentFilter]);

  const channelUnreadCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    mockConversations.forEach((conv) => {
      counts.all = (counts.all || 0) + conv.unreadCount;
      counts[conv.channel] = (counts[conv.channel] || 0) + conv.unreadCount;
    });
    return counts;
  }, []);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Unified Inbox</h1>
          <Badge variant="secondary" className="text-xs">
            {mockConversations.length} conversations
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-purple-600" />
            <span className="text-muted-foreground">AI Auto-Reply</span>
            <Switch checked={aiAutoReply} onCheckedChange={setAiAutoReply} />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* ── Channel Filter Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          size="sm"
          variant={activeChannel === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveChannel('all')}
          className="shrink-0"
        >
          All Channels
          {channelUnreadCounts.all > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] flex items-center justify-center text-xs">
              {channelUnreadCounts.all}
            </Badge>
          )}
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {channels.map((ch) => (
          <Button
            key={ch.id}
            size="sm"
            variant={activeChannel === ch.id ? 'default' : 'outline'}
            onClick={() => setActiveChannel(ch.id)}
            className={`shrink-0 gap-1.5 ${
              activeChannel === ch.id ? '' : ''
            }`}
          >
            {ch.icon}
            {ch.label}
            {channelUnreadCounts[ch.id] > 0 && (
              <Badge
                variant="secondary"
                className={`ml-1 h-5 min-w-[20px] flex items-center justify-center text-xs ${ch.bgColor} ${ch.color}`}
              >
                {channelUnreadCounts[ch.id]}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* ── Main Three-Panel Layout ── */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* ── Left Panel — Conversation List ── */}
        <Card className="w-80 shrink-0 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-8 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Button
                size="sm"
                variant={assignmentFilter === 'all' ? 'default' : 'ghost'}
                className="h-7 text-xs"
                onClick={() => setAssignmentFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={assignmentFilter === 'assigned' ? 'default' : 'ghost'}
                className="h-7 text-xs"
                onClick={() => setAssignmentFilter('assigned')}
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Assigned
              </Button>
              <Button
                size="sm"
                variant={assignmentFilter === 'unassigned' ? 'default' : 'ghost'}
                className="h-7 text-xs"
                onClick={() => setAssignmentFilter('unassigned')}
              >
                <User className="h-3 w-3 mr-1" />
                Unassigned
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[calc(100vh-320px)]">
              <div className="flex flex-col">
                {filteredConversations.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    No conversations found
                  </div>
                )}
                {filteredConversations.map((conv) => {
                  const channelCfg = getChannelConfig(conv.channel);
                  const isSelected = conv.id === selectedConversationId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full text-left p-3 border-l-4 transition-colors hover:bg-muted/50 ${
                        isSelected ? 'bg-muted' : ''
                      } ${channelCfg.borderColor}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-xs font-medium">
                              {conv.contact.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center ${channelCfg.bgColor}`}>
                            <span className={channelCfg.color}>{channelCfg.icon}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {conv.isPinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
                              <span className="font-medium text-sm truncate">
                                {conv.contact.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {conv.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {conv.lastMessageTime}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.lastMessage}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {conv.isAssigned && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                {conv.assignee}
                              </Badge>
                            )}
                            <Badge
                              variant={conv.status === 'open' ? 'default' : conv.status === 'pending' ? 'secondary' : 'outline'}
                              className="text-[10px] h-4 px-1.5"
                            >
                              {conv.status}
                            </Badge>
                            {conv.unreadCount > 0 && (
                              <Badge className="text-[10px] h-4 min-w-[16px] flex items-center justify-center px-1.5">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ── Center Panel — Chat View ── */}
        <Card className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs font-medium">
                        {selectedConversation.contact.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {selectedConversation.contact.name}
                        </span>
                        <Badge variant="outline" className={`text-xs gap-1 ${getChannelConfig(selectedConversation.channel).bgColor} ${getChannelConfig(selectedConversation.channel).color}`}>
                          {getChannelConfig(selectedConversation.channel).icon}
                          {getChannelConfig(selectedConversation.channel).label}
                        </Badge>
                        {aiAutoReply && (
                          <Badge variant="outline" className="text-xs gap-1 bg-purple-100 text-purple-700">
                            <Zap className="h-3 w-3" />
                            AI Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {selectedConversation.contact.email}
                        <Separator orientation="vertical" className="h-3" />
                        {selectedConversation.contact.phone}
                        <Separator orientation="vertical" className="h-3" />
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {selectedConversation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.isAssigned ? (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <UserCheck className="h-3 w-3" />
                        {selectedConversation.assignee}
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />

              {/* Messages Area */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[calc(100vh-440px)] px-4 py-3">
                  <div className="flex flex-col gap-3">
                    {selectedConversation.messages.map((msg) => {
                      const isContact = msg.senderType === 'contact';
                      const msgChannelCfg = getChannelConfig(msg.channel);
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isContact ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg px-3.5 py-2.5 ${
                              isContact
                                ? `bg-muted ${msgChannelCfg.bgColor}/30 border ${msgChannelCfg.borderColor}`
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-[10px] font-medium ${isContact ? msgChannelCfg.color : 'text-primary-foreground/70'}`}>
                                {msg.senderName}
                              </span>
                              {msg.aiGenerated && (
                                <Badge className="text-[9px] h-3.5 px-1 bg-purple-600 text-white gap-0.5">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI
                                </Badge>
                              )}
                              <span className={`text-[10px] ${isContact ? 'text-muted-foreground' : 'text-primary-foreground/50'}`}>
                                {msg.timestamp}
                              </span>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isContact ? 'text-foreground' : ''}`}>
                              {msg.content}
                            </p>
                            <div className={`flex items-center gap-2 mt-1.5 ${isContact ? 'justify-start' : 'justify-end'}`}>
                              {msg.crmSaved ? (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  CRM Saved
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[10px] text-orange-500">
                                  <AlertCircle className="h-2.5 w-2.5" />
                                  Pending Save
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {msg.messageId}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
              <Separator />

              {/* Message Input */}
              <div className="p-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickReplies.map((qr, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setMessageInput(qr)}
                    >
                      {qr}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    className="flex-1 h-9"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageInput.trim()) {
                        setMessageInput('');
                      }
                    }}
                  />
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Forward className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="h-9 gap-1.5" disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>

        {/* ── Right Panel — Context & CRM ── */}
        <Card className="w-96 shrink-0 flex flex-col">
          <CardHeader className="pb-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full h-8">
                <TabsTrigger value="context" className="text-xs flex-1">Context</TabsTrigger>
                <TabsTrigger value="crm" className="text-xs flex-1">CRM Data</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs flex-1">Timeline</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <Separator />

          {selectedConversation && (
            <CardContent className="p-0 flex-1 overflow-hidden">
              <Tabs value={activeTab} className="h-full flex flex-col">
                <TabsContent value="context" className="flex-1 overflow-hidden m-0 p-0">
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <div className="p-4 space-y-4">
                      {/* Contact Profile */}
                      <div className="text-center">
                        <Avatar className="h-16 w-16 mx-auto mb-2">
                          <AvatarFallback className="text-lg font-semibold">
                            {selectedConversation.contact.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-sm">{selectedConversation.contact.name}</h3>
                        <p className="text-xs text-muted-foreground">{selectedConversation.contact.program}</p>
                      </div>

                      {/* Student ID */}
                      {selectedConversation.contact.studentId && (
                        <div className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
                          <span className="text-xs text-muted-foreground">Student ID</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs font-mono">
                              {selectedConversation.contact.studentId}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Lead Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Lead Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Source</span>
                            <p className="font-medium mt-0.5">{selectedConversation.contact.leadSource}</p>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Score</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className={`h-2 flex-1 rounded-full ${
                                selectedConversation.contact.leadScore >= 80 ? 'bg-green-500' :
                                selectedConversation.contact.leadScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} style={{ width: `${selectedConversation.contact.leadScore}%` }} />
                              <span className="font-medium">{selectedConversation.contact.leadScore}</span>
                            </div>
                          </div>
                          <div className="p-2 bg-muted rounded col-span-2">
                            <span className="text-muted-foreground">Program Interest</span>
                            <p className="font-medium mt-0.5">{selectedConversation.contact.program}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Contact Details */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Contact Details</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{selectedConversation.contact.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{selectedConversation.contact.phone}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Tags */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                          <Tag className="h-3 w-3" /> Tags
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedConversation.contact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Assign to Counselor */}
                      <Button className="w-full gap-2" size="sm">
                        <UserCheck className="h-4 w-4" />
                        Assign to Counselor
                      </Button>
                      <Button variant="outline" className="w-full gap-2" size="sm">
                        <FileText className="h-4 w-4" />
                        Create Follow-Up Task
                      </Button>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="crm" className="flex-1 overflow-hidden m-0 p-0">
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          CRM Sync Status
                        </h4>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Shield className="h-3 w-3" />
                          Audit Trail
                        </Badge>
                      </div>

                      {selectedConversation.crmRecords.map((record) => (
                        <Card key={record.messageId} className="p-3 bg-muted/50">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {record.messageId}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] gap-0.5 ${
                                  record.aiGenerated ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {record.aiGenerated ? (
                                  <>
                                    <Bot className="h-2.5 w-2.5" /> AI
                                  </>
                                ) : (
                                  <>
                                    <User className="h-2.5 w-2.5" /> Human
                                  </>
                                )}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              <div>
                                <span className="text-muted-foreground">Channel</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {getChannelConfig(record.channel).icon}
                                  <span className="capitalize">{record.channel.replace('_', ' ')}</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Lead ID</span>
                                <p className="font-mono text-[10px] mt-0.5">{record.leadId}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Student ID</span>
                                <p className="font-mono text-[10px] mt-0.5">
                                  {record.studentId || '—'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Employee</span>
                                <p className="font-mono text-[10px] mt-0.5">{record.employeeId}</p>
                              </div>
                            </div>
                            <Separator className="my-1" />
                            <div className="text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span className="text-[10px]">{record.timestamp}</span>
                              </div>
                              <div className="flex items-start gap-1 mt-1">
                                <History className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                <span className="text-[10px] text-muted-foreground">{record.auditLog}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}

                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-xs gap-1">
                          <History className="h-3 w-3" />
                          View Full Audit Log
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="timeline" className="flex-1 overflow-hidden m-0 p-0">
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <div className="p-4">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
                        Activity Timeline
                      </h4>
                      <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                        <div className="space-y-4">
                          {selectedConversation.timeline.map((event) => {
                            const iconMap: Record<string, React.ReactNode> = {
                              message: <MessageCircle className="h-3.5 w-3.5" />,
                              call: <Phone className="h-3.5 w-3.5" />,
                              email: <Mail className="h-3.5 w-3.5" />,
                              form_submit: <FileText className="h-3.5 w-3.5" />,
                              visit: <Globe className="h-3.5 w-3.5" />,
                              note: <FileText className="h-3.5 w-3.5" />,
                            };
                            const colorMap: Record<string, string> = {
                              message: 'bg-blue-500',
                              call: 'bg-green-500',
                              email: 'bg-gray-500',
                              form_submit: 'bg-amber-500',
                              visit: 'bg-teal-500',
                              note: 'bg-purple-500',
                            };
                            return (
                              <div key={event.id} className="flex items-start gap-3 relative">
                                <div className={`z-10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-white ${colorMap[event.type]}`}>
                                  {iconMap[event.type]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs">{event.description}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">{event.timestamp}</span>
                                    {event.channel && (
                                      <Badge
                                        variant="secondary"
                                        className={`text-[9px] h-4 px-1 ${getChannelConfig(event.channel).bgColor} ${getChannelConfig(event.channel).color}`}
                                      >
                                        {getChannelConfig(event.channel).label}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
