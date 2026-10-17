'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label?: string }
  accent?: 'blue' | 'orange' | 'green' | 'purple' | 'amber' | 'slate'
  hint?: string
}

const accentMap = {
  blue: { bg: 'bg-[#EFF6FF]', text: 'text-[#0057B8]' },
  orange: { bg: 'bg-[#FFF7ED]', text: 'text-[#E8501A]' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
}

export function StatCard({ label, value, icon: Icon, trend, accent = 'blue', hint }: StatCardProps) {
  const colors = accentMap[accent]
  return (
    <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'inline-flex items-center text-xs font-semibold',
                  trend.value >= 0 ? 'text-green-600' : 'text-red-500'
                )}
              >
                {trend.value >= 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(trend.value)}%
              </span>
              {trend.label && <span className="text-xs text-slate-400">{trend.label}</span>}
            </div>
          )}
        </div>
        <div className={cn('h-11 w-11 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.text)} />
        </div>
      </div>
    </Card>
  )
}
