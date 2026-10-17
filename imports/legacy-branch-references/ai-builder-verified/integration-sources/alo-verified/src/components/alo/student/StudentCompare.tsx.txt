'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  GitCompare, Search, X, MapPin, Star, Award, BookOpen, DollarSign,
  Building, GraduationCap, Trophy
} from 'lucide-react'

interface University {
  id: string
  name: string
  country: string
  city: string
  ranking: number | null
  type: string | null
  description: string | null
  fees: string | null
  scholarshipAvailable: boolean
  website: string | null
  _count?: { courses: number; applications: number; scholarships: number }
}

export default function StudentCompare() {
  const { setCurrentView } = useAppStore()
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<University[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<University[]>([])

  useEffect(() => {
    async function fetchUniversities() {
      try {
        setLoading(true)
        const res = await fetch('/api/universities?limit=50')
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setUniversities(json.universities || [])
      } catch {
        toast.error('Failed to load universities')
      } finally {
        setLoading(false)
      }
    }
    fetchUniversities()
  }, [])

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase()
      setSearchResults(universities.filter(u =>
        u.name.toLowerCase().includes(q) || u.country.toLowerCase().includes(q) || (u.city && u.city.toLowerCase().includes(q))
      ).slice(0, 8))
    } else {
      setSearchResults([])
    }
  }, [search, universities])

  function addUniversity(u: University) {
    if (selected.length >= 3) { toast.error('Maximum 3 universities for comparison'); return }
    if (selected.find(s => s.id === u.id)) { toast.error('Already selected'); return }
    setSelected(prev => [...prev, u])
    setSearch('')
    setSearchResults([])
  }

  function removeUniversity(id: string) {
    setSelected(prev => prev.filter(u => u.id !== id))
  }

  if (loading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>Compare Universities</h1>
        <p className="text-gray-500 text-sm">Select 2-3 universities to compare side by side</p>
      </div>

      {/* Search & Select */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.map(u => (
              <Badge key={u.id} className="flex items-center gap-1 px-3 py-1" style={{ backgroundColor: '#0066CC', color: 'white' }}>
                {u.name}
                <button onClick={() => removeUniversity(u.id)} className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {selected.length < 3 && (
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search universities..."
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E5E7EB' }}
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
                    {searchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => addUniversity(u)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{u.name}</span>
                        <span className="text-gray-400 text-xs">{u.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {selected.length < 2 && (
            <p className="text-xs text-gray-500">Select at least 2 universities to compare (max 3)</p>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selected.length >= 2 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" style={{ color: '#F37021' }} />
              <CardTitle style={{ color: '#1A2332' }}>Comparison</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                    <th className="text-left py-3 px-3 font-medium w-36" style={{ color: '#1A2332' }}>Feature</th>
                    {selected.map(u => (
                      <th key={u.id} className="text-center py-3 px-3 font-medium" style={{ color: '#1A2332' }}>
                        <div>
                          <p className="text-sm">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.city && `${u.city}, `}{u.country}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Ranking', icon: Trophy, render: (u: University) => u.ranking ? `#${u.ranking}` : 'N/A' },
                    { label: 'Type', icon: Building, render: (u: University) => u.type || 'N/A' },
                    { label: 'Location', icon: MapPin, render: (u: University) => `${u.city || ''}, ${u.country}` },
                    { label: 'Tuition Fees', icon: DollarSign, render: (u: University) => u.fees || 'Contact for details' },
                    { label: 'Courses', icon: BookOpen, render: (u: University) => `${u._count?.courses || 0} available` },
                    { label: 'Scholarship', icon: Award, render: (u: University) => u.scholarshipAvailable ? '✅ Available' : '❌ Not available' },
                    { label: 'Applications', icon: GraduationCap, render: (u: University) => `${u._count?.applications || 0} submitted` },
                    { label: 'Website', icon: Star, render: (u: University) => u.website ? (
                      <a href={u.website} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: '#0066CC' }}>Visit</a>
                    ) : 'N/A' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-0" style={{ borderColor: '#F3F4F6' }}>
                      <td className="py-3 px-3 font-medium text-gray-600">
                        <div className="flex items-center gap-2">
                          <row.icon className="w-3.5 h-3.5 text-gray-400" />
                          {row.label}
                        </div>
                      </td>
                      {selected.map(u => (
                        <td key={u.id} className="py-3 px-3 text-center text-gray-700">{row.render(u)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Description Comparison */}
            {selected.some(u => u.description) && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3" style={{ color: '#1A2332' }}>Descriptions</h3>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
                  {selected.map(u => (
                    <div key={u.id} className="p-3 rounded-lg text-sm text-gray-600" style={{ backgroundColor: '#F7F9FC' }}>
                      <p className="font-medium mb-1" style={{ color: '#1A2332' }}>{u.name}</p>
                      <p className="text-xs leading-relaxed">{u.description || 'No description available.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <GitCompare className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A2332' }}>Select Universities to Compare</h3>
            <p className="text-gray-500 text-sm">Search and add at least 2 universities above to see a side-by-side comparison.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
