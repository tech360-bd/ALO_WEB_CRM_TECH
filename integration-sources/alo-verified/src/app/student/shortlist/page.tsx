'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Star, MapPin, Clock, DollarSign, Award, GraduationCap,
  Search, Trash2, Send, ArrowRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { useShortlist } from '@/hooks/use-shortlist'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ShortlistPage() {
  const { items, remove, clear, ready } = useShortlist()
  const [confirmClear, setConfirmClear] = useState(false)

  if (!ready) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Shortlist" description="Programs you've saved for later." />
        <Card className="p-6 border-0 shadow-sm">
          <div className="h-32 rounded-lg bg-slate-100 animate-pulse" />
        </Card>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Shortlist" description="Programs you've saved for later." />
        <Card className="p-12 text-center border-0 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-[#FFF7ED] flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-[#E8501A]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Your shortlist is empty</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            Browse our course finder to discover programs that match your goals. Tap the star icon on any program to save it here.
          </p>
          <Button asChild className="bg-[#0057B8] hover:bg-[#00449a] text-white">
            <Link href="/student/course-finder">
              <Search className="h-4 w-4 mr-2" /> Find Programs
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Shortlist"
        description={`${items.length} program${items.length === 1 ? '' : 's'} saved.`}
        action={
          confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Clear all?</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  clear()
                  setConfirmClear(false)
                  toast.success('Shortlist cleared')
                }}
              >
                Yes, clear
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmClear(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear All
            </Button>
          )
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.courseId} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 line-clamp-2">{item.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  {item.universityName}
                </p>
              </div>
              <button
                onClick={() => {
                  remove(item.courseId)
                  toast.success('Removed from shortlist')
                }}
                className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.level && (
                <Badge variant="outline" className="bg-[#EFF6FF] text-[#0057B8] border-[#0057B8]/20 capitalize">
                  {item.level}
                </Badge>
              )}
              {item.scholarshipAvailable && (
                <Badge variant="outline" className="bg-[#FFF7ED] text-[#E8501A] border-[#E8501A]/20">
                  <Award className="h-3 w-3 mr-1" /> Scholarship
                </Badge>
              )}
              {item.field && (
                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                  {item.field}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-4">
              <div className="flex flex-col">
                <span className="text-slate-400 mb-0.5">Location</span>
                <span className="font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#0057B8]" />
                  {item.city || item.country || '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 mb-0.5">Duration</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#0057B8]" />
                  {item.duration || '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 mb-0.5">Tuition</span>
                <span className="font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-[#0057B8]" />
                  {item.tuitionFee != null ? `${item.currency} ${item.tuitionFee.toLocaleString()}` : '—'}
                </span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Added {new Date(item.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
              <Button asChild size="sm" className="bg-[#E8501A] hover:bg-[#c8420f] text-white">
                <Link href="/student/applications">
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Apply
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 border-0 shadow-sm bg-gradient-to-r from-[#EFF6FF] to-[#FFF7ED]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-slate-900">Ready to take the next step?</p>
            <p className="text-sm text-slate-600">Apply to your shortlisted programs or explore more options.</p>
          </div>
          <Button asChild className="bg-[#0057B8] hover:bg-[#00449a] text-white">
            <Link href="/student/course-finder">
              Find more programs <ArrowRight className={cn('h-4 w-4 ml-2')} />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
