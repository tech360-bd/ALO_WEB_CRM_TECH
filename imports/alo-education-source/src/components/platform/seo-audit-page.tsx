'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, Search, TrendingUp, TrendingDown, ExternalLink,
  BarChart3, Globe, Link2, FileText, Zap, Target, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  ChevronRight, Shield, Activity, Eye, Clock, XCircle,
  Calendar, Facebook, Linkedin, Twitter, Instagram,
  Plus, Trash2, Edit3, Save, Copy, Code, BookOpen,
  MessageSquare, Send, Image as ImageIcon, Hash, Sparkles,
  ChevronDown, ChevronUp, Filter, Download
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SEOIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  affectedUrl: string;
  fixSuggestion: string;
  impact: number; // 1-100
}

interface SEOCategoryScore {
  category: string;
  score: number;
  maxScore: number;
  issues: number;
  icon: React.ReactNode;
}

interface KeywordEntry {
  keyword: string;
  position: number;
  prevPosition: number;
  volume: number;
  difficulty: number;
  url: string;
  trend: 'up' | 'down' | 'stable';
  ctr: number;
}

interface ContentAnalysis {
  url: string;
  title: string;
  readability: number;
  keywordDensity: number;
  wordCount: number;
  headingStructure: number;
  internalLinks: number;
  externalLinks: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  score: number;
}

interface SchemaTemplate {
  type: string;
  label: string;
  description: string;
  jsonLd: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledDate: string;
  scheduledTime: string;
  status: 'draft' | 'scheduled' | 'published';
  image?: string;
  hashtags: string[];
}

// ============================================================================
// Mock Data
// ============================================================================

const CATEGORY_SCORES: SEOCategoryScore[] = [
  { category: 'Meta Tags', score: 78, maxScore: 100, issues: 5, icon: <Code className="h-4 w-4" /> },
  { category: 'Headings', score: 85, maxScore: 100, issues: 2, icon: <FileText className="h-4 w-4" /> },
  { category: 'Images', score: 62, maxScore: 100, issues: 8, icon: <ImageIcon className="h-4 w-4" /> },
  { category: 'Links', score: 71, maxScore: 100, issues: 6, icon: <Link2 className="h-4 w-4" /> },
  { category: 'Schema Markup', score: 45, maxScore: 100, issues: 12, icon: <Sparkles className="h-4 w-4" /> },
  { category: 'Performance', score: 88, maxScore: 100, issues: 3, icon: <Zap className="h-4 w-4" /> },
  { category: 'Mobile', score: 92, maxScore: 100, issues: 1, icon: <Globe className="h-4 w-4" /> },
];

const SEO_ISSUES: SEOIssue[] = [
  { id: '1', severity: 'critical', category: 'Meta Tags', message: 'Missing meta description on 12 pages', affectedUrl: '/universities/*', fixSuggestion: 'Add unique meta descriptions (150-160 chars) to all university pages', impact: 92 },
  { id: '2', severity: 'critical', category: 'Schema', message: 'No JSON-LD schema on course pages', affectedUrl: '/courses/*', fixSuggestion: 'Implement Course schema markup with name, description, provider, offers', impact: 88 },
  { id: '3', severity: 'warning', category: 'Images', message: '23 images missing alt text', affectedUrl: '/blog/*', fixSuggestion: 'Add descriptive alt text to all images, include target keywords where natural', impact: 65 },
  { id: '4', severity: 'warning', category: 'Headings', message: 'H1 tag missing on 6 pages', affectedUrl: '/destinations/*', fixSuggestion: 'Add a single H1 tag with primary keyword to each destination page', impact: 60 },
  { id: '5', severity: 'warning', category: 'Meta Tags', message: 'Duplicate title tags on 4 pages', affectedUrl: '/exams/*', fixSuggestion: 'Make each page title unique with format: Exam Name | Study in Country | ALO', impact: 55 },
  { id: '6', severity: 'warning', category: 'Links', message: '14 broken internal links detected', affectedUrl: '/resources/*', fixSuggestion: 'Update or remove broken links. Use 301 redirects for moved pages', impact: 72 },
  { id: '7', severity: 'info', category: 'Images', message: 'Large images not using WebP format', affectedUrl: 'Site-wide', fixSuggestion: 'Convert PNG/JPG images to WebP format for 25-35% size reduction', impact: 40 },
  { id: '8', severity: 'info', category: 'Schema', message: 'Organization schema missing on homepage', affectedUrl: '/', fixSuggestion: 'Add EducationOrganization schema with name, url, logo, sameAs', impact: 35 },
  { id: '9', severity: 'critical', category: 'Schema', message: 'Scholarship pages lack ScholarshipOffer schema', affectedUrl: '/scholarships/*', fixSuggestion: 'Add ScholarshipOffer schema with amount, eligibility, deadline', impact: 85 },
  { id: '10', severity: 'warning', category: 'Meta Tags', message: 'Title tags exceed 60 characters on 8 pages', affectedUrl: '/courses/*', fixSuggestion: 'Shorten title tags to 50-60 characters for full SERP display', impact: 45 },
  { id: '11', severity: 'info', category: 'Links', message: '3 external links without rel="noopener"', affectedUrl: '/partners/*', fixSuggestion: 'Add rel="noopener noreferrer" to all external links opening in new tabs', impact: 20 },
  { id: '12', severity: 'warning', category: 'Headings', message: 'Heading hierarchy skipped (H2 → H4) on 3 pages', affectedUrl: '/about, /services, /faq', fixSuggestion: 'Maintain proper heading hierarchy: H1 → H2 → H3 without skipping levels', impact: 30 },
];

const KEYWORD_DATA: KeywordEntry[] = [
  { keyword: 'study in uk', position: 3, prevPosition: 5, volume: 18100, difficulty: 72, url: '/uk', trend: 'up', ctr: 12.4 },
  { keyword: 'study in australia', position: 5, prevPosition: 7, volume: 14800, difficulty: 68, url: '/australia', trend: 'up', ctr: 8.2 },
  { keyword: 'study in canada', position: 7, prevPosition: 6, volume: 12100, difficulty: 65, url: '/canada', trend: 'down', ctr: 6.1 },
  { keyword: 'study abroad consultants', position: 2, prevPosition: 3, volume: 9900, difficulty: 58, url: '/services', trend: 'up', ctr: 15.8 },
  { keyword: 'IELTS preparation', position: 4, prevPosition: 4, volume: 8100, difficulty: 45, url: '/exams/ielts', trend: 'stable', ctr: 9.5 },
  { keyword: 'SOP writing tips', position: 1, prevPosition: 2, volume: 6600, difficulty: 35, url: '/resources/sop-guide', trend: 'up', ctr: 22.1 },
  { keyword: 'student visa uk', position: 6, prevPosition: 8, volume: 5400, difficulty: 62, url: '/uk/visa', trend: 'up', ctr: 7.3 },
  { keyword: 'scholarships for indian students', position: 8, prevPosition: 12, volume: 4400, difficulty: 55, url: '/scholarships', trend: 'up', ctr: 4.8 },
  { keyword: 'MBA in UK', position: 3, prevPosition: 4, volume: 3600, difficulty: 60, url: '/uk/mba', trend: 'up', ctr: 11.2 },
  { keyword: 'MS in Canada', position: 9, prevPosition: 11, volume: 2900, difficulty: 50, url: '/canada/ms', trend: 'up', ctr: 3.9 },
  { keyword: 'education consultants near me', position: 12, prevPosition: 15, volume: 2400, difficulty: 40, url: '/contact', trend: 'up', ctr: 2.8 },
  { keyword: 'university application deadline', position: 5, prevPosition: 5, volume: 2200, difficulty: 38, url: '/resources', trend: 'stable', ctr: 8.6 },
  { keyword: 'study in germany free tuition', position: 15, prevPosition: 18, volume: 4100, difficulty: 52, url: '/germany', trend: 'up', ctr: 1.4 },
  { keyword: 'duolingo english test accepted', position: 8, prevPosition: 6, volume: 3200, difficulty: 42, url: '/exams/duolingo', trend: 'down', ctr: 5.2 },
  { keyword: 'post study work visa uk', position: 4, prevPosition: 5, volume: 2800, difficulty: 48, url: '/uk/psw', trend: 'up', ctr: 10.5 },
];

const CONTENT_ANALYSES: ContentAnalysis[] = [
  { url: '/uk', title: 'Study in UK - Complete Guide', readability: 82, keywordDensity: 2.1, wordCount: 3200, headingStructure: 95, internalLinks: 18, externalLinks: 4, imagesWithAlt: 12, imagesWithoutAlt: 2, score: 84 },
  { url: '/australia', title: 'Study in Australia Guide', readability: 76, keywordDensity: 1.8, wordCount: 2800, headingStructure: 90, internalLinks: 14, externalLinks: 3, imagesWithAlt: 10, imagesWithoutAlt: 3, score: 78 },
  { url: '/canada', title: 'Study in Canada - Programs', readability: 70, keywordDensity: 3.2, wordCount: 2100, headingStructure: 85, internalLinks: 12, externalLinks: 2, imagesWithAlt: 8, imagesWithoutAlt: 4, score: 72 },
  { url: '/scholarships', title: 'Scholarships for Students', readability: 88, keywordDensity: 1.5, wordCount: 4500, headingStructure: 100, internalLinks: 24, externalLinks: 6, imagesWithAlt: 15, imagesWithoutAlt: 0, score: 91 },
  { url: '/exams/ielts', title: 'IELTS Exam Preparation', readability: 74, keywordDensity: 2.8, wordCount: 1800, headingStructure: 80, internalLinks: 10, externalLinks: 2, imagesWithAlt: 6, imagesWithoutAlt: 1, score: 75 },
  { url: '/blog/sop-tips', title: 'SOP Writing Tips', readability: 85, keywordDensity: 1.9, wordCount: 5200, headingStructure: 98, internalLinks: 20, externalLinks: 5, imagesWithAlt: 8, imagesWithoutAlt: 0, score: 89 },
];

const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    type: 'EducationOrganization',
    label: 'Education Organization',
    description: 'Schema for ALO Education as an educational organization',
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "ALO Education",
      "description": "Leading study abroad consultancy helping students achieve their international education goals",
      "url": "https://aloeducation.com",
      "logo": "https://aloeducation.com/logo.png",
      "telephone": "+91-XXXXXXXXXX",
      "email": "info@aloeducation.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hyderabad",
        "addressRegion": "Telangana",
        "addressCountry": "IN"
      },
      "sameAs": [
        "https://facebook.com/aloeducation",
        "https://linkedin.com/company/aloeducation",
        "https://twitter.com/aloeducation",
        "https://instagram.com/aloeducation"
      ],
      "areaServed": ["India", "UK", "Australia", "Canada", "Germany"],
      "serviceType": "Study Abroad Consultation"
    }, null, 2)
  },
  {
    type: 'Course',
    label: 'Course',
    description: 'Schema for individual course/program pages',
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "MBA - University of Birmingham",
      "description": "Master of Business Administration program at University of Birmingham",
      "provider": {
        "@type": "CollegeOrUniversity",
        "name": "University of Birmingham",
        "url": "https://www.birmingham.ac.uk"
      },
      "coursePrerequisites": {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "Bachelor's Degree"
      },
      "educationalCredentialAwarded": {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "Master's Degree"
      },
      "offers": {
        "@type": "Offer",
        "price": "28000",
        "priceCurrency": "GBP"
      },
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "onsite",
        "location": "Birmingham, UK"
      }
    }, null, 2)
  },
  {
    type: 'Scholarship',
    label: 'Scholarship Offer',
    description: 'Schema for scholarship listing pages',
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Scholarship",
      "name": "Chevening Scholarship",
      "description": "UK government international scholarship for future leaders",
      "provider": {
        "@type": "Organization",
        "name": "UK Foreign, Commonwealth & Development Office"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "GBP",
        "availability": "https://schema.org/InStock"
      },
      "applicationDeadline": "2025-11-05",
      "educationalCredentialAwarded": {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "Master's Degree"
      },
      "areaServed": {
        "@type": "Place",
        "name": "International"
      }
    }, null, 2)
  },
  {
    type: 'University',
    label: 'College/University',
    description: 'Schema for university profile pages',
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollegeOrUniversity",
      "name": "University of Manchester",
      "description": "A Russell Group university known for research excellence",
      "url": "https://www.manchester.ac.uk",
      "logo": "https://www.manchester.ac.uk/logo.png",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Manchester",
        "addressCountry": "GB"
      },
      "telephone": "+44-161-306-6000",
      "sameAs": [
        "https://twitter.com/UoMOfficial",
        "https://facebook.com/universityofmanchester"
      ],
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "value": "12000"
      },
      "foundingDate": "1824",
      "slogan": "Making knowledge available to all through innovation in research and teaching"
    }, null, 2)
  },
  {
    type: 'FAQ',
    label: 'FAQ Page',
    description: 'Schema for FAQ and Q&A pages',
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What are the requirements for studying in the UK?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Requirements include academic qualifications, English language proficiency (IELTS 6.0-7.0), a valid passport, and financial proof of tuition and living costs."
          }
        },
        {
          "@type": "Question",
          "name": "How much does it cost to study in Australia?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Tuition fees range from AUD 20,000-45,000 per year for undergraduate programs and AUD 22,000-50,000 for postgraduate programs."
          }
        }
      ]
    }, null, 2)
  },
  {
    type: 'BreadcrumbList',
    label: 'Breadcrumb',
    description: 'Breadcrumb navigation schema for all pages',
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://aloeducation.com/" },
        { "@type": "ListItem", "position": 2, "name": "Study in UK", "item": "https://aloeducation.com/uk" },
        { "@type": "ListItem", "position": 3, "name": "Universities", "item": "https://aloeducation.com/uk/universities" }
      ]
    }, null, 2)
  },
];

const SCHEDULED_POSTS: ScheduledPost[] = [
  { id: '1', content: '🌟 Thinking about studying in the UK? Our latest guide covers everything from applications to visas. Read more: aloeducation.com/uk #StudyInUK #StudyAbroad', platforms: ['facebook', 'linkedin'], scheduledDate: '2025-01-20', scheduledTime: '10:00', status: 'scheduled', hashtags: ['StudyInUK', 'StudyAbroad'] },
  { id: '2', content: '🎓 Scholarship Alert! Chevening Scholarship 2025 applications are now open. Don\'t miss this opportunity for fully-funded UK study! #Chevening #Scholarship', platforms: ['twitter', 'facebook', 'instagram'], scheduledDate: '2025-01-21', scheduledTime: '14:00', status: 'scheduled', hashtags: ['Chevening', 'Scholarship'] },
  { id: '3', content: '📊 Did you know? 89% of our students get admitted to their top-choice university. Start your journey with ALO Education today! #StudentSuccess', platforms: ['instagram', 'linkedin'], scheduledDate: '2025-01-22', scheduledTime: '09:00', status: 'scheduled', hashtags: ['StudentSuccess'] },
  { id: '4', content: '✈️ Australia just announced new post-study work visa extensions! Stay up to 6 years after graduation. Learn more: aloeducation.com/australia #StudyInAustralia', platforms: ['facebook', 'twitter'], scheduledDate: '2025-01-18', scheduledTime: '11:30', status: 'published', hashtags: ['StudyInAustralia'] },
  { id: '5', content: '💡 Pro tip: Start your SOP 3 months before the deadline. Here are our top 5 writing tips: aloeducation.com/blog/sop-tips #SOPWriting #StudyAbroad', platforms: ['linkedin', 'twitter'], scheduledDate: '2025-01-23', scheduledTime: '16:00', status: 'draft', hashtags: ['SOPWriting', 'StudyAbroad'] },
];

const CALENDAR_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// ============================================================================
// Severity helpers
// ============================================================================

const severityConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  critical: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <XCircle className="h-4 w-4 text-red-500" /> },
  warning: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
  info: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <Eye className="h-4 w-4 text-blue-500" /> },
};

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  twitter: <Twitter className="h-4 w-4 text-sky-500" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-700" />,
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
};

const platformNames: Record<string, string> = {
  facebook: 'Facebook',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
};

// ============================================================================
// Component
// ============================================================================

interface SeoAuditPageProps {
  onBack?: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export function SeoAuditPage({ onBack, onNavigate }: SeoAuditPageProps) {
  const [activeTab, setActiveTab] = useState('site-audit');
  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<string>('EducationOrganization');
  const [schemaOutput, setSchemaOutput] = useState(SCHEMA_TEMPLATES[0].jsonLd);
  const [copied, setCopied] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newPostPlatforms, setNewPostPlatforms] = useState<string[]>(['facebook']);
  const [newPostDate, setNewPostDate] = useState('');
  const [newPostTime, setNewPostTime] = useState('10:00');
  const [posts, setPosts] = useState<ScheduledPost[]>(SCHEDULED_POSTS);
  const [selectedMonth, setSelectedMonth] = useState('January 2025');

  // Site Audit overall score
  const overallScore = Math.round(CATEGORY_SCORES.reduce((sum, c) => sum + c.score, 0) / CATEGORY_SCORES.length);

  const filteredIssues = SEO_ISSUES.filter(i => issueFilter === 'all' || i.severity === issueFilter);
  const filteredKeywords = KEYWORD_DATA.filter(k => k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()));

  const handleCopySchema = useCallback(() => {
    navigator.clipboard.writeText(schemaOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [schemaOutput]);

  const handleSchedulePost = useCallback(() => {
    if (!newPost || !newPostDate) return;
    const post: ScheduledPost = {
      id: String(Date.now()),
      content: newPost,
      platforms: newPostPlatforms,
      scheduledDate: newPostDate,
      scheduledTime: newPostTime,
      status: 'scheduled',
      hashtags: [...newPost.matchAll(/#(\w+)/g)].map(m => m[1]),
    };
    setPosts(prev => [post, ...prev]);
    setNewPost('');
    setNewPostDate('');
  }, [newPost, newPostDate, newPostTime, newPostPlatforms]);

  const togglePlatform = useCallback((p: string) => {
    setNewPostPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50';
    if (score >= 60) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Find posts for a calendar day
  const getPostsForDay = (day: number) => {
    return posts.filter(p => {
      const d = new Date(p.scheduledDate);
      return d.getDate() === day;
    });
  };

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
              <h1 className="text-lg font-bold">SEO & Marketing Hub</h1>
              <p className="text-xs text-white/50">Audit, keywords, schema & social scheduling</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs bg-emerald-500 text-white" style={{ borderRadius: '4px' }}>
              <Activity className="h-3 w-3 mr-1" /> Live
            </Badge>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#e5e7eb] px-4">
          <div className="max-w-6xl mx-auto overflow-x-auto">
            <TabsList className="bg-transparent h-10 gap-0.5 p-0">
              <TabsTrigger value="site-audit" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <Shield className="h-3.5 w-3.5 mr-1.5" /> Site Audit
              </TabsTrigger>
              <TabsTrigger value="keywords" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <Target className="h-3.5 w-3.5 mr-1.5" /> Keywords
              </TabsTrigger>
              <TabsTrigger value="content-score" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Content Score
              </TabsTrigger>
              <TabsTrigger value="schema" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <Code className="h-3.5 w-3.5 mr-1.5" /> Schema Markup
              </TabsTrigger>
              <TabsTrigger value="social" className="px-3 text-xs data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Social Media
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 space-y-4">

            {/* ====== SITE AUDIT TAB ====== */}
            <TabsContent value="site-audit" className="mt-0 space-y-4">
              {/* Overall Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1">
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 ${getScoreBg(overallScore)} ${overallScore >= 80 ? 'border-emerald-400' : overallScore >= 60 ? 'border-amber-400' : 'border-red-400'}`}>
                      <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[#2d3142]">Overall SEO Score</p>
                    <p className="text-xs text-[#6b7280]">{SEO_ISSUES.length} issues found</p>
                    <Badge className={`mt-2 text-xs ${overallScore >= 80 ? 'bg-emerald-100 text-emerald-700' : overallScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`} style={{ borderRadius: '4px' }}>
                      {overallScore >= 80 ? 'Good' : overallScore >= 60 ? 'Needs Work' : 'Poor'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-[#2d3142]">Category Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {CATEGORY_SCORES.map(cat => (
                      <div key={cat.category} className="flex items-center gap-3">
                        <div className="text-[#6b7280] w-5">{cat.icon}</div>
                        <span className="text-xs text-[#2d3142] w-28 flex-shrink-0">{cat.category}</span>
                        <div className="flex-1 h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${getProgressColor(cat.score)}`} style={{ width: `${cat.score}%` }} />
                        </div>
                        <span className={`text-xs font-semibold w-8 text-right ${getScoreColor(cat.score)}`}>{cat.score}</span>
                        {cat.issues > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#e5e7eb]">{cat.issues}</Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Issues List */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#2d3142]">Issues Found</CardTitle>
                    <div className="flex items-center gap-1.5">
                      {['all', 'critical', 'warning', 'info'].map(f => (
                        <Button key={f} variant={issueFilter === f ? 'default' : 'ghost'} size="sm" className={`text-xs h-7 ${issueFilter === f ? 'bg-[#0052B8] text-white' : ''}`} onClick={() => setIssueFilter(f)}>
                          {f === 'all' ? `All (${SEO_ISSUES.length})` : f === 'critical' ? `Critical (${SEO_ISSUES.filter(i => i.severity === 'critical').length})` : f === 'warning' ? `Warning (${SEO_ISSUES.filter(i => i.severity === 'warning').length})` : `Info (${SEO_ISSUES.filter(i => i.severity === 'info').length})`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredIssues.map(issue => {
                    const cfg = severityConfig[issue.severity];
                    return (
                      <div key={issue.id} className={`p-3 rounded-lg border ${cfg.bg}`}>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex-shrink-0">{cfg.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${cfg.color}`}>{issue.severity.toUpperCase()}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{issue.category}</Badge>
                              <span className="text-[10px] text-[#9ca3af] ml-auto">Impact: {issue.impact}/100</span>
                            </div>
                            <p className="text-xs text-[#2d3142] font-medium">{issue.message}</p>
                            <p className="text-[10px] text-[#6b7280] mt-0.5">Affected: {issue.affectedUrl}</p>
                            <div className="mt-1.5 flex items-start gap-1.5 bg-white/60 rounded px-2 py-1.5">
                              <Zap className="h-3 w-3 text-[#E8501A] mt-0.5 flex-shrink-0" />
                              <p className="text-[10px] text-[#2d3142]">{issue.fixSuggestion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ====== KEYWORDS TAB ====== */}
            <TabsContent value="keywords" className="mt-0 space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Tracked Keywords', value: KEYWORD_DATA.length, icon: <Target className="h-4 w-4 text-[#0052B8]" /> },
                  { label: 'Top 10 Rankings', value: KEYWORD_DATA.filter(k => k.position <= 10).length, icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
                  { label: 'Improved', value: KEYWORD_DATA.filter(k => k.position < k.prevPosition).length, icon: <ArrowUpRight className="h-4 w-4 text-emerald-500" /> },
                  { label: 'Avg Position', value: (KEYWORD_DATA.reduce((s, k) => s + k.position, 0) / KEYWORD_DATA.length).toFixed(1), icon: <BarChart3 className="h-4 w-4 text-[#E8501A]" /> },
                ].map(stat => (
                  <Card key={stat.label}>
                    <CardContent className="p-3 flex items-center gap-3">
                      {stat.icon}
                      <div>
                        <p className="text-lg font-bold text-[#2d3142]">{stat.value}</p>
                        <p className="text-[10px] text-[#6b7280]">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Search + Table */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#2d3142]">Keyword Rankings</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                      <Input className="pl-7 h-8 text-xs" placeholder="Search keywords..." value={keywordSearch} onChange={e => setKeywordSearch(e.target.value)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
                        <th className="text-left py-2 px-2 font-medium">Keyword</th>
                        <th className="text-center py-2 px-2 font-medium">Position</th>
                        <th className="text-center py-2 px-2 font-medium">Change</th>
                        <th className="text-center py-2 px-2 font-medium">Volume</th>
                        <th className="text-center py-2 px-2 font-medium">Difficulty</th>
                        <th className="text-center py-2 px-2 font-medium">CTR</th>
                        <th className="text-left py-2 px-2 font-medium">Page</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeywords.map((kw, idx) => {
                        const change = kw.prevPosition - kw.position;
                        return (
                          <tr key={idx} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                            <td className="py-2 px-2 font-medium text-[#2d3142]">{kw.keyword}</td>
                            <td className="py-2 px-2 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${kw.position <= 3 ? 'bg-emerald-100 text-emerald-700' : kw.position <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {kw.position}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              {change > 0 ? (
                                <span className="text-emerald-600 flex items-center justify-center gap-0.5"><ArrowUpRight className="h-3 w-3" />{change}</span>
                              ) : change < 0 ? (
                                <span className="text-red-600 flex items-center justify-center gap-0.5"><ArrowDownRight className="h-3 w-3" />{Math.abs(change)}</span>
                              ) : (
                                <span className="text-[#9ca3af] flex items-center justify-center"><Minus className="h-3 w-3" /></span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center text-[#2d3142]">{kw.volume.toLocaleString()}</td>
                            <td className="py-2 px-2 text-center">
                              <span className={`text-xs font-medium ${kw.difficulty >= 60 ? 'text-red-600' : kw.difficulty >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>{kw.difficulty}</span>
                            </td>
                            <td className="py-2 px-2 text-center text-[#2d3142]">{kw.ctr}%</td>
                            <td className="py-2 px-2 text-[#0052B8] text-xs">{kw.url}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ====== CONTENT SCORE TAB ====== */}
            <TabsContent value="content-score" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {CONTENT_ANALYSES.map(page => (
                  <Card key={page.url}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#2d3142]">{page.title}</h3>
                          <p className="text-[10px] text-[#6b7280]">{page.url}</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${getScoreBg(page.score)}`}>
                          <span className={`text-sm font-bold ${getScoreColor(page.score)}`}>{page.score}</span>
                          <span className="text-[10px] text-[#6b7280]">/100</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Readability */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#6b7280]">Readability</span>
                            <span className={`text-[10px] font-medium ${getScoreColor(page.readability)}`}>{page.readability}%</span>
                          </div>
                          <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getProgressColor(page.readability)}`} style={{ width: `${page.readability}%` }} />
                          </div>
                        </div>

                        {/* Keyword Density */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#6b7280]">Keyword Density</span>
                            <span className={`text-[10px] font-medium ${page.keywordDensity > 3 ? 'text-red-600' : page.keywordDensity >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>{page.keywordDensity}%</span>
                          </div>
                          <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${page.keywordDensity > 3 ? 'bg-red-500' : page.keywordDensity >= 1 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(page.keywordDensity * 30, 100)}%` }} />
                          </div>
                          {page.keywordDensity > 3 && <p className="text-[9px] text-red-500">⚠ Keyword stuffing risk</p>}
                        </div>

                        {/* Heading Structure */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#6b7280]">Headings</span>
                            <span className={`text-[10px] font-medium ${getScoreColor(page.headingStructure)}`}>{page.headingStructure}%</span>
                          </div>
                          <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getProgressColor(page.headingStructure)}`} style={{ width: `${page.headingStructure}%` }} />
                          </div>
                        </div>

                        {/* Images */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#6b7280]">Images (Alt)</span>
                            <span className={`text-[10px] font-medium ${page.imagesWithoutAlt === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{page.imagesWithAlt}/{page.imagesWithAlt + page.imagesWithoutAlt}</span>
                          </div>
                          <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${page.imagesWithoutAlt === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(page.imagesWithAlt / (page.imagesWithAlt + page.imagesWithoutAlt)) * 100}%` }} />
                          </div>
                          {page.imagesWithoutAlt > 0 && <p className="text-[9px] text-amber-500">{page.imagesWithoutAlt} missing alt</p>}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-[10px] text-[#6b7280]">
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {page.wordCount.toLocaleString()} words</span>
                        <span className="flex items-center gap-1"><Link2 className="h-3 w-3" /> {page.internalLinks} internal / {page.externalLinks} external links</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ====== SCHEMA MARKUP TAB ====== */}
            <TabsContent value="schema" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Template selector */}
                <Card className="md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-[#2d3142]">Schema Templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {SCHEMA_TEMPLATES.map(t => (
                      <button key={t.type} onClick={() => { setSelectedSchema(t.type); setSchemaOutput(t.jsonLd); }} className={`w-full text-left p-2.5 rounded-lg border transition-colors ${selectedSchema === t.type ? 'border-[#0052B8] bg-[#0052B8]/5' : 'border-[#e5e7eb] hover:border-[#0052B8]/30 hover:bg-[#f9fafb]'}`}>
                        <div className="flex items-center gap-2">
                          <Code className={`h-3.5 w-3.5 ${selectedSchema === t.type ? 'text-[#0052B8]' : 'text-[#6b7280]'}`} />
                          <span className={`text-xs font-medium ${selectedSchema === t.type ? 'text-[#0052B8]' : 'text-[#2d3142]'}`}>{t.label}</span>
                        </div>
                        <p className="text-[10px] text-[#6b7280] mt-0.5 ml-5.5">{t.description}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* JSON-LD Output */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-[#2d3142]">JSON-LD Output</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleCopySchema}>
                          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <Download className="h-3.5 w-3.5 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-[#1e1e2e] rounded-lg p-4 overflow-x-auto max-h-96">
                      <pre className="text-xs text-[#cdd6f4] font-mono whitespace-pre-wrap">{schemaOutput}</pre>
                    </div>
                    <div className="mt-3 p-3 bg-[#0052B8]/5 border border-[#0052B8]/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 text-[#0052B8] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-[#0052B8]">Implementation Guide</p>
                          <p className="text-[10px] text-[#2d3142] mt-1">
                            Add this JSON-LD inside a <code className="bg-[#f3f4f6] px-1 rounded text-[9px]">&lt;script type=&quot;application/ld+json&quot;&gt;</code> tag
                            in the <code className="bg-[#f3f4f6] px-1 rounded text-[9px]">&lt;head&gt;</code> of your page. Test with
                            <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-[#0052B8] underline ml-1">Google Rich Results Test</a>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Schema Coverage */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-[#2d3142]">Schema Coverage by Page Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { type: 'Homepage', schemas: ['EducationOrganization', 'BreadcrumbList'], covered: true },
                      { type: 'University Pages', schemas: ['CollegeOrUniversity', 'BreadcrumbList'], covered: true },
                      { type: 'Course Pages', schemas: ['Course', 'BreadcrumbList'], covered: true },
                      { type: 'Scholarship Pages', schemas: ['Scholarship', 'BreadcrumbList'], covered: false },
                      { type: 'Blog Posts', schemas: ['Article', 'BreadcrumbList'], covered: true },
                      { type: 'FAQ Pages', schemas: ['FAQPage'], covered: true },
                      { type: 'Event Pages', schemas: ['Event'], covered: false },
                      { type: 'Country Pages', schemas: ['Place', 'BreadcrumbList'], covered: true },
                      { type: 'Exam Pages', schemas: ['Course', 'BreadcrumbList'], covered: false },
                    ].map(item => (
                      <div key={item.type} className={`p-3 rounded-lg border ${item.covered ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[#2d3142]">{item.type}</span>
                          {item.covered ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.schemas.map(s => (
                            <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ====== SOCIAL MEDIA TAB ====== */}
            <TabsContent value="social" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Post Composer */}
                <Card className="md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-[#2d3142]">Compose Post</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea className="text-xs min-h-[100px]" placeholder="Write your post content... Use # for hashtags" value={newPost} onChange={e => setNewPost(e.target.value)} />

                    {/* Platform Selection */}
                    <div>
                      <p className="text-[10px] text-[#6b7280] mb-1.5">Select Platforms</p>
                      <div className="flex flex-wrap gap-2">
                        {(['facebook', 'twitter', 'linkedin', 'instagram'] as const).map(p => (
                          <button key={p} onClick={() => togglePlatform(p)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${newPostPlatforms.includes(p) ? 'border-[#0052B8] bg-[#0052B8]/5 text-[#0052B8]' : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#0052B8]/30'}`}>
                            {platformIcons[p]}
                            {platformNames[p]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-[#6b7280] mb-1">Date</p>
                        <Input type="date" className="text-xs h-8" value={newPostDate} onChange={e => setNewPostDate(e.target.value)} />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6b7280] mb-1">Time</p>
                        <Input type="time" className="text-xs h-8" value={newPostTime} onChange={e => setNewPostTime(e.target.value)} />
                      </div>
                    </div>

                    <Button className="w-full bg-[#E8501A] hover:bg-[#E8501A]/90 text-white text-xs" onClick={handleSchedulePost} disabled={!newPost || !newPostDate}>
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Schedule Post
                    </Button>
                  </CardContent>
                </Card>

                {/* Calendar View */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-[#2d3142]">Content Calendar</CardTitle>
                      <Badge variant="outline" className="text-xs">{selectedMonth}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-px text-[10px]">
                      {/* Day headers */}
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-center text-[#9ca3af] font-medium py-1">{d}</div>
                      ))}
                      {/* Empty cells for offset (Jan 2025 starts on Wednesday) */}
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-16 rounded bg-[#f9fafb]" />
                      ))}
                      {/* Calendar days */}
                      {CALENDAR_DAYS.map(day => {
                        const dayPosts = getPostsForDay(day);
                        const isToday = day === 18;
                        return (
                          <div key={day} className={`h-16 rounded border border-[#f3f4f6] p-0.5 overflow-hidden ${isToday ? 'border-[#0052B8] bg-[#0052B8]/5' : 'bg-white'}`}>
                            <span className={`text-[9px] ${isToday ? 'text-[#0052B8] font-bold' : 'text-[#9ca3af]'}`}>{day}</span>
                            <div className="mt-0.5 space-y-px">
                              {dayPosts.slice(0, 2).map(p => (
                                <div key={p.id} className={`text-[8px] px-1 py-px rounded truncate ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : p.status === 'scheduled' ? 'bg-[#0052B8]/10 text-[#0052B8]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                                  {p.platforms.map(pl => platformNames[pl]?.charAt(0)).join('+')}
                                </div>
                              ))}
                              {dayPosts.length > 2 && <div className="text-[8px] text-[#9ca3af]">+{dayPosts.length - 2}</div>}
                            </div>
                          </div>
                        );
                      })}
                      {/* Fill remaining cells */}
                      {Array.from({ length: (35 - 2 - 31) }).map((_, i) => (
                        <div key={`fill-${i}`} className="h-16 rounded bg-[#f9fafb]" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Scheduled Posts List */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#2d3142]">Scheduled Posts</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200" style={{ borderRadius: '4px' }}>
                        {posts.filter(p => p.status === 'published').length} Published
                      </Badge>
                      <Badge variant="outline" className="bg-[#0052B8]/5 text-[#0052B8] border-[#0052B8]/20" style={{ borderRadius: '4px' }}>
                        {posts.filter(p => p.status === 'scheduled').length} Scheduled
                      </Badge>
                      <Badge variant="outline" className="border-[#e5e7eb]" style={{ borderRadius: '4px' }}>
                        {posts.filter(p => p.status === 'draft').length} Drafts
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                  {posts.map(post => (
                    <div key={post.id} className="p-3 rounded-lg border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#2d3142] line-clamp-2">{post.content}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {post.platforms.map(p => (
                                <span key={p}>{platformIcons[p]}</span>
                              ))}
                            </div>
                            <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.scheduledDate} at {post.scheduledTime}
                            </span>
                            {post.hashtags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {post.hashtags.slice(0, 2).map(h => (
                                  <span key={h} className="text-[9px] text-[#0052B8]">#{h}</span>
                                ))}
                                {post.hashtags.length > 2 && <span className="text-[9px] text-[#9ca3af]">+{post.hashtags.length - 2}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={`text-[10px] flex-shrink-0 ${post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : post.status === 'scheduled' ? 'bg-[#0052B8]/10 text-[#0052B8]' : 'bg-[#f3f4f6] text-[#6b7280]'}`} style={{ borderRadius: '4px' }}>
                          {post.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </div>
      </Tabs>
    </div>
  );
}
