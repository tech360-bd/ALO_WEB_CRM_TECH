'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search, Shield, UserCheck, UserX, Mail, Phone, Clock } from 'lucide-react';

const MOCK_USERS = [
  { id: '1', name: 'Super Admin', email: 'admin@alo.edu.bd', phone: '01711-000001', role: 'super_admin', status: 'active', lastLogin: '2026-07-23T08:00', created: '2026-01-15' },
  { id: '2', name: 'CEO', email: 'ceo@alo.edu.bd', phone: '01711-000002', role: 'ceo', status: 'active', lastLogin: '2026-07-23T09:15', created: '2026-01-15' },
  { id: '3', name: 'Branch Manager', email: 'bm@alo.edu.bd', phone: '01711-000003', role: 'branch_manager', status: 'active', lastLogin: '2026-07-23T07:30', created: '2026-01-15' },
  { id: '4', name: 'Counselor', email: 'counselor@alo.edu.bd', phone: '01711-000004', role: 'counselor', status: 'active', lastLogin: '2026-07-22T16:00', created: '2026-01-20' },
  { id: '5', name: 'Application Team', email: 'app@alo.edu.bd', phone: '01711-000005', role: 'application_team', status: 'active', lastLogin: '2026-07-23T10:00', created: '2026-01-20' },
  { id: '6', name: 'Visa Officer', email: 'visa@alo.edu.bd', phone: '01711-000006', role: 'visa_officer', status: 'active', lastLogin: '2026-07-21T14:00', created: '2026-02-01' },
  { id: '7', name: 'Finance Officer', email: 'finance@alo.edu.bd', phone: '01711-000007', role: 'finance', status: 'active', lastLogin: '2026-07-23T08:45', created: '2026-02-01' },
  { id: '8', name: 'Marketing Manager', email: 'marketing@alo.edu.bd', phone: '01711-000008', role: 'marketing_manager', status: 'active', lastLogin: '2026-07-22T11:00', created: '2026-02-15' },
  { id: '9', name: 'Front Desk', email: 'frontdesk@alo.edu.bd', phone: '01711-000009', role: 'front_desk', status: 'suspended', lastLogin: '2026-06-15T09:00', created: '2026-02-15' },
  { id: '10', name: 'HR Manager', email: 'hr@alo.edu.bd', phone: '01711-000010', role: 'hr', status: 'active', lastLogin: '2026-07-20T10:30', created: '2026-03-01' },
  { id: '11', name: 'Partner Manager', email: 'partner@alo.edu.bd', phone: '01711-000011', role: 'partner_manager', status: 'active', lastLogin: '2026-07-22T15:00', created: '2026-03-01' },
  { id: '12', name: 'Document Officer', email: 'doc@alo.edu.bd', phone: '01711-000012', role: 'document_officer', status: 'active', lastLogin: '2026-07-23T07:00', created: '2026-03-15' },
  { id: '13', name: 'Data Manager', email: 'data@alo.edu.bd', phone: '01711-000013', role: 'data_manager', status: 'active', lastLogin: '2026-07-21T13:00', created: '2026-03-15' },
  { id: '14', name: 'Support Agent', email: 'support@alo.edu.bd', phone: '01711-000014', role: 'support_agent', status: 'active', lastLogin: '2026-07-23T10:30', created: '2026-04-01' },
  { id: '15', name: 'AI Manager', email: 'ai@alo.edu.bd', phone: '01711-000015', role: 'ai_manager', status: 'active', lastLogin: '2026-07-22T09:45', created: '2026-04-01' },
  { id: '16', name: 'Test Student', email: 'student@test.com', phone: '01711-000099', role: 'student', status: 'active', lastLogin: '2026-07-20T16:00', created: '2026-05-01' },
];

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700', ceo: 'bg-red-50 text-red-600', branch_manager: 'bg-amber-100 text-amber-700',
  counselor: 'bg-blue-100 text-blue-700', application_team: 'bg-green-100 text-green-700', visa_officer: 'bg-purple-100 text-purple-700',
  finance: 'bg-teal-100 text-teal-700', marketing_manager: 'bg-pink-100 text-pink-700', front_desk: 'bg-gray-100 text-gray-600',
  hr: 'bg-indigo-100 text-indigo-700', partner_manager: 'bg-orange-100 text-orange-700', document_officer: 'bg-cyan-100 text-cyan-700',
  data_manager: 'bg-lime-100 text-lime-700', support_agent: 'bg-sky-100 text-sky-700', ai_manager: 'bg-violet-100 text-violet-700',
  student: 'bg-emerald-100 text-emerald-700',
};
const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin', ceo: 'CEO', branch_manager: 'Branch Mgr', counselor: 'Counselor',
  application_team: 'App Team', visa_officer: 'Visa Officer', finance: 'Finance', marketing_manager: 'Marketing Mgr',
  front_desk: 'Front Desk', hr: 'HR Manager', partner_manager: 'Partner Mgr', document_officer: 'Doc Officer',
  data_manager: 'Data Mgr', support_agent: 'Support', ai_manager: 'AI Manager', student: 'Student',
};

export default function CrmUsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetch('/api/crm/seed').then(r => r.json()).then(d => {
      if (d.users && d.users.length > 0) {
        const realUsers = d.users.map((u: any) => ({ ...u, role: u.crmRole || 'student', status: 'active', lastLogin: new Date().toISOString(), created: '2026-01-15' }));
        setUsers(realUsers);
      }
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, search, roleFilter]);

  const stats = useMemo(() => ({ total: users.length, active: users.filter(u => u.status === 'active').length, suspended: users.filter(u => u.status === 'suspended').length, roles: new Set(users.map(u => u.role)).size }), [users]);

  const toggleStatus = (id: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">User Management</h1><p className="text-gray-500">Manage all system users and their access</p></div>
        <Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />Invite User</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-green-600 bg-green-50' },
          { label: 'Suspended', value: stats.suspended, icon: UserX, color: 'text-red-600 bg-red-50' },
          { label: 'Roles', value: stats.roles, icon: Shield, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3"><div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Roles</option>
          {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50"><tr>
              {['Name', 'Email', 'Phone', 'Role', 'Status', 'Last Login', 'Actions'].map(h => <th key={h} className="text-left p-3 font-medium text-gray-600">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-gray-900">{u.name}</td>
                  <td className="p-3 text-gray-600"><Mail className="w-3 h-3 inline mr-1" />{u.email}</td>
                  <td className="p-3 text-gray-600"><Phone className="w-3 h-3 inline mr-1" />{u.phone || 'N/A'}</td>
                  <td className="p-3"><Badge variant="outline" className={roleColors[u.role] || ''}>{roleLabels[u.role] || u.role}</Badge></td>
                  <td className="p-3">
                    <button onClick={() => toggleStatus(u.id)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />{u.status}
                    </button>
                  </td>
                  <td className="p-3 text-gray-500"><Clock className="w-3 h-3 inline mr-1" />{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td className="p-3"><div className="flex gap-1"><Button size="sm" variant="ghost" className="text-blue-600">Edit</Button><Button size="sm" variant="ghost" className="text-gray-600">View</Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <CardContent className="p-8 text-center text-gray-400">No users found</CardContent>}
      </Card>
    </div>
  );
}