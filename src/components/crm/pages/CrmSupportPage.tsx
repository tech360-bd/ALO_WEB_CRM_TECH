'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Search, Plus, Download, Headphones, AlertCircle,
  CheckCircle, Clock, ArrowUpRight, MessageSquare,
} from 'lucide-react';

type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
type TicketPriority = 'High' | 'Medium' | 'Low';

interface SupportTicket {
  id: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  assignedTo: string;
  created: string;
  updated: string;
}

const statusColors: Record<TicketStatus, string> = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Resolved': 'bg-emerald-100 text-emerald-700',
  'Closed': 'bg-gray-100 text-gray-600',
};

const priorityColors: Record<TicketPriority, string> = {
  'High': 'bg-red-100 text-red-700',
  'Medium': 'bg-orange-100 text-orange-700',
  'Low': 'bg-green-100 text-green-700',
};

const fallbackTickets: SupportTicket[] = [
  { id: 'TKT-001', studentName: 'Arif Rahman', studentEmail: 'arif@gmail.com', subject: 'Visa application document not uploading', status: 'Open', priority: 'High', category: 'Technical', assignedTo: 'Tasnim Akter', created: '2025-06-25', updated: '2025-06-25' },
  { id: 'TKT-002', studentName: 'Fatima Begum', studentEmail: 'fatima@yahoo.com', subject: 'Need updated offer letter from University of Melbourne', status: 'In Progress', priority: 'High', category: 'Documents', assignedTo: 'Rafiq Hasan', created: '2025-06-23', updated: '2025-06-24' },
  { id: 'TKT-003', studentName: 'Sakib Hossain', studentEmail: 'sakib@outlook.com', subject: 'Payment receipt not received for tuition deposit', status: 'Resolved', priority: 'Medium', category: 'Finance', assignedTo: 'Nasreen Jahan', created: '2025-06-20', updated: '2025-06-22' },
  { id: 'TKT-004', studentName: 'Mitu Sarkar', studentEmail: 'mitu@gmail.com', subject: 'Counselling session rescheduling request', status: 'Open', priority: 'Low', category: 'General', assignedTo: 'Tasnim Akter', created: '2025-06-24', updated: '2025-06-24' },
  { id: 'TKT-005', studentName: 'Tanvir Ahmed', studentEmail: 'tanvir@gmail.com', subject: 'Scholarship application status inquiry', status: 'In Progress', priority: 'Medium', category: 'Scholarship', assignedTo: 'Kamal Uddin', created: '2025-06-21', updated: '2025-06-23' },
  { id: 'TKT-006', studentName: 'Nusrat Jahan', studentEmail: 'nusrat@gmail.com', subject: 'CAS letter not received from UK university', status: 'Open', priority: 'High', category: 'Documents', assignedTo: 'Rafiq Hasan', created: '2025-06-22', updated: '2025-06-22' },
  { id: 'TKT-007', studentName: 'Imran Khan', studentEmail: 'imran@yahoo.com', subject: 'Account login issue - password reset not working', status: 'Resolved', priority: 'Medium', category: 'Technical', assignedTo: 'Nasreen Jahan', created: '2025-06-18', updated: '2025-06-19' },
  { id: 'TKT-008', studentName: 'Sharmin Akter', studentEmail: 'sharmin@gmail.com', subject: 'Request for refund of application fee', status: 'Closed', priority: 'Low', category: 'Finance', assignedTo: 'Tasnim Akter', created: '2025-06-10', updated: '2025-06-17' },
  { id: 'TKT-009', studentName: 'Rakib Islam', studentEmail: 'rakib@outlook.com', subject: 'Interview preparation materials needed', status: 'Open', priority: 'Medium', category: 'General', assignedTo: 'Kamal Uddin', created: '2025-06-25', updated: '2025-06-25' },
  { id: 'TKT-010', studentName: 'Priya Das', studentEmail: 'priya@gmail.com', subject: 'ATAS certificate guidance required', status: 'In Progress', priority: 'High', category: 'Documents', assignedTo: 'Rafiq Hasan', created: '2025-06-24', updated: '2025-06-25' },
];

export default function CrmSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetch('/api/crm/support')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.data)) setTickets(d.data);
        else if (Array.isArray(d.tickets)) setTickets(d.tickets);
      })
      .catch(() => setTickets(fallbackTickets))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = t.studentName.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const highPriorityCount = tickets.filter(t => t.priority === 'High' && t.status !== 'Closed' && t.status !== 'Resolved').length;

  const statsCards = [
    { label: 'Open Tickets', value: openCount, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Resolved', value: resolvedCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'High Priority', value: highPriorityCount, icon: Headphones, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Support Tickets</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="border-alo-border text-alo-text-secondary">
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
          <Button className="bg-alo-brand hover:bg-alo-brand/90 text-white">
            <Plus className="mr-2 h-4 w-4" />New Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(s => (
          <Card key={s.label} className="bg-white border border-alo-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-lg`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-alo-text-muted">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white border border-alo-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-alo-text">All Tickets</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
                <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-[240px]" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-alo-text-muted">Loading tickets...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-alo-text-muted">
              <MessageSquare className="h-12 w-12 mb-3 opacity-40" />
              <p>No tickets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="border-b border-alo-border text-left text-alo-text-muted">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Assigned To</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ticket => (
                    <tr key={ticket.id} className="border-b border-alo-border/50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-mono text-xs text-alo-text-muted">{ticket.id}</td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-alo-text">{ticket.studentName}</p>
                          <p className="text-xs text-alo-text-muted">{ticket.studentEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 max-w-[200px]">
                        <p className="text-alo-text-secondary truncate">{ticket.subject}</p>
                      </td>
                      <td className="py-3 text-alo-text-secondary">{ticket.category}</td>
                      <td className="py-3"><Badge className={statusColors[ticket.status]}>{ticket.status}</Badge></td>
                      <td className="py-3"><Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge></td>
                      <td className="py-3 text-alo-text-secondary">{ticket.assignedTo}</td>
                      <td className="py-3 text-alo-text-muted">{ticket.created}</td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-alo-brand">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
