'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Heart, Trash2, Building, BookOpen, Award, MapPin, Star, ExternalLink
} from 'lucide-react'

interface FavoriteItem {
  id: string
  type: 'university' | 'course' | 'scholarship'
  name: string
  subtitle: string
  extra: string
  metadata?: Record<string, unknown>
}

export default function StudentFavorites() {
  const { setCurrentView } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    async function fetchFavorites() {
      try {
        setLoading(true)
        // Load universities as potential favorites
        const [uniRes, courseRes, scholarshipRes] = await Promise.all([
          fetch('/api/universities?limit=10'),
          fetch('/api/courses?limit=10'),
          fetch('/api/universities?limit=5'), // scholarships are associated with universities
        ])

        const items: FavoriteItem[] = []

        if (uniRes.ok) {
          const json = await uniRes.json()
          ;(json.universities || []).forEach((u: Record<string, unknown>) => {
            items.push({
              id: u.id as string,
              type: 'university',
              name: u.name as string,
              subtitle: `${u.country as string}${u.city ? `, ${u.city as string}` : ''}`,
              extra: `Ranking: ${u.ranking || 'N/A'}`,
              metadata: u,
            })
          })
        }

        if (courseRes.ok) {
          const json = await courseRes.json()
          ;(json.courses || []).forEach((c: Record<string, unknown>) => {
            items.push({
              id: c.id as string,
              type: 'course',
              name: c.name as string,
              subtitle: `${c.level as string || 'N/A'} | ${c.field as string || ''}`,
              extra: `Fee: ${c.tuitionFee ? `${c.currency || 'GBP'} ${c.tuitionFee}` : 'N/A'}`,
              metadata: c,
            })
          })
        }

        // Add some scholarship items from university data
        if (scholarshipRes.ok) {
          const json = await scholarshipRes.json()
          ;(json.universities || []).filter((u: Record<string, unknown>) => u.scholarshipAvailable).forEach((u: Record<string, unknown>) => {
            items.push({
              id: `sch-${u.id as string}`,
              type: 'scholarship',
              name: `Scholarship at ${u.name as string}`,
              subtitle: u.country as string,
              extra: 'Merit & Need-based available',
              metadata: u,
            })
          })
        }

        // Simulate "favorited" subset
        setFavorites(items.slice(0, Math.min(8, items.length)))
      } catch {
        toast.error('Failed to load favorites')
      } finally {
        setLoading(false)
      }
    }
    fetchFavorites()
  }, [])

  function removeFavorite(id: string) {
    setFavorites(prev => prev.filter(f => f.id !== id))
    toast.success('Removed from favorites')
  }

  function navigateToDetail(item: FavoriteItem) {
    if (item.type === 'university') {
      setCurrentView('universities', { id: item.id })
    } else if (item.type === 'course') {
      setCurrentView('courses', { id: item.id })
    }
  }

  const filtered = activeTab === 'all' ? favorites : favorites.filter(f => f.type === activeTab)

  const typeIcons = {
    university: Building,
    course: BookOpen,
    scholarship: Award,
  }

  const typeColors = {
    university: '#0066CC',
    course: '#F37021',
    scholarship: '#22C55E',
  }

  if (loading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><div className="grid sm:grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>My Favorites</h1>
        <p className="text-gray-500 text-sm">{favorites.length} saved items</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({favorites.length})</TabsTrigger>
          <TabsTrigger value="university">Universities ({favorites.filter(f => f.type === 'university').length})</TabsTrigger>
          <TabsTrigger value="course">Courses ({favorites.filter(f => f.type === 'course').length})</TabsTrigger>
          <TabsTrigger value="scholarship">Scholarships ({favorites.filter(f => f.type === 'scholarship').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filtered.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A2332' }}>No Favorites Yet</h3>
                <p className="text-gray-500 text-sm">Start exploring and save universities, courses, and scholarships you&apos;re interested in.</p>
                <div className="flex justify-center gap-3 mt-4">
                  <Button variant="outline" onClick={() => setCurrentView('universities')}>Browse Universities</Button>
                  <Button variant="outline" onClick={() => setCurrentView('courses')}>Browse Courses</Button>
                  <Button variant="outline" onClick={() => setCurrentView('scholarships')}>Browse Scholarships</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => {
                const Icon = typeIcons[item.type]
                const color = typeColors[item.type]
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <Badge className="text-xs capitalize" style={{ backgroundColor: color, color: 'white' }}>{item.type}</Badge>
                        </div>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFavorite(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: '#1A2332' }}>{item.name}</h3>
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{item.subtitle}</p>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{item.extra}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => navigateToDetail(item)}
                      >
                        View Details <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
