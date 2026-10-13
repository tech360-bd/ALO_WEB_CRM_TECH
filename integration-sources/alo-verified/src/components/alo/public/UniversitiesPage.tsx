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
  Search, MapPin, GraduationCap, BookOpen, ArrowRight,
  Award, Globe, Building2, ChevronDown, ChevronUp, PoundSterling,
} from 'lucide-react'

const universities = [
  { id: '1', name: 'University of Oxford', country: 'UK', city: 'Oxford', ranking: 1, courses: 85, tuitionFrom: 26550, tuitionTo: 38850, color: '#002147', type: 'Research', scholarship: true },
  { id: '2', name: 'University of Cambridge', country: 'UK', city: 'Cambridge', ranking: 2, courses: 78, tuitionFrom: 28000, tuitionTo: 42000, color: '#003366', type: 'Research', scholarship: true },
  { id: '3', name: 'Imperial College London', country: 'UK', city: 'London', ranking: 6, courses: 62, tuitionFrom: 33000, tuitionTo: 45600, color: '#003E74', type: 'STEM', scholarship: true },
  { id: '4', name: 'University of Toronto', country: 'Canada', city: 'Toronto', ranking: 21, courses: 95, tuitionFrom: 38000, tuitionTo: 58000, color: '#002044', type: 'Research', scholarship: true },
  { id: '5', name: 'Harvard University', country: 'USA', city: 'Cambridge', ranking: 4, courses: 120, tuitionFrom: 52000, tuitionTo: 55000, color: '#A51C30', type: 'Ivy League', scholarship: true },
  { id: '6', name: 'MIT', country: 'USA', city: 'Cambridge', ranking: 3, courses: 68, tuitionFrom: 53000, tuitionTo: 57000, color: '#A31F34', type: 'STEM', scholarship: true },
  { id: '7', name: 'University of Melbourne', country: 'Australia', city: 'Melbourne', ranking: 33, courses: 88, tuitionFrom: 29000, tuitionTo: 48000, color: '#7B2D26', type: 'Research', scholarship: true },
  { id: '8', name: 'University of Sydney', country: 'Australia', city: 'Sydney', ranking: 41, courses: 76, tuitionFrom: 31000, tuitionTo: 52000, color: '#D6001C', type: 'Research', scholarship: true },
  { id: '9', name: 'TU Munich', country: 'Germany', city: 'Munich', ranking: 50, courses: 55, tuitionFrom: 0, tuitionTo: 3000, color: '#006B3F', type: 'STEM', scholarship: true },
  { id: '10', name: 'University of British Columbia', country: 'Canada', city: 'Vancouver', ranking: 34, courses: 72, tuitionFrom: 36000, tuitionTo: 52000, color: '#002145', type: 'Research', scholarship: true },
  { id: '11', name: 'University of Manchester', country: 'UK', city: 'Manchester', ranking: 32, courses: 90, tuitionFrom: 22000, tuitionTo: 35000, color: '#660099', type: 'Research', scholarship: true },
  { id: '12', name: 'University of Malaya', country: 'Malaysia', city: 'Kuala Lumpur', ranking: 65, courses: 60, tuitionFrom: 5000, tuitionTo: 12000, color: '#003B6F', type: 'Research', scholarship: true },
  { id: '13', name: 'Stanford University', country: 'USA', city: 'Stanford', ranking: 5, courses: 95, tuitionFrom: 55000, tuitionTo: 58000, color: '#8C1515', type: 'Research', scholarship: true },
  { id: '14', name: 'UCL London', country: 'UK', city: 'London', ranking: 9, courses: 110, tuitionFrom: 24000, tuitionTo: 38000, color: '#500778', type: 'Research', scholarship: true },
  { id: '15', name: 'Monash University', country: 'Australia', city: 'Melbourne', ranking: 44, courses: 82, tuitionFrom: 28000, tuitionTo: 44000, color: '#0060A9', type: 'Research', scholarship: true },
  { id: '16', name: 'ETH Zurich', country: 'Germany', city: 'Zurich', ranking: 8, courses: 45, tuitionFrom: 1500, tuitionTo: 1500, color: '#1A3C6E', type: 'STEM', scholarship: true },
]

const getFlag = (c: string) => ({ UK: '🇬🇧', USA: '🇺🇸', Canada: '🇨🇦', Australia: '🇦🇺', Germany: '🇩🇪', Malaysia: '🇲🇾' }[c] || '🌍')
const getCurrency = (c: string) => ({ UK: '£', USA: '$', Canada: 'C$', Australia: 'A$', Germany: '€', Malaysia: 'RM' }[c] || '$')
const getInitials = (n: string) => n.split(' ').filter(w => !['of', 'the', 'and', 'for'].includes(w.toLowerCase())).map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function UniversitiesPage() {
  const { setCurrentView } = useAppStore()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [rankingRange, setRankingRange] = useState('all')
  const [courseLevel, setCourseLevel] = useState('all')
  const [tuitionRange, setTuitionRange] = useState('all')
  const [showAll, setShowAll] = useState(false)

  const featured = universities.slice(0, 4)

  const filtered = useMemo(() => {
    return universities.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.country.toLowerCase().includes(search.toLowerCase()) || u.city.toLowerCase().includes(search.toLowerCase())
      const matchCountry = country === 'all' || u.country === country
      const matchRanking = rankingRange === 'all' || (rankingRange === 'top10' ? u.ranking <= 10 : rankingRange === 'top25' ? u.ranking <= 25 : rankingRange === 'top50' ? u.ranking <= 50 : u.ranking <= 100)
      const matchTuition = tuitionRange === 'all' || (tuitionRange === 'free' ? u.tuitionFrom === 0 : tuitionRange === 'low' ? u.tuitionFrom < 15000 : tuitionRange === 'mid' ? u.tuitionFrom >= 15000 && u.tuitionFrom <= 40000 : u.tuitionFrom > 40000)
      return matchSearch && matchCountry && matchRanking && matchTuition
    })
  }, [search, country, rankingRange, courseLevel, tuitionRange])

  const displayed = showAll ? filtered : filtered.slice(0, 9)

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1A2332] via-[#1A2332] to-[#0066CC] text-white py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #F37021 1px, transparent 1px), radial-gradient(circle at 80% 30%, #0066CC 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-4">330+ Partner Universities</Badge>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Explore <span className="bg-gradient-to-r from-[#F37021] to-[#FFB347] bg-clip-text text-transparent">World-Class</span> Universities
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl text-lg">Browse our extensive network of partner universities across the UK, USA, Canada, Australia, Europe, and Malaysia.</p>
          <div className="mt-8 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input placeholder="Search universities by name, country, or course..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-14 text-base bg-white/10 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm" />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b py-4 sticky top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full sm:w-44"><Globe className="h-4 w-4 mr-2 text-gray-400" /><SelectValue placeholder="Country" /></SelectTrigger>
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
            <Select value={rankingRange} onValueChange={setRankingRange}>
              <SelectTrigger className="w-full sm:w-44"><Award className="h-4 w-4 mr-2 text-gray-400" /><SelectValue placeholder="Ranking" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rankings</SelectItem>
                <SelectItem value="top10">Top 10</SelectItem>
                <SelectItem value="top25">Top 25</SelectItem>
                <SelectItem value="top50">Top 50</SelectItem>
                <SelectItem value="top100">Top 100</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseLevel} onValueChange={setCourseLevel}>
              <SelectTrigger className="w-full sm:w-44"><GraduationCap className="h-4 w-4 mr-2 text-gray-400" /><SelectValue placeholder="Course Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="undergraduate">Undergraduate</SelectItem>
                <SelectItem value="postgraduate">Postgraduate</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tuitionRange} onValueChange={setTuitionRange}>
              <SelectTrigger className="w-full sm:w-44"><PoundSterling className="h-4 w-4 mr-2 text-gray-400" /><SelectValue placeholder="Tuition Fee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Budget</SelectItem>
                <SelectItem value="free">Free / Nominal</SelectItem>
                <SelectItem value="low">Under £15k</SelectItem>
                <SelectItem value="mid">£15k - £40k</SelectItem>
                <SelectItem value="high">£40k+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Featured Universities */}
      <section className="bg-[#F7F9FC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-2">Featured</Badge>
              <h2 className="text-2xl font-bold text-[#1A2332]">Top-Ranked Universities</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map(u => (
              <Card key={u.id} className="border-0 shadow-md hover:shadow-xl transition-all group cursor-pointer overflow-hidden" onClick={() => setCurrentView('universities')}>
                <div className="h-2" style={{ background: u.color }} />
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: u.color }}>{getInitials(u.name)}</div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#1A2332] group-hover:text-[#F37021] transition-colors line-clamp-1 text-sm">{u.name}</h3>
                      <p className="text-xs text-[#555555] flex items-center gap-1"><MapPin className="h-3 w-3" />{u.city}, {getFlag(u.country)} {u.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-[#F37021]/10 text-[#F37021] border-0 text-xs font-semibold">QS #{u.ranking}</Badge>
                    <Badge variant="outline" className="text-xs">{u.type}</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#555555]">
                    <div className="flex items-center gap-1.5"><BookOpen className="h-3 w-3 text-[#0066CC]" /> {u.courses} Courses</div>
                    <div className="flex items-center gap-1.5"><PoundSterling className="h-3 w-3 text-green-600" /> {u.tuitionFrom === 0 ? 'Free / Nominal' : `${getCurrency(u.country)}${u.tuitionFrom.toLocaleString()} - ${getCurrency(u.country)}${u.tuitionTo.toLocaleString()}`}</div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="flex-1 bg-[#F37021] hover:bg-[#e0651a] text-white text-xs h-8" onClick={e => { e.stopPropagation(); setCurrentView('universities') }}>View Details</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-8 border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC]/5" onClick={e => { e.stopPropagation(); setCurrentView('free-consultation') }}>Apply Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All Universities Grid */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1A2332]">All Universities <span className="text-[#F37021]">({filtered.length})</span></h2>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2332]">No universities found</h3>
              <p className="text-[#555555] mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayed.map(u => (
                  <Card key={u.id} className="border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer" onClick={() => setCurrentView('universities')}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: u.color }}>{getInitials(u.name)}</div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-[#1A2332] group-hover:text-[#F37021] transition-colors line-clamp-1">{u.name}</h3>
                          <p className="text-xs text-[#555555] flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{u.city}, {getFlag(u.country)} {u.country}</p>
                        </div>
                        <Badge className="bg-[#F37021]/10 text-[#F37021] border-0 text-xs font-semibold shrink-0">QS #{u.ranking}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs"><BookOpen className="h-3 w-3 mr-1" />{u.courses} Courses</Badge>
                        {u.scholarship && <Badge className="text-xs bg-green-50 text-green-700 border-0"><Award className="h-3 w-3 mr-1" />Scholarships</Badge>}
                      </div>
                      <div className="text-xs text-[#555555] flex items-center gap-1.5 mb-4">
                        <PoundSterling className="h-3 w-3 text-green-600" />
                        {u.tuitionFrom === 0 ? 'Free / Nominal fee' : `${getCurrency(u.country)}${u.tuitionFrom.toLocaleString()} - ${getCurrency(u.country)}${u.tuitionTo.toLocaleString()}/yr`}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={e => { e.stopPropagation(); setCurrentView('universities') }}>View Details</Button>
                        <Button size="sm" className="flex-1 bg-[#F37021] hover:bg-[#e0651a] text-white text-xs h-8" onClick={e => { e.stopPropagation(); setCurrentView('free-consultation') }}>Apply Now</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {filtered.length > 9 && (
                <div className="text-center mt-8">
                  <Button variant="outline" size="lg" onClick={() => setShowAll(!showAll)} className="border-[#F37021] text-[#F37021] hover:bg-[#F37021]/5">
                    {showAll ? <><ChevronUp className="h-4 w-4 mr-2" />Show Less</> : <><ChevronDown className="h-4 w-4 mr-2" />Load More ({filtered.length - 9} more)</>}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#1A2332] to-[#0066CC] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 bg-[#F37021] rounded-2xl flex items-center justify-center mx-auto"><Building2 className="h-8 w-8 text-white" /></div>
          <h2 className="text-3xl lg:text-4xl font-bold">Can&apos;t Find Your University?</h2>
          <p className="text-gray-300 max-w-xl mx-auto">We partner with 330+ universities worldwide. Tell us what you&apos;re looking for and we&apos;ll find the perfect match.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => setCurrentView('free-consultation')} className="bg-[#F37021] hover:bg-[#e0651a] text-white h-12 px-8 font-semibold">
              Get Free Guidance <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button onClick={() => setCurrentView('contact')} variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
