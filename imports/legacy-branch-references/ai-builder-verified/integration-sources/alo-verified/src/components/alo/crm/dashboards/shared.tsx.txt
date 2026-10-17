'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronRight, LucideIcon } from 'lucide-react'

// ─── StatCard ─────────────────────────────────────────────────────────────
type StatAccent = 'blue' | 'orange' | 'green' | 'purple' | 'amber' | 'slate' | 'red' | 'cyan' | 'pink'

const accentStyles: Record<StatAccent, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-[#EFF6FF]', text: 'text-[#0057B8]', ring: 'ring-[#DBEAFE]' },
  orange: { bg: 'bg-[#FFF7ED]', text: 'text-[#E8501A]', ring: 'ring-[#FED7AA]' },
  green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200' },
  red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-100' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-100' },
}

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  accent?: StatAccent
  delta?: string
  hint?: string
  href?: string
}

export function CrmStatCard({ label, value, icon: Icon, accent = 'blue', delta, hint, href }: StatCardProps) {
  const s = accentStyles[accent]
  const content = (
    <Card className="p-4 hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {delta && <p className="text-[10px] text-slate-500 mt-1.5 font-medium">{delta}</p>}
          {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
        </div>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center ring-1', s.bg, s.text, s.ring)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {href && (
        <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className={cn('h-4 w-4', s.text)} />
        </div>
      )}
    </Card>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

// ─── Section Card ─────────────────────────────────────────────────────────
interface SectionCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

// ─── Mini Bar Chart ────────────────────────────────────────────────────────
interface BarItem {
  label: string
  count: number
  color?: string
}

export function MiniBarChart({ items, emptyText = 'No data yet' }: { items: BarItem[]; emptyText?: string }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 italic py-6 text-center">{emptyText}</p>
  }
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-24 text-xs text-slate-600 capitalize truncate">{item.label.replace(/_/g, ' ')}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={cn('h-full rounded-full', item.color || 'bg-[#0057B8]')}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <div className="w-8 text-xs font-semibold text-slate-700 text-right">{item.count}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────
const statusColorMap: Record<string, string> = {
  // Lead statuses
  new: 'bg-blue-50 text-[#0057B8] border-blue-100',
  qualified: 'bg-purple-50 text-purple-700 border-purple-100',
  contacted: 'bg-amber-50 text-amber-700 border-amber-100',
  won: 'bg-green-50 text-green-700 border-green-100',
  lost: 'bg-red-50 text-red-700 border-red-100',
  // Application statuses
  submitted: 'bg-blue-50 text-[#0057B8] border-blue-100',
  under_review: 'bg-amber-50 text-amber-700 border-amber-100',
  conditional_offer: 'bg-purple-50 text-purple-700 border-purple-100',
  unconditional_offer: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  withdrawn: 'bg-slate-100 text-slate-600 border-slate-200',
  deferred: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  enrolled: 'bg-green-100 text-green-800 border-green-200',
  // Commission statuses
  eligible: 'bg-blue-50 text-[#0057B8] border-blue-100',
  requested: 'bg-amber-50 text-amber-700 border-amber-100',
  under_review: 'bg-purple-50 text-purple-700 border-purple-100',
  paid: 'bg-green-50 text-green-700 border-green-100',
  held: 'bg-red-50 text-red-700 border-red-100',
  // Document statuses
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-green-50 text-green-700 border-green-100',
  // Visa statuses
  approved_visa: 'bg-green-50 text-green-700 border-green-100',
  rejected_visa: 'bg-red-50 text-red-700 border-red-100',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = statusColorMap[status] || 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold capitalize', cls)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

// ─── Role Header ───────────────────────────────────────────────────────────
interface RoleHeaderProps {
  roleName: string
  displayName: string
  description: string
  userName: string
}

export function RoleHeader({ roleName, displayName, description, userName }: RoleHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-[#0057B8] to-[#0073E6] rounded-xl p-6 text-white shadow-sm">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
            ALO CRM · {displayName}
          </p>
          <h1 className="text-2xl font-bold">Welcome back, {userName.split(' ')[0]} 👋</h1>
          <p className="text-sm text-white/80 mt-1.5 max-w-2xl">{description}</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 text-xs font-mono">
          <span className="text-white/60">Role:</span> <span className="font-semibold">{roleName}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Empty / Loading ───────────────────────────────────────────────────────
export function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-slate-100 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-lg" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-64 bg-slate-100 rounded-lg" />
        <div className="h-64 bg-slate-100 rounded-lg" />
      </div>
    </div>
  )
}

export function DashboardError({ message }: { message: string }) {
  return (
    <Card className="p-8 text-center border-red-200 bg-red-50/50">
      <p className="text-sm font-semibold text-red-700">Failed to load dashboard</p>
      <p className="text-xs text-red-500 mt-1">{message}</p>
    </Card>
  )
}
