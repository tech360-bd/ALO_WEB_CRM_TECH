'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, Mail, PhoneCall, PhoneMissed, Sparkles, Clock, AlertCircle,
  FileCheck, ShieldCheck, DollarSign, Share2, Filter, Send, UserCheck, PlusCircle, CheckCircle2
} from 'lucide-react';

export type DashboardRoleType =
  | 'STUDENT'
  | 'PARTNER'
  | 'B2B_SUPER_ADMIN'
  | 'STAFF_CRM'
  | 'COUNSELOR'
  | 'APPLICATION_MANAGER'
  | 'VISA_OFFICER'
  | 'MARKETING_MANAGER'
  | 'FINANCE'
  | 'FRONT_DESK'
  | 'SUPER_ADMIN';

interface DashboardCommunicationWidgetProps {
  role: DashboardRoleType;
  unreadCount?: number;
  slaOverdueCount?: number;
  onNavigateToInbox?: () => void;
}

export default function DashboardCommunicationWidget({
  role,
  unreadCount = 3,
  slaOverdueCount = 1,
  onNavigateToInbox,
}: DashboardCommunicationWidgetProps) {
  const [activeTab, setActiveTab] = useState('inbox');

  const getRoleTitle = () => {
    switch (role) {
      case 'STUDENT': return 'My Messages & Support Chat';
      case 'PARTNER': return 'Partner Agency Communication Hub';
      case 'B2B_SUPER_ADMIN': return 'Company Communication & Quota Center';
      case 'STAFF_CRM': return 'Unified Staff Communication Desk';
      case 'COUNSELOR': return 'Assigned Student & Lead Messages';
      case 'APPLICATION_MANAGER': return 'Application & University Communication Queue';
      case 'VISA_OFFICER': return 'Visa File & Financial Proof Messages';
      case 'MARKETING_MANAGER': return 'Social Inbox & Lead Capture Queue';
      case 'FINANCE': return 'Payment & Commission Message Queue';
      case 'FRONT_DESK': return 'Front Desk Call Logs & Enquiries';
      case 'SUPER_ADMIN': return 'Master Enterprise Communication Center';
      default: return 'Communication Desk';
    }
  };

  return (
    <Card className="border border-indigo-100 shadow-sm bg-white rounded-xl">
      <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-sm font-bold text-gray-900">{getRoleTitle()}</CardTitle>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
              {unreadCount} Unread
            </Badge>
          )}
          {slaOverdueCount > 0 && role !== 'STUDENT' && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
              {slaOverdueCount} SLA Overdue
            </Badge>
          )}
          {onNavigateToInbox && (
            <Button variant="outline" size="sm" className="h-7 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={onNavigateToInbox}>
              Open Inbox &rarr;
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Role Specific Action Quick Bar */}
        {role === 'STUDENT' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-indigo-700 border-indigo-100 bg-indigo-50/50">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Reply Counselor
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-blue-700 border-blue-100 bg-blue-50/50">
              <FileCheck className="w-3.5 h-3.5 mr-1" /> Upload Doc Request
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-emerald-700 border-emerald-100 bg-emerald-50/50">
              <Clock className="w-3.5 h-3.5 mr-1" /> Book Appointment
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-purple-700 border-purple-100 bg-purple-50/50">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Advisor Chat
            </Button>
          </div>
        )}

        {role === 'PARTNER' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-indigo-700 border-indigo-100 bg-indigo-50/50">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Message Support
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-emerald-700 border-emerald-100 bg-emerald-50/50">
              <FileCheck className="w-3.5 h-3.5 mr-1" /> Missing Doc Upload
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-amber-700 border-amber-100 bg-amber-50/50">
              <DollarSign className="w-3.5 h-3.5 mr-1" /> Commission Updates
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-purple-700 border-purple-100 bg-purple-50/50">
              <AlertCircle className="w-3.5 h-3.5 mr-1" /> Urgent Follow-up
            </Button>
          </div>
        )}

        {role === 'APPLICATION_MANAGER' && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge className="bg-amber-100 text-amber-900 border-amber-200">
              🔒 B2B Confidential Route Active
            </Badge>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              University CAS/I-20 Pending: 4
            </Badge>
          </div>
        )}

        {role === 'FRONT_DESK' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-indigo-700 border-indigo-100 bg-indigo-50/50">
              <PhoneCall className="w-3.5 h-3.5 mr-1" /> Log Call Outcome
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-emerald-700 border-emerald-100 bg-emerald-50/50">
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Quick Lead Creation
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 justify-start text-rose-700 border-rose-100 bg-rose-50/50">
              <PhoneMissed className="w-3.5 h-3.5 mr-1" /> Missed Call Queue (2)
            </Button>
          </div>
        )}

        {/* Message Feed Sample */}
        <div className="space-y-2 pt-1">
          <div className="bg-gray-50 hover:bg-indigo-50/40 border border-gray-100 rounded-lg p-2.5 flex items-start justify-between gap-3 transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">WhatsApp Lead Inquiry</span>
                <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">WhatsApp</Badge>
                <span className="text-[10px] text-gray-400">10m ago</span>
              </div>
              <p className="text-xs text-gray-600 truncate mt-0.5">
                Interested in UK Masters in Data Science with 50% scholarship...
              </p>
            </div>
            <Badge className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">New</Badge>
          </div>

          <div className="bg-gray-50 hover:bg-indigo-50/40 border border-gray-100 rounded-lg p-2.5 flex items-start justify-between gap-3 transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">Document Upload Notification</span>
                <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">Portal</Badge>
                <span className="text-[10px] text-gray-400">25m ago</span>
              </div>
              <p className="text-xs text-gray-600 truncate mt-0.5">
                Student uploaded passport scan for verification.
              </p>
            </div>
            <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Verified</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
