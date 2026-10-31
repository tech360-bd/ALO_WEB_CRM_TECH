'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Shield,
  ScrollText,
  UserCog,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  Ban,
  KeyRound,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types — mirror what GET /api/marketing/audit-logs returns. The route merges
// AuditLog rows (id, action, resource, resourceId, details, userId, createdAt)
// with MarketingAuditLog rows (which additionally carry userName and role),
// newest first. Neither source exposes an IP address, so no IP is rendered.
// ---------------------------------------------------------------------------

interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  userId?: string;
  userName?: string;
  role?: string;
  createdAt: string;
  source?: string;
}

// ---------------------------------------------------------------------------
// Types — mirror GET /api/marketing/user-access. MarketingUserAccess stores
// `permissions` as a JSON-encoded string array, so it is parsed before render.
// ---------------------------------------------------------------------------

interface UserAccess {
  id: string;
  userId: string;
  accessLevel: string;
  status: string;
  permissions: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
  } | null;
}

interface DirectoryUser {
  id: string;
  name: string | null;
  email: string | null;
  roles?: Array<{ id?: string; name?: string; label?: string }>;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const ALL_ACTIONS = '__all__';
const ALL_SOURCES = '__all__';

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function parsePermissions(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((entry) => asString(entry)).filter(Boolean);
  } catch {
    // Legacy rows may hold a comma-separated list rather than JSON.
    return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

export default function MarketingAuditAccessView() {
  const [activeTab, setActiveTab] = useState('audit');

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logState, setLogState] = useState<LoadState>({ loading: true, error: null });
  const [actionFilter, setActionFilter] = useState(ALL_ACTIONS);
  const [sourceFilter, setSourceFilter] = useState(ALL_SOURCES);
  const [searchQuery, setSearchQuery] = useState('');

  const [access, setAccess] = useState<UserAccess[]>([]);
  const [accessState, setAccessState] = useState<LoadState>({ loading: true, error: null });
  const [managerCount, setManagerCount] = useState(0);
  const [approvedUserCount, setApprovedUserCount] = useState(0);
  const [maxApprovedUsers, setMaxApprovedUsers] = useState(0);

  const [showAddUser, setShowAddUser] = useState(false);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [directoryAvailable, setDirectoryAvailable] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantLevel, setGrantLevel] = useState('LIMITED');
  const [grantPermissions, setGrantPermissions] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLogState({ loading: true, error: null });
    try {
      const response = await fetch('/api/marketing/audit-logs?take=200');
      if (!response.ok) throw new Error(`Could not load audit logs (HTTP ${response.status})`);
      const payload = await response.json();
      setLogs(Array.isArray(payload?.logs) ? payload.logs : []);
      setLogState({ loading: false, error: null });
    } catch (error) {
      setLogs([]);
      setLogState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load audit logs',
      });
    }
  }, []);

  const loadAccess = useCallback(async () => {
    setAccessState({ loading: true, error: null });
    try {
      const response = await fetch('/api/marketing/user-access');
      if (!response.ok) throw new Error(`Could not load access list (HTTP ${response.status})`);
      const payload = await response.json();
      setAccess(Array.isArray(payload?.access) ? payload.access : []);
      setManagerCount(Number(payload?.managerCount) || 0);
      setApprovedUserCount(Number(payload?.approvedUserCount) || 0);
      setMaxApprovedUsers(Number(payload?.maxApprovedUsers) || 0);
      setAccessState({ loading: false, error: null });
    } catch (error) {
      setAccess([]);
      setAccessState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load access list',
      });
    }
  }, []);

  // The staff directory sits behind ADMIN/SUPER_ADMIN only, while this view is
  // also open to marketing managers. A 403 here is expected, so the grant form
  // falls back to entering the user id directly instead of breaking.
  const loadDirectory = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100');
      if (!response.ok) {
        setDirectory([]);
        setDirectoryAvailable(false);
        return;
      }
      const payload = await response.json();
      const rows = payload?.data?.users;
      setDirectory(Array.isArray(rows) ? rows : []);
      setDirectoryAvailable(true);
    } catch {
      setDirectory([]);
      setDirectoryAvailable(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
    void loadAccess();
  }, [loadLogs, loadAccess]);

  useEffect(() => {
    if (showAddUser && directory.length === 0) void loadDirectory();
  }, [showAddUser, directory.length, loadDirectory]);

  const actionOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort(),
    [logs],
  );

  const sourceOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.source).filter(Boolean))) as string[],
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== ALL_ACTIONS && log.action !== actionFilter) return false;
      if (sourceFilter !== ALL_SOURCES && log.source !== sourceFilter) return false;
      if (!term) return true;
      return [log.action, log.resource, log.resourceId, log.details, log.userName, log.userId]
        .some((value) => asString(value).toLowerCase().includes(term));
    });
  }, [logs, actionFilter, sourceFilter, searchQuery]);

  const activeAccess = useMemo(
    () => access.filter((entry) => entry.status === 'ACTIVE'),
    [access],
  );

  // The permission matrix is derived from the permissions actually stored on
  // each active record. Nothing is inferred, and permissions nobody holds do
  // not appear as rows.
  const permissionRows = useMemo(() => {
    const byPermission = new Map<string, Set<string>>();
    activeAccess.forEach((entry) => {
      const label = entry.user?.name || entry.user?.email || entry.userId;
      parsePermissions(entry.permissions).forEach((permission) => {
        if (!byPermission.has(permission)) byPermission.set(permission, new Set());
        byPermission.get(permission)!.add(label);
      });
    });
    return Array.from(byPermission.entries())
      .map(([permission, holders]) => ({
        permission,
        holders: Array.from(holders),
        holderCount: holders.size,
      }))
      .sort((a, b) => a.permission.localeCompare(b.permission));
  }, [activeAccess]);

  const handleGrant = async () => {
    const userId = grantUserId.trim();
    if (!userId) {
      setSaveError('Select or enter the user to grant access to.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const permissions = grantPermissions
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      const response = await fetch('/api/marketing/user-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accessLevel: grantLevel, permissions }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSaveError(payload?.error || `Could not grant access (HTTP ${response.status})`);
        return;
      }
      setSaveMessage(payload?.message || 'Access granted.');
      setGrantUserId('');
      setGrantPermissions('');
      await loadAccess();
      setTimeout(() => {
        setShowAddUser(false);
        setSaveMessage(null);
      }, 1200);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not grant access');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (entry: UserAccess, status: 'ACTIVE' | 'REVOKED') => {
    setAccessState((current) => ({ ...current, error: null }));
    try {
      const response = await fetch('/api/marketing/user-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAccessState({
          loading: false,
          error: payload?.error || `Could not update access (HTTP ${response.status})`,
        });
        return;
      }
      await loadAccess();
    } catch (error) {
      setAccessState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not update access',
      });
    }
  };

  const accessLevelBadge = (level: string) => {
    const isFull = level === 'FULL';
    return (
      <Badge
        variant="secondary"
        className={cn(
          'text-xs',
          isFull
            ? 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]'
            : 'bg-sky-100 text-sky-700 hover:bg-sky-100',
        )}
      >
        <KeyRound className="mr-1 h-3 w-3" />
        {isFull ? 'Manager' : 'Approved user'}
      </Badge>
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      ACTIVE: { cls: 'bg-crm-success-bg text-crm-success-text hover:bg-crm-success-bg', label: 'Active' },
      REVOKED: { cls: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] hover:bg-[var(--alo-surface-muted)]', label: 'Revoked' },
      SUSPENDED: { cls: 'bg-crm-danger-bg text-crm-danger-text hover:bg-crm-danger-bg', label: 'Suspended' },
    };
    const match = map[status] || { cls: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]', label: status || 'Unknown' };
    return <Badge variant="secondary" className={cn('text-xs', match.cls)}>{match.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Shield className="h-6 w-6 text-primary" />
          Audit Logs &amp; Access Control
        </h1>
        <p className="mt-1 text-muted-foreground">
          Recorded marketing activity and the accounts currently holding marketing access.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="audit" className="gap-2">
            <ScrollText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <UserCog className="h-4 w-4" />
            Access Control
          </TabsTrigger>
        </TabsList>

        {/* ── AUDIT LOGS ── */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Activity log</CardTitle>
                  <CardDescription>
                    Every entry the audit trail has recorded, newest first.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => void loadLogs()}>
                  <RefreshCw className={cn('mr-1 h-4 w-4', logState.loading && 'animate-spin')} />
                  Refresh
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search action, resource, or person"
                    className="pl-8"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[190px]">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ACTIONS}>All actions</SelectItem>
                    {actionOptions.map((action) => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[190px]">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SOURCES}>All sources</SelectItem>
                    {sourceOptions.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-muted-foreground text-xs">
                Showing {filteredLogs.length} of {logs.length} recorded entries
              </p>
            </CardHeader>

            <CardContent>
              {logState.error && (
                <div className="bg-destructive/10 text-destructive mb-4 flex items-start gap-2 rounded-lg p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">{logState.error}</p>
                    <button
                      type="button"
                      className="mt-1 underline underline-offset-2"
                      onClick={() => void loadLogs()}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {logState.loading ? (
                <div className="text-muted-foreground py-10 text-center text-sm">Loading audit logs…</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
                  <ScrollText className="h-8 w-8 opacity-30" />
                  <p className="text-sm">
                    {logs.length === 0
                      ? 'No marketing activity has been recorded yet.'
                      : 'No entries match the current filters.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[170px]">Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Person</TableHead>
                        <TableHead className="w-[150px]">Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={`${log.source || 'log'}-${log.id}`}>
                          <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                            {formatTimestamp(log.createdAt)}
                          </TableCell>
                          <TableCell className="font-medium">{log.action || 'Not specified'}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {log.resource || '—'}
                            {log.resourceId ? <span className="ml-1">#{log.resourceId}</span> : null}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[280px] text-xs">
                            {asString(log.details) || '—'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.userName || log.userId ? (
                              <>
                                <span>{log.userName || 'User'}</span>
                                {log.role ? (
                                  <Badge variant="outline" className="ml-1 text-[11px]">{log.role}</Badge>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-muted-foreground">Not attributed</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {log.source === 'marketingAuditLog' ? 'Marketing audit' : 'System audit'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Entries are read from the platform audit trail. Client IP addresses are not part
                of the marketing audit response, so none are shown. Access-denied attempts are
                recorded as ordinary audit entries rather than in a separate violations list.
              </span>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACCESS CONTROL ── */}
        <TabsContent value="access" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-xs">Marketing managers</p>
                <p className="text-2xl font-bold">{managerCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-xs">Approved users</p>
                <p className="text-2xl font-bold">
                  {approvedUserCount}
                  {maxApprovedUsers > 0 ? <span className="text-muted-foreground text-sm"> / {maxApprovedUsers}</span> : null}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-xs">Records</p>
                <p className="text-2xl font-bold">{access.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Marketing access</CardTitle>
                  <CardDescription>
                    Accounts granted access to the marketing workspace, and what each may do.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void loadAccess()}>
                    <RefreshCw className={cn('mr-1 h-4 w-4', accessState.loading && 'animate-spin')} />
                    Refresh
                  </Button>
                  <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-1 h-4 w-4" />
                        Grant access
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Grant marketing access</DialogTitle>
                        <DialogDescription>
                          Approve an existing staff account for the marketing workspace.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="grant-user">User</Label>
                          {directoryAvailable && directory.length > 0 ? (
                            <Select value={grantUserId} onValueChange={setGrantUserId}>
                              <SelectTrigger id="grant-user">
                                <SelectValue placeholder="Select a staff account" />
                              </SelectTrigger>
                              <SelectContent>
                                {directory.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name || user.email || user.id}
                                    {user.email && user.name ? ` — ${user.email}` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id="grant-user"
                              value={grantUserId}
                              onChange={(event) => setGrantUserId(event.target.value)}
                              placeholder="Staff user ID"
                            />
                          )}
                          <p className="text-muted-foreground text-xs">
                            {directoryAvailable
                              ? 'Choose from the staff accounts available to you.'
                              : 'The staff directory is restricted to administrators. Enter the user ID directly, or ask an administrator to grant this access.'}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="grant-level">Access level</Label>
                          <Select value={grantLevel} onValueChange={setGrantLevel}>
                            <SelectTrigger id="grant-level">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LIMITED">Approved user</SelectItem>
                              <SelectItem value="FULL">Marketing manager</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-muted-foreground text-xs">
                            {maxApprovedUsers > 0
                              ? `Up to ${maxApprovedUsers} approved users may hold access at once.`
                              : 'Approved-user slots are limited; revoke an existing user before adding another.'}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="grant-permissions">Permissions</Label>
                          <Input
                            id="grant-permissions"
                            value={grantPermissions}
                            onChange={(event) => setGrantPermissions(event.target.value)}
                            placeholder="e.g. view-leads, respond-whatsapp"
                          />
                          <p className="text-muted-foreground text-xs">
                            Comma-separated capability keys. Leave blank to grant the level&apos;s
                            default access only.
                          </p>
                        </div>

                        {saveError && (
                          <p className="text-destructive text-sm">{saveError}</p>
                        )}
                        {saveMessage && (
                          <p className="text-sm text-crm-success-text">{saveMessage}</p>
                        )}
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddUser(false)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => void handleGrant()} disabled={saving}>
                          {saving ? 'Granting…' : 'Grant access'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {accessState.error && (
                <div className="bg-destructive/10 text-destructive mb-4 flex items-start gap-2 rounded-lg p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">{accessState.error}</p>
                    <button
                      type="button"
                      className="mt-1 underline underline-offset-2"
                      onClick={() => void loadAccess()}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {accessState.loading ? (
                <div className="text-muted-foreground py-10 text-center text-sm">Loading access list…</div>
              ) : access.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
                  <UserCog className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No marketing access has been granted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="w-[130px]">Role</TableHead>
                        <TableHead className="w-[150px]">Access level</TableHead>
                        <TableHead className="w-[110px]">Status</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead className="w-[170px]">Approved</TableHead>
                        <TableHead className="w-[120px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {access.map((entry) => {
                        const permissions = parsePermissions(entry.permissions);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <p className="font-medium">
                                {entry.user?.name || 'Unnamed account'}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {entry.user?.email || entry.userId}
                              </p>
                            </TableCell>
                            <TableCell className="text-xs">
                              {entry.user?.role || 'Not specified'}
                            </TableCell>
                            <TableCell>{accessLevelBadge(entry.accessLevel)}</TableCell>
                            <TableCell>{statusBadge(entry.status)}</TableCell>
                            <TableCell>
                              {permissions.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {permissions.map((permission) => (
                                    <Badge key={permission} variant="outline" className="text-[11px]">
                                      {permission}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  Level default — no explicit permissions
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatTimestamp(entry.approvedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.status === 'ACTIVE' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => void handleStatusChange(entry, 'REVOKED')}
                                >
                                  <Ban className="mr-1 h-3.5 w-3.5" />
                                  Revoke
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleStatusChange(entry, 'ACTIVE')}
                                >
                                  Restore
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permission matrix</CardTitle>
              <CardDescription>
                Derived from the permissions stored on each active access record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionRows.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {activeAccess.length === 0
                    ? 'No active access records hold explicit permissions.'
                    : 'Active records carry no explicit permissions — they use their access level default.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission</TableHead>
                        <TableHead className="w-[100px]">Holders</TableHead>
                        <TableHead>Accounts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissionRows.map((row) => (
                        <TableRow key={row.permission}>
                          <TableCell className="font-medium">{row.permission}</TableCell>
                          <TableCell>{row.holderCount}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {row.holders.join(', ')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
