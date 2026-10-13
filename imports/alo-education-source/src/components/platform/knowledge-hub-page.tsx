'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Search, Plus, Trash2, Edit3, Save, X,
  BookOpen, FileText, Globe, Bookmark, Rss, Tag,
  Calendar, Clock, ChevronRight, ExternalLink,
  FolderOpen, Hash, Star, StarOff, RefreshCw,
  CheckCircle2, AlertCircle, Archive, Pin,
  MessageSquare, Eye, Filter, Copy, Link2,
  Newspaper, Library, StickyNote, Globe2, Sparkles
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WikiArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  lastUpdated: string;
  views: number;
  sections: number;
}

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  lastFetched: string;
  articleCount: number;
  isActive: boolean;
  favicon?: string;
}

interface RSSArticle {
  id: string;
  feedId: string;
  feedName: string;
  title: string;
  excerpt: string;
  link: string;
  publishedAt: string;
  category: string;
  isRead: boolean;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
  description: string;
  createdAt: string;
  isFavorite: boolean;
}

// ============================================================================
// Mock Data
// ============================================================================

const NOTE_CATEGORIES = ['All', 'Strategy', 'SEO', 'Content', 'Meetings', 'Ideas', 'Research'];

const INITIAL_NOTES: Note[] = [
  { id: '1', title: 'Q1 SEO Strategy Plan', content: 'Focus on increasing organic traffic by 30% through:\n- Improve meta tags across all university pages\n- Add JSON-LD schema to course and scholarship pages\n- Create 15 new blog posts targeting long-tail keywords\n- Fix 14 broken internal links\n- Optimize Core Web Vitals (TTFB, INP)', category: 'Strategy', tags: ['seo', 'q1-2025', 'organic-traffic'], isPinned: true, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-17T14:30:00Z' },
  { id: '2', title: 'Content Calendar Ideas', content: 'Blog topics for January:\n1. Top 10 Scholarships for Indian Students in UK 2025\n2. IELTS vs TOEFL vs Duolingo: Which Test Should You Take?\n3. Student Visa Guide: UK Tier 4 Changes\n4. How to Write a Winning SOP\n5. Cost of Living Comparison: UK vs Australia vs Canada', category: 'Content', tags: ['blog', 'content-calendar', 'january'], isPinned: false, createdAt: '2025-01-14T09:00:00Z', updatedAt: '2025-01-14T09:00:00Z' },
  { id: '3', title: 'Competitor Analysis Notes', content: 'Key findings from competitor audit:\n- IDP has 5200 ranking keywords vs our 1240\n- StudyPortals dominates "study in [country]" terms\n- Leapscholar strong in IELTS/TOEFL content\n- Gap: We need more content on "free education" and "part-time jobs"\n- Opportunity: Duolingo English Test content is underserved', category: 'Research', tags: ['competitors', 'seo', 'analysis'], isPinned: true, createdAt: '2025-01-12T11:00:00Z', updatedAt: '2025-01-16T08:00:00Z' },
  { id: '4', title: 'Weekly Marketing Sync Notes', content: 'Action items from 2025-01-13 sync:\n- Sarah: Update social media content calendar\n- Mike: Fix broken links in resources section\n- Priya: Draft scholarship schema markup\n- Rahul: A/B test new CTA on course pages\n- Review: Google Search Console data shows 12% traffic increase', category: 'Meetings', tags: ['weekly-sync', 'action-items'], isPinned: false, createdAt: '2025-01-13T16:00:00Z', updatedAt: '2025-01-13T17:00:00Z' },
  { id: '5', title: 'Schema Markup Implementation', content: 'Priority order for schema implementation:\n1. Course schema on all /courses/* pages\n2. ScholarshipOffer on /scholarships/* pages\n3. FAQPage on /faq and blog posts\n4. CollegeOrUniversity on university profiles\n5. BreadcrumbList on all pages\n\nTesting: Use Google Rich Results Test after each implementation', category: 'SEO', tags: ['schema', 'json-ld', 'technical-seo'], isPinned: true, createdAt: '2025-01-10T10:00:00Z', updatedAt: '2025-01-15T09:00:00Z' },
  { id: '6', title: 'Video Content Strategy', content: 'Ideas for YouTube channel:\n- "Day in the Life" series for each destination country\n- Student interview series\n- Quick tips (60s): visa tips, SOP tips, scholarship tips\n- University campus tours (partner with universities)\n- Live Q&A sessions every Thursday', category: 'Ideas', tags: ['video', 'youtube', 'content-strategy'], isPinned: false, createdAt: '2025-01-08T14:00:00Z', updatedAt: '2025-01-08T14:00:00Z' },
];

const WIKI_CATEGORIES = ['All', 'Getting Started', 'SEO Guides', 'Content Templates', 'Process Docs', 'Brand Guidelines'];

const WIKI_ARTICLES: WikiArticle[] = [
  { id: '1', title: 'SEO Best Practices for Education Sites', excerpt: 'Comprehensive guide covering meta tags, schema markup, internal linking, and content optimization specifically for education consultancy websites.', category: 'SEO Guides', author: 'Mike Chen', lastUpdated: '2025-01-17', views: 342, sections: 8 },
  { id: '2', title: 'Blog Post Writing Template', excerpt: 'Standard template for creating SEO-optimized blog posts. Includes headline formulas, intro hooks, body structure, and CTA placement guidelines.', category: 'Content Templates', author: 'Sarah Kim', lastUpdated: '2025-01-15', views: 528, sections: 5 },
  { id: '3', title: 'Student Onboarding Process', excerpt: 'Step-by-step process for onboarding new students: initial consultation, document collection, university shortlisting, application submission, and visa guidance.', category: 'Process Docs', author: 'Priya Sharma', lastUpdated: '2025-01-14', views: 891, sections: 12 },
  { id: '4', title: 'Brand Voice & Tone Guide', excerpt: 'Guidelines for maintaining consistent brand voice across all channels. Includes tone modifiers by context, vocabulary preferences, and examples.', category: 'Brand Guidelines', author: 'Design Team', lastUpdated: '2025-01-10', views: 456, sections: 6 },
  { id: '5', title: 'Getting Started with ALO CRM', excerpt: 'New employee onboarding guide for the CRM system. Covers lead management, student pipeline, communication tools, and reporting.', category: 'Getting Started', author: 'Rahul Patel', lastUpdated: '2025-01-08', views: 1204, sections: 10 },
  { id: '6', title: 'Schema Markup Implementation Guide', excerpt: 'Technical documentation for implementing JSON-LD schema across page types: Course, University, Scholarship, FAQ, Organization, and Breadcrumb.', category: 'SEO Guides', author: 'Mike Chen', lastUpdated: '2025-01-06', views: 287, sections: 7 },
  { id: '7', title: 'Social Media Content Guidelines', excerpt: 'Platform-specific guidelines for Facebook, Instagram, LinkedIn, and Twitter. Includes post formats, hashtag strategy, and posting schedule.', category: 'Brand Guidelines', author: 'Sarah Kim', lastUpdated: '2025-01-04', views: 378, sections: 5 },
  { id: '8', title: 'University Partnership Process', excerpt: 'How to establish and maintain university partnerships: initial outreach, agreement terms, commission structures, and relationship management.', category: 'Process Docs', author: 'Priya Sharma', lastUpdated: '2025-01-02', views: 215, sections: 9 },
];

const RSS_FEEDS: RSSFeed[] = [
  { id: '1', name: 'Times Higher Education', url: 'https://www.timeshighereducation.com/rss/news.xml', category: 'Education News', lastFetched: '2025-01-17T08:00:00Z', articleCount: 24, isActive: true },
  { id: '2', name: 'ICEF Monitor', url: 'https://monitor.icef.com/rss', category: 'Industry', lastFetched: '2025-01-17T07:30:00Z', articleCount: 18, isActive: true },
  { id: '3', name: 'UK Visas & Immigration', url: 'https://www.gov.uk/government/all.atom', category: 'Visa Updates', lastFetched: '2025-01-17T06:00:00Z', articleCount: 12, isActive: true },
  { id: '4', name: 'StudyPortals Blog', url: 'https://blog.studyportals.com/rss', category: 'Competitor', lastFetched: '2025-01-16T18:00:00Z', articleCount: 8, isActive: true },
  { id: '5', name: 'PIE News', url: 'https://thepienews.com/feed', category: 'Industry', lastFetched: '2025-01-17T09:00:00Z', articleCount: 15, isActive: true },
  { id: '6', name: 'QS TopUniversities', url: 'https://www.topuniversities.com/rss', category: 'Rankings', lastFetched: '2025-01-16T12:00:00Z', articleCount: 6, isActive: false },
];

const RSS_ARTICLES: RSSArticle[] = [
  { id: '1', feedId: '1', feedName: 'Times Higher Education', title: 'UK universities see record international applications for 2025', excerpt: 'Applications from international students to UK universities have reached an all-time high, with Indian student applications up 23% year-on-year.', link: '#', publishedAt: '2025-01-17T07:00:00Z', category: 'Education News', isRead: false },
  { id: '2', feedId: '2', feedName: 'ICEF Monitor', title: 'Australia extends post-study work visas for regional graduates', excerpt: 'New policy allows graduates from regional universities to stay up to 6 years on post-study work visas, up from the previous 4-year limit.', link: '#', publishedAt: '2025-01-17T06:30:00Z', category: 'Industry', isRead: false },
  { id: '3', feedId: '3', feedName: 'UK Visas & Immigration', title: 'Updated guidance on Student visa maintenance funds', excerpt: 'The Home Office has updated maintenance fund requirements for Student visa applications effective from February 2025.', link: '#', publishedAt: '2025-01-17T05:00:00Z', category: 'Visa Updates', isRead: true },
  { id: '4', feedId: '5', feedName: 'PIE News', title: 'Canada caps international student enrollment at 437,000', excerpt: 'Immigration Minister announces enrollment cap and new attestation letter requirement for study permit applications.', link: '#', publishedAt: '2025-01-16T14:00:00Z', category: 'Industry', isRead: false },
  { id: '5', feedId: '1', feedName: 'Times Higher Education', title: 'World University Rankings 2025: Methodology changes announced', excerpt: 'THE reveals significant methodology updates for the 2025 rankings, placing greater emphasis on student outcomes and employability.', link: '#', publishedAt: '2025-01-16T10:00:00Z', category: 'Education News', isRead: true },
  { id: '6', feedId: '4', feedName: 'StudyPortals Blog', title: 'How to choose the right study destination: A student guide', excerpt: 'Comprehensive guide comparing factors like cost, quality of education, post-study opportunities, and cultural experience across top destinations.', link: '#', publishedAt: '2025-01-16T08:00:00Z', category: 'Competitor', isRead: false },
  { id: '7', feedId: '2', feedName: 'ICEF Monitor', title: 'Germany announces new digital visa application process', excerpt: 'Germany is launching a fully digital visa application system for student visas, reducing processing times from weeks to days.', link: '#', publishedAt: '2025-01-15T16:00:00Z', category: 'Industry', isRead: true },
  { id: '8', feedId: '5', feedName: 'PIE News', title: 'IELTS introduces one-skill retake option globally', excerpt: 'Test takers can now retake a single skill section (Listening, Reading, Writing, or Speaking) instead of the full test.', link: '#', publishedAt: '2025-01-15T12:00:00Z', category: 'Industry', isRead: false },
];

const BOOKMARK_CATEGORIES = ['All', 'SEO Tools', 'Competitors', 'Reference', 'Design', 'Marketing'];

const BOOKMARKS: BookmarkItem[] = [
  { id: '1', title: 'Google Search Console', url: 'https://search.google.com/search-console', category: 'SEO Tools', tags: ['google', 'seo', 'analytics'], description: 'Monitor and maintain site presence in Google Search results', createdAt: '2025-01-10', isFavorite: true },
  { id: '2', title: 'Google Rich Results Test', url: 'https://search.google.com/test/rich-results', category: 'SEO Tools', tags: ['schema', 'testing'], description: 'Test structured data and rich results', createdAt: '2025-01-10', isFavorite: true },
  { id: '3', title: 'Ahrefs Site Explorer', url: 'https://ahrefs.com/site-explorer', category: 'SEO Tools', tags: ['backlinks', 'keywords', 'ahrefs'], description: 'Backlink analysis and keyword research', createdAt: '2025-01-09', isFavorite: true },
  { id: '4', title: 'IDP Education', url: 'https://www.idp.com', category: 'Competitors', tags: ['competitor', 'idp'], description: 'Major competitor - study abroad consultancy', createdAt: '2025-01-08', isFavorite: false },
  { id: '5', title: 'StudyPortals', url: 'https://www.studyportals.com', category: 'Competitors', tags: ['competitor', 'studyportals'], description: 'Course search platform competitor', createdAt: '2025-01-08', isFavorite: false },
  { id: '6', title: 'UKVI Guidance', url: 'https://www.gov.uk/government/collections/immigration-rules', category: 'Reference', tags: ['uk', 'visa', 'regulations'], description: 'Official UK immigration rules and guidance', createdAt: '2025-01-05', isFavorite: true },
  { id: '7', title: 'Schema.org - Course', url: 'https://schema.org/Course', category: 'Reference', tags: ['schema', 'structured-data'], description: 'Schema.org specification for Course type', createdAt: '2025-01-04', isFavorite: false },
  { id: '8', title: 'Canva Education Templates', url: 'https://www.canva.com/templates/education/', category: 'Design', tags: ['templates', 'social-media', 'design'], description: 'Education-themed design templates', createdAt: '2025-01-03', isFavorite: false },
  { id: '9', title: 'Buffer - Social Media Scheduler', url: 'https://buffer.com', category: 'Marketing', tags: ['social-media', 'scheduling'], description: 'Social media post scheduling and analytics', createdAt: '2025-01-02', isFavorite: true },
  { id: '10', title: 'Google Trends', url: 'https://trends.google.com', category: 'Marketing', tags: ['trends', 'research', 'google'], description: 'Explore search trend data by topic and region', createdAt: '2025-01-01', isFavorite: true },
];

// ============================================================================
// Component
// ============================================================================

interface KnowledgeHubPageProps {
  onBack?: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export function KnowledgeHubPage({ onBack, onNavigate }: KnowledgeHubPageProps) {
  const [activeTab, setActiveTab] = useState('notes');

  // Notes state
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [noteCategory, setNoteCategory] = useState('All');
  const [noteSearch, setNoteSearch] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('Strategy');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Wiki state
  const [wikiCategory, setWikiCategory] = useState('All');
  const [wikiSearch, setWikiSearch] = useState('');

  // RSS state
  const [rssArticles, setRssArticles] = useState<RSSArticle[]>(RSS_ARTICLES);
  const [rssFilter, setRssFilter] = useState('All');

  // Bookmarks state
  const [bookmarkCategory, setBookmarkCategory] = useState('All');
  const [bookmarkSearch, setBookmarkSearch] = useState('');

  // Filtered items
  const filteredNotes = notes.filter(n => {
    if (noteCategory !== 'All' && n.category !== noteCategory) return false;
    if (noteSearch && !n.title.toLowerCase().includes(noteSearch.toLowerCase()) && !n.content.toLowerCase().includes(noteSearch.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filteredWiki = WIKI_ARTICLES.filter(a => {
    if (wikiCategory !== 'All' && a.category !== wikiCategory) return false;
    if (wikiSearch && !a.title.toLowerCase().includes(wikiSearch.toLowerCase()) && !a.excerpt.toLowerCase().includes(wikiSearch.toLowerCase())) return false;
    return true;
  });

  const filteredRssArticles = rssArticles.filter(a => {
    if (rssFilter !== 'All' && a.category !== rssFilter) return false;
    return true;
  });

  const filteredBookmarks = BOOKMARKS.filter(b => {
    if (bookmarkCategory !== 'All' && b.category !== bookmarkCategory) return false;
    if (bookmarkSearch && !b.title.toLowerCase().includes(bookmarkSearch.toLowerCase()) && !b.url.toLowerCase().includes(bookmarkSearch.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  // Note handlers
  const handleCreateNote = useCallback(() => {
    if (!newNoteTitle) return;
    const note: Note = {
      id: String(Date.now()),
      title: newNoteTitle,
      content: newNoteContent,
      category: newNoteCategory,
      tags: newNoteTags.split(',').map(t => t.trim()).filter(Boolean),
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteTags('');
    setShowNoteForm(false);
  }, [newNoteTitle, newNoteContent, newNoteCategory, newNoteTags]);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleTogglePin = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setRssArticles(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  };

  const rssCategories = ['All', ...new Set(RSS_FEEDS.map(f => f.category))];
  const rssUnreadCount = rssArticles.filter(a => !a.isRead).length;

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="bg-[#2d3142] text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1 text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold">Knowledge Hub</h1>
              <p className="text-xs text-white/50">Notes, wiki, RSS feeds & bookmarks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs bg-[#0052B8] text-white" style={{ borderRadius: '4px' }}>
              <Library className="h-3 w-3 mr-1" /> {notes.length + WIKI_ARTICLES.length + RSS_FEEDS.length + BOOKMARKS.length} Items
            </Badge>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#e5e7eb] px-4">
          <div className="max-w-6xl mx-auto overflow-x-auto">
            <TabsList className="bg-transparent h-10 gap-0.5 p-0">
              <TabsTrigger value="notes" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Notes
              </TabsTrigger>
              <TabsTrigger value="wiki" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Wiki
              </TabsTrigger>
              <TabsTrigger value="rss" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <Rss className="h-3.5 w-3.5 mr-1.5" /> RSS Feeds
                {rssUnreadCount > 0 && (
                  <span className="ml-1 bg-[#E8501A] text-white text-[9px] px-1.5 py-0.5 rounded-full">{rssUnreadCount}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Bookmarks
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 space-y-4">

            {/* ====== NOTES TAB ====== */}
            <TabsContent value="notes" className="mt-0 space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {NOTE_CATEGORIES.map(c => (
                    <Button key={c} variant={noteCategory === c ? 'default' : 'ghost'} size="sm" className={`text-xs h-7 ${noteCategory === c ? 'bg-[#0052B8] text-white' : ''}`} onClick={() => setNoteCategory(c)}>
                      {c}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-48">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                    <Input className="pl-7 h-8 text-xs" placeholder="Search notes..." value={noteSearch} onChange={e => setNoteSearch(e.target.value)} />
                  </div>
                  <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white text-xs h-8" onClick={() => setShowNoteForm(!showNoteForm)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> New Note
                  </Button>
                </div>
              </div>

              {/* New Note Form */}
              {showNoteForm && (
                <Card className="border-[#0052B8]/30">
                  <CardContent className="p-4 space-y-3">
                    <Input className="text-sm" placeholder="Note title" value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} />
                    <Textarea className="text-xs min-h-[120px]" placeholder="Write your note content... Supports plain text with line breaks." value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-[#6b7280] mb-1">Category</p>
                        <Select value={newNoteCategory} onValueChange={setNewNoteCategory}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {NOTE_CATEGORIES.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6b7280] mb-1">Tags (comma-separated)</p>
                        <Input className="h-8 text-xs" placeholder="seo, strategy, q1" value={newNoteTags} onChange={e => setNewNoteTags(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button className="bg-[#0052B8] hover:bg-[#0052B8]/90 text-white text-xs" onClick={handleCreateNote} disabled={!newNoteTitle}>
                        <Save className="h-3.5 w-3.5 mr-1" /> Save Note
                      </Button>
                      <Button variant="ghost" className="text-xs" onClick={() => setShowNoteForm(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNotes.map(note => (
                  <Card key={note.id} className={`hover:shadow-md transition-shadow ${note.isPinned ? 'border-[#0052B8]/30' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1.5">
                        <h3 className="text-xs font-semibold text-[#2d3142] line-clamp-1 flex-1 mr-2">{note.title}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => handleTogglePin(note.id)} className="p-0.5 hover:bg-[#f3f4f6] rounded">
                            {note.isPinned ? <Pin className="h-3 w-3 text-[#0052B8]" /> : <Pin className="h-3 w-3 text-[#9ca3af]" />}
                          </button>
                          <button onClick={() => handleDeleteNote(note.id)} className="p-0.5 hover:bg-red-50 rounded">
                            <Trash2 className="h-3 w-3 text-[#9ca3af] hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#6b7280] line-clamp-3 mb-2 whitespace-pre-line">{note.content}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[#0052B8]/20 text-[#0052B8]">{note.category}</Badge>
                        {note.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[9px] text-[#6b7280] flex items-center gap-0.5"><Hash className="h-2.5 w-2.5" />{t}</span>
                        ))}
                        {note.tags.length > 2 && <span className="text-[9px] text-[#9ca3af]">+{note.tags.length - 2}</span>}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-[#9ca3af]">
                        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {formatRelative(note.updatedAt)}</span>
                        {note.isPinned && <span className="text-[#0052B8]">Pinned</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ====== WIKI TAB ====== */}
            <TabsContent value="wiki" className="mt-0 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {WIKI_CATEGORIES.map(c => (
                    <Button key={c} variant={wikiCategory === c ? 'default' : 'ghost'} size="sm" className={`text-xs h-7 ${wikiCategory === c ? 'bg-[#0052B8] text-white' : ''}`} onClick={() => setWikiCategory(c)}>
                      {c}
                    </Button>
                  ))}
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                  <Input className="pl-7 h-8 text-xs" placeholder="Search wiki..." value={wikiSearch} onChange={e => setWikiSearch(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredWiki.map(article => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0052B8]/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-[#0052B8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[#2d3142] group-hover:text-[#0052B8] transition-colors line-clamp-1">{article.title}</h3>
                          <p className="text-[10px] text-[#6b7280] mt-1 line-clamp-2">{article.excerpt}</p>
                          <div className="mt-2 flex items-center gap-3 text-[9px] text-[#9ca3af]">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[#e5e7eb]">{article.category}</Badge>
                            <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> {article.views}</span>
                            <span className="flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" /> {article.sections} sections</span>
                            <span>by {article.author}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#9ca3af] group-hover:text-[#0052B8] transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ====== RSS FEEDS TAB ====== */}
            <TabsContent value="rss" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Feed Subscriptions */}
                <Card className="md:col-span-1">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-[#2d3142]">Feed Subscriptions</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5 max-h-80 overflow-y-auto">
                    {RSS_FEEDS.map(feed => (
                      <div key={feed.id} className="p-2.5 rounded-lg border border-[#e5e7eb] hover:border-[#0052B8]/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Rss className={`h-3 w-3 ${feed.isActive ? 'text-[#E8501A]' : 'text-[#9ca3af]'}`} />
                              <span className="text-xs font-medium text-[#2d3142] truncate">{feed.name}</span>
                            </div>
                            <p className="text-[9px] text-[#6b7280] mt-0.5">{feed.category}</p>
                          </div>
                          <Switch checked={feed.isActive} className="scale-75" />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[#9ca3af]">
                          <span className="flex items-center gap-0.5"><Newspaper className="h-2.5 w-2.5" /> {feed.articleCount} articles</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {formatRelative(feed.lastFetched)}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Aggregated Articles */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-[#2d3142]">
                        Latest Articles
                        {rssUnreadCount > 0 && <span className="ml-2 text-[#E8501A]">({rssUnreadCount} new)</span>}
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        {rssCategories.slice(0, 4).map(c => (
                          <Button key={c} variant={rssFilter === c ? 'default' : 'ghost'} size="sm" className={`text-[10px] h-6 px-2 ${rssFilter === c ? 'bg-[#0052B8] text-white' : ''}`} onClick={() => setRssFilter(c)}>
                            {c}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredRssArticles.map(article => (
                      <div key={article.id} className={`p-3 rounded-lg border transition-colors ${article.isRead ? 'border-[#f3f4f6] bg-white' : 'border-[#0052B8]/20 bg-[#0052B8]/5'}`}>
                        <div className="flex items-start gap-2">
                          {!article.isRead && <div className="w-1.5 h-1.5 rounded-full bg-[#E8501A] mt-1.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[#e5e7eb]">{article.feedName}</Badge>
                              <span className="text-[9px] text-[#9ca3af]">{formatRelative(article.publishedAt)}</span>
                            </div>
                            <h4 className="text-xs font-medium text-[#2d3142] line-clamp-1">{article.title}</h4>
                            <p className="text-[10px] text-[#6b7280] mt-0.5 line-clamp-2">{article.excerpt}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <button className="text-[9px] text-[#0052B8] hover:underline flex items-center gap-0.5">
                                <ExternalLink className="h-2.5 w-2.5" /> Read more
                              </button>
                              {!article.isRead && (
                                <button onClick={() => handleMarkRead(article.id)} className="text-[9px] text-[#6b7280] hover:text-[#0052B8] flex items-center gap-0.5">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ====== BOOKMARKS TAB ====== */}
            <TabsContent value="bookmarks" className="mt-0 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {BOOKMARK_CATEGORIES.map(c => (
                    <Button key={c} variant={bookmarkCategory === c ? 'default' : 'ghost'} size="sm" className={`text-xs h-7 ${bookmarkCategory === c ? 'bg-[#0052B8] text-white' : ''}`} onClick={() => setBookmarkCategory(c)}>
                      {c}
                    </Button>
                  ))}
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                  <Input className="pl-7 h-8 text-xs" placeholder="Search bookmarks..." value={bookmarkSearch} onChange={e => setBookmarkSearch(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBookmarks.map(bm => (
                  <Card key={bm.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="text-xs font-semibold text-[#2d3142] line-clamp-1">{bm.title}</h3>
                          <p className="text-[9px] text-[#0052B8] truncate mt-0.5">{bm.url}</p>
                        </div>
                        <button className="p-0.5 hover:bg-[#f3f4f6] rounded flex-shrink-0">
                          {bm.isFavorite ? <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> : <Star className="h-3.5 w-3.5 text-[#9ca3af]" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-[#6b7280] line-clamp-2 mb-2">{bm.description}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[#e5e7eb]">{bm.category}</Badge>
                        {bm.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[9px] text-[#6b7280] flex items-center gap-0.5"><Hash className="h-2.5 w-2.5" />{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#9ca3af]">{bm.createdAt}</span>
                        <a href={bm.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#0052B8] hover:underline flex items-center gap-0.5">
                          <ExternalLink className="h-2.5 w-2.5" /> Open
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

          </div>
        </div>
      </Tabs>
    </div>
  );
}
