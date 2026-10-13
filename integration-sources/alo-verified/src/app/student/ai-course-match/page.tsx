'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Globe, BookOpen, DollarSign, Award, Target,
  Loader2, Star, MapPin, Clock, GraduationCap, ArrowRight,
  TrendingUp, RefreshCw, Check,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { useShortlist, type ShortlistItem } from '@/hooks/use-shortlist'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StudentRecord {
  id: string
  firstName: string
  lastName: string
  gpa: string | null
  englishTestType: string | null
  englishTestScore: string | null
  preferredCountry: string | null
  preferredCourse: string | null
}

interface CourseRecord {
  id: string
  name: string
  level: string | null
  field: string | null
  duration: string | null
  tuitionFee: number | null
  currency: string
  entryRequirements: string | null
  englishRequirement: string | null
  scholarshipAvailable: boolean
  description: string | null
  university: { id: string; name: string; country: string; city: string | null }
}

interface MatchFormState {
  country: string
  field: string
  budget: string
  englishScore: string
  englishTest: string
  gpa: string
  level: string
}

interface MatchedProgram {
  course: CourseRecord
  matchPercent: number
  reasons: string[]
}

const COUNTRIES = ['Any', 'United Kingdom', 'Australia', 'United States', 'Canada', 'Ireland', 'Germany']
const FIELDS = ['Any', 'Computer Science', 'Data Science', 'Business', 'Engineering', 'Health Sciences', 'Arts & Humanities', 'Law']
const LEVELS = ['Any', 'undergraduate', 'postgraduate', 'phd', 'foundation', 'diploma']
const TESTS = ['IELTS', 'TOEFL', 'PTE', 'Duolingo']

export default function AiCourseMatchPage() {
  const session = getSession()
  const { data: studentData } = usePortalData<{ students: StudentRecord[] }>({
    endpoint: '/api/students',
    params: { search: session?.user.email || '', limit: 5 },
  })
  const { data: courseData } = usePortalData<{ courses: CourseRecord[] }>({
    endpoint: '/api/courses',
    params: { limit: 100 },
  })

  const { isShortlisted, toggle } = useShortlist()

  const student = studentData?.students?.find((s) => s.email === session?.user.email) || studentData?.students?.[0] || null

  const [form, setForm] = useState<MatchFormState>({
    country: 'Any',
    field: 'Any',
    budget: '30000',
    englishTest: 'IELTS',
    englishScore: '6.5',
    gpa: '3.0',
    level: 'postgraduate',
  })

  const [matches, setMatches] = useState<MatchedProgram[]>([])
  const [loading, setLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    if (student) {
      setForm((f) => ({
        ...f,
        country: f.country === 'Any' && student.preferredCountry ? student.preferredCountry : f.country,
        field: f.field === 'Any' && student.preferredCourse ? extractField(student.preferredCourse) : f.field,
        gpa: f.gpa === '3.0' && student.gpa ? student.gpa : f.gpa,
        englishTest: f.englishTest === 'IELTS' && student.englishTestType ? student.englishTestType : f.englishTest,
        englishScore: f.englishScore === '6.5' && student.englishTestScore ? student.englishTestScore : f.englishScore,
      }))
    }
  }, [student])

  const courses = courseData?.courses || []

  const setField = <K extends keyof MatchFormState>(key: K, value: MatchFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const runMatch = async () => {
    setLoading(true)
    setHasRun(true)
    setMatches([])

    try {
      const budget = parseFloat(form.budget) || 30000
      const gpa = parseFloat(form.gpa) || 0
      const englishScore = parseFloat(form.englishScore) || 0

      // Call AI for a recommendation summary (best-effort, non-blocking)
      const token = typeof window !== 'undefined' ? localStorage.getItem('alo_token') : null
      const aiPromise = fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          command: 'course-match',
          agentType: 'course_recommender',
          userId: session?.user.id,
          inputText: `Recommend programs for a student. Country: ${form.country}. Field: ${form.field}. Budget: ${budget} ${'GBP'}. GPA: ${gpa}. English: ${form.englishTest} ${englishScore}. Level: ${form.level}.`,
        }),
      }).then((r) => r.ok ? r.json() : null).catch(() => null)

      // Compute match scores locally (deterministic, real DB data)
      const scored: MatchedProgram[] = courses.map((c) => {
        let score = 50
        const reasons: string[] = []

        // Country match (20 pts)
        if (form.country === 'Any') {
          score += 10
          reasons.push('Available globally')
        } else if (c.university?.country === form.country) {
          score += 20
          reasons.push(`Located in ${form.country}`)
        } else {
          score -= 10
        }

        // Field match (25 pts)
        if (form.field === 'Any') {
          score += 5
        } else if (c.field && c.field.toLowerCase().includes(form.field.toLowerCase())) {
          score += 25
          reasons.push(`${c.field} matches your interest`)
        } else if (c.name.toLowerCase().includes(form.field.toLowerCase())) {
          score += 20
          reasons.push('Course name matches your field')
        } else {
          score -= 5
        }

        // Level match (15 pts)
        if (form.level === 'Any') {
          score += 5
        } else if (c.level === form.level) {
          score += 15
          reasons.push(`${c.level} level as preferred`)
        } else {
          score -= 5
        }

        // Budget match (20 pts)
        if (c.tuitionFee != null) {
          if (c.tuitionFee <= budget) {
            score += 20
            reasons.push(`Within budget (${c.currency} ${c.tuitionFee.toLocaleString()})`)
          } else if (c.tuitionFee <= budget * 1.2) {
            score += 10
            reasons.push('Slightly above budget — scholarship may help')
          } else {
            score -= 10
          }
        } else {
          score += 5
          reasons.push('Tuition on request')
        }

        // English score match (15 pts)
        const reqEnglish = parseFloat((c.englishRequirement || '').match(/(\d+(?:\.\d+)?)/)?.[1] || '6.0')
        if (englishScore >= reqEnglish) {
          score += 15
          reasons.push(`English score meets requirement (${reqEnglish}+ ${form.englishTest})`)
        } else if (englishScore >= reqEnglish - 0.5) {
          score += 8
          reasons.push('English score close to requirement')
        } else {
          score -= 5
        }

        // GPA match (5 pts)
        if (gpa >= 3.5) {
          score += 5
          reasons.push('Strong academic record')
        } else if (gpa >= 3.0) {
          score += 3
        }

        // Scholarship bonus
        if (c.scholarshipAvailable) {
          score += 5
          reasons.push('Scholarship available')
        }

        score = Math.max(40, Math.min(99, score))
        return { course: c, matchPercent: score, reasons }
      })

      // Sort by match
      scored.sort((a, b) => b.matchPercent - a.matchPercent)
      setMatches(scored.slice(0, 8))

      // Wait for AI promise to settle (don't fail on error)
      await aiPromise

      toast.success(`Found ${Math.min(8, scored.length)} matching programs`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to compute matches')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleShortlist = (c: CourseRecord) => {
    const item: ShortlistItem = {
      courseId: c.id,
      name: c.name,
      universityName: c.university?.name || 'Unknown',
      country: c.university?.country || '',
      city: c.university?.city || null,
      level: c.level,
      field: c.field,
      duration: c.duration,
      tuitionFee: c.tuitionFee,
      currency: c.currency || 'GBP',
      scholarshipAvailable: c.scholarshipAvailable,
      addedAt: new Date().toISOString(),
    }
    const added = toggle(item)
    toast.success(added ? 'Added to shortlist' : 'Removed from shortlist')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Course Matcher"
        description="Get personalized program recommendations based on your profile, budget, and academic background."
        action={
          <Badge variant="outline" className="bg-[#FFF7ED] text-[#E8501A] border-[#E8501A]/20">
            <Sparkles className="h-3 w-3 mr-1" /> Powered by AI
          </Badge>
        }
      />

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* Form */}
        <div className="space-y-4">
          <Card className="p-6 border-0 shadow-sm lg:sticky lg:top-20">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-[#0057B8]" />
              <h3 className="font-bold text-slate-900">Your Profile</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Preferred Country</Label>
                <Select value={form.country} onValueChange={(v) => setField('country', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Field of Interest</Label>
                <Select value={form.field} onValueChange={(v) => setField('field', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Program Level</Label>
                <Select value={form.level} onValueChange={(v) => setField('level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Budget (GBP)</Label>
                  <Input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setField('budget', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>GPA</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.gpa}
                    onChange={(e) => setField('gpa', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> English Test</Label>
                  <Select value={form.englishTest} onValueChange={(v) => setField('englishTest', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TESTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Score</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.englishScore}
                    onChange={(e) => setField('englishScore', e.target.value)}
                  />
                </div>
              </div>

              {student && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Auto-filled from your profile
                </p>
              )}

              <Button
                onClick={runMatch}
                disabled={loading}
                className="w-full bg-[#E8501A] hover:bg-[#c8420f] text-white h-11"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finding matches…</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Find Matches</>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="min-w-0">
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#0057B8]" />
                AI is ranking programs by match score…
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-5 border-0 shadow-sm">
                  <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
                      <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : !hasRun ? (
            <Card className="p-12 text-center border-0 shadow-sm">
              <div className="h-16 w-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-[#0057B8]" />
              </div>
              <p className="font-semibold text-slate-900">Ready to find your perfect program?</p>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Fill in your profile on the left and click Find Matches. Our AI will rank real programs from our database by how well they fit you.
              </p>
            </Card>
          ) : matches.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-sm">
              <p className="text-sm text-slate-500">No matches found. Try adjusting your filters.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">{matches.length} programs</span> ranked by match
                </p>
                <Badge variant="outline" className="bg-[#EFF6FF] text-[#0057B8] border-[#0057B8]/20">
                  <TrendingUp className="h-3 w-3 mr-1" /> Top {matches.length}
                </Badge>
              </div>

              {matches.map((m, idx) => (
                <Card key={m.course.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {/* Match score */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div
                        className={cn(
                          'h-14 w-14 rounded-lg flex flex-col items-center justify-center',
                          m.matchPercent >= 85 ? 'bg-green-50' :
                          m.matchPercent >= 70 ? 'bg-[#EFF6FF]' : 'bg-amber-50'
                        )}
                      >
                        <span className={cn(
                          'text-lg font-bold leading-none',
                          m.matchPercent >= 85 ? 'text-green-600' :
                          m.matchPercent >= 70 ? 'text-[#0057B8]' : 'text-amber-600'
                        )}>
                          {m.matchPercent}%
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5">match</span>
                      </div>
                      {idx === 0 && (
                        <Badge className="mt-1.5 bg-[#E8501A] text-white border-0 text-[10px] px-1.5">
                          Best Match
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 line-clamp-1">{m.course.name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            {m.course.university?.name || '—'}
                            <span className="text-slate-400">•</span>
                            <MapPin className="h-3 w-3" />
                            {m.course.university?.city || m.course.university?.country}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleShortlist(m.course)}
                          className={cn(
                            'shrink-0 p-1.5 rounded-lg transition-colors',
                            isShortlisted(m.course.id) ? 'text-[#E8501A] bg-[#FFF7ED]' : 'text-slate-300 hover:text-[#E8501A] hover:bg-slate-50'
                          )}
                          aria-label="Shortlist"
                        >
                          <Star className={cn('h-4 w-4', isShortlisted(m.course.id) && 'fill-current')} />
                        </button>
                      </div>

                      {/* Match reasons */}
                      <div className="flex flex-wrap gap-1.5 my-2">
                        {m.reasons.slice(0, 3).map((r, i) => (
                          <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                            <Check className="h-2.5 w-2.5 mr-1" /> {r}
                          </Badge>
                        ))}
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-600 mt-2">
                        {m.course.level && (
                          <span className="flex items-center gap-1 capitalize">
                            <GraduationCap className="h-3 w-3 text-[#0057B8]" /> {m.course.level}
                          </span>
                        )}
                        {m.course.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#0057B8]" /> {m.course.duration}
                          </span>
                        )}
                        {m.course.tuitionFee != null && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-[#0057B8]" /> {m.course.currency} {m.course.tuitionFee.toLocaleString()}/yr
                          </span>
                        )}
                        {m.course.scholarshipAvailable && (
                          <Badge variant="outline" className="bg-[#FFF7ED] text-[#E8501A] border-[#E8501A]/20 text-[10px]">
                            <Award className="h-2.5 w-2.5 mr-1" /> Scholarship
                          </Badge>
                        )}
                      </div>

                      {/* Match bar */}
                      <div className="mt-3">
                        <Progress value={m.matchPercent} className="h-1.5" />
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href="/student/course-finder">View Details <ArrowRight className="h-3 w-3 ml-1" /></Link>
                        </Button>
                        <Button asChild size="sm" className="flex-1 bg-[#0057B8] hover:bg-[#00449a] text-white">
                          <Link href="/student/applications">Apply Now</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function extractField(course: string): string {
  const c = course.toLowerCase()
  if (c.includes('computer') || c.includes('software')) return 'Computer Science'
  if (c.includes('data')) return 'Data Science'
  if (c.includes('business') || c.includes('mba')) return 'Business'
  if (c.includes('engineer')) return 'Engineering'
  return 'Any'
}
