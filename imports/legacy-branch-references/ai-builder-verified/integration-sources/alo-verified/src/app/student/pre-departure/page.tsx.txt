'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plane, Home, Wallet, FileText, HeartPulse, MessageCircle,
  CheckCircle2, Circle, Plus, RefreshCw, Plane as PlaneIcon,
  Video, ArrowRight, Sparkles, ListChecks,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: string
  itemName: string
  category: string
  isRequired: boolean
  isCompleted: boolean
  completedAt: string | null
  note: string | null
}

interface PreDepartureData {
  checklist: ChecklistItem[]
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Plane; color: string; bg: string; border: string }
> = {
  travel: { label: 'Travel', icon: Plane, color: 'text-[#0057B8]', bg: 'bg-[#EFF6FF]', border: 'border-[#BED9F5]' },
  accommodation: { label: 'Accommodation', icon: Home, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  finance: { label: 'Finance', icon: Wallet, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  documents: { label: 'Documents', icon: FileText, color: 'text-[#E8501A]', bg: 'bg-[#FFF7ED]', border: 'border-[#FFE0C2]' },
  health: { label: 'Health', icon: HeartPulse, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  communication: { label: 'Communication', icon: MessageCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
}

const CATEGORY_ORDER = ['travel', 'accommodation', 'finance', 'documents', 'health', 'communication']

export default function PreDeparturePage() {
  const session = getSession()
  const refId = session?.user.referenceId || ''

  const { data, loading, error } = usePortalData<PreDepartureData>({
    endpoint: '/api/visa/pre-departure',
    params: { studentId: refId },
    enabled: !!refId,
  })

  const [initializing, setInitializing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[] | null>(null)

  const checklist = localChecklist ?? data?.checklist ?? []

  const stats = useMemo(() => {
    const total = checklist.length
    const done = checklist.filter((i) => i.isCompleted).length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, pct }
  }, [checklist])

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>()
    checklist.forEach((item) => {
      const arr = map.get(item.category) || []
      arr.push(item)
      map.set(item.category, arr)
    })
    return CATEGORY_ORDER
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, items: map.get(cat)! }))
  }, [checklist])

  async function handleInitialize() {
    if (!refId) return
    setInitializing(true)
    try {
      const token = session?.token
      const res = await fetch('/api/visa/pre-departure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: refId, forceInit: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to initialize checklist')
      setLocalChecklist(json.checklist || [])
      toast.success(`Initialized ${json.checklist?.length || 0} pre-departure items.`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to initialize'
      toast.error(msg)
    } finally {
      setInitializing(false)
    }
  }

  async function handleToggle(item: ChecklistItem) {
    const newCompleted = !item.isCompleted
    // Optimistic update
    setLocalChecklist((prev) => {
      const list = prev ?? data?.checklist ?? []
      return list.map((i) => i.id === item.id ? { ...i, isCompleted: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null } : i)
    })
    setTogglingId(item.id)
    try {
      const token = session?.token
      const res = await fetch('/api/visa/pre-departure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: item.id, isCompleted: newCompleted }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update')
      // Sync with server response
      setLocalChecklist((prev) => {
        const list = prev ?? data?.checklist ?? []
        return list.map((i) => i.id === item.id ? { ...i, isCompleted: json.item.isCompleted, completedAt: json.item.completedAt } : i)
      })
    } catch (e: unknown) {
      // Revert on failure
      setLocalChecklist((prev) => {
        const list = prev ?? data?.checklist ?? []
        return list.map((i) => i.id === item.id ? { ...i, isCompleted: item.isCompleted, completedAt: item.completedAt } : i)
      })
      const msg = e instanceof Error ? e.message : 'Failed to update'
      toast.error(msg)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pre-Departure Checklist"
        description="A 15-item pre-departure checklist across travel, accommodation, finance, documents, health, and communication."
        action={
          checklist.length > 0 ? (
            <Button
              onClick={handleInitialize}
              variant="outline"
              className="h-12"
              disabled={initializing}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', initializing && 'animate-spin')} />
              {initializing ? 'Re-initializing...' : 'Reset Checklist'}
            </Button>
          ) : undefined
        }
      />

      {/* Hero progress + Stats */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-sm lg:col-span-2 h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Pre-Departure Completion</p>
              <p className="text-4xl font-extrabold text-slate-900 mt-1">
                {stats.pct}<span className="text-xl text-slate-400">%</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {stats.done} of {stats.total} items completed
              </p>
            </div>
            <div className="h-14 w-14 rounded-full bg-[#EFF6FF] flex items-center justify-center">
              <PlaneIcon className="h-7 w-7 text-[#0057B8]" />
            </div>
          </div>
          <Progress value={stats.pct} className="h-2.5 mt-4" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" /> {stats.done} Completed
            </Badge>
            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
              <Circle className="h-3 w-3 mr-1" /> {stats.total - stats.done} Pending
            </Badge>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm h-full bg-[#F8FAFC]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-[#E8501A]" />
            <p className="text-sm font-semibold text-slate-900">Departure Countdown</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Use this checklist 2-4 weeks before your flight. Tick items as you complete them — your counselor can see your progress and assist where needed.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild size="sm" variant="outline" className="h-10 w-full">
              <a href="#"><Plane className="h-3.5 w-3.5 mr-1.5" /> Book Airport Pickup</a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-10 w-full">
              <a href="#"><Video className="h-3.5 w-3.5 mr-1.5" /> Join Pre-Departure Webinar</a>
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats.total} icon={ListChecks} accent="blue" hint="Required" />
        <StatCard label="Completed" value={stats.done} icon={CheckCircle2} accent="green" hint="Done" />
        <StatCard label="Pending" value={stats.total - stats.done} icon={Circle} accent="amber" hint="To do" />
        <StatCard label="Categories" value={grouped.length} icon={Plane} accent="purple" hint="6 groups" />
      </div>

      {/* Empty state */}
      {loading ? (
        <Card className="p-6 border-0 shadow-sm">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        </Card>
      ) : checklist.length === 0 ? (
        <Card className="p-12 border-0 shadow-sm">
          <div className="text-center max-w-md mx-auto">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Plus className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Initialize Your Pre-Departure Checklist</h3>
            <p className="text-sm text-slate-500 mb-5">
              We have prepared a 15-item checklist covering travel, accommodation, finance, documents, health, and communication. Click below to set up your personalized checklist.
            </p>
            <Button
              onClick={handleInitialize}
              disabled={initializing}
              className="h-12 bg-[#0057B8] hover:bg-[#004a99] px-8"
            >
              {initializing ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Initializing...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Initialize Checklist</>
              )}
            </Button>
            {error && (
              <p className="text-xs text-red-500 mt-3">Could not load existing checklist. Click to initialize.</p>
            )}
          </div>
        </Card>
      ) : (
        // Category cards
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {grouped.map(({ category, items }) => {
            const meta = CATEGORY_META[category]
            const Icon = meta.icon
            const catDone = items.filter((i) => i.isCompleted).length
            const catPct = items.length > 0 ? Math.round((catDone / items.length) * 100) : 0
            return (
              <Card key={category} className="p-6 border-0 shadow-sm h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', meta.bg)}>
                      <Icon className={cn('h-5 w-5', meta.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{meta.label}</p>
                      <p className="text-xs text-slate-500">{catDone} of {items.length} done</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(meta.color, meta.bg, meta.border)}>
                    {catPct}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      htmlFor={item.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        item.isCompleted
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-slate-100 bg-white hover:bg-slate-50/50',
                        togglingId === item.id && 'opacity-60'
                      )}
                    >
                      <div className="pt-0.5">
                        <Checkbox
                          id={item.id}
                          checked={item.isCompleted}
                          onCheckedChange={() => handleToggle(item)}
                          disabled={togglingId === item.id}
                          className={cn(item.isCompleted && 'border-green-500 bg-green-500 text-white')}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium',
                          item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900',
                        )}>
                          {item.itemName}
                        </p>
                        {item.note && (
                          <p className="text-xs text-slate-500 mt-1">{item.note}</p>
                        )}
                        {item.isCompleted && item.completedAt && (
                          <p className="text-[11px] text-green-600 mt-1">
                            Completed {new Date(item.completedAt).toLocaleDateString('en-GB')}
                          </p>
                        )}
                      </div>
                      {item.isRequired && (
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 shrink-0">
                          Required
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Bottom CTA */}
      {checklist.length > 0 && (
        <Card className="p-6 border-0 shadow-sm bg-[#F8FAFC]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <Plane className="h-6 w-6 text-[#0057B8]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Need help with pre-departure?</p>
              <p className="text-xs text-slate-500 mt-1">Message your counselor for guidance on any item, or book a 1-on-1 pre-departure briefing.</p>
            </div>
            <Button asChild variant="outline" className="h-12">
              <Link href="/student/messages">Message Counselor <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
