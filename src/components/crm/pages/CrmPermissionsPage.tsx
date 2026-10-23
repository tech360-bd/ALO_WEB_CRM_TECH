'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Save, Lock, Eye, Pencil, Trash2, Download, Upload } from 'lucide-react';

const CATEGORIES = [
  { key: 'overview', label: 'Overview', desc: 'Dashboard and general system access' },
  { key: 'students', label: 'Students', desc: 'Student records, profiles, and data management' },
  { key: 'applications', label: 'Applications', desc: 'Application pipeline and processing' },
  { key: 'finance', label: 'Finance', desc: 'Fees, commissions, and financial operations' },
  { key: 'marketing', label: 'Marketing', desc: 'Campaigns, content, and lead generation' },
  { key: 'documents', label: 'Documents', desc: 'Document management and verification' },
  { key: 'system', label: 'System', desc: 'User management, roles, and configuration' },
];

const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Manage', 'Export'];
const KEY_ROLES = ['Super Admin', 'CEO', 'Branch Mgr', 'Counselor', 'App Team', 'Visa Officer', 'Finance', 'Marketing Mgr'];

const PERMISSIONS: Record<string, { action: string; desc: string }[]> = {
  overview: ACTIONS.map(a => ({ action: a, desc: `${a} dashboard and analytics` })),
  students: ACTIONS.map(a => ({ action: a, desc: `${a} student records and profiles` })),
  applications: ACTIONS.map(a => ({ action: a, desc: `${a} applications and pipeline` })),
  finance: ACTIONS.map(a => ({ action: a, desc: `${a} financial records` })),
  marketing: ACTIONS.map(a => ({ action: a, desc: `${a} marketing campaigns` })),
  documents: ACTIONS.map(a => ({ action: a, desc: `${a} documents and uploads` })),
  system: ACTIONS.map(a => ({ action: a, desc: `${a} system configuration` })),
};

const DEFAULT_PERMS: Record<string, boolean[][]> = {
  overview: KEY_ROLES.map(() => [true, true, true, true, true, true]),
  students: KEY_ROLES.map(() => ACTIONS.map(() => true)),
  applications: KEY_ROLES.map(() => ACTIONS.map(() => true)),
  finance: KEY_ROLES.map((_, i) => ACTIONS.map((_, j) => i < 2 || j === 0)),
  marketing: KEY_ROLES.map((_, i) => ACTIONS.map((_, j) => i === 0 || i === 7 || j === 0)),
  documents: KEY_ROLES.map((_, i) => ACTIONS.map((_, j) => i === 0 || j < 4)),
  system: KEY_ROLES.map((_, i) => ACTIONS.map(() => i < 2)),
};

export default function CrmPermissionsPage() {
  const [activeCategory, setActiveCategory] = useState('overview');
  const [permissions, setPermissions] = useState<Record<string, boolean[][]>>({ ...DEFAULT_PERMS });
  const [saved, setSaved] = useState(false);

  const togglePermission = (cat: string, roleIdx: number, actionIdx: number) => {
    setPermissions(prev => {
      const copy = { ...prev };
      copy[cat] = copy[cat].map((row, ri) => ri === roleIdx ? row.map((v, ai) => ai === actionIdx ? !v : v) : [...row]);
      return copy;
    });
    setSaved(false);
  };

  const toggleRole = (cat: string, roleIdx: number, checked: boolean) => {
    setPermissions(prev => ({ ...prev, [cat]: prev[cat].map((row, ri) => ri === roleIdx ? row.map(() => checked) : [...row]) }));
    setSaved(false);
  };

  const handleSave = () => setSaved(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[var(--alo-text)]">Permission Matrix</h1><p className="text-[var(--alo-text-muted)]">Configure role-based access control for all system modules</p></div>
        <div className="flex gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline"><Upload className="w-4 h-4 mr-2" />Import</Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSave}><Save className="w-4 h-4 mr-2" />{saved ? 'Saved!' : 'Save Changes'}</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-[var(--alo-text)]">Access Control Configuration</p>
              <p className="text-sm text-[var(--alo-text-muted)]">Define what each role can do across {CATEGORIES.length} categories and {ACTIONS.length} action types</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-1 bg-[var(--alo-surface-muted)] p-1 rounded-lg">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key} className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs px-3 py-1.5 rounded-md">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map(cat => (
          <TabsContent key={cat.key} value={cat.key} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{cat.label} Permissions</CardTitle>
                <p className="text-sm text-[var(--alo-text-muted)]">{cat.desc}</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-[var(--alo-body)] w-32">
                          <div className="flex items-center gap-1"><Lock className="w-3 h-3" />Action</div>
                        </th>
                        {KEY_ROLES.map(role => (
                          <th key={role} className="p-2 text-center">
                            <label className="flex flex-col items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={permissions[cat.key]?.[KEY_ROLES.indexOf(role)]?.every(Boolean)} onChange={e => toggleRole(cat.key, KEY_ROLES.indexOf(role), e.target.checked)} className="rounded border-[var(--alo-border-strong)]" />
                              <span className="text-[11px] font-medium text-[var(--alo-body)] leading-tight">{role}</span>
                            </label>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(PERMISSIONS[cat.key] || []).map((perm, actionIdx) => (
                        <tr key={actionIdx} className="border-b hover:bg-[var(--alo-page)]">
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              {[Eye, Pencil, Trash2, Lock, Download, Upload][actionIdx] && (() => { const I = [Eye, Pencil, Trash2, Lock, Download, Upload][actionIdx]; return <I className="w-3 h-3 text-[var(--alo-text-muted)]" />; })()}
                              <span className="text-[var(--alo-body)] font-medium">{perm.action}</span>
                            </div>
                            <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">{perm.desc}</p>
                          </td>
                          {KEY_ROLES.map((_, roleIdx) => (
                            <td key={roleIdx} className="p-2 text-center">
                              <input type="checkbox" checked={permissions[cat.key]?.[roleIdx]?.[actionIdx] || false} onChange={() => togglePermission(cat.key, roleIdx, actionIdx)} className="rounded border-[var(--alo-border-strong)] w-4 h-4" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}