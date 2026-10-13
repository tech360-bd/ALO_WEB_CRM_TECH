'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react'

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: 'blue' | 'orange' | 'green' | 'purple' | 'navy' | 'amber'
  trend?: { value: string; up: boolean }
  sublabel?: string
}

const accentMap = {
  blue: { bg: 'bg-blue-50', text: 'text-[#0057B8]', ring: 'ring-blue-100' },
  orange: { bg: 'bg-orange-50', text: 'text-[#E8501A]', ring: 'ring-orange-100' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  navy: { bg: 'bg-slate-100', text: 'text-[#0f172a]', ring: 'ring-slate-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
}

export function StatCard({ label, value, icon: Icon, accent = 'blue', trend, sublabel }: StatCardProps) {
  const a = accentMap[accent]
  return (
    <Card className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-[#0f172a] mt-1.5">{value}</p>
          {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.up ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={cn('text-xs font-semibold', trend.up ? 'text-emerald-600' : 'text-red-600')}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center ring-1', a.bg, a.text, a.ring)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

// ─── Section Card ────────────────────────────────────────────────────────────

interface SectionCardProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function SectionCard({ title, description, action, className, bodyClassName, children }: SectionCardProps) {
  return (
    <Card className={cn('border-slate-200 shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>}
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </Card>
  )
}

// ─── Status Badge ────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  // generic
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  enrolled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  visa_approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-blue-50 text-[#0057B8] border-blue-200',
  review: 'bg-blue-50 text-[#0057B8] border-blue-200',
  submitted: 'bg-blue-50 text-[#0057B8] border-blue-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  conditional_offer: 'bg-violet-50 text-violet-700 border-violet-200',
  unconditional_offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  deposit_paid: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  cas_received: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  visa_applied: 'bg-amber-50 text-amber-700 border-amber-200',
  visa_refused: 'bg-red-50 text-red-700 border-red-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  refused: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  scheduled: 'bg-blue-50 text-[#0057B8] border-blue-200',
  no_show: 'bg-red-50 text-red-700 border-red-200',
  uploaded: 'bg-slate-100 text-slate-600 border-slate-200',
  hot: 'bg-red-50 text-red-700 border-red-200',
  warm: 'bg-amber-50 text-amber-700 border-amber-200',
  cold: 'bg-blue-50 text-[#0057B8] border-blue-200',
  qualified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contacted: 'bg-blue-50 text-[#0057B8] border-blue-200',
  new: 'bg-violet-50 text-violet-700 border-violet-200',
  won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost: 'bg-red-50 text-red-700 border-red-200',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cls = statusColors[status.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <Badge variant="outline" className={cn('text-xs font-medium capitalize border', cls)}>
      {label || status.replace(/_/g, ' ')}
    </Badge>
  )
}

// ─── Empty State ────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h4 className="text-sm font-semibold text-[#0f172a]">{title}</h4>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Progress Ring ───────────────────────────────────────────────────────────

export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  label,
  color = '#0057B8',
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
  color?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-[#0f172a]">{value}%</span>
        {label && <span className="text-[9px] text-slate-400">{label}</span>}
      </div>
    </div>
  )
}

// ─── Page Header ────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-[#0f172a]">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  )
}
