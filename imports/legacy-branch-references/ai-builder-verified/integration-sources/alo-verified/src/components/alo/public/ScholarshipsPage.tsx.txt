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
import {
  Search, Award, DollarSign, GraduationCap, ArrowRight,
  Globe, Calendar, CheckCircle2, Lightbulb, Clock, Star, AlertTriangle, Sparkles,
} from 'lucide-react'

const scholarships = [
  { id: '1', name: 'Chevening Scholarship', uni: 'UK Government', country: 'UK', coverage: 'Full', level: 'Postgraduate', amount: 'Full Tuition + Living', deadline: 'Nov 2025', deadlineUrgency: 'medium', eligibility: '2+ years work experience, leadership potential', featured: true },
  { id: '2', name: 'Commonwealth Scholarship', uni: 'Commonwealth Commission', country: 'UK', coverage: 'Full', level: 'Postgraduate', amount: 'Full Funding', deadline: 'Dec 2025', deadlineUrgency: 'low', eligibility: 'Citizens of Commonwealth countries', featured: true },
  { id: '3', name: 'Fulbright Scholarship', uni: 'US Government', country: 'USA', coverage: 'Full', level: 'Postgraduate', amount: 'Full Tuition + Stipend', deadline: 'Oct 2025', deadlineUrgency: 'high', eligibility: 'Academic excellence, community engagement', featured: true },
  { id: '4', name: 'Australia Awards', uni: 'Australian Government', country: 'Australia', coverage: 'Full', level: 'Postgraduate', amount: 'Full Funding', deadline: 'Apr 2025', deadlineUrgency: 'high', eligibility: 'Developing country citizens', featured: true },
  { id: '5', name: 'Vanier Canada Graduate Scholarship', uni: 'Canadian Government', country: 'Canada', coverage: 'Partial', level: 'PhD', amount: 'CAD 50,000/year', deadline: 'Nov 2025', deadlineUrgency: 'medium', eligibility: 'Doctoral research excellence', featured: false },
  { id: '6', name: 'DAAD Scholarship', uni: 'DAAD Germany', country: 'Germany', coverage: 'Full', level: 'Postgraduate', amount: '€934-1,200/month', deadline: 'Varies', deadlineUrgency: 'low', eligibility: 'International students for German universities', featured: false },
  { id: '7', name: 'Gates Cambridge Scholarship', uni: 'University of Cambridge', country: 'UK', coverage: 'Full', level: 'Postgraduate', amount: 'Full Funding', deadline: 'Dec 2025', deadlineUrgency: 'medium', eligibility: 'Outstanding academic achievement', featured: false },
  { id: '8', name: 'Rhodes Scholarship', uni: 'University of Oxford', country: 'UK', coverage: 'Full', level: 'Postgraduate', amount: 'Full Funding + Stipend', deadline: 'Oct 2025', deadlineUrgency: 'high', eligibility: 'Academic excellence, character, leadership', featured: false },
  { id: '9', name: 'Malaysian International Scholarship', uni: 'Malaysian Government', country: 'Malaysia', coverage: 'Partial', level: 'Postgraduate', amount: 'Full Tuition + Living', deadline: 'Aug 2025', deadlineUrgency: 'medium', eligibility: 'Strong academic background', featured: false },
  { id: '10', name: 'Erasmus Mundus Joint Master', uni: 'European Union', country: 'Germany', coverage: 'Full', level: 'Postgraduate', amount: 'Full Tuition + Travel + Stipend', deadline: 'Jan 2026', deadlineUrgency: 'low', eligibility: 'EU and non-EU students', featured: false },
  { id: '11', name: 'Stanford Knight-Hennessy Scholarship', uni: 'Stanford University', country: 'USA', coverage: 'Full', level: 'Postgraduate', amount: 'Full Tuition + Living', deadline: 'Oct 2025', deadlineUrgency: 'high', eligibility: 'Leadership, civic commitment', featured: false },
  { id: '12', name: 'UQ International Scholarship', uni: 'University of Queensland', country: 'Australia', coverage: 'Partial', level: 'Undergraduate', amount: 'A$10,000/year', deadline: 'May 2025', deadlineUrgency: 'medium', eligibility: 'Academic merit, community involvement', featured: false },
]

const urgencyColors: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' }
const coverageColors: Record<string, string> = { Full: 'bg-[#F37021]/10 text-[#F37021]', Partial: 'bg-[#0066CC]/10 text-[#0066CC]' }

export default function ScholarshipsPage() {
  const { setCurrentView } = useAppStore()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [coverage, setCoverage] = useState('all')
  const [level, setLevel] = useState('all')

  const filtered = useMemo(() => {
    return scholarships.filter(s => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.uni.toLowerCase().includes(search.toLowerCase()) || s.eligibility.toLowerCase().includes(search.toLowerCase())
      const matchCountry = country === 'all' || s.country === country
      const matchCoverage = coverage === 'all' || s.coverage === coverage
      const matchLevel = level === 'all' || s.level === level
      return matchSearch && matchCountry && matchCoverage && matchLevel
    })
  }, [search, country, coverage, level])

  const fullRide = scholarships.filter(s => s.coverage === 'Full' && s.featured)
  const tips = [
    { title: 'Start Early', desc: 'Begin your scholarship search 12-18 months before your intended start date. Many prestigious scholarships have early deadlines.', icon: Clock },
    { title: 'Tailor Your Application', desc: 'Customize each application to highlight how you meet the specific criteria. Generic applications rarely succeed.', icon: Star },
    { title: 'Build Your Profile', desc: 'Focus on academic excellence, leadership experience, and community involvement. These are key criteria for most scholarships.', icon: Award },
    { title: 'Apply Widely', desc: 'Don\'t put all your eggs in one basket. Apply for multiple scholarships to increase your chances of success.', icon: Lightbulb },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0066CC] via-[#1A2332] to-[#0066CC] text-white py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 45%, #FFB347 1px, transparent 1px), radial-gradient(circle at 75% 55%, #F37021 1px, transparent 1px)', backgroundSize: '45px 45px' }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Badge className="bg-[#FFB347]/20 text-[#FFB347] border-[#FFB347]/30 mb-4"><Award className="h-3 w-3 mr-1" />Scholarship Finder</Badge>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Fund Your <span className="bg-gradient-to-r from-[#FFB347] to-[#F37021] bg-clip-text text-transparent">Education Abroad</span>
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl text-lg">Access hundreds of scholarships to fund your international education. Our team helps you identify and apply for the best opportunities.</p>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg">
            {[
              { label: 'Scholarships', value: '100+' },
              { label: 'Full-Ride', value: '20+' },
              { label: 'Funding', value: '$2M+' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-[#FFB347]">{s.value}</div>
                <div className="text-xs text-gray-300 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b py-4 sticky top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search scholarships..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full sm:w-40"><Globe className="h-4 w-4 mr-2 text-gray-400" /><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="UK">🇬🇧 UK</SelectItem>
                <SelectItem value="USA">🇺🇸 USA</SelectItem>
                <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                <SelectItem value="Germany">🇩🇪 Europe</SelectItem>
                <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
              </SelectContent>
            </Select>
            <Select value={coverage} onValueChange={setCoverage}>
              <SelectTrigger className="w-full sm:w-40"><DollarSign className="h-4 w-4 mr-2 text-gray-400" /><SelectValue placeholder="Coverage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coverage</SelectItem>
                <SelectItem value="Full">Full-Ride</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-full sm:w-40"><GraduationCap className="h-4 w-4 mr-2 text-gray-400" /><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                <SelectItem value="PhD">PhD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Featured Full-Ride Scholarships */}
      <section className="bg-[#FFF8F0] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-[#F37021]" />
            <h2 className="text-2xl font-bold text-[#1A2332]">Featured Full-Ride Scholarships</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {fullRide.map(s => (
              <Card key={s.id} className="border-[#F37021]/20 shadow-md hover:shadow-xl transition-all group cursor-pointer overflow-hidden" onClick={() => setCurrentView('scholarships')}>
                <div className="h-1.5 bg-gradient-to-r from-[#F37021] to-[#FFB347]" />
                <CardContent className="p-5">
                  <Badge className={`text-xs mb-3 ${coverageColors[s.coverage]}`}>{s.coverage === 'Full' ? '🎓 Full-Ride' : 'Partial'}</Badge>
                  <h3 className="font-semibold text-[#1A2332] group-hover:text-[#F37021] transition-colors line-clamp-2">{s.name}</h3>
                  <p className="text-xs text-[#555555] mt-1.5 flex items-center gap-1"><GraduationCap className="h-3 w-3" />{s.uni}</p>
                  <p className="text-xs text-[#555555] mt-1 flex items-center gap-1"><Globe className="h-3 w-3" />{s.country}</p>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-sm font-semibold text-green-600"><DollarSign className="h-4 w-4" />{s.amount}</div>
                    <div className={`inline-flex items-center gap-1 mt-2 text-xs px-2 py-1 rounded-full ${urgencyColors[s.deadlineUrgency]}`}>
                      {s.deadlineUrgency === 'high' && <AlertTriangle className="h-3 w-3" />}
                      {s.deadlineUrgency === 'medium' && <Clock className="h-3 w-3" />}
                      <Calendar className="h-3 w-3" />{s.deadline}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1 bg-[#F37021] hover:bg-[#e0651a] text-white text-xs h-8" onClick={e => { e.stopPropagation(); setCurrentView('scholarships') }}>View Details</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-8 border-[#0066CC] text-[#0066CC]" onClick={e => { e.stopPropagation(); setCurrentView('free-consultation') }}>Apply Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All Scholarships */}
      <section className="bg-[#F7F9FC] py-10 min-h-[300px]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-6">All Scholarships <span className="text-[#F37021]">({filtered.length})</span></h2>
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Award className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2332]">No scholarships found</h3>
              <p className="text-[#555555] mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(s => (
                <Card key={s.id} className="border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer" onClick={() => setCurrentView('scholarships')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`text-xs ${coverageColors[s.coverage]}`}>{s.coverage === 'Full' ? '🎓 Full-Ride' : 'Partial'}</Badge>
                      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${urgencyColors[s.deadlineUrgency]}`}>
                        <Calendar className="h-3 w-3" />{s.deadline}
                      </div>
                    </div>
                    <h3 className="font-semibold text-[#1A2332] group-hover:text-[#F37021] transition-colors mt-2">{s.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#555555]"><GraduationCap className="h-3 w-3" />{s.uni} · {s.country}</div>
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#555555]"><span className="font-medium text-[#1A2332]">Eligibility:</span> {s.eligibility}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="flex items-center gap-1 text-sm font-semibold text-green-600"><DollarSign className="h-4 w-4" />{s.amount}</span>
                      <Badge variant="outline" className="text-xs">{s.level}</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={e => { e.stopPropagation(); setCurrentView('scholarships') }}>View Details</Button>
                      <Button size="sm" className="flex-1 bg-[#F37021] hover:bg-[#e0651a] text-white text-xs h-8" onClick={e => { e.stopPropagation(); setCurrentView('free-consultation') }}>Apply Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Scholarship Tips */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3"><Lightbulb className="h-3 w-3 mr-1" />Pro Tips</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Scholarship Success Tips</h2>
            <p className="text-[#555555] mt-2">Maximize your chances of winning a scholarship</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tips.map((tip, i) => (
              <Card key={i} className="border-0 bg-[#F7F9FC] hover:shadow-md transition-all">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#F37021]/10 rounded-xl flex items-center justify-center shrink-0"><tip.icon className="h-5 w-5 text-[#F37021]" /></div>
                  <div>
                    <h4 className="font-semibold text-[#1A2332]">{tip.title}</h4>
                    <p className="text-sm text-[#555555] mt-1">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#0066CC] to-[#1A2332] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 bg-[#F37021] rounded-2xl flex items-center justify-center mx-auto"><Sparkles className="h-8 w-8 text-white" /></div>
          <h2 className="text-3xl lg:text-4xl font-bold">Get Personalized Scholarship Recommendations</h2>
          <p className="text-gray-300 max-w-xl mx-auto">Our experts have helped students secure over $2M in scholarships. Get matched with opportunities that fit your profile.</p>
          <Button onClick={() => setCurrentView('free-consultation')} className="bg-[#F37021] hover:bg-[#e0651a] text-white h-12 px-8 font-semibold">
            Get Recommendations <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  )
}
