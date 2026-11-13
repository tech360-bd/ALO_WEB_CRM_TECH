'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Search, Plus, Users, Lock, Edit, Loader2 } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  label: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: any[];
}

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Shield className="w-4 h-4 text-crm-danger-text" />,
  ceo: <Shield className="w-4 h-4 text-[var(--alo-error)]" />,
  branch_manager: <Users className="w-4 h-4 text-crm-warning-text" />,
  counselor: <Users className="w-4 h-4 text-[var(--alo-brand)]" />,
  application_team: <Lock className="w-4 h-4 text-crm-success-text" />,
  visa_officer: <Shield className="w-4 h-4 text-[var(--alo-brand)]" />,
  finance: <Lock className="w-4 h-4 text-teal-500" />,
  marketing_manager: <Shield className="w-4 h-4 text-crm-danger-text" />,
  front_desk: <Users className="w-4 h-4 text-[var(--alo-text-muted)]" />,
  hr: <Shield className="w-4 h-4 text-[var(--alo-brand)]" />,
  partner_manager: <Users className="w-4 h-4 text-[var(--alo-cta)]" />,
  document_officer: <Lock className="w-4 h-4 text-[var(--alo-info-text)]" />,
  data_manager: <Lock className="w-4 h-4 text-lime-600" />,
  support_agent: <Users className="w-4 h-4 text-sky-500" />,
  ai_manager: <Shield className="w-4 h-4 text-[var(--alo-brand)]" />,
};

const roleBorders: Record<string, string> = {
  super_admin: 'border-crm-danger-border', ceo: 'border-crm-danger-border', branch_manager: 'border-crm-warning-border',
  counselor: 'border-[var(--alo-brand)]', application_team: 'border-[var(--alo-success)]', visa_officer: 'border-[var(--alo-brand)]',
  finance: 'border-teal-500', marketing_manager: 'border-crm-danger-border', front_desk: 'border-[var(--alo-border)]',
  hr: 'border-[var(--alo-brand)]', partner_manager: 'border-[var(--alo-cta)]', document_officer: 'border-[var(--alo-info-border)]',
  data_manager: 'border-lime-600', support_agent: 'border-sky-500', ai_manager: 'border-[var(--alo-brand)]',
};

export default function CrmRolesPage() {
  const token = usePortalStore(state => state.token);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadRoles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/crm/roles?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data?.roles || json.data || [];
        setRoles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const filtered = useMemo(() => {
    if (!search) return roles;
    const s = search.toLowerCase();
    return roles.filter(r =>
      r.name.toLowerCase().includes(s) ||
      r.label.toLowerCase().includes(s) ||
      r.description.toLowerCase().includes(s)
    );
  }, [roles, search]);

  const totalUsers = roles.reduce((s, r) => s + (r.userCount || 0), 0);
  const totalPerms = roles.reduce((s, r) => s + (r.permissions?.length || 0), 0);
  const systemCount = roles.filter(r => r.isSystem).length;
  const customCount = roles.filter(r => !r.isSystem).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">Role Management</h1>
          <p className="text-[var(--alo-text-muted)]">Define roles and configure access permissions for {totalUsers} users</p>
        </div>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)]"><Plus className="w-4 h-4 mr-2" />Create Role</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]"><Shield className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{roles.length}</p><p className="text-xs text-[var(--alo-text-muted)]">Total Roles</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-crm-success-bg text-crm-success-text"><Users className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{totalUsers}</p><p className="text-xs text-[var(--alo-text-muted)]">Users Assigned</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]"><Lock className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{roles.length > 0 ? Math.round(totalPerms / roles.length) : 0}</p><p className="text-xs text-[var(--alo-text-muted)]">Avg Permissions</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]"><Edit className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{customCount}</p><p className="text-xs text-[var(--alo-text-muted)]">Custom Roles</p></div></CardContent></Card>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)]" /><Input placeholder="Search roles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-[var(--alo-text-muted)] col-span-full">No roles found</Card>
        ) : filtered.map(role => (
          <Card key={role.id} className={`border-l-4 ${roleBorders[role.name] || 'border-[var(--alo-border-strong)]'} hover:shadow-md transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {roleIcons[role.name] || <Shield className="w-4 h-4 text-[var(--alo-text-muted)]" />}
                <h3 className="font-semibold text-[var(--alo-text)]">{role.label || role.name}</h3>
                {role.isSystem && <Badge variant="secondary" className="ml-auto">System</Badge>}
              </div>
              <p className="text-sm text-[var(--alo-body)] mb-3">{role.description || 'No description'}</p>
              <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)]">
                <Users className="w-3.5 h-3.5" />
                <span>{role.userCount || 0} users</span>
                <Lock className="w-3.5 h-3.5 ml-2" />
                <span>{role.permissions?.length || 0} permissions</span>
              </div>
              <div className="flex gap-1 mt-3">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Permissions</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Users className="w-3.5 h-3.5 mr-1" />Users</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
