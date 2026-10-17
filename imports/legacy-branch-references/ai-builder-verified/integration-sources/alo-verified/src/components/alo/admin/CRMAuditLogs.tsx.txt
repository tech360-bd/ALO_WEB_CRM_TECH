'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Shield, Search, Download, Clock, User, AlertTriangle, Eye, Filter, Activity
} from 'lucide-react'
import { toast } from 'sonner'

// ── Brand colors ──
const ORANGE = '#F37021'
const NAVY = '#1A2332'
const BLUE = '#0066CC'

// ── Types ──
type ActionType = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'reject'
type ModuleType = 'Auth' | 'Students' | 'Partners' | 'Applications' | 'Finance' | 'HR' | 'Marketing' | 'Settings' | 'Visa' | 'WhatsApp'

interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  userName: string
  userAvatar: string
  action: ActionType
  module: ModuleType
  description: string
  ipAddress: string
  userAgent: string
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
}

// ── Action color map ──
const actionColorMap: Record<ActionType, { bg: string; text: string; border: string }> = {
  create:  { bg: 'bg-emerald-50 dark:bg-emerald-950/40',  text: 'text-emerald-700 dark:text-emerald-300',  border: 'border-emerald-200 dark:border-emerald-800' },
  update:  { bg: 'bg-blue-50 dark:bg-blue-950/40',        text: 'text-blue-700 dark:text-blue-300',        border: 'border-blue-200 dark:border-blue-800' },
  delete:  { bg: 'bg-red-50 dark:bg-red-950/40',          text: 'text-red-700 dark:text-red-300',          border: 'border-red-200 dark:border-red-800' },
  login:   { bg: 'bg-violet-50 dark:bg-violet-950/40',    text: 'text-violet-700 dark:text-violet-300',    border: 'border-violet-200 dark:border-violet-800' },
  logout:  { bg: 'bg-gray-50 dark:bg-gray-950/40',        text: 'text-gray-700 dark:text-gray-300',        border: 'border-gray-200 dark:border-gray-800' },
  approve: { bg: 'bg-teal-50 dark:bg-teal-950/40',        text: 'text-teal-700 dark:text-teal-300',        border: 'border-teal-200 dark:border-teal-800' },
  reject:  { bg: 'bg-orange-50 dark:bg-orange-950/40',    text: 'text-orange-700 dark:text-orange-300',    border: 'border-orange-200 dark:border-orange-800' },
}

const actionIconMap: Record<ActionType, string> = {
  create: '+',
  update: '✎',
  delete: '✕',
  login: '→',
  logout: '←',
  approve: '✓',
  reject: '✗',
}

// ── Mock Data (30 entries) ──
const now = new Date()
const h = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000)

const MOCK_LOGS: AuditLog[] = [
  { id: 'log-001', timestamp: h(0.5),  userId: 'u1', userName: 'Ahmed Al-Rashid', userAvatar: 'AR', action: 'login',   module: 'Auth',         description: 'User logged in from Chrome on Windows', ipAddress: '192.168.1.45',  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: null, newValues: null },
  { id: 'log-002', timestamp: h(1),    userId: 'u1', userName: 'Ahmed Al-Rashid', userAvatar: 'AR', action: 'create',  module: 'Students',     description: 'Created new student record for Fatima Hassan', ipAddress: '192.168.1.45', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: null, newValues: { name: 'Fatima Hassan', email: 'fatima@example.com', nationality: 'UAE' } },
  { id: 'log-003', timestamp: h(1.5),  userId: 'u2', userName: 'Sarah Chen',      userAvatar: 'SC', action: 'update',  module: 'Applications', description: 'Updated application status for APP-2024-089 from "Pending" to "Under Review"', ipAddress: '10.0.0.23',    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/17.2', oldValues: { status: 'Pending' }, newValues: { status: 'Under Review' } },
  { id: 'log-004', timestamp: h(2),    userId: 'u3', userName: 'James Mitchell',   userAvatar: 'JM', action: 'delete',  module: 'Marketing',    description: 'Deleted campaign "Summer 2024 Promo" (MKT-045)', ipAddress: '10.0.0.67',    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/121.0', oldValues: { campaignId: 'MKT-045', name: 'Summer 2024 Promo' }, newValues: null },
  { id: 'log-005', timestamp: h(2.5),  userId: 'u4', userName: 'Priya Sharma',     userAvatar: 'PS', action: 'approve', module: 'Finance',       description: 'Approved commission payment of AED 15,000 for partner Gulf Education', ipAddress: '10.0.0.89',    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/121.0', oldValues: { status: 'Pending' }, newValues: { status: 'Approved', amount: 15000 } },
  { id: 'log-006', timestamp: h(3),    userId: 'u5', userName: 'Omar Khalil',      userAvatar: 'OK', action: 'create',  module: 'Partners',     description: 'Registered new partner agency "Bright Futures Consultancy"', ipAddress: '192.168.2.10',  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: null, newValues: { name: 'Bright Futures Consultancy', country: 'Jordan', type: 'Premium' } },
  { id: 'log-007', timestamp: h(3.5),  userId: 'u2', userName: 'Sarah Chen',      userAvatar: 'SC', action: 'reject',  module: 'Applications', description: 'Rejected application APP-2024-072 due to incomplete documentation', ipAddress: '10.0.0.23',    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/17.2', oldValues: { status: 'Under Review' }, newValues: { status: 'Rejected', reason: 'Incomplete documentation' } },
  { id: 'log-008', timestamp: h(4),    userId: 'u6', userName: 'Lisa Wang',        userAvatar: 'LW', action: 'update',  module: 'Visa',         description: 'Updated visa status for student Li Wei from "Processing" to "Approved"', ipAddress: '10.0.0.34',    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/122.0', oldValues: { visaStatus: 'Processing' }, newValues: { visaStatus: 'Approved' } },
  { id: 'log-009', timestamp: h(4.5),  userId: 'u7', userName: 'Raj Patel',        userAvatar: 'RP', action: 'login',   module: 'Auth',         description: 'User logged in from Firefox on macOS', ipAddress: '192.168.1.78',  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Firefox/122.0', oldValues: null, newValues: null },
  { id: 'log-010', timestamp: h(5),    userId: 'u1', userName: 'Ahmed Al-Rashid', userAvatar: 'AR', action: 'update',  module: 'Settings',     description: 'Updated system email template for application confirmation', ipAddress: '192.168.1.45',  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: { template: 'old_confirmation_template' }, newValues: { template: 'new_confirmation_template_v2' } },
  { id: 'log-011', timestamp: h(5.5),  userId: 'u3', userName: 'James Mitchell',  userAvatar: 'JM', action: 'create',  module: 'HR',           description: 'Added new employee record for Maria Garcia - Marketing Executive', ipAddress: '10.0.0.67',    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/121.0', oldValues: null, newValues: { name: 'Maria Garcia', role: 'Marketing Executive', department: 'Marketing' } },
  { id: 'log-012', timestamp: h(6),    userId: 'u4', userName: 'Priya Sharma',    userAvatar: 'PS', action: 'update',  module: 'Finance',      description: 'Updated invoice INV-2024-334 payment status to "Paid"', ipAddress: '10.0.0.89',    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/121.0', oldValues: { paymentStatus: 'Unpaid' }, newValues: { paymentStatus: 'Paid', paidDate: now.toISOString() } },
  { id: 'log-013', timestamp: h(6.5),  userId: 'u8', userName: 'Nina Kowalski',   userAvatar: 'NK', action: 'create',  module: 'WhatsApp',     description: 'Sent WhatsApp template message "Welcome" to 15 prospective students', ipAddress: '10.0.0.112',   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: null, newValues: { template: 'Welcome', recipientCount: 15 } },
  { id: 'log-014', timestamp: h(7),    userId: 'u5', userName: 'Omar Khalil',     userAvatar: 'OK', action: 'logout',  module: 'Auth',         description: 'User logged out', ipAddress: '192.168.2.10',  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: null, newValues: null },
  { id: 'log-015', timestamp: h(8),    userId: 'u6', userName: 'Lisa Wang',       userAvatar: 'LW', action: 'update',  module: 'Students',     description: 'Updated contact information for student Zhang Wei', ipAddress: '10.0.0.34',    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/122.0', oldValues: { phone: '+86-138-0000-0000' }, newValues: { phone: '+86-139-1234-5678' } },
  { id: 'log-016', timestamp: h(9),    userId: 'u2', userName: 'Sarah Chen',      userAvatar: 'SC', action: 'create',  module: 'Applications', description: 'Submitted new application APP-2024-092 for University of Melbourne - B.Computer Science', ipAddress: '10.0.0.23',    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/17.2', oldValues: null, newValues: { appId: 'APP-2024-092', university: 'University of Melbourne', course: 'B.Computer Science' } },
  { id: 'log-017', timestamp: h(10),   userId: 'u7', userName: 'Raj Patel',       userAvatar: 'RP', action: 'delete',  module: 'Marketing',    description: 'Deleted expired promotional banner "Early Bird 2023"', ipAddress: '192.168.1.78',  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Firefox/122.0', oldValues: { bannerId: 'BNR-023', name: 'Early Bird 2023' }, newValues: null },
  { id: 'log-018', timestamp: h(11),   userId: 'u1', userName: 'Ahmed Al-Rashid', userAvatar: 'AR', action: 'approve', module: 'Visa',         description: 'Approved visa application for student Fatima Hassan (VIS-2024-156)', ipAddress: '192.168.1.45',  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: { status: 'Pending Review' }, newValues: { status: 'Approved' } },
  { id: 'log-019', timestamp: h(12),   userId: 'u9', userName: 'Carlos Rivera',   userAvatar: 'CR', action: 'login',   module: 'Auth',         description: 'User logged in from Safari on iPhone', ipAddress: '10.0.0.156',   userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2) Safari/604.1', oldValues: null, newValues: null },
  { id: 'log-020', timestamp: h(13),   userId: 'u3', userName: 'James Mitchell',  userAvatar: 'JM', action: 'create',  module: 'Marketing',    description: 'Created new email campaign "Spring Intake 2025" targeting 500 leads', ipAddress: '10.0.0.67',    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/121.0', oldValues: null, newValues: { campaignName: 'Spring Intake 2025', targetCount: 500, channel: 'Email' } },
  { id: 'log-021', timestamp: h(14),   userId: 'u4', userName: 'Priya Sharma',    userAvatar: 'PS', action: 'update',  module: 'Partners',     description: 'Updated partner agreement terms for "Global Education Services"', ipAddress: '10.0.0.89',    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/121.0', oldValues: { commissionRate: '15%' }, newValues: { commissionRate: '18%' } },
  { id: 'log-022', timestamp: h(15),   userId: 'u10', userName: 'Emily Torres',   userAvatar: 'ET', action: 'reject',  module: 'Finance',      description: 'Rejected expense claim EXP-2024-089 - amount exceeds approval limit', ipAddress: '10.0.0.201',   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: { status: 'Submitted' }, newValues: { status: 'Rejected', reason: 'Exceeds approval limit' } },
  { id: 'log-023', timestamp: h(16),   userId: 'u5', userName: 'Omar Khalil',     userAvatar: 'OK', action: 'update',  module: 'Applications', description: 'Updated student documents for APP-2024-065 - uploaded new passport copy', ipAddress: '192.168.2.10',  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: { documentsCount: 5 }, newValues: { documentsCount: 6 } },
  { id: 'log-024', timestamp: h(18),   userId: 'u6', userName: 'Lisa Wang',       userAvatar: 'LW', action: 'create',  module: 'Visa',         description: 'Initiated visa application for student Chen Ming (VIS-2024-178)', ipAddress: '10.0.0.34',    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/122.0', oldValues: null, newValues: { visaId: 'VIS-2024-178', studentName: 'Chen Ming', destination: 'UK' } },
  { id: 'log-025', timestamp: h(20),   userId: 'u8', userName: 'Nina Kowalski',   userAvatar: 'NK', action: 'logout',  module: 'Auth',         description: 'User logged out after 4h session', ipAddress: '10.0.0.112',   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: null, newValues: null },
  { id: 'log-026', timestamp: h(22),   userId: 'u9', userName: 'Carlos Rivera',   userAvatar: 'CR', action: 'update',  module: 'HR',           description: 'Updated leave request LV-2024-034 status from "Pending" to "Approved"', ipAddress: '10.0.0.156',   userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2) Safari/604.1', oldValues: { leaveStatus: 'Pending' }, newValues: { leaveStatus: 'Approved' } },
  { id: 'log-027', timestamp: h(24),   userId: 'u1', userName: 'Ahmed Al-Rashid', userAvatar: 'AR', action: 'delete',  module: 'Students',     description: 'Archived inactive student record STU-2022-012 (no activity 24+ months)', ipAddress: '192.168.1.45',  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', oldValues: { studentId: 'STU-2022-012', status: 'Inactive' }, newValues: null },
  { id: 'log-028', timestamp: h(26),   userId: 'u2', userName: 'Sarah Chen',      userAvatar: 'SC', action: 'create',  module: 'WhatsApp',     description: 'Created new WhatsApp template "Document Reminder" for pending uploads', ipAddress: '10.0.0.23',    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/17.2', oldValues: null, newValues: { templateName: 'Document Reminder', language: 'en', category: 'UTILITY' } },
  { id: 'log-029', timestamp: h(28),   userId: 'u7', userName: 'Raj Patel',       userAvatar: 'RP', action: 'approve', module: 'Applications', description: 'Approved application APP-2024-085 for University of Toronto', ipAddress: '192.168.1.78',  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Firefox/122.0', oldValues: { status: 'Under Review' }, newValues: { status: 'Approved' } },
  { id: 'log-030', timestamp: h(30),   userId: 'u10', userName: 'Emily Torres',   userAvatar: 'ET', action: 'login',   module: 'Auth',         description: 'User logged in from Chrome on macOS', ipAddress: '10.0.0.201',   userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/121.0', oldValues: null, newValues: null },
]

// ── Failed login attempts for security alerts ──
const SECURITY_ALERTS = [
  { id: 'sec-001', timestamp: h(1.2), ipAddress: '203.45.67.89', attempt: 'Failed login for admin@alo.com (3 attempts in 5 min)', country: 'Unknown' },
  { id: 'sec-002', timestamp: h(7.5), ipAddress: '185.92.34.11', attempt: 'Failed login for sarah.chen@alo.com (2 attempts)', country: 'Unknown' },
  { id: 'sec-003', timestamp: h(14),  ipAddress: '91.108.56.22', attempt: 'Failed login for root@alo.com - account does not exist', country: 'Unknown' },
]

// ── All modules and actions ──
const ALL_MODULES: ModuleType[] = ['Auth', 'Students', 'Partners', 'Applications', 'Finance', 'HR', 'Marketing', 'Settings', 'Visa', 'WhatsApp']
const ALL_ACTIONS: ActionType[] = ['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject']

// ── Unique users from mock data ──
const UNIQUE_USERS = Array.from(new Set(MOCK_LOGS.map(l => l.userId))).map(uid => {
  const log = MOCK_LOGS.find(l => l.userId === uid)!
  return { id: uid, name: log.userName, avatar: log.userAvatar }
})

// ── Helpers ──
function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function formatDateTime(d: Date): string {
  return `${formatDate(d)} ${formatTime(d)}`
}
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ── Component ──
export default function CRMAuditLogs() {
  // Filters
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showFilters, setShowFilters] = useState(true)

  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Filtered data
  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter(log => {
      // Date range
      if (dateFrom && toISODate(log.timestamp) < dateFrom) return false
      if (dateTo && toISODate(log.timestamp) > dateTo) return false
      // User
      if (userFilter !== 'all' && log.userId !== userFilter) return false
      // Module
      if (moduleFilter !== 'all' && log.module !== moduleFilter) return false
      // Action
      if (actionFilter !== 'all' && log.action !== actionFilter) return false
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          log.description.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.module.toLowerCase().includes(q) ||
          log.ipAddress.includes(q) ||
          log.action.toLowerCase().includes(q)
        )
      }
      return true
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [dateFrom, dateTo, userFilter, moduleFilter, actionFilter, searchQuery])

  // Statistics
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const logsToday = MOCK_LOGS.filter(l => l.timestamp >= todayStart).length
  const activeUsersToday = new Set(MOCK_LOGS.filter(l => l.timestamp >= todayStart).map(l => l.userId)).size
  const moduleCount: Record<string, number> = {}
  MOCK_LOGS.forEach(l => { moduleCount[l.module] = (moduleCount[l.module] || 0) + 1 })
  const mostActiveModule = Object.entries(moduleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
  const securityAlerts = SECURITY_ALERTS.length

  // View detail
  const openDetail = useCallback((log: AuditLog) => {
    setSelectedLog(log)
    setDetailOpen(true)
  }, [])

  // Export CSV
  const exportCSV = useCallback(() => {
    try {
      const headers = ['Timestamp', 'User', 'Action', 'Module', 'Description', 'IP Address']
      const rows = filteredLogs.map(l => [
        formatDateTime(l.timestamp),
        l.userName,
        l.action,
        l.module,
        `"${l.description.replace(/"/g, '""')}"`,
        l.ipAddress
      ])
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${toISODate(now)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${filteredLogs.length} log entries to CSV`)
    } catch {
      toast.error('Failed to export CSV')
    }
  }, [filteredLogs])

  // Clear filters
  const clearFilters = useCallback(() => {
    setDateFrom('')
    setDateTo('')
    setUserFilter('all')
    setModuleFilter('all')
    setActionFilter('all')
    setSearchQuery('')
    toast.info('Filters cleared')
  }, [])

  // Action badge renderer
  const renderActionBadge = (action: ActionType) => {
    const c = actionColorMap[action]
    return (
      <Badge variant="outline" className={`${c.bg} ${c.text} ${c.border} font-medium text-xs gap-1`}>
        <span>{actionIconMap[action]}</span>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    )
  }

  // JSON view renderer
  const renderJSON = (label: string, data: Record<string, unknown> | null) => {
    if (!data) return <span className="text-muted-foreground text-sm italic">None</span>
    return (
      <div className="rounded-md bg-muted/50 border p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</p>
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all" style={{ color: NAVY }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: NAVY }}>
            <Shield className="size-6" style={{ color: ORANGE }} />
            Audit Logs
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track all system activities and changes across the CRM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="size-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            size="sm"
            onClick={exportCSV}
            className="gap-1.5 text-white"
            style={{ backgroundColor: ORANGE }}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: `${ORANGE}15` }}>
              <Clock className="size-5" style={{ color: ORANGE }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: NAVY }}>{logsToday}</p>
              <p className="text-xs text-muted-foreground">Logs Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: `${BLUE}15` }}>
              <User className="size-5" style={{ color: BLUE }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: NAVY }}>{activeUsersToday}</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950/30">
              <Activity className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: NAVY }}>{mostActiveModule}</p>
              <p className="text-xs text-muted-foreground">Most Active Module</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-red-50 dark:bg-red-950/30">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{securityAlerts}</p>
              <p className="text-xs text-muted-foreground">Security Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: NAVY }}>
              <Filter className="size-4" style={{ color: ORANGE }} />
              Filter Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Date From */}
              <div className="space-y-1.5">
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-sm h-9"
                />
              </div>
              {/* Date To */}
              <div className="space-y-1.5">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="text-sm h-9"
                />
              </div>
              {/* User */}
              <div className="space-y-1.5">
                <Label className="text-xs">User</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {UNIQUE_USERS.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Module */}
              <div className="space-y-1.5">
                <Label className="text-xs">Module</Label>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {ALL_MODULES.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Action Type */}
              <div className="space-y-1.5">
                <Label className="text-xs">Action Type</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {ALL_ACTIONS.map(a => (
                      <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Search */}
              <div className="space-y-1.5">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search descriptions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="text-sm h-9 pl-8"
                  />
                </div>
              </div>
            </div>
            {/* Active filter count + clear */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold" style={{ color: NAVY }}>{filteredLogs.length}</span> of {MOCK_LOGS.length} log entries
              </p>
              {(dateFrom || dateTo || userFilter !== 'all' || moduleFilter !== 'all' || actionFilter !== 'all' || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 gap-1">
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[520px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[170px]">Timestamp</TableHead>
                  <TableHead className="w-[180px]">User</TableHead>
                  <TableHead className="w-[110px]">Action</TableHead>
                  <TableHead className="w-[120px]">Module</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[130px]">IP Address</TableHead>
                  <TableHead className="w-[50px] text-center">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Shield className="size-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No audit logs found</p>
                      <p className="text-xs mt-1">Try adjusting your filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openDetail(log)}
                    >
                      {/* Timestamp */}
                      <TableCell className="font-mono text-xs">
                        <div>{formatDate(log.timestamp)}</div>
                        <div className="text-muted-foreground">{formatTime(log.timestamp)}</div>
                      </TableCell>
                      {/* User */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7">
                            <AvatarFallback
                              className="text-[10px] font-semibold text-white"
                              style={{ backgroundColor: NAVY }}
                            >
                              {log.userAvatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate max-w-[120px]">{log.userName}</span>
                        </div>
                      </TableCell>
                      {/* Action */}
                      <TableCell>{renderActionBadge(log.action)}</TableCell>
                      {/* Module */}
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-medium">
                          {log.module}
                        </Badge>
                      </TableCell>
                      {/* Description */}
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm truncate">{log.description}</p>
                      </TableCell>
                      {/* IP */}
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress}</TableCell>
                      {/* View button */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); openDetail(log) }}
                        >
                          <Eye className="size-3.5" style={{ color: BLUE }} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: NAVY }}>
              <Shield className="size-5" style={{ color: ORANGE }} />
              Audit Log Detail
            </DialogTitle>
            <DialogDescription>
              Full details for log entry {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-2">
                {/* Timestamp */}
                <div className="flex items-start gap-3">
                  <Clock className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="text-sm font-medium">{formatDateTime(selectedLog.timestamp)}</p>
                  </div>
                </div>

                <Separator />

                {/* User */}
                <div className="flex items-start gap-3">
                  <User className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">User</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Avatar className="size-6">
                        <AvatarFallback
                          className="text-[9px] font-semibold text-white"
                          style={{ backgroundColor: NAVY }}
                        >
                          {selectedLog.userAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">{selectedLog.userName}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action & Module */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Action</p>
                    {renderActionBadge(selectedLog.action)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Module</p>
                    <Badge variant="secondary" className="font-medium">{selectedLog.module}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm leading-relaxed">{selectedLog.description}</p>
                </div>

                <Separator />

                {/* Old / New Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderJSON('Old Values', selectedLog.oldValues)}
                  {renderJSON('New Values', selectedLog.newValues)}
                </div>

                <Separator />

                {/* IP & User Agent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{selectedLog.ipAddress}</code>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">User Agent</p>
                    <p className="text-xs text-muted-foreground break-all leading-relaxed">{selectedLog.userAgent}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
