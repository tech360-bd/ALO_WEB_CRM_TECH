'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, GraduationCap, Globe, Clock, DollarSign, Award, Filter,
  ChevronDown, ChevronUp, X, Sparkles, Send, MapPin, Star, TrendingUp,
  Building2, BookOpen, Zap, Calendar, CheckCircle2, Ban, Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { toast } from 'sonner'

interface University {
  id: string
  name: string
  country: string
  city: string | null
  ranking: number | null
  scholarshipAvailable: boolean
}
interface Course {
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
  university: University
}

const LS_KEY = 'alo-partner-search-programs-filters-v1'

const QUICK_FILTERS = [
  { id: 'fasterOfferTAT', label: 'Faster Offer TAT' },
  { id: 'scholarship', label: 'Scholarship Available' },
  { id: 'highAcceptance', label: 'High Offer Acceptance' },
  { id: 'elpWaiver', label: 'English Proficiency Waiver' },
  { id: 'affordable', label: 'Affordable University' },
  { id: 'coop', label: 'Co-op & Internships' },
  { id: 'highJobDemand', label: 'High Job Demand' },
  { id: 'noDeposit', label: 'No Tuition Deposit' },
  { id: 'nonCollateralLoan', label: 'Eligible Non-Collateral Loan' },
  { id: 'lowDeposit', label: 'Low Tuition Deposit' },
  { id: 'noInterview', label: 'No Interview Required' },
  { id: 'mba', label: 'MBA Programs' },
  { id: 'moiAcceptable', label: 'MOI Acceptable' },
  { id: 'ownEnglishTest', label: 'University Own English Test' },
]

const PROGRAM_LEVELS = ['foundation', 'undergraduate', 'postgraduate', 'phd', 'diploma']
const INTAKES = ['January 2026', 'May 2026', 'September 2026', 'January 2027', 'May 2027', 'September 2027']

interface FilterState {
  search: string
  intake: string
  year: string
  nationality: string
  state: string
  level: string
  country: string
  province: string
  studyArea: string
  discipline: string
  duration: string
  eslAvailable: boolean
  ielts: string
  pte: string
  toefl: string
  det: string
  sat: string
  act: string
  gre: string
  gmat: string
  withoutEnglish: boolean
  withoutGre: boolean
  withoutGmat: boolean
  withoutMaths: boolean
  stem: boolean
  appFeeWaiver: boolean
  scholarship: boolean
  openPrograms: boolean
  quick: string[]
}

const defaultFilters: FilterState = {
  search: '', intake: '', year: '', nationality: '', state: '', level: '',
  country: '', province: '', studyArea: '', discipline: '', duration: '',
  eslAvailable: false, ielts: '', pte: '', toefl: '', det: '', sat: '',
  act: '', gre: '', gmat: '', withoutEnglish: false, withoutGre: false,
  withoutGmat: false, withoutMaths: false, stem: false, appFeeWaiver: false,
  scholarship: false, openPrograms: false, quick: [],
}

function loadFilters(): FilterState {
  if (typeof window === 'undefined') return defaultFilters
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return defaultFilters
    return { ...defaultFilters, ...JSON.parse(raw) }
  } catch {
    return defaultFilters
  }
}

function saveFilters(f: FilterState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(f)) } catch {}
}

export default function SearchProgramsPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [hydrated, setHydrated] = useState(false)
  const [showAllFilters, setShowAllFilters] = useState(false)
  const [applyDialog, setApplyDialog] = useState<{ course: Course } | null>(null)
  const [applyNote, setApplyNote] = useState('')

  // Load filters from localStorage on mount
  useEffect(() => {
    setFilters(loadFilters())
    setHydrated(true)
  }, [])

  // Persist filters
  useEffect(() => {
    if (hydrated) saveFilters(filters)
  }, [filters, hydrated])

  const { data: coursesData, loading } = usePortalData<{ courses: Course[] }>({
    endpoint: '/api/courses',
    params: { limit: 100, status: 'active' },
  })
  const { data: uniData } = usePortalData<{ universities: University[] }>({
    endpoint: '/api/universities',
    params: { limit: 100 },
  })

  const courses = coursesData?.courses ?? []
  const universities = uniData?.universities ?? []

  const countries = useMemo(
    () => Array.from(new Set(universities.map((u) => u.country).filter(Boolean))).sort(),
    [universities]
  )

  const fields = useMemo(
    () => Array.from(new Set(courses.map((c) => c.field).filter(Boolean) as string[])).sort(),
    [courses]
  )

  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleQuick = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      quick: prev.quick.includes(id)
        ? prev.quick.filter((q) => q !== id)
        : [...prev.quick, id],
    }))
  }

  const clearAll = () => setFilters(defaultFilters)

  // Filtering logic
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const f = filters
      const text = (f.search || '').toLowerCase()
      if (text) {
        const hay = `${c.name} ${c.university.name} ${c.field || ''} ${c.level || ''}`.toLowerCase()
        if (!hay.includes(text)) return false
      }
      if (f.level && c.level !== f.level) return false
      if (f.country && c.university.country !== f.country) return false
      if (f.studyArea && c.field !== f.studyArea) return false
      if (f.discipline && !((c.field || '') + ' ' + (c.name || '')).toLowerCase().includes(f.discipline.toLowerCase())) return false
      if (f.duration && !(c.duration || '').toLowerCase().includes(f.duration.toLowerCase())) return false
      if (f.scholarship && !c.scholarshipAvailable) return false
      if (f.appFeeWaiver) {
        // No application-fee info in schema; derive from tuitionFee < 12000 as proxy for "affordable"
        if (c.tuitionFee !== null && c.tuitionFee > 12000) return false
      }
      if (f.stem && !/engineering|computer|data science|mathematics|statistics|technology|physics|chemistry|biology|ai|cyber/i.test(c.name + ' ' + (c.field || ''))) return false
      if (f.mba && !/mba|business administration/i.test(c.name)) return false
      if (f.affordable && (c.tuitionFee ?? 0) > 15000) return false
      if (f.ownEnglishTest && !/own english|duolingo|moi|medium of instruction/i.test(c.englishRequirement || '')) return false
      if (f.moiAcceptable && !/moi|medium of instruction/i.test(c.englishRequirement || '')) return false
      if (f.eslAvailable && !/esl|elp|english language|pathway|pre-sessional|foundation english/i.test(c.englishRequirement || '' + ' ' + (c.entryRequirements || ''))) return false
      if (f.elpWaiver && !/waiver|exempt|moi|medium of instruction/i.test(c.englishRequirement || '')) return false
      if (f.withoutEnglish && c.englishRequirement && /ielts|pte|toefl|duolingo/i.test(c.englishRequirement)) return false
      if (f.ielts && c.englishRequirement) {
        const m = c.englishRequirement.match(/ielts[^0-9]*([0-9.]+)/i)
        if (!m || parseFloat(m[1]) > parseFloat(f.ielts)) {
          // ok if it's "IELTS 6.5" and user typed "6.0", that means they want programs requiring <=6.0... show if requirement <= user score
          if (!m || parseFloat(m[1]) > parseFloat(f.ielts)) return false
        }
      }
      if (f.toefl && c.englishRequirement) {
        const m = c.englishRequirement.match(/toefl[^0-9]*([0-9]+)/i)
        if (m && parseInt(m[1]) > parseInt(f.toefl)) return false
      }
      if (f.pte && c.englishRequirement) {
        const m = c.englishRequirement.match(/pte[^0-9]*([0-9.]+)/i)
        if (m && parseFloat(m[1]) > parseFloat(f.pte)) return false
      }
      if (f.det && c.englishRequirement) {
        const m = c.englishRequirement.match(/duolingo[^0-9]*([0-9]+)/i)
        if (m && parseInt(m[1]) > parseInt(f.det)) return false
      }
      if (f.withoutGre && c.entryRequirements && /gre/i.test(c.entryRequirements)) return false
      if (f.withoutGmat && c.entryRequirements && /gmat/i.test(c.entryRequirements)) return false
      if (f.withoutMaths && /math|mathematics|calculus|statistics/i.test(c.entryRequirements || '')) return false
      if (f.openPrograms && c.university.status !== 'active') return false
      // Quick filters that are pure UX tags (no schema backing) — soft pass through
      return true
    })
  }, [courses, filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.level) count++
    if (filters.country) count++
    if (filters.studyArea) count++
    if (filters.discipline) count++
    if (filters.duration) count++
    if (filters.scholarship) count++
    if (filters.stem) count++
    if (filters.eslAvailable) count++
    if (filters.withoutEnglish) count++
    if (filters.withoutGre) count++
    if (filters.withoutGmat) count++
    if (filters.withoutMaths) count++
    if (filters.appFeeWaiver) count++
    if (filters.openPrograms) count++
    count += filters.quick.length
    return count
  }, [filters])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Search Programs"
        description="Powerful program search across all partner universities — find the perfect fit for every student."
        action={
          activeFilterCount > 0 ? (
            <Button variant="outline" onClick={clearAll}>
              <X className="h-4 w-4 mr-1" /> Clear all ({activeFilterCount})
            </Button>
          ) : undefined
        }
      />

      {/* Quick filter chips */}
      <Card className="p-3 border-0 shadow-sm">
        <div className="flex items-start gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-500 px-2 py-1 shrink-0 flex items-center gap-1">
            <Zap className="h-3 w-3 text-[#E8501A]" /> Quick:
          </span>
          {QUICK_FILTERS.map((q) => {
            const active = filters.quick.includes(q.id)
            return (
              <button
                key={q.id}
                onClick={() => toggleQuick(q.id)}
                className={
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ' +
                  (active
                    ? 'bg-[#0057B8] text-white border-[#0057B8]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#0057B8] hover:text-[#0057B8]')
                }
              >
                {q.label}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar filters */}
        <Card className="border-0 shadow-sm p-4 h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto alo-scrollbar">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Search Program / University</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={filters.search}
                  onChange={(e) => update('search', e.target.value)}
                  placeholder="Keyword…"
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <FilterGroup label="Intake">
              <Select value={filters.intake || 'any'} onValueChange={(v) => update('intake', v === 'any' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Any intake" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any intake</SelectItem>
                  {INTAKES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Year">
              <Select value={filters.year || 'any'} onValueChange={(v) => update('year', v === 'any' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Any year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any year</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                  <SelectItem value="2028">2028</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Student Nationality">
              <Input value={filters.nationality} onChange={(e) => update('nationality', e.target.value)} placeholder="e.g. Bangladesh" className="h-9 text-sm" />
            </FilterGroup>

            <FilterGroup label="Student State / Province">
              <Input value={filters.state} onChange={(e) => update('state', e.target.value)} placeholder="e.g. Dhaka" className="h-9 text-sm" />
            </FilterGroup>

            <FilterGroup label="Program Level">
              <Select value={filters.level || 'any'} onValueChange={(v) => update('level', v === 'any' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Any level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any level</SelectItem>
                  {PROGRAM_LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Country">
              <Select value={filters.country || 'any'} onValueChange={(v) => update('country', v === 'any' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Any country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any country</SelectItem>
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Province / State (Uni)">
              <Input value={filters.province} onChange={(e) => update('province', e.target.value)} placeholder="e.g. Ontario" className="h-9 text-sm" />
            </FilterGroup>

            <FilterGroup label="Study Area">
              <Select value={filters.studyArea || 'any'} onValueChange={(v) => update('studyArea', v === 'any' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Any area" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any area</SelectItem>
                  {fields.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Discipline Area">
              <Input value={filters.discipline} onChange={(e) => update('discipline', e.target.value)} placeholder="e.g. Business, IT" className="h-9 text-sm" />
            </FilterGroup>

            <FilterGroup label="Duration">
              <Select value={filters.duration || 'any'} onValueChange={(v) => update('duration', v === 'any' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Any duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any duration</SelectItem>
                  <SelectItem value="1 year">1 year</SelectItem>
                  <SelectItem value="2 year">2 years</SelectItem>
                  <SelectItem value="3 year">3 years</SelectItem>
                  <SelectItem value="4 year">4 years</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>

            {/* Collapsible advanced */}
            <div>
              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className="w-full flex items-center justify-between text-xs font-semibold text-[#0057B8] py-2"
              >
                <span>Advanced Filters</span>
                {showAllFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showAllFilters && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <CheckboxRow label="ESL / ELP Available" checked={filters.eslAvailable} onCheckedChange={(v) => update('eslAvailable', v === true)} />
                  <CheckboxRow label="Without English Proficiency" checked={filters.withoutEnglish} onCheckedChange={(v) => update('withoutEnglish', v === true)} />
                  <CheckboxRow label="Without GRE" checked={filters.withoutGre} onCheckedChange={(v) => update('withoutGre', v === true)} />
                  <CheckboxRow label="Without GMAT" checked={filters.withoutGmat} onCheckedChange={(v) => update('withoutGmat', v === true)} />
                  <CheckboxRow label="Without Maths" checked={filters.withoutMaths} onCheckedChange={(v) => update('withoutMaths', v === true)} />
                  <CheckboxRow label="STEM Programs" checked={filters.stem} onCheckedChange={(v) => update('stem', v === true)} />
                  <CheckboxRow label="Application Fee Waiver" checked={filters.appFeeWaiver} onCheckedChange={(v) => update('appFeeWaiver', v === true)} />
                  <CheckboxRow label="Scholarship Available" checked={filters.scholarship} onCheckedChange={(v) => update('scholarship', v === true)} />
                  <CheckboxRow label="Open Programs Only" checked={filters.openPrograms} onCheckedChange={(v) => update('openPrograms', v === true)} />

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">English Test Scores (Your student)</p>
                    <ScoreRow label="IELTS" value={filters.ielts} onChange={(v) => update('ielts', v)} placeholder="6.5" />
                    <ScoreRow label="PTE" value={filters.pte} onChange={(v) => update('pte', v)} placeholder="58" />
                    <ScoreRow label="TOEFL" value={filters.toefl} onChange={(v) => update('toefl', v)} placeholder="79" />
                    <ScoreRow label="DET" value={filters.det} onChange={(v) => update('det', v)} placeholder="105" />
                    <ScoreRow label="SAT" value={filters.sat} onChange={(v) => update('sat', v)} placeholder="1200" />
                    <ScoreRow label="ACT" value={filters.act} onChange={(v) => update('act', v)} placeholder="27" />
                    <ScoreRow label="GRE" value={filters.gre} onChange={(v) => update('gre', v)} placeholder="310" />
                    <ScoreRow label="GMAT" value={filters.gmat} onChange={(v) => update('gmat', v)} placeholder="650" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-slate-600">
              {loading ? 'Loading programs…' : (
                <><span className="font-bold text-slate-900">{filtered.length}</span> program{filtered.length !== 1 ? 's' : ''} found</>
              )}
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 border-0 shadow-sm">
                  <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse mb-4" />
                  <div className="h-16 bg-slate-100 rounded animate-pulse" />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 border-0 shadow-sm text-center">
              <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium mb-1">No programs match your filters</p>
              <p className="text-xs text-slate-400 mb-4">Try widening your search criteria.</p>
              <Button onClick={clearAll} variant="outline">
                <X className="h-4 w-4 mr-2" /> Clear all filters
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filtered.map((c) => (
                <ProgramCard
                  key={c.id}
                  course={c}
                  onApply={() => { setApplyDialog({ course: c }); setApplyNote('') }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply dialog */}
      <Dialog open={!!applyDialog} onOpenChange={(open) => !open && setApplyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Program</DialogTitle>
            <DialogDescription>
              Submit an interest note for <span className="font-semibold text-slate-900">{applyDialog?.course.name}</span> at{' '}
              <span className="font-semibold text-slate-900">{applyDialog?.course.university.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="p-3 rounded-lg bg-slate-50 text-sm">
              <p className="font-semibold text-slate-900">{applyDialog?.course.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {applyDialog?.course.university.name} • {applyDialog?.course.university.country}
                {applyDialog?.course.tuitionFee ? ` • ${applyDialog.course.currency} ${applyDialog.course.tuitionFee.toLocaleString()}/yr` : ''}
              </p>
            </div>
            <div>
              <Label>Student name / notes</Label>
              <Textarea
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                placeholder="e.g. Tanvir Ahmed — wants Sep 2026 intake, IELTS 6.5"
                className="mt-1"
                rows={3}
              />
            </div>
            <p className="text-xs text-slate-500">
              The ALO counselor team will review your request and follow up within 1 business day.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                toast.success('Application interest submitted! Our team will be in touch.')
                setApplyDialog(null)
              }}
              className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
            >
              <Send className="h-4 w-4 mr-2" /> Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function CheckboxRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={label} checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} className="h-4 w-4" />
      <Label htmlFor={label} className="text-xs cursor-pointer text-slate-700">{label}</Label>
    </div>
  )
}

function ScoreRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600 w-14 shrink-0">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-8 text-xs" />
    </div>
  )
}

function ProgramCard({ course, onApply }: { course: Course; onApply: () => void }) {
  const tags: string[] = []
  if (course.scholarshipAvailable) tags.push('Scholarship')
  if (/stem|engineering|computer|data|ai|cyber/i.test(course.name + ' ' + (course.field || ''))) tags.push('STEM')
  if (/mba|business administration/i.test(course.name)) tags.push('MBA')
  if (/co-?op|internship|placement/i.test(course.description || '')) tags.push('Co-op')
  if (/moi|medium of instruction/i.test(course.englishRequirement || '')) tags.push('MOI')
  if (/waiver|exempt/i.test(course.englishRequirement || '')) tags.push('ELP Waiver')
  if ((course.tuitionFee ?? 99999) < 12000) tags.push('Affordable')

  const ieltsMatch = course.englishRequirement?.match(/ielts[^0-9]*([0-9.]+)/i)
  const ieltsScore = ieltsMatch ? ieltsMatch[1] : null

  return (
    <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white font-bold text-xs flex items-center justify-center shrink-0">
          {course.university.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{course.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{course.university.name}</p>
        </div>
        {course.university.ranking && (
          <Badge variant="outline" className="bg-[#EFF6FF] text-[#0057B8] border-blue-200 shrink-0">
            <Star className="h-3 w-3 mr-1" /> #{course.university.ranking}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <Meta icon={MapPin} label={`${course.university.country}${course.university.city ? ', ' + course.university.city : ''}`} />
        <Meta icon={GraduationCap} label={course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : '—'} />
        <Meta icon={Clock} label={course.duration || '—'} />
        <Meta icon={DollarSign} label={course.tuitionFee ? `${course.currency} ${course.tuitionFee.toLocaleString()}/yr` : '—'} />
        <Meta icon={Award} label={course.scholarshipAvailable ? 'Scholarship' : 'No scholarship'} />
        <Meta icon={Globe} label={ieltsScore ? `IELTS ${ieltsScore}` : (course.englishRequirement ? 'See req.' : '—')} />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((t) => (
            <span key={t} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#FFF7ED] text-[#E8501A] border border-orange-200">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" asChild>
          <Link href={`/partner/deadlines`}>
            <Calendar className="h-3.5 w-3.5 mr-1" /> Deadlines
          </Link>
        </Button>
        <Button size="sm" className="flex-1 bg-[#E8501A] hover:bg-[#c8420f] text-white border-0" onClick={onApply}>
          <Send className="h-3.5 w-3.5 mr-1" /> Apply
        </Button>
      </div>
    </Card>
  )
}

function Meta({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
      <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  )
}
