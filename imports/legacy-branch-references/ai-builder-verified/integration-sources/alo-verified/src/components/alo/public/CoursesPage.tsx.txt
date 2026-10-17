'use client'

import React, { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Search, BookOpen, Clock, DollarSign, GraduationCap, ArrowRight,
  Globe, Briefcase, Stethoscope, Cpu, Scale, Palette, FlaskConical,
  TrendingUp, GraduationCap as Edu, Users, SlidersHorizontal, X,
} from 'lucide-react'

const courses = [
  { id: '1', name: 'MSc Computer Science', uni: 'Imperial College London', country: 'UK', level: 'Postgraduate', field: 'IT', duration: '1 Year', fee: 35600, currency: '£' },
  { id: '2', name: 'MBA International Business', uni: 'University of Melbourne', country: 'Australia', level: 'MBA', field: 'Business', duration: '2 Years', fee: 44000, currency: 'A$' },
  { id: '3', name: 'BEng Mechanical Engineering', uni: 'University of Manchester', country: 'UK', level: 'Undergraduate', field: 'Engineering', duration: '4 Years', fee: 27000, currency: '£' },
  { id: '4', name: 'MBBS Medicine', uni: 'University of Sydney', country: 'Australia', level: 'Undergraduate', field: 'Medicine', duration: '6 Years', fee: 52000, currency: 'A$' },
  { id: '5', name: 'LLB Law', uni: 'University of Cambridge', country: 'UK', level: 'Undergraduate', field: 'Law', duration: '3 Years', fee: 29000, currency: '£' },
  { id: '6', name: 'BA Fine Arts', uni: 'University of Toronto', country: 'Canada', level: 'Undergraduate', field: 'Arts', duration: '4 Years', fee: 42000, currency: 'C$' },
  { id: '7', name: 'PhD Data Science', uni: 'MIT', country: 'USA', level: 'PhD', field: 'IT', duration: '4-5 Years', fee: 55000, currency: '$' },
  { id: '8', name: 'MSc Biomedical Science', uni: 'UCL London', country: 'UK', level: 'Postgraduate', field: 'Science', duration: '1 Year', fee: 32000, currency: '£' },
  { id: '9', name: 'BSc Psychology', uni: 'University of British Columbia', country: 'Canada', level: 'Undergraduate', field: 'Social Science', duration: '4 Years', fee: 38000, currency: 'C$' },
  { id: '10', name: 'MEd Education Leadership', uni: 'University of Oxford', country: 'UK', level: 'Postgraduate', field: 'Education', duration: '1 Year', fee: 28500, currency: '£' },
  { id: '11', name: 'BBA Business Administration', uni: 'University of Malaya', country: 'Malaysia', level: 'Undergraduate', field: 'Business', duration: '3 Years', fee: 8000, currency: 'RM' },
  { id: '12', name: 'MSc Artificial Intelligence', uni: 'TU Munich', country: 'Germany', level: 'Postgraduate', field: 'IT', duration: '2 Years', fee: 3000, currency: '€' },
  { id: '13', name: 'MSc Finance & Accounting', uni: 'Harvard University', country: 'USA', level: 'Postgraduate', field: 'Business', duration: '2 Years', fee: 52000, currency: '$' },
  { id: '14', name: 'BSc Computer Engineering', uni: 'Monash University', country: 'Australia', level: 'Undergraduate', field: 'Engineering', duration: '4 Years', fee: 39000, currency: 'A$' },
  { id: '15', name: 'MA International Relations', uni: 'Stanford University', country: 'USA', level: 'Postgraduate', field: 'Social Science', duration: '2 Years', fee: 54000, currency: '$' },
]

const fields = [
  { name: 'Business', icon: Briefcase, count: 45, color: '#F37021' },
  { name: 'Engineering', icon: Cpu, count: 38, color: '#0066CC' },
  { name: 'Medicine', icon: Stethoscope, count: 22, color: '#dc2626' },
  { name: 'IT', icon: Cpu, count: 52, color: '#7c3aed' },
  { name: 'Law', icon: Scale, count: 15, color: '#1A2332' },
  { name: 'Arts', icon: Palette, count: 18, color: '#ec4899' },
  { name: 'Science', icon: FlaskConical, count: 30, color: '#059669' },
  { name: 'MBA', icon: TrendingUp, count: 25, color: '#F37021' },
  { name: 'Education', icon: Edu, count: 12, color: '#0066CC' },
  { name: 'Social Science', icon: Users, count: 20, color: '#6366f1' },
]

const levelColors: Record<string, string> = {
  Undergraduate: 'bg-blue-100 text-blue-700',
  Postgraduate: 'bg-purple-100 text-purple-700',
  PhD: 'bg-green-100 text-green-700',
  MBA: 'bg-orange-100 text-orange-700',
  Diploma: 'bg-yellow-100 text-yellow-700',
}

function FilterPanel({ level, setLevel, field, setField, country, setCountry, feeRange, setFeeRange, duration, setDuration }: {
  level: string; setLevel: (v: string) => void; field: string; setField: (v: string) => void; country: string; setCountry: (v: string) => void; feeRange: string; setFeeRange: (v: string) => void; duration: string; setDuration: (v: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="font-semibold text-[#1A2332] mb-3 text-sm">Level</h4>
        <div className="space-y-2">
          {['Undergraduate', 'Postgraduate', 'PhD', 'MBA'].map(l => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={level === l} onChange={() => setLevel(level === l ? 'all' : l)} className="accent-[#F37021]" />
              <span className="text-sm text-[#555555]">{l}</span>
            </label>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="font-semibold text-[#1A2332] mb-3 text-sm">Field of Study</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {fields.map(f => (
            <label key={f.name} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={field === f.name} onChange={() => setField(field === f.name ? 'all' : f.name)} className="accent-[#F37021]" />
              <span className="text-sm text-[#555555]">{f.name} ({f.count})</span>
            </label>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="font-semibold text-[#1A2332] mb-3 text-sm">Country</h4>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger><SelectValue placeholder="All Countries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
            <SelectItem value="USA">🇺🇸 United States</SelectItem>
            <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
            <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
            <SelectItem value="Germany">🇩🇪 Europe</SelectItem>
            <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div>
        <h4 className="font-semibold text-[#1A2332] mb-3 text-sm">Tuition Fee / Year</h4>
        <Select value={feeRange} onValueChange={setFeeRange}>
          <SelectTrigger><SelectValue placeholder="Any Budget" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Budget</SelectItem>
            <SelectItem value="low">Under £10k</SelectItem>
            <SelectItem value="mid">£10k - £40k</SelectItem>
            <SelectItem value="high">£40k+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div>
        <h4 className="font-semibold text-[#1A2332] mb-3 text-sm">Duration</h4>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger><SelectValue placeholder="Any Duration" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Duration</SelectItem>
            <SelectItem value="1yr">1 Year</SelectItem>
            <SelectItem value="2yr">2 Years</SelectItem>
            <SelectItem value="long">3+ Years</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const { setCurrentView } = useAppStore()
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('all')
  const [field, setField] = useState('all')
  const [country, setCountry] = useState('all')
  const [feeRange, setFeeRange] = useState('all')
  const [duration, setDuration] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.uni.toLowerCase().includes(search.toLowerCase()) || c.field.toLowerCase().includes(search.toLowerCase())
      const matchLevel = level === 'all' || c.level === level
      const matchField = field === 'all' || c.field === field
      const matchCountry = country === 'all' || c.country === country
      const matchFee = feeRange === 'all' || (feeRange === 'low' ? c.fee < 10000 : feeRange === 'mid' ? c.fee >= 10000 && c.fee <= 40000 : c.fee > 40000)
      const matchDuration = duration === 'all' || (duration === '1yr' ? c.duration.includes('1 Year') : duration === '2yr' ? c.duration.includes('2 Year') : c.duration.includes('4') || c.duration.includes('6'))
      return matchSearch && matchLevel && matchField && matchCountry && matchFee && matchDuration
    })
  }, [search, level, field, country, feeRange, duration])

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1A2332] via-[#0066CC] to-[#1A2332] text-white py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #F37021 1px, transparent 1px), radial-gradient(circle at 70% 60%, #0066CC 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-4">Course Finder</Badge>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Find Your <span className="bg-gradient-to-r from-[#F37021] to-[#FFB347] bg-clip-text text-transparent">Perfect Course</span>
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl text-lg">Explore thousands of courses across top universities. Filter by level, field, and budget to find your ideal program.</p>
          <div className="mt-8 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input placeholder="Search courses by name, field, or university..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-14 text-base bg-white/10 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm" />
          </div>
        </div>
      </section>

      {/* Popular Fields */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="font-semibold text-[#1A2332] mb-4">Popular Fields</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {fields.map(f => (
              <button key={f.name} onClick={() => setField(field === f.name ? 'all' : f.name)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${field === f.name ? 'bg-[#F37021] text-white border-[#F37021]' : 'bg-gray-50 text-[#555555] border-gray-200 hover:border-[#F37021]/30 hover:bg-[#F37021]/5'}`}>
                <f.icon className="h-4 w-4" />
                {f.name}
                <span className="text-xs opacity-70">({f.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-[#F7F9FC] py-10 min-h-[400px]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-72 shrink-0">
              <Card className="border-0 shadow-sm sticky top-24">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1A2332]">Filters</h3>
                    <Button variant="ghost" size="sm" className="text-xs text-[#F37021]" onClick={() => { setLevel('all'); setField('all'); setCountry('all'); setFeeRange('all'); setDuration('all') }}>Clear All</Button>
                  </div>
                  <FilterPanel level={level} setLevel={setLevel} field={field} setField={setField} country={country} setCountry={setCountry} feeRange={feeRange} setFeeRange={setFeeRange} duration={duration} setDuration={setDuration} />
                </CardContent>
              </Card>
            </div>

            {/* Mobile Filter Button */}
            <button onClick={() => setShowFilters(true)} className="lg:hidden fixed bottom-6 right-6 z-30 bg-[#F37021] text-white p-4 rounded-full shadow-lg hover:bg-[#e0651a]">
              <SlidersHorizontal className="h-5 w-5" />
            </button>

            {/* Mobile Filter Drawer */}
            {showFilters && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1A2332]">Filters</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></Button>
                  </div>
                  <FilterPanel level={level} setLevel={setLevel} field={field} setField={setField} country={country} setCountry={setCountry} feeRange={feeRange} setFeeRange={setFeeRange} duration={duration} setDuration={setDuration} />
                </div>
              </div>
            )}

            {/* Course Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-[#555555]">{filtered.length} courses found</p>
              </div>
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#1A2332]">No courses found</h3>
                  <p className="text-[#555555] mt-2">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map(c => (
                    <Card key={c.id} className="border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer" onClick={() => setCurrentView('courses')}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={`text-xs ${levelColors[c.level] || 'bg-gray-100 text-gray-700'}`}>{c.level}</Badge>
                          <Badge variant="outline" className="text-xs">{c.field}</Badge>
                        </div>
                        <h3 className="font-semibold text-[#1A2332] group-hover:text-[#F37021] transition-colors line-clamp-2 mt-2">{c.name}</h3>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-[#555555]">
                          <GraduationCap className="h-3 w-3 text-[#0066CC]" />{c.uni}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#555555]">
                          <Globe className="h-3 w-3" />{c.country}
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                          <span className="flex items-center gap-1 text-xs text-[#555555]"><Clock className="h-3 w-3" />{c.duration}</span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><DollarSign className="h-3 w-3" />{c.currency}{c.fee.toLocaleString()}/yr</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={e => { e.stopPropagation(); setCurrentView('courses') }}>View Details</Button>
                          <Button size="sm" className="flex-1 bg-[#F37021] hover:bg-[#e0651a] text-white text-xs h-8" onClick={e => { e.stopPropagation(); setCurrentView('free-consultation') }}>Apply</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#F37021] to-[#e0651a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">Need Help Choosing?</h2>
          <p className="text-orange-100 max-w-xl mx-auto">Talk to our expert counselors who can help you find the perfect course for your career goals.</p>
          <Button onClick={() => setCurrentView('free-consultation')} className="bg-white text-[#F37021] hover:bg-gray-100 h-12 px-8 font-semibold">
            Talk to Our Experts <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  )
}
