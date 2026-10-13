'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus, Search, Filter, Edit, Trash2, Eye, FileText, HelpCircle,
  Star, Image as ImageIcon, Calendar, ArrowUp, ArrowDown, Copy,
  Clock, CheckCircle, Globe, BookOpen, MessageSquare, LayoutGrid,
  GripVertical, ExternalLink, Upload, X
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───

interface BlogPost {
  id: string
  title: string
  slug: string
  category: string
  author: string
  status: 'draft' | 'published' | 'scheduled'
  publishedDate: string
  views: number
  featuredImage: string
  content: string
  seoMetaTitle: string
  seoMetaDescription: string
  tags: string[]
}

interface CMSPage {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  lastUpdated: string
  content: string
  metaTitle: string
  metaDescription: string
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  status: 'active' | 'inactive'
}

interface Testimonial {
  id: string
  studentName: string
  university: string
  country: string
  rating: number
  status: 'active' | 'inactive'
  quote: string
  course: string
  image: string
}

interface MediaItem {
  id: string
  filename: string
  url: string
  width: number
  height: number
  uploadedDate: string
  alt: string
  size: string
}

// ─── Brand Colors ───
const BRAND = { orange: '#F37021', navy: '#1A2332', blue: '#0066CC' }

// ─── Status Badge Map ───
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-sky-100 text-sky-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
}

const blogCategories = ['Study Abroad', 'Scholarships', 'Visa Guide', 'University Reviews', 'IELTS Tips', 'Student Life', 'Career', 'Country Guide']
const faqCategories = ['General', 'Admissions', 'Visa', 'Scholarships', 'IELTS', 'Accommodation', 'Fees', 'Applications']

// ─── Mock Data ───

const INIT_POSTS: BlogPost[] = [
  { id: 'bp1', title: 'Complete Guide to Studying in the UK', slug: 'complete-guide-studying-uk', category: 'Study Abroad', author: 'Sarah Ahmed', status: 'published', publishedDate: '2025-01-15', views: 2450, featuredImage: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', content: 'The UK is one of the most popular destinations for international students...', seoMetaTitle: 'Study in UK - Complete Guide for Bangladeshi Students', seoMetaDescription: 'Everything you need to know about studying in the UK', tags: ['UK', 'Study Abroad', 'Guide'] },
  { id: 'bp2', title: 'Top 10 Scholarships for Bangladeshi Students', slug: 'top-10-scholarships-bangladeshi-students', category: 'Scholarships', author: 'Ali Khan', status: 'published', publishedDate: '2025-01-10', views: 3100, featuredImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', content: 'Finding scholarships can be a daunting task...', seoMetaTitle: 'Top Scholarships for Bangladeshi Students 2025', seoMetaDescription: 'Discover the best scholarships available for Bangladeshi students', tags: ['Scholarships', 'Bangladesh', 'Funding'] },
  { id: 'bp3', title: 'Australia Student Visa Step-by-Step', slug: 'australia-student-visa-step-by-step', category: 'Visa Guide', author: 'Jane Wilson', status: 'published', publishedDate: '2025-01-05', views: 1890, featuredImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800', content: 'Getting an Australian student visa requires careful preparation...', seoMetaTitle: 'Australia Student Visa Guide - Step by Step Process', seoMetaDescription: 'Complete guide to Australian student visa application', tags: ['Australia', 'Visa', 'Guide'] },
  { id: 'bp4', title: 'IELTS Score Requirements for Top Universities', slug: 'ielts-score-requirements-top-universities', category: 'IELTS Tips', author: 'Sarah Ahmed', status: 'draft', publishedDate: '', views: 0, featuredImage: '', content: 'Different universities have different IELTS requirements...', seoMetaTitle: 'IELTS Score Requirements - Top Universities Guide', seoMetaDescription: 'Find out IELTS score requirements for top universities worldwide', tags: ['IELTS', 'Universities', 'Requirements'] },
  { id: 'bp5', title: 'Student Life in Canada: What to Expect', slug: 'student-life-canada-what-to-expect', category: 'Student Life', author: 'Mike Chen', status: 'scheduled', publishedDate: '2025-03-01', views: 0, featuredImage: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800', content: 'Canada offers an incredible student experience...', seoMetaTitle: 'Student Life in Canada - Complete Guide', seoMetaDescription: 'What to expect as an international student in Canada', tags: ['Canada', 'Student Life', 'Guide'] },
  { id: 'bp6', title: 'University of Melbourne Review', slug: 'university-of-melbourne-review', category: 'University Reviews', author: 'Ali Khan', status: 'published', publishedDate: '2024-12-20', views: 1240, featuredImage: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800', content: 'The University of Melbourne is consistently ranked...', seoMetaTitle: 'University of Melbourne Review 2025', seoMetaDescription: 'An in-depth review of University of Melbourne', tags: ['Australia', 'University', 'Review'] },
  { id: 'bp7', title: 'How to Write a Winning Personal Statement', slug: 'how-to-write-winning-personal-statement', category: 'Admissions', author: 'Jane Wilson', status: 'draft', publishedDate: '', views: 0, featuredImage: '', content: 'Your personal statement is your chance to stand out...', seoMetaTitle: 'Writing a Winning Personal Statement Guide', seoMetaDescription: 'Tips and tricks for writing an impressive personal statement', tags: ['Admissions', 'Personal Statement', 'Tips'] },
  { id: 'bp8', title: 'Study in Malaysia: Affordable Education', slug: 'study-in-malaysia-affordable-education', category: 'Country Guide', author: 'Sarah Ahmed', status: 'published', publishedDate: '2024-12-10', views: 890, featuredImage: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', content: 'Malaysia is becoming an increasingly popular destination...', seoMetaTitle: 'Study in Malaysia - Affordable Education Guide', seoMetaDescription: 'Why Malaysia is a great affordable study destination', tags: ['Malaysia', 'Affordable', 'Education'] },
]

const INIT_PAGES: CMSPage[] = [
  { id: 'pg1', title: 'About Us', slug: 'about-us', status: 'published', lastUpdated: '2025-01-20', content: 'ALO Education is a leading education consultancy...', metaTitle: 'About ALO Education', metaDescription: 'Learn about ALO Education and our mission' },
  { id: 'pg2', title: 'Our Services', slug: 'our-services', status: 'published', lastUpdated: '2025-01-18', content: 'We offer comprehensive services for students...', metaTitle: 'Our Services - ALO Education', metaDescription: 'Explore our range of education services' },
  { id: 'pg3', title: 'Privacy Policy', slug: 'privacy-policy', status: 'published', lastUpdated: '2025-01-01', content: 'Your privacy is important to us...', metaTitle: 'Privacy Policy', metaDescription: 'ALO Education privacy policy' },
  { id: 'pg4', title: 'Terms & Conditions', slug: 'terms-and-conditions', status: 'published', lastUpdated: '2025-01-01', content: 'These terms govern your use of our services...', metaTitle: 'Terms & Conditions', metaDescription: 'ALO Education terms and conditions' },
  { id: 'pg5', title: 'Partner With Us', slug: 'partner-with-us', status: 'draft', lastUpdated: '2025-01-15', content: 'Become a partner of ALO Education...', metaTitle: 'Partner With ALO Education', metaDescription: 'Partnership opportunities with ALO Education' },
  { id: 'pg6', title: 'Career Opportunities', slug: 'career-opportunities', status: 'draft', lastUpdated: '2025-01-10', content: 'Join our growing team...', metaTitle: 'Careers - ALO Education', metaDescription: 'Career opportunities at ALO Education' },
]

const INIT_FAQS: FAQ[] = [
  { id: 'fq1', question: 'How do I apply to study abroad?', answer: 'You can start by booking a free consultation with our counselors who will guide you through the entire process from university selection to visa application.', category: 'General', order: 1, status: 'active' },
  { id: 'fq2', question: 'What are the IELTS requirements?', answer: 'IELTS requirements vary by university and program. Generally, undergraduate programs require 6.0-6.5 and postgraduate programs require 6.5-7.0.', category: 'IELTS', order: 2, status: 'active' },
  { id: 'fq3', question: 'How long does the visa process take?', answer: 'Visa processing times vary by country. UK visas typically take 3-4 weeks, Australian visas 4-6 weeks, and Canadian visas 4-8 weeks.', category: 'Visa', order: 3, status: 'active' },
  { id: 'fq4', question: 'Are there scholarships available?', answer: 'Yes, many universities offer scholarships for international students. Our team will help you identify and apply for relevant scholarships.', category: 'Scholarships', order: 4, status: 'active' },
  { id: 'fq5', question: 'What is the cost of studying in the UK?', answer: 'Tuition fees in the UK range from £10,000 to £38,000 per year depending on the university and program. Living costs are approximately £1,000-1,500 per month.', category: 'Fees', order: 5, status: 'active' },
  { id: 'fq6', question: 'Can I work while studying?', answer: 'Most countries allow international students to work part-time. UK allows 20 hours/week, Australia allows 48 hours/fortnight, and Canada allows 20 hours/week during term time.', category: 'General', order: 6, status: 'active' },
  { id: 'fq7', question: 'How do I find accommodation?', answer: 'We assist students in finding university dormitories or private accommodation. Many universities guarantee housing for first-year international students.', category: 'Accommodation', order: 7, status: 'active' },
  { id: 'fq8', question: 'What documents do I need for admission?', answer: 'Typically you need academic transcripts, IELTS scores, a personal statement, reference letters, and a valid passport. Specific requirements vary by university.', category: 'Admissions', order: 8, status: 'inactive' },
]

const INIT_TESTIMONIALS: Testimonial[] = [
  { id: 'tm1', studentName: 'Rahim Uddin', university: 'University of Melbourne', country: 'Australia', rating: 5, status: 'active', quote: 'ALO Education made my dream of studying in Australia come true. Their guidance was invaluable throughout the entire process.', course: 'Master of Data Science', image: '' },
  { id: 'tm2', studentName: 'Fatima Begum', university: 'University of Toronto', country: 'Canada', rating: 5, status: 'active', quote: 'I couldn\'t have navigated the Canadian visa process without ALO Education. They were with me every step of the way.', course: 'Bachelor of Computer Science', image: '' },
  { id: 'tm3', studentName: 'Kamal Hossain', university: 'Imperial College London', country: 'UK', rating: 4, status: 'active', quote: 'The counselors at ALO Education are incredibly knowledgeable. They helped me find the perfect program for my career goals.', course: 'MSc Finance', image: '' },
  { id: 'tm4', studentName: 'Nusrat Jahan', university: 'University of Auckland', country: 'New Zealand', rating: 5, status: 'active', quote: 'From university selection to pre-departure briefing, ALO Education handled everything professionally.', course: 'Bachelor of Nursing', image: '' },
  { id: 'tm5', studentName: 'Tanvir Ahmed', university: 'University of Malaya', country: 'Malaysia', rating: 4, status: 'inactive', quote: 'Great support for my Malaysia application. Affordable and quality education guidance.', course: 'MBA', image: '' },
]

const INIT_MEDIA: MediaItem[] = [
  { id: 'md1', filename: 'uk-university-campus.jpg', url: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', width: 1920, height: 1080, uploadedDate: '2025-01-20', alt: 'UK University Campus', size: '245 KB' },
  { id: 'md2', filename: 'scholarship-graduation.jpg', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', width: 1200, height: 800, uploadedDate: '2025-01-18', alt: 'Scholarship Graduation', size: '189 KB' },
  { id: 'md3', filename: 'australia-sydney-harbour.jpg', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800', width: 1600, height: 900, uploadedDate: '2025-01-15', alt: 'Sydney Harbour', size: '312 KB' },
  { id: 'md4', filename: 'canada-student-life.jpg', url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800', width: 1800, height: 1200, uploadedDate: '2025-01-12', alt: 'Student Life in Canada', size: '267 KB' },
  { id: 'md5', filename: 'melbourne-university.jpg', url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800', width: 1400, height: 900, uploadedDate: '2025-01-10', alt: 'Melbourne University', size: '198 KB' },
  { id: 'md6', filename: 'malaysia-petronas-towers.jpg', url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', width: 1200, height: 800, uploadedDate: '2025-01-08', alt: 'Petronas Towers Malaysia', size: '223 KB' },
  { id: 'md7', filename: 'ielts-preparation.jpg', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800', width: 1600, height: 1000, uploadedDate: '2025-01-05', alt: 'IELTS Preparation', size: '156 KB' },
  { id: 'md8', filename: 'visa-application-docs.jpg', url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', width: 1500, height: 1000, uploadedDate: '2025-01-03', alt: 'Visa Application Documents', size: '178 KB' },
]

// ─── Unique ID Generator ───
let idCounter = 100
const genId = (prefix: string) => `${prefix}${++idCounter}`

// ─── Star Rating Component ───
function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >
          <Star
            size={18}
            className={`transition-colors ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function CRMBlog() {
  // ─── Loading State ───
  const [loading, setLoading] = useState(true)

  // ─── Blog Posts State ───
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [postSearch, setPostSearch] = useState('')
  const [postCategoryFilter, setPostCategoryFilter] = useState('all')
  const [postStatusFilter, setPostStatusFilter] = useState('all')
  const [postDialogOpen, setPostDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [deletePostDialog, setDeletePostDialog] = useState(false)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [postForm, setPostForm] = useState({
    title: '', slug: '', category: 'Study Abroad', featuredImage: '', content: '',
    seoMetaTitle: '', seoMetaDescription: '', tags: '', status: 'draft' as 'draft' | 'published' | 'scheduled'
  })

  // ─── Pages State ───
  const [pages, setPages] = useState<CMSPage[]>([])
  const [pageSearch, setPageSearch] = useState('')
  const [pageDialogOpen, setPageDialogOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null)
  const [deletePageDialog, setDeletePageDialog] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<CMSPage | null>(null)
  const [pageForm, setPageForm] = useState({
    title: '', slug: '', content: '', metaTitle: '', metaDescription: '', status: 'draft' as 'draft' | 'published'
  })

  // ─── FAQs State ───
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [faqSearch, setFaqSearch] = useState('')
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all')
  const [faqDialogOpen, setFaqDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [deleteFaqDialog, setDeleteFaqDialog] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null)
  const [faqForm, setFaqForm] = useState({
    question: '', answer: '', category: 'General', status: 'active' as 'active' | 'inactive'
  })

  // ─── Testimonials State ───
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [testimonialSearch, setTestimonialSearch] = useState('')
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [deleteTestimonialDialog, setDeleteTestimonialDialog] = useState(false)
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null)
  const [testimonialForm, setTestimonialForm] = useState({
    studentName: '', university: '', country: '', rating: 5, quote: '', course: '', image: '', status: 'active' as 'active' | 'inactive'
  })

  // ─── Media State ───
  const [media, setMedia] = useState<MediaItem[]>([])
  const [mediaSearch, setMediaSearch] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteMediaDialog, setDeleteMediaDialog] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null)
  const [uploadForm, setUploadForm] = useState({ url: '', alt: '', filename: '' })

  // ─── Fetch Data from API ───
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/blog')
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts || [])
        }
      } catch (err) {
        console.error('Failed to fetch blog data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogData()
  }, [])

  // ═══════════════════════════════════════════
  // Blog Posts Logic
  // ═══════════════════════════════════════════

  const filteredPosts = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.author.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(postSearch.toLowerCase())
    const matchCategory = postCategoryFilter === 'all' || p.category === postCategoryFilter
    const matchStatus = postStatusFilter === 'all' || p.status === postStatusFilter
    return matchSearch && matchCategory && matchStatus
  })

  const openNewPost = () => {
    setEditingPost(null)
    setPostForm({ title: '', slug: '', category: 'Study Abroad', featuredImage: '', content: '', seoMetaTitle: '', seoMetaDescription: '', tags: '', status: 'draft' })
    setPostDialogOpen(true)
  }

  const openEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setPostForm({
      title: post.title, slug: post.slug, category: post.category,
      featuredImage: post.featuredImage, content: post.content,
      seoMetaTitle: post.seoMetaTitle, seoMetaDescription: post.seoMetaDescription,
      tags: post.tags.join(', '), status: post.status
    })
    setPostDialogOpen(true)
  }

  const savePost = () => {
    if (!postForm.title.trim()) { toast.error('Title is required'); return }
    const slug = postForm.slug || postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const tags = postForm.tags.split(',').map(t => t.trim()).filter(Boolean)

    if (editingPost) {
      setPosts(prev => prev.map(p => p.id === editingPost.id ? {
        ...p, ...postForm, slug, tags,
        publishedDate: postForm.status === 'published' && !p.publishedDate ? new Date().toISOString().split('T')[0] : p.publishedDate,
        views: postForm.status === 'published' ? p.views : 0
      } : p))
      toast.success('Blog post updated successfully')
    } else {
      const newPost: BlogPost = {
        id: genId('bp'), ...postForm, slug, tags,
        author: 'Admin', publishedDate: postForm.status === 'published' ? new Date().toISOString().split('T')[0] : '',
        views: 0
      }
      setPosts(prev => [newPost, ...prev])
      toast.success('Blog post created successfully')
    }
    setPostDialogOpen(false)
  }

  const confirmDeletePost = () => {
    if (postToDelete) {
      setPosts(prev => prev.filter(p => p.id !== postToDelete.id))
      toast.success('Blog post deleted')
      setDeletePostDialog(false)
      setPostToDelete(null)
    }
  }

  // ═══════════════════════════════════════════
  // Pages Logic
  // ═══════════════════════════════════════════

  const filteredPages = pages.filter(p =>
    p.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(pageSearch.toLowerCase())
  )

  const openNewPage = () => {
    setEditingPage(null)
    setPageForm({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '', status: 'draft' })
    setPageDialogOpen(true)
  }

  const openEditPage = (page: CMSPage) => {
    setEditingPage(page)
    setPageForm({
      title: page.title, slug: page.slug, content: page.content,
      metaTitle: page.metaTitle, metaDescription: page.metaDescription, status: page.status
    })
    setPageDialogOpen(true)
  }

  const savePage = () => {
    if (!pageForm.title.trim()) { toast.error('Title is required'); return }
    const slug = pageForm.slug || pageForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (editingPage) {
      setPages(prev => prev.map(p => p.id === editingPage.id ? {
        ...p, ...pageForm, slug, lastUpdated: new Date().toISOString().split('T')[0]
      } : p))
      toast.success('Page updated successfully')
    } else {
      const newPage: CMSPage = {
        id: genId('pg'), ...pageForm, slug,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
      setPages(prev => [newPage, ...prev])
      toast.success('Page created successfully')
    }
    setPageDialogOpen(false)
  }

  const confirmDeletePage = () => {
    if (pageToDelete) {
      setPages(prev => prev.filter(p => p.id !== pageToDelete.id))
      toast.success('Page deleted')
      setDeletePageDialog(false)
      setPageToDelete(null)
    }
  }

  // ═══════════════════════════════════════════
  // FAQs Logic
  // ═══════════════════════════════════════════

  const filteredFaqs = faqs.filter(f => {
    const matchSearch = f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase())
    const matchCategory = faqCategoryFilter === 'all' || f.category === faqCategoryFilter
    return matchSearch && matchCategory
  }).sort((a, b) => a.order - b.order)

  const openNewFaq = () => {
    setEditingFaq(null)
    setFaqForm({ question: '', answer: '', category: 'General', status: 'active' })
    setFaqDialogOpen(true)
  }

  const openEditFaq = (faq: FAQ) => {
    setEditingFaq(faq)
    setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category, status: faq.status })
    setFaqDialogOpen(true)
  }

  const saveFaq = () => {
    if (!faqForm.question.trim()) { toast.error('Question is required'); return }
    if (!faqForm.answer.trim()) { toast.error('Answer is required'); return }
    if (editingFaq) {
      setFaqs(prev => prev.map(f => f.id === editingFaq.id ? { ...f, ...faqForm } : f))
      toast.success('FAQ updated successfully')
    } else {
      const maxOrder = faqs.reduce((max, f) => Math.max(max, f.order), 0)
      const newFaq: FAQ = { id: genId('fq'), ...faqForm, order: maxOrder + 1 }
      setFaqs(prev => [...prev, newFaq])
      toast.success('FAQ created successfully')
    }
    setFaqDialogOpen(false)
  }

  const confirmDeleteFaq = () => {
    if (faqToDelete) {
      setFaqs(prev => prev.filter(f => f.id !== faqToDelete.id))
      toast.success('FAQ deleted')
      setDeleteFaqDialog(false)
      setFaqToDelete(null)
    }
  }

  const moveFaqOrder = (faq: FAQ, direction: 'up' | 'down') => {
    const sorted = [...faqs].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(f => f.id === faq.id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const tempOrder = sorted[idx].order
    sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order }
    sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder }
    setFaqs(sorted)
    toast.success(`FAQ moved ${direction}`)
  }

  // ═══════════════════════════════════════════
  // Testimonials Logic
  // ═══════════════════════════════════════════

  const filteredTestimonials = testimonials.filter(t =>
    t.studentName.toLowerCase().includes(testimonialSearch.toLowerCase()) ||
    t.university.toLowerCase().includes(testimonialSearch.toLowerCase())
  )

  const openNewTestimonial = () => {
    setEditingTestimonial(null)
    setTestimonialForm({ studentName: '', university: '', country: '', rating: 5, quote: '', course: '', image: '', status: 'active' })
    setTestimonialDialogOpen(true)
  }

  const openEditTestimonial = (t: Testimonial) => {
    setEditingTestimonial(t)
    setTestimonialForm({
      studentName: t.studentName, university: t.university, country: t.country,
      rating: t.rating, quote: t.quote, course: t.course, image: t.image, status: t.status
    })
    setTestimonialDialogOpen(true)
  }

  const saveTestimonial = () => {
    if (!testimonialForm.studentName.trim()) { toast.error('Student name is required'); return }
    if (!testimonialForm.university.trim()) { toast.error('University is required'); return }
    if (!testimonialForm.quote.trim()) { toast.error('Quote is required'); return }
    if (editingTestimonial) {
      setTestimonials(prev => prev.map(t => t.id === editingTestimonial.id ? { ...t, ...testimonialForm } : t))
      toast.success('Testimonial updated successfully')
    } else {
      const newT: Testimonial = { id: genId('tm'), ...testimonialForm }
      setTestimonials(prev => [newT, ...prev])
      toast.success('Testimonial created successfully')
    }
    setTestimonialDialogOpen(false)
  }

  const confirmDeleteTestimonial = () => {
    if (testimonialToDelete) {
      setTestimonials(prev => prev.filter(t => t.id !== testimonialToDelete.id))
      toast.success('Testimonial deleted')
      setDeleteTestimonialDialog(false)
      setTestimonialToDelete(null)
    }
  }

  // ═══════════════════════════════════════════
  // Media Logic
  // ═══════════════════════════════════════════

  const filteredMedia = media.filter(m =>
    m.filename.toLowerCase().includes(mediaSearch.toLowerCase()) ||
    m.alt.toLowerCase().includes(mediaSearch.toLowerCase())
  )

  const saveMedia = () => {
    if (!uploadForm.url.trim()) { toast.error('Image URL is required'); return }
    const filename = uploadForm.filename || uploadForm.url.split('/').pop()?.split('?')[0] || 'image.jpg'
    const newMedia: MediaItem = {
      id: genId('md'), filename, url: uploadForm.url, width: 1200, height: 800,
      uploadedDate: new Date().toISOString().split('T')[0], alt: uploadForm.alt || filename,
      size: 'Unknown'
    }
    setMedia(prev => [newMedia, ...prev])
    toast.success('Image added to media library')
    setUploadDialogOpen(false)
    setUploadForm({ url: '', alt: '', filename: '' })
  }

  const confirmDeleteMedia = () => {
    if (mediaToDelete) {
      setMedia(prev => prev.filter(m => m.id !== mediaToDelete.id))
      toast.success('Image deleted from library')
      setDeleteMediaDialog(false)
      setMediaToDelete(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('URL copied to clipboard'))
  }

  // ═══════════════════════════════════════════
  // Stats Calculations
  // ═══════════════════════════════════════════
  const totalPostViews = posts.reduce((s, p) => s + p.views, 0)
  const publishedPosts = posts.filter(p => p.status === 'published').length
  const draftPosts = posts.filter(p => p.status === 'draft').length
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length
  const publishedPages = pages.filter(p => p.status === 'published').length
  const activeFaqs = faqs.filter(f => f.status === 'active').length
  const activeTestimonials = testimonials.filter(t => t.status === 'active').length
  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1)
    : '0'

  // ═══════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND.navy }}>Blog & CMS</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage blog posts, pages, FAQs, testimonials, and media</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 px-6 py-4">
        {[
          { label: 'Total Posts', value: posts.length, icon: BookOpen, color: BRAND.navy },
          { label: 'Published', value: publishedPosts, icon: CheckCircle, color: '#16a34a' },
          { label: 'Drafts', value: draftPosts, icon: FileText, color: '#6b7280' },
          { label: 'Scheduled', value: scheduledPosts, icon: Clock, color: BRAND.blue },
          { label: 'Total Views', value: totalPostViews.toLocaleString(), icon: Eye, color: BRAND.orange },
          { label: 'Active FAQs', value: activeFaqs, icon: HelpCircle, color: '#7c3aed' },
          { label: 'Avg Rating', value: avgRating, icon: Star, color: '#f59e0b' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex-1 px-6 pb-4 overflow-hidden">
        <Tabs defaultValue="posts" className="flex flex-col h-full">
          <TabsList className="bg-white border shadow-sm w-fit">
            <TabsTrigger value="posts" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white text-xs px-3">
              <BookOpen size={14} className="mr-1.5" />Blog Posts
            </TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white text-xs px-3">
              <Globe size={14} className="mr-1.5" />Pages
            </TabsTrigger>
            <TabsTrigger value="faqs" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white text-xs px-3">
              <HelpCircle size={14} className="mr-1.5" />FAQs
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white text-xs px-3">
              <MessageSquare size={14} className="mr-1.5" />Testimonials
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white text-xs px-3">
              <ImageIcon size={14} className="mr-1.5" />Media Library
            </TabsTrigger>
          </TabsList>

          {/* ═══ Blog Posts Tab ═══ */}
          <TabsContent value="posts" className="flex-1 mt-3 overflow-hidden">
            <Card className="h-full border-0 shadow-sm flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <Input placeholder="Search posts..." value={postSearch} onChange={e => setPostSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                    </div>
                    <Select value={postCategoryFilter} onValueChange={setPostCategoryFilter}>
                      <SelectTrigger className="w-40 h-9 text-sm"><Filter size={14} className="mr-1 text-gray-400" /><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {blogCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={postStatusFilter} onValueChange={setPostStatusFilter}>
                      <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={openNewPost}>
                    <Plus size={16} className="mr-1.5" />New Post
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Author</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Published Date</TableHead>
                      <TableHead className="text-xs text-right">Views</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">No blog posts found</TableCell></TableRow>
                    ) : filteredPosts.map(post => (
                      <TableRow key={post.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm max-w-[250px]">
                          <div className="flex items-center gap-2">
                            {post.featuredImage && (
                              <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                <img src={post.featuredImage} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="truncate">{post.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[10px] font-normal">{post.category}</Badge></TableCell>
                        <TableCell className="text-xs text-gray-600">{post.author}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-medium ${statusColors[post.status]}`}>
                            {post.status === 'published' ? <CheckCircle size={10} className="mr-1" /> :
                             post.status === 'scheduled' ? <Clock size={10} className="mr-1" /> :
                             <FileText size={10} className="mr-1" />}
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">{post.publishedDate || '—'}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{post.views > 0 ? post.views.toLocaleString() : '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPost(post)}><Edit size={14} className="text-gray-500" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setPostToDelete(post); setDeletePostDialog(true) }}><Trash2 size={14} className="text-red-400" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Pages Tab ═══ */}
          <TabsContent value="pages" className="flex-1 mt-3 overflow-hidden">
            <Card className="h-full border-0 shadow-sm flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <Input placeholder="Search pages..." value={pageSearch} onChange={e => setPageSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                  </div>
                  <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={openNewPage}>
                    <Plus size={16} className="mr-1.5" />New Page
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Slug</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Last Updated</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPages.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400 text-sm">No pages found</TableCell></TableRow>
                    ) : filteredPages.map(page => (
                      <TableRow key={page.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-gray-400" />
                            {page.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">/{page.slug}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-medium ${statusColors[page.status]}`}>
                            {page.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">{page.lastUpdated}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPage(page)}><Edit size={14} className="text-gray-500" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setPageToDelete(page); setDeletePageDialog(true) }}><Trash2 size={14} className="text-red-400" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ FAQs Tab ═══ */}
          <TabsContent value="faqs" className="flex-1 mt-3 overflow-hidden">
            <Card className="h-full border-0 shadow-sm flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <Input placeholder="Search FAQs..." value={faqSearch} onChange={e => setFaqSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                    </div>
                    <Select value={faqCategoryFilter} onValueChange={setFaqCategoryFilter}>
                      <SelectTrigger className="w-40 h-9 text-sm"><Filter size={14} className="mr-1 text-gray-400" /><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {faqCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={openNewFaq}>
                    <Plus size={16} className="mr-1.5" />New FAQ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-10">Order</TableHead>
                      <TableHead className="text-xs">Question</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Reorder</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaqs.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400 text-sm">No FAQs found</TableCell></TableRow>
                    ) : filteredFaqs.map(faq => (
                      <TableRow key={faq.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs font-medium text-gray-500">
                          <div className="flex items-center gap-1">
                            <GripVertical size={12} className="text-gray-300" />
                            {faq.order}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-[300px]">
                          <div>
                            <p className="truncate">{faq.question}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{faq.answer}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[10px] font-normal">{faq.category}</Badge></TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-medium ${statusColors[faq.status]}`}>{faq.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveFaqOrder(faq, 'up')}><ArrowUp size={14} className="text-gray-500" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveFaqOrder(faq, 'down')}><ArrowDown size={14} className="text-gray-500" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditFaq(faq)}><Edit size={14} className="text-gray-500" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setFaqToDelete(faq); setDeleteFaqDialog(true) }}><Trash2 size={14} className="text-red-400" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Testimonials Tab ═══ */}
          <TabsContent value="testimonials" className="flex-1 mt-3 overflow-hidden">
            <Card className="h-full border-0 shadow-sm flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <Input placeholder="Search testimonials..." value={testimonialSearch} onChange={e => setTestimonialSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span>Average: <strong className="text-gray-700">{avgRating}</strong>/5</span>
                    </div>
                    <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={openNewTestimonial}>
                      <Plus size={16} className="mr-1.5" />New Testimonial
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student Name</TableHead>
                      <TableHead className="text-xs">University</TableHead>
                      <TableHead className="text-xs">Rating</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTestimonials.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400 text-sm">No testimonials found</TableCell></TableRow>
                    ) : filteredTestimonials.map(t => (
                      <TableRow key={t.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm">
                          <div>
                            <p>{t.studentName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{t.course}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <p>{t.university}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{t.country}</p>
                          </div>
                        </TableCell>
                        <TableCell><StarRating value={t.rating} readonly /></TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-medium ${statusColors[t.status]}`}>{t.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditTestimonial(t)}><Edit size={14} className="text-gray-500" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setTestimonialToDelete(t); setDeleteTestimonialDialog(true) }}><Trash2 size={14} className="text-red-400" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Media Library Tab ═══ */}
          <TabsContent value="media" className="flex-1 mt-3 overflow-hidden">
            <Card className="h-full border-0 shadow-sm flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <Input placeholder="Search media..." value={mediaSearch} onChange={e => setMediaSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                  </div>
                  <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={() => setUploadDialogOpen(true)}>
                    <Upload size={16} className="mr-1.5" />Upload Image
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {filteredMedia.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No media files found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filteredMedia.map(item => (
                      <Card key={item.id} className="group border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                          <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => copyToClipboard(item.url)}>
                              <Copy size={14} />
                            </Button>
                            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { window.open(item.url, '_blank') }}>
                              <ExternalLink size={14} />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => { setMediaToDelete(item); setDeleteMediaDialog(true) }}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate" title={item.filename}>{item.filename}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{item.width}×{item.height} · {item.size}</p>
                          <p className="text-[10px] text-gray-400">{item.uploadedDate}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* DIALOGS */}
      {/* ═══════════════════════════════════════════ */}

      {/* Blog Post Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: BRAND.navy }}>
              <BookOpen size={20} />
              {editingPost ? 'Edit Blog Post' : 'Create Blog Post'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Title *</Label>
                <Input placeholder="Enter post title" value={postForm.title}
                  onChange={e => setPostForm(f => ({ ...f, title: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))}
                  className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Slug</Label>
                <Input placeholder="post-url-slug" value={postForm.slug} onChange={e => setPostForm(f => ({ ...f, slug: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={postForm.category} onValueChange={v => setPostForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{blogCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={postForm.status} onValueChange={v => setPostForm(f => ({ ...f, status: v as BlogPost['status'] }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Featured Image URL</Label>
              <Input placeholder="https://example.com/image.jpg" value={postForm.featuredImage} onChange={e => setPostForm(f => ({ ...f, featuredImage: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Content</Label>
              <Textarea placeholder="Write your blog post content..." value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} rows={6} className="text-sm" />
            </div>
            <Separator />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SEO Settings</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Meta Title</Label>
              <Input placeholder="SEO meta title" value={postForm.seoMetaTitle} onChange={e => setPostForm(f => ({ ...f, seoMetaTitle: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Meta Description</Label>
              <Textarea placeholder="SEO meta description" value={postForm.seoMetaDescription} onChange={e => setPostForm(f => ({ ...f, seoMetaDescription: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tags (comma separated)</Label>
              <Input placeholder="tag1, tag2, tag3" value={postForm.tags} onChange={e => setPostForm(f => ({ ...f, tags: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPostDialogOpen(false)} className="h-9">Cancel</Button>
              <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={savePost}>
                {editingPost ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Blog Post Dialog */}
      <Dialog open={deletePostDialog} onOpenChange={setDeletePostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Blog Post</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete <strong>&quot;{postToDelete?.title}&quot;</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletePostDialog(false)} className="h-9">Cancel</Button>
            <Button variant="destructive" onClick={confirmDeletePost} className="h-9">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Page Dialog */}
      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: BRAND.navy }}>
              <Globe size={20} />
              {editingPage ? 'Edit Page' : 'Create Page'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Title *</Label>
                <Input placeholder="Page title" value={pageForm.title}
                  onChange={e => setPageForm(f => ({ ...f, title: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))}
                  className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Slug</Label>
                <Input placeholder="page-url-slug" value={pageForm.slug} onChange={e => setPageForm(f => ({ ...f, slug: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={pageForm.status} onValueChange={v => setPageForm(f => ({ ...f, status: v as CMSPage['status'] }))}>
                <SelectTrigger className="h-9 text-sm w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Content</Label>
              <Textarea placeholder="Page content..." value={pageForm.content} onChange={e => setPageForm(f => ({ ...f, content: e.target.value }))} rows={6} className="text-sm" />
            </div>
            <Separator />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SEO Settings</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Meta Title</Label>
              <Input placeholder="SEO meta title" value={pageForm.metaTitle} onChange={e => setPageForm(f => ({ ...f, metaTitle: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Meta Description</Label>
              <Textarea placeholder="SEO meta description" value={pageForm.metaDescription} onChange={e => setPageForm(f => ({ ...f, metaDescription: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPageDialogOpen(false)} className="h-9">Cancel</Button>
              <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={savePage}>
                {editingPage ? 'Update Page' : 'Create Page'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Page Dialog */}
      <Dialog open={deletePageDialog} onOpenChange={setDeletePageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Page</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete <strong>&quot;{pageToDelete?.title}&quot;</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletePageDialog(false)} className="h-9">Cancel</Button>
            <Button variant="destructive" onClick={confirmDeletePage} className="h-9">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: BRAND.navy }}>
              <HelpCircle size={20} />
              {editingFaq ? 'Edit FAQ' : 'Create FAQ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Question *</Label>
              <Input placeholder="Enter the question" value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Answer *</Label>
              <Textarea placeholder="Enter the answer" value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} rows={4} className="text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={faqForm.category} onValueChange={v => setFaqForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{faqCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={faqForm.status} onValueChange={v => setFaqForm(f => ({ ...f, status: v as FAQ['status'] }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFaqDialogOpen(false)} className="h-9">Cancel</Button>
              <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={saveFaq}>
                {editingFaq ? 'Update FAQ' : 'Create FAQ'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete FAQ Dialog */}
      <Dialog open={deleteFaqDialog} onOpenChange={setDeleteFaqDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete FAQ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete this FAQ? This action cannot be undone.
          </p>
          <div className="bg-gray-50 rounded p-3 mb-2">
            <p className="text-sm font-medium text-gray-700">{faqToDelete?.question}</p>
            <p className="text-xs text-gray-500 mt-1">{faqToDelete?.answer}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteFaqDialog(false)} className="h-9">Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteFaq} className="h-9">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: BRAND.navy }}>
              <MessageSquare size={20} />
              {editingTestimonial ? 'Edit Testimonial' : 'Create Testimonial'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Student Name *</Label>
                <Input placeholder="Student full name" value={testimonialForm.studentName} onChange={e => setTestimonialForm(f => ({ ...f, studentName: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">University *</Label>
                <Input placeholder="University name" value={testimonialForm.university} onChange={e => setTestimonialForm(f => ({ ...f, university: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Country</Label>
                <Input placeholder="Country" value={testimonialForm.country} onChange={e => setTestimonialForm(f => ({ ...f, country: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Course</Label>
                <Input placeholder="Course/Program" value={testimonialForm.course} onChange={e => setTestimonialForm(f => ({ ...f, course: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Rating</Label>
                <StarRating value={testimonialForm.rating} onChange={v => setTestimonialForm(f => ({ ...f, rating: v }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={testimonialForm.status} onValueChange={v => setTestimonialForm(f => ({ ...f, status: v as Testimonial['status'] }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Quote *</Label>
              <Textarea placeholder="Student testimonial quote..." value={testimonialForm.quote} onChange={e => setTestimonialForm(f => ({ ...f, quote: e.target.value }))} rows={3} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Student Image URL</Label>
              <Input placeholder="https://example.com/student.jpg" value={testimonialForm.image} onChange={e => setTestimonialForm(f => ({ ...f, image: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTestimonialDialogOpen(false)} className="h-9">Cancel</Button>
              <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={saveTestimonial}>
                {editingTestimonial ? 'Update Testimonial' : 'Create Testimonial'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Testimonial Dialog */}
      <Dialog open={deleteTestimonialDialog} onOpenChange={setDeleteTestimonialDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Testimonial</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete the testimonial from <strong>{testimonialToDelete?.studentName}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTestimonialDialog(false)} className="h-9">Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteTestimonial} className="h-9">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Media Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: BRAND.navy }}>
              <Upload size={20} />
              Upload Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Image URL *</Label>
              <Input placeholder="https://example.com/image.jpg" value={uploadForm.url} onChange={e => setUploadForm(f => ({ ...f, url: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Filename (optional)</Label>
              <Input placeholder="image-name.jpg" value={uploadForm.filename} onChange={e => setUploadForm(f => ({ ...f, filename: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Alt Text</Label>
              <Input placeholder="Descriptive alt text" value={uploadForm.alt} onChange={e => setUploadForm(f => ({ ...f, alt: e.target.value }))} className="h-9 text-sm" />
            </div>
            {uploadForm.url && (
              <div className="rounded-lg border overflow-hidden bg-gray-50">
                <img src={uploadForm.url} alt="Preview" className="w-full h-40 object-cover" />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)} className="h-9">Cancel</Button>
              <Button className="bg-[#F37021] hover:bg-[#e06010] text-white h-9" onClick={saveMedia}>
                Add to Library
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Media Dialog */}
      <Dialog open={deleteMediaDialog} onOpenChange={setDeleteMediaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Image</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete <strong>&quot;{mediaToDelete?.filename}&quot;</strong>? This action cannot be undone.
          </p>
          {mediaToDelete && (
            <div className="rounded-lg border overflow-hidden bg-gray-50">
              <img src={mediaToDelete.url} alt={mediaToDelete.alt} className="w-full h-32 object-cover" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteMediaDialog(false)} className="h-9">Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteMedia} className="h-9">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
