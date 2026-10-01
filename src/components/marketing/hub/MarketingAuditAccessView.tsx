'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  ScrollText,
  UserCog,
  Download,
  Search,
  Filter,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Smartphone,
  Eye,
  EyeOff,
  Globe,
  FileText,
  Bot,
  Users,
  Settings,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  resource: string;
  details: string;
  ip: string;
  severity: 'info' | 'warning' | 'critical';
}

interface MarketingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  lastLogin: string;
}

interface PermissionEntry {
  permission: string;
  manager: boolean;
  staff1: boolean;
  staff2: boolean;
  staff3: boolean;
}

interface AccessViolation {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const auditLogs: AuditLog[] = [
  { id: 'AL-001', timestamp: '2025-01-15 14:23:01', user: 'Rakib Hasan', role: 'Marketing Manager', action: 'Post Approved', resource: 'Facebook Post #2847', details: 'Approved UK Spring intake post for scheduled publishing', ip: '103.28.147.52', severity: 'info' },
  { id: 'AL-002', timestamp: '2025-01-15 14:18:45', user: 'Rakib Hasan', role: 'Marketing Manager', action: 'Campaign Created', resource: 'Campaign C-007', details: 'Created new Germany Work Visa campaign with \u09f32,50,000 budget', ip: '103.28.147.52', severity: 'info' },
  { id: 'AL-003', timestamp: '2025-01-15 13:55:12', user: 'Nusrat Jahan', role: 'Marketing Staff', action: 'Lead Converted', resource: 'Lead L-4821', details: 'Converted hot lead Md. Arif to paid client for Canada PR', ip: '103.28.147.48', severity: 'info' },
  { id: 'AL-004', timestamp: '2025-01-15 13:42:30', user: 'Tanvir Ahmed', role: 'Marketing Staff', action: 'Social Login', resource: 'Instagram Business', details: 'Logged into ALO Education Instagram via OAuth token', ip: '103.28.147.50', severity: 'info' },
  { id: 'AL-005', timestamp: '2025-01-15 13:30:08', user: 'Rakib Hasan', role: 'Marketing Manager', action: 'AI Config', resource: 'WhatsApp Bot', details: 'Updated AI response threshold from 0.85 to 0.90 confidence', ip: '103.28.147.52', severity: 'warning' },
  { id: 'AL-006', timestamp: '2025-01-15 12:55:44', user: 'System', role: 'Automated', action: 'SLA Event', resource: 'Conversation W-2891', details: 'SLA breach detected: initial response exceeded 5 min for WhatsApp lead', ip: '\u2014', severity: 'critical' },
  { id: 'AL-007', timestamp: '2025-01-15 12:40:22', user: 'Fahim Rahman', role: 'Marketing Staff', action: 'Document Upload', resource: 'Campaign Assets', details: 'Uploaded 12 creative assets for Schengen Visa campaign', ip: '103.28.147.49', severity: 'info' },
  { id: 'AL-008', timestamp: '2025-01-15 12:15:33', user: 'Rakib Hasan', role: 'Marketing Manager', action: 'Conversation Assign', resource: 'W-2901, W-2902, W-2903', details: 'Bulk assigned 3 high-priority WhatsApp conversations to Nusrat', ip: '103.28.147.52', severity: 'info' },
  { id: 'AL-009', timestamp: '2025-01-15 11:50:18', user: 'Nusrat Jahan', role: 'Marketing Staff', action: 'Post Approved', resource: 'Instagram Story #921', details: 'Approved student testimonial story for Instagram', ip: '103.28.147.48', severity: 'info' },
  { id: 'AL-010', timestamp: '2025-01-15 11:30:05', user: 'Tanvir Ahmed', role: 'Marketing Staff', action: 'Campaign Created', resource: 'Campaign C-008', details: 'Drafted Japan Student Visa awareness campaign', ip: '103.28.147.50', severity: 'info' },
  { id: 'AL-011', timestamp: '2025-01-15 11:10:42', user: 'System', role: 'Automated', action: 'SLA Event', resource: 'Conversation F-187', details: 'Auto-escalated: follow-up overdue 2hrs for Facebook lead', ip: '\u2014', severity: 'warning' },
  { id: 'AL-012', timestamp: '2025-01-15 10:55:30', user: 'Fahim Rahman', role: 'Marketing Staff', action: 'Document Upload', resource: 'Lead Docs L-4815', details: 'Uploaded IELTS scorecard and passport copy for lead processing', ip: '103.28.147.49', severity: 'info' },
  { id: 'AL-013', timestamp: '2025-01-15 10:40:15', user: 'Rakib Hasan', role: 'Marketing Manager', action: 'AI Config', resource: 'Lead Scoring', details: 'Modified hot lead scoring weights: engagement +15%, budget +10%', ip: '103.28.147.52', severity: 'warning' },
  { id: 'AL-014', timestamp: '2025-01-15 10:05:33', user: 'Unknown User', role: 'Unauthorised', action: 'Social Login', resource: 'Facebook Page Admin', details: 'FAILED login attempt with invalid credentials from unknown IP', ip: '45.155.22.11', severity: 'critical' },
  { id: 'AL-015', timestamp: '2025-01-15 10:05:33', user: 'Nusrat Jahan', role: 'Marketing Staff', action: 'Conversation Assign', resource: 'W-2895', details: 'Self-assigned urgent visa query from WhatsApp', ip: '103.28.147.48', severity: 'info' },
  { id: 'AL-016', timestamp: '2025-01-15 09:45:22', user: 'Tanvir Ahmed', role: 'Marketing Staff', action: 'Post Approved', resource: 'Facebook Post #2848', details: 'Approved Australia university partner spotlight post', ip: '103.28.147.50', severity: 'info' },
  { id: 'AL-017', timestamp: '2025-01-15 09:30:10', user: 'System', role: 'Automated', action: 'SLA Event', resource: 'Conversation E-044', details: 'Email lead SLA breach: 24hr document collection deadline missed', ip: '\u2014', severity: 'critical' },
  { id: 'AL-018', timestamp: '2025-01-15 09:15:45', user: 'Fahim Rahman', role: 'Marketing Staff', action: 'Lead Converted', resource: 'Lead L-4819', details: 'Converted referral lead to enrolment for UK September intake', ip: '103.28.147.49', severity: 'info' },
];

const marketingUsers: MarketingUser[] = [
  {
    id: 'MU-001', name: 'Rakib Hasan', email: 'rakib@aloeducation.com.bd',
    role: 'Marketing Manager', status: 'active', permissions: ['Full Access'], lastLogin: '2025-01-15 14:23:01',
  },
  {
    id: 'MU-002', name: 'Nusrat Jahan', email: 'nusrat@aloeducation.com.bd',
    role: 'Marketing Staff', status: 'active',
    permissions: ['View Leads', 'Respond WhatsApp', 'Approve Posts', 'Upload Documents', 'View Reports'],
    lastLogin: '2025-01-15 13:55:12',
  },
  {
    id: 'MU-003', name: 'Tanvir Ahmed', email: 'tanvir@aloeducation.com.bd',
    role: 'Marketing Staff', status: 'active',
    permissions: ['View Leads', 'Respond WhatsApp', 'Approve Posts', 'Create Campaigns', 'View Reports'],
    lastLogin: '2025-01-15 13:42:30',
  },
  {
    id: 'MU-004', name: 'Fahim Rahman', email: 'fahim@aloeducation.com.bd',
    role: 'Marketing Staff', status: 'active',
    permissions: ['View Leads', 'Respond WhatsApp', 'Upload Documents', 'View Reports'],
    lastLogin: '2025-01-15 12:40:22',
  },
];

const permissionMatrix: PermissionEntry[] = [
  { permission: 'View Dashboard & Analytics', manager: true, staff1: true, staff2: true, staff3: true },
  { permission: 'Create Campaigns', manager: true, staff1: false, staff2: true, staff3: false },
  { permission: 'Edit Campaigns', manager: true, staff1: false, staff2: false, staff3: false },
  { permission: 'Delete Campaigns', manager: true, staff1: false, staff2: false, staff3: false },
  { permission: 'Approve Social Posts', manager: true, staff1: true, staff2: true, staff3: false },
  { permission: 'Publish Posts', manager: true, staff1: true, staff2: true, staff3: false },
  { permission: 'View All Leads', manager: true, staff1: true, staff2: true, staff3: true },
  { permission: 'Convert Leads', manager: true, staff1: true, staff2: false, staff3: true },
  { permission: 'Delete Leads', manager: true, staff1: false, staff2: false, staff3: false },
  { permission: 'Respond via WhatsApp', manager: true, staff1: true, staff2: true, staff3: true },
  { permission: 'Respond via Email', manager: true, staff1: true, staff2: false, staff3: true },
  { permission: 'Respond via SMS', manager: true, staff1: false, staff2: false, staff3: false },
  { permission: 'Upload Documents', manager: true, staff1: true, staff2: false, staff3: true },
  { permission: 'AI Configuration', manager: true, staff1: false, staff2: false, staff3: false },
  { permission: 'Access Control Management', manager: true, staff1: false, staff2: false, staff3: false },
  { permission: 'View Audit Logs', manager: true, staff1: false, staff2: false, staff3: false },
  { permission: 'Export Data', manager: true, staff1: false, staff2: true, staff3: false },
  { permission: 'Manage SLA Settings', manager: true, staff1: false, staff2: false, staff3: false },
];

const accessViolations: AccessViolation[] = [
  { id: 'AV-001', timestamp: '2025-01-15 10:05:22', user: 'Unknown (45.155.22.11)', action: 'Login Attempt', resource: 'Facebook Page Admin', severity: 'high', resolved: false },
  { id: 'AV-002', timestamp: '2025-01-14 18:30:15', user: 'Tanvir Ahmed', action: 'Delete Attempt', resource: 'Campaign C-002', severity: 'medium', resolved: true },
  { id: 'AV-003', timestamp: '2025-01-14 15:12:44', user: 'Fahim Rahman', action: 'AI Config Access', resource: 'WhatsApp Bot Settings', severity: 'low', resolved: true },
  { id: 'AV-004', timestamp: '2025-01-13 22:45:08', user: 'Unknown (192.168.1.105)', action: 'API Access', resource: 'Lead Database Export', severity: 'high', resolved: false },
  { id: 'AV-005', timestamp: '2025-01-13 14:20:33', user: 'Nusrat Jahan', action: 'SMS Send Attempt', resource: 'Bulk SMS Module', severity: 'low', resolved: true },
];

const actionOptions = [
  'All Actions', 'Post Approved', 'Campaign Created', 'Lead Converted',
  'Social Login', 'AI Config', 'SLA Event', 'Document Upload', 'Conversation Assign',
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MarketingAuditAccessView() {
  const [activeTab, setActiveTab] = useState('audit');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [userFilter, setUserFilter] = useState('All Users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('staff');
  const [exporting, setExporting] = useState(false);
  const [permissions, setPermissions] = useState(permissionMatrix);

  const togglePermission = (idx: number, field: 'staff1' | 'staff2' | 'staff3') => {
    setPermissions((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: !p[field] } : p))
    );
  };

  const uniqueUsers = useMemo(
    () => ['All Users', ...Array.from(new Set(auditLogs.map((l) => l.user)))],
    []
  );

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        searchQuery === '' ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAction = actionFilter === 'All Actions' || log.action === actionFilter;
      const matchUser = userFilter === 'All Users' || log.user === userFilter;
      return matchSearch && matchAction && matchUser;
    });
  }, [searchQuery, actionFilter, userFilter]);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 1500);
  };

  const severityBadge = (severity: 'info' | 'warning' | 'critical') => {
    const map = {
      info: { cls: 'bg-sky-100 text-sky-700 hover:bg-sky-100', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      warning: { cls: 'bg-amber-100 text-amber-700 hover:bg-amber-100', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      critical: { cls: 'bg-red-100 text-red-700 hover:bg-red-100', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    const m = map[severity];
    return <Badge variant="secondary" className={cn('text-xs', m.cls)}>{m.icon}{severity}</Badge>;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      active: { cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100', label: 'Active' },
      inactive: { cls: 'bg-gray-100 text-gray-600 hover:bg-gray-100', label: 'Inactive' },
      suspended: { cls: 'bg-red-100 text-red-700 hover:bg-red-100', label: 'Suspended' },
    };
    const m = map[status] || map.active;
    return <Badge variant="secondary" className={cn('text-xs', m.cls)}>{m.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Audit Logs & Access Control
        </h1>
        <p className="text-muted-foreground mt-1">
          ALO Education \u2014 security audit trail and marketing team access management
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="audit" className="gap-2">
            <ScrollText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <UserCog className="h-4 w-4" />
            Access Control
          </TabsTrigger>
        </TabsList>

        {/* AUDIT LOGS TAB */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs by user, resource, or details..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter action" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter user" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueUsers.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 shrink-0" onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-sky-500" />
                    Audit Trail
                  </CardTitle>
                  <CardDescription>
                    Showing {filteredLogs.length} of {auditLogs.length} log entries
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[140px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead className="min-w-[250px]">Details</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead className="text-center">Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className={cn(log.severity === 'critical' && 'bg-red-50/50')}>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {log.timestamp}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{log.user}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">{log.role}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">{log.action}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.resource}</TableCell>
                        <TableCell className="text-xs max-w-[280px] truncate" title={log.details}>
                          {log.details}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{log.ip}</TableCell>
                        <TableCell className="text-center">{severityBadge(log.severity)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No audit logs match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACCESS CONTROL TAB */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    Marketing Team Members
                  </CardTitle>
                  <CardDescription>
                    Manager has full permissions. Staff have limited, role-specific access.
                  </CardDescription>
                </div>
                <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                  <DialogTrigger asChild>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Marketing User</DialogTitle>
                      <DialogDescription>
                        Add a new team member with limited marketing permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-name">Full Name</Label>
                        <Input id="new-name" placeholder="e.g. Kamal Hossain" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-email">Email Address</Label>
                        <Input id="new-email" type="email" placeholder="e.g. kamal@aloeducation.com.bd" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-role">Role</Label>
                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                          <SelectTrigger id="new-role"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Marketing Staff</SelectItem>
                            <SelectItem value="viewer">Marketing Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
                      <Button onClick={() => setShowAddUser(false)}>Add User</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(user.role === 'Marketing Manager' && 'bg-violet-100 text-violet-700 border-violet-200')}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.map((p, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{p}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{user.lastLogin}</TableCell>
                        <TableCell className="text-center">{statusBadge(user.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-pink-500" />
                Official Social Media Access
              </CardTitle>
              <CardDescription>
                Only Manager and designated staff can access company social media accounts. Other employees have NO access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-center"><Facebook className="h-4 w-4 mx-auto" /></TableHead>
                      <TableHead className="text-center"><Instagram className="h-4 w-4 mx-auto" /></TableHead>
                      <TableHead className="text-center"><MessageCircle className="h-4 w-4 mx-auto" /></TableHead>
                      <TableHead className="text-center"><Mail className="h-4 w-4 mx-auto" /></TableHead>
                      <TableHead className="text-center"><Smartphone className="h-4 w-4 mx-auto" /></TableHead>
                      <TableHead className="text-center">Access Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-violet-50/50">
                      <TableCell className="font-medium">Rakib Hasan <Badge variant="outline" className="ml-1 text-[10px]">Manager</Badge></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Full Access</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Nusrat Jahan <Badge variant="outline" className="ml-1 text-[10px]">Staff</Badge></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-amber-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-amber-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><MessageCircle className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-amber-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><EyeOff className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Limited</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tanvir Ahmed <Badge variant="outline" className="ml-1 text-[10px]">Staff</Badge></TableCell>
                      <TableCell className="text-center"><Eye className="h-4 w-4 text-amber-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><EyeOff className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><MessageCircle className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><EyeOff className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><EyeOff className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Limited</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Fahim Rahman <Badge variant="outline" className="ml-1 text-[10px]">Staff</Badge></TableCell>
                      <TableCell className="text-center"><EyeOff className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><EyeOff className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><MessageCircle className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Mail className="h-4 w-4 text-emerald-600 mx-auto" /></TableCell>
                      <TableCell className="text-center"><EyeOff className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Limited</Badge></TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-medium text-muted-foreground">Other Employees</TableCell>
                      <TableCell className="text-center"><Lock className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Lock className="h-4 w-4 text-red-400 mx-auto" /></TableCell>
                      <TableCell className="text-center"><MessageCircle className="h-4 w-4 text-emerald-500 mx-auto" aria-label="Own WhatsApp only" /></TableCell>
                      <TableCell className="text-center"><Mail className="h-4 w-4 text-emerald-500 mx-auto" aria-label="Own email only" /></TableCell>
                      <TableCell className="text-center"><Smartphone className="h-4 w-4 text-emerald-500 mx-auto" aria-label="Own SMS only" /></TableCell>
                      <TableCell className="text-center"><Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">NO Access</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <Lock className="h-3 w-3 inline mr-1" />Non-marketing employees can only access their own personal WhatsApp, email, and SMS \u2014 never company social media accounts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                Permission Matrix
              </CardTitle>
              <CardDescription>
                Toggle permissions for each marketing staff member. Manager permissions are fixed (full access).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[220px]">Permission</TableHead>
                      <TableHead className="text-center">Manager</TableHead>
                      <TableHead className="text-center">Nusrat J.</TableHead>
                      <TableHead className="text-center">Tanvir A.</TableHead>
                      <TableHead className="text-center">Fahim R.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((perm, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm font-medium">{perm.permission}</TableCell>
                        <TableCell className="text-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch checked={perm.staff1} onCheckedChange={() => togglePermission(idx, 'staff1')} className="data-[state=checked]:bg-emerald-600" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch checked={perm.staff2} onCheckedChange={() => togglePermission(idx, 'staff2')} className="data-[state=checked]:bg-emerald-600" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch checked={perm.staff3} onCheckedChange={() => togglePermission(idx, 'staff3')} className="data-[state=checked]:bg-emerald-600" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Access Violation Log
              </CardTitle>
              <CardDescription>Record of unauthorized or flagged access attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead className="text-center">Severity</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessViolations.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{v.timestamp}</TableCell>
                        <TableCell className="font-medium">{v.user}</TableCell>
                        <TableCell>{v.action}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{v.resource}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={cn(
                            'text-xs',
                            v.severity === 'high' && 'bg-red-100 text-red-700 hover:bg-red-100',
                            v.severity === 'medium' && 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                            v.severity === 'low' && 'bg-sky-100 text-sky-700 hover:bg-sky-100',
                          )}>{v.severity}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {v.resolved ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Resolved
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 text-xs gap-1">
                              <XCircle className="h-3 w-3" /> Open
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
