'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  BookOpen,
  Clock,
  TrendingUp,
  Tag,
  Mail,
  Loader2,
} from 'lucide-react'

const categories = ['All', 'Study UK', 'Study USA', 'Visa Guide', 'Scholarships', 'Student Life', 'Tips']

const featuredPost = {
  id: 'featured',
  title: 'The Ultimate Guide to Studying in the UK in 2025: Everything You Need to Know',
  excerpt: 'From choosing the right university to securing your visa, this comprehensive guide covers every aspect of studying in the UK as a Bangladeshi student in 2025.',
  category: 'Study UK',
  date: '2025-01-15',
  readTime: '12 min read',
}

const blogPosts = [
  { id: '1', title: 'Top 10 Tips for Your UK Student Visa Interview', excerpt: 'Preparing for your UK student visa interview? Here are the top 10 tips from our UKVI-certified consultants.', category: 'Visa Guide', date: '2024-12-15', readTime: '8 min read' },
  { id: '2', title: 'Why Canada is the Best Destination for Bangladeshi Students', excerpt: 'Discover why Canada continues to be the top choice for Bangladeshi students, from affordable tuition to clear PR pathways.', category: 'Study USA', date: '2024-12-10', readTime: '6 min read' },
  { id: '3', title: 'Complete Guide to IELTS Preparation', excerpt: 'Everything you need to know about preparing for the IELTS exam, from study materials to practice strategies.', category: 'Tips', date: '2024-12-05', readTime: '10 min read' },
  { id: '4', title: 'How to Write a Winning Personal Statement', excerpt: 'Your personal statement can make or break your university application. Learn how to write one that stands out.', category: 'Tips', date: '2024-11-28', readTime: '7 min read' },
  { id: '5', title: 'Understanding the Australian Student Visa Process', excerpt: 'A step-by-step guide to the Australian Student Visa (Subclass 500) application process.', category: 'Visa Guide', date: '2024-11-20', readTime: '9 min read' },
  { id: '6', title: 'Scholarships Available for Bangladeshi Students in 2025', excerpt: 'A comprehensive list of scholarships available for Bangladeshi students looking to study abroad in 2025.', category: 'Scholarships', date: '2024-11-15', readTime: '11 min read' },
  { id: '7', title: 'Life as an International Student in London', excerpt: 'What to expect when you arrive in London — accommodation, part-time work, culture, and more.', category: 'Student Life', date: '2024-11-10', readTime: '6 min read' },
  { id: '8', title: 'USA vs UK: Which is Better for Your Masters?', excerpt: 'A detailed comparison of Masters programs in the USA and UK to help you make the right choice.', category: 'Study USA', date: '2024-11-05', readTime: '8 min read' },
  { id: '9', title: 'How to Prepare for Your First Week Abroad', excerpt: 'Practical tips for your first week as an international student, from setting up a bank account to making friends.', category: 'Student Life', date: '2024-10-28', readTime: '5 min read' },
]

const popularPosts = [
  { title: 'Top 10 Tips for UK Visa Interview', views: '12.5K' },
  { title: 'Complete IELTS Preparation Guide', views: '9.8K' },
  { title: 'Scholarships for Bangladeshi Students', views: '8.2K' },
  { title: 'USA vs UK for Masters Programs', views: '7.1K' },
]

const tags = ['UK', 'USA', 'Canada', 'Australia', 'IELTS', 'Visa', 'Scholarship', 'Student Life', 'PR', 'Masters']

export default function BlogPage() {
  const { setCurrentView } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [visibleCount, setVisibleCount] = useState(6)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const filtered = selectedCategory === 'All'
    ? blogPosts
    : blogPosts.filter(p => p.category === selectedCategory)

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return d }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2332] via-[#1e2d42] to-[#0066CC] text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-4">Blog</Badge>
          <h1 className="text-4xl lg:text-5xl font-bold">
            Study Abroad <span className="text-[#F37021]">Insights & Guides</span>
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto text-lg">Expert tips, guides, and stories to help you navigate your study abroad journey with confidence.</p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b py-4 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setVisibleCount(6) }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat ? 'bg-[#F37021] text-white' : 'bg-gray-100 text-[#555555] hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="bg-[#F7F9FC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          {selectedCategory === 'All' && (
            <Card className="border-0 shadow-lg overflow-hidden cursor-pointer group mb-8" onClick={() => setCurrentView('blog')}>
              <div className="grid lg:grid-cols-2">
                <div className="h-64 lg:h-auto bg-gradient-to-br from-[#0066CC]/30 to-[#F37021]/30 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-[#0066CC]/50" />
                </div>
                <CardContent className="p-6 lg:p-8 flex flex-col justify-center">
                  <Badge className="bg-[#F37021] text-white w-fit mb-3">Featured</Badge>
                  <h2 className="text-2xl font-bold text-[#1A2332] group-hover:text-[#F37021] transition-colors leading-tight">{featuredPost.title}</h2>
                  <p className="text-[#555555] mt-3 leading-relaxed">{featuredPost.excerpt}</p>
                  <div className="flex items-center gap-3 mt-4 text-sm text-[#555555]">
                    <Badge variant="outline" className="text-[#F37021] border-[#F37021]/30">{featuredPost.category}</Badge>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {featuredPost.readTime}</span>
                    <span>{formatDate(featuredPost.date)}</span>
                  </div>
                  <div className="flex items-center text-[#F37021] font-medium mt-4">
                    Read Article <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </div>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Blog Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.slice(0, visibleCount).map((post) => (
                  <Card key={post.id} className="border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer" onClick={() => setCurrentView('blog')}>
                    <div className="h-44 bg-gradient-to-br from-[#0066CC]/20 to-[#F37021]/20 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-[#0066CC]/40" />
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-[#F37021]/10 text-[#F37021] border-0 text-xs">{post.category}</Badge>
                        <span className="text-xs text-[#555555] flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                      </div>
                      <h3 className="font-semibold text-[#1A2332] group-hover:text-[#F37021] transition-colors line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-[#555555] mt-2 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-[#555555]">{formatDate(post.date)}</span>
                        <span className="text-[#F37021] text-sm font-medium flex items-center gap-1">Read More <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {visibleCount < filtered.length && (
                <div className="text-center mt-8">
                  <Button variant="outline" onClick={() => setVisibleCount(prev => prev + 6)} className="border-[#F37021] text-[#F37021] hover:bg-[#F37021] hover:text-white px-8">
                    Load More
                  </Button>
                </div>
              )}
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#1A2332]">No articles found</h3>
                  <p className="text-sm text-[#555555] mt-1">Try a different category.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular Posts */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1A2332] mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#F37021]" /> Popular Posts
                  </h3>
                  <div className="space-y-4">
                    {popularPosts.map((post, i) => (
                      <div key={i} className="flex items-start gap-3 cursor-pointer group">
                        <div className="w-7 h-7 bg-[#F37021]/10 rounded-lg flex items-center justify-center text-[#F37021] text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A2332] group-hover:text-[#F37021] transition-colors line-clamp-2">{post.title}</p>
                          <p className="text-xs text-[#555555] mt-0.5">{post.views} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1A2332] mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.filter(c => c !== 'All').map((cat) => {
                      const count = blogPosts.filter(p => p.category === cat).length
                      return (
                        <button key={cat} onClick={() => { setSelectedCategory(cat); setVisibleCount(6) }}
                          className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                          <span className="text-sm text-[#555555]">{cat}</span>
                          <Badge variant="outline" className="text-xs">{count}</Badge>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1A2332] mb-4 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#0066CC]" /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-[#F37021] hover:text-white hover:border-[#F37021] transition-all text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-[#1A2332] to-[#0066CC] text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="w-14 h-14 bg-[#F37021] rounded-xl flex items-center justify-center mx-auto">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold">Stay Updated</h2>
          <p className="text-gray-300 max-w-md mx-auto">Get the latest study abroad tips, guides, and scholarship alerts delivered to your inbox.</p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-green-300">
              <Badge className="bg-green-600/20 text-green-300 border-green-600/30">✓ Subscribed successfully!</Badge>
            </div>
          ) : (
            <div className="flex max-w-md mx-auto gap-2">
              <Input placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
              <Button onClick={() => { if (email) setSubscribed(true) }} className="bg-[#F37021] hover:bg-[#e0651a] text-white shrink-0">Subscribe</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
