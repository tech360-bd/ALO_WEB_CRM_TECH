'use client'

import { useState, useMemo } from 'react'
import {
  Bell, ChevronDown, ChevronUp, Plane, Building2, Award, Server,
  Calendar, Filter, X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  category: string | null
  featuredImage: string | null
  authorId: string | null
  tags: string | null
  status: string
  publishedAt: string | null
  createdAt: string
}

interface BlogResponse {
  posts: BlogPost[]
  categories: Array<{ name: string | null; count: number }>
}

const CATEGORY_META: Record<string, { icon: typeof Plane; color: string; label: string }> = {
  Visa: { icon: Plane, color: 'bg-[#FFF7ED] text-[#E8501A] border-orange-200', label: 'Visa' },
  University: { icon: Building2, color: 'bg-[#EFF6FF] text-[#0057B8] border-blue-200', label: 'University' },
  Scholarship: { icon: Award, color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Scholarship' },
  System: { icon: Server, color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'System' },
  // fallbacks for other seeded categories
  'Study Abroad': { icon: Plane, color: 'bg-[#FFF7ED] text-[#E8501A] border-orange-200', label: 'Study Abroad' },
  Admissions: { icon: Building2, color: 'bg-[#EFF6FF] text-[#0057B8] border-blue-200', label: 'Admissions' },
  'Student Life': { icon: Award, color: 'bg-green-50 text-green-700 border-green-200', label: 'Student Life' },
  default: { icon: Bell, color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'General' },
}

function getCatMeta(cat: string | null) {
  if (!cat) return CATEGORY_META.default
  return CATEGORY_META[cat] || CATEGORY_META.default
}

export default function UpdatesPage() {
  const { data, loading } = usePortalData<BlogResponse>({
    endpoint: '/api/blog',
    params: { limit: 50, status: 'published' },
  })

  const [category, setCategory] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!data?.posts) return []
    if (category === 'all') return data.posts
    return data.posts.filter((p) => p.category === category)
  }, [data, category])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const stats = {
    total: data?.posts?.length ?? 0,
    visa: data?.posts?.filter((p) => p.category === 'Visa').length ?? 0,
    university: data?.posts?.filter((p) => p.category === 'University' || p.category === 'Admissions').length ?? 0,
    scholarship: data?.posts?.filter((p) => p.category === 'Scholarship').length ?? 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Important Updates"
        description="Stay informed with the latest visa rules, university announcements, scholarships, and system updates."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Updates" value={stats.total} icon={Bell} accent="blue" />
        <StatCard label="Visa Updates" value={stats.visa} icon={Plane} accent="orange" />
        <StatCard label="University" value={stats.university} icon={Building2} accent="purple" />
        <StatCard label="Scholarships" value={stats.scholarship} icon={Award} accent="green" />
      </div>

      {/* Filter */}
      <Card className="p-4 border-0 shadow-sm flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400 mr-1" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {data?.categories?.filter((c) => c.name).map((c) => (
              <SelectItem key={c.name} value={c.name!}>{c.name} ({c.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {category !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setCategory('all')}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <div className="ml-auto text-xs text-slate-500">{filtered.length} update{filtered.length !== 1 ? 's' : ''}</div>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 border-0 shadow-sm">
              <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse mb-3" />
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
            </Card>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((post) => {
            const meta = getCatMeta(post.category)
            const Icon = meta.icon
            const isExpanded = expanded.has(post.id)
            return (
              <Card key={post.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ' + meta.color}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight">{post.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {post.excerpt || (post.content || '').slice(0, 200) + '…'}
                    </p>
                    {isExpanded && post.content && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-50 text-sm text-slate-700 whitespace-pre-wrap">
                        {post.content}
                      </div>
                    )}
                    <button
                      onClick={() => toggleExpand(post.id)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0057B8] hover:underline"
                    >
                      {isExpanded ? (
                        <>Read less <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Read more <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 border-0 shadow-sm text-center">
            <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-1 font-medium">No updates available</p>
            <p className="text-xs text-slate-400">
              {category !== 'all' ? 'Try selecting a different category.' : 'Updates will appear here when published by the ALO team.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
