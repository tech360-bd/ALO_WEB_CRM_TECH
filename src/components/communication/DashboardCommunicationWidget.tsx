'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, PhoneCall, FileCheck, Clock, AlertCircle, DollarSign, PlusCircle,
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
  unreadCount?: number | null;
  slaOverdueCount?: number | null;
  onNavigateToInbox?: () => void;
}

function getRoleTitle(role: DashboardRoleType): string {
  switch (role) {
    case 'STUDENT': return 'My Messages & Support';
    case 'PARTNER': return 'Partner Communication';
    case 'B2B_SUPER_ADMIN': return 'Company Communication';
    case 'STAFF_CRM': return 'Staff Communication';
    case 'COUNSELOR': return 'Assigned Student & Lead Messages';
    case 'APPLICATION_MANAGER': return 'Application Communication';
    case 'VISA_OFFICER': return 'Visa Case Communication';
    case 'MARKETING_MANAGER': return 'Marketing Inbox';
    case 'FINANCE': return 'Finance Communication';
    case 'FRONT_DESK': return 'Front Desk Communication';
    case 'SUPER_ADMIN': return 'Communication Center';
    default: return 'Communication Desk';
  }
}

export default function DashboardCommunicationWidget({
  role,
  unreadCount = null,
  slaOverdueCount = null,
  onNavigateToInbox,
}: DashboardCommunicationWidgetProps) {
  return (
    <Card className="border border-indigo-100 shadow-sm bg-white rounded-xl">
      <CardHeader className="pb-3 border-b border-[var(--alo-border)] flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-5 h-5 text-indigo-600 shrink-0" />
          <CardTitle className="text-sm font-bold text-[var(--alo-text)]">{getRoleTitle(role)}</CardTitle>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="outline" className="text-[11px]">
            {unreadCount == null ? 'Unread total unavailable' : `${Math.max(0, unreadCount)} unread`}
          </Badge>
          {role !== 'STUDENT' && (
            <Badge variant="outline" className="text-[11px]">
              {slaOverdueCount == null ? 'SLA total unavailable' : `${Math.max(0, slaOverdueCount)} SLA overdue`}
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
        {role === 'STUDENT' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Link href="/student/help" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-indigo-700 border-indigo-100 bg-indigo-50/50">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Contact Support
            </Button></Link>
            <Link href="/student/documents" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-blue-700 border-blue-100 bg-blue-50/50">
              <FileCheck className="w-3.5 h-3.5 mr-1" /> My Documents
            </Button></Link>
            <Link href="/student/appointments" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-emerald-700 border-emerald-100 bg-emerald-50/50">
              <Clock className="w-3.5 h-3.5 mr-1" /> Appointments
            </Button></Link>
          </div>
        )}

        {role === 'PARTNER' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link href="/partner/messages" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-indigo-700 border-indigo-100 bg-indigo-50/50">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Messages
            </Button></Link>
            <Link href="/partner/documents" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-emerald-700 border-emerald-100 bg-emerald-50/50">
              <FileCheck className="w-3.5 h-3.5 mr-1" /> Documents
            </Button></Link>
            <Link href="/partner/commission" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-amber-700 border-amber-100 bg-amber-50/50">
              <DollarSign className="w-3.5 h-3.5 mr-1" /> Commission
            </Button></Link>
            <Link href="/partner/leads" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-purple-700 border-purple-100 bg-purple-50/50">
              <AlertCircle className="w-3.5 h-3.5 mr-1" /> Leads
            </Button></Link>
          </div>
        )}

        {role === 'APPLICATION_MANAGER' && (
          <p className="text-xs text-[var(--alo-body)]">
            Application access is checked for each record. Open the authorized inbox to review current items.
          </p>
        )}

        {role === 'FRONT_DESK' && (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/crm/ucc" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-indigo-700 border-indigo-100 bg-indigo-50/50">
              <PhoneCall className="w-3.5 h-3.5 mr-1" /> Communication Center
            </Button></Link>
            <Link href="/employee/leads" className="block"><Button size="sm" variant="outline" className="text-xs h-8 justify-start text-emerald-700 border-emerald-100 bg-emerald-50/50">
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Lead Workspace
            </Button></Link>
          </div>
        )}

        <p className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs text-[var(--alo-body)]" role="status">
          Counts come from this dashboard's authorized scope when available. Message content and external provider delivery confirmations are not shown here; use the authorized inbox for message-level review.
        </p>
      </CardContent>
    </Card>
  );
}
