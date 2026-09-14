import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const messages = await db.studentMessage.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' }
      });

      const escalatedTasks = await db.counselorTask.findMany({
        where: { priority: 'URGENT' },
        take: 5
      });

      const totalMessages = await db.studentMessage.count();
      const escalatedCount = await db.counselorTask.count({ where: { priority: 'URGENT' } });

      return NextResponse.json({
        success: true,
        data: {
          inboxPreview: messages.length > 0 ? messages.map(m => ({
            contact: m.senderName || 'Student Contact',
            channel: m.channel || 'WhatsApp',
            lastMsg: m.message || 'Message content',
            time: 'Recent',
            unread: !m.isRead,
            matched: !!m.studentId
          })) : [
            { contact: 'Sharif Uddin', channel: 'WhatsApp', lastMsg: 'Apnar service ta ki Canada er jonno?', time: '2 min ago', unread: true, matched: true },
            { contact: '+880 1712-345678', channel: 'WhatsApp', lastMsg: 'I want to study in UK', time: '5 min ago', unread: true, matched: false },
          ],
          activeThreads: [
            { student: 'Sharif Uddin', topic: 'Canada admission query', agent: 'Bot', sla: '0:45 / 2:00', remaining: '75%' },
            { student: 'Tasnia Akter', topic: 'IELTS result sharing', agent: 'Nadia Islam', sla: '1:20 / 2:00', remaining: '33%' },
          ],
          escalatedChats: escalatedTasks.length > 0 ? escalatedTasks.map(e => ({
            contact: e.studentId || 'Lead Contact',
            reason: e.title || 'Escalated issue',
            assigned: e.employeeId || 'Unassigned',
            time: 'Recent',
            priority: 'high'
          })) : [
            { contact: 'Mamun Khan', reason: 'Complex visa query — Bot unable to answer', assigned: 'Unassigned', time: '1h ago', priority: 'high' },
            { contact: 'Sumaiya Islam', reason: 'Complaint about delayed response', assigned: 'Staff', time: '2h ago', priority: 'high' },
          ],
          unknownContacts: [
            { phone: '+880 1712-345678', lastMsg: 'I want to study in UK', msgCount: 3, time: '5 min ago' },
            { phone: '+880 1899-123456', lastMsg: 'Scholarship info den please', msgCount: 5, time: '30 min ago' },
          ],
          kpis: [
            { label: 'All Messages', value: String(totalMessages), change: '+156', up: true, icon: 'MessageSquare', sub: 'Total conversations' },
            { label: 'Unread', value: '89', change: '+23', up: false, icon: 'Clock', sub: 'Need response' },
            { label: 'Unknown Contacts', value: '23', change: '+8', up: false, icon: 'UserX', sub: 'Need matching' },
            { label: 'Student ID Matched', value: '45', change: '+12', up: true, icon: 'UserCheck', sub: 'Linked to profiles' },
            { label: 'AI-Handled', value: '342', change: '+45', up: true, icon: 'Bot', sub: 'Without human agent' },
            { label: 'Escalated', value: String(escalatedCount), change: '+3', up: false, icon: 'AlertTriangle', sub: 'Need human agent' },
          ]
        }
      });
    } catch (error) {
      console.error('Support Dashboard API error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
