'use client'

import { useState } from 'react'
import {
  BookOpen, Video, FileText, HelpCircle, Play, Download, Clock,
  TrendingUp, ShieldCheck, Megaphone, Sparkles, Filter, Search,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'

type Category = 'Sales' | 'Product' | 'Compliance' | 'Marketing'
type ResourceType = 'Video' | 'Document' | 'Quiz'

interface Resource {
  id: string
  title: string
  description: string
  category: Category
  type: ResourceType
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  icon: typeof Video
}

const RESOURCES: Resource[] = [
  {
    id: 'r1',
    title: 'Counseling Masterclass: First Call to Enrollment',
    description: 'A step-by-step framework for conducting high-conversion counseling calls with prospective students and their families.',
    category: 'Sales',
    type: 'Video',
    duration: '32 min',
    level: 'Intermediate',
    icon: Video,
  },
  {
    id: 'r2',
    title: 'UK Visa & Immigration Compliance Guide 2026',
    description: 'Stay compliant with the latest UKVI rules. Covers CAS issuance, financial evidence, ATAS, and refused-application workflows.',
    category: 'Compliance',
    type: 'Document',
    duration: '45 min read',
    level: 'Advanced',
    icon: FileText,
  },
  {
    id: 'r3',
    title: 'ALO CRM Product Walkthrough: Partner Portal',
    description: 'Learn to navigate every feature of your partner portal — student registration, applications, commissions, and reporting.',
    category: 'Product',
    type: 'Video',
    duration: '18 min',
    level: 'Beginner',
    icon: Video,
  },
  {
    id: 'r4',
    title: 'Building Your Agency Marketing Engine',
    description: 'A practical playbook for running Facebook lead ads, WhatsApp broadcasts, and referral contests that drive qualified leads.',
    category: 'Marketing',
    type: 'Document',
    duration: '28 min read',
    level: 'Intermediate',
    icon: Megaphone,
  },
  {
    id: 'r5',
    title: 'University Commission Structure Quiz',
    description: 'Test your knowledge of commission trigger stages, payout timelines, and dispute resolution across partner universities.',
    category: 'Product',
    type: 'Quiz',
    duration: '15 questions',
    level: 'Intermediate',
    icon: HelpCircle,
  },
  {
    id: 'r6',
    title: 'Selling Scholarships & Financial Aid Effectively',
    description: 'How to position university scholarships, bursaries, and education loans to win budget-conscious families.',
    category: 'Sales',
    type: 'Video',
    duration: '24 min',
    level: 'Advanced',
    icon: Video,
  },
  {
    id: 'r7',
    title: 'GDPR & Student Data Protection Handbook',
    description: 'Understand your obligations when collecting, storing, and sharing student personal data across borders.',
    category: 'Compliance',
    type: 'Document',
    duration: '22 min read',
    level: 'Beginner',
    icon: ShieldCheck,
  },
  {
    id: 'r8',
    title: 'WhatsApp Business Best Practices for Partners',
    description: 'Templates, automation rules, and response-time benchmarks to convert WhatsApp enquiries into enrolled students.',
    category: 'Marketing',
    type: 'Video',
    duration: '20 min',
    level: 'Beginner',
    icon: Video,
  },
  {
    id: 'r9',
    title: 'Application Documentation Checklist Mastery',
    description: 'Never miss a document again. Learn to use ALO\'s smart checklists for passports, transcripts, SOPs, LORs, and financials.',
    category: 'Product',
    type: 'Quiz',
    duration: '10 questions',
    level: 'Beginner',
    icon: HelpCircle,
  },
]

const CATEGORIES: Category[] = ['Sales', 'Product', 'Compliance', 'Marketing']

const categoryColor: Record<Category, string> = {
  Sales: 'bg-[#FFF7ED] text-[#E8501A] border-orange-200',
  Product: 'bg-[#EFF6FF] text-[#0057B8] border-blue-200',
  Compliance: 'bg-purple-50 text-purple-700 border-purple-200',
  Marketing: 'bg-green-50 text-green-700 border-green-200',
}

const typeIcon: Record<ResourceType, typeof Video> = {
  Video: Video,
  Document: FileText,
  Quiz: HelpCircle,
}

export default function LearningResourcesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [type, setType] = useState<string>('all')

  const filtered = RESOURCES.filter((r) => {
    if (search) {
      const q = search.toLowerCase()
      if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false
    }
    if (category !== 'all' && r.category !== category) return false
    if (type !== 'all' && r.type !== type) return false
    return true
  })

  const handleStart = (r: Resource) => {
    if (r.type === 'Document') {
      toast.success(`Downloading "${r.title}"…`)
    } else if (r.type === 'Quiz') {
      toast.info(`Starting quiz: ${r.title}`)
    } else {
      toast.info(`Playing video: ${r.title}`)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Resources"
        description="Training materials, product walkthroughs, and compliance guides for your team."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Resources" value={RESOURCES.length} icon={BookOpen} accent="blue" />
        <StatCard label="Videos" value={RESOURCES.filter((r) => r.type === 'Video').length} icon={Video} accent="orange" />
        <StatCard label="Documents" value={RESOURCES.filter((r) => r.type === 'Document').length} icon={FileText} accent="green" />
        <StatCard label="Quizzes" value={RESOURCES.filter((r) => r.type === 'Quiz').length} icon={HelpCircle} accent="purple" />
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Video">Video</SelectItem>
            <SelectItem value="Document">Document</SelectItem>
            <SelectItem value="Quiz">Quiz</SelectItem>
          </SelectContent>
        </Select>
        <div className="hidden sm:flex items-center text-xs text-slate-500 ml-auto">
          <Filter className="h-3.5 w-3.5 mr-1" /> {filtered.length} of {RESOURCES.length}
        </div>
      </Card>

      {/* Resource grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const Icon = typeIcon[r.type]
          return (
            <Card key={r.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge variant="outline" className={'text-[10px] mb-1 ' + categoryColor[r.category]}>
                    {r.category}
                  </Badge>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{r.title}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 mb-4 flex-1">{r.description}</p>

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {r.duration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {r.level}
                </span>
                <Badge variant="outline" className="ml-auto text-[10px] capitalize">{r.type}</Badge>
              </div>

              <Button
                size="sm"
                className="w-full bg-[#0057B8] hover:bg-[#004a99] text-white border-0"
                onClick={() => handleStart(r)}
              >
                {r.type === 'Document' ? (
                  <><Download className="h-3.5 w-3.5 mr-1" /> Download</>
                ) : r.type === 'Quiz' ? (
                  <><Sparkles className="h-3.5 w-3.5 mr-1" /> Start Quiz</>
                ) : (
                  <><Play className="h-3.5 w-3.5 mr-1" /> Start</>
                )}
              </Button>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 border-0 shadow-sm text-center">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium mb-1">No resources found</p>
          <p className="text-xs text-slate-400">Try clearing your filters.</p>
        </Card>
      )}
    </div>
  )
}
